// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-DEMO-WORKSPACE
// Optional maintainer check: an owned local Worker with separate ignored SQLite storage. No deployment or credentials.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.NOTABENDA_CONTRACT_CHECK_PORT??4184);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use a loopback test port from 4181 to 4190.');
const origin='http://127.0.0.1:'+port,directory=resolve(root,'.local/contract-action-runtime-'+randomUUID());
await mkdir(directory,{recursive:true});
const config=JSON.parse(await readFile(resolve(root,'site/wrangler.jsonc'),'utf8'));delete config.$schema;config.name='notabenda-contract-runtime';config.main=resolve(root,'site/worker.mjs');config.assets.directory=resolve(root,'site/dist/public');config.vars={NOTABENDA_LOCAL_DEV_AUTH:'1'};
await writeFile(directory+'/wrangler.json',JSON.stringify(config,null,2)+'\n');
let child,output='';
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',directory+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',directory+'/state'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:directory+'/logs'},stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Contract runtime did not become ready. '+output.slice(-2000))),25000);const consume=chunk=>{output=(output+chunk).slice(-6000);if(output.includes('Ready on '+origin+'\n')){clearTimeout(timer);done();}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Contract runtime exited before ready ('+code+').'));});});
}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const current=child;await new Promise(done=>{const timer=setTimeout(()=>current.kill('SIGKILL'),5000);current.once('exit',()=>{clearTimeout(timer);done();});current.kill('SIGINT');});}
const request=(path,session,options={})=>fetch(origin+path,{...options,redirect:'manual',signal:AbortSignal.timeout(10000),headers:{...(session?{Cookie:session.cookie,'X-Notabenda-Demo-Generation':session.generation}:{}),...options.headers}});
async function session(route='withdrawal'){const response=await request('/contract-actions/'+route+'/');assert.equal(response.status,200);const html=await response.text(),cookie=response.headers.get('Set-Cookie').split(';')[0],generation=html.match(/name="notabenda-demo-generation" content="([a-f0-9]{64})"/u)?.[1],operation=html.match(/name="notabenda-contract-operation" content="([a-f0-9]{64})"/u)?.[1];assert.ok(generation);assert.ok(operation);return {cookie,generation,operation};}
const post=(session,route,body)=>request('/demo/contracts/'+route,session,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)});
async function record(session,id){const response=await request('/demo/admin/contracts/export.json?q='+id,session);assert.equal(response.status,200);const value=await response.json();assert.equal(value.records.length,1);return value.records[0];}
try{
 await start();assert.equal((await request('/demo/contracts/withdrawal',null,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:'{}'})).status,409);assert.equal((await request('/backoffice/contracts')).status,401);
 const a=await session(),b=await session();assert.notEqual(a.operation,b.operation);const definition=await (await request('/contract-actions/withdrawal/definition.json')).json(),command={schemaVersion:1,definitionId:definition.definitionId,requestId:randomUUID(),clientAt:new Date().toISOString(),fields:{name:'Cameron Rowan',contract:'Juniper Notes · sample order JN-27014',email:'cameron@example.test'}};
 const responses=await Promise.all(Array.from({length:4},()=>post(a,'withdrawal',command))),receipts=[];for(const response of responses){assert.equal(response.status,200,await response.clone().text());receipts.push(await response.json());}for(const receipt of receipts)assert.deepEqual(receipt,receipts[0]);const saved=receipts[0];assert.equal(saved.operationRef,a.operation);assert.equal(saved.stage,'received');
 assert.equal((await post({...a,cookie:b.cookie},'withdrawal',command)).status,409);assert.equal((await request('/demo/admin/contracts/record?id='+saved.id,b)).status,404);const original=await record(a,saved.id);assert.equal(original.data.delivery.application.status,'pending');assert.equal(original.data.delivery.acknowledgement.status,'pending');assert.equal(original.data.receipt.acknowledgement.text,saved.acknowledgement.text);
 const detail=await request('/demo/admin/contracts/record?id='+saved.id,a);assert.equal(detail.status,200);assert.match(await detail.text(),/Electronic acknowledgement/);
 const cancel=await session('cancellation'),cancelDefinition=await (await request('/contract-actions/cancellation/definition.json')).json(),cancelCommand={...command,definitionId:cancelDefinition.definitionId,requestId:randomUUID(),fields:{...command.fields,cancellation:{kind:'ordinary',reason:'',ending:''}}},cancelResponse=await post(cancel,'cancellation',cancelCommand);assert.equal(cancelResponse.status,200);const cancelled=await cancelResponse.json();assert.match(cancelled.acknowledgement.text,/Frühestmöglicher Zeitpunkt/u);
 const legal=await request('/contract-actions/privacy/');assert.equal(legal.status,200);assert.equal(legal.headers.get('Set-Cookie'),null);
 console.log('Local SQLite contracts: concurrent idempotent capture, independent pending jobs, exact acknowledgement, session separation, cancellation and private inspection/export passed.');
 await stop();await start();
 const restored=await record(a,saved.id);assert.deepEqual(restored,original);const retry=await post(a,'withdrawal',command);assert.equal(retry.status,200);assert.deepEqual(await retry.json(),saved);const cancelRetry=await post(cancel,'cancellation',cancelCommand);assert.equal(cancelRetry.status,200);assert.deepEqual(await cancelRetry.json(),cancelled);assert.equal((await request('/demo/admin/contracts/record?id='+saved.id,b)).status,404);
 const next=await post(a,'withdrawal',{...command,requestId:randomUUID()});assert.equal(next.status,200);assert.notEqual((await next.json()).id,saved.id);
 console.log('Local SQLite restart: exact declaration, jobs, acknowledgement, original receipt, session isolation and new independent declarations survived process restart. No provider or application runner was invoked.');
 console.log('Runtime fixture retained under .local for inspection.');
}catch(error){console.error(output.slice(-1800));throw error;}finally{await stop();}
