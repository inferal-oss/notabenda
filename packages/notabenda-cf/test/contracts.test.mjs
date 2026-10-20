// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-DE-CANCEL REQ-DE-WITHDRAWAL REQ-EU-WITHDRAWAL REQ-BR-CONTRACT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {compileLegalDocuments,createContractActionDefinition,canonicalJson,sha256} from '@notabenda/core/content';
import {recordLegalRelease,registerContractActionDefinition,contractActionOperationRef,recordContractDeclaration,claimContractDelivery,settleContractDelivery,cancelContractDelivery,createContractDeclarationStore,createEvidenceLifecycle,createAdminWorker} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
const instant='2026-10-18T12:00:00.000Z';
const reject=(promise,code)=>assert.rejects(promise,error=>error.code===code);
const query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};
async function setup(profile='de-cancellation'){
 const config=await fixture({reviewed:true}),build=compileLegalDocuments(config),storage=createSyntheticStorage([]),clock={at:instant},context={siteId:config.site.id,actionId:'subscription-end',operationId:'anonymous-host-operation-one',now:()=>new Date(clock.at)},definition=createContractActionDefinition(build.artifact,{actionId:context.actionId,revision:'action-1',profile,reviewStatus:'reviewed'});
 await recordLegalRelease(storage,build.artifact);await registerContractActionDefinition(storage,definition,context);
 const request={schemaVersion:1,definitionId:definition.definitionId,requestId:crypto.randomUUID(),clientAt:'2026-10-18T11:59:59.000Z',fields:{name:'Avery Linden',contract:'Juniper Notes annual plan · sample 24017',email:'avery@example.test',...(profile==='de-cancellation'?{cancellation:{kind:'ordinary',reason:'',ending:''}}:{})}};
 return {config,build,storage,context,clock,definition,request,prefix:`notabenda/contracts/${context.siteId}/`};
}

test('profile definitions bind exact reviewed wording, rendering semantics and archives; missing/tampered/unreviewed definitions cannot record',async()=>{
 for(const profile of ['de-cancellation','de-withdrawal','eu-withdrawal','br-withdrawal']){
  const f=await setup(profile);assert.equal(f.definition.renderingPolicy,'contract-form-v1');assert.equal(f.definition.locale,profile.startsWith('de-')?'de-DE':profile.startsWith('br-')?'pt-BR':'en');assert.deepEqual(await registerContractActionDefinition(f.storage,f.definition,f.context),{definitionId:f.definition.definitionId,created:false});
  const receipt=await recordContractDeclaration(f.storage,f.request,f.context);assert.equal(receipt.stage,'received');assert.match(receipt.acknowledgement.text,new RegExp(f.definition.wording.confirmLabel));assert.equal(receipt.acknowledgement.sha256,sha256(receipt.acknowledgement.text));
  await reject(registerContractActionDefinition(f.storage,{...f.definition,wording:{...f.definition.wording,statement:'tampered'}},f.context),'invalid-definition');
  const changed={...f.definition,documents:{...f.definition.documents,terms:{...f.definition.documents.terms,version:'invented'}}};const {definitionId:_,...descriptor}=changed;changed.definitionId=sha256(canonicalJson(descriptor));await reject(registerContractActionDefinition(f.storage,changed,f.context),'invalid-definition');
 }
 const f=await setup(),other=createSyntheticStorage([]);await reject(registerContractActionDefinition(other,f.definition,f.context),'invalid-definition');assert.throws(()=>createContractActionDefinition(f.build.artifact,{actionId:'another',revision:'one',profile:'de-withdrawal',reviewStatus:'draft'}),/reviewed/);
 const changedProfile=createContractActionDefinition(f.build.artifact,{actionId:f.context.actionId,revision:'two',profile:'de-withdrawal',reviewStatus:'reviewed'});await reject(registerContractActionDefinition(f.storage,changedProfile,f.context),'scope-mismatch');
});

