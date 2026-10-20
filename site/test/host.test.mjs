// @requirements REQ-PRODUCT-RIGHTS-CENTER
// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
import {build as parseBrowserModule} from 'esbuild';
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
// @requirements REQ-PRODUCT-CF-HOST
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { serveHost, hostAuthorization } from '../host.mjs';
import { EvidenceWorkspace } from '../worker.mjs';
import { createSyntheticStorage } from '../../packages/notabenda-cf/examples/synthetic.mjs';
import data from '../dist/server-data.json' with {type:'json'};
const key='a'.repeat(64);
const auth={Authorization:'Basic '+btoa('admin:'+key)};
const request=(path,init={})=>new Request('https://example.test'+path,init);
const state=storage=>({storage,blockConcurrencyWhile:callback=>callback()});

// @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE
test('guarantee examples preserve selected official bytes, show text and use no scripts or evidence store',async()=>{
 const root=new URL('../dist/public/',import.meta.url),env={ASSETS:{fetch:async()=>new Response('Static guarantee notice')},WORKSPACE:{get(){throw Error('A static guarantee display does not open records.');}}};
 const {sha256}=await import('@notabenda/core/content');
 for(const prefix of ['','dark/']){const path=prefix+'guarantees/',html=await readFile(new URL(path+'index.html',root),'utf8'),n=JSON.parse(await readFile(new URL(path+'notice.json',root),'utf8')),svg=await readFile(new URL(n.asset.url.slice(1),root),'utf8');assert.equal(sha256(svg),n.asset.sha256);assert.match(html,/nb-demo-guarantees/);assert.match(html,/guarantees\.css/);assert.match(html,/LEGAL/);assert.ok(html.includes(n.informationUrl));assert.doesNotMatch(html,/<script|<form|<input|data:image\/png/);const response=await serveHost(request('/'+path),env);assert.equal(response.status,200);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);}
});

// @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
test('indirect collection examples share the modern frame, expose usable text and stay script-free without records',async()=>{
 const root=new URL('../dist/public/',import.meta.url),env={ASSETS:{fetch:async()=>new Response('Static notice')},WORKSPACE:{get(){throw Error('A notice does not open an evidence store.');}}};
 for(const prefix of ['','dark/']){
  const path=prefix+'indirect-collection/',html=await readFile(new URL(path+'index.html',root),'utf8'),n=JSON.parse(await readFile(new URL(path+'notice.json',root),'utf8')),text=await readFile(new URL(path+'notice.txt',root),'utf8');
  assert.match(html,/example-pages\.css/);assert.match(html,/nb-demo-indirect-collection/);assert.match(html,/data-indirect-notice-id=/);assert.doesNotMatch(html,/<script|<form|<input/);assert.match(text,/We have collected/);assert.match(text,/https:\/\/[^\s]+\/artifacts\/[a-f0-9]{64}\/privacy.html/);
  assert.ok(html.includes('href="'+n.document.url+'"'));const privacy=await readFile(new URL(n.document.url.slice(1),root),'utf8');const {sha256}=await import('@notabenda/core/content');assert.equal(sha256(privacy),n.document.sha256);
  assert.match(await readFile(new URL(path+'advance.txt',root),'utf8'),/We plan to collect/);
  const response=await serveHost(request('/'+path),env);assert.equal(response.status,200);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);
 }
});

// @requirements REQ-PRODUCT-CF-HOST
test('simple development credentials require the explicit local flag and an exact loopback URL',async()=>{
 const basic={Authorization:'Basic '+btoa('admin:admin')},dev={NOTABENDA_LOCAL_DEV_AUTH:'1'};
 for(const host of ['127.0.0.1','localhost','[::1]'])assert.equal(await hostAuthorization(new Request(`http://${host}:4179/backoffice`,{headers:basic}),dev),null);
 assert.equal((await hostAuthorization(new Request('http://127.0.0.1:4179/backoffice'),dev)).status,401);
 for(const host of ['example.test','localhost.example.test','127.0.0.1.example.test']){
  const req=new Request(`https://${host}/backoffice`,{headers:basic});assert.equal((await hostAuthorization(req,dev)).status,503);assert.equal((await hostAuthorization(req,{...dev,ADMIN_KEY:key})).status,401);
 }
 assert.equal((await hostAuthorization(new Request('https://example.test/backoffice',{headers:auth}),{...dev,ADMIN_KEY:key})),null);
 for(const flag of [undefined,'0','true',true])assert.equal((await hostAuthorization(new Request('http://127.0.0.1:4179/backoffice',{headers:basic}),{ADMIN_KEY:key,NOTABENDA_LOCAL_DEV_AUTH:flag})).status,401);
});

// @requirements REQ-PRODUCT-REGIONAL-PROMPTS REQ-IT-REPROMPT
test('regional prompt laboratory uses explicit in-memory policy and self-hosted runtime without scripting legal routes',async()=>{
 const root=new URL('../dist/public/',import.meta.url),env={ADMIN_KEY:key,ASSETS:{fetch:async()=>new Response('asset')}};
 for(const prefix of ['','dark/']){
  const page=await readFile(new URL(prefix+'repeat-prompts/index.html',root),'utf8');assert.match(page,/example-pages\.css/);assert.match(page,/nb-demo-regions/);assert.match(page,/in this tab/);
  const config=JSON.parse(await readFile(new URL(prefix+'repeat-prompts/site.json',root),'utf8'));assert.equal(config.consent.promptPolicy.profile,'it-garante-2021');assert.equal(config.consent.refusalLifetimeDays,1);
  const response=await serveHost(request('/'+prefix+'repeat-prompts/'),env);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);
  const policy=await serveHost(request('/'+prefix+'repeat-prompts/privacy/'),env);assert.doesNotMatch(policy.headers.get('Content-Security-Policy'),/script-src/);
 }
 const script=await readFile(new URL('assets/repeat-prompts.mjs',root),'utf8');assert.match(script,/new Map/);assert.doesNotMatch(script,/localStorage|sessionStorage|document\.cookie/);
});

// @requirements REQ-PRODUCT-SCOPE-GUARDS
test('scope laboratory publishes declared restrictions with an inert runtime and script-free legal pages',async()=>{
 const root=new URL('../dist/public/',import.meta.url),env={ASSETS:{fetch:async()=>new Response('asset')}};
 for(const prefix of ['','dark/']){
  const page=await readFile(new URL(prefix+'scope-guards/index.html',root),'utf8');
  assert.match(page,/example-pages\.css/);assert.match(page,/nb-demo-guards/);assert.match(page,/id="guard-scenario"/);assert.doesNotMatch(page,/<(?:input|textarea)\b/u);
  const config=JSON.parse(await readFile(new URL(prefix+'scope-guards/site.json',root),'utf8'));
  assert.equal(config.scopeGuards.site.children,'absent');assert.equal(config.scopeGuards.purposes[0].facts.sensitiveData,'present');assert.deepEqual(config.storage,[]);
  const response=await serveHost(request('/'+prefix+'scope-guards/'),env);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);
  for(const kind of ['privacy','cookies','terms']){
   const legal=await serveHost(request('/'+prefix+'scope-guards/'+kind+'/'),env);assert.doesNotMatch(legal.headers.get('Content-Security-Policy'),/script-src/);
  }
 }
 const script=await readFile(new URL('assets/scope-guards.mjs',root),'utf8');assert.match(script,/new Map/);assert.doesNotMatch(script,/localStorage|sessionStorage|document\.cookie/);
 for(const file of ['scope-guards.js','scope-guard-policy.js'])await parseBrowserModule({entryPoints:[new URL('assets/runtime/'+file,root).pathname],bundle:true,platform:'browser',write:false});
});

