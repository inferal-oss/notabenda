// @requirements REQ-PRODUCT-LOCALIZATION
import {normalizeTermsLocalization,selectTermsLocalization} from './terms-localization-policy.js';
import type {TermsLocalization} from './terms-localization-policy.js';
// @requirements REQ-EU-RETENTION-ERASURE
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
import { canonicalJson, sha256, validateStoredLegalRelease } from './history.js';
import type { HistoryStorage, HistoryTransaction } from './history.js';
import { boundedText, normalizeRecord } from './records.js';
import { createDurableObjectStore } from './store.js';
import {assertEvidenceContextActive,retiredEvidenceProjection} from './lifecycle.js';
import type { DurableStorage, JsonValue, RecordStore } from './types.js';

type ObjectValue = Record<string, JsonValue>;
export interface TermsStoreOptions {
  /** Trusted host scope, never selected by a browser URL/payload. Use disjoint prefixes per authorized site. */
  siteId: string;
  prefix?: string;
  releasePrefix?: string;
  allowPreview?: boolean;
}
export interface TermsActionContext extends TermsStoreOptions { scopeId: string }
export interface TermsRecordingContext extends TermsActionContext {
  subjectId: string;
  operationId: string;
  /** Host/server clock. Never pass a browser-supplied timestamp here. */
  now?: () => Date;
}
export interface TermsReceipt {
  schemaVersion: 1; id: string; offerId: string; requestId: string; operationId: string;
  artifactId: string; documentSha256: string; documentVersion: string; recordedAt: string;
}
export class TermsRecordError extends Error {
  constructor(readonly code: 'invalid-request' | 'invalid-offer' | 'stale-offer' | 'scope-mismatch' | 'idempotency-conflict') { super(code); this.name = 'TermsRecordError'; }
}
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(value);
const text = (value: unknown, max:number): value is string => boundedText(value,max) && value.trim().length > 0;
const slug = (value:unknown): value is string => text(value,120) && /^[a-z][a-z0-9-]*$/u.test(value);
function object(value:JsonValue|undefined): ObjectValue { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TermsRecordError('invalid-offer'); return value; }
function exact(value:ObjectValue, keys:string[]):boolean { return Object.keys(value).length === keys.length && keys.every(key=>Object.hasOwn(value,key)); }
function options(storage:HistoryStorage, context:TermsStoreOptions): { prefix:string; releasePrefix:string } {
  if (!slug(context.siteId) || typeof storage.transaction !== 'function') throw new TermsRecordError('scope-mismatch');
  const prefix = context.prefix ?? `notabenda/terms/${context.siteId}/`; const releasePrefix = context.releasePrefix ?? 'notabenda/releases/';
  createDurableObjectStore(storage,{prefix}); createDurableObjectStore(storage,{prefix:releasePrefix});
  return { prefix, releasePrefix };
}
async function offerValue(input:unknown, context:TermsStoreOptions): Promise<ObjectValue> {
  const value = object(normalizeRecord({id:'offer',data:input},16384).data);
  if (!exact(value,['schemaVersion','offerId','siteId','scopeId','artifactId','mode','document','statement','actionLabel',...(value.schemaVersion===2?['localization']:[])]) || (value.schemaVersion !== 1&&value.schemaVersion!==2) || !hash(value.offerId) || !hash(value.artifactId) || value.siteId !== context.siteId || !slug(value.scopeId) || (value.mode!=='production'&&value.mode!=='preview') || !text(value.statement,2000) || !text(value.actionLabel,120)) throw new TermsRecordError('invalid-offer');
  if(value.schemaVersion===2){try{normalizeTermsLocalization(value.localization,{allowPreview:context.allowPreview===true});}catch{throw new TermsRecordError('invalid-offer');}}
  const doc = object(value.document);
  if (!exact(doc,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus']) || !text(doc.title,300) || !text(doc.version,200) || !hash(doc.sha256) || !hash(doc.contentSha256) || doc.url !== `/artifacts/${value.artifactId}/terms.html` || (doc.reviewStatus!=='draft'&&doc.reviewStatus!=='reviewed') || typeof doc.effectiveDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(doc.effectiveDate) || !Number.isFinite(Date.parse(doc.effectiveDate)) || new Date(doc.effectiveDate).toISOString().slice(0,10) !== doc.effectiveDate) throw new TermsRecordError('invalid-offer');
  if (!context.allowPreview && (value.mode !== 'production' || doc.reviewStatus !== 'reviewed')) throw new TermsRecordError('invalid-offer');
  const descriptor = {...value}; delete descriptor.offerId;
  if (await sha256(canonicalJson(descriptor)) !== value.offerId) throw new TermsRecordError('invalid-offer');
  return value;
}
function valueMismatch(value:JsonValue|undefined,selected:TermsLocalization):boolean{return value===undefined||canonicalJson(value)!==canonicalJson(selected as unknown as JsonValue);}
async function verifyArchive(transaction:HistoryTransaction, offer:ObjectValue, context:TermsStoreOptions, releasePrefix:string): Promise<void> {
  const release = object(normalizeRecord({id:'release',data:await transaction.get(releasePrefix + offer.artifactId)},128*1024).data);
  if (release.kind !== 'document-release') throw new TermsRecordError('invalid-offer');
  const artifact = await validateStoredLegalRelease(release);
  const manifest = object(artifact.manifest);
  if (manifest.siteId !== context.siteId || manifest.artifactId !== offer.artifactId || manifest.mode !== offer.mode) throw new TermsRecordError('scope-mismatch');
  const config=object(artifact.publicConfig);
  if(config.localization!==undefined&&object(config.localization).terms!==undefined){
    let selected:TermsLocalization;try{selected=normalizeTermsLocalization(selectTermsLocalization(object(config.localization) as unknown as TermsLocalization),{locale:String(object(config.site).locale),allowPreview:context.allowPreview===true});}catch{throw new TermsRecordError('invalid-offer');}
    if(valueMismatch(offer.localization,selected))throw new TermsRecordError('invalid-offer');
  }else if(offer.localization!==undefined||!/^en(?:-|$)/iu.test(String(object(config.site).locale)))throw new TermsRecordError('invalid-offer');
  const descriptors = manifest.documents as JsonValue[];
  const terms = object(descriptors.find(item=>object(item).kind === 'terms'));
  const document = object(offer.document);
  for (const field of ['title','version','effectiveDate','sha256','contentSha256','reviewStatus']) if (terms[field] !== document[field]) throw new TermsRecordError('invalid-offer');
}

/** @requirements REQ-PRODUCT-TERMS-ACCEPTANCE
 * Trusted host operation: immutable registration verifies the archive, but does not activate/publish the offer.
 */
export async function registerTermsOffer(storage:HistoryStorage, input:unknown, context:TermsStoreOptions): Promise<{offerId:string;created:boolean}> {
  context = {...context};
  const {prefix,releasePrefix} = options(storage,context); const offer = await offerValue(input,context); const offerId = offer.offerId as string;
  return storage.transaction(async transaction=>{
    await verifyArchive(transaction,offer,context,releasePrefix);
    const key = `${prefix}offers/${offerId}`; const previous = await transaction.get(key);
    if (previous !== undefined) {
      const stored = await offerValue(previous,context);
      if (canonicalJson(stored) !== canonicalJson(offer)) throw new TermsRecordError('idempotency-conflict');
      return {offerId,created:false};
    }
    await transaction.put(key,offer); return {offerId,created:true};
  });
}

/** Explicit host activation/deactivation; archival alone never changes the current acceptance target. */
export async function setActiveTermsOffer(storage:HistoryStorage, offerId:string|null, context:TermsActionContext): Promise<void> {
  context = {...context};
  const {prefix,releasePrefix} = options(storage,context);
  if (!slug(context.scopeId) || offerId !== null && !hash(offerId)) throw new TermsRecordError('scope-mismatch');
  await storage.transaction(async transaction=>{
    if (offerId !== null) {
      const offer = await offerValue(await transaction.get(`${prefix}offers/${offerId}`),context);
      if (offer.scopeId !== context.scopeId) throw new TermsRecordError('scope-mismatch');
      await verifyArchive(transaction,offer,context,releasePrefix);
    }
    await transaction.put(`${prefix}active/${context.scopeId}`,{offerId,siteId:context.siteId,scopeId:context.scopeId});
  });
}

function receiptFor(event:ObjectValue): TermsReceipt {
  const offer = object(event.offer); const document = object(offer.document);
  if (!hash(event.id) || !hash(offer.offerId) || !hash(offer.artifactId) || !hash(document.sha256) || !uuid(event.requestId) || !text(event.operationId,200) || !text(document.version,200) || typeof event.occurredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(event.occurredAt) || !Number.isFinite(Date.parse(event.occurredAt)) || new Date(event.occurredAt).toISOString() !== event.occurredAt) throw new TermsRecordError('invalid-offer');
  return {schemaVersion:1,id:event.id,offerId:offer.offerId,requestId:event.requestId,operationId:event.operationId,artifactId:offer.artifactId,documentSha256:document.sha256,documentVersion:document.version,recordedAt:event.occurredAt};
}

/** @requirements REQ-PRODUCT-TERMS-ACCEPTANCE
 * Host must authenticate/authorize the subject and operation, and protect its endpoint against CSRF/replay abuse.
 * A host-received assertion is evidence, not proof of identity, a human click, or contract enforceability.
 */
export async function recordTermsAcceptance(storage:HistoryStorage, input:unknown, context:TermsRecordingContext): Promise<TermsReceipt> {
  context = {...context};
  const {prefix,releasePrefix} = options(storage,context);
  if (!slug(context.scopeId) || !text(context.subjectId,200) || !text(context.operationId,200)) throw new TermsRecordError('scope-mismatch');
  const request = object(normalizeRecord({id:'request',data:input},2048).data);
  if (!exact(request,['schemaVersion','offerId','requestId','accepted']) || request.schemaVersion !== 1 || !hash(request.offerId) || !uuid(request.requestId) || request.accepted !== true) throw new TermsRecordError('invalid-request');
  const id = await sha256(canonicalJson([context.siteId,context.subjectId,request.requestId]));
  const subjectRef=await sha256(canonicalJson([context.siteId,context.subjectId]));
  return storage.transaction(async transaction=>{
    await assertEvidenceContextActive(transaction,prefix,'terms',context.siteId,subjectRef);
    const key = `${prefix}events/${id}`; const previous = await transaction.get(key);
    if (previous !== undefined) {
      const event = object(normalizeRecord({id,data:previous}).data); const offer = await offerValue(event.offer,context);
      if (event.kind !== 'terms-acceptance' || event.id !== id || event.siteId !== context.siteId || event.subjectId !== context.subjectId || event.operationId !== context.operationId || offer.scopeId !== context.scopeId || offer.offerId !== request.offerId || event.requestId !== request.requestId) throw new TermsRecordError('idempotency-conflict');
      return receiptFor(event);
    }
    const offer = await offerValue(await transaction.get(`${prefix}offers/${request.offerId}`),context);
    if (offer.scopeId !== context.scopeId) throw new TermsRecordError('scope-mismatch');
    const activeValue = await transaction.get(`${prefix}active/${context.scopeId}`);
    if (activeValue === undefined) throw new TermsRecordError('stale-offer');
    const active = object(activeValue as JsonValue);
    if (active.offerId !== request.offerId || active.siteId !== context.siteId || active.scopeId !== context.scopeId) throw new TermsRecordError('stale-offer');
    await verifyArchive(transaction,offer,context,releasePrefix);
    const occurredAt = (context.now?.() ?? new Date()).toISOString();
    const event: ObjectValue = {kind:'terms-acceptance',id,siteId:context.siteId,subjectId:context.subjectId,operationId:context.operationId,requestId:request.requestId!,documentVersion:object(offer.document).version!,occurredAt,offer,provenance:{source:'host-received-assertion',identity:'Host supplies and authorizes the subject reference; this record does not verify a human click.'}};
    const receipt = receiptFor(event);
    normalizeRecord({id,data:event}); await transaction.put(key,event); return receipt;
  });
}

/** Read-only agreement events, suitable for the host-authorized backoffice. No offer or active-pointer enumeration. */
export function createTermsAcceptanceStore(storage:HistoryStorage, context:TermsStoreOptions): RecordStore {
  const {prefix} = options(storage,context); const eventPrefix = `${prefix}events/`; const siteId = context.siteId;
  const inspect = async (value:unknown, key:string): Promise<JsonValue> => {
    const event = object(normalizeRecord({id:key.slice(eventPrefix.length),data:value}).data);
    if (event.kind !== 'terms-acceptance' || event.siteId !== siteId || event.id !== key.slice(eventPrefix.length)) throw new TermsRecordError('scope-mismatch');
    if(!text(event.subjectId,200))throw new TermsRecordError('scope-mismatch');
    const ref=await sha256(canonicalJson([siteId,event.subjectId]));
    return await retiredEvidenceProjection(storage,prefix,'terms',siteId,ref,String(event.id))??event;
  };
  const scoped: DurableStorage = {
    async get<T>(key:string) { const value = await storage.get<T>(key); return value === undefined ? undefined : await inspect(value,key) as T; },
    async list<T>(query:{prefix:string;startAfter?:string;limit:number}) { const values = await storage.list<T>(query),result=new Map<string,T>();for(const [key,value] of values)result.set(key,await inspect(value,key) as T);return result; },
  };
  return createDurableObjectStore(scoped,{prefix:eventPrefix});
}
