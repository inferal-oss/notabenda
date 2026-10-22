// @requirements REQ-PRODUCT-COLLECTION-REHEARSAL REQ-PRODUCT-COLLECTION-FLOW REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {prepareCollectionFlowPreview} from './collection-workbench.js';
import {renderCollectionNoticePreview} from './collection.js';
import {createFormPermission,mountFormPermission} from './form-permission.js';
import type {FormPermissionController,FormPermissionOffer,FormPermissionCommand,FormPermissionResult,FormPermissionState,FormPermissionReceipt} from './form-permission.js';
export interface MountedCollectionRehearsal {open():Promise<void>;close():void;destroy():void}
/** Actual permission controls with a disposable simulated recorder; ordinary submission remains independent. */
export function mountCollectionRehearsal(container:HTMLElement,options:{context:unknown;settings:unknown;releaseConfirmed:true;onClose?:()=>void}):MountedCollectionRehearsal {
 const doc=container.ownerDocument,view=doc.defaultView;
 if(!view||!options||options.onClose!==undefined&&typeof options.onClose!=='function')throw Error('Use a browser document, confirmed release settings and optional close callback.');
 const content=prepareCollectionFlowPreview(options.context,options.settings,{releaseConfirmed:options.releaseConfirmed}),onClose=options.onClose;
 // Rehearsal does not support the specialized marketing invitation workflow.
 if(content.permissions.some(p=>p.marketingRequest))throw Error('Use the specialized marketing workflow separately.');
 const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
 const hash=async(v:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const id='nb-form-rehearsal-'+crypto.randomUUID(),node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const dialog=node('dialog');dialog.className='nb-collection-workbench nb-collection-rehearsal';dialog.lang='en';dialog.dir='ltr';dialog.setAttribute('aria-labelledby',id+'-title');dialog.setAttribute('aria-describedby',id+'-description');
 const header=node('header'),close=node('button','Close rehearsal');close.type='button';const title=node('h2','Try your form flow');title.id=id+'-title';title.tabIndex=-1;const description=node('p','Try the notice and separate choices with a temporary recorder. No information leaves this page. The recovery journal exists only in memory, even when the choice says “saved on this device”. Closing or reloading discards this run; your wording and review declarations stay unchanged.');description.id=id+'-description';header.append(close,title);dialog.append(header,description);
 const layout=node('div');layout.className='nb-form-rehearsal-layout';const stage=node('section');stage.className='nb-form-rehearsal-stage';stage.setAttribute('aria-label','Form flow rehearsal');
 const source=node('details');source.append(node('summary','Source release'),node('p',content.notice.document.title+' · '+content.notice.document.version+' · '+content.notice.document.effectiveDate),node('code',content.notice.artifactId),node('p','This release supplies the facts and wording. Rehearsal identifiers are temporary and are not a compiled release.'));stage.append(source);
 const notice=node('div'),permissions=node('div');permissions.lang=content.notice.locale;permissions.dir=content.notice.localization?.direction??'ltr';stage.append(notice,permissions);
 const submit=node('button','Try ordinary submission');submit.type='button';const ordinary=node('p','This stands in for your application’s submit button. It does not save or change a permission.');stage.append(submit,ordinary);
 const observer=node('aside');observer.className='nb-form-rehearsal-observer';observer.setAttribute('aria-label','Simulated recorder');observer.append(node('h3','Simulated recorder'),node('p','A checked box sends nothing. Each choice has its own pending request and result.'));
 const failureLabel=node('label','Recording scenario'),failure=node('select');failure.id=id+'-failure';failureLabel.htmlFor=failure.id;
 for(const [value,text] of [['none','Normal recording'],['read','Cannot read saved state'],['before','Failure before recording'],['after','Response lost after recording']]){const option=node('option',text);option.value=value!;failure.append(option);}observer.append(failureLabel,failure);
 const read=node('button','Check saved permissions');read.type='button';const reset=node('button','Start fresh');reset.type='button';observer.append(read,reset);
 const ordinaryCount=node('p','Ordinary submissions · 0');ordinaryCount.dataset.rehearsalSubmissions='';observer.append(ordinaryCount);
 const results=node('div');results.className='nb-form-rehearsal-results';observer.append(results);
 const status=node('p','Rehearsal only. No real form submission or permission is recorded.');status.setAttribute('role','status');status.className='nb-form-rehearsal-status';observer.append(status);
 const next=node('details');next.append(node('summary','Then connect your application'),node('p','Publish the exact reviewed notice and offers, bind each person/contact generation on the server, and test real recording and downstream actions. This rehearsal does not submit a form, send messages, verify a provider or test persistence after reload.'));observer.append(next);layout.append(stage,observer);dialog.append(layout);container.append(dialog);
 let destroyed=false,opened=false,generation=0,opener:HTMLElement|null=null,submissions=0;
 let cleanups:(()=>void)[]=[];
 let controllers:FormPermissionController[]=[],controls:{destroy():void}[]=[],unsubscribers:(()=>void)[]=[];
 const inert=(root:HTMLElement)=>{for(const a of root.querySelectorAll('a')){a.removeAttribute('href');a.setAttribute('role','link');a.setAttribute('aria-disabled','true');}};
 function dispose(){generation++;for(const un of unsubscribers)un();unsubscribers=[];for(const ui of controls)ui.destroy();controls=[];for(const c of controllers)c.destroy();controllers=[];for(const cleanup of cleanups)cleanup();cleanups=[];notice.replaceChildren();permissions.replaceChildren();results.replaceChildren();}
 async function run(){
  dispose();const token=generation;read.disabled=reset.disabled=submit.disabled=true;submissions=0;ordinaryCount.textContent='Ordinary submissions · 0';status.textContent='Preparing the local rehearsal…';
  try{
   const artifactId=await hash({domain:'notabenda-collection-rehearsal:v1',content}),runId=crypto.randomUUID();
   const previews=await Promise.all(content.permissions.map(async p=>{const offer={...structuredClone(p),artifactId,mode:'preview' as const,document:{...p.document,url:`/artifacts/${artifactId}/privacy.html`}};return {...offer,offerId:await hash({domain:'notabenda-permission-rehearsal-offer:v1',offer})};}));
   const streams=await Promise.all(previews.map(offer=>hash({domain:'notabenda-permission-rehearsal-stream:v1',runId,permissionId:offer.permissionId})));
   if(destroyed||generation!==token||!dialog.open)return;
   const n={...structuredClone(content.notice),artifactId,mode:'preview' as const,document:{...content.notice.document,url:`/artifacts/${artifactId}/privacy.html`}};
   notice.innerHTML=renderCollectionNoticePreview(n,{allowPreview:true,idPrefix:id+'-notice',headingLevel:3});inert(notice);
   for(const [index,offer] of previews.entries())mount(offer,streams[index]!,token);
   if(!previews.length)results.append(node('p','Notice-only form. There are no separate choices to record.'));
   read.disabled=!previews.length;reset.disabled=submit.disabled=false;status.textContent='Rehearsal only. No real form submission or permission is recorded.';
  }catch{if(!destroyed&&generation===token&&dialog.open){dispose();reset.disabled=false;status.textContent='Could not prepare the rehearsal. Use a secure browser context with Web Crypto, then try again.';}}
 }
 function mount(offer:FormPermissionOffer,streamRef:string,token:number){
  let events=0,attempts=0,reads=0,lastKey:string|undefined;
  let head:FormPermissionState={schemaVersion:1,siteId:offer.siteId,permissionId:offer.permissionId,streamRef,revision:0,event:null,activeOfferId:offer.offerId,activeRevision:1,grantAllowed:true,permitted:false,reason:'not-granted'};
  const dedup=new Map<string,{command:string;receipt:FormPermissionReceipt}>(),journal=new Map<string,unknown>();
  const report=node('section');report.className='nb-form-rehearsal-result';report.setAttribute('aria-label',offer.wording.title+' recorder');report.append(node('h4',offer.wording.title));const counts=node('p'),state=node('p'),retry=node('p','No request yet');counts.dataset.rehearsalCounts=offer.permissionId;state.dataset.rehearsalState=offer.permissionId;retry.dataset.rehearsalRetry=offer.permissionId;report.append(counts,state,retry);results.append(report);
  const update=()=>{counts.textContent=`Reads ${reads} · Attempts ${attempts} · Events ${events}`;state.textContent='Recorder state · '+head.reason;};update();
  const alive=(signal?:AbortSignal)=>{if(destroyed||generation!==token||!dialog.open||signal?.aborted)throw Error('Rehearsal ended.');};
  // No await occurs between deduplication, revision checks and commit. This tiny recorder is a simulation, not a backend adapter.
  const record=(command:FormPermissionCommand):FormPermissionResult=>{
   const previous=dedup.get(command.requestId),fingerprint=canonical(command);
   if(previous){if(previous.command!==fingerprint)throw Error('Changed request.');return {receipt:structuredClone(previous.receipt),state:structuredClone(head)};}
   if(command.action==='grant'&&(command.expectedRevision!==head.revision||command.expectedActivation!==head.activeRevision))throw Error('Stale request.');
   const receipt:FormPermissionReceipt={schemaVersion:1,id:streamRef.slice(0,48)+(head.revision+1).toString(16).padStart(16,'0'),siteId:offer.siteId,permissionId:offer.permissionId,streamRef,offerId:offer.offerId,artifactId:offer.artifactId,requestId:command.requestId,action:command.action,revision:head.revision+1,activationRevision:head.activeRevision,clientAt:command.clientAt,recordedAt:new Date().toISOString()};
   events++;head={...head,revision:receipt.revision,event:receipt,permitted:command.action==='grant',reason:command.action==='grant'?'granted':command.action==='refuse'?'refused':'withdrawn'};dedup.set(command.requestId,{command:fingerprint,receipt:structuredClone(receipt)});return {receipt,state:structuredClone(head)};
  };
  const controller=createFormPermission(offer,{allowPreview:true,streamRef,journal:{async read(key){alive();return structuredClone(journal.get(key));},async update(key,change){alive();const next=change(structuredClone(journal.get(key)));journal.set(key,structuredClone(next));return structuredClone(next);}},async read({signal}){alive(signal);reads++;update();if(failure.value==='read')throw Error('Simulated read failure.');return structuredClone(head);},async submit(command,{signal}){
   alive(signal);attempts++;retry.textContent=lastKey===command.requestId?'Same key as previous attempt':attempts===1?'Created on explicit action':'New request key';lastKey=command.requestId;update();
   if(failure.value==='before')throw Error('Simulated failure before recording.');const result=record(command);update();if(failure.value==='after')throw Error('Simulated response loss.');return result;
  }});
  cleanups.push(()=>{dedup.clear();journal.clear();});
  controllers.push(controller);const slot=node('div');permissions.append(slot);controls.push(mountFormPermission(slot,{permission:controller,headingLevel:3}));slot.querySelector('section')?.setAttribute('aria-describedby',notice.querySelector('section')!.id);inert(slot);const surface=slot.firstElementChild!;const guard=(event:Event)=>{if(destroyed||generation!==token||!dialog.open){event.preventDefault();event.stopImmediatePropagation();}};surface.addEventListener('click',guard,true);surface.addEventListener('change',guard,true);
  unsubscribers.push(controller.subscribe(snapshot=>{if(destroyed||generation!==token)return;report.dataset.allowed=String(snapshot.allowed);report.dataset.pending=String(snapshot.recovery?.pending??0);state.textContent='Recorder state · '+head.reason+' · Controller permission '+(snapshot.allowed?'on':'off')+(snapshot.recovery?.pending?' · Awaiting confirmation':'');}));
 }
 submit.addEventListener('click',()=>{if(destroyed||!dialog.open||submit.disabled)return;submissions++;ordinaryCount.textContent='Ordinary submissions · '+submissions;status.textContent='Submission simulated. Separate permission choices are unchanged.';});
 read.addEventListener('click',()=>{if(!destroyed&&dialog.open)void Promise.all(controllers.map(c=>c.refresh().catch(()=>{})));});
 const fresh=()=>{if(!destroyed&&dialog.open){failure.value='none';void run();}};reset.addEventListener('click',fresh);
 const finish=()=>{if(!opened)return;opened=false;dispose();const target=opener;opener=null;if(target?.isConnected)target.focus();onClose?.();};
 const closed=()=>{if(!dialog.open)finish();};dialog.addEventListener('close',closed);
 const closeOwned=()=>{if(destroyed)return;if(dialog.open)dialog.close();finish();};close.addEventListener('click',closeOwned);
 return {async open(){if(destroyed)throw Error('Rehearsal has ended.');if(dialog.open)return;opener=doc.activeElement instanceof view.HTMLElement?doc.activeElement:null;dialog.showModal();opened=true;failure.value='none';title.focus();await run();},close:closeOwned,destroy(){if(destroyed)return;destroyed=true;dialog.removeEventListener('close',closed);dispose();if(dialog.open)dialog.close();dialog.remove();opened=false;opener=null;}};
}