// @requirements REQ-PRODUCT-RETAINED-RELEASES
test('clean site output retains exact old release URLs and connects both versions to authenticated history',async()=>{
  const root=new URL('../dist/public/',import.meta.url),releases=data.releases.filter(r=>(r.artifact.artifact??r.artifact).manifest.siteId==='juniper-releases');assert.equal(releases.length,2);
  const [before,after]=releases.map(r=>r.artifact);const index=await readFile(new URL('releases/index.html',root),'utf8');assert.doesNotMatch(index,/<script/);assert.match(index,new RegExp(before.manifest.artifactId));assert.match(index,new RegExp(after.manifest.artifactId));
  for(const a of [before,after])for(const d of a.manifest.documents)assert.equal(await readFile(new URL(`artifacts/${a.manifest.artifactId}/${d.kind}.html`,root),'utf8'),a.pages[d.file]);
  const current=await readFile(new URL('releases/terms/index.html',root),'utf8');assert.match(current,/export your notes before leaving/);assert.doesNotMatch(before.pages['releases/terms/index.html'],/export your notes before leaving/);
  const env={ASSETS:{fetch:async()=>new Response('Static retained example')},WORKSPACE:{get(){throw new Error('Public releases do not access the DO.');}}};
  for(const path of ['/releases',`/artifacts/${before.manifest.artifactId}/terms.html`]){const response=await serveHost(request(path),env);assert.equal(response.status,200);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);}
  const workspace=new EvidenceWorkspace(state(createSyntheticStorage([])),{ADMIN_KEY:key});const path=`/backoffice/history/diff?before=${before.manifest.artifactId}&after=${after.manifest.artifactId}&kind=terms`;
  assert.equal((await workspace.fetch(request(path))).status,401);const comparison=await workspace.fetch(request(path,{headers:auth}));assert.equal(comparison.status,200);assert.match(await comparison.text(),/export your notes before leaving/);
});

test('processing opt-outs bind a host context, survive object restart and expose historical and current restrictions',async()=>{
  const storage=createSyntheticStorage([]),env={ADMIN_KEY:key};let workspace=new EvidenceWorkspace(state(storage),env);
  for(const path of ['/backoffice/processing'])assert.equal((await serveHost(request(path),env)).status,401);
  const headers={...auth,Origin:'https://example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'};
  const body={schemaVersion:1,noticeId:data.processing.notice.noticeId,requestId:crypto.randomUUID(),activities:['sale']};
  for(const invalid of [{...headers,Origin:'https://attacker.test'},auth])assert.equal((await workspace.fetch(request('/demo/processing/record',{method:'POST',headers:invalid,body:JSON.stringify(body)}))).status,400);
  assert.equal((await storage.list({prefix:'',limit:500})).size,0);
  const first=await (await workspace.fetch(request('/demo/processing/record',{method:'POST',headers,body:JSON.stringify(body)}))).json();assert.equal(first.head.revision,1);assert.equal(first.receipt.provenance,'explicit-opt-out');
  const second=await (await workspace.fetch(request('/demo/processing/record',{method:'POST',headers,body:JSON.stringify({...body,requestId:crypto.randomUUID(),activities:['sharing']})}))).json();assert.deepEqual(second.head.event.restrictions,['sale','sharing']);
  workspace=new EvidenceWorkspace(state(storage),env);const retry=await (await workspace.fetch(request('/demo/processing/record',{method:'POST',headers,body:JSON.stringify(body)}))).json();assert.deepEqual(retry.receipt,first.receipt);assert.deepEqual(retry.head,second.head);
  for(const extra of [{streamId:'victim'},{provenance:'gpc-header'},{recordedAt:'2026-01-01'}])assert.equal((await workspace.fetch(request('/demo/processing/record',{method:'POST',headers,body:JSON.stringify({...body,requestId:crypto.randomUUID(),...extra})}))).status,400);
  const detail=await workspace.fetch(request('/backoffice/processing/record?id='+first.receipt.id,{headers:auth}));assert.equal(detail.status,200);const html=await detail.text();assert.match(html,/Requested in this event/);assert.match(html,/Retained after this event/);assert.match(html,/Current retained state at read time/);assert.match(html,/Sale · Sharing/);assert.match(html,/Action label/);assert.equal(detail.headers.get('Cache-Control'),'private, no-store, no-transform');
  const search=await workspace.fetch(request('/backoffice/processing?q=sharing+explicit-opt-out',{headers:auth}));assert.equal(search.status,200);assert.match(await search.text(),/Processing opt-out · revision/);
  let touched=false;const invalid=await serveHost(request('/demo/processing/record',{method:'POST',headers:{...headers,Origin:'https://attacker.test'},body:'{}'}),{...env,WORKSPACE:{get(){touched=true;}}});assert.equal(invalid.status,400);assert.equal(touched,false);
});

// @requirements REQ-PRODUCT-PRIVACY-SIGNALS
test('signal example starts conservatively with scoped runtime and a script-free supplied policy explanation',async()=>{
  const root=new URL('../dist/public/',import.meta.url);const html=await readFile(new URL('privacy-signals/index.html',root),'utf8');
  assert.match(html,/data-signal-requests[^>]*>0<\/output>/);assert.match(html,/data-simulate-signal hidden/);assert.doesNotMatch(html,/https:\/\/(?:google|doubleclick)/);
  const config=JSON.parse(await readFile(new URL('privacy-signals/site.json',root),'utf8'));assert.ok(config.services.every(s=>Array.isArray(s.processingActivities)));
  const privacy=await readFile(new URL('privacy-signals/privacy/index.html',root),'utf8');assert.match(privacy,/Global Privacy Control/);assert.doesNotMatch(privacy,/<script/);
  const env={ASSETS:{fetch:async()=>new Response('Fictional signal fixture')},WORKSPACE:{get(){throw new Error('Public fixture must not access records.');}}};
  assert.match((await serveHost(request('/privacy-signals/?simulate-gpc=1'),env)).headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);
  assert.doesNotMatch((await serveHost(request('/privacy-signals/privacy/'),env)).headers.get('Content-Security-Policy'),/script-src/);
});

