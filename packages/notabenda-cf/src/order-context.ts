// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {canonicalJson,sha256} from './history.js';
import {createDurableObjectStore} from './store.js';
export interface PaidOrderStoreOptions {siteId:string;prefix?:string;releasePrefix?:string;allowPreview?:boolean}
export interface PaidOrderContext extends PaidOrderStoreOptions {scopeId:string;checkoutId:string;now?:()=>Date}
export class PaidOrderRecordError extends Error {
 constructor(readonly code:'scope-mismatch'|'invalid-review'|'invalid-asset'|'invalid-record'|'invalid-request'|'invalid-clock'|'revision-conflict'|'idempotency-conflict'|'checkout-used'|'context-retired'|'invalid-decision'|'archive-limit'|'unavailable'|'invalid-confirmation'|'invalid-delivery'){super(code);this.name='PaidOrderRecordError';}
}
export const orderFail=(code:PaidOrderRecordError['code']):never=>{throw new PaidOrderRecordError(code);};
export const orderSlug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
export const orderText=(v:unknown,max=200):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
export const orderIso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
export const orderUuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
export function orderPrefixes(context:PaidOrderStoreOptions):{prefix:string;releasePrefix:string}{
 if(!context||!orderSlug(context.siteId)||context.allowPreview!==undefined&&typeof context.allowPreview!=='boolean')return orderFail('scope-mismatch');
 const prefix=context.prefix??`notabenda/orders/${context.siteId}/`,releasePrefix=context.releasePrefix??'notabenda/releases/';
 for(const value of [prefix,releasePrefix])try{createDurableObjectStore({get:async()=>undefined,list:async()=>new Map()},{prefix:value});}catch{return orderFail('scope-mismatch');}
 if(prefix.startsWith(releasePrefix)||releasePrefix.startsWith(prefix))return orderFail('scope-mismatch');return {prefix,releasePrefix};
}
/** Host-generated identity for one checkout intent, stable across pricing revisions. It is not a credential. */
export async function paidOrderCheckoutRef(context:Pick<PaidOrderContext,'siteId'|'scopeId'|'checkoutId'>):Promise<string>{
 if(!context||!orderSlug(context.siteId)||!orderSlug(context.scopeId)||!orderText(context.checkoutId))return orderFail('scope-mismatch');
 return sha256(canonicalJson(['notabenda-paid-order-checkout-v1',context.siteId,context.scopeId,context.checkoutId]));
}
export const paidOrderAdmissionId=(ref:string)=>sha256(canonicalJson(['notabenda-paid-order-admission-v1',ref]));
export function orderClock(context:Pick<PaidOrderContext,'now'>):string{try{const at=(context.now?.()??new Date()).toISOString();if(!orderIso(at))return orderFail('invalid-clock');return at;}catch{return orderFail('invalid-clock');}}
