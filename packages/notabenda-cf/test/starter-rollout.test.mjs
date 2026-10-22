// @requirements REQ-PRODUCT-CF-ROLLOUT
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-REMOTE-RECOVERY
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {rolloutCapability,authorizeRolloutRequest,createRolloutControl,createRolloutHost,createRolloutCanary,rolloutReply} from '../../../scripts/fixtures/starter-rollout.mjs';
import {checkRunIdentity,reconcileOwnership,cleanup,updateRecoveryFixtureSecret} from '../../../scripts/check-cf-remote-recovery.mjs';
import {latestRolloutDeployment,isLifecycleRollbackRejection,waitForRolloutVersion} from '../../../scripts/check-cf-starter-rollout.mjs';
const key='a'.repeat(64),data={runId:randomUUID(),siteId:'starter-rollout',variant:'baseline',now:'2026-10-21T12:00:00.000Z',releases:[{id:'first'},{id:'later'}]};
test('fixture role capabilities are distinct and never accept the maintenance key as an operator',async()=>{
 const reader=await rolloutCapability(key,'reader'),editor=await rolloutCapability(key,'editor');assert.notEqual(reader,editor);
 const request=value=>new Request('https://fixture.example.test/studio',{headers:{Authorization:'Bearer '+value}}),env={FIXTURE_KEY:key};
 assert.deepEqual(await authorizeRolloutRequest(request(reader),env),{inspect:true});assert.equal((await authorizeRolloutRequest(request(editor),env)).configure,true);
 for(const value of [key,'b'.repeat(64),'',reader+'z'])assert.equal(await authorizeRolloutRequest(request(value),env),null);
 assert.equal(await authorizeRolloutRequest(request(reader),{FIXTURE_KEY:'invalid'}),null);await assert.rejects(()=>rolloutCapability(key,'owner'),/invalid-fixture/);
});
test('archive operations are fixed, closed-only, checkpointed, and idempotent after restart',async()=>{
 const storage=createSyntheticStorage([]),calls=[],workspace={async recordRelease(release,metadata){calls.push({release,metadata});return {created:true,id:release.id};}},control=createRolloutControl(storage,data,workspace);
 assert.equal((await control.run('state')).phase,'closed');await control.run('open');await assert.rejects(()=>control.run('archive-first'),/closed-gate/);await control.run('close');
 assert.deepEqual(await control.run('archive-first'),{created:true,id:'first'});const restarted=createRolloutControl(storage,data,workspace);assert.deepEqual(await restarted.run('archive-first'),{created:true,id:'first'});assert.equal(calls.length,1);assert.equal(calls[0].metadata.recordedAt,data.now);
 await assert.rejects(()=>restarted.run('arbitrary-rpc'),/unknown-control/);await restarted.run('archive-later');assert.equal(calls[1].release.id,'later');await restarted.run('open');assert.equal((await restarted.run('state')).phase,'open');
});
test('a rejected archive RPC retains an unresolved marker across restart and blocks reopening or replay',async()=>{
 const storage=createSyntheticStorage([]);let writes=0;const workspace={async recordRelease(){writes++;throw Error('RPC failed after a possible commit');}},control=createRolloutControl(storage,data,workspace);
 await assert.rejects(()=>control.run('archive-first'),/possible commit/);const restarted=createRolloutControl(storage,data,workspace);assert.equal((await restarted.run('state')).operations['archive-first'].state,'unresolved');
 await assert.rejects(()=>restarted.run('open'),/not-ready/);await assert.rejects(()=>restarted.run('archive-first'),/outcome-unresolved/);assert.equal(writes,1);
});
test('denied ordinary requests retain the actual host denial without selecting control',async()=>{
 let selected=0,delegated=0;const host=createRolloutHost(async()=>{delegated++;return new Response('Denied',{status:403});},async()=>null,data),env={CONTROL:{getByName(){selected++;throw Error();}}};
 assert.equal((await host.fetch(new Request('https://fixture.example.test/assets/setup.mjs'),env)).status,403);assert.equal(selected,0);assert.equal(delegated,1);
});
test('authorized ordinary requests are fenced closed and delegate to the generated host only when open',async()=>{
 let phase='closed',delegated=0;const names=[],host=createRolloutHost(async()=>{delegated++;return new Response('Actual host');},async()=>({inspect:true}),data),env={CONTROL:{getByName(name){names.push(name);return {command:async()=>({ok:true,value:{phase}})};}}};
 const request=()=>new Request('https://fixture.example.test/studio/history');assert.equal((await host.fetch(request(),env)).status,503);assert.equal(delegated,0);phase='open';assert.equal(await (await host.fetch(request(),env)).text(),'Actual host');assert.equal(delegated,1);assert.deepEqual(names,['rollout:'+data.runId,'rollout:'+data.runId]);
});
test('maintenance authentication and bounded fixed actions precede object selection',async()=>{
 const names=[],host=createRolloutHost(()=>{throw Error('Unexpected delegation');},async()=>null,data),env={FIXTURE_KEY:key,CONTROL:{getByName(name){names.push(name);return {command:async()=>({ok:true,value:{phase:'closed'}})};}}};
 const request=(body,auth='Bearer '+key)=>new Request('https://fixture.example.test/rehearse',{method:'POST',headers:{Authorization:auth},body});
 for(const auth of ['', 'Bearer wrong'])assert.equal((await host.fetch(request('{broken',auth),env)).status,403);
 for(const body of ['{broken','x'.repeat(1025),JSON.stringify({action:'state',target:'production'}),JSON.stringify({action:'inspect'}),'null','[]'])assert.equal((await host.fetch(request(body),env)).status,400);assert.deepEqual(names,[]);
 const response=await host.fetch(request('{"action":"state"}'),env);assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,value:{phase:'closed',build:'baseline',runId:data.runId}});assert.deepEqual(names,['rollout:'+data.runId]);
});
test('canary uses its fixed object only while closed and preserves a single stable sentinel',async()=>{
 const storage=createSyntheticStorage([]),canary=createRolloutCanary(storage,data);assert.equal(await canary.read(),null);const sentinel=await canary.touch();assert.deepEqual(sentinel,await createRolloutCanary(storage,data).read());await storage.delete('__fixture/rollout-canary');assert.equal(await canary.read(),null);assert.equal(await storage.get('__fixture/rollout-canary'),undefined);await storage.put('__fixture/rollout-canary',{runId:'outside'});await assert.rejects(()=>canary.touch(),/canary-conflict/);
 let phase='open',lookups=0;const host=createRolloutHost(()=>{throw Error();},async()=>null,data),env={FIXTURE_KEY:key,CONTROL:{getByName:()=>({command:async()=>({ok:true,value:{phase}})})},CANARY:{getByName(name){lookups++;assert.equal(name,'canary:'+data.runId);return {touch:async()=>({runId:data.runId})};}}};
 const request=()=>new Request('https://fixture.example.test/rehearse',{method:'POST',headers:{Authorization:'Bearer '+key},body:'{"action":"canary"}'});assert.equal((await host.fetch(request(),env)).status,503);assert.equal(lookups,0);phase='closed';assert.deepEqual(await (await host.fetch(request(),env)).json(),{ok:true,value:{runId:data.runId}});assert.equal(lookups,1);
});
test('rollout ownership allows only its exact UUID name and fixed class family; pending uploaded source only during deployment',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-rollout-ownership-'));try{
  const code='export const run='+JSON.stringify(data.runId)+';',next=code+'// candidate',digest=value=>createHash('sha256').update(value).digest('hex'),run={schemaVersion:1,kind:'notabenda-starter-rollout-run',accountId:'a'.repeat(32),runId:data.runId,workerName:'notabenda-rollout-'+data.runId.replaceAll('-','').slice(0,16),preflightAbsent:true,stage:'deploying',expectedSourceSha256:digest(code),pendingSourceSha256:digest(next)};
  assert.equal(checkRunIdentity(run),run);assert.throws(()=>checkRunIdentity({...run,workerName:'notabenda-site'}));assert.throws(()=>checkRunIdentity({...run,kind:'anything'}));
  let rows=[{id:'one',script:run.workerName,class:'EvidenceWorkspace',use_sqlite:true}],current=next;const api=async path=>path==='/workers/scripts'?{result:[{id:run.workerName,tag:'owned',modified_on:'one'}]}:{result:rows,result_info:{total_pages:1}};api.source=async()=>({sha256:digest(current),text:current});
  assert.equal((await reconcileOwnership(directory,run,api)).sourceSha256,digest(next));for(const stage of ['deployed','rollback-started']){run.stage=stage;await assert.rejects(()=>reconcileOwnership(directory,run,api),/source no longer/);}run.expectedSourceSha256=digest(next);await reconcileOwnership(directory,run,api);
  rows=[...rows,{id:'two',script:run.workerName,class:'RecoveryEvidence',use_sqlite:true}];await assert.rejects(()=>reconcileOwnership(directory,run,api),/identity changed/);rows=[rows[0]];current='outside';await assert.rejects(()=>reconcileOwnership(directory,run,api),/source no longer/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('fixture replies suppress arbitrary exception content and normalize stored RPC records',async()=>{
 assert.deepEqual(await rolloutReply(()=>{throw Error('Sensitive exception with details');}),{ok:false,error:'fixture-operation-failed'});const record=Object.assign(Object.create(null),{created:true});assert.deepEqual(await rolloutReply(()=>record),{ok:true,value:{created:true}});
});
test('deployment proof requires a provider version at 100 percent and chooses the latest timestamp',()=>{
 const row=(id,date,percentage=100)=>({id,created_on:date,versions:[{version_id:'a'.repeat(8)+'-aaaa-4aaa-aaaa-'+'a'.repeat(12),percentage}]});
 const older=row('older','2026-10-21T01:00:00Z'),newer=row('newer','2026-10-21T01:01:00Z');assert.equal(latestRolloutDeployment({result:{deployments:[older,newer]}}).id,'newer');
 for(const value of [{result:[]},{result:{deployments:[]}},{result:{deployments:[row('partial','2026-10-21T01:01:00Z',50)]}},{result:{deployments:[{...newer,versions:[]}]}}])assert.throws(()=>latestRolloutDeployment(value));
});
test('generic CLI errors and successful output cannot count as a lifecycle rollback rejection',()=>{
 const message="Durable Object exports reconciliation failed:\n  - [orphaned_provisioned_namespace] class 'RolloutCanary': class 'RolloutCanary' has a provisioned Durable Object namespace ("+'a'.repeat(32)+") but is neither in code nor in `exports`. This is an orphan; declare a deleted tombstone. [code: 100402]";assert.equal(isLifecycleRollbackRejection({status:1,stderr:message}),true);
 for(const result of [{status:0,stderr:message},{status:null,stderr:message},{status:1,stderr:message.replaceAll('RolloutCanary','OutsideClass')},{status:1,stderr:message.replace('100402','100000')},{status:1,stderr:'Cannot rollback across Durable Object class migrations.'},{status:1,stderr:'Network unavailable'},{status:1,stderr:'Cannot rollback: secret changed'},{status:1,stderr:'Durable Object class loaded; unrelated operation failed'},{status:1,stdout:'Configured Durable Object class: RolloutCanary',stderr:'Unable to rollback: network unavailable'}])assert.equal(isLifecycleRollbackRejection(result),false);
});
test('cleanup retains the attested committed pending source across a failed tombstone deployment and retry',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-rollout-cleanup-'));try{
  const hash=value=>createHash('sha256').update(value).digest('hex'),code='export const run='+JSON.stringify(data.runId)+';',next=code+'// next',tombstone='export default {};';
  const run={schemaVersion:1,kind:'notabenda-starter-rollout-run',accountId:'a'.repeat(32),runId:data.runId,workerName:'notabenda-rollout-'+data.runId.replaceAll('-','').slice(0,16),preflightAbsent:true,stage:'deploying',expectedSourceSha256:hash(code),pendingSourceSha256:hash(next)};
  let current=next,live=true,rows=[{id:'one',script:run.workerName,class:'EvidenceWorkspace',use_sqlite:true}];
  const api=async(path,options)=>{if(options?.method==='DELETE'){live=false;return {success:true};}if(path.endsWith('/settings')&&!live)return null;return path==='/workers/scripts'?{result:live?[{id:run.workerName,tag:'owned',modified_on:'one'}]:[]}:{result:rows,result_info:{total_pages:1}};};api.source=async()=>({sha256:hash(current),text:current});
  const options={hashBundle:async()=>hash(tombstone),execute:async(directory,label)=>{if(label==='cleanup-namespaces')throw Error('Transport failed before upload');}};
  await assert.rejects(()=>cleanup(directory,run,api,options),/Transport failed/);assert.equal(run.stage,'cleanup-started');assert.equal(run.expectedSourceSha256,hash(next));assert.equal(run.pendingSourceSha256,undefined);assert.equal((await reconcileOwnership(directory,run,api)).cleanupSource,false);
  await cleanup(directory,run,api,{...options,execute:async(directory,label)=>{if(label==='cleanup-namespaces'){current=tombstone;rows=[];}}});assert.equal(run.cleanup.verified,true);assert.equal(live,false);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('rollback convergence separates uploaded code from the active version fingerprint and refuses unrelated changes',async()=>{
 const previous={id:'prior',versions:[{version_id:'candidate'}]},next={id:'rollback',versions:[{version_id:'baseline'}]},target={versionId:'baseline',sha256:'baseline-sha',etag:'baseline-etag'},states=[{deployment:previous,sha256:'candidate-sha',versionEtag:'candidate-etag'},{deployment:next,sha256:'candidate-sha',versionEtag:'baseline-etag'}];let reads=0;
 const options={previous,previousEtag:'candidate-etag',uploadedSha256:'candidate-sha',pause:async()=>{}};
 assert.deepEqual(await waitForRolloutVersion(async()=>{reads++;return states.shift();},target,options),next);assert.equal(reads,2);
 for(const observed of [{deployment:next,sha256:'outside-sha',versionEtag:'baseline-etag'},{deployment:{id:'outside',versions:[{version_id:'outside'}]},sha256:'candidate-sha',versionEtag:'outside-etag'},{deployment:next,sha256:'candidate-sha',versionEtag:'wrong-etag'}])await assert.rejects(()=>waitForRolloutVersion(async()=>observed,target,options),/Unexpected/);
 await assert.rejects(()=>waitForRolloutVersion(async()=>({deployment:previous,sha256:'candidate-sha',versionEtag:'candidate-etag'}),target,{...options,attempts:2}),/did not converge/);
});
test('settled ownership rejects an outside deployment even when uploaded executable bytes remain unchanged',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-rollout-deployment-'));try{
  const code='export const run='+JSON.stringify(data.runId)+';',run={schemaVersion:1,kind:'notabenda-starter-rollout-run',accountId:'a'.repeat(32),runId:data.runId,workerName:'notabenda-rollout-'+data.runId.replaceAll('-','').slice(0,16),preflightAbsent:true,stage:'deployed',expectedSourceSha256:createHash('sha256').update(code).digest('hex'),deploymentId:'ours',activeVersion:{versionId:'our-version'}};let active={id:'ours',created_on:'2026-10-21T12:00:00Z',versions:[{version_id:'our-version',percentage:100}]};
  const api=async path=>path.endsWith('/deployments')?{result:{deployments:[active]}}:path.includes('/versions/')?{result:{id:active.versions[0].version_id,resources:{script:{etag:'pinned-etag'}}}}:path==='/workers/scripts'?{result:[{id:run.workerName,tag:'ours',modified_on:'one'}]}:{result:[],result_info:{total_pages:1}};api.source=async()=>({sha256:run.expectedSourceSha256,text:code});await reconcileOwnership(directory,run,api);
  for(const changed of [{...active,id:'outside'},{...active,versions:[{version_id:'outside-version',percentage:100}]},{...active,versions:[{version_id:'our-version',percentage:50}]}]){active=changed;await assert.rejects(()=>reconcileOwnership(directory,run,api),/deployment changed/);}
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('failed post-secret version pinning keeps the uncertain mutation stage for safe reconciliation',async()=>{
 const run={stage:'deployed'},options={attest:async()=>({live:true,cleanupSource:false}),persist:async()=>{},execute:async()=>{},settle:async()=>{throw Error('Version metadata unavailable');}};
 await assert.rejects(()=>updateRecoveryFixtureSecret('/private/fixture',run,{},key,options),/Version metadata unavailable/);assert.equal(run.stage,'secret-updating');
});
test('pending rollback and cleanup reject unrelated active versions despite unchanged uploaded code',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-rollout-pending-'));try{
  const code='export const run='+JSON.stringify(data.runId)+';',run={schemaVersion:1,kind:'notabenda-starter-rollout-run',accountId:'a'.repeat(32),runId:data.runId,workerName:'notabenda-rollout-'+data.runId.replaceAll('-','').slice(0,16),preflightAbsent:true,stage:'rollback-started',expectedSourceSha256:createHash('sha256').update(code).digest('hex'),deploymentId:'candidate-deploy',activeVersion:{versionId:'candidate',etag:'candidate-etag'},rollbackTarget:{versionId:'baseline',etag:'baseline-etag'}};
  let current={id:'rolled-back',created_on:'2026-10-21T12:00:00Z',versions:[{version_id:'baseline',percentage:100}]},etag='baseline-etag';
  const api=async path=>path.endsWith('/deployments')?{result:{deployments:[current]}}:path.includes('/versions/')?{result:{id:current.versions[0].version_id,resources:{script:{etag}}}}:path==='/workers/scripts'?{result:[{id:run.workerName,tag:'ours',modified_on:'one'}]}:{result:[],result_info:{total_pages:1}};api.source=async()=>({sha256:run.expectedSourceSha256,text:code});
  const observed=await reconcileOwnership(directory,run,api);assert.deepEqual(observed.activeVersion,{versionId:'baseline',etag:'baseline-etag'});assert.equal(observed.deploymentId,'rolled-back');
  current={...current,versions:[{version_id:'outside',percentage:100}]};await assert.rejects(()=>reconcileOwnership(directory,run,api),/deployment changed/);
  current={...current,versions:[{version_id:'baseline',percentage:100}]};etag='outside-etag';await assert.rejects(()=>reconcileOwnership(directory,run,api),/fingerprint changed/);etag='baseline-etag';run.stage='cleanup-started';run.cleanupPriorVersion={versionId:'baseline',etag};run.cleanupPriorDeploymentId='rolled-back';await reconcileOwnership(directory,run,api);
  current={...current,id:'outside-redeploy'};await assert.rejects(()=>reconcileOwnership(directory,run,api),/deployment changed/);current={...current,id:'outside',versions:[{version_id:'outside',percentage:100}]};await assert.rejects(()=>reconcileOwnership(directory,run,api),/deployment changed/);
  current={id:'rolled-back',created_on:'2026-10-21T12:00:00Z',versions:[{version_id:'baseline',percentage:100}]};run.stage='rollback-started';
  await assert.rejects(()=>cleanup(directory,run,api,{hashBundle:async()=> 'c'.repeat(64),execute:async(directory,label)=>{if(label==='cleanup-namespaces')throw Error('Tombstone upload interrupted');}}),/Tombstone upload interrupted/);
  assert.deepEqual(run.cleanupPriorVersion,{versionId:'baseline',etag:'baseline-etag'});assert.equal(run.cleanupPriorDeploymentId,'rolled-back');assert.equal((await reconcileOwnership(directory,run,api)).cleanupSource,false);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('ambiguous deploy and secret stages retain only their known code/version outcome for resumable cleanup',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-rollout-mutation-'));try{
  const code='export const run='+JSON.stringify(data.runId)+';',next=code+'// next',sha=value=>createHash('sha256').update(value).digest('hex');
  const run={schemaVersion:1,kind:'notabenda-starter-rollout-run',accountId:'a'.repeat(32),runId:data.runId,workerName:'notabenda-rollout-'+data.runId.replaceAll('-','').slice(0,16),preflightAbsent:true,stage:'deploying',expectedSourceSha256:sha(code),pendingSourceSha256:sha(next),deploymentId:'old-deploy',activeVersion:{versionId:'old',etag:'old-etag'},pendingActiveVersion:{versionId:'candidate'}};
  let current={id:'candidate-deploy',created_on:'2026-10-21T12:00:00Z',versions:[{version_id:'candidate',percentage:100}]},etag='candidate-etag';
  const api=async path=>path.endsWith('/deployments')?{result:{deployments:[current]}}:path.includes('/versions/')?{result:{id:current.versions[0].version_id,resources:{script:{etag}}}}:path==='/workers/scripts'?{result:[{id:run.workerName,tag:'ours',modified_on:'one'}]}:{result:[],result_info:{total_pages:1}};api.source=async()=>({sha256:sha(next),text:next});
  assert.deepEqual((await reconcileOwnership(directory,run,api)).activeVersion,{versionId:'candidate',etag:'candidate-etag'});
  await assert.rejects(()=>cleanup(directory,run,api,{hashBundle:async()=> 'c'.repeat(64),execute:async(directory,label)=>{if(label==='cleanup-namespaces')throw Error('Upload interrupted');}}),/Upload interrupted/);assert.deepEqual(run.cleanupPriorVersion,{versionId:'candidate',etag:'candidate-etag'});await reconcileOwnership(directory,run,api);
  run.stage='secret-updating';run.activeVersion={versionId:'candidate',etag:'candidate-etag'};run.deploymentId='candidate-deploy';current={...current,id:'secret-deploy',versions:[{version_id:'secret',percentage:100}]};assert.deepEqual((await reconcileOwnership(directory,run,api)).activeVersion,{versionId:'secret',etag:'candidate-etag'});etag='outside-code';await assert.rejects(()=>reconcileOwnership(directory,run,api),/deployment changed/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
