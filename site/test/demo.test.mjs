// @requirements REQ-PRODUCT-FORM-PERMISSION-CONNECTION
// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS
// @requirements REQ-PRODUCT-PACK-EDUCATION
// @requirements REQ-PRODUCT-TERMS-ADAPTERS
// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
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
 const overview=await serveHost(req('/demo/admin?q='+result.receipt.id,{headers:headers(a)}),env),overviewHtml=await overview.text();assert.equal(overview.status,200);assert.ok(overviewHtml.includes('/demo/admin/recorded/record?id='+result.receipt.id));assert.doesNotMatch(overviewHtml,/href="\/backoffice/);const isolated=await serveHost(req('/demo/admin?q='+result.receipt.id,{headers:headers(b)}),env);assert.match(await isolated.text(),/No matching records in the available areas/);
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
 for(const path of ['/%61greement/index.html',...['/agreement','/dark/agreement','/localization/agreement','/agreement/react','/dark/agreement/react','/agreement/astro','/agreement/astro/review','/recorded-choices','/processing-choices'].flatMap(base=>[base,base+'/',base+'/index.html'])]){
  const response=await serveHost(req(path,{headers:headers(s)}),env);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store, no-transform');assert.equal(response.headers.get('Vary'),'Cookie');assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);const html=await response.text();assert.match(html,new RegExp('content="'+s.generation+'"'));assert.ok(!html.includes(s.cookie.split('=')[1]));
 }
 env.ASSETS.fetch=async()=>new Response(null,{status:308,headers:{Location:'/agreement/'}});const redirect=await serveHost(req('/agreement',{headers:headers(s)}),env);assert.equal(redirect.status,308);assert.equal(redirect.headers.get('Cache-Control'),'private, no-store, no-transform');
});

test('framework agreement pages bind the isolated session without accepting terms or exposing capabilities',async()=>{
 const {env,objects}=environment(),s=await session(env);
 for(const path of ['/agreement/react/','/dark/agreement/react/','/agreement/astro/','/agreement/astro/review/']){
  const raw=await readFile(new URL('../dist/public'+path+'index.html',import.meta.url),'utf8');env.ASSETS.fetch=async()=>new Response(raw,{headers:{'Content-Type':'text/html'}});
  const response=await serveHost(req(path,{headers:headers(s)}),env),html=await response.text();assert.equal(response.status,200);assert.equal(response.headers.get('Vary'),'Cookie');assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.ok(!html.includes(s.cookie.split('=')[1]));
  const dom=new JSDOM(html),d=dom.window.document,offer=JSON.parse(d.querySelector('meta[name=notabenda-terms-offer]').content);assert.equal(offer.offerId,data.agreements.find(entry=>entry.theme===(path.startsWith('/dark/')?'dark':'light')).offer.offerId);assert.equal(d.querySelector('input[type=checkbox]'),null);assert.ok(d.querySelector('.demo-corner'));assert.equal(d.querySelector('meta[name=notabenda-demo-generation]').content,s.generation);
  if(path.includes('/astro/'))assert.equal(d.querySelector('[data-notabenda-terms]').dataset.notabendaTermsContext,'sample-light-'+s.generation);
  const react=d.getElementById('react-agreement-root');if(react){assert.equal(react.querySelector('.demo-data-notice'),null);assert.equal(react.querySelector('[data-pack-guide]'),null);}dom.window.close();
 }
 assert.equal((await [...objects.values()][0].storage.list({prefix:'notabenda/terms/juniper-agreement/events/',limit:100})).size,10);
});

test('demo operator examples explain evidence and confirmation work without broadening their nonce policy',async()=>{
 const {env}=environment(),s=await session(env);
 for(const [path,id] of [['/demo/admin','evidence-workspace'],['/demo/admin/orders','customer-confirmations']]){const response=await serveHost(req(path,{headers:headers(s)}),env),html=await response.text(),dom=new JSDOM(html),guide=dom.window.document.querySelector('[data-pack-guide="'+id+'"]');assert.ok(guide);assert.equal(guide.querySelector('details').open,false);assert.equal(guide.querySelectorAll('ol li').length,3);const policy=response.headers.get('Content-Security-Policy'),nonce=/style-src 'self' 'nonce-([a-z0-9]+)'/u.exec(policy)?.[1];assert.ok(nonce);assert.ok([...dom.window.document.querySelectorAll('style[nonce="'+nonce+'"]')].some(style=>style.textContent.includes('.pack-example-guide')));assert.doesNotMatch(policy,/unsafe-inline/u);assert.equal(response.headers.get('Cache-Control'),'private, no-store, no-transform');dom.window.close();}
});

