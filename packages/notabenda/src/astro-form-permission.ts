// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-A11Y
import {mountFormPermission} from './form-permission.js';
import type {FormPermissionController} from './form-permission.js';
export interface AstroFormPermissionOptions {permission:FormPermissionController;id:string;document?:Document}
export interface MountedAstroFormPermission {refresh():void;destroy():void}
const owners=new WeakSet<FormPermissionController>(),documents=new WeakMap<Document,Set<string>>();
/** Bind one explicitly named Astro field. No automatic host reads, delivery, identity selection or controller destruction. */
export function mountAstroFormPermission(options:AstroFormPermissionOptions):MountedAstroFormPermission {
 const {permission,id}=options,surface=options.document??(typeof document==='undefined'?undefined:document);
 if(!surface)throw new Error('Mount Astro form permissions in a browser document.');
 if(!/^[a-z][a-z0-9-]{0,119}$/u.test(id))throw new Error('Provide a stable Astro form permission field ID.');
 if(owners.has(permission))throw new Error('Mount one Astro field bridge per form permission controller.');
 const doc:Document=surface,ids=documents.get(doc)??new Set<string>();
 if(ids.has(id))throw new Error('Mount one Astro form permission bridge per document field ID.');
 const offerId=permission.getOffer().offerId;let container:HTMLElement|undefined,fallback:HTMLElement|undefined,field:ReturnType<typeof mountFormPermission>|undefined,disposed=false;
 function detach(){field?.destroy();field=undefined;if(fallback)fallback.hidden=false;fallback=undefined;container=undefined;}
 function refresh(){
  if(disposed)return;
  const matches=Array.from(doc.querySelectorAll<HTMLElement>('[data-notabenda-form-permission]')).filter(node=>node.getAttribute('data-notabenda-form-permission')===id);
  if(matches.length>1){detach();throw new Error('Render one Astro FormPermissionField with this ID per page.');}
  const next=matches[0];
  if(next&&next.getAttribute('data-notabenda-permission-offer')!==offerId){detach();throw new Error('The Astro permission offer changed. Replace the host controller before mounting this field.');}
  if(next===container&&field)return;
  detach();if(!next)return;
  const mounts=Array.from(next.children).filter(node=>node.hasAttribute('data-notabenda-permission-mount')),fallbacks=Array.from(next.children).filter(node=>node.hasAttribute('data-notabenda-permission-fallback'));
  if(mounts.length!==1||fallbacks.length!==1)throw new Error('Use the Astro FormPermissionField component for the named field.');
  field=mountFormPermission(mounts[0] as HTMLElement,{permission});container=next;fallback=fallbacks[0] as HTMLElement;fallback.hidden=true;
 }
 const remove=()=>{doc.removeEventListener('astro:before-swap',detach);doc.removeEventListener('astro:page-load',refresh);};
 owners.add(permission);ids.add(id);documents.set(doc,ids);
 try{refresh();doc.addEventListener('astro:before-swap',detach);doc.addEventListener('astro:page-load',refresh);}catch(error){disposed=true;detach();owners.delete(permission);ids.delete(id);throw error;}
 return {refresh,destroy(){if(disposed)return;disposed=true;remove();detach();owners.delete(permission);ids.delete(id);}};
}
