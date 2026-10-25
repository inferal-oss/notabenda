import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-CF-HISTORY REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createTermsAcceptance,mountTermsAcceptance,normalizeTermsOffer} from '@notabenda/core';
import {compileLegalDocuments,compileConsentRuntimeConfig,createTermsOffer,createConsentNotice,canonicalJson,sha256} from '@notabenda/core/content';
import {recordLegalRelease,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance,createTermsAcceptanceStore,createAdminWorker} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {fixture} from './helpers.mjs';
const stamp='2026-10-19T12:00:00.000Z';
const rehash=n=>{const {offerId:_,...body}=n;return {...n,offerId:sha256(canonicalJson(body))};};
async function setup(change=()=>{}){
 const c=localizedExampleConfig(await fixture({reviewed:true}));c.localization.reviewStatus='reviewed';for(const doc of Object.values(c.documents))doc.review.status='reviewed';change(c);
 const build=compileLegalDocuments(c),offer=createTermsOffer(build.artifact,{scopeId:'terms',statement:'Concordo com esta versão dos termos.',actionLabel:'Registrar concordância'}),storage=createSyntheticStorage([]),context={siteId:offer.siteId,scopeId:offer.scopeId,subjectId:'host-subject',operationId:'host-operation',now:()=>new Date(stamp)};
 await recordLegalRelease(storage,JSON.parse(canonicalJson(build.artifact)));await registerTermsOffer(storage,JSON.parse(canonicalJson(offer)),context);await setActiveTermsOffer(storage,offer.offerId,context);
 return {c,build,offer,storage,context,body:()=>({schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),accepted:true})};
}

test('localized terms offers retain complete reviewed messages and independently bind them to the exact archive',async()=>{
 const f=await setup();assert.equal(f.offer.schemaVersion,2);assert.equal(f.offer.localization.locale,'pt-BR');assert.equal(f.offer.localization.consent,undefined);assert.deepEqual(normalizeTermsOffer(JSON.parse(canonicalJson(f.offer))).localization,f.offer.localization);
 const bads=[n=>delete n.localization.terms.error,n=>n.localization.terms.extra='Extra',n=>n.localization.terms.metadata='No placeholders',n=>n.localization.terms.metadata='{unknown}',n=>n.localization.terms.metadata='{version} {effectiveDate} {',n=>n.localization.terms.heading='<b>Texto</b>',n=>n.localization.terms.error='😀'.repeat(600),n=>n.localization.terms.error='bad\u0001',n=>n.localization.direction=['rtl'],n=>n.localization.locale='pt-br',n=>n.localization.reviewStatus=['reviewed'],n=>n.schemaVersion='2',n=>n.mode=['production']];
 for(const change of bads){const n=structuredClone(f.offer);change(n);assert.throws(()=>normalizeTermsOffer(n),change.toString());await assert.rejects(registerTermsOffer(f.storage,rehash(n),f.context));}
 for(const change of [n=>n.localization.terms.error='Outra cópia.',n=>n.localization.revision='other',n=>n.localization.locale='en',n=>n.localization.direction='rtl']){const n=structuredClone(f.offer);change(n);await assert.rejects(registerTermsOffer(f.storage,rehash(n),f.context),e=>e.code==='invalid-offer');}
 const oversized=structuredClone(f.offer);for(const key of ['heading','draft','submitting','stale','retired'])oversized.localization.terms[key]='x'.repeat(1900);assert.throws(()=>normalizeTermsOffer(oversized),/Invalid terms localization/u);await assert.rejects(registerTermsOffer(f.storage,rehash(oversized),f.context),e=>e.code==='invalid-offer');
 const draft=structuredClone(f.offer);draft.localization.reviewStatus='draft';assert.throws(()=>normalizeTermsOffer(draft));assert.equal(normalizeTermsOffer(draft,{allowPreview:true}).localization.reviewStatus,'draft');
 const missing=structuredClone(f.c);delete missing.localization.terms;assert.throws(()=>createTermsOffer(compileLegalDocuments(missing).artifact,{scopeId:'terms',statement:'Concordo',actionLabel:'Continuar'}),/localization.terms/u);
 const access=structuredClone(f.offer);Object.defineProperty(access.localization.terms,'error',{enumerable:true,get(){throw Error('Do not invoke message getters');}});assert.throws(()=>normalizeTermsOffer(access),/Invalid localization/u);
});

