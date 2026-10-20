// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
// @requirements REQ-PRODUCT-ORDER-CONFIRMATION
// @requirements REQ-EU-ORDER-CONFIRMATION
// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {createAdminWorker,matchesRecord} from '@notabenda/cloudflare';
import {createPaidOrderStore} from '@notabenda/cloudflare/orders';
import {normalizeRecordQuery,compareRecordKeys} from '../packages/notabenda-cf/dist/export.js';
import {legacyOrderDemoAdmin} from './order-demo-admin-legacy.mjs';
import {orderDemoSite,orderDemoScope} from './order-demo.mjs';
import {adminPresentation} from './admin-presentation.mjs';
import data from './dist/server-data.json' with {type:'json'};
const base='/demo/admin/orders',prefix='demo/orders/received/';
function legacyProjection(id,raw){
 const review=raw.review,pricing=review.quote.pricing;return {id,data:{schemaVersion:1,kind:'paid-order-admission',id,siteId:review.definition.siteId,scopeId:'checkout',streamRef:raw.request.contextRef,occurredAt:raw.receivedAt,reviewId:review.reviewId,request:raw.request,items:review.quote.lines.map(line=>{const item=review.definition.items.find(i=>i.id===line.itemId);return {productId:item.productId,name:item.name,quantity:line.quantity};}),pricing:{currency:pricing.currency,fractionDigits:pricing.fractionDigits,totalPrice:pricing.totalPrice,dueNow:pricing.dueNow},legacy:true}};
}
export async function orderDemoAdmin(request,storage){
 const url=new URL(request.url),id=url.searchParams.get('id');
 if(url.pathname===base+'/record'&&/^[a-f0-9]{64}$/u.test(id??'')&&await storage.get(prefix+id))return legacyOrderDemoAdmin(request,storage);
 const store=createOrderDemoStore(storage);
 const response=await createAdminWorker({...adminPresentation('/demo/admin'),basePath:base,title:'Order requests',authorize:()=>({store,scopeLabel:'Your demo workspace',allowExport:true,allowOrderArchive:true,allowOrderConfirmation:true})}).fetch(request,{});
 if(url.pathname===base+'/order-review'&&request.method==='GET'&&response.ok){const html=await response.text(),asset=data.paidOrders.mixed.definition.items.find(i=>i.guarantee?.status==='label-provided').guarantee.label.asset,notice=asset.url.replace(/\.svg$/u,'.NOTICE.txt');return new Response(html.replace('</main>',(html.includes('class="nb-guarantee-artwork"')?`<p class="footnote">Guarantee artwork © European Union. <a href="${notice}">Source and use conditions</a>.</p>`:'')+'</main>'),{status:response.status,headers:response.headers});}
 return response;
}

// @requirements REQ-PRODUCT-CARTRIDGES
export function createOrderDemoStore(storage){
 const current=createPaidOrderStore(storage,{siteId:orderDemoSite,scopeId:orderDemoScope,allowPreview:true}),store={
  ...current,
  async get(id){const record=await current.get(id);if(record)return record;const old=await storage.get(prefix+id);return old?legacyProjection(id,old):undefined;},
  async list(input){
   const query=normalizeRecordQuery(input),page=await current.list({query:'',kind:'',from:'',to:'',keyPrefix:query.keyPrefix,limit:50,...(query.after===undefined?{}:{after:query.after})});
   const old=await storage.list({prefix:prefix+query.keyPrefix,limit:51,...(query.after===undefined?{}:{startAfter:prefix+query.after})}),legacy=[...old.entries()].slice(0,50),frontiers=[];
   if(page.nextAfter!==undefined)frontiers.push(page.nextAfter);
   if(old.size>50)frontiers.push(legacy.at(-1)[0].slice(prefix.length));
   // Do not advance beyond the earliest unfinished source: the other source may have unread keys there.
   const frontier=frontiers.sort(compareRecordKeys)[0],all=new Map(legacy.map(([key,value])=>{const id=key.slice(prefix.length);return [id,legacyProjection(id,value)];}));
   for(const record of page.records)all.set(record.id,record); // Same precedence as get().
   const candidates=[...all.values()].filter(r=>frontier===undefined||compareRecordKeys(r.id,frontier)<=0).sort((a,b)=>compareRecordKeys(a.id,b.id)),records=[];let scanned=0;
   for(const record of candidates){scanned++;if(matchesRecord(record,query))records.push(record);if(records.length===query.limit)return {records,nextAfter:record.id,scanned};}
   return {records,scanned,...(frontier===undefined?{}:{nextAfter:frontier})};
  },
 };
 return store;
}
