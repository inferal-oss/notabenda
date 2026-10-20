// @requirements REQ-PRODUCT-CF-ADMIN
// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createPaidOrderDefinition,createPaidOrderReview} from '@notabenda/authoring/orders';
import {buildDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';
import {archivePaidOrderAsset,archivePaidOrderReview,activatePaidOrderReview,admitPaidOrder,getPaidOrderAttempt,getPaidOrderCheckoutState,readPaidOrderReview,readPaidOrderAsset,createPaidOrderStore,paidOrderCheckoutRef} from '@notabenda/cloudflare/orders';
import {createEvidenceLifecycle,recordLegalRelease,createAdminWorker,createEvidenceExportSegment} from '@notabenda/cloudflare';
import {compileLegalDocuments} from '@notabenda/core/content';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {canonicalJson,sha256} from '../dist/history.js';
import {copyPaidOrderData} from '@notabenda/core/orders';
import postcss from 'postcss';
import {orderReviewCss} from '../dist/order-review-style.js';
const reject=(promise,code)=>assert.rejects(promise,e=>e.code===code),fixed=amountMinor=>({kind:'fixed',amountMinor}),query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};
const time='2026-10-19T12:00:00.000Z',expiry='2026-10-19T12:15:00.000Z';
const service={id:'planning',productId:'workspace-planning',name:'Workspace planning',kind:'service',characteristics:['One remote planning appointment.'],commitment:{duration:'One appointment.',termination:'No renewal; reviewed withdrawal terms apply.',minimum:'One appointment.'},guarantee:null};
async function setup({storage=createSyntheticStorage([]),checkoutId='host-intent-one',scopeId='checkout',preview=false,items=[service],documents=[],assets={}}={}){
 const clock={at:time},context={siteId:'order-shop',scopeId,checkoutId,now:()=>new Date(clock.at),allowPreview:preview},ref=await paidOrderCheckoutRef(context),definition=createPaidOrderDefinition({profile:'eu-paid-distance-order-v1',siteId:context.siteId,locale:'en',direction:'ltr',reviewStatus:preview?'draft':'reviewed',items,documents},{allowPreview:preview}),quote={quoteId:'quote-1',revision:'one',contextRef:ref,definitionId:definition.definitionId,issuedAt:time,expiresAt:expiry,lines:items.map(i=>({itemId:i.id,quantity:1})),pricing:{currency:'EUR',fractionDigits:2,payments:[{id:'all-items',lineIds:items.map(i=>i.id),label:'Order price',amount:fixed('12900'),due:{kind:'now'},recurrence:{kind:'once'}}],totalPrice:fixed('12900'),dueNow:fixed('12900'),taxAndChargesNotice:'VAT and standard delivery included.'}},review=createPaidOrderReview(definition,quote,assets, {allowPreview:preview}),prefix=`notabenda/orders/${context.siteId}/`,base=prefix+'intents/'+ref+'/',request={schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:definition.definitionId,quoteId:quote.quoteId,quoteRevision:quote.revision,contextRef:ref};
 const options={hostPrefix:'shop/stock/',async decide({get}){const remaining=await get('lamp')??4;return remaining>0?{status:'admit',writes:[{key:'lamp',value:remaining-1}]}:{status:'reject',reason:'unavailable'};}};
 return {storage,clock,context,ref,definition,quote,review,prefix,base,request,options};
}
async function ready(f){await archivePaidOrderReview(f.storage,f.review,f.context);return activatePaidOrderReview(f.storage,{reviewId:f.review.reviewId,expectedRevision:0},f.context);}
async function goods(){const config=JSON.parse(await readFile(new URL('../../../examples/guarantees/producer/config.json',import.meta.url),'utf8')),bytes=await readFile(new URL('../../../examples/guarantees/producer/juniper-jw-01.svg',import.meta.url)),built=buildDurabilityGuaranteeLabel(config,bytes);return {bytes,label:built.label,item:{...service,id:'lamp',productId:built.label.product.id,name:built.label.product.name,kind:'goods',guarantee:{status:'label-provided',label:built.label}}};}

