// @requirements REQ-FR-SCOPE REQ-DE-DEVICE REQ-IE-DEVICE REQ-PRODUCT-CONSENT-RUNTIME
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSiteConfig} from '@notabenda/core';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';

async function setup(country){
 const config=await fixture({reviewed:true}),purpose=config.purposes[0];config.jurisdictions=[country];
 config.purposes=[['measurement','Audience measurement'],['advertising','Personalized advertising']].map(([id,name])=>({...structuredClone(purpose),id,name,description:'Synthetic '+name.toLowerCase()+'.',legalBasis:'Operator-supplied processing basis; device permission is assessed separately.'}));
 config.services=config.purposes.map(p=>({id:p.id+'-service',name:p.name,provider:'Example first-party service',purposeIds:[p.id],location:'This browser',resourceOrigins:['self']}));
 config.storage=config.services.map((s,i)=>({id:s.id+'-marker',name:s.id+'-marker',type:i===0?'cookie':'localStorage',serviceId:s.id,duration:'30 days',classification:'optional'}));
 config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:10};
 const values=new Map(),effects=new Map(),events=[],environment={now:()=>Date.parse('2026-10-19T12:00:00Z'),storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}};
 return {config,environment,values,effects,events,register(controller,id){const service=config.services.find(s=>s.id===id);return controller.registerService(id,{purposes:service.purposeIds,start({signal}){events.push('start:'+id);effects.set(id,'marker');return ()=>{assert.equal(signal.aborted,true);effects.delete(id);events.push('stop:'+id);};}});}};
}
for(const [profile,create] of consentProfiles){
 test(`${profile}: FR additional purposes require their own new choice while unrelated grants remain scoped`,async()=>{
  const f=await setup('FR'),first=structuredClone(f.config);first.purposes=first.purposes.slice(0,1);first.services=first.services.slice(0,1);first.storage=first.storage.slice(0,1);first.consent.purposes=first.consent.purposes.slice(0,1);first.consent.services=first.consent.services.slice(0,1);
  let c=create(first,f.environment);c.acceptAll();c.destroy();c=create(f.config,f.environment);f.register(c,'measurement-service');f.register(c,'advertising-service');await c.settled();
  assert.equal(c.isAllowed('measurement'),true);assert.equal(c.isAllowed('advertising'),false);assert.equal(c.getSnapshot().shouldPrompt,true);assert.deepEqual(f.events,['start:measurement-service']);
  c.openPreferences();c.closePreferences();c.dismiss();await c.settled();assert.equal(c.isServiceAllowed('advertising-service'),false);assert.equal(f.effects.has('advertising-service'),false);
  c.choose({measurement:true,advertising:true});await c.settled();assert.equal(c.isServiceAllowed('advertising-service'),true);assert.equal(f.effects.has('advertising-service'),true);c.destroy();await c.settled();assert.equal(f.effects.size,0);
 });
 test(`${profile}: FR presentation changes preserve choices; changed purpose facts invalidate grants but preserve refusals`,async()=>{
  const f=await setup('FR');let c=create(f.config,f.environment);c.choose({measurement:true,advertising:false});c.destroy();const changed=structuredClone(f.config);changed.site.name='A new visual identity';changed.documents.cookies.version='new-layout';changed.documents.terms.version='new-layout';
  c=create(changed,f.environment);assert.equal(c.isAllowed('measurement'),true);assert.equal(c.getSnapshot().purposes.advertising,'denied');c.destroy();changed.purposes[0].description='Measurement now links visits to an account.';changed.purposes[1].description='A changed advertising purpose.';
  c=create(changed,f.environment);f.register(c,'measurement-service');f.register(c,'advertising-service');await c.settled();assert.equal(c.isAllowed('measurement'),false);assert.equal(c.getSnapshot().purposes.measurement,'unknown');assert.equal(c.getSnapshot().purposes.advertising,'denied');assert.deepEqual(f.events,[]);c.destroy();
 });
 test(`${profile}: DE storage labels do not bypass optional service permission or admit an unscoped advertising lifecycle`,async()=>{
  const f=await setup('DE');f.config.storage[1].classification='necessary';f.config.storage[1].necessityReason='An operator assertion for this negative test; not a legal qualification.';
  let c=create(f.config,f.environment);f.register(c,'advertising-service');await c.settled();assert.equal(c.isServiceAllowed('advertising-service'),false);assert.deepEqual(f.events,[]);c.choose({measurement:true,advertising:false});await c.settled();assert.equal(f.effects.size,0);c.destroy();
  f.config.consent.services=f.config.consent.services.slice(0,1);f.config.consent.purposes=f.config.consent.purposes.slice(0,1);c=create(f.config,f.environment);assert.throws(()=>f.register(c,'advertising-service'),/consent-managed service/u);c.acceptAll();await c.settled();assert.equal(c.isServiceAllowed('advertising-service'),false);assert.deepEqual(f.events,[]);c.destroy();
 });
 test(`${profile}: DE and IE necessary-storage declarations require an explanation linked to the declared jurisdiction`,async()=>{
  for(const country of ['DE','IE']){const f=await setup(country);f.config.storage[0].classification='necessary';
   const result=validateSiteConfig(f.config),diagnostic=result.diagnostics.find(d=>d.path==='storage[0].necessityReason');assert.ok(diagnostic);assert.ok(diagnostic.requirementIds.includes('REQ-'+country+'-DEVICE'));assert.match(diagnostic.message,/requested service|transmission/u);assert.throws(()=>create(f.config,f.environment));
  }
 });
 test(`${profile}: IE first-party measurement stays inert through dismissal and opening/closing preferences until an affirmative choice`,async()=>{
  const f=await setup('IE'),c=create(f.config,f.environment);f.register(c,'measurement-service');await c.settled();assert.deepEqual(f.events,[]);c.dismiss();c.openPreferences();c.closePreferences();await c.settled();assert.equal(c.isAllowed('measurement'),false);assert.equal(f.effects.size,0);
  c.choose({measurement:true,advertising:false});await c.settled();assert.equal(f.effects.has('measurement-service'),true);assert.equal(c.isAllowed('advertising'),false);c.rejectAll();await c.settled();assert.equal(f.effects.size,0);assert.deepEqual(f.events,['start:measurement-service','stop:measurement-service']);c.destroy();
 });
 test(`${profile}: IE a multipurpose tracker needs every declared purpose and stops immediately when one is withdrawn`,async()=>{
  const f=await setup('IE');f.config.services[0].purposeIds=['measurement','advertising'];const c=create(f.config,f.environment);f.register(c,'measurement-service');c.choose({measurement:true,advertising:false});await c.settled();assert.deepEqual(f.events,[]);
  c.choose({measurement:true,advertising:true});await c.settled();assert.equal(f.effects.has('measurement-service'),true);c.choose({measurement:true,advertising:false});assert.equal(c.isServiceAllowed('measurement-service'),false);await c.settled();assert.equal(f.effects.size,0);assert.equal(c.isAllowed('measurement'),true);c.destroy();
 });
}

test('an Irish English language tag does not infer Irish device-access applicability',async()=>{
 const f=await setup('IE');f.config.jurisdictions=[];f.config.site.locale='en-IE';f.config.storage[0].classification='necessary';const diagnostic=validateSiteConfig(f.config).diagnostics.find(d=>d.path==='storage[0].necessityReason');assert.ok(diagnostic);assert.ok(!diagnostic.requirementIds.includes('REQ-IE-DEVICE'));assert.ok(!diagnostic.requirementIds.includes('REQ-DE-DEVICE'));
});
