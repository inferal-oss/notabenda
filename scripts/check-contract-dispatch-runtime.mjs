// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-EVIDENCE-LIFECYCLE
// Owned loopback Worker and two disposable SQLite DOs. No external network delivery, credentials or deployment.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.NOTABENDA_DISPATCH_CHECK_PORT??4185);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use a loopback test port from 4181 to 4190.');
const origin='http://127.0.0.1:'+port,directory=resolve(root,'.local/contract-dispatch-runtime-'+randomUUID()),capability=randomBytes(32).toString('hex');
await mkdir(directory,{recursive:true});
await writeFile(directory+'/wrangler.json',JSON.stringify({name:'notabenda-dispatch-runtime',main:resolve(root,'scripts/fixtures/contract-dispatch-worker.mjs'),compatibility_date:'2026-10-18',vars:{RUNTIME_ORIGIN:origin,RUNTIME_KEY:capability},durable_objects:{bindings:[{name:'CASE',class_name:'DispatchCase'},{name:'SINK',class_name:'ProviderSink'}]},exports:{DispatchCase:{type:'durable-object',storage:'sqlite'},ProviderSink:{type:'durable-object',storage:'sqlite'}},observability:{enabled:false},upload_source_maps:false},null,2)+'\n');
let child,output='';
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',directory+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',directory+'/state'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:directory+'/logs'},stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Dispatch runtime did not become ready.')),25000);const consume=chunk=>{output=(output+chunk).slice(-6000);if(output.includes('Ready on '+origin+'\n')){clearTimeout(timer);done();}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Dispatch runtime exited before ready ('+code+').'));});});
}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const current=child;await new Promise(done=>{const timer=setTimeout(()=>current.kill('SIGKILL'),5000);current.once('exit',()=>{clearTimeout(timer);done();});current.kill('SIGINT');});}
async function call(path,body={}){const response=await fetch(origin+path,{method:'POST',headers:{'X-Notabenda-Runtime':capability,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});assert.equal(response.status,200);return response.json();}
try{
 await start();assert.equal((await fetch(origin+'/capture',{method:'POST',body:'{}'})).status,404);
 const receipt=await call('/capture',{requestId:randomUUID()}),id=receipt.id,first=await call('/dispatch',{id,application:'lose-response'});
 assert.deepEqual([first.acknowledgement.provider,first.acknowledgement.settlement],['accepted','settled']);assert.deepEqual([first.application.provider,first.application.settlement],['uncertain','settled']);
 let record=await call('/inspect',{id});assert.equal(record.data.delivery.acknowledgement.status,'accepted');assert.equal(record.data.delivery.application.status,'uncertain');
 const originalLease=await call('/lease',{id,channel:'application'});assert.ok(originalLease);assert.equal(originalLease.deliveryId,first.application.deliveryId);
 const before=await call('/provider');assert.equal(Object.keys(before).length,2);assert.equal(before['provider/'+first.application.deliveryId].commits,1);
 await stop();await start();
 record=await call('/inspect',{id});assert.equal(record.data.delivery.acknowledgement.status,'accepted');assert.equal(record.data.delivery.application.status,'leased');assert.deepEqual(record.data.receipt,receipt);
 assert.deepEqual(await call('/dispatch-one',{id,channel:'application'}),{provider:'not-invoked',settlement:'not-claimed'});assert.deepEqual(await call('/provider'),before);
 await call('/clock',{at:'2026-10-19T12:00:02.000Z'});const recovered=await call('/dispatch-one',{id,channel:'application'});assert.equal(recovered.provider,'accepted');assert.equal(recovered.settlement,'settled');assert.equal(recovered.deliveryId,originalLease.deliveryId);
 assert.deepEqual(await call('/settle',{lease:originalLease}),{settled:false});record=await call('/inspect',{id});assert.equal(record.data.delivery.application.status,'accepted');assert.equal(record.data.delivery.application.providerRef,'sample-provider-'+originalLease.deliveryId);
 const after=await call('/provider'),application=after['provider/'+originalLease.deliveryId];assert.equal(application.calls,2);assert.equal(application.commits,1);assert.equal(application.payloadSha256,originalLease.payloadSha256);assert.equal(after['provider/'+first.acknowledgement.deliveryId].calls,1);assert.deepEqual(record.data.receipt,receipt);
 const hungReceipt=await call('/capture',{requestId:randomUUID()}),hung=await call('/dispatch',{id:hungReceipt.id,application:'hang'});assert.equal(hung.acknowledgement.provider,'accepted');assert.equal(hung.application.provider,'uncertain');assert.equal(hung.application.settlement,'settled');
 console.log('Local SQLite dispatch: acknowledgement accepted independently; lost application response remained uncertain; both provider and declaration stores survived restart.');
 console.log('Recovered expired lease reused the same delivery ID/digest; the independent fake provider received two attempts but committed once; stale settlement was refused.');
 console.log('Hung application delivery timed out without blocking acknowledgement. Original receipts stayed unchanged. Controlled clock, test-only endpoints and provider stand-ins; no email or application instruction sent externally.');
 console.log('Disposable runtime fixture retained under .local for inspection; its server is stopped.');
}catch(error){console.error(output.replaceAll(capability,'<redacted>').slice(-1800));throw error;}finally{await stop();}
