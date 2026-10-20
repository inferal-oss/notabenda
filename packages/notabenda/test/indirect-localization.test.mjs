// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION REQ-PRODUCT-INDIRECT-NOTICE REQ-PRODUCT-LOCALIZATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {IndirectCollectionNotice as ReactNotice} from '@notabenda/core/react/documents';
import {normalizeIndirectCollectionNotice,normalizeIndirectCollectionLocalization,renderIndirectCollectionNotice,formatIndirectCollectionNotice} from '@notabenda/core/collection/indirect';
import {compileLegalDocuments,createIndirectCollectionNotice,verifyIndirectCollectionNotice,compileConsentRuntimeConfig,createConsentNotice,canonicalJson,sha256} from '@notabenda/core/content';
import {recordLegalRelease,validateLegalSourceArchive} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {localizedIndirectScenario} from '../../../examples/localization/indirect-build.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {selectPacks,reviewPackInputs,planPacks} from '@notabenda/core/packs';
import {fixture} from './helpers.mjs';
async function setup({reviewed=true,change=()=>{}}={}){
 const {config,settings}=localizedIndirectScenario(await fixture());change(config,settings);
 if(reviewed){config.localization.reviewStatus='reviewed';settings.reviewStatus='reviewed';for(const d of Object.values(config.documents))d.review.status='reviewed';}
 const options=reviewed?{}:{mode:'preview'},build=compileLegalDocuments(config,options),notice=createIndirectCollectionNotice(build.artifact,settings,options);
 return {config,settings,build,notice,options};
}
const rehash=n=>{const {noticeId,...body}=n;return {...n,noticeId:sha256(canonicalJson(body))};};

test('indirect interface copy is complete, selected, detached and bound to its intact release',async()=>{
 const f=await setup(),n=f.notice;assert.equal(n.schemaVersion,2);assert.equal(n.renderingPolicy,'indirect-collection-v2');assert.equal(n.profile,'nz-ipp3a');assert.deepEqual(n.localization.indirectCollection,f.config.localization.indirectCollection);assert.equal(n.localization.documents,undefined);assert.equal(n.localization.consent,undefined);assert.deepEqual(verifyIndirectCollectionNotice(n,f.build.artifact),n);
 const normalized=normalizeIndirectCollectionNotice(n);normalized.localization.indirectCollection.sourceLabel='Detached';assert.notEqual(n.localization.indirectCollection.sourceLabel,'Detached');
 for(const change of [n=>n.localization.indirectCollection.sourceLabel='Outra fonte',n=>n.localization.revision='other',n=>n.collections[0].purpose.retention='Different retention',n=>{n.schemaVersion=1;n.renderingPolicy='indirect-collection-v1';n.locale='en';delete n.localization;}]){const forged=structuredClone(n);change(forged);assert.throws(()=>verifyIndirectCollectionNotice(rehash(forged),f.build.artifact));}
 const archive=structuredClone(f.build.artifact);archive.publicConfig.localization.indirectCollection.sourceLabel='Substituted';assert.throws(()=>verifyIndirectCollectionNotice(n,archive));
});

test('all HTML and text branches use selected messages, retain visible particulars and preserve absolute destinations',async()=>{
 const f=await setup({reviewed:false,change:(c,s)=>{s.collections[0].authority={kind:'specified',laws:[{title:'Lei ilustrativa <literal>',provision:'Seção 1',relationship:'requires',url:'/law-test'},{title:'Outra lei ilustrativa',provision:'Seção 2',relationship:'authorises'}]};}}),m=f.notice.localization.indirectCollection;
 for(const phase of ['advance','collected']){
  const n=createIndirectCollectionNotice(f.build.artifact,{...f.settings,phase},f.options),html=renderIndirectCollectionNotice(n,{idPrefix:'pt',headingLevel:3,allowPreview:true}),plain=formatIndirectCollectionNotice(n,{allowPreview:true}),dom=new JSDOM(html),d=dom.window.document;
  assert.equal(d.querySelector('section').lang,'pt-BR');assert.equal(d.querySelector('section').dir,'ltr');assert.equal(d.querySelector('h3').textContent,n.wording.title);assert.equal(d.querySelector('h3').id,'pt-title');assert.equal(d.querySelector('section').getAttribute('aria-labelledby'),'pt-title');
  for(const value of [m[phase],m.informationLabel,m.sourceLabel,m.lawHeading,m.requires,m.authorises,m.recipientsHeading,m.collectorHeading,m.accessHeading,n.collector.address,n.accessCorrection.statement,n.collections[0].sourceDescription,'Lei ilustrativa <literal>']){assert.ok(d.body.textContent.includes(value),value);assert.ok(plain.includes(value),value);}
  assert.ok(d.body.textContent.includes(m.draft));assert.ok(plain.includes(m.draftText));assert.ok(d.body.textContent.includes(m.lawLinkLabel));assert.ok(d.body.textContent.includes(m.accessLinkLabel));
  assert.ok(!d.body.textContent.includes(m[phase==='advance'?'collected':'advance']));assert.equal(d.querySelector('details,[hidden],script,iframe,form,input,button,literal'),null);assert.equal(d.querySelector('time bdi').textContent,n.document.effectiveDate);assert.ok(plain.includes('https://juniper.example.test/law-test'));assert.ok(plain.includes('https://juniper.example.test/artifacts/'+n.artifactId+'/privacy.html'));assert.doesNotMatch(plain,/Information:|Source:|Particular law|Effective |We plan to collect|We have collected/);
  assert.equal(renderToStaticMarkup(createElement(ReactNotice,{notice:n,idPrefix:'pt',headingLevel:3,allowPreview:true})),`<div>${html}</div>`);dom.window.close();
 }
});

