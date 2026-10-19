// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-DEMO-WORKSPACE
// Compatibility for already issued pre-archive demo quotes. New quotes use order-demo.mjs.
// Website demo integration. This admits sample requests only; it never executes payments or contracts.
import {normalizePaidOrderReview,copyPaidOrderData} from 'notabenda/orders';
const canonical=v=>v&&typeof v==='object'?Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
const validRequest=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===['schemaVersion','requestId','reviewId','definitionId','quoteId','quoteRevision','contextRef'].sort().join(',')&&v.schemaVersion===1&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v.requestId)&&['reviewId','definitionId','contextRef'].every(k=>typeof v[k]==='string'&&/^[a-f0-9]{64}$/u.test(v[k]))&&typeof v.quoteId==='string'&&v.quoteId.length<=120&&typeof v.quoteRevision==='string'&&v.quoteRevision.length<=120;
export async function serveLegacyOrderDemo(request,{storage,generation,templates,readBody,now=()=>new Date()}){
 const match=/^\/demo\/orders\/(mixed|deferred|conditional)\/(quote|submit)$/u.exec(new URL(request.url).pathname);if(!match)return new Response('Not found.',{status:404});
 const [,route,operation]=match,template=templates[route],prefix='demo/orders/';
 if(operation==='quote'){
  if(request.method!=='GET')return new Response('Method not allowed.',{status:405});
  return storage.transaction(async tx=>{
   const active=await tx.get(prefix+'active/'+route),used=active?await tx.get(prefix+'admitted/'+active.quote.quoteId):undefined,count=await tx.get(prefix+'quote-count')??0,at=now();
   if(!(at instanceof Date)||!Number.isFinite(at.getTime()))return Response.json({code:'unavailable'},{status:503});
   if(active&&!used&&active.definition.definitionId===template.definition.definitionId&&Date.parse(active.quote.expiresAt)>at.getTime())return Response.json(active);
   if(count>=200)return Response.json({code:'demo-limit-reached'},{status:429});
   const quote={quoteId:crypto.randomUUID(),revision:'1',contextRef:generation,definitionId:template.definition.definitionId,issuedAt:at.toISOString(),expiresAt:new Date(at.getTime()+900000).toISOString(),lines:template.lines,pricing:template.pricing},content={schemaVersion:1,kind:'paid-order-review',definition:template.definition,quote},review=normalizePaidOrderReview({...content,reviewId:await digest(content)},{allowPreview:true});
   await tx.put(prefix+'quote-count',count+1);await tx.put(prefix+'quotes/'+quote.quoteId,review);await tx.put(prefix+'active/'+route,review);return Response.json(review);
  });
 }
 let input;try{input=copyPaidOrderData(await readBody(request));}catch{return Response.json({code:'invalid-request'},{status:400});}if(!validRequest(input))return Response.json({code:'invalid-request'},{status:400});
 if(input.contextRef!==generation)return Response.json({code:'context-mismatch'},{status:409});
 const command=canonical(input);
 // Admission and idempotency share a transaction. An existing result precedes expiry/current-quote checks.
 return storage.transaction(async tx=>{
  const old=await tx.get(prefix+'attempts/'+input.requestId);if(old){if(old.command!==command||old.route!==route)return Response.json({code:'request-conflict'},{status:409});return Response.json(old.outcome);}
  const retained=await tx.get(prefix+'quotes/'+input.quoteId),active=await tx.get(prefix+'active/'+route);
  if(!retained||input.contextRef!==generation||retained.reviewId!==input.reviewId||retained.definition.definitionId!==input.definitionId||retained.quote.revision!==input.quoteRevision)return Response.json({code:'context-mismatch'},{status:409});
  const admitted=await tx.get(prefix+'admitted/'+retained.quote.quoteId);
  const id=await digest({generation,request:input}),at=now();
  const reason=!(at instanceof Date)||!Number.isFinite(at.getTime())?'unavailable':admitted?'checkout-used':active?.reviewId!==retained.reviewId||template.definition.definitionId!==retained.definition.definitionId?'stale-quote':at.getTime()>=Date.parse(retained.quote.expiresAt)?'expired-quote':at.getTime()<Date.parse(retained.quote.issuedAt)?'unavailable':null;
  const outcome=reason?{...input,status:'rejected',reason}:{...input,status:'received',id,receivedAt:at.toISOString()};
  await tx.put(prefix+'attempts/'+input.requestId,{command,outcome,route});
  if(!reason){await tx.put(prefix+'admitted/'+retained.quote.quoteId,{requestId:input.requestId});await tx.put(prefix+'received/'+id,{kind:'demo-order-request',status:'received',receivedAt:at.toISOString(),request:input,review:retained,paymentStatus:'not-performed',contractStatus:'not-formed',confirmationStatus:'not-sent'});}
  return Response.json(outcome);
 });
}
