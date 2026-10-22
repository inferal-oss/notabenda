// @requirements REQ-PRODUCT-PUBLICATION-INSPECTION
// @requirements REQ-PRODUCT-RECORDING-INSPECTION REQ-PRODUCT-CF-HOST REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {serveHost} from '../host.mjs';
import {DemoWorkspace} from '../worker.mjs';
import data from '../dist/server-data.json' with {type:'json'};
import {createSyntheticStorage} from '../../packages/notabenda-cf/examples/synthetic.mjs';
import {setActiveTermsOffer} from '@notabenda/cloudflare';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const req=(path,cookie)=>new Request('https://example.test'+path,{headers:cookie?{Cookie:cookie}:{}});
function environment(){
 const objects=new Map(),env={ADMIN_KEY:'a'.repeat(64),DEMO_PROVISION_LIMITER:{limit:async()=>({success:true})},WORKSPACE:{idFromName(){throw Error('No operational access');}},ASSETS:{fetch:async request=>new Response(await readFile(new URL('../dist/public'+new URL(request.url).pathname,import.meta.url)),{headers:{'Content-Type':'image/svg+xml'}})}};
 env.DEMO_WORKSPACES={idFromName:name=>name,get(name){if(!objects.has(name)){const storage=createSyntheticStorage([]);storage.setAlarm=async()=>{};storage.deleteAll=async()=>{};objects.set(name,{storage,workspace:new DemoWorkspace({storage,blockConcurrencyWhile:fn=>fn()},env)});}return {fetch:request=>objects.get(name).workspace.fetch(request)};}};
 return {env,objects};
}
async function session(env){const response=await serveHost(req('/demo/admin'),env);assert.equal(response.status,200);const cookie=response.headers.get('Set-Cookie').split(';')[0];assert.match(await response.text(),/Inspect selections/);return cookie;}
const state=async storage=>[...await storage.list({prefix:'notabenda/',limit:10000})];

test('demo recording views read only their own database and preserve all recording payloads while operational access stays protected',async()=>{
 const {env,objects}=environment(),a=await session(env),b=await session(env),[first,second]=[...objects.values()],offer=data.agreements.find(x=>x.theme==='light').offer;await setActiveTermsOffer(first.storage,null,{siteId:offer.siteId,scopeId:offer.scopeId,allowPreview:true});const before=await state(first.storage);
 const response=await serveHost(req('/demo/admin/recording',a),env),html=await response.text(),d=new JSDOM(html).window.document;assert.equal(response.status,200);assert.equal(d.querySelectorAll('.recording-item').length,8);assert.equal(d.querySelectorAll('.recording-status').length,8);assert.ok(d.querySelector('.demo-corner'));assert.match(d.body.textContent,/Collection form updates/);assert.ok(d.body.textContent.includes('Inactive'));assert.equal(response.headers.get('Cache-Control'),'private, no-store, no-transform');assert.match(response.headers.get('Content-Security-Policy'),/nonce-/);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src|unsafe-inline/);assert.deepEqual(await state(first.storage),before);
 const json=await(await serveHost(req('/demo/admin/recording?format=json',a),env)).json(),other=await(await serveHost(req('/demo/admin/recording?format=json',b),env)).json();assert.equal(json.observations.find(o=>o.target.id==='terms-light').selection.status,'inactive');assert.equal(json.observations.find(o=>o.target.id==='terms-light').comparison.status,'inactive');assert.equal(other.observations.find(o=>o.target.id==='terms-light').selection.status,'selected');assert.ok(other.observations.every(o=>o.selection?.status==='selected'));assert.ok(other.observations.every(o=>o.comparison.status==='matches'));assert.ok(other.observations.every(o=>o.comparison.expected.mode==='preview'));assert.equal(other.boundaries.verifiesExpectedArchive,false);assert.deepEqual(await state(first.storage),before);assert.ok((await state(second.storage)).length);
 assert.equal((await serveHost(req('/backoffice/recording'),env)).status,401);assert.equal((await serveHost(req('/demo/admin/recording?scope=other',a),env)).status,400);
});

test('actual selected recording cards and their native references retain semantic structure',async()=>{
 const {env}=environment(),cookie=await session(env),html=await(await serveHost(req('/demo/admin/recording',cookie),env)).text(),audit=await createAccessibilityAudit(html,{label:'Recording setup'});
 try{let result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);assert.deepEqual(result.warnings,[]);const d=audit.dom.window.document;d.querySelector('.recording-item details').open=true;result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);assert.equal(result.incomplete.some(v=>v.id==='aria-prohibited-attr'),false);assert.equal(d.querySelectorAll('h1').length,1);assert.ok([...d.querySelectorAll('.recording-item summary')].every(s=>s.textContent.trim()));}finally{audit.close();}
});


test('explicit demo served-copy checks use only the asset binding and leave both session databases unchanged',async()=>{
 const {env,objects}=environment();let fetched=[];
 env.ASSETS.fetch=async request=>{const url=new URL(request.url);fetched.push({url:url.href,cookie:request.headers.get('Cookie'),authorization:request.headers.get('Authorization'),redirect:request.redirect});return new Response(await readFile(new URL('../dist/public'+url.pathname+'.html',import.meta.url)),{headers:{'Content-Type':'text/html; charset=utf-8'}});};
 const cookie=await session(env),object=[...objects.values()][0],before=await state(object.storage);
 const initial=await(await serveHost(req('/demo/admin/recording?format=json',cookie),env)).json();assert.ok(initial.observations.every(o=>o.publication.status==='not-requested'));assert.equal(fetched.length,0);
 const json=await(await serveHost(req('/demo/admin/recording?format=json&publication=check',cookie),env)).json();assert.ok(json.observations.every(o=>o.publication.status==='matched'));assert.equal(fetched.length,8);assert.ok(fetched.every(r=>r.url.startsWith('https://notabenda.org/artifacts/')&&!r.url.endsWith('.html')&&r.cookie===null&&r.authorization===null&&r.redirect==='manual'));assert.equal(json.boundaries.verifiesPublicRouting,false);assert.deepEqual(await state(object.storage),before);
 const html=await(await serveHost(req('/demo/admin/recording?publication=check',cookie),env)).text(),audit=await createAccessibilityAudit(html,{label:'served recording copies'});try{const result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);assert.ok(audit.dom.window.document.body.textContent.includes('Website asset binding'));assert.equal(audit.dom.window.document.querySelectorAll('[data-status=matched]').length,8);}finally{audit.close();}
});