test('malformed dictionaries, schema downgrades, metadata and executable descriptors fail without running getters',async()=>{
 const f=await setup();
 for(const change of [n=>delete n.localization.indirectCollection.draft,n=>n.localization.indirectCollection.extra='extra',n=>n.localization.indirectCollection.sourceLabel='<b>Fonte</b>',n=>n.localization.indirectCollection.sourceLabel='x'.repeat(121),n=>n.localization.indirectCollection.advance='x'.repeat(2001),n=>n.localization.indirectCollection.advance='{phase}',n=>n.localization.indirectCollection.effectiveDate='Missing substitution',n=>n.localization.indirectCollection.effectiveDate='{effectiveDate} {unknown}',n=>n.localization.locale='pt-br',n=>n.locale='en',n=>n.localization.direction='auto',n=>n.renderingPolicy='indirect-collection-v1',n=>n.schemaVersion=1,n=>delete n.localization]){const n=structuredClone(f.notice);change(n);assert.throws(()=>normalizeIndirectCollectionNotice(n));}
 let reads=0;const n=structuredClone(f.notice);Object.defineProperty(n.localization.indirectCollection,'draft',{enumerable:true,get(){reads++;return 'never';}});assert.throws(()=>normalizeIndirectCollectionNotice(n));assert.throws(()=>normalizeIndirectCollectionLocalization(n.localization));assert.equal(reads,0);
 const huge=structuredClone(f.notice.localization);for(const key of ['draft','draftText','advance','collected','lawHeading','requires','authorises','recipientsHeading','collectorHeading'])huge.indirectCollection[key]='x'.repeat(1900);assert.throws(()=>normalizeIndirectCollectionLocalization(huge));
});

test('missing indirect messages stay unresolved in the builder and guided configuration without changing language',async()=>{
 const f=await setup(),old=structuredClone(f.config);delete old.localization.indirectCollection;old.localization.collection=JSON.parse(await readFile(new URL('../../../examples/localization/collection-messages.json',import.meta.url),'utf8'));const before=structuredClone(old);
 assert.throws(()=>createIndirectCollectionNotice(compileLegalDocuments(old).artifact,f.settings),/without localization.indirectCollection/);assert.deepEqual(old,before);
 const selection=selectPacks(['indirect-collection']),find=c=>reviewPackInputs(selection,c).packs.find(p=>p.id==='indirect-collection').items.find(i=>i.id==='language');assert.equal(find(old).state,'missing');assert.equal(find(f.config).state,'declared');assert.ok(planPacks(selection).reference.targets.find(t=>t.id==='indirect-collection-notice').conditionalConfig.some(c=>c.requiredPaths.includes('localization.indirectCollection')));assert.equal(old.site.locale,'pt-BR');
});

