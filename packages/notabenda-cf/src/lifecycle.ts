// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
// @requirements REQ-PRODUCT-FORM-PERMISSIONS
// @requirements REQ-EU-CONSENT REQ-CA-MEANINGFUL REQ-EU-MARKETING REQ-CA-CASL-OPTIN
// @requirements REQ-EU-RETENTION-ERASURE
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
/** @requirements REQ-PRODUCT-CONSENT-EVIDENCE
 * Trusted host operations. No public routes, identity resolution, or legal-retention inference.
 */
import {canonicalJson,sha256} from './history.js';
import type {HistoryStorage,HistoryTransaction} from './history.js';
import {createDurableObjectStore} from './store.js';
import {normalizeRecord,boundedText} from './records.js';
import {compareRecordKeys} from './export.js';
import type {JsonValue,RecordStore,DurableStorage} from './types.js';

export type EvidenceFamily = 'consent'|'processing'|'terms'|'permissions'|'contracts';
export type EvidenceLifecycleTarget = {family:'consent'|'processing'|'permissions'|'contracts';siteId:string;scopeId:string;streamId:string;prefix?:string} | {family:'terms';siteId:string;subjectId:string;prefix?:string};
export interface LifecycleTransaction extends HistoryTransaction {
  list<T=unknown>(options:{prefix:string;startAfter?:string;limit:number}):Promise<Map<string,T>>;
  delete(key:string):Promise<boolean>;
}
export interface LifecycleStorage extends HistoryStorage {
  transaction<T>(callback:(transaction:LifecycleTransaction)=>Promise<T>):Promise<T>;
}
export interface EvidenceLifecycleState {
  schemaVersion:1;id:string;kind:'evidence-lifecycle';siteId:string;family:EvidenceFamily;contextRef:string;
  phase:'retained'|'purging'|'complete';occurredAt:string;updatedAt:string;
  hold:{active:boolean;revision:number;updatedAt:string;reviewAt:string|null};
  retirement:null|{requestId:string;reason:'retention-expired'|'operator-erasure';eligibleAt:string;startedAt:string};
  progress:{scanned:number;deleted:number;batches:number;after:string|null;completedAt:string|null};
  restoredAt:string|null;
}
export interface EvidenceRetirementDecision {
  requestId:string;reason:'retention-expired'|'operator-erasure';eligibleAt:string;
  /** Fresh host assessment, separate from the stored hold checked in the same transaction. */
  legalHold:false;
}
export interface EvidenceLifecycle {
  readonly contextRef:string;
  getState():Promise<EvidenceLifecycleState|undefined>;
  setHold(input:{active:boolean;reviewAt:string|null;expectedRevision:number}):Promise<EvidenceLifecycleState>;
  retire(input:EvidenceRetirementDecision):Promise<EvidenceLifecycleState>;
  purge(input:{requestId:string;legalHold:false;limit?:number}):Promise<EvidenceLifecycleState>;
  /** Trusted manifest reapplication BEFORE reopening restored storage to traffic; restarts scanning. */
  restore(manifest:unknown):Promise<EvidenceLifecycleState>;
}
export class EvidenceLifecycleError extends Error {
  constructor(readonly code:'invalid-target'|'invalid-state'|'invalid-decision'|'invalid-clock'|'unsupported-storage'|'legal-hold'|'not-eligible'|'context-retired'|'not-retired'|'revision-conflict'|'idempotency-conflict'|'invalid-record'|'pending-delivery') {super(code);this.name='EvidenceLifecycleError';}
}
const fail=(code:EvidenceLifecycleError['code']):never=>{throw new EvidenceLifecycleError(code);};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
const text=(v:unknown):v is string=>boundedText(v,200)&&v.trim().length>0;
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const iso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const family=(v:unknown):v is EvidenceFamily=>typeof v==='string'&&['consent','processing','terms','permissions','contracts'].includes(v);
const kindFor={consent:'consent-choice',processing:'processing-restriction',terms:'terms-acceptance',permissions:'form-permission',contracts:'contract-declaration'} as const;
const markerKey=(prefix:string,f:EvidenceFamily,ref:string)=>`${prefix}lifecycle/${f}/${ref}`;

