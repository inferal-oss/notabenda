// @requirements REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-PROCESSING-CHOICES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConsent} from '@notabenda/core';
import {createConsentRuntime} from '@notabenda/core/consent';
import {compileLegalDocuments,createProcessingNotice} from '@notabenda/core/content';
import {performanceInventories} from '../../../scripts/performance-inventories.mjs';
import {measureConsent,summarize} from '../../../scripts/consent-performance.mjs';
const data=await performanceInventories();
const profiles=[['compatibility',createConsent,d=>d.config],['compiled-local',createConsentRuntime,d=>d.compiled]];
const environment=()=>{const values=new Map();let at=Date.parse('2026-10-19T12:00:00Z'),signal=false;return {values,env:{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>at,schedule:()=>()=>{},globalPrivacyControl:()=>signal},advance:ms=>{at+=ms;},signal:value=>{signal=value;}};};

for(const [name,create,input] of profiles){
 test(name+': large snapshot shares one processing snapshot and never caches permission across queries',async()=>{
  const d=data.at(-1),f=environment(),notice=createProcessingNotice(compileLegalDocuments(d.config,{mode:'preview'}).artifact,{scopeId:'performance',activities:['sale','sharing','targeted-advertising'],wording:{title:'Synthetic opt-out',description:'Synthetic test only',actionLabel:'Opt out'}},{mode:'preview'});
  let reads=0,blocked=[];
  const processing={getNotice:()=>structuredClone(notice),getSnapshot(){reads++;return {siteId:d.config.site.id,scopeId:notice.scopeId,streamRef:'1'.repeat(64),noticeId:notice.noticeId,status:'ready',restrictedActivities:[...blocked],blockedActivities:[...blocked],pending:0,revision:0,needsConfirmation:false,persistence:'available',destroyed:false};},refreshLocal(){},subscribe(){return ()=>{};}};
  const controller=create(input(d),f.env,{processingChoices:processing});
  try{
   controller.acceptAll();reads=0;const first=controller.getSnapshot();assert.equal(reads,1);
   assert.equal(Object.values(first.servicePermissions).filter(Boolean).length,80);
   blocked=['sale'];const restricted=controller.getSnapshot();assert.equal(Object.values(restricted.servicePermissions).filter(Boolean).length,40);
   // Public snapshots and config clones cannot poison indexed private inventory.
   restricted.processingChoices.blockedActivities.length=0;restricted.privacySignals.restrictedServices.s0=['sale'];restricted.permissions.p0=false;
   const config=controller.getConfig();config.services[0].id='changed';config.services[0].purposeIds.length=0;
   assert.equal(controller.getSnapshot().servicePermissions.s0,false);assert.equal(controller.getSnapshot().servicePermissions.s1,true);
   blocked=[];assert.equal(controller.getSnapshot().servicePermissions.s0,true);
   let starts=0,stops=0;controller.registerService('s0',{purposes:['p0'],start(){starts++;return ()=>{stops++;};}});
   blocked=['sale'];await controller.settled();assert.equal(starts,0,'queued starts recheck current restrictions');
   blocked=[];controller.refresh();await controller.settled();assert.equal(starts,1);
   blocked=['sale'];controller.refresh();await controller.settled();assert.equal(stops,1);
   blocked=[];
   f.signal(true);controller.refresh();const gpc=controller.getSnapshot();assert.equal(Object.keys(gpc.privacySignals.restrictedServices).length,40);assert.equal(gpc.servicePermissions.s0,false);
   gpc.privacySignals.restrictedActivities.length=0;delete gpc.privacySignals.restrictedServices.s0;
   assert.equal(controller.getSnapshot().servicePermissions.s0,false);
   f.advance(86400001);assert.equal(Object.values(controller.getSnapshot().servicePermissions).some(Boolean),false);
   controller.acceptAll();assert.equal(controller.getSnapshot().servicePermissions.s1,true);controller.rejectAll();assert.equal(Object.values(controller.getSnapshot().servicePermissions).some(Boolean),false);
  }finally{controller.destroy();await controller.settled();}
 });
 test(name+': measurement fixtures exercise complete lifecycles and report finite samples without timing gates',async()=>{
  const d=data[0],result=await measureConsent({create,input:input(d),inventory:d.config,samples:3,warmup:1,batch:2});
  assert.equal(result.lifecycle.starts,result.lifecycle.stops);assert.ok(result.lifecycle.starts>4);
  assert.equal(result.phases.returningConstructor.count,3);
  for(const phase of Object.values(result.phases)){assert.equal(phase.count,3);assert.ok(phase.samples.every(Number.isFinite));assert.ok(phase.p95>=phase.median);}
 });
 test(name+': returning-constructor measurements restore real saved choices and reject failed recovery',async()=>{
  const d=data[0],key='notabenda:choices:v1:'+d.config.site.id;let restores=0;
  const observe=(input,env)=>{const returning=env.storage.getItem(key)!==null,c=create(input,env);if(returning){restores++;assert.equal(c.isAllowed('p0'),true);}return c;};
  const result=await measureConsent({create:observe,input:input(d),inventory:d.config,samples:3,warmup:1});
  assert.equal(restores,4);assert.equal(result.phases.returningConstructor.count,3);
  const broken=(input,env)=>{const returning=env.storage.getItem(key)!==null,c=create(input,env);if(returning)c.rejectAll();return c;};
  await assert.rejects(measureConsent({create:broken,input:input(d),inventory:d.config,samples:2,warmup:0}),/returning choice changed or did not restore/);
  const rewriting=(input,env)=>{const saved=env.storage.getItem(key),c=create(input,env);if(saved!==null)env.storage.setItem(key,saved);return c;};
  await assert.rejects(measureConsent({create:rewriting,input:input(d),inventory:d.config,samples:2,warmup:0}),/returning choice changed or did not restore/);
 });
}
test('measurement input bounds reject before constructing a controller',async()=>{
 let calls=0;for(const options of [{samples:0},{samples:Infinity},{warmup:-1},{batch:0}])await assert.rejects(measureConsent({create(){calls++;},...options}),/bounded benchmark/);
 assert.equal(calls,0);assert.throws(()=>summarize([]));assert.throws(()=>summarize([NaN]));
});
