// @requirements REQ-BR-COOKIE-UI REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {validateSiteConfig,toPublicConfig,mountControls,normalizeConsentNotice} from 'notabenda';
import {compileLegalDocuments,createConsentNotice,compileConsentRuntimeConfig,canonicalJson,sha256} from 'notabenda/content';
import {createConsentRuntime} from 'notabenda/consent';
import {normalizeConsentInformation} from '../dist/consent-information.js';
import {createSetupPlan} from 'notabenda/setup';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead,createConsentEvidenceStore,createAdminWorker} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
const information={rights:{label:'Your privacy rights',url:'/privacy#rights'},browserControls:{title:'Browser storage controls',description:'Use your browser’s site-data settings. Blocking cookies does not stop every tracker; use these purpose controls to stop the declared services.',links:[{label:'Browser help',url:'https://browser.example.test/help'}]}};
async function config(){
 const c=await fixture({reviewed:true});c.consent={purposes:[...new Set(c.services.flatMap(s=>s.purposeIds))].map(id=>({id,scope:'one'})),services:c.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:90,dismissalMinutes:30,information:structuredClone(information)};return c;
}
const env=()=>({storage:{getItem:()=>null,setItem(){},removeItem(){}},now:()=>Date.parse('2026-10-19T12:00:00Z')});
const release=c=>{const build=compileLegalDocuments(c);return {build,notice:createConsentNotice(build.artifact,{scopeId:'cookie-choices'})};};
const rehash=n=>{const {noticeId:_,...descriptor}=n;return {...n,noticeId:sha256(canonicalJson(descriptor))};};

test('information is explicit, public-only, bounded and stable across config/runtime/notice projections',async()=>{
 const c=await config();c.private={secret:'PRIVATE-REPORT'};assert.equal(validateSiteConfig(c).valid,true);
 const compiled=compileConsentRuntimeConfig(c,{evidence:'local'}),{notice}=release(c);
 for(const value of [toPublicConfig(c).consent.information,compiled.inventory.consent.information,notice.information]){assert.deepEqual(value,information);assert.doesNotMatch(JSON.stringify(value),/PRIVATE-REPORT/u);}
 const out=normalizeConsentInformation({browserControls:{links:information.browserControls.links,description:information.browserControls.description,title:information.browserControls.title},rights:{url:information.rights.url,label:information.rights.label}});assert.equal(JSON.stringify(out),JSON.stringify(information));
 delete c.consent.information;c.jurisdictions=['BR'];assert.equal(createConsentRuntime(compileConsentRuntimeConfig(c,{evidence:'local'}),env()).getConfig().consent.information,undefined);
});

test('malformed, private, unsafe and oversized information fails in both input paths',async()=>{
 const c=await config(),bad=[{},null,[],{rights:{label:'',url:'/rights'}},{rights:{label:'Rights',url:'javascript:alert(1)'}},{rights:{label:'Rights',url:'//elsewhere.test'}},{rights:{label:'Rights',url:'https://user:pass@example.test'}},{rights:{label:'Rights',url:'/a%0ab'}},{rights:{label:'Rights',url:'/a\\b'}},{rights:{label:'Rights',url:'/rights',private:'PRIVATE-MARKER'}},{...information,notes:'PRIVATE-MARKER'},{browserControls:{title:'Help',description:'Text',links:Array(5).fill(information.rights)}},{browserControls:{title:'Help',description:'x'.repeat(2001),links:[]}},{rights:{label:'\u0000',url:'/rights'}},{browserControls:{title:'Help',description:'界'.repeat(1500),links:[]}}];
 for(const value of bad){const input=structuredClone(c);input.consent.information=value;const result=validateSiteConfig(input);assert.equal(result.valid,false);assert.ok(result.diagnostics.some(d=>d.code==='invalid-consent-information'));assert.doesNotMatch(JSON.stringify(result.diagnostics),/PRIVATE-MARKER/u);const compiled=compileConsentRuntimeConfig(c,{evidence:'local'});compiled.inventory.consent.information=value;assert.throws(()=>createConsentRuntime(compiled,env()));}
});

test('each information field can be supplied independently, without inherited data or invented defaults',async()=>{
 const c=await config();
 for(const value of [{rights:{label:'Contact',url:'mailto:privacy@example.test'}},{browserControls:{title:'Browser settings',description:'Open site-data settings and review the actual browser options.',links:[]}}]){
  c.consent.information=value;assert.equal(validateSiteConfig(c).valid,true);assert.deepEqual(compileConsentRuntimeConfig(c,{evidence:'local'}).inventory.consent.information,value);
 }
 for(const value of [Object.create({rights:information.rights}),{rights:Object.create(information.rights)},{browserControls:Object.create(information.browserControls)}])assert.throws(()=>normalizeConsentInformation(value));
});

test('sparse arrays, accessors and inherited optional siblings reject without executing getters',()=>{
 const bad=[{...information,browserControls:{...information.browserControls,links:Array(1)}},Object.assign(Object.create({browserControls:information.browserControls}),{rights:information.rights})];
 let reads=0;
 const changing={label:'Rights',get url(){reads++;return reads<3?'/rights':'javascript:alert(1)';}};
 bad.push({rights:changing},{get rights(){reads++;return information.rights;}});
 const links=[information.rights];Object.defineProperty(links,'0',{get(){reads++;return information.rights;},enumerable:true});bad.push({browserControls:{...information.browserControls,links}});
 for(const value of bad)assert.throws(()=>normalizeConsentInformation(value));
 assert.equal(reads,0);
});

