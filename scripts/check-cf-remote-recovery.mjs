// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY
// Explicit optional maintainer operation; never installed as part of the reusable packages.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,copyFile,symlink,stat,realpath,rename,readdir} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {fixture} from '../packages/notabenda/test/helpers.mjs';
import {exampleConsentConfig} from '../examples/static/choices-build.mjs';
import {compileLegalDocuments,createConsentNotice,canonicalJson} from '@notabenda/core/content';
import {prepareFamilyRecovery} from './fixtures/family-recovery-data.mjs';
import {prepareTransactionRecovery} from './fixtures/transaction-recovery-data.mjs';
import {expandTransactionFile} from './fixtures/transaction-recovery.mjs';
import {compileAuthoredDocuments} from '@notabenda/authoring';
const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),apiRoot='https://api.cloudflare.com/client/v4';
const hash=value=>createHash('sha256').update(value).digest('hex');
const wait=ms=>new Promise(done=>setTimeout(done,ms));
export function parseRemoteRecoveryArgs(args){
 if(args.length===1&&args[0]==='--help')return {help:true};
 if(args.length===2&&args[0]==='--cleanup')return {cleanup:args[1]};
 if(args.length===3&&args[0]==='--run'&&args[1]==='--account-id'&&/^[a-f0-9]{32}$/u.test(args[2]))return {accountId:args[2]};
 throw Error('Use --run --account-id ACCOUNT_ID, --cleanup PRIVATE_RUN_DIRECTORY, or --help.');
}
export function checkRunIdentity(run){
 if(run?.schemaVersion!==1||run.kind!=='notabenda-remote-recovery-run'||!/^[a-f0-9]{32}$/u.test(run.accountId)||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(run.runId)||run.workerName!=='notabenda-recovery-'+run.runId.replaceAll('-','').slice(0,16))throw Error('Invalid private fixture identity.');return run;
}
async function save(directory,name,value){const target=join(directory,name),temporary=target+'.tmp-'+randomUUID();await writeFile(temporary,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(temporary,target);}
export async function sourceBodyIdentity(response){
 const parts=[];if((response.headers.get('Content-Type')??'').startsWith('multipart/form-data')){
  const form=await response.formData();for(const [name,value] of form){if(name==='metadata')continue;parts.push({name,bytes:typeof value==='string'?Buffer.from(value):Buffer.from(await value.arrayBuffer())});}
 }else parts.push({name:'worker.js',bytes:Buffer.from(await response.arrayBuffer())});
 // Attest every executable byte. Wrangler also uploads one non-executable adjacent source map;
 // its paths differ between dry-run and deployment, so it is shape-checked, not code-hashed.
 const modules=parts.filter(p=>/\.(?:m?js)$/u.test(p.name));
 if(modules.length!==1||modules[0].bytes.length>2*1024*1024)throw Error('Unexpected rehearsal source modules.');
 const code=modules[0],extras=parts.filter(p=>p!==code);
 if(extras.length>1||extras.some(p=>p.name!==code.name+'.map'||p.bytes.length>2*1024*1024))throw Error('Unexpected rehearsal source modules.');
 for(const part of extras){let map;try{map=JSON.parse(part.bytes.toString('utf8'));}catch{throw Error('Invalid rehearsal source map.');}if(map?.version!==3||!Array.isArray(map.sources)||!map.sources.every(v=>typeof v==='string')||typeof map.mappings!=='string')throw Error('Invalid rehearsal source map.');}
 return {sha256:hash(code.bytes),text:code.bytes.toString('utf8')};
}
function client(accountId,token){
 const request=async(path,{method='GET'}={})=>fetch(apiRoot+'/accounts/'+accountId+path,{method,headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000),redirect:'error'});
 const api=async(path,{method='GET',allowMissing=false}={})=>{
  const response=await request(path,{method});if(allowMissing&&response.status===404)return null;
  const json=await response.json();if(!response.ok||!json.success)throw Error('Cloudflare API '+method+' failed ('+response.status+'); inspect the existing account permissions.');return json;
 };
 api.source=async name=>{const response=await request('/workers/scripts/'+name);if(!response.ok)throw Error('Could not attest the disposable Worker source.');return sourceBodyIdentity(response);};return api;
}
async function bundledHash(directory,folder){const files=(await readdir(join(directory,folder))).filter(name=>/\.(?:m?js)$/u.test(name));if(files.length!==1)throw Error('Expected a single bundled rehearsal module.');return hash(await readFile(join(directory,folder,files[0])));}
export async function reconcileOwnership(directory,run,api){
 const live=await metadata(api,run.workerName),all=await namespaces(api),recorded=run.namespaces??[],owned=all.filter(n=>n.script===run.workerName);
 if(all.some(n=>recorded.some(v=>v.id===n.id)&&n.script!==run.workerName))throw Error('A recorded namespace changed ownership; refusing cleanup.');
 if(!live){if(owned.length)throw Error('Recorded namespaces remain without their expected Worker.');return {live:false,cleanupSource:false};}
 if(!run.preflightAbsent||run.workerTag&&live.tag!==run.workerTag||owned.some(n=>!['RecoveryControl','RecoveryEvidence','RecoverySink'].includes(n.class)||n.use_sqlite!==true)||recorded.some(n=>owned.some(v=>v.class===n.class&&v.id!==n.id)))throw Error('The disposable resource identity changed.');
 const source=await api.source(run.workerName),cleanupSource=run.stage==='cleanup-started'&&source.sha256===run.cleanupSourceSha256;
 if(!cleanupSource&&(source.sha256!==run.expectedSourceSha256||!source.text.includes(run.runId)))throw Error('Worker source no longer matches this rehearsal.');
 const pending=['deploying','secret-updating','cleanup-started'].includes(run.stage);
 if(!pending&&run.workerModifiedOn&&live.modified_on!==run.workerModifiedOn)throw Error('Worker changed after this rehearsal; refusing cleanup.');
 run.workerTag=live.tag;run.workerModifiedOn=live.modified_on;run.namespaces=[...recorded,...owned.filter(n=>!recorded.some(v=>v.id===n.id)).map(({id,class:className,use_sqlite})=>({id,class:className,use_sqlite}))];await save(directory,'run.private.json',run);return {live:true,cleanupSource};
}

