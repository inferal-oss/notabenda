// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {compileLegalDocuments,createContractActionDefinition} from '@notabenda/core/content';
import {recordLegalRelease,registerContractActionDefinition,recordContractDeclaration,dispatchContractDelivery,dispatchContractDeclaration,claimContractDelivery,settleContractDelivery,cancelContractDelivery,createEvidenceLifecycle} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../examples/synthetic.mjs';

async function setup(){
 const config=await fixture({reviewed:true}),build=compileLegalDocuments(config),storage=createSyntheticStorage([]),clock={at:'2026-10-19T12:00:00.000Z'},context={siteId:config.site.id,actionId:'contract-withdrawal',operationId:'admitted-operation',now:()=>new Date(clock.at)},definition=createContractActionDefinition(build.artifact,{actionId:context.actionId,revision:'one',profile:'eu-withdrawal',reviewStatus:'reviewed'});
 await recordLegalRelease(storage,build.artifact);await registerContractActionDefinition(storage,definition,context);
 const receipt=await recordContractDeclaration(storage,{schemaVersion:1,definitionId:definition.definitionId,requestId:crypto.randomUUID(),clientAt:clock.at,fields:{name:'Avery Linden',contract:'Annual plan · sample 24017',email:'avery@example.test'}},context),key=`notabenda/contracts/${context.siteId}/events/${receipt.id}`;
 return {storage,clock,context,receipt,key,job:async channel=>(await storage.get(key)).delivery[channel]};
}
const success=async()=>({providerRef:'sample-provider-accepted'});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

test('paired dispatch starts acknowledgement independently of synchronous application failure or a hung application',async()=>{
 for(const hang of [false,true]){
  const f=await setup(),called=[],result=await dispatchContractDeclaration(f.storage,f.receipt.id,f.context,{acknowledgement:{deliver:async({lease,signal})=>{called.push('ack');assert.equal(signal.aborted,false);assert.equal(lease.receipt.acknowledgement.text,f.receipt.acknowledgement.text);return {providerRef:'sample-mail-accepted'};}},application:{timeoutMs:100,deliver:()=>{called.push('app');if(hang)return new Promise(()=>{});throw Error('Private provider response that must not escape.');}}});
  assert.deepEqual(called.sort(),['ack','app']);assert.equal(result.acknowledgement.provider,'accepted');assert.equal(result.acknowledgement.settlement,'settled');assert.equal(result.application.provider,'uncertain');assert.equal(result.application.settlement,'settled');assert.equal((await f.job('acknowledgement')).status,'accepted');assert.equal((await f.job('application')).status,'uncertain');assert.doesNotMatch(JSON.stringify(result),/Private|avery|Linden|provider response/);
 }
});

test('both callbacks and budgets validate before either claim; context/options and the private lease survive caller/callback mutation',async()=>{
 const f=await setup(),before=await f.storage.get(f.key);let calls=0;
 await assert.rejects(dispatchContractDeclaration(f.storage,f.receipt.id,f.context,{acknowledgement:{deliver:async()=>{calls++;return success();}},application:{deliver:success,leaseMs:1000,timeoutMs:1000}}),TypeError);assert.equal(calls,0);assert.deepEqual(await f.storage.get(f.key),before);
 const context={...f.context},settings={deliver:async({lease})=>{lease.id='b'.repeat(64);lease.token=crypto.randomUUID();lease.version=999;lease.request.fields.email='changed@example.test';return {providerRef:'sample-provider-accepted'};}},running=dispatchContractDelivery(f.storage,f.receipt.id,'application',context,settings);context.actionId='changed';settings.deliver=()=>{throw Error('Changed callback');};
 const result=await running;assert.equal(result.provider,'accepted');assert.equal(result.settlement,'settled');const event=await f.storage.get(f.key);assert.equal(event.request.fields.email,'avery@example.test');assert.equal(event.delivery.application.providerRef,'sample-provider-accepted');
});

