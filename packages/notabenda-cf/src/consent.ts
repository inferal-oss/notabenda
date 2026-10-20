// @requirements REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
import {normalizeConsentInformation} from './consent-information.js';
// @requirements REQ-IE-CONSENT-DURATION
import {receiptGrantExpiresAt,isGrantExpiryPolicy,sameGrantExpiryPolicy} from './grant-expiry-policy.js';
import type {GrantExpiryPolicy} from './grant-expiry-policy.js';
// @requirements REQ-PRODUCT-LOCALIZATION
import {normalizeConsentLocalization,formatMessage,localizedConsentWording} from './localization-policy.js';
import type {ConsentLocalization} from './localization-policy.js';
// @requirements REQ-PRODUCT-SCOPE-GUARDS
import {normalizeScopeGuardPolicy,scopeGuardContext,scopeGuardBlocked} from './scope-guard-policy.js';
// @requirements REQ-EU-RETENTION-ERASURE
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
import { canonicalJson, sha256, validateStoredLegalRelease } from './history.js';
import type { HistoryStorage, HistoryTransaction } from './history.js';
import { boundedText, normalizeRecord } from './records.js';
import { createDurableObjectStore } from './store.js';
import {assertEvidenceContextActive,retiredEvidenceProjection} from './lifecycle.js';
import type { DurableStorage, JsonValue, RecordStore } from './types.js';

