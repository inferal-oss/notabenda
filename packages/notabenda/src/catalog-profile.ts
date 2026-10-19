/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-PROFILES */
import {normalizeServiceCatalog} from './catalog-reference.js';
import type {CatalogSource,CatalogProductProfile} from './catalog-reference.js';
export interface CatalogProfileView {catalogId:string;catalogRevision:string;productId:string;productName:string;productRevision:string;profile:CatalogProductProfile;sources:CatalogSource[]}
export function readCatalogProductProfile(input:unknown,productId:string):CatalogProfileView|undefined {
 const catalog=normalizeServiceCatalog(input),product=catalog.products.find(p=>p.id===productId);if(!product)throw Error('Choose an existing catalog product.');if(!product.profile)return undefined;
 return {catalogId:catalog.id,catalogRevision:catalog.revision,productId,productName:product.name,productRevision:product.revision,profile:product.profile,sources:catalog.sources.filter(s=>product.sourceIds.includes(s.id))};
}
export interface CatalogProfileRenderOptions {headingLevel?:2|3|4|5;documentationBase?:string}
const escape=(text:string)=>text.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function docsBase(value:string):string {
 // Match setup's safe-link semantics, including dotted and percent-encoded local paths.
 if(typeof value!=='string'||/[\s\u0000-\u001f\u007f\\?#]/u.test(value)||value.endsWith('/'))throw Error('Use a safe documentation base without a trailing slash.');
 if(/^\/(?!\/)/u.test(value)&&!/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/iu.test(value))return value;
 try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return value;}catch{}throw Error('Use an HTTPS or local absolute documentation base.');
}
/** Static, escaped reference material. Does not fetch documents, choose site facts or create controls. */
export function renderCatalogProductProfile(input:unknown,productId:string,options:CatalogProfileRenderOptions={}):string {
 const view=readCatalogProductProfile(input,productId);if(!view)return '';
 const level=options.headingLevel??3;if(![2,3,4,5].includes(level))throw Error('Use a heading level from 2 to 5.');const docs=docsBase(options.documentationBase??'https://notabenda.org/guide'),heading='h'+level,sub='h'+(level+1),e=escape;
 const citations=(ids:string[])=>ids.map(id=>{const source=view.sources.find(s=>s.id===id)!;return `<a href="${e(source.url)}" target="_blank" rel="noopener noreferrer">${e(source.title??new URL(source.url).hostname)}<span class="nb-profile-sr"> (opens in a new tab)</span></a><span>${source.access==='read'?' · retrieved '+e(source.checkedOn!):' · URL recorded; not retrieved'}</span>`;}).join(' · ');
 return `<section class="nb-catalog-profile" aria-label="${e(view.productName)} documentation"><${heading}>From the product documentation</${heading}><p class="nb-catalog-profile-intro">These notes describe documented options. Confirm your actual deployment, settings and contract separately.</p><div class="nb-catalog-profile-facts">${view.profile.facts.map(f=>`<section><${sub}>${e(f.title)}</${sub}><p>${e(f.description)}</p><p class="nb-catalog-profile-sources">${citations(f.sourceIds)}</p></section>`).join('')}</div><nav class="nb-catalog-profile-links" aria-label="Product reference documents">${view.profile.links.map(link=>{const retrieved=link.sourceIds.some(id=>view.sources.find(s=>s.id===id)?.url===link.url&&view.sources.find(s=>s.id===id)?.access==='read');return `<a href="${e(link.url)}" target="_blank" rel="noopener noreferrer">${e(link.label)}${retrieved?'':' · not retrieved'} <span class="nb-profile-sr">(opens in a new tab)</span></a>`;}).join('')}</nav>${view.profile.reviewPrompts.length?`<section class="nb-catalog-profile-prompts"><${sub}>Review for this site</${sub}><ul>${view.profile.reviewPrompts.map(p=>`<li><p>${e(p.prompt)}</p>${p.sourceIds.length?`<p class="nb-catalog-profile-sources">${citations(p.sourceIds)}</p>`:''}${p.requirementIds.length?`<p class="nb-catalog-profile-requirements">Review references: ${p.requirementIds.map(id=>`<a href="${e(docs+'/requirements#'+id.toLowerCase())}" target="_blank" rel="noopener noreferrer">${e(id)}<span class="nb-profile-sr"> (opens in a new tab)</span></a>`).join(' · ')}</p>`:''}</li>`).join('')}</ul><p class="nb-catalog-profile-intro">These questions guide your review; a requirement link does not establish that it applies to this site.</p></section>`:''}</section>`;
}
/** Plain terminal output is also based only on the normalized reference. */
export function formatCatalogProductProfile(input:unknown,productId:string):string {
 const view=readCatalogProductProfile(input,productId);if(!view)return 'No product-specific documentation notes in this reference.';
 const lines=['From the product documentation — '+view.productName];
 for(const fact of view.profile.facts){lines.push(fact.title+': '+fact.description);for(const id of fact.sourceIds){const source=view.sources.find(s=>s.id===id)!;lines.push('  '+source.url+' · retrieved '+source.checkedOn);}}
 for(const link of view.profile.links)lines.push(link.label+': '+link.url+(link.sourceIds.some(id=>view.sources.find(s=>s.id===id)?.url===link.url&&view.sources.find(s=>s.id===id)?.access==='read')?'':' · URL recorded; not retrieved'));
 if(view.profile.reviewPrompts.length)lines.push('Review for this site:');for(const p of view.profile.reviewPrompts){lines.push('  - '+p.prompt+(p.requirementIds.length?' ['+p.requirementIds.join(', ')+']':''));for(const id of p.sourceIds){const source=view.sources.find(s=>s.id===id)!;lines.push('    '+source.url+' · '+(source.access==='read'?'retrieved '+source.checkedOn:'URL recorded; not retrieved'));}}
 lines.push('Documented options do not establish actual use or legal applicability.');return lines.join('\n');
}