async function namespaces(api){
 const all=[];for(let page=1;page<=100;page++){const result=await api('/workers/durable_objects/namespaces?per_page=1000&page='+page);if(!Array.isArray(result.result))throw Error('Unexpected namespace response.');all.push(...result.result);if(result.result_info?.total_pages!==undefined?page>=result.result_info.total_pages:result.result.length<1000)return all;}throw Error('Namespace pagination exceeded the rehearsal bound.');
}
async function metadata(api,name){return (await api('/workers/scripts')).result.find(s=>s.id===name);}
async function command(directory,label,argv,input){
 const result=spawnSync(process.execPath,[join(root,'node_modules/wrangler/bin/wrangler.js'),...argv],{cwd:directory,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:join(directory,'logs')},encoding:'utf8',input,timeout:120000,maxBuffer:4*1024*1024});
 await save(directory,label+'.private.log',(result.stdout??'')+(result.stderr??''));if(result.status!==0)throw Error(label+' failed; inspect the private log.');
}
async function callFactory(url,key,directory){return async(action,payload,{status=200,uncertain=false,anonymous=false}={})=>{
 await save(directory,'last-call.private.json',{action,expectedStatus:status});
 let response;try{response=await fetch(url+'/rehearse',{method:'POST',headers:{'Content-Type':'application/json',...(anonymous?{}:{Authorization:'Bearer '+key})},body:JSON.stringify({action,...(payload===undefined?{}:{payload})}),redirect:'error',signal:AbortSignal.timeout(30000)});}catch(error){if(uncertain)return {uncertain:true};throw error;}
 if(uncertain&&response.status>=500)return {uncertain:true};const body=await response.text();let result;try{result=JSON.parse(body);}catch{await save(directory,'last-response.private.json',{action,status:response.status,contentType:response.headers.get('content-type'),body:body.slice(0,16000)});throw Error('Non-JSON rehearsal response for '+action+' ('+response.status+').');}if(response.status!==status)await save(directory,'last-response.private.json',{action,status:response.status,body:result});assert.equal(response.status,status,action+' response status');if(status===200){assert.equal(result.ok,true,action+' succeeded');return result.value;}return result;
};}
async function untilSummary(call,predicate){let last;for(let i=0;i<12;i++){try{last=await call('summary');if(predicate(last))return last;}catch{}await wait(750);}throw Error('The expected provider recovery state was not observed; do not retry restore blindly.');}
export async function waitForRemoteRecoveryReady(call,pause=wait,{consecutive=1,attempts=20}={}){
 let stable=0;for(let i=0;i<attempts;i++){
  try{const state=await call('state');if(state.phase==='closed'){stable++;if(stable>=consecutive){await call('state',undefined,{status:403,anonymous:true});return;}}else stable=0;}catch{stable=0;}
  await pause(1000);
 }
 throw Error('New private Worker did not accept its configured capability.');
}
/** Read-only paired probes: a new key working alone does not prove the old deployment was revoked. */
export async function waitForRotatedRecoveryAccess(current,prior,pause=wait,{consecutive=10,attempts=120}={}){
 let stable=0;for(let i=0;i<attempts;i++){
  try{const state=await current('state'),denied=await prior('state',undefined,{status:403});if(state.phase==='closed'&&denied?.error==='access-denied'){stable++;if(stable>=consecutive){assert.equal((await current('state',undefined,{status:403,anonymous:true})).error,'access-denied');return;}}else stable=0;}catch{stable=0;}
  await pause(1000);
 }
 throw Error('Rotated fixture access did not stabilize; do not assume the old key was revoked.');
}
/** Attest before mutation while outside changes are still rejected, then reconcile uncertain outcomes. */
export async function updateRecoveryFixtureSecret(directory,run,api,key,{execute=command,attest=reconcileOwnership,persist=save,label='rotate-secret'}={}){
 if(typeof key!=='string'||!/^[a-f0-9]{64}$/u.test(key)||!['secret','rotate-secret'].includes(label))throw Error('Invalid private fixture secret update.');
 if(run.stage!=='deployed')throw Error('Secret update requires the attested deployed stage.');
 const before=await attest(directory,run,api);if(before?.live!==true||before.cleanupSource)throw Error('Disposable Worker is absent or cleaning up; refusing secret update.');
 run.stage='secret-updating';await persist(directory,'run.private.json',run);
 try{await execute(directory,label,['secret','put','FIXTURE_KEY','--config','wrangler.json'],key+'\n');}finally{const after=await attest(directory,run,api);if(after?.live!==true||after.cleanupSource)throw Error('Disposable Worker identity was lost during secret update.');}
 run.stage='deployed';await persist(directory,'run.private.json',run);
}
export async function cleanup(directory,run,api){
 checkRunIdentity(run);const observed=await reconcileOwnership(directory,run,api);
 if(!observed.live){run.stage='cleaned';run.cleanup={workerRemoved:true,namespacesRemoved:true,verified:true};await save(directory,'run.private.json',run);return;}
 const recorded=[...run.namespaces];
 if(!observed.cleanupSource){
  await save(directory,'cleanup.mjs',`export default {fetch(){return new Response('Disposable rehearsal finished.',{status:410,headers:{'X-Notabenda-Recovery-Run':${JSON.stringify(run.runId)}}});}};\n`);
  await save(directory,'cleanup.json',{name:run.workerName,account_id:run.accountId,main:'cleanup.mjs',compatibility_date:'2026-10-18',workers_dev:true,preview_urls:false,observability:{enabled:false},exports:Object.fromEntries([...new Set(recorded.map(n=>n.class))].map(name=>[name,{type:'durable-object',state:'deleted'}]))});
  await command(directory,'cleanup-dry-run',['deploy','--dry-run','--config','cleanup.json','--outdir','cleanup-bundle']);run.cleanupSourceSha256=await bundledHash(directory,'cleanup-bundle');run.stage='cleanup-started';await save(directory,'run.private.json',run);
  await command(directory,'cleanup-namespaces',['deploy','--config','cleanup.json','--outdir','cleanup-bundle']);
  const confirmed=await reconcileOwnership(directory,run,api);if(!confirmed.cleanupSource)throw Error('Cleanup source was not confirmed.');
 }
 for(let i=0;i<12;i++){const remaining=(await namespaces(api)).filter(n=>n.script===run.workerName||recorded.some(v=>v.id===n.id));if(!remaining.length)break;if(i===11)throw Error('Namespace deletion has not been verified.');await wait(750);}
 await api('/workers/scripts/'+run.workerName,{method:'DELETE'});
 assert.equal(await api('/workers/scripts/'+run.workerName+'/settings',{allowMissing:true}),null);assert.equal((await namespaces(api)).some(n=>recorded.some(v=>v.id===n.id)||n.script===run.workerName),false);
 run.stage='cleaned';run.cleanup={workerRemoved:true,namespacesRemoved:true,verified:true,namespaceIds:recorded.map(n=>n.id)};await save(directory,'run.private.json',run);
}

