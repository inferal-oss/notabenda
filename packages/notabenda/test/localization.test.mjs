import {normalizeConsentNotice} from 'notabenda';
import {mountAstroConsent} from 'notabenda/astro/client';
import {ConsentProvider,PreferencesButton} from 'notabenda/react/consent';
import {compileAuthoredDocuments} from 'notabenda-authoring';
import {renderServiceDirectory} from 'notabenda/services';
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {validateSiteConfig,renderLegalDocument,renderLegalPage,createConsent,mountControls,defaultConsentWording} from 'notabenda';
import {LegalDocument} from 'notabenda/react/documents';
import {compileLegalDocuments,compileConsentRuntimeConfig,createConsentNotice,canonicalJson,sha256,createTermsOffer,createCollectionNotice} from 'notabenda/content';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead,createConsentEvidenceStore} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
const instant='2026-10-19T12:00:00.000Z';
async function config(){const c=localizedExampleConfig(await fixture());c.localization.reviewStatus='reviewed';for(const d of Object.values(c.documents))d.review.status='reviewed';return c;}
const env=values=>({storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse(instant),schedule:()=>()=>{}});
const rehash=n=>{const {noticeId:_,...body}=n;return {...n,noticeId:sha256(canonicalJson(body))};};

test('complete selected dictionaries are bounded plain text, have exact placeholders and require review in production',async()=>{
 const c=await config();assert.equal(validateSiteConfig(c,{mode:'production'}).valid,true);
 for(const change of [c=>delete c.localization.consent.stale,c=>c.localization.consent.extra='Unused',c=>c.localization.consent.services='Serviços',c=>c.localization.consent.services='{unknown}',c=>c.localization.consent.services='<b>{services}</b>',c=>c.localization.consent.services='{services} {',c=>c.localization.consent.title='💬'.repeat(600),c=>c.localization.consent.acceptLabel='a'.repeat(121),c=>c.localization.locale='pt-br',c=>c.localization.direction='auto',c=>c.localization.revision='',c=>delete c.localization.documents.contents,c=>delete c.localization.generatedDocuments.storageCaption,c=>delete c.localization.generatedDocuments]){
  const changed=structuredClone(c);change(changed);assert.equal(validateSiteConfig(changed,{mode:'production'}).valid,false,change.toString());
 }
 const draft=structuredClone(c);draft.localization.reviewStatus='draft';assert.equal(validateSiteConfig(draft,{mode:'production'}).valid,false);assert.equal(validateSiteConfig(draft,{mode:'preview'}).valid,true);
 const supplied=structuredClone(c);delete supplied.localization.generatedDocuments;for(const d of Object.values(supplied.documents)){d.source='supplied';d.sections=[{id:'one',heading:'Informações',paragraphs:['Texto revisado pelo responsável.']}];}assert.equal(validateSiteConfig(supplied,{mode:'production'}).valid,true);assert.match(renderLegalPage(supplied,'privacy'),/Texto revisado/u);
 const malicious=structuredClone(c);Object.defineProperty(malicious.localization.consent,'title',{enumerable:true,get(){throw Error('Do not invoke translation getters');}});assert.equal(validateSiteConfig(malicious).valid,false);
});

