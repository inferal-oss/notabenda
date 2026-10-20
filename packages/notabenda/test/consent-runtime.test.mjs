// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compileConsentRuntimeConfig,compileLegalDocuments,createConsentNotice} from '@notabenda/core/content';
import {createConsentRuntime,mountControls} from '@notabenda/core/consent';
import {requiredConsentEvidence,ConsentEvidenceError} from '@notabenda/core/consent/evidence';
import {createConsent,toPublicConfig} from '@notabenda/core';
import {consentScopes} from '../dist/consent-notice.js';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
const instant=Date.parse('2026-10-18T12:00:00Z');
async function setup(){
 const config=await fixture({reviewed:true});config.storage=[];config.services=config.purposes.map((p,i)=>({id:'service-'+i,name:'Optional service '+i,provider:'Sample',purposeIds:[p.id],location:'This browser',processingActivities:i===0?['sale']:[]}));
 config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:10,promptPolicy:{profile:'it-garante-2021',processingRevision:'processing-one'}};
 const values=new Map(),key='notabenda:choices:v1:'+config.site.id;
 const environment={now:()=>instant,storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}};
 const notice=createConsentNotice(compileLegalDocuments(config).artifact,{scopeId:'cookie-choices'});
 return {config,values,key,environment,notice,options:{notice,streamRef:'a'.repeat(64),read:()=>new Promise(()=>{}),write:async()=>{throw Error('offline');}}};
}
function reverseKeys(v){return Array.isArray(v)?v.map(reverseKeys):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reverseKeys(x)])):v;}

test('compilation validates the entire site, requires explicit evidence mode and omits unrelated/private authoring',async()=>{
 const f=await setup();f.config.private={secret:'private-sentinel'};f.config.documents.terms.sections[0].paragraphs=['UNRELATED terms body'];
 assert.throws(()=>compileConsentRuntimeConfig(f.config));assert.throws(()=>compileConsentRuntimeConfig(f.config,{}));assert.throws(()=>compileConsentRuntimeConfig(f.config,{evidence:'best-effort'}));
 const runtime=compileConsentRuntimeConfig(f.config,{evidence:'local'});assert.equal(runtime.mode,'production');assert.equal(runtime.evidence,'local');assert.deepEqual(Object.keys(runtime.inventory.documents),['privacy','cookies']);assert.doesNotMatch(JSON.stringify(runtime),/private-sentinel|UNRELATED|sections|controller|rightsCenter/);
 for(const mutate of [c=>{c.controller.email='invalid';},c=>{c.documents.terms.sections=[];},c=>{c.documents.terms.review.status='draft';}]){const c=structuredClone(f.config);mutate(c);assert.throws(()=>compileConsentRuntimeConfig(c,{evidence:'local'}));}
 const draft=structuredClone(f.config);draft.documents.cookies.review.status='draft';assert.throws(()=>compileConsentRuntimeConfig(draft,{evidence:'local'}));assert.equal(compileConsentRuntimeConfig(draft,{evidence:'local',mode:'preview'}).mode,'preview');
});