// @requirements REQ-PRODUCT-EMBEDS
test('media example ships inert SSR and grants embedding policy only to its sample routes',async()=>{
  const root=new URL('../dist/public/',import.meta.url);
  const html=await readFile(new URL('embeds/index.html',root),'utf8');assert.doesNotMatch(html,/<iframe|<img|srcset=|rel="(?:preload|preconnect)"/);assert.match(html,/data-embed-requests[^>]*>0<\/output>/);assert.match(html,/hidden disabled/);
  const config=JSON.parse(await readFile(new URL('embeds/site.json',root),'utf8'));assert.deepEqual(config.services.find(s=>s.id==='sample-media').resourceOrigins,['self']);
  const env={ASSETS:{fetch:async()=>new Response('Fictional media')},WORKSPACE:{get(){throw new Error('Public media must not access the DO.');}}};
  for(const path of ['/embeds','/embeds/','/embeds/index.html']){
    const policy=(await serveHost(request(path),env)).headers.get('Content-Security-Policy');assert.match(policy,/frame-src 'self'/);assert.match(policy,/script-src 'self'/);assert.match(policy,/frame-ancestors 'none'/);
  }
  for(const path of ['/embeds/frame','/embeds/frame/','/embeds/frame/index.html']){
    const policy=(await serveHost(request(path),env)).headers.get('Content-Security-Policy');assert.match(policy,/frame-ancestors 'self'/);assert.doesNotMatch(policy,/script-src|frame-src/);
  }
  for(const path of ['/embeds/privacy','/embeds/cookies','/embeds/terms','/','/guide/embeds'])assert.match((await serveHost(request(path),env)).headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
});

// @requirements REQ-PRODUCT-ASTRO
test('real Astro example has no-script legal routes and an explicitly self-hosted interactive route policy',async()=>{
  const root=new URL('../dist/public/',import.meta.url);
  for(const kind of ['privacy','cookies','terms']){
    const html=await readFile(new URL(`astro/${kind}/index.html`,root),'utf8');assert.match(html,/data-document-kind=/);assert.doesNotMatch(html,/<script|<style/);
  }
  const env={ASSETS:{fetch:async()=>new Response('Static Astro example')},WORKSPACE:{get(){throw new Error('Public Astro routes must not access the DO.');}}};
  for(const path of ['/astro','/astro/','/astro/index.html','/astro/notes','/astro/notes/','/astro/notes/index.html'])assert.match((await serveHost(request(path),env)).headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);
  for(const path of ['/astro/privacy/','/astro/cookies/','/astro/terms/'])assert.doesNotMatch((await serveHost(request(path),env)).headers.get('Content-Security-Policy'),/script-src/);
  const html=await readFile(new URL('astro/index.html',root),'utf8');assert.match(html,/data-astro-requests(?:=""|="true")?[^>]*>0<\/output>/);assert.match(html,/data-notabenda-controls/);
  for(const [,attributes,body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)){
    assert.match(attributes,/src="\/_astro\/[a-zA-Z0-9_.-]+\.js"/u);assert.equal(body.trim(),'');
  }
});

// @requirements REQ-PRODUCT-REACT
test('React examples ship conservative SSR and self-hosted runtime only on their own routes',async()=>{
  const root=new URL('../dist/public/',import.meta.url);
  for(const prefix of ['','dark/']){
    const html=await readFile(new URL(`${prefix}react/index.html`,root),'utf8');assert.match(html,/data-request-count="true"[^>]*>0<\/output>/);assert.match(html,/Measurement: Off/);assert.match(html,/JavaScript is unavailable/);assert.doesNotMatch(html,/<dialog/);
    assert.match(html,/src="\/assets\/react-demo\.mjs"/);
    const privacy=await readFile(new URL(`${prefix}react/privacy/index.html`,root),'utf8');assert.doesNotMatch(privacy,/<script/);
  }
  for(const path of ['index.html','choices/index.html','privacy/index.html'])assert.doesNotMatch(await readFile(new URL(path,root),'utf8'),/react-demo\.mjs/);
  const env={ASSETS:{fetch:async()=>new Response('React example')},WORKSPACE:{get(){throw new Error('Public React must not access storage.');}}};
  for(const path of ['/react','/react/','/react/index.html','/dark/react'])assert.match((await serveHost(request(path),env)).headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);
});

// @requirements REQ-PRODUCT-AUTHORING
test('authored examples publish static HTML while source inspection stays authenticated across object restarts',async()=>{
  const releases=data.releases.filter(r=>Object.keys(r.artifact.sourceAttachments??{}).length);
  assert.equal(releases.length,2);
  const [before,after]=releases.map(r=>r.artifact.artifact.manifest.artifactId);
  const storage=createSyntheticStorage([]);const env={ADMIN_KEY:key};
  const path=`/backoffice/history/source-diff?before=${before}&after=${after}&kind=terms`;
  assert.equal((await new EvidenceWorkspace(state(storage),env).fetch(request(path))).status,401);
  assert.equal((await storage.list({prefix:'',limit:500})).size,0);
  const first=await new EvidenceWorkspace(state(storage),env).fetch(request(path,{headers:auth}));assert.equal(first.status,200);assert.match(await first.text(),/source changed/);
  const restarted=await new EvidenceWorkspace(state(storage),env).fetch(request(`/backoffice/history/source?id=${after}&kind=terms`,{headers:auth}));assert.equal(restarted.status,200);assert.match(await restarted.text(),/&lt;PolicyNote/);
  const html=await readFile(new URL('../dist/public/authored/terms/index.html',import.meta.url),'utf8');assert.match(html,/class="policy-note"/);assert.doesNotMatch(html,/<script|<PolicyNote|sourceAttachments/);
  const publicArtifact=JSON.parse(await readFile(new URL(`../dist/public/artifacts/${after}.json`,import.meta.url),'utf8'));assert.equal(Object.hasOwn(publicArtifact,'sourceAttachments'),false);
  // @requirements REQ-PRODUCT-AGENT-INTEGRATION
  // Public guide Markdown and the selected skill are deliberate assets; authored policy sources remain private.
  const manifest=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.some(path=>/\.mdx$/u.test(path)),false);
  assert.ok(manifest.filter(path=>/\.md$/u.test(path)).every(path=>/^guide\/.+\/index\.md$/u.test(path)||['skills/notabenda/SKILL.md','skills/notabenda/references/configuration-target.md'].includes(path)));
  assert.ok(manifest.includes('guide/authoring/index.html'));
});

test('host fails closed before assets or DO access for direct, normalized and encoded protected paths',async()=>{
  let accesses=0;
  const env={ADMIN_KEY:key,ASSETS:{fetch(){accesses++;throw new Error();}},WORKSPACE:{get(){accesses++;throw new Error();},idFromName(){accesses++;throw new Error();}}};
  for(const path of ['/backoffice','/backoffice/','/backoffice/history','/%62ackoffice/history','//backoffice/history','/x/../backoffice/history']) {
    const denied=await serveHost(request(path),env); assert.equal(denied.status,401,path); assert.equal(denied.headers.get('Cache-Control'),'private, no-store, no-transform'); assert.match(denied.headers.get('WWW-Authenticate'),/Basic/);
  }
  for(const ADMIN_KEY of [undefined,'','weak']) assert.equal((await serveHost(request('/backoffice'),{...env,ADMIN_KEY})).status,503);
  for(const path of ['/agreement%252findex.html','/%zz','/agreement%5cindex.html']) assert.equal((await serveHost(request(path),env)).status,400);
  assert.equal(accesses,0);
});

test('recorded-choice host endpoints bind a fixed stream, reject unauthorized/wrong-origin writes and recover the current head across restarts',async()=>{
  const storage=createSyntheticStorage([]);const env={ADMIN_KEY:key};let workspace=new EvidenceWorkspace(state(storage),env);
  const headers={...auth,Origin:'https://example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'};
  const head=await (await workspace.fetch(request('/demo/choices/head',{headers:auth}))).json();assert.equal(head.revision,0);
  const body={schemaVersion:1,noticeId:data.recordedConsent.notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:'accept-all',choices:Object.fromEntries(Object.keys(data.recordedConsent.notice.scopes).map(id=>[id,true])),clientAt:new Date().toISOString()};
  assert.equal((await workspace.fetch(request('/demo/choices/record',{method:'POST',headers:{...headers,Origin:'https://attacker.test'},body:JSON.stringify(body)}))).status,400);
  const result=await workspace.fetch(request('/demo/choices/record',{method:'POST',headers,body:JSON.stringify(body)}));assert.equal(result.status,200);const saved=await result.json();assert.equal(saved.head.revision,1);
  workspace=new EvidenceWorkspace(state(storage),env);const recovered=await (await workspace.fetch(request('/demo/choices/head',{headers:auth}))).json();assert.deepEqual(recovered,saved.head);
  const forged=await workspace.fetch(request('/demo/choices/record',{method:'POST',headers,body:JSON.stringify({...body,requestId:crypto.randomUUID(),streamId:'victim'})}));assert.equal(forged.status,400);
  const detail=await workspace.fetch(request('/backoffice/recorded/record?id='+saved.receipt.id,{headers:auth}));assert.equal(detail.status,200);assert.match(await detail.text(),/Notice wording/);
});

