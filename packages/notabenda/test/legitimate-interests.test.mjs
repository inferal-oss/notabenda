// @requirements REQ-EU-INTERESTS-DISCLOSURE REQ-PRODUCT-CONFIG REQ-PRODUCT-COLLECTION-NOTICE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {toPublicConfig,validateSiteConfig,renderCollectionNotice,normalizeCollectionNotice} from 'notabenda';
import {compileLegalDocuments,createCollectionNotice,verifyCollectionNotice,compileConsentRuntimeConfig,createConsentNotice,createFormPermissionOffer,canonicalJson,sha256} from 'notabenda/content';
import {recordLegalRelease,registerConsentNotice,registerFormPermissionOffer} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {normalizeConsentRuntimeConfig} from '../dist/consent-runtime-config.js';
import {normalizeDraftPurpose,createPurposeDraftPlan} from 'notabenda/setup/purposes';
import {createServiceDirectory,renderServiceDirectory} from 'notabenda/services';
import {fixture} from './helpers.mjs';
import {consentProfiles} from './consent-profiles.mjs';

const statement='Our interest is to protect the support inbox from repeated abusive submissions.';
const settings={scopeId:'contact',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'About your message',intro:'How we handle enquiries.'}};
const rehash=(value,key)=>{const {[key]:_,...body}=value;return {...value,[key]:sha256(canonicalJson(body))};};

test('public interests are bounded, explicitly supplied and distinct from private reasoning and device consent',async()=>{
 const input=await fixture({reviewed:true});input.purposes[0].legalBasis='Legitimate interests';
 assert.equal(validateSiteConfig(input,{mode:'production'}).valid,true,'legacy basis text is not parsed to infer applicability');
 assert.equal(Object.hasOwn(toPublicConfig(input).purposes[0],'legitimateInterests'),false);
 input.purposes[0].legitimateInterests=statement;input.purposes[0].balancingAssessment='PRIVATE_ASSESSMENT';
 const c=toPublicConfig(input);assert.equal(c.purposes[0].legitimateInterests,statement);assert.doesNotMatch(JSON.stringify(c),/PRIVATE_ASSESSMENT/);
 c.purposes[0].legitimateInterests='changed';assert.equal(input.purposes[0].legitimateInterests,statement);
 for(const value of ['', '  ',null,[],{},'x\u0000y','é'.repeat(2001)]){
  const v=structuredClone(input);v.purposes[0].legitimateInterests=value;
  const result=validateSiteConfig(v);assert.equal(result.valid,false);assert.ok(result.diagnostics.some(d=>d.path==='purposes[0].legitimateInterests'&&d.requirementIds.includes('REQ-EU-INTERESTS-DISCLOSURE')));
 }
 input.purposes[0].legitimateInterests='é'.repeat(2000);assert.equal(validateSiteConfig(input).valid,true);
 input.purposes[0].legitimateInterests='{{purposes.enquiries.legitimateInterests}}';assert.equal(validateSiteConfig(input,{mode:'preview'}).valid,true);assert.equal(validateSiteConfig(input,{mode:'production'}).valid,false);
});

