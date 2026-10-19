// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-SAFE-CONTENT
import {normalizeDurabilityGuaranteeLabel} from './guarantee-label.js';
import type {DurabilityGuaranteeLabel} from './guarantee-label.js';
export type PaidOrderAmount={kind:'fixed';amountMinor:string}|{kind:'calculated';method:string;reason:string};
export type PaidOrderGuarantee={status:'label-provided';label:DurabilityGuaranteeLabel}|{status:'no-label-required';disclosure:string}|{status:'unresolved';disclosure:string};
export interface PaidOrderItem {
 id:string;productId:string;name:string;kind:'goods'|'service'|'digital-content';characteristics:string[];
 commitment:{duration:string;termination:string;minimum:string};guarantee:PaidOrderGuarantee|null;
}
export interface PaidOrderWording {
 title:string;items:string;quantity:string;duration:string;termination:string;minimum:string;prices:string;totalPrice:string;dueNow:string;
 amount:string;calculated:string;method:string;reason:string;due:string;condition:string;once:string;recurring:string;
 period:string;frequency:string;cycles:string;unbounded:string;monthly:string;changes:string;taxes:string;documents:string;version:string;draft:string;guarantee:string;
 paymentActionLabel:string;ready:string;loadingImages:string;imageUnavailable:string;submitting:string;uncertain:string;received:string;stale:string;unavailable:string;checkoutUsed:string;reconcileLabel:string;reconciling:string;
}
export const paidOrderEnglishWording:Readonly<PaidOrderWording>=Object.freeze({
 title:'Review your order',items:'Your items',quantity:'Quantity',duration:'Contract duration',termination:'Termination',minimum:'Minimum commitment',
 prices:'Price and payment',totalPrice:'Total price',dueNow:'Due now',amount:'Amount',calculated:'Calculated charge',method:'How it is calculated',reason:'Why no fixed price is shown',
 due:'When payment is due',condition:'Payment condition',once:'One-off charge',recurring:'Recurring charge',period:'Billing period',frequency:'Charge frequency',cycles:'Number of charges',unbounded:'No fixed end',monthly:'Fixed monthly cost',
 changes:'Introductory or later price changes',taxes:'Taxes and additional charges',documents:'Documents',version:'Version',
 draft:'Draft order information — review the product facts, prices, contract conditions and payment wording.',guarantee:'Producer guarantee information',paymentActionLabel:'Order with obligation to pay',ready:'Review the information above before ordering.',loadingImages:'Loading the required guarantee information…',imageUnavailable:'The required guarantee label could not be displayed. Ordering is unavailable.',submitting:'Sending your order request…',uncertain:'We could not confirm this order request. Check its status before starting another order.',received:'Your order request was received. Payment, fulfillment and contract confirmation have their own status.',stale:'This quote is no longer available. Review an updated quote before ordering.',unavailable:'Ordering is unavailable. Reload the page or contact the seller.',checkoutUsed:'This checkout already has an order request. Check its status with the seller before ordering again.',reconcileLabel:'Check this order request',reconciling:'Checking this order request…',
});
export interface PaidOrderDefinition {
 schemaVersion:1;kind:'paid-order-definition';profile:'eu-paid-distance-order-v1';renderingPolicy:'paid-order-v1';definitionId:string;siteId:string;locale:string;direction:'ltr'|'rtl';reviewStatus:'draft'|'reviewed';
 items:PaidOrderItem[];wording:PaidOrderWording;
 documents:{kind:'privacy'|'terms'|'cookies';title:string;version:string;artifactId:string;sha256:string;url:string}[];
}
export interface PaidOrderPayment {
 id:string;lineIds:string[];label:string;amount:PaidOrderAmount;
 due:{kind:'now'}|{kind:'later';when:string}|{kind:'conditional';condition:string};
 recurrence:{kind:'once'}|{kind:'recurring';period:string;cycles:number|null;monthlyCost:PaidOrderAmount;changes:string};
}
/** Opaque public references do not authorize access. Hosts authenticate the checkout and calculate all prices. */
export interface PaidOrderQuote {
 quoteId:string;revision:string;contextRef:string;definitionId:string;issuedAt:string;expiresAt:string;
 lines:{itemId:string;quantity:number}[];
 pricing:{currency:string;fractionDigits:number;payments:PaidOrderPayment[];totalPrice:PaidOrderAmount;dueNow:PaidOrderAmount;taxAndChargesNotice:string};
}
export interface PaidOrderReview {schemaVersion:1;kind:'paid-order-review';reviewId:string;definition:PaidOrderDefinition;quote:PaidOrderQuote}
export const paidOrderHash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const bad=():never=>{throw Error('Invalid paid-order information. Supply explicit reviewed facts, exact price components, commitments and goods guarantee assessments.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v:unknown,names:string[]):v is Record<string,unknown>=>object(v)&&Object.keys(v).length===names.length&&names.every(n=>Object.hasOwn(v,n));
const text=(v:unknown,max=2000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f\u202a-\u202e]/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
export const paidOrderMinor=(v:unknown):v is string=>typeof v==='string'&&/^(?:0|[1-9][0-9]{0,14})$/u.test(v);
const iso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const array=(v:unknown,min:number,max:number):v is unknown[]=>Array.isArray(v)&&v.length>=min&&v.length<=max;
function amount(v:unknown):v is PaidOrderAmount {
 return keys(v,['kind','amountMinor'])&&v.kind==='fixed'&&paidOrderMinor(v.amountMinor)||keys(v,['kind','method','reason'])&&v.kind==='calculated'&&text(v.method)&&text(v.reason);
}
/** Plain bounded JSON inspection precedes serialization. Getters/toJSON are never invoked. No network or DOM access. */
export function copyPaidOrderData(input:unknown):unknown {
 const active=new Set<object>();let count=0,bytes=0;
 function visit(v:unknown,depth:number):void {
  if(++count>12000||depth>16||bytes>262144)return bad();
  if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)){bytes+=24;return;}
  if(typeof v==='string'){if(v.length>16000)return bad();bytes+=new TextEncoder().encode(v).length+4;return;}
  if(!v||typeof v!=='object'||active.has(v))return bad();
  if(Array.isArray(v)?Object.getPrototypeOf(v)!==Array.prototype:Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)return bad();
  const descriptors=Object.getOwnPropertyDescriptors(v),names=Reflect.ownKeys(descriptors);
  if(names.length>129||names.some(n=>typeof n!=='string')||Array.isArray(v)&&(v.length>128||Object.keys(v).length!==v.length))return bad();
  active.add(v);
  for(const name of names){if(Array.isArray(v)&&name==='length')continue;const d=descriptors[name as string]!;if(!Object.hasOwn(d,'value')||!d.enumerable)return bad();bytes+=String(name).length*4+4;visit(d.value,depth+1);}
  active.delete(v);
 }
 visit(input,0);if(bytes>262144)return bad();const encoded=JSON.stringify(input);if(new TextEncoder().encode(encoded).length>262144)return bad();return JSON.parse(encoded);
}
export function normalizePaidOrderDefinition(input:unknown,options:{allowPreview?:boolean}={}):PaidOrderDefinition {
 const d=copyPaidOrderData(input);
 if(!keys(d,['schemaVersion','kind','profile','renderingPolicy','definitionId','siteId','locale','direction','reviewStatus','items','wording','documents'])||d.schemaVersion!==1||d.kind!=='paid-order-definition'||d.profile!=='eu-paid-distance-order-v1'||d.renderingPolicy!=='paid-order-v1'||!paidOrderHash(d.definitionId)||!slug(d.siteId)||!text(d.locale,100)||!['ltr','rtl'].includes(d.direction as string)||!['draft','reviewed'].includes(d.reviewStatus as string)||!array(d.items,1,32)||!array(d.documents,0,3)||!keys(d.wording,Object.keys(paidOrderEnglishWording))||!Object.values(d.wording).every(v=>text(v)))return bad();
 try{Intl.getCanonicalLocales(d.locale);}catch{return bad();}
 if(options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean')return bad();
 if(!options.allowPreview&&d.reviewStatus!=='reviewed')throw Error('Paid-order wording and product facts need review; draft preview must be explicit.');
 const ids=new Set<string>();
 for(const item of d.items){
  if(!keys(item,['id','productId','name','kind','characteristics','commitment','guarantee'])||!slug(item.id)||ids.has(item.id)||!slug(item.productId)||!text(item.name,300)||!['goods','service','digital-content'].includes(item.kind as string)||!array(item.characteristics,1,12)||!item.characteristics.every(c=>text(c))||!keys(item.commitment,['duration','termination','minimum'])||!Object.values(item.commitment).every(v=>text(v)))return bad();ids.add(item.id);
  if(item.kind!=='goods'){if(item.guarantee!==null)return bad();continue;}
  const g=item.guarantee;
  if(keys(g,['status','label'])&&g.status==='label-provided'){
   const label=normalizeDurabilityGuaranteeLabel(g.label,{allowPreview:options.allowPreview===true});
   if(label.product.id!==item.productId)return bad();item.guarantee={status:'label-provided',label};
  }else if(keys(g,['status','disclosure'])&&['no-label-required','unresolved'].includes(g.status as string)&&text(g.disclosure)){
   if(!options.allowPreview&&g.status==='unresolved')throw Error('Resolve the goods guarantee assessment before production. Missing facts never establish absence of a qualifying guarantee.');
  }else return bad();
 }
 const kinds=new Set<string>();for(const doc of d.documents){
  if(!keys(doc,['kind','title','version','artifactId','sha256','url'])||!['privacy','terms','cookies'].includes(doc.kind as string)||kinds.has(doc.kind as string)||!text(doc.title,300)||!text(doc.version,200)||!paidOrderHash(doc.artifactId)||!paidOrderHash(doc.sha256)||doc.url!==`/artifacts/${doc.artifactId}/${doc.kind as string}.html`)return bad();kinds.add(doc.kind as string);
 }
 return d as unknown as PaidOrderDefinition;
}
/** Validate explicit host-calculated amounts, not legal applicability, tax correctness or a live quote's authenticity. */
export function normalizePaidOrderQuote(input:unknown,definition:PaidOrderDefinition):PaidOrderQuote {
 const q=copyPaidOrderData(input);
 if(!keys(q,['quoteId','revision','contextRef','definitionId','issuedAt','expiresAt','lines','pricing'])||!text(q.quoteId,120)||!text(q.revision,120)||!paidOrderHash(q.contextRef)||q.definitionId!==definition.definitionId||!iso(q.issuedAt)||!iso(q.expiresAt)||Date.parse(q.expiresAt)<=Date.parse(q.issuedAt)||Date.parse(q.expiresAt)-Date.parse(q.issuedAt)>604800000||!array(q.lines,1,32)||q.lines.length!==definition.items.length||!keys(q.pricing,['currency','fractionDigits','payments','totalPrice','dueNow','taxAndChargesNotice']))return bad();
 const p=q.pricing;
 if(typeof p.currency!=='string'||!/^[A-Z]{3}$/u.test(p.currency)||!Number.isInteger(p.fractionDigits)||Number(p.fractionDigits)<0||Number(p.fractionDigits)>4||!text(p.taxAndChargesNotice)||!array(p.payments,1,64)||!amount(p.totalPrice)||!amount(p.dueNow))return bad();
 const lines=new Set<string>();for(const line of q.lines){if(!keys(line,['itemId','quantity'])||!slug(line.itemId)||lines.has(line.itemId)||!definition.items.some(i=>i.id===line.itemId)||!Number.isInteger(line.quantity)||Number(line.quantity)<1||Number(line.quantity)>999999)return bad();lines.add(line.itemId);}
 const ids=new Set<string>(),covered=new Set<string>();let fixedNow=0n,calculatedNow=false,hasObligation=false,fixedTotal=0n,calculatedTotal=false;
 for(const payment of p.payments){
  if(!keys(payment,['id','lineIds','label','amount','due','recurrence'])||!slug(payment.id)||ids.has(payment.id)||!array(payment.lineIds,0,32)||!payment.lineIds.every(id=>typeof id==='string'&&lines.has(id))||new Set(payment.lineIds).size!==payment.lineIds.length||!text(payment.label,300)||!amount(payment.amount))return bad();ids.add(payment.id);for(const id of payment.lineIds)covered.add(id as string);
  const due=payment.due,recurrence=payment.recurrence;
  if(!(keys(due,['kind'])&&due.kind==='now'||keys(due,['kind','when'])&&due.kind==='later'&&text(due.when)||keys(due,['kind','condition'])&&due.kind==='conditional'&&text(due.condition)))return bad();
  if(!(keys(recurrence,['kind'])&&recurrence.kind==='once'||keys(recurrence,['kind','period','cycles','monthlyCost','changes'])&&recurrence.kind==='recurring'&&text(recurrence.period,300)&&(recurrence.cycles===null||Number.isInteger(recurrence.cycles)&&Number(recurrence.cycles)>=1&&Number(recurrence.cycles)<=1200)&&amount(recurrence.monthlyCost)&&text(recurrence.changes)))return bad();
  if(payment.amount.kind==='calculated'||BigInt(payment.amount.amountMinor)>0n)hasObligation=true;
  if(payment.amount.kind==='calculated'||recurrence.kind==='recurring'&&recurrence.cycles===null)calculatedTotal=true;
  else fixedTotal+=BigInt(payment.amount.amountMinor)*(recurrence.kind==='recurring'?BigInt(recurrence.cycles as number):1n);
  if(due.kind==='now'){if(payment.amount.kind==='calculated')calculatedNow=true;else fixedNow+=BigInt(payment.amount.amountMinor);}
 }
 if(calculatedTotal&&p.totalPrice.kind!=='calculated'||!calculatedTotal&&(p.totalPrice.kind!=='fixed'||BigInt(p.totalPrice.amountMinor)!==fixedTotal)||covered.size!==lines.size||!hasObligation||calculatedNow&&p.dueNow.kind!=='calculated'||!calculatedNow&&(p.dueNow.kind!=='fixed'||BigInt(p.dueNow.amountMinor)!==fixedNow))return bad();
 return q as unknown as PaidOrderQuote;
}
export function normalizePaidOrderReview(input:unknown,options:{allowPreview?:boolean}={}):PaidOrderReview {
 const r=copyPaidOrderData(input);if(!keys(r,['schemaVersion','kind','reviewId','definition','quote'])||r.schemaVersion!==1||r.kind!=='paid-order-review'||!paidOrderHash(r.reviewId))return bad();
 const definition=normalizePaidOrderDefinition(r.definition,options),quote=normalizePaidOrderQuote(r.quote,definition);return {schemaVersion:1,kind:'paid-order-review',reviewId:r.reviewId,definition,quote};
}
/** Exact minor-unit formatting: BigInt integer parts and an explicit fraction, never binary floating-point money. */
export function formatPaidOrderMoney(amountMinor:string,pricing:Pick<PaidOrderQuote['pricing'],'currency'|'fractionDigits'>,locale:string):string {
 if(!paidOrderMinor(amountMinor)||!Number.isInteger(pricing.fractionDigits)||pricing.fractionDigits<0||pricing.fractionDigits>4||!/^[A-Z]{3}$/u.test(pricing.currency))return bad();
 const digits=pricing.fractionDigits,amount=BigInt(amountMinor),scale=10n**BigInt(digits),fraction=digits?new Intl.NumberFormat(locale,{useGrouping:false,minimumIntegerDigits:digits,maximumFractionDigits:0}).format(amount%scale):'';
 return new Intl.NumberFormat(locale,{style:'currency',currency:pricing.currency,minimumFractionDigits:digits,maximumFractionDigits:digits}).formatToParts(amount/scale).map(p=>p.type==='fraction'?fraction:p.value).join('');
}
