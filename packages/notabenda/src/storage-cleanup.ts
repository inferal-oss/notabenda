// @requirements REQ-PRODUCT-STORAGE-EXCEPTIONS
import type {StorageExceptionController} from './storage-exceptions.js';
import type {ConsentStateController,ServiceLifecycle} from './consent.js';

export interface CookieCleanupScope {path:string;domain?:string}
export interface StorageCleanupTarget {storageId:string;cookieScopes?:readonly CookieCleanupScope[]}
export interface StorageAccess {removeItem(key:string):void;getItem(key:string):string|null}
export interface StorageCleanupEnvironment {
  localStorage?:()=>StorageAccess;
  sessionStorage?:()=>StorageAccess;
  cookies?:{hostname:string;secure:boolean;expire(assignment:string):void};
}
export interface StorageCleanupResult {
  storageId:string;type:'localStorage'|'sessionStorage'|'cookie';
  status:'absent-at-check'|'expiration-requested'|'failed';
  error?:'unavailable'|'operation-failed'|'still-present'|'scope-unavailable';
  cookieScope?:CookieCleanupScope;
}
export interface StorageCleanupReport {reason:'initial'|'abort'|'teardown'|'start-failure'|'retry'|'destroy';failed:boolean;results:StorageCleanupResult[]}
export interface StorageServiceSnapshot {serviceId:string;state:'open'|'closing'|'closed';report:StorageCleanupReport|null}
export type StorageServiceOptions=({consent:ConsentStateController;exceptions?:never}|{exceptions:StorageExceptionController;consent?:never})&{serviceId:string;targets:readonly StorageCleanupTarget[];start:ServiceLifecycle['start']};
export interface StorageServiceController {
  getSnapshot():StorageServiceSnapshot;
  subscribe(listener:(snapshot:StorageServiceSnapshot)=>void):()=>void;
  /** Stops registration immediately; resolves after this adapter's producers finish cleanup, not other services. */
  destroy():Promise<void>;
}
interface PreparedTarget {id:string;name:string;type:'localStorage'|'sessionStorage'|'cookie';scopes:CookieCleanupScope[]}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const bad=():never=>{throw new Error('Select exact, unambiguous optional storage owned by this service; cookie scopes must be explicit and valid.');};
function browserEnvironment():StorageCleanupEnvironment {
  if(typeof window==='undefined')return {};
  return {localStorage:()=>window.localStorage,sessionStorage:()=>window.sessionStorage,cookies:{hostname:window.location.hostname,secure:window.location.protocol==='https:',expire(assignment){window.document.cookie=assignment;}}};
}
function cookieScopeUsable(name:string,scope:CookieCleanupScope,cookie:NonNullable<StorageCleanupEnvironment['cookies']>):boolean {
  const host=cookie.hostname.toLowerCase();
  return (!scope.domain||host===scope.domain||host.endsWith('.'+scope.domain))&&(!name.startsWith('__Host-')||scope.path==='/'&&!scope.domain&&cookie.secure)&&(!name.startsWith('__Secure-')||cookie.secure);
}

/** @requirements REQ-PRODUCT-STORAGE-CLEANUP REQ-PRODUCT-CONSENT-RUNTIME REQ-UK-EXCEPTIONS
 * Opt-in exact-key cleanup within one owned service generation. Never enumerates storage or returns values.
 */
