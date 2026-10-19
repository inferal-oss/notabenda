// @requirements REQ-PRODUCT-STORAGE-EXCEPTIONS
// @requirements REQ-UK-EXCEPTIONS REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-EVIDENCE-LIFECYCLE
import type {PublicSiteConfig} from './types.js';
import {toPublicConfig} from './config.js';
import {scopeGuardBlocked,scopeGuardContext} from './scope-guard-policy.js';
import {reconcileManagedService} from './service-runner.js';
import type {ManagedService} from './service-runner.js';
import type {ServiceLifecycle,ServiceStatus} from './consent-types.js';
import type {StorageExceptionPolicy} from './storage-exception-policy.js';
import {copyExceptionData,exceptionExact,exceptionFail,exceptionSlug,exceptionRevision,StorageExceptionError} from './storage-exception-policy.js';
import {createIndexedDBFormPermissionJournal} from './form-permission-journal.js';
import type {FormPermissionJournal} from './form-permission-journal.js';
export {StorageExceptionError};
export type StorageExceptionJournal=FormPermissionJournal;
interface Scope {revision:number;sha256:string}
interface EntryState {scope:Scope;objected:boolean}
interface State {schemaVersion:1;siteId:string;revision:number;entries:Record<string,EntryState>}
export interface StorageExceptionSnapshot {
 revision:number|null;persistence:'loading'|'available'|'unavailable';destroyed:boolean;
 entries:Record<string,{objection:'none-recorded'|'objected';availability:'waiting-for-controls'|'loading'|'blocked'|'available';reason:'scope-restricted'|'stale-definition'|'objection'|'pending-change'|'waiting-for-controls'|'storage-unavailable'|'available';basis:'declared-storage-exception';pending:boolean;unsavedObjection:boolean}>;
 services:Record<string,ServiceStatus>;servicePermissions:Record<string,boolean>;
}
export interface StorageExceptionController {
 readonly storageKey:string;readonly siteId:string;getConfig():PublicSiteConfig;getPolicy():StorageExceptionPolicy;getSnapshot():StorageExceptionSnapshot;subscribe(listener:(state:StorageExceptionSnapshot)=>void):()=>void;
 /** The host promises that current information and a simple free objection route are available. Disposal removes that promise. */
 attachPresentation():()=>void;
 object(id:string):Promise<void>;objectAll():Promise<void>;
 /** Explicit current-definition action. A stale revision cannot clear a newer objection. */
 resume(id:string,options:{expectedRevision:number}):Promise<void>;
 registerService(id:string,lifecycle:ServiceLifecycle):()=>void;
 refresh():Promise<void>;settled():Promise<void>;destroy():void;
}
export interface StorageExceptionOptions {journal:StorageExceptionJournal;allowPreview?:boolean}
/** Separate durable browser preference database; caller owns closing it. No network or backend. */
export function createIndexedDBStorageExceptionJournal(options:Parameters<typeof createIndexedDBFormPermissionJournal>[0]={}):ReturnType<typeof createIndexedDBFormPermissionJournal>{return createIndexedDBFormPermissionJournal({...options,databaseName:options?.databaseName??'notabenda-storage-exceptions-v1'});}
const canonical=(v:unknown):string=>v&&typeof v==='object'?Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}':JSON.stringify(v);
const hash=async(text:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');
/** Independent objection state. It never grants consent, writes consent receipts or classifies a service as necessary. */
export function createStorageExceptions(input:unknown,options:StorageExceptionOptions):StorageExceptionController {
 const config=toPublicConfig(input,{mode:options?.allowPreview===true?'preview':'production'}),policy=config.storageExceptions,journal=options?.journal;
 if(!policy||!exceptionSlug(config.site.id)||!journal||typeof journal.read!=='function'||typeof journal.update!=='function'||journal.subscribe!==undefined&&typeof journal.subscribe!=='function'||options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean')return exceptionFail('invalid-policy');
 const storageKey='notabenda:storage-exceptions:v1:'+config.site.id,byId=new Map(policy.entries.map(e=>[e.id,e])),byService=new Map(policy.entries.flatMap(e=>e.serviceIds.map(id=>[id,e] as const))),services=new Map<string,ManagedService>(),listeners=new Set<(s:StorageExceptionSnapshot)=>void>(),pending=new Set<Promise<unknown>>(),blocked=new Set<string>(),busy=new Map<string,number>(),negative=new Map<string,number>();
 let row:State|undefined,ready=false,destroyed=false,presentations=0,failed=false,queue:Promise<void>=Promise.resolve(),unsubscribe:(()=>void)|undefined;const scopes=new Map<string,Scope>();
 const live=()=>{if(destroyed)return exceptionFail('destroyed');};
 function state(input:unknown):State {
  const s=copyExceptionData(input);if(!exceptionExact(s,['schemaVersion','siteId','revision','entries'])||s.schemaVersion!==1||s.siteId!==config.site.id||!Number.isSafeInteger(s.revision)||Number(s.revision)<0||!s.entries||typeof s.entries!=='object'||Array.isArray(s.entries)||Object.keys(s.entries).length>128)return exceptionFail('invalid-state');
  for(const [id,e] of Object.entries(s.entries)){if(!exceptionSlug(id)||!exceptionExact(e,['scope','objected'])||typeof e.objected!=='boolean'||!exceptionExact(e.scope,['revision','sha256'])||!exceptionRevision(e.scope.revision)||typeof e.scope.sha256!=='string'||!/^[a-f0-9]{64}$/u.test(e.scope.sha256))return exceptionFail('invalid-state');}return s as unknown as State;
 }
 const initial=():State=>({schemaVersion:1,siteId:config.site.id,revision:0,entries:{}});
 function evolve(s:State):void {if(s.revision>=Number.MAX_SAFE_INTEGER)return exceptionFail('invalid-state');s.revision++;}
 function matches(id:string,s=row):boolean{const current=s&&Object.hasOwn(s.entries,id)?s.entries[id]:undefined,scope=scopes.get(id);return !!current&&!!scope&&current.scope.revision===scope.revision&&current.scope.sha256===scope.sha256;}
 function entrySnapshot(id:string):StorageExceptionSnapshot['entries'][string]{
  const e=byId.get(id)!,objected=blocked.has(id)||row?.entries[id]?.objected===true;
  let reason:StorageExceptionSnapshot['entries'][string]['reason']='available';
  if(destroyed||!ready)reason='storage-unavailable';else if(e.purposeIds.some(id=>scopeGuardBlocked(config.scopeGuards,id)))reason='scope-restricted';else if(!matches(id))reason='stale-definition';else if(objected)reason='objection';else if(busy.has(id))reason='pending-change';else if(!presentations)reason='waiting-for-controls';
  return {objection:objected?'objected':'none-recorded',availability:reason==='available'?'available':reason==='waiting-for-controls'?'waiting-for-controls':!ready&&!failed&&!destroyed?'loading':'blocked',reason,basis:'declared-storage-exception',pending:busy.has(id),unsavedObjection:blocked.has(id)};
 }
 const allowed=(id:string)=>{const entry=byService.get(id);return !!entry&&!destroyed&&entrySnapshot(entry.id).availability==='available';};
 function snapshot():StorageExceptionSnapshot{return {revision:row?.revision??null,persistence:destroyed||failed?'unavailable':ready?'available':'loading',destroyed,entries:Object.fromEntries(policy!.entries.map(e=>[e.id,entrySnapshot(e.id)])),services:Object.fromEntries([...byService.keys()].map(id=>[id,services.get(id)?.phase??'blocked'])),servicePermissions:Object.fromEntries([...byService.keys()].map(id=>[id,allowed(id)]))};}
 const emit=()=>{for(const fn of listeners)try{fn(snapshot());}catch{}};
 function track<T>(p:Promise<T>):Promise<T>{pending.add(p);void p.then(()=>pending.delete(p),()=>pending.delete(p));return p;}
 const hooks={allowed,beforeCheck(){},changed:emit,track:(p:Promise<void>)=>{track(p);}};
 function update(){for(const [id,service] of services)reconcileManagedService(id,service,hooks);emit();}
 function apply(s:State,open=true){if(destroyed)return;if(row&&s.revision<row.revision)return;if(row&&s.revision===row.revision&&canonical(s)!==canonical(row))return exceptionFail('invalid-state');row=structuredClone(s);ready=open;failed=false;update();}
 // Preserve validation errors even when an IndexedDB transaction reports only an abort.
 async function atomic(change:(raw:unknown)=>State):Promise<unknown>{let cause:unknown;try{return await journal.update(storageKey,raw=>{try{return change(raw);}catch(error){cause=error;throw error;}});}catch(error){throw cause??error;}}
 async function synchronize():Promise<void>{
  const observed=epoch;ready=false;update();try{const value=await atomic(raw=>{
   const s=raw===undefined?initial():state(raw);let changed=false;
   for(const e of policy!.entries){const current=Object.hasOwn(s.entries,e.id)?s.entries[e.id]:undefined,next=scopes.get(e.id)!;
    if(!current){s.entries[e.id]={scope:{...next},objected:false};changed=true;}
    else if(current.scope.revision<next.revision){current.scope={...next};changed=true;}
    else if(current.scope.revision===next.revision&&current.scope.sha256!==next.sha256)return exceptionFail('stale-definition');
   }
   for(const id of blocked){if(s.entries[id]&&!s.entries[id]!.objected){s.entries[id]!.objected=true;changed=true;}}
   if(Object.keys(s.entries).length>128)return exceptionFail('invalid-state');if(changed)evolve(s);return s;
  });if(!destroyed){apply(state(value),observed===epoch&&!refreshAgain);for(const id of [...blocked])if(!negative.has(id)&&row?.entries[id]?.objected)blocked.delete(id);update();}}
  catch{if(!destroyed){failed=true;ready=false;update();}}
 }
 let refreshing:Promise<void>|undefined,refreshAgain=false,epoch=0;
 function refresh():Promise<void>{
  live();if(!scopes.size)return initialization;
  // Every notification closes the gate synchronously, including one arriving during
  // a refresh. Read again after the in-flight transaction rather than losing it.
  epoch++;ready=false;refreshAgain=true;update();
  if(!refreshing){
   refreshing=track(Promise.resolve().then(async()=>{do{refreshAgain=false;await synchronize();}while(refreshAgain&&!destroyed);}).finally(()=>{refreshing=undefined;}));
  }
  return refreshing;
 }
 const increment=(map:Map<string,number>,id:string)=>map.set(id,(map.get(id)??0)+1);
 const decrement=(map:Map<string,number>,id:string)=>{const n=(map.get(id)??1)-1;if(n)map.set(id,n);else map.delete(id);};
 function command(ids:string[],resume?:{expectedRevision:number}):Promise<void>{
  live();if(ids.some(id=>!byId.has(id)))return Promise.reject(new StorageExceptionError('invalid-policy'));
  if(resume&&(!exceptionExact(resume,['expectedRevision'])||!Number.isSafeInteger(resume.expectedRevision)||resume.expectedRevision<0))return Promise.reject(new StorageExceptionError('revision-conflict'));
  if(resume&&ids.some(id=>byId.get(id)!.purposeIds.some(p=>scopeGuardBlocked(config.scopeGuards,p))))return Promise.reject(new StorageExceptionError('scope-restricted'));
  if(resume&&ids.some(id=>busy.has(id)))return Promise.reject(new StorageExceptionError('busy'));
  if(!resume)ids.forEach(id=>{blocked.add(id);increment(negative,id);});ids.forEach(id=>increment(busy,id));update();
  const work=queue.then(async()=>{
   let saved=false;
   try{
    await initialization;if(destroyed)return exceptionFail('destroyed');
    const value=await atomic(raw=>{
     const s=state(raw);if(resume&&s.revision!==resume.expectedRevision)return exceptionFail('revision-conflict');let changed=false;
     for(const id of ids){const current=s.entries[id];if(!current)return exceptionFail('invalid-state');if(resume&&!matches(id,s))return exceptionFail('stale-definition');if(current.objected===!!resume){current.objected=!resume;changed=true;}}
     if(changed)evolve(s);return s;
    });
    if(!destroyed){apply(state(value),!refreshing&&!refreshAgain);saved=true;}
   }catch(error){if(!destroyed){ready=false;failed=true;}throw error instanceof StorageExceptionError?error:new StorageExceptionError('unavailable');}
   finally{
    for(const id of ids){decrement(busy,id);if(!resume)decrement(negative,id);if(saved&&!negative.has(id))blocked.delete(id);}
    update();
   }
  });
  queue=work.catch(()=>{});return track(work);
 }
 // Hash all material facts before touching storage. No operator private metadata enters the preference record.
 const material=policy.entries.map(e=>({entry:e,information:policy.information,preferenceNotice:policy.preferenceNotice,preferenceRetention:policy.preferenceRetention,siteId:config.site.id,documents:Object.fromEntries(['privacy','cookies'].map(kind=>{const d=config.documents[kind as 'privacy'|'cookies'];return [kind,{version:d.version,effectiveDate:d.effectiveDate}];})),services:config.services.filter(s=>e.serviceIds.includes(s.id)),purposes:config.purposes.filter(p=>e.purposeIds.includes(p.id)),storage:config.storage.filter(s=>e.storageIds.includes(s.id)),guards:e.purposeIds.map(id=>scopeGuardContext(config.scopeGuards,id))}));
 if(new TextEncoder().encode(canonical(material)).length>262144)return exceptionFail('invalid-policy');
 const initialization=track((async()=>{try{const digests=await Promise.all(material.map(m=>hash(canonical(m))));if(destroyed)return;policy.entries.forEach((e,i)=>scopes.set(e.id,{revision:e.revision,sha256:digests[i]!}));if(journal.subscribe)unsubscribe=journal.subscribe(storageKey,()=>{if(!destroyed)void refresh();});await refresh();}catch{failed=true;ready=false;update();}})());
 return {storageKey,siteId:config.site.id,getConfig:()=>structuredClone(config),getPolicy:()=>structuredClone(policy),getSnapshot:snapshot,subscribe(fn){live();listeners.add(fn);try{fn(snapshot());}catch{}return ()=>listeners.delete(fn);},attachPresentation(){live();presentations++;update();let attached=true;return ()=>{if(!attached)return;attached=false;presentations=Math.max(0,presentations-1);update();};},object:id=>command([id]),objectAll:()=>command(policy.entries.map(e=>e.id)),resume:(id,o)=>exceptionExact(o,['expectedRevision'])?command([id],o):Promise.reject(new StorageExceptionError('revision-conflict')),
  registerService(id,lifecycle){live();const entry=byService.get(id),service=config.services.find(s=>s.id===id);if(!entry||!service||services.has(id)||!lifecycle||typeof lifecycle.start!=='function'||!Array.isArray(lifecycle.purposes)||[...lifecycle.purposes].sort().join('\0')!==[...service.purposeIds].sort().join('\0'))return exceptionFail('invalid-service');const managed:ManagedService={lifecycle:{purposes:[...lifecycle.purposes],start:lifecycle.start},phase:'blocked',removed:false};services.set(id,managed);update();return ()=>{managed.removed=true;reconcileManagedService(id,managed,hooks);emit();};},refresh,async settled(){while(pending.size)await Promise.allSettled([...pending]);},destroy(){if(destroyed)return;destroyed=true;ready=false;presentations=0;try{unsubscribe?.();}catch{}update();listeners.clear();}};
}
