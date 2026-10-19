/** @requirements REQ-PRODUCT-COLLECTION-NOTICE REQ-EU-NOTICE REQ-NZ-NOTICE
 * Display-only direct-collection disclosures. No permission, form submission, persistence or presentation receipt.
 */
import {isSafeLink} from './config.js';
import type {Purpose,Contact,BuildMode} from './types.js';
import type {ConsentNoticeDocument} from './consent-notice.js';
export interface CollectionNotice {
  schemaVersion:1;renderingPolicy:'collection-v1';locale:string;noticeId:string;siteId:string;scopeId:string;artifactId:string;mode:BuildMode;reviewStatus:'draft'|'reviewed';
  wording:{title:string;intro:string;detailsLabel:string;privacyLinkLabel:string};
  controller:Contact&{address:string;representative?:Contact;dpo?:Contact};
  purposes:Purpose[];
  recipients:{id:string;name:string;provider:string;location:string;purposeIds:string[];privacyUrl?:string}[];
  privacy:{rights:string[];rightsUrl?:string;transfers:string;automatedDecisions:string;complaints:{description:string;url?:string}};
  document:ConsentNoticeDocument;
}
export interface CollectionNoticeSettings {
  scopeId:string;purposeIds:readonly string[];reviewStatus:'draft'|'reviewed';
  wording:{title:string;intro:string;detailsLabel?:string;privacyLinkLabel?:string};
}
export interface CollectionNoticeRenderOptions {idPrefix:string;headingLevel?:2|3|4|5|6;allowPreview?:boolean}
const hash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/u.test(value);
const slug=(value:unknown):value is string=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(value);
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown,max=4000):value is string=>typeof value==='string'&&value.trim().length>0&&new TextEncoder().encode(value).length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
const exact=(value:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(key=>Object.hasOwn(value,key))&&Object.keys(value).every(key=>required.includes(key)||optional.includes(key));
const texts=(value:unknown,max=40):value is string[]=>Array.isArray(value)&&value.length>0&&value.length<=max&&value.every(item=>text(item));
const link=(value:unknown):value is string=>isSafeLink(value)&&typeof value==='string'&&value.length<=2048;
const date=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const invalid=():never=>{throw new Error('Invalid collection notice. Use explicit direct-collection purposes, reviewed wording and a pinned privacy release.');};
function contact(input:unknown,addressRequired=false):boolean {
  if(!object(input)||!exact(input,['name','email',...(addressRequired?['address']:[])],['address',...(addressRequired?['representative','dpo']:[])])||!text(input.name,300)||!text(input.email,300)||!isSafeLink('mailto:'+input.email)||input.address!==undefined&&!text(input.address))return false;
  return !addressRequired||(input.representative===undefined||contact(input.representative))&&(input.dpo===undefined||contact(input.dpo));
}
/** Structural copy/validation. The host must supply a trusted build descriptor; shape/digests do not authenticate its author. */
export function normalizeCollectionNotice(input:unknown,options:{allowPreview?:boolean}={}):CollectionNotice {
  let raw:unknown;try{const serialized=JSON.stringify(input);if(new TextEncoder().encode(serialized).length>65536)throw new Error();raw=JSON.parse(serialized);}catch{return invalid();}
  if(!object(raw)||!exact(raw,['schemaVersion','renderingPolicy','locale','noticeId','siteId','scopeId','artifactId','mode','reviewStatus','wording','controller','purposes','recipients','privacy','document'])||raw.schemaVersion!==1||raw.renderingPolicy!=='collection-v1'||typeof raw.locale!=='string'||!/^en(?:-[A-Za-z0-9]+)*$/iu.test(raw.locale)||!hash(raw.noticeId)||!hash(raw.artifactId)||!slug(raw.siteId)||!slug(raw.scopeId)||(typeof raw.mode!=='string'||!['preview','production'].includes(raw.mode))||(typeof raw.reviewStatus!=='string'||!['draft','reviewed'].includes(raw.reviewStatus)))return invalid();
  try{Intl.getCanonicalLocales(raw.locale);}catch{return invalid();}
  const wording=raw.wording;
  if(!object(wording)||!exact(wording,['title','intro','detailsLabel','privacyLinkLabel'])||!text(wording.title,300)||!text(wording.intro,2000)||!text(wording.detailsLabel,160)||!text(wording.privacyLinkLabel,160)||!contact(raw.controller,true))return invalid();
  if(!Array.isArray(raw.purposes)||!raw.purposes.length||raw.purposes.length>8)return invalid();const ids=new Set<string>();
  for(const p of raw.purposes){
    if(!object(p)||!exact(p,['id','name','description','legalBasis','dataCategories','retention','collection'])||!slug(p.id)||ids.has(p.id)||!text(p.name,300)||!text(p.description)||!text(p.legalBasis)||!texts(p.dataCategories)||!text(p.retention))return invalid();ids.add(p.id);
    const c=p.collection;if(!object(c)||!exact(c,['source','description','required','consequences'])||(typeof c.source!=='string'||!['direct','both'].includes(c.source))||typeof c.required!=='boolean'||!text(c.description)||!text(c.consequences))return invalid();
  }
  if(!Array.isArray(raw.recipients)||raw.recipients.length>80)return invalid();const services=new Set<string>();
  for(const r of raw.recipients){if(!object(r)||!exact(r,['id','name','provider','location','purposeIds'],['privacyUrl'])||!slug(r.id)||services.has(r.id)||!text(r.name,300)||!text(r.provider,300)||!text(r.location)||!texts(r.purposeIds,8)||new Set(r.purposeIds).size!==r.purposeIds.length||r.purposeIds.some(id=>!ids.has(id))||r.privacyUrl!==undefined&&!link(r.privacyUrl))return invalid();services.add(r.id);}
  const p=raw.privacy;
  if(!object(p)||!exact(p,['rights','transfers','automatedDecisions','complaints'],['rightsUrl'])||!texts(p.rights)||!text(p.transfers)||!text(p.automatedDecisions)||p.rightsUrl!==undefined&&!link(p.rightsUrl)||!object(p.complaints)||!exact(p.complaints,['description'],['url'])||!text(p.complaints.description)||p.complaints.url!==undefined&&!link(p.complaints.url))return invalid();
  const d=raw.document;
  if(!object(d)||!exact(d,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus'])||!text(d.title,300)||!text(d.version,200)||!date(d.effectiveDate)||!hash(d.sha256)||!hash(d.contentSha256)||(typeof d.reviewStatus!=='string'||!['draft','reviewed'].includes(d.reviewStatus))||d.url!==`/artifacts/${raw.artifactId}/privacy.html`)return invalid();
  if(!options.allowPreview&&(raw.mode!=='production'||raw.reviewStatus!=='reviewed'||d.reviewStatus!=='reviewed'))throw new Error('Collection notices require reviewed production documents and wording; preview must be explicit.');
  return raw as unknown as CollectionNotice;
}
const escape=(value:string)=>value.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Stable instance IDs. Use descriptionId for a concise aria-describedby target; hosts ensure prefix uniqueness. */
export function collectionNoticeIds(idPrefix:string):{rootId:string;titleId:string;descriptionId:string}{
  if(!slug(idPrefix))throw new Error('Use a unique lowercase collection notice ID prefix.');
  return {rootId:idPrefix+'-notice',titleId:idPrefix+'-title',descriptionId:idPrefix+'-summary'};
}
/** Static HTML; native details remains keyboard accessible without JavaScript. */
export function renderCollectionNotice(input:unknown,options:CollectionNoticeRenderOptions):string {
  const n=normalizeCollectionNotice(input,{allowPreview:options?.allowPreview===true});
  if(!options||!slug(options.idPrefix)||options.headingLevel!==undefined&&![2,3,4,5,6].includes(options.headingLevel))throw new Error('Use a unique lowercase ID prefix and heading level 2–6 for each collection notice instance.');
  const e=escape,ids=collectionNoticeIds(options.idPrefix),id=ids.rootId,heading='h'+(options.headingLevel??2),sub='h'+Math.min(6,(options.headingLevel??2)+1);
  const a=(label:string,href:string)=>`<a href="${e(href)}">${e(label)}</a>`;
  const pair=(label:string,value:string)=>`<div><dt>${label}</dt><dd>${e(value)}</dd></div>`;
  const contact=(label:string,c:Contact)=>`<section><${sub}>${label}</${sub}><p>${e(c.name)}${c.address?` · ${e(c.address)}`:''}</p><p>${a(c.email,'mailto:'+c.email)}</p></section>`;
  const draft=n.mode==='preview'||n.reviewStatus==='draft'||n.document.reviewStatus==='draft';
  return `<section class="nb-collection-notice" id="${id}" lang="${e(n.locale)}" aria-labelledby="${ids.titleId}" data-collection-notice-id="${n.noticeId}" data-collection-scope="${e(n.scopeId)}"><${heading} id="${ids.titleId}">${e(n.wording.title)}</${heading}>${draft?'<p class="nb-draft" role="note">Draft collection notice — for review.</p>':''}<p id="${ids.descriptionId}">${e(n.wording.intro)}</p><p class="nb-collection-controller">Responsible: ${e(n.controller.name)} · ${a(n.controller.email,'mailto:'+n.controller.email)}</p>${n.purposes.map(p=>`<section class="nb-collection-purpose"><${sub}>${e(p.name)}</${sub}><p>${e(p.description)}</p>${p.collection.source==='both'?'<p>This purpose also involves information from other sources; see collection details.</p>':''}<dl>${pair('Information declared for this purpose',p.dataCategories.join(', '))}${pair('Providing information',p.collection.required?'Required for this declared purpose':'Optional for this declared purpose')}${pair('If you do not provide it',p.collection.consequences)}</dl></section>`).join('')}<p class="nb-collection-policy">${a(n.wording.privacyLinkLabel,n.document.url)} <span class="nb-collection-version">· ${e(n.document.version)}</span></p><details class="nb-collection-details"><summary>${e(n.wording.detailsLabel)}</summary>${contact('Controller',n.controller)}${n.controller.representative?contact('Representative',n.controller.representative):''}${n.controller.dpo?contact('Data protection contact',n.controller.dpo):''}${n.purposes.map(p=>`<section><${sub}>${e(p.name)} · Details</${sub}><dl>${pair('Collection source',p.collection.source==='both'?'Direct and indirect sources declared':'Direct collection')}${pair('Source details',p.collection.description)}${pair('Legal basis',p.legalBasis)}${pair('Retention',p.retention)}</dl></section>`).join('')}<section><${sub}>Declared providers and recipients</${sub}>${n.recipients.length?`<ul>${n.recipients.map(r=>`<li>${e(r.name)} · ${e(r.provider)}. ${e(r.location)}. Purposes: ${e(r.purposeIds.map(id=>n.purposes.find(p=>p.id===id)!.name).join(', '))}${r.privacyUrl?` · ${a('Provider privacy information',r.privacyUrl)}`:''}</li>`).join('')}</ul>`:'<p>No related services are declared in this inventory.</p>'}</section><section><${sub}>Transfers</${sub}><p>${e(n.privacy.transfers)}</p></section><section><${sub}>Automated decisions</${sub}><p>${e(n.privacy.automatedDecisions)}</p></section><section><${sub}>Rights and contact</${sub}><ul>${n.privacy.rights.map(r=>`<li>${e(r)}</li>`).join('')}</ul>${n.privacy.rightsUrl?`<p>${a('How to exercise your rights',n.privacy.rightsUrl)}</p>`:''}</section><section><${sub}>Questions and complaints</${sub}><p>${e(n.privacy.complaints.description)}</p>${n.privacy.complaints.url?`<p>${a('Complaint information',n.privacy.complaints.url)}</p>`:''}</section><p class="nb-collection-version">Privacy version ${e(n.document.version)} · Effective <time datetime="${n.document.effectiveDate}">${n.document.effectiveDate}</time></p></details></section>`;
}
