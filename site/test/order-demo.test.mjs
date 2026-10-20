// @requirements REQ-PRODUCT-ORDER-CONFIRMATION
// @requirements REQ-EU-ORDER-CONFIRMATION
// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-DEMO-WORKSPACE
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {readPaidOrderReview} from '@notabenda/cloudflare/orders';
const readAsset=asset=>readFile(new URL('../dist/public'+asset.url,import.meta.url));
import assert from 'node:assert/strict';
import {serveOrderDemo} from '../order-demo.mjs';
import {serveLegacyOrderDemo} from '../order-demo-legacy.mjs';
import {orderDemoAdmin,createOrderDemoStore} from '../order-demo-admin.mjs';
import {readRecordPage} from '../../packages/notabenda-cf/dist/export.js';
import {createSyntheticStorage} from '../../packages/notabenda-cf/examples/synthetic.mjs';
import data from '../dist/server-data.json' with {type:'json'};
const origin='https://orders.example.test',generation='a'.repeat(64);
// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
test('combined order search preserves bounded continuations beyond old row caps and across both key spaces',async()=>{
 const storage=createSyntheticStorage([]),context={storage,generation,readAsset,templates:data.paidOrders,readBody:r=>r.json()},review=await(await serveOrderDemo(new Request(origin+'/demo/orders/deferred/quote'),context)).json();
 const request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef};
 const current=await(await serveOrderDemo(new Request(origin+'/demo/orders/deferred/submit',{method:'POST',body:JSON.stringify(request)}),context)).json();assert.equal(current.status,'received');
 const legacyIds=[];for(let i=1;i<=201;i++){const id=i.toString(16).padStart(64,'0');legacyIds.push(id);await storage.put('demo/orders/received/'+id,{review,request:{contextRef:'legacy-session',note:i===201?'unique-last-legacy':'ordinary'},receivedAt:'2026-10-18T12:00:00.000Z'});}
 const store=createOrderDemoStore(storage),base={query:'unique-last-legacy',kind:'',keyPrefix:'',from:'',to:'',limit:3};let after,segments=0,found=[];
 do{const page=await readRecordPage(store,{...base,...(after?{after}:{})});assert.ok(page.scanned<=100);segments++;found.push(...page.records.map(r=>r.id));after=page.nextAfter;}while(after&&segments<20);
 assert.equal(after,undefined);assert.ok(segments>=5);assert.deepEqual(found,[legacyIds.at(-1)]);
 after=undefined;const all=[];do{const page=await readRecordPage(store,{...base,query:'',limit:50,...(after?{after}:{})});all.push(...page.records.map(r=>r.id));after=page.nextAfter;}while(after&&all.length<300);
 assert.equal(after,undefined);assert.equal(new Set(all).size,202);assert.ok(all.includes(current.id));assert.deepEqual(all,[...all].sort());
 const prefixed=await readRecordPage(store,{...base,keyPrefix:legacyIds.at(-1)});assert.deepEqual(prefixed.records.map(r=>r.id),[legacyIds.at(-1)]);
});
test('demo admission checks a current quote atomically and recovers original admission after expiry or release changes',async()=>{
 const storage=createSyntheticStorage([]);let at=new Date('2026-10-19T10:00:00.000Z');const templates=structuredClone(data.paidOrders),context={storage,generation,readAsset,templates,now:()=>new Date(at),readBody:r=>r.json()},get=()=>serveOrderDemo(new Request(origin+'/demo/orders/deferred/quote'),context),review=await(await get()).json();
 const request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef},post=body=>serveOrderDemo(new Request(origin+'/demo/orders/deferred/submit',{method:'POST',body:JSON.stringify(body)}),context),received=await(await post(request)).json();assert.equal(received.status,'received');
 const second=await(await get()).json(),secondRequest={...request,requestId:crypto.randomUUID(),reviewId:second.reviewId,quoteId:second.quote.quoteId,contextRef:second.quote.contextRef};assert.notEqual(second.quote.quoteId,review.quote.quoteId);
 at=new Date('2026-10-20T10:00:00.000Z');assert.deepEqual(await(await post(request)).json(),received,'idempotency precedes expiry');const used=await(await post({...request,requestId:crypto.randomUUID()})).json();assert.equal(used.reason,'checkout-used');const expired=await(await post(secondRequest)).json();assert.equal(expired.reason,'expired-quote');
 const current=await(await get()).json();assert.notEqual(current.quote.quoteId,review.quote.quoteId);const stale=await(await post({...secondRequest,requestId:crypto.randomUUID()})).json();assert.equal(stale.reason,'stale-quote');assert.deepEqual(await(await post(request)).json(),received);
 templates.deferred.definition.definitionId='b'.repeat(64);assert.deepEqual(await(await post(request)).json(),received,'retain original outcome across a changed definition');
 assert.equal((await storage.list({prefix:'notabenda/orders/juniper-order-example/events/',limit:200})).size,1);assert.equal((await post({...request,total:'1'})).status,400);assert.equal((await post({...request,contextRef:'f'.repeat(64)})).status,409);
});