test('standalone copied policies stay identical to the frontend validators',()=>{const result=spawnSync(process.execPath,['packages/notabenda-cf/scripts/sync-order-policy.mjs','--check'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);});

test('admin review rules preserve every public component declaration and media condition outside its layer',async()=>{
 const publicCss=(await Promise.all(['orders.css','guarantees.css'].map(name=>readFile(new URL('../../notabenda/src/'+name,import.meta.url),'utf8')))).join('\n'),rules=css=>{const result=[];postcss.parse(css).walkRules(rule=>{const conditions=[];let parent=rule.parent;while(parent){if(parent.type==='atrule'&&parent.name!=='layer')conditions.unshift([parent.name,parent.params]);parent=parent.parent;}result.push({selector:rule.selector,conditions,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])});});return result;};
 assert.doesNotMatch(orderReviewCss,/@layer /);assert.deepEqual(rules(orderReviewCss),rules(publicCss));
});

test('archival, activation and admission are separate; one host decision atomically consumes one intent',async()=>{
 const f=await setup();assert.deepEqual(await archivePaidOrderReview(f.storage,f.review,f.context),{reviewId:f.review.reviewId,created:true});assert.deepEqual(await archivePaidOrderReview(f.storage,f.review,f.context),{reviewId:f.review.reviewId,created:false});
 const inactive=await admitPaidOrder(f.storage,f.request,f.context,f.options);assert.equal(inactive.reason,'stale-quote');assert.equal(await f.storage.get('shop/stock/lamp'),undefined);
 const activation=await activatePaidOrderReview(f.storage,{reviewId:f.review.reviewId,expectedRevision:0},f.context);assert.equal(activation.revision,1);assert.deepEqual(await activatePaidOrderReview(f.storage,{reviewId:f.review.reviewId,expectedRevision:0},f.context),activation);
 const request={...f.request,requestId:crypto.randomUUID()},[receipt,duplicate]=await Promise.all([admitPaidOrder(f.storage,request,f.context,f.options),admitPaidOrder(f.storage,request,f.context,f.options)]);assert.deepEqual(receipt,duplicate);assert.equal(receipt.status,'received');assert.equal(await f.storage.get('shop/stock/lamp'),3);assert.equal((await f.storage.list({prefix:f.prefix+'events/',limit:50})).size,1);
 assert.equal((await admitPaidOrder(f.storage,{...request,requestId:crypto.randomUUID()},f.context,f.options)).reason,'checkout-used');assert.equal(await f.storage.get('shop/stock/lamp'),3);await reject(activatePaidOrderReview(f.storage,{reviewId:f.review.reviewId,expectedRevision:1},f.context),'checkout-used');
});

test('competing nonces and quote activation races admit one checkout across revisions',async()=>{
 const f=await setup();await ready(f);const newerQuote={...f.quote,quoteId:'quote-2',revision:'two'},newer=createPaidOrderReview(f.definition,newerQuote);await archivePaidOrderReview(f.storage,newer,f.context);
 const outcomes=await Promise.all([admitPaidOrder(f.storage,f.request,f.context,f.options),admitPaidOrder(f.storage,{...f.request,requestId:crypto.randomUUID()},f.context,f.options)]);assert.equal(outcomes.filter(r=>r.status==='received').length,1);assert.equal(outcomes.filter(r=>r.reason==='checkout-used').length,1);await reject(activatePaidOrderReview(f.storage,{reviewId:newer.reviewId,expectedRevision:1},f.context),'checkout-used');
 const g=await setup();await ready(g);const next=createPaidOrderReview(g.definition,{...g.quote,quoteId:'next',revision:'two'});await archivePaidOrderReview(g.storage,next,g.context);await activatePaidOrderReview(g.storage,{reviewId:next.reviewId,expectedRevision:1},g.context);assert.equal((await admitPaidOrder(g.storage,g.request,g.context,g.options)).reason,'stale-quote');await reject(activatePaidOrderReview(g.storage,{reviewId:g.review.reviewId,expectedRevision:2},g.context),'revision-conflict');await reject(activatePaidOrderReview(g.storage,{reviewId:next.reviewId,expectedRevision:0},g.context),'revision-conflict');
});

