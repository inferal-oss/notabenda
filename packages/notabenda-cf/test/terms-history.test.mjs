// @requirements REQ-PRODUCT-TERMS-HISTORY REQ-PRODUCT-CF-HISTORY REQ-PRODUCT-CF-ADMIN
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {compileLegalDocuments,createTermsOffer,canonicalJson,sha256} from '@notabenda/core/content';
import {recordLegalRelease,createDocumentHistory,createAdminWorker,normalizeTermsSettingsRelease,registerTermsOffer} from '@notabenda/cloudflare';
import {renderTermsSettings} from '../dist/terms-history-render.js';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {termsHistoryExample} from '../../../examples/agreements/history.mjs';
const scope=(id='account-terms')=>({scopeId:id,revision:'wording-1',statement:'I agree to the account terms.',actionLabel:'Continue',reviewStatus:'draft'});
const request=path=>new Request('https://host.example.test/admin/history'+path);
const diff=(a,b)=>'/diff?'+new URLSearchParams({before:a.manifest.artifactId,after:b.manifest.artifactId,kind:'terms-settings'});
async function setup(){const example=termsHistoryExample(await fixture()),storage=createSyntheticStorage([]);for(const r of example.releases)await recordLegalRelease(storage,r.artifact,r.metadata);return {...example,storage,store:createDocumentHistory(storage)};}
const worker=(store,allowTermsSettings=true)=>createAdminWorker({basePath:'/admin/history',authorize:()=>({store,allowTermsSettings,allowExport:true})});

test('validated settings inspection is separate from generic records and preserves legacy absence',async()=>{
 const f=await setup(),id=f.after.manifest.artifactId,record=await f.store.getTermsSettings(id),data=normalizeTermsSettingsRelease(record.data);assert.equal(data.artifactId,id);assert.equal(data.declaration,'configured');assert.equal(data.agreements[0].revision,'account-wording-2');assert.equal(data.document.sha256,f.after.manifest.documents.find(d=>d.kind==='terms').sha256);assert.equal(data.localization,undefined);
 const generic=await f.store.get(id);assert.equal(generic.data.publicConfig,undefined);assert.equal(generic.data.agreements,undefined);assert.doesNotMatch(JSON.stringify(generic),/account-wording-2|I agree to the account terms linked above/);
 const response=await worker(f.store).fetch(request('/export.json'),{});assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/account-wording-2|I agree to the account terms linked above/);
 const config=await fixture(),legacy=compileLegalDocuments(config,{mode:'preview'});await recordLegalRelease(f.storage,legacy.artifact);const absent=await f.store.getTermsSettings(legacy.manifest.artifactId);assert.equal(absent.data.declaration,'not-declared');assert.deepEqual(absent.data.agreements,[]);assert.equal(absent.data.localization,undefined);assert.equal(await f.store.getTermsSettings('f'.repeat(64)),undefined);
});

test('inspection validates the entire archive and declaration before projection',async()=>{
 const f=await setup(),key='notabenda/releases/'+f.before.manifest.artifactId,original=await f.storage.get(key);
 for(const mutate of [r=>r.artifact.pages['agreement-history/terms/index.html']+='changed',r=>r.artifact.documents.terms.sections[0].heading='Changed',r=>r.artifact.publicConfig.terms.agreements.push(r.artifact.publicConfig.terms.agreements[0])]){
  const value=structuredClone(original);mutate(value);await f.storage.put(key,value);await assert.rejects(f.store.getTermsSettings(f.before.manifest.artifactId));
 }
 await f.storage.put(key,original);const release=structuredClone(original.artifact);delete release.publicConfig.terms;release.manifest.configSha256=sha256(canonicalJson(release.publicConfig));const {artifactId,...descriptor}=release.manifest;release.manifest.artifactId=sha256(canonicalJson(descriptor));await recordLegalRelease(f.storage,release);assert.equal((await f.store.getTermsSettings(release.manifest.artifactId)).data.declaration,'not-declared');
});