test('nested demo legal pages retain exact static bytes without session storage or cookies',async()=>{
 const forbidden=()=>{throw Error('Static legal pages must not reach session or operational storage');};
 for(const base of ['/agreement','/dark/agreement','/localization/agreement','/processing-choices']){
  for(const document of ['privacy','cookies','terms']){
   const html=await readFile(new URL('../dist/public'+base+'/'+document+'/index.html',import.meta.url),'utf8');
   const env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},DEMO_PROVISION_LIMITER:{limit:forbidden},DEMO_WORKSPACES:{idFromName:forbidden,get:forbidden},WORKSPACE:{idFromName:forbidden,get:forbidden}};
   // Static documents also remain readable with a stale/malformed demo cookie and without a signing secret.
   for(const suffix of ['', '/', '/index.html'])for(const cookie of [undefined,'__Host-notabenda_demo=invalid']){
    const response=await serveHost(req(base+'/'+document+suffix,{headers:cookie?{Cookie:cookie}:{}}),env);
    assert.equal(response.status,200);assert.equal(await response.text(),html);
    assert.equal(response.headers.get('Set-Cookie'),null);assert.notEqual(response.headers.get('Vary'),'Cookie');
    assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src|connect-src/u);
    assert.match(response.headers.get('Cache-Control'),/no-transform/u);
   }
  }
 }
 for(const path of ['/agreement/offer.json','/dark/agreement/offer.json','/localization/agreement/offer.json','/recorded-choices/notice.json','/recorded-choices/site.json','/processing-choices/notice.json','/processing-choices/sample.json','/processing-choices/site.json']){
  const json=await readFile(new URL('../dist/public'+path,import.meta.url),'utf8');
  const env={ASSETS:{fetch:async()=>new Response(json,{headers:{'Content-Type':'application/json'}})},DEMO_WORKSPACES:{idFromName:forbidden,get:forbidden}};
  const response=await serveHost(req(path),env);assert.equal(response.status,200);assert.equal(await response.text(),json);assert.equal(response.headers.get('Set-Cookie'),null);
 }
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
// @requirements REQ-PRODUCT-LOCALIZATION
test('localized form permissions keep their language, exact copy and session isolated from English permissions',async()=>{
 const {env}=environment(),a=await session(env),b=await session(env),offer=data.localizedFormPermissions.offer;
 const current=async(s,pt=true)=>{const response=await serveHost(req('/demo/permissions/'+(pt?'pt/':'')+'state',{headers:headers(s)}),env);assert.equal(response.status,200);return response.json();};
 const first=await current(a),other=await current(b);assert.notEqual(first.streamRef,other.streamRef);assert.equal(first.revision,0);assert.equal(first.permitted,false);
 const command={schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),action:'grant',expectedStreamRef:first.streamRef,expectedRevision:first.revision,expectedActivation:first.activeRevision,clientAt:new Date().toISOString()};
 const post=(s,pt=true)=>serveHost(req('/demo/permissions/'+(pt?'pt/':'')+'record',{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(command)}),env);
 const response=await post(a);assert.equal(response.status,200);const grant=await response.json();assert.equal(grant.state.permitted,true);
 assert.equal((await current(b)).permitted,false);assert.equal((await current(a,false)).permitted,false);assert.equal((await post(b)).status,409);assert.equal((await post(a,false)).status,409);
 const detailPath='/demo/admin/permissions/record?id='+grant.receipt.id,detail=await serveHost(req(detailPath,{headers:headers(a)}),env),html=await detail.text();
 assert.equal(detail.status,200);for(const text of ['Declared interface wording','pt-BR',offer.wording.statement,offer.localization.formPermission.error])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/href="\/backoffice/u);assert.equal((await serveHost(req(detailPath,{headers:headers(b)}),env)).status,404);
 for(const path of ['/localization/permission/','/localization/permission/index.html']){
  const page=await serveHost(req(path,{headers:headers(a)}),env),body=await page.text();assert.equal(page.status,200);assert.match(body,new RegExp('content="'+first.streamRef+'"'));assert.match(body,/class="demo-corner"/u);assert.ok(!body.includes(a.cookie.split('=')[1]));
 }
 const legal=await serveHost(req('/localization/permission/privacy/'),env);assert.equal(legal.status,200);assert.equal(legal.headers.get('Set-Cookie'),null);
});

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
 const {createEvidenceLifecycle}=await import('@notabenda/cloudflare'),entry=[...objects.values()][0],target={family:'permissions',siteId:offer.siteId,scopeId:offer.permissionId,streamId:entry.workspace.contextId('reader-profile:email-generation-1')},lifecycle=await createEvidenceLifecycle(entry.storage,target);await lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:new Date().toISOString(),legalHold:false});assert.equal((await serveHost(req('/demo/permissions/state',{headers:headers(a)}),env)).status,410);assert.equal((await post(a,command)).status,410);assert.equal((await current(b)).revision,0);
});

