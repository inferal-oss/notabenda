// @requirements REQ-PRODUCT-CONNECTION-INSPECTION REQ-PRODUCT-CONSENT-RUNTIME
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectConsentConnection} from '@notabenda/core/consent/inspect';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
import {exampleConsentConfig} from '../../../examples/static/choices-build.mjs';
const ids=['sample-measurements','sample-suggestions'];
const descriptor=c=>compileConsentRuntimeConfig(c,{evidence:'local',mode:'preview'});
const lifecycle=c=>({purposes:c.services.find(s=>s.id===ids[0]).purposeIds,start:()=>()=>{}});

for(const [profile,factory] of consentProfiles){
 test(profile+': inspection distinguishes missing and registered-but-blocked callbacks without effects',async()=>{
  const c=exampleConsentConfig(await fixture({reviewed:true}));let reads=0,writes=0,starts=0,scheduled=0;const controller=factory(c,{storage:{getItem:()=>{reads++;return null;},setItem:()=>{writes++;},removeItem:()=>{writes++;}},schedule:()=>{scheduled++;return ()=>{};}});
  try{const expected=descriptor(c),before=[reads,writes,starts,scheduled],initial=inspectConsentConnection(controller,{expected});assert.equal(initial.configuration.comparison,'matched');assert.equal(initial.lifecycle.status,'missing-registrations');assert.deepEqual(initial.lifecycle.services.map(s=>s.registration),['missing','missing']);assert.deepEqual([reads,writes,starts,scheduled],before);
   controller.registerService(ids[0],{...lifecycle(c),start:()=>{starts++;return ()=>{};}});const counters=[reads,writes,starts,scheduled],report=inspectConsentConnection(controller,{expected});assert.equal(report.lifecycle.registered,1);assert.equal(report.lifecycle.services[0].registration,'registered');assert.equal(report.lifecycle.services[0].phase,'blocked');assert.equal(report.lifecycle.services[1].registration,'missing');assert.deepEqual([reads,writes,starts,scheduled],counters);assert.equal(report.publication.status,'not-checked');assert.equal(report.behavior.status,'not-tested');assert.equal(inspectConsentConnection(controller).configuration.comparison,'not-requested');
   const map=controller.getServiceRegistrations();map[ids[0]]='missing';delete map[ids[1]];assert.equal(controller.getServiceRegistrations()[ids[0]],'registered');assert.equal(controller.getServiceRegistrations()[ids[1]],'missing');
  }finally{controller.destroy();}
 });
 test(profile+': pending start, active, removal, cleanup failure and destruction remain distinct',async()=>{
  const c=exampleConsentConfig(await fixture({reviewed:true})),controller=factory(c,{storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},schedule:()=>()=>{}});let release;const gate=new Promise(resolve=>{release=resolve;});
  try{const remove=controller.registerService(ids[0],{...lifecycle(c),start:async()=>{await gate;return ()=>{throw Error('private teardown failure');};}});controller.registerService(ids[1],{purposes:['suggestions'],start:()=>()=>{}});controller.acceptAll();const starting=inspectConsentConnection(controller);assert.equal(starting.lifecycle.status,'transitional');assert.equal(starting.lifecycle.services[0].phase,'starting');release();await controller.settled();assert.equal(inspectConsentConnection(controller).lifecycle.status,'registered');assert.equal(inspectConsentConnection(controller).lifecycle.services[0].phase,'active');remove();assert.equal(inspectConsentConnection(controller).lifecycle.services[0].registration,'removed');await controller.settled();assert.equal(inspectConsentConnection(controller).lifecycle.services[0].phase,'reload-required');controller.destroy();assert.equal(inspectConsentConnection(controller).lifecycle.status,'controller-destroyed');assert.doesNotMatch(JSON.stringify(inspectConsentConnection(controller)),/private teardown/);
  }finally{release();controller.destroy();await controller.settled();}
 });
 test(profile+': expected consent inventory changes are visible, other packs are excluded',async()=>{
  const c=exampleConsentConfig(await fixture({reviewed:true})),controller=factory(c,{schedule:()=>()=>{}});try{for(const [section,edit] of [['site',v=>v.site.id='other-site'],['consent',v=>v.consent.services[0].scope='changed'],['documents',v=>v.documents.cookies.version='next'],['storage',v=>v.storage[0].duration='Different duration']]){const expected=descriptor(c);edit(expected.inventory);const report=inspectConsentConnection(controller,{expected});assert.equal(report.configuration.comparison,'different');assert.ok(report.configuration.differingSections.includes(section),section);}
   const other=structuredClone(c);other.terms.audience='consumer';assert.equal(inspectConsentConnection(controller,{expected:descriptor(other)}).configuration.comparison,'matched');assert.match(inspectConsentConnection(controller).limits.join(' '),/other packs/);
  }finally{controller.destroy();}
 });
}

