// @requirements REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-EVIDENCE-LIFECYCLE
// Test-only loopback fixture. No public deployment or external messages.
import {DurableObject} from 'cloudflare:workers';
import {recordLegalRelease} from '@notabenda/cloudflare';
import {archivePaidOrderReview,activatePaidOrderReview,admitPaidOrder,getPaidOrderAttempt,paidOrderCheckoutRef} from '@notabenda/cloudflare/orders';
import {preparePaidOrderConfirmation,readPaidOrderConfirmation,readPaidOrderConfirmationFile,claimPaidOrderConfirmation,settlePaidOrderConfirmation,dispatchPaidOrderConfirmation} from '@notabenda/cloudflare/order-confirmations';
import {canonicalJson,sha256} from '../../packages/notabenda-cf/dist/history.js';
import {orderBytesHash} from '../../packages/notabenda-cf/dist/order-blobs.js';
import data from '../../site/dist/server-data.json' with {type:'json'};
const time='2026-10-19T12:00:00.000Z';
export default {async fetch(request,env){if(new URL(request.url).origin!==env.RUNTIME_ORIGIN||request.headers.get('X-Notabenda-Runtime')!==env.RUNTIME_KEY||request.method!=='POST')return new Response('Not found',{status:404});return env.CASE.get(env.CASE.idFromName('owned-confirmation')).fetch(request);}};
export class ConfirmationCase extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.storage=ctx.storage;this.environment=env;}
 async fetch(request){
  const path=new URL(request.url).pathname,body=await request.json(),clock=await this.storage.get('runtime/clock')??time,t=data.paidOrders.conditional,context={siteId:t.definition.siteId,scopeId:'checkout',checkoutId:'confirmation-runtime',allowPreview:true,now:()=>new Date(clock)};
  if(path==='/clock'){await this.storage.put('runtime/clock',body.at);return Response.json({ok:true});}
  if(path==='/prepare'){
   for(const release of data.releases)await recordLegalRelease(this.storage,release.artifact,release.metadata);
   const ref=await paidOrderCheckoutRef(context),quote={quoteId:'runtime-quote',revision:'one',contextRef:ref,definitionId:t.definition.definitionId,issuedAt:time,expiresAt:'2026-10-19T12:15:00.000Z',lines:t.lines,pricing:t.pricing},content={schemaVersion:1,kind:'paid-order-review',definition:t.definition,quote},review={...content,reviewId:await sha256(canonicalJson(content))};await archivePaidOrderReview(this.storage,review,context);await activatePaidOrderReview(this.storage,{reviewId:review.reviewId,expectedRevision:0},context);const command={schemaVersion:1,requestId:body.requestId,reviewId:review.reviewId,definitionId:t.definition.definitionId,quoteId:quote.quoteId,quoteRevision:quote.revision,contextRef:ref};const receipt=await admitPaidOrder(this.storage,command,context,{hostPrefix:'runtime/stock/',async decide(){return {status:'admit',writes:[]};}});await this.storage.put('runtime/request',command);
   const archive=await preparePaidOrderConfirmation(this.storage,{request:command,contract:{reference:'C-1042',concludedAt:time},addressee:{name:'Alex Morgan',recipientRef:'person-42',destinationRef:'address-42',destinationVersion:'three'},issuedAt:time,locale:'en',reviewStatus:'draft',coverage:{selfContained:true,preContractInformation:'included-in-files',digitalContent:{status:'not-applicable',reason:'Service-only test fixture'}},files:[{id:'copy',filename:'confirmation.txt',mediaType:'text/plain',role:'confirmation',bytes:new TextEncoder().encode('Contract C-1042 for Alex Morgan\nHost supplied complete fixture content.\n')},{id:'large',filename:'attachment.txt',mediaType:'text/plain',role:'attachment',bytes:new TextEncoder().encode('Original attachment\n'.repeat(18000))}]},context);return Response.json({receipt,manifest:archive.manifest});
  }
  if(path==='/inspect'){const archive=await readPaidOrderConfirmation(this.storage,context),bytes=await readPaidOrderConfirmationFile(this.storage,'large',context),command=await this.storage.get('runtime/request');return Response.json({archive,attachmentSha256:await orderBytesHash(bytes),receipt:await getPaidOrderAttempt(this.storage,command,context)});}
  if(path==='/lease'){const lease=await claimPaidOrderConfirmation(this.storage,context,{leaseMs:1000});return Response.json(lease?Object.fromEntries(Object.entries(lease).filter(([key])=>!['files','archive'].includes(key))):null);}
  if(path==='/settle')return Response.json(await settlePaidOrderConfirmation(this.storage,body.lease,{status:'accepted',providerRef:'obsolete'},context));
  const sink=this.environment.SINK.get(this.environment.SINK.idFromName('confirmation-provider'));
  if(path==='/provider')return sink.fetch(new Request('https://example.test/inspect',{method:'POST',body:'{}'}));
  if(path==='/dispatch')return Response.json(await dispatchPaidOrderConfirmation(this.storage,context,{timeoutMs:3000,async deliver({lease,signal}){if(signal.aborted)throw Error('Aborted');const response=await sink.fetch(new Request('https://example.test/accept',{method:'POST',body:JSON.stringify({deliveryId:lease.deliveryId,manifest:lease.archive.manifest,files:lease.files.map(f=>({id:f.id,bytes:[...f.bytes]}))})}));if(!response.ok)throw Error('Not accepted');const result=await response.json();if(body.mode==='lose-response')throw Error('Lost provider response');return result;}}));
  return new Response('Not found',{status:404});
 }
}
export class ConfirmationSink extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.storage=ctx.storage;}
 async fetch(request){
  if(new URL(request.url).pathname==='/inspect')return Response.json(Object.fromEntries(await this.storage.list({prefix:'provider/'})));
  const packet=await request.json();for(const file of packet.manifest.files){const original=packet.files.find(f=>f.id===file.id),bytes=new Uint8Array(original.bytes);if(bytes.length!==file.bytes||await orderBytesHash(bytes)!==file.sha256)return new Response('Changed file',{status:409});}
  const payloadSha256=await sha256(canonicalJson(packet));return this.storage.transaction(async tx=>{const key='provider/'+packet.deliveryId,prior=await tx.get(key);if(prior&&prior.payloadSha256!==payloadSha256)return new Response('Idempotency conflict',{status:409});const value=prior?{...prior,calls:prior.calls+1}:{payloadSha256,destination:packet.manifest.addressee,confirmationId:packet.manifest.confirmationId,calls:1,commits:1};await tx.put(key,value);return Response.json({providerRef:'simulated-provider-'+packet.deliveryId});});
 }
}