test('admission reads its clock after awaited work and rejects an expired new attempt without backdating it',async()=>{
 const storage=createSyntheticStorage([]);let at=new Date('2026-10-19T10:00:00.000Z');const context={storage,generation,readAsset,templates:data.paidOrders,now:()=>new Date(at),readBody:async r=>{at=new Date('2026-10-19T10:16:00.000Z');return r.json();}},review=await(await serveOrderDemo(new Request(origin+'/demo/orders/deferred/quote'),context)).json(),request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef};
 const response=await serveOrderDemo(new Request(origin+'/demo/orders/deferred/submit',{method:'POST',body:JSON.stringify(request)}),context);assert.equal((await response.json()).reason,'expired-quote');assert.equal((await storage.list({prefix:'notabenda/orders/juniper-order-example/events/',limit:200})).size,0);
});

test('interrupted quote publication rolls back its counter, retained review and active pointer together',async()=>{
 const storage=createSyntheticStorage([]),transaction=storage.transaction;let fail=true;
 storage.transaction=callback=>transaction.call(storage,tx=>callback({...tx,put:async(key,value)=>{if(fail&&key.includes('/reviews/'))throw Error('Interrupted write');return tx.put(key,value);}}));
 const context={storage,generation,readAsset,templates:data.paidOrders,now:()=>new Date('2026-10-19T10:00:00.000Z'),readBody:r=>r.json()},get=()=>serveOrderDemo(new Request(origin+'/demo/orders/deferred/quote'),context);
 await assert.rejects(get(),/Interrupted write/);assert.equal(await storage.get('demo/orders/v2/current/deferred'),undefined);assert.equal(await storage.get('demo/orders/quote-count'),undefined);
 fail=false;const review=await(await get()).json();const selected=await storage.get('demo/orders/v2/contexts/'+review.quote.contextRef);assert.deepEqual(await readPaidOrderReview(storage,review.reviewId,{siteId:'juniper-order-example',scopeId:'checkout',checkoutId:selected.checkoutId,allowPreview:true}),review);assert.equal(await storage.get('demo/orders/quote-count'),1);
});

test('distinct request nonces against one quote admit at most one demo order',async()=>{
 const storage=createSyntheticStorage([]),context={storage,generation,readAsset,templates:data.paidOrders,now:()=>new Date('2026-10-19T10:00:00.000Z'),readBody:r=>r.json()},review=await(await serveOrderDemo(new Request(origin+'/demo/orders/mixed/quote'),context)).json(),request={schemaVersion:1,reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef};
 const responses=await Promise.all([1,2].map(()=>serveOrderDemo(new Request(origin+'/demo/orders/mixed/submit',{method:'POST',body:JSON.stringify({...request,requestId:crypto.randomUUID()})}),context))),outcomes=await Promise.all(responses.map(r=>r.json()));assert.equal(outcomes.filter(r=>r.status==='received').length,1);assert.equal(outcomes.filter(r=>r.reason==='checkout-used').length,1);assert.equal((await storage.list({prefix:'notabenda/orders/juniper-order-example/events/',limit:200})).size,1);
});

