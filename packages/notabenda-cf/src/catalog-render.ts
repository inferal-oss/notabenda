// @requirements REQ-PRODUCT-SERVICE-PROFILES
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CF-HISTORY */
import {renderCatalogProductProfile} from './catalog-profile.js';
import type {EvidenceRecord,JsonValue} from './types.js';
import type {RenderOptions} from './render.js';
import {escapeHtml,renderWorkspaceShell} from './render.js';
import {catalogReviewCanonical} from './catalog-release-policy.js';
const obj=(v:JsonValue|undefined):Record<string,JsonValue>=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const array=(v:JsonValue|undefined):JsonValue[]=>Array.isArray(v)?v:[];
const text=(v:JsonValue|undefined)=>typeof v==='string'?v:'Not recorded';
const e=(v:JsonValue|undefined)=>escapeHtml(text(v));
const url=(v:JsonValue|undefined)=>{try{const u=new URL(text(v));return u.protocol==='https:'&&!u.username&&!u.password?escapeHtml(u.href):undefined;}catch{return undefined;}};
function inspect(record:EvidenceRecord){
 const data=obj(record.data),review=obj(data.catalogReview),entries=array(review.selections);
 if(data.kind!=='catalog-release-review-record'||data.artifactId!==record.id||! /^[a-f0-9]{64}$/u.test(record.id)||review.schemaVersion!==1||review.kind!=='catalog-release-review'||entries.length<1||entries.length>32)throw Error('Invalid catalog review record.');
 const byId=new Map<string,Record<string,JsonValue>>();for(const raw of entries){const entry=obj(raw),id=obj(entry.service).id;if(typeof id!=='string'||byId.has(id))throw Error('Invalid selected service.');byId.set(id,entry);}return {data,byId};
}
function facts(entry:Record<string,JsonValue>|undefined,label:string){
 if(!entry)return `<section class="card"><h3>${label}</h3><p>No selected catalog reference in this release.</p></section>`;
 const service=obj(entry.service),reference=obj(entry.reference),product=obj(array(reference.products)[0]),provider=obj(array(reference.providers)[0]);
 const terms:[string,JsonValue|undefined][]=[['Site provider',service.provider],['Location',service.location],['Catalog',reference.id],['Catalog revision',reference.revision],['Product',product.name],['Product revision',product.revision],['Reference provider',provider.name],['Provider revision',provider.revision]];
 return `<section class="card"><h3>${label}</h3><dl class="facts">${terms.map(([name,value])=>`<div><dt>${name}</dt><dd>${e(value)}</dd></div>`).join('')}</dl><p>${e(product.description)}</p><p class="hint">Reference review: ${e(product.review)}. Operator confirmation records selected use; it does not verify provider practices.</p>${product.profile?renderCatalogProductProfile(reference,text(product.id),{headingLevel:4}):''}<details><summary>Purpose facts used in this release</summary>${array(entry.purposes).map(raw=>{const p=obj(raw);return `<section><h4>${e(p.name)}</h4><p>${e(p.description)}</p><dl class="facts"><div><dt>Purpose ID</dt><dd>${e(p.id)}</dd></div><div><dt>Declared basis</dt><dd>${e(p.legalBasis)}</dd></div><div><dt>Retention</dt><dd>${e(p.retention)}</dd></div></dl></section>`;}).join('')}</details><details><summary>Source references</summary>${array(reference.sources).map(raw=>{const s=obj(raw),href=url(s.url);return `<section><h4>${e(s.id)}</h4><p>${href?`<a href="${href}" rel="noreferrer">${e(s.url)}</a>`:'No usable source URL.'}</p><p>Revision: ${e(s.revision)} · ${s.access==='read'?'Checked '+e(s.checkedOn):'Reference only; not checked'}</p><p>${e(s.note)}</p></section>`;}).join('')}</details><details><summary>Complete selected reference facts</summary><pre>${escapeHtml(JSON.stringify(entry,null,2))}</pre></details></section>`;
}
function changedFacts(before:Record<string,JsonValue>,after:Record<string,JsonValue>):string {
 const groups=(entry:Record<string,JsonValue>)=>{
  const reference=obj(entry.reference),result=new Map<string,Record<string,JsonValue>>([['Catalog',{id:reference.id!,revision:reference.revision!}],['Product',obj(array(reference.products)[0])],['Reference provider',obj(array(reference.providers)[0])],['Site use',obj(entry.service)]]);
  const product=obj(array(reference.products)[0]),profile=obj(product.profile);const productFacts={...product};delete productFacts.profile;result.set('Product',productFacts);if(product.profile)result.set('Product profile',{schemaVersion:profile.schemaVersion!});
  for(const [kind,key] of [['Documentation note','facts'],['Document link','links'],['Review question','reviewPrompts']])for(const raw of array(profile[key!])){const item=obj(raw);result.set(kind+' '+text(item.id),item);}
  for(const [kind,items] of [['Source',array(reference.sources)],['Purpose',array(entry.purposes)]] as const)for(const raw of items){const item=obj(raw);result.set(kind+' '+text(item.id),item);}return result;
 };
 const old=groups(before),now=groups(after),rows:string[]=[];
 const label=(key:string)=>key.replace(/([a-z])([A-Z])/gu,'$1 $2').replaceAll('.',' / ');
 const value=(v:JsonValue|undefined)=>v===undefined?'Not present':typeof v==='string'?v:JSON.stringify(v,null,2);
 for(const group of new Set([...old.keys(),...now.keys()])){
  const a=old.get(group)??{},b=now.get(group)??{};
  for(const key of new Set([...Object.keys(a),...Object.keys(b)]))if(catalogReviewCanonical(a[key]??null)!==catalogReviewCanonical(b[key]??null))rows.push(`<section class="catalog-change"><h3>${escapeHtml(group+' / '+label(key))}</h3><dl><div><dt>Before</dt><dd>${escapeHtml(value(a[key]))}</dd></div><div><dt>After</dt><dd>${escapeHtml(value(b[key]))}</dd></div></dl></section>`);
 }
 return `<div class="catalog-changes">${rows.join('')}</div>`;
}
export function renderCatalogReview(before:EvidenceRecord,after:EvidenceRecord|undefined,options:RenderOptions):string {
 const previous=inspect(before),next=after?inspect(after):undefined;if(next&&previous.data.siteId!==next.data.siteId)throw Error('Compare catalog reviews for the same site.');
 const current=after??before,ids=[...new Set([...previous.byId.keys(),...(next?.byId.keys()??[])])];let changed=0;
 const cards=ids.map(id=>{
  const old=previous.byId.get(id),now=next?.byId.get(id),value=next?now??old:old;
  const changes=next?['reference','service','purposes'].filter(key=>catalogReviewCanonical(old?.[key]??null)!==catalogReviewCanonical(now?.[key]??null)):[];if(changes.length)changed++;
  const label=!next?'Selected reference':!old?'Added':!now?'Removed':changes.length?'Changed: '+changes.map(k=>k==='reference'?'catalog facts':k==='service'?'site use':'purpose facts').join(', '):'Unchanged';
  const body=`<section class="card detail-wide"><p class="eyebrow">${label}</p><h2>${e(obj(value?.service).name)}</h2><p class="hint">Local service: ${escapeHtml(id)}</p>${next&&old&&now&&changes.length?changedFacts(old,now):''}${next?'<details class="catalog-complete"><summary>All facts before and after</summary>':''}<div class="detail-grid">${facts(old,next?'Before':'Release')}${next?facts(now,'After'):''}</div>${next?'</details>':''}</section>`;
  return next&&!changes.length?`<details><summary>${e(obj(value?.service).name)} · unchanged selected reference</summary>${body}</details>`:body;
 }).join('');
 const form=after?'':`<form action="${escapeHtml(options.basePath)}/catalog-review-diff" method="get" class="card"><input type="hidden" name="after" value="${escapeHtml(before.id)}"><label for="catalog-before">Earlier release ID</label><input id="catalog-before" name="before" required pattern="[a-f0-9]{64}" maxlength="64"><button class="button" type="submit">Compare catalog reviews</button></form>`;
 return renderWorkspaceShell(`<a class="back" href="${escapeHtml(options.basePath+'/record?'+new URLSearchParams({id:current.id}))}">← Back to release</a><p class="eyebrow">Retained service references</p><h1>${after?'Catalog review changes':'Catalog review'}</h1><p class="scope">Authorized scope: ${escapeHtml(options.scopeLabel)}</p><p class="intro">${next?`${changed} of ${ids.length} selected services changed between these releases.`:`${ids.length} selected service${ids.length===1?'':'s'} archived with this release.`} This count does not describe coverage of the full inventory.</p><p class="notice">These are the selected reference and site-use facts supplied at build time. Private justifications stay in the setup report. An archive does not establish publication, legal review or provider verification.</p><details class="card"><summary>Release references</summary><p>Before: ${escapeHtml(before.id)}</p>${after?`<p>After: ${escapeHtml(after.id)}</p>`:''}</details>${cards}${form}`,options);
}