for(const [name,create] of consentProfiles){
 test(`${name}: rights and collapsed browser help leave choices unchanged and render host copy as text`,async()=>{
  const c=await config();c.consent.information.rights.label='<img src=x onerror=alert(1)>';const consent=create(c,env()),dom=new JSDOM('<div id="controls"></div>');
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const ui=mountControls(dom.window.document.querySelector('#controls'),{consent}),document=dom.window.document;
  try{
   const first=document.querySelector('.nb-consent-notice [data-nb-information="rights"]');assert.equal(first.textContent,c.consent.information.rights.label);assert.equal(first.getAttribute('href'),'/privacy#rights');assert.equal(document.querySelectorAll('img').length,0);
   consent.openPreferences();const help=document.querySelector('.nb-consent-help');assert.equal(help.open,false);assert.equal(help.querySelector('a').getAttribute('href'),information.browserControls.links[0].url);assert.equal(document.querySelectorAll('input[type="checkbox"]:checked').length,0);
   help.querySelector('summary').click();assert.equal(help.open,true);assert.equal(consent.isAllowed(c.consent.purposes[0].id),false);consent.closePreferences();assert.equal(consent.getSnapshot().purposes[c.consent.purposes[0].id],'unknown');
  }finally{ui.destroy();consent.destroy();dom.window.close();}
 });
 test(`${name}: receipt-bound information cannot differ from its configured release`,async()=>{
  const c=await config(),{notice}=release(c);let reads=0;
  for(const changed of [{...notice,information:{rights:{label:'Other',url:'/other'}}},(()=>{const n=structuredClone(notice);delete n.information;return n;})()])assert.throws(()=>create(c,env(),{evidence:{notice:changed,streamRef:'a'.repeat(64),read:async()=>{reads++;return null;},write:async()=>null}}),/information/u);
  assert.equal(reads,0);
 });
}

test('information edits produce a new notice without silently changing material permission scope',async()=>{
 const c=await config(),a=release(c);c.consent.information.rights.label='Manage your rights';const b=release(c);assert.notEqual(a.notice.noticeId,b.notice.noticeId);assert.notEqual(a.build.manifest.artifactId,b.build.manifest.artifactId);assert.equal(a.notice.scopeDigest,b.notice.scopeDigest);
});

test('standalone backend rejects rehashed information forgery and retains inspectable original copy',async()=>{
 const c=await config(),{build,notice}=release(c),storage=createSyntheticStorage([]),context={siteId:c.site.id,scopeId:'cookie-choices',streamId:'example-session',now:()=>new Date('2026-10-19T12:00:00Z')};
 await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);
 for(const change of [undefined,{rights:{label:'Changed',url:'/other'}},{browserControls:{...information.browserControls,description:'Changed'}},{rights:{label:'Unsafe',url:'javascript:alert(1)'}}]){
  const altered=structuredClone(notice);if(change===undefined)delete altered.information;else altered.information=change;
  await assert.rejects(registerConsentNotice(storage,rehash(altered),context));
 }
 await setActiveConsentNotice(storage,notice.noticeId,context);
 const result=await recordConsentChoice(storage,{schemaVersion:1,noticeId:notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:'revoke-all',choices:Object.fromEntries(Object.keys(notice.scopes).map(id=>[id,false])),clientAt:'2026-10-19T12:00:00.000Z'},context);
 const record=await createConsentEvidenceStore(storage,context).get(result.receipt.id);assert.equal(canonicalJson(record.data.notice.information),canonicalJson(information));
 const admin=createAdminWorker({basePath:'/admin',authorize:request=>request.headers.get('X-Test-Host')==='allowed'?{store:createConsentEvidenceStore(storage,context)}:null});
 const url='https://example.test/admin/record?id='+result.receipt.id;assert.equal((await admin.fetch(new Request(url))).status,403);
 const response=await admin.fetch(new Request(url,{headers:{'X-Test-Host':'allowed'}}));assert.equal(response.status,200);const document=new JSDOM(await response.text()).window.document;assert.match(document.body.textContent,/Additional notice information/u);assert.ok(document.body.textContent.includes(information.browserControls.description));assert.ok(document.body.textContent.includes(information.rights.url));
 assert.equal((await getConsentHead(storage,context)).revision,1);
 const invalid=structuredClone(notice);invalid.information={...information,private:'not-public'};assert.throws(()=>normalizeConsentNotice(invalid));
});

test('Brazil setup advises fields and requirements without enabling them or inventing a legal basis',async()=>{
 const c=await config();delete c.consent.information;const plan=createSetupPlan({schemaVersion:1,markets:['BR'],answers:{}},{config:c}),recommendation=plan.report.recommendations.find(r=>r.id==='brazil-cookie-information');
 assert.deepEqual(recommendation.configPaths,['consent.information.rights','consent.information.browserControls']);assert.ok(recommendation.requirementIds.includes('REQ-BR-COOKIE-BROWSER-HELP'));assert.equal(plan.config.consent.information,undefined);assert.deepEqual(plan.config.purposes,c.purposes);
});
