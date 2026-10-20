// @requirements REQ-PRODUCT-CONSENT-REHEARSAL REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {compileConsentRuntimeConfig} from './consent-compile.js';
import {createConsentRuntime,mountControls} from './consent-runtime.js';
import type {ConsentStateController} from './consent-types.js';
import type {MountedControls} from './controls.js';
export interface ConsentRehearsalOptions {config:unknown;stylesheetUrls?:readonly string[];onClose?:()=>void}
export interface MountedConsentRehearsal {open():Promise<void>;close():void;destroy():void}
/** A disposable local-choice model. No host/provider code, browser choice store or receipt transport is used. */
export function mountConsentRehearsal(container:HTMLElement,options:ConsentRehearsalOptions):MountedConsentRehearsal {
 const doc=container.ownerDocument,view=doc.defaultView;
 if(!view||!options||options.onClose!==undefined&&typeof options.onClose!=='function')throw Error('Use a browser window and a valid rehearsal configuration.');
 const descriptor=compileConsentRuntimeConfig(options.config,{mode:'preview',evidence:'local'});
 const styles=options.stylesheetUrls??[...doc.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet][href]')].map(el=>el.getAttribute('href')!).filter(href=>{try{const url=new URL(href,doc.baseURI);return url.origin===view.location.origin&&!url.search&&!url.hash;}catch{return false;}});
 if(!Array.isArray(styles)||styles.length>8||styles.some(href=>typeof href!=='string'||href.length>500||(()=>{try{const url=new URL(href,doc.baseURI);return url.origin!==view.location.origin||!['https:','http:'].includes(url.protocol)||!!url.username||!!url.password||!!url.search||!!url.hash||!url.pathname.endsWith('.css');}catch{return true;}})()))throw Error('Use at most eight same-origin CSS URLs without query strings or fragments.');
 const stylesheetUrls=[...new Set(styles.map(href=>new URL(href,doc.baseURI).href))],id='nb-cookie-rehearsal-'+crypto.randomUUID();
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const dialog=node('dialog');dialog.className='nb-consent-rehearsal';dialog.setAttribute('aria-labelledby',id+'-title');dialog.setAttribute('aria-describedby',id+'-note');
 const header=node('header');header.className='nb-rehearsal-header';const title=node('h2','Try your cookie controls');title.id=id+'-title';title.tabIndex=-1;
 const close=node('button','Close rehearsal');close.type='button';const note=node('p','Try your draft without loading any providers. Choices stay in temporary memory; your setup draft and real browser choices stay unchanged.');note.id=id+'-note';header.append(title,close,note);
 const toolbar=node('div');toolbar.className='nb-rehearsal-toolbar';const fresh=node('button','Start fresh'),returnVisit=node('button','Simulate return visit');for(const button of [fresh,returnVisit])button.type='button';
 const visit=node('span');visit.setAttribute('role','status');visit.setAttribute('aria-live','polite');toolbar.append(fresh,returnVisit,visit);
 const signal=node('label'),signalInput=node('input');signalInput.type='checkbox';signal.append(signalInput,doc.createTextNode('Simulate Global Privacy Control'));if(descriptor.inventory.privacySignals)toolbar.append(signal);
 const status=node('p');status.className='nb-rehearsal-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const body=node('div');body.className='nb-rehearsal-body';dialog.append(header,toolbar,status,body);container.append(dialog);
 let destroyed=false,sessionOpen=false,generation=0,busy=false,opener:HTMLElement|null=null,frame:HTMLIFrameElement|undefined,controller:ConsentStateController|undefined,controls:MountedControls|undefined,unsubscribe:(()=>void)|undefined,releaseFrame:(()=>void)|undefined,cancelStyles:(()=>void)|undefined;
 let memory=new Map<string,string>(),visits=0,gpc=false;const timers=new Set<ReturnType<typeof setTimeout>>();
 const availability=(value:boolean)=>{busy=value;fresh.disabled=value;returnVisit.disabled=value;signalInput.disabled=value;};
 function disposeRun(){generation++;cancelStyles?.();cancelStyles=undefined;unsubscribe?.();unsubscribe=undefined;controls?.destroy();controls=undefined;const previous=controller;controller=undefined;previous?.destroy();for(const timer of timers)clearTimeout(timer);timers.clear();releaseFrame?.();releaseFrame=undefined;frame?.remove();frame=undefined;body.replaceChildren();return previous;}
 function prepareFrame(){
  frame=node('iframe');frame.title='Your configured cookie controls';frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('referrerpolicy','no-referrer');frame.className='nb-rehearsal-frame';frame.hidden=true;body.append(frame);
  const child=frame.contentDocument;if(!child)throw Error('Frame unavailable.');child.head.replaceChildren();child.body.replaceChildren();
  const meta=child.createElement('meta');meta.httpEquiv='Content-Security-Policy';meta.content="default-src 'none'; style-src 'self'; font-src 'none'; img-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'";
  const viewport=child.createElement('meta');viewport.name='viewport';viewport.content='width=device-width,initial-scale=1';const childTitle=child.createElement('title');childTitle.textContent='Cookie control rehearsal';child.head.append(meta,viewport,childTitle);child.documentElement.lang=descriptor.inventory.site.locale;child.body.className='nb-page';
  const main=child.createElement('main');main.className='nb-document';const heading=child.createElement('h1');heading.textContent=descriptor.inventory.site.name;const intro=child.createElement('p');intro.textContent='Your page content stays usable while visitors choose.';main.append(heading,intro);const mount=child.createElement('div');main.append(mount);child.body.append(main);
  const prevent=(event:Event)=>{const target=event.target instanceof child.defaultView!.Element?event.target.closest('a'):null;if(target){event.preventDefault();status.textContent='Legal and help links are inactive here. Review the published pages separately.';}};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!controller?.getSnapshot().preferencesOpen){event.preventDefault();closeOwned();}};
  child.addEventListener('click',prevent,true);child.addEventListener('auxclick',prevent,true);child.addEventListener('keydown',escape);
  releaseFrame=()=>{child.removeEventListener('click',prevent,true);child.removeEventListener('auxclick',prevent,true);child.removeEventListener('keydown',escape);};return {child,mount,frame};
 }
 function loadStyles(child:Document):Promise<void>{return new Promise((resolve,reject)=>{
  let remaining=stylesheetUrls.length,done=false;const links:HTMLLinkElement[]=[];
  const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);for(const link of links){link.onload=null;link.onerror=null;}cancelStyles=undefined;ok?resolve():reject(Error('Styles unavailable.'));};
  const timer=setTimeout(()=>finish(false),5000);cancelStyles=()=>finish(false);
  if(!remaining){finish(false);return;}
  for(const href of stylesheetUrls){const link=child.createElement('link');link.rel='stylesheet';link.href=href;link.onload=()=>{if(--remaining===0)finish(true);};link.onerror=()=>finish(false);links.push(link);child.head.append(link);}
 });}
 async function run(reset:boolean){
  if(destroyed||!dialog.open||busy)return;availability(true);const previous=disposeRun(),token=generation;status.textContent='Preparing your local controls…';
  if(reset){memory=new Map();visits=0;}visits++;
  try{
   await previous?.settled();if(destroyed||!dialog.open||generation!==token)return;
   const prepared=prepareFrame();await loadStyles(prepared.child);if(destroyed||!dialog.open||generation!==token)return;
   const counters=new Map<string,{starts:number;stops:number}>();const services=node('section');services.className='nb-rehearsal-services';services.append(node('h3','Simulated services'),node('p','Local choices only. Recording, account restrictions and real provider behavior need separate tests.'));
   const list=node('ul'),rows=new Map<string,{phase:HTMLElement;counts:HTMLElement}>();services.append(list);body.append(services);
   for(const enrolled of descriptor.inventory.consent!.services){const service=descriptor.inventory.services.find(s=>s.id===enrolled.id)!;counters.set(service.id,{starts:0,stops:0});const row=node('li');row.dataset.service=service.id;const name=node('strong',service.name),purposes=node('p',service.purposeIds.map(id=>descriptor.inventory.purposes.find(p=>p.id===id)!.name).join(' · ')),phase=node('span'),counts=node('small');row.append(name,purposes,phase,counts);list.append(row);rows.set(service.id,{phase,counts});}
   const limits=node('details');limits.append(node('summary','What this rehearsal does not test'),node('p','Required receipts and backend-selected notice wording are not connected. Account restrictions, published pages and actual loader or cleanup behavior can change the real outcome. Simulated activity is not production permission.'));services.append(limits);
   const outside=descriptor.inventory.services.length-rows.size;if(outside)services.append(node('p',outside+' declared service'+(outside===1?' is':'s are')+' outside cookie-control enrollment and not managed here.'));if(!rows.size)services.append(node('p','No optional cookie services are enrolled in this draft.'));
   const update=()=>{if(generation!==token||!controller)return;const state=controller.getSnapshot();for(const [id,row] of rows){const phase=state.services[id]??'blocked',count=counters.get(id)!;row.phase.textContent=phase==='active'?'Simulated active':phase==='blocked'?'Blocked':phase==='starting'?'Starting simulation':phase==='stopping'?'Stopping simulation':'Reload needed';row.phase.dataset.phase=phase;row.counts.textContent=count.starts+' starts · '+count.stops+' stops this visit';}const active=Object.values(state.services).filter(phase=>phase==='active').length,summary='Visit '+visits+' · '+active+' of '+rows.size+' simulated services active';if(visit.textContent!==summary)visit.textContent=summary;};
   controller=createConsentRuntime(descriptor,{storage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>{memory.set(key,value);},removeItem:key=>{memory.delete(key);}},now:Date.now,globalPrivacyControl:()=>gpc,subscribe:()=>()=>{},schedule:(callback,delay)=>{const timer=setTimeout(()=>{timers.delete(timer);callback();},delay);timers.add(timer);return ()=>{clearTimeout(timer);timers.delete(timer);};}});
   for(const enrolled of descriptor.inventory.consent!.services){const service=descriptor.inventory.services.find(s=>s.id===enrolled.id)!;controller.registerService(service.id,{purposes:service.purposeIds,start:()=>{if(generation===token){counters.get(service.id)!.starts++;update();}return ()=>{if(generation===token){counters.get(service.id)!.stops++;update();}};}});}
   controls=mountControls(prepared.mount,{consent:controller});
   for(const anchor of prepared.child.querySelectorAll('a[href]')){anchor.removeAttribute('href');anchor.setAttribute('role','link');anchor.setAttribute('aria-disabled','true');anchor.setAttribute('title','Link inactive during rehearsal.');}
   unsubscribe=controller.subscribe(update);prepared.frame.hidden=false;status.textContent=reset?'Fresh visit. Try rejecting, choosing purposes or reopening preferences.':'Return visit using this rehearsal’s temporary memory. Your real browser choice is unchanged.';
  }catch{if(!destroyed&&generation===token&&dialog.open){disposeRun();status.textContent='Could not load the rehearsal. Check that same-origin widget styles and frames are allowed, then try again. Your draft is unchanged.';availability(false);}}
  finally{if(!destroyed&&dialog.open&&generation===token)availability(false);}
 }
 const restart=()=>{void run(true);},resume=()=>{void run(false);},signalChanged=()=>{gpc=signalInput.checked;void run(false);};
 fresh.addEventListener('click',restart);returnVisit.addEventListener('click',resume);signalInput.addEventListener('change',signalChanged);
 const finishClose=()=>{if(!sessionOpen)return;sessionOpen=false;disposeRun();memory.clear();availability(false);const target=opener;opener=null;if(target?.isConnected)target.focus();options.onClose?.();};
 function closeOwned(){if(destroyed)return;if(dialog.open)dialog.close();finishClose();}
 const closed=()=>{if(!dialog.open)finishClose();};
 close.addEventListener('click',closeOwned);dialog.addEventListener('close',closed);
 return {async open(){if(destroyed)throw Error('Rehearsal has ended.');if(dialog.open)return;opener=doc.activeElement instanceof view.HTMLElement?doc.activeElement:null;dialog.showModal();sessionOpen=true;title.focus();gpc=false;signalInput.checked=false;await run(true);},close:closeOwned,destroy(){if(destroyed)return;destroyed=true;dialog.removeEventListener('close',closed);disposeRun();memory.clear();fresh.removeEventListener('click',restart);returnVisit.removeEventListener('click',resume);signalInput.removeEventListener('change',signalChanged);if(dialog.open)dialog.close();dialog.remove();opener=null;}};
}
