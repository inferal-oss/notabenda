// @requirements REQ-EU-INTERESTS-DISCLOSURE Inventory compatibility; this remains the explicit NZ notice profile.
import {isLegitimateInterests} from './purpose-disclosures.js';
/** @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
 * Display-only IPP3A particulars. Hosts assess applicability, lawful collection, timing and delivery.
 */
import {isSafeLink} from './safe-links.js';
import type {BuildMode,Purpose} from './types.js';
import type {ConsentNoticeDocument} from './consent-notice.js';

export type IndirectCollectionAuthority =
  | {kind:'not-relied-on'}
  | {kind:'specified';laws:{title:string;provision:string;relationship:'authorises'|'requires';url?:string}[]};
export interface IndirectCollectionSelection {
  purposeId:string;
  /** Exact, nonempty subset of this purpose's declared categories for this indirect collection. */
  dataCategories:string[];
  /** Public description of the source organisation or class of sources, never a private case record. */
  sourceDescription:string;
  authority:IndirectCollectionAuthority;
}
export interface IndirectCollectionNoticeSettings {
  profile:'nz-ipp3a';scopeId:string;phase:'advance'|'collected';reviewStatus:'draft'|'reviewed';
  wording:{title:string;intro:string};
  collections:IndirectCollectionSelection[];
  recipientStatement:string;
  accessCorrection:{statement:string;url:string};
}
export interface IndirectCollectionNotice extends Omit<IndirectCollectionNoticeSettings,'collections'> {
  schemaVersion:1;kind:'indirect-collection-notice';renderingPolicy:'indirect-collection-v1';
  noticeId:string;siteId:string;siteUrl:string;locale:string;artifactId:string;mode:BuildMode;
  /** This profile uses the same indirect collector as the collecting and holding agency. */
  collector:{name:string;email:string;address:string};
  collections:(IndirectCollectionSelection&{purpose:Purpose})[];
  document:ConsentNoticeDocument;
}
export interface IndirectCollectionRenderOptions {idPrefix:string;headingLevel?:2|3|4|5|6;allowPreview?:boolean}
const invalid=():never=>{throw Error('Use bounded indirect-collection facts, an explicit law review and a pinned privacy release.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const text=(v:unknown,max=4000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const list=(v:unknown):v is string[]=>Array.isArray(v)&&v.length>0&&v.length<=40&&v.every(item=>text(item))&&new Set(v).size===v.length;
const link=(v:unknown):v is string=>typeof v==='string'&&v.length<=2048&&isSafeLink(v);
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
/** Check data descriptors before copying: no getters, toJSON, cycles, prototypes or coercion. */
function copy(input:unknown):unknown {
  let nodes=0;
  const seen=new Set<object>();
  function walk(v:unknown,depth:number):void {
    if(++nodes>12000||depth>12)invalid();
    if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length<=16384)return;
    if(!v||typeof v!=='object'||seen.has(v))return invalid();
    if(Array.isArray(v)?Object.getPrototypeOf(v)!==Array.prototype:Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)invalid();
    const descriptors=Object.getOwnPropertyDescriptors(v),keys=Reflect.ownKeys(descriptors);
    if(keys.some(k=>typeof k!=='string')||keys.length>200||Array.isArray(v)&&(v.length>80||Object.keys(v).length!==v.length))invalid();
    seen.add(v);
    for(const key of keys){if(Array.isArray(v)&&key==='length')continue;const d=descriptors[key as string]!;if(!Object.hasOwn(d,'value')||!d.enumerable)invalid();walk(d.value,depth+1);}
    seen.delete(v);
  }
  try{walk(input,0);const serialized=JSON.stringify(input);if(new TextEncoder().encode(serialized).length>65536)return invalid();return JSON.parse(serialized);}catch{return invalid();}
}
function authority(v:unknown):boolean {
  if(!object(v))return false;
  if(v.kind==='not-relied-on')return exact(v,['kind']);
  return v.kind==='specified'&&exact(v,['kind','laws'])&&Array.isArray(v.laws)&&v.laws.length>0&&v.laws.length<=8&&v.laws.every(l=>object(l)&&exact(l,['title','provision','relationship'],['url'])&&text(l.title,300)&&text(l.provision,300)&&(l.relationship==='authorises'||l.relationship==='requires')&&(l.url===undefined||link(l.url)&&!l.url.startsWith('mailto:')));
}
function settings(v:Record<string,unknown>,withPurpose=false):boolean {
  if(v.profile!=='nz-ipp3a'||!slug(v.scopeId)||(v.phase!=='advance'&&v.phase!=='collected')||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed'))return false;
  const w=v.wording,r=v.accessCorrection;
  if(!object(w)||!exact(w,['title','intro'])||!text(w.title,300)||!text(w.intro,2000)||!text(v.recipientStatement)||!object(r)||!exact(r,['statement','url'])||!text(r.statement)||!link(r.url))return false;
  if(!Array.isArray(v.collections)||v.collections.length===0||v.collections.length>8)return false;
  const ids=new Set<string>();
  for(const c of v.collections){
    if(!object(c)||!exact(c,['purposeId','dataCategories','sourceDescription','authority',...(withPurpose?['purpose']:[])])||!slug(c.purposeId)||ids.has(c.purposeId)||!list(c.dataCategories)||!text(c.sourceDescription)||!authority(c.authority))return false;
    ids.add(c.purposeId);
    if(withPurpose){
      const p=c.purpose;
      if(!object(p)||!exact(p,['id','name','description','legalBasis','dataCategories','retention','collection'],['legitimateInterests'])||p.id!==c.purposeId||!text(p.name,300)||!text(p.description)||!text(p.legalBasis)||p.legitimateInterests!==undefined&&!isLegitimateInterests(p.legitimateInterests)||!list(p.dataCategories)||!text(p.retention)||c.dataCategories.some(category=>!(p.dataCategories as string[]).includes(category)))return false;
      const source=p.collection;
      if(!object(source)||!exact(source,['source','description','required','consequences'])||(source.source!=='indirect'&&source.source!=='both')||!text(source.description)||typeof source.required!=='boolean'||!text(source.consequences))return false;
    }
  }
  return true;
}
/** @internal Build-time input validation; exported for the content builder. */
export function normalizeIndirectCollectionNoticeSettings(input:unknown):IndirectCollectionNoticeSettings {
  const v=copy(input);
  if(!object(v)||!exact(v,['profile','scopeId','phase','reviewStatus','wording','collections','recipientStatement','accessCorrection'])||!settings(v))return invalid();
  return v as unknown as IndirectCollectionNoticeSettings;
}
/** Structural validation only. A digest does not authenticate the author or prove delivery. */
export function normalizeIndirectCollectionNotice(input:unknown,options:{allowPreview?:boolean}={}):IndirectCollectionNotice {
  if(options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean')return invalid();
  const v=copy(input);
  if(!object(v)||!exact(v,['schemaVersion','kind','renderingPolicy','noticeId','siteId','siteUrl','locale','artifactId','mode','collector','document','profile','scopeId','phase','reviewStatus','wording','collections','recipientStatement','accessCorrection'])||v.schemaVersion!==1||v.kind!=='indirect-collection-notice'||v.renderingPolicy!=='indirect-collection-v1'||!hash(v.noticeId)||!hash(v.artifactId)||!slug(v.siteId)||!link(v.siteUrl)||!/^https:/iu.test(v.siteUrl)||typeof v.locale!=='string'||!/^en(?:-[A-Za-z0-9]+)*$/iu.test(v.locale)||(v.mode!=='preview'&&v.mode!=='production')||!settings(v,true))return invalid();
  try{Intl.getCanonicalLocales(v.locale);}catch{return invalid();}
  const c=v.collector,d=v.document;
  if(!object(c)||!exact(c,['name','email','address'])||!text(c.name,300)||!text(c.address)||!text(c.email,300)||!isSafeLink('mailto:'+c.email))return invalid();
  if(!object(d)||!exact(d,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus'])||!text(d.title,300)||!text(d.version,200)||!date(d.effectiveDate)||!hash(d.sha256)||!hash(d.contentSha256)||(d.reviewStatus!=='reviewed'&&d.reviewStatus!=='draft')||d.url!==`/artifacts/${v.artifactId}/privacy.html`)return invalid();
  if(!options.allowPreview&&(v.mode!=='production'||v.reviewStatus!=='reviewed'||d.reviewStatus!=='reviewed'))throw Error('Indirect notices require reviewed production privacy and wording; preview must be explicit.');
  return v as unknown as IndirectCollectionNotice;
}
const escape=(v:string)=>v.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const fact=(n:IndirectCollectionNotice)=>n.phase==='advance'?'We plan to collect information about you from another source.':'We have collected information about you from another source.';
const absolute=(n:IndirectCollectionNotice,url:string)=>new URL(url,new URL(n.siteUrl).origin).href;
/** Static web fragment. All notification particulars are visible; no consent, receipt or transport. */
export function renderIndirectCollectionNotice(input:unknown,options:IndirectCollectionRenderOptions):string {
  const n=normalizeIndirectCollectionNotice(input,{allowPreview:options?.allowPreview===true});
  if(!options||!slug(options.idPrefix)||options.headingLevel!==undefined&&![2,3,4,5,6].includes(options.headingLevel))throw Error('Use a unique lowercase ID prefix and heading level 2–6.');
  const e=escape,h='h'+(options.headingLevel??2),sub='h'+Math.min(6,(options.headingLevel??2)+1),lawHeading='h'+Math.min(6,(options.headingLevel??2)+2),id=options.idPrefix;
  const a=(label:string,url:string)=>`<a href="${e(url)}">${e(label)}</a>`;
  const pair=(label:string,value:string)=>`<div><dt>${label}</dt><dd>${e(value)}</dd></div>`;
  return `<section class="nb-collection-notice nb-indirect-notice" id="${id}-notice" lang="${e(n.locale)}" aria-labelledby="${id}-title" data-indirect-notice-id="${n.noticeId}" data-collection-phase="${n.phase}"><${h} id="${id}-title">${e(n.wording.title)}</${h}>${n.mode==='preview'||n.reviewStatus==='draft'||n.document.reviewStatus==='draft'?'<p class="nb-draft" role="note">Draft indirect collection notice — for review.</p>':''}<p>${e(fact(n))}</p><p>${e(n.wording.intro)}</p>${n.collections.map(c=>`<section class="nb-collection-purpose"><${sub}>${e(c.purpose.name)}</${sub}><p>${e(c.purpose.description)}</p><dl>${pair('Information',c.dataCategories.join(', '))}${pair('Source',c.sourceDescription)}</dl>${c.authority.kind==='specified'?`<section><${lawHeading}>Particular law</${lawHeading}><ul>${c.authority.laws.map(l=>`<li>${e(l.title)} · ${e(l.provision)} · ${l.relationship==='requires'?'Requires this collection':'Authorises this collection'}${l.url?` · ${a('Read the law',l.url)}`:''}</li>`).join('')}</ul></section>`:''}</section>`).join('')}<section><${sub}>Intended recipients</${sub}><p>${e(n.recipientStatement)}</p></section><section><${sub}>Collecting and holding agency</${sub}><p>${e(n.collector.name)} · ${e(n.collector.address)}</p><p>${a(n.collector.email,'mailto:'+n.collector.email)}</p></section><section><${sub}>Access and correction</${sub}><p>${e(n.accessCorrection.statement)}</p><p>${a('Request access or correction',n.accessCorrection.url)}</p></section><p class="nb-collection-policy">${a(n.document.title,n.document.url)} <span class="nb-collection-version">· ${e(n.document.version)} · Effective <time datetime="${n.document.effectiveDate}">${n.document.effectiveDate}</time></span></p></section>`;
}
/** Plain-text body for host delivery. URLs are absolute; this is not an email template or delivery record. */
export function formatIndirectCollectionNotice(input:unknown,options:{allowPreview?:boolean}={}):string {
  const n=normalizeIndirectCollectionNotice(input,options);
  const parts=[n.wording.title,...(n.mode==='preview'||n.reviewStatus==='draft'||n.document.reviewStatus==='draft'?['DRAFT — for review.']:[]),fact(n),n.wording.intro];
  for(const c of n.collections){parts.push(`${c.purpose.name}\n${c.purpose.description}\nInformation: ${c.dataCategories.join(', ')}\nSource: ${c.sourceDescription}`);if(c.authority.kind==='specified')for(const l of c.authority.laws)parts.push(`Particular law: ${l.title} · ${l.provision}\n${l.relationship==='requires'?'Requires this collection':'Authorises this collection'}${l.url?'\n'+absolute(n,l.url):''}`);}
  parts.push('Intended recipients\n'+n.recipientStatement,`Collecting and holding agency\n${n.collector.name}\n${n.collector.address}\n${n.collector.email}`,`Access and correction\n${n.accessCorrection.statement}\n${absolute(n,n.accessCorrection.url)}`,`${n.document.title} · ${n.document.version} · Effective ${n.document.effectiveDate}\n${absolute(n,n.document.url)}`);
  return parts.join('\n\n')+'\n';
}
