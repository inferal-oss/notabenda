// @requirements REQ-EU-ORDER-CONFIRMATION REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {getPaidOrderAttempt} from './orders.js';
import type {PaidOrderRequest,PaidOrderOutcome} from './orders.js';
import {orderPrefixes,paidOrderCheckoutRef,paidOrderAdmissionId,orderFail,orderClock,orderText,orderUuid} from './order-context.js';
import type {PaidOrderContext} from './order-context.js';
import {copyPaidOrderData,paidOrderHash} from './order-policy.js';
import {assertEvidenceContextActive} from './lifecycle.js';
import {sha256} from './history.js';
import type {HistoryStorage,HistoryTransaction} from './history.js';
import {ownedOrderBytes,orderBytesHash,writeOrderBlob,readOrderBlob} from './order-blobs.js';
import {confirmationCanonical as canonical,confirmationBase,confirmationDeliveryId,confirmationExact as exact,validateOrderConfirmation,readConfirmationState} from './order-confirmation-state.js';
import type {OrderConfirmationContent,OrderConfirmationManifest,OrderConfirmationDelivery,OrderConfirmationArchive,OrderConfirmationFile} from './order-confirmation-state.js';
export type {OrderConfirmationContent,OrderConfirmationManifest,OrderConfirmationDelivery,OrderConfirmationArchive,OrderConfirmationFile} from './order-confirmation-state.js';
export interface PrepareOrderConfirmation {
 request:PaidOrderRequest;contract:OrderConfirmationContent['contract'];addressee:OrderConfirmationContent['addressee'];issuedAt:string;locale:string;reviewStatus:'draft'|'reviewed';coverage:OrderConfirmationContent['coverage'];
 files:(Omit<OrderConfirmationFile,'sha256'|'bytes'>&{bytes:Uint8Array})[];
}
export interface OrderConfirmationLease {admissionId:string;confirmationId:string;deliveryId:string;token:string;version:number;expiresAt:string;archive:OrderConfirmationArchive;files:{id:string;bytes:Uint8Array}[]}
const within=(tx:HistoryTransaction):HistoryStorage=>({get:key=>tx.get(key),list:async()=>{throw Error('Listing is unavailable.');},transaction:callback=>callback(tx)});
async function selected(context:PaidOrderContext){const {prefix}=orderPrefixes(context),ref=await paidOrderCheckoutRef(context),id=await paidOrderAdmissionId(ref);return {prefix,ref,id,base:confirmationBase(prefix,ref)};}
async function admission(tx:HistoryTransaction,context:PaidOrderContext,scope:Awaited<ReturnType<typeof selected>>):Promise<PaidOrderOutcome&{status:'received'}>{
 await assertEvidenceContextActive(tx,scope.prefix,'orders',context.siteId,scope.ref);
 const event=copyPaidOrderData(await tx.get(scope.prefix+'events/'+context.scopeId+'/'+scope.id));if(!event||typeof event!=='object'||Array.isArray(event))return orderFail('invalid-request');
 const result=await getPaidOrderAttempt(within(tx),(event as Record<string,unknown>).request,context);if(result?.status!=='received'||result.id!==scope.id)return orderFail('invalid-record');return result;
}
const binding=(context:PaidOrderContext,s:Awaited<ReturnType<typeof selected>>,a:PaidOrderRequest)=>({siteId:context.siteId,scopeId:context.scopeId,contextRef:s.ref,admissionId:s.id,reviewId:a.reviewId});
async function load(tx:HistoryTransaction,context:PaidOrderContext,s:Awaited<ReturnType<typeof selected>>){const a=await admission(tx,context,s),archive=await readConfirmationState(tx,s.base,binding(context,s,a));if(!archive)return orderFail('invalid-confirmation');if(!context.allowPreview&&archive.manifest.reviewStatus!=='reviewed')return orderFail('invalid-confirmation');return archive;}
async function files(tx:HistoryTransaction,base:string,m:OrderConfirmationManifest){const result=[];for(const file of m.files){const bytes=await readOrderBlob(tx,base+'files/'+file.sha256+'/');if(bytes.length!==file.bytes||await orderBytesHash(bytes)!==file.sha256)return orderFail('invalid-record');result.push({id:file.id,bytes});}return result;}
/** Host-only: retain a complete, personally addressed confirmation and queue its exact files atomically. No network or contract-formation decision. */
export async function preparePaidOrderConfirmation(storage:HistoryStorage,input:PrepareOrderConfirmation,context:PaidOrderContext):Promise<OrderConfirmationArchive>{
 // Copy binary inputs before the first await; do not retain caller-owned metadata or bytes.
 if(!input||!Array.isArray(input.files)||input.files.length<1||input.files.length>16)return orderFail('invalid-confirmation');
 const originals=input.files.map(file=>{if(!exact(file,['id','filename','mediaType','role','bytes']))return orderFail('invalid-confirmation');return {...file,bytes:ownedOrderBytes(file.bytes)};});
 if(originals.reduce((n,f)=>n+f.bytes.length,0)>8388608)return orderFail('invalid-confirmation');
 const meta=copyPaidOrderData({...input,files:originals.map(({bytes,...f})=>f)});if(!exact(meta,['request','contract','addressee','issuedAt','locale','reviewStatus','coverage','files']))return orderFail('invalid-confirmation');if(!meta.request||typeof meta.request!=='object'||!paidOrderHash((meta.request as PaidOrderRequest).reviewId))return orderFail('invalid-confirmation');context={...context};const s=await selected(context);
 const descriptors=[];for(const file of originals){const {bytes,...f}=file;descriptors.push({...f,bytes:bytes.length,sha256:await orderBytesHash(bytes)});}
 const content={schemaVersion:1,kind:'paid-order-confirmation',...binding(context,s,meta.request as PaidOrderRequest),contract:meta.contract,addressee:meta.addressee,issuedAt:meta.issuedAt,locale:meta.locale,reviewStatus:meta.reviewStatus,coverage:meta.coverage,files:descriptors},m=await validateOrderConfirmation({...content,confirmationId:await sha256(canonical(content))});
 if(!context.allowPreview&&m.reviewStatus!=='reviewed')return orderFail('invalid-confirmation');
 const primary=originals.find(f=>f.role==='confirmation');let text='';try{text=new TextDecoder('utf-8',{fatal:true}).decode(primary!.bytes);}catch{return orderFail('invalid-confirmation');}
 if(!text.trim()||text.includes('\0')||!text.includes(m.contract.reference)||!text.includes(m.addressee.name)||m.coverage.digitalContent.status==='included'&&!text.includes(m.coverage.digitalContent.confirmationText))return orderFail('invalid-confirmation');
 return storage.transaction(async tx=>{
  const a=await admission(tx,context,s);if(canonical(a)!==canonical({...meta.request as PaidOrderRequest,status:'received',id:a.id,receivedAt:a.receivedAt})||a.reviewId!==m.reviewId)return orderFail('scope-mismatch');
  const prior=await readConfirmationState(tx,s.base,binding(context,s,a));if(prior){if(prior.manifest.confirmationId!==m.confirmationId)return orderFail('idempotency-conflict');await files(tx,s.base,prior.manifest);return prior;}
  const at=orderClock(context);if(at<m.issuedAt)return orderFail('invalid-clock');
  for(const file of originals)await writeOrderBlob(tx,s.base+'files/'+await orderBytesHash(file.bytes)+'/',file.bytes);
  const delivery:OrderConfirmationDelivery={deliveryId:await confirmationDeliveryId(s.id,m.confirmationId),confirmationId:m.confirmationId,status:'pending',version:0,attempts:0,lease:null,providerRef:null,createdAt:at,updatedAt:at};
  await tx.put(s.base+'manifest',m);await tx.put(s.base+'delivery',delivery);return {manifest:m,delivery};
 });
}
/** Host-selected private read; an admission or manifest hash is not a credential. */
export async function readPaidOrderConfirmation(storage:HistoryStorage,context:PaidOrderContext):Promise<OrderConfirmationArchive|undefined>{context={...context};const s=await selected(context);return storage.transaction(async tx=>{const a=await admission(tx,context,s);return readConfirmationState(tx,s.base,binding(context,s,a));});}
export async function readPaidOrderConfirmationFile(storage:HistoryStorage,fileId:string,context:PaidOrderContext):Promise<Uint8Array>{context={...context};const s=await selected(context);return storage.transaction(async tx=>{const archive=await load(tx,context,s),file=archive.manifest.files.find(f=>f.id===fileId);if(!file)return orderFail('invalid-request');const bytes=await readOrderBlob(tx,s.base+'files/'+file.sha256+'/');if(bytes.length!==file.bytes||await orderBytesHash(bytes)!==file.sha256)return orderFail('invalid-record');return bytes;});}
/** Claim only. Hosts schedule and deduplicate using the stable deliveryId, never the attempt token. */
export async function claimPaidOrderConfirmation(storage:HistoryStorage,context:PaidOrderContext,options:{leaseMs?:number;maxAttempts?:number}={}):Promise<OrderConfirmationLease|undefined>{
 const leaseMs=options.leaseMs??60000,maxAttempts=options.maxAttempts??10;if(!Number.isInteger(leaseMs)||leaseMs<1000||leaseMs>300000||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>100)return orderFail('invalid-delivery');context={...context};const s=await selected(context),token=crypto.randomUUID();
 return storage.transaction(async tx=>{const archive=await load(tx,context,s),j=archive.delivery;if(['accepted','cancelled'].includes(j.status)||j.attempts>=maxAttempts)return undefined;
  // Reconstruct and verify before reading the claim clock. Storage latency consumes no unissued lease.
  const originals=await files(tx,s.base,archive.manifest),at=orderClock(context);if(at<j.updatedAt)return orderFail('invalid-clock');if(j.status==='leased'&&j.lease!.expiresAt>at)return undefined;if(j.version>=Number.MAX_SAFE_INTEGER)return orderFail('invalid-record');
  const expiresAt=new Date(Date.parse(at)+leaseMs).toISOString();j.status='leased';j.version++;j.attempts++;j.lease={token,expiresAt};j.updatedAt=at;await tx.put(s.base+'delivery',j);
  return {admissionId:s.id,confirmationId:j.confirmationId,deliveryId:j.deliveryId,token,version:j.version,expiresAt,archive,files:originals};
 });
}
/** Provider acceptance is separate from recipient delivery, payment and fulfillment. */
export async function settlePaidOrderConfirmation(storage:HistoryStorage,lease:OrderConfirmationLease,outcome:{status:'accepted';providerRef:string}|{status:'uncertain'},context:PaidOrderContext):Promise<{settled:boolean}>{
 // Ignore caller-supplied document copies: only the immutable lease identity can settle its stored job.
 if(!lease||!paidOrderHash(lease.admissionId)||!paidOrderHash(lease.confirmationId)||!paidOrderHash(lease.deliveryId)||!orderUuid(lease.token)||!Number.isSafeInteger(lease.version))return orderFail('invalid-delivery');
 const l={admissionId:lease.admissionId,confirmationId:lease.confirmationId,deliveryId:lease.deliveryId,token:lease.token,version:lease.version},o=copyPaidOrderData(outcome);
 if(!(exact(o,['status','providerRef'])&&o.status==='accepted'&&orderText(o.providerRef)||exact(o,['status'])&&o.status==='uncertain'))return orderFail('invalid-delivery');context={...context};const s=await selected(context);if(s.id!==l.admissionId)return orderFail('scope-mismatch');
 return storage.transaction(async tx=>{const archive=await load(tx,context,s),j=archive.delivery,at=orderClock(context);if(at<j.updatedAt)return orderFail('invalid-clock');if(j.status!=='leased'||j.lease!.token!==l.token||j.version!==l.version||j.deliveryId!==l.deliveryId||j.confirmationId!==l.confirmationId||j.lease!.expiresAt<=at)return {settled:false};j.status=o.status as 'accepted'|'uncertain';j.providerRef=o.status==='accepted'?o.providerRef as string:null;j.lease=null;j.updatedAt=at;await tx.put(s.base+'delivery',j);return {settled:true};});
}
/** Cancel only after the host actually stops/fences external delivery, including timed-out attempts. */
export async function cancelPaidOrderConfirmation(storage:HistoryStorage,decision:{expectedVersion:number;externalWorkStopped:true},context:PaidOrderContext):Promise<void>{
 const d=copyPaidOrderData(decision);if(!exact(d,['expectedVersion','externalWorkStopped'])||!Number.isSafeInteger(d.expectedVersion)||Number(d.expectedVersion)<0||d.externalWorkStopped!==true)return orderFail('invalid-delivery');context={...context};const s=await selected(context);
 return storage.transaction(async tx=>{const archive=await load(tx,context,s),j=archive.delivery,at=orderClock(context);if(at<j.updatedAt)return orderFail('invalid-clock');if(j.version!==d.expectedVersion)return orderFail('revision-conflict');if(['accepted','cancelled'].includes(j.status))return;if(j.version>=Number.MAX_SAFE_INTEGER)return orderFail('invalid-record');j.status='cancelled';j.version++;j.lease=null;j.updatedAt=at;await tx.put(s.base+'delivery',j);});
}

export {dispatchPaidOrderConfirmation} from './order-confirmation-dispatch.js';
export type {OrderConfirmationAttempt,OrderConfirmationDispatchOptions,OrderConfirmationDispatchResult} from './order-confirmation-dispatch.js';
