// @requirements REQ-PRODUCT-LOCALIZATION
import {mountControls} from './controls.js';
import type {MountedControls} from './controls.js';
import type {ConsentStateController} from './consent.js';

export interface AstroConsentOptions {consent:ConsentStateController;document?:Document}
export interface MountedAstroConsent {refresh():void;destroy():void}
const owners=new WeakSet<ConsentStateController>();
const documents=new WeakSet<Document>();

/** @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-CONSENT-RUNTIME
 * Bind one host-owned controller to Astro's page lifecycle. No Astro, browser or Node access on import.
 */
export function mountAstroConsent(options:AstroConsentOptions):MountedAstroConsent {
  const consent=options.consent;
  const surface=options.document??(typeof document==='undefined'?undefined:document);
  if(!surface)throw new Error('Mount Astro consent controls in a browser document.');
  const doc:Document=surface;
  if(consent.getSnapshot().destroyed)throw new Error('Use a live consent controller for Astro controls.');
  if(owners.has(consent))throw new Error('Mount one Astro controls bridge per consent controller.');
  if(documents.has(doc))throw new Error('Mount one Astro controls bridge per document.');
  let container:HTMLElement|undefined;let controls:MountedControls|undefined;let disposed=false;
  const buttons=()=>Array.from(doc.querySelectorAll<HTMLButtonElement>('button[data-notabenda-preferences]'));
  function syncButtons():void {
    const unavailable=disposed||!controls||consent.getSnapshot().destroyed;
    for(const button of buttons()){const l=consent.getNotice()?.localization??consent.getConfig().localization;if(l){button.lang=l.locale;button.dir=l.direction;if(button.hasAttribute('data-notabenda-default-label'))button.textContent=l.consent.triggerLabel;}button.hidden=unavailable;button.disabled=unavailable;}
  }
  function detach():void {
    const previous=controls;controls=undefined;container=undefined;
    // A route change closes the draft; it neither applies selections nor changes consent.
    previous?.destroy();syncButtons();
  }
  function refresh():void {
    if(disposed)return;
    const matches=doc.querySelectorAll<HTMLElement>('[data-notabenda-controls]');
    if(matches.length>1){detach();throw new Error('Render one Astro ConsentControls component per page; use PreferencesButton for extra entry points.');}
    const next=matches[0];
    if(next===container&&controls){syncButtons();return;}
    detach();
    if(next&&!consent.getSnapshot().destroyed){
      const label=next.getAttribute('data-notabenda-label');
      controls=mountControls(next,{consent,...(label===null?{}:{preferencesLabel:label})});container=next;
    }
    syncButtons();
  }
  function open(event:Event):void {
    if(event.defaultPrevented||!controls||consent.getSnapshot().destroyed)return;
    const target=event.target as Element|null;
    if(!target||typeof target.closest!=='function')return;
    const button=target.closest<HTMLButtonElement>('button[data-notabenda-preferences]');
    if(!button||button.ownerDocument!==doc||button.disabled||button.type!=='button')return;
    event.preventDefault();consent.openPreferences();
  }
  let unsubscribe=()=>{};
  const remove=()=>{doc.removeEventListener('astro:before-swap',detach);doc.removeEventListener('astro:page-load',refresh);doc.removeEventListener('click',open);};
  owners.add(consent);documents.add(doc);
  try {
    refresh();
    doc.addEventListener('astro:before-swap',detach);doc.addEventListener('astro:page-load',refresh);doc.addEventListener('click',open);
    unsubscribe=consent.subscribe(syncButtons);
  }catch(error){disposed=true;remove();detach();owners.delete(consent);documents.delete(doc);throw error;}
  return {refresh,destroy(){
    if(disposed)return;disposed=true;
    remove();unsubscribe();detach();owners.delete(consent);documents.delete(doc);
  }};
}

export {mountAstroFormPermission} from './astro-form-permission.js';
export type {AstroFormPermissionOptions,MountedAstroFormPermission} from './astro-form-permission.js';