test('native and React legal documents share localized text, language, direction and escaped declared facts',async()=>{
 const c=await config();c.site.name='Juniper & leitura';c.purposes[0].description='<img src=x onerror=alert(1)>';
 for(const kind of ['privacy','cookies','terms']){
  const html=renderLegalPage(c,kind),fragment=renderLegalDocument(c,kind),react=renderToStaticMarkup(createElement(LegalDocument,{config:c,kind}));
  assert.ok(react.includes(fragment));assert.match(html,/<html lang="pt-BR" dir="ltr">/u);assert.match(fragment,/lang="pt-BR" dir="ltr"/u);assert.match(html,/Ir para o conteúdo/u);assert.match(fragment,/Nesta página/u);assert.doesNotMatch(html,/Who is responsible|Declared storage|On this page|Skip to content|>Version |Effective <time/u);assert.doesNotMatch(html,/<img src=x/u);
 }
 const cookies=renderLegalPage(c,'cookies');assert.match(cookies,/3 itens/u);assert.match(cookies,/Armazenamento local/u);assert.match(cookies,/Necessário/u);assert.equal(new JSDOM(cookies).window.document.querySelector('.nb-storage-foldout').open,false);
 const rtl=structuredClone(c);rtl.site.locale=rtl.localization.locale='ar';rtl.localization.direction='rtl';assert.match(renderLegalPage(rtl,'terms'),/<html lang="ar" dir="rtl">/u);
 const build=compileLegalDocuments(c),notice=createConsentNotice(build.artifact,{scopeId:'privacy'});assert.equal(notice.schemaVersion,2);assert.equal(notice.localization.locale,'pt-BR');assert.equal(notice.localization.documents,undefined);assert.equal(compileConsentRuntimeConfig(c,{evidence:'local'}).inventory.localization.generatedDocuments,undefined);
 assert.throws(()=>createConsentNotice(build.artifact,{scopeId:'privacy',wording:{summary:'Override'}}),/localization/u);
 for(const action of [()=>renderServiceDirectory(c,{idPrefix:'services'}),()=>createCollectionNotice(build.artifact,{})])assert.throws(action,/does not yet support localized UI/u);
});

for(const [profile,factory] of consentProfiles)test(`${profile}: copy revisions preserve grants, material revisions reopen grants and preserve refusals`,async()=>{
 const c=await config(),values=new Map();let consent=factory(c,env(values));consent.acceptAll();consent.destroy();
 const copy=structuredClone(c);copy.localization.revision+='-updated';copy.localization.consent.retryLabel='Tentar outra vez';consent=factory(copy,env(values));assert.equal(consent.isAllowed('suggestions'),true);consent.destroy();
 const material=structuredClone(copy);material.localization.disclosureRevision+='-updated';consent=factory(material,env(values));assert.equal(consent.isAllowed('suggestions'),false);consent.rejectAll();consent.destroy();material.localization.disclosureRevision+='-again';consent=factory(material,env(values));assert.equal(consent.getSnapshot().purposes.suggestions,'withdrawn');consent.destroy();
});

