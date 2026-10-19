// @requirements REQ-EU-ORDER-CONFIRMATION
// @requirements REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-EVIDENCE-LIFECYCLE
// Owned loopback Worker and two disposable SQLite DOs. No external network delivery, credentials or deployment.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.NOTABENDA_CONFIRMATION_CHECK_PORT??4186);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use a loopback test port from 4181 to 4190.');
const origin='http://127.0.0.1:'+port,directory=resolve(root,'.local/order-confirmation-runtime-'+randomUUID()),capability=randomBytes(32).toString('hex');
await mkdir(directory,{recursive:true});
await writeFile(directory+'/wrangler.json',JSON.stringify({name:'notabenda-confirmation-runtime',main:resolve(root,'scripts/fixtures/order-confirmation-worker.mjs'),compatibility_date:'2026-10-18',vars:{RUNTIME_ORIGIN:origin,RUNTIME_KEY:capability},durable_objects:{bindings:[{name:'CASE',class_name:'ConfirmationCase'},{name:'SINK',class_name:'ConfirmationSink'}]},exports:{ConfirmationCase:{type:'durable-object',storage:'sqlite'},ConfirmationSink:{type:'durable-object',storage:'sqlite'}},observability:{enabled:false},upload_source_maps:false},null,2)+'\n');
let child,output='';
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',directory+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',directory+'/state'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:directory+'/logs'},stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Dispatch runtime did not become ready.')),25000);const consume=chunk=>{output=(output+chunk).slice(-6000);if(output.includes('Ready on '+origin+'\n')){clearTimeout(timer);done();}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Dispatch runtime exited before ready ('+code+').'));});});
}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const current=child;await new Promise(done=>{const timer=setTimeout(()=>current.kill('SIGKILL'),5000);current.once('exit',()=>{clearTimeout(timer);done();});current.kill('SIGINT');});}
async function call(path,body={}){const response=await fetch(origin+path,{method:'POST',headers:{'X-Notabenda-Runtime':capability,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});assert.equal(response.status,200);return response.json();}
try{
 await start();assert.equal((await fetch(origin+'/prepare',{method:'POST',body:'{}'})).status,404);
 const prepared=await call('/prepare',{requestId:randomUUID()}),first=await call('/dispatch',{mode:'lose-response'});assert.equal(first.provider,'uncertain');assert.equal(first.settlement,'settled');
 let state=await call('/inspect');assert.deepEqual(state.receipt,prepared.receipt);assert.equal(state.archive.delivery.status,'uncertain');const original=await call('/lease');assert.ok(original);assert.equal(original.deliveryId,first.deliveryId);const before=await call('/provider');assert.equal(before['provider/'+first.deliveryId].commits,1);
 await stop();await start();state=await call('/inspect');assert.equal(state.archive.delivery.status,'leased');assert.deepEqual(state.receipt,prepared.receipt);assert.deepEqual(state.archive.manifest,prepared.manifest);assert.equal(state.attachmentSha256,prepared.manifest.files.find(f=>f.id==='large').sha256);
 assert.deepEqual(await call('/dispatch'),{provider:'not-invoked',settlement:'not-claimed'});await call('/clock',{at:'2026-10-19T12:00:02.000Z'});const recovered=await call('/dispatch');assert.equal(recovered.provider,'accepted');assert.equal(recovered.deliveryId,first.deliveryId);assert.deepEqual(await call('/settle',{lease:original}),{settled:false});state=await call('/inspect');assert.equal(state.archive.delivery.status,'accepted');assert.deepEqual(state.receipt,prepared.receipt);
 const after=await call('/provider'),job=after['provider/'+first.deliveryId];assert.equal(job.calls,2);assert.equal(job.commits,1);assert.equal(job.payloadSha256,before['provider/'+first.deliveryId].payloadSha256);assert.deepEqual(job.destination,prepared.manifest.addressee);
 console.log('SQLite confirmation archive and independent provider survived restart. Exact large original file, immutable manifest/destination and original admission receipt recovered.');
 console.log('Lost provider response stayed uncertain; expired lease retried the same delivery ID/payload. Two provider attempts committed once; stale settlement was refused. No external messages sent.');
 console.log('Owned runtime stopped; ignored fixture retained for inspection.');
}catch(error){console.error(output.replaceAll(capability,'<redacted>').slice(-1800));throw error;}finally{await stop();}
