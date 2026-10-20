// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-COLLECTION-NOTICE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CollectionNotice as ReactNotice} from 'notabenda/react/documents';
import {normalizeCollectionNotice,renderCollectionNotice,toPublicConfig} from 'notabenda';
import {compileLegalDocuments,createCollectionNotice,verifyCollectionNotice,compileConsentRuntimeConfig,createConsentNotice,canonicalJson,sha256} from 'notabenda/content';
import {recordLegalRelease,registerConsentNotice} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {fixture} from './helpers.mjs';
import {normalizeCollectionLocalization} from '../dist/collection-localization-policy.js';
const messages=JSON.parse(await readFile(new URL('../../../examples/localization/collection-messages.json',import.meta.url),'utf8'));
const settings={scopeId:'contact',purposeIds:['suggestions'],reviewStatus:'draft',wording:{title:'Sobre sua mensagem',intro:'Leia como usamos as informações declaradas.'}};
async function setup({reviewed=false,change=()=>{}}={}){
 const config=localizedExampleConfig(await fixture());config.localization.collection=structuredClone(messages);change(config);
 if(reviewed){config.localization.reviewStatus='reviewed';for(const d of Object.values(config.documents))d.review.status='reviewed';}
 const options=reviewed?{}:{mode:'preview'},build=compileLegalDocuments(config,options),notice=createCollectionNotice(build.artifact,{...settings,reviewStatus:reviewed?'reviewed':'draft'},options);
 return {config,build,notice,options};
}
const rehash=n=>{const {noticeId,...body}=n;return {...n,noticeId:sha256(canonicalJson(body))};};

test('localized static notices pin complete copy and verify against an intact release',async()=>{
 const f=await setup({reviewed:true}),before=structuredClone(f.build.artifact),n=f.notice;
 assert.equal(n.schemaVersion,2);assert.equal(n.renderingPolicy,'collection-v2');assert.equal(n.locale,'pt-BR');assert.deepEqual(n.localization.collection,messages);
 assert.deepEqual(verifyCollectionNotice(n,f.build.artifact),n);assert.deepEqual(f.build.artifact,before);
 assert.equal(n.wording.detailsLabel,messages.detailsLabel);assert.equal(n.wording.privacyLinkLabel,messages.privacyLinkLabel);
 const copy=normalizeCollectionNotice(n);copy.localization.collection.draft='changed';assert.deepEqual(n.localization.collection,messages);
 assert.deepEqual(toPublicConfig(f.config).localization.collection,messages);
 const old=structuredClone(f.config);delete old.localization.collection;assert.throws(()=>createCollectionNotice(compileLegalDocuments(old).artifact,{...settings,reviewStatus:'reviewed'}),/without localization.collection/u);
 assert.throws(()=>createCollectionNotice(f.build.artifact,{...settings,reviewStatus:'reviewed',wording:{...settings.wording,detailsLabel:'Unversioned override'}}),/versioned/u);
});

test('shape validation and release verification reject malformed, tampered and downgraded copy',async()=>{
 const f=await setup({reviewed:true});
 for(const change of [n=>delete n.localization.collection.draft,n=>n.localization.collection.extra='bad',n=>n.localization.collection.privacyVersion='Missing placeholder',n=>n.localization.collection.effectiveDate='{unknown}',n=>n.localization.collection.draft='<b>bad</b>',n=>n.localization.collection.draft='x'.repeat(2001),n=>n.localization.collection.detailsLabel='x'.repeat(121),n=>n.localization.locale='pt-br',n=>n.localization.direction='auto',n=>n.locale='en',n=>n.renderingPolicy='collection-v1',n=>n.schemaVersion=1,n=>delete n.localization]){
  const n=structuredClone(f.notice);change(n);assert.throws(()=>normalizeCollectionNotice(n));
 }
 for(const change of [n=>n.localization.collection.draft='Outra mensagem.',n=>n.localization.revision='copy-other',n=>n.purposes[0].retention='Different facts',n=>{n.schemaVersion=1;n.renderingPolicy='collection-v1';n.locale='en';delete n.localization;}]){
  const n=structuredClone(f.notice);change(n);assert.throws(()=>verifyCollectionNotice(rehash(n),f.build.artifact));
 }
 const n=structuredClone(f.notice);n.noticeId='0'.repeat(64);assert.throws(()=>verifyCollectionNotice(n,f.build.artifact));
 const archive=structuredClone(f.build.artifact);archive.publicConfig.localization.collection.draft='Different archive';assert.throws(()=>verifyCollectionNotice(f.notice,archive));
});