test('retained releases reproduce the exact notice while cookie material scopes and runtime stay separate',async()=>{
 const f=await setup(),storage=createSyntheticStorage([]);await recordLegalRelease(storage,f.build.artifact);const stored=await storage.get('notabenda/releases/'+f.notice.artifactId),checked=await validateLegalSourceArchive(stored.artifact),restored=createIndirectCollectionNotice(checked.artifact,f.settings);assert.deepEqual(restored,f.notice);assert.equal(renderIndirectCollectionNotice(restored,{idPrefix:'retained'}),renderIndirectCollectionNotice(f.notice,{idPrefix:'retained'}));
 const config=localizedExampleConfig(await fixture());config.localization.indirectCollection=f.config.localization.indirectCollection;config.localization.reviewStatus='reviewed';for(const d of Object.values(config.documents))d.review.status='reviewed';const old=structuredClone(config);delete old.localization.indirectCollection;
 assert.deepEqual(compileConsentRuntimeConfig(config,{evidence:'local'}),compileConsentRuntimeConfig(old,{evidence:'local'}));const a=createConsentNotice(compileLegalDocuments(config).artifact,{scopeId:'cookies'}),b=createConsentNotice(compileLegalDocuments(old).artifact,{scopeId:'cookies'});assert.deepEqual(a.scopes,b.scopes);assert.equal(a.localization.indirectCollection,undefined);
 config.localization.indirectCollection.sourceLabel='Outra fonte';config.localization.revision='copy-2';assert.deepEqual(compileConsentRuntimeConfig(config,{evidence:'local'}),compileConsentRuntimeConfig(old,{evidence:'local'}));
});

test('RTL isolates factual substitutions and keeps literal text out of executable HTML',async()=>{
 const f=await setup({change:(c,s)=>{c.site.locale='ar';c.localization.locale='ar';c.localization.direction='rtl';s.wording.title='عنوان <img src=x onerror=bad()> {effectiveDate}';c.documents.privacy.version='release-{effectiveDate}';c.localization.indirectCollection.effectiveDate='التاريخ {effectiveDate}';}}),html=renderIndirectCollectionNotice(f.notice,{idPrefix:'rtl'}),dom=new JSDOM(html),d=dom.window.document;
 assert.equal(d.querySelector('section').dir,'rtl');assert.equal(d.querySelector('section').lang,'ar');assert.equal(d.querySelector('h2 bdi').textContent,f.settings.wording.title);assert.equal(d.querySelector('img,script'),null);assert.equal(d.querySelector('time bdi').textContent,f.notice.document.effectiveDate);assert.ok(d.body.textContent.includes('release-{effectiveDate}'));assert.ok(formatIndirectCollectionNotice(f.notice).includes('release-{effectiveDate}'));dom.window.close();
});

test('draft interface review is explicit even when documents and notice wording are reviewed',async()=>{
 const f=await setup({reviewed:false});assert.throws(()=>normalizeIndirectCollectionNotice(f.notice));assert.throws(()=>formatIndirectCollectionNotice(f.notice));assert.throws(()=>renderIndirectCollectionNotice(f.notice,{idPrefix:'draft'}));assert.throws(()=>verifyIndirectCollectionNotice(f.notice,f.build.artifact));assert.ok(formatIndirectCollectionNotice(f.notice,{allowPreview:true}).includes(f.notice.localization.indirectCollection.draftText));
 const config=structuredClone(f.config);for(const d of Object.values(config.documents))d.review.status='reviewed';assert.throws(()=>compileLegalDocuments(config));
});

test('legacy English HTML and text remain byte-for-byte unchanged',async()=>{
 const c=await fixture({reviewed:true});c.site.locale='en-NZ';c.purposes[0].collection.source='indirect';
 const s={profile:'nz-ipp3a',scopeId:'referrals',phase:'collected',reviewStatus:'reviewed',wording:{title:'About your referral',intro:'A partner passed on your enquiry.'},collections:[{purposeId:'enquiries',dataCategories:[c.purposes[0].dataCategories[0]],sourceDescription:'A partner studio.',authority:{kind:'specified',laws:[{title:'Synthetic law',provision:'Section 1',relationship:'requires',url:'/law-test'}]}}],recipientStatement:'The enquiries team.',accessCorrection:{statement:'Ask for access or correction.',url:'/requests'}};
 const n=createIndirectCollectionNotice(compileLegalDocuments(c).artifact,s);assert.equal(n.schemaVersion,1);assert.deepEqual(verifyIndirectCollectionNotice(n,compileLegalDocuments(c).artifact),n);assert.equal(sha256(renderIndirectCollectionNotice(n,{idPrefix:'compat'})),'1179632592d1963b448f9d6d55f988f60afc6ae5fafc5c14a1a5f7c1f3a389fb');assert.equal(sha256(formatIndirectCollectionNotice(n)),'b43793b1b0eb9c170696835c8e93373e3f60e87190326b949685053a2fcfabd6');
});
