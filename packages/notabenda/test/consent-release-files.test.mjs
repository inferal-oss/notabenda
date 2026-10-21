// @requirements REQ-PRODUCT-CONSENT-NOTICE-FILES
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-RETAINED-RELEASES REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-LOCALIZATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileLegalDocuments,createConsentNotice,createConsentNoticeFiles,createRetainedConsentNoticeFiles,canonicalJson,sha256} from '@notabenda/core/content';
import {fixture} from './helpers.mjs';
import {frenchTechnologyLocalization} from './fixtures/technology-fr.mjs';
const path=n=>`artifacts/${n.artifactId}/consent/${n.noticeId}.json`;
async function setup({preview=false,localized=false}={}){const config=await fixture({reviewed:!preview});config.storage=[];config.services=[{id:'metrics',name:'Usage counts',provider:'Example provider',purposeIds:[config.purposes[0].id],location:'This browser'}];config.consent={purposes:[{id:config.purposes[0].id,scope:'purpose-one'}],services:[{id:'metrics',scope:'service-one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:15};if(localized){config.site.locale='fr-CA';config.localization=structuredClone(frenchTechnologyLocalization);for(const d of Object.values(config.documents)){d.source='supplied';d.sections??=[{id:'content',heading:'Information',paragraphs:['Texte fourni pour cet essai.']}];}}const mode=preview?'preview':'production';return {config,mode,build:compileLegalDocuments(config,{mode})};}

test('current notice files preserve factory identity and use the notice hash in the pinned URL',async()=>{
 const {build}=await setup(),settings={scopeId:'cookie-choices',deliveryWindowSeconds:120},result=createConsentNoticeFiles(build.artifact,settings),expected=createConsentNotice(build.artifact,settings);assert.deepEqual(result.notice,expected);assert.deepEqual(Object.keys(result.files),['consent-notice.json',path(expected)]);assert.equal(result.files[path(expected)],canonicalJson(expected)+'\n');assert.equal(result.files['consent-notice.json'],result.files[path(expected)]);result.notice.wording.title='Changed return value';assert.equal(JSON.parse(result.files[path(expected)]).wording.title,expected.wording.title);
 const changed=createConsentNoticeFiles(build.artifact,{...settings,wording:{title:'Your optional services'}});assert.equal(changed.notice.artifactId,expected.artifactId);assert.equal(changed.notice.scopeDigest,expected.scopeDigest);assert.notEqual(changed.notice.noticeId,expected.noticeId);assert.notEqual(path(changed.notice),path(expected));
 const retained=createRetainedConsentNoticeFiles([build.artifact],[expected,changed.notice,expected],{siteId:expected.siteId});assert.equal(Object.keys(retained).length,2);assert.equal(retained['consent-notice.json'],undefined);assert.equal(retained[path(expected)],canonicalJson(expected)+'\n');
});

test('old notices survive a changed release without replacing the current alias',async()=>{
 const {build,config}=await setup(),old=createConsentNoticeFiles(build.artifact,{scopeId:'cookie-choices'});config.documents.cookies.version='2';config.documents.cookies.effectiveDate='2026-10-20';const next=compileLegalDocuments(config),current=createConsentNoticeFiles(next.artifact,{scopeId:'cookie-choices'}),files={...createRetainedConsentNoticeFiles([next.artifact,build.artifact],[old.notice],{siteId:config.site.id}),...current.files};assert.equal(files[path(old.notice)],old.files[path(old.notice)]);assert.equal(JSON.parse(files['consent-notice.json']).noticeId,current.notice.noticeId);assert.equal(Object.keys(files).length,3);
 assert.throws(()=>createRetainedConsentNoticeFiles([next.artifact],[old.notice],{siteId:config.site.id}));
});

test('complete archived facts and notice hashes are checked, including custom copy and localization',async()=>{
 for(const localized of [false,true]){
  const {build}=await setup({localized}),{notice}=createConsentNoticeFiles(build.artifact,{scopeId:'cookie-choices'});const retained=createRetainedConsentNoticeFiles([build.artifact],[notice],{siteId:notice.siteId});assert.equal(retained[path(notice)],canonicalJson(notice)+'\n');
  for(const mutate of [n=>n.noticeId='a'.repeat(64),n=>n.scopeDigest='b'.repeat(64),n=>n.scopes[Object.keys(n.scopes)[0]]+='changed',n=>n.documents.cookies.version='wrong',n=>n.policy.grantLifetimeDays=2,n=>n.mode='preview',n=>n.extra='PRIVATE_SENTINEL',n=>n.information={rights:{label:'Different',url:'/different'}}]){const bad=structuredClone(notice);mutate(bad);if(bad.noticeId===notice.noticeId){const {noticeId:_,...body}=bad;bad.noticeId=sha256(canonicalJson(body));}assert.throws(()=>createRetainedConsentNoticeFiles([build.artifact],[bad],{siteId:notice.siteId}));}
  if(localized){const bad=structuredClone(notice);bad.localization.consent.title='Different';const {noticeId:_,...body}=bad;bad.noticeId=sha256(canonicalJson(body));assert.throws(()=>createRetainedConsentNoticeFiles([build.artifact],[bad],{siteId:notice.siteId}));assert.throws(()=>createConsentNoticeFiles(build.artifact,{scopeId:'cookie-choices',wording:{title:'Override'}}));}
  assert.throws(()=>createRetainedConsentNoticeFiles([build.artifact],[notice],{siteId:'another-site'}));const corrupt=structuredClone(build.artifact);corrupt.pages[Object.keys(corrupt.pages)[0]]+='changed';assert.throws(()=>createConsentNoticeFiles(corrupt,{scopeId:'cookie-choices'}));
 }
});

test('preview requires explicit mode and malformed settings or non-data inputs execute nothing',async()=>{
 const {build}=await setup(),draft=await setup({preview:true});assert.throws(()=>createConsentNoticeFiles(draft.build.artifact,{scopeId:'choices'}));const result=createConsentNoticeFiles(draft.build.artifact,{scopeId:'choices'},{mode:'preview'});assert.throws(()=>createRetainedConsentNoticeFiles([draft.build.artifact],[result.notice],{siteId:result.notice.siteId}));assert.ok(createRetainedConsentNoticeFiles([draft.build.artifact],[result.notice],{siteId:result.notice.siteId,mode:'preview'})[path(result.notice)]);
 for(const settings of [{},null,{scopeId:'../escape'},{scopeId:'choices',wording:null},{scopeId:'choices',wording:[]},{scopeId:'choices',deliveryWindowSeconds:null},{scopeId:'choices',deliveryWindowSeconds:29},{scopeId:'choices',extra:true},{scopeId:'choices',wording:{title:'x'.repeat(40000)}}])assert.throws(()=>createConsentNoticeFiles(build.artifact,settings));
 let reads=0;const accessor={get scopeId(){reads++;return 'choices';}},toJSON={scopeId:'choices',toJSON(){reads++;return {scopeId:'choices'};}};for(const settings of [accessor,toJSON])assert.throws(()=>createConsentNoticeFiles(build.artifact,settings));
 const {notice}=createConsentNoticeFiles(build.artifact,{scopeId:'choices'}),hostileNotice=Object.defineProperty(structuredClone(notice),'wording',{get(){reads++;return notice.wording;},enumerable:true});assert.throws(()=>createRetainedConsentNoticeFiles([build.artifact],[hostileNotice],{siteId:notice.siteId}));
 const hostileArray=[];Object.defineProperty(hostileArray,'0',{get(){reads++;return notice;},enumerable:true});for(const notices of [hostileArray,new Array(1),Array(257).fill(notice),Object.assign([notice],{extra:true})])assert.throws(()=>createRetainedConsentNoticeFiles([build.artifact],notices,{siteId:notice.siteId}));assert.equal(reads,0);
});