async function prepare(accountId){
 const runId=randomUUID(),workerName='notabenda-recovery-'+runId.replaceAll('-','').slice(0,16),directory=join(root,'.local','cf-remote-recovery-'+runId);await mkdir(directory,{mode:0o700});await mkdir(join(directory,'logs'),{mode:0o700});
 const run={schemaVersion:1,kind:'notabenda-remote-recovery-run',runId,workerName,accountId,createdAt:new Date().toISOString(),stage:'prepared',cleanup:{verified:false}};await save(directory,'run.private.json',run);
 const key=randomBytes(32).toString('hex');await save(directory,'fixture-key.private.txt',key+'\n');
 const config=exampleConsentConfig(await fixture({reviewed:true}));config.site.id='remote-recovery';config.scopeGuards={version:1,revision:'synthetic-recovery-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};for(const service of config.services)service.processingActivities=service.id==='sample-suggestions'?['sale','targeted-advertising']:[];const build=compileLegalDocuments(config),scopeId='remote-recovery',notice=createConsentNotice(build.artifact,{scopeId}),now=new Date().toISOString(),reviewAt=new Date(Date.now()+30*86400000).toISOString();
 const authored=await compileAuthoredDocuments(config,{terms:{format:'mdx',source:'---\nkind: terms\ntitle: Synthetic recovery terms\nroute: /terms\nversion: recovery-1\neffectiveDate: 2026-10-20\nreview:\n  status: reviewed\n---\n## Recovery fixture\n\nPrivate synthetic source retained through provider recovery.'}});
 const streams=['erased-context','old-held-context','new-held-context','retained-context'],data={runId,siteId:config.site.id,scopeId,now,reviewAt,streams,releases:[build.artifact,authored.archive],authoredId:authored.manifest.artifactId,sourceSha256:hash(authored.archive.sourceAttachments.terms.source),notice,erasedRef:hash(JSON.stringify([config.site.id,scopeId,'erased-context'])),laterHold:{id:randomUUID(),target:'new-held-context',active:true,reviewAt},decision:{requestId:randomUUID(),reason:'operator-erasure',eligibleAt:now,legalHold:false},holdProbeIds:Object.fromEntries(['old-held-context','new-held-context'].map(id=>[id,randomUUID()])),commands:Object.fromEntries(streams.map(id=>[id,{schemaVersion:1,noticeId:notice.noticeId,requestId:randomUUID(),expectedRevision:0,action:'accept-all',choices:Object.fromEntries(Object.keys(notice.scopes).map(id=>[id,true])),clientAt:now}]))};
 data.families=prepareFamilyRecovery(config,build.artifact,now,reviewAt);
 data.transactions=await prepareTransactionRecovery(build.artifact,now,reviewAt);
 await save(directory,'data.mjs','export const data='+JSON.stringify(data)+';\n');for(const name of ['remote-recovery-worker.mjs','remote-recovery.mjs','family-recovery.mjs','transaction-recovery.mjs'])await copyFile(join(root,'scripts/fixtures',name),join(directory,name));await symlink(join(root,'node_modules'),join(directory,'node_modules'),'dir');
 await save(directory,'wrangler.json',{name:workerName,account_id:accountId,main:'remote-recovery-worker.mjs',compatibility_date:'2026-10-18',workers_dev:true,preview_urls:false,observability:{enabled:false},durable_objects:{bindings:[{name:'CONTROL',class_name:'RecoveryControl'},{name:'EVIDENCE',class_name:'RecoveryEvidence'},{name:'SINK',class_name:'RecoverySink'}]},exports:{RecoveryControl:{type:'durable-object',storage:'sqlite'},RecoveryEvidence:{type:'durable-object',storage:'sqlite'},RecoverySink:{type:'durable-object',storage:'sqlite'}}});
 return {directory,run,key,data};
}
async function execute(directory,run,key,data,api){
 assert.equal(await api('/workers/scripts/'+run.workerName+'/settings',{allowMissing:true}),null);assert.equal((await namespaces(api)).some(n=>n.script===run.workerName),false);
 run.preflightAbsent=true;await save(directory,'run.private.json',run);
 const subdomain=(await api('/workers/subdomain')).result.subdomain;if(typeof subdomain!=='string'||!/^[a-z0-9-]+$/u.test(subdomain))throw Error('Use an existing Workers subdomain in this account.');run.url='https://'+run.workerName+'.'+subdomain+'.workers.dev';run.stage='deploying';await save(directory,'run.private.json',run);
 await command(directory,'bundle-dry-run',['deploy','--dry-run','--config','wrangler.json','--outdir','bundle']);run.expectedSourceSha256=await bundledHash(directory,'bundle');await save(directory,'run.private.json',run);
 try{await command(directory,'deploy',['deploy','--config','wrangler.json','--outdir','bundle']);}finally{await reconcileOwnership(directory,run,api);}
 run.stage='deployed';await save(directory,'run.private.json',run);assert.deepEqual(run.namespaces.map(n=>n.class).sort(),['RecoveryControl','RecoveryEvidence','RecoverySink']);
 await updateRecoveryFixtureSecret(directory,run,api,key,{label:'secret'});
 let call=await callFactory(run.url,key,directory);await waitForRemoteRecoveryReady(call,wait,{consecutive:20,attempts:120});
 await call('inspect',undefined,{status:503});await call('archive-write',undefined,{status:503});await call('grant',undefined,{status:503});
 const seeded=await call('seed');assert.equal(seeded.events,4);assert.equal(seeded.sourceSha256,data.sourceSha256);assert.equal(seeded.families.permissionStates['permission-withdrawn'].permitted,true);const bookmark=await call('bookmark');await save(directory,'bookmark.private.json',bookmark);await call('open');assert.equal((await call('inspect')).events,4);assert.equal((await call('archive-write')).created,false);assert.equal((await call('processing-produce')).state,'delivered');
 const transactionOriginal=await call('transaction-inspect'),transactionSource=await call('transaction-source-delivery');
 const jobs=(result,family)=>family==='contracts'?Object.values(result):[result],expectedTransactionCalls=new Map();
 for(const family of ['contracts','orders'])for(const role of ['retired','delivered','uncertain'])for(const job of jobs(transactionSource[family+'/'+role],family)){assert.equal(job.provider,role==='uncertain'?'uncertain':'accepted');assert.equal(job.settlement,'settled');expectedTransactionCalls.set('provider/'+job.deliveryId,role==='retired'?1:role==='delivered'?2:3);}
 await call('close');await call('post-backup-decisions');let purged;for(let i=0;i<100;i++){purged=await call('purge');if(purged.phase==='complete'&&Object.values((await call('summary')).families.retirements).every(v=>v?.phase==='complete')&&Object.values((await call('summary')).transactions.retirements).every(v=>v?.phase==='complete'))break;}assert.equal(purged.phase,'complete');assert.equal(purged.progress.deleted,1);const beforeRestore=await call('summary');assert.equal(beforeRestore.events,3);assert.equal(beforeRestore.deliveries.length,1);assert.equal(beforeRestore.deliveries[0].attempts,1);assert.equal(Object.keys(beforeRestore.transactionProvider).length,9);assert.ok(Object.values(beforeRestore.transactionProvider).every(v=>v.calls===1&&v.commits===1));assert.deepEqual(await call('transaction-hold-probes'),{contracts:true,orders:true});assert.deepEqual(await call('hold-probes'),{'old-held-context':true,'new-held-context':true});assert.deepEqual(await call('family-hold-probes'),{terms:true,permissions:true,processing:true});
 const journal={hold:data.laterHold,retirement:purged,families:await call('family-journal'),transactions:await call('transaction-journal')},wrong=structuredClone(journal);wrong.retirement.retirement.requestId=randomUUID();await call('journal',wrong,{status:409});assert.ok(Buffer.byteLength(JSON.stringify({action:'journal',payload:journal}))<=16384,'complete fixed six-family journal fits the HTTP limit');const omitted=structuredClone(journal);omitted.transactions.entries.pop();await call('journal',omitted,{status:409});const saved=await call('journal',journal);await save(directory,'decisions.private.json',{journal:saved.journal,digest:saved.journalDigest});const disk=JSON.parse(await readFile(join(directory,'decisions.private.json'),'utf8'));assert.equal(disk.digest,saved.journalDigest);assert.equal(hash(canonicalJson(disk.journal)),saved.journalDigest);
 await call('restore',undefined,{uncertain:true});const restored=await untilSummary(call,s=>s.control.restoreIntent&&s.events===4&&s.sql.length===1&&s.sql[0].value===1&&s.holds['new-held-context']===null&&s.holds['erased-context']===null&&s.families.permissionStates['permission-withdrawn'].permitted===true&&s.families.processingHeads['processing-restricted'].revision===0&&!s.families.pending['processing-pending']);assert.deepEqual(restored.deliveries,beforeRestore.deliveries);assert.deepEqual(restored.transactionProvider,beforeRestore.transactionProvider);assert.ok(Object.values(restored.transactions.retirements).every(v=>v===null));assert.ok(Object.values(restored.transactions.held).every(v=>v===null));assert.equal(restored.control.phase,'closed');assert.equal(restored.erasedPhysicalHeadGone,false);assert.equal(restored.control.restoreIntent.bookmark,bookmark.bookmark);await save(directory,'provider-restore.private.json',restored.control.restoreIntent);
 for(const action of ['inspect','archive-write','grant','family-inspect','family-replay-erased','permission-old-grant','processing-produce','processing-positive','processing-enqueue','processing-dispatch','processing-record','processing-read','transaction-inspect','transaction-source-delivery','transaction-replay-erased','transaction-dispatch-erased','transaction-retired-file','transaction-delivered-dispatch','transaction-uncertain-dispatch','transaction-uncertain-retry','transaction-files'])await call(action,undefined,{status:503});await call('open',undefined,{status:409});await call('purge',undefined,{status:409});const sinkBefore=restored.deliveries;await call('replay-journal-partial',undefined,{status:409});await call('open',undefined,{status:409});await call('purge',undefined,{status:409});await call('restart',undefined,{uncertain:true});await untilSummary(call,s=>s.control.restarts===1);await call('replay-transactions-partial',undefined,{status:409});await call('open',undefined,{status:409});await call('purge',undefined,{status:409});assert.deepEqual(await call('transaction-hold-probes'),{contracts:true,orders:true});await call('restart',undefined,{uncertain:true});await untilSummary(call,s=>s.control.restarts===2);const replayed=await call('replay-journal');assert.equal(replayed.holds['new-held-context'].hold.active,true);assert.equal(replayed.holds['erased-context'].phase,'purging');await call('open',undefined,{status:409});const partial=await call('purge');assert.equal(partial.phase,'purging');
 await call('restart',undefined,{uncertain:true});const restarted=await untilSummary(call,s=>s.control.restarts===3&&s.holds['erased-context']?.progress.batches===partial.progress.batches);assert.equal(restarted.control.phase,'closed');
 for(let i=0;i<100;i++){purged=await call('purge');if(purged.phase==='complete'&&Object.values((await call('summary')).families.retirements).every(v=>v?.phase==='complete')&&Object.values((await call('summary')).transactions.retirements).every(v=>v?.phase==='complete'))break;}assert.equal(purged.phase,'complete');assert.equal(purged.progress.deleted,1);assert.deepEqual(await call('hold-probes'),{'old-held-context':true,'new-held-context':true});assert.deepEqual(await call('family-hold-probes'),{terms:true,permissions:true,processing:true});await call('open');const oldPermission=await call('permission-old-grant');assert.equal(oldPermission.receipt.action,'grant');assert.equal(oldPermission.state.permitted,false);assert.equal(oldPermission.state.reason,'withdrawn');assert.equal((await call('processing-produce')).state,'blocked');const suppressed=await call('processing-dispatch');assert.ok(suppressed.every(j=>j.state==='suppressed'&&j.attempts===0));const erased=await call('family-replay-erased');assert.deepEqual(erased.terms,{signup:true,workspace:true});assert.equal(erased.permissions,true);assert.equal(erased.processing.state,'blocked');const unchanged=await call('family-inspect');assert.equal(unchanged.processingHeads['processing-pending'].revision,0);const final=await call('inspect');assert.equal(final.events,3);assert.equal(final.history,2);assert.equal(final.sourceSha256,data.sourceSha256);const denied=await call('grant',undefined,{status:409});assert.equal(denied.error,'context-retired');await call('close');const finalSummary=await call('summary');assert.deepEqual(finalSummary.deliveries,sinkBefore);assert.deepEqual(finalSummary.families.counts,{terms:4,permissions:4,processing:3});assert.equal(finalSummary.families.retirements.terms.progress.deleted,2);assert.equal(finalSummary.families.retirements.permissions.progress.deleted,1);assert.equal(finalSummary.families.retirements.processing.progress.deleted,1);await call('open');assert.equal((await call('processing-positive')).state,'delivered');await call('close');const positive=await call('summary');assert.equal(positive.deliveries.length,sinkBefore.length+1);assert.ok(positive.deliveries.every(d=>d.attempts===1));assert.equal(finalSummary.erasedPhysicalHeadGone,true);
 assert.deepEqual(finalSummary.transactionProvider,beforeRestore.transactionProvider);assert.deepEqual(await call('transaction-hold-probes'),{contracts:true,orders:true});
 await call('open');assert.deepEqual(await call('transaction-inspect'),transactionOriginal);
 await call('transaction-source-delivery',undefined,{status:409});
 const transactionDenied=await call('transaction-replay-erased');assert.equal(transactionDenied.contracts.error,'context-retired');assert.deepEqual(transactionDenied.orders,{error:'context-retired',decideInvoked:false});
 const retiredDispatch=await call('transaction-dispatch-erased');for(const family of ['contracts','orders'])assert.ok(jobs(retiredDispatch[family],family).every(v=>v.provider==='not-invoked'));assert.equal((await call('transaction-retired-file',undefined,{status:409})).error,'context-retired');
 const delivered=await call('transaction-delivered-dispatch');for(const family of ['contracts','orders'])assert.ok(jobs(delivered[family],family).every(v=>v.provider==='accepted'&&v.settlement==='settled'));
 const uncertain=await call('transaction-uncertain-dispatch');for(const family of ['contracts','orders'])assert.ok(jobs(uncertain[family],family).every(v=>v.provider==='uncertain'&&v.settlement==='settled'));const uncertainViews=await call('transaction-inspect');for(const family of ['contracts','orders'])for(const job of family==='contracts'?Object.values(uncertainViews['contracts/uncertain'].data.delivery):[uncertainViews['orders/uncertain'].confirmation.delivery]){assert.equal(job.status,'uncertain');assert.equal(job.lease,null);assert.equal(job.providerRef,null);assert.equal(job.attempts,1);assert.equal(job.version,1);}
 await call('close');await call('restart',undefined,{uncertain:true});await untilSummary(call,s=>s.control.restarts===4);await call('open');assert.deepEqual(await call('transaction-inspect'),uncertainViews);
 const retried=await call('transaction-uncertain-retry');for(const family of ['contracts','orders'])assert.ok(jobs(retried[family],family).every(v=>v.provider==='accepted'&&v.settlement==='settled'));
 const acceptedViews=await call('transaction-inspect');for(const family of ['contracts','orders'])for(const job of family==='contracts'?Object.values(acceptedViews['contracts/uncertain'].data.delivery):[acceptedViews['orders/uncertain'].confirmation.delivery]){assert.equal(job.status,'accepted');assert.equal(job.lease,null);assert.equal(job.providerRef,'sample-'+job.deliveryId);assert.equal(job.attempts,2);assert.equal(job.version,2);}
 const checkedFiles=await call('transaction-files');for(const role of ['held','delivered','uncertain'])for(const file of data.transactions.orders[role].bundle.files){const expected=expandTransactionFile(file);assert.deepEqual(checkedFiles[role][file.id],{bytes:expected.length,sha256:hash(expected)});}
 await call('close');const transactionFinal=await call('summary');for(const [key,value] of Object.entries(transactionFinal.transactionProvider)){assert.equal(value.calls,expectedTransactionCalls.get(key));assert.equal(value.commits,1);assert.equal(value.digest,beforeRestore.transactionProvider[key].digest);}assert.deepEqual(Object.values(transactionFinal.transactionProvider).map(v=>v.calls).sort(),[1,1,1,2,2,2,3,3,3]);
for(const id of ['old-held-context','new-held-context','retained-context'])assert.equal(finalSummary.heads[id],1);
 // Rotate only this disposable host's HTTP capability, after all recovery work is closed.
 const beforeRotation=await call('summary');assert.equal(beforeRotation.control.phase,'closed');const rotatedKey=randomBytes(32).toString('hex');assert.notEqual(rotatedKey,key);await save(directory,'fixture-key-rotated.private.txt',rotatedKey+'\n');assert.equal((await stat(join(directory,'fixture-key-rotated.private.txt'))).mode&0o777,0o600);
 await updateRecoveryFixtureSecret(directory,run,api,rotatedKey);
 const previousCall=call;call=await callFactory(run.url,rotatedKey,directory);await waitForRotatedRecoveryAccess(call,previousCall);const afterRotation=await call('summary');assert.deepEqual(afterRotation,beforeRotation);await call('transaction-inspect',undefined,{status:503});await call('grant',undefined,{status:503});assert.equal((await previousCall('summary',undefined,{status:403})).error,'access-denied');run.keyRotation={oldKeyRevoked:true,newKeyAccepted:true,anonymousDenied:true,closedGatePreserved:true,evidenceAndDestinationsUnchanged:true};await save(directory,'run.private.json',run);
 run.stage='verified';run.proof={provider:'Cloudflare SQLite Time Travel',bookmarkSha256:hash(bookmark.bookmark),journalDigest:saved.journalDigest,sqlRewound:true,erasedHeadResurrectedThenPurged:true,eventsRetained:3,existingAndNewerHoldsPreserved:true,unrelatedHeadsPreserved:true,sourceBytesPreserved:true,externalGateSurvivedRollback:true,ordinaryRpcClosedBeforeReplay:true,purgeRestartPreserved:true,oldGrantBlocked:true,termsTwoScopesErased:true,formWithdrawalReplayed:true,historicalGrantNotCurrentPermission:true,processingRestrictionReplayed:true,unconfirmedIntentRestoredWithoutReceipt:true,queuedAndNewProcessingSuppressed:true,independentSinkHistorySurvivedRollback:true,independentSinkAttemptsUnchanged:true,unrelatedPositiveDelivered:true,replayAndPurgeRestartsPreserved:true,contractAndOrderNativeRollback:true,transactionHoldsReplayedBeforeRetirement:true,transactionPayloadsPurged:true,retiredAdmissionCallbackNotInvoked:true,confirmationFileBytesPreserved:true,stableProviderPayloads:true,providerJobs:9,providerAttempts:18,providerCommits:9,uncertainTransactionRestartPreserved:true,fixtureKeyRotation:run.keyRotation};await save(directory,'run.private.json',run);
}
async function main(){
 const parsed=parseRemoteRecoveryArgs(args);if(parsed.help){process.stdout.write('Optional maintainer-only Cloudflare SQLite recovery rehearsal.\nUse: CLOUDFLARE_API_TOKEN=... node scripts/check-cf-remote-recovery.mjs --run --account-id ACCOUNT_ID\nCreates a fresh synthetic Worker and three SQLite namespaces; permanently removes only these disposable resources after the run. No production bindings or domains.\nCleanup a retained run: --cleanup .local/cf-remote-recovery-RUN_ID\n');return;}
 const token=process.env.CLOUDFLARE_API_TOKEN;if(!token)throw Error('Supply an existing CLOUDFLARE_API_TOKEN with Worker deployment and namespace inspection access.');
 if(parsed.cleanup){const directory=await realpath(resolve(root,parsed.cleanup));if(!/^\.local\/cf-remote-recovery-[a-f0-9-]{36}$/u.test(relative(root,directory)))throw Error('Cleanup requires the original project-local private run directory.');assert.equal((await stat(join(directory,'run.private.json'))).mode&0o777,0o600);const run=checkRunIdentity(JSON.parse(await readFile(join(directory,'run.private.json'),'utf8')));await cleanup(directory,run,client(run.accountId,token));console.log('Disposable rehearsal cleanup verified.');return;}
 const {directory,run,key,data}=await prepare(parsed.accountId),api=client(run.accountId,token);let failure;
 try{await execute(directory,run,key,data,api);}catch(error){failure=error;run.failure=error.message;await save(directory,'run.private.json',run);}finally{
  if(run.preflightAbsent)try{await cleanup(directory,run,api);}catch(error){run.cleanup={verified:false,error:error.message};await save(directory,'run.private.json',run);failure??=error;}
 }
 for(const name of ['run.private.json','fixture-key.private.txt'])assert.equal((await stat(join(directory,name))).mode&0o777,0o600);
 console.log(JSON.stringify({status:failure?'failed':'verified',runDirectory:relative(root,directory),proof:run.proof??null,cleanup:run.cleanup}));if(failure)throw Error('Remote rehearsal incomplete; inspect its private run report.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
