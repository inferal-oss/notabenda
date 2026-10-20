// @requirements REQ-EU-INTERESTS-DISCLOSURE
import {purposeLegalBasis} from './purpose-disclosures.js';
// @requirements REQ-PRODUCT-SERVICE-PROFILES
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SETUP REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE */
import {renderCatalogProductProfile} from './catalog-profile.js';
import {prepareCatalogSelectionReview,confirmCatalogSelectionReview} from './catalog-review.js';
import type {CatalogSelectionReview} from './catalog-review.js';
import type {CatalogServiceSelection} from './catalog-selection.js';
export interface CatalogSelectionReviewUIOptions {
 documentationBase?:string;previous:CatalogServiceSelection;getConfig():unknown;catalog?:unknown;loadCatalog?:()=>Promise<unknown>;
 onConfirm(result:ReturnType<typeof confirmCatalogSelectionReview>):void;
}
/** Operator-only local comparison, with explicit reference loading and renewed confirmation. */
export function mountCatalogSelectionReview(container:HTMLElement,options:CatalogSelectionReviewUIOptions):{destroy():void}{
 const doc=container.ownerDocument,node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 let destroyed=false,loading=false,review:CatalogSelectionReview|undefined;
 const root=node('section');root.className='nb-catalog-review';container.append(root);
 const title=node('h3','Review '+options.previous.service.name);title.tabIndex=-1;root.append(title);
 root.append(node('p','Compare the prior review with current site use. Reference changes remain a proposal until you confirm. This does not publish policies or enable an integration.'));
 const refresh=node('button','Compare current reference catalog');refresh.type='button';refresh.className='nb-choice-button';refresh.hidden=options.catalog===undefined&&!options.loadCatalog;root.append(refresh);
 const status=node('p');status.setAttribute('role','status');root.append(status);
 const comparison=node('div');root.append(comparison);
 const reasonLabel=node('label','Supporting facts for this renewed review (private)'),reason=node('textarea');reason.maxLength=4000;reason.rows=3;reasonLabel.append(reason);root.append(reasonLabel);
 const confirmation=node('label');confirmation.className='nb-catalog-check';const checked=node('input');checked.type='checkbox';confirmation.append(checked,doc.createTextNode('I reviewed these provider, purpose and reference changes.'));root.append(confirmation);
 const error=node('p');error.setAttribute('role','alert');root.append(error);
 const apply=node('button','Confirm renewed review');apply.type='button';apply.className='nb-choice-button nb-primary';root.append(apply);
 for(const type of ['input','change'])root.addEventListener(type,event=>event.stopPropagation());
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'&&!event.isComposing&&(event.target as HTMLElement)?.tagName==='INPUT')event.preventDefault();});
 function panel(label:string,selection:Pick<CatalogServiceSelection,'service'|'purposes'|'reference'>){
  const section=node('section');section.append(node('h4',label));const facts=node('dl');section.append(facts);
  for(const [name,value] of [['Service',selection.service.name],['Provider',selection.service.provider],['Processing location',selection.service.location],['Privacy URL',selection.service.privacyUrl??'Not declared'],['Reference',selection.reference.id+' / '+selection.reference.revision],['Product revision',selection.reference.products[0]!.revision]]){const row=node('div');row.append(node('dt',name),node('dd',value));facts.append(row);}
  const notes=node('div');notes.innerHTML=renderCatalogProductProfile(selection.reference,selection.reference.products[0]!.id,{headingLevel:5,...(options.documentationBase?{documentationBase:options.documentationBase}:{})});section.append(notes);
  const details=node('details');details.append(node('summary','Purposes and source facts'));section.append(details);
  for(const purpose of selection.purposes){details.append(node('h4',purpose.name+' · '+purpose.id),node('p',purpose.description),node('p','Legal basis: '+purposeLegalBasis(purpose)),node('p','Data: '+purpose.dataCategories.join(', ')),node('p','Retention: '+purpose.retention),node('p',`Collection: ${purpose.collection.source} · ${purpose.collection.required?'required':'optional'}`));const all=node('details');all.append(node('summary','All pinned purpose facts'),node('pre',JSON.stringify(purpose,null,2)));details.append(all);}
  for(const source of selection.reference.sources){const a=node('a',source.url);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';details.append(a,node('p',`${source.access==='read'?'Retrieved '+source.checkedOn:'Reference URL; not retrieved'} · ${source.revision} · ${source.license} · ${source.note}`));}
  const all=node('details');all.append(node('summary','Complete selected reference'),node('pre',JSON.stringify(selection.reference,null,2)));details.append(all);return section;
 }
 function prepare(catalog?:unknown){
  checked.checked=false;reason.value='';comparison.replaceChildren();error.textContent='';
  try{review=prepareCatalogSelectionReview(options.getConfig(),options.previous,catalog);status.textContent=review.changes.length?'Changed: '+review.changes.map(k=>({reference:'selected reference facts',service:'service disclosure',purposes:'purpose facts'}[k])).join(', ')+'.':'Pinned reference and declared use still match. A new review remains explicit.';
   const grid=node('div');grid.className='nb-catalog-review-grid';grid.append(panel('Prior review',review.previous),panel('Proposed review',review.proposed));comparison.append(grid);apply.disabled=false;
  }catch{review=undefined;apply.disabled=true;status.textContent='Could not compare this note. Import its matching config and check that the reference still contains the same product. Nothing changed.';}
 }
 // Start with the exact retained reference, never silently reinterpret it using a newer catalog.
 prepare();
 refresh.addEventListener('click',async()=>{if(loading||destroyed)return;loading=true;refresh.disabled=true;apply.disabled=true;checked.checked=false;
  try{const catalog=options.catalog??await options.loadCatalog!();if(destroyed)return;prepare(catalog);}
  catch{if(!destroyed){review=undefined;comparison.replaceChildren();error.textContent='The reference could not be loaded. Try again; the draft and prior pin are unchanged.';}}
  finally{if(!destroyed){loading=false;refresh.disabled=false;apply.disabled=!review;}}
 });
 apply.addEventListener('click',()=>{if(!review||loading||destroyed)return;
  let result:ReturnType<typeof confirmCatalogSelectionReview>;
  try{result=confirmCatalogSelectionReview(options.getConfig(),review,{confirmed:checked.checked as true,justification:reason.value});}
  catch{error.textContent='Confirm the displayed facts and provide a new private reason. If the draft changed, reopen this review. Nothing was applied.';return;}
  try{options.onConfirm(result);}catch{error.textContent='Could not confirm the host draft update. Check its review limits and current state before trying again.';}
 });
 title.focus();return {destroy(){destroyed=true;review=undefined;root.remove();}};
}