test('permission example routes bind only entry pages and retain script-free public privacy documents',async()=>{
 const {env,objects}=environment(),s=await session(env);
 for(const path of ['/form-permissions','/form-permissions/','/form-permissions/index.html','/dark/form-permissions/','/form-permissions/react/','/form-permissions/react/index.html','/dark/form-permissions/react/','/form-permissions/astro/','/form-permissions/astro/review/','/form-permissions/astro/review/index.html']){const response=await serveHost(req(path,{headers:headers(s)}),env);assert.equal(response.status,200);assert.match(await response.text(),new RegExp('content="'+s.generation+'"'));assert.equal(response.headers.get('Cache-Control'),'private, no-store, no-transform');}
 for(const path of ['/form-permissions/react/privacy','/form-permissions/not-a-route','/dark/form-permissions/astro/','/form-permissions/astro/unknown'])assert.equal((await serveHost(req(path),env)).headers.get('Set-Cookie'),null);
 const page=await serveHost(req('/form-permissions/privacy/'),env);assert.equal(page.status,200);assert.doesNotMatch(page.headers.get('Content-Security-Policy'),/script-src/);assert.equal(page.headers.get('Set-Cookie'),null);
 const entry=[...objects.values()][0],before=await entry.storage.list({prefix:`notabenda/permissions/${data.formPermissions.offer.siteId}/`,limit:1000});entry.workspace=new DemoWorkspace({storage:entry.storage,blockConcurrencyWhile:fn=>fn()},env);assert.equal((await serveHost(req('/demo/admin/permissions',{headers:headers(s)}),env)).status,200);assert.deepEqual(await entry.storage.list({prefix:`notabenda/permissions/${data.formPermissions.offer.siteId}/`,limit:1000}),before);
});

