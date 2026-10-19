// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {createAdminWorker,matchesRecord} from 'notabenda-cf';
import {createPaidOrderStore} from 'notabenda-cf/orders';
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
 const current=createPaidOrderStore(storage,{siteId:orderDemoSite,scopeId:orderDemoScope,allowPreview:true}),store={
  ...current,
  async get(id){const record=await current.get(id);if(record)return record;const old=await storage.get(prefix+id);return old?legacyProjection(id,old):undefined;},
  async list(input){
   const query=normalizeRecordQuery(input),all=[];let after;
   do{const page=await current.list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50,...(after?{after}:{})});all.push(...page.records);after=page.nextAfter;}while(after&&all.length<200);
   const old=await storage.list({prefix,limit:200});for(const [key,value] of old)all.push(legacyProjection(key.slice(prefix.length),value));
   const candidates=all.sort((a,b)=>compareRecordKeys(a.id,b.id)).filter(r=>r.id.startsWith(query.keyPrefix)&&(query.after===undefined||compareRecordKeys(r.id,query.after)>0)),records=[];let scanned=0;
   for(const record of candidates){scanned++;if(matchesRecord(record,query))records.push(record);if(records.length===query.limit)return {records,nextAfter:record.id,scanned};}return {records,scanned};
  },
 };
 const response=await createAdminWorker({...adminPresentation('/demo/admin'),basePath:base,title:'Order requests',authorize:()=>({store,scopeLabel:'Your demo workspace',allowExport:true,allowOrderArchive:true})}).fetch(request,{});
 if(url.pathname===base+'/order-review'&&request.method==='GET'&&response.ok){const html=await response.text(),asset=data.paidOrders.mixed.definition.items.find(i=>i.guarantee?.status==='label-provided').guarantee.label.asset,notice=asset.url.replace(/\.svg$/u,'.NOTICE.txt');return new Response(html.replace('</main>',(html.includes('class="nb-guarantee-artwork"')?`<p class="footnote">Guarantee artwork © European Union. <a href="${notice}">Source and use conditions</a>.</p>`:'')+'</main>'),{status:response.status,headers:response.headers});}
 return response;
}