test('exact result recovery precedes clock/activation/host decision checks and conflicts never mutate stock',async()=>{
 const f=await setup();await ready(f);let decisions=0;const options={...f.options,async decide(input){decisions++;return f.options.decide(input);}},receipt=await admitPaidOrder(f.storage,f.request,f.context,options);f.clock.at='2030-01-01T00:00:00.000Z';
 assert.deepEqual(await admitPaidOrder(f.storage,f.request,f.context,options),receipt);assert.deepEqual(await getPaidOrderAttempt(f.storage,f.request,f.context),receipt);assert.equal(decisions,1);await reject(getPaidOrderAttempt(f.storage,{...f.request,quoteRevision:'other'},f.context),'idempotency-conflict');assert.equal(await getPaidOrderAttempt(f.storage,{...f.request,requestId:crypto.randomUUID()},f.context),undefined);
 const wrong={...f.context,checkoutId:'other-intent'};await reject(getPaidOrderAttempt(f.storage,f.request,wrong),'invalid-request');assert.equal(await f.storage.get('shop/stock/lamp'),3);
});

test('host decision plans are confined, applied only on admission, and rolled back with a failed receipt write',async()=>{
 const f=await setup();await ready(f);const failures=[{hostPrefix:f.prefix,decide:f.options.decide},{...f.options,decide:async()=>({status:'admit',writes:[{key:'../outside',value:1}]})},{...f.options,decide:async()=>({status:'admit',writes:[{key:'lamp',value:1},{key:'lamp',value:2}]})},{...f.options,decide:async()=>({status:'admit',writes:[{key:'lamp',value:'x'.repeat(40000)}]})}];
 for(const options of failures)await reject(admitPaidOrder(f.storage,f.request,f.context,options),'invalid-decision');assert.equal(await f.storage.get('shop/stock/lamp'),undefined);
 const transaction=f.storage.transaction;f.storage.transaction=callback=>transaction.call(f.storage,tx=>callback({...tx,async put(key,value){if(key.includes('/events/'))throw Error('Interrupted admission');return tx.put(key,value);}}));await assert.rejects(admitPaidOrder(f.storage,f.request,f.context,f.options),/Interrupted admission/);assert.equal(await f.storage.get('shop/stock/lamp'),undefined);assert.equal(await f.storage.get(f.base+'consumed'),undefined);assert.equal(await getPaidOrderAttempt(f.storage,f.request,f.context),undefined);
 f.storage.transaction=transaction;assert.equal((await admitPaidOrder(f.storage,f.request,f.context,f.options)).status,'received');assert.equal(await f.storage.get('shop/stock/lamp'),3);
});

test('clock is rechecked after awaited host work and expired decisions cannot commit reservations',async()=>{
 const f=await setup();await ready(f);const result=await admitPaidOrder(f.storage,f.request,f.context,{...f.options,async decide({get}){await get('lamp');f.clock.at=expiry;return {status:'admit',writes:[{key:'lamp',value:0}]};}});assert.equal(result.reason,'expired-quote');assert.equal(await f.storage.get('shop/stock/lamp'),undefined);assert.equal(await f.storage.get(f.base+'consumed'),undefined);
});

test('original producer files and large reviews are chunked, immutable, bounded and verified on reconstruction',async()=>{
 const g=await goods(),f=await setup({preview:true});const definition=createPaidOrderDefinition({...Object.fromEntries(Object.entries(f.definition).filter(([k])=>!['schemaVersion','kind','renderingPolicy','definitionId'].includes(k))),items:[g.item]},{allowPreview:true}),review=createPaidOrderReview(definition,{...f.quote,definitionId:definition.definitionId,lines:[{itemId:'lamp',quantity:1}],pricing:{...f.quote.pricing,payments:[{...f.quote.pricing.payments[0],lineIds:['lamp']}]}},{[g.label.asset.url]:g.bytes},{allowPreview:true});
 await reject(archivePaidOrderReview(f.storage,review,f.context),'invalid-record');assert.deepEqual(await archivePaidOrderAsset(f.storage,g.label,g.bytes,f.context),{sha256:g.label.asset.sha256,created:true});assert.equal((await archivePaidOrderAsset(f.storage,g.label,g.bytes,f.context)).created,false);await archivePaidOrderReview(f.storage,review,f.context);assert.deepEqual(await readPaidOrderAsset(f.storage,g.label.asset.sha256,f.context),new Uint8Array(g.bytes));assert.deepEqual(await readPaidOrderReview(f.storage,review.reviewId,f.context),review);
 const chunks=await f.storage.list({prefix:f.base+'assets/'+g.label.asset.sha256+'/chunks/',limit:100});assert.ok(chunks.size>1);for(const bytes of chunks.values())assert.ok(bytes.byteLength<=65536);const [key,bytes]=[...chunks][0];bytes[0]^=1;await f.storage.put(key,bytes);await reject(readPaidOrderAsset(f.storage,g.label.asset.sha256,f.context),'invalid-record');await reject(activatePaidOrderReview(f.storage,{reviewId:review.reviewId,expectedRevision:0},f.context),'invalid-record');
 const items=Array.from({length:24},(_,n)=>({...service,id:'item-'+n,productId:'product-'+n,characteristics:Array.from({length:10},()=>('Reviewed characteristic. '+String(n)+' ').padEnd(600,'x'))})),large=await setup({items});assert.ok(new TextEncoder().encode(JSON.stringify(large.review)).length>131072);await ready(large);assert.deepEqual(await readPaidOrderReview(large.storage,large.review.reviewId,large.context),large.review);assert.equal((await admitPaidOrder(large.storage,large.request,large.context,large.options)).status,'received');const store=createPaidOrderStore(large.storage,{siteId:large.context.siteId,scopeId:large.context.scopeId});assert.equal((await store.list(query)).records.length,1);
});

