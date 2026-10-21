// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CONSENT-NOTICE-FILES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {readSiteConfig} from '@notabenda/core/config/node';
import {compileLegalDocuments,createConsentNoticeFiles,compileConsentRuntimeConfig} from '@notabenda/core/content';
import {createConsentEvidenceStore} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {createCookieHost} from '../../../examples/recorded-cookies/host.mjs';
import {createCookieWorkspace,cookieReply} from '../../../examples/recorded-cookies/workspace.mjs';
import {authorizeVisitor,authorizeOperator} from '../../../examples/recorded-cookies/authorize.mjs';
const directory=new URL('../../../examples/recorded-cookies/',import.meta.url),origin='https://cookies.example.test';
const config=await readSiteConfig(new URL('notabenda.config.yaml',directory).pathname,{mode:'preview'}),artifact=compileLegalDocuments(config,{mode:'preview'}).artifact;
const release={artifact,notice:createConsentNoticeFiles(artifact,{scopeId:'cookie-choices'},{mode:'preview'}).notice,runtime:compileConsentRuntimeConfig(config,{mode:'preview',evidence:'required'}),operatorHtml:await readFile(new URL('operator.html',directory),'utf8')};
const query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};
async function setup({visitor='visitor-a',operator={inspect:true,manageNotices:true},defaults=false}={}){
 const storage=createSyntheticStorage([]),workspace=createCookieWorkspace(storage,release),names=[],identity={visitor,operator};
 const rpc=Object.fromEntries(['read','record','register','activate'].map(name=>[name,(...args)=>cookieReply(()=>workspace[name](...args))]));rpc.inspect=(...args)=>workspace.inspect(...args);
 const env={EVIDENCE:{getByName(name){names.push(name);return rpc;}},ASSETS:{fetch:async()=>new Response('Public example asset')}};
 const host=createCookieHost({release,authorizeVisitor:defaults?authorizeVisitor:async()=>identity.visitor?{streamId:identity.visitor}:null,authorizeOperator:defaults?authorizeOperator:async()=>identity.operator});
 const call=async(path,input={},extra={})=>host(new Request(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Request':'1',...extra},body:JSON.stringify(input)}),env);
 const bootstrap=async()=>{const r=await call('/api/cookies/bootstrap');assert.equal(r.status,200);return r.json();};
 const command=(head,action='accept-all')=>({schemaVersion:1,noticeId:release.notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:head.revision,action,choices:Object.fromEntries(Object.keys(release.notice.scopes).map(k=>[k,action==='accept-all'])),clientAt:new Date().toISOString()});
 const records=()=>createConsentEvidenceStore(storage,{siteId:release.notice.siteId,allowPreview:true}).list(query);
 return {storage,workspace,env,names,identity,host,call,bootstrap,command,records};
}
test('unchanged example hooks deny visitor/operator access before storage while public pages remain usable',async()=>{
 const f=await setup({defaults:true});
 for(const path of ['/api/cookies/bootstrap','/api/cookies/head','/api/cookies/record','/backoffice/register','/backoffice/activate'])assert.equal((await f.call(path)).status,403);
 for(const path of ['/backoffice','/backoffice/choices'])assert.equal((await f.host(new Request(origin+path),f.env)).status,403);
 assert.deepEqual(f.names,[]);assert.equal((await f.host(new Request(origin+'/privacy'),f.env)).status,200);for(const path of ['/operator','/operator/','/operator.html','/operator/index.html'])assert.equal((await f.host(new Request(origin+path),f.env)).status,404);
});
test('fixed-origin, method, JSON and streamed UTF-8 byte limits precede any object lookup',async()=>{
 const f=await setup();
 for(const headers of [{Origin:'https://outside.example.test'},{Origin:''},{'X-Notabenda-Request':''}])assert.equal((await f.call('/api/cookies/bootstrap',{},headers)).status,403);
 assert.equal((await f.call('/api/cookies/bootstrap',{}, {'Content-Type':'text/plain'})).status,415);
 assert.equal((await f.call('/api/cookies/bootstrap',{streamId:'visitor-b'})).status,400);
 assert.equal((await f.host(new Request(origin+'/api/cookies/head'),f.env)).status,405);
 const bytes=new TextEncoder().encode(JSON.stringify({value:'é'.repeat(4500)}));
 const stream=new ReadableStream({start(c){c.enqueue(bytes.slice(0,4096));c.enqueue(bytes.slice(4096));c.close();}});
 const oversized=await f.host(new Request(origin+'/api/cookies/record',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Request':'1'},body:stream,duplex:'half'}),f.env);assert.equal(oversized.status,413);
 assert.equal((await f.host(new Request('https://outside.example.test/api/cookies/bootstrap',{method:'POST',headers:{Origin:'https://outside.example.test',Host:'cookies.example.test','Content-Type':'application/json','X-Notabenda-Request':'1'},body:'{}'}),f.env)).status,400);assert.deepEqual(f.names,[]);
});
test('fixed release registration is idempotent and separate from activation, recording and read-only operator access',async()=>{
 const f=await setup(),initial=await f.bootstrap(),command=f.command(initial.head),headers={'X-Notabenda-Stream':initial.head.streamRef};
 assert.equal((await f.call('/backoffice/register')).status,200);assert.equal((await f.call('/backoffice/register')).status,200);assert.equal((await f.call('/api/cookies/record',command,headers)).status,409);assert.equal((await f.records()).records.length,0);
 f.identity.operator={inspect:true};assert.equal((await f.call('/backoffice/activate')).status,403);f.identity.operator.manageNotices=true;
 const panel=await f.host(new Request(origin+'/backoffice'),f.env);assert.equal(panel.status,200);assert.equal(panel.headers.get('cache-control'),'private, no-store');assert.equal(await panel.text(),release.operatorHtml);
 const head=await f.host(new Request(origin+'/backoffice',{method:'HEAD'}),f.env);assert.equal(head.status,200);assert.equal(await head.text(),'');
 assert.equal((await f.call('/backoffice/activate',{noticeId:'another'})).status,400);assert.equal((await f.call('/backoffice/activate')).status,200);
 const response=await f.call('/api/cookies/record',command,headers),result=await response.json();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('access-control-allow-origin'),null);
 assert.deepEqual(await (await f.call('/api/cookies/record',command,headers)).json(),result);assert.equal((await f.records()).records.length,1);
 const detail=await f.host(new Request(origin+'/backoffice/choices/record?id='+result.receipt.id),f.env);assert.equal(detail.status,200);assert.equal(detail.headers.get('cache-control'),'private, no-store');const html=await detail.text();assert.ok(html.includes(release.notice.wording.summary));assert.ok(html.includes(release.notice.documents.privacy.url));assert.ok(f.names.every(n=>n==='notabenda:'+release.notice.siteId));
});
test('browser digest is a session precondition; forged authority fields and identity switches cannot record into another stream',async()=>{
 const f=await setup();await f.workspace.register();await f.workspace.activate();const a=await f.bootstrap(),request=f.command(a.head);
 f.identity.visitor='visitor-b';
 for(const path of ['/api/cookies/head','/api/cookies/record']){const r=await f.call(path,path.endsWith('record')?request:{},{'X-Notabenda-Stream':a.head.streamRef});assert.equal(r.status,403);assert.deepEqual(await r.json(),{code:'context-changed'});}
 const b=await f.bootstrap();assert.notEqual(a.head.streamRef,b.head.streamRef);assert.equal(b.head.revision,0);
 assert.equal((await f.call('/api/cookies/record',{...f.command(b.head),streamId:'visitor-a'},{'X-Notabenda-Stream':b.head.streamRef})).status,409);assert.equal((await f.records()).records.length,0);
 assert.equal((await f.call('/api/cookies/record',f.command(b.head),{'X-Notabenda-Stream':b.head.streamRef})).status,200);
 f.identity.visitor='visitor-a';assert.equal((await f.bootstrap()).head.revision,0);f.identity.visitor=null;assert.equal((await f.call('/api/cookies/record',request,{'X-Notabenda-Stream':a.head.streamRef})).status,403);
});
test('RPC replies preserve allowlisted protocol errors and normalize nested retained objects without leaking exception text',async()=>{
 assert.deepEqual(await cookieReply(async()=>Object.assign(Object.create(null),{value:1})),{ok:true,value:{value:1}});
 assert.deepEqual(await cookieReply(async()=>{throw Object.assign(Error('private exception details'),{code:'revision-conflict'});}),{ok:false,code:'revision-conflict'});
 assert.deepEqual(await cookieReply(async()=>{throw Error('private exception details');}),{ok:false,code:'unavailable'});
});

const browserBundle=(await build({entryPoints:[new URL('client.mjs',directory).pathname],bundle:true,platform:'browser',format:'iife',target:'es2022',write:false})).outputFiles[0].text;
const page=await readFile(new URL('index.html',directory),'utf8');
const pause=()=>new Promise(done=>setImmediate(done));
async function until(check){for(let n=0;n<100;n++){if(check())return;await pause();}assert.fail('Expected browser state did not arrive.');}
async function browser(f,{saved=[],intercept}={}){
 const dom=new JSDOM(page,{url:origin,runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.AbortController=AbortController;
 // This client clones JSON configuration snapshots; JSDOM lacks the browser structuredClone API.
 w.structuredClone=value=>w.JSON.parse(w.JSON.stringify(value));
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const [k,v] of saved)w.localStorage.setItem(k,v);
 w.fetch=async(path,options)=>{
  const forward=()=>f.host(new Request(origin+path,{method:options.method,headers:{Origin:origin,...options.headers},body:options.body}),f.env);
  const r=await (intercept?intercept(path,options,forward):forward());
  return {ok:r.ok,status:r.status,json:async()=>w.JSON.parse(await r.text())};
 };
 w.eval(browserBundle);
 const button=text=>[...w.document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
 const on=()=>[...w.document.querySelectorAll('[data-service]')].every(n=>n.textContent==='On');
 const off=()=>[...w.document.querySelectorAll('[data-service]')].every(n=>n.textContent==='Off');
 return {w,dom,button,on,off,saved:()=>Object.entries(w.localStorage),close(){w.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:false}));dom.window.close();}};
}
test('bundled client gates service startup on acknowledgment; reload never sends an uncommitted grant',async()=>{
 const f=await setup();await f.workspace.register();await f.workspace.activate();let fail=true,writes=0;
 const intercept=(path,_options,forward)=>{if(path.endsWith('/record')){writes++;if(fail)return Promise.reject(Error('Pre-commit outage'));}return forward();};
 let b=await browser(f,{intercept});
 try{await until(()=>b.button(release.notice.wording.acceptLabel));assert.equal(b.off(),true);b.button(release.notice.wording.acceptLabel).click();await until(()=>writes===1);assert.equal(b.off(),true);assert.equal((await f.records()).records.length,0);const saved=b.saved();b.close();
  fail=false;b=await browser(f,{saved,intercept});await until(()=>b.button(release.notice.wording.acceptLabel));for(let n=0;n<10;n++)await pause();assert.equal(writes,1);assert.equal(b.off(),true);b.button(release.notice.wording.acceptLabel).click();await until(()=>b.on());assert.equal((await f.records()).records.length,1);
 }finally{b.close();}
});
test('post-commit response loss recovers through head after reload; withdrawal stays restrictive while its write is offline',async()=>{
 const f=await setup();await f.workspace.register();await f.workspace.activate();let mode='lose',writes=0;
 const intercept=async(path,_options,forward)=>{if(!path.endsWith('/record'))return forward();writes++;if(mode==='offline')throw Error('Before commit');const r=await forward();if(mode==='lose')throw Error('Lost after commit');return r;};
 let b=await browser(f,{intercept});
 try{await until(()=>b.button(release.notice.wording.acceptLabel));b.button(release.notice.wording.acceptLabel).click();await until(()=>writes===1);await until(()=>b.w.document.querySelector('#connection').textContent.includes('unavailable'));assert.equal(b.off(),true);assert.equal((await f.records()).records.length,1);const saved=b.saved();b.close();
  mode='online';b=await browser(f,{saved,intercept});await until(()=>b.on());assert.equal(writes,1);assert.equal((await f.records()).records.length,1);
  mode='offline';b.w.document.querySelector('#preferences').click();b.button(release.notice.wording.rejectLabel).click();await until(()=>b.off());await until(()=>writes===2);assert.equal((await f.records()).records.length,1);
  b.w.dispatchEvent(new b.w.Event('application-session-changed'));await until(()=>b.off());assert.equal(b.w.document.querySelector('#preferences').disabled,true);
 }finally{b.close();}
});
test('late grant acknowledgment cannot restart services after withdrawal; another visitor cannot reuse the saved local grant',async()=>{
 const f=await setup();await f.workspace.register();await f.workspace.activate();let releaseGrant,committed=false;
 const barrier=new Promise(done=>{releaseGrant=done;}),seen=[];
 const intercept=async(path,options,forward)=>{
  if(!path.endsWith('/record'))return forward();
  const command=JSON.parse(options.body);seen.push(command);const r=await forward();
  if(command.action==='accept-all'){committed=true;await barrier;}return r;
 };
 let b=await browser(f,{intercept});
 try{
  await until(()=>b.button(release.notice.wording.acceptLabel));b.button(release.notice.wording.acceptLabel).click();await until(()=>committed);assert.equal(b.off(),true);
  b.w.document.querySelector('#preferences').click();b.button(release.notice.wording.rejectLabel).click();await until(()=>seen.length===2);await until(()=>b.w.document.querySelector('#connection').textContent==='Choice recorded');
  releaseGrant();for(let n=0;n<10;n++)await pause();assert.equal(b.off(),true);assert.equal((await f.records()).records.length,2);assert.notEqual(seen[0].requestId,seen[1].requestId);
  // Obtain a fresh recorded grant, then switch the trusted host identity while preserving this tab's storage.
  b.close();b=await browser(f);await until(()=>b.button(release.notice.wording.acceptLabel));b.button(release.notice.wording.acceptLabel).click();await until(()=>b.on());const saved=b.saved();
  f.identity.visitor='visitor-b';b.w.document.querySelector('#preferences').click();b.button(release.notice.wording.rejectLabel).click();await until(()=>b.w.document.querySelector('#connection').textContent.includes('session changed'));await until(()=>b.off());
  assert.equal((await f.bootstrap()).head.revision,0);b.close();b=await browser(f,{saved});await until(()=>b.button(release.notice.wording.acceptLabel));for(let n=0;n<10;n++)await pause();assert.equal(b.off(),true);assert.equal((await f.bootstrap()).head.revision,0);
 }finally{releaseGrant();b.close();}
});
