// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
import {supportsRightsPage} from './rights-localization-policy.js';
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {toPublicConfig,documentKinds} from './config.js';
import {renderRightsCenter} from './rights.js';
import {renderLegalDocument} from './documents.js';
import type {DocumentKind} from './types.js';

export type PreviewPageKind=DocumentKind|'rights';
export interface LegalPreviewOptions {config:unknown;initialDocument?:PreviewPageKind;onClose?:()=>void}
export interface MountedLegalPreview {open():void;close():void;destroy():void}
/** A deliberate, local reading preview. It never publishes, changes review status or runs authored MDX. */
export function mountLegalPreview(container:HTMLElement,options:LegalPreviewOptions):MountedLegalPreview {
 const doc=container.ownerDocument,view=doc.defaultView;
 if(!view||!options||options.initialDocument!==undefined&&!([...documentKinds,'rights'] as string[]).includes(options.initialDocument)||options.onClose!==undefined&&typeof options.onClose!=='function')throw Error('Use a document window, known document kind and optional close callback.');
 // Project to declared public facts before creating DOM; private reports are never accepted here.
 const config=structuredClone(toPublicConfig(options.config,{mode:'preview'})),instance='nb-preview-'+crypto.randomUUID();
 const pages=new Map<PreviewPageKind,string>(documentKinds.map(kind=>[kind,renderLegalDocument(config,kind,{mode:'preview'})]));
 const unsupportedRights=!!config.rightsCenter&&!supportsRightsPage(config);
 if(config.rightsCenter&&!unsupportedRights)pages.set('rights',renderRightsCenter(config,{mode:'preview',idPrefix:'nb-rights-preview',headingLevel:2}));
 if(options.initialDocument==='rights'&&!pages.has('rights'))throw Error(unsupportedRights?'The privacy request preview needs complete localization.rights messages; keep the site locale.':'Declare a supported request page before previewing it.');
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const dialog=node('dialog');dialog.className='nb-legal-preview';dialog.setAttribute('aria-labelledby',instance+'-title');dialog.setAttribute('aria-describedby',instance+'-note');
 const header=node('header');header.className='nb-legal-preview-header';
 const title=node('h2','Preview your pages');title.id=instance+'-title';title.tabIndex=-1;
 const close=node('button','Close preview');close.type='button';close.className='nb-legal-preview-close';
 const note=node('p','This shows declared configuration, including placeholders. Outside links are disabled. Your site is unchanged.'+(unsupportedRights?' The request-page preview is unavailable: supply complete localization.rights messages for this site locale.':''));note.id=instance+'-note';
 header.append(title,close,note);dialog.append(header);
 const navigation=node('nav');navigation.className='nb-legal-preview-navigation';navigation.setAttribute('aria-label','Preview document');
 const paper=node('div');paper.className='nb-legal-preview-paper';
 const status=node('p');status.className='nb-legal-preview-status';status.setAttribute('role','status');
 dialog.append(navigation,status,paper);let destroyed=false,opener:HTMLElement|null=null;
 const buttons=new Map<PreviewPageKind,HTMLButtonElement>();
 function select(kind:PreviewPageKind){
  paper.innerHTML=pages.get(kind)!;
  const contents=paper.querySelector<HTMLElement>('.nb-contents');
  if(contents){const details=node('details');details.className='nb-legal-preview-contents';details.append(node('summary',contents.getAttribute('aria-label')??'On this page'));contents.replaceWith(details);details.append(contents);}
  // Preview IDs cannot collide with a legal page or a second mounted preview in the host DOM.
  const ids=new Map<string,string>();for(const element of paper.querySelectorAll<HTMLElement>('[id]')){ids.set(element.id,instance+'-'+element.id);element.id=ids.get(element.id)!;}
  for(const element of paper.querySelectorAll<HTMLElement>('[aria-labelledby],[aria-describedby],[aria-controls],[headers],[for]'))for(const attr of ['aria-labelledby','aria-describedby','aria-controls','headers','for']){const value=element.getAttribute(attr);if(value)element.setAttribute(attr,value.split(/\s+/u).map(id=>ids.get(id)??id).join(' '));}
  for(const anchor of paper.querySelectorAll<HTMLAnchorElement>('a[href]')){
   const href=anchor.getAttribute('href')!,target=href.startsWith('#')?ids.get(href.slice(1)):undefined;
   if(target)anchor.setAttribute('href','#'+target);
   else{anchor.removeAttribute('href');anchor.setAttribute('role','link');anchor.setAttribute('aria-disabled','true');anchor.title='Link inactive in this local preview.';}
  }
  for(const [id,button] of buttons)button.setAttribute('aria-pressed',String(id===kind));
  status.textContent=kind==='rights'?config.rightsCenter!.title+' · Supporting page · Revision '+config.rightsCenter!.revision:config.documents[kind].title+' · Version '+config.documents[kind].version;
  paper.scrollTop=0;
 }
 for(const kind of pages.keys()){const button=node('button',kind==='rights'?config.rightsCenter!.title:config.documents[kind].title);button.type='button';button.addEventListener('click',()=>{if(!destroyed)select(kind);});navigation.append(button);buttons.set(kind,button);}
 if(unsupportedRights){const unavailable=node('button',config.rightsCenter!.title+' — Page translations needed');unavailable.type='button';unavailable.disabled=true;navigation.append(unavailable);}
 select(options.initialDocument??'privacy');
 const click=(event:MouseEvent)=>{
  const target=event.target instanceof view.Element?event.target.closest('a'):null;if(!target||!paper.contains(target))return;
  event.preventDefault();const href=target.getAttribute('href');if(!href?.startsWith('#'))return;
  const section=doc.getElementById(href.slice(1));if(section&&paper.contains(section)){section.tabIndex=-1;section.focus({preventScroll:true});section.scrollIntoView?.({block:'start'});}
 };
 paper.addEventListener('click',click);
 const closed=()=>{if(destroyed)return;const target=opener;opener=null;if(target?.isConnected)target.focus();options.onClose?.();};
 dialog.addEventListener('close',closed);close.addEventListener('click',()=>dialog.close());container.append(dialog);
 return {open(){if(destroyed)throw Error('Preview has ended.');if(dialog.open)return;opener=doc.activeElement instanceof view.HTMLElement?doc.activeElement:null;dialog.showModal();title.focus();},close(){if(!destroyed&&dialog.open)dialog.close();},destroy(){if(destroyed)return;destroyed=true;dialog.removeEventListener('close',closed);paper.removeEventListener('click',click);if(dialog.open)dialog.close();dialog.remove();pages.clear();buttons.clear();opener=null;}};
}
