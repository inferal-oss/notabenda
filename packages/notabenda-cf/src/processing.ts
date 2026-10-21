// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
import {normalizeProcessingLocalization,selectProcessingLocalization} from './processing-localization-policy.js';
import type {ProcessingLocalization} from './processing-localization-policy.js';
// @requirements REQ-EU-RETENTION-ERASURE
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {canonicalJson,sha256,validateStoredLegalRelease} from './history.js';
import type {HistoryStorage,HistoryTransaction} from './history.js';
import {normalizeRecord,boundedText} from './records.js';
import {createDurableObjectStore} from './store.js';
import {assertEvidenceContextActive,retiredEvidenceProjection} from './lifecycle.js';
import type {DurableStorage,JsonValue,RecordStore} from './types.js';

type ObjectValue=Record<string,JsonValue>;
export type ProcessingActivity='sale'|'sharing'|'targeted-advertising';
export type ProcessingProvenance='explicit-opt-out'|'gpc-header'|'browser-report'|'trusted-application';
export interface ProcessingStoreOptions {siteId:string;prefix?:string;releasePrefix?:string;allowPreview?:boolean}
export interface ProcessingStreamContext extends ProcessingStoreOptions {scopeId:string;streamId:string}
export interface ProcessingRecordContext extends ProcessingStreamContext {provenance:ProcessingProvenance;now?:()=>Date}
export interface ProcessingRequest {schemaVersion:1;noticeId:string;requestId:string;activities:ProcessingActivity[]}
export interface ProcessingReceipt {schemaVersion:1;id:string;siteId:string;scopeId:string;streamRef:string;revision:number;noticeId:string;artifactId:string;requestId:string;activities:ProcessingActivity[];restrictions:ProcessingActivity[];recordedAt:string;provenance:ProcessingProvenance}
export interface ProcessingHead {schemaVersion:1;siteId:string;scopeId:string;streamRef:string;revision:number;event:ProcessingReceipt|null}
export interface ProcessingResult {receipt:ProcessingReceipt;head:ProcessingHead}
export class ProcessingRecordError extends Error {constructor(readonly code:'invalid-request'|'invalid-notice'|'scope-mismatch'|'idempotency-conflict'|'invalid-record'|'invalid-clock'){super(code);this.name='ProcessingRecordError';}}
const fail=(code:ProcessingRecordError['code']):never=>{throw new ProcessingRecordError(code);};
const activityNames=['sale','sharing','targeted-advertising'];
const provenanceNames=['explicit-opt-out','gpc-header','browser-report','trusted-application'];
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
const activities=(v:unknown):v is ProcessingActivity[]=>Array.isArray(v)&&v.length>0&&v.length<=3&&new Set(v).size===v.length&&v.every(a=>typeof a==='string'&&activityNames.includes(a));
const iso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
function object(v:JsonValue|undefined):ObjectValue{return v&&typeof v==='object'&&!Array.isArray(v)?v:fail('invalid-record');}
const exact=(v:ObjectValue,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function normalized(v:unknown,code:ProcessingRecordError['code']='invalid-record',max=32768):ObjectValue {try{return object(normalizeRecord({id:'value',data:v},max).data);}catch{return fail(code);}}
const optionsPrefix=(context:ProcessingStoreOptions)=>context.prefix??`notabenda/processing/${context.siteId}/`;
function options(storage:HistoryStorage,context:ProcessingStoreOptions){
  if(!slug(context.siteId)||typeof storage.transaction!=='function')return fail('scope-mismatch');
  const prefix=optionsPrefix(context),releasePrefix=context.releasePrefix??'notabenda/releases/';
  createDurableObjectStore(storage,{prefix});createDurableObjectStore(storage,{prefix:releasePrefix});return {prefix,releasePrefix};
}
async function noticeValue(input:unknown,context:ProcessingStoreOptions):Promise<ObjectValue>{
  const n=normalized(input,'invalid-notice');
  if(!exact(n,['schemaVersion','noticeId','siteId','scopeId','artifactId','mode','activities','services','wording','document',...(n.schemaVersion===2?['localization']:[])])||n.schemaVersion!==1&&n.schemaVersion!==2||n.siteId!==context.siteId||!hash(n.noticeId)||!hash(n.artifactId)||!slug(n.scopeId)||typeof n.mode!=='string'||!['production','preview'].includes(n.mode)||!activities(n.activities))return fail('invalid-notice');
  if(n.schemaVersion===2){try{normalizeProcessingLocalization(n.localization,{allowPreview:context.allowPreview===true});}catch{return fail('invalid-notice');}}
  if(!Array.isArray(n.services)||n.services.length>80)return fail('invalid-notice');
  const ids=new Set<string>();for(const raw of n.services){const s=object(raw);if(!exact(s,['id','activities'])||!slug(s.id)||ids.has(s.id)||!Array.isArray(s.activities)||s.activities.length>3||new Set(s.activities).size!==s.activities.length||s.activities.some(a=>typeof a!=='string'||!activityNames.includes(a)))return fail('invalid-notice');ids.add(s.id);}
  const w=object(n.wording),d=object(n.document);
  if(!exact(w,['title','description','actionLabel'])||!boundedText(w.title,300)||!String(w.title).trim()||!boundedText(w.description,2000)||!String(w.description).trim()||!boundedText(w.actionLabel,120)||!String(w.actionLabel).trim())return fail('invalid-notice');
  if(!exact(d,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus'])||!boundedText(d.title,300)||!String(d.title).trim()||!boundedText(d.version,200)||!String(d.version).trim()||d.url!==`/artifacts/${n.artifactId}/privacy.html`||!hash(d.sha256)||!hash(d.contentSha256)||typeof d.reviewStatus!=='string'||!['draft','reviewed'].includes(d.reviewStatus)||typeof d.effectiveDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate)||!Number.isFinite(Date.parse(d.effectiveDate))||new Date(d.effectiveDate).toISOString().slice(0,10)!==d.effectiveDate)return fail('invalid-notice');
  if(!context.allowPreview&&(n.mode!=='production'||d.reviewStatus!=='reviewed'))return fail('invalid-notice');
  const {noticeId:_,...descriptor}=n;if(await sha256(canonicalJson(descriptor))!==n.noticeId)return fail('invalid-notice');return n;
}
async function verifyArchive(tx:Pick<HistoryTransaction,'get'>,n:ObjectValue,context:ProcessingStoreOptions,releasePrefix:string):Promise<void>{
  let a:ObjectValue;try{a=await validateStoredLegalRelease(await tx.get(releasePrefix+n.artifactId));}catch{return fail('invalid-notice');}
  const m=object(a.manifest);if(m.artifactId!==n.artifactId||m.siteId!==context.siteId||m.mode!==n.mode)return fail('scope-mismatch');
  const d=object((m.documents as JsonValue[]).find(raw=>object(raw).kind==='privacy')),given=object(n.document);
  for(const key of ['title','version','effectiveDate','sha256','contentSha256','reviewStatus'])if(d[key]!==given[key])return fail('invalid-notice');
  const c=object(a.publicConfig);
  if(c.localization!==undefined&&object(c.localization).processingChoices!==undefined){
    let selected:ProcessingLocalization;try{selected=normalizeProcessingLocalization(selectProcessingLocalization(object(c.localization) as unknown as ProcessingLocalization),{locale:String(object(c.site).locale),allowPreview:context.allowPreview===true});}catch{return fail('invalid-notice');}
    if(n.localization===undefined||canonicalJson(n.localization)!==canonicalJson(selected as unknown as JsonValue))return fail('invalid-notice');
  }else if(n.localization!==undefined||!/^en(?:-|$)/iu.test(String(object(c.site).locale)))return fail('invalid-notice');
if(!Array.isArray(c.services)||c.services.some(raw=>{const v=object(raw).processingActivities;return !Array.isArray(v)||v.length>3||new Set(v).size!==v.length||v.some(item=>typeof item!=='string'||!activityNames.includes(item));}))return fail('invalid-notice');
  const services=(c.services as JsonValue[]).map(raw=>{const s=object(raw);return {id:s.id!,activities:[...(s.processingActivities as JsonValue[])].sort()};}).sort((a,b)=>String(a.id)<String(b.id)?-1:String(a.id)>String(b.id)?1:0);if(canonicalJson(services)!==canonicalJson(n.services!))return fail('invalid-notice');
}
/** @requirements REQ-PRODUCT-PROCESSING-CHOICES Registration archives wording; it grants no processing and publishes nothing. */
export async function registerProcessingNotice(storage:HistoryStorage,input:unknown,context:ProcessingStoreOptions):Promise<{noticeId:string;created:boolean}>{
  context={...context};const {prefix,releasePrefix}=options(storage,context);const n=await noticeValue(input,context);
  return storage.transaction(async tx=>{await verifyArchive(tx,n,context,releasePrefix);const key=prefix+'notices/'+n.noticeId,old=await tx.get(key);if(old!==undefined){if(canonicalJson(await noticeValue(old,context))!==canonicalJson(n))return fail('idempotency-conflict');return {noticeId:String(n.noticeId),created:false};}await tx.put(key,n);return {noticeId:String(n.noticeId),created:true};});
}
async function stream(c:ProcessingStreamContext):Promise<string>{if(!slug(c.scopeId)||!boundedText(c.streamId,200)||!c.streamId.trim())return fail('scope-mismatch');return sha256(canonicalJson([c.siteId,c.scopeId,c.streamId]));}
function requestValue(input:unknown):ProcessingRequest {const r=normalized(input,'invalid-request',4096);if(!exact(r,['schemaVersion','noticeId','requestId','activities'])||r.schemaVersion!==1||!hash(r.noticeId)||!uuid(r.requestId)||!activities(r.activities))return fail('invalid-request');return r as unknown as ProcessingRequest;}
function receiptFor(e:ObjectValue,c:ProcessingStreamContext,ref:string):ProcessingReceipt {
  if(e.kind!=='processing-restriction'||e.siteId!==c.siteId||e.scopeId!==c.scopeId||e.streamRef!==ref||!hash(e.id)||!hash(e.noticeId)||!hash(e.artifactId)||!uuid(e.requestId)||!Number.isSafeInteger(e.revision)||Number(e.revision)<1||!activities(e.activities)||!activities(e.restrictions)||e.activities.some(a=>!(e.restrictions as JsonValue[]).includes(a))||!iso(e.occurredAt)||typeof e.provenance!=='string'||!provenanceNames.includes(e.provenance))return fail('invalid-record');
  return {schemaVersion:1,id:e.id,siteId:c.siteId,scopeId:c.scopeId,streamRef:ref,revision:Number(e.revision),noticeId:e.noticeId,artifactId:e.artifactId,requestId:e.requestId,activities:[...e.activities],restrictions:[...e.restrictions],recordedAt:e.occurredAt,provenance:e.provenance as ProcessingProvenance};
}
async function inspectEvent(tx:Pick<HistoryTransaction,'get'>,e:ObjectValue,c:ProcessingStreamContext,ref:string,releasePrefix:string):Promise<ProcessingReceipt>{
  const r=receiptFor(e,c,ref),n=await noticeValue(await tx.get(`${optionsPrefix(c)}notices/${r.noticeId}`),c);
  if(n.scopeId!==c.scopeId||n.artifactId!==r.artifactId||r.activities.some(a=>!(n.activities as JsonValue[]).includes(a)))return fail('scope-mismatch');
  if(await sha256(canonicalJson([ref,r.requestId]))!==r.id||await sha256(canonicalJson({schemaVersion:1,noticeId:r.noticeId,requestId:r.requestId,activities:r.activities,provenance:r.provenance}))!==e.requestSha256)return fail('invalid-record');
  await verifyArchive(tx,n,c,releasePrefix);return r;
}
async function headFor(tx:Pick<HistoryTransaction,'get'>,c:ProcessingStreamContext,ref:string,releasePrefix:string):Promise<ProcessingHead>{
  await assertEvidenceContextActive(tx,optionsPrefix(c),'processing',c.siteId,ref);
  const prefix=optionsPrefix(c),value=await tx.get(prefix+'heads/'+ref),base={schemaVersion:1 as const,siteId:c.siteId,scopeId:c.scopeId,streamRef:ref};
  if(value===undefined)return {...base,revision:0,event:null};
  const p=normalized(value);if(!exact(p,['id','revision','siteId','scopeId','streamRef'])||!hash(p.id)||!Number.isSafeInteger(p.revision)||Number(p.revision)<1||p.siteId!==c.siteId||p.scopeId!==c.scopeId||p.streamRef!==ref)return fail('invalid-record');
  const e=normalized(await tx.get(prefix+'events/'+p.id)),event=await inspectEvent(tx,e,c,ref,releasePrefix);if(event.id!==p.id||event.revision!==p.revision)return fail('invalid-record');return {...base,revision:event.revision,event};
}
/** @requirements REQ-PRODUCT-PROCESSING-CHOICES Trusted scoped reads; no browser-selected account lookup. */
export async function getProcessingHead(storage:HistoryStorage,c:ProcessingStreamContext):Promise<ProcessingHead>{c={...c};const {releasePrefix}=options(storage,c),ref=await stream(c);return storage.transaction(tx=>headFor(tx,c,ref,releasePrefix));}

/** @requirements REQ-PRODUCT-PROCESSING-CHOICES
 * Read one fixed registered notice and verify its retained release, without selecting or registering it.
 */
export async function getProcessingNotice(storage:HistoryStorage,noticeId:string,c:ProcessingStoreOptions&{scopeId:string}):Promise<JsonValue|undefined>{
  c={...c};const {prefix,releasePrefix}=options(storage,c);if(!hash(noticeId)||!slug(c.scopeId))return fail('scope-mismatch');
  return storage.transaction(async tx=>{const value=await tx.get(prefix+'notices/'+noticeId);if(value===undefined)return undefined;
    const n=await noticeValue(value,c);if(n.noticeId!==noticeId||n.scopeId!==c.scopeId)return fail('scope-mismatch');
    await verifyArchive(tx,n,c,releasePrefix);return n;
  });
}

/** @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-US-CA-CHOICES
 * Monotonic transactional union. An older retry returns its original receipt and today's head.
 */
export async function recordProcessingRestriction(storage:HistoryStorage,input:unknown,c:ProcessingRecordContext):Promise<ProcessingResult>{
  c={...c};const {prefix,releasePrefix}=options(storage,c),ref=await stream(c);if(typeof c.provenance!=='string'||!provenanceNames.includes(c.provenance))return fail('scope-mismatch');
  const r=requestValue(input),fingerprint=await sha256(canonicalJson({...r,provenance:c.provenance})),id=await sha256(canonicalJson([ref,r.requestId]));
  return storage.transaction(async tx=>{
    const head=await headFor(tx,c,ref,releasePrefix),previous=await tx.get(prefix+'events/'+id);
    if(previous!==undefined){const e=normalized(previous);if(e.requestSha256!==fingerprint)return fail('idempotency-conflict');return {receipt:await inspectEvent(tx,e,c,ref,releasePrefix),head};}
    const n=await noticeValue(await tx.get(prefix+'notices/'+r.noticeId),c);if(n.scopeId!==c.scopeId||r.activities.some(a=>!(n.activities as JsonValue[]).includes(a)))return fail('scope-mismatch');await verifyArchive(tx,n,c,releasePrefix);
    let at:string;try{at=(c.now??(()=>new Date()))().toISOString();if(!iso(at))throw new Error();}catch{return fail('invalid-clock');}
    if(!Number.isSafeInteger(head.revision+1))return fail('invalid-record');
    const restrictions=activityNames.filter(a=>r.activities.includes(a as ProcessingActivity)||head.event?.restrictions.includes(a as ProcessingActivity)) as ProcessingActivity[];
    const e:ObjectValue={id,kind:'processing-restriction',siteId:c.siteId,scopeId:c.scopeId,streamRef:ref,revision:head.revision+1,noticeId:r.noticeId,artifactId:n.artifactId!,requestId:r.requestId,activities:r.activities,restrictions,occurredAt:at,provenance:c.provenance,requestSha256:fingerprint,supersededRevision:head.revision};
    const receipt=receiptFor(e,c,ref);await tx.put(prefix+'events/'+id,e);await tx.put(prefix+'heads/'+ref,{id,revision:receipt.revision,siteId:c.siteId,scopeId:c.scopeId,streamRef:ref});return {receipt,head:{...head,revision:receipt.revision,event:receipt}};
  });
}
/** @requirements REQ-PRODUCT-PROCESSING-CHOICES Authorized event search, excluding internal notice/head keys. */
export function createProcessingRestrictionStore(storage:HistoryStorage,c:ProcessingStoreOptions):RecordStore{
  c={...c};const {prefix,releasePrefix}=options(storage,c),eventPrefix=prefix+'events/';
  const inspect=async(value:unknown,key:string):Promise<JsonValue>=>{
    const e=normalized(value);if(e.kind!=='processing-restriction'||e.siteId!==c.siteId||!slug(e.scopeId)||!hash(e.streamRef)||e.id!==key.slice(eventPrefix.length))return fail('scope-mismatch');
    return storage.transaction(async tx=>{
      const retired=await retiredEvidenceProjection(tx,prefix,'processing',c.siteId,String(e.streamRef),String(e.id));if(retired)return retired;
      await inspectEvent(tx,e,{...c,scopeId:String(e.scopeId),streamId:'not-used'},String(e.streamRef),releasePrefix);
      return {...e,notice:await noticeValue(await tx.get(prefix+'notices/'+e.noticeId),c),currentHead:await headFor(tx,{...c,scopeId:String(e.scopeId),streamId:'not-used'},String(e.streamRef),releasePrefix) as unknown as JsonValue};
    });
  };
  const scoped:DurableStorage={async get<T>(key:string){const value=await storage.get(key);return value===undefined?undefined:await inspect(value,key) as T;},async list<T>(query:{prefix:string;startAfter?:string;limit:number}){const result=new Map<string,T>();for(const [key,value] of await storage.list(query))result.set(key,await inspect(value,key) as T);return result;}};
  return createDurableObjectStore(scoped,{prefix:eventPrefix});
}