test('static output translates all branches, escapes facts and adds no input or runtime behavior',async()=>{
 const f=await setup({change:c=>{
  c.purposes[0].collection.source='both';c.purposes[0].collection.required=true;c.purposes[0].name='Leitura <literal>';
  c.controller.representative={name:'Representante',email:'representative@example.test'};c.controller.dpo={name:'Equipe de dados',email:'data@example.test'};
  c.privacy.rightsUrl='/rights';c.privacy.complaints.url='/complaints';c.services[0].privacyUrl='https://provider.example.test/privacy';
 }});
 const html=renderCollectionNotice(f.notice,{idPrefix:'contact',allowPreview:true,headingLevel:3}),dom=new JSDOM(html),d=dom.window.document;
 try{
  assert.equal(d.querySelector('section').lang,'pt-BR');assert.equal(d.querySelector('section').dir,'ltr');assert.equal(d.querySelector('h3').textContent,settings.wording.title);
  assert.equal(d.querySelector('details').open,false);assert.equal(d.querySelector('summary').textContent,messages.detailsLabel);
  for(const text of [messages.draft,messages.mixedSources,messages.required,messages.bothSource,messages.representativeHeading,messages.dpoHeading,messages.providerPrivacyLabel,messages.exerciseRightsLabel,messages.complaintInfoLabel])assert.ok(d.body.textContent.includes(text),text);
  assert.ok(d.body.textContent.includes('Leitura <literal>'));assert.equal(d.querySelector('literal,script,form,input,button,iframe,style'),null);
  assert.doesNotMatch(d.body.textContent,/Responsible:|Privacy version|Providing information|No related services|Collection source/u);
  assert.equal(d.querySelector('time').getAttribute('datetime'),f.notice.document.effectiveDate);assert.equal(d.querySelector('time bdi').textContent,f.notice.document.effectiveDate);
  assert.deepEqual(f.notice.recipients.map(s=>s.id),['reading']);assert.equal(f.notice.purposes.length,1);
  assert.equal(renderToStaticMarkup(createElement(ReactNotice,{notice:f.notice,idPrefix:'contact',allowPreview:true,headingLevel:3})),`<div>${html}</div>`);
 }finally{dom.window.close();}
 const empty=await setup({change:c=>{c.services=c.services.filter(s=>!s.purposeIds.includes('suggestions'));c.consent.services=c.consent.services.filter(s=>s.id!=='reading');c.consent.purposes=c.consent.purposes.filter(p=>p.id!=='suggestions');}});
 assert.ok(renderCollectionNotice(empty.notice,{idPrefix:'empty',allowPreview:true}).includes(messages.noRecipients));
});

test('collection text stays out of cookie scope and standalone CF notice projection',async()=>{
 const f=await setup({reviewed:true}),old=structuredClone(f.config);delete old.localization.collection;
 assert.deepEqual(compileConsentRuntimeConfig(f.config,{evidence:'local'}),compileConsentRuntimeConfig(old,{evidence:'local'}));
 const before=createConsentNotice(compileLegalDocuments(old).artifact,{scopeId:'cookies'}),after=createConsentNotice(f.build.artifact,{scopeId:'cookies'});
 assert.deepEqual(before.scopes,after.scopes);assert.equal(Object.hasOwn(after.localization,'collection'),false);
 const storage=createSyntheticStorage([]);await recordLegalRelease(storage,f.build.artifact);await registerConsentNotice(storage,after,{siteId:after.siteId,scopeId:after.scopeId,streamId:'synthetic',now:()=>new Date('2026-10-19T12:00:00Z')});
});

test('selected copy review, accessors and descriptor budgets remain explicit',async()=>{
 const f=await setup();assert.throws(()=>normalizeCollectionNotice(f.notice));assert.throws(()=>verifyCollectionNotice(f.notice,f.build.artifact));
 let reads=0;const l=structuredClone(f.notice.localization);Object.defineProperty(l.collection,'draft',{enumerable:true,get(){reads++;return 'Never read';}});assert.throws(()=>normalizeCollectionLocalization(l,{allowPreview:true}));assert.equal(reads,0);
 const large=structuredClone(f.notice.localization);for(const [key,text] of Object.entries(large.collection))if(!key.endsWith('Label'))large.collection[key]=text+'x'.repeat(850);
 assert.throws(()=>normalizeCollectionLocalization(large,{allowPreview:true}));
});

test('RTL metadata and date substitutions are isolated without translating declared facts',async()=>{
 const f=await setup({change:c=>{c.site.locale='ar';c.localization.locale='ar';c.localization.direction='rtl';}}),dom=new JSDOM(renderCollectionNotice(f.notice,{idPrefix:'rtl',allowPreview:true}));
 try{const d=dom.window.document;assert.equal(d.querySelector('section').dir,'rtl');assert.equal(d.querySelector('section').lang,'ar');assert.equal(d.querySelector('time bdi').textContent,f.notice.document.effectiveDate);assert.ok(d.querySelector('h3').textContent.includes(f.notice.purposes[0].name));}finally{dom.window.close();}
});

test('English v1 remains the default and verifies with custom context labels',async()=>{
 const c=await fixture({reviewed:true}),build=compileLegalDocuments(c),n=createCollectionNotice(build.artifact,{...settings,purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{...settings.wording,detailsLabel:'Context details',privacyLinkLabel:'Context policy'}});
 assert.equal(n.schemaVersion,1);assert.equal(n.renderingPolicy,'collection-v1');assert.equal(n.localization,undefined);assert.deepEqual(verifyCollectionNotice(n,build.artifact),n);assert.ok(renderCollectionNotice(n,{idPrefix:'old'}).includes('Context details'));
});