test('every emitted browser module resolves its static imports within the published asset tree',async()=>{
  const root=new URL('../dist/public/',import.meta.url);const files=new Set(JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8')));
  for(const file of files)if((file.startsWith('assets/')||file.startsWith('_astro/'))&&/\.(?:m?js)$/u.test(file)){
    const source=await readFile(new URL(file,root),'utf8');
    const parsed=await parseBrowserModule({stdin:{contents:source,sourcefile:file,loader:'js'},bundle:false,format:'esm',write:false,metafile:true,logLevel:'silent'});
    const imports=Object.values(parsed.metafile.outputs).flatMap(output=>output.imports.map(item=>item.path));
    for(const imported of imports){const url=new URL(imported,'https://example.test/'+file);assert.equal(url.origin,'https://example.test',file);assert.ok(files.has(url.pathname.slice(1)),`${file} imports missing ${imported}`);}

  }
});

test('host auth is exact and HTTPS-bound, while allowed public assets never touch the DO',async()=>{
  assert.equal(await hostAuthorization(request('/backoffice',{headers:auth}),{ADMIN_KEY:key}),null);
  for(const value of ['Bearer '+key,'Basic '+btoa('admin:wrong'),'Basic '+btoa('other:'+key),'Basic !']) assert.equal((await hostAuthorization(request('/backoffice',{headers:{Authorization:value}}),{ADMIN_KEY:key})).status,401);
  assert.equal((await hostAuthorization(new Request('http://example.test/backoffice',{headers:auth}),{ADMIN_KEY:key})).status,400);
  assert.equal(await hostAuthorization(new Request('http://localhost:4179/backoffice',{headers:auth}),{ADMIN_KEY:key}),null);
  const env={ASSETS:{fetch:async()=>new Response('Public site')},WORKSPACE:{get(){throw new Error('must not touch storage');}}};
  const response=await serveHost(request('/'),env); assert.equal(await response.text(),'Public site'); assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);
  const demo=await serveHost(request('/choices/index.html'),env); assert.match(demo.headers.get('Content-Security-Policy'),/script-src 'self'/);
});

