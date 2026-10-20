// @requirements REQ-PRODUCT-TERMS-ADAPTERS
import type {TermsAcceptanceController} from './terms.js';
const owners=new WeakSet<TermsAcceptanceController>(),contexts=new WeakMap<TermsAcceptanceController,string>();
/** Framework views share one owner; a host controller's first Astro context cannot be renamed. */
export function claimTermsView(controller:TermsAcceptanceController,contextKey?:string):()=>void {
 if(owners.has(controller))throw Error('Mount one framework agreement view per terms acceptance controller.');
 const previous=contexts.get(controller);
 if(contextKey!==undefined&&previous!==undefined&&previous!==contextKey)throw Error('The agreement operation changed. Create a fresh host controller.');
 if(contextKey!==undefined)contexts.set(controller,contextKey);
 owners.add(controller);let released=false;
 return ()=>{if(released)return;released=true;owners.delete(controller);};
}
