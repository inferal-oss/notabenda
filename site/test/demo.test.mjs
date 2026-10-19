// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serveHost} from '../host.mjs';
import {DemoWorkspace} from '../worker.mjs';
import {createSyntheticStorage} from '../../packages/notabenda-cf/examples/synthetic.mjs';
import data from '../dist/server-data.json' with {type:'json'};
const req=(path,init={})=>new Request('https://demo.example.test'+path,init);
const digest=async value=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
function environment(){
 const objects=new Map();let allocations=0;
 const env={ADMIN_KEY:'a'.repeat(64),ASSETS:{fetch:async request=>new URL(request.url).pathname.startsWith('/assets/guarantees/')?new Response(await readFile(new URL('../dist/public'+new URL(request.url).pathname,import.meta.url)),{headers:{'Content-Type':'image/svg+xml'}}):new Response('<!doctype html><head></head><body>Fictional example</body>',{headers:{'Content-Type':'text/html'}})},DEMO_PROVISION_LIMITER:{limit:async()=>({success:true})},WORKSPACE:{idFromName(){throw new Error('Operational workspace must never be selected');}}};
 env.DEMO_WORKSPACES={idFromName:name=>name,get(name){allocations++;if(!objects.has(name)){
  const storage=createSyntheticStorage([]);storage.setAlarm=async at=>{storage.deadline=at;};storage.deleteAll=async()=>{for(const key of (await storage.list({prefix:'',limit:10000})).keys())await storage.delete(key);};
  objects.set(name,{storage,workspace:new DemoWorkspace({storage,blockConcurrencyWhile:fn=>fn()},env)});
 }return {fetch:request=>objects.get(name).workspace.fetch(request)};}};
 return {env,objects,allocations:()=>allocations};
}
async function session(env){const response=await serveHost(req('/demo/admin'),env);assert.equal(response.status,200,await response.clone().text());const cookie=response.headers.get('Set-Cookie').split(';')[0],value=cookie.split('=')[1];return {cookie,generation:await digest(value.split('.')[0]),response};}
const headers=s=>({Cookie:s.cookie,'X-Notabenda-Demo-Generation':s.generation});

// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-A11Y
test('order examples issue session-bound quotes and retain one exact request with readable isolated history',async()=>{
 const {env,objects}=environment(),a=await session(env),b=await session(env);
 for(const route of ['mixed','deferred','conditional']){
  const page=await serveHost(req('/orders/'+route+'/',{headers:headers(a)}),env);assert.equal(page.status,200);const html=await page.text();assert.match(html,/notabenda-demo-generation/);assert.match(html,/class="demo-corner"/);assert.match(page.headers.get('Content-Security-Policy'),/script-src 'self'/);
  const get=s=>serveHost(req('/demo/orders/'+route+'/quote',{headers:headers(s)}),env),review=await(await get(a)).json(),other=await(await get(b)).json();assert.notEqual(review.quote.contextRef,other.quote.contextRef);assert.equal(review.definition.definitionId,data.paidOrders[route].definition.definitionId);assert.deepEqual(await(await get(a)).json(),review);
  const request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef};
  const post=(s,body)=>serveHost(req('/demo/orders/'+route+'/submit',{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)}),env),responses=await Promise.all([post(a,request),post(a,request)]);assert.deepEqual(responses.map(r=>r.status),[200,200]);const outcome=await responses[0].json();assert.deepEqual(await responses[1].json(),outcome);assert.equal(outcome.status,'received');assert.equal((await post(b,request)).status,409);assert.equal((await post(a,{...request,quoteRevision:'other'})).status,409);
  const detail=await serveHost(req('/demo/admin/orders/record?id='+outcome.id,{headers:headers(a)}),env),content=await detail.text();assert.equal(detail.status,200);for(const label of ['Information presented','Payment','Not reported','Not prepared',request.requestId,request.reviewId])assert.ok(content.includes(label),label);assert.match(content,/class="demo-corner"/);assert.match(content,/Inspect retained review/);const archive=await serveHost(req('/demo/admin/orders/order-review?id='+outcome.id,{headers:headers(a)}),env);assert.equal(archive.status,200);assert.match(await archive.text(),/Retained review/);assert.equal((await serveHost(req('/demo/admin/orders/record?id='+outcome.id,{headers:headers(b)}),env)).status,404);
  const search=await serveHost(req('/demo/admin/orders?q='+request.requestId,{headers:headers(a)}),env);assert.equal(search.status,200);assert.match(await search.text(),/1 record on this page/);
  const image=review.definition.items.find(i=>i.guarantee?.status==='label-provided')?.guarantee.label.asset;if(image){const view=await serveHost(req('/demo/admin/orders/order-review?id='+outcome.id,{headers:headers(a)}),env);assert.match(await view.text(),/Guarantee artwork © European Union.*Source and use conditions/u);const path='/demo/admin/orders/order-image?id='+outcome.id+'&sha256='+image.sha256,response=await serveHost(req(path,{headers:headers(a)}),env);assert.equal(response.status,200);assert.match(response.headers.get('Content-Security-Policy'),/^sandbox;/);assert.equal((await response.arrayBuffer()).byteLength,image.bytes);assert.equal((await serveHost(req(path,{headers:headers(b)}),env)).status,404);}
 }
 const stores=[...objects.values()].map(o=>o.storage);for(const storage of stores){const records=await storage.list({prefix:'notabenda/orders/juniper-order-example/events/',limit:200});assert.equal(records.size,storage===stores[0]?6:3);}
 const denied=await serveHost(req('/demo/orders/mixed/quote'),env);assert.equal(denied.status,409);
});
// @requirements REQ-EU-ORDER-ACTION
test('a retained order outcome remains recoverable at the demo limit if outer command accounting was interrupted',async()=>{
 const {env,objects}=environment(),s=await session(env),review=await(await serveHost(req('/demo/orders/conditional/quote',{headers:headers(s)}),env)).json(),body={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef},path='/demo/orders/conditional/submit',post=()=>serveHost(req(path,{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)}),env),receipt=await(await post()).json(),storage=[...objects.values()][0].storage;
 await storage.delete('demo/commands/'+path+'/'+body.requestId);await storage.put('demo/command-count',200);assert.deepEqual(await(await post()).json(),receipt);body.requestId=crypto.randomUUID();assert.equal((await post()).status,429);
});
test('demo navigation keeps its overview and public exits within the bounded sidebar',async()=>{const {adminPresentation}=await import('../admin-presentation.mjs'),links=adminPresentation('/demo/admin').navigation;assert.ok(links.length<=12);for(const path of ['/demo/admin','/demo/admin/orders','/examples','/website-privacy'])assert.ok(links.some(link=>link.href===path),path);});
test('visitors receive independent seeded DO databases while operational admin stays protected',async()=>{
 const {env,objects}=environment(),a=await session(env),b=await session(env);assert.notEqual(a.cookie,b.cookie);assert.equal(objects.size,2);
 assert.match(a.response.headers.get('Set-Cookie'),/^__Host-notabenda_demo=[a-f0-9]{64}\.[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Lax; Secure$/);assert.equal(a.response.headers.get('Vary'),'Cookie');assert.equal(a.response.headers.get('Cache-Control'),'private, no-store, no-transform');
 for(const {storage} of objects.values()){
  assert.equal((await storage.list({prefix:`notabenda/consent/${data.consent.notice.siteId}/events/`,limit:100})).size,27);
  assert.equal((await storage.list({prefix:'notabenda/terms/juniper-agreement/events/',limit:100})).size,10);
  assert.equal((await storage.list({prefix:`notabenda/processing/${data.processing.notice.siteId}/events/`,limit:100})).size,8);
 }
 const head=async s=>(await(await serveHost(req('/demo/choices/head',{headers:headers(s)}),env)).json());
 const first=await head(a),other=await head(b);assert.notEqual(first.streamRef,other.streamRef);
 const body={schemaVersion:1,noticeId:data.recordedConsent.notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:'revoke-all',choices:Object.fromEntries(Object.keys(data.recordedConsent.notice.scopes).map(id=>[id,false])),clientAt:new Date().toISOString()};
 const post=s=>serveHost(req('/demo/choices/record',{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)}),env);
 const saved=await post(a);assert.equal(saved.status,200);const result=await saved.json();assert.equal((await head(b)).revision,0);assert.equal((await head(a)).revision,1);
 const record=await serveHost(req('/demo/admin/recorded/record?id='+result.receipt.id,{headers:headers(a)}),env);assert.equal(record.status,200);const html=await record.text();assert.match(html,/Your demo workspace/);assert.doesNotMatch(html,/href="\/backoffice/);
 const unavailable=await serveHost(req('/demo/admin/recorded/record?id='+result.receipt.id,{headers:headers(b)}),env);assert.equal(unavailable.status,404);
 assert.equal((await serveHost(req('/backoffice',{headers:{Cookie:a.cookie}}),env)).status,401);
 // A replaced browser cookie cannot carry an older tab's command into the new workspace.
 const crossed={...a,cookie:b.cookie};assert.equal((await post(crossed)).status,409);assert.equal((await head(b)).revision,0);
 const object=[...objects.values()][0];await object.storage.put('demo/command-count',200);assert.equal((await post(a)).status,200);body.requestId=crypto.randomUUID();body.expectedRevision=1;assert.equal((await post(a)).status,429);
});
test('only provisioning initializes; expiry and alarm cleanup cannot resurrect an old capability',async()=>{
 const {env,objects}=environment(),s=await session(env),entry=[...objects.values()][0],before=await entry.storage.get('demo/session');
 const idle={...before,lastUsedAt:before.lastUsedAt-7200000,expiresAt:before.expiresAt-7200000};await entry.storage.put('demo/session',idle);
 await serveHost(req('/demo/admin/history',{headers:headers(s)}),env);const after=await entry.storage.get('demo/session');assert.ok(after.expiresAt>idle.expiresAt);assert.equal(after.createdAt,before.createdAt);assert.ok(after.lastUsedAt>=before.lastUsedAt);assert.equal(after.expiresAt-after.lastUsedAt,86400000);
 await entry.workspace.alarm();assert.ok(await entry.storage.get('demo/seed-v1')); // An earlier queued alarm must not destroy an active demo.
 await entry.storage.put('demo/session',{...before,expiresAt:Date.now()-1});const expired=await serveHost(req('/demo/admin/history',{headers:headers(s)}),env);assert.equal(expired.status,410);assert.match(await expired.clone().text(),/Your demo session ended/);assert.match(expired.headers.get('Set-Cookie'),/Max-Age=0/);assert.equal((await entry.storage.list({prefix:'notabenda/',limit:100})).size,0);
 await entry.workspace.alarm();assert.equal((await serveHost(req('/demo/admin/history',{headers:headers(s)}),env)).status,410);assert.equal(await entry.storage.get('demo/seed-v1'),undefined);
 const forged={cookie:'__Host-notabenda_demo='+'f'.repeat(64),generation:await digest('f'.repeat(64))};assert.equal((await serveHost(req('/demo/admin',{headers:headers(forged)}),env)).status,410);assert.equal(objects.size,1);
});
test('public demo validates origin, capability, generation and provisioning budget before allocating storage',async()=>{
 const {env,allocations}=environment();env.DEMO_PROVISION_LIMITER.limit=async()=>({success:false});assert.equal((await serveHost(req('/demo/admin'),env)).status,429);assert.equal(allocations(),0);
 const body='{}';assert.equal((await serveHost(req('/demo/choices/record',{method:'POST',headers:{Origin:'https://attacker.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body}),env)).status,400);assert.equal(allocations(),0);
 assert.equal((await serveHost(req('/demo/provision',{method:'POST'}),env)).status,405);assert.equal((await serveHost(req('/demo/choices/head'),env)).status,409);assert.equal(allocations(),0);
});

test('demo example pages bind their generation without exposing the capability or operational admin',async()=>{
 const {env}=environment(),s=await session(env);
 for(const path of ['/agreement/index.html','/%61greement/index.html','/dark/agreement/index.html','/recorded-choices/','/processing-choices/']){
  const response=await serveHost(req(path,{headers:headers(s)}),env);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store, no-transform');assert.equal(response.headers.get('Vary'),'Cookie');assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);const html=await response.text();assert.match(html,new RegExp('content="'+s.generation+'"'));assert.ok(!html.includes(s.cookie.split('=')[1]));
 }
 env.ASSETS.fetch=async()=>new Response(null,{status:308,headers:{Location:'/agreement/'}});const redirect=await serveHost(req('/agreement',{headers:headers(s)}),env);assert.equal(redirect.status,308);assert.equal(redirect.headers.get('Cache-Control'),'private, no-store, no-transform');
});

test('forged capability signatures cannot allocate objects and interrupted seeding resumes without duplication',async()=>{
 const {env,objects,allocations}=environment();let calls=0;env.DEMO_PROVISION_LIMITER.limit=async()=>{calls++;return {success:true};};
 for(let n=0;n<8;n++){const cookie='__Host-notabenda_demo='+String(n).repeat(64)+'.'+'f'.repeat(64);assert.equal((await serveHost(req('/demo/admin',{headers:{Cookie:cookie}}),env)).status,410);}
 assert.equal(allocations(),0);assert.equal(calls,0);
 const s=await session(env),entry=[...objects.values()][0];await entry.storage.delete('demo/seed-v1');
 const before=await entry.storage.list({prefix:'notabenda/',limit:10000});entry.workspace=new DemoWorkspace({storage:entry.storage,blockConcurrencyWhile:fn=>fn()},env);
 assert.equal((await serveHost(req('/demo/admin/history',{headers:headers(s)}),env)).status,200);assert.deepEqual(await entry.storage.list({prefix:'notabenda/',limit:10000}),before);
});

test('the demo session recovery message is terminal-specific, text-only and does not duplicate itself',async()=>{
 const {JSDOM}=await import('jsdom');const {readFile}=await import('node:fs/promises');
 const dom=new JSDOM('<main><p>Example</p></main>',{url:'https://demo.example.test/recorded-choices/'});
 const source=await readFile(new URL('../../examples/static/demo-session.mjs',import.meta.url),'utf8');const ended=Function('document','location',source.replace('export function','function')+';return demoSessionEnded;')(dom.window.document,dom.window.location);
 assert.equal(ended({code:'revision-conflict'}),false);assert.equal(dom.window.document.querySelector('[role=alert]'),null);
 for(const code of ['demo-expired','demo-generation-changed','demo-session-required'])assert.equal(ended({code}),true);
 assert.equal(dom.window.document.querySelectorAll('[role=alert]').length,1);assert.equal(dom.window.document.querySelector('a').href,'https://demo.example.test/recorded-choices/');assert.match(dom.window.document.body.textContent,/Optional services stay off/);
 dom.window.close();
});

// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-EVIDENCE-LIFECYCLE
test('form permissions use isolated session/contact bindings, acknowledged ordering and scoped admin evidence',async()=>{
 const {env,objects}=environment(),a=await session(env),b=await session(env),offer=data.formPermissions.offer;
 const current=async s=>{const r=await serveHost(req('/demo/permissions/state',{headers:headers(s)}),env);assert.equal(r.status,200);return r.json();};
 const first=await current(a),second=await current(b);assert.notEqual(first.streamRef,second.streamRef);assert.equal(first.revision,0);assert.equal(first.grantAllowed,true);
 for(const {storage} of objects.values())assert.equal((await storage.list({prefix:`notabenda/permissions/${offer.siteId}/events/`,limit:100})).size,10);
 const command={schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),action:'grant',expectedStreamRef:first.streamRef,expectedRevision:first.revision,expectedActivation:first.activeRevision,clientAt:new Date().toISOString()};
 const post=(s,body)=>serveHost(req('/demo/permissions/record',{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)}),env);
 const response=await post(a,command);assert.equal(response.status,200);const grant=await response.json();assert.equal(grant.state.permitted,true);assert.equal((await current(b)).revision,0);
 assert.equal((await post(b,command)).status,409);assert.equal((await current(b)).revision,0);
 assert.equal((await post(a,{...command,requestId:crypto.randomUUID()})).status,409);
 const withdrawal={schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),action:'withdraw',expectedStreamRef:first.streamRef,clientAt:new Date().toISOString()};assert.equal((await post(a,withdrawal)).status,200);const replay=await(await post(a,command)).json();assert.deepEqual(replay.receipt,grant.receipt);assert.equal(replay.state.permitted,false);
 const detailPath='/demo/admin/permissions/record?id='+grant.receipt.id;const detail=await serveHost(req(detailPath,{headers:headers(a)}),env);assert.equal(detail.status,200);const html=await detail.text();for(const phrase of ['Historical action','Grant recorded','No current permission','Exact permission statement'])assert.ok(html.includes(phrase));assert.doesNotMatch(html,/href="\/backoffice/);assert.equal((await serveHost(req(detailPath,{headers:headers(b)}),env)).status,404);
 const exported=await serveHost(req('/demo/admin/permissions/export.json?q=withdrawn',{headers:headers(a)}),env);assert.equal(exported.status,200);assert.match(await exported.text(),/currentState/);
 const {createEvidenceLifecycle}=await import('notabenda-cf'),entry=[...objects.values()][0],target={family:'permissions',siteId:offer.siteId,scopeId:offer.permissionId,streamId:entry.workspace.contextId('reader-profile:email-generation-1')},lifecycle=await createEvidenceLifecycle(entry.storage,target);await lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:new Date().toISOString(),legalHold:false});assert.equal((await serveHost(req('/demo/permissions/state',{headers:headers(a)}),env)).status,410);assert.equal((await post(a,command)).status,410);assert.equal((await current(b)).revision,0);
});

test('permission example routes bind only entry pages and retain script-free public privacy documents',async()=>{
 const {env,objects}=environment(),s=await session(env);
 for(const path of ['/form-permissions','/form-permissions/','/form-permissions/index.html','/dark/form-permissions/','/form-permissions/react/','/form-permissions/react/index.html','/dark/form-permissions/react/','/form-permissions/astro/','/form-permissions/astro/review/','/form-permissions/astro/review/index.html']){const response=await serveHost(req(path,{headers:headers(s)}),env);assert.equal(response.status,200);assert.match(await response.text(),new RegExp('content="'+s.generation+'"'));assert.equal(response.headers.get('Cache-Control'),'private, no-store, no-transform');}
 for(const path of ['/form-permissions/react/privacy','/form-permissions/not-a-route','/dark/form-permissions/astro/','/form-permissions/astro/unknown'])assert.equal((await serveHost(req(path),env)).headers.get('Set-Cookie'),null);
 const page=await serveHost(req('/form-permissions/privacy/'),env);assert.equal(page.status,200);assert.doesNotMatch(page.headers.get('Content-Security-Policy'),/script-src/);assert.equal(page.headers.get('Set-Cookie'),null);
 const entry=[...objects.values()][0],before=await entry.storage.list({prefix:`notabenda/permissions/${data.formPermissions.offer.siteId}/`,limit:1000});entry.workspace=new DemoWorkspace({storage:entry.storage,blockConcurrencyWhile:fn=>fn()},env);assert.equal((await serveHost(req('/demo/admin/permissions',{headers:headers(s)}),env)).status,200);assert.deepEqual(await entry.storage.list({prefix:`notabenda/permissions/${data.formPermissions.offer.siteId}/`,limit:1000}),before);
});

test('permission controls mount before the first read and keep withdrawal usable through failure and timeout',async()=>{
 const {JSDOM}=await import('jsdom'),{readFile}=await import('node:fs/promises');
 const {createFormPermission,mountFormPermission,FormPermissionError,createIndexedDBFormPermissionJournal}=await import('notabenda');const {IDBFactory}=await import('fake-indexeddb');
 const {formPermissionFiles}=await import('../../examples/form-permissions/build.mjs');
 const base=JSON.parse(await readFile(new URL('../../examples/static/notabenda.config.json',import.meta.url),'utf8'));
 const files=await formPermissionFiles(base),source=await readFile(new URL('../../examples/form-permissions/client.mjs',import.meta.url),'utf8');
 for(const mode of ['failure','timeout']){
  const {env}=environment();env.ASSETS.fetch=async()=>new Response(files['form-permissions/index.html'],{headers:{'Content-Type':'text/html'}});
  const s=await session(env),entry=await serveHost(req('/form-permissions/',{headers:headers(s)}),env);
  const dom=new JSDOM(await entry.text(),{url:'https://demo.example.test/form-permissions/'});let controller,localJournal,reads=0,writes=0;
  const fetch=async(path,options={})=>{
   if(path==='/demo/permissions/state'&&reads++===0){if(mode==='failure')throw Error('Offline');return new Promise(()=>{});}
   if(path==='/demo/permissions/record')writes++;
   return serveHost(req(path,{...options,headers:{Cookie:s.cookie,Origin:'https://demo.example.test',...options.headers}}),env);
  };
  const setup=Function('document','fetch','createFormPermission','mountFormPermission','FormPermissionError','demoSessionEnded','createIndexedDBFormPermissionJournal','return (async()=>{'+source.replace(/^import .*;\n/gmu,'')+'})()');
  try{
   const completion=setup(dom.window.document,fetch,(offer,options)=>(controller=createFormPermission(offer,{...options,timeoutMs:100})),mountFormPermission,FormPermissionError,()=>false,()=>(localJournal=createIndexedDBFormPermissionJournal({indexedDB:new IDBFactory(),broadcastChannel:null})));
   const withdraw=[...dom.window.document.querySelectorAll('button')].find(button=>button.textContent==='Withdraw email permission');
   assert.ok(withdraw);assert.equal(withdraw.disabled,false);assert.equal(controller.getSnapshot().allowed,false);
   await completion;assert.equal(controller.getSnapshot().status,'error');assert.equal(withdraw.disabled,false);
   dom.window.document.querySelector('button[type=submit]').click();assert.equal(writes,0);
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Withdrawal did not complete')),2000);const off=controller.subscribe(state=>{if(state.receipt){clearTimeout(timer);queueMicrotask(()=>{off();resolve();});}});withdraw.click();});
   assert.equal(writes,1);assert.equal(controller.getSnapshot().receipt.action,'withdraw');assert.equal(controller.getSnapshot().current.reason,'withdrawn');assert.equal(controller.getSnapshot().allowed,false);
  }finally{controller?.destroy();localJournal?.close();dom.window.close();}
 }
});

// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-TERMS-ACCEPTANCE
test('localized agreements use session-bound storage, preserve language/copy and remain private to that demo',async()=>{
 const {env,objects}=environment(),asset=env.ASSETS.fetch;env.ASSETS.fetch=async request=>new URL(request.url).pathname==='/localization/agreement/'?new Response(await readFile(new URL('../dist/public/localization/agreement/index.html',import.meta.url),'utf8'),{headers:{'Content-Type':'text/html'}}):asset(request);
 const a=await session(env),b=await session(env),offer=data.agreements.find(entry=>entry.theme==='pt').offer;
 const page=await serveHost(req('/localization/agreement/',{headers:headers(a)}),env),html=await page.text();assert.equal(page.status,200);assert.match(html,/notabenda-demo-generation/u);assert.match(html,/Esta demonstração armazena suas entradas/u);assert.match(html,/lang="pt-BR"/u);assert.match(html,/class="demo-corner"/u);
 const body={schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),accepted:true},post=(s,payload=body)=>serveHost(req('/demo/agreements/pt',{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(payload)}),env),response=await post(a);assert.equal(response.status,200);const receipt=await response.json();assert.equal(receipt.operationId,'synthetic-pt-operation-'+a.generation);assert.deepEqual(await(await post(a)).json(),receipt);
 const detail=await serveHost(req('/demo/admin/agreements/record?id='+receipt.id,{headers:headers(a)}),env),content=await detail.text();assert.equal(detail.status,200);for(const text of ['pt-BR','Copy revision','Declared interface wording',offer.statement,offer.actionLabel,offer.localization.terms.submitting])assert.ok(content.includes(text),text);assert.equal((await serveHost(req('/demo/admin/agreements/record?id='+receipt.id,{headers:headers(b)}),env)).status,404);
 assert.equal((await post({...a,cookie:b.cookie})).status,409);assert.equal((await post(a,{...body,requestId:crypto.randomUUID(),offerId:data.agreements.find(e=>e.theme==='light').offer.offerId})).status,400);
 const events=await [...objects.values()][0].storage.list({prefix:'notabenda/terms/juniper-agreement/events/',limit:100});assert.equal(events.size,11);assert.equal([...events.values()].filter(e=>e.offer?.localization?.locale==='pt-BR').length,1);
});