function normalizeState(input:unknown,siteId:string,f:EvidenceFamily,ref:string):EvidenceLifecycleState {
  let s:unknown;try{s=normalizeRecord({id:ref,data:input},8192).data;}catch{return fail('invalid-state');}
  if(!object(s)||!exact(s,['schemaVersion','id','kind','siteId','family','contextRef','phase','occurredAt','updatedAt','hold','retirement','progress','restoredAt'])||s.schemaVersion!==1||s.id!==ref||s.kind!=='evidence-lifecycle'||s.siteId!==siteId||s.family!==f||s.contextRef!==ref||typeof s.phase!=='string'||!['retained','purging','complete'].includes(s.phase)||!iso(s.occurredAt)||!iso(s.updatedAt)||!(s.restoredAt===null||iso(s.restoredAt)))return fail('invalid-state');
  const h=s.hold,p=s.progress,r=s.retirement;
  if(!object(h)||!exact(h,['active','revision','updatedAt','reviewAt'])||typeof h.active!=='boolean'||!integer(h.revision)||!iso(h.updatedAt)||!(h.reviewAt===null||iso(h.reviewAt))||h.active&&h.reviewAt===null||!object(p)||!exact(p,['scanned','deleted','batches','after','completedAt'])||![p.scanned,p.deleted,p.batches].every(integer)||Number(p.deleted)>Number(p.scanned)||!(p.after===null||hash(p.after))||!(p.completedAt===null||iso(p.completedAt)))return fail('invalid-state');
  if(r!==null&&(!object(r)||!exact(r,['requestId','reason','eligibleAt','startedAt'])||!uuid(r.requestId)||typeof r.reason!=='string'||!['retention-expired','operator-erasure'].includes(r.reason)||!iso(r.eligibleAt)||!iso(r.startedAt)||Date.parse(r.eligibleAt)>Date.parse(r.startedAt)))return fail('invalid-state');
  if(s.phase==='retained'&&(r!==null||p.scanned!==0||p.deleted!==0||p.batches!==0||p.after!==null||p.completedAt!==null)||s.phase!=='retained'&&r===null||s.phase==='complete'&&p.completedAt===null||s.phase!=='complete'&&p.completedAt!==null)return fail('invalid-state');
  return s as unknown as EvidenceLifecycleState;
}
function checkedTx(tx:HistoryTransaction):LifecycleTransaction {
  const value=tx as Partial<LifecycleTransaction>;
  if(typeof value.list!=='function'||typeof value.delete!=='function')return fail('unsupported-storage');
  return tx as LifecycleTransaction;
}
function prefixFor(siteId:string,f:EvidenceFamily,override?:string):string {
  if(!slug(siteId)||!family(f))return fail('invalid-target');
  const prefix=override??`notabenda/${f}/${siteId}/`;
  try{createDurableObjectStore({get:async()=>undefined,list:async()=>new Map()},{prefix});}catch{return fail('invalid-target');}
  return prefix;
}
function clock(now:()=>Date):string {try{const time=now().toISOString();if(!iso(time))return fail('invalid-clock');return time;}catch{return fail('invalid-clock');}}
function initial(siteId:string,f:EvidenceFamily,ref:string,at:string):EvidenceLifecycleState {
  return {schemaVersion:1,id:ref,kind:'evidence-lifecycle',siteId,family:f,contextRef:ref,phase:'retained',occurredAt:at,updatedAt:at,hold:{active:false,revision:0,updatedAt:at,reviewAt:null},retirement:null,progress:{scanned:0,deleted:0,batches:0,after:null,completedAt:null},restoredAt:null};
}

/** Called INSIDE ledger transactions, including before idempotent return and empty-head cases. */
export async function assertEvidenceContextActive(tx:Pick<HistoryTransaction,'get'>,prefix:string,f:EvidenceFamily,siteId:string,ref:string):Promise<void> {
  const value=await tx.get(markerKey(prefix,f,ref));if(value===undefined)return;
  if(normalizeState(value,siteId,f,ref).phase!=='retained')return fail('context-retired');
}
/** Minimized projection keeps bounded pagination intact while payload purge is pending. */
export async function retiredEvidenceProjection(tx:Pick<HistoryTransaction,'get'>,prefix:string,f:EvidenceFamily,siteId:string,ref:string,id:string):Promise<JsonValue|undefined> {
  const value=await tx.get(markerKey(prefix,f,ref));if(value===undefined)return undefined;
  const state=normalizeState(value,siteId,f,ref);if(state.phase==='retained')return undefined;
  return {id,kind:'retired-evidence',siteId,family:f,contextRef:ref,occurredAt:state.retirement!.startedAt,status:state.phase,description:'This context is retired. Original event payload is withheld from this view; scoped purge and retained metadata are separate.',...(f==='processing'?{processing:'Retired context: processing remains blocked; no empty live head is returned.'}:{})};
}

