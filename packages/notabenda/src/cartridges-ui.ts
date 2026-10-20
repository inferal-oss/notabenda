// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {cartridgeLibrary,selectCartridges,normalizeCartridgeSelection,readCartridgeSelection,formatCartridgeBrief} from './cartridges.js';
import type {CartridgeId,CartridgeSelection} from './cartridges.js';
import {mountSetup} from './setup-ui.js';
import type {SetupUIOptions,MountedSetup} from './setup-ui.js';

export interface CartridgeConsoleOptions extends SetupUIOptions {
 /** Optional host-owned destinations. Omit links that your application does not provide. */
 exampleLinks?:Partial<Record<CartridgeId,string>>;
 mapUrl?:string;
 guideUrl?:string;
}

/** Mount into an empty host element, or hydrate markup from renderCartridgeConsole. No storage or network is owned by this component. */
export function mountCartridgeConsole(container:HTMLElement,options:CartridgeConsoleOptions={}) {
 const doc=container.ownerDocument,window=doc.defaultView;
 if(!window)throw Error('A document window is required.');
 const view=window;
 // Validate selections and link destinations before replacing any host content.
 const html=renderCartridgeConsole(options);
 const hydrated=container.matches('[data-cartridge-console]');
 if(!hydrated)container.innerHTML=html;
 const root=hydrated?container:container.querySelector<HTMLElement>('[data-cartridge-console]')!;
 const find=<T extends HTMLElement>(selector:string)=>{const node=root.querySelector<T>(selector);if(!node)throw Error('Cartridge console markup is incomplete.');return node;};
 const library=find<HTMLElement>('[data-cartridge-library]'),setup=find<HTMLElement>('[data-cartridge-setup]'),form=find<HTMLFormElement>('form'),next=find<HTMLButtonElement>('[data-cartridge-continue]'),brief=find<HTMLAnchorElement>('[data-cartridge-brief]'),count=find<HTMLElement>('[data-cartridge-count]'),error=find<HTMLElement>('[data-cartridge-error]'),target=find<HTMLElement>('[data-cartridge-setup-mount]'),back=find<HTMLButtonElement>('[data-cartridge-back]');
 let mounted:MountedSetup|undefined,briefUrl:string|undefined,destroyed=false;
 const inputs=()=>[...root.querySelectorAll<HTMLInputElement>('input[name=cartridge]')];
 const initial=initialSelection(options);
 if(initial.selected.length){const ids=new Set(initial.selected.map(c=>c.id));for(const input of inputs())input.checked=ids.has(input.value as CartridgeId);}
 const selection=()=>{
  const checked=inputs().filter(input=>input.checked).map(input=>input.value),pins=mounted?.getDraft().report.cartridges??initial;
  // Saved pin order is part of the report. Do not manufacture a conflicting selection from DOM order.
  const retained=pins.selected.filter(c=>checked.includes(c.id)).map(c=>c.id);
  return selectCartridges([...retained,...checked.filter(id=>!retained.includes(id as CartridgeId))]);
 };
 const releaseBrief=()=>{if(briefUrl)view.URL.revokeObjectURL(briefUrl);briefUrl=undefined;brief.removeAttribute('href');brief.removeAttribute('download');};
 function refresh(){
  if(destroyed)return;
  releaseBrief();error.hidden=true;
  const chosen=selection();next.disabled=!chosen.selected.length;brief.hidden=!chosen.selected.length;
  count.textContent=chosen.selected.length?chosen.selected.length+' cartridge'+(chosen.selected.length===1?'':'s')+' in your plan':'Choose your first cartridge';
  for(const card of root.querySelectorAll<HTMLElement>('[data-cartridge]')){
   const added=card.querySelector<HTMLInputElement>('input')!.checked;card.dataset.selected=String(added);
   card.querySelector('.cartridge-select-label')!.firstChild!.textContent=added?'In your plan ':card.dataset.kind==='regulatory'?'Select for assessment ':'Insert into plan ';
  }
  if(chosen.selected.length){
   try{briefUrl=view.URL.createObjectURL(new view.Blob([formatCartridgeBrief(chosen)],{type:'text/plain'}));brief.href=briefUrl;brief.download='notabenda-setup-brief.txt';}
   catch{brief.hidden=true;/* Setup remains usable when downloads are unavailable. */}
  }
 }
 const onSubmit=(event:Event)=>{event.preventDefault();if(destroyed)return;try{
  const chosen=selection();if(!chosen.selected.length)return;
  if(mounted)mounted.setCartridges(chosen);else mounted=mountSetup(target,{...options,cartridges:chosen});
  library.hidden=true;setup.hidden=false;error.hidden=true;
  const heading=setup.querySelector<HTMLElement>('h1')!;heading.tabIndex=-1;heading.focus();setup.scrollIntoView?.({block:'start'});
 }catch{
  error.textContent=mounted?'This selection could not be applied. Your earlier draft is still open; check the entered facts before trying again.':'Could not prepare this selection. Return to your cartridges and try again.';
  error.hidden=false;if(mounted){library.hidden=true;setup.hidden=false;}error.tabIndex=-1;error.focus();
 }};
 const onBack=()=>{
  if(destroyed)return;
  // A loaded private report may have changed the selection within setup.
  const current=mounted?.getDraft().report.cartridges;
  if(current){const ids=new Set(current.selected.map(c=>c.id));for(const input of inputs())input.checked=ids.has(input.value as CartridgeId);}
  refresh();setup.hidden=true;library.hidden=false;next.focus();
 };
 form.addEventListener('submit',onSubmit);form.addEventListener('change',refresh);back.addEventListener('click',onBack);next.hidden=false;refresh();
 return {getDraft:()=>mounted?.getDraft(),destroy(){if(destroyed)return;destroyed=true;mounted?.destroy();releaseBrief();form.removeEventListener('submit',onSubmit);form.removeEventListener('change',refresh);back.removeEventListener('click',onBack);next.disabled=true;}};
}
const e=(v:unknown)=>String(v).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const link=(value:string|undefined)=>{if(value!==undefined&&(!/^\/(?!\/)[a-zA-Z0-9_./#-]*$/u.test(value)||value.split('/').some(p=>p==='.'||p==='..')))throw Error('Use local cartridge example and guide paths without query strings.');return value;};
function initialSelection(options:CartridgeConsoleOptions):CartridgeSelection {
 const resumed=readCartridgeSelection(options.answers),chosen=options.cartridges===undefined?resumed:normalizeCartridgeSelection(options.cartridges);
 if(chosen&&resumed&&JSON.stringify(chosen)!==JSON.stringify(resumed))throw Error('Selected cartridges conflict with the saved report.');
 return chosen??selectCartridges([]);
}
export function renderCartridgeConsole(options:CartridgeConsoleOptions={}):string {
 const library=cartridgeLibrary(),selected=new Set(initialSelection(options).selected.map(c=>c.id));
 const examples=options.exampleLinks??{};for(const [id,url] of Object.entries(examples)){if(!library.some(c=>c.id===id))throw Error('Use installed cartridge IDs for example links.');link(url);}
 const mapUrl=link(options.mapUrl),guideUrl=link(options.guideUrl);
 const card=(c:ReturnType<typeof cartridgeLibrary>[number],index:number,small=false)=>`<article class="cartridge-card ${small?'cartridge-card-small':''}" data-cartridge="${c.id}" data-kind="${c.kind}" data-selected="${selected.has(c.id)}"><label class="cartridge-select"><input type="checkbox" value="${c.id}" name="cartridge"${selected.has(c.id)?' checked':''}><span class="cartridge-art cartridge-art-${c.id}" aria-hidden="true"><span class="cartridge-spine">NOTABENDA <span>${String(index+1).padStart(2,'0')}</span></span><span class="cartridge-glyph"><i></i><i></i><i></i></span><span class="cartridge-case-label">${c.kind==='regulatory'?'RULE MODULE':'SITE CARTRIDGE'}</span><span class="cartridge-contacts"></span><span class="cartridge-added">✓</span></span><span class="cartridge-card-copy"><strong>${e(c.title)}</strong><span>${e(c.outcome)}</span><span class="cartridge-select-label">${c.kind==='regulatory'?'Select for assessment':'Insert into plan'} <span aria-hidden="true">＋</span></span></span></label>${examples[c.id]?`<a class="cartridge-preview" href="${e(examples[c.id])}" aria-label="${c.kind==='regulatory'?'See the timing example':'Try the example'}: ${e(c.title)}">${c.kind==='regulatory'?'See the timing example':'Try the example'} <span aria-hidden="true">↗</span></a>`:''}</article>`;
 return `<div class="cartridge-shell" data-cartridge-console><section data-cartridge-library><header class="cartridge-intro"><p class="eyebrow"><span class="status-dot"></span> YOUR NOTABENDA</p><h1>Choose your<br><span>first cartridge.</span></h1><p>Choose a job. We’ll help you prepare it, explain the decisions, and connect it to your site.</p></header><form class="cartridge-library" aria-label="Choose cartridges"><div class="cartridge-shelf-heading"><h2>Start with one</h2><p>You can add more as your site grows.</p></div><div class="cartridge-deck">${library.filter(c=>c.shelf==='basics').map((c,i)=>card(c,i)).join('')}</div><div class="cartridge-tray"><div><span class="cartridge-tray-label">SETUP TRAY</span><p data-cartridge-count role="status">Choose your first cartridge</p></div><div class="cartridge-tray-actions"><a data-cartridge-brief hidden>Give to my agent <span aria-hidden="true">↗</span></a><button class="button primary" data-cartridge-continue type="submit" hidden disabled>Set up my site <span aria-hidden="true">→</span></button></div></div><details class="cartridge-more"><summary>Explore more cartridges <span aria-hidden="true">＋</span></summary><div class="cartridge-shelf-heading"><h2>Add another function</h2><p>Separate jobs, using the same site inventory.</p></div><div class="cartridge-deck">${library.filter(c=>c.shelf==='more').map((c,i)=>card(c,i+3,true)).join('')}</div><div class="cartridge-shelf-heading"><h2>Specific regional rules</h2><p>These preview modules cover named rules. Assess applicability before enabling a policy; they are not full country packs.</p></div><div class="cartridge-deck cartridge-regional">${library.filter(c=>c.shelf==='regional').map((c,i)=>card(c,i+6,true)).join('')}</div></details></form><p class="cartridge-footnote">Selection prepares a local draft. It does not change your site or certify compliance. ${mapUrl?`<a href="${e(mapUrl)}">How the parts fit together →</a>`:''}</p><noscript><p>${guideUrl?`Use the <a href="${e(guideUrl)}">cartridge guide</a> to prepare a draft with the CLI.`:'Prepare a draft with the Notabenda CLI wizard.'} This local setup needs JavaScript.</p></noscript></section><section data-cartridge-setup hidden><header class="cartridge-workspace-heading"><button type="button" data-cartridge-back>← Your cartridges</button><p class="eyebrow">PREPARE YOUR SITE</p><h1>Let’s make it yours.</h1><p>Your public details come first. Then we’ll ask about the practices this cartridge needs.</p></header><div data-cartridge-setup-mount></div></section><p data-cartridge-error role="alert" hidden></p></div>`;
}
