// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-BUNDLE-BUDGET
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createConsent,toPublicConfig} from '@notabenda/core';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {createConsentRuntime} from '@notabenda/core/consent';
import {consentScopes} from '../dist/consent-notice.js';

// Captured with the preceding implementation. The serialized scopes and local
// choice are a compatibility contract, rather than a second copy of its algorithm.
const fixture=JSON.parse(await readFile(new URL('./fixtures/consent-scope-v1.json',import.meta.url),'utf8'));
const profiles=[['compatibility',input=>createConsent(input.config,input.env)],['compiled',input=>createConsentRuntime(compileConsentRuntimeConfig(input.config,{mode:'preview',evidence:'local'}),input.env)]];
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

test('scope bytes retain the preceding encoding with overlapping, repeated and unmanaged associations',()=>{
 const config=freeze(toPublicConfig(fixture.config)),scopes=consentScopes(config);
 assert.deepEqual(scopes,fixture.scopes);
 assert.deepEqual(Object.keys(scopes),['p1','p0']);
 assert.deepEqual(JSON.parse(scopes.p0).services.map(s=>s.service.id),['a-first','z-last']);
 assert.deepEqual(JSON.parse(scopes.p1).services.map(s=>s.service.id),['constructor','m-middle','z-last']);
 assert.equal(JSON.parse(scopes.p0).localization.disclosureRevision,'fr-disclosure-1');
 assert.equal(JSON.parse(scopes.p1).scopeGuard.facts.sensitiveData,'unknown');
 // Inventory/declaration order is not material; purpose order still controls the output order.
 const reordered=structuredClone(fixture.config);
 reordered.services.reverse();reordered.purposes.reverse();reordered.consent.services.reverse();
 assert.deepEqual(consentScopes(toPublicConfig(reordered)),fixture.scopes);
});

for(const [profile,create] of profiles){
 test(profile+': a preceding saved grant remains usable without a storage rewrite and withdrawal still stops it',async()=>{
  let saved=fixture.saved,writes=0,starts=0,stops=0;
  const config=structuredClone(fixture.config),key='notabenda:choices:v1:'+config.site.id;
  const env={now:()=>fixture.instant,storage:{getItem:k=>k===key?saved:null,setItem(k,v){assert.equal(k,key);writes++;saved=v;},removeItem(){}},schedule:()=>()=>{},globalPrivacyControl:()=>false};
  const controller=create({config,env});
  try{
   assert.deepEqual(consentScopes(controller.getConfig()),fixture.scopes);
   assert.equal(controller.isAllowed('p0'),true);assert.equal(controller.isAllowed('p1'),false);
   assert.equal(controller.getSnapshot().purposes.p1,'denied');
   assert.equal(writes,0);assert.equal(saved,fixture.saved);
   controller.registerService('a-first',{purposes:['p0'],start(){starts++;return ()=>{stops++;};}});
   await controller.settled();assert.equal(starts,1);
   controller.rejectAll();assert.equal(controller.isAllowed('p0'),false);
   await controller.settled();assert.equal(stops,1);assert.equal(starts,1);assert.equal(writes,1);
  }finally{controller.destroy();await controller.settled();}
 });

 test(profile+': unmanaged edits preserve a grant while a changed managed service invalidates only its purpose',()=>{
  for(const material of [false,true]){
   const config=structuredClone(fixture.config);
   config.services.find(s=>s.id===(material?'a-first':'not-managed')).provider='Changed provider';
   let writes=0;
   const env={now:()=>fixture.instant,storage:{getItem:k=>k==='notabenda:choices:v1:'+config.site.id?fixture.saved:null,setItem(){writes++;},removeItem(){}},schedule:()=>()=>{},globalPrivacyControl:()=>false};
   const controller=create({config,env});
   try{
    assert.equal(controller.isAllowed('p0'),!material);
    assert.equal(controller.getSnapshot().purposes.p0,material?'unknown':'granted');
    assert.equal(controller.getSnapshot().purposes.p1,'denied');
    assert.equal(consentScopes(controller.getConfig()).p1,fixture.scopes.p1);
    assert.equal(writes,0);
   }finally{controller.destroy();}
  }
 });
}