test('incoming JSON order cannot change exact material scope strings; runtime getter is isolated and deliberately smaller',async()=>{
 const f=await setup();f.config.scopeGuards={version:1,revision:'scope-one',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 const descriptor=compileConsentRuntimeConfig(f.config,{evidence:'local'}),c=createConsentRuntime(reverseKeys(descriptor),f.environment),legacy=createConsent(f.config,f.environment);
 assert.deepEqual(consentScopes(c.getConfig()),consentScopes(toPublicConfig(f.config)));assert.deepEqual(c.getSnapshot(),legacy.getSnapshot());
 c.acceptAll();const written=f.values.get(f.key);legacy.refresh();assert.equal(legacy.isAllowed(f.config.purposes[0].id),true);legacy.acceptAll();assert.equal(f.values.get(f.key),written);
 assert.equal(c.getConfig().controller,undefined);const copy=c.getConfig();copy.purposes[0].description='MUTATED';copy.consent.services=[];assert.notEqual(c.getConfig().purposes[0].description,'MUTATED');
 descriptor.inventory.services=[];assert.notDeepEqual(c.getConfig().services,[]);c.destroy();legacy.destroy();
});

test('malformed runtime descriptors fail synchronously before storage, signal, scheduling or transport',async()=>{
 const f=await setup(),valid=compileConsentRuntimeConfig(f.config,{evidence:'local'});let touches=0;
 const trap={storage:{getItem(){touches++;throw Error();}},globalPrivacyControl(){touches++;},now(){touches++;return instant;},schedule(){touches++;return ()=>{};}};
 const variants=[undefined,null,{},'{bad'];
 for(const mutate of [
  c=>{c.schemaVersion=2;},c=>{delete c.evidence;},c=>{c.evidence='best-effort';},c=>{c.inventory.private={secret:1};},c=>{c.inventory.documents.privacy.sections=[];},
  c=>{c.inventory.site.url='javascript:alert(1)';},c=>{c.inventory.documents.cookies.route='//outside.test';},c=>{c.inventory.documents.cookies.route=c.inventory.documents.privacy.route.toUpperCase();},c=>{c.inventory.documents.cookies.effectiveDate='2026-02-30';},c=>{c.inventory.documents.cookies.review.status='draft';},
  c=>{c.inventory.purposes[0].description='a'.repeat(4097);},c=>{c.inventory.purposes[0].dataCategories=[];},c=>{c.inventory.purposes.push(c.inventory.purposes[0]);},
  c=>{c.inventory.services[0].purposeIds=['missing'];},c=>{c.inventory.services[0].privacyUrl='javascript:alert(1)';},c=>{c.inventory.services[0].resourceOrigins=['https://outside.test/path'];},c=>{c.inventory.services[0].processingActivities=['other'];},
  c=>{c.inventory.services[0].googleBasic={version:1};},c=>{c.inventory.consent.services=[];},c=>{c.inventory.consent.purposes[0].scope='';},c=>{c.inventory.consent.grantLifetimeDays=731;},c=>{c.inventory.consent.dismissalMinutes=-1;},
  c=>{c.inventory.scopeGuards={version:2};},c=>{c.inventory.privacySignals={globalPrivacyControl:{appliesTo:['sale'],explanation:'Restriction'}};delete c.inventory.services[0].processingActivities;},c=>{c.inventory.consent.promptPolicy.processingRevision='';},
  c=>{c.inventory.storage=[{id:'optional',name:'Optional',type:'localStorage',serviceId:'missing',duration:'1 day',classification:'optional'}];},c=>{c.inventory.site.description='x'.repeat(262144);},
 ]){const d=structuredClone(valid);mutate(d);variants.push(d);}
 for(const d of variants)assert.throws(()=>createConsentRuntime(d,trap));assert.equal(touches,0);
});

test('required mode rejects missing, forged and serialized adapters before capabilities; local mode rejects accidental adapters',async()=>{
 const f=await setup(),required=compileConsentRuntimeConfig(f.config,{evidence:'required'}),local=compileConsentRuntimeConfig(f.config,{evidence:'local'});let touches=0;
 const env={storage:{getItem(){touches++;return null;}},now(){touches++;return instant;}},adapter=requiredConsentEvidence(f.options);
 for(const evidence of [undefined,{},()=>{},JSON.parse(JSON.stringify(adapter))])assert.throws(()=>createConsentRuntime(required,env,{evidence}),/adapter/);
 for(const evidence of [{},adapter])assert.throws(()=>createConsentRuntime(local,env,{evidence}),/Local consent/);assert.equal(touches,0);
 const c=createConsentRuntime(required,f.environment,{evidence:adapter});assert.equal(c.getSnapshot().evidence.status,'checking');assert.equal(c.isAllowed(f.config.purposes[0].id),false);c.destroy();
});

for(const [profile,controller] of consentProfiles){
 test(`${profile}: required choice provenance survives failed preparation, unavailable randomness, errors and retirement`,async()=>{
  for(const state of ['checking','uuid','unavailable','retired']){
   const f=await setup();const options={...f.options,...(state==='checking'?{}:{read:state==='unavailable'?async()=>{throw Error('offline');}:state==='retired'?async()=>{throw new ConsentEvidenceError('context-retired');}:async()=>({schemaVersion:1,siteId:f.config.site.id,scopeId:f.notice.scopeId,streamRef:f.options.streamRef,revision:0,event:null})})};
   const c=controller(f.config,f.environment,{evidence:options});if(state!=='checking')await c.settled();
   const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');try{if(state==='uuid')Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});c.acceptAll();}finally{if(state==='uuid')Object.defineProperty(globalThis,'crypto',descriptor);}
   const raw=f.values.get(f.key),saved=JSON.parse(raw);assert.equal(saved.authorizationMode,'required');assert.equal(saved.evidence,undefined);assert.equal(c.isAllowed(f.config.purposes[0].id),false);c.destroy();
   const local=controller(f.config,f.environment);assert.equal(local.isAllowed(f.config.purposes[0].id),false);assert.equal(local.getSnapshot().purposes[f.config.purposes[0].id],'unknown');assert.equal(f.values.get(f.key),raw);local.acceptAll();assert.equal(local.isAllowed(f.config.purposes[0].id),true);assert.equal(JSON.parse(f.values.get(f.key)).authorizationMode,'local');local.destroy();
  }
 });
 test(`${profile}: markerless, required and malformed authority drops only positives, keeps prompt memory and stops running work on refresh`,async()=>{
  const f=await setup(),c=controller(f.config,f.environment);c.acceptAll();let stopped=0;
  c.registerService(f.config.services[0].id,{purposes:f.config.services[0].purposeIds,start:()=>()=>{stopped++;}});await c.settled();
  const original=JSON.parse(f.values.get(f.key));
  for(const mode of ['markerless','required','invalid','own-evidence']){
   const record=structuredClone(original);record.choices[f.config.purposes[1].id].status='withdrawn';record.choices[f.config.purposes[1].id].until=instant+180*86400000;record.promptPolicy.outcome='withheld';
   if(mode==='markerless')delete record.authorizationMode;else if(mode==='own-evidence')record.evidence=null;else record.authorizationMode=mode;
   const raw=JSON.stringify(record);f.values.set(f.key,raw);c.refresh();await c.settled();assert.equal(c.isAllowed(f.config.purposes[0].id),false);assert.equal(c.getSnapshot().purposes[f.config.purposes[0].id],'unknown');assert.equal(c.getSnapshot().purposes[f.config.purposes[1].id],'withdrawn');assert.equal(c.getSnapshot().promptDecision.allowsPrompt,false);assert.equal(f.values.get(f.key),raw);
  }
  assert.equal(stopped,1);c.acceptAll();assert.equal(c.isAllowed(f.config.purposes[0].id),true);c.destroy();
 });
}

test('new browser entries import without browser globals or build-only Node dependencies',()=>{
 const script=`for(const key of ['window','document','navigator'])Object.defineProperty(globalThis,key,{get(){throw Error(key)},configurable:true});for(const entry of ['@notabenda/core/consent','@notabenda/core/consent/evidence'])await import(entry);`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:new URL('../../../',import.meta.url),encoding:'utf8',timeout:10000});assert.equal(child.status,0,child.stderr);assert.equal(typeof mountControls,'function');
});

