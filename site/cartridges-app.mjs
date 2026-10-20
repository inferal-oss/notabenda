// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {selectCartridges,formatCartridgeBrief} from 'notabenda/cartridges';
import {mountSetup} from 'notabenda/setup/ui';
export function mountCartridgeConsole(root){
 const doc=root.ownerDocument,view=doc.defaultView,library=root.querySelector('[data-cartridge-library]'),setup=root.querySelector('[data-cartridge-setup]'),form=root.querySelector('form'),next=root.querySelector('[data-cartridge-continue]'),brief=root.querySelector('[data-cartridge-brief]'),count=root.querySelector('[data-cartridge-count]'),error=root.querySelector('[data-cartridge-error]'),target=root.querySelector('[data-cartridge-setup-mount]');
 let mounted,briefUrl,destroyed=false;
 const selection=()=>selectCartridges([...root.querySelectorAll('input[name=cartridge]:checked')].map(input=>input.value));
 function refresh(){
  if(briefUrl)view.URL.revokeObjectURL(briefUrl);briefUrl=undefined;error.hidden=true;
  const chosen=selection();next.disabled=!chosen.selected.length;brief.hidden=!chosen.selected.length;
  count.textContent=chosen.selected.length?chosen.selected.length+' cartridge'+(chosen.selected.length===1?'':'s')+' in your plan':'Choose your first cartridge';
  for(const card of root.querySelectorAll('[data-cartridge]')){const added=card.querySelector('input').checked;card.dataset.selected=String(added);card.querySelector('.cartridge-select-label').firstChild.textContent=added?'In your plan ':'Insert into plan ';}
  if(chosen.selected.length){briefUrl=view.URL.createObjectURL(new Blob([formatCartridgeBrief(chosen)],{type:'text/plain'}));brief.href=briefUrl;brief.download='notabenda-setup-brief.txt';}
 }
 const onSubmit=event=>{event.preventDefault();if(destroyed)return;try{const chosen=selection();if(!chosen.selected.length)return;
  if(mounted)mounted.setCartridges(chosen);
  else mounted=mountSetup(target,{cartridges:chosen,documentationBase:'/guide',loadCatalog:()=>import('/assets/catalog-seed.mjs').then(module=>module.serviceCatalogSeed)});
  library.hidden=true;setup.hidden=false;error.hidden=true;const heading=setup.querySelector('h1');heading.tabIndex=-1;heading.focus();setup.scrollIntoView?.({block:'start'});
 }catch{error.textContent=mounted?'This selection could not be applied. Your earlier draft is still open; check the entered facts before trying again.':'Could not prepare this selection. Return to your cartridges and try again.';error.hidden=false;if(mounted){library.hidden=true;setup.hidden=false;}error.tabIndex=-1;error.focus();}};
 const onBack=()=>{setup.hidden=true;library.hidden=false;next.focus();};
 const back=root.querySelector('[data-cartridge-back]');form.addEventListener('submit',onSubmit);form.addEventListener('change',refresh);back.addEventListener('click',onBack);next.hidden=false;refresh();
 return {destroy(){destroyed=true;mounted?.destroy();if(briefUrl)view.URL.revokeObjectURL(briefUrl);form.removeEventListener('submit',onSubmit);form.removeEventListener('change',refresh);back.removeEventListener('click',onBack);}};
}
const consoleRoot=typeof document==='undefined'?null:document.querySelector('[data-cartridge-console]');if(consoleRoot)mountCartridgeConsole(consoleRoot);
