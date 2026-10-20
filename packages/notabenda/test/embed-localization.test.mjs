// @requirements REQ-PRODUCT-EMBED-LOCALIZATION REQ-PRODUCT-EMBEDS REQ-PRODUCT-LOCALIZATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM,ResourceLoader} from 'jsdom';
import {createConsent,createEmbedService,renderEmbedPlaceholder,normalizeEmbedLocalization,selectEmbedLocalization,validateSiteConfig} from '@notabenda/core';
import {createConsentRuntime} from '@notabenda/core/consent';
import {describeIntegration} from '@notabenda/core/integration';
import {assessIntegration} from '@notabenda/core/integration/assessment';
import {compileLegalDocuments,compileConsentRuntimeConfig,createConsentNotice} from '@notabenda/core/content';
import {recordLegalRelease,validateLegalSourceArchive} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
import {localizedEmbedsConfig} from '../../../examples/localization/embeds-build.mjs';
async function config(){const c=localizedEmbedsConfig(await fixture());c.localization.reviewStatus='reviewed';for(const d of Object.values(c.documents))d.review.status='reviewed';return c;}
const media={kind:'iframe',src:'/frame/',title:'Página incorporada',description:'Conteúdo opcional deste site.'};
const environment=()=>{const values=new Map();return {values,env:{storage:{getItem:key=>values.get(key)??null,setItem:(key,v)=>values.set(key,v),removeItem:key=>values.delete(key)},now:()=>Date.parse('2026-10-20T12:00:00Z'),schedule:()=>()=>{}}};};
const browser=()=>{const requests=[];class Loader extends ResourceLoader{fetch(url){requests.push(url);return null;}}const dom=new JSDOM('<main><div id="media"></div></main>',{url:'https://app.example.test/',resources:new Loader()});return {dom,requests,root:dom.window.document.querySelector('#media')};};

