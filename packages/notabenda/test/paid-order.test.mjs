// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createPaidOrderDefinition,createPaidOrderReview,verifyPaidOrderReview} from '@notabenda/authoring/orders';
import {createPaidOrderAction,mountPaidOrderAction,renderPaidOrderReview,normalizePaidOrderReview,formatPaidOrderMoney,copyPaidOrderData} from '@notabenda/core/orders';
import {buildDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';
const time='2026-10-19T12:00:00.000Z',expiry='2026-10-19T12:10:00.000Z',fixed=amountMinor=>({kind:'fixed',amountMinor});
const definitionInput=({schemaVersion,kind,renderingPolicy,definitionId,...input})=>input;
const calculatedTotal={kind:'calculated',method:'€129 for the lamp plus €6 per month for planning.',reason:'The membership continues until cancelled, so its total depends on its duration.'};
const clone=structuredClone,reject=(p,code)=>assert.rejects(p,e=>e.code===code),tick=()=>new Promise(r=>setImmediate(r));
async function until(predicate){for(let n=0;n<200;n++){if(predicate())return;await new Promise(r=>setTimeout(r,5));}assert.fail('Expected order state was not reached.');}
function fixture({items,pricing,wording,reviewStatus='reviewed'}={}){
 const definition=createPaidOrderDefinition({profile:'eu-paid-distance-order-v1',siteId:'shop',locale:'en',direction:'ltr',reviewStatus,items:items??[
  {id:'lamp',productId:'lamp-model',name:'Desk lamp',kind:'goods',characteristics:['Adjustable arm; 8 W LED; green finish.'],commitment:{duration:'One purchase.',termination:'Withdrawal and statutory rights apply.',minimum:'One lamp.'},guarantee:{status:'no-label-required',disclosure:'The producer has not offered a qualifying durability guarantee for this model; statutory rights remain.'}},
  {id:'planning',productId:'planning-monthly',name:'Workspace planning',kind:'service',characteristics:['One remote planning appointment each month.'],commitment:{duration:'Monthly; renews until cancelled.',termination:'Cancel before the next billing date.',minimum:'One month.'},guarantee:null},
 ],documents:[],...(wording?{wording}:{})},{allowPreview:reviewStatus==='draft'});
 const quote={quoteId:'checkout-42',revision:'quote-1',contextRef:'a'.repeat(64),definitionId:definition.definitionId,issuedAt:time,expiresAt:expiry,lines:definition.items.map(i=>({itemId:i.id,quantity:1})),pricing:pricing??{currency:'EUR',fractionDigits:2,payments:[{id:'lamp-price',lineIds:['lamp'],label:'Lamp, including delivery',amount:fixed('12900'),due:{kind:'now'},recurrence:{kind:'once'}},{id:'planning-price',lineIds:['planning'],label:'Planning membership',amount:fixed('600'),due:{kind:'now'},recurrence:{kind:'recurring',period:'Every month',cycles:null,monthlyCost:fixed('600'),changes:'No introductory price; €6 each month until cancelled.'}}],totalPrice:calculatedTotal,dueNow:fixed('13500'),taxAndChargesNotice:'VAT and delivery are included. No other mandatory charges.'}};
 return {definition,quote,review:createPaidOrderReview(definition,quote,{}, {allowPreview:reviewStatus==='draft'})};
}
// This test host serializes admission and checks idempotency before quote expiry.
// It is a transport fixture, not a payment processor or durable confirmation service.
function host(review){let at=new Date(time),revision=review.quote.revision,orders=0,queue=Promise.resolve();const outcomes=new Map();
 const transport=request=>{const result=queue.then(()=>{const old=outcomes.get(request.requestId);if(old){assert.deepEqual(old.request,request);return clone(old.outcome);}if(request.contextRef!==review.quote.contextRef||request.reviewId!==review.reviewId||request.definitionId!==review.definition.definitionId||request.quoteId!==review.quote.quoteId)return {...request,status:'rejected',reason:'unavailable'};
  if(orders)return {...request,status:'rejected',reason:'checkout-used'};
  if(request.quoteRevision!==revision)return {...request,status:'rejected',reason:'stale-quote'};if(at>=new Date(review.quote.expiresAt))return {...request,status:'rejected',reason:'expired-quote'};
  const outcome={...request,status:'received',id:createHash('sha256').update(JSON.stringify(request)).digest('hex'),receivedAt:at.toISOString()};outcomes.set(request.requestId,{request:clone(request),outcome});orders++;return clone(outcome);});queue=result.catch(()=>{});return result;};
 return {transport,now:()=>new Date(at),setTime:v=>{at=new Date(v);},revise:()=>{revision='quote-2';},orders:()=>orders};}
function action(review,options={}){const h=host(review),c=createPaidOrderAction(review,{submit:h.transport,recoverAttempt:h.transport,now:h.now,...options});return {c,h};}

test('mixed goods and subscriptions bind separate commitments, exact totals and reviewed payment wording',()=>{
 const {review,definition,quote}=fixture();assert.deepEqual(verifyPaidOrderReview(review),review);const html=renderPaidOrderReview(review,{idPrefix:'checkout'}),doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelectorAll('[data-order-item]').length,2);assert.equal(doc.querySelector('h2').textContent,'Review your order');assert.equal(doc.querySelector('.nb-order-items>h3').textContent,'Your items');assert.equal(doc.querySelector('[data-order-item] h4').textContent,'Desk lamp');
 for(const text of ['€135.00','€6.00','€129.00','Monthly; renews until cancelled.','Cancel before the next billing date.','VAT and delivery are included.'])assert.ok(doc.body.textContent.includes(text),text);
 assert.equal(doc.querySelectorAll('button,input,details').length,0,'static information never starts an order or hides critical facts');
 const changed=clone(review);changed.definition.wording.paymentActionLabel='Continue';assert.throws(()=>verifyPaidOrderReview(changed),/identity/);changed.definition=definition;changed.quote.pricing.dueNow.amountMinor='13501';assert.throws(()=>normalizePaidOrderReview(changed));
 assert.throws(()=>createPaidOrderReview(definition,{...quote,definitionId:'f'.repeat(64)}));
});