test('all consent statuses and accessible names use the complete selected copy, including restrictions and background changes',async()=>{
 const c=await config(),m=c.localization.consent,dom=new JSDOM('<div id="controls"></div>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const real=createConsent(c,env(new Map()));let state=real.getSnapshot(),listener;
 const controller={...real,getSnapshot:()=>structuredClone(state),subscribe:fn=>{listener=fn;fn(state);return ()=>{};}};
 const ui=mountControls(doc.querySelector('#controls'),{consent:controller});const emit=patch=>{state={...state,...patch};listener(state);};
 assert.equal(doc.querySelector('.nb-controls').lang,'pt-BR');assert.equal(doc.querySelector('.nb-controls').dir,'ltr');assert.equal(doc.querySelector('.nb-consent-notice').getAttribute('aria-label'),m.noticeLabel);assert.equal(doc.querySelector('.nb-preferences-trigger').textContent,m.triggerLabel);assert.equal(doc.querySelector('.nb-legal-links').getAttribute('aria-label'),m.privacyInformation);
 assert.equal(doc.querySelector('.nb-purpose-description+span').textContent,m.services.replace('{services}','Sugestões Juniper (Juniper)'));
 for(const status of ['checking','saving','recorded','error','review','stale','expired','unavailable','retired']){emit({evidence:{status,canGrant:false,canRetry:true,requiresChoice:false}});assert.ok(doc.querySelector('.nb-control-status').textContent.includes(m[status]),status);}
 for(const [patch,key] of [[{evidence:undefined,persistence:'unavailable'},'storageUnavailable'],[{persistence:'available',services:{reading:'reload-required'}},'reloadRequired'],[{services:{},privacySignals:{globalPrivacyControl:'observed'}},'signalObserved'],[{privacySignals:{globalPrivacyControl:'unavailable'}},'signalUnavailable'],[{privacySignals:undefined,processingChoices:{status:'recorded',blockedActivities:[]}},'processingRecorded'],[{processingChoices:{status:'error',blockedActivities:['sale']}},'processingPending']]){emit(patch);assert.ok(doc.querySelector('.nb-control-status').textContent.includes(m[key]),key);}
 emit({preferencesOpen:true});emit({purposes:{suggestions:'denied'}});assert.ok(doc.querySelector('.nb-preferences [role=status]').textContent.includes(m.choicesChanged));emit({destroyed:true});assert.ok(doc.querySelector('.nb-control-status').textContent.includes(m.destroyed));
 ui.destroy();real.destroy();dom.window.close();
});

test('localized restriction and significant-change disclosures cannot disappear behind custom copy',async()=>{
 const c=await config();c.scopeGuards={version:1,revision:'review-1',site:{children:'unknown',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 c.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'two',materialChange:{fromRevision:'one',summary:'Nova finalidade para revisão.'}};
 const wording=defaultConsentWording(c);assert.ok(wording.summary.includes(c.localization.consent.unavailableSummary));assert.ok(wording.preferencesIntro.includes(c.localization.consent.restrictedIntro));assert.ok(wording.summary.endsWith('Mudanças no tratamento opcional: Nova finalidade para revisão.'));assert.doesNotMatch(wording.summary,/Changes to optional processing/u);
 const build=compileLegalDocuments(c),notice=createConsentNotice(build.artifact,{scopeId:'privacy'}),storage=createSyntheticStorage([]),context={siteId:c.site.id,scopeId:'privacy',streamId:'localization-test',now:()=>new Date(instant)};
 await recordLegalRelease(storage,JSON.parse(canonicalJson(build.artifact)));await registerConsentNotice(storage,notice,context);
});

for(const [profile,factory] of consentProfiles)test(`${profile}: required evidence archives the selected messages and rejects mismatched copy`,async()=>{
 const c=await config(),build=compileLegalDocuments(c),notice=JSON.parse(canonicalJson(createConsentNotice(build.artifact,{scopeId:'privacy'}))),storage=createSyntheticStorage([]),context={siteId:c.site.id,scopeId:'privacy',streamId:'localization-test',now:()=>new Date(instant)};
 await recordLegalRelease(storage,JSON.parse(canonicalJson(build.artifact)));await registerConsentNotice(storage,JSON.parse(canonicalJson(notice)),context);await setActiveConsentNotice(storage,notice.noticeId,context);
 const head=await getConsentHead(storage,context),evidence={notice,streamRef:head.streamRef,read:()=>getConsentHead(storage,context),write:body=>recordConsentChoice(storage,body,context)};
 const values=new Map(),consent=factory(c,env(values),{evidence});await consent.settled();consent.acceptAll();await consent.settled();assert.equal(consent.isAllowed('suggestions'),true);const event=(await getConsentHead(storage,context)).event,record=await createConsentEvidenceStore(storage,context).get(event.id);assert.equal(canonicalJson(record.data.notice.localization),canonicalJson(notice.localization));consent.destroy();
 const copy=structuredClone(c);copy.localization.revision='copy-2';copy.localization.consent.retryLabel='Tentar outra vez';const nextBuild=compileLegalDocuments(copy),nextNotice=createConsentNotice(nextBuild.artifact,{scopeId:'privacy'});await recordLegalRelease(storage,nextBuild.artifact);await registerConsentNotice(storage,nextNotice,context);await setActiveConsentNotice(storage,nextNotice.noticeId,context);const resumed=factory(copy,env(values),{evidence:{...evidence,notice:nextNotice}});await resumed.settled();assert.equal(resumed.isAllowed('suggestions'),true);resumed.destroy();
 const retitled=structuredClone(c);retitled.documents.privacy.title='Unarchived title';const attached=factory(retitled,env(new Map()),{evidence}),dom=new JSDOM('<div id=controls></div>');dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};const controls=mountControls(dom.window.document.querySelector('#controls'),{consent:attached});assert.equal(dom.window.document.querySelector('.nb-legal-links a').textContent,notice.documents.privacy.title);controls.destroy();attached.destroy();dom.window.close();
 const wrong=structuredClone(notice);wrong.localization.consent.retryLabel='Unregistered copy';const changed=rehash(wrong);assert.throws(()=>factory(c,env(new Map()),{evidence:{...evidence,notice:changed}}),/localization/u);await assert.rejects(registerConsentNotice(storage,changed,context));
 const forged=structuredClone(notice);forged.wording.summary='Unregistered summary';await assert.rejects(registerConsentNotice(storage,rehash(forged),context));
});

test('the backend localization validator is generated from the same dependency-free contract',async()=>{
 const source=await readFile(new URL('../src/localization-policy.ts',import.meta.url),'utf8'),backend=await readFile(new URL('../../notabenda-cf/src/localization-policy.ts',import.meta.url),'utf8');assert.ok(backend.endsWith(source));
});

test('new descriptors reject coerced enums/versions; legacy English locale spelling remains valid',async()=>{
 const c=await config();
 for(const [key,value] of [['direction',['rtl']],['direction',{toString:()=> 'rtl'}],['reviewStatus',['draft']],['schemaVersion','1']]){const changed=structuredClone(c);changed.localization[key]=value;assert.equal(validateSiteConfig(changed,{mode:'preview'}).valid,false);}
 for(const locale of ['en-us','EN']){const old=await fixture({reviewed:true});old.site.locale=locale;assert.equal(validateSiteConfig(old).valid,true);assert.match(renderLegalPage(old,'terms'),new RegExp('lang="'+locale+'"','u'));}
 const build=compileLegalDocuments(c),notice=createConsentNotice(build.artifact,{scopeId:'privacy'}),storage=createSyntheticStorage([]),context={siteId:c.site.id};await recordLegalRelease(storage,build.artifact);
 for(const version of ['1','2',[2],true]){const wrong=rehash({...notice,schemaVersion:version});assert.throws(()=>normalizeConsentNotice(wrong));await assert.rejects(registerConsentNotice(storage,wrong,context));}
 const wrong=structuredClone(notice);wrong.localization.direction=['rtl'];assert.throws(()=>normalizeConsentNotice(rehash(wrong)));await assert.rejects(registerConsentNotice(storage,rehash(wrong),context));
});

test('Markdown/MDX and React/Astro preference entry points preserve selected language and direction',async()=>{
 const c=await config();c.site.locale=c.localization.locale='ar';c.localization.direction='rtl';
 for(const format of ['md','mdx']){const source='---\nkind: terms\ntitle: شروط القراءة\nroute: /localization/terms\nversion: "2"\neffectiveDate: 2026-10-19\nreview:\n  status: reviewed\nsectionIds:\n  معلومات: information\n---\n## معلومات\n\n'+(format==='md'?'نص **للقراءة**.':'<Note>نص للقراءة.</Note>');const result=await compileAuthoredDocuments(c,{terms:{format,source,...(format==='mdx'?{componentsRevision:'note-1',components:{Note:({children})=>createElement('aside',null,children)}}:{})}});assert.match(result.fragments.terms,/lang="ar" dir="rtl"/u);assert.match(result.files['localization/terms/index.html'],/شروط القراءة/u);assert.doesNotMatch(result.fragments.terms,/On this page|Draft —/u);}
 const controller=createConsent(c,env(new Map())),html=renderToStaticMarkup(createElement(ConsentProvider,{controller},createElement(PreferencesButton)));assert.match(html,/lang="ar" dir="rtl"/u);assert.ok(html.includes(c.localization.consent.triggerLabel));
 const dom=new JSDOM('<button data-notabenda-preferences data-notabenda-default-label hidden>Privacy choices</button><div data-notabenda-controls></div>');dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};const bridge=mountAstroConsent({consent:controller,document:dom.window.document}),button=dom.window.document.querySelector('button');assert.equal(button.lang,'ar');assert.equal(button.dir,'rtl');assert.equal(button.textContent,c.localization.consent.triggerLabel);bridge.destroy();controller.destroy();dom.window.close();
});