// @requirements REQ-ZA-MARKETING
test('permission controls mount before the first read and keep explicit refusal usable through failure and timeout',async()=>{
 const {JSDOM}=await import('jsdom'),{readFile}=await import('node:fs/promises');
 const {createFormPermission,mountFormPermission,FormPermissionError,createIndexedDBFormPermissionJournal}=await import('@notabenda/core');const {IDBFactory}=await import('fake-indexeddb');
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
  const setup=Function('window','document','fetch','createFormPermission','mountFormPermission','FormPermissionError','demoSessionEnded','createIndexedDBFormPermissionJournal','return (async()=>{'+source.replace(/^import .*;\n/gmu,'')+'})()');
  try{
   const completion=setup(dom.window,dom.window.document,fetch,(offer,options)=>(controller=createFormPermission(offer,{...options,timeoutMs:100})),mountFormPermission,FormPermissionError,()=>false,()=>(localJournal=createIndexedDBFormPermissionJournal({indexedDB:new IDBFactory(),broadcastChannel:null})));
   const refuse=[...dom.window.document.querySelectorAll('button')].find(button=>button.textContent==='I do not consent');
   assert.ok(refuse);assert.equal(refuse.hidden,false);assert.equal(refuse.disabled,false);assert.equal(controller.getSnapshot().allowed,false);
   await completion;assert.equal(controller.getSnapshot().status,'error');assert.equal(refuse.disabled,false);
   dom.window.document.querySelector('button[type=submit]').click();assert.equal(writes,0);
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Refusal did not complete')),2000);const off=controller.subscribe(state=>{if(state.receipt){clearTimeout(timer);queueMicrotask(()=>{off();resolve();});}});refuse.click();});
   assert.equal(writes,1);assert.equal(controller.getSnapshot().receipt.action,'refuse');assert.equal(controller.getSnapshot().current.reason,'refused');assert.equal(controller.getSnapshot().allowed,false);
   dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pagehide',{persisted:true}));assert.equal(controller.getSnapshot().status,'recorded');
   dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pagehide',{persisted:false}));assert.equal(controller.getSnapshot().status,'destroyed');
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

// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
 test('Portuguese processing routes use an isolated session and fixed language scope with retained inspection',async()=>{
 const {env}=environment(),a=await session(env),b=await session(env),page=await serveHost(req('/localization/processing/',{headers:headers(a)}),env);assert.equal(page.status,200);assert.match(page.headers.get('Content-Security-Policy'),/script-src 'self'/);assert.match(await page.text(),/notabenda-demo-generation/);
 const get=(s,suffix='pt/')=>serveHost(req('/demo/processing/'+suffix+'head',{headers:headers(s)}),env),one=await(await get(a)).json(),other=await(await get(b)).json();assert.notEqual(one.streamRef,other.streamRef);const n=data.localizedProcessing.notice,body={schemaVersion:1,noticeId:n.noticeId,requestId:crypto.randomUUID(),activities:n.activities};const post=(s,value,suffix='pt/')=>serveHost(req('/demo/processing/'+suffix+'record',{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(value)}),env);
 const response=await post(a,body);assert.equal(response.status,200,await response.clone().text());const result=await response.json();assert.equal(result.receipt.noticeId,n.noticeId);assert.equal((await(await get(a)).json()).revision,1);assert.equal((await(await get(b)).json()).revision,0);assert.equal((await(await get(a,'')).json()).revision,0);assert.equal((await post(a,{...body,requestId:crypto.randomUUID()},'')).status,400);
 const detail=await serveHost(req('/demo/admin/processing/record?id='+result.receipt.id,{headers:headers(a)}),env);assert.equal(detail.status,200);const html=await detail.text();assert.ok(html.includes(n.localization.processingChoices.recorded));assert.equal((await serveHost(req('/demo/admin/processing/record?id='+result.receipt.id,{headers:headers(b)}),env)).status,404);
 });

test('composed-form permissions are independently host-bound and stored only in the visitor demo workspace',async()=>{
 const {env}=environment(),a=await session(env),b=await session(env),offer=data.collectionFlow.flow.permissions[0];
 const page=await serveHost(req('/collection-flow/',{headers:headers(a)}),env),html=await page.text();assert.equal(page.status,200);assert.match(html,/notabenda-permission-stream/);assert.match(html,/demo-corner/);
 const get=s=>serveHost(req('/demo/permissions/flow/state',{headers:headers(s)}),env),one=await(await get(a)).json(),two=await(await get(b)).json();assert.notEqual(one.streamRef,two.streamRef);assert.equal(one.activeOfferId,offer.offerId);assert.equal(one.permitted,false);
 const command={schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),clientAt:new Date().toISOString(),expectedStreamRef:one.streamRef,action:'grant',expectedRevision:one.revision,expectedActivation:one.activeRevision};
 const post=(s,body)=>serveHost(req('/demo/permissions/flow/record',{method:'POST',headers:{...headers(s),Origin:'https://demo.example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)}),env);
 const accepted=await post(a,command);assert.equal(accepted.status,200);assert.equal((await accepted.json()).state.permitted,true);assert.equal((await get(b)).status,200);assert.equal((await(await get(b)).json()).permitted,false);assert.equal((await post(b,command)).status,409);
 const original=await(await serveHost(req('/demo/permissions/state',{headers:headers(a)}),env)).json();assert.equal(original.permitted,false);assert.notEqual(original.activeOfferId,offer.offerId);
 const detail=await serveHost(req('/demo/admin/permissions',{headers:headers(a)}),env);assert.equal(detail.status,200);assert.match(await detail.text(),/flow-updates|reading updates/i);
 for(const path of ['/collection-flow/flow.json','/collection-flow/privacy/','/assets/collection-flow-example.mjs']){const response=await serveHost(req(path),env);assert.equal(response.headers.get('Set-Cookie'),null,path);}
});