test('pre-aborted dispatch claims nothing; abort during a delayed claim never invokes a provider and settles uncertainty',async()=>{
 const f=await setup(),controller=new AbortController();controller.abort();let calls=0;const options={signal:controller.signal,deliver:async()=>{calls++;return success();}};
 assert.deepEqual(await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,options),{provider:'not-invoked',settlement:'not-claimed'});assert.equal((await f.job('application')).attempts,0);
 const during=new AbortController(),delayed={...f.storage,transaction:async fn=>{const value=await f.storage.transaction(fn);during.abort();return value;}};
 const result=await dispatchContractDelivery(delayed,f.receipt.id,'application',f.context,{...options,signal:during.signal});assert.equal(result.provider,'not-invoked');assert.equal(result.settlement,'settled');assert.equal(calls,0);assert.equal((await f.job('application')).status,'uncertain');
});

test('storage latency consumes the remaining lease and a nearly expired claim invokes no callback',async()=>{
 const f=await setup();let calls=0;const delayed={...f.storage,transaction:async fn=>{const value=await f.storage.transaction(fn);f.clock.at='2026-10-19T12:00:00.950Z';return value;}};
 const result=await dispatchContractDelivery(delayed,f.receipt.id,'application',f.context,{leaseMs:1000,timeoutMs:800,deliver:async()=>{calls++;return success();}});assert.equal(calls,0);assert.equal(result.provider,'not-invoked');assert.equal(result.settlement,'settled');assert.equal((await f.job('application')).status,'uncertain');
});

test('timeout aborts the attempt signal; late success/rejection cannot settle a newer idempotent attempt',async()=>{
 for(const rejectLate of [false,true]){
  const f=await setup(),late=deferred();let signal,oldLease;
  const result=await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,{timeoutMs:100,deliver:attempt=>{signal=attempt.signal;oldLease=attempt.lease;return late.promise;}});assert.equal(signal.aborted,true);assert.equal(result.provider,'uncertain');assert.equal(result.settlement,'settled');
  const next=await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,{deliver:async({lease})=>{assert.equal(lease.deliveryId,oldLease.deliveryId);assert.equal(lease.payloadSha256,oldLease.payloadSha256);assert.equal(lease.version,oldLease.version+1);return {providerRef:'deduplicated-provider-result'};}});assert.equal(next.provider,'accepted');assert.equal(next.settlement,'settled');
  if(rejectLate)late.reject(Error('Sensitive late failure'));else late.resolve({providerRef:'late-accepted'});await new Promise(resolve=>setImmediate(resolve));assert.equal((await f.job('application')).providerRef,'deduplicated-provider-result');assert.deepEqual(await settleContractDelivery(f.storage,oldLease,{status:'accepted',providerRef:'stale'},f.context),{settled:false});
 }
});

test('malformed provider results stay uncertain without invoking accessor values or retaining arbitrary responses',async()=>{
 for(const value of [undefined,{providerRef:'accepted',body:'Private response'}, {providerRef:'bad\r\nheader'}, {providerRef:['accepted']},Object.defineProperty({},'providerRef',{enumerable:true,get(){throw Error('Getter must not run.');}})]){
  const f=await setup(),result=await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,{deliver:async()=>value});assert.equal(result.provider,'uncertain');assert.equal(result.settlement,'settled');assert.equal((await f.job('application')).providerRef,null);
 }
});

test('provider acceptance and ambiguous settlement/claim persistence are reported separately',async()=>{
 for(const committed of [false,true]){
  const f=await setup();let transactions=0;
  const uncertain={...f.storage,transaction:async fn=>{transactions++;if(transactions===2){if(committed)await f.storage.transaction(fn);throw Error('Private storage diagnostic');}return f.storage.transaction(fn);}};
  const result=await dispatchContractDelivery(uncertain,f.receipt.id,'application',f.context,{deliver:success});assert.equal(result.provider,'accepted');assert.equal(result.settlement,'unknown');assert.equal((await f.job('application')).status,committed?'accepted':'leased');assert.doesNotMatch(JSON.stringify(result),/Private/);
 }
 const f=await setup();let calls=0;const lostClaim={...f.storage,transaction:async fn=>{await f.storage.transaction(fn);throw Error('Claim reply lost');}},result=await dispatchContractDelivery(lostClaim,f.receipt.id,'application',f.context,{deliver:async()=>{calls++;return success();}});assert.equal(result.provider,'not-invoked');assert.equal(result.settlement,'unknown');assert.equal(calls,0);assert.equal((await f.job('application')).status,'leased');
});