// @requirements REQ-PRODUCT-SCOPE-GUARDS REQ-PRODUCT-PRIVACY-SIGNALS REQ-GOOGLE-MODE REQ-IT-REPROMPT
test('compiled scope retains Google classifications, guard facts, signal restrictions and regional prompting byte for byte',async()=>{
 const f=await setup(),absent={children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'},id=f.config.purposes[0].id;
 f.config.scopeGuards={version:1,revision:'assessment-one',site:absent,purposes:[{id:f.config.purposes[1].id,facts:{sensitiveData:'present'}}]};
 f.config.privacySignals={globalPrivacyControl:{appliesTo:['sale'],explanation:'Honor this explicitly classified host policy.'}};
 Object.assign(f.config.services[0],{resourceOrigins:['https://www.googletagmanager.com'],googleBasic:{version:1,tagIds:['G-TEST1234'],signals:{analytics_storage:[id],ad_storage:[],ad_user_data:[],ad_personalization:[]}}});
 const runtime=compileConsentRuntimeConfig(f.config,{evidence:'local'}),compiled=createConsentRuntime(reverseKeys(runtime),{...f.environment,globalPrivacyControl:()=>true}),legacy=createConsent(f.config,{...f.environment,globalPrivacyControl:()=>true});
 assert.deepEqual(consentScopes(compiled.getConfig()),consentScopes(legacy.getConfig()));assert.deepEqual(compiled.getSnapshot(),legacy.getSnapshot());
 compiled.acceptAll();legacy.acceptAll();assert.deepEqual(compiled.getSnapshot(),legacy.getSnapshot());assert.equal(compiled.isAllowed(id),true);assert.equal(compiled.isServiceAllowed(f.config.services[0].id),false);assert.equal(compiled.isAllowed(f.config.purposes[1].id),false);
 compiled.rejectAll();legacy.rejectAll();assert.deepEqual(compiled.getSnapshot(),legacy.getSnapshot());assert.equal(compiled.getSnapshot().promptDecision.allowsPrompt,false);compiled.destroy();legacy.destroy();
});
