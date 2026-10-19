// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
// Optional maintainer check: an owned local Worker with separate ignored SQLite storage. No deployment or credentials.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.NOTABENDA_PERMISSION_CHECK_PORT??4182);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use a loopback test port from 4181 to 4190.');
const origin='http://127.0.0.1:'+port,directory=resolve(root,'.local/form-permission-runtime-'+randomUUID());
await mkdir(directory,{recursive:true});
const config=JSON.parse(await readFile(resolve(root,'site/wrangler.jsonc'),'utf8'));delete config.$schema;config.name='notabenda-permission-runtime';config.main=resolve(root,'site/worker.mjs');config.assets.directory=resolve(root,'site/dist/public');config.vars={NOTABENDA_LOCAL_DEV_AUTH:'1'};
await writeFile(directory+'/wrangler.json',JSON.stringify(config,null,2)+'\n');
let child,output='';
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',directory+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',directory+'/state'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:directory+'/logs'},stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Permission runtime did not become ready. '+output.slice(-2000))),25000);const consume=chunk=>{output=(output+chunk).slice(-6000);if(output.includes('Ready on '+origin+'\n')){clearTimeout(timer);done();}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Permission runtime exited before ready ('+code+').'));});});
}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const current=child;await new Promise(done=>{const timer=setTimeout(()=>current.kill('SIGKILL'),5000);current.once('exit',()=>{clearTimeout(timer);done();});current.kill('SIGINT');});}
const request=(path,session,options={})=>fetch(origin+path,{...options,redirect:'manual',signal:AbortSignal.timeout(10000),headers:{...(session?{Cookie:session.cookie,'X-Notabenda-Demo-Generation':session.generation}:{}),...options.headers}});
async function session(){const response=await request('/form-permissions/');assert.equal(response.status,200);const cookie=response.headers.get('Set-Cookie').split(';')[0],token=cookie.slice(cookie.indexOf('=')+1).split('.')[0];const generation=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');assert.ok((await response.text()).includes('content="'+generation+'"'));return {cookie,generation};}
async function state(session){const response=await request('/demo/permissions/state',session);assert.equal(response.status,200);return response.json();}
const post=(session,body)=>request('/demo/permissions/record',session,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)});
const grant=state=>({schemaVersion:1,offerId:state.activeOfferId,requestId:randomUUID(),expectedStreamRef:state.streamRef,action:'grant',expectedRevision:state.revision,expectedActivation:state.activeRevision,clientAt:new Date().toISOString()});
const withdraw=state=>({schemaVersion:1,offerId:state.activeOfferId,requestId:randomUUID(),expectedStreamRef:state.streamRef,action:'withdraw',clientAt:new Date().toISOString()});
try{
 await start();assert.equal((await request('/demo/permissions/state')).status,409);assert.equal((await request('/backoffice/permissions')).status,401);
 const a=await session(),b=await session(),first=await state(a);assert.equal(first.revision,0);assert.equal(first.grantAllowed,true);assert.notEqual(first.streamRef,(await state(b)).streamRef);
 const command=grant(first);const responses=await Promise.all(Array.from({length:4},()=>post(a,command)));const results=[];for(const response of responses){assert.equal(response.status,200);results.push(await response.json());}for(const result of results)assert.deepEqual(result,results[0]);const saved=results[0];assert.equal(saved.state.permitted,true);
 assert.equal((await post(b,command)).status,409);assert.equal((await state(b)).revision,0);
 const stopped=await post(a,withdraw(saved.state));assert.equal(stopped.status,200);const withdrawal=await stopped.json();assert.equal(withdrawal.state.permitted,false);
 const replay=await post(a,command);assert.equal(replay.status,200);const historical=await replay.json();assert.deepEqual(historical.receipt,saved.receipt);assert.equal(historical.state.revision,2);assert.equal(historical.state.permitted,false);
 const stale=await post(a,{...command,requestId:randomUUID()});assert.equal(stale.status,409);assert.equal((await stale.json()).code,'revision-conflict');
 const detail=await request('/demo/admin/permissions/record?id='+saved.receipt.id,a);assert.equal(detail.status,200);const html=await detail.text();for(const phrase of ['Historical action','Grant recorded','No current permission','Host-received time','Browser-reported time'])assert.ok(html.includes(phrase));assert.equal((await request('/demo/admin/permissions/record?id='+saved.receipt.id,b)).status,404);
 const exportResponse=await request('/demo/admin/permissions/export.json?q=withdrawn',a);assert.equal(exportResponse.status,200);assert.match(await exportResponse.text(),/currentState/);
 const legal=await request('/form-permissions/privacy/');assert.equal(legal.status,200);assert.doesNotMatch(legal.headers.get('Content-Security-Policy'),/script-src/);assert.equal(legal.headers.get('Set-Cookie'),null);
 console.log('Local SQLite permissions: concurrent idempotency, stream isolation, ordered grant/withdrawal, historical replay, scoped inspection/export and public static policy passed.');
 await stop();await start();
 const restored=await state(a);assert.deepEqual(restored,withdrawal.state);assert.equal((await state(b)).revision,0);const retry=await post(a,command);assert.equal(retry.status,200);assert.deepEqual((await retry.json()).receipt,saved.receipt);assert.equal((await state(a)).permitted,false);
 const resumed=await post(a,grant(restored));assert.equal(resumed.status,200);const fresh=await resumed.json();assert.equal(fresh.state.revision,3);assert.equal(fresh.state.permitted,true);
 const final=await post(a,withdraw(fresh.state));assert.equal(final.status,200);assert.equal((await final.json()).state.permitted,false);
 console.log('Local SQLite restart: session, exact receipts, current revision, restrictive state and explicit subsequent re-grant survived process restart.');
 console.log('Runtime fixture retained under .local for inspection.');
}catch(error){console.error(output.slice(-1800));throw error;}finally{await stop();}