/** Host supplies the fixed target and decision. Never expose these operations through an untrusted store selector. */
export async function createEvidenceLifecycle(storage:LifecycleStorage,target:EvidenceLifecycleTarget,options:{now?:()=>Date}={}):Promise<EvidenceLifecycle> {
  // Detach caller-owned objects before any asynchronous boundary.
  target={...target};const now=options.now??(()=>new Date());
  if(!object(target)||!family(target.family)||!slug(target.siteId))return fail('invalid-target');
  const f=target.family,siteId=target.siteId,prefix=prefixFor(siteId,f,target.prefix);
  if(f==='terms'?!exact(target,['family','siteId','subjectId',...(target.prefix===undefined?[]:['prefix'])])||!text((target as {subjectId?:unknown}).subjectId):!exact(target,['family','siteId','scopeId','streamId',...(target.prefix===undefined?[]:['prefix'])])||!slug((target as {scopeId?:unknown}).scopeId)||!text((target as {streamId?:unknown}).streamId))return fail('invalid-target');
  if(target.family==='contracts'&&!uuid(target.streamId))return fail('invalid-target');
  const t=target;
  const ref=await sha256(canonicalJson(t.family==='terms'?[siteId,t.subjectId]:[siteId,t.scopeId,t.streamId]));
  const key=markerKey(prefix,f,ref);
  if(typeof storage.transaction!=='function')return fail('unsupported-storage');
  await storage.transaction(async tx=>{checkedTx(tx);});
  const read=async(tx:Pick<HistoryTransaction,'get'>)=>{const value=await tx.get(key);return value===undefined?undefined:normalizeState(value,siteId,f,ref);};
  const save=async(tx:HistoryTransaction,s:EvidenceLifecycleState)=>{const normalized=normalizeState(s,siteId,f,ref);await tx.put(key,normalized);return normalized;};
  function targetMatches(event:Record<string,unknown>,id:string):boolean {
    if(event.id!==id||typeof event.kind!=='string'||!Object.values(kindFor).includes(event.kind as typeof kindFor[EvidenceFamily])||!slug(event.siteId))return fail('invalid-record');
    if(event.kind!==kindFor[f]||event.siteId!==siteId)return false;
    if(t.family==='terms'){if(!text(event.subjectId))return fail('invalid-record');return event.subjectId===t.subjectId;}
    if(!slug(event.scopeId)||!hash(event.streamRef))return fail('invalid-record');
    return event.scopeId===t.scopeId&&event.streamRef===ref;
  }
  return {
    contextRef:ref,
    getState:()=>storage.transaction(read),
    async setHold(input){
      if(!object(input)||!exact(input,['active','reviewAt','expectedRevision'])||typeof input.active!=='boolean'||!integer(input.expectedRevision)||!(input.reviewAt===null||iso(input.reviewAt))||input.active&&input.reviewAt===null||!input.active&&input.reviewAt!==null)return fail('invalid-decision');
      const request={...input},at=clock(now);
      return storage.transaction(async tx=>{checkedTx(tx);const state=await read(tx)??initial(siteId,f,ref,at);if(state.hold.revision!==request.expectedRevision)return fail('revision-conflict');state.hold={active:request.active,reviewAt:request.reviewAt,revision:state.hold.revision+1,updatedAt:at};state.updatedAt=at;return save(tx,state);});
    },
    async retire(input){
      if(!object(input)||!exact(input,['requestId','reason','eligibleAt','legalHold'])||!uuid(input.requestId)||typeof input.reason!=='string'||!['retention-expired','operator-erasure'].includes(input.reason)||!iso(input.eligibleAt)||input.legalHold!==false)return fail('invalid-decision');
      const decision={...input},at=clock(now);if(Date.parse(decision.eligibleAt)>Date.parse(at))return fail('not-eligible');
      return storage.transaction(async tx=>{
        checkedTx(tx);const state=await read(tx)??initial(siteId,f,ref,at);
        if(state.retirement){const r=state.retirement;if(r.requestId!==decision.requestId||r.reason!==decision.reason||r.eligibleAt!==decision.eligibleAt)return fail('idempotency-conflict');return state;}
        if(state.hold.active)return fail('legal-hold');
        if(t.family==='contracts'){
          // A declaration's embedded outbox is its only payload copy in this ledger.
          // Pending/uncertain/leased work must be drained or explicitly quiesced by trusted host code.
          const eventId=await sha256(canonicalJson([ref,t.streamId])),raw=await tx.get(prefix+'events/'+eventId);
          if(raw!==undefined){const event=normalizeRecord({id:eventId,data:raw}).data;if(!object(event)||!targetMatches(event,eventId)||!object(event.delivery))return fail('invalid-record');for(const channel of ['application','acknowledgement']){const job=event.delivery[channel];if(!object(job)||typeof job.status!=='string'||!['accepted','cancelled'].includes(job.status)||job.lease!==null)return fail('pending-delivery');}}
        }
        state.phase='purging';state.retirement={requestId:decision.requestId,reason:decision.reason,eligibleAt:decision.eligibleAt,startedAt:at};state.updatedAt=at;return save(tx,state);
      });
    },
    async purge(input){
      if(!object(input)||!exact(input,['requestId','legalHold',...(input.limit===undefined?[]:['limit'])])||!uuid(input.requestId)||input.legalHold!==false||input.limit!==undefined&&(!Number.isInteger(input.limit)||input.limit<1||input.limit>100))return fail('invalid-decision');
      const request={...input},at=clock(now),limit=request.limit??50;
      return storage.transaction(async raw=>{
        const tx=checkedTx(raw),state=await read(tx);if(!state?.retirement)return fail('not-retired');if(state.retirement.requestId!==request.requestId)return fail('idempotency-conflict');if(state.hold.active)return fail('legal-hold');
        if(Date.parse(state.retirement.eligibleAt)>Date.parse(at))return fail('not-eligible');
        if(Date.parse(state.retirement.startedAt)>Date.parse(at))return fail('invalid-clock');
        if(state.phase==='complete')return state;
        const eventPrefix=prefix+'events/',after=state.progress.after;
        const batch=await tx.list({prefix:eventPrefix,...(after===null?{}:{startAfter:eventPrefix+after}),limit});
        if(!(batch instanceof Map)||batch.size>limit)return fail('invalid-record');
        let previous=after===null?undefined:eventPrefix+after;
        for(const [eventKey,value] of batch){
          if(typeof eventKey!=='string'||!eventKey.startsWith(eventPrefix)||!hash(eventKey.slice(eventPrefix.length))||previous!==undefined&&compareRecordKeys(eventKey,previous)<=0)return fail('invalid-record');previous=eventKey;
          const id=eventKey.slice(eventPrefix.length);let event:unknown;try{event=normalizeRecord({id,data:value}).data;}catch{return fail('invalid-record');}if(!object(event))return fail('invalid-record');
          if(targetMatches(event,id)){
            if(!uuid(event.requestId)||await sha256(canonicalJson(t.family==='terms'?[siteId,t.subjectId,event.requestId]:[ref,event.requestId]))!==id)return fail('invalid-record');
            // Legacy heads have no family tag. Delete only while positively bound to THIS event.
            if(t.family!=='terms'){
              const headKey=prefix+'heads/'+ref,head=await tx.get(headKey);
              if(object(head)&&head.id===id){
                if(head.siteId!==siteId||head.scopeId!==t.scopeId||head.streamRef!==ref)return fail('invalid-record');
                if(await tx.delete(headKey)!==true)return fail('invalid-record');
              }
            }
            if(await tx.delete(eventKey)!==true)return fail('invalid-record');state.progress.deleted++;
          }
          state.progress.scanned++;state.progress.after=id;
        }
        state.progress.batches++;state.updatedAt=at;
        if(batch.size<limit){
          state.phase='complete';state.progress.completedAt=at;
        }
        return save(tx,state);
      });
    },
    async restore(manifest){
      const imported=normalizeState(manifest,siteId,f,ref);if(!imported.retirement)return fail('not-retired');const at=clock(now);
      return storage.transaction(async tx=>{
        checkedTx(tx);const current=await read(tx);
        if(current?.retirement&&canonicalJson(current.retirement as unknown as JsonValue)!==canonicalJson(imported.retirement as unknown as JsonValue))return fail('idempotency-conflict');
        const state=structuredClone(imported);state.phase='purging';state.progress={scanned:0,deleted:0,batches:0,after:null,completedAt:null};state.restoredAt=at;state.updatedAt=at;
        if(current){const held=current.hold.active?current.hold:imported.hold.active?imported.hold:current.hold;state.hold={...held,revision:Math.max(current.hold.revision,imported.hold.revision)+1,updatedAt:at};}
        return save(tx,state);
      });
    },
  };
}

/** Read-only lifecycle records for one host-selected family/site/prefix; compatible with the existing admin and export UI. */
export function createEvidenceLifecycleStore(storage:HistoryStorage,options:{family:EvidenceFamily;siteId:string;prefix?:string}):RecordStore {
  const {family:f,siteId}=options,prefix=prefixFor(siteId,f,options.prefix),controlPrefix=prefix+'lifecycle/'+f+'/';
  const inspect=(key:string,value:unknown)=>{const id=key.slice(controlPrefix.length);if(!hash(id))return fail('invalid-state');return normalizeState(value,siteId,f,id);};
  const scoped:DurableStorage={async get<T>(key:string){const value=await storage.get(key);return value===undefined?undefined:inspect(key,value) as T;},async list<T>(query:{prefix:string;startAfter?:string;limit:number}){const values=await storage.list(query),result=new Map<string,T>();for(const [key,value] of values)result.set(key,inspect(key,value) as T);return result;}};
  return createDurableObjectStore(scoped,{prefix:controlPrefix});
}