test('invalid writes are rejected before object lookup or forwarding',async()=>{
  let accesses=0; const env={ADMIN_KEY:key,WORKSPACE:{idFromName(){accesses++;},get(){accesses++;}}};
  const response=await serveHost(request('/demo/agreements/light',{method:'POST',headers:{...auth,Origin:'https://attacker.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:'{}'}),env);
  assert.equal(response.status,400); assert.equal(accesses,0);
  const get=await serveHost(request('/demo/agreements/light',{headers:auth}),env); assert.equal(get.status,400); assert.equal(accesses,0);
  const post=await serveHost(request('/backoffice/history',{method:'POST',headers:auth,body:'{}'}),env); assert.equal(post.status,405); assert.equal(accesses,0);
});

test('operational backend errors bypass shared caching',async()=>{
  const error=await serveHost(request('/backoffice',{headers:auth}),{ADMIN_KEY:key,WORKSPACE:{idFromName:()=>1,get:()=>({fetch:async()=>{throw new Error('private failure');}})}});
  assert.equal(error.status,503); assert.equal(error.headers.get('Cache-Control'),'private, no-store, no-transform'); assert.doesNotMatch(await error.text(),/private failure/);
});

test('DO rechecks auth, requires exact-origin bounded writes, and persists the same receipt across object instances',async()=>{
  const storage=createSyntheticStorage([]); const env={ADMIN_KEY:key}; const workspace=new EvidenceWorkspace(state(storage),env);
  assert.equal((await workspace.fetch(request('/backoffice/history'))).status,401);
  assert.equal((await storage.list({prefix:'',limit:500})).size,0);
  const offer=data.agreements.find(entry=>entry.theme==='light').offer;
  const body={schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),accepted:true};
  const headers={...auth,Origin:'https://example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'};
  for(const altered of [{...headers,Origin:'https://attacker.test'},{...auth,Origin:'https://example.test','Content-Type':'application/json'}]) {
    assert.equal((await workspace.fetch(request('/demo/agreements/light',{method:'POST',headers:altered,body:JSON.stringify(body)}))).status,400);
  }
  assert.equal((await workspace.fetch(request('/demo/agreements/light',{method:'POST',headers,body:'x'.repeat(2049)}))).status,400);
  assert.equal((await storage.list({prefix:'',limit:500})).size,0);
  const first=await workspace.fetch(request('/demo/agreements/light',{method:'POST',headers,body:JSON.stringify(body)})); assert.equal(first.status,200); const receipt=await first.json();
  const restarted=new EvidenceWorkspace(state(storage),env);
  const retry=await restarted.fetch(request('/demo/agreements/light',{method:'POST',headers,body:JSON.stringify(body)})); assert.deepEqual(await retry.json(),receipt);
  const detail=await restarted.fetch(request('/backoffice/agreements/record?id='+receipt.id,{headers:auth})); assert.equal(detail.status,200); const html=await detail.text(); assert.match(html,/synthetic-admin-demo/); assert.match(html,/Statement shown/);
  const history=await restarted.fetch(request('/backoffice/history',{headers:auth})); assert.equal(history.status,200); assert.match(await history.text(),/Compare document releases/);
  const list=await storage.list({prefix:'notabenda/terms/juniper-agreement/events/',limit:500}); assert.equal(list.size,1);
});

test('deployment config runs auth before all assets and the asset tree contains only declared build outputs',async()=>{
  const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8')); assert.equal(config.assets.run_worker_first,true); assert.equal(config.assets.directory,'./dist/public');
  const root=new URL('../dist/public/',import.meta.url); const manifest=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8'));
  const actual=[];
  async function walk(directory,prefix='') {for(const entry of await readdir(directory,{withFileTypes:true})){const path=prefix+entry.name;if(entry.isDirectory()) await walk(new URL(entry.name+'/',directory),path+'/');else actual.push(path);}}
  await walk(root); assert.deepEqual(actual.sort(),manifest.sort());
  assert.ok(actual.includes('index.html')); assert.ok(actual.includes('guide/requirements/index.html')); assert.ok(actual.includes('assets/runtime/consent.js'));
  await parseBrowserModule({entryPoints:[new URL('assets/runtime/index.js',root).pathname],bundle:true,platform:'browser',write:false});
  assert.equal(actual.some(path=>/(?:\.dev\.vars|\.env|\.local|server-data|wrangler)/u.test(path)),false);
  const home=await readFile(new URL('index.html',root),'utf8'); assert.match(home,/Legal pages and/); assert.match(home,/not a compliance score/); assert.doesNotMatch(home,/<script|https:\/\/fonts/);
});

test('protected cookie evidence survives object restart and remains separate from public local choices',async()=>{
  const storage=createSyntheticStorage([]); const env={ADMIN_KEY:key};
  const first=new EvidenceWorkspace(state(storage),env);
  const path='/backoffice/choices';
  assert.equal((await first.fetch(request(path))).status,401);
  assert.equal((await storage.list({prefix:'',limit:500})).size,0);
  const response=await first.fetch(request(path,{headers:auth})); assert.equal(response.status,200);
  const html=await response.text(); assert.match(html,/Historical browser report/); assert.match(html,/Cookie choices/);
  const id=/href="\/backoffice\/choices\/record\?id=([a-f0-9]{64})"/u.exec(html)[1];
  const restarted=new EvidenceWorkspace(state(storage),env);
  const detail=await restarted.fetch(request(path+'/record?id='+id,{headers:auth})); assert.equal(detail.status,200);
  const text=await detail.text(); assert.match(text,/Notice wording/); assert.match(text,/Client-reported action time/); assert.match(text,/Revision superseded/); assert.match(text,/Choice expires/);
  const events=await storage.list({prefix:`notabenda/consent/${data.consent.notice.siteId}/events/`,limit:100}); assert.equal(events.size,3);
  assert.equal(detail.headers.get('Cache-Control'),'private, no-store, no-transform');
});

test('generated guide and example links resolve within the site or an explicit host route',async()=>{
  const root=new URL('../dist/public/',import.meta.url);
  const files=new Set(JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8')));
  const missing=[];
  for(const file of files) if(file.endsWith('.html')) {
    const html=await readFile(new URL(file,root),'utf8');
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/gu)) {
      const url=new URL(match[1].replaceAll('&amp;','&'),'https://example.test/'+file);
      assert.ok(!/^\/backoffice(?:\/|$)/u.test(url.pathname),`${file}: public navigation reaches operational admin`);
      assert.ok(!['localhost','127.0.0.1','[::1]'].includes(url.hostname),`${file}: published link points at loopback`);
      if(url.origin !== 'https://example.test' || /^\/(?:backoffice|demo\/admin)(?:\/|$)/u.test(url.pathname)) continue;
      const path=url.pathname.slice(1);
      if(!files.has(path) && !files.has(path.replace(/\/$/u,'')+'/index.html') && !(path==='' && files.has('index.html'))) missing.push(`${file}: ${url.pathname}`);
    }
  }
  assert.deepEqual([...new Set(missing)],[]);
});

// @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-STORAGE-CLEANUP
test('guided setup stays host-protected and local while storage cleanup example has narrowly scoped runtime CSP',async()=>{
  const env={ADMIN_KEY:key,ASSETS:{fetch:async()=>new Response('Static demo')},WORKSPACE:{get(){throw new Error('No setup storage');}}};
  assert.equal((await serveHost(request('/backoffice/setup'),env)).status,401);
  const response=await serveHost(request('/backoffice/setup',{headers:auth}),env);assert.equal(response.status,200);assert.match(await response.text(),/data-notabenda-setup/);assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/connect-src/);
  assert.equal((await serveHost(request('/backoffice/setup',{method:'POST',headers:auth}),env)).status,405);
  for(const path of ['/storage-cleanup','/storage-cleanup/','/storage-cleanup/index.html'])assert.match((await serveHost(request(path),env)).headers.get('Content-Security-Policy'),/script-src 'self'/);
  assert.doesNotMatch((await serveHost(request('/storage-cleanup/privacy'),env)).headers.get('Content-Security-Policy'),/script-src/);
});

// @requirements REQ-PRODUCT-COLLECTION-NOTICE
test('collection example stays script-free and pins the displayed notice to its exact privacy release',async()=>{
 const {createHash}=await import('node:crypto');const root=new URL('../dist/public/',import.meta.url);
 for(const prefix of ['','dark/']){const html=await readFile(new URL(prefix+'collection/index.html',root),'utf8');assert.doesNotMatch(html,/<script|<input[^>]*type="checkbox"|<button[^>]*type="submit"/);assert.match(html,/aria-describedby="message-privacy-summary"/);assert.match(html,/id="message-privacy-notice"/);const notice=JSON.parse(await readFile(new URL(prefix+'collection/notice.json',root),'utf8'));assert.ok(html.includes(notice.document.url));const page=await readFile(new URL(notice.document.url.slice(1),root),'utf8');assert.equal(createHash('sha256').update(page).digest('hex'),notice.document.sha256);}
});

// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-CONSENT-RUNTIME
test('choices status outputs identify their context and recorded navigation makes mode changes explicit',async()=>{
 const {JSDOM}=await import('jsdom');
 const root=new URL('../dist/public/',import.meta.url);
 for(const path of ['choices/index.html','dark/choices/index.html','recorded-choices/index.html']){
  const document=new JSDOM(await readFile(new URL(path,root),'utf8')).window.document;
  for(const [id,label] of [['measurements','Measurement'],['suggestions','Suggestions'],['request-count','Sample requests started']]){
   const output=document.getElementById(id);assert.equal(output.tagName,'OUTPUT');
   assert.equal(document.getElementById(output.getAttribute('aria-labelledby')).textContent,label);
  }
  if(path.startsWith('recorded')){
   assert.equal(document.querySelector('.theme-link'),null);
   assert.match(document.querySelector('.choices-theme-card a').textContent,/local-only/);
  }
 }
});

// @requirements REQ-PRODUCT-EVIDENCE-EXPORT REQ-PRODUCT-CF-HOST
test('evidence export stays host-protected and downloads the authorized history projection with explicit continuation',async()=>{
 const workspace=new EvidenceWorkspace(state(createSyntheticStorage([])),{ADMIN_KEY:key});
 for(const route of ['/backoffice/history/export','/backoffice/history/export.json'])assert.equal((await workspace.fetch(request(route))).status,401);
 const preview=await workspace.fetch(request('/backoffice/history/export?limit=1',{headers:auth}));assert.equal(preview.status,200);assert.match(await preview.text(),/Downloads a fresh read/);
 const response=await workspace.fetch(request('/backoffice/history/export.json?limit=1',{headers:auth}));assert.equal(response.status,200);assert.match(response.headers.get('Content-Disposition'),/attachment/);assert.match(response.headers.get('Cache-Control'),/private, no-store/);
 const data=await response.json();assert.equal(data.records.length,1);assert.equal(data.records[0].data.kind,'document-release');assert.equal(data.segment.continuationRequired,true);
 for(const field of ['pages','publicConfig','sourceAttachments'])assert.equal(Object.hasOwn(data.records[0].data,field),false);
 const next=await workspace.fetch(request(data.links.nextDownload,{headers:auth}));assert.equal(next.status,200);const following=await next.json();assert.notEqual(data.records[0].id,following.records[0].id);
 const deniedNext=await workspace.fetch(request(data.links.nextDownload));assert.equal(deniedNext.status,401);
});

// @requirements REQ-PRODUCT-DISCOVERY
test('standalone discovery examples ship local optional tools and leave legal routes script-free',async()=>{
 const root=new URL('../dist/public/',import.meta.url);
 for(const prefix of ['','dark/']){const html=await readFile(new URL(prefix+'discovery/index.html',root),'utf8');assert.match(html,/discovery-demo\.mjs/);assert.match(html,/id="discovery-tool"/);const legal=await readFile(new URL(prefix+'discovery/privacy/index.html',root),'utf8');assert.doesNotMatch(legal,/<script/);}
 const env={ASSETS:{fetch:async()=>new Response('Asset')},WORKSPACE:{get(){throw Error('No DO needed.');}}};
 const page=await serveHost(request('/discovery/'),env);assert.match(page.headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);
 const policy=await serveHost(request('/discovery/privacy/'),env);assert.doesNotMatch(policy.headers.get('Content-Security-Policy'),/script-src/);
});

// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-REACT
test('shared example framing preserves the exact framework-owned SSR tree',async()=>{
 const [{JSDOM},{createElement},{renderToString},{createConsentRuntime},{App}]=await Promise.all([import('jsdom'),import('react'),import('react-dom/server'),import('@notabenda/core/consent'),import('../../examples/react/view.mjs')]);
 const root=new URL('../dist/public/',import.meta.url);
 for(const prefix of ['','dark/']){
  const page=JSON.parse(await readFile(new URL(prefix+'react/site.json',root),'utf8')),controller=createConsentRuntime(page.runtime,{}),config=page.runtime.inventory;
  try{const expected=new JSDOM('<div id="expected">'+renderToString(createElement(App,{controller,config,legalLinks:page.legalLinks}))+'</div>').window.document.getElementById('expected');const actual=new JSDOM(await readFile(new URL(prefix+'react/index.html',root),'utf8')).window.document.getElementById('react-root');assert.equal(actual.innerHTML,expected.innerHTML);}finally{await controller.destroy();}
 }
});

// @requirements REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-RETAINED-RELEASES
test('example styling never changes the exact pinned legal bytes behind any emitted artifact',async()=>{
 const {createHash}=await import('node:crypto'),root=new URL('../dist/public/',import.meta.url);
 const artifacts=(await readdir(new URL('artifacts/',root))).filter(path=>/^[a-f0-9]{64}\.json$/u.test(path));assert.ok(artifacts.length>10);
 for(const file of artifacts){const artifact=JSON.parse(await readFile(new URL('artifacts/'+file,root),'utf8'));for(const doc of artifact.manifest.documents){const html=await readFile(new URL(`artifacts/${artifact.manifest.artifactId}/${doc.kind}.html`,root),'utf8');assert.equal(createHash('sha256').update(html).digest('hex'),doc.sha256);assert.doesNotMatch(html,/example-pages\.css|nb-demo-page/);}}
});

// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
test('lifecycle workspace explains holds and purge progress, resumes interrupted bootstrap and never exposes mutation routes',async()=>{
 const {lifecycleDemoPrefix,seedEvidenceLifecycle}=await import('../../examples/lifecycle.mjs');const storage=createSyntheticStorage([]),env={ADMIN_KEY:key};let workspace=new EvidenceWorkspace(state(storage),env);
 assert.equal((await serveHost(request('/backoffice/lifecycle'),env)).status,401);
 // Fail exactly during the restore drill, after an old event has returned but before its old head.
 const put=storage.put;let stopped=false;storage.put=async(name,value)=>{if(!stopped&&name.startsWith(lifecycleDemoPrefix+'heads/')){stopped=true;throw Error('Interrupted synthetic restore');}return put(name,value);};
 await assert.rejects(seedEvidenceLifecycle(storage,data),/Interrupted synthetic restore/);assert.equal(stopped,true);storage.put=put;
 let response=await workspace.fetch(request('/backoffice/lifecycle',{headers:auth}));assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store, no-transform');const html=await response.text();assert.match(html,/Cookie-choice evidence · on hold/);assert.match(html,/retired, purge pending/);assert.match(html,/purge recorded complete/);assert.doesNotMatch(html,/synthetic-lifecycle-subject|synthetic-lifecycle-complete/);
 const records=[...(await storage.list({prefix:lifecycleDemoPrefix+'lifecycle/',limit:100})).values()];assert.equal(records.length,5);assert.equal(records.filter(r=>r.phase==='complete').length,3);assert.equal(records.filter(r=>r.phase==='purging').length,1);assert.equal(records.filter(r=>r.hold.active).length,1);const restored=records.find(r=>r.family==='consent'&&r.phase==='complete');assert.ok(restored.restoredAt);assert.equal(restored.progress.deleted,1);
 const detail=await workspace.fetch(request('/backoffice/lifecycle/record?id=consent/'+restored.contextRef,{headers:auth}));assert.equal(detail.status,200);const view=await detail.text();for(const phrase of ['Matching events removed','Manifest reapplied after restore','Purge completion recorded','Minimal lifecycle metadata','scoped scan'])assert.match(view,new RegExp(phrase));
 const held=records.find(r=>r.hold.active);const hold=await workspace.fetch(request('/backoffice/lifecycle/record?id=consent/'+held.contextRef,{headers:auth}));assert.match(await hold.text(),/Reaching this date does not release the hold/);
 const exportResponse=await workspace.fetch(request('/backoffice/lifecycle/export.json',{headers:auth}));assert.equal(exportResponse.status,200);assert.match(await exportResponse.text(),/evidence-lifecycle/);
 for(const path of ['/backoffice/lifecycle','/backoffice/lifecycle/purge','/backoffice/lifecycle/hold','/backoffice/lifecycle/export.json'])assert.equal((await workspace.fetch(request(path,{method:'POST',headers:auth}))).status,405);
 const before=JSON.stringify(await storage.list({prefix:lifecycleDemoPrefix+'lifecycle/',limit:100}),(_,value)=>value instanceof Map?[...value]:value);workspace=new EvidenceWorkspace(state(storage),env);await workspace.fetch(request('/backoffice/lifecycle',{headers:auth}));assert.equal(JSON.stringify(await storage.list({prefix:lifecycleDemoPrefix+'lifecycle/',limit:100}),(_,value)=>value instanceof Map?[...value]:value),before);
 assert.equal((await workspace.fetch(request('/demo/choices/head',{headers:auth}))).status,200);assert.equal((await workspace.fetch(request('/demo/processing/head',{headers:auth}))).status,200);
});

// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
test('trusted retired demo contexts return terminal 410 on reads and writes, rather than empty heads or retryable failures',async()=>{
 const {createEvidenceLifecycle}=await import('@notabenda/cloudflare');const storage=createSyntheticStorage([]),workspace=new EvidenceWorkspace(state(storage),{ADMIN_KEY:key});await workspace.initialize();
 const targets=[{family:'consent',siteId:data.recordedConsent.notice.siteId,scopeId:data.recordedConsent.notice.scopeId,streamId:'synthetic-admin-cookie-demo'},{family:'processing',siteId:data.processing.notice.siteId,scopeId:data.processing.notice.scopeId,streamId:'synthetic-admin-processing-demo'},{family:'terms',siteId:data.agreements[0].offer.siteId,subjectId:'synthetic-admin-demo'}];
 for(const target of targets){const controller=await createEvidenceLifecycle(storage,target);await controller.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:'2026-10-18T12:00:00.000Z',legalHold:false});}
 const headers={...auth,Origin:'https://example.test','Content-Type':'application/json','X-Notabenda-Demo':'1'};
 for(const path of ['/demo/choices/head','/demo/processing/head']){const result=await workspace.fetch(request(path,{headers:auth}));assert.equal(result.status,410);assert.deepEqual(await result.json(),{code:'context-retired'});}
 const commands=[['/demo/choices/record',{schemaVersion:1,noticeId:data.recordedConsent.notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:'revoke-all',choices:Object.fromEntries(Object.keys(data.recordedConsent.notice.scopes).map(id=>[id,false])),clientAt:new Date().toISOString()}],['/demo/processing/record',{schemaVersion:1,noticeId:data.processing.notice.noticeId,requestId:crypto.randomUUID(),activities:['sale']}],['/demo/agreements/light',{schemaVersion:1,offerId:data.agreements.find(r=>r.theme==='light').offer.offerId,requestId:crypto.randomUUID(),accepted:true}]];
 for(const [path,body] of commands){const result=await workspace.fetch(request(path,{method:'POST',headers,body:JSON.stringify(body)}));assert.equal(result.status,410);assert.deepEqual(await result.json(),{code:'context-retired'});assert.equal(result.headers.get('Cache-Control'),'private, no-store, no-transform');}
});

// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
test('every interactive example uses the shared visual foundation across frameworks and themes',async()=>{
 const root=new URL('../dist/public/',import.meta.url),files=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8'));let checked=0;
 for(const file of files){if(!file.endsWith('.html'))continue;const html=await readFile(new URL(file,root),'utf8');if(!/<body[^>]*class="[^"]*nb-page/u.test(html)||!/<script/u.test(html))continue;
  assert.match(html,/href="\/assets\/example-theme\.css"/,file);checked++;
 }
 assert.ok(checked>=15,'The contract covers the live example set, not a hand-picked page.');
});

// @requirements REQ-PRODUCT-RIGHTS-CENTER
 test('rights examples and Astro entry points stay script-free, connected and honest about the application handoff',async()=>{
  const root=new URL('../dist/public/',import.meta.url),env={ASSETS:{fetch:async()=>new Response('asset')}};
  for(const prefix of ['','dark/']){
   const page=await readFile(new URL(prefix+'rights/index.html',root),'utf8');assert.match(page,/nb-demo-rights/);assert.match(page,/example-theme\.css/);assert.doesNotMatch(page,/<script|<form|<input/);
   const {JSDOM}=await import('jsdom');const dom=new JSDOM(page);assert.equal(dom.window.document.querySelectorAll('.nb-rights-action').length,6);assert.ok(dom.window.document.querySelector('.nb-rights-contact a').href.startsWith('mailto:'));dom.window.close();
   const response=await serveHost(request('/'+prefix+'rights/'),env);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src|connect-src/);
   const destination=await readFile(new URL(prefix+'rights/workflow/access/index.html',root),'utf8');assert.match(destination,/Nothing has been submitted/);assert.match(destination,/Back to privacy requests/);assert.doesNotMatch(destination,/<script|<form|<input/);
  }
  const astro=await readFile(new URL('astro/requests/index.html',root),'utf8');assert.match(astro,/id="astro-rights-title"/);assert.match(astro,/nb-rights-action/);assert.doesNotMatch(astro,/<script/);
  assert.doesNotMatch((await serveHost(request('/astro/requests/'),env)).headers.get('Content-Security-Policy'),/script-src|connect-src/);
 });

// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-DEMO-WORKSPACE
test('notice wording updates seed a separate example journey without changing retained receipts or breaking existing workspaces',async()=>{
 const {seedConsentExample}=await import('../../examples/consent-evidence.mjs'),{compileLegalDocuments,createConsentNotice}=await import('@notabenda/core/content');
 const storage=createSyntheticStorage([]),first=await seedConsentExample(storage,data.consent),oldRecords=await Promise.all(first.records.map(id=>first.store.get(id)));
 const config=structuredClone(data.consent.artifact.publicConfig);config.purposes[0].description+=' More precise purpose wording.';
 const build=compileLegalDocuments(config,{mode:'preview'}),notice=createConsentNotice(build.artifact,{scopeId:data.consent.notice.scopeId},{mode:'preview'}),next={artifact:build.artifact,notice};
 const updated=await seedConsentExample(storage,next);assert.ok(updated.records.every(id=>!first.records.includes(id)));await seedConsentExample(storage,next);
 for(const [i,id] of first.records.entries())assert.deepEqual(await first.store.get(id),oldRecords[i]);assert.equal((await storage.list({prefix:`notabenda/consent/${notice.siteId}/events/`,limit:100})).size,6);
});

// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
test('React form permission entries retain the shared design, inert server markup and bundled local runtime',async()=>{
 const root=new URL('../dist/public/',import.meta.url);
 for(const prefix of ['','dark/']){
  const html=await readFile(new URL(prefix+'form-permissions/react/index.html',root),'utf8');assert.match(html,/id="react-permission-root"/);assert.match(html,/nb-demo-permissions/);assert.match(html,/example-theme\.css/);assert.match(html,/assets\/react-form-permissions\.mjs/);assert.doesNotMatch(html,/type="checkbox"|notabenda-permission-stream|notabenda-demo-generation|\/backoffice/);assert.match(html,/Permission controls require JavaScript/);assert.match(html,/type="submit" disabled=""/);assert.match(html,/form-permissions\/privacy/);
 }
 const path=new URL('assets/react-form-permissions.mjs',root).pathname,source=await readFile(path,'utf8');assert.match(source,/\/demo\/permissions\/state/);assert.match(source,/\/demo\/permissions\/record/);assert.doesNotMatch(source,/from\s*["'](?:react|node:|cloudflare:)/);await parseBrowserModule({entryPoints:[path],bundle:true,write:false,platform:'browser',external:['/assets/demo-session.mjs']});
});

/** @requirements REQ-PRODUCT-CF-HOST */
test('host cache policy preserves released bytes and caching directives while preventing intermediary transforms',async()=>{
 const html='<!doctype html><html><body><p>Exact released wording — unchanged.</p></body></html>';
 for(const path of ['/','/guide/setup/','/privacy/','/artifacts/'+'a'.repeat(64)+'/terms.html','/assets/notabenda.css']){
  for(const policy of [undefined,'public, max-age=3600, must-revalidate','private, max-age=0','public, NO-TRANSFORM']){
   const headers={'Content-Type':path.endsWith('.css')?'text/css':'text/html',ETag:'"pinned-bytes"',...(policy?{'Cache-Control':policy}:{})};
   const response=await serveHost(request(path),{ASSETS:{fetch:async()=>new Response(html,{headers})}});
   assert.equal(await response.text(),html);assert.equal(response.headers.get('ETag'),'"pinned-bytes"');
   const directives=response.headers.get('Cache-Control').toLowerCase().split(',').map(v=>v.trim());assert.equal(directives.filter(v=>v==='no-transform').length,1);
   if(policy)for(const directive of policy.toLowerCase().split(',').map(v=>v.trim()))assert.ok(directives.includes(directive));
   assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/cloudflareinsights|unsafe-inline/);
  }
 }
 const denied=await serveHost(request('/backoffice'),{ADMIN_KEY:key});assert.equal(denied.status,401);assert.equal(denied.headers.get('Cache-Control'),'private, no-store, no-transform');assert.equal(denied.headers.get('Vary'),'Authorization');
});

// @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-CF-HISTORY REQ-PRODUCT-RETAINED-RELEASES
test('catalog-reference releases keep public legal bytes unchanged and private comparison separately inspectable',async()=>{
 const retained=data.releases.filter(r=>r.artifact.catalogReview);assert.equal(retained.length,2);const [before,after]=retained.map(r=>r.artifact);assert.deepEqual(before.artifact.pages,after.artifact.pages);assert.notEqual(before.artifact.manifest.artifactId,after.artifact.manifest.artifactId);
 const root=new URL('../dist/public/',import.meta.url);for(const archive of [before,after]){const id=archive.artifact.manifest.artifactId;const published=JSON.parse(await readFile(new URL(`artifacts/${id}.json`,root),'utf8'));assert.equal(Object.hasOwn(published,'catalogReview'),false);assert.deepEqual(published.manifest.catalogReview,archive.artifact.manifest.catalogReview);assert.doesNotMatch(JSON.stringify(published),/PRIVATE_CATALOG_EXAMPLE_REASON/);}
 const page=await readFile(new URL('catalog-releases/index.html',root),'utf8');assert.match(page,/example-pages\.css/);assert.match(page,/catalog-review-diff/);
 const workspace=new EvidenceWorkspace(state(createSyntheticStorage([])),{ADMIN_KEY:key}),path='/backoffice/history/catalog-review-diff?before='+before.artifact.manifest.artifactId+'&after='+after.artifact.manifest.artifactId;
 assert.equal((await workspace.fetch(request(path))).status,401);const comparison=await workspace.fetch(request(path,{headers:auth}));assert.equal(comparison.status,200);const html=await comparison.text();assert.match(html,/Catalog review changes/);assert.match(html,/Cedar Mail/);assert.match(html,/Changed: catalog facts/);assert.doesNotMatch(html,/PRIVATE_CATALOG_EXAMPLE_REASON/);
});

// @requirements REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-A11Y
 test('demo ribbons distinguish example pages and session admin from the project website',async()=>{
 const {JSDOM}=await import('jsdom'),{markDemoResponse}=await import('../demo-marker.mjs'),root=new URL('../dist/public/',import.meta.url);
 for(const path of ['choices/index.html','dark/choices/index.html','agreement/index.html','astro/index.html','discovery/index.html','cookies/index.html']){
  const html=await readFile(new URL(path,root),'utf8'),document=new JSDOM(html).window.document;
  assert.equal(document.querySelectorAll('.demo-corner').length,1,path);
  assert.equal(document.querySelector('.demo-corner').textContent,'Demo');
  assert.ok(document.querySelector('link[href="/assets/demo-marker.css"]'));
 }
 for(const path of ['index.html','examples/index.html','guide/package/index.html','website-privacy/index.html'])assert.doesNotMatch(await readFile(new URL(path,root),'utf8'),/class="demo-corner"/,path);
 const {createWorkspaceOverviewWorker}=await import('@notabenda/cloudflare');
 const demoHome=()=>createWorkspaceOverviewWorker({basePath:'/demo/admin',authorize:()=>({areas:[]})}).fetch(new Request('https://example.test/demo/admin'),{});
 const marked=await markDemoResponse(await demoHome()),html=await marked.text();assert.match(html,/class="demo-corner"/);
 const again=await markDemoResponse(new Response(html,{headers:{'Content-Type':'text/html'}}));assert.equal((await again.text()).match(/class="demo-corner"/gu).length,1);
 const json=Response.json({ok:true});assert.equal(await markDemoResponse(json),json);
 });

// @requirements REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
 test('complete producer label examples deliver unchanged artwork, bind readable product facts and offer optional keyboard inspection',async()=>{
 const {JSDOM}=await import('jsdom'),{createHash}=await import('node:crypto'),root=new URL('../dist/public/',import.meta.url),source=await readFile(new URL('../../examples/guarantees/producer/juniper-jw-01.svg',import.meta.url));
 let label;
 for(const prefix of ['','dark/']){
  const path=prefix+'guarantees/product/',html=await readFile(new URL(path+'index.html',root),'utf8'),current=JSON.parse(await readFile(new URL(path+'label.json',root),'utf8')),document=new JSDOM(html).window.document;
  if(label)assert.deepEqual(current,label);else label=current;
  const figure=document.querySelector('.nb-guarantee-label img');assert.equal(figure.getAttribute('src'),current.asset.url);assert.equal(document.querySelector('.nb-guarantee-label').getAttribute('data-product-id'),current.product.id);
  for(const fact of [current.product.name,current.producer.brand,current.producer.model,current.wording.durationValue])assert.ok(document.querySelector('.nb-guarantee-label').textContent.includes(fact));
  const bytes=await readFile(new URL(current.asset.url.slice(1),root));assert.deepEqual(bytes,source);assert.equal(createHash('sha256').update(bytes).digest('hex'),current.asset.sha256);
  const inspection=document.querySelector('.producer-inspection');assert.equal(inspection.open,false);assert.ok(inspection.querySelector('summary'));
  const region=inspection.querySelector('[role="region"]');assert.equal(region.getAttribute('tabindex'),'0');assert.ok(document.getElementById(region.getAttribute('aria-describedby')));
  assert.equal(region.querySelector('img').getAttribute('src'),current.asset.url);assert.equal(region.querySelector('img').getAttribute('width'),'1080');
  assert.equal(document.querySelectorAll('.demo-corner').length,1);assert.match(html,/example-pages\.css/);assert.match(html,/Source &amp; preparation/);assert.doesNotMatch(html,/<script|<form|<input/);
  const env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},WORKSPACE:{get(){throw Error('Static product information must not open an evidence store.');}}};
  const response=await serveHost(request('/'+path),env);assert.equal(response.status,200);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);
 }
 const gallery=new JSDOM(await readFile(new URL('examples/index.html',root),'utf8')).window.document;assert.ok(gallery.querySelector('a[href="/examples/contracts/"]'));const contracts=new JSDOM(await readFile(new URL('examples/contracts/index.html',root),'utf8')).window.document;assert.ok(contracts.querySelector('a[href="/guarantees/product/"]'));
 });

