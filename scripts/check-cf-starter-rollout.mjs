// @requirements REQ-PRODUCT-CF-ROLLOUT
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-REMOTE-RECOVERY
// Explicit, disposable maintainer exercise. Never scaffolded, installed, or run by adopters' CI.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,symlink,rm,realpath,stat} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {compileLegalDocuments} from '@notabenda/core/content';
import {compileAuthoredDocuments} from '@notabenda/authoring';
import {fixture} from '../packages/notabenda/test/helpers.mjs';
import {inspectProject} from '../packages/notabenda-cf/bin/doctor.mjs';
import {rolloutCapability} from './fixtures/starter-rollout.mjs';
import {parseRemoteRecoveryArgs,checkRunIdentity,reconcileOwnership,cleanup,updateRecoveryFixtureSecret,createDisposableClient,savePrivateRun as save,runDisposableWrangler as wrangler,hashDisposableBundle as bundleHash,listDisposableNamespaces} from './check-cf-remote-recovery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),digest=value=>createHash('sha256').update(value).digest('hex'),pause=ms=>new Promise(done=>setTimeout(done,ms));
const assetNames=['setup.mjs','setup-preview.mjs','setup-consent-rehearsal.mjs','notabenda.css','cartridges.css'];
const pinnedFiles=['src/host.mjs','src/workspace.mjs','src/settings.mjs','src/setup.mjs','scripts/build-assets.mjs'];
function localCommand(directory,label,args){const result=spawnSync(process.execPath,args,{cwd:directory,encoding:'utf8',env:{...process.env,WRANGLER_SEND_METRICS:'false'},timeout:120000,maxBuffer:4*1024*1024});return save(directory,label+'.private.log',(result.stdout??'')+(result.stderr??'')).then(()=>{assert.equal(result.status,0,label+' failed; inspect private log.');});}
export function latestRolloutDeployment(value){
 const rows=value?.result?.deployments;if(!Array.isArray(rows)||!rows.length)throw Error('Missing deployment history.');
 const sorted=[...rows].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on)),latest=sorted[0];
 if(!latest?.id||!Number.isFinite(Date.parse(latest.created_on))||latest.versions?.length!==1||latest.versions[0].percentage!==100||!/^[a-f0-9-]{36}$/u.test(latest.versions[0].version_id))throw Error('Expected one current version at 100 percent.');return latest;
}
export function isLifecycleRollbackRejection(result){
 const text=(result.stdout??'')+'\n'+(result.stderr??'');
 // Fixed provider diagnostic observed for this exact canary class; unrelated CLI warnings
 // or a generic failed rollback must never count as lifecycle-boundary evidence.
 const clean=text.replace(/\x1b\[[0-9;]*m/gu,'');
 return Number.isInteger(result.status)&&result.status!==0&&/^\s*Durable Object exports reconciliation failed:\s*$/mu.test(clean)&&/^\s*- \[orphaned_provisioned_namespace\] class 'RolloutCanary': class 'RolloutCanary' has a provisioned Durable Object namespace \([a-f0-9]{32}\) but is neither in code nor in `exports`\.[^\r\n]*\[code: 100402\]\s*$/mu.test(clean);
}
export async function waitForRolloutVersion(read,target,{previous,previousEtag,uploadedSha256,pause:delay=pause,attempts=120}={}){
 for(let attempt=0;attempt<attempts;attempt++){
  const observed=await read();if(observed.sha256!==uploadedSha256)throw Error('Unexpected uploaded source during rollback.');
  const version=observed.deployment.versions[0].version_id;if(![target.versionId,previous.versions[0].version_id].includes(version))throw Error('Unexpected version during rollback propagation.');
  if(observed.versionEtag!==(version===target.versionId?target.etag:previousEtag))throw Error('Unexpected version fingerprint during rollback.');
  if(version===target.versionId&&observed.deployment.id!==previous.id)return observed.deployment;
  await delay(1000);
 }
 throw Error('Pinned rollback version and fingerprint did not converge; inspect the same private run.');
}
async function prepare(accountId){
 const runId=randomUUID(),workerName='notabenda-rollout-'+runId.replaceAll('-','').slice(0,16),directory=join(root,'.local','cf-starter-rollout-'+runId);
 // Use the real exclusive initializer before adding any private maintainer files.
 const result=spawnSync(process.execPath,[join(root,'packages/notabenda-cf/bin/notabenda-cf.mjs'),'init','--out-dir',directory,'--name',workerName,'--site-id','starter-rollout','--base-path','/studio'],{cwd:root,encoding:'utf8'});assert.equal(result.status,0,'Generated starter initialization failed.');
 await mkdir(join(directory,'logs'),{mode:0o700});
 const run={schemaVersion:1,kind:'notabenda-starter-rollout-run',runId,workerName,accountId,createdAt:new Date().toISOString(),stage:'prepared',cleanup:{verified:false}};
 await save(directory,'run.private.json',run);const key=randomBytes(32).toString('hex');await save(directory,'fixture-key.private.txt',key+'\n');
 await symlink(join(root,'node_modules'),join(directory,'node_modules'),'dir');
 const original=await readFile(join(directory,'src/worker.mjs'),'utf8');await save(directory,'generated-worker.private.mjs',original);
 run.generatedFiles=Object.fromEntries(await Promise.all(pinnedFiles.map(async name=>[name,digest(await readFile(join(directory,name)))])));run.generatedWorkerSha256=digest(original);
 // A legal comment pins the fresh default-denying bundle without changing its executable behavior.
 await save(directory,'src/worker.mjs',original+'\n/*! Disposable rollout '+runId+' */\n');
 const config=JSON.parse(await readFile(join(directory,'wrangler.json'),'utf8'));Object.assign(config,{account_id:accountId,workers_dev:true,preview_urls:false});await save(directory,'wrangler.json',config);
 await localCommand(directory,'build-assets',[join(directory,'scripts/build-assets.mjs')]);
 const legal=await fixture({reviewed:true});legal.site.id='starter-rollout';
 const authored=await compileAuthoredDocuments(legal,{terms:{format:'mdx',source:'---\nkind: terms\ntitle: Rollout rehearsal terms\nroute: /terms\nversion: rollout-2\neffectiveDate: 2026-10-21\nreview:\n  status: reviewed\n---\n## Retained terms\n\nPrivate MDX archive added after the rollback target.\n'}});
 const data={runId,siteId:legal.site.id,now:new Date().toISOString(),releases:[compileLegalDocuments(legal).artifact,authored.archive],authoredId:authored.manifest.artifactId};
 await save(directory,'fixture-data.private.json',data);await save(directory,'run.private.json',run);return {directory,run,key,data,config};
}
async function assertPins(directory,run){for(const [name,expected]of Object.entries(run.generatedFiles))assert.equal(digest(await readFile(join(directory,name))),expected,'Generated file changed: '+name);if(run.wrapperInstalled)assert.equal(digest(await readFile(join(directory,'src/generated-worker.mjs'))),run.generatedWorkerSha256);}
async function deployment(api,run){return latestRolloutDeployment(await api('/workers/scripts/'+run.workerName+'/deployments'));}
async function versionIdentity(api,run,versionId){const value=(await api('/workers/scripts/'+run.workerName+'/versions/'+versionId)).result;assert.equal(value.id,versionId);assert.equal(typeof value.resources?.script?.etag,'string');assert.ok(value.resources.script.etag.length>0&&value.resources.script.etag.length<=256);return {versionId,etag:value.resources.script.etag};}
async function pinActiveVersion(api,run){const active=await deployment(api,run);run.activeVersion=await versionIdentity(api,run,active.versions[0].version_id);run.deploymentId=active.id;return active;}
async function attest(directory,run,api){const observed=await reconcileOwnership(directory,run,api);assert.equal(observed.live,true);assert.equal(observed.cleanupSource,false);if(run.activeVersion)assert.deepEqual(await versionIdentity(api,run,run.activeVersion.versionId),run.activeVersion);await assertPins(directory,run);return observed;}
async function attestBindings(api,run,classes){
 const result=(await api('/workers/scripts/'+run.workerName+'/settings')).result,bindings=result.bindings;
 assert.ok(Array.isArray(bindings));const expected={EVIDENCE:'EvidenceWorkspace',...(classes.includes('RolloutControl')?{CONTROL:'RolloutControl'}:{}),...(classes.includes('RolloutCanary')?{CANARY:'RolloutCanary'}:{})};
 assert.deepEqual(bindings.filter(b=>b.type==='durable_object_namespace').map(b=>b.name).sort(),Object.keys(expected).sort());
 for(const [name,className]of Object.entries(expected)){const binding=bindings.find(b=>b.name===name);assert.equal(binding.class_name,className);assert.equal(binding.namespace_id,run.namespaces.find(n=>n.class===className)?.id);assert.ok(!binding.script_name||binding.script_name===run.workerName);}
 assert.equal(bindings.find(b=>b.name==='ASSETS')?.type,'assets');assert.equal(result.compatibility_date,'2026-10-18');
 assert.deepEqual((await listDisposableNamespaces(api)).filter(n=>n.script===run.workerName).map(n=>n.class).sort(),[...classes].sort());
}
async function deploy(directory,run,api,label,{fresh=false}={}){
 if(!fresh)await attest(directory,run,api);await assertPins(directory,run);
 await wrangler(directory,label+'-dry-run',['deploy','--dry-run','--config','wrangler.json','--outdir','bundle-'+label]);const next=await bundleHash(directory,'bundle-'+label);
 run.pendingSourceSha256=next;run.stage='deploying';await save(directory,'run.private.json',run);
 try{await wrangler(directory,label,['deploy','--config','wrangler.json','--outdir','bundle-'+label]);}finally{
  const log=await readFile(join(directory,label+'.private.log'),'utf8').catch(()=>''),versionId=/Current Version ID:\s*([a-f0-9-]{36})/u.exec(log)?.[1];if(versionId){run.pendingActiveVersion={versionId};await save(directory,'run.private.json',run);}await reconcileOwnership(directory,run,api);
 }
 assert.equal((await api.source(run.workerName)).sha256,next);const active=await pinActiveVersion(api,run);assert.equal(active.versions[0].version_id,run.pendingActiveVersion?.versionId);run.expectedSourceSha256=next;delete run.pendingSourceSha256;delete run.pendingActiveVersion;run.stage='deployed';await save(directory,'run.private.json',run);await attest(directory,run,api);
 await save(directory,label+'-deployment.private.json',active);return active;
}
function request(run,path,capability,options={}){return fetch(run.url+path,{...options,headers:{...(capability?{Authorization:'Bearer '+capability}:{}),...options.headers},redirect:'manual',signal:AbortSignal.timeout(30000)});}
async function control(directory,run,key,action){
 await save(directory,'last-call.private.json',{action});const response=await request(run,'/rehearse',key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});
 const body=await response.text();let result;try{result=JSON.parse(body);}catch{await save(directory,'last-response.private.json',{status:response.status,body:body.slice(0,16000)});throw Error('Non-JSON rollout control response.');}assert.equal(response.status,200,action+' status');assert.equal(result.ok,true,action+' succeeded');return result.value;
}
async function ready(directory,run,key,variant){
 let consecutive=0;for(let attempt=0;attempt<120;attempt++){try{const state=await control(directory,run,key,'state');if(state.build===variant&&state.runId===run.runId&&state.phase==='closed'){if(++consecutive===5)return;}else consecutive=0;}catch{consecutive=0;}await pause(1000);}throw Error('Read-only rollout readiness did not stabilize.');
}
async function mutate(directory,run,api,key,action){await attest(directory,run,api);const result=await control(directory,run,key,action);await attest(directory,run,api);return result;}
async function variants(directory,run,data,config,variant,{missing=false,canary=false}={}){
 if(!run.wrapperInstalled){
  await save(directory,'src/generated-worker.mjs',await readFile(join(directory,'generated-worker.private.mjs'),'utf8'));
  for(const name of ['starter-rollout.mjs','starter-rollout-canary.mjs'])await save(directory,'src/'+name,await readFile(join(root,'scripts/fixtures',name),'utf8'));
  await save(directory,'src/authorize.mjs',"export {authorizeRolloutRequest as authorizeHostRequest} from './starter-rollout.mjs';\n");run.wrapperInstalled=true;
 }
 const entry=await readFile(join(root,'scripts/fixtures/starter-rollout-entry.mjs'),'utf8');
 await save(directory,'src/worker.mjs',entry+(canary?"\nexport {RolloutCanary} from './starter-rollout-canary.mjs';\n":''));
 await save(directory,'src/fixture-data.mjs','export const data='+JSON.stringify({...data,variant})+';\n');
 config.durable_objects.bindings=[{name:'EVIDENCE',class_name:'EvidenceWorkspace'},{name:'CONTROL',class_name:'RolloutControl'},...(canary?[{name:'CANARY',class_name:'RolloutCanary'}]:[])];
 config.exports={EvidenceWorkspace:{type:'durable-object',storage:'sqlite'},RolloutControl:{type:'durable-object',storage:'sqlite'},...(canary?{RolloutCanary:{type:'durable-object',storage:'sqlite'}}:{})};await save(directory,'wrangler.json',config);
 if(missing)await rm(join(directory,'public/assets/setup-preview.mjs'),{force:true});else if(run.previewBytes)await writeFile(join(directory,'public/assets/setup-preview.mjs'),Buffer.from(run.previewBytes,'base64'),{mode:0o600});
 await assertPins(directory,run);await save(directory,'run.private.json',run);
}
function retainedSource(html){const dom=new JSDOM(html);try{const nodes=dom.window.document.querySelectorAll('pre code');assert.equal(nodes.length,1);return nodes[0].textContent;}finally{dom.window.close();}}
async function inspect(run,caps,data,{missing=false,records}={}){
 for(const capability of [undefined,'b'.repeat(64),caps.maintenance])for(const path of ['/studio/history','/studio/setup','/assets/setup.mjs'])assert.equal((await request(run,path,capability)).status,403);
 for(const path of ['/studio/history','/studio/agreements','/studio/choices','/studio/processing']){const response=await request(run,path,caps.reader);assert.equal(response.status,200,path);assert.match(response.headers.get('Cache-Control'),/private, no-store/);}
 for(const path of ['/studio/setup','/assets/setup.mjs','/studio/history/export.json'])assert.equal((await request(run,path,caps.reader)).status,403);
 assert.equal((await request(run,'/studio/history/source?id='+data.authoredId+'&kind=terms',caps.reader,{headers:{'X-Notabenda-Source':'1'}})).status,404);
 assert.equal((await request(run,'/studio/history',caps.reader,{method:'POST',body:'{}'})).status,405);
 assert.equal((await request(run,'/studio/setup',caps.editor)).status,200);
 const assets={};for(const name of assetNames){const response=await request(run,'/assets/'+name,caps.editor);assert.equal(response.status,missing&&name==='setup-preview.mjs'?404:200,name);const bytes=Buffer.from(await response.arrayBuffer());assets[name]={status:response.status,sha256:digest(bytes),contentType:response.headers.get('Content-Type')};assert.ok(!bytes.includes(Buffer.from(data.releases[1].sourceAttachments.terms.source)));}
 const exported=await request(run,'/studio/history/export.json',caps.editor);assert.equal(exported.status,200);const segment=await exported.json();assert.equal(segment.kind,'notabenda-evidence-segment');assert.equal(segment.segment.continuationRequired,false);assert.equal(segment.records.length,records);assert.ok(segment.records.every(record=>!Object.hasOwn(record.data,'sourceAttachments')));
 const projection=segment.records.sort((a,b)=>a.id.localeCompare(b.id));let source;
 if(records===2){const response=await request(run,'/studio/history/source?id='+data.authoredId+'&kind=terms',caps.editor);assert.equal(response.status,200);source=retainedSource(await response.text());assert.equal(source,data.releases[1].sourceAttachments.terms.source);}
 return {assets,records:projection,...(source===undefined?{}:{source})};
}
async function rollback(directory,run,api,target,{rejectLifecycle=false}={}){
 await attest(directory,run,api);const before=await deployment(api,run);delete run.pendingSourceSha256;run.stage='rollback-started';await save(directory,'run.private.json',run);
 let rejection;
 try{
  const argv=['rollback',target.versionId,'--message','Disposable generated-starter acceptance check','--config','wrangler.json'];
  if(rejectLifecycle){const result=spawnSync(process.execPath,[join(root,'node_modules/wrangler/bin/wrangler.js'),...argv],{cwd:directory,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:join(directory,'logs')},encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});await save(directory,'lifecycle-rejection.private.log',(result.stdout??'')+(result.stderr??''));assert.ok(isLifecycleRollbackRejection(result),'Expected a specific Durable Object lifecycle rollback rejection; inspect private log.');rejection=true;}
  else await wrangler(directory,'rollback',argv);
 }finally{await reconcileOwnership(directory,run,api);}
 const after=rejection?await deployment(api,run):await waitForRolloutVersion(async()=>{const active=await deployment(api,run);return {deployment:active,sha256:(await api.source(run.workerName)).sha256,versionEtag:(await versionIdentity(api,run,active.versions[0].version_id)).etag};},target,{previous:before,previousEtag:run.activeVersion.etag,uploadedSha256:run.expectedSourceSha256});if(rejection){assert.equal(after.id,before.id);assert.deepEqual(after.versions,before.versions);assert.equal((await api.source(run.workerName)).sha256,run.expectedSourceSha256);}else{run.activeVersion={versionId:target.versionId,etag:target.etag};run.deploymentId=after.id;}
 delete run.pendingSourceSha256;run.stage='deployed';await save(directory,'run.private.json',run);await attest(directory,run,api);return {before,after,rejected:rejection===true};
}
async function execute(directory,run,key,data,config,api){
 assert.equal(await api('/workers/scripts/'+run.workerName+'/settings',{allowMissing:true}),null);assert.equal((await listDisposableNamespaces(api)).some(n=>n.script===run.workerName),false);run.preflightAbsent=true;
 const subdomain=(await api('/workers/subdomain')).result.subdomain;assert.match(subdomain,/^[a-z0-9-]+$/u);run.url='https://'+run.workerName+'.'+subdomain+'.workers.dev';await save(directory,'run.private.json',run);
 await deploy(directory,run,api,'fresh',{fresh:true});await attestBindings(api,run,['EvidenceWorkspace']);
 const caps={maintenance:key,reader:await rolloutCapability(key,'reader'),editor:await rolloutCapability(key,'editor')};
 let denyStable=0;for(let i=0;i<120&&denyStable<5;i++){try{for(const path of ['/studio/history','/studio/setup','/assets/setup.mjs']){const response=await request(run,path,caps.editor);assert.equal(response.status,403);assert.match(response.headers.get('Cache-Control'),/private, no-store/);}denyStable++;}catch{denyStable=0;}if(denyStable<5)await pause(1000);}assert.equal(denyStable,5);
 console.log('Generated starter: fresh remote deployment denies pages and assets.');
 await variants(directory,run,data,config,'baseline');await deploy(directory,run,api,'baseline');await attestBindings(api,run,['EvidenceWorkspace','RolloutControl']);
 await updateRecoveryFixtureSecret(directory,run,api,key,{label:'secret',settle:()=>pinActiveVersion(api,run)});await ready(directory,run,key,'baseline');
 const target={...run.activeVersion,sha256:run.expectedSourceSha256};run.rollbackTarget=target;await save(directory,'run.private.json',run);
 assert.equal((await request(run,'/studio/history',caps.editor)).status,503);await mutate(directory,run,api,key,'open');await inspect(run,caps,data,{records:0});await mutate(directory,run,api,key,'close');
 await mutate(directory,run,api,key,'archive-first');await mutate(directory,run,api,key,'open');const baseline=await inspect(run,caps,data,{records:1});await save(directory,'baseline-inspection.private.json',baseline);await mutate(directory,run,api,key,'close');
 run.previewBytes=(await readFile(join(directory,'public/assets/setup-preview.mjs'))).toString('base64');await variants(directory,run,data,config,'partial-assets',{missing:true});const diagnosis=await inspectProject({directory});assert.equal(diagnosis.checks.find(c=>c.id==='PREVIEW-ASSET').status,'error');await save(directory,'intentional-missing-asset-doctor.private.json',diagnosis);
 await deploy(directory,run,api,'partial-assets');await attestBindings(api,run,['EvidenceWorkspace','RolloutControl']);await ready(directory,run,key,'partial-assets');
 await mutate(directory,run,api,key,'archive-later');await mutate(directory,run,api,key,'open');const later=await inspect(run,caps,data,{missing:true,records:2});for(const name of assetNames.filter(n=>n!=='setup-preview.mjs'))assert.deepEqual(later.assets[name],baseline.assets[name]);assert.deepEqual(later.records.find(r=>r.id===baseline.records[0].id),baseline.records[0]);await save(directory,'later-inspection.private.json',later);await mutate(directory,run,api,key,'close');
 const rollbackProof=await rollback(directory,run,api,target);await attestBindings(api,run,['EvidenceWorkspace','RolloutControl']);await ready(directory,run,key,'baseline');await mutate(directory,run,api,key,'open');const restored=await inspect(run,caps,data,{records:2});assert.deepEqual(restored.assets,baseline.assets);assert.deepEqual(restored.records,later.records);assert.equal(restored.source,later.source);await mutate(directory,run,api,key,'close');await save(directory,'rollback-inspection.private.json',restored);
 console.log('Native version rollback: pinned version/fingerprint and all assets restored; later exact records and MDX source preserved.');
 await variants(directory,run,data,config,'lifecycle-boundary',{missing:true,canary:true});await deploy(directory,run,api,'lifecycle-boundary');await attestBindings(api,run,['EvidenceWorkspace','RolloutControl','RolloutCanary']);await ready(directory,run,key,'lifecycle-boundary');const sentinel=await mutate(directory,run,api,key,'canary'),namespaceIds=structuredClone(run.namespaces);
 const lifecycle=await rollback(directory,run,api,target,{rejectLifecycle:true});await ready(directory,run,key,'lifecycle-boundary');assert.deepEqual(run.namespaces,namespaceIds);assert.deepEqual(await control(directory,run,key,'canary-read'),sentinel);
 await variants(directory,run,data,config,'forward-repair',{canary:true});await deploy(directory,run,api,'forward-repair');await attestBindings(api,run,['EvidenceWorkspace','RolloutControl','RolloutCanary']);await ready(directory,run,key,'forward-repair');assert.deepEqual(run.namespaces,namespaceIds);assert.deepEqual(await control(directory,run,key,'canary-read'),sentinel);await mutate(directory,run,api,key,'open');const repaired=await inspect(run,caps,data,{records:2});assert.deepEqual(repaired,restored);await mutate(directory,run,api,key,'close');
 run.proof={freshDefaultDeny:true,generatedFilesUnchanged:true,hostOwnedReaderEditorBoundary:true,doctorDetectedMissingPreview:true,actualPinnedVersionRollback:true,allFiveAssetBytesRestored:true,completeLaterRecordProjectionsPreserved:true,exactPrivateMdxSourcePreserved:true,lifecycleRollbackRejected:true,rejectionPreservedDeployment:true,forwardRepairPreservedNamespacesAndSentinel:true,namespaceCount:run.namespaces.length,limits:['Fresh selected-account deployment, not fresh-account provisioning.','HTTP setup/asset checks, not an interactive browser preview exercise.','Fixed synthetic legal archives and fixture-only capabilities; no production authentication or arbitrary schema migration certification.']};await save(directory,'rollback-proof.private.json',{rollback:rollbackProof,lifecycle});await save(directory,'run.private.json',run);console.log('Class lifecycle boundary: native rollback rejected; forward repair preserves all namespaces, records, source and sentinel.');
}
async function main(){
 const options=parseRemoteRecoveryArgs(process.argv.slice(2));if(options.help){console.log('Explicit disposable starter exercise: --run --account-id ACCOUNT_ID; cleanup: --cleanup ORIGINAL_PRIVATE_RUN_DIRECTORY. Uses existing CLOUDFLARE_API_TOKEN. Never changes production resources.');return;}
 const token=process.env.CLOUDFLARE_API_TOKEN;if(!token)throw Error('Supply an existing account-scoped Cloudflare credential.');
 if(options.cleanup){const local=await realpath(join(root,'.local')),directory=await realpath(resolve(root,options.cleanup));if(!directory.startsWith(local+'/cf-starter-rollout-')||directory.slice(local.length+1).includes('/'))throw Error('Select the original ignored private rollout directory.');const run=checkRunIdentity(JSON.parse(await readFile(join(directory,'run.private.json'),'utf8')));if(run.kind!=='notabenda-starter-rollout-run')throw Error('Wrong fixture family.');await cleanup(directory,run,createDisposableClient(run.accountId,token));console.log('Disposable starter resources removed and verified.');return;}
 const {directory,run,key,data,config}=await prepare(options.accountId),api=createDisposableClient(run.accountId,token);let failure;
 try{await execute(directory,run,key,data,config,api);}catch(error){failure=error;run.failure={message:error.message,stack:error.stack,at:new Date().toISOString()};await save(directory,'run.private.json',run);}finally{if(run.preflightAbsent)try{await cleanup(directory,run,api);}catch(error){run.cleanup={verified:false,error:error.message};await save(directory,'run.private.json',run);failure??=error;}}
 for(const name of ['run.private.json','fixture-key.private.txt'])assert.equal((await stat(join(directory,name))).mode&0o777,0o600);
 console.log(JSON.stringify({status:failure?'failed':'verified',runDirectory:relative(root,directory),proof:run.proof??null,cleanup:run.cleanup}));if(failure)throw Error('Starter rollout incomplete; inspect its original private report.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