test('permission and method checks precede every settings read, including HEAD and comparison',async()=>{
 const f=await setup();let reads=0;const store={...f.store,getTermsSettings:async id=>{reads++;return f.store.getTermsSettings(id);}};
 for(const permission of [undefined,false,'true']){const w=createAdminWorker({basePath:'/admin/history',authorize:()=>({store,...(permission===undefined?{}:{allowTermsSettings:permission})})});for(const path of ['/terms-settings?id='+f.before.manifest.artifactId,diff(f.before,f.after)])assert.equal((await w.fetch(request(path),{})).status,403);}
 assert.equal(reads,0);const w=worker(store);const head=await w.fetch(new Request(request('/terms-settings?id='+f.before.manifest.artifactId),{method:'HEAD'}),{});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(reads,1);
 const denied=await createAdminWorker({basePath:'/admin/history',authorize:()=>null}).fetch(request('/terms-settings?id='+f.before.manifest.artifactId),{});assert.equal(denied.status,403);assert.equal(reads,1);
 const unavailable=worker({list:f.store.list,get:f.store.get});assert.equal((await unavailable.fetch(request('/terms-settings?id='+f.before.manifest.artifactId),{})).status,404);
 const post=await w.fetch(new Request(request('/terms-settings?id='+f.before.manifest.artifactId),{method:'POST'}),{});assert.equal(post.status,405);assert.equal(reads,1);
});

test('operator comparison shows changed fields and separate document facts without implying activation',async()=>{
 const f=await setup(),w=worker(f.store),response=await w.fetch(request(diff(f.before,f.after)),{}),html=await response.text();assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/private/);assert.match(response.headers.get('Content-Security-Policy'),/default-src 'none'/);assert.doesNotMatch(html,/<script\b/u);
 const dom=new JSDOM(html);try{const d=dom.window.document;assert.equal(d.querySelectorAll('main').length,1);assert.equal(d.querySelectorAll('h1').length,1);assert.match(d.body.textContent,/2 of 2 workflows changed/);assert.match(d.body.textContent,/Pinned terms HTML unchanged/);assert.match(d.body.textContent,/Structured document content unchanged/);const account=d.querySelector('[data-terms-scope="account-terms"]');assert.match(account.textContent,/account-wording-1/);assert.match(account.textContent,/account-wording-2/);assert.match(account.textContent,/Continue/);assert.match(account.textContent,/Create account/);assert.match(d.querySelector('[data-terms-scope="workspace-terms"]').textContent,/Added/);assert.match(d.body.textContent,/not active backend selections/);assert.match(d.body.textContent,/different offers/);assert.match(d.body.textContent,/Removing settings does not retire/);assert.match(d.body.textContent,/no versioned interface dictionary retained/);assert.ok(d.querySelector('a[href*="kind=terms"]'));}finally{dom.window.close();}
 const detail=await (await w.fetch(request('/record?id='+f.after.manifest.artifactId),{})).text();assert.match(detail,/Inspect agreement settings/);const list=await (await w.fetch(request(''),{})).text();assert.match(list,/<option value="terms-settings">Agreement settings/);const denied=await (await worker(f.store,false).fetch(request(''),{})).text();assert.doesNotMatch(denied,/value="terms-settings"/);
 const documentDiff=await (await w.fetch(request('/diff?'+new URLSearchParams({before:f.before.manifest.artifactId,after:f.after.manifest.artifactId,kind:'terms'})),{})).text();assert.match(documentDiff,/No section text changes/);assert.match(documentDiff,/Compare agreement settings/);
});