test('generated privacy and direct notices disclose the same escaped interests and bind them to the release',async()=>{
 const c=await fixture({reviewed:true});c.purposes[0].legalBasis='Legitimate interests';c.purposes[0].legitimateInterests=statement+' <script>unsafe()</script>';
 c.services.push({id:'inbox',name:'Support inbox',provider:'Example provider',purposeIds:['enquiries'],location:'Example region'});
 const build=compileLegalDocuments(c),notice=createCollectionNotice(build.artifact,settings);
 const html=renderCollectionNotice(notice,{idPrefix:'contact'}),dom=new JSDOM(html);
 try{
  assert.equal(dom.window.document.querySelector('script'),null);
  assert.ok(dom.window.document.querySelector('details').textContent.includes(c.purposes[0].legitimateInterests));
  assert.equal(dom.window.document.querySelector('details').open,false);
  assert.ok(build.artifact.documents.privacy.sections.find(s=>s.id==='purposes').items[0].includes(c.purposes[0].legitimateInterests));
  assert.ok(build.manifest.requirementIds.includes('REQ-EU-INTERESTS-DISCLOSURE'));assert.ok(build.artifact.documents.privacy.requirementIds.includes('REQ-EU-INTERESTS-DISCLOSURE'));
  assert.ok(build.artifact.pages['privacy/index.html'].includes('&lt;script&gt;'));
  const directory=createServiceDirectory(c);assert.ok(directory.services.some(s=>s.purposes.some(p=>p.legitimateInterests===c.purposes[0].legitimateInterests)));
  assert.ok(renderServiceDirectory(c,{idPrefix:'providers'}).includes('&lt;script&gt;'));
  assert.deepEqual(verifyCollectionNotice(notice,build.artifact),notice);
  for(const mutate of [n=>n.purposes[0].legitimateInterests='Different interests.',n=>delete n.purposes[0].legitimateInterests]){
   const changed=structuredClone(notice);mutate(changed);assert.throws(()=>verifyCollectionNotice(rehash(changed,'noticeId'),build.artifact));
  }
  const bad=structuredClone(notice);bad.purposes[0].legitimateInterests='';assert.throws(()=>normalizeCollectionNotice(bad));
  const old=structuredClone(c);delete old.purposes[0].legitimateInterests;const previous=compileLegalDocuments(old);
  assert.equal(previous.manifest.requirementIds.includes('REQ-EU-INTERESTS-DISCLOSURE'),false);
  assert.notEqual(previous.artifact.manifest.artifactId,build.artifact.manifest.artifactId);
  assert.notEqual(createCollectionNotice(previous.artifact,settings).noticeId,notice.noticeId);
 }finally{dom.window.close();}
});

test('localized interests use existing host-language basis slots without a new mandatory dictionary key',async()=>{
 const config=localizedExampleConfig(await fixture({reviewed:true}));config.localization.reviewStatus='reviewed';for(const d of Object.values(config.documents))d.review.status='reviewed';
 config.localization.collection=JSON.parse(await readFile(new URL('../../../examples/localization/collection-messages.json',import.meta.url),'utf8'));
 const text='Nosso interesse é proteger a caixa de suporte contra mensagens abusivas.';config.purposes[0].legitimateInterests=text;
 const build=compileLegalDocuments(config),notice=createCollectionNotice(build.artifact,{...settings,purposeIds:[config.purposes[0].id]});
 const dom=new JSDOM(renderCollectionNotice(notice,{idPrefix:'portuguese'}));
 try{assert.ok(dom.window.document.querySelector('details').textContent.includes(text));assert.doesNotMatch(dom.window.document.body.textContent,/Legitimate interests|Legal basis/);assert.ok(build.artifact.documents.privacy.sections.find(s=>s.id==='purposes').items[0].includes(text));}finally{dom.window.close();}
});