test('original bytes are detached immediately; interrupted asset and review publication leave no sealed partial archive',async()=>{
 const g=await goods(),f=await setup({preview:true}),bytes=Uint8Array.from(g.bytes),pending=archivePaidOrderAsset(f.storage,g.label,bytes,f.context);bytes.fill(0);await pending;assert.deepEqual(await readPaidOrderAsset(f.storage,g.label.asset.sha256,f.context),new Uint8Array(g.bytes));
 const next=await setup(),input=structuredClone(next.review),archival=archivePaidOrderReview(next.storage,input,next.context);input.definition.wording.paymentActionLabel='Continue';await archival;assert.deepEqual(await readPaidOrderReview(next.storage,next.review.reviewId,next.context),next.review);
 const other=await setup({preview:true}),transaction=other.storage.transaction;other.storage.transaction=callback=>transaction.call(other.storage,tx=>callback({...tx,async put(key,value){if(key.endsWith('manifest'))throw Error('Interrupted seal');return tx.put(key,value);}}));await assert.rejects(archivePaidOrderAsset(other.storage,g.label,g.bytes,other.context),/Interrupted seal/);assert.equal((await other.storage.list({prefix:other.base,limit:100})).size,0);
});

test('pinned document metadata must match an existing immutable legal release',async()=>{
 const config=await fixture({reviewed:true});config.site.id='order-shop';const build=compileLegalDocuments(config),doc=build.manifest.documents.find(d=>d.kind==='terms'),f=await setup({documents:[{kind:'terms',title:doc.title,version:doc.version,artifactId:build.manifest.artifactId,sha256:doc.sha256,url:'/artifacts/'+build.manifest.artifactId+'/terms.html'}]});
 await reject(archivePaidOrderReview(f.storage,f.review,f.context),'invalid-review');await recordLegalRelease(f.storage,build.artifact);await ready(f);assert.equal((await admitPaidOrder(f.storage,f.request,f.context,f.options)).status,'received');
});

test('production cannot promote preview legal releases or read an artifact through a different archive key',async()=>{
 const config=await fixture();config.site.id='order-shop';const build=compileLegalDocuments(config,{mode:'preview'}),doc=build.manifest.documents.find(d=>d.kind==='terms'),documents=[{kind:'terms',title:doc.title,version:doc.version,artifactId:build.manifest.artifactId,sha256:doc.sha256,url:'/artifacts/'+build.manifest.artifactId+'/terms.html'}],f=await setup({documents});
 await recordLegalRelease(f.storage,build.artifact);await reject(archivePaidOrderReview(f.storage,f.review,f.context),'invalid-review');
 const preview={...f.context,allowPreview:true};await archivePaidOrderReview(f.storage,f.review,preview);await reject(activatePaidOrderReview(f.storage,{reviewId:f.review.reviewId,expectedRevision:0},f.context),'invalid-review');await activatePaidOrderReview(f.storage,{reviewId:f.review.reviewId,expectedRevision:0},preview);await reject(admitPaidOrder(f.storage,f.request,f.context,f.options),'invalid-review');assert.equal((await admitPaidOrder(f.storage,f.request,preview,f.options)).status,'received');
 const wrong='a'.repeat(64),g=await setup({documents:documents.map(d=>({...d,artifactId:wrong,url:d.url.replace(d.artifactId,wrong)}))});await recordLegalRelease(g.storage,build.artifact);await g.storage.put('notabenda/releases/'+wrong,await g.storage.get('notabenda/releases/'+build.manifest.artifactId));await reject(archivePaidOrderReview(g.storage,g.review,{...g.context,allowPreview:true}),'invalid-review');
});

