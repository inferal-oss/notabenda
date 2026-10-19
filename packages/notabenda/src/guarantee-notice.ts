/** @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE
 * Unchanged official shop-level artwork and a readable text alternative. No product guarantee is inferred.
 */
import {guaranteeNoticeAssets} from './guarantee-notice-data.js';
import {copyGuaranteeNoticeData} from './guarantee-notice-json.js';
export type GuaranteeNoticeLanguage=keyof typeof guaranteeNoticeAssets;
export interface GuaranteeNoticeWording {title:string;imageAlt:string;fullSizeLink:string;informationLink:string}
export interface LegalGuaranteeNotice {
  schemaVersion:1;kind:'eu-legal-guarantee-notice';renderingPolicy:'guarantee-notice-v1';sourceRevision:'ec-2026-10-19';
  noticeId:string;language:GuaranteeNoticeLanguage;reviewStatus:'draft'|'reviewed';
  asset:{url:string;sha256:string;bytes:number;width:number;height:number};
  informationUrl:string;textAlternative:string;wording:GuaranteeNoticeWording;
}
export const guaranteeNoticeLanguages=Object.freeze(Object.keys(guaranteeNoticeAssets) as GuaranteeNoticeLanguage[]);
const bad=():never=>{throw Error('Use a bounded reviewed guarantee notice and an unchanged official colour asset.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,max=4000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
/** Structural validation only; the browser does not enforce image integrity from metadata. */
export function normalizeLegalGuaranteeNotice(input:unknown,options:{allowPreview?:boolean}={}):LegalGuaranteeNotice {
  let v:unknown;
  try{v=copyGuaranteeNoticeData(input);}catch{return bad();}
  if(!object(v)||!exact(v,['schemaVersion','kind','renderingPolicy','sourceRevision','noticeId','language','reviewStatus','asset','informationUrl','textAlternative','wording'])||v.schemaVersion!==1||v.kind!=='eu-legal-guarantee-notice'||v.renderingPolicy!=='guarantee-notice-v1'||v.sourceRevision!=='ec-2026-10-19'||!hash(v.noticeId)||typeof v.language!=='string'||!Object.hasOwn(guaranteeNoticeAssets,v.language)||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!text(v.textAlternative,16000))return bad();
  const source=guaranteeNoticeAssets[v.language as GuaranteeNoticeLanguage],a=v.asset,w=v.wording;
  if(!object(a)||!exact(a,['url','sha256','bytes','width','height'])||a.sha256!==source.sha256||a.bytes!==source.bytes||a.width!==source.viewBox[2]||a.height!==source.viewBox[3]||typeof a.url!=='string'||!new RegExp('^/(?:[a-zA-Z0-9_-]+/)*'+source.sha256+'\\.svg$','u').test(a.url)||v.informationUrl!==source.informationUrl||!object(w)||!exact(w,['title','imageAlt','fullSizeLink','informationLink'])||!Object.values(w).every(x=>text(x,1000)))return bad();
  if(options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean')return bad();
  if(!options.allowPreview&&v.reviewStatus!=='reviewed')throw Error('Review the guarantee artwork, text alternative, language and placement before production; preview must be explicit.');
  return v as unknown as LegalGuaranteeNotice;
}
const escape=(v:string)=>v.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Full graphic, text and QR destination. No script, external image fetch, producer-label editing or acceptance action. */
export function renderLegalGuaranteeNotice(input:unknown,options:{idPrefix:string;headingLevel?:2|3|4|5|6;allowPreview?:boolean}):string {
  const n=normalizeLegalGuaranteeNotice(input,{allowPreview:options?.allowPreview===true});
  if(!options||!/^[a-z][a-z0-9-]{0,119}$/u.test(options.idPrefix)||options.headingLevel!==undefined&&![2,3,4,5,6].includes(options.headingLevel))throw Error('Use a unique lowercase ID prefix and heading level 2–6.');
  const e=escape,id=options.idPrefix,h='h'+(options.headingLevel??2);
  return `<section class="nb-guarantee-notice" lang="${n.language}" aria-labelledby="${id}-title" data-guarantee-notice-id="${n.noticeId}"><${h} id="${id}-title">${e(n.wording.title)}</${h}>${n.reviewStatus==='draft'?'<p class="nb-draft" lang="en">Draft guarantee display — review text, artwork and placement.</p>':''}<div class="nb-guarantee-layout"><div class="nb-guarantee-text"><p>${e(n.textAlternative)}</p><a href="${e(n.informationUrl)}">${e(n.wording.informationLink)}</a></div><figure><img class="nb-guarantee-artwork" src="${n.asset.url}" width="${Math.round(n.asset.width)}" height="${Math.round(n.asset.height)}" alt="${e(n.wording.imageAlt)}" decoding="async"><figcaption><a href="${n.asset.url}">${e(n.wording.fullSizeLink)}</a><span class="nb-guarantee-credit" lang="en">© European Union · Official artwork, unchanged. <a href="https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en">Source and usage guidance</a></span></figcaption></figure></div></section>`;
}
