// @requirements REQ-PRODUCT-SETUP-SESSION
import {captureEditorFields,restoreEditorFields} from './setup-session-fields.js';
import type {EditorFields} from './setup-session-fields.js';
export interface CatalogPickerDraft {open:boolean;query:string;proposal?:{baseline:unknown;reference:ServiceCatalog;fields:EditorFields}}
// @requirements REQ-PRODUCT-SERVICE-PROFILES
export {mountCatalogSelectionReview} from './catalog-review-ui.js';
export type {CatalogSelectionReviewUIOptions} from './catalog-review-ui.js';
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SETUP REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE */
import {renderCatalogProductProfile} from './catalog-profile.js';
import {normalizeServiceCatalog,searchServiceCatalog} from './catalog.js';
import type {ServiceCatalog,CatalogSearchResult} from './catalog.js';
import {createCatalogSelectionPlan} from './catalog-selection.js';
import type {CatalogServiceSelection} from './catalog-selection.js';
import {toPublicConfig} from './config.js';
import type {SiteConfig} from './types.js';
export interface CatalogPickerOptions {
 catalog?:unknown;loadCatalog?:()=>Promise<unknown>;documentationBase?:string;
 getConfig():unknown;
 onSelect(result:{config:SiteConfig;selection:CatalogServiceSelection}):void;
}
/** Explicit local search/review. The host chooses the catalog source and owns the draft. */
export function mountCatalogPicker(container:HTMLElement,options:CatalogPickerOptions):{getSessionDraft():CatalogPickerDraft;restoreSessionDraft(draft:CatalogPickerDraft):void;destroy():void} {
 if(!container?.ownerDocument||typeof options.getConfig!=='function'||typeof options.onSelect!=='function'||options.catalog===undefined&&typeof options.loadCatalog!=='function')throw Error('Supply a catalog loader, current config and explicit draft callback.');
 let catalog=options.catalog===undefined?undefined:normalizeServiceCatalog(options.catalog),destroyed=false,loading=false;
 const doc=container.ownerDocument,node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const root=node('details');root.className='nb-catalog-picker';root.dataset.catalogPicker='';root.append(node('summary','Find a service in the reference catalog'));container.append(root);
 // Search/proposal edits do not alter the enclosing questionnaire or submit its form.
 for(const type of ['input','change'])root.addEventListener(type,event=>event.stopPropagation());
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'&&!event.isComposing&&(event.target as HTMLElement)?.tagName==='INPUT')event.preventDefault();});
 const body=node('div');body.className='nb-catalog-body';root.append(body);body.append(node('p','Search reference entries, then confirm the actual site use. A match is a starting point; it does not activate a service or determine its legal basis.'));
 const toolbar=node('div');toolbar.className='nb-catalog-search';body.append(toolbar);
 const label=node('label','Search services');const query=node('input');query.type='search';query.maxLength=120;query.placeholder='Provider, product or category';label.append(query);toolbar.append(label);
 const search=node('button','Search catalog');search.type='button';search.className='nb-choice-button';toolbar.append(search);
 const status=node('p');status.setAttribute('role','status');body.append(status);
 const results=node('div');results.className='nb-catalog-results';body.append(results);
 const proposal=node('section');proposal.className='nb-catalog-proposal';proposal.hidden=true;body.append(proposal);
 function enabled(){search.disabled=!catalog||loading;query.disabled=!catalog||loading;root.setAttribute('aria-busy',loading?'true':'false');}
 enabled();
 root.addEventListener('toggle',async()=>{
  if(!root.open||catalog||loading||destroyed)return;loading=true;enabled();status.textContent='Loading the reference catalog…';
  try{const raw=await options.loadCatalog!();if(destroyed)return;catalog=normalizeServiceCatalog(raw);status.textContent=`${catalog.products.length} reference entries ready. Search by name or category.`;}
  catch{if(!destroyed)status.textContent='Catalog could not be loaded. Close and reopen this section to retry. Your draft has not changed.';}
  finally{if(!destroyed){loading=false;enabled();}}
 });
 const field=(title:string,input:HTMLElement)=>{const label=node('label',title);label.append(input);proposal.append(label);return input;};
 let proposalReference:ServiceCatalog|undefined,proposalBaseline:unknown;
 function review(candidate:CatalogSearchResult,retained?:ServiceCatalog,baseline?:unknown){
  const ids=new Set([...candidate.product.sourceIds,...candidate.provider.sourceIds]);const reference=retained??normalizeServiceCatalog({...catalog!,sources:catalog!.sources.filter(s=>ids.has(s.id)),providers:[candidate.provider],products:[{...candidate.product,identifiers:[],storageHints:[]}]});proposalReference=reference;
  proposal.replaceChildren();proposal.hidden=false;
  const heading=node('h3','Review '+candidate.product.name);heading.tabIndex=-1;proposal.append(heading,node('p',candidate.product.description),node('p',`Reference status: ${candidate.product.review}. Confirm the actual provider entity, settings and processing locations yourself.`));
  const notes=node('div');notes.innerHTML=renderCatalogProductProfile(reference,candidate.product.id,{headingLevel:4,...(options.documentationBase?{documentationBase:options.documentationBase}:{})});proposal.append(notes);
  const sources=node('details');sources.append(node('summary','Reference sources and revision'));const list=node('ul');sources.append(list);
  for(const source of reference.sources.filter(s=>ids.has(s.id))){const li=node('li'),a=node('a',source.url);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a,node('p',`${source.access==='read'?'Source retrieved '+source.checkedOn:'Reference URL; not retrieved or verified'} · ${source.license} · ${source.revision}`));list.append(li);}
  sources.append(node('p',`Catalog ${reference.id} / ${reference.revision} · product ${candidate.product.revision}`));proposal.append(sources);
  const id=node('input');id.value=candidate.product.id;id.maxLength=120;field('Local service ID',id);
  const provider=node('input');provider.value=candidate.provider.name;provider.maxLength=300;field('Actual provider entity',provider);
  const location=node('input');location.maxLength=4000;field('Actual processing location',location);
  const privacy=node('input');privacy.type='url';privacy.maxLength=2048;field('Provider privacy URL (optional; verify before use)',privacy);
  const privacyLink=candidate.product.profile?.links.find(link=>link.kind==='privacy');
  let copy:HTMLButtonElement|undefined;
  if(privacyLink){const suggestion=node('div');suggestion.className='nb-catalog-privacy-copy';suggestion.append(node('p','Reference privacy URL: '+privacyLink.url));copy=node('button','Use reference privacy URL');copy.type='button';copy.className='nb-choice-button';suggestion.append(copy,node('p','Optional. Check that it covers the actual entity and product. Clear your current URL first to replace it.'));proposal.append(suggestion);}
  const purposes=node('div');purposes.className='nb-catalog-purpose-group';purposes.setAttribute('role','group');purposes.setAttribute('aria-label','Declared purposes used by this service');purposes.append(node('p','Declared purposes used by this service'));proposal.append(purposes);const purposeInputs:HTMLInputElement[]=[];
  const config=toPublicConfig(baseline??options.getConfig(),{mode:'preview'});proposalBaseline=config;
  for(const purpose of config.purposes){const label=node('label');label.className='nb-catalog-check';const input=node('input');input.type='checkbox';input.value=purpose.id;purposeInputs.push(input);label.append(input,doc.createTextNode(purpose.name+' · '+purpose.id));purposes.append(label);}
  if(!purposeInputs.length)purposes.append(node('p','Declare actual processing purposes before selecting this service, then reopen this review. In guided setup, use the Processing purposes section above.'));
  const reason=node('textarea');reason.rows=3;reason.maxLength=4000;field('Supporting facts / justification (private)',reason);
  const confirmed=node('input');confirmed.type='checkbox';confirmed.dataset.sessionReview='';const confirmation=node('label');confirmation.className='nb-catalog-check';confirmation.append(confirmed,doc.createTextNode('I reviewed the actual provider, purpose and processing location.'));proposal.append(confirmation);
  const invalidate=()=>{confirmed.checked=false;if(copy)copy.disabled=privacy.value.trim().length>0;};
  for(const input of [id,provider,location,privacy,reason,...purposeInputs])for(const event of ['input','change'])input.addEventListener(event,invalidate);
  copy?.addEventListener('click',()=>{if(privacy.value.trim()||!privacyLink)return;privacy.value=privacyLink.url;invalidate();privacy.focus();});
  const error=node('p');error.setAttribute('role','alert');proposal.append(error);
  const add=node('button','Add reviewed service to draft');add.type='button';add.className='nb-choice-button';proposal.append(add);
  add.addEventListener('click',()=>{
   try{
    const purposeIds=purposeInputs.filter(input=>input.checked).map(input=>input.value);
    const result=createCatalogSelectionPlan(options.getConfig(),reference,{productId:candidate.product.id,serviceId:id.value.trim(),provider:provider.value.trim(),location:location.value.trim(),purposeIds,reviewedPurposes:purposeIds.map(id=>config.purposes.find(p=>p.id===id)!),...(privacy.value.trim()?{privacyUrl:privacy.value.trim()}:{}),justification:reason.value,confirmed:confirmed.checked as true});
    try{options.onSelect(result);}catch{error.textContent='Could not confirm the host draft update. Check the current draft before trying again.';return;}proposal.hidden=true;proposal.replaceChildren();status.textContent=`Added ${result.selection.service.name} to the local draft. Prepare recommendations to export it and its private review notes.`;status.tabIndex=-1;status.focus();
   }catch{error.textContent='Check the unique lowercase ID, provider, location, at least one declared purpose, HTTPS privacy URL, justification and review confirmation. If purpose facts changed, reopen this service review. Nothing was added.';}
  });
  heading.focus();
 }
 function find(){if(!catalog||destroyed)return;proposal.hidden=true;proposal.replaceChildren();results.replaceChildren();
  if(query.value.trim().length<2){status.textContent='Enter at least two characters to search.';return;}
  try{const matches=searchServiceCatalog(catalog,query.value,{limit:12});status.textContent=matches.length?`${matches.length} candidate${matches.length===1?'':'s'} shown (up to 12). Narrow the search if needed.`:'No candidates match. Custom services can still be declared directly in your config.';
   for(const candidate of matches){const card=node('section');card.className='nb-catalog-result';card.append(node('p',candidate.provider.name),node('h3',candidate.product.name),node('p',candidate.product.categories.join(' · ')));const button=node('button','Review '+candidate.product.name);button.type='button';button.className='nb-choice-button';button.addEventListener('click',()=>{try{review(candidate);}catch{proposal.hidden=true;status.textContent='Finish importing a valid configuration before reviewing this candidate.';}});card.append(button);results.append(card);}
  }catch{status.textContent='Use a bounded plain-text catalog search.';}
 }
 search.addEventListener('click',find);query.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();find();}});
 return {getSessionDraft(){return {open:root.open,query:query.value,...(!proposal.hidden&&proposalReference?{proposal:{baseline:proposalBaseline,reference:structuredClone(proposalReference),fields:captureEditorFields(proposal)}}:{})};},restoreSessionDraft(draft){query.value=draft.query;if(draft.proposal){const reference=normalizeServiceCatalog(draft.proposal.reference);if(reference.products.length!==1||reference.providers.length!==1)throw Error('Invalid saved catalog proposal.');review({product:reference.products[0]!,provider:reference.providers[0]!},reference,draft.proposal.baseline);restoreEditorFields(proposal,draft.proposal.fields);}else if(catalog)find();root.open=draft.open;},destroy(){if(destroyed)return;destroyed=true;root.remove();catalog=undefined;}};
}
