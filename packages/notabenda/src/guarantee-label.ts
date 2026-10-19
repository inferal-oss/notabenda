/** @requirements REQ-EU-GUARANTEE-LABEL
 * A producer-prepared product label. Structural checks do not verify artwork or legal qualification.
 */
import {copyGuaranteeNoticeData} from './guarantee-notice-json.js';
export const durabilityGuaranteeInformationUrl='https://europa.eu/youreurope/commercial-guarantee-durability/index.htm';
export interface DurabilityGuaranteeWording {
 title:string;producerLabel:string;modelLabel:string;durationLabel:string;durationValue:string;
 imageAlt:string;fullSizeLink:string;informationLink:string;statementLink:string;
}
export interface DurabilityGuaranteeLabel {
 schemaVersion:1;kind:'eu-durability-guarantee-label';renderingPolicy:'guarantee-label-v1';labelId:string;
 reviewStatus:'draft'|'reviewed';locale:string;
 product:{id:string;name:string};producer:{brand:string;model:string};durationYears:number;
 qualification:{offeredByProducer:true;noAdditionalCost:true;coversEntireGood:true;informationProvidedToTrader:true};
 asset:{url:string;sha256:string;bytes:number;width:number;height:number;mediaType:'image/png'|'image/jpeg'|'image/svg+xml'};
 informationUrl:typeof durabilityGuaranteeInformationUrl;statementUrl?:string;wording:DurabilityGuaranteeWording;
}
const fail=():never=>{throw Error('Use a bounded product label with explicit qualifying producer facts and a finished reviewed asset. Missing facts do not establish that no guarantee exists.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,max=1000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
/** Whole or half years above two; 100 years is an implementation ceiling, not a legal maximum. */
const validDurabilityYears=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v*2)&&v>2&&v<=100;
/** JSON-only, bounded structural clone. No browser hash verification or assurance that the image will load. */
export function normalizeDurabilityGuaranteeLabel(input:unknown,options:{allowPreview?:boolean}={}):DurabilityGuaranteeLabel {
 let v:unknown;try{v=copyGuaranteeNoticeData(input);}catch{return fail();}
 if(!object(v)||!exact(v,['schemaVersion','kind','renderingPolicy','labelId','reviewStatus','locale','product','producer','durationYears','qualification','asset','informationUrl','wording',...(Object.hasOwn(v,'statementUrl')?['statementUrl']:[])])||v.schemaVersion!==1||v.kind!=='eu-durability-guarantee-label'||v.renderingPolicy!=='guarantee-label-v1'||!hash(v.labelId)||!text(v.locale,80)||!/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/u.test(v.locale)||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!validDurabilityYears(v.durationYears)||v.informationUrl!==durabilityGuaranteeInformationUrl)return fail();
 if(!object(v.product)||!exact(v.product,['id','name'])||!text(v.product.id,120)||!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u.test(v.product.id)||!text(v.product.name)||!object(v.producer)||!exact(v.producer,['brand','model'])||!Object.values(v.producer).every(x=>text(x)))return fail();
 const q=v.qualification,a=v.asset,w=v.wording;
 if(!object(q)||!exact(q,['offeredByProducer','noAdditionalCost','coversEntireGood','informationProvidedToTrader'])||!Object.values(q).every(x=>x===true))return fail();
 if(!object(a)||!exact(a,['url','sha256','bytes','width','height','mediaType'])||!hash(a.sha256)||typeof a.bytes!=='number'||!Number.isInteger(a.bytes)||a.bytes<1||a.bytes>2097152||typeof a.width!=='number'||typeof a.height!=='number'||!Number.isFinite(a.width)||!Number.isFinite(a.height)||a.width<=0||a.height<=0||a.width>4096||a.height>4096||a.width*a.height>8000000||!['image/png','image/jpeg','image/svg+xml'].includes(a.mediaType as string))return fail();
 const extension=a.mediaType==='image/png'?'png':a.mediaType==='image/jpeg'?'jpg':'svg';
 if(typeof a.url!=='string'||!new RegExp('^/(?:[a-zA-Z0-9_-]+/)*'+a.sha256+'\\.'+extension+'$','u').test(a.url))return fail();
 if(v.statementUrl!==undefined){if(typeof v.statementUrl!=='string'||v.statementUrl.length>2000)return fail();try{const url=new URL(v.statementUrl);if(url.protocol!=='https:'||url.username||url.password||/[\s\u0000-\u001f\u007f]/u.test(v.statementUrl))return fail();}catch{return fail();}}
 if(!object(w)||!exact(w,['title','producerLabel','modelLabel','durationLabel','durationValue','imageAlt','fullSizeLink','informationLink','statementLink'])||!Object.values(w).every(x=>text(x)))return fail();
 if(options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean')return fail();
 if(!options.allowPreview&&v.reviewStatus!=='reviewed')throw Error('Review the producer offer, product association, complete colour label, typography and QR before production. Draft preview must be explicit.');
 return v as unknown as DurabilityGuaranteeLabel;
}
const escape=(v:string)=>v.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Static full-label view. The host must deliver the image successfully and assess prominence/legibility. */
export function renderDurabilityGuaranteeLabel(input:unknown,options:{idPrefix:string;headingLevel?:2|3|4|5|6;allowPreview?:boolean}):string {
 const n=normalizeDurabilityGuaranteeLabel(input,{allowPreview:options?.allowPreview===true});
 if(!options||!/^[a-z][a-z0-9-]{0,119}$/u.test(options.idPrefix)||options.headingLevel!==undefined&&![2,3,4,5,6].includes(options.headingLevel))throw Error('Use a unique lowercase ID prefix and heading level 2–6.');
 const e=escape,id=options.idPrefix,h='h'+(options.headingLevel??2),w=n.wording;
 return `<section class="nb-guarantee-notice nb-guarantee-label" lang="${e(n.locale)}" aria-labelledby="${id}-title" data-guarantee-label-id="${n.labelId}" data-product-id="${e(n.product.id)}"><${h} id="${id}-title">${e(w.title)}</${h}>${n.reviewStatus==='draft'?'<p class="nb-draft" lang="en">Draft product guarantee display — review the offer, complete artwork and product association.</p>':''}<div class="nb-guarantee-layout"><div class="nb-guarantee-text"><p class="nb-guarantee-product">${e(n.product.name)}</p><dl><div><dt>${e(w.producerLabel)}</dt><dd>${e(n.producer.brand)}</dd></div><div><dt>${e(w.modelLabel)}</dt><dd>${e(n.producer.model)}</dd></div><div><dt>${e(w.durationLabel)}</dt><dd>${e(w.durationValue)}</dd></div></dl><a href="${n.informationUrl}">${e(w.informationLink)}</a>${n.statementUrl?`<p><a href="${e(n.statementUrl)}">${e(w.statementLink)}</a></p>`:''}</div><figure><img class="nb-guarantee-artwork" src="${n.asset.url}" width="${Math.max(1,Math.round(n.asset.width))}" height="${Math.max(1,Math.round(n.asset.height))}" alt="${e(w.imageAlt)}" decoding="async"><figcaption><a href="${n.asset.url}">${e(w.fullSizeLink)}</a></figcaption></figure></div></section>`;
}
