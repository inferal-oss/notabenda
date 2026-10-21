// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CONSENT-NOTICE-FILES
// Optional maintainer run. Fixture authorization/fault injection is confined to a disposable copy.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,readdir,copyFile,symlink} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),source=resolve(root,'examples/recorded-cookies'),port=Number(process.env.NOTABENDA_RECORDED_COOKIE_PORT??4188);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use an owned loopback test port from 4181 to 4190.');
const args=process.argv.slice(2);if(args.length>1||args.length===1&&args[0]!=='--serve')throw Error('Only --serve is supported.');
await new Promise((done,reject)=>{const probe=createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(done));});
const origin='http://127.0.0.1:'+port,directory=resolve(root,'.local/recorded-cookie-runtime-'+randomUUID()),capability=randomBytes(32).toString('hex');
await mkdir(directory,{recursive:true,mode:0o700});
for(const entry of await readdir(source,{withFileTypes:true}))if(entry.isFile())await copyFile(resolve(source,entry.name),resolve(directory,entry.name));
await symlink(resolve(root,'node_modules'),directory+'/node_modules','dir');
const built=spawnSync(process.execPath,[directory+'/build.mjs','--preview'],{cwd:directory,encoding:'utf8',env:{...process.env,npm_config_update_notifier:'false'}});assert.equal(built.status,0,built.stderr);
const config=JSON.parse(await readFile(directory+'/wrangler.json','utf8'));config.vars={APP_ORIGIN:origin,RUNTIME_KEY:capability};await writeFile(directory+'/wrangler.json',JSON.stringify(config,null,2)+'\n',{mode:0o600});
const release=(await import('file://'+directory+'/.generated/release.mjs')).default;
let child,output='';
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',directory+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',directory+'/state'],{cwd:directory,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:directory+'/logs'},stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Recorded-cookie runtime did not become ready.')),25000);const consume=chunk=>{output=(output+chunk).slice(-10000);if(output.includes('Ready on '+origin+'\n')){clearTimeout(timer);done();}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Runtime exited before ready ('+code+').'));});});
}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const current=child;await new Promise(done=>{const timer=setTimeout(()=>current.kill('SIGKILL'),5000);current.once('exit',()=>{clearTimeout(timer);done();});current.kill('SIGINT');});}
async function call(path,input={},status=200,extra={}){
 const r=await fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Request':'1',...extra},body:JSON.stringify(input),signal:AbortSignal.timeout(10000)}),text=await r.text();assert.equal(r.status,status,path+': '+text.slice(0,300));assert.equal(r.headers.get('cache-control'),'private, no-store');return JSON.parse(text);
}
const command=(head,action='accept-all')=>({schemaVersion:1,noticeId:release.notice.noticeId,requestId:randomUUID(),expectedRevision:head.revision,action,choices:Object.fromEntries(Object.keys(release.notice.scopes).map(id=>[id,action==='accept-all'])),clientAt:new Date().toISOString()});
const fault=mode=>fetch(origin+'/__fixture/'+mode,{method:'POST',headers:{'X-Fixture-Key':capability}}).then(r=>{assert.equal(r.status,204);});
try{
 await start();
 for(const path of ['/api/cookies/bootstrap','/backoffice/register','/backoffice/activate'])await call(path,{},403);
 assert.equal((await fetch(origin+'/backoffice')).status,403);for(const path of ['/operator','/operator/','/operator.html','/operator/index.html'])assert.equal((await fetch(origin+path,{redirect:'manual'})).status,404);for(const path of ['/','/privacy','/cookies','/terms'])assert.equal((await fetch(origin+path)).status,200);
 await stop();
 await writeFile(directory+'/authorize.mjs',`// Disposable test authorization only. Never copy into the application example.\nexport async function authorizeVisitor(request){return {streamId:request.headers.get('Cookie')==='fixture-visitor=b'?'fixture-visitor-b':'fixture-visitor-a'};}\nexport async function authorizeOperator(request){return {inspect:true,manageNotices:request.headers.get('X-Fixture-Operator')!=='reader'};}\n`);
 let worker=await readFile(directory+'/worker.mjs','utf8');
 worker=worker.replace('export default {fetch:createCookieHost({release,authorizeVisitor,authorizeOperator})};',`const application=createCookieHost({release,authorizeVisitor,authorizeOperator});let fault='online';
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path.startsWith('/__fixture/')&&request.method==='POST'&&request.headers.get('X-Fixture-Key')===env.RUNTIME_KEY){const next=path.slice('/__fixture/'.length);if(!['online','offline','lose'].includes(next))return new Response(null,{status:400});fault=next;return new Response(null,{status:204});}
 if(path==='/api/cookies/record'&&fault==='offline')return Response.json({code:'unavailable'},{status:503,headers:{'Cache-Control':'private, no-store'}});
 const response=await application(request,env);
 if(path==='/api/cookies/record'&&fault==='lose'&&response.ok)return Response.json({code:'unavailable'},{status:503,headers:{'Cache-Control':'private, no-store'}});
 return response;
}};`);
 await writeFile(directory+'/worker.mjs',worker);await start();
 const operatorPage=await fetch(origin+'/backoffice',{redirect:'manual'});assert.equal(operatorPage.status,200);assert.equal(operatorPage.headers.get('Location'),null);assert.equal(await operatorPage.text(),release.operatorHtml);
 const initial=await call('/api/cookies/bootstrap'),headers={'X-Notabenda-Stream':initial.head.streamRef},first=command(initial.head);
 assert.equal((await call('/backoffice/register')).created,true);assert.equal((await call('/backoffice/register')).created,false);
 assert.equal((await call('/api/cookies/record',first,409,headers)).code,'stale-notice');await call('/backoffice/activate',{},403,{'X-Fixture-Operator':'reader'});await call('/backoffice/activate');
 await fault('offline');await call('/api/cookies/record',first,503,headers);assert.equal((await call('/api/cookies/head',{},200,headers)).revision,0);
 await fault('lose');await call('/api/cookies/record',first,503,headers);assert.equal((await call('/api/cookies/head',{},200,headers)).revision,1);
 await fault('online');const committed=await call('/api/cookies/record',first,200,headers);assert.equal(committed.head.revision,1);
 const b=await call('/api/cookies/bootstrap',{},200,{Cookie:'fixture-visitor=b'});assert.notEqual(b.head.streamRef,initial.head.streamRef);assert.equal(b.head.revision,0);
 assert.equal((await call('/api/cookies/record',first,403,{...headers,Cookie:'fixture-visitor=b'})).code,'context-changed');
 await stop();await start();assert.equal((await call('/api/cookies/head',{},200,headers)).revision,1);
 const refusal=command(committed.head,'revoke-all'),declined=await call('/api/cookies/record',refusal,200,headers);assert.equal(declined.head.revision,2);
 assert.equal((await call('/api/cookies/record',first,200,headers)).head.revision,2);
 const detail=await fetch(origin+'/backoffice/choices/record?id='+committed.receipt.id);assert.equal(detail.status,200);assert.ok((await detail.text()).includes(release.notice.wording.summary));
 for(const path of ['consent-runtime.json','consent-notice.json','artifacts/'+release.notice.artifactId+'.json','artifacts/'+release.notice.artifactId+'/consent/'+release.notice.noticeId+'.json',...['privacy','cookies'].map(kind=>release.notice.documents[kind].url.slice(1))]){const response=await fetch(origin+'/'+path);assert.equal(response.status,200);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array(await readFile(directory+'/public/'+path)));}
 const report={kind:'recorded-cookie-application-runtime',passed:true,defaultAuthorizationDenied:true,registrationSeparateFromActivation:true,preCommitOutageRevision:0,postCommitLostResponseRevision:1,exactRetryRevision:1,refusalRevision:2,identitySwitchRejected:true,sqliteRestart:true,pinnedFilesExact:true,realProvider:false};
 await writeFile(directory+'/report.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
 console.log('Recorded-cookie example passed local SQLite: default denial, separate registration/activation, real RPC errors, pre/post-commit faults, exact retry, identity fencing, restart and archived notice inspection.');
 console.log('Private disposable report: '+directory+'/report.json');
 if(args[0]==='--serve'){
  console.log('Owned browser preview at '+origin+'; synthetic test authorization only. Ctrl-C stops only this fixture.');
  await new Promise(done=>{process.once('SIGINT',done);process.once('SIGTERM',done);});
 }
}catch(error){console.error(output.replaceAll(capability,'<redacted>').slice(-2200));throw error;}finally{await stop();}
