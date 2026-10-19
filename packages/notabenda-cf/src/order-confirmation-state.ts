// @requirements REQ-EU-ORDER-CONFIRMATION REQ-PRODUCT-ORDER-CONFIRMATION
import {copyPaidOrderData,paidOrderHash} from './order-policy.js';
import {canonicalJson,sha256} from './history.js';
import type {HistoryTransaction} from './history.js';
import type {JsonValue} from './types.js';
import {orderFail,orderIso,orderText,orderSlug,orderUuid} from './order-context.js';
export interface OrderConfirmationFile {id:string;filename:string;mediaType:'text/plain'|'text/html'|'application/pdf'|'image/png'|'image/jpeg'|'image/svg+xml';role:'confirmation'|'attachment';sha256:string;bytes:number}
export interface OrderConfirmationContent {
 schemaVersion:1;kind:'paid-order-confirmation';siteId:string;scopeId:string;contextRef:string;admissionId:string;reviewId:string;
 contract:{reference:string;concludedAt:string};addressee:{name:string;recipientRef:string;destinationRef:string;destinationVersion:string};issuedAt:string;locale:string;reviewStatus:'draft'|'reviewed';
 coverage:{selfContained:true;preContractInformation:'included-in-files';digitalContent:{status:'not-applicable';reason:string}|{status:'included';evidenceRef:string;confirmationText:string}};
 files:OrderConfirmationFile[];
}
export type OrderConfirmationManifest=OrderConfirmationContent&{confirmationId:string};
export interface OrderConfirmationDelivery {deliveryId:string;confirmationId:string;status:'pending'|'leased'|'uncertain'|'accepted'|'cancelled';version:number;attempts:number;lease:null|{token:string;expiresAt:string};providerRef:string|null;createdAt:string;updatedAt:string}
export interface OrderConfirmationArchive {manifest:OrderConfirmationManifest;delivery:OrderConfirmationDelivery}
export const confirmationCanonical=(input:unknown)=>canonicalJson(input as JsonValue);
export const confirmationDeliveryId=(admissionId:string,confirmationId:string)=>sha256(confirmationCanonical(['notabenda-order-confirmation-delivery-v1',admissionId,confirmationId]));
export const confirmationBase=(prefix:string,ref:string)=>prefix+'intents/'+ref+'/confirmation/';
export const confirmationExact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export const confirmationFileName=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/u.test(v);
export const confirmationMedia=['text/plain','text/html','application/pdf','image/png','image/jpeg','image/svg+xml'] as const;
const count=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
/** Validates a bounded immutable manifest. Host declarations do not establish legal sufficiency. */
export async function validateOrderConfirmation(input:unknown):Promise<OrderConfirmationManifest>{
 const m=copyPaidOrderData(input);
 if(!confirmationExact(m,['schemaVersion','kind','siteId','scopeId','contextRef','admissionId','reviewId','contract','addressee','issuedAt','locale','reviewStatus','coverage','files','confirmationId'])||m.schemaVersion!==1||m.kind!=='paid-order-confirmation'||!orderSlug(m.siteId)||!orderSlug(m.scopeId)||![m.contextRef,m.admissionId,m.reviewId,m.confirmationId].every(paidOrderHash)||!orderIso(m.issuedAt)||!orderText(m.locale,35)||! /^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/u.test(m.locale)||!['draft','reviewed'].includes(m.reviewStatus as string))return orderFail('invalid-confirmation');
 if(!confirmationExact(m.contract,['reference','concludedAt'])||!orderText(m.contract.reference)||!orderIso(m.contract.concludedAt)||m.contract.concludedAt>m.issuedAt||!confirmationExact(m.addressee,['name','recipientRef','destinationRef','destinationVersion'])||!orderText(m.addressee.name)||!orderText(m.addressee.recipientRef)||!orderText(m.addressee.destinationRef)||!orderText(m.addressee.destinationVersion))return orderFail('invalid-confirmation');
 const c=m.coverage;if(!confirmationExact(c,['selfContained','preContractInformation','digitalContent'])||c.selfContained!==true||c.preContractInformation!=='included-in-files')return orderFail('invalid-confirmation');const d=c.digitalContent;
 if(!(confirmationExact(d,['status','reason'])&&d.status==='not-applicable'&&orderText(d.reason,600)||confirmationExact(d,['status','evidenceRef','confirmationText'])&&d.status==='included'&&orderText(d.evidenceRef)&&orderText(d.confirmationText,1200)))return orderFail('invalid-confirmation');
 if(!Array.isArray(m.files)||m.files.length<1||m.files.length>16)return orderFail('invalid-confirmation');let total=0,main=0;const ids=new Set(),names=new Set();
 for(const f of m.files){if(!confirmationExact(f,['id','filename','mediaType','role','sha256','bytes'])||!orderSlug(f.id)||ids.has(f.id)||!confirmationFileName(f.filename)||names.has(f.filename.toLowerCase())||!confirmationMedia.includes(f.mediaType as typeof confirmationMedia[number])||!['confirmation','attachment'].includes(f.role as string)||!paidOrderHash(f.sha256)||!Number.isSafeInteger(f.bytes)||Number(f.bytes)<1||Number(f.bytes)>2097152)return orderFail('invalid-confirmation');ids.add(f.id);names.add(f.filename.toLowerCase());total+=Number(f.bytes);if(f.role==='confirmation'){main++;if(f.mediaType!=='text/plain')return orderFail('invalid-confirmation');}}
 if(main!==1||total>8388608)return orderFail('invalid-confirmation');
 const {confirmationId,...content}=m;if(await sha256(confirmationCanonical(content))!==confirmationId)return orderFail('invalid-confirmation');return m as unknown as OrderConfirmationManifest;
}
export async function readConfirmationState(tx:Pick<HistoryTransaction,'get'>,base:string,binding:{siteId:string;scopeId:string;contextRef:string;admissionId:string;reviewId:string}):Promise<OrderConfirmationArchive|undefined>{
 const raw=await tx.get(base+'manifest'),job=await tx.get(base+'delivery');if(raw===undefined){if(job!==undefined)return orderFail('invalid-record');return undefined;}
 const m=await validateOrderConfirmation(raw);if(Object.entries(binding).some(([k,v])=>m[k as keyof typeof m]!==v))return orderFail('scope-mismatch');const j=copyPaidOrderData(job);
 if(!confirmationExact(j,['deliveryId','confirmationId','status','version','attempts','lease','providerRef','createdAt','updatedAt'])||j.deliveryId!==await confirmationDeliveryId(m.admissionId,m.confirmationId)||j.confirmationId!==m.confirmationId||!['pending','leased','uncertain','accepted','cancelled'].includes(j.status as string)||!count(j.version)||!count(j.attempts)||j.attempts>j.version||!orderIso(j.createdAt)||!orderIso(j.updatedAt)||j.createdAt<m.issuedAt||j.updatedAt<j.createdAt||!(j.providerRef===null||orderText(j.providerRef))||(j.status==='accepted')!==(j.providerRef!==null)||!(j.lease===null||confirmationExact(j.lease,['token','expiresAt'])&&orderUuid(j.lease.token)&&orderIso(j.lease.expiresAt)&&j.lease.expiresAt>j.updatedAt)||(j.status==='leased')!==(j.lease!==null))return orderFail('invalid-record');
 if(j.status==='pending'&&(j.version!==0||j.attempts!==0)||['leased','uncertain','accepted'].includes(j.status as string)&&j.attempts===0||j.status==='cancelled'&&j.version===0)return orderFail('invalid-record');
 return {manifest:m,delivery:j as unknown as OrderConfirmationDelivery};
}
export function confirmationSummary(archive:OrderConfirmationArchive):JsonValue {const {manifest:m,delivery:j}=archive;return {status:j.status,confirmationId:m.confirmationId,issuedAt:m.issuedAt,deliveryId:j.deliveryId,attempts:j.attempts,updatedAt:j.updatedAt,providerRef:j.providerRef};}
