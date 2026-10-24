// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-PAID-ORDER-ARCHIVES
// Optional local SQLite acceptance check. No deployment, credentials, sender or production bindings.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,symlink,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {fixture} from '../packages/notabenda/test/helpers.mjs';
import {compileLegalDocuments} from '@notabenda/core/content';
import {prepareTransactionRecovery} from './fixtures/transaction-recovery-data.mjs';
import {expandTransactionFile} from './fixtures/transaction-recovery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.NOTABENDA_TRANSACTION_RECOVERY_PORT??4187);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use a loopback test port from 4181 to 4190.');
// Refuse an occupied port before starting Wrangler; never ask it to choose another user's port.
await new Promise((done,reject)=>{const probe=createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(done));});
const origin='http://127.0.0.1:'+port,directory=resolve(root,'.local/transaction-recovery-'+randomUUID()),capability=randomBytes(32).toString('hex');
await mkdir(directory,{recursive:true,mode:0o700});
const at='2026-10-20T12:00:00.000Z',roles=['retired','held','delivered','uncertain'],families=['contracts','orders'];
const config=await fixture({reviewed:true});config.site.id='transaction-recovery';
const artifact=compileLegalDocuments(config).artifact,siteId=config.site.id;
const data=await prepareTransactionRecovery(artifact,at,'2026-11-20T12:00:00.000Z');
for(const role of roles)for(const file of data.orders[role].bundle.files){file.bytes=[...expandTransactionFile(file)];delete file.recipe;}
await symlink(resolve(root,'node_modules'),directory+'/node_modules','dir');
await writeFile(directory+'/data.mjs','export default '+JSON.stringify(data)+';\n',{mode:0o600});
await writeFile(directory+'/worker.mjs',await readFile(resolve(root,'scripts/fixtures/transaction-recovery-worker.mjs'),'utf8'));
await writeFile(directory+'/wrangler.json',JSON.stringify({name:'notabenda-transaction-recovery',main:'worker.mjs',compatibility_date:'2026-10-18',vars:{RUNTIME_ORIGIN:origin,RUNTIME_KEY:capability},durable_objects:{bindings:[{name:'CASE',class_name:'RecoveryCase'},{name:'PROVIDER',class_name:'IndependentProvider'}]},exports:{RecoveryCase:{type:'durable-object',storage:'sqlite'},IndependentProvider:{type:'durable-object',storage:'sqlite'}},observability:{enabled:false},upload_source_maps:false},null,2)+'\n',{mode:0o600});
let child,output='';
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',directory+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',directory+'/state'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:directory+'/logs'},stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Transaction runtime did not become ready.')),25000);const consume=chunk=>{output=(output+chunk).slice(-8000);if(output.includes('Ready on '+origin+'\n')){clearTimeout(timer);done();}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Runtime exited before ready ('+code+').'));});});
}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const current=child;await new Promise(done=>{const timer=setTimeout(()=>current.kill('SIGKILL'),5000);current.once('exit',()=>{clearTimeout(timer);done();});current.kill('SIGINT');});}
async function call(path,body={},status=200){const response=await fetch(origin+path,{method:'POST',headers:{'X-Notabenda-Runtime':capability,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}),text=await response.text();assert.equal(response.status,status,path+': '+text.slice(0,300));return JSON.parse(text);}
async function saved(name,value){const path=directory+'/'+name,bytes=JSON.stringify(value)+'\n';await writeFile(path,bytes,{mode:0o600});assert.equal((await stat(path)).mode&0o777,0o600);assert.equal(await readFile(path,'utf8'),bytes);return {path,sha256:createHash('sha256').update(bytes).digest('hex')};}
function accepted(result,family){for(const job of family==='contracts'?Object.values(result):[result])assert.deepEqual([job.provider,job.settlement],['accepted','settled']);}
async function isolated(){
 for(const path of ['inspect','dispatch','replay','file'])assert.deepEqual(await call('/restored/'+path,{family:'orders',role:'delivered',file:'terms'},503),{error:'recovery-isolated'});
 for(const path of ['inspect','dispatch','replay'])assert.deepEqual(await call('/restored/'+path,{family:'contracts',role:'delivered'},503),{error:'recovery-isolated'});
 assert.equal((await call('/restored/status')).open,false);
}
try{
 await start();assert.equal((await fetch(origin+'/source/seed',{method:'POST',body:'{}'})).status,404);
 assert.deepEqual(await call('/source/seed'),{contracts:4,orders:4});
 const seeded=await call('/source/status');assert.equal(seeded.retiredHeadPresent.contracts,true);assert.equal(seeded.contractHeadsMatch,true);
 const original={},originalHeld={};for(const family of families){original[family]=await call('/source/inspect',{family,role:'delivered'});originalHeld[family]=await call('/source/inspect',{family,role:'held'});}
 const backup=await call('/source/snapshot'),backupFile=await saved('backup.json',backup);
 await call('/source/clock',{at:'2026-10-20T12:01:00.000Z'});
 const expectedCalls=new Map();
 for(const family of families)for(const role of ['retired','delivered']){const result=await call('/source/dispatch',{family,role});accepted(result,family);for(const job of family==='contracts'?Object.values(result):[result])expectedCalls.set('provider/'+job.deliveryId,role==='retired'?1:2);}
 for(const family of families){const result=await call('/source/dispatch',{family,role:'uncertain',loseResponse:true});for(const job of family==='contracts'?Object.values(result):[result]){assert.equal(job.provider,'uncertain');expectedCalls.set('provider/'+job.deliveryId,3);}}
 await call('/source/hold');await call('/source/retire');
 let purged;for(let i=0;i<100;i++){purged=await call('/source/purge');if(families.every(f=>purged[f].phase==='complete'))break;}
 assert.ok(families.every(f=>purged[f].phase==='complete'));
 const sourcePurged=await call('/source/status');assert.equal(sourcePurged.retiredHeadPresent.contracts,false);assert.equal(sourcePurged.contractHeadsMatch,true);
 const journal=await call('/source/journal'),journalFile=await saved('later-decisions.json',journal),providerBefore=await call('/provider');
 assert.equal(Object.keys(providerBefore).length,9);assert.ok(Object.values(providerBefore).every(v=>v.calls===1&&v.commits===1));
 // Hydrate another SQLite object. The independent provider is never rolled back.
 await isolated();await call('/restored/open',{},409);await call('/restored/hydrate',backup);await call('/restored/hydrate',backup,409);await call('/restored/seed',{},409);await isolated();
 const hydrated=await call('/restored/status');assert.equal(hydrated.retiredHeadPresent.contracts,true);assert.equal(hydrated.contractHeadsMatch,true);
 const wrong=structuredClone(journal);wrong.entries[0].state.contextRef='0'.repeat(64);await call('/restored/reconcile',wrong,409);
 assert.equal((await call('/restored/status')).contracts.held,null);
 await call('/restored/clock',{at:'2026-10-20T12:02:00.000Z'});
 await call('/restored/reconcile',{...journal,stopAfterHolds:true});await call('/restored/open',{},409);
 await stop();await start();await isolated();
 assert.deepEqual(await call('/restored/hold-probe'),{contracts:'legal-hold',orders:'legal-hold'});
 await call('/restored/reconcile',journal);const partial=await call('/restored/purge');assert.equal(partial.orders.phase,'purging');
 await call('/restored/open',{},409);await stop();await start();await isolated();
 const resumed=await call('/restored/status');assert.equal(resumed.orders.retired.progress.batches,1);assert.ok(resumed.orders.retired.progress.deleted>0);
 for(let i=0;i<100;i++){purged=await call('/restored/purge');if(families.every(f=>purged[f].phase==='complete'))break;}
 assert.ok(families.every(f=>purged[f].phase==='complete'));await call('/restored/open');await stop();await start();
 const ready=await call('/restored/status');assert.equal(ready.open,true);assert.equal(ready.contractHeadsMatch,true);assert.deepEqual(ready.retiredPayloadKeys,{contracts:0,orders:0});assert.deepEqual(ready.retiredEventPresent,{contracts:false,orders:false});assert.deepEqual(ready.retiredHeadPresent,{contracts:false,orders:false});
 assert.deepEqual(await call('/restored/hold-probe'),{contracts:'legal-hold',orders:'legal-hold'});
 assert.deepEqual(await call('/provider'),providerBefore);
 const uncertainStates={};
 for(const family of families){
  // A retired record must not replay, dispatch, or reveal original order attachment bytes.
  const replay=await call('/restored/replay',{family,role:'retired'},409);assert.equal(replay.error,'context-retired');if(family==='orders')assert.equal(replay.decideInvoked,false);
  const refused=await call('/restored/dispatch',{family,role:'retired'});for(const job of family==='contracts'?Object.values(refused):[refused])assert.equal(job.provider,'not-invoked');
 }
 assert.equal((await call('/restored/file',{family:'orders',role:'retired',file:'terms'},409)).error,'context-retired');assert.deepEqual(await call('/provider'),providerBefore);
 for(const family of families){
  const restored=await call('/restored/inspect',{family,role:'delivered'});
  assert.deepEqual(restored,original[family]); // Pending is the historical snapshot, not a claim the provider did no work.
  accepted(await call('/restored/dispatch',{family,role:'delivered'}),family);
  const uncertain=await call('/restored/dispatch',{family,role:'uncertain',loseResponse:true});
  for(const job of family==='contracts'?Object.values(uncertain):[uncertain])assert.equal(job.provider,'uncertain');
  const state=await call('/restored/inspect',{family,role:'uncertain'});
  for(const job of family==='contracts'?Object.values(state.data.delivery):[state.confirmation.delivery])assert.equal(job.status,'uncertain');
  uncertainStates[family]=state;
 }
 await stop();await start();
 for(const family of families){
  assert.deepEqual(await call('/restored/inspect',{family,role:'uncertain'}),uncertainStates[family]);
  accepted(await call('/restored/dispatch',{family,role:'uncertain'}),family);
  const held=await call('/restored/inspect',{family,role:'held'});assert.deepEqual(held,originalHeld[family]);for(const job of family==='contracts'?Object.values(held.data.delivery):[held.confirmation.delivery])assert.equal(job.status,'pending');
  const acceptedState=await call('/restored/inspect',{family,role:'delivered'});
  assert.deepEqual(family==='contracts'?acceptedState.data.receipt:acceptedState.receipt,family==='contracts'?original[family].data.receipt:original[family].receipt);
 }
 const after=await call('/provider');assert.deepEqual(Object.keys(after).sort(),Object.keys(providerBefore).sort());
 for(const [key,value] of Object.entries(after)){assert.equal(value.commits,1);assert.equal(value.digest,providerBefore[key].digest);assert.equal(value.calls,expectedCalls.get(key));}
 assert.deepEqual(Object.values(after).map(v=>v.calls).sort(),[1,1,1,2,2,2,3,3,3]);
 for(const role of ['held','delivered','uncertain'])for(const file of data.orders[role].bundle.files)assert.deepEqual((await call('/restored/file',{family:'orders',role,file:file.id})).bytes,file.bytes);
 const report={schemaVersion:1,kind:'local-transaction-recovery-report',passed:true,backup:backupFile,journal:journalFile,contextCounts:{contracts:4,orders:4},provider:{uniqueJobs:9,commits:9,attempts:Object.values(after).reduce((n,v)=>n+v.calls,0)},checks:['default-closed reads/writes/dispatch/files','hold-first replay across restart','retirement replay before reopening','bounded purge across restart','populated synthetic legacy contract head restored then purged; three surviving heads unchanged','retired payloads unavailable','stable downstream identifiers and exact payloads','uncertain response survives restart','original receipts and chunked confirmation bytes preserved'],limitations:['local synthetic KV backup, not native SQLite restore','known fixture journal, not proof of host journal completeness','independent idempotent fake provider, not real delivery','no external-copy deletion or legal readiness claim']};
 await saved('report.json',report);
 console.log('Local SQLite transaction recovery passed: eight contexts; later holds/deletions reconciled before opening; purge resumed after restart.');
 console.log('Independent provider: nine jobs, eighteen attempts, nine commits. Exact declaration payloads, receipts and chunked confirmation files survived rollback/retry.');
 console.log('Private backup, journal and report: '+directory);console.log('Disposable fixture only; no external delivery or deployment. Server stopped on exit.');
}catch(error){console.error(output.replaceAll(capability,'<redacted>').slice(-2000));throw error;}finally{await stop();}