test('every descriptor sharing original bytes must agree on length, dimensions and media type',async()=>{
 const g=await goods();
 for(const changes of [{bytes:g.label.asset.bytes+1},{width:g.label.asset.width+1},{height:g.label.asset.height+1},{mediaType:'image/png',url:g.label.asset.url.replace(/\.svg$/u,'.png')}]){
  const f=await setup({preview:true}),label=structuredClone(g.label);Object.assign(label.asset,changes);const {labelId,...descriptor}=label;label.labelId=await sha256(canonicalJson(descriptor));
  const definition=createPaidOrderDefinition({...Object.fromEntries(Object.entries(f.definition).filter(([k])=>!['schemaVersion','kind','renderingPolicy','definitionId'].includes(k))),items:[g.item,{...g.item,id:'lamp-two',guarantee:{status:'label-provided',label}}]},{allowPreview:true}),review={...f.review,definition,quote:{...f.quote,definitionId:definition.definitionId,lines:[{itemId:'lamp',quantity:1},{itemId:'lamp-two',quantity:1}],pricing:{...f.quote.pricing,payments:[{...f.quote.pricing.payments[0],lineIds:['lamp','lamp-two']}]}}};
  const {reviewId,...content}=review;review.reviewId=await sha256(canonicalJson(content));await archivePaidOrderAsset(f.storage,g.label,g.bytes,f.context);await reject(archivePaidOrderReview(f.storage,review,f.context),'invalid-asset');assert.equal(await f.storage.get(f.base+'review-count'),undefined);
 }
});

test('retirement rejects coerced or pending confirmation states',async()=>{
 const f=await setup();await ready(f);const receipt=await admitPaidOrder(f.storage,f.request,f.context,f.options),key=f.prefix+'events/'+f.context.scopeId+'/'+receipt.id,event=await f.storage.get(key),lifecycle=await createEvidenceLifecycle(f.storage,{family:'orders',siteId:f.context.siteId,scopeId:f.context.scopeId,streamId:f.context.checkoutId},{now:()=>new Date(time)}),decision={requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:time,legalHold:false,externalWorkStopped:true};
 for(const status of [['accepted'],'pending','uncertain',true,null]){await f.storage.put(key,{...event,confirmation:{status}});await reject(lifecycle.retire(decision),'pending-delivery');assert.equal(await lifecycle.getState(),undefined);}
 await f.storage.put(key,event);assert.equal((await lifecycle.retire(decision)).phase,'purging');
});

test('site/scoped search stays small and disjoint while retained review and original file access require the host context',async()=>{
 const storage=createSyntheticStorage([]),a=await setup({storage,scopeId:'shop-a'}),b=await setup({storage,scopeId:'shop-b'});for(const f of [a,b]){await ready(f);await admitPaidOrder(f.storage,f.request,f.context,f.options);}
 const site=createPaidOrderStore(storage,{siteId:a.context.siteId}),all=await site.list(query);assert.equal(all.records.length,2);for(const record of all.records){assert.ok(record.id.includes('/'));assert.equal(Object.hasOwn(record.data,'review'),false);assert.equal(Object.hasOwn(record.data,'assets'),false);assert.equal(record.data.payment.status,'not-reported');}
 const scoped=createPaidOrderStore(storage,{siteId:a.context.siteId,scopeId:'shop-a'}),page=await scoped.list({...query,query:'Workspace planning'});assert.equal(page.records.length,1);assert.equal(page.records[0].data.scopeId,'shop-a');assert.deepEqual(await scoped.get(page.records[0].id),page.records[0]);await reject(scoped.get('shop-b/'+page.records[0].id),'invalid-request');assert.deepEqual((await site.getOrderArchive('shop-a/'+page.records[0].id)).review,a.review);assert.equal(await scoped.getOrderArchive(all.records.find(r=>r.data.scopeId==='shop-b').data.id),undefined);
 assert.deepEqual(await getPaidOrderCheckoutState(storage,a.context),{revision:1,reviewId:a.review.reviewId,admissionId:page.records[0].id});
});

