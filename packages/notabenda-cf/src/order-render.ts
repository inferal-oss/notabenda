// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {confirmationStatus} from './order-confirmation-render.js';
import {escapeHtml as e,readableTime} from './render.js';
import {renderPaidOrderReview} from './order-review.js';
import {normalizePaidOrderReview,formatPaidOrderMoney} from './order-policy.js';
import {canonicalJson,sha256} from './history.js';
import type {EvidenceRecord,JsonValue,PaidOrderArchive} from './types.js';
import type {PaidOrderReview} from './order-policy.js';
const object=(v:unknown):Record<string,JsonValue>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,JsonValue>:{};
const text=(v:unknown)=>typeof v==='string'?v:'Not recorded';
const url=(base:string,route:string,id:string,sha256?:string)=>base+'/'+route+'?'+new URLSearchParams({id,...(sha256?{sha256}:{})});
function price(v:unknown,pricing:Record<string,JsonValue>):string {
 const amount=object(v);if(amount.kind!=='fixed')return 'Calculated';
 try{return formatPaidOrderMoney(String(amount.amountMinor),{currency:String(pricing.currency),fractionDigits:Number(pricing.fractionDigits)},'en');}catch{return 'Not recorded';}
}
function products(data:Record<string,JsonValue>):string{return Array.isArray(data.items)?data.items.map(i=>text(object(i).name)).join(' + '):'Order request';}
export function paidOrderCard(record:EvidenceRecord,basePath:string):string|undefined {
 const data=object(record.data);if(data.kind!=='paid-order-admission')return undefined;const pricing=object(data.pricing);
 return `<article class="order-record"><div><span class="order-record-state">Request received</span><h2><a class="record-link" href="${e(url(basePath,'record',record.id))}">${e(products(data))}<span aria-hidden="true"> ↗</span></a></h2><p>${readableTime(data.occurredAt)}</p><small>Quote ${e(text(object(data.request).quoteId))}</small>${data.confirmationDelivery?`<p>Confirmation · ${e(confirmationStatus(object(data.confirmationDelivery).status))}</p>`:''}</div><div class="order-record-price"><strong>${e(price(pricing.totalPrice,pricing))}</strong><span>${e(price(pricing.dueNow,pricing))} due now</span></div></article>`;
}
const facts=(rows:[string,unknown][])=>`<dl>${rows.map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${e(text(value))}</dd></div>`).join('')}</dl>`;
function heading(data:Record<string,JsonValue>):string {
 return `<header class="order-heading"><p class="eyebrow">Order request</p><h1>${e(products(data))}</h1><p>Received ${readableTime(data.occurredAt)}</p></header><div class="order-statuses">${[['Request','Received'],['Payment','Not reported'],['Fulfillment','Not reported'],['Contract',data.confirmationDelivery?'Reported by host':'Not reported'],['Confirmation',confirmationStatus(object(data.confirmationDelivery).status)]].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
}
export function paidOrderDetail(record:EvidenceRecord,basePath:string,archiveEnabled:boolean,confirmationEnabled=false):string|undefined {
 const data=object(record.data);if(data.kind!=='paid-order-admission')return undefined;const request=object(data.request),pricing=object(data.pricing);
 return `<div class="order-admin"><a class="order-back" href="${e(basePath)}">← Back to evidence search</a>${heading(data)}<div class="order-detail-grid"><section class="order-context"><h2>Request context</h2>${facts([['Request ID',request.requestId],['Quote',request.quoteId],['Quote revision',request.quoteRevision],['Site',data.siteId],['Workflow scope',data.scopeId]])}</section><aside class="order-amounts" aria-label="Recorded prices"><p>Total price</p><strong>${e(price(pricing.totalPrice,pricing))}</strong><p>Due now</p><strong>${e(price(pricing.dueNow,pricing))}</strong></aside></div><section class="order-stored-review"><h2>Information presented</h2><p>The retained definition and quote identify the information supplied for this request. Payment, fulfillment and contract formation are separate host operations.</p>${archiveEnabled?`<a class="button" href="${e(url(basePath,'order-review',record.id))}">Inspect retained review <span aria-hidden="true">↗</span></a>`:'<p class="hint">Complete review inspection requires a separate permission from your host.</p>'}</section><section class="order-stored-review"><h2>Contract confirmation</h2><p>${e(confirmationStatus(object(data.confirmationDelivery).status))}. The admission receipt above remains the original capture; delivery status is current operational information.</p>${confirmationEnabled&&data.confirmationDelivery?`<a class="button" href="${e(url(basePath,'order-confirmation',record.id))}">Inspect customer confirmation ↗</a>`:data.confirmationDelivery?'<p class="hint">Complete confirmation inspection requires separate permission.</p>':'<p class="hint">Your host can prepare the complete confirmation after reporting contract conclusion.</p>'}</section><details class="record-references"><summary>Evidence references</summary>${facts([['Admission ID',data.id],['Review ID',data.reviewId],['Definition ID',request.definitionId],['Checkout reference',data.streamRef],['Request SHA-256',data.requestSha256]])}</details><details><summary>Inspect record JSON</summary><pre>${e(JSON.stringify(record.data,null,2))}</pre></details></div>`;
}
/** A custom host store must return the exact retained review bound to this admission. */
export async function validateOrderArchive(input:unknown,record:EvidenceRecord):Promise<PaidOrderArchive>{
 if(!input||typeof input!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw Error('Invalid order archive.');
 const fields=Object.getOwnPropertyDescriptors(input),data=object(record.data);if(Reflect.ownKeys(fields).length!==2||!fields.id||!fields.review||!('value' in fields.id)||!('value' in fields.review)||!fields.id.enumerable||!fields.review.enumerable||fields.id.value!==record.id||data.kind!=='paid-order-admission')throw Error('Invalid order archive.');
 const review=normalizePaidOrderReview(fields.review.value,{allowPreview:true}),{reviewId,...content}=review,{definitionId,...definition}=review.definition,request=object(data.request);
 if(reviewId!==data.reviewId||request.reviewId!==reviewId||request.definitionId!==definitionId||request.quoteId!==review.quote.quoteId||request.quoteRevision!==review.quote.revision||review.quote.contextRef!==data.streamRef||review.definition.siteId!==data.siteId||await sha256(canonicalJson(content as unknown as JsonValue))!==reviewId||await sha256(canonicalJson(definition as unknown as JsonValue))!==definitionId)throw Error('Invalid order archive.');
 return {id:record.id,review};
}
export function orderArchiveBody(archive:PaidOrderArchive,record:EvidenceRecord,basePath:string):string {
 const review=archive.review,data=object(record.data),files=new Map<string,PaidOrderReview['definition']['items'][number]>();let rendered=renderPaidOrderReview(review,{idPrefix:'retained-order',headingLevel:3,allowPreview:true});
 for(const item of review.definition.items)if(item.guarantee?.status==='label-provided'){
  const asset=item.guarantee.label.asset;files.set(asset.sha256,item);
  rendered=rendered.replaceAll('src="'+asset.url+'"','src="'+e(url(basePath,'order-image',record.id,asset.sha256))+'"').replaceAll('href="'+asset.url+'"','href="'+e(url(basePath,'order-asset',record.id,asset.sha256))+'"');
 }
 return `<div class="order-admin"><a class="order-back" href="${e(url(basePath,'record',record.id))}">← Back to order request</a>${heading(data)}<section class="order-context"><h2>Payment action shown</h2><p class="order-recorded-action">${e(review.definition.wording.paymentActionLabel)}</p><p class="hint">Retained wording only. This archive cannot place an order.</p></section><section class="order-stored-review"><h2>Retained review</h2><p>The original facts, price schedule and wording bound to the request. This rendering does not prove a person saw or understood them.</p>${rendered}</section><section class="order-stored-review"><h2>Archive files</h2><a class="record-link" href="${e(url(basePath,'order-review.json',record.id))}">Download review JSON ↓</a>${[...files].map(([sha,item])=>{const asset=item.guarantee!.status==='label-provided'?item.guarantee!.label.asset:null;return asset?`<div class="order-file"><a href="${e(url(basePath,'order-asset',record.id,sha))}">Original label · ${e(item.name)} ↓</a><span>${asset.bytes.toLocaleString('en')} bytes · ${e(asset.mediaType)}</span><code>${sha}</code></div>`:'';}).join('')}</section><details class="record-references"><summary>Quote and review references</summary>${facts([['Quote ID',review.quote.quoteId],['Quote revision',review.quote.revision],['Issued at',review.quote.issuedAt],['Expires at',review.quote.expiresAt],['Review SHA-256',review.reviewId],['Definition SHA-256',review.definition.definitionId]])}</details></div>`;
}