test('localized SSR stays inert, escaped and explicitly directed while legacy English bytes remain exact',async()=>{
 const c=await config(),localization=selectEmbedLocalization(c),copy=c.localization.embeds;
 const d=new JSDOM(renderEmbedPlaceholder({title:'Título <img>',description:'Texto & descrição'},{localization})).window.document;
 assert.equal(d.querySelector('section').lang,'pt-BR');assert.equal(d.querySelector('section').dir,'ltr');assert.equal(d.querySelector('[role=status]').textContent,copy.waiting);assert.equal(d.querySelector('button').textContent,copy.preferencesLabel);assert.equal(d.querySelector('button').hidden,true);assert.equal(d.querySelector('button').disabled,true);assert.equal(d.querySelectorAll('iframe,img,[src],link,script').length,0);assert.equal(d.querySelector('strong').textContent,'Título <img>');
 assert.equal(renderEmbedPlaceholder({title:'Title',description:'Description'}),'<section class="nb-embed" aria-label="Title"><strong class="nb-embed-title">Title</strong><p>Description</p><p class="nb-embed-status" role="status">Not loaded. Review your choices to allow this content.</p><button class="nb-choice-button" type="button" hidden disabled>Review privacy choices</button></section>');
 const rtl={...localization,locale:'ar',direction:'rtl',embeds:{preferencesLabel:'خيارات الخصوصية',waiting:'لم يتم تحميل المحتوى.',allowed:'الإذن يسمح بهذا المحتوى.',error:'تعذر تحميل المحتوى.'}};
 const html=renderEmbedPlaceholder({title:'محتوى',description:'صورة اختيارية'},{localization:rtl});assert.match(html,/lang="ar" dir="rtl"/);assert.ok(html.includes(rtl.embeds.waiting));assert.doesNotMatch(html,/Not loaded|Review privacy/);
});
test('incomplete, mixed-locale, accessor and unreviewed messages fail before reserving a service or changing a fallback',async()=>{
 const c=await config(),localization=selectEmbedLocalization(c);
 for(const mutate of [v=>delete v.embeds.error,v=>v.embeds.extra='unknown',v=>v.embeds.error='<b>text</b>',v=>v.embeds.allowed='{unknown}',v=>v.embeds.waiting='',v=>v.embeds=null,v=>v.embeds.preferencesLabel='x'.repeat(121),v=>v.locale='pt-br',v=>v.direction='auto',v=>v.revision='']){
  const invalid=structuredClone(localization);mutate(invalid);assert.throws(()=>normalizeEmbedLocalization(invalid));
  const cfg=structuredClone(c);cfg.localization.embeds=invalid.embeds;if(JSON.stringify(invalid.embeds)!==JSON.stringify(c.localization.embeds))assert.equal(validateSiteConfig(cfg).valid,false);
 }
 let reads=0;const accessor=structuredClone(localization);Object.defineProperty(accessor.embeds,'error',{get(){reads++;return 'text';},enumerable:true});assert.throws(()=>normalizeEmbedLocalization(accessor));assert.equal(reads,0);
 const draft={...localization,reviewStatus:'draft'};assert.throws(()=>renderEmbedPlaceholder({title:'T',description:'D'},{localization:draft}));assert.ok(renderEmbedPlaceholder({title:'T',description:'D'},{localization:draft,allowPreview:true}).includes(draft.embeds.waiting));
 const f=browser(),e=environment(),consent=createConsent(c,e.env);f.root.textContent='Fallback';
 try{assert.throws(()=>createEmbedService({consent,serviceId:'sample-media',localization:{...localization,locale:'en'}}));assert.equal(f.root.textContent,'Fallback');assert.equal(f.requests.length,0);const group=createEmbedService({consent,serviceId:'sample-media'});group.destroy();}finally{consent.destroy();f.dom.window.close();}
 const missing=structuredClone(c);delete missing.localization.embeds;assert.throws(()=>selectEmbedLocalization(missing));assert.throws(()=>renderEmbedPlaceholder({title:'T',description:'D'},{locale:'pt-BR'}));
});
test('all native states use a detached selected dictionary and review never creates a choice or early request',async()=>{
 const c=await config(),copy=structuredClone(c.localization.embeds),f=browser(),e=environment(),consent=createConsent(c,e.env),selected=selectEmbedLocalization(c),group=createEmbedService({consent,serviceId:'sample-media',localization:selected});
 selected.embeds.allowed='Changed caller text';const ui=group.mount(f.root,media),status=()=>f.root.querySelector('[role=status]').textContent;
 try{
  assert.equal(status(),copy.waiting);assert.equal(f.root.firstElementChild.lang,'pt-BR');assert.equal(f.root.querySelector('button').textContent,copy.preferencesLabel);assert.equal(f.requests.length,0);assert.equal(f.root.querySelector('[src]'),null);
  f.root.querySelector('button').click();assert.equal(consent.getSnapshot().preferencesOpen,true);assert.equal(e.values.size,0);consent.closePreferences();
  consent.acceptAll();await consent.settled();assert.ok(f.root.querySelector('iframe'));assert.equal(f.requests.length,1);assert.equal(status(),copy.allowed);
  consent.rejectAll();assert.equal(f.root.querySelector('iframe'),null);assert.equal(status(),copy.waiting);await consent.settled();
  consent.acceptAll();await consent.settled();f.root.querySelector('iframe').dispatchEvent(new f.dom.window.Event('error'));assert.equal(status(),copy.error);assert.equal(f.root.querySelector('iframe'),null);ui.refresh();assert.equal(f.root.querySelector('iframe'),null);
  consent.destroy();assert.equal(f.root.querySelector('button').hidden,true);
 }finally{group.destroy();consent.destroy();f.dom.window.close();}
});
test('compiled controllers need the separate embed copy and enforce the same gate once supplied',async()=>{
 const c=await config(),runtime=compileConsentRuntimeConfig(c,{evidence:'local'}),e=environment(),consent=createConsentRuntime(runtime,e.env),f=browser();
 assert.equal(runtime.inventory.localization.embeds,undefined);
 try{assert.throws(()=>createEmbedService({consent,serviceId:'sample-media'}),/separately selected|complete localization/);const group=createEmbedService({consent,serviceId:'sample-media',localization:selectEmbedLocalization(c)});group.mount(f.root,media);assert.equal(f.requests.length,0);consent.acceptAll();await consent.settled();assert.equal(f.root.querySelector('[role=status]').textContent,c.localization.embeds.allowed);group.destroy();}finally{consent.destroy();f.dom.window.close();}
});
test('copy revisions remain in legal releases and CF archives without changing consent scope or a saved grant',async()=>{
 const c=await config(),one=compileLegalDocuments(c),changed=structuredClone(c);changed.localization.revision+='-copy';changed.localization.embeds.waiting='A mídia aguarda sua escolha.';const two=compileLegalDocuments(changed);
 assert.notEqual(one.manifest.artifactId,two.manifest.artifactId);assert.deepEqual(one.artifact.publicConfig.localization.embeds,c.localization.embeds);assert.equal(createConsentNotice(one.artifact,{scopeId:'media'}).scopeDigest,createConsentNotice(two.artifact,{scopeId:'media'}).scopeDigest);
 const store=createSyntheticStorage([]);await recordLegalRelease(store,one.artifact);await recordLegalRelease(store,two.artifact);const retained=await validateLegalSourceArchive((await store.get('notabenda/releases/'+two.manifest.artifactId)).artifact);assert.deepEqual(JSON.parse(JSON.stringify(retained.artifact.publicConfig.localization.embeds)),changed.localization.embeds);
 const e=environment();let consent=createConsent(c,e.env);consent.acceptAll();consent.destroy();consent=createConsent(changed,e.env);assert.equal(consent.isAllowed('embedded-media'),true);consent.destroy();
 const target=describeIntegration().targets.find(t=>t.id==='embeds');assert.ok(target.configPaths.includes('localization.embeds'));assert.deepEqual(target.conditionalConfig[0].requiredPaths,['localization.embeds']);
});
test('agent assessment recognizes the real dictionary shape and requests missing non-English copy without changing facts',async()=>{
 const c=await config(),before=structuredClone(c),selection={schemaVersion:1,answers:{'remote-media':'yes'}},complete=assessIntegration({config:c,selection});
 assert.equal(complete.validation.authoringShape.valid,true);assert.equal(complete.missingRequiredConfig.some(f=>f.path==='localization.embeds'),false);assert.deepEqual(c,before);
 const missing=structuredClone(c);delete missing.localization.embeds;const report=assessIntegration({config:missing,selection});assert.equal(report.validation.preview.valid,true);assert.ok(report.missingRequiredConfig.some(f=>f.targetId==='embeds'&&f.path==='localization.embeds'));assert.equal(missing.site.locale,'pt-BR');assert.equal(missing.localization.embeds,undefined);
});