test('admin review and originals need separate per-request permission and remain bound to one scoped admission',async()=>{
 const g=await goods(),f=await setup({preview:true,items:[g.item],assets:{[g.label.asset.url]:g.bytes}}),review=createPaidOrderReview(f.definition,f.quote,{[g.label.asset.url]:g.bytes},{allowPreview:true});f.review=review;await archivePaidOrderAsset(f.storage,g.label,g.bytes,f.context);await ready(f);const receipt=await admitPaidOrder(f.storage,f.request,f.context,f.options),store=createPaidOrderStore(f.storage,{...f.context}),base='/admin/notabenda',request=(path,method='GET')=>new Request('https://shop.example'+base+path,{method});
 let permission=false,authCalls=0,archiveReads=0;const wrapped={...store,async getOrderArchive(id){archiveReads++;return store.getOrderArchive(id);}},worker=createAdminWorker({authorize:()=>{authCalls++;return {store:wrapped,allowOrderArchive:permission,allowExport:true};}}),id=receipt.id,asset=g.label.asset.sha256,paths=['/order-review?id='+id,'/order-review.json?id='+id,'/order-asset?id='+id+'&sha256='+asset,'/order-image?id='+id+'&sha256='+asset];
 for(const path of paths)assert.equal((await worker.fetch(request(path),{})).status,403);assert.equal(archiveReads,0);
 permission=true;const detail=await worker.fetch(request('/record?id='+id),{}),detailHtml=await detail.text();assert.match(detailHtml,/Inspect retained review/);assert.match(detailHtml,/Not reported/);assert.doesNotMatch(detailHtml,/Payment succeeded|Contract formed/);
 const response=await worker.fetch(request(paths[0]),{}),html=await response.text();assert.equal(response.status,200);assert.match(html,/Order with obligation to pay/);assert.match(html,/Original label/);assert.doesNotMatch(html,/<script|<button/);assert.match(response.headers.get('content-security-policy'),/img-src 'self'/);assert.match(html,/src="\/admin\/notabenda\/order-image\?id=/);
 const download=await worker.fetch(request(paths[2]),{});assert.equal(download.status,200);assert.deepEqual(new Uint8Array(await download.arrayBuffer()),new Uint8Array(g.bytes));assert.match(download.headers.get('content-disposition'),/^attachment;/);assert.equal(download.headers.get('content-type'),'application/octet-stream');assert.equal(download.headers.get('cache-control'),'no-store, private');
 const image=await worker.fetch(request(paths[3]),{});assert.equal(image.headers.get('content-type'),g.label.asset.mediaType);assert.match(image.headers.get('content-security-policy'),/^sandbox; default-src 'none'/);assert.equal(image.headers.get('cross-origin-resource-policy'),'same-origin');
 const json=await worker.fetch(request(paths[1]),{});assert.equal(await json.text(),canonicalJson(review));const head=await worker.fetch(request(paths[2],'HEAD'),{});assert.equal(head.status,200);assert.equal(await head.text(),'');
 for(const path of ['/order-review?id='+id+'&id='+id,'/order-image?id='+id+'&sha256=no','/order-review?id=../else','/order-review?id='+id+'&other=1'])assert.equal((await worker.fetch(request(path),{})).status,400);
 assert.equal((await worker.fetch(request('/order-asset?id='+id+'&sha256='+'a'.repeat(64)),{})).status,404);
 const exportOnly={...store,getOrderArchive(){throw Error('Must not traverse archive');},getOrderAsset(){throw Error('Must not traverse file');}},segment=await createEvidenceExportSegment(exportOnly,query);assert.equal(segment.records.length,1);assert.doesNotMatch(JSON.stringify(segment),/producerLabel|characteristics|<svg/);assert.ok(authCalls>=15);
 const wrong=createAdminWorker({authorize:()=>({store:{...store,getOrderArchive:async()=>({id,review:{...review,reviewId:'a'.repeat(64)}})},allowOrderArchive:true})});assert.equal((await wrong.fetch(request(paths[0]),{})).status,500);
 const corrupt=createAdminWorker({authorize:()=>({store:{...store,getOrderAsset:async()=>new Uint8Array(g.bytes.length)},allowOrderArchive:true})});assert.equal((await corrupt.fetch(request(paths[3]),{})).status,500);
 const lifecycle=await createEvidenceLifecycle(f.storage,{family:'orders',siteId:f.context.siteId,scopeId:f.context.scopeId,streamId:f.context.checkoutId},{now:()=>new Date(time)});await lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:time,legalHold:false,externalWorkStopped:true});assert.equal(await store.getOrderArchive(id),undefined);assert.equal(await store.getOrderAsset(id,asset),undefined);assert.equal((await worker.fetch(request(paths[0]),{})).status,404);
});

