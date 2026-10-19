// @requirements REQ-EU-RETENTION-ERASURE
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-TERMS-ACCEPTANCE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {compileLegalDocuments,createConsentNotice,createProcessingNotice,createTermsOffer} from 'notabenda/content';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead,createConsentEvidenceStore,registerProcessingNotice,recordProcessingRestriction,getProcessingHead,createProcessingRestrictionStore,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance,createTermsAcceptanceStore,createEvidenceLifecycle,createEvidenceLifecycleStore,createDurableObjectStore,createAdminWorker} from 'notabenda-cf';
const instant='2026-10-18T12:00:00.000Z',scopeId='privacy-workflow',streamId='opaque-alder',subjectId='subject-alder';
const query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};
const decision=()=>({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:instant,legalHold:false});
const rejects=(promise,code)=>assert.rejects(promise,error=>error.code===code);
async function setup(){
 const config=await fixture({reviewed:true});config.purposes=[config.purposes[0]];config.services=[{id:'sample',name:'Sample',provider:'Fictional',location:'Local',purposeIds:config.purposes.map(p=>p.id),processingActivities:['sale']}];config.storage=[];config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:[{id:'sample',scope:'one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:10};
 const storage=createSyntheticStorage([]),build=compileLegalDocuments(config);await recordLegalRelease(storage,build.artifact);const base={siteId:config.site.id},context={...base,scopeId,streamId,subjectId,operationId:'synthetic-signup',provenance:'explicit-opt-out',now:()=>new Date(instant)};
 const consent=createConsentNotice(build.artifact,{scopeId}),processing=createProcessingNotice(build.artifact,{scopeId,activities:['sale'],wording:{title:'Processing choices',description:'Stop this fictional activity.',actionLabel:'Stop sale'}}),terms=createTermsOffer(build.artifact,{scopeId,statement:'I agree to these fictional terms.',actionLabel:'Agree'});
 await registerConsentNotice(storage,consent,base);await setActiveConsentNotice(storage,consent.noticeId,{...base,scopeId});await registerProcessingNotice(storage,processing,base);await registerTermsOffer(storage,terms,base);await setActiveTermsOffer(storage,terms.offerId,{...base,scopeId});
 const commands={consent:{schemaVersion:1,noticeId:consent.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:'accept-all',choices:Object.fromEntries(config.consent.purposes.map(p=>[p.id,true])),clientAt:instant},processing:{schemaVersion:1,noticeId:processing.noticeId,requestId:crypto.randomUUID(),activities:['sale']},terms:{schemaVersion:1,offerId:terms.offerId,requestId:crypto.randomUUID(),accepted:true}};
 const write=(family,command=commands[family],overrides={})=>({consent:recordConsentChoice,processing:recordProcessingRestriction,terms:recordTermsAcceptance}[family])(storage,command,{...context,...overrides});
 const records={};for(const family of ['consent','processing','terms']){const result=await write(family);records[family]=result.receipt??result;}
 const target=family=>({family,...base,...(family==='terms'?{subjectId}:{scopeId,streamId})});
 const lifecycle=family=>createEvidenceLifecycle(storage,target(family),{now:context.now});
 const prefix=family=>base.prefix??`notabenda/${family}/${base.siteId}/`;
 const store=family=>({consent:createConsentEvidenceStore,processing:createProcessingRestrictionStore,terms:createTermsAcceptanceStore}[family])(storage,base);
 return {config,storage,build,base,context,commands,records,target,lifecycle,prefix,write,store};
}
async function finish(controller,d,limit=2){let state;for(let i=0;i<30;i++){state=await controller.purge({requestId:d.requestId,legalHold:false,limit});if(state.phase==='complete')return state;}throw Error('Purge did not complete');}

test('retirement precedes old and new writes, including empty heads, while shared archives remain available',async()=>{
 const f=await setup();for(const family of ['consent','processing','terms']){
  const controller=await f.lifecycle(family),d=decision(),state=await controller.retire(d);assert.equal(state.phase,'purging');assert.deepEqual(await controller.retire(d),state);await rejects(controller.retire({...d,reason:'retention-expired'}),'idempotency-conflict');
  await rejects(f.write(family),'context-retired');await rejects(f.write(family,{...f.commands[family],requestId:crypto.randomUUID()}),'context-retired');
  if(family!=='terms')await rejects(({consent:getConsentHead,processing:getProcessingHead}[family])(f.storage,f.context),'context-retired');
  const complete=await finish(controller,d);assert.equal(complete.progress.deleted,1);assert.equal((await f.storage.list({prefix:f.prefix(family)+'events/',limit:100})).size,0);await rejects(f.write(family),'context-retired');
  if(family!=='terms')await rejects(({consent:getConsentHead,processing:getProcessingHead}[family])(f.storage,f.context),'context-retired');
  assert.deepEqual(await controller.purge({requestId:d.requestId,legalHold:false}),complete);assert.ok(await f.storage.get('notabenda/releases/'+f.build.artifact.manifest.artifactId));
 }
});

test('pending payloads become minimized projections without breaking list continuation or unrelated processing history',async()=>{
 const f=await setup();for(const family of ['consent','processing','terms']){
  await f.write(family,{...f.commands[family],requestId:crypto.randomUUID()},family==='terms'?{subjectId:'subject-birch'}:{streamId:'opaque-birch'});
  const controller=await f.lifecycle(family);await controller.retire(decision());const page=await f.store(family).list(query);assert.equal(page.records.length,2);const retired=page.records.find(r=>r.id===f.records[family].id);assert.equal(retired.data.kind,'retired-evidence');assert.ok(!JSON.stringify(retired).includes(subjectId));assert.equal(retired.data.purposeChoices,undefined);assert.equal(retired.data.offer,undefined);assert.equal(retired.data.notice,undefined);assert.equal(retired.data.currentHead,undefined);assert.ok(page.records.some(r=>r.data.kind!== 'retired-evidence'));
  const worker=createAdminWorker({basePath:'/workspace',authorize:()=>({store:f.store(family),allowExport:true})});const response=await worker.fetch(new Request('https://fictional.test/workspace'));assert.equal(response.status,200);const exported=await worker.fetch(new Request('https://fictional.test/workspace/export.json'));assert.equal(exported.status,200);assert.match(await exported.text(),/retired-evidence/);
 }
});

test('bounded scans count foreign records and persist their cursor; purge only exact kind/site/context under a shared prefix',async()=>{
 const f=await setup(),sharedPrefix='host/shared/';for(const family of ['consent','processing','terms'])await f.storage.put(sharedPrefix+'events/'+f.records[family].id,await f.storage.get(f.prefix(family)+'events/'+f.records[family].id));const ref=f.records.processing.streamRef;await f.storage.put(sharedPrefix+'heads/'+ref,await f.storage.get(f.prefix('processing')+'heads/'+ref));await f.storage.put(sharedPrefix+'notices/'+f.commands.processing.noticeId,await f.storage.get(f.prefix('processing')+'notices/'+f.commands.processing.noticeId));f.prefix=()=>sharedPrefix;f.lifecycle=family=>createEvidenceLifecycle(f.storage,{...f.target(family),prefix:sharedPrefix},{now:f.context.now});const controller=await f.lifecycle('consent'),d=decision();const original=await f.storage.get(sharedPrefix+'events/'+f.records.consent.id);
 for(const id of ['0'.repeat(64),'0'.repeat(63)+'1'])await f.storage.put(f.prefix('consent')+'events/'+id,{...original,id,siteId:'another-site'});
 await controller.retire(d);const first=await controller.purge({requestId:d.requestId,legalHold:false,limit:1});assert.equal(first.progress.scanned,1);assert.equal(first.progress.deleted,0);assert.equal(first.phase,'purging');await rejects(controller.purge({requestId:d.requestId,legalHold:false,limit:1,after:'f'.repeat(64)}),'invalid-decision');
 const resumed=await f.lifecycle('consent'),complete=await finish(resumed,d,1);assert.equal(complete.progress.scanned,5);assert.equal(complete.progress.deleted,1);assert.equal((await f.storage.list({prefix:f.prefix('consent')+'events/',limit:100})).size,4);assert.ok(await f.storage.get(f.prefix('processing')+'events/'+f.records.processing.id));assert.ok(await f.storage.get(f.prefix('terms')+'events/'+f.records.terms.id));const live=await getProcessingHead(f.storage,{...f.context,prefix:sharedPrefix});assert.equal(live.revision,1);assert.deepEqual(live.event.restrictions,['sale']);
});

test('holds block initial retirement and later batches, require reviewed release, and never auto-expire at review time',async()=>{
 const f=await setup(),controller=await f.lifecycle('processing'),d=decision();let state=await controller.setHold({active:true,reviewAt:'2026-10-17T12:00:00.000Z',expectedRevision:0});assert.equal(state.phase,'retained');await rejects(controller.retire(d),'legal-hold');await rejects(controller.setHold({active:false,reviewAt:null,expectedRevision:0}),'revision-conflict');
 state=await controller.setHold({active:false,reviewAt:null,expectedRevision:1});await controller.retire(d);await controller.setHold({active:true,reviewAt:'2026-11-18T12:00:00.000Z',expectedRevision:state.hold.revision});const before=await controller.getState();await rejects(controller.purge({requestId:d.requestId,legalHold:false}),'legal-hold');assert.deepEqual(await controller.getState(),before);
 await controller.setHold({active:false,reviewAt:null,expectedRevision:before.hold.revision});assert.equal((await finish(controller,d)).phase,'complete');
});

test('a failed delete rolls back payload removal, cursor and counters together; retry resumes safely',async()=>{
 const f=await setup(),controller=await f.lifecycle('terms'),d=decision();await controller.retire(d);const original=f.storage.transaction;let injected=true;
 f.storage.transaction=callback=>original(async tx=>callback({...tx,delete:async key=>{await tx.delete(key);if(injected){injected=false;throw Error('Injected storage failure');}return true;}}));
 await assert.rejects(controller.purge({requestId:d.requestId,legalHold:false}),/Injected/);assert.ok(await f.storage.get(f.prefix('terms')+'events/'+f.records.terms.id));assert.equal((await controller.getState()).progress.scanned,0);assert.equal((await finish(controller,d)).progress.deleted,1);
});

test('whole-subject terms retirement spans scopes but preserves other subjects and sites',async()=>{
 const f=await setup();await f.write('terms',{...f.commands.terms,requestId:crypto.randomUUID()});await f.write('terms',{...f.commands.terms,requestId:crypto.randomUUID()},{subjectId:'subject-birch'});const controller=await f.lifecycle('terms'),d=decision();await controller.retire(d);await rejects(f.write('terms',f.commands.terms,{scopeId:'different-workflow'}),'context-retired');const state=await finish(controller,d);assert.equal(state.progress.deleted,2);assert.equal((await f.store('terms').list(query)).records.length,1);
});

test('restore reapplication reblocks writes and restarts a completed scan while preserving a newer legal hold',async()=>{
 const f=await setup(),controller=await f.lifecycle('consent'),d=decision(),key=f.prefix('consent')+'events/'+f.records.consent.id;const archived=await f.storage.get(key);await controller.retire(d);const manifest=await finish(controller,d);await f.storage.put(key,archived);await rejects(f.write('consent'),'context-retired');
 await controller.setHold({active:true,reviewAt:'2026-11-18T12:00:00.000Z',expectedRevision:0});const restored=await controller.restore(manifest);assert.equal(restored.phase,'purging');assert.equal(restored.progress.after,null);assert.equal(restored.progress.scanned,0);assert.equal(restored.hold.active,true);await rejects(controller.purge({requestId:d.requestId,legalHold:false}),'legal-hold');await controller.setHold({active:false,reviewAt:null,expectedRevision:restored.hold.revision});assert.equal((await finish(controller,d)).progress.deleted,1);assert.equal(await f.storage.get(key),undefined);
 // Restoring a pre-retirement backup must reapply the separately retained manifest before traffic resumes.
 const fresh=createSyntheticStorage([]),next=await createEvidenceLifecycle(fresh,f.target('consent'),{now:f.context.now});await fresh.put(key,archived);await next.restore(manifest);await rejects(recordConsentChoice(fresh,f.commands.consent,f.context),'context-retired');assert.equal((await finish(next,d)).progress.deleted,1);
 await rejects(next.restore({...manifest,siteId:'another-site'}),'invalid-state');
});

test('corrupt event bindings or retirement metadata block work without deleting other records',async()=>{
 const f=await setup(),controller=await f.lifecycle('processing'),d=decision();await controller.retire(d);const badKey=f.prefix('processing')+'events/'+'0'.repeat(64);await f.storage.put(badKey,{id:'0'.repeat(64),kind:'processing-restriction',siteId:f.base.siteId,scopeId,streamRef:controller.contextRef,requestId:crypto.randomUUID()});await rejects(controller.purge({requestId:d.requestId,legalHold:false}),'invalid-record');assert.equal((await controller.getState()).progress.deleted,0);assert.ok(await f.storage.get(badKey));
 await f.storage.put(f.prefix('processing')+'lifecycle/processing/'+controller.contextRef,{kind:'broken'});await rejects(f.write('processing'),'invalid-state');await rejects(getProcessingHead(f.storage,f.context),'invalid-state');
});

test('transaction ordering prevents writes after retirement and includes a write committed immediately before it',async()=>{
 for(const family of ['consent','processing','terms']){
  const f=await setup(),controller=await f.lifecycle(family),d=decision(),command={...f.commands[family],requestId:crypto.randomUUID()};if(family==='consent')command.expectedRevision=1;
  const [write,retire]=await Promise.allSettled([f.write(family,command),controller.retire(d)]);assert.equal(retire.status,'fulfilled');assert.ok(write.status==='fulfilled'||write.reason.code==='context-retired');const result=await finish(controller,d);assert.equal(result.progress.deleted,write.status==='fulfilled'?2:1);await rejects(f.write(family,command),'context-retired');
 }
});

test('strict targets, bounded decisions and transactional capability checks reject unsupported mutation before writes',async()=>{
 const f=await setup();await rejects(createEvidenceLifecycle({get:async()=>undefined,list:async()=>new Map(),transaction:async cb=>cb({get:async()=>undefined,put:async()=>assert.fail('No write')})},f.target('terms')),'unsupported-storage');
 for(const target of [{...f.target('terms'),scopeId:'unexpected'},{...f.target('consent'),prefix:'../'},{...f.target('processing'),streamId:''}])await rejects(createEvidenceLifecycle(f.storage,target),'invalid-target');
 const controller=await f.lifecycle('terms'),d=decision();await rejects(controller.retire({...d,legalHold:true}),'invalid-decision');await rejects(controller.retire({...d,eligibleAt:'2030-01-01T00:00:00.000Z'}),'not-eligible');await rejects(controller.retire({...d,reason:['operator-erasure']}),'invalid-decision');await rejects(controller.setHold({active:true,reviewAt:null,expectedRevision:0}),'invalid-decision');assert.equal(await controller.getState(),undefined);
 const badClock=await createEvidenceLifecycle(f.storage,f.target('terms'),{now:()=>new Date(NaN)});await rejects(badClock.retire(d),'invalid-clock');
});

test('lifecycle inspection and export remain read-only, scoped and free of raw subject or stream identifiers',async()=>{
 const f=await setup(),controller=await f.lifecycle('terms'),d=decision();await controller.retire(d);const store=createEvidenceLifecycleStore(f.storage,{family:'terms',...f.base}),page=await store.list(query);assert.equal(page.records.length,1);assert.equal(page.records[0].data.retirement.requestId,d.requestId);assert.ok(!JSON.stringify(page).includes(subjectId));assert.ok(!JSON.stringify(page).includes(streamId));
 const worker=createAdminWorker({basePath:'/workspace',authorize:()=>({store,allowExport:true})}),response=await worker.fetch(new Request('https://fictional.test/workspace/export.json'));assert.equal(response.status,200);assert.match(await response.text(),/evidence-lifecycle/);assert.equal((await worker.fetch(new Request('https://fictional.test/workspace',{method:'POST'}))).status,405);
});

test('restoration or a regressed clock cannot purge before the retained eligibility decision',async()=>{
 const f=await setup(),future='2030-01-01T00:00:00.000Z',controller=await createEvidenceLifecycle(f.storage,f.target('terms'),{now:()=>new Date(future)}),d={...decision(),eligibleAt:future};const manifest=await controller.retire(d);
 const earlier=await f.lifecycle('terms');await rejects(earlier.purge({requestId:d.requestId,legalHold:false}),'not-eligible');assert.equal((await earlier.getState()).progress.scanned,0);assert.ok(await f.storage.get(f.prefix('terms')+'events/'+f.records.terms.id));
 await earlier.restore(manifest);await rejects(earlier.purge({requestId:d.requestId,legalHold:false}),'not-eligible');assert.equal((await earlier.getState()).progress.deleted,0);assert.equal((await finish(controller,d)).progress.deleted,1);
});

test('lifecycle presentation escapes untrusted metadata and uses readable progress rather than a misleading completion percentage',async()=>{
 const f=await setup(),controller=await f.lifecycle('consent');const sample=await controller.retire(decision());const hostile='<img src=x onerror=alert(1)>';sample.hold.reviewAt=hostile;sample.hold.active=true;sample.progress.deleted=hostile;sample.retirement.reason=hostile;sample.contextRef=hostile;
 const store={get:async()=>({id:'sample',data:sample}),list:async()=>({records:[{id:'sample',data:sample}]})};const app=createAdminWorker({basePath:'/workspace',authorize:()=>({store,scopeLabel:'Synthetic'})});
 for(const path of ['/workspace','/workspace/record?id=sample']){const response=await app.fetch(new Request('https://fictional.test'+path));assert.equal(response.status,200);const html=await response.text();assert.doesNotMatch(html,/<img src=x/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/\d+% complete/);}
});

test('human lifecycle labels search and export the same scoped records without changing stored manifests',async()=>{
 const f=await setup(),consent=await f.lifecycle('consent'),processing=await f.lifecycle('processing'),terms=await f.lifecycle('terms');await consent.setHold({active:true,reviewAt:instant,expectedRevision:0});const pd=decision();await processing.retire(pd);const td=decision();await terms.retire(td);const complete=await finish(terms,td);await terms.restore(complete);await finish(terms,td);
 for(const [family,termsToFind] of [['consent',['held','on hold','cookie-choice']],['processing',['pending','processing opt-out']],['terms',['complete','terms agreement','restored manifest']]]){
  const store=createEvidenceLifecycleStore(f.storage,{family,...f.base});const app=createAdminWorker({basePath:'/workspace',authorize:()=>({store,allowExport:true})});
  for(const text of termsToFind){const page=await store.list({...query,query:text});assert.equal(page.records.length,1,text);const response=await app.fetch(new Request('https://fictional.test/workspace/export.json?q='+encodeURIComponent(text)));assert.equal(response.status,200);assert.equal((await response.json()).records.length,1);assert.equal(page.records[0].data.statusLabel,undefined);}
  assert.equal((await store.list({...query,query:'nonexistent'})).records.length,0);
 }
 const held=createEvidenceLifecycleStore(f.storage,{family:'terms',...f.base});assert.equal((await held.list({...query,query:'held'})).records.length,0);
 const records=await Promise.all([consent,processing,terms].map(async(controller,index)=>({id:'context-'+index,data:await controller.getState()})));records.push({id:'unrelated',data:{kind:'other',description:'lifecycle:held pending complete'}});
 const combined=createDurableObjectStore(createSyntheticStorage(records,'host/inspection/'),{prefix:'host/inspection/'});
 for(const [keyword,family] of [['held','consent'],['retained','consent'],['pending','processing'],['complete','terms'],['restored','terms']]){const page=await combined.list({...query,query:'lifecycle:'+keyword});assert.equal(page.records.length,1);assert.equal(page.records[0].data.family,family);}
 for(const text of ['lifecycle:unknown','lifecycle:held lifecycle:complete'])assert.equal((await combined.list({...query,query:text})).records.length,0);
 const view=createAdminWorker({basePath:'/workspace',authorize:()=>({store:combined,allowExport:true})});const response=await view.fetch(new Request('https://fictional.test/workspace?q=lifecycle%3Aheld&limit=10'));assert.equal(response.status,200);const html=await response.text();assert.match(html,/aria-label="Lifecycle states"/);assert.match(html,/q=lifecycle%3Aheld[^"]*" aria-current="page"/);assert.match(html,/q=lifecycle%3Acomplete/);const exported=await view.fetch(new Request('https://fictional.test/workspace/export.json?q=lifecycle%3Aheld'));assert.equal((await exported.json()).records.length,1);
});