test('neutral skipped claims never imply delivery; terminal, active and exhausted jobs invoke no callback',async()=>{
 const f=await setup();let calls=0;const deliver=async()=>{calls++;return success();};const lease=await claimContractDelivery(f.storage,f.receipt.id,'application',f.context);assert.deepEqual(await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,{deliver}),{provider:'not-invoked',settlement:'not-claimed'});
 await settleContractDelivery(f.storage,lease,{status:'uncertain'},f.context);assert.deepEqual(await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,{deliver,maxAttempts:1}),{provider:'not-invoked',settlement:'not-claimed'});
 await cancelContractDelivery(f.storage,f.receipt.id,'application',{expectedVersion:lease.version,externalWorkStopped:true},f.context);assert.equal((await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,{deliver})).settlement,'not-claimed');
 await dispatchContractDelivery(f.storage,f.receipt.id,'acknowledgement',f.context,{deliver:success});assert.equal((await dispatchContractDelivery(f.storage,f.receipt.id,'acknowledgement',f.context,{deliver})).settlement,'not-claimed');assert.equal(calls,0);
});


test('an abort triggered by the final host-clock hook is observed immediately before provider invocation',async()=>{
 const f=await setup(),controller=new AbortController();let clocks=0,calls=0;const context={...f.context,now(){if(++clocks===3)controller.abort();return new Date(f.clock.at);}};
 const result=await dispatchContractDelivery(f.storage,f.receipt.id,'application',context,{signal:controller.signal,deliver:async()=>{calls++;return success();}});assert.equal(clocks,4);assert.equal(calls,0);assert.equal(result.provider,'not-invoked');assert.equal(result.settlement,'settled');assert.equal((await f.job('application')).status,'uncertain');
});


test('a clock regressing below claim time or between preflight reads invokes no provider',async()=>{
 for(const between of [false,true]){
  const f=await setup();let clocks=0,calls=0;const context={...f.context,now(){clocks++;return new Date(clocks===1?f.clock.at:between?(clocks===2?'2026-10-19T12:00:01.000Z':'2026-10-19T12:00:00.500Z'):'2026-10-19T11:59:59.000Z');}};
  const result=await dispatchContractDelivery(f.storage,f.receipt.id,'application',context,{deliver:async()=>{calls++;return success();}});assert.equal(calls,0);assert.equal(result.provider,'not-invoked');assert.equal(result.settlement,between?'settled':'unknown');
 }
});


test('abort during provider work stays uncertain and cannot authorize declaration retirement',async()=>{
 const f=await setup(),controller=new AbortController();await dispatchContractDelivery(f.storage,f.receipt.id,'acknowledgement',f.context,{deliver:success});
 const result=await dispatchContractDelivery(f.storage,f.receipt.id,'application',f.context,{signal:controller.signal,deliver:async({signal})=>{controller.abort();assert.equal(signal.aborted,true);return {providerRef:'may-have-accepted'};}});assert.equal(result.provider,'uncertain');assert.equal(result.settlement,'settled');assert.equal((await f.job('application')).status,'uncertain');
 const lifecycle=await createEvidenceLifecycle(f.storage,{family:'contracts',siteId:f.context.siteId,scopeId:f.context.actionId,streamId:f.receipt.requestId},{now:f.context.now});await assert.rejects(lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:f.clock.at,legalHold:false}),error=>error.code==='pending-delivery');
});