test('a valid review at its data budget remains inspectable when wrapped with an admission ID',async()=>{
 const attempt=async(size,extra=0)=>setup({items:Array.from({length:32},(_,n)=>({...service,id:'item-'+n,productId:'product-'+n,characteristics:Array.from({length:12},(_,i)=>'x'.repeat(size+(n===0&&i===0?extra:0)))}))});
 let low=500,high=700,best;
 while(low<=high){const middle=Math.floor((low+high)/2);try{best=await attempt(middle);low=middle+1;}catch{high=middle-1;}}
 const size=high;low=0;high=500;
 while(low<=high){const middle=Math.floor((low+high)/2);try{best=await attempt(size,middle);low=middle+1;}catch{high=middle-1;}}
 assert.ok(best);const f=best;assert.throws(()=>copyPaidOrderData({id:'a'.repeat(64),review:f.review}));await ready(f);const receipt=await admitPaidOrder(f.storage,f.request,f.context,f.options),store=createPaidOrderStore(f.storage,{...f.context}),worker=createAdminWorker({authorize:()=>({store,allowOrderArchive:true})}),request=path=>new Request('https://shop.example/admin/notabenda/'+path+'?id='+receipt.id);
 const page=await worker.fetch(request('order-review'),{});assert.equal(page.status,200);assert.match(await page.text(),/Retained review/);const json=await worker.fetch(request('order-review.json'),{});assert.equal(json.status,200);assert.equal(await json.text(),canonicalJson(f.review));
});

test('retirement fences attempts, assets, activation and restores, and resumably purges all private chunks and outcomes',async()=>{
 const f=await setup();await ready(f);const receipt=await admitPaidOrder(f.storage,f.request,f.context,f.options),lifecycle=await createEvidenceLifecycle(f.storage,{family:'orders',siteId:f.context.siteId,scopeId:f.context.scopeId,streamId:f.context.checkoutId},{now:()=>new Date(time)}),decision={requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:time,legalHold:false,externalWorkStopped:true};assert.equal(lifecycle.contextRef,f.ref);
 await reject(lifecycle.retire({...decision,externalWorkStopped:false}),'invalid-decision');await lifecycle.setHold({active:true,reviewAt:expiry,expectedRevision:0});await reject(lifecycle.retire(decision),'legal-hold');await lifecycle.setHold({active:false,reviewAt:null,expectedRevision:1});const retired=await lifecycle.retire(decision);
 await reject(getPaidOrderAttempt(f.storage,f.request,f.context),'context-retired');await reject(archivePaidOrderReview(f.storage,f.review,f.context),'context-retired');await reject(activatePaidOrderReview(f.storage,{reviewId:f.review.reviewId,expectedRevision:1},f.context),'context-retired');const store=createPaidOrderStore(f.storage,{siteId:f.context.siteId,scopeId:f.context.scopeId});assert.equal((await store.get(receipt.id)).data.kind,'retired-evidence');
 let state;do{state=await lifecycle.purge({requestId:decision.requestId,legalHold:false,limit:2});}while(state.phase!=='complete');assert.equal((await f.storage.list({prefix:f.base,limit:200})).size,0);assert.equal((await f.storage.list({prefix:f.prefix+'events/',limit:200})).size,0);assert.equal(await f.storage.get('shop/stock/lamp'),3,'host stock state is outside evidence erasure');
 await lifecycle.restore(retired);await reject(admitPaidOrder(f.storage,f.request,f.context,f.options),'context-retired');
});
