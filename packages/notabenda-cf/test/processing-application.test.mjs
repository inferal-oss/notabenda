// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {readSiteConfig} from '@notabenda/core/config/node';
import {compileLegalDocuments,createProcessingNotice,compileConsentRuntimeConfig} from '@notabenda/core/content';
import {getProcessingNotice,createProcessingRestrictionStore} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {createProcessingWorkspace,createDeliverySink,processingReply} from '../../../examples/processing-application/workspace.mjs';
import {createProcessingHost} from '../../../examples/processing-application/host.mjs';
import {resolveVisitor,authorizeOperator} from '../../../examples/processing-application/authorize.mjs';
const directory=new URL('../../../examples/processing-application/',import.meta.url),origin='https://processing.example.test';
const config=await readSiteConfig(new URL('notabenda.config.yaml',directory).pathname,{mode:'preview'}),artifact=compileLegalDocuments(config,{mode:'preview'}).artifact;
const release={artifact,runtime:compileConsentRuntimeConfig(config,{mode:'preview',evidence:'local'}),notice:createProcessingNotice(artifact,{scopeId:'privacy-choices',activities:['sale','targeted-advertising'],wording:{title:'Your privacy choices',description:'Restrictions in a synthetic application.',actionLabel:'Opt out of sale and targeted advertising'}},{mode:'preview'}),operatorHtml:await readFile(new URL('operator.html',directory),'utf8')};
const html=await readFile(new URL('index.html',directory),'utf8'),query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};
const command=(activities=release.notice.activities)=>({schemaVersion:1,noticeId:release.notice.noticeId,requestId:crypto.randomUUID(),activities:[...activities]});
async function setup({defaults=false}={}){
  const raw=createSyntheticStorage([]),sinkStorage=createSyntheticStorage([]),sink=createDeliverySink(sinkStorage),fault={read:false,write:false,lose:false};
  const storage={...raw,transaction:work=>raw.transaction(tx=>work({...tx,async get(key){if(fault.read)throw Error('Read unavailable.');return tx.get(key);},async put(key,value){if(fault.write&&key.includes('/events/'))throw Error('Write unavailable.');return tx.put(key,value);}})),get:key=>raw.get(key)};
  let workspace=createProcessingWorkspace(storage,release,{send:async event=>{const result=await sink.receive(event);if(fault.lose)throw Error('Response lost.');return result;}});
  const names=[],identity={visitor:'visitor-a',operator:{inspect:true,manageNotices:true,dispatch:true}};
  const rpc=Object.fromEntries(['read','pending','record','observe','produce','enqueue','dispatch','jobs','register'].map(name=>[name,(...args)=>processingReply(()=>workspace[name](...args))]));rpc.inspect=(...args)=>workspace.inspect(...args);
  const env={EVIDENCE:{getByName(name){names.push(['evidence',name]);return rpc;}},DELIVERIES:{getByName(name){names.push(['sink',name]);return {receive:input=>processingReply(()=>sink.receive(input)),observations:()=>processingReply(()=>sink.observations())};}},ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname==='/'?html:'Static legal asset',{headers:{'Content-Type':'text/html; charset=utf-8'}})}};
  const host=createProcessingHost({release,resolveVisitor:defaults?resolveVisitor:async()=>identity.visitor?{streamId:identity.visitor}:null,authorizeOperator:defaults?authorizeOperator:async()=>identity.operator});
  const call=(path,input={},extra={})=>host(new Request(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Request':'1',...extra},body:JSON.stringify(input)}),env);
  const records=()=>createProcessingRestrictionStore(raw,{siteId:release.notice.siteId,allowPreview:true}).list(query);
  return {raw,storage,sink,fault,get workspace(){return workspace;},restart(){workspace=createProcessingWorkspace(storage,release,{send:async event=>{const result=await sink.receive(event);if(fault.lose)throw Error();return result;}});},names,identity,rpc,env,host,call,records};
}

test('first anonymous GPC navigation blocks covered work before rendering without Origin, login, context or a receipt',async()=>{
  const f=await setup({defaults:true}),response=await f.host(new Request(origin+'/',{headers:{'Sec-GPC':'1'}}),f.env);assert.equal(response.status,200);assert.equal(response.headers.get('X-Example-Processing'),'blocked');assert.equal(response.headers.get('X-Example-Persistence'),'unconfirmed');assert.match(await response.text(),/"observed":true/);
  assert.deepEqual((await f.sink.observations()).map(e=>e.serviceId),['operational']);assert.equal(f.names.some(([kind])=>kind==='evidence'),false);
  assert.equal((await f.host(new Request(origin+'/backoffice'),f.env)).status,403);assert.equal((await f.call('/api/processing/bootstrap')).status,503);for(const path of ['/operator','/operator/','/operator.html','/operator/index.html'])assert.equal((await f.host(new Request(origin+path),f.env)).status,404);
});

test('registered-notice lookup is read-only, scoped, detached and refuses a broken archive',async()=>{
  const f=await setup(),context={siteId:release.notice.siteId,scopeId:release.notice.scopeId,allowPreview:true};assert.equal(await getProcessingNotice(f.raw,release.notice.noticeId,context),undefined);
  await f.workspace.register();const notice=await getProcessingNotice(f.raw,release.notice.noticeId,context);notice.wording.title='Changed';assert.equal((await getProcessingNotice(f.raw,release.notice.noticeId,context)).wording.title,release.notice.wording.title);
  await assert.rejects(getProcessingNotice(f.raw,release.notice.noticeId,{...context,scopeId:'other'}));await assert.rejects(getProcessingNotice(f.raw,release.notice.noticeId,{...context,allowPreview:false}));
  assert.equal((await f.records()).records.length,0);await f.raw.delete('notabenda/releases/'+release.notice.artifactId);await assert.rejects(getProcessingNotice(f.raw,release.notice.noticeId,context));assert.equal((await f.workspace.produce('visitor-a')).state,'blocked');
});

test('manual browser reports and actual header observations accumulate without forging source or context',async()=>{
  const f=await setup();await f.workspace.register();const boot=await (await f.call('/api/processing/bootstrap')).json(),precondition={'X-Notabenda-Stream':boot.head.streamRef};
  const result=await (await f.call('/api/processing/record',command(['sale']),precondition)).json();assert.equal(result.receipt.provenance,'browser-report');
  const first=await f.host(new Request(origin+'/',{headers:{'Sec-GPC':'1'}}),f.env);assert.equal(first.headers.get('X-Example-Processing'),'blocked');const current=await f.workspace.read('visitor-a');assert.deepEqual(current.event.restrictions,['sale','targeted-advertising']);assert.equal(current.event.provenance,'gpc-header');
  await f.host(new Request(origin+'/',{headers:{'Sec-GPC':'1'}}),f.env);assert.equal((await f.workspace.read('visitor-a')).revision,2,'repeated observation is not another action');
  for(const extra of [{streamId:'visitor-b'},{provenance:'gpc-header'}])assert.equal((await f.call('/api/processing/record',{...command(),...extra},precondition)).status,400);
  f.identity.visitor='visitor-b';assert.equal((await f.call('/api/processing/record',command(),precondition)).status,403);assert.equal((await f.workspace.read('visitor-b')).revision,0);assert.equal((await f.workspace.produce('visitor-b')).state,'delivered');assert.equal((await f.workspace.produce('visitor-a')).state,'blocked');
});

test('queue dispatch rereads committed restrictions, while admitted prior calls cannot be recalled',async()=>{
  const f=await setup();await f.workspace.register();const queued=await f.workspace.enqueue('visitor-a');await f.workspace.record('visitor-a',command());const blocked=await f.workspace.dispatch(queued.deliveryId);assert.equal(blocked.state,'suppressed');assert.equal(blocked.attempts,0);assert.equal((await f.sink.observations()).length,0);
  let entered,finish;const started=new Promise(r=>entered=r),hold=new Promise(r=>finish=r);const separate=createProcessingWorkspace(f.raw,release,{send:async event=>{entered();await hold;return f.sink.receive(event);}});const sending=separate.produce('visitor-c');await started;await separate.record('visitor-c',command());finish();assert.equal((await sending).state,'delivered');assert.equal((await separate.produce('visitor-c')).state,'blocked');assert.equal((await f.sink.observations()).length,1);
});

test('write/read failures stay restrictive and do not poison later operations',async()=>{
  const f=await setup();await f.workspace.register();const queued=await f.workspace.enqueue('visitor-a');f.fault.write=true;await assert.rejects(f.workspace.observe('visitor-a'));assert.equal((await f.workspace.dispatch(queued.deliveryId)).state,'suppressed');assert.equal((await f.sink.observations()).length,0);
  f.fault.write=false;await f.workspace.observe('visitor-a');assert.equal((await f.workspace.read('visitor-a')).revision,1);const other=await f.workspace.enqueue('visitor-b');f.fault.read=true;assert.equal((await f.workspace.dispatch(other.deliveryId)).state,'suppressed');f.fault.read=false;assert.equal((await f.workspace.produce('visitor-b')).state,'delivered');
  f.fault.write=true;await assert.rejects(f.workspace.record('visitor-c',command()));assert.equal((await f.workspace.produce('visitor-c')).state,'blocked');f.fault.write=false;await f.workspace.record('visitor-c',command());assert.equal((await f.workspace.read('visitor-c')).revision,1);
});

test('uncertain deliveries keep original IDs and attempt bounds across restart; a later opt-out prevents retransmission',async()=>{
  const f=await setup();await f.workspace.register();f.fault.lose=true;const uncertain=await f.workspace.produce('visitor-a');assert.equal(uncertain.state,'uncertain');assert.equal((await f.sink.observations())[0].attempts,1);
  await f.workspace.record('visitor-a',command());f.restart();const retry=await f.workspace.dispatch(uncertain.deliveryId);assert.equal(retry.state,'uncertain');assert.equal(retry.reason,'retained-restriction');assert.equal(retry.attempts,1);assert.equal((await f.sink.observations())[0].attempts,1);
  const other=await f.workspace.produce('visitor-b');await f.workspace.dispatch(other.deliveryId);f.restart();await f.workspace.dispatch(other.deliveryId);await f.workspace.dispatch(other.deliveryId);const delivery=(await f.sink.observations()).find(e=>e.deliveryId===other.deliveryId);assert.equal(delivery.attempts,3);assert.equal((await f.workspace.jobs()).find(j=>j.deliveryId===other.deliveryId).attempts,3);
});

test('lost restriction acknowledgment retries the exact request once and admin inspection retains provenance and wording',async()=>{
  const f=await setup();await f.workspace.register();const input=command(),first=await f.workspace.record('visitor-a',input);f.restart();const retry=await f.workspace.record('visitor-a',structuredClone(input));assert.deepEqual(retry,first);assert.equal((await f.records()).records.length,1);
  const response=await f.host(new Request(origin+'/backoffice/processing/record?id='+first.receipt.id),f.env);assert.equal(response.status,200);const content=await response.text();assert.match(content,/browser-report/);assert.ok(content.includes(release.notice.wording.description));assert.ok(content.includes(release.notice.document.url));assert.equal((await f.workspace.produce('visitor-a')).state,'blocked');
});

test('mutation protections and bounded input run before object access',async()=>{
  const f=await setup();for(const headers of [{Origin:'https://outside.example.test'},{Origin:''},{'X-Notabenda-Request':''}])assert.equal((await f.call('/api/processing/bootstrap',{},headers)).status,403);
  assert.equal((await f.call('/api/processing/bootstrap',{streamId:'visitor-b'})).status,400);assert.equal((await f.call('/api/processing/bootstrap',{}, {'Content-Type':'text/plain'})).status,415);assert.equal((await f.host(new Request(origin+'/api/processing/bootstrap'),f.env)).status,405);
  const bytes=new TextEncoder().encode(JSON.stringify({extra:'é'.repeat(2500)})),stream=new ReadableStream({start(c){c.enqueue(bytes.slice(0,2000));c.enqueue(bytes.slice(2000));c.close();}});assert.equal((await f.host(new Request(origin+'/api/processing/record',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Notabenda-Request':'1'},body:stream,duplex:'half'}),f.env)).status,413);assert.deepEqual(f.names,[]);
});

const bundle=(await build({entryPoints:[new URL('client.mjs',directory).pathname],bundle:true,write:false,platform:'browser',format:'iife',target:'es2022'})).outputFiles[0].text;
async function browser(f,{signal=false,values=new Map()}={}){
  const dom=new JSDOM(html.replace('<!--PROCESSING_OBSERVATION-->','<script type="application/json" id="server-observation">{"observed":false,"covered":{"state":"blocked","reason":"unavailable"},"operational":"delivered","persistence":"unconfirmed"}</script>'),{url:origin,runScripts:'outside-only'});
  const window=dom.window;window.structuredClone=value=>window.JSON.parse(window.JSON.stringify(value));window.TextEncoder=TextEncoder;window.TextDecoder=TextDecoder;Object.defineProperty(window.navigator,'globalPrivacyControl',{value:signal});Object.defineProperty(window,'localStorage',{value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}});
  window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};window.fetch=async(path,options={})=>{const {signal,...init}=options,abort=new AbortController();if(signal?.aborted)abort.abort();else signal?.addEventListener('abort',()=>abort.abort(),{once:true});const response=await f.host(new Request(origin+path,{...init,signal:abort.signal,headers:{Origin:origin,...options.headers}}),f.env);return {ok:response.ok,status:response.status,json:async()=>window.JSON.parse(await response.text())};};
  window.eval(bundle);const wait=async predicate=>{for(let n=0;n<200;n++){if(predicate())return;await new Promise(r=>setTimeout(r,5));}assert.fail('Client state did not settle: '+window.document.getElementById('processing-state').textContent+'; '+window.document.getElementById('connection-state').textContent); };await wait(()=>window.document.getElementById('processing-state').textContent!=='Checking');return {dom,window,values,wait,close(){if(!window.document)return;window.dispatchEvent(new window.PageTransitionEvent('pagehide'));window.close();}};
}
test('browser-only GPC records a browser report, survives reload, and cookie accept cannot reopen covered producers',async()=>{
  const f=await setup();await f.workspace.register();const b=await browser(f,{signal:true});try{await b.wait(()=>b.window.document.getElementById('processing-state').textContent==='Restriction recorded');assert.equal((await f.workspace.read('visitor-a')).event.provenance,'browser-report');assert.equal((await f.sink.observations()).length,0);const accept=b.window.document.querySelector('[data-action="accept-all"]')??[...b.window.document.querySelectorAll('button')].find(n=>n.textContent==='Accept optional');assert.ok(accept,[...b.window.document.querySelectorAll('button')].map(n=>n.textContent).join(','));accept.click();await b.wait(()=>b.window.document.getElementById('local-result').textContent==='On');assert.equal((await f.sink.observations()).length,0);const revision=(await f.workspace.read('visitor-a')).revision;b.close();const reopened=await browser(f,{values:b.values});try{assert.equal((await f.workspace.read('visitor-a')).revision,revision);assert.equal((await f.sink.observations()).length,0);assert.equal(reopened.window.document.getElementById('client-result').textContent,'Off');}finally{reopened.close();}}finally{b.close();}
});

test('a durable pending fence survives failed recording and restart; a confirmed subset and invalid input do not leave a false fence',async()=>{
  const f=await setup();await f.workspace.register();const queued=await f.workspace.enqueue('visitor-a');
  f.fault.write=true;await assert.rejects(f.workspace.record('visitor-a',command(['sale'])));f.restart();f.fault.write=false;
  assert.equal(await f.workspace.pending('visitor-a'),true);assert.equal((await f.workspace.dispatch(queued.deliveryId)).state,'suppressed');assert.equal((await f.sink.observations()).length,0);
  await f.workspace.record('visitor-a',command(['sale']));assert.equal(await f.workspace.pending('visitor-a'),false);assert.deepEqual((await f.workspace.read('visitor-a')).event.restrictions,['sale']);
  await assert.rejects(f.workspace.record('visitor-b',{...command(),provenance:'gpc-header'}));assert.equal(await f.workspace.pending('visitor-b'),false);assert.equal((await f.workspace.produce('visitor-b')).state,'delivered');
});

test('concurrent dispatch shares one in-flight send; malformed stored payloads never reach the sink',async()=>{
  const f=await setup();await f.workspace.register();let entered,finish,calls=0;const started=new Promise(r=>entered=r),hold=new Promise(r=>finish=r);
  const workspace=createProcessingWorkspace(f.raw,release,{send:async event=>{calls++;entered();await hold;return f.sink.receive(event);}}),job=await workspace.enqueue('visitor-a');
  const a=workspace.dispatch(job.deliveryId);await started;const b=workspace.dispatch(job.deliveryId);assert.equal(a,b);finish();const result=await Promise.all([a,b]);assert.equal(calls,1);assert.equal(result[0].attempts,1);assert.equal((await f.sink.observations())[0].attempts,1);
  const bad=await workspace.enqueue('visitor-b'),key='application:processing:jobs:'+bad.deliveryId,stored=await f.raw.get(key);stored.payload.visitor='unexpected';await f.raw.put(key,stored);await assert.rejects(workspace.dispatch(bad.deliveryId));assert.equal(calls,1);
});

test('a timed-out producer is uncertain, and a slow context resolver cannot prevent a usable GPC page',async()=>{
  const f=await setup();await f.workspace.register();let finish;const hold=new Promise(r=>finish=r),original=f.rpc.produce;
  f.rpc.produce=async(...args)=>{const result=await original(...args);await hold;return result;};
  const host=createProcessingHost({release,resolveVisitor:async()=>({streamId:'visitor-a'}),authorizeOperator:async()=>null,rpcTimeoutMs:20});
  const response=await host(new Request(origin+'/'),f.env);assert.equal(response.headers.get('X-Example-Processing'),'uncertain');assert.match(await response.text(),/delivery-unconfirmed/);assert.equal((await f.sink.observations()).filter(e=>e.serviceId==='ad-service').length,1);finish();
  const slow=createProcessingHost({release,resolveVisitor:()=>new Promise(()=>{}),authorizeOperator:async()=>null,rpcTimeoutMs:20});const gpc=await slow(new Request(origin+'/',{headers:{'Sec-GPC':'1'}}),f.env);assert.equal(gpc.status,200);assert.equal(gpc.headers.get('X-Example-Processing'),'blocked');assert.equal((await f.sink.observations()).filter(e=>e.serviceId==='ad-service').length,1);
});

test('browser lost acknowledgments recover original commands; session changes stop the old client',async()=>{
  const f=await setup();await f.workspace.register();const original=f.host,sent=[];let lose=true;
  f.host=async(request,env)=>{const record=new URL(request.url).pathname==='/api/processing/record';if(record)sent.push(await request.clone().json());const response=await original(request,env);return record&&lose&&response.ok?Response.json({code:'unavailable'},{status:503}):response;};
  const b=await browser(f);let values;try{
    await b.wait(()=>b.window.document.getElementById('processing-state').textContent==='No restriction saved');b.window.document.querySelector('#processing-controls button').click();await b.wait(()=>b.window.document.getElementById('processing-state').textContent==='Unconfirmed');assert.equal(sent.length,1);assert.equal((await f.workspace.read('visitor-a')).revision,1);values=b.values;
  }finally{b.close();}
  lose=false;const reopened=await browser(f,{signal:true,values});try{
    await reopened.wait(()=>reopened.window.document.getElementById('processing-state').textContent==='Restriction recorded');assert.equal((await f.workspace.read('visitor-a')).revision,1);assert.deepEqual(sent[1],sent[0]);assert.equal(sent.length,2);
    reopened.window.dispatchEvent(new reopened.window.Event('application-session-changed'));assert.equal(reopened.window.document.getElementById('queue').disabled,true);assert.equal(reopened.window.document.getElementById('client-result').textContent,'Off');assert.equal((await f.sink.observations()).length,0);
  }finally{reopened.close();}
});

test('automatic browser reporting never confirms local restriction intent whose original outbox is missing',async()=>{
  const f=await setup();await f.workspace.register();const original=f.host;f.host=(request,env)=>new URL(request.url).pathname==='/api/processing/record'?Promise.resolve(Response.json({code:'unavailable'},{status:503})):original(request,env);
  const b=await browser(f);let values;try{await b.wait(()=>b.window.document.getElementById('processing-state').textContent==='No restriction saved');b.window.document.querySelector('#processing-controls button').click();await b.wait(()=>b.window.document.getElementById('processing-state').textContent==='Unconfirmed');values=b.values;}finally{b.close();}
  const journal=[...values.keys()].find(k=>/^notabenda:processing:v1:.*:[a-f0-9]{64}$/u.test(k));assert.ok(journal);const saved=JSON.parse(values.get(journal));saved.queue=[];values.set(journal,JSON.stringify(saved));f.host=original;
  const reopened=await browser(f,{signal:true,values});try{await reopened.wait(()=>reopened.window.document.getElementById('processing-state').textContent==='Unconfirmed');await new Promise(r=>setTimeout(r,20));assert.equal((await f.workspace.read('visitor-a')).revision,0);assert.equal((await f.sink.observations()).length,0);assert.match(reopened.window.document.getElementById('processing-controls').textContent,/request could not be recovered/);}finally{reopened.close();}
});

test('pending-fence capacity exhaustion persists a global admission stop across restart',async()=>{
  const f=await setup();await f.workspace.register();
  for(let n=0;n<256;n++)await f.raw.put('application:processing:pending:'+n.toString(16).padStart(64,'0'),{schemaVersion:1,activities:['sale']});
  await assert.rejects(f.workspace.record('visitor-a',command()));f.restart();assert.equal(await f.workspace.pending('visitor-b'),true);assert.equal((await f.workspace.produce('visitor-b')).state,'blocked');assert.equal((await f.workspace.read('visitor-b')).revision,0);assert.equal((await f.sink.observations()).length,0);
});

// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY
test('private recovery fence preserves unresolved intent without creating an event or public recovery route',async()=>{
 const f=await setup();await f.workspace.register();for(const [id,activities] of [['', ['sale']],['visitor-a',[]],['visitor-a',['unknown']]])await assert.rejects(f.workspace.fence(id,activities));
 await f.workspace.fence('visitor-a',['sale']);f.restart();assert.equal(await f.workspace.pending('visitor-a'),true);assert.equal((await f.workspace.read('visitor-a')).revision,0);assert.equal((await f.workspace.produce('visitor-a')).state,'blocked');assert.equal((await f.records()).records.length,0);
 assert.equal((await f.call('/api/processing/fence',{activities:['sale']})).status,404);await f.workspace.record('visitor-a',command(['sale']));assert.equal(await f.workspace.pending('visitor-a'),false);
});
