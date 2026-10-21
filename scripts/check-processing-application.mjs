// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
// Optional maintainer run. Fixture authorization/fault injection is confined to a disposable copy.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,readdir,copyFile,symlink} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),source=resolve(root,'examples/processing-application'),port=Number(process.env.NOTABENDA_PROCESSING_PORT??4188);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use an owned loopback test port from 4181 to 4190.');
const args=process.argv.slice(2);if(args.length>1||args.length===1&&args[0]!=='--serve')throw Error('Only --serve is supported.');
await new Promise((done,reject)=>{const probe=createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(done));});
const origin='http://127.0.0.1:'+port,directory=resolve(root,'.local/processing-application-runtime-'+randomUUID()),capability=randomBytes(32).toString('hex');
await mkdir(directory,{recursive:true,mode:0o700});
for(const entry of await readdir(source,{withFileTypes:true}))if(entry.isFile())await copyFile(resolve(source,entry.name),resolve(directory,entry.name));
await symlink(resolve(root,'node_modules'),directory+'/node_modules','dir');
const built=spawnSync(process.execPath,[directory+'/build.mjs','--preview'],{cwd:directory,encoding:'utf8',env:{...process.env,npm_config_update_notifier:'false'}});assert.equal(built.status,0,built.stderr);
const config=JSON.parse(await readFile(directory+'/wrangler.json','utf8'));config.vars={APP_ORIGIN:origin,RUNTIME_KEY:capability};await writeFile(directory+'/wrangler.json',JSON.stringify(config,null,2)+'\n',{mode:0o600});
const release=(await import('file://'+directory+'/.generated/release.mjs')).default;
let child,output='';
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',directory+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',directory+'/state'],{cwd:directory,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:directory+'/logs'},stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Processing application runtime did not become ready.')),25000);const consume=chunk=>{output=(output+chunk).slice(-10000);if(output.includes('Ready on '+origin+'\n')){clearTimeout(timer);done();}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Runtime exited before ready ('+code+').'));});});
}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const current=child;await new Promise(done=>{const timer=setTimeout(()=>current.kill('SIGKILL'),5000);current.once('exit',()=>{clearTimeout(timer);done();});current.kill('SIGINT');});}
async function call(path,input={},status=200,extra={}){
 const r=await fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Request':'1',...extra},body:JSON.stringify(input),signal:AbortSignal.timeout(10000)}),text=await r.text();assert.equal(r.status,status,path+': '+text.slice(0,300));assert.equal(r.headers.get('cache-control'),'private, no-store');return JSON.parse(text);
}
const command=(activities=release.notice.activities)=>({schemaVersion:1,noticeId:release.notice.noticeId,requestId:randomUUID(),activities:[...activities]});
const fault=async mode=>{const r=await fetch(origin+'/__fixture/'+mode,{method:'POST',headers:{'X-Fixture-Key':capability}});assert.equal(r.status,204);};
const admin=async()=>{const r=await fetch(origin+'/backoffice/data');assert.equal(r.status,200);return r.json();};
const covered=data=>data.deliveries.filter(e=>e.serviceId==='ad-service');
try{
 await start();
 const first=await fetch(origin+'/',{headers:{'Sec-GPC':'1'}});assert.equal(first.status,200);assert.equal(first.headers.get('X-Example-Processing'),'blocked');assert.equal(first.headers.get('X-Example-Persistence'),'unconfirmed');assert.match(await first.text(),/"observed":true/);
 await call('/api/processing/bootstrap',{},503);await call('/backoffice/register',{},403);assert.equal((await fetch(origin+'/backoffice')).status,403);
 for(const path of ['/operator','/operator/','/operator.html','/operator/index.html'])assert.equal((await fetch(origin+path,{redirect:'manual'})).status,404);
 for(const path of ['/privacy','/cookies','/terms'])assert.equal((await fetch(origin+path)).status,200);
 await stop();
 // These contexts are test fixtures, never production authentication or cookie issuance.
 await writeFile(directory+'/authorize.mjs',`export async function resolveVisitor(request){return {streamId:request.headers.get('Cookie')==='fixture-visitor=b'?'fixture-visitor-b':'fixture-visitor-a'};}\nexport async function authorizeOperator(request){return {inspect:true,manageNotices:request.headers.get('X-Fixture-Operator')!=='reader',dispatch:request.headers.get('X-Fixture-Operator')!=='reader'};}\n`);
 let worker=await readFile(directory+'/worker.mjs','utf8');
 worker=worker.replace('export default {fetch:createProcessingHost({release,resolveVisitor,authorizeOperator})};',`const application=createProcessingHost({release,resolveVisitor,authorizeOperator});let transport='online';
export default {async fetch(request,env){const path=new URL(request.url).pathname;
 if(path.startsWith('/__fixture/')&&request.method==='POST'&&request.headers.get('X-Fixture-Key')===env.RUNTIME_KEY){const mode=path.slice('/__fixture/'.length);if(!['online','write','lose-send','lose-record','offline-record'].includes(mode))return new Response(null,{status:400});transport=mode;await env.EVIDENCE.getByName('processing:'+release.notice.siteId).__setFault(mode);return new Response(null,{status:204});}
 if(path==='/api/processing/record'&&transport==='offline-record')return Response.json({code:'unavailable'},{status:503,headers:{'Cache-Control':'private, no-store'}});
 const response=await application(request,env);
 if(path==='/api/processing/record'&&transport==='lose-record'&&response.ok)return Response.json({code:'unavailable'},{status:503,headers:{'Cache-Control':'private, no-store'}});
 return response;}};`);
 worker=worker.replace('this.workspace=createProcessingWorkspace(ctx.storage,release,',`this.fault='online';const storage=new Proxy(ctx.storage,{get:(target,key)=>key==='transaction'?work=>target.transaction(tx=>work(new Proxy(tx,{get:(t,k)=>k==='put'?(name,value)=>{if(this.fault==='write'&&name.includes('/events/'))throw Error('Injected ledger write failure.');return t.put(name,value);}:typeof t[k]==='function'?t[k].bind(t):t[k]}))):typeof target[key]==='function'?target[key].bind(target):target[key]});this.workspace=createProcessingWorkspace(storage,release,`);
 worker=worker.replace('return result.value;','if(this.fault===\'lose-send\')throw Error(\'Injected lost sink acknowledgment.\');return result.value;');
 worker=worker.replace('  async read(streamId)',"  async __setFault(mode){this.fault=mode;}\n  async read(streamId)");
 await writeFile(directory+'/worker.mjs',worker);await start();
 let data=await admin();assert.equal(covered(data).length,0);assert.equal(data.deliveries.filter(e=>e.serviceId==='operational').length,1,'default first navigation reached the unrelated sink');
 await call('/backoffice/register',{},403,{'X-Fixture-Operator':'reader'});assert.equal((await call('/backoffice/register')).created,true);assert.equal((await call('/backoffice/register')).created,false);
 const page=await fetch(origin+'/backoffice',{redirect:'manual'});assert.equal(page.status,200);assert.equal(await page.text(),release.operatorHtml);
 const boot=await call('/api/processing/bootstrap'),a={'X-Notabenda-Stream':boot.head.streamRef};assert.equal(boot.head.revision,0);
 const queued=await call('/api/processing/queue',{},200,a);
 await fault('write');await call('/api/processing/record',command(),503,a);await stop();await start();
 assert.equal((await call('/api/processing/bootstrap')).persistence,'unconfirmed');await call('/api/processing/head',{},503,a);
 assert.equal((await call('/backoffice/dispatch',{deliveryId:queued.deliveryId})).state,'suppressed');assert.equal(covered(await admin()).length,0);
 const input=command(['sale']);await fault('lose-record');await call('/api/processing/record',input,503,a);await fault('online');const receipt=await call('/api/processing/record',input,200,a);assert.equal(receipt.head.revision,1);assert.equal(receipt.receipt.provenance,'browser-report');
 // Earlier full intent remains fenced until both requested activities are confirmed.
 assert.equal((await call('/api/processing/bootstrap')).persistence,'unconfirmed');
 const gpc=await fetch(origin+'/',{headers:{'Sec-GPC':'1'}});assert.equal(gpc.headers.get('X-Example-Processing'),'blocked');assert.equal(gpc.headers.get('X-Example-Persistence'),'confirmed');
 const head=await call('/api/processing/head',{},200,a);assert.equal(head.revision,2);assert.equal(head.event.provenance,'gpc-header');assert.deepEqual(head.event.restrictions,['sale','targeted-advertising']);
 await fetch(origin+'/',{headers:{'Sec-GPC':'1'}});assert.equal((await call('/api/processing/head',{},200,a)).revision,2);
 const b=await call('/api/processing/bootstrap',{},200,{Cookie:'fixture-visitor=b'}),bh={'X-Notabenda-Stream':b.head.streamRef,Cookie:'fixture-visitor=b'};assert.equal(b.head.revision,0);assert.notEqual(b.head.streamRef,boot.head.streamRef);
 assert.equal((await call('/api/processing/record',command(),403,{...a,Cookie:'fixture-visitor=b'})).code,'context-changed');
 await fault('lose-send');const uncertain=await call('/api/processing/client',{},200,bh);assert.equal(uncertain.state,'uncertain');data=await admin();assert.equal(covered(data).length,1);assert.equal(covered(data)[0].attempts,1);
 await call('/api/processing/record',command(),200,bh);await stop();await start();const retry=await call('/backoffice/dispatch',{deliveryId:uncertain.deliveryId});assert.equal(retry.state,'uncertain');assert.equal(retry.reason,'retained-restriction');assert.equal(retry.attempts,1);assert.equal(covered(await admin())[0].attempts,1);
 assert.equal((await call('/api/processing/client',{},200,a)).state,'blocked');
 const detail=await fetch(origin+'/backoffice/processing/record?id='+receipt.receipt.id);assert.equal(detail.status,200);const content=await detail.text();assert.ok(content.includes(release.notice.wording.description));assert.match(content,/browser-report/);assert.ok(content.includes(release.notice.document.url));
 for(const path of ['consent-runtime.json','processing-notice.json','artifacts/'+release.notice.artifactId+'.json','artifacts/'+release.notice.artifactId+'/processing/'+release.notice.noticeId+'.json',release.notice.document.url.slice(1)]){const r=await fetch(origin+'/'+path);assert.equal(r.status,200);assert.deepEqual(new Uint8Array(await r.arrayBuffer()),new Uint8Array(await readFile(directory+'/public/'+path)));}
 const report={kind:'processing-application-runtime',passed:true,firstAnonymousGpcBlocks:true,unrelatedProducerReceived:true,defaultOperatorDenied:true,pendingFenceSurvivesSqliteRestart:true,queuedBeforeRestrictionSuppressed:true,browserHeaderProvenanceSeparate:true,exactRetry:true,secondContextIsolated:true,sinkCommitLostAck:true,retryAfterOptOutNotTransmitted:true,pinnedFilesExact:true,realProvider:false};
 await writeFile(directory+'/report.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});console.log('Processing application passed local SQLite: first-navigation signal, durable failure fence, queued dispatch, exact retry, separate provenance, context isolation, uncertain sink delivery and restart.');console.log('Private disposable report: '+directory+'/report.json');
 if(args[0]==='--serve'){console.log('Owned browser preview at '+origin+'; synthetic host context only. Ctrl-C stops this fixture.');await new Promise(done=>{process.once('SIGINT',done);process.once('SIGTERM',done);});}
}catch(error){console.error(output.replaceAll(capability,'<redacted>').slice(-2200));throw error;}finally{await stop();}
