// @requirements REQ-GOOGLE-MODE REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-PRIVACY-SIGNALS
import {googleConsentTypes,normalizeGoogleBasic} from './google-basic-policy.js';
import type {GoogleConsentState} from './google-basic-policy.js';
import type {ConsentController} from './consent.js';
export type {GoogleBasicConfig,GoogleConsentType,GoogleConsentState} from './google-basic-policy.js';
/** Trusted execution port. connect/defaults must not fetch; load must honor signal; stop must disable synchronously. */
export interface GoogleBasicPort {command(...args:unknown[]):void;enable():void;stop():void;load(url:string,signal:AbortSignal):Promise<void>}
export interface GoogleBasicEnvironment {connect(tagIds:readonly string[]):GoogleBasicPort}
export interface GoogleBasicOptions {consent:ConsentController;serviceId:string;timeoutMs?:number}
export interface GoogleBasicSnapshot {state:'blocked'|'loading'|'active'|'reload-required'|'closed';attempted:boolean;signals:GoogleConsentState}
export interface GoogleBasicController {getSnapshot():GoogleBasicSnapshot;subscribe(listener:(snapshot:GoogleBasicSnapshot)=>void):()=>void;event(name:string,parameters?:Record<string,string|number|boolean>):boolean;destroy():void}
const denied=():GoogleConsentState=>Object.fromEntries(googleConsentTypes.map(type=>[type,'denied'])) as GoogleConsentState;
const claimed=new WeakSet<object>();
/** No browser access on import or factory construction. One owned Google realm per document lifetime. */
export function createGoogleBasicBrowserEnvironment(options:{document?:Document;nonce?:string}={}):GoogleBasicEnvironment {
 return {connect(ids){
  const doc=options.document??(typeof document==='undefined'?undefined:document),view=doc?.defaultView;
  if(!doc||!view)throw new Error('Google Basic needs a browser document or an explicit execution environment.');
  const globals=view as unknown as Record<string,unknown>;
  if(claimed.has(view)||[...ids.map(id=>'ga-disable-'+id),'gtag','dataLayer','google_tag_manager','google_tag_data'].some(key=>globals[key]!==undefined)||Array.from(doc.querySelectorAll('script[src],link[href]')).some(node=>{try{const url=new URL(node.getAttribute('src')??node.getAttribute('href')??'',doc.URL);return /(?:^|\.)(?:googletagmanager\.com|google-analytics\.com|doubleclick\.net)$/u.test(url.hostname);}catch{return false;}}))throw new Error('Install Google Basic before any Google tag, hints, queue or globals; use one owned Google service per document.');
  if(options.nonce!==undefined&&(typeof options.nonce!=='string'||options.nonce.length>512||/[\u0000-\u0020\u007f]/u.test(options.nonce)))throw new Error('Use a bounded script nonce.');
  const tagIds=[...ids],queue:unknown[]=[],disable=()=>{for(const id of tagIds)if(id.startsWith('G-'))globals['ga-disable-'+id]=true;};let dispatch=false,stopped=false,node:HTMLScriptElement|undefined;
  // Only package-owned commands reach this queue. Do not buffer calls from a pre-grant global gtag API.
  const gtag=function(..._args:unknown[]){if(dispatch)queue.push(arguments);};
  const intact=()=>{if(globals.gtag!==gtag||globals.dataLayer!==queue)throw new Error('The owned Google globals were replaced. Reload before using this integration.');};
  claimed.add(view);globals.dataLayer=queue;globals.gtag=gtag;disable();
  const port:GoogleBasicPort={
   command(...args){intact();dispatch=true;try{gtag(...args);}finally{dispatch=false;}},
   enable(){intact();for(const id of tagIds)if(id.startsWith('G-'))globals['ga-disable-'+id]=false;},
   stop(){disable();if(node){node.removeAttribute('src');node.remove();node=undefined;}if(!stopped){queue.length=0;stopped=true;}},
   load(url,signal){return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(new Error('Aborted'));return;}intact();const script=doc.createElement('script');script.async=true;if(options.nonce)script.nonce=options.nonce;let done=false;
    const finish=(error?:Error)=>{if(done)return;done=true;script.removeEventListener('load',loaded);script.removeEventListener('error',failed);signal.removeEventListener('abort',abort);error?reject(error):resolve();};
    const loaded=()=>finish(signal.aborted?new Error('Aborted'):undefined),failed=()=>finish(new Error('Google tag did not load.')),abort=()=>{port.stop();finish(new Error('Aborted'));};
    script.addEventListener('load',loaded);script.addEventListener('error',failed);signal.addEventListener('abort',abort,{once:true});node=script;script.src=url;
    try{(doc.head??doc.documentElement).append(script);}catch(error){port.stop();finish(error instanceof Error?error:new Error('Tag insertion failed.'));}
   });},
  };return port;
 }};
}
/** Basic mode: all declared purposes and independent restrictions gate tag loading. No denied-mode tag start. */
export function registerGoogleBasic(options:GoogleBasicOptions,environment:GoogleBasicEnvironment=createGoogleBasicBrowserEnvironment()):GoogleBasicController {
 const {consent,serviceId}=options,config=consent.getConfig(),service=config.services.find(entry=>entry.id===serviceId),timeout=options.timeoutMs??15000;
 if(!service?.googleBasic||!config.consent?.services.some(entry=>entry.id===serviceId)||consent.getSnapshot().destroyed||!Number.isInteger(timeout)||timeout<100||timeout>60000)throw new Error('Select a live optional Google Basic service and bounded timeout.');
 const policy=normalizeGoogleBasic(service.googleBasic,service.purposeIds),allowedSignals=Object.fromEntries(googleConsentTypes.map(type=>[type,policy.signals[type].length?'granted':'denied'])) as GoogleConsentState;
 let port:GoogleBasicPort|undefined,state:GoogleBasicSnapshot['state']='blocked',attempted=false,disposed=false,generation:AbortSignal|undefined,signals=denied();
 const listeners=new Set<(s:GoogleBasicSnapshot)=>void>(),snapshot=():GoogleBasicSnapshot=>({state,attempted,signals:{...signals}}),emit=()=>{for(const fn of [...listeners])try{fn(snapshot());}catch{}};
 function close(){
  if(state==='reload-required'||state==='closed')return;
  // Abort handlers run synchronously, before service cleanup's later microtask.
  state=attempted?'reload-required':disposed?'closed':'blocked';signals=denied();
  try{port?.stop();}catch{state='reload-required';}
  if(attempted)try{port?.command('consent','update',denied());}catch{state='reload-required';}
  emit();
 }
 const unregister=consent.registerService(serviceId,{purposes:[...service.purposeIds],async start({signal}){
  if(disposed||attempted||signal.aborted||!port)throw new Error('Reload before restarting Google.');
  generation=signal;signal.addEventListener('abort',close,{once:true});
  const loadAbort=new AbortController(),abortLoad=()=>loadAbort.abort();signal.addEventListener('abort',abortLoad,{once:true});let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   // Recheck inside the core-owned generation before assigning any remote script URL.
   if(!consent.isServiceAllowed(serviceId)||signal.aborted||disposed)throw new Error('Permission unavailable.');
   const permitted=()=>{if(disposed||signal.aborted||!consent.isServiceAllowed(serviceId)||signal.aborted)throw new Error('Google permission changed.');};
   const command=(...args:unknown[])=>{permitted();port!.command(...args);};
   permitted();signals={...allowedSignals};port.enable();command('consent','update',{...signals});command('js',new Date());
   for(const id of policy.tagIds)command('config',id,{send_page_view:false,allow_google_signals:signals.ad_user_data==='granted'&&signals.ad_personalization==='granted',allow_ad_personalization_signals:signals.ad_personalization==='granted'});
   if(signal.aborted||disposed)throw new Error('Permission changed before loading.');
   attempted=true;state='loading';emit();
   permitted();
   const cancelled=new Promise<never>((_,reject)=>{const rejectAbort=()=>reject(new Error('Google load aborted.'));loadAbort.signal.addEventListener('abort',rejectAbort,{once:true});timer=setTimeout(()=>loadAbort.abort(),timeout);});
   await Promise.race([port.load('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(policy.tagIds[0]!),loadAbort.signal),cancelled]);
   permitted();if(signal.aborted||disposed||state!=='loading')throw new Error('Google load superseded.');state='active';emit();
   return ()=>{signal.removeEventListener('abort',close);signal.removeEventListener('abort',abortLoad);close();if(attempted)throw new Error('Reload is required to remove already loaded Google code.');};
  }catch(error){close();state='reload-required';emit();throw error;}
  finally{clearTimeout(timer);signal.removeEventListener('abort',abortLoad);}
 }});
 try{port=environment.connect([...policy.tagIds]);port.command('consent','default',denied());}catch(error){disposed=true;close();unregister();throw error;}
 return {getSnapshot:snapshot,subscribe(fn){listeners.add(fn);try{fn(snapshot());}catch{}return()=>listeners.delete(fn);},event(name,parameters={}){
  if(typeof name!=='string'||!/^[a-z][a-z0-9_]{0,39}$/u.test(name)||!parameters||Object.getPrototypeOf(parameters)!==Object.prototype)throw new Error('Use a bounded event name and flat primitive parameters.');
  const descriptors=Object.getOwnPropertyDescriptors(parameters),keys=Reflect.ownKeys(descriptors);if(keys.length>32||keys.some(key=>typeof key!=='string'))throw new Error('Use at most 32 string-keyed event parameters.');
  const values:Record<string,string|number|boolean>={};
  for(const [key,descriptor] of Object.entries(descriptors)){const value=descriptor.value;if(!('value' in descriptor)||!/^[a-z][a-z0-9_]{0,39}$/u.test(key)||['send_to','event_callback','transport_url','transport_type','server_container_url','user_id','user_data','user_properties','groups','allow_google_signals','allow_ad_personalization_signals','consent'].includes(key)||!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value)||typeof value==='string'&&value.length>500)throw new Error('Use primitive data parameters; destinations, identity and configuration are outside the event API.');values[key]=value;}

  if(disposed||state!=='active'||!generation||generation.aborted)return false;
  if(!consent.isServiceAllowed(serviceId)||state!=='active'||generation.aborted)return false;
  try{port!.command('event',name,{...values,send_to:policy.tagIds.join(',')});return true;}catch{close();unregister();return false;}
 },destroy(){if(disposed)return;disposed=true;close();unregister();if(!attempted)state='closed';emit();listeners.clear();}};
}