test('browser order entries exclude authoring, Node, frameworks and evidence storage; static rendering excludes action transport',async()=>{
 const {build}=await import('esbuild');for(const names of ['renderPaidOrderReview','createPaidOrderAction,mountPaidOrderAction']){
  const result=await build({stdin:{contents:`export {${names}} from '@notabenda/core/orders';`,resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',minify:true,write:false,metafile:true});
  const used=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([path])=>path).join('\n');assert.doesNotMatch(used,/notabenda-authoring|notabenda-cf|node:|react|astro|catalog/);if(names==='renderPaidOrderReview')assert.doesNotMatch(used,/paid-order-action|paid-order-ui/);
 }
});

test('zero-initial conditional, later, recurring and calculated obligations retain the payment action',async()=>{
 const base=fixture(),payment=base.quote.pricing.payments[0];
 for(const variant of [
  {...payment,due:{kind:'conditional',condition:'Only if the agreed result is achieved.'}},
  {...payment,due:{kind:'later',when:'On delivery.'}},
  {...payment,amount:{kind:'calculated',method:'€20 per actual hour, including VAT.',reason:'The number of hours cannot reasonably be determined before the work.'},due:{kind:'conditional',condition:'If work is requested.'}},
  {...payment,amount:fixed('600'),due:{kind:'later',when:'After a free first month.'},recurrence:{kind:'recurring',period:'Every month after the free month',cycles:null,monthlyCost:fixed('600'),changes:'The first month is free, followed by €6 each month.'}},
 ]){
  const f=fixture({items:[base.definition.items[0]],pricing:{...base.quote.pricing,payments:[variant],totalPrice:variant.amount.kind==='calculated'||variant.recurrence.kind==='recurring'?calculatedTotal:variant.amount,dueNow:fixed('0')}}),{c,h}=action(f.review);c.setPresentationReady(true);assert.equal((await c.submit()).status,'received');assert.equal(h.orders(),1);assert.equal(c.getReview().definition.wording.paymentActionLabel,'Order with obligation to pay');c.destroy();
 }
 const calculated={kind:'calculated',method:'€20 per actual hour including tax.',reason:'Required hours depend on site conditions.'},f=fixture({items:[base.definition.items[0]],pricing:{...base.quote.pricing,payments:[{...payment,amount:calculated}],totalPrice:calculated,dueNow:calculated}});assert.ok(renderPaidOrderReview(f.review,{idPrefix:'calc'}).includes('Required hours depend on site conditions.'));
 assert.throws(()=>fixture({items:[base.definition.items[0]],pricing:{...base.quote.pricing,payments:[{...payment,amount:fixed('0')}],totalPrice:fixed('0'),dueNow:fixed('0')}}),'a wholly free order does not belong to this profile');
});

test('money never passes through binary floats and respects explicit scales and localized digits',()=>{
 const eur={currency:'EUR',fractionDigits:2};assert.equal(formatPaidOrderMoney('1',eur,'en'),'€0.01');assert.equal(formatPaidOrderMoney('999999999999999',eur,'en'),'€9,999,999,999,999.99');
 assert.equal(formatPaidOrderMoney('9',{currency:'JPY',fractionDigits:0},'en'),'¥9');assert.equal(formatPaidOrderMoney('9',{currency:'KWD',fractionDigits:3},'en'),'KWD 0.009');assert.equal(formatPaidOrderMoney('9',{currency:'EUR',fractionDigits:4},'en'),'€0.0009');
 const arabic=formatPaidOrderMoney('123',eur,'ar-EG');assert.ok(arabic.includes('١٫٢٣'),arabic);assert.ok(!arabic.includes('23'));
 for(const value of ['01','-1','1.5','1000000000000000',5])assert.throws(()=>formatPaidOrderMoney(value,eur,'en'));
});

test('finite total price includes later balances and all fixed recurring cycles, separately from due now',()=>{
 const base=fixture(),item=base.definition.items[0],payment=base.quote.pricing.payments[0];
 const pricing={...base.quote.pricing,payments:[{...payment,id:'deposit',amount:fixed('1000')},{...payment,id:'balance',amount:fixed('9000'),due:{kind:'later',when:'On delivery.'}}],totalPrice:fixed('10000'),dueNow:fixed('1000')};
 const {review}=fixture({items:[item],pricing}),doc=new JSDOM(renderPaidOrderReview(review,{idPrefix:'deposit'})).window.document;
 assert.match(doc.querySelector('.nb-order-total-price').textContent,/€100.00/);assert.match(doc.querySelector('.nb-order-due-now').textContent,/€10.00/);
 assert.throws(()=>fixture({items:[item],pricing:{...pricing,totalPrice:fixed('1000')}}));
 const finite={...pricing,payments:[{...payment,amount:fixed('600'),recurrence:{kind:'recurring',period:'Each month for 12 months',cycles:12,monthlyCost:fixed('600'),changes:'€6 for each of twelve months; no renewal.'}}],totalPrice:fixed('7200'),dueNow:fixed('600')};
 assert.equal(fixture({items:[item],pricing:finite}).review.quote.pricing.totalPrice.amountMinor,'7200');assert.throws(()=>fixture({items:[item],pricing:{...finite,totalPrice:fixed('600')}}));
 assert.throws(()=>fixture({items:[item],pricing:{...finite,payments:[{...finite.payments[0],recurrence:{...finite.payments[0].recurrence,cycles:null}}]}}));
});

test('bounded plain-data validation rejects accessors, cycles, unknown fields, unsafe text and incomplete coverage',()=>{
 const {review}=fixture();let reads=0;const input=clone(review);Object.defineProperty(input,'quote',{enumerable:true,get(){reads++;return review.quote;}});assert.throws(()=>normalizePaidOrderReview(input));assert.equal(reads,0);
 const getter={};Object.defineProperty(getter,'toJSON',{enumerable:true,get(){reads++;return ()=>({});}});assert.throws(()=>copyPaidOrderData(getter));assert.equal(reads,0);
 const cycle={};cycle.a=cycle;assert.throws(()=>copyPaidOrderData(cycle));assert.throws(()=>copyPaidOrderData('x'.repeat(300000)));assert.throws(()=>copyPaidOrderData(Array(5)));
 for(const change of [r=>r.extra=true,r=>r.quote.pricing.payments[1].lineIds=[],r=>r.quote.pricing.payments[0].amount.amountMinor='-1',r=>r.quote.lines[0].quantity=1.5,r=>r.definition.items[0].name='Misleading\u202e text',r=>r.quote.pricing.dueNow.amountMinor='1',r=>r.quote.lines.pop(),r=>r.quote.pricing.fractionDigits=5,r=>r.quote.expiresAt=r.quote.issuedAt]){const r=clone(review);change(r);assert.throws(()=>normalizePaidOrderReview(r));}
 const escaped=clone(review);escaped.definition.items[0].name='<img src=x onerror=alert(1)>';const html=renderPaidOrderReview(escaped,{idPrefix:'escaped'});assert.ok(html.includes('&lt;img'));assert.equal(new JSDOM(html).window.document.querySelectorAll('img').length,0);
 assert.throws(()=>renderPaidOrderReview(review,{idPrefix:'x'.repeat(91)}));assert.throws(()=>renderPaidOrderReview(review,{idPrefix:'ok',headingLevel:4}));
});

test('goods require an explicit product-specific guarantee assessment; every supplied label is verified against original bytes',async()=>{
 const f=fixture();for(const guarantee of [null,{status:'unresolved',disclosure:'Awaiting the producer.'}])assert.throws(()=>fixture({items:[{...f.definition.items[0],guarantee}]}));
 const draft=fixture({reviewStatus:'draft',items:f.definition.items.map(i=>i.kind==='goods'?{...i,guarantee:{status:'unresolved',disclosure:'Awaiting producer information.'}}:i)});assert.throws(()=>normalizePaidOrderReview(draft.review));assert.equal(normalizePaidOrderReview(draft.review,{allowPreview:true}).definition.reviewStatus,'draft');
 const options=JSON.parse(await readFile(new URL('../../../examples/guarantees/producer/config.json',import.meta.url),'utf8')),bytes=await readFile(new URL('../../../examples/guarantees/producer/juniper-jw-01.svg',import.meta.url)),built=buildDurabilityGuaranteeLabel(options,bytes),item={...f.definition.items[0],productId:built.label.product.id,guarantee:{status:'label-provided',label:built.label}};
 const d=createPaidOrderDefinition({...definitionInput(f.definition),reviewStatus:'draft',items:[item]},{allowPreview:true});
 assert.throws(()=>createPaidOrderReview(d,{...f.quote,definitionId:d.definitionId}));
 const quote={...f.quote,definitionId:d.definitionId,lines:[{itemId:'lamp',quantity:1}],pricing:{...f.quote.pricing,payments:[f.quote.pricing.payments[0]],totalPrice:fixed('12900'),dueNow:fixed('12900')}};
 assert.throws(()=>createPaidOrderReview(d,quote,{}, {allowPreview:true}),/original/);const assets={[built.label.asset.url]:bytes},review=createPaidOrderReview(d,quote,assets,{allowPreview:true});assert.deepEqual(verifyPaidOrderReview(review,assets,{allowPreview:true}),review);
 const corrupt=Buffer.from(bytes);corrupt[100]^=1;assert.throws(()=>verifyPaidOrderReview(review,{[built.label.asset.url]:corrupt},{allowPreview:true}));
 assert.throws(()=>createPaidOrderDefinition({...definitionInput(d),items:[{...item,productId:'different-model'}]},{allowPreview:true}));
 const {c,h}=action(review,{allowPreview:true}),dom=new JSDOM('<main></main>'),doc=dom.window.document,view=mountPaidOrderAction(doc.querySelector('main'),{action:c,idPrefix:'goods',allowPreview:true}),image=doc.querySelector('.nb-guarantee-artwork'),button=doc.querySelector('.nb-order-submit');assert.equal(button.disabled,true);
 image.dispatchEvent(new dom.window.Event('error'));assert.match(doc.querySelector('[role=status]').textContent,/could not be displayed/);await reject(c.submit(),'presentation-required');assert.equal(h.orders(),0);view.destroy();c.destroy();dom.window.close();
});

test('single deliberate action coalesces concurrent and reentrant calls and owns immutable snapshots',async()=>{
 const {review}=fixture(),{c,h}=action(review);await reject(c.submit(),'presentation-required');c.setPresentationReady(true);let reentrant;c.subscribe(s=>{if(s.status==='submitting')reentrant=c.submit();});c.subscribe(()=>{throw Error('Observer failure');});const a=c.submit(),b=c.submit();assert.equal(a,b);const result=await a;assert.equal(reentrant,a);assert.equal(h.orders(),1);assert.equal(result.status,'received');result.id='mutated';assert.notEqual(c.getSnapshot().outcome.id,'mutated');assert.equal((await c.submit()).status,'received');const own=c.getReview();own.quote.pricing.dueNow.amountMinor='0';assert.equal(c.getReview().quote.pricing.dueNow.amountMinor,'13500');c.destroy();
});

test('independent clients cannot admit the same checkout twice with different nonces',async()=>{
 const {review}=fixture(),h=host(review),a=createPaidOrderAction(review,{now:h.now,submit:h.transport}),b=createPaidOrderAction(review,{now:h.now,submit:h.transport});a.setPresentationReady(true);b.setPresentationReady(true);
 const outcomes=await Promise.all([a.submit(),b.submit()]);assert.equal(outcomes.filter(r=>r.status==='received').length,1);assert.equal(outcomes.filter(r=>r.reason==='checkout-used').length,1);assert.equal(h.orders(),1);a.destroy();b.destroy();
});

test('lost response stays uncertain; only the original attempt can reconcile, even after expiry',async()=>{
 const {review}=fixture(),h=host(review),sent=[],c=createPaidOrderAction(review,{now:h.now,submit:async request=>{sent.push(clone(request));await h.transport(request);throw Error('Response lost');},recoverAttempt:request=>{sent.push(clone(request));return h.transport(request);}});c.setPresentationReady(true);await reject(c.submit(),'uncertain');assert.equal(h.orders(),1);assert.equal(c.getSnapshot().status,'uncertain');const recovery=c.getRecoveryRequest();await reject(c.submit(),'reconciliation-required');h.setTime('2026-10-19T13:00:00.000Z');const received=await c.reconcile();assert.equal(received.status,'received');assert.deepEqual(sent[0],sent[1]);assert.equal(h.orders(),1);
 const resumed=createPaidOrderAction(review,{submit:h.transport,recoverAttempt:h.transport,recovery,now:h.now});assert.equal(resumed.getSnapshot().status,'uncertain');assert.deepEqual(await resumed.reconcile(),received);assert.throws(()=>createPaidOrderAction(review,{submit:h.transport,recovery:{...recovery,contextRef:'b'.repeat(64)}}));resumed.destroy();c.destroy();
});

test('stale local or host quotes fail closed and changed review digests never reach transport',async()=>{
 const {review}=fixture();for(const at of [expiry,'2026-10-18T00:00:00.000Z']){let calls=0;const c=createPaidOrderAction(review,{now:()=>new Date(at),submit:async()=>{calls++;}});c.setPresentationReady(true);await assert.rejects(c.submit());assert.equal(calls,0);c.destroy();}
 const {c,h}=action(review);c.setPresentationReady(true);h.revise();assert.equal((await c.submit()).status,'rejected');assert.equal(c.getSnapshot().status,'stale');assert.equal(h.orders(),0);c.destroy();
 for(const change of [r=>r.definition.wording.paymentActionLabel='Continue',r=>r.quote.revision='quote-2']){const changed=clone(review);change(changed);let calls=0;const c=createPaidOrderAction(changed,{now:()=>new Date(time),submit:async()=>{calls++;}});c.setPresentationReady(true);await reject(c.submit(),'unavailable');assert.equal(calls,0);assert.equal(c.getSnapshot().status,'unavailable');c.destroy();}
});

test('presentation is checked again immediately before dispatch, including DOM changes during digest work',async t=>{
 const {review}=fixture(),{c,h}=action(review);c.setPresentationReady(true);c.subscribe(s=>{if(s.status==='submitting'&&s.presentationReady)c.setPresentationReady(false);});await reject(c.submit(),'presentation-required');assert.equal(h.orders(),0);assert.equal(c.getSnapshot().status,'ready');c.destroy();
 const next=action(review),dom=new JSDOM('<main></main>'),doc=dom.window.document,view=mountPaidOrderAction(doc.querySelector('main'),{action:next.c,idPrefix:'race'});t.after(()=>{view.destroy();next.c.destroy();dom.window.close();});const pending=next.c.submit();doc.querySelector('.nb-order-money').textContent='No payment';await reject(pending,'presentation-required');assert.equal(next.h.orders(),0);
 const descriptor=Object.getOwnPropertyDescriptor(crypto,'randomUUID');Object.defineProperty(crypto,'randomUUID',{configurable:true,value:()=>{throw Error('No entropy');}});
 try{const f=action(review);f.c.setPresentationReady(true);await reject(f.c.submit(),'unavailable');assert.equal(f.c.getSnapshot().status,'unavailable');assert.equal(f.h.orders(),0);assert.equal(f.c.getRecoveryRequest(),undefined);f.c.destroy();}finally{if(descriptor)Object.defineProperty(crypto,'randomUUID',descriptor);else delete crypto.randomUUID;}
});

test('presentation guards cannot restore a destroyed controller or dispatch after revoking readiness',async()=>{
 const {review}=fixture();for(const atCall of [1,2,3]){const {c,h}=action(review);let checks=0;c.setPresentationReady(true,()=>{if(++checks===atCall)c.destroy();return true;});await reject(c.submit(),'destroyed');assert.equal(h.orders(),0);assert.equal(c.getSnapshot().status,'destroyed');}
 for(const atCall of [2,3]){const {c,h}=action(review);let checks=0;c.setPresentationReady(true,()=>{if(++checks===atCall)c.setPresentationReady(false);return true;});await reject(c.submit(),'presentation-required');assert.equal(h.orders(),0);assert.equal(c.getSnapshot().presentationReady,false);c.destroy();}
});

test('mismatched outcomes, timeouts and destroyed contexts preserve uncertainty without inventing success',async()=>{
 const {review}=fixture();for(const mutate of [r=>({...r,contextRef:'b'.repeat(64)}),r=>({...r,receivedAt:expiry}),r=>({...r,paid:true})]){const h=host(review),c=createPaidOrderAction(review,{now:h.now,submit:async request=>mutate(await h.transport(request))});c.setPresentationReady(true);await reject(c.submit(),'uncertain');assert.equal(c.getSnapshot().status,'uncertain');assert.ok(c.getRecoveryRequest());c.destroy();}
 const h=host(review);let late,receipt,signal;const c=createPaidOrderAction(review,{timeoutMs:100,now:h.now,submit:async(request,context)=>{signal=context.signal;receipt=await h.transport(request);return new Promise(resolve=>{late=resolve;});},recoverAttempt:h.transport});c.setPresentationReady(true);await reject(c.submit(),'uncertain');assert.equal(signal.aborted,true);await c.reconcile();late(receipt);await tick();assert.equal(c.getSnapshot().status,'received');assert.equal(h.orders(),1);c.destroy();
 let calls=0;const stopped=createPaidOrderAction(review,{now:h.now,submit:async()=>{calls++;}});stopped.setPresentationReady(true);stopped.subscribe(s=>{if(s.status==='submitting')stopped.destroy();});await reject(stopped.submit(),'destroyed');assert.equal(calls,0);assert.equal(stopped.getSnapshot().status,'destroyed');assert.ok(stopped.getRecoveryRequest());
});

test('mounted action uses the reviewed native button, keeps facts visible and rejects silent DOM substitution',async t=>{
 for(const tamper of ['none','facts','wording','aria']){const {review}=fixture(),{c,h}=action(review),dom=new JSDOM('<main></main>'),doc=dom.window.document,view=mountPaidOrderAction(doc.querySelector('main'),{action:c,idPrefix:'order'}),button=doc.querySelector('.nb-order-submit');assert.equal(button.disabled,false);assert.equal(button.textContent,'Order with obligation to pay');assert.equal(doc.querySelectorAll('input,details').length,0);assert.ok(button.compareDocumentPosition(doc.querySelector('.nb-order-total'))&dom.window.Node.DOCUMENT_POSITION_PRECEDING);
  if(tamper==='facts')doc.querySelector('.nb-order-money').textContent='Free';if(tamper==='wording')button.textContent='Continue';if(tamper==='aria')button.setAttribute('aria-label','Continue');t.after(()=>{view.destroy();c.destroy();dom.window.close();});button.click();if(tamper==='none')await until(()=>c.getSnapshot().status==='received');else await tick();assert.equal(h.orders(),tamper==='none'?1:0);if(tamper==='none'){assert.match(doc.querySelector('[role=status]').textContent,/Payment, fulfillment/);assert.equal(doc.activeElement,doc.querySelector('[role=status]'));}view.destroy();assert.notEqual(c.getSnapshot().status,'destroyed','host owns recovery lifecycle');c.destroy();dom.window.close();
 }
 const {review}=fixture(),h=host(review),c=createPaidOrderAction(review,{now:h.now,submit:async()=>{throw Error('Unavailable');}}),dom=new JSDOM('<main></main>'),view=mountPaidOrderAction(dom.window.document.querySelector('main'),{action:c,idPrefix:'unrecoverable'});await reject(c.submit(),'uncertain');assert.equal(dom.window.document.querySelector('.nb-order-reconcile').hidden,true,'do not offer a recovery action without a host recovery transport');view.destroy();c.destroy();dom.window.close();
});
