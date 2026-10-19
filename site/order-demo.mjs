// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-DEMO-WORKSPACE
// Host wiring only. The reusable package owns archives, activation, admission and recovery.
import {archivePaidOrderAsset,archivePaidOrderReview,activatePaidOrderReview,getPaidOrderCheckoutState,readPaidOrderReview,paidOrderCheckoutRef,admitPaidOrder,getPaidOrderAttempt,PaidOrderRecordError} from 'notabenda-cf/orders';
import {normalizePaidOrderReview,copyPaidOrderData} from 'notabenda/orders';
import {canonicalJson,sha256} from '../packages/notabenda-cf/dist/history.js';
import {serveLegacyOrderDemo} from './order-demo-legacy.mjs';
export const orderDemoSite='juniper-order-example',orderDemoScope='checkout';
const prefix='demo/orders/',v2=prefix+'v2/';
const validRequest=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===['schemaVersion','requestId','reviewId','definitionId','quoteId','quoteRevision','contextRef'].sort().join(',')&&v.schemaVersion===1&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v.requestId)&&['reviewId','definitionId','contextRef'].every(k=>typeof v[k]==='string'&&/^[a-f0-9]{64}$/u.test(v[k]))&&typeof v.quoteId==='string'&&v.quoteId.length<=120&&typeof v.quoteRevision==='string'&&v.quoteRevision.length<=120;
const context=(checkoutId,now)=>({siteId:orderDemoSite,scopeId:orderDemoScope,checkoutId,now,allowPreview:true});
// Compose package operations in one host transaction without opening nested DO transactions.
const within=tx=>({get:key=>tx.get(key),list:options=>tx.list(options),transaction:callback=>callback(tx)});
export async function hasOrderDemoAttempt(storage,route,input,generation){
 if(!validRequest(input))return false;
 if(input.contextRef===generation){const old=await storage.get(prefix+'attempts/'+input.requestId);return old?.route===route&&old.command===canonicalJson(input);}
 const selected=await storage.get(v2+'contexts/'+input.contextRef);if(!selected||selected.route!==route)return false;
 try{return !!await getPaidOrderAttempt(storage,input,context(selected.checkoutId));}catch{return false;}
}
export async function serveOrderDemo(request,{storage,generation,templates,readBody,readAsset,now=()=>new Date()}){
 const match=/^\/demo\/orders\/(mixed|deferred|conditional)\/(quote|submit)$/u.exec(new URL(request.url).pathname);if(!match)return new Response('Not found.',{status:404});const [,route,operation]=match,template=templates[route];
 if(operation==='quote'){
  if(request.method!=='GET')return new Response('Method not allowed.',{status:405});
  const files=[];for(const item of template.definition.items)if(item.guarantee?.status==='label-provided'){if(!readAsset)throw Error('Original asset loader required.');files.push({label:item.guarantee.label,bytes:await readAsset(item.guarantee.label.asset)});}
  return storage.transaction(async tx=>{
   const store=within(tx),pointer=await tx.get(v2+'current/'+route),count=await tx.get(prefix+'quote-count')??0;let selected=pointer,state=pointer?await getPaidOrderCheckoutState(store,context(pointer.checkoutId,now)):undefined;
   if(state?.reviewId&&!state.admissionId){const active=await readPaidOrderReview(store,state.reviewId,context(pointer.checkoutId,now)),at=now();if(active.definition.definitionId===template.definition.definitionId&&Date.parse(active.quote.expiresAt)>at.getTime()&&Date.parse(active.quote.issuedAt)<=at.getTime())return Response.json(active);}
   if(count>=200)return Response.json({code:'demo-limit-reached'},{status:429});
   if(!selected||state.admissionId){selected={checkoutId:crypto.randomUUID(),route};state=undefined;}
   const host=context(selected.checkoutId,now),ref=await paidOrderCheckoutRef(host),at=now(),quote={quoteId:crypto.randomUUID(),revision:String((state?.revision??0)+1),contextRef:ref,definitionId:template.definition.definitionId,issuedAt:at.toISOString(),expiresAt:new Date(at.getTime()+900000).toISOString(),lines:template.lines,pricing:template.pricing},content={schemaVersion:1,kind:'paid-order-review',definition:template.definition,quote},review=normalizePaidOrderReview({...content,reviewId:await sha256(canonicalJson(content))},{allowPreview:true});
   for(const file of files)await archivePaidOrderAsset(store,file.label,file.bytes,host);
   await archivePaidOrderReview(store,review,host);await activatePaidOrderReview(store,{reviewId:review.reviewId,expectedRevision:state?.revision??0},host);
   await tx.put(v2+'contexts/'+ref,selected);await tx.put(v2+'current/'+route,selected);await tx.put(prefix+'quote-count',count+1);return Response.json(review);
  });
 }
 if(request.method!=='POST')return new Response('Method not allowed.',{status:405});let input;try{input=copyPaidOrderData(await readBody(request));}catch{return Response.json({code:'invalid-request'},{status:400});}if(!validRequest(input))return Response.json({code:'invalid-request'},{status:400});
 // Previously issued reviews and exact receipts remain recoverable after deployment.
 if(input.contextRef===generation)return serveLegacyOrderDemo(request,{storage,generation,templates,readBody:async()=>input,now});
 try{return await storage.transaction(async tx=>{
  const selected=await tx.get(v2+'contexts/'+input.contextRef);if(!selected||selected.route!==route)return Response.json({code:'context-mismatch'},{status:409});
  const result=await admitPaidOrder(within(tx),input,context(selected.checkoutId,now),{hostPrefix:'demo/order-host/',async decide({review}){return review.definition.definitionId===template.definition.definitionId&&canonicalJson(review.quote.lines)===canonicalJson(template.lines)&&canonicalJson(review.quote.pricing)===canonicalJson(template.pricing)?{status:'admit',writes:[]}:{status:'reject',reason:'stale-quote'};}});return Response.json(result);
 });}catch(error){if(error instanceof PaidOrderRecordError)return Response.json({code:'request-conflict'},{status:['invalid-clock','unavailable'].includes(error.code)?503:409});throw error;}
}