test('declaration capture atomically commits both independent jobs, never claims cancellation/delivery and retains exact receipt across lost-response retries',async()=>{
 const f=await setup(),[first,duplicate]=await Promise.all([recordContractDeclaration(f.storage,f.request,f.context),recordContractDeclaration(f.storage,f.request,f.context)]);assert.deepEqual(first,duplicate);assert.equal(first.receivedAt,instant);assert.equal(first.operationRef,await contractActionOperationRef(f.context));assert.equal(first.acknowledgement.status,'pending');
 let event=await f.storage.get(f.prefix+'events/'+first.id);for(const channel of ['application','acknowledgement'])assert.equal(event.delivery[channel].status,'pending');assert.notEqual(event.delivery.application.deliveryId,event.delivery.acknowledgement.deliveryId);assert.equal(event.request.clientAt,f.request.clientAt);
 const lease=await claimContractDelivery(f.storage,first.id,'application',f.context);await settleContractDelivery(f.storage,lease,{status:'accepted',providerRef:'fictional-application-receipt'},f.context);f.clock.at='2026-11-01T12:00:00.000Z';assert.deepEqual(await recordContractDeclaration(f.storage,f.request,f.context),first);event=await f.storage.get(f.prefix+'events/'+first.id);assert.equal(event.delivery.application.status,'accepted');assert.equal(event.delivery.acknowledgement.attempts,0);
 await reject(recordContractDeclaration(f.storage,{...f.request,fields:{...f.request.fields,contract:'Changed contract'}},f.context),'idempotency-conflict');
 const second=await recordContractDeclaration(f.storage,{...f.request,requestId:crypto.randomUUID()},f.context);assert.notEqual(second.id,first.id);assert.equal((await f.storage.list({prefix:f.prefix+'events/',limit:100})).size,2);
});

test('a newer form never silently invalidates a declaration from an older form; failures roll back all inbox/outbox state',async()=>{
 const f=await setup(),next=createContractActionDefinition(f.build.artifact,{actionId:f.context.actionId,revision:'two',profile:'de-cancellation',reviewStatus:'reviewed',wording:{title:'Updated form wording'}});await registerContractActionDefinition(f.storage,next,f.context);
 const failing={...f.storage,transaction:callback=>f.storage.transaction(tx=>callback({...tx,put:async(key,value)=>{await tx.put(key,value);throw Error('storage unavailable');}}))};await assert.rejects(recordContractDeclaration(failing,f.request,f.context),/storage unavailable/);assert.equal((await f.storage.list({prefix:f.prefix+'events/',limit:100})).size,0);
 const old=await recordContractDeclaration(f.storage,f.request,f.context);assert.equal(old.definitionId,f.definition.definitionId);
});

test('admitted visitor claims do not verify identity or contract existence and cannot select another operation, site or action scope',async()=>{
 const f=await setup(),receipt=await recordContractDeclaration(f.storage,f.request,f.context);
 for(const extra of [{operationId:'different-session'},{siteId:'another-site',prefix:f.prefix},{actionId:'another-action'}])await reject(recordContractDeclaration(f.storage,f.request,{...f.context,...extra}),'scope-mismatch');
 const altered={...f.request,requestId:crypto.randomUUID(),fields:{...f.request.fields,email:'missing'}};await reject(recordContractDeclaration(f.storage,altered,f.context),'invalid-request');
 await reject(recordContractDeclaration(f.storage,{...f.request,identityVerified:true},f.context),'invalid-request');
 const another=createContractDeclarationStore(f.storage,{siteId:'another-site',prefix:f.prefix});await reject(another.get(receipt.id),'scope-mismatch');
});

test('confirmation dispatch does not wait for application success; concurrent claims, uncertain outcomes and expired lease settlements remain fenced',async()=>{
 const f=await setup(),receipt=await recordContractDeclaration(f.storage,f.request,f.context),[a,b]=await Promise.all([claimContractDelivery(f.storage,receipt.id,'application',f.context,{leaseMs:1000}),claimContractDelivery(f.storage,receipt.id,'application',f.context,{leaseMs:1000})]);assert.ok(a);assert.equal(b,undefined);
 await settleContractDelivery(f.storage,a,{status:'uncertain'},f.context);const ack=await claimContractDelivery(f.storage,receipt.id,'acknowledgement',f.context);assert.ok(ack);assert.deepEqual(await settleContractDelivery(f.storage,ack,{status:'accepted',providerRef:'fictional-mail-provider-acceptance'},f.context),{settled:true});assert.equal(await claimContractDelivery(f.storage,receipt.id,'acknowledgement',f.context),undefined);
 const old=await claimContractDelivery(f.storage,receipt.id,'application',f.context,{leaseMs:1000});f.clock.at='2026-10-18T12:00:02.000Z';assert.deepEqual(await settleContractDelivery(f.storage,old,{status:'accepted',providerRef:'late'},f.context),{settled:false});const fresh=await claimContractDelivery(f.storage,receipt.id,'application',f.context);assert.equal(fresh.deliveryId,old.deliveryId);assert.equal(fresh.payloadSha256,old.payloadSha256);assert.notEqual(fresh.token,old.token);assert.equal(fresh.version,old.version+1);assert.deepEqual(await settleContractDelivery(f.storage,old,{status:'accepted',providerRef:'stale'},f.context),{settled:false});assert.deepEqual(await settleContractDelivery(f.storage,fresh,{status:'accepted',providerRef:'stable-idempotent-result'},f.context),{settled:true});
});