test('inspection rejects malformed descriptors and executable options without exposing rejected values',async()=>{
 const c=exampleConsentConfig(await fixture({reviewed:true})),controller=consentProfiles[0][1](c,{schedule:()=>()=>{}});let invoked=0;try{const options={};Object.defineProperty(options,'expected',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});assert.throws(()=>inspectConsentConnection(controller,options),/No connection was inspected/);assert.equal(invoked,0);for(const options of [{unexpected:true},{expected:{...descriptor(c),extra:'PRIVATE'}},Object.create({expected:descriptor(c)})])assert.throws(()=>inspectConsentConnection(controller,options),/No connection was inspected/);assert.throws(()=>inspectConsentConnection({getConfig(){throw Error('PRIVATE');},getSnapshot(){},getServiceRegistrations(){}}),e=>!e.message.includes('PRIVATE'));}finally{controller.destroy();}
});

test('large unrelated authoring bodies and excluded accessors do not block consent-only inspection',async()=>{
 const c=exampleConsentConfig(await fixture({reviewed:true}));c.documents.terms.sections[0].paragraphs=['a'.repeat(17000)];const controller=consentProfiles[0][1](c,{schedule:()=>()=>{}});let invoked=0;try{const expected=descriptor(c);assert.equal(inspectConsentConnection(controller,{expected}).configuration.comparison,'matched');const custom={...controller,getConfig(){const config=controller.getConfig();Object.defineProperty(config,'terms',{enumerable:true,get(){invoked++;throw Error('EXCLUDED');}});Object.defineProperty(config.documents.privacy,'sections',{enumerable:true,get(){invoked++;throw Error('EXCLUDED');}});return config;}};assert.equal(inspectConsentConnection(custom,{expected}).configuration.comparison,'matched');assert.equal(invoked,0);const hostile={...controller,getConfig(){const config=controller.getConfig();Object.defineProperty(config.site,'id',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});return config;}};assert.throws(()=>inspectConsentConnection(hostile),/No connection was inspected/);assert.equal(invoked,0);}finally{controller.destroy();}
});

test('required-evidence freshness reads remain intact without writes, delivery or consent actions',async()=>{
 const {compileLegalDocuments,createConsentNotice}=await import('@notabenda/core/content'),{recordLegalRelease,registerConsentNotice,setActiveConsentNotice,getConsentHead,recordConsentChoice}=await import('@notabenda/cloudflare'),{createSyntheticStorage}=await import('../../notabenda-cf/examples/synthetic.mjs');
 const c=exampleConsentConfig(await fixture({reviewed:true})),build=compileLegalDocuments(c),notice=createConsentNotice(build.artifact,{scopeId:'connection-check'}),store=createSyntheticStorage([]),instant=Date.parse('2026-10-20T18:00:00.000Z'),context={siteId:c.site.id,scopeId:'connection-check',streamId:'isolated-inspection',now:()=>new Date(instant)};
 await recordLegalRelease(store,build.artifact);await registerConsentNotice(store,notice,context);await setActiveConsentNotice(store,notice.noticeId,context);const head=await getConsentHead(store,context),values=new Map();let reads=0,writes=0,backendReads=0,backendWrites=0;
 const controller=consentProfiles[0][1](c,{now:()=>instant,storage:{getItem:k=>{reads++;return values.get(k)??null;},setItem:(k,v)=>{writes++;values.set(k,v);},removeItem:k=>{writes++;values.delete(k);}},schedule:()=>()=>{}},{evidence:{notice,streamRef:head.streamRef,read:async()=>{backendReads++;return getConsentHead(store,context);},write:async command=>{backendWrites++;return recordConsentChoice(store,command,context);}}});
 try{await controller.refreshEvidence();controller.acceptAll();await controller.settled();assert.equal(controller.getSnapshot().permissions.measurement,true);const before={reads,writes,backendReads,backendWrites};const report=inspectConsentConnection(controller,{expected:descriptor(c)});assert.ok(reads>before.reads);assert.equal(writes,before.writes);assert.equal(backendReads,before.backendReads);assert.equal(backendWrites,before.backendWrites);assert.equal(report.configuration.comparison,'matched');assert.equal(report.behavior.status,'not-tested');}finally{controller.destroy();await controller.settled();}
});
