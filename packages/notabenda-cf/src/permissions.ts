// @requirements REQ-PRODUCT-RECORDING-INSPECTION
import {recordingTarget} from './recording-selection.js';
import type {RecordingSelection} from './recording-selection.js';
// @requirements REQ-PRODUCT-LOCALIZATION
import {normalizeFormPermissionLocalization,selectFormPermissionLocalization} from './form-permission-localization-policy.js';
import type {FormPermissionLocalization} from './form-permission-localization-policy.js';
// @requirements REQ-EU-CONSENT REQ-CA-MEANINGFUL REQ-EU-MARKETING REQ-CA-CASL-OPTIN
/** @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-SCOPE-GUARDS */
import {canonicalJson,sha256,validateStoredLegalRelease} from './history.js';
import type {HistoryStorage,HistoryTransaction} from './history.js';
import {normalizeRecord,boundedText} from './records.js';
import {createDurableObjectStore} from './store.js';
import {assertEvidenceContextActive,retiredEvidenceProjection} from './lifecycle.js';
import {normalizeScopeGuardPolicy,scopeGuardContext,scopeGuardFields} from './scope-guard-policy.js';
import type {JsonValue,RecordStore,DurableStorage} from './types.js';
type Value=Record<string,JsonValue>;
export interface FormPermissionStoreOptions {siteId:string;prefix?:string;releasePrefix?:string;allowPreview?:boolean}
export interface FormPermissionContext extends FormPermissionStoreOptions {permissionId:string}
export interface FormPermissionStreamContext extends FormPermissionContext {
  /** Trusted person/contact-generation binding. Changing the destination MUST change this value. Never a bearer token or raw address. */
  streamId:string;now?:()=>Date;
}
export interface FormPermissionReceipt {schemaVersion:1;id:string;siteId:string;permissionId:string;streamRef:string;offerId:string;artifactId:string;requestId:string;action:'grant'|'withdraw';revision:number;activationRevision:number;clientAt:string;recordedAt:string}
export interface FormPermissionState {schemaVersion:1;siteId:string;permissionId:string;streamRef:string;revision:number;event:FormPermissionReceipt|null;activeOfferId:string|null;activeRevision:number;grantAllowed:boolean;permitted:boolean;reason:'granted'|'not-granted'|'withdrawn'|'offer-changed'|'inactive'|'scope-restricted'}
export interface FormPermissionResult {receipt:FormPermissionReceipt;state:FormPermissionState}
export class FormPermissionRecordError extends Error {constructor(readonly code:'invalid-offer'|'invalid-request'|'invalid-record'|'scope-mismatch'|'idempotency-conflict'|'stale-offer'|'revision-conflict'|'scope-restricted'|'expired-command'|'invalid-clock'){super(code);this.name='FormPermissionRecordError';}}
const fail=(code:FormPermissionRecordError['code']):never=>{throw new FormPermissionRecordError(code);};
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const text=(v:unknown,max=2000):v is string=>boundedText(v,max)&&!!v.trim();
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const iso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const object=(v:JsonValue|undefined):Value=>v&&typeof v==='object'&&!Array.isArray(v)?v:fail('invalid-record');
const exact=(v:Value,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function normalized(input:unknown,code:FormPermissionRecordError['code']='invalid-record',bytes=65536):Value{try{return object(normalizeRecord({id:'value',data:input},bytes).data);}catch{return fail(code);}}
function options(storage:HistoryStorage,context:FormPermissionStoreOptions){if(!slug(context.siteId)||typeof storage.transaction!=='function')return fail('scope-mismatch');const prefix=context.prefix??`notabenda/permissions/${context.siteId}/`,releasePrefix=context.releasePrefix??'notabenda/releases/';createDurableObjectStore(storage,{prefix});createDurableObjectStore(storage,{prefix:releasePrefix});return {prefix,releasePrefix};}
function safeLink(v:unknown):boolean {
  if(typeof v!=='string'||v.length>2048||/[\s\u0000-\u001f\u007f\\]/u.test(v))return false;
  if(/^\/(?!\/)/u.test(v))return !/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/iu.test(v);
  if(/^mailto:[a-zA-Z0-9.!$&'*+\/=^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/u.test(v))return true;
  try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}
}
async function offerValue(input:unknown,context:FormPermissionStoreOptions):Promise<Value>{
  const n=normalized(input,'invalid-offer',32768);
  if(!exact(n,['schemaVersion','offerId','siteId','permissionId','purposeId','channel','revision','artifactId','mode','reviewStatus','document','facts','wording','withdrawalUrl','deliveryWindowSeconds',...(n.schemaVersion===2?['localization']:[])])||(n.schemaVersion!==1&&n.schemaVersion!==2)||!hash(n.offerId)||!hash(n.artifactId)||n.siteId!==context.siteId||!slug(n.permissionId)||!slug(n.purposeId)||!text(n.revision,200)||!['production','preview'].some(v=>n.mode===v)||!['draft','reviewed'].some(v=>n.reviewStatus===v)||!safeLink(n.withdrawalUrl)||!Number.isInteger(n.deliveryWindowSeconds)||Number(n.deliveryWindowSeconds)<30||Number(n.deliveryWindowSeconds)>3600)return fail('invalid-offer');
  if(n.schemaVersion===2){try{normalizeFormPermissionLocalization(n.localization,{allowPreview:context.allowPreview===true});}catch{return fail('invalid-offer');}}
  const c=object(n.channel),w=object(n.wording),d=object(n.document),f=object(n.facts);
  if(!exact(c,['id','label'])||!slug(c.id)||!text(c.label,120)||!exact(w,['title','statement','grantLabel','withdrawLabel','optionality','withdrawalExplanation'])||Object.entries(w).some(([k,v])=>!text(v,k.endsWith('Label')?120:k==='title'?300:2000))||!exact(f,['controller','purpose','recipients','privacy','scopeGuard'])||!exact(d,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus'])||!text(d.title,300)||!text(d.version,200)||d.url!==`/artifacts/${n.artifactId}/privacy.html`||!hash(d.sha256)||!hash(d.contentSha256)||typeof d.effectiveDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate)||!Number.isFinite(Date.parse(d.effectiveDate))||new Date(d.effectiveDate).toISOString().slice(0,10)!==d.effectiveDate||!['draft','reviewed'].some(v=>d.reviewStatus===v))return fail('invalid-offer');
  if(!context.allowPreview&&(n.mode!=='production'||n.reviewStatus!=='reviewed'||d.reviewStatus!=='reviewed'))return fail('invalid-offer');
  const {offerId:_,...descriptor}=n;if(await sha256(canonicalJson(descriptor))!==n.offerId)return fail('invalid-offer');return n;
}
/** Reconstruct disclosed processing facts from the independently validated archive, including non-cookie purpose guards. */
async function verifyArchive(tx:Pick<HistoryTransaction,'get'>,offer:Value,context:FormPermissionStoreOptions,releasePrefix:string):Promise<boolean>{
  let a:Value;try{a=await validateStoredLegalRelease(await tx.get(releasePrefix+offer.artifactId));}catch{return fail('invalid-offer');}
  const m=object(a.manifest),c=object(a.publicConfig);if(m.siteId!==context.siteId||m.artifactId!==offer.artifactId||m.mode!==offer.mode||object(c.site).id!==context.siteId)return fail('scope-mismatch');
  if(!Array.isArray(c.purposes)||!Array.isArray(c.services))return fail('invalid-offer');const purpose=c.purposes.map(object).find(p=>p.id===offer.purposeId);if(!purpose||!['direct','both'].includes(String(object(purpose.collection).source)))return fail('invalid-offer');
  let policy;try{policy=c.scopeGuards===undefined?undefined:normalizeScopeGuardPolicy(c.scopeGuards,c.purposes.map(p=>String(object(p).id)));}catch{return fail('invalid-offer');}
  const scopeGuard=scopeGuardContext(policy,String(offer.purposeId))??null;
  const recipients=c.services.map(object).filter(s=>Array.isArray(s.purposeIds)&&s.purposeIds.includes(offer.purposeId!)).map(s=>({id:s.id!,name:s.name!,provider:s.provider!,location:s.location!,purposeIds:[offer.purposeId!],...(s.privacyUrl?{privacyUrl:s.privacyUrl}:{})}));
  const privacy=object(c.privacy);const facts={controller:c.controller!,purpose,recipients,privacy:{rights:privacy.rights!,transfers:privacy.transfers!,automatedDecisions:privacy.automatedDecisions!,complaints:privacy.complaints!,...(privacy.rightsUrl?{rightsUrl:privacy.rightsUrl}:{})},scopeGuard};
  if(canonicalJson(facts as unknown as JsonValue)!==canonicalJson(offer.facts!))return fail('invalid-offer');
  if(c.localization!==undefined&&object(c.localization).formPermission!==undefined){
    let selected:FormPermissionLocalization;try{selected=normalizeFormPermissionLocalization(selectFormPermissionLocalization(object(c.localization) as unknown as FormPermissionLocalization),{locale:String(object(c.site).locale),allowPreview:context.allowPreview===true});}catch{return fail('invalid-offer');}
    if(offer.schemaVersion!==2||canonicalJson(selected as unknown as JsonValue)!==canonicalJson(offer.localization!))return fail('invalid-offer');
  }else if(offer.localization!==undefined||!/^en(?:-|$)/iu.test(String(object(c.site).locale)))return fail('invalid-offer');
  const d=object((m.documents as JsonValue[]).find(raw=>object(raw).kind==='privacy')),given=object(offer.document);for(const key of ['title','version','effectiveDate','sha256','contentSha256','reviewStatus'])if(d[key]!==given[key])return fail('invalid-offer');
  return scopeGuard!==null&&scopeGuardFields.every(field=>scopeGuard.facts[field]==='absent');
}
function scoped(context:FormPermissionContext){if(!slug(context.permissionId))return fail('scope-mismatch');}
export async function registerFormPermissionOffer(storage:HistoryStorage,input:unknown,context:FormPermissionStoreOptions):Promise<{offerId:string;created:boolean}>{
  context={...context};const {prefix,releasePrefix}=options(storage,context),offer=await offerValue(input,context),offerId=String(offer.offerId);
  return storage.transaction(async tx=>{
    await verifyArchive(tx,offer,context,releasePrefix);const binding={purposeId:offer.purposeId!,channelId:object(offer.channel).id!};const definitionKey=prefix+'definitions/'+offer.permissionId,definition=await tx.get(definitionKey);
    if(definition!==undefined&&canonicalJson(normalized(definition))!==canonicalJson(binding))return fail('scope-mismatch');
    const revisionKey=prefix+'revisions/'+offer.permissionId+'/'+await sha256(String(offer.revision)),previousRevision=await tx.get(revisionKey);
    if(previousRevision!==undefined&&previousRevision!==offerId)return fail('idempotency-conflict');
    const key=prefix+'offers/'+offerId,prior=await tx.get(key);if(prior!==undefined){if(canonicalJson(await offerValue(prior,context))!==canonicalJson(offer))return fail('idempotency-conflict');return {offerId,created:false};}
    await tx.put(definitionKey,binding);await tx.put(revisionKey,offerId);await tx.put(key,offer);return {offerId,created:true};
  });
}
interface Active {offerId:string|null;revision:number}
async function activeFor(tx:HistoryTransaction,prefix:string,permissionId:string):Promise<Active>{const raw=await tx.get(prefix+'active/'+permissionId);if(raw===undefined)return {offerId:null,revision:0};const p=normalized(raw);if(!exact(p,['offerId','revision'])||!(p.offerId===null||hash(p.offerId))||!integer(p.revision)||p.revision<1)return fail('invalid-record');return p as unknown as Active;}
/** Activation changes invalidate old grants even when the host later reactivates an older offer. */
export async function setActiveFormPermissionOffer(storage:HistoryStorage,offerId:string|null,context:FormPermissionContext):Promise<void>{
  context={...context};scoped(context);const {prefix,releasePrefix}=options(storage,context);if(offerId!==null&&!hash(offerId))return fail('invalid-offer');
  await storage.transaction(async tx=>{if(offerId!==null){const offer=await offerValue(await tx.get(prefix+'offers/'+offerId),context);if(offer.permissionId!==context.permissionId)return fail('scope-mismatch');await verifyArchive(tx,offer,context,releasePrefix);}const prior=await activeFor(tx,prefix,context.permissionId);if(prior.offerId===offerId)return;if(prior.revision>=Number.MAX_SAFE_INTEGER)return fail('invalid-record');await tx.put(prefix+'active/'+context.permissionId,{offerId,revision:prior.revision+1});});
}
/** Read activation without selecting a person/contact stream or testing an individual's grant. */
export async function getFormPermissionRecordingSelection(storage:HistoryStorage,context:FormPermissionContext):Promise<RecordingSelection>{
 context={...context};scoped(context);const {prefix,releasePrefix}=options(storage,context);
 return storage.transaction(async tx=>{
  const active=await activeFor(tx,prefix,context.permissionId),base={schemaVersion:1 as const,family:'form-permission' as const,siteId:context.siteId,scopeId:context.permissionId,selected:null,activationRevision:active.revision};
  if(active.offerId===null)return {...base,status:active.revision===0?'unconfigured':'inactive'};
  const offer=await offerValue(await tx.get(prefix+'offers/'+active.offerId),context);if(offer.permissionId!==context.permissionId||offer.offerId!==active.offerId)return fail('scope-mismatch');await verifyArchive(tx,offer,context,releasePrefix);
  return {...base,status:'selected',selected:recordingTarget(offer,String(offer.offerId),object(offer.document))};
 });
}
export async function formPermissionStreamRef(context:Pick<FormPermissionStreamContext,'siteId'|'permissionId'|'streamId'>):Promise<string>{if(!slug(context.siteId)||!slug(context.permissionId)||!text(context.streamId,200))return fail('scope-mismatch');return sha256(canonicalJson([context.siteId,context.permissionId,context.streamId]));}
function receiptFor(event:Value,context:FormPermissionContext,ref:string):FormPermissionReceipt{
  if(event.kind!=='form-permission'||event.siteId!==context.siteId||event.scopeId!==context.permissionId||event.permissionId!==context.permissionId||event.streamRef!==ref||!hash(event.id)||!hash(event.offerId)||!hash(event.artifactId)||!uuid(event.requestId)||!['grant','withdraw'].some(v=>event.action===v)||!integer(event.revision)||event.revision<1||!integer(event.activationRevision)||!iso(event.clientAt)||!iso(event.occurredAt))return fail('invalid-record');
  return {schemaVersion:1,id:event.id,siteId:context.siteId,permissionId:context.permissionId,streamRef:ref,offerId:event.offerId,artifactId:event.artifactId,requestId:event.requestId,action:event.action as 'grant'|'withdraw',revision:event.revision,activationRevision:event.activationRevision,clientAt:event.clientAt,recordedAt:event.occurredAt};
}
async function stateFor(tx:HistoryTransaction,context:FormPermissionContext,ref:string,prefix:string,releasePrefix:string):Promise<FormPermissionState>{
  await assertEvidenceContextActive(tx,prefix,'permissions',context.siteId,ref);const pointer=await tx.get(prefix+'heads/'+ref);let event:FormPermissionReceipt|null=null;
  if(pointer!==undefined){const p=normalized(pointer);if(!exact(p,['id','revision','siteId','scopeId','streamRef'])||!hash(p.id)||!integer(p.revision)||p.siteId!==context.siteId||p.scopeId!==context.permissionId||p.streamRef!==ref)return fail('invalid-record');const raw=normalized(await tx.get(prefix+'events/'+p.id));event=receiptFor(raw,context,ref);if(event.id!==p.id||event.revision!==p.revision)return fail('invalid-record');const offer=await offerValue(await tx.get(prefix+'offers/'+event.offerId),context);if(offer.permissionId!==context.permissionId||offer.artifactId!==event.artifactId||canonicalJson(offer)!==canonicalJson(raw.offer!))return fail('invalid-record');}
  const active=await activeFor(tx,prefix,context.permissionId);let grantAllowed=false;
  if(active.offerId!==null){const offer=await offerValue(await tx.get(prefix+'offers/'+active.offerId),context);if(offer.permissionId!==context.permissionId)return fail('scope-mismatch');grantAllowed=await verifyArchive(tx,offer,context,releasePrefix);}
  const reason:FormPermissionState['reason']=active.offerId===null?'inactive':!grantAllowed?'scope-restricted':event===null?'not-granted':event.action==='withdraw'?'withdrawn':event.offerId!==active.offerId||event.activationRevision!==active.revision?'offer-changed':'granted';
  return {schemaVersion:1,siteId:context.siteId,permissionId:context.permissionId,streamRef:ref,revision:event?.revision??0,event,activeOfferId:active.offerId,activeRevision:active.revision,grantAllowed,permitted:reason==='granted',reason};
}
/** Evaluate at the point of downstream use. Historical receipts and frontend snapshots are not eligibility decisions. */
export async function getFormPermissionState(storage:HistoryStorage,context:FormPermissionStreamContext):Promise<FormPermissionState>{context={...context};scoped(context);const {prefix,releasePrefix}=options(storage,context),ref=await formPermissionStreamRef(context);return storage.transaction(tx=>stateFor(tx,context,ref,prefix,releasePrefix));}
export async function recordFormPermission(storage:HistoryStorage,input:unknown,context:FormPermissionStreamContext):Promise<FormPermissionResult>{
  context={...context};scoped(context);const {prefix,releasePrefix}=options(storage,context),ref=await formPermissionStreamRef(context),r=normalized(input,'invalid-request',2048);
  if(!['grant','withdraw'].some(v=>r.action===v)||!exact(r,['schemaVersion','offerId','requestId','action','clientAt','expectedStreamRef',...(r.action==='grant'?['expectedRevision','expectedActivation']:[])])||r.schemaVersion!==1||!hash(r.expectedStreamRef)||!hash(r.offerId)||!uuid(r.requestId)||!iso(r.clientAt)||r.action==='grant'&&(!integer(r.expectedRevision)||!integer(r.expectedActivation)))return fail('invalid-request');
  if(r.expectedStreamRef!==ref)return fail('scope-mismatch');
  const id=await sha256(canonicalJson([ref,r.requestId])),digest=await sha256(canonicalJson(r));
  return storage.transaction(async tx=>{
    await assertEvidenceContextActive(tx,prefix,'permissions',context.siteId,ref);const prior=await tx.get(prefix+'events/'+id);
    if(prior!==undefined){const event=normalized(prior);if(event.requestSha256!==digest)return fail('idempotency-conflict');return {receipt:receiptFor(event,context,ref),state:await stateFor(tx,context,ref,prefix,releasePrefix)};}
    const offer=await offerValue(await tx.get(prefix+'offers/'+r.offerId),context);if(offer.permissionId!==context.permissionId)return fail('scope-mismatch');await verifyArchive(tx,offer,context,releasePrefix);
    const current=await stateFor(tx,context,ref,prefix,releasePrefix);let at:string;try{at=(context.now?.()??new Date()).toISOString();if(!iso(at))return fail('invalid-clock');}catch{return fail('invalid-clock');}
    if(r.action==='grant'){
      if(current.activeOfferId!==r.offerId||current.activeRevision!==r.expectedActivation)return fail('stale-offer');if(!current.grantAllowed)return fail('scope-restricted');if(current.revision!==r.expectedRevision)return fail('revision-conflict');const age=Date.parse(at)-Date.parse(String(r.clientAt));if(age< -30000||age>Number(offer.deliveryWindowSeconds)*1000)return fail('expired-command');
    }
    if(current.revision>=Number.MAX_SAFE_INTEGER)return fail('invalid-record');
    const event={id,kind:'form-permission',siteId:context.siteId,scopeId:context.permissionId,permissionId:context.permissionId,streamRef:ref,requestId:r.requestId,requestSha256:digest,offerId:r.offerId,artifactId:offer.artifactId!,purposeId:offer.purposeId!,channel:offer.channel!,action:r.action!,clientAt:r.clientAt,occurredAt:at,revision:current.revision+1,activationRevision:current.activeRevision,offer,provenance:{source:'host-received-assertion',identity:'Host binds the person and contact generation; this record does not verify a human, address ownership, delivery, or legal validity.'}};
    const checked=normalized(event),receipt=receiptFor(checked,context,ref);await tx.put(prefix+'events/'+id,checked);await tx.put(prefix+'heads/'+ref,{id,revision:receipt.revision,siteId:context.siteId,scopeId:context.permissionId,streamRef:ref});return {receipt,state:await stateFor(tx,context,ref,prefix,releasePrefix)};
  });
}
/** Scoped inspection/export includes a separately labeled evaluation at read time. Retired payloads remain withheld. */
export function createFormPermissionStore(storage:HistoryStorage,context:FormPermissionStoreOptions):RecordStore{
  context={...context};const {prefix,releasePrefix}=options(storage,context),eventPrefix=prefix+'events/';
  const inspect=(key:string,raw:unknown)=>storage.transaction(async tx=>{const e=normalized(raw);if(e.kind!=='form-permission'||e.siteId!==context.siteId||e.id!==key.slice(eventPrefix.length)||!slug(e.permissionId)||!hash(e.streamRef))return fail('scope-mismatch');const projected=await retiredEvidenceProjection(tx,prefix,'permissions',context.siteId,e.streamRef,String(e.id));if(projected)return projected;return {...e,currentState:await stateFor(tx,{...context,permissionId:e.permissionId},e.streamRef,prefix,releasePrefix)} as unknown as JsonValue;});
  const scopedStorage:DurableStorage={async get<T>(key:string){const raw=await storage.get(key);return raw===undefined?undefined:await inspect(key,raw) as T;},async list<T>(query:{prefix:string;startAfter?:string;limit:number}){const values=await storage.list(query),out=new Map<string,T>();for(const [key,raw] of values)out.set(key,await inspect(key,raw) as T);return out;}};
  return createDurableObjectStore(scopedStorage,{prefix:eventPrefix});
}