test('per-declaration retirement waits for explicit drain/quiescence, withholds private payload, blocks restore replay and leaves future statutory declarations available',async()=>{
 const f=await setup(),receipt=await recordContractDeclaration(f.storage,f.request,f.context),original=await f.storage.get(f.prefix+'events/'+receipt.id),target={family:'contracts',siteId:f.context.siteId,scopeId:f.context.actionId,streamId:f.request.requestId},lifecycle=await createEvidenceLifecycle(f.storage,target,{now:f.context.now}),decision={requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:instant,legalHold:false};
 await reject(lifecycle.retire(decision),'pending-delivery');const lease=await claimContractDelivery(f.storage,receipt.id,'acknowledgement',f.context);await reject(lifecycle.retire(decision),'pending-delivery');
 await reject(cancelContractDelivery(f.storage,receipt.id,'acknowledgement',{expectedVersion:0,externalWorkStopped:true},f.context),'revision-conflict');
 await cancelContractDelivery(f.storage,receipt.id,'acknowledgement',{expectedVersion:lease.version,externalWorkStopped:true},f.context);await cancelContractDelivery(f.storage,receipt.id,'application',{expectedVersion:0,externalWorkStopped:true},f.context);
 const retired=await lifecycle.retire(decision);assert.equal(retired.phase,'purging');await reject(settleContractDelivery(f.storage,lease,{status:'accepted',providerRef:'too-late'},f.context),'context-retired');const hidden=await createContractDeclarationStore(f.storage,f.context).get(receipt.id);assert.equal(hidden.data.kind,'retired-evidence');assert.doesNotMatch(JSON.stringify(hidden),/Avery|avery@example|24017/);
 const complete=await lifecycle.purge({requestId:decision.requestId,legalHold:false});assert.equal(complete.phase,'complete');assert.equal(complete.progress.deleted,1);await reject(recordContractDeclaration(f.storage,f.request,f.context),'context-retired');const future=await recordContractDeclaration(f.storage,{...f.request,requestId:crypto.randomUUID()},f.context);assert.notEqual(future.id,receipt.id);
 await f.storage.put(f.prefix+'events/'+receipt.id,original);await lifecycle.restore(complete);await reject(claimContractDelivery(f.storage,receipt.id,'application',f.context),'context-retired');await reject(recordContractDeclaration(f.storage,f.request,f.context),'context-retired');
});

test('private inspection and export stay behind host authorization; strings are escaped and no anonymous lookup API is supplied',async()=>{
 const f=await setup();f.request.fields.name='<img src=x onerror=alert(1)>';const receipt=await recordContractDeclaration(f.storage,f.request,f.context),store=createContractDeclarationStore(f.storage,f.context);let reads=0;
 const denied=createAdminWorker({basePath:'/backoffice',authorize:()=>null});assert.equal((await denied.fetch(new Request('https://example.test/backoffice/record?id='+receipt.id),{})).status,403);
 const worker=createAdminWorker({basePath:'/backoffice',authorize:()=>({store:{...store,get:async id=>{reads++;return store.get(id);}}})}),response=await worker.fetch(new Request('https://example.test/backoffice/record?id='+receipt.id),{});assert.equal(response.status,200);const html=await response.text();assert.doesNotMatch(html,/<img src=x/);assert.match(html,/&lt;img/);assert.equal(reads,1);assert.equal((await store.list(query)).records.length,1);
});

test('array/string-coercion payloads cannot change declaration semantics, settle a provider job or bypass the retirement drain',async()=>{
 const f=await setup();await reject(recordContractDeclaration(f.storage,{...f.request,fields:{...f.request.fields,cancellation:{...f.request.fields.cancellation,kind:['ordinary']}}},f.context),'invalid-request');
 const receipt=await recordContractDeclaration(f.storage,f.request,f.context),lease=await claimContractDelivery(f.storage,receipt.id,'application',f.context);await reject(settleContractDelivery(f.storage,lease,{status:['accepted']},f.context),'invalid-delivery');assert.equal((await f.storage.get(f.prefix+'events/'+receipt.id)).delivery.application.status,'leased');
 const event=await f.storage.get(f.prefix+'events/'+receipt.id);for(const channel of ['application','acknowledgement']){event.delivery[channel].status=['accepted'];event.delivery[channel].lease=null;}await f.storage.put(f.prefix+'events/'+receipt.id,event);
 await reject(createContractDeclarationStore(f.storage,f.context).get(receipt.id),'invalid-record');const lifecycle=await createEvidenceLifecycle(f.storage,{family:'contracts',siteId:f.context.siteId,scopeId:f.context.actionId,streamId:f.request.requestId},{now:f.context.now});await reject(lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:instant,legalHold:false}),'pending-delivery');
});