// @requirements REQ-PRODUCT-PUBLICATION-CHECK REQ-PRODUCT-RETAINED-RELEASES
test('pinned document URLs resolve internally without exposing asset canonical redirects or touching records',async()=>{
 const id='a'.repeat(64),seen=[],bytes='<article>Exact retained document</article>';
 const env={ASSETS:{fetch:async req=>{const url=new URL(req.url);seen.push([url.pathname,req.method,url.search]);return url.pathname.endsWith('.html')?new Response(null,{status:307,headers:{Location:url.pathname.slice(0,-5)}}):new Response(req.method==='HEAD'?null:bytes,{headers:{'Content-Type':'text/html; charset=utf-8'}});}},WORKSPACE:{get(){throw Error('Public pinned files do not read records');}},DEMO_WORKSPACES:{get(){throw Error('Public pinned files do not allocate a demo');}}};
 for(const kind of ['privacy','cookies','terms'])for(const method of ['GET','HEAD']){
  const response=await serveHost(request(`/artifacts/${id}/${kind}.html?revision=retained`,{method}),env);
  assert.equal(response.status,200);assert.equal(response.headers.get('Location'),null);assert.equal(response.headers.get('Set-Cookie'),null);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);assert.match(response.headers.get('Cache-Control'),/no-transform/);assert.equal(await response.text(),method==='HEAD'?'':bytes);
  assert.deepEqual(seen.at(-1),[`/artifacts/${id}/${kind}`,method,'?revision=retained']);
 }
 for(const path of [`/artifacts/${id}.json`,`/artifacts/${id}/other.html`,'/guide/setup/index.html']){seen.length=0;await serveHost(request(path),env);assert.equal(seen[0][0],path);}
 const before=seen.length;assert.equal((await serveHost(request(`/artifacts/${id}/privacy.html`,{method:'POST'}),env)).status,405);assert.equal(seen.length,before);
});
