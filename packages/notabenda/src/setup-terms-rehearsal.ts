// @requirements REQ-PRODUCT-TERMS-REHEARSAL REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {toPublicConfig} from './config.js';
import {createLegalDocument,renderLegalPage} from './documents.js';
import {requireEnglishSurface} from './document-localization.js';
import {selectTermsLocalization} from './terms-localization-policy.js';
import type {TermsOffer} from './terms.js';
import {createTermsAcceptance,mountTermsAcceptance} from './terms.js';
import type {TermsAcceptanceController,TermsAcceptanceReceipt} from './terms.js';
import {mountLegalPreview} from './setup-preview.js';

export interface TermsRehearsalOptions {config:unknown;scopeId:string;onClose?:()=>void}
export interface MountedTermsRehearsal {open():Promise<void>;close():void;destroy():void}
/** Actual agreement controls with a disposable in-memory recorder. No host transport or journal. */
export function mountTermsRehearsal(container:HTMLElement,options:TermsRehearsalOptions):MountedTermsRehearsal {
 const doc=container.ownerDocument,view=doc.defaultView;
 if(!view||!options||options.onClose!==undefined&&typeof options.onClose!=='function')throw Error('Use a browser window, configured agreement scope and optional close callback.');
 // Compile a detached public snapshot. Review declarations and the caller's object are unchanged.
 const config=structuredClone(toPublicConfig(options.config,{mode:'preview'})),setting=config.terms.agreements?.find(entry=>entry.scopeId===options.scopeId),onClose=options.onClose;
 if(!setting)throw Error('Select an explicitly configured terms scope.');
 const localization=config.localization?.terms?selectTermsLocalization(config.localization):undefined;
 if(!localization)requireEnglishSurface(config,'Terms acceptance without localization.terms');
 const document=createLegalDocument(config,'terms',{mode:'preview'}),html=renderLegalPage(config,'terms',{mode:'preview'});
 const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
 const hash=async(v:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(n=>n.toString(16).padStart(2,'0')).join('');
 // A domain-separated rehearsal identity, deliberately distinct from a final compiled release.
 async function previewOffer():Promise<TermsOffer>{
  const [artifactId,sha256,contentSha256]=await Promise.all([hash(canonical({rehearsalVersion:1,config})),hash(html),hash(canonical({title:document.title,sections:document.sections}))]);
  const descriptor={schemaVersion:localization?2 as const:1 as const,...(localization?{localization}:{}),artifactId,siteId:config.site.id,mode:'preview' as const,scopeId:setting!.scopeId,statement:setting!.statement,actionLabel:setting!.actionLabel,document:{title:document.title,url:`/artifacts/${artifactId}/terms.html`,version:document.version,effectiveDate:document.effectiveDate,sha256,contentSha256,reviewStatus:document.reviewStatus}};
  return {...descriptor,offerId:await hash(canonical(descriptor))};
 }
 const id='nb-terms-rehearsal-'+crypto.randomUUID();
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const dialog=node('dialog');dialog.className='nb-terms-rehearsal';dialog.setAttribute('aria-labelledby',id+'-title');dialog.setAttribute('aria-describedby',id+'-note');
 const header=node('header');header.className='nb-terms-rehearsal-header';const title=node('h2','Try your terms agreement');title.id=id+'-title';title.tabIndex=-1;
 const close=node('button','Close rehearsal');close.type='button';close.className='nb-terms-rehearsal-close';
 const note=node('p','Use your draft wording with a simulated recorder. Nothing is sent to a server. Closing discards the temporary receipts; your configuration and review status stay unchanged.');note.id=id+'-note';header.append(title,close,note);dialog.append(header);
 const body=node('div');body.className='nb-terms-rehearsal-body';const stage=node('section');stage.className='nb-terms-rehearsal-stage';stage.setAttribute('aria-label','Agreement rehearsal');const scope=node('p','Workflow · '+setting.scopeId);scope.className='nb-terms-rehearsal-scope';const mount=node('div');stage.append(scope,mount);
 const observer=node('aside');observer.className='nb-terms-rehearsal-observer';const heading=node('h3','Simulated recorder');observer.setAttribute('aria-labelledby',id+'-observer');heading.id=id+'-observer';observer.append(heading,node('p','Checking the statement sends nothing. Submit to try a receipt, or turn on failure to see how retry works.'));
 const failureLabel=node('label'),failure=node('input');failure.type='checkbox';failureLabel.className='nb-terms-rehearsal-failure';failureLabel.append(failure,doc.createTextNode('Simulate a recording failure'));observer.append(failureLabel);
 const facts=node('dl'),attempts=node('dd','0'),records=node('dd','0'),retry=node('dd','No attempt');attempts.dataset.rehearsalAttempts='';records.dataset.rehearsalRecords='';retry.dataset.rehearsalRetry='';
 for(const [label,value] of [['Submit attempts',attempts],['Receipts in this run',records],['Retry key',retry]] as const){const row=node('div');row.append(node('dt',label),value);facts.append(row);}observer.append(facts);
 const status=node('p','Rehearsal only. No real agreement has been recorded.');status.className='nb-terms-rehearsal-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');observer.append(status);
 const reset=node('button','Start fresh');reset.type='button';reset.className='nb-choice-button';observer.append(reset);
 const limits=node('details');limits.append(node('summary','What to check in your application'),node('p','Connect your authenticated operation and recorder, publish the exact reviewed terms, then test receipt loss, reload, stale offers and retention. A simulated receipt proves none of those connections.'));observer.append(limits);body.append(stage,observer);dialog.append(body);container.append(dialog);
 let destroyed=false,sessionOpen=false,generation=0,opener:HTMLElement|null=null,controller:TermsAcceptanceController|undefined,controls:ReturnType<typeof mountTermsAcceptance>|undefined,reader:ReturnType<typeof mountLegalPreview>|undefined,unsubscribe:(()=>void)|undefined;
 function dispose(){generation++;unsubscribe?.();unsubscribe=undefined;controls?.destroy();controls=undefined;controller?.destroy();controller=undefined;reader?.destroy();reader=undefined;mount.replaceChildren();}
 async function run(){
  dispose();const token=generation;reset.disabled=true;failure.disabled=true;attempts.textContent='0';records.textContent='0';retry.textContent='No attempt';status.textContent='Preparing the local rehearsal…';
  let offer:TermsOffer;try{offer=await previewOffer();}catch{if(!destroyed&&generation===token&&dialog.open){reset.disabled=false;status.textContent='Could not prepare the rehearsal. Use a browser with Web Crypto in a secure context, then try again.';}return;}
  if(destroyed||generation!==token||!dialog.open)return;
  reset.disabled=false;let count=0,lastKey:string|undefined,stored:TermsAcceptanceReceipt|undefined;
  attempts.textContent='0';records.textContent='0';retry.textContent='No attempt';status.textContent='Rehearsal only. No real agreement has been recorded.';failure.disabled=false;
  const operationId='rehearsal-'+crypto.randomUUID();
  controller=createTermsAcceptance(offer,{operationId,allowPreview:true,submit:async(request,{signal})=>{
   if(destroyed||generation!==token||signal.aborted)throw Error('Rehearsal ended.');
   count++;attempts.textContent=String(count);retry.textContent=lastKey===request.requestId?'Same key as previous attempt':count===1?'Created on submit':'New key';lastKey=request.requestId;
   if(failure.checked)throw Error('Simulated failure.');
   stored??={schemaVersion:1,id:'0'.repeat(64),offerId:offer.offerId,requestId:request.requestId,operationId,artifactId:offer.artifactId,documentSha256:offer.document.sha256,documentVersion:offer.document.version,recordedAt:new Date().toISOString()};
   records.textContent='1';return structuredClone(stored);
  }});
  controls=mountTermsAcceptance(mount,{acceptance:controller});
  // Reading stays in the local configuration preview rather than navigating to an unpublished release.
  const anchor=mount.querySelector<HTMLAnchorElement>('.nb-terms-document a')!,read=node('button');read.type='button';read.className='nb-terms-rehearsal-read';read.textContent=offer.document.title;read.setAttribute('aria-haspopup','dialog');read.setAttribute('aria-description','Open the local draft reading preview.');anchor.replaceWith(read);
  const metadata=mount.querySelector('.nb-document-meta')!;metadata.replaceChildren(doc.createTextNode('Version '));for(const [value,suffix] of [[offer.document.version,' · effective '],[offer.document.effectiveDate,' · local reading preview']] as const){const text=node('bdi',value);text.dir='auto';metadata.append(text,doc.createTextNode(suffix));}
  read.addEventListener('click',()=>{if(destroyed||generation!==token||!dialog.open)return;reader??=mountLegalPreview(container,{config,initialDocument:'terms'});reader.open();});
  unsubscribe=controller.subscribe(state=>{if(destroyed||generation!==token)return;failure.disabled=state.status==='submitting';status.textContent=state.status==='recorded'?'Simulated receipt returned. No real agreement has been recorded.':state.status==='error'?'No simulated receipt returned. Turn off failure and submit again to try the same key.':state.status==='submitting'?'Submitting to this run’s in-memory recorder…':'Rehearsal only. No real agreement has been recorded.';});
 }
 const fresh=async()=>{if(!destroyed&&dialog.open){failure.checked=false;await run();if(!destroyed&&dialog.open)mount.querySelector<HTMLInputElement>('input[type=checkbox]')?.focus();}};
 reset.addEventListener('click',fresh);
 const finish=()=>{if(!sessionOpen)return;sessionOpen=false;dispose();const target=opener;opener=null;if(target?.isConnected)target.focus();onClose?.();};
 function closeOwned(){if(destroyed)return;reader?.close();if(dialog.open)dialog.close();finish();}
 const closed=()=>{if(!dialog.open)finish();};close.addEventListener('click',closeOwned);dialog.addEventListener('close',closed);
 return {async open(){if(destroyed)throw Error('Rehearsal has ended.');if(dialog.open)return;opener=doc.activeElement instanceof view.HTMLElement?doc.activeElement:null;dialog.showModal();sessionOpen=true;failure.checked=false;title.focus();await run();},close:closeOwned,destroy(){if(destroyed)return;destroyed=true;dialog.removeEventListener('close',closed);reset.removeEventListener('click',fresh);close.removeEventListener('click',closeOwned);dispose();if(dialog.open)dialog.close();dialog.remove();sessionOpen=false;opener=null;}};
}