test('terms message revisions change their offer, stay outside consent bundles and preserve existing cookie grants',async()=>{
 const f=await setup(),c=structuredClone(f.c),values=new Map(),env={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
 const first=createConsent(f.c,env);first.acceptAll();first.destroy();c.localization.terms.error='Tente registrar novamente.';c.localization.revision='copy-2';
 const build=compileLegalDocuments(c),offer=createTermsOffer(build.artifact,{scopeId:'terms',statement:f.offer.statement,actionLabel:f.offer.actionLabel});assert.notEqual(offer.offerId,f.offer.offerId);assert.notEqual(offer.artifactId,f.offer.artifactId);
 assert.equal(createConsentNotice(f.build.artifact,{scopeId:'choices'}).scopeDigest,createConsentNotice(build.artifact,{scopeId:'choices'}).scopeDigest);
 const runtime=compileConsentRuntimeConfig(c,{evidence:'local'});assert.equal(runtime.inventory.localization.terms,undefined);assert.equal(createConsentNotice(build.artifact,{scopeId:'choices'}).localization.terms,undefined);
 const consent=createConsent(c,env);assert.equal(consent.isAllowed('suggestions'),true);consent.destroy();
});

test('legacy English localized archives without terms messages still create, register, activate and accept v1 offers',async()=>{
 const f=await setup(c=>{c.site.locale=c.localization.locale='en-US';delete c.localization.terms;});assert.equal(f.offer.schemaVersion,1);assert.equal(f.offer.localization,undefined);
 const result=await recordTermsAcceptance(f.storage,f.body(),f.context);assert.equal(result.documentVersion,f.offer.document.version);
 const old=await fixture({reviewed:true}),build=compileLegalDocuments(old),offer=createTermsOffer(build.artifact,{scopeId:'legacy',statement:'I agree.',actionLabel:'Continue'});assert.equal(offer.schemaVersion,1);assert.deepEqual(Object.keys(offer).sort(),['schemaVersion','offerId','siteId','scopeId','artifactId','mode','statement','actionLabel','document'].sort());
});

test('the UI uses only pinned locale/status copy and waits for a verified matching receipt',async()=>{
 const f=await setup();let release;const pending=new Promise(resolve=>release=resolve),controller=createTermsAcceptance(f.offer,{operationId:f.context.operationId,submit:()=>pending}),dom=new JSDOM('<div id="terms"></div>'),doc=dom.window.document,ui=mountTermsAcceptance(doc.querySelector('#terms'),{acceptance:controller}),m=f.offer.localization.terms;
 const root=doc.querySelector('.nb-terms-acceptance'),checkbox=doc.querySelector('input'),button=doc.querySelector('button');assert.equal(root.lang,'pt-BR');assert.equal(root.dir,'ltr');assert.equal(root.getAttribute('aria-label'),m.regionLabel);assert.equal(doc.querySelector('h2').textContent,m.heading);assert.equal(checkbox.checked,false);assert.equal(button.disabled,true);assert.ok(doc.querySelector('.nb-document-meta').textContent.includes('abre em outra aba'));assert.equal(doc.querySelector('a').getAttribute('aria-description'),doc.querySelector('.nb-document-meta').textContent);
 controller.setChecked(true);button.focus();const work=controller.submit();assert.equal(doc.activeElement,doc.querySelector('[role=status]'));assert.equal(doc.querySelector('[role=status]').textContent,m.submitting);assert.equal(root.getAttribute('aria-busy'),'true');assert.equal(button.disabled,true);const body={schemaVersion:1,offerId:f.offer.offerId,requestId:controller.getSnapshot().requestId,accepted:true};release(await recordTermsAcceptance(f.storage,body,f.context));await work;assert.equal(doc.querySelector('[role=status]').textContent,m.recorded.replace('{version}',f.offer.document.version));assert.equal(root.getAttribute('aria-busy'),'false');assert.equal(doc.activeElement,doc.querySelector('[role=status]'));assert.equal(doc.querySelector('[role=status] bdi').textContent,f.offer.document.version);ui.destroy();controller.destroy();dom.window.close();
});

test('every error/status branch, preview note and RTL root uses selected terms messages',async()=>{
 const f=await setup();let state={checked:false,status:'idle'},listener;const offer=structuredClone(f.offer);offer.mode='preview';offer.localization.direction='rtl';const controller={getOffer:()=>offer,getSnapshot:()=>state,subscribe:fn=>{listener=fn;fn(state);return ()=>{};},setChecked(){},submit(){return Promise.resolve();}},dom=new JSDOM('<div id="terms"></div>'),ui=mountTermsAcceptance(dom.window.document.querySelector('#terms'),{acceptance:controller}),doc=dom.window.document,m=offer.localization.terms;
 assert.equal(doc.querySelector('.nb-terms-acceptance').dir,'rtl');const date=doc.querySelector('.nb-document-meta bdi.nb-terms-date');assert.equal(date.dir,'ltr');assert.equal(date.textContent,offer.document.effectiveDate);assert.equal(doc.querySelector('.nb-document-meta bdi:not(.nb-terms-date)').dir,'auto');assert.equal(doc.querySelector('.nb-draft').textContent,m.draft);
 for(const [status,error,key] of [['submitting',undefined,'submitting'],['stale','stale-offer','stale'],['retired','context-retired','retired'],['error','unavailable','unavailable'],['error','recording-failed','error']]){state={checked:true,status,error};listener(state);assert.equal(doc.querySelector('[role=status]').textContent,m[key]);}
 ui.destroy();dom.window.close();
});

test('retries retain the original offer and copy after activation changes; mismatched receipts never report success',async()=>{
 const f=await setup(),body=f.body(),receipt=await recordTermsAcceptance(f.storage,body,f.context),c=structuredClone(f.c);c.localization.revision='copy-2';c.localization.terms.heading='Revise esta versão';const build=compileLegalDocuments(c),offer=createTermsOffer(build.artifact,{scopeId:'terms',statement:body.statement??f.offer.statement,actionLabel:f.offer.actionLabel});await recordLegalRelease(f.storage,build.artifact);await registerTermsOffer(f.storage,offer,f.context);await setActiveTermsOffer(f.storage,offer.offerId,f.context);assert.deepEqual(await recordTermsAcceptance(f.storage,body,f.context),receipt);
 const wrong=createTermsAcceptance(offer,{operationId:f.context.operationId,requestId:body.requestId,submit:async()=>receipt});wrong.setChecked(true);await assert.rejects(wrong.submit(),e=>e.code==='invalid-receipt');assert.equal(wrong.getSnapshot().status,'error');wrong.destroy();
});

test('private operator inspection/search exposes selected language and resolved interface copy without executing content',async()=>{
 const f=await setup(),receipt=await recordTermsAcceptance(f.storage,f.body(),f.context),store=createTermsAcceptanceStore(f.storage,f.context),worker=createAdminWorker({basePath:'/admin',authorize:()=>({store,allowExport:true})});
 const response=await worker.fetch(new Request('https://admin.example.test/admin/record?id='+receipt.id),{}),html=await response.text();assert.equal(response.status,200);for(const text of ['Interface language','pt-BR','Copy revision','Declared interface wording','Registrando sua concordância','Versão 1','lang="pt-BR"'])assert.ok(html.includes(text),text);const view=new JSDOM(html).window.document;assert.equal(view.querySelector('h1').textContent,f.offer.document.title);assert.ok(view.querySelector('.record-references').textContent.includes('Declared interface wording'));const declared=[...view.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='Declared interface wording');assert.ok(declared);assert.doesNotMatch(declared.textContent,/\{version\}/u);
 const results=await store.list({query:'pt-BR',kind:'',from:'',to:'',keyPrefix:'',limit:20});assert.equal(results.records.length,1);
});

test('the standalone backend terms-localization validator is generated from the frontend contract',async()=>{const src=await readFile(new URL('../src/terms-localization-policy.ts',import.meta.url),'utf8'),backend=await readFile(new URL('../../notabenda-cf/src/terms-localization-policy.ts',import.meta.url),'utf8');assert.ok(backend.endsWith(src));});
