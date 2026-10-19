// @requirements REQ-PRODUCT-STORAGE-EXCEPTIONS
// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-UK-EXCEPTIONS
import type {ServiceLifecycle,ServiceStatus} from './consent-types.js';
/** Shared cooperative lifecycle. A permanently aborted start can never become the next active generation. */
export interface ManagedService {lifecycle:ServiceLifecycle;controller?:AbortController;cleanup?:()=>void|Promise<void>;phase:ServiceStatus;removed:boolean}
export interface ServiceRunnerHooks {allowed(id:string):boolean;beforeCheck():void;changed():void;track(task:Promise<void>):void}
export function reconcileManagedService(id:string,entry:ManagedService,hooks:ServiceRunnerHooks):void {
 const shouldRun=!entry.removed&&hooks.allowed(id);
 if(!shouldRun&&entry.controller&&!entry.controller.signal.aborted)entry.controller.abort();
 if(entry.phase==='reload-required'||entry.phase==='stopping'||entry.phase==='starting')return;
 if(entry.phase==='active'&&!shouldRun){
  entry.phase='stopping';const cleanup=entry.cleanup!;delete entry.cleanup;
  hooks.track(Promise.resolve().then(cleanup).then(()=>{delete entry.controller;entry.phase='blocked';reconcileManagedService(id,entry,hooks);hooks.changed();},()=>{entry.phase='reload-required';hooks.changed();}));return;
 }
 if(entry.phase!=='blocked'||!shouldRun||entry.controller)return;
 const generation=new AbortController();entry.controller=generation;entry.phase='starting';
 hooks.track(Promise.resolve().then(()=>{hooks.beforeCheck();if(generation.signal.aborted||!hooks.allowed(id)){generation.abort();return ()=>{};}return entry.lifecycle.start({signal:generation.signal});}).then(async cleanup=>{
  hooks.beforeCheck();if(typeof cleanup!=='function')throw Error('A service must return a cleanup function.');
  if(generation.signal.aborted||entry.removed||!hooks.allowed(id)){entry.phase='stopping';hooks.changed();await cleanup();delete entry.controller;entry.phase='blocked';reconcileManagedService(id,entry,hooks);}else{entry.cleanup=cleanup;entry.phase='active';}hooks.changed();
 }).catch(()=>{generation.abort();entry.phase='reload-required';hooks.changed();}));
}