type ObjectValue = Record<string, JsonValue>;
export interface ConsentStoreOptions {
  /** Trusted host scope, never a value selected by a browser payload. */
  siteId:string; prefix?:string; releasePrefix?:string; allowPreview?:boolean;
}
export interface ConsentNoticeContext extends ConsentStoreOptions { scopeId:string }
export interface ConsentStreamContext extends ConsentNoticeContext {
  /** Host-resolved opaque stream reference. Never pass a raw bearer capability, email, or browser-selected account ID. */
  streamId:string;
  now?:()=>Date;
}
export interface ConsentChoiceRequest {
  schemaVersion:1; noticeId:string; requestId:string; expectedRevision:number;
  action:'accept-all'|'revoke-all'|'save'; choices:Record<string,boolean>;
  /** A browser assertion, kept separate from the trusted receipt time. */
  clientAt:string;
}
export interface ConsentReceipt {
  schemaVersion:1; id:string; siteId:string; scopeId:string; streamRef:string; revision:number;
  noticeId:string; artifactId:string; scopeDigest:string; requestId:string;
  action:ConsentChoiceRequest['action']; clientAt:string; recordedAt:string;
  /** Result of this historical event. A revoke-all also clears purposes added after its notice. */
  choices:Record<string,boolean>; expiresAt:Record<string,string>;
}
export interface ConsentHead {
  schemaVersion:1; siteId:string; scopeId:string; streamRef:string; revision:number;
  event:ConsentReceipt|null;
}
export interface ConsentChoiceResult { receipt:ConsentReceipt; head:ConsentHead }
export class ConsentRecordError extends Error {
  constructor(readonly code:'invalid-request'|'invalid-notice'|'scope-mismatch'|'stale-notice'|'revision-conflict'|'idempotency-conflict'|'expired-command'|'invalid-clock'|'scope-restricted'|'invalid-record') { super(code); this.name='ConsentRecordError'; }
}
const fail = (code:ConsentRecordError['code']):never => { throw new ConsentRecordError(code); };
const hash = (v:unknown):v is string => typeof v === 'string' && /^[a-f0-9]{64}$/u.test(v);
const slug = (v:unknown):v is string => typeof v === 'string' && /^[a-z][a-z0-9-]{0,119}$/u.test(v);
const uuid = (v:unknown):v is string => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
const text = (v:unknown,max:number):v is string => boundedText(v,max) && v.trim().length>0;
const revision = (v:unknown):v is number => Number.isSafeInteger(v) && Number(v)>=0;
const iso = (v:unknown):v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString()===v;
function object(v:JsonValue|undefined):ObjectValue { return v && typeof v === 'object' && !Array.isArray(v) ? v : fail('invalid-record'); }
function exact(v:ObjectValue,keys:string[]):boolean { return Object.keys(v).length === keys.length && keys.every(k=>Object.hasOwn(v,k)); }
/** @requirements REQ-IT-REPROMPT Independently validate public policy/disclosure without a frontend dependency. */
function validPromptPolicy(value:JsonValue|undefined,wording:ObjectValue,localization?:ConsentLocalization):boolean {
  if(value===undefined)return true;
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const revision=(v:JsonValue|undefined)=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(v);
  if(!exact(value,['profile','processingRevision',...(value.materialChange===undefined?[]:['materialChange'])])||value.profile!=='it-garante-2021'||!revision(value.processingRevision))return false;
  if(value.materialChange===undefined)return true;
  const change=value.materialChange;
  if(!change||typeof change!=='object'||Array.isArray(change)||!exact(change,['fromRevision','summary'])||!revision(change.fromRevision)||change.fromRevision===value.processingRevision||!text(change.summary,1000))return false;
  const disclosure=localization?formatMessage(localization.consent.materialChange,{summary:String(change.summary)}):`Changes to optional processing: ${change.summary}`;
  return typeof wording.summary==='string'&&wording.summary.endsWith(disclosure)&&typeof wording.preferencesIntro==='string'&&wording.preferencesIntro.endsWith(disclosure);
}
function normalized(input:unknown,bytes:number,code:ConsentRecordError['code']):ObjectValue {
  try { return object(normalizeRecord({id:'value',data:input},bytes).data); } catch { return fail(code); }
}
function options(storage:HistoryStorage,context:ConsentStoreOptions):{prefix:string;releasePrefix:string} {
  if (!slug(context.siteId) || typeof storage.transaction !== 'function') return fail('scope-mismatch');
  const prefix = context.prefix ?? `notabenda/consent/${context.siteId}/`;
  const releasePrefix = context.releasePrefix ?? 'notabenda/releases/';
  createDurableObjectStore(storage,{prefix}); createDurableObjectStore(storage,{prefix:releasePrefix});
  return {prefix,releasePrefix};
}
async function noticeValue(input:unknown,context:ConsentStoreOptions):Promise<ObjectValue> {
  const n = normalized(input,32768,'invalid-notice');
  if (!exact(n,['schemaVersion','noticeId','siteId','scopeId','artifactId','mode','scopeDigest','scopes','wording','documents','policy',...(n.schemaVersion===2?['localization']:[]),...(n.information===undefined?[]:['information'])]) || (n.schemaVersion!==1&&n.schemaVersion!==2) || !hash(n.noticeId) || !hash(n.artifactId) || !hash(n.scopeDigest) || n.siteId!==context.siteId || !slug(n.scopeId) || (typeof n.mode!=='string'||!['preview','production'].includes(n.mode))) return fail('invalid-notice');
  if(n.information!==undefined){try{n.information=normalizeConsentInformation(n.information) as unknown as JsonValue;}catch{return fail('invalid-notice');}}
  let localization:ConsentLocalization|undefined;
  if(n.schemaVersion===2){try{localization=normalizeConsentLocalization(n.localization,{allowPreview:context.allowPreview===true});}catch{return fail('invalid-notice');}}
  const scopes=object(n.scopes); const wording=object(n.wording); const policy=object(n.policy); const docs=object(n.documents);
  if (Object.keys(scopes).length<1 || Object.keys(scopes).length>40 || Object.entries(scopes).some(([id,v])=>!slug(id)||!text(v,30000)) || await sha256(canonicalJson(scopes))!==n.scopeDigest) return fail('invalid-notice');
  const labels=['acceptLabel','rejectLabel','saveLabel','preferencesLabel','dismissLabel','closeLabel'];
  if (!exact(wording,['title','summary','preferencesTitle','preferencesIntro','essentialNote',...labels]) || Object.entries(wording).some(([k,v])=>!text(v,labels.includes(k)?120:2000))) return fail('invalid-notice');
  if (!exact(policy,['grantLifetimeDays','refusalLifetimeDays','deliveryWindowSeconds',...(policy.promptPolicy===undefined?[]:['promptPolicy']),...(policy.grantExpiryPolicy===undefined?[]:['grantExpiryPolicy'])]) || !validPromptPolicy(policy.promptPolicy,wording,localization) || ![policy.grantLifetimeDays,policy.refusalLifetimeDays].every(v=>Number.isInteger(v)&&Number(v)>=1&&Number(v)<=730) || !Number.isInteger(policy.deliveryWindowSeconds) || Number(policy.deliveryWindowSeconds)<30 || Number(policy.deliveryWindowSeconds)>86400 || !exact(docs,['privacy','cookies'])) return fail('invalid-notice');
  for (const kind of ['privacy','cookies']) {
    const d=object(docs[kind]);
    if (!exact(d,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus']) || !text(d.title,300) || !text(d.version,200) || !hash(d.sha256) || !hash(d.contentSha256) || d.url!==`/artifacts/${n.artifactId}/${kind}.html` || (typeof d.reviewStatus!=='string'||!['draft','reviewed'].includes(d.reviewStatus)) || typeof d.effectiveDate!=='string' || !/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate) || !Number.isFinite(Date.parse(d.effectiveDate)) || new Date(d.effectiveDate).toISOString().slice(0,10)!==d.effectiveDate) return fail('invalid-notice');
    if (!context.allowPreview && (n.mode!=='production'||d.reviewStatus!=='reviewed')) return fail('invalid-notice');
  }
  if(policy.grantExpiryPolicy!==undefined&&!isGrantExpiryPolicy(policy.grantExpiryPolicy))return fail('invalid-notice');
  const {noticeId:_,...descriptor}=n;
  if (await sha256(canonicalJson(descriptor))!==n.noticeId) return fail('invalid-notice');
  return n;
}
async function verifyArchive(tx:HistoryTransaction,n:ObjectValue,context:ConsentStoreOptions,releasePrefix:string):Promise<string[]> {
  const release=normalized(await tx.get(releasePrefix+n.artifactId),128*1024,'invalid-notice');
  if (release.kind!=='document-release') return fail('invalid-notice');
  const artifact=await validateStoredLegalRelease(release); const m=object(artifact.manifest); const config=object(artifact.publicConfig);
  if (m.siteId!==context.siteId || m.artifactId!==n.artifactId || m.mode!==n.mode || object(config.site).id!==context.siteId) return fail('scope-mismatch');
  let localization:ConsentLocalization|undefined;
  if(config.localization!==undefined){try{const {documents:_,generatedDocuments:__,terms:___,...selected}=object(config.localization);localization=normalizeConsentLocalization(selected,{locale:String(object(config.site).locale),allowPreview:context.allowPreview===true});}catch{return fail('invalid-notice');}}
  if(canonicalJson((localization??null) as unknown as JsonValue)!==canonicalJson(n.localization??null))return fail('invalid-notice');
  const policy=object(config.consent); const declared=object(n.policy);
  let information;try{information=policy.information===undefined?undefined:normalizeConsentInformation(policy.information);}catch{return fail('invalid-notice');}
  if(canonicalJson((information??null) as unknown as JsonValue)!==canonicalJson(n.information??null))return fail('invalid-notice');
  if (policy.grantLifetimeDays!==declared.grantLifetimeDays || policy.refusalLifetimeDays!==declared.refusalLifetimeDays || canonicalJson(policy.promptPolicy??null)!==canonicalJson(declared.promptPolicy??null) || !sameGrantExpiryPolicy(policy.grantExpiryPolicy,declared.grantExpiryPolicy) || !Array.isArray(policy.purposes) || !Array.isArray(policy.services) || !Array.isArray(config.purposes) || !Array.isArray(config.services)) return fail('invalid-notice');
  let guards;try{guards=config.scopeGuards===undefined?undefined:normalizeScopeGuardPolicy(config.scopeGuards,config.purposes.map(p=>String(object(p).id)));}catch{return fail('invalid-notice');}
  const blocked:string[]=[];
  const scopes:ObjectValue={};
  const configuredServices=config.services;
  for (const raw of policy.purposes) {
    const p=object(raw); if (!slug(p.id) || !text(p.scope,200)) return fail('invalid-notice');
    const purpose=config.purposes.find(v=>object(v).id===p.id);
    if (!purpose) return fail('invalid-notice');
    const services=policy.services.map(raw=>{ const s=object(raw); const service=configuredServices.find(v=>object(v).id===s.id); if (!service) return fail('invalid-notice'); return {scope:s.scope!,service}; })
      .filter(s=>{const ids=object(s.service).purposeIds; return Array.isArray(ids)&&ids.includes(p.id!);})
      .sort((a,b)=>String(object(a.service).id)<String(object(b.service).id)?-1:String(object(a.service).id)>String(object(b.service).id)?1:0);
    const scopeGuard=scopeGuardContext(guards,p.id);if(scopeGuardBlocked(guards,p.id))blocked.push(p.id);
    scopes[p.id]=JSON.stringify({scope:p.scope,purpose,services,...(policy.grantExpiryPolicy?{grantExpiryPolicy:policy.grantExpiryPolicy}:{}),...(scopeGuard?{scopeGuard}:{}),...(localization?{localization:{locale:localization.locale,disclosureRevision:localization.disclosureRevision}}:{})});
  }
  if(localization){const change=policy.promptPolicy?object(policy.promptPolicy).materialChange:undefined;const expected=localizedConsentWording(localization,{available:policy.purposes.length>blocked.length,restricted:blocked.length>0,exceptions:Array.isArray(config.storage)&&config.storage.some(s=>object(s).classification==='exception'),...(change?{changeSummary:String(object(change).summary)}:{})});if(canonicalJson(expected)!==canonicalJson(n.wording??null))return fail('invalid-notice');}
  // Archives may be serialized canonically, changing object key order. Verify the disclosed facts
  // structurally while preserving the notice's exact strings for the browser's material-scope identity.
  const suppliedScopes=object(n.scopes);
  if (!exact(suppliedScopes,Object.keys(scopes))) return fail('invalid-notice');
  for (const id of Object.keys(scopes)) {
    try { if (canonicalJson(JSON.parse(String(scopes[id])))!==canonicalJson(JSON.parse(String(suppliedScopes[id])))) return fail('invalid-notice'); }
    catch { return fail('invalid-notice'); }
  }
  for (const kind of ['privacy','cookies']) {
    const doc=object((m.documents as JsonValue[]).find(raw=>object(raw).kind===kind)); const actual=object(object(n.documents)[kind]);
    for (const key of ['title','version','effectiveDate','sha256','contentSha256','reviewStatus']) if (doc[key]!==actual[key]) return fail('invalid-notice');
  }
  return blocked;
}

/** @requirements REQ-PRODUCT-CONSENT-EVIDENCE: immutable registration does not activate or publish a notice. */
export async function registerConsentNotice(storage:HistoryStorage,input:unknown,context:ConsentStoreOptions):Promise<{noticeId:string;created:boolean}> {
  context={...context}; const {prefix,releasePrefix}=options(storage,context); const n=await noticeValue(input,context); const noticeId=n.noticeId as string;
  return storage.transaction(async tx=>{
    await verifyArchive(tx,n,context,releasePrefix); const key=`${prefix}notices/${noticeId}`; const prior=await tx.get(key);
    if (prior!==undefined) { if (canonicalJson(await noticeValue(prior,context))!==canonicalJson(n)) return fail('idempotency-conflict'); return {noticeId,created:false}; }
    await tx.put(key,n); return {noticeId,created:true};
  });
}
export async function setActiveConsentNotice(storage:HistoryStorage,noticeId:string|null,context:ConsentNoticeContext):Promise<void> {
  context={...context}; const {prefix,releasePrefix}=options(storage,context);
  if (!slug(context.scopeId) || noticeId!==null&&!hash(noticeId)) return fail('scope-mismatch');
  await storage.transaction(async tx=>{
    if (noticeId!==null) { const n=await noticeValue(await tx.get(`${prefix}notices/${noticeId}`),context); if (n.scopeId!==context.scopeId) return fail('scope-mismatch'); await verifyArchive(tx,n,context,releasePrefix); }
    await tx.put(`${prefix}active/${context.scopeId}`,{noticeId,siteId:context.siteId,scopeId:context.scopeId});
  });
}
async function stream(context:ConsentStreamContext):Promise<string> {
  if (!slug(context.scopeId)||!text(context.streamId,200)) return fail('scope-mismatch');
  return sha256(canonicalJson([context.siteId,context.scopeId,context.streamId]));
}
function requestValue(input:unknown):ConsentChoiceRequest {
  const r=normalized(input,8192,'invalid-request');
  if (!exact(r,['schemaVersion','noticeId','requestId','expectedRevision','action','choices','clientAt']) || r.schemaVersion!==1 || !hash(r.noticeId) || !uuid(r.requestId) || !revision(r.expectedRevision) || (typeof r.action!=='string'||!['accept-all','revoke-all','save'].includes(r.action)) || !iso(r.clientAt)) return fail('invalid-request');
  const choices=object(r.choices);
  if (Object.keys(choices).length<1||Object.keys(choices).length>40||Object.entries(choices).some(([id,v])=>!slug(id)||typeof v!=='boolean') || r.action==='accept-all'&&Object.values(choices).some(v=>v!==true) || r.action==='revoke-all'&&Object.values(choices).some(v=>v!==false)) return fail('invalid-request');
  return r as unknown as ConsentChoiceRequest;
}
function receiptFor(e:ObjectValue,context:ConsentStreamContext,streamRef:string):ConsentReceipt {
  if (e.kind!=='consent-choice' || e.siteId!==context.siteId || e.scopeId!==context.scopeId || e.streamRef!==streamRef || !hash(e.id) || !hash(e.noticeId) || !hash(e.artifactId) || !hash(e.scopeDigest) || !uuid(e.requestId) || !revision(e.revision) || e.revision<1 || !iso(e.clientAt) || !iso(e.occurredAt) || (typeof e.action!=='string'||!['accept-all','revoke-all','save'].includes(e.action))) return fail('invalid-record');
  const choices=object(e.purposeChoices); const expires=object(e.expiresAt);
  if (Object.keys(choices).length>80 || Object.keys(choices).length<1 || !exact(expires,Object.keys(choices)) || Object.entries(choices).some(([id,v])=>!slug(id)||typeof v!=='boolean'||!iso(expires[id]))) return fail('invalid-record');
  return {schemaVersion:1,id:e.id,siteId:context.siteId,scopeId:context.scopeId,streamRef,revision:e.revision,noticeId:e.noticeId,artifactId:e.artifactId,scopeDigest:e.scopeDigest,requestId:e.requestId,action:e.action as ConsentChoiceRequest['action'],clientAt:e.clientAt,recordedAt:e.occurredAt,choices:{...choices} as Record<string,boolean>,expiresAt:{...expires} as Record<string,string>};
}
async function headFor(tx:HistoryTransaction,prefix:string,context:ConsentStreamContext,streamRef:string):Promise<ConsentHead> {
  await assertEvidenceContextActive(tx,prefix,'consent',context.siteId,streamRef);
  const pointer=await tx.get(`${prefix}heads/${streamRef}`);
  const base={schemaVersion:1 as const,siteId:context.siteId,scopeId:context.scopeId,streamRef};
  if (pointer===undefined) return {...base,revision:0,event:null};
  const p=normalized(pointer,2048,'invalid-record');
  if (!exact(p,['id','revision','siteId','scopeId','streamRef']) || !hash(p.id) || !revision(p.revision) || p.siteId!==context.siteId||p.scopeId!==context.scopeId||p.streamRef!==streamRef) return fail('invalid-record');
  const event=receiptFor(normalized(await tx.get(`${prefix}events/${p.id}`),65536,'invalid-record'),context,streamRef);
  if (event.id!==p.id || event.revision!==p.revision) return fail('invalid-record');
  const notice=await noticeValue(await tx.get(`${prefix}notices/${event.noticeId}`),context);
  if (notice.scopeId!==context.scopeId || notice.artifactId!==event.artifactId || notice.scopeDigest!==event.scopeDigest) return fail('invalid-record');
  return {...base,revision:p.revision,event};
}
/** Host-authorized stream reads only. No package-provided public lookup or identity recovery. */
export async function getConsentHead(storage:HistoryStorage,context:ConsentStreamContext):Promise<ConsentHead> {
  context={...context}; const {prefix}=options(storage,context); const streamRef=await stream(context);
  return storage.transaction(tx=>headFor(tx,prefix,context,streamRef));
}

/** @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-EU-CONSENT
 * Atomic append, nonce check and stream ordering. A historical retry returns the CURRENT head too.
 * Explicit revoke-all is allowed from a known older notice and ignores CAS; it never grants permission.
 */
export async function recordConsentChoice(storage:HistoryStorage,input:unknown,context:ConsentStreamContext):Promise<ConsentChoiceResult> {
  context={...context}; const {prefix,releasePrefix}=options(storage,context); const streamRef=await stream(context);
  const r=requestValue(input); const requestSha256=await sha256(canonicalJson(r as unknown as JsonValue));
  const id=await sha256(canonicalJson([streamRef,r.requestId]));
  return storage.transaction(async tx=>{
    const head=await headFor(tx,prefix,context,streamRef); const key=`${prefix}events/${id}`; const previous=await tx.get(key);
    if (previous!==undefined) {
      const e=normalized(previous,65536,'invalid-record');
      if (e.requestSha256!==requestSha256 || e.id!==id) return fail('idempotency-conflict');
      // Enforce independent preview policy on retries as well, without requiring an old notice to remain active.
      await noticeValue(await tx.get(`${prefix}notices/${r.noticeId}`),context);
      return {receipt:receiptFor(e,context,streamRef),head};
    }
    const n=await noticeValue(await tx.get(`${prefix}notices/${r.noticeId}`),context);
    if (n.scopeId!==context.scopeId) return fail('scope-mismatch');
    const ids=Object.keys(object(n.scopes));
    if (Object.keys(r.choices).length!==ids.length||ids.some(id=>!Object.hasOwn(r.choices,id))) return fail('invalid-request');
    if (r.action!=='revoke-all') {
      const active=normalized(await tx.get(`${prefix}active/${context.scopeId}`),2048,'stale-notice');
      if (active.noticeId!==n.noticeId || active.siteId!==context.siteId || active.scopeId!==context.scopeId) return fail('stale-notice');
      if (r.expectedRevision!==head.revision) return fail('revision-conflict');
    }
    const blocked=await verifyArchive(tx,n,context,releasePrefix);if(blocked.some(id=>r.choices[id]===true))return fail('scope-restricted');
    let recordedAt:string;
    try { recordedAt=(context.now?.()??new Date()).toISOString(); } catch { return fail('invalid-clock'); }
    if (!iso(recordedAt)) return fail('invalid-clock');
    const serverTime=Date.parse(recordedAt); const clientTime=Date.parse(r.clientAt); const policy=object(n.policy);
    if (clientTime>serverTime+30000) return fail('invalid-request');
    if (Object.values(r.choices).some(Boolean) && serverTime-clientTime>Number(policy.deliveryWindowSeconds)*1000) return fail('expired-command');
    if (head.revision===Number.MAX_SAFE_INTEGER) return fail('invalid-record');
    // An old notice may omit newly introduced purposes. Revoke-all clears the entire stream; it does not merge old grants.
    const choices = r.action==='revoke-all' ? Object.fromEntries([...new Set([...ids,...Object.entries(head.event?.choices??{}).filter(([,grant])=>grant).map(([id])=>id)])].map(id=>[id,false])) : r.choices;
    const expiresAt=Object.fromEntries(Object.entries(choices).map(([id,grant])=>[id,new Date(grant?receiptGrantExpiresAt(clientTime,serverTime,Number(policy.grantLifetimeDays),policy.grantExpiryPolicy as unknown as GrantExpiryPolicy|undefined):Math.min(clientTime,serverTime)+Number(policy.refusalLifetimeDays)*86400000).toISOString()]));
    const event:ObjectValue={kind:'consent-choice',id,siteId:context.siteId,scopeId:context.scopeId,streamRef,revision:head.revision+1,supersededRevision:head.revision,expectedRevision:r.expectedRevision,noticeId:r.noticeId,artifactId:n.artifactId!,scopeDigest:n.scopeDigest!,requestId:r.requestId,action:r.action,clientAt:r.clientAt,occurredAt:recordedAt,submittedChoices:r.choices,purposeChoices:choices,expiresAt,requestSha256,provenance:{source:'host-received-browser-report',identity:'Host authorizes an opaque stream; this record does not verify identity, a human action, or legal validity.'}};
    const receipt=receiptFor(event,context,streamRef); normalizeRecord({id,data:event});
    await tx.put(key,event); await tx.put(`${prefix}heads/${streamRef}`,{id,revision:receipt.revision,siteId:context.siteId,scopeId:context.scopeId,streamRef});
    return {receipt,head:{...head,revision:receipt.revision,event:receipt}};
  });
}

/** Read-only event search with pinned notice context; no stream IDs, capabilities or active pointers are enumerated. */
export function createConsentEvidenceStore(storage:HistoryStorage,context:ConsentStoreOptions):RecordStore {
  context={...context}; const {prefix}=options(storage,context); const eventPrefix=`${prefix}events/`;
  const inspect=async(value:unknown,key:string):Promise<JsonValue>=>{
    const e=normalized(value,65536,'invalid-record');
    if (e.kind!=='consent-choice'||e.siteId!==context.siteId||e.id!==key.slice(eventPrefix.length)||!slug(e.scopeId)||!hash(e.streamRef)) return fail('scope-mismatch');
    const retired=await retiredEvidenceProjection(storage,prefix,'consent',context.siteId,e.streamRef,String(e.id));if(retired)return retired;
    const n=await noticeValue(await storage.get(`${prefix}notices/${e.noticeId}`),context);
    if (n.scopeId!==e.scopeId||n.artifactId!==e.artifactId||n.scopeDigest!==e.scopeDigest) return fail('scope-mismatch');
    receiptFor(e,{...context,scopeId:e.scopeId,streamId:'not-used'},e.streamRef);
    const purposes=Object.fromEntries(Object.entries(object(n.scopes)).map(([id,scope])=>{
      try { const p=JSON.parse(String(scope)).purpose; return [id, typeof p.name==='string'?p.name:id]; } catch { return [id,id]; }
    }));
    const purposeDetails=Object.fromEntries(Object.entries(object(n.scopes)).map(([id,scope])=>{
      const parsed=normalized(JSON.parse(String(scope)),32768,'invalid-notice'); const p=object(parsed.purpose);
      const services=Array.isArray(parsed.services)?parsed.services.map(raw=>{const s=object(object(raw).service); return {name:typeof s.name==='string'?s.name:'Not recorded',provider:typeof s.provider==='string'?s.provider:'Not recorded'};}):[];
      return [id,{description:typeof p.description==='string'?p.description:'Not recorded',services,...(parsed.scopeGuard===undefined?{}:{scopeGuard:parsed.scopeGuard})}];
    }));
    return normalizeRecord({id:String(e.id),data:{...e,notice:{mode:n.mode!,...(n.information===undefined?{}:{information:n.information}),...(n.localization===undefined?{}:{localization:n.localization}),wording:n.wording!,documents:n.documents!,purposes,purposeDetails}}}).data;
  };
  const scoped:DurableStorage={
    async get<T>(key:string) { const v=await storage.get(key); return v===undefined?undefined:await inspect(v,key) as T; },
    async list<T>(q:{prefix:string;startAfter?:string;limit:number}) { const result=new Map<string,T>(); for (const [key,v] of await storage.list(q)) result.set(key,await inspect(v,key) as T); return result; },
  };
  return createDurableObjectStore(scoped,{prefix:eventPrefix});
}
