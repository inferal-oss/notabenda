// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION
import {normalizeContractActionLocalization,selectContractActionLocalization} from './contract-action-localization.js';
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-DE-CANCEL REQ-DE-WITHDRAWAL REQ-EU-WITHDRAWAL REQ-BR-CONTRACT
import {normalizeContractActionDefinition,normalizeContractActionRequest,contractActionAcknowledgement,contractActionHash,contractActionUuid,contractActionIso} from './contract-action-policy.js';
import type {ContractActionDefinition,ContractActionRequest,ContractActionReceipt} from './contract-action-policy.js';
import {canonicalJson,sha256,validateStoredLegalRelease} from './history.js';
import type {HistoryStorage,HistoryTransaction} from './history.js';
import {normalizeRecord,boundedText} from './records.js';
import {createDurableObjectStore} from './store.js';
import {assertEvidenceContextActive,retiredEvidenceProjection} from './lifecycle.js';
import type {JsonValue,RecordStore,DurableStorage} from './types.js';
export type {ContractActionDefinition,ContractActionRequest,ContractActionReceipt} from './contract-action-policy.js';
export interface ContractActionStoreOptions {siteId:string;prefix?:string;releasePrefix?:string;allowPreview?:boolean}
export interface ContractActionContext extends ContractActionStoreOptions {actionId:string;now?:()=>Date}
export interface ContractDeclarationContext extends ContractActionContext {operationId:string}
export type ContractDeliveryChannel='application'|'acknowledgement';
interface Delivery {deliveryId:string;payloadSha256:string;status:'pending'|'leased'|'uncertain'|'accepted'|'cancelled';version:number;attempts:number;lease:null|{token:string;expiresAt:string};providerRef:string|null;updatedAt:string}
interface Declaration {id:string;kind:'contract-declaration';siteId:string;scopeId:string;streamRef:string;requestId:string;operationRef:string;occurredAt:string;definition:ContractActionDefinition;request:ContractActionRequest;receipt:ContractActionReceipt;delivery:Record<ContractDeliveryChannel,Delivery>}
export interface ContractDeliveryLease {id:string;channel:ContractDeliveryChannel;deliveryId:string;payloadSha256:string;token:string;version:number;expiresAt:string;definition:ContractActionDefinition;request:ContractActionRequest;receipt:ContractActionReceipt}
export class ContractActionRecordError extends Error {constructor(readonly code:'invalid-definition'|'invalid-request'|'invalid-record'|'scope-mismatch'|'idempotency-conflict'|'invalid-clock'|'invalid-delivery'|'revision-conflict'){super(code);this.name='ContractActionRecordError';}}
const fail=(code:ContractActionRecordError['code']):never=>{throw new ContractActionRecordError(code);};
const json=(v:unknown)=>v as JsonValue;
const text=(v:unknown,max=200):v is string=>boundedText(v,max)&&!!v.trim();
const slug=(v:unknown):v is string=>text(v,120)&&/^[a-z][a-z0-9-]*$/u.test(v);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const channels:readonly ContractDeliveryChannel[]=['application','acknowledgement'];
function normalized(input:unknown):Record<string,unknown>{try{const value=normalizeRecord({id:'value',data:input}).data;if(!object(value))return fail('invalid-record');return value;}catch{return fail('invalid-record');}}
function options(storage:HistoryStorage,context:ContractActionStoreOptions){if(!slug(context.siteId)||typeof storage.transaction!=='function')return fail('scope-mismatch');const prefix=context.prefix??`notabenda/contracts/${context.siteId}/`,releasePrefix=context.releasePrefix??'notabenda/releases/';createDurableObjectStore(storage,{prefix});createDurableObjectStore(storage,{prefix:releasePrefix});return {prefix,releasePrefix};}
function contextValue(context:ContractActionContext){if(!slug(context.actionId))return fail('scope-mismatch');}
function now(context:ContractActionContext){try{const at=(context.now?.()??new Date()).toISOString();if(!contractActionIso(at))return fail('invalid-clock');return at;}catch{return fail('invalid-clock');}}
async function definitionValue(input:unknown,context:ContractActionStoreOptions):Promise<ContractActionDefinition>{
 let d:ContractActionDefinition;try{d=normalizeContractActionDefinition(normalized(input),{allowPreview:context.allowPreview===true});}catch{return fail('invalid-definition');}
 if(d.siteId!==context.siteId)return fail('scope-mismatch');const {definitionId:_,...descriptor}=d;if(await sha256(canonicalJson(json(descriptor)))!==d.definitionId)return fail('invalid-definition');return d;
}
async function verifyArchive(tx:Pick<HistoryTransaction,'get'>,d:ContractActionDefinition,releasePrefix:string){
 let a:Record<string,JsonValue>;try{a=await validateStoredLegalRelease(await tx.get(releasePrefix+d.artifactId));}catch{return fail('invalid-definition');}
 const m=a.manifest as Record<string,JsonValue>;
 if(m.siteId!==d.siteId||m.artifactId!==d.artifactId||m.mode!==d.mode||!Array.isArray(m.documents))return fail('scope-mismatch');
 const config=object(a.publicConfig)?a.publicConfig:{},localization=object(config.localization)?config.localization:undefined;
 // A selected dictionary cannot be bypassed by registering a legacy definition.
 if((localization?.contractActions!==undefined)!==(d.schemaVersion===2))return fail('invalid-definition');
 if(d.schemaVersion===2){
  const site=object(config.site)?config.site:{};
  if(!contractActionHash(m.configSha256)||site.id!==d.siteId||site.locale!==d.locale||m.locale!==d.locale)return fail('invalid-definition');
  try{
   const archived=normalizeContractActionLocalization(selectContractActionLocalization(localization as unknown as Parameters<typeof selectContractActionLocalization>[0]),{locale:d.locale,allowPreview:d.mode==='preview'});
   if(canonicalJson(json(archived))!==canonicalJson(json(d.localization)))return fail('invalid-definition');
  }catch{return fail('invalid-definition');}
 }
 for(const kind of ['terms','privacy'] as const){const reference=d.documents[kind],archived=m.documents.find(raw=>object(raw)&&raw.kind===kind);if(!object(archived))return fail('invalid-definition');for(const key of ['title','version','effectiveDate','sha256','contentSha256','reviewStatus'] as const)if(archived[key]!==reference[key])return fail('invalid-definition');}
}
/** Registration retains old definitions. It never decides the original contract's applicable terms or a withdrawal window. */
export async function registerContractActionDefinition(storage:HistoryStorage,input:unknown,context:ContractActionStoreOptions):Promise<{definitionId:string;created:boolean}>{
 context={...context};const {prefix,releasePrefix}=options(storage,context),d=await definitionValue(input,context);
 return storage.transaction(async tx=>{await verifyArchive(tx,d,releasePrefix);const meaningKey=prefix+'actions/'+d.actionId,meaning=await tx.get(meaningKey);if(meaning!==undefined&&meaning!==d.profile)return fail('scope-mismatch');await tx.put(meaningKey,d.profile);const key=prefix+'definitions/'+d.definitionId,revision=prefix+'revisions/'+await sha256(canonicalJson([d.actionId,d.revision]));const prior=await tx.get(revision);if(prior!==undefined&&prior!==d.definitionId)return fail('idempotency-conflict');const existing=await tx.get(key);if(existing!==undefined){if(canonicalJson(json(await definitionValue(existing,context)))!==canonicalJson(json(d)))return fail('idempotency-conflict');return {definitionId:d.definitionId,created:false};}await tx.put(key,d);await tx.put(revision,d.definitionId);return {definitionId:d.definitionId,created:true};});
}
export async function contractActionOperationRef(context:Pick<ContractDeclarationContext,'siteId'|'actionId'|'operationId'>):Promise<string>{if(!slug(context.siteId)||!slug(context.actionId)||!text(context.operationId))return fail('scope-mismatch');return sha256(canonicalJson([context.siteId,context.actionId,context.operationId]));}
/** Lifecycle identity is one declaration, never a person or their ability to make future declarations. */
export async function contractDeclarationRef(context:Pick<ContractActionContext,'siteId'|'actionId'>,requestId:string):Promise<string>{if(!slug(context.siteId)||!slug(context.actionId)||!contractActionUuid(requestId))return fail('invalid-request');return sha256(canonicalJson([context.siteId,context.actionId,requestId]));}
async function eventValue(input:unknown,context:ContractActionStoreOptions,id:string):Promise<Declaration>{
 const e=normalized(input);if(e.kind!=='contract-declaration'||e.id!==id||e.siteId!==context.siteId||!slug(e.scopeId)||!contractActionHash(e.streamRef)||!contractActionHash(e.operationRef)||!contractActionUuid(e.requestId)||!contractActionIso(e.occurredAt))return fail('scope-mismatch');
 const d=await definitionValue(e.definition,context);let request:ContractActionRequest;try{request=normalizeContractActionRequest(e.request,d);}catch{return fail('invalid-record');}
 if(d.actionId!==e.scopeId||request.requestId!==e.requestId||await contractDeclarationRef({siteId:context.siteId,actionId:d.actionId},request.requestId)!==e.streamRef||await sha256(canonicalJson([e.streamRef,request.requestId]))!==id)return fail('invalid-record');
 const r=e.receipt;if(!object(r)||r.id!==id||r.schemaVersion!==1||r.definitionId!==d.definitionId||r.operationRef!==e.operationRef||r.requestId!==request.requestId||r.receivedAt!==e.occurredAt||r.requestSha256!==await sha256(canonicalJson(json(request)))||r.stage!=='received'||!object(r.acknowledgement)||r.acknowledgement.status!=='pending'||r.acknowledgement.text!==contractActionAcknowledgement(d,request,String(e.occurredAt))||r.acknowledgement.sha256!==await sha256(String(r.acknowledgement.text)))return fail('invalid-record');
 const digest=await sha256(canonicalJson(json({definition:d,request,receipt:r})));if(!object(e.delivery)||Object.keys(e.delivery).length!==2)return fail('invalid-record');
 for(const channel of channels){const job=e.delivery[channel];if(!object(job)||job.deliveryId!==await sha256(canonicalJson([id,channel]))||job.payloadSha256!==digest||typeof job.status!=='string'||!['pending','leased','uncertain','accepted','cancelled'].includes(job.status)||!Number.isSafeInteger(job.version)||Number(job.version)<0||!Number.isSafeInteger(job.attempts)||Number(job.attempts)<0||!contractActionIso(job.updatedAt)||!(job.providerRef===null||text(job.providerRef))||job.status==='accepted'&&job.providerRef===null||!(job.lease===null||object(job.lease)&&contractActionUuid(job.lease.token)&&contractActionIso(job.lease.expiresAt))||(job.status==='leased')!==(job.lease!==null))return fail('invalid-record');}
 return e as unknown as Declaration;
}
/** Atomically captures visitor claims and BOTH jobs. No identity/contract match, network call, refund or cancellation is performed. */
export async function recordContractDeclaration(storage:HistoryStorage,input:unknown,context:ContractDeclarationContext):Promise<ContractActionReceipt>{
 context={...context};contextValue(context);const {prefix,releasePrefix}=options(storage,context),operationRef=await contractActionOperationRef(context),raw=normalized(input);if(!contractActionHash(raw.definitionId)||!contractActionUuid(raw.requestId))return fail('invalid-request');
 const ref=await contractDeclarationRef(context,raw.requestId),id=await sha256(canonicalJson([ref,raw.requestId]));
 return storage.transaction(async tx=>{
  await assertEvidenceContextActive(tx,prefix,'contracts',context.siteId,ref);
  const d=await definitionValue(await tx.get(prefix+'definitions/'+raw.definitionId),context);if(d.actionId!==context.actionId)return fail('scope-mismatch');let request:ContractActionRequest;try{request=normalizeContractActionRequest(raw,d);}catch{return fail('invalid-request');}
  const digest=await sha256(canonicalJson(json(request))),prior=await tx.get(prefix+'events/'+id);
  if(prior!==undefined){const e=await eventValue(prior,context,id);if(e.operationRef!==operationRef)return fail('scope-mismatch');if(e.receipt.requestSha256!==digest)return fail('idempotency-conflict');return structuredClone(e.receipt);}
  await verifyArchive(tx,d,releasePrefix);const at=now(context),ack=contractActionAcknowledgement(d,request,at);
  const receipt:ContractActionReceipt={schemaVersion:1,id,definitionId:d.definitionId,requestId:request.requestId,operationRef,receivedAt:at,requestSha256:digest,stage:'received',acknowledgement:{status:'pending',text:ack,sha256:await sha256(ack)}};
  const payloadSha256=await sha256(canonicalJson(json({definition:d,request,receipt}))),delivery={} as Declaration['delivery'];
  for(const channel of channels)delivery[channel]={deliveryId:await sha256(canonicalJson([id,channel])),payloadSha256,status:'pending',version:0,attempts:0,lease:null,providerRef:null,updatedAt:at};
  const event:Declaration={id,kind:'contract-declaration',siteId:context.siteId,scopeId:context.actionId,streamRef:ref,requestId:request.requestId,operationRef,occurredAt:at,definition:d,request,receipt,delivery};
  await tx.put(prefix+'events/'+id,await eventValue(event,context,id));return structuredClone(receipt);
 });
}
async function load(tx:HistoryTransaction,prefix:string,id:string,context:ContractActionContext):Promise<Declaration>{if(!contractActionHash(id))return fail('invalid-request');const e=await eventValue(await tx.get(prefix+'events/'+id),context,id);if(e.scopeId!==context.actionId)return fail('scope-mismatch');await assertEvidenceContextActive(tx,prefix,'contracts',context.siteId,e.streamRef);return e;}
/** No delivery scheduler is installed. Host runners claim each channel independently; provider idempotency on deliveryId is mandatory. */
export async function claimContractDelivery(storage:HistoryStorage,id:string,channel:ContractDeliveryChannel,context:ContractActionContext,optionsInput:{leaseMs?:number;maxAttempts?:number}={}):Promise<ContractDeliveryLease|undefined>{
 context={...context};contextValue(context);const {prefix}=options(storage,context),leaseMs=optionsInput.leaseMs??60000,maxAttempts=optionsInput.maxAttempts??10;
 if(!channels.includes(channel)||!Number.isInteger(leaseMs)||leaseMs<1000||leaseMs>300000||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>100)return fail('invalid-delivery');
 const token=crypto.randomUUID();
 return storage.transaction(async tx=>{const at=now(context),e=await load(tx,prefix,id,context),job=e.delivery[channel];if(Date.parse(at)<Date.parse(job.updatedAt)||Date.parse(at)<Date.parse(e.occurredAt))return fail('invalid-clock');if(['accepted','cancelled'].includes(job.status)||job.attempts>=maxAttempts||job.status==='leased'&&Date.parse(job.lease!.expiresAt)>Date.parse(at))return undefined;
  if(job.version>=Number.MAX_SAFE_INTEGER)return fail('invalid-record');const expiresAt=new Date(Date.parse(at)+leaseMs).toISOString();job.status='leased';job.version++;job.attempts++;job.lease={token,expiresAt};job.updatedAt=at;await tx.put(prefix+'events/'+id,e);
  return {id,channel,deliveryId:job.deliveryId,payloadSha256:job.payloadSha256,token,version:job.version,expiresAt,definition:structuredClone(e.definition),request:structuredClone(e.request),receipt:structuredClone(e.receipt)};
 });
}
/** Accepted means the configured provider/application accepted this stable job, not recipient delivery or contract fulfillment. */
export async function settleContractDelivery(storage:HistoryStorage,lease:ContractDeliveryLease,outcome:{status:'accepted';providerRef:string}|{status:'uncertain'},context:ContractActionContext):Promise<{settled:boolean}>{
 context={...context};contextValue(context);const {prefix}=options(storage,context);
 const l=normalized(lease),o=normalized(outcome);if(!contractActionHash(l.id)||!channels.includes(l.channel as ContractDeliveryChannel)||!contractActionUuid(l.token)||!Number.isSafeInteger(l.version)||!contractActionHash(l.deliveryId)||!contractActionHash(l.payloadSha256)||typeof o.status!=='string'||!['accepted','uncertain'].includes(o.status)||o.status==='accepted'&&!text(o.providerRef)||Object.keys(o).sort().join(',')!==(o.status==='accepted'?'providerRef,status':'status'))return fail('invalid-delivery');
 return storage.transaction(async tx=>{const at=now(context),e=await load(tx,prefix,l.id as string,context),job=e.delivery[l.channel as ContractDeliveryChannel];if(Date.parse(at)<Date.parse(job.updatedAt)||Date.parse(at)<Date.parse(e.occurredAt))return fail('invalid-clock');if(job.status!=='leased'||job.lease!.token!==l.token||job.version!==l.version||job.deliveryId!==l.deliveryId||job.payloadSha256!==l.payloadSha256||Date.parse(job.lease!.expiresAt)<=Date.parse(at))return {settled:false};job.status=o.status as 'accepted'|'uncertain';job.providerRef=o.status==='accepted'?String(o.providerRef):null;job.lease=null;job.updatedAt=at;await tx.put(prefix+'events/'+l.id,e);return {settled:true};});
}
/** Host-only quiescence decision. The host MUST actually stop/fence external effects before asserting externalWorkStopped. */
export async function cancelContractDelivery(storage:HistoryStorage,id:string,channel:ContractDeliveryChannel,decision:{expectedVersion:number;externalWorkStopped:true},context:ContractActionContext):Promise<void>{
 context={...context};contextValue(context);const {prefix}=options(storage,context);if(!channels.includes(channel)||!decision||decision.externalWorkStopped!==true||!Number.isSafeInteger(decision.expectedVersion))return fail('invalid-delivery');const expected=decision.expectedVersion,at=now(context);
 return storage.transaction(async tx=>{const e=await load(tx,prefix,id,context),job=e.delivery[channel];if(Date.parse(at)<Date.parse(job.updatedAt)||Date.parse(at)<Date.parse(e.occurredAt))return fail('invalid-clock');if(job.version!==expected)return fail('revision-conflict');if(job.status==='accepted'||job.status==='cancelled')return;if(job.version>=Number.MAX_SAFE_INTEGER)return fail('invalid-record');job.status='cancelled';job.version++;job.lease=null;job.updatedAt=at;await tx.put(prefix+'events/'+id,e);});
}
/** Fixed-site private inspection. Visitor request IDs are not lookup credentials; host authorization is always required. */
export function createContractDeclarationStore(storage:HistoryStorage,context:ContractActionStoreOptions):RecordStore {
 context={...context};const {prefix}=options(storage,context),eventPrefix=prefix+'events/';
 const inspect=(key:string,value:unknown)=>storage.transaction(async tx=>{const e=normalized(value);if(e.siteId!==context.siteId||e.kind!=='contract-declaration'||e.id!==key.slice(eventPrefix.length)||!contractActionHash(e.streamRef))return fail('scope-mismatch');const retired=await retiredEvidenceProjection(tx,prefix,'contracts',context.siteId,e.streamRef,String(e.id));return retired??json(await eventValue(e,context,String(e.id)));});
 const scoped:DurableStorage={async get<T>(key:string){const value=await storage.get(key);return value===undefined?undefined:await inspect(key,value) as T;},async list<T>(query:{prefix:string;startAfter?:string;limit:number}){const result=new Map<string,T>();for(const [key,value] of await storage.list(query))result.set(key,await inspect(key,value) as T);return result;}};return createDurableObjectStore(scoped,{prefix:eventPrefix});
}
