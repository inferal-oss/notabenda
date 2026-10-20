// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-SAFE-CONTENT
import {createHash} from 'node:crypto';
import {normalizePaidOrderDefinition,normalizePaidOrderQuote,normalizePaidOrderReview,copyPaidOrderData,paidOrderEnglishWording} from '@notabenda/core/orders';
import type {PaidOrderDefinition,PaidOrderQuote,PaidOrderReview,PaidOrderWording} from '@notabenda/core/orders';
import {verifyDurabilityGuaranteeLabel} from './guarantee-label-build.js';
type Options={allowPreview?:boolean};
export type PaidOrderDefinitionInput=Omit<PaidOrderDefinition,'schemaVersion'|'kind'|'renderingPolicy'|'definitionId'|'wording'>&{wording?:PaidOrderWording};
const canonical=(v:unknown):string=>v&&typeof v==='object'?Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}':JSON.stringify(v);
const digest=(v:unknown)=>createHash('sha256').update(canonical(v)).digest('hex');
function assetsFor(definition:PaidOrderDefinition,assets:Record<string,Uint8Array>,options:Options):void {
 for(const item of definition.items)if(item.guarantee?.status==='label-provided'){
  const label=item.guarantee.label,entry=Object.getOwnPropertyDescriptor(assets,label.asset.url);
  if(!entry||!Object.hasOwn(entry,'value'))throw Error('Supply each original producer label file under its exact public asset URL.');
  verifyDurabilityGuaranteeLabel(label,entry.value,{allowPreview:options.allowPreview===true});
 }
}
/** A reviewed definition is independent of quantities, live prices and quote expiry. This does not certify its wording. */
export function createPaidOrderDefinition(input:PaidOrderDefinitionInput,options:Options={}):PaidOrderDefinition {
 const value=copyPaidOrderData(input) as Record<string,unknown>;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['profile','siteId','locale','direction','reviewStatus','items','wording','documents'].includes(k)))throw Error('Use the reviewed paid-order definition fields.');
 if(value.wording===undefined&&value.locale!=='en')throw Error('Supply all reviewed localized paid-order wording outside English.');
 const definition=normalizePaidOrderDefinition({schemaVersion:1,kind:'paid-order-definition',renderingPolicy:'paid-order-v1',definitionId:'0'.repeat(64),...value,wording:value.wording??paidOrderEnglishWording},options);
 const {definitionId:_,...content}=definition;return {...definition,definitionId:digest(content)};
}
function verifiedDefinition(input:unknown,options:Options):PaidOrderDefinition {
 const definition=normalizePaidOrderDefinition(input,options),{definitionId,...content}=definition;
 if(digest(content)!==definitionId)throw Error('Paid-order definition identity does not match its exact wording and facts.');return definition;
}
/** Bind a trusted host quote to the reviewed definition and verify all supplied original label files. No fetching or publication. */
export function createPaidOrderReview(input:unknown,hostQuote:PaidOrderQuote,assets:Record<string,Uint8Array>={},options:Options={}):PaidOrderReview {
 const definition=verifiedDefinition(input,options),quote=normalizePaidOrderQuote(hostQuote,definition);assetsFor(definition,assets,options);
 const content={schemaVersion:1 as const,kind:'paid-order-review' as const,definition,quote};return normalizePaidOrderReview({...content,reviewId:digest(content)},options);
}
/** Structural normalization alone is insufficient: verify both identities and the exact original asset files. */
export function verifyPaidOrderReview(input:unknown,assets:Record<string,Uint8Array>={},options:Options={}):PaidOrderReview {
 const review=normalizePaidOrderReview(input,options);verifiedDefinition(review.definition,options);assetsFor(review.definition,assets,options);
 const {reviewId,...content}=review;if(digest(content)!==reviewId)throw Error('Paid-order review identity does not match its definition and quote.');return review;
}
