// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-DEMO-WORKSPACE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {serveOrderDemo} from '../order-demo.mjs';
import {createSyntheticStorage} from '../../packages/notabenda-cf/examples/synthetic.mjs';
import data from '../dist/server-data.json' with {type:'json'};
const origin='https://orders.example.test',generation='a'.repeat(64);
test('demo admission checks a current quote atomically and recovers original admission after expiry or release changes',async()=>{
 const storage=createSyntheticStorage([]);let at=new Date('2026-10-19T10:00:00.000Z');const templates=structuredClone(data.paidOrders),context={storage,generation,templates,now:()=>new Date(at),readBody:r=>r.json()},get=()=>serveOrderDemo(new Request(origin+'/demo/orders/deferred/quote'),context),review=await(await get()).json();
 const request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:generation},post=body=>serveOrderDemo(new Request(origin+'/demo/orders/deferred/submit',{method:'POST',body:JSON.stringify(body)}),context),received=await(await post(request)).json();assert.equal(received.status,'received');
 const second=await(await get()).json(),secondRequest={...request,requestId:crypto.randomUUID(),reviewId:second.reviewId,quoteId:second.quote.quoteId};assert.notEqual(second.quote.quoteId,review.quote.quoteId);
 at=new Date('2026-10-20T10:00:00.000Z');assert.deepEqual(await(await post(request)).json(),received,'idempotency precedes expiry');const used=await(await post({...request,requestId:crypto.randomUUID()})).json();assert.equal(used.reason,'checkout-used');const expired=await(await post(secondRequest)).json();assert.equal(expired.reason,'expired-quote');
 const current=await(await get()).json();assert.notEqual(current.quote.quoteId,review.quote.quoteId);const stale=await(await post({...secondRequest,requestId:crypto.randomUUID()})).json();assert.equal(stale.reason,'stale-quote');assert.deepEqual(await(await post(request)).json(),received);
 templates.deferred.definition.definitionId='b'.repeat(64);assert.deepEqual(await(await post(request)).json(),received,'retain original outcome across a changed definition');
 assert.equal((await storage.list({prefix:'demo/orders/received/',limit:200})).size,1);assert.equal((await post({...request,total:'1'})).status,400);assert.equal((await post({...request,contextRef:'f'.repeat(64)})).status,409);
});

test('admission reads its clock after awaited work and rejects an expired new attempt without backdating it',async()=>{
 const storage=createSyntheticStorage([]);let at=new Date('2026-10-19T10:00:00.000Z');const context={storage,generation,templates:data.paidOrders,now:()=>new Date(at),readBody:async r=>{at=new Date('2026-10-19T10:16:00.000Z');return r.json();}},review=await(await serveOrderDemo(new Request(origin+'/demo/orders/deferred/quote'),context)).json(),request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:generation};
 const response=await serveOrderDemo(new Request(origin+'/demo/orders/deferred/submit',{method:'POST',body:JSON.stringify(request)}),context);assert.equal((await response.json()).reason,'expired-quote');assert.equal((await storage.list({prefix:'demo/orders/received/',limit:200})).size,0);
});

test('interrupted quote publication rolls back its counter, retained review and active pointer together',async()=>{
 const storage=createSyntheticStorage([]),transaction=storage.transaction;let fail=true;
 storage.transaction=callback=>transaction.call(storage,tx=>callback({...tx,put:async(key,value)=>{if(fail&&key.startsWith('demo/orders/quotes/'))throw Error('Interrupted write');return tx.put(key,value);}}));
 const context={storage,generation,templates:data.paidOrders,now:()=>new Date('2026-10-19T10:00:00.000Z'),readBody:r=>r.json()},get=()=>serveOrderDemo(new Request(origin+'/demo/orders/deferred/quote'),context);
 await assert.rejects(get(),/Interrupted write/);assert.equal(await storage.get('demo/orders/active/deferred'),undefined);assert.equal(await storage.get('demo/orders/quote-count'),undefined);
 fail=false;const review=await(await get()).json();assert.deepEqual(await storage.get('demo/orders/quotes/'+review.quote.quoteId),review);assert.equal(await storage.get('demo/orders/quote-count'),1);
});

test('distinct request nonces against one quote admit at most one demo order',async()=>{
 const storage=createSyntheticStorage([]),context={storage,generation,templates:data.paidOrders,now:()=>new Date('2026-10-19T10:00:00.000Z'),readBody:r=>r.json()},review=await(await serveOrderDemo(new Request(origin+'/demo/orders/mixed/quote'),context)).json(),request={schemaVersion:1,reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:generation};
 const responses=await Promise.all([1,2].map(()=>serveOrderDemo(new Request(origin+'/demo/orders/mixed/submit',{method:'POST',body:JSON.stringify({...request,requestId:crypto.randomUUID()})}),context))),outcomes=await Promise.all(responses.map(r=>r.json()));assert.equal(outcomes.filter(r=>r.status==='received').length,1);assert.equal(outcomes.filter(r=>r.reason==='checkout-used').length,1);assert.equal((await storage.list({prefix:'demo/orders/received/',limit:200})).size,1);
});
