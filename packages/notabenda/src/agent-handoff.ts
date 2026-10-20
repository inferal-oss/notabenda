// @requirements REQ-PRODUCT-AGENT-HANDOFF REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
export interface AgentHandoffOptions {text:string;title?:string;description?:string;onClose?:()=>void}
export interface MountedAgentHandoff {open():void;close():void;destroy():void}
/** A local, read-only instruction drawer. Clipboard access happens only on an explicit button press. */
export function mountAgentHandoff(container:HTMLElement,options:AgentHandoffOptions):MountedAgentHandoff {
 const doc=container.ownerDocument,view=doc.defaultView;
 if(!view||!options||typeof options.text!=='string'||!options.text.trim()||new TextEncoder().encode(options.text).length>256*1024||options.title!==undefined&&(typeof options.title!=='string'||!options.title.trim()||options.title.length>160)||options.description!==undefined&&(typeof options.description!=='string'||options.description.length>500)||options.onClose!==undefined&&typeof options.onClose!=='function')throw Error('Supply bounded instructions and an optional title, description and close callback.');
 const text=options.text,onClose=options.onClose,id='nb-agent-'+crypto.randomUUID(),node=<K extends keyof HTMLElementTagNameMap>(tag:K,copy?:string)=>{const el=doc.createElement(tag);if(copy!==undefined)el.textContent=copy;return el;};
 const dialog=node('dialog');dialog.className='nb-agent-drawer';dialog.setAttribute('aria-labelledby',id+'-title');dialog.setAttribute('aria-describedby',id+'-description');
 const header=node('header');header.className='nb-agent-header';const heading=node('div');heading.append(node('p','Agent handoff'));const title=node('h2',options.title??'Instructions for your agent');title.id=id+'-title';title.tabIndex=-1;heading.append(title);
 const close=node('button','Close');close.type='button';close.className='nb-agent-close';close.setAttribute('aria-label','Close agent instructions');header.append(heading,close);
 const description=node('p',options.description??'Copy these instructions and paste them into your coding agent.');description.id=id+'-description';description.className='nb-agent-description';
 const label=node('label','Instructions');label.htmlFor=id+'-text';label.className='nb-agent-label';const instructions=node('textarea');instructions.id=label.htmlFor;instructions.className='nb-agent-text';instructions.readOnly=true;instructions.spellcheck=false;instructions.value=text;instructions.wrap='soft';
 const footer=node('footer');footer.className='nb-agent-footer';const copy=node('button','Copy instructions');copy.type='button';copy.className='nb-agent-copy';const select=node('button','Select text');select.type='button';select.className='nb-agent-select';select.hidden=true;const status=node('p');status.className='nb-agent-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');footer.append(copy,select,status);dialog.append(header,description,label,instructions,footer);
 let destroyed=false,opener:HTMLElement|null=null,epoch=0;
 const closed=()=>{if(destroyed)return;epoch++;copy.disabled=false;const target=opener;opener=null;if(target?.isConnected)target.focus();onClose?.();};
 const selectText=()=>{if(destroyed||!dialog.open)return;instructions.focus();instructions.select();};
 const copyText=async()=>{
  if(destroyed||!dialog.open||copy.disabled)return;const token=++epoch;copy.disabled=true;copy.textContent='Copying…';status.textContent='';
  try{
   if(typeof view.navigator.clipboard?.writeText!=='function')throw Error('Unavailable');
   await view.navigator.clipboard.writeText(text);if(destroyed||!dialog.open||epoch!==token)return;copy.textContent='Copied';status.textContent='Instructions copied.';select.hidden=true;
  }catch{if(destroyed||!dialog.open||epoch!==token)return;copy.textContent='Copy instructions';select.hidden=false;status.textContent='Clipboard unavailable. Select the text and copy it manually.';}
  finally{if(!destroyed&&epoch===token)copy.disabled=false;}
 };
 const backdrop=(event:MouseEvent)=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();};
 dialog.addEventListener('close',closed);dialog.addEventListener('click',backdrop);close.addEventListener('click',()=>dialog.close());copy.addEventListener('click',copyText);select.addEventListener('click',selectText);container.append(dialog);
 return {
  open(){if(destroyed)throw Error('Agent instructions have ended.');if(dialog.open)return;opener=doc.activeElement instanceof view.HTMLElement?doc.activeElement:null;copy.textContent='Copy instructions';copy.disabled=false;status.textContent='';select.hidden=typeof view.navigator.clipboard?.writeText==='function';dialog.showModal();title.focus();},
  close(){if(!destroyed&&dialog.open)dialog.close();},
  destroy(){if(destroyed)return;const target=opener;destroyed=true;epoch++;dialog.removeEventListener('close',closed);dialog.removeEventListener('click',backdrop);copy.removeEventListener('click',copyText);select.removeEventListener('click',selectText);if(dialog.open)dialog.close();dialog.remove();opener=null;if(target?.isConnected)target.focus();},
 };
}