test('a pre-archive request keeps its exact outcome and inspector alongside new reusable archives after upgrade',async()=>{
 const storage=createSyntheticStorage([]);let at=new Date('2026-10-19T10:00:00.000Z');const context={storage,generation,readAsset,templates:data.paidOrders,now:()=>new Date(at),readBody:r=>r.json()},get=new Request(origin+'/demo/orders/deferred/quote'),legacy=await(await serveLegacyOrderDemo(get,context)).json(),request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:legacy.reviewId,definitionId:legacy.definition.definitionId,quoteId:legacy.quote.quoteId,quoteRevision:legacy.quote.revision,contextRef:legacy.quote.contextRef},post=body=>new Request(origin+'/demo/orders/deferred/submit',{method:'POST',body:JSON.stringify(body)}),receipt=await(await serveLegacyOrderDemo(post(request),context)).json(),before=await storage.get('demo/orders/received/'+receipt.id);
 const modern=await(await serveOrderDemo(get,context)).json();assert.notEqual(modern.quote.contextRef,generation);at=new Date('2026-10-20T10:00:00.000Z');assert.deepEqual(await(await serveOrderDemo(post(request),context)).json(),receipt);assert.deepEqual(await storage.get('demo/orders/received/'+receipt.id),before);
 const detail=await orderDemoAdmin(new Request(origin+'/demo/admin/orders/record?id='+receipt.id),storage);assert.equal(detail.status,200);assert.match(await detail.text(),/Information presented/);const list=await orderDemoAdmin(new Request(origin+'/demo/admin/orders'),storage);assert.equal(list.status,200);assert.match(await list.text(),new RegExp(receipt.id));
});
test('confirmation examples seed once, keep complete private customer files and expose separate pending/uncertain/accepted histories',async()=>{
 const {seedOrderConfirmations}=await import('../order-confirmation-seed.mjs'),{createPaidOrderStore}=await import('@notabenda/cloudflare/orders'),storage=createSyntheticStorage([]);await seedOrderConfirmations(storage,data);await seedOrderConfirmations(storage,data);const store=createPaidOrderStore(storage,{siteId:'juniper-order-example',scopeId:'checkout',allowPreview:true}),page=await store.list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50});assert.equal(page.records.length,3);assert.deepEqual(page.records.map(r=>r.data.confirmationDelivery.status).sort(),['accepted','pending','uncertain']);
 const id=page.records[0].id,response=await orderDemoAdmin(new Request(origin+'/demo/admin/orders/order-confirmation?id='+id),storage);assert.equal(response.status,200);assert.match(await response.text(),/Customer copy/);const archive=await store.getOrderConfirmation(id),file=archive.manifest.files.find(f=>f.role==='confirmation'),download=await orderDemoAdmin(new Request(origin+'/demo/admin/orders/order-confirmation-file?id='+id+'&file='+file.id),storage);assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/attachment/);assert.deepEqual(new Uint8Array(await download.arrayBuffer()),await store.getOrderConfirmationFile(id,file.id));assert.equal(JSON.stringify(page.records).includes('destinationVersion'),false);
});
test('interrupted confirmation demo seeding rolls back its active sample and resumes without duplicates',async()=>{
 const {seedOrderConfirmations}=await import('../order-confirmation-seed.mjs'),storage=createSyntheticStorage([]),transaction=storage.transaction;let fail=true;storage.transaction=callback=>transaction.call(storage,tx=>callback({...tx,async put(key,value){if(fail&&key.endsWith('confirmation/delivery'))throw Error('Seed interrupted');return tx.put(key,value);}}));await assert.rejects(seedOrderConfirmations(storage,data),/Seed interrupted/);assert.equal((await storage.list({prefix:'notabenda/orders/',limit:100})).size,0);fail=false;await seedOrderConfirmations(storage,data);await seedOrderConfirmations(storage,data);assert.equal((await storage.list({prefix:'notabenda/orders/juniper-order-example/events/',limit:100})).size,3);
});