test('absent, added and removed declarations remain comparable; scope order alone is unchanged',async()=>{
 const f=await setup(),c=await fixture(),absent=compileLegalDocuments(c,{mode:'preview'});c.terms.agreements=[scope(),scope('workspace-terms')];const declared=compileLegalDocuments(c,{mode:'preview'});c.terms.agreements.reverse();const reordered=compileLegalDocuments(c,{mode:'preview'});delete c.terms.agreements;const removed=compileLegalDocuments(c,{mode:'preview'});
 for(const r of [absent,declared,reordered])await recordLegalRelease(f.storage,r.artifact);
 for(const [a,b,label] of [[absent,declared,'Added'],[declared,removed,'Removed']]){const response=await worker(f.store).fetch(request(diff(a,b)),{});assert.equal(response.status,200);const html=await response.text();assert.match(html,new RegExp(label));assert.match(html,/Application-authored offers may exist/);}
 const html=await (await worker(f.store).fetch(request(diff(declared,reordered)),{})).text();assert.match(html,/0 of 2 workflows changed/);assert.match(html,/declaration unchanged/);
});

test('revision, review, document and localization changes are independent comparison facts',async()=>{
 const f=await setup(),c=await fixture();c.terms.agreements=[scope()];const first=compileLegalDocuments(c,{mode:'preview'});c.terms.agreements[0].revision='wording-2';c.terms.agreements[0].reviewStatus='reviewed';c.documents.terms.version='terms-2';const revised=compileLegalDocuments(c,{mode:'preview'});for(const r of [first,revised])await recordLegalRelease(f.storage,r.artifact);
 const html=await (await worker(f.store).fetch(request(diff(first,revised)),{})).text();assert.match(html,/Wording revision/);assert.match(html,/Declared review/);assert.match(html,/Pinned terms HTML changed/);assert.match(html,/Structured document content unchanged/);
 const pt=localizedExampleConfig(await fixture());pt.terms.agreements=[{...scope(),statement:'Concordo com os termos.',actionLabel:'Criar conta'}];const a=compileLegalDocuments(pt,{mode:'preview'});pt.localization.terms.error='Não foi possível registrar. Tente novamente.';pt.localization.revision='interface-2';const b=compileLegalDocuments(pt,{mode:'preview'});for(const r of [a,b])await recordLegalRelease(f.storage,r.artifact);const translated=await (await worker(f.store).fetch(request(diff(a,b)),{})).text();assert.match(translated,/0 of 1 workflows changed/);assert.match(translated,/Recording failure/);assert.match(translated,/Não foi possível registrar/);assert.match(translated,/lang="pt-BR"/);assert.match(translated,/Interface revision/);
 delete pt.localization.terms;const missing=compileLegalDocuments(pt,{mode:'preview'});await recordLegalRelease(f.storage,missing.artifact);const view=await (await worker(f.store).fetch(request('/terms-settings?id='+missing.manifest.artifactId),{})).text();assert.match(view,/complete matching terms dictionary/);assert.doesNotMatch(view,/Historical built-in messages/);
});

test('malformed custom stores, cross-site comparisons and corrupt references fail without exposing diagnostics',async()=>{
 const f=await setup(),a=await f.store.getTermsSettings(f.before.manifest.artifactId),b=await f.store.getTermsSettings(f.after.manifest.artifactId);
 for(const mutate of [r=>r.id='f'.repeat(64),r=>r.data.schemaVersion=2,r=>r.data.extra='PRIVATE',r=>r.data.mode=['preview'],r=>r.data.declaration=['configured'],r=>r.data.document.url='https://outside.example.test/terms',r=>r.data.agreements.push(r.data.agreements[0]),r=>r.data.agreements[0].extra=true,r=>r.data.locale='',r=>r.data.localization={terms:{}}]){
  const value=structuredClone(a);mutate(value);const w=worker({...f.store,getTermsSettings:async()=>value});const response=await w.fetch(request('/terms-settings?id='+a.id),{});assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE/);
 }
 const cross=structuredClone(b);cross.data.siteId='other-site';const w=worker({...f.store,getTermsSettings:async id=>id===a.id?a:cross});assert.equal((await w.fetch(request(diff(f.before,f.after)),{})).status,500);
 const failed=worker({...f.store,getTermsSettings:async()=>{throw Error('PRIVATE failure');}});const response=await failed.fetch(request('/terms-settings?id='+a.id),{});assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE/);
 for(const path of ['/terms-settings?id=bad','/terms-settings?id='+a.id+'&id='+a.id,'/terms-settings?id='+a.id+'&site=other','/diff?before='+a.id+'&after='+b.id+'&kind=terms-settings&kind=terms-settings'])assert.equal((await worker(f.store).fetch(request(path),{})).status,400);
});