export function registerStorageService(options:StorageServiceOptions,environment?:StorageCleanupEnvironment):StorageServiceController {
  const {serviceId,start}=options,consent=options.exceptions??options.consent,exception=options.exceptions!==undefined,config=consent.getConfig();const service=config.services.find(s=>s.id===serviceId);if(options.exceptions&&options.consent)return bad();
  if(!service||!(exception?options.exceptions!.getPolicy().entries.some(e=>e.serviceIds.includes(serviceId)):config.consent?.services.some(s=>s.id===serviceId))||consent.getSnapshot().destroyed||typeof start!=='function'||!Array.isArray(options.targets)||!options.targets.length||options.targets.length>64)return bad();
  const env=environment??browserEnvironment(),ids=new Set<string>();
  // Copy and validate every target before registration or mutation.
  const targets:PreparedTarget[]=options.targets.map(raw=>{
    if(!object(raw)||!keys(raw,['storageId'],['cookieScopes'])||typeof raw.storageId!=='string'||ids.has(raw.storageId))return bad();ids.add(raw.storageId);
    const item=config.storage.find(s=>s.id===raw.storageId);
    if(!item||item.serviceId!==serviceId||item.classification!==(exception?'exception':'optional')||!['localStorage','sessionStorage','cookie'].includes(item.type)||!item.name||item.name.length>256||item.name.startsWith('notabenda:')||/[\u0000-\u001f\u007f]/u.test(item.name)||config.storage.some(s=>s.id!==item.id&&s.type===item.type&&s.name===item.name))return bad();
    if(item.type!=='cookie'){if(raw.cookieScopes!==undefined)return bad();return {id:item.id,name:item.name,type:item.type as 'localStorage'|'sessionStorage',scopes:[]};}
    if(!/^[!#$%&'*+\-.^_\x60|~0-9A-Za-z]+$/u.test(item.name)||/^__(?:Host-)?Http-/u.test(item.name)||!Array.isArray(raw.cookieScopes)||!raw.cookieScopes.length||raw.cookieScopes.length>8)return bad();
    const seen=new Set<string>();const scopes=raw.cookieScopes.map(value=>{
      if(!object(value)||!keys(value,['path'],['domain'])||typeof value.path!=='string'||!value.path.startsWith('/')||value.path.length>512||/[;\u0000-\u0020\u007f]/u.test(value.path)||value.domain!==undefined&&(typeof value.domain!=='string'||value.domain.length>253||!value.domain.includes('.')||!value.domain.split('.').every(label=>label.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label))))return bad();
      const scope:CookieCleanupScope={path:value.path,...(value.domain===undefined?{}:{domain:value.domain as string})};
      if(item.name.startsWith('__Host-')&&(scope.path!=='/'||scope.domain)||seen.has(JSON.stringify(scope)))return bad();seen.add(JSON.stringify(scope));
      try{if(env.cookies&&!cookieScopeUsable(item.name,scope,env.cookies))return bad();}catch{return bad();}return scope;
    });
    return {id:item.id,name:item.name,type:'cookie',scopes};
  });
  let state:StorageServiceSnapshot['state']='open',report:StorageCleanupReport|null=null,closeTask:Promise<void>|undefined;
  const listeners=new Set<(snapshot:StorageServiceSnapshot)=>void>(),generations=new Set<Promise<void>>();
  const snapshot=():StorageServiceSnapshot=>({serviceId,state,report:report?structuredClone(report):null});
  const emit=()=>{for(const listener of [...listeners])try{listener(snapshot());}catch{}};
  function clear(reason:StorageCleanupReport['reason']):StorageCleanupReport {
    const results:StorageCleanupResult[]=[];
    for(const item of targets){
      if(item.type==='cookie'){
        for(const scope of item.scopes){const base={storageId:item.id,type:'cookie' as const,cookieScope:{...scope}};
          try{
            const cookie=env.cookies;if(!cookie){results.push({...base,status:'failed',error:'unavailable'});continue;}
            if(!cookieScopeUsable(item.name,scope,cookie)){results.push({...base,status:'failed',error:'scope-unavailable'});continue;}
            cookie.expire([item.name+'=', 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'Path='+scope.path,...(scope.domain?['Domain='+scope.domain]:[]),...(cookie.secure?['Secure']:[])].join('; '));
            results.push({...base,status:'expiration-requested'});
          }catch{results.push({...base,status:'failed',error:'operation-failed'});}
        }
      }else{
        const base={storageId:item.id,type:item.type};let storage:StorageAccess|undefined;
        try{storage=env[item.type]?.();}catch{}
        if(!storage){results.push({...base,status:'failed',error:'unavailable'});continue;}
        try{storage.removeItem(item.name);results.push(storage.getItem(item.name)===null?{...base,status:'absent-at-check'}:{...base,status:'failed',error:'still-present'});}catch{results.push({...base,status:'failed',error:'operation-failed'});}
      }
    }
    report={reason,failed:results.some(r=>r.status==='failed'),results};emit();return structuredClone(report);
  }
  const unregister=consent.registerService(serviceId,{purposes:[...service.purposeIds],async start(context){
    let finish:()=>void=()=>{};const done=new Promise<void>(resolve=>{finish=resolve;});generations.add(done);
    const complete=()=>{generations.delete(done);finish();};
    const abort=()=>{clear('abort');};context.signal.addEventListener('abort',abort,{once:true});
    try{
      if(state!=='open'||context.signal.aborted)throw new Error();
      if(report?.failed&&clear('retry').failed)throw new Error();
      // A cleanup observer can revoke permission or destroy this helper synchronously.
      if(state!=='open'||context.signal.aborted)throw new Error();
      const stop=await start(context);if(typeof stop!=='function')throw new Error();
      let stopping:Promise<void>|undefined;
      return ()=>stopping??=(async()=>{
        let failed=false;try{await stop();}catch{failed=true;}
        finally{context.signal.removeEventListener('abort',abort);failed=clear('teardown').failed||failed;complete();}
        if(failed)throw new Error('Storage service teardown or cleanup failed.');
      })();
    }catch{
      context.signal.removeEventListener('abort',abort);clear('start-failure');complete();throw new Error('Storage service startup or cleanup failed.');
    }
  }});
  let wasAllowed:boolean|undefined;
  const stopObserving=consent.subscribe(current=>{
    // An asynchronous exception journal has not yet decided whether old feature data
    // must be removed. Do not erase a still-allowed preference merely while hydrating.
    if(exception&&wasAllowed===undefined&&!current.destroyed){const snapshot=options.exceptions!.getSnapshot(),entry=options.exceptions!.getPolicy().entries.find(e=>e.serviceIds.includes(serviceId))!;if(snapshot.persistence==='loading'||snapshot.persistence==='available'&&snapshot.entries[entry.id]?.reason==='waiting-for-controls')return;}
    const allowed=!current.destroyed&&current.servicePermissions[serviceId]===true,previous=wasAllowed;wasAllowed=allowed;
    // Core can cancel a queued start before our generation attaches its abort handler.
    if(!allowed&&previous!==false&&generations.size===0)clear(previous===undefined?'initial':'abort');
  });
  return {getSnapshot:snapshot,subscribe(listener){if(state!=='open')throw new Error('Storage service is closing.');listeners.add(listener);try{listener(snapshot());}catch{}return ()=>listeners.delete(listener);},destroy(){
    if(closeTask)return closeTask;let finish:()=>void=()=>{};closeTask=new Promise<void>(resolve=>{finish=resolve;});state='closing';emit();stopObserving();unregister();
    void(async()=>{while(generations.size)await Promise.all([...generations]);clear('destroy');state='closed';emit();listeners.clear();finish();})();return closeTask;
  }};
}
