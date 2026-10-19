// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {normalizePaidOrderReview,copyPaidOrderData,paidOrderHash} from './order-policy.js';
import type {PaidOrderReview} from './order-policy.js';
import {normalizeDurabilityGuaranteeLabel} from './order-guarantee-label.js';
import {canonicalJson,sha256,validateStoredLegalRelease} from './history.js';
import type {HistoryStorage,HistoryTransaction} from './history.js';
import type {JsonValue,RecordStore} from './types.js';
import {normalizeRecord,matchesRecord,validId} from './records.js';
import {createDurableObjectStore} from './store.js';
import {normalizeRecordQuery,compareRecordKeys} from './export.js';
import {assertEvidenceContextActive,retiredEvidenceProjection} from './lifecycle.js';
import {orderPrefixes,paidOrderCheckoutRef,paidOrderAdmissionId,orderFail,orderSlug,orderText,orderIso,orderUuid,orderClock} from './order-context.js';
import type {PaidOrderContext,PaidOrderStoreOptions} from './order-context.js';
import {ownedOrderBytes,orderBytesHash,writeOrderBlob,readOrderBlob} from './order-blobs.js';
export {PaidOrderRecordError,paidOrderCheckoutRef} from './order-context.js';
export type {PaidOrderContext,PaidOrderStoreOptions} from './order-context.js';
export type {PaidOrderReview} from './order-policy.js';
export interface PaidOrderRequest {schemaVersion:1;requestId:string;reviewId:string;definitionId:string;quoteId:string;quoteRevision:string;contextRef:string}
export type PaidOrderOutcome=PaidOrderRequest&({status:'received';id:string;receivedAt:string}|{status:'rejected';reason:'stale-quote'|'expired-quote'|'checkout-used'|'unavailable'});
export interface PaidOrderCheckoutState {revision:number;reviewId:string|null;admissionId:string|null}
export type PaidOrderAdmissionDecision={status:'admit';writes:{key:string;value:JsonValue}[]}|{status:'reject';reason:'stale-quote'|'unavailable'};
export interface PaidOrderAdmissionOptions {
 /** Fixed host-owned namespace, disjoint from package archives. Never accept from the browser. */
 hostPrefix:string;
 /** Local read-only transaction input. Return writes; never call payment/network APIs or perform external side effects. */
 decide(input:{request:PaidOrderRequest;review:PaidOrderReview;get<T extends JsonValue=JsonValue>(key:string):Promise<T|undefined>}):Promise<PaidOrderAdmissionDecision>;
}
interface Active {siteId:string;scopeId:string;contextRef:string;revision:number;reviewId:string;previousRevision:number}
interface Attempt {kind:'paid-order-attempt';siteId:string;scopeId:string;contextRef:string;request:PaidOrderRequest;requestSha256:string;outcome:PaidOrderOutcome}
interface Event {schemaVersion:1;kind:'paid-order-admission';id:string;siteId:string;scopeId:string;streamRef:string;occurredAt:string;reviewId:string;requestSha256:string;request:PaidOrderRequest;receipt:PaidOrderOutcome;items:{productId:string;name:string;quantity:number}[];pricing:Pick<PaidOrderReview['quote']['pricing'],'currency'|'fractionDigits'|'totalPrice'|'dueNow'>;payment:{status:'not-reported'};fulfillment:{status:'not-reported'};contract:{status:'not-reported'};confirmation:{status:'not-prepared'}}
const json=(v:unknown)=>v as JsonValue;
const canonical=(v:unknown)=>canonicalJson(json(v));
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>record(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const relative=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]*(?:\/[a-zA-Z0-9][a-zA-Z0-9_-]*)*$/u.test(v)&&v.length<=200;
const counter=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
function normalizedRequest(input:unknown,ref:string,review?:PaidOrderReview):PaidOrderRequest {
 let r:unknown;try{r=copyPaidOrderData(input);}catch{return orderFail('invalid-request');}
 if(!exact(r,['schemaVersion','requestId','reviewId','definitionId','quoteId','quoteRevision','contextRef'])||r.schemaVersion!==1||!orderUuid(r.requestId)||!paidOrderHash(r.reviewId)||!paidOrderHash(r.definitionId)||!orderText(r.quoteId,120)||!orderText(r.quoteRevision,120)||r.contextRef!==ref)return orderFail('invalid-request');
 if(review&&(r.reviewId!==review.reviewId||r.definitionId!==review.definition.definitionId||r.quoteId!==review.quote.quoteId||r.quoteRevision!==review.quote.revision))return orderFail('invalid-request');return r as unknown as PaidOrderRequest;
}
async function reviewValue(input:unknown,context:PaidOrderStoreOptions,ref:string):Promise<PaidOrderReview>{
 let r:PaidOrderReview;try{r=normalizePaidOrderReview(input,{allowPreview:context.allowPreview===true});}catch{return orderFail('invalid-review');}
 const {definitionId,...definition}=r.definition,{reviewId,...content}=r;
 if(r.definition.siteId!==context.siteId||r.quote.contextRef!==ref)return orderFail('scope-mismatch');
 if(await sha256(canonical(definition))!==definitionId||await sha256(canonical(content))!==reviewId)return orderFail('invalid-review');
 for(const item of r.definition.items)if(item.guarantee?.status==='label-provided'){const {labelId,...label}=item.guarantee.label;if(await sha256(canonical(label))!==labelId)return orderFail('invalid-review');}
 return r;
}
function ownedInput(input:unknown,code:'invalid-review'|'invalid-asset'|'invalid-request'):unknown{try{return copyPaidOrderData(input);}catch{return orderFail(code);}}
const intentBase=(prefix:string,ref:string)=>prefix+'intents/'+ref+'/';
async function fence(tx:HistoryTransaction,prefix:string,context:PaidOrderStoreOptions,ref:string){await assertEvidenceContextActive(tx,prefix,'orders',context.siteId,ref);}
async function archivedReview(tx:HistoryTransaction,base:string,reviewId:string,context:PaidOrderStoreOptions,ref:string):Promise<PaidOrderReview>{
 if(!paidOrderHash(reviewId))return orderFail('invalid-review');const bytes=await readOrderBlob(tx,base+'reviews/'+reviewId+'/',262144);
 let input:unknown;try{input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return orderFail('invalid-record');}
 const review=await reviewValue(input,context,ref);if(review.reviewId!==reviewId)return orderFail('invalid-record');return review;
}
async function verifyAssets(tx:HistoryTransaction,base:string,review:PaidOrderReview):Promise<void>{
 const seen=new Map<string,{bytes:number;width:number;height:number;mediaType:string}>();for(const item of review.definition.items)if(item.guarantee?.status==='label-provided'){
  const asset=item.guarantee.label.asset,key=asset.sha256;let actual=seen.get(key);
  if(!actual){const bytes=await readOrderBlob(tx,base+'assets/'+key+'/',2097152);if(await orderBytesHash(bytes)!==key)return orderFail('invalid-asset');actual={bytes:bytes.length,width:asset.width,height:asset.height,mediaType:asset.mediaType};seen.set(key,actual);}
  if(actual.bytes!==asset.bytes||actual.width!==asset.width||actual.height!==asset.height||actual.mediaType!==asset.mediaType)return orderFail('invalid-asset');
 }
}
async function verifyDocuments(tx:HistoryTransaction,review:PaidOrderReview,releasePrefix:string,allowPreview:boolean):Promise<void>{
 const releases=new Map<string,Record<string,JsonValue>>();for(const doc of review.definition.documents){
  let artifact=releases.get(doc.artifactId);if(!artifact){try{artifact=await validateStoredLegalRelease(await tx.get(releasePrefix+doc.artifactId));}catch{return orderFail('invalid-review');}releases.set(doc.artifactId,artifact);}
  const m=artifact.manifest as Record<string,JsonValue>,pages=artifact.pages as Record<string,JsonValue>;if(m.siteId!==review.definition.siteId||!Array.isArray(m.documents))return orderFail('scope-mismatch');
  if(m.artifactId!==doc.artifactId||!allowPreview&&m.mode!=='production')return orderFail('invalid-review');
  const entry=m.documents.find(d=>record(d)&&d.kind===doc.kind);if(!record(entry)||!allowPreview&&entry.reviewStatus!=='reviewed'||entry.title!==doc.title||entry.version!==doc.version||entry.sha256!==doc.sha256||typeof entry.file!=='string'||typeof pages[entry.file]!=='string'||await sha256(pages[entry.file] as string)!==doc.sha256)return orderFail('invalid-review');
 }
}
async function activeValue(tx:HistoryTransaction,base:string,context:PaidOrderContext,ref:string):Promise<Active|undefined>{
 const raw=await tx.get(base+'active');if(raw===undefined)return undefined;const a=copyPaidOrderData(raw);
 if(!exact(a,['siteId','scopeId','contextRef','revision','reviewId','previousRevision'])||a.siteId!==context.siteId||a.scopeId!==context.scopeId||a.contextRef!==ref||!counter(a.revision)||a.revision<1||!counter(a.previousRevision)||a.previousRevision!==a.revision-1||!paidOrderHash(a.reviewId))return orderFail('invalid-record');return a as unknown as Active;
}
/** Original bytes only. Format/artwork/producer review stays in the authoring pipeline; no images execute here. */
export async function archivePaidOrderAsset(storage:HistoryStorage,labelInput:unknown,assetBytes:Uint8Array,context:PaidOrderContext):Promise<{sha256:string;created:boolean}>{
 const bytes=ownedOrderBytes(assetBytes),labelValue=ownedInput(labelInput,'invalid-asset');context={...context};const {prefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),base=intentBase(prefix,ref);let label;
 try{label=normalizeDurabilityGuaranteeLabel(labelValue,{allowPreview:context.allowPreview===true});}catch{return orderFail('invalid-asset');}
 const {labelId,...descriptor}=label;if(await sha256(canonical(descriptor))!==labelId||label.asset.bytes!==bytes.length||await orderBytesHash(bytes)!==label.asset.sha256)return orderFail('invalid-asset');
 return storage.transaction(async tx=>{await fence(tx,prefix,context,ref);const path=base+'assets/'+label.asset.sha256+'/',prior=await tx.get(path+'manifest');await writeOrderBlob(tx,path,bytes);return {sha256:label.asset.sha256,created:prior===undefined};});
}
/** Archive without activation. Every referenced original file and pinned document must already be retained. */
export async function archivePaidOrderReview(storage:HistoryStorage,input:unknown,context:PaidOrderContext):Promise<{reviewId:string;created:boolean}>{
 const value=ownedInput(input,'invalid-review');context={...context};const {prefix,releasePrefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),base=intentBase(prefix,ref),review=await reviewValue(value,context,ref),bytes=new TextEncoder().encode(canonical(review));
 return storage.transaction(async tx=>{await fence(tx,prefix,context,ref);await verifyAssets(tx,base,review);await verifyDocuments(tx,review,releasePrefix,context.allowPreview===true);const path=base+'reviews/'+review.reviewId+'/',prior=await tx.get(path+'manifest'),count=await tx.get<number>(base+'review-count')??0;if(!counter(count))return orderFail('invalid-record');if(prior===undefined&&count>=128)return orderFail('archive-limit');await writeOrderBlob(tx,path,bytes);if(prior===undefined)await tx.put(base+'review-count',count+1);return {reviewId:review.reviewId,created:prior===undefined};});
}
/** CAS activation is distinct from archival. A consumed checkout or previously superseded review cannot be reopened. */
export async function activatePaidOrderReview(storage:HistoryStorage,input:{reviewId:string;expectedRevision:number},context:PaidOrderContext):Promise<PaidOrderCheckoutState>{
 const command=copyPaidOrderData(input);if(!exact(command,['reviewId','expectedRevision'])||!paidOrderHash(command.reviewId)||!counter(command.expectedRevision))return orderFail('invalid-request');
 const reviewId=command.reviewId as string,expectedRevision=command.expectedRevision as number;
 context={...context};const {prefix,releasePrefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),base=intentBase(prefix,ref);
 return storage.transaction(async tx=>{
  await fence(tx,prefix,context,ref);if(await tx.get(base+'consumed')!==undefined)return orderFail('checkout-used');const active=await activeValue(tx,base,context,ref);
  if(active&&active.reviewId===reviewId&&(expectedRevision===active.previousRevision||expectedRevision===active.revision))return {revision:active.revision,reviewId:active.reviewId,admissionId:null};
  if(expectedRevision!==(active?.revision??0))return orderFail('revision-conflict');if(await tx.get(base+'activated/'+reviewId)!==undefined)return orderFail('revision-conflict');
  const review=await archivedReview(tx,base,reviewId,context,ref);await verifyAssets(tx,base,review);await verifyDocuments(tx,review,releasePrefix,context.allowPreview===true);const at=orderClock(context);if(Date.parse(at)<Date.parse(review.quote.issuedAt)||Date.parse(at)>=Date.parse(review.quote.expiresAt))return orderFail('invalid-clock');
  const revision=(active?.revision??0)+1;if(!Number.isSafeInteger(revision))return orderFail('revision-conflict');const next:Active={siteId:context.siteId,scopeId:context.scopeId,contextRef:ref,revision,previousRevision:revision-1,reviewId:review.reviewId};await tx.put(base+'active',next);await tx.put(base+'activated/'+review.reviewId,revision);return {revision,reviewId:review.reviewId,admissionId:null};
 });
}
function outcomeValue(input:unknown,request:PaidOrderRequest,id:string):PaidOrderOutcome {
 const value=copyPaidOrderData(input),keys=Object.keys(request);if(!record(value)||Object.entries(request).some(([k,v])=>value[k]!==v))return orderFail('invalid-record');
 if(value.status==='received'){if(!exact(value,[...keys,'status','id','receivedAt'])||value.id!==id||!orderIso(value.receivedAt))return orderFail('invalid-record');}
 else if(!exact(value,[...keys,'status','reason'])||value.status!=='rejected'||!['stale-quote','expired-quote','checkout-used','unavailable'].includes(value.reason as string))return orderFail('invalid-record');return value as unknown as PaidOrderOutcome;
}
async function previousAttempt(tx:HistoryTransaction,base:string,request:PaidOrderRequest,context:PaidOrderContext,ref:string):Promise<PaidOrderOutcome|undefined>{
 const raw=await tx.get(base+'attempts/'+request.requestId);if(raw===undefined)return undefined;const a=copyPaidOrderData(raw);
 if(!exact(a,['kind','siteId','scopeId','contextRef','request','requestSha256','outcome'])||a.kind!=='paid-order-attempt'||a.siteId!==context.siteId||a.scopeId!==context.scopeId||a.contextRef!==ref)return orderFail('invalid-record');
 const stored=normalizedRequest(a.request,ref);if(a.requestSha256!==await sha256(canonical(stored)))return orderFail('invalid-record');if(canonical(stored)!==canonical(request))return orderFail('idempotency-conflict');
 const id=await paidOrderAdmissionId(ref),outcome=outcomeValue(a.outcome,request,id),review=await archivedReview(tx,base,request.reviewId,context,ref);normalizedRequest(request,ref,review);
 if(outcome.status==='received'){if(Date.parse(outcome.receivedAt)<Date.parse(review.quote.issuedAt)||Date.parse(outcome.receivedAt)>=Date.parse(review.quote.expiresAt))return orderFail('invalid-record');const {prefix}=orderPrefixes(context),event=await tx.get(prefix+'events/'+context.scopeId+'/'+id);if(event===undefined||canonical(copyPaidOrderData(event))!==canonical(eventFor(review,request,outcome,context,id,a.requestSha256 as string)))return orderFail('invalid-record');}
 return outcome;
}
/** Lookup only. Undefined is not proof that an external effect did not happen; never switch to a fresh nonce on uncertainty. */
export async function getPaidOrderAttempt(storage:HistoryStorage,input:unknown,context:PaidOrderContext):Promise<PaidOrderOutcome|undefined>{
 const value=ownedInput(input,'invalid-request');context={...context};const {prefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),request=normalizedRequest(value,ref),base=intentBase(prefix,ref);return storage.transaction(async tx=>{await fence(tx,prefix,context,ref);return previousAttempt(tx,base,request,context,ref);});
}
/** Current activation and consumed marker for the HOST-selected intent. Expiry is evaluated again during admission. */
export async function getPaidOrderCheckoutState(storage:HistoryStorage,context:PaidOrderContext):Promise<PaidOrderCheckoutState>{
 context={...context};const {prefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),base=intentBase(prefix,ref),id=await paidOrderAdmissionId(ref);
 return storage.transaction(async tx=>{await fence(tx,prefix,context,ref);const active=await activeValue(tx,base,context,ref),consumed=await tx.get(base+'consumed');if(consumed!==undefined&&consumed!==id)return orderFail('invalid-record');return {revision:active?.revision??0,reviewId:active?.reviewId??null,admissionId:consumed===undefined?null:id};});
}
export async function readPaidOrderReview(storage:HistoryStorage,reviewId:string,context:PaidOrderContext):Promise<PaidOrderReview>{
 context={...context};const {prefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),base=intentBase(prefix,ref);return storage.transaction(async tx=>{await fence(tx,prefix,context,ref);return archivedReview(tx,base,reviewId,context,ref);});
}
/** Original private file download. The host must authorize it; do not inline untrusted SVG/HTML as executable content. */
export async function readPaidOrderAsset(storage:HistoryStorage,assetSha256:string,context:PaidOrderContext):Promise<Uint8Array>{
 if(!paidOrderHash(assetSha256))return orderFail('invalid-request');context={...context};const {prefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),base=intentBase(prefix,ref);return storage.transaction(async tx=>{await fence(tx,prefix,context,ref);const bytes=await readOrderBlob(tx,base+'assets/'+assetSha256+'/');if(await orderBytesHash(bytes)!==assetSha256)return orderFail('invalid-record');return bytes;});
}
function eventFor(review:PaidOrderReview,request:PaidOrderRequest,receipt:PaidOrderOutcome,context:PaidOrderContext,id:string,requestSha256:string):Event {
 if(receipt.status!=='received')return orderFail('invalid-record');const p=review.quote.pricing;
 return {schemaVersion:1,kind:'paid-order-admission',id,siteId:context.siteId,scopeId:context.scopeId,streamRef:request.contextRef,occurredAt:receipt.receivedAt,reviewId:review.reviewId,requestSha256,request,receipt,items:review.quote.lines.map(line=>{const item=review.definition.items.find(i=>i.id===line.itemId)!;return {productId:item.productId,name:item.name,quantity:line.quantity};}),pricing:{currency:p.currency,fractionDigits:p.fractionDigits,totalPrice:p.totalPrice,dueNow:p.dueNow},payment:{status:'not-reported'},fulfillment:{status:'not-reported'},contract:{status:'not-reported'},confirmation:{status:'not-prepared'}};
}
function admissionOptions(input:PaidOrderAdmissionOptions,prefix:string,releasePrefix:string):PaidOrderAdmissionOptions {
 if(!input||typeof input.decide!=='function'||typeof input.hostPrefix!=='string')return orderFail('invalid-decision');const {hostPrefix,decide}=input;try{createDurableObjectStore({get:async()=>undefined,list:async()=>new Map()},{prefix:hostPrefix});}catch{return orderFail('invalid-decision');}
 if([prefix,releasePrefix].some(p=>p.startsWith(hostPrefix)||hostPrefix.startsWith(p)))return orderFail('invalid-decision');return {hostPrefix,decide};
}
async function decideLocally(tx:HistoryTransaction,review:PaidOrderReview,request:PaidOrderRequest,options:PaidOrderAdmissionOptions):Promise<PaidOrderAdmissionDecision>{
 let open=true,reads=0,readBytes=0;let value:unknown;
 try{value=await options.decide({review:structuredClone(review),request:structuredClone(request),async get<T extends JsonValue>(key:string){if(!open||!relative(key)||++reads>32)return orderFail('invalid-decision');const raw=await tx.get(options.hostPrefix+key);if(!open)return orderFail('invalid-decision');if(raw===undefined)return undefined;const result=normalizeRecord({id:'host',data:copyPaidOrderData(raw)}).data;readBytes+=new TextEncoder().encode(canonical(result)).length;if(readBytes>262144)return orderFail('invalid-decision');return result as T;}});}finally{open=false;}
 let decision:unknown;try{decision=copyPaidOrderData(value);}catch{return orderFail('invalid-decision');}
 if(exact(decision,['status','reason'])&&decision.status==='reject'&&['stale-quote','unavailable'].includes(decision.reason as string))return decision as unknown as PaidOrderAdmissionDecision;
 if(!exact(decision,['status','writes'])||decision.status!=='admit'||!Array.isArray(decision.writes)||decision.writes.length>16||new TextEncoder().encode(canonical(decision)).length>65536)return orderFail('invalid-decision');const keys=new Set<string>();for(const write of decision.writes){if(!exact(write,['key','value'])||!relative(write.key)||keys.has(write.key))return orderFail('invalid-decision');keys.add(write.key);try{normalizeRecord({id:'write',data:write.value},32768);}catch{return orderFail('invalid-decision');}}
 return decision as unknown as PaidOrderAdmissionDecision;
}
/** One local transaction: host decision, stock/reservation writes, consumed intent and immutable receipt. No payment or confirmation is executed. */
export async function admitPaidOrder(storage:HistoryStorage,input:unknown,context:PaidOrderContext,optionsInput:PaidOrderAdmissionOptions):Promise<PaidOrderOutcome>{
 const value=ownedInput(input,'invalid-request');context={...context};const {prefix,releasePrefix}=orderPrefixes(context),options=admissionOptions(optionsInput,prefix,releasePrefix),ref=await paidOrderCheckoutRef(context),base=intentBase(prefix,ref),request=normalizedRequest(value,ref),id=await paidOrderAdmissionId(ref),requestSha256=await sha256(canonical(request));
 return storage.transaction(async tx=>{
  await fence(tx,prefix,context,ref);const prior=await previousAttempt(tx,base,request,context,ref);if(prior)return prior;
  const review=await archivedReview(tx,base,request.reviewId,context,ref);normalizedRequest(request,ref,review);const active=await activeValue(tx,base,context,ref),consumed=await tx.get(base+'consumed');
  let reason:'stale-quote'|'expired-quote'|'checkout-used'|'unavailable'|undefined;
  if(consumed!==undefined){if(consumed!==id)return orderFail('invalid-record');reason='checkout-used';}else if(active?.reviewId!==review.reviewId)reason='stale-quote';
  let decision:PaidOrderAdmissionDecision|undefined;
  if(!reason){await verifyAssets(tx,base,review);await verifyDocuments(tx,review,releasePrefix,context.allowPreview===true);const before=orderClock(context);if(Date.parse(before)<Date.parse(review.quote.issuedAt))reason='unavailable';else if(Date.parse(before)>=Date.parse(review.quote.expiresAt))reason='expired-quote';else{decision=await decideLocally(tx,review,request,options);if(decision.status==='reject')reason=decision.reason;}}
  const at=orderClock(context);if(!reason&&(Date.parse(at)<Date.parse(review.quote.issuedAt)||Date.parse(at)>=Date.parse(review.quote.expiresAt)))reason=Date.parse(at)>=Date.parse(review.quote.expiresAt)?'expired-quote':'unavailable';
  const outcome:PaidOrderOutcome=reason?{...request,status:'rejected',reason}:{...request,status:'received',id,receivedAt:at};
  if(!reason){if(decision?.status!=='admit')return orderFail('invalid-decision');for(const write of decision.writes)await tx.put(options.hostPrefix+write.key,write.value);await tx.put(base+'consumed',id);await tx.put(prefix+'events/'+context.scopeId+'/'+id,normalizeRecord({id,data:eventFor(review,request,outcome,context,id,requestSha256)}).data);}
  const attempt:Attempt={kind:'paid-order-attempt',siteId:context.siteId,scopeId:context.scopeId,contextRef:ref,request,requestSha256,outcome};await tx.put(base+'attempts/'+request.requestId,attempt);return structuredClone(outcome);
 });
}
/** Small site/scoped projection. Full reviews and binary assets are deliberately excluded from generic exports. */
export function createPaidOrderStore(storage:HistoryStorage,options:PaidOrderStoreOptions&{scopeId?:string}):RecordStore {
 const context={...options},{prefix}=orderPrefixes(context);if(context.scopeId!==undefined&&!orderSlug(context.scopeId))return orderFail('scope-mismatch');const eventPrefix=prefix+'events/'+(context.scopeId?context.scopeId+'/':'');
 const eventKey=(id:string)=>{if(typeof id!=='string'||!(context.scopeId?/^[a-f0-9]{64}$/u:/^[a-z][a-z0-9-]{0,119}\/[a-f0-9]{64}$/u).test(id))return orderFail('invalid-request');return eventPrefix+id;};
 async function inspectIn(tx:HistoryTransaction,key:string,value:unknown):Promise<JsonValue>{
  const raw=copyPaidOrderData(value);if(!record(raw)||raw.kind!=='paid-order-admission'||raw.schemaVersion!==1||raw.siteId!==context.siteId||!orderSlug(raw.scopeId)||context.scopeId!==undefined&&raw.scopeId!==context.scopeId||!paidOrderHash(raw.streamRef)||!paidOrderHash(raw.id)||key!==prefix+'events/'+raw.scopeId+'/'+raw.id||await paidOrderAdmissionId(raw.streamRef)!==raw.id)return orderFail('invalid-record');
  const retired=await retiredEvidenceProjection(tx,prefix,'orders',context.siteId,raw.streamRef as string,raw.id as string);if(retired)return retired;
   const review=await archivedReview(tx,intentBase(prefix,raw.streamRef as string),raw.reviewId as string,context,raw.streamRef as string),request=normalizedRequest(raw.request,raw.streamRef as string,review),receipt=outcomeValue(raw.receipt,request,raw.id as string),requestSha256=await sha256(canonical(request));if(receipt.status!=='received'||receipt.receivedAt!==raw.occurredAt||Date.parse(receipt.receivedAt)<Date.parse(review.quote.issuedAt)||Date.parse(receipt.receivedAt)>=Date.parse(review.quote.expiresAt)||canonical(eventFor(review,request,receipt,{...context,scopeId:raw.scopeId as string,checkoutId:'inspection'},raw.id as string,requestSha256))!==canonical(raw))return orderFail('invalid-record');return normalizeRecord({id:raw.id,data:raw}).data;
 }
 const inspect=(key:string,value:unknown)=>storage.transaction(tx=>inspectIn(tx,key,value));
 async function archiveIn(tx:HistoryTransaction,id:string){const key=eventKey(id),raw=await tx.get(key);if(raw===undefined)return undefined;const event=await inspectIn(tx,key,raw);if(!record(event)||event.kind!=='paid-order-admission')return undefined;const review=await archivedReview(tx,intentBase(prefix,event.streamRef as string),event.reviewId as string,context,event.streamRef as string);return {event,review};}
 return {
  async get(id){const key=eventKey(id),value=await storage.get(key);return value===undefined?undefined:{id,data:await inspect(key,value)};},
  async getOrderArchive(id){return storage.transaction(async tx=>{const result=await archiveIn(tx,id);return result?{id,review:result.review}:undefined;});},
  async getOrderAsset(id,sha256){if(!paidOrderHash(sha256))return orderFail('invalid-request');return storage.transaction(async tx=>{const result=await archiveIn(tx,id);if(!result||!result.review.definition.items.some(item=>item.guarantee?.status==='label-provided'&&item.guarantee.label.asset.sha256===sha256))return undefined;const bytes=await readOrderBlob(tx,intentBase(prefix,result.event.streamRef as string)+'assets/'+sha256+'/');if(await orderBytesHash(bytes)!==sha256)return orderFail('invalid-record');return bytes;});},
  async list(input){const query=normalizeRecordQuery(input),records=[];let after=query.after,scanned=0;
   while(scanned<200){const size=Math.min(50,200-scanned),batch=await storage.list({prefix:eventPrefix+query.keyPrefix,...(after===undefined?{}:{startAfter:eventPrefix+after}),limit:size});if(!(batch instanceof Map)||batch.size>size)return orderFail('invalid-record');
    for(const [key,value] of batch){const id=key.slice(eventPrefix.length);if(!key.startsWith(eventPrefix+query.keyPrefix)||!validId(id)||after!==undefined&&compareRecordKeys(id,after)<=0)return orderFail('invalid-record');const record={id,data:await inspect(key,value)};after=id;scanned++;if(matchesRecord(record,query))records.push(record);if(records.length===query.limit)return {records,nextAfter:after,scanned};}
    if(batch.size<size)return {records,scanned};
   }return {records,...(after===undefined?{}:{nextAfter:after}),scanned};
  },
 };
}