test('hostile copy remains text and maximum configured settings fit the bounded separate view',async()=>{
 const f=await setup(),c=await fixture();c.terms.agreements=[{...scope(),statement:'<img src=x onerror=alert(1)>',actionLabel:'<script>no</script>'}];const release=compileLegalDocuments(c,{mode:'preview'});await recordLegalRelease(f.storage,release.artifact);const html=await (await worker(f.store).fetch(request('/terms-settings?id='+release.manifest.artifactId),{})).text();assert.match(html,/&lt;img/);assert.match(html,/&lt;script/);assert.doesNotMatch(html,/<img|<script/);
 c.terms.agreements=Array.from({length:16},(_,i)=>({...scope('workflow-'+i),statement:'x'.repeat(2000)}));const large=compileLegalDocuments(c,{mode:'preview'});await recordLegalRelease(f.storage,large.artifact);const result=await worker(f.store).fetch(request('/terms-settings?id='+large.manifest.artifactId),{});assert.equal(result.status,200);assert.match(await result.text(),/16 workflows/);
 const record=await f.store.getTermsSettings(release.manifest.artifactId);assert.throws(()=>renderTermsSettings({...record,data:{...record.data,extra:true}},undefined,{basePath:'/admin/history',title:'History',scopeLabel:'Test',nonce:'abc'}));
});


test('legacy archives without config hashes cannot claim configured or localized wording binding',async()=>{
 const storage=createSyntheticStorage([]),store=createDocumentHistory(storage);
 const withoutHash=artifact=>{const clone=structuredClone(artifact);delete clone.manifest.configSha256;const {artifactId,...descriptor}=clone.manifest;clone.manifest.artifactId=sha256(canonicalJson(descriptor));return clone;};
 const rebind=(original,archive)=>{const value={...original,artifactId:archive.manifest.artifactId,document:{...original.document,url:`/artifacts/${archive.manifest.artifactId}/terms.html`}};const {offerId,...descriptor}=value;return {...value,offerId:sha256(canonicalJson(descriptor))};};
 for(const localized of [false,true]){const config=localized?localizedExampleConfig(await fixture()):await fixture();if(!localized)config.terms.agreements=[scope()];const build=compileLegalDocuments(config,{mode:'preview'}),original=createTermsOffer(build.artifact,{scopeId:localized?'host-terms':'account-terms',statement:localized?'Concordo com os termos.':scope().statement,actionLabel:localized?'Continuar':scope().actionLabel},{mode:'preview'}),archive=withoutHash(build.artifact);await recordLegalRelease(storage,archive);await assert.rejects(store.getTermsSettings(archive.manifest.artifactId));await assert.rejects(registerTermsOffer(storage,rebind(original,archive),{siteId:config.site.id,allowPreview:true}),error=>error.code==='invalid-offer');
 const key='notabenda/releases/'+archive.manifest.artifactId,record=await storage.get(key);if(localized)record.artifact.publicConfig.localization.terms.error='Changed outside the release hash';else record.artifact.publicConfig.terms.agreements[0].statement='Changed outside the release hash';await storage.put(key,record);await assert.rejects(store.getTermsSettings(archive.manifest.artifactId));}
 const config=await fixture(),build=compileLegalDocuments(config,{mode:'preview'}),archive=withoutHash(build.artifact),original=createTermsOffer(build.artifact,{scopeId:'host-terms',statement:'I agree.',actionLabel:'Continue'},{mode:'preview'});await recordLegalRelease(storage,archive);assert.equal((await store.getTermsSettings(archive.manifest.artifactId)).data.declaration,'not-declared');await registerTermsOffer(storage,rebind(original,archive),{siteId:config.site.id,allowPreview:true});
});
