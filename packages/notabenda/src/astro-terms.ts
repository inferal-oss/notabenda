// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-A11Y
import {mountTermsAcceptance} from './terms.js';
import {claimTermsView} from './terms-view-owner.js';
import type {TermsAcceptanceController} from './terms.js';
export interface AstroTermsAcceptanceOptions {acceptance:TermsAcceptanceController;id:string;contextKey:string;document?:Document}
export interface MountedAstroTermsAcceptance {refresh():void;destroy():void}
const documents=new WeakMap<Document,Set<string>>();
/** Bind one explicitly named Astro field. No automatic submission, retries, identity selection or controller destruction. */
export function mountAstroTermsAcceptance(options:AstroTermsAcceptanceOptions):MountedAstroTermsAcceptance {
 const {acceptance,id,contextKey}=options,surface=options.document??(typeof document==='undefined'?undefined:document);
 if(!surface)throw new Error('Mount Astro terms agreements in a browser document.');
 if(!/^[a-z][a-z0-9-]{0,119}$/u.test(id))throw new Error('Provide a stable Astro terms agreement field ID.');
 if(!/^[A-Za-z0-9_-]{1,120}$/u.test(contextKey))throw new Error('Provide a non-secret Astro agreement context key.');
 const doc:Document=surface,ids=documents.get(doc)??new Set<string>();
 if(ids.has(id))throw new Error('Mount one Astro terms agreement bridge per document field ID.');
 const offerId=acceptance.getOffer().offerId;let container:HTMLElement|undefined,fallback:HTMLElement|undefined,field:ReturnType<typeof mountTermsAcceptance>|undefined,disposed=false;
 function detach(){field?.destroy();field=undefined;if(fallback)fallback.hidden=false;fallback=undefined;container=undefined;}
 function refresh(){
  if(disposed)return;
  const matches=Array.from(doc.querySelectorAll<HTMLElement>('[data-notabenda-terms]')).filter(node=>node.getAttribute('data-notabenda-terms')===id);
  if(matches.length>1){detach();throw new Error('Render one Astro TermsAcceptance with this ID per page.');}
  const next=matches[0];
  if(next&&(next.getAttribute('data-notabenda-terms-offer')!==offerId||next.getAttribute('data-notabenda-terms-context')!==contextKey)){detach();throw new Error('The Astro agreement offer or operation changed. Replace the host controller before mounting this field.');}
  if(next===container&&field)return;
  detach();if(!next)return;
  const mounts=Array.from(next.children).filter(node=>node.hasAttribute('data-notabenda-terms-mount')),fallbacks=Array.from(next.children).filter(node=>node.hasAttribute('data-notabenda-terms-fallback'));
  if(mounts.length!==1||fallbacks.length!==1)throw new Error('Use the Astro TermsAcceptance component for the named field.');
  field=mountTermsAcceptance(mounts[0] as HTMLElement,{acceptance});container=next;fallback=fallbacks[0] as HTMLElement;fallback.hidden=true;
 }
 const remove=()=>{doc.removeEventListener('astro:before-swap',detach);doc.removeEventListener('astro:page-load',refresh);};
 const release=claimTermsView(acceptance,contextKey);ids.add(id);documents.set(doc,ids);
 try{refresh();doc.addEventListener('astro:before-swap',detach);doc.addEventListener('astro:page-load',refresh);}catch(error){disposed=true;detach();release();ids.delete(id);throw error;}
 return {refresh,destroy(){if(disposed)return;disposed=true;remove();detach();release();ids.delete(id);}};
}