test('material scope and standalone CF reconstruction retain interests; removed or forged facts fail even with a new digest',async()=>{
 const c=await fixture({reviewed:true});c.storage=[];c.services=c.purposes.map((p,i)=>({id:'service-'+i,name:'Optional service '+i,provider:'Example provider',purposeIds:[p.id],location:'This browser'}));
 c.consent={purposes:c.purposes.map(p=>({id:p.id,scope:'one'})),services:c.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:10};
 c.scopeGuards={version:1,revision:'one',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 const old=compileLegalDocuments(c);c.purposes[0].legitimateInterests=statement;
 const build=compileLegalDocuments(c),notice=createConsentNotice(build.artifact,{scopeId:'cookies'}),oldNotice=createConsentNotice(old.artifact,{scopeId:'cookies'});
 const runtime=compileConsentRuntimeConfig(c,{evidence:'local'});assert.deepEqual(runtime.inventory.purposes,build.publicConfig.purposes);
 assert.equal(normalizeConsentRuntimeConfig(runtime).inventory.purposes[0].legitimateInterests,statement);
 // Interests are public processing facts, even when device permission remains a separate decision.
 const managed=c.consent.purposes[0].id,changed=structuredClone(c);changed.purposes.find(p=>p.id===managed).legitimateInterests=statement+' For the declared optional service.';
 const newNotice=createConsentNotice(compileLegalDocuments(changed).artifact,{scopeId:'cookies'});assert.notEqual(newNotice.scopes[managed],notice.scopes[managed]);
 for(const id of c.consent.purposes.map(p=>p.id))if(id!==c.purposes[0].id)assert.equal(notice.scopes[id],oldNotice.scopes[id]);
 const storage=createSyntheticStorage([]);await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,{siteId:c.site.id,scopeId:'cookies',streamId:'synthetic'});
 const permission={permissionId:'enquiry-updates',purposeId:'enquiries',channel:{id:'email',label:'Email'},revision:'one',reviewStatus:'reviewed',withdrawalUrl:'/preferences',wording:{title:'Email updates',statement:'Email me updates about this enquiry.',grantLabel:'Allow updates',withdrawLabel:'Stop updates',optionality:'Optional.',withdrawalExplanation:'You can withdraw this permission here.'}};
 const offer=createFormPermissionOffer(build.artifact,permission),context={siteId:c.site.id,permissionId:permission.permissionId,streamId:'synthetic'};
 assert.equal(offer.facts.purpose.legitimateInterests,statement);await registerFormPermissionOffer(storage,offer,context);
 for(const mutate of [o=>delete o.facts.purpose.legitimateInterests,o=>o.facts.purpose.legitimateInterests='Forged interests.']){
  const forged=structuredClone(offer);mutate(forged);await assert.rejects(registerFormPermissionOffer(storage,rehash(forged,'offerId'),context),e=>e.code==='invalid-offer');
 }
});

test('setup preserves, edits and clears explicit interests; installed schema exposes the optional field',async()=>{
 const config=await fixture(),purpose={...config.purposes[0],legitimateInterests:statement};
 assert.deepEqual(normalizeDraftPurpose(purpose),purpose);
 const changed=createPurposeDraftPlan(config,{action:'update',previous:config.purposes[0],purpose});assert.equal(changed.config.purposes[0].legitimateInterests,statement);assert.equal(changed.config.documents.privacy.review.status,'draft');
 const cleared=structuredClone(purpose);delete cleared.legitimateInterests;assert.equal(Object.hasOwn(createPurposeDraftPlan(changed.config,{action:'update',previous:purpose,purpose:cleared}).config.purposes[0],'legitimateInterests'),false);
 const cli=spawnSync(process.execPath,['packages/notabenda/dist/cli.js','schema','purposes.legitimateInterests','--json'],{encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);assert.match(cli.stdout,/legitimateInterests/);assert.match(cli.stdout,/string/);
});

test('changing a managed interest removes only the affected saved grant in both runtime profiles',async()=>{
 const c=await fixture();c.storage=[];c.services=c.purposes.map((p,i)=>({id:'service-'+i,name:'Service '+i,provider:'Example',purposeIds:[p.id],location:'This browser'}));
 c.consent={purposes:c.purposes.map(p=>({id:p.id,scope:'one'})),services:c.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:1,refusalLifetimeDays:30,dismissalMinutes:5};
 for(const [name,create] of consentProfiles){
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},environment={storage,now:()=>Date.parse('2026-10-19T12:00:00Z')};
  let controller=create(c,environment);controller.acceptAll();assert.equal(controller.isAllowed(c.purposes[0].id),true,name);controller.destroy();
  const changed=structuredClone(c);changed.purposes[0].legitimateInterests=statement;controller=create(changed,environment);
  assert.equal(controller.isAllowed(c.purposes[0].id),false,name);assert.equal(controller.isAllowed(c.purposes[1].id),true,name);controller.destroy();
 }
});
