import {selectConsentLocalization} from './localization-policy.js';
// @requirements REQ-PRODUCT-LOCALIZATION
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
import { consentScopes, normalizeConsentNotice, defaultConsentWording } from './consent-notice.js';
import type { ConsentNotice } from './consent-notice.js';
import type {ConsentRuntimeInventory} from './consent-runtime-config.js';
import {samePromptPolicy} from './prompt-policy.js';

export interface ConsentChoiceRequest {
  schemaVersion:1; noticeId:string; requestId:string; expectedRevision:number;
  action:'accept-all'|'revoke-all'|'save'; choices:Record<string,boolean>; clientAt:string;
}
export interface ConsentReceipt {
  schemaVersion:1; id:string; siteId:string; scopeId:string; streamRef:string; revision:number;
  noticeId:string; artifactId:string; scopeDigest:string; requestId:string;
  action:ConsentChoiceRequest['action']; clientAt:string; recordedAt:string;
  choices:Record<string,boolean>; expiresAt:Record<string,string>;
}
export interface ConsentHead { schemaVersion:1; siteId:string; scopeId:string; streamRef:string; revision:number; event:ConsentReceipt|null }
export type ConsentEvidenceStatus='checking'|'idle'|'saving'|'recorded'|'error'|'review'|'stale'|'expired'|'unavailable'|'retired'|'destroyed';
export interface ConsentEvidenceSnapshot {
  status:ConsentEvidenceStatus; canGrant:boolean; canRetry:boolean; requiresChoice:boolean;
  revision?:number; requestId?:string;
}
export class ConsentEvidenceError extends Error {
  constructor(readonly code:'revision-conflict'|'stale-notice'|'expired-command'|'invalid-receipt'|'unavailable'|'timeout'|'recording-failed'|'context-retired') { super(code); this.name='ConsentEvidenceError'; }
}
export interface ConsentEvidenceOptions {
  /** Required-mode integration: configured before any optional service can register. No best-effort grants. */
  notice:ConsentNotice;
  /** Host-issued site/scope-scoped digest, not a raw capability or an account identifier. */
  streamRef:string;
  read(context:{signal:AbortSignal}):Promise<unknown>;
  write(command:ConsentChoiceRequest,context:{signal:AbortSignal}):Promise<unknown>;
  allowPreview?:boolean;
  /** Bounds each transport attempt; default 10 seconds, allowed 1–30 seconds. */
  timeoutMs?:number;
}
/** One bounded recoverable action, atomically stored with its local choices; never an authorization credential. */
export interface SavedConsentCommand {
  schemaVersion:1; mode:'required'; siteId:string; scopeId:string; streamRef:string;
  release:{noticeId:string;artifactId:string;scopeDigest:string;mode:'preview'|'production';grantLifetimeDays:number;refusalLifetimeDays:number;deliveryWindowSeconds:number};
  request:ConsentChoiceRequest;
}
export interface EvidenceEnvironment { now:()=>number; schedule:(callback:()=>void,delay:number)=>(()=>void) }
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const revision=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const iso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const same=(a:Record<string,unknown>,b:Record<string,unknown>)=>exact(a,Object.keys(b))&&Object.keys(b).every(k=>a[k]===b[k]);
const fail=():never=>{throw new ConsentEvidenceError('invalid-receipt');};
function equalReceipt(a:ConsentReceipt,b:ConsentReceipt):boolean {
  const {choices:ac,expiresAt:ae,...ar}=a;const {choices:bc,expiresAt:be,...br}=b;
  return same(ar,br)&&same(ac,bc)&&same(ae,be);
}
function boundedCopy(value:unknown,max:number):unknown {
  try { const s=JSON.stringify(value); if(new TextEncoder().encode(s).length>max) return fail(); return JSON.parse(s); } catch { return fail(); }
}
function requestValue(value:unknown):ConsentChoiceRequest {
  if(!object(value)||!exact(value,['schemaVersion','noticeId','requestId','expectedRevision','action','choices','clientAt'])||value.schemaVersion!==1||!hash(value.noticeId)||!uuid(value.requestId)||!revision(value.expectedRevision)||typeof value.action!=='string'||!['accept-all','revoke-all','save'].includes(value.action)||!iso(value.clientAt)||!object(value.choices)) return fail();
  const values=Object.values(value.choices);
  if(values.length<1||values.length>40||Object.entries(value.choices).some(([id,v])=>!slug(id)||typeof v!=='boolean')||value.action==='accept-all'&&values.some(v=>v!==true)||value.action==='revoke-all'&&values.some(v=>v!==false)) return fail();
  return value as unknown as ConsentChoiceRequest;
}

/** @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-EU-CONSENT
 * Internal delivery engine. Acknowledgments never write browser choice storage.
 */
export function createEvidenceSession(config:ConsentRuntimeInventory,options:ConsentEvidenceOptions,env:EvidenceEnvironment,changed:()=>void) {
  const notice=normalizeConsentNotice(options.notice,{allowPreview:options.allowPreview===true});
  const scopes=consentScopes(config); const timeout=options.timeoutMs??10000;
  const selectedLocalization=config.localization?selectConsentLocalization(config.localization):undefined;
  if(JSON.stringify(notice.localization)!==JSON.stringify(selectedLocalization)||config.localization&&!same({...notice.wording},{...defaultConsentWording(config)}))throw new Error('Evidence localization must match the selected release.');
  if(notice.siteId!==config.site.id||!same(notice.scopes,scopes)||!samePromptPolicy(notice.policy.promptPolicy,config.consent!.promptPolicy)||notice.policy.grantLifetimeDays!==config.consent!.grantLifetimeDays||notice.policy.refusalLifetimeDays!==config.consent!.refusalLifetimeDays||!hash(options.streamRef)||typeof options.read!=='function'||typeof options.write!=='function'||!Number.isInteger(timeout)||timeout<1000||timeout>30000) throw new Error('Evidence must match this site, material scope, prompt policy, lifetimes and a host-authorized stream.');
  const {streamRef,read,write}=options;
  let current:SavedConsentCommand|undefined; let head:ConsentHead|undefined;
  let status:ConsentEvidenceStatus='checking'; let gate:ConsentReceipt|undefined;
  let epoch=0; let retired=false; let destroyed=false; let busy=false; let highestRevision=0; let attempts=0;
  let abort:AbortController|undefined; let cancelRetry:(()=>void)|undefined;
  let failure:'read'|'write'|undefined;
  const pending=new Set<Promise<void>>();
  function cancel():void { epoch++; abort?.abort(); abort=undefined; try{cancelRetry?.();}catch{} cancelRetry=undefined; gate=undefined; busy=false; }
  function retire():void {retired=true;cancel();head=undefined;status='retired';failure=undefined;changed();}
  const deadline=(saved:SavedConsentCommand)=>Date.parse(saved.request.clientAt)+(Object.values(saved.request.choices).some(Boolean)?saved.release.deliveryWindowSeconds*1000:86400000);
  const retryable=()=>!!current&&env.now()<=deadline(current)&&!destroyed;
  function snapshot():ConsentEvidenceSnapshot {
    const visible=status==='recorded'&&gate&&Object.entries(gate.choices).some(([id,grant])=>grant&&Date.parse(gate!.expiresAt[id]!)<=env.now())||status==='error'&&current&&Object.values(current.request.choices).some(Boolean)&&!retryable()?'expired':status;
    return {status:visible,canGrant:!destroyed&&!busy&&!retired&&!!head&&!['checking','stale'].includes(visible),canRetry:!destroyed&&!retired&&!busy&&(visible==='error'&&(!current||retryable())),requiresChoice:!!current&&Object.values(current.request.choices).some(Boolean)&&['review','stale','expired','unavailable'].includes(visible),...(head?{revision:head.revision}:{}),...(current?{requestId:current.request.requestId}:{})};
  }
  function parseSaved(value:unknown):SavedConsentCommand|undefined {
    try {
      const v=boundedCopy(value,10000);
      if(!object(v)||!exact(v,['schemaVersion','mode','siteId','scopeId','streamRef','release','request'])||v.schemaVersion!==1||v.mode!=='required'||v.siteId!==notice.siteId||v.scopeId!==notice.scopeId||v.streamRef!==streamRef||!object(v.release)) return undefined;
      const r=v.release;
      if(!exact(r,['noticeId','artifactId','scopeDigest','mode','grantLifetimeDays','refusalLifetimeDays','deliveryWindowSeconds'])||!hash(r.noticeId)||!hash(r.artifactId)||r.scopeDigest!==notice.scopeDigest||typeof r.mode!=='string'||!['preview','production'].includes(r.mode)||!options.allowPreview&&r.mode!=='production'||!Number.isInteger(r.deliveryWindowSeconds)||Number(r.deliveryWindowSeconds)<30||Number(r.deliveryWindowSeconds)>86400||![r.grantLifetimeDays,r.refusalLifetimeDays].every(n=>Number.isInteger(n)&&Number(n)>=1&&Number(n)<=730)) return undefined;
      const request=requestValue(v.request);
      if(request.noticeId!==r.noticeId||!exact(request.choices,Object.keys(scopes))||Date.parse(request.clientAt)>env.now()) return undefined;
      return v as unknown as SavedConsentCommand;
    } catch { return undefined; }
  }
  function receiptValue(input:unknown):ConsentReceipt {
    if(!object(input)||!exact(input,['schemaVersion','id','siteId','scopeId','streamRef','revision','noticeId','artifactId','scopeDigest','requestId','action','clientAt','recordedAt','choices','expiresAt'])||input.schemaVersion!==1||!hash(input.id)||input.siteId!==notice.siteId||input.scopeId!==notice.scopeId||input.streamRef!==streamRef||!revision(input.revision)||input.revision<1||!hash(input.noticeId)||!hash(input.artifactId)||!hash(input.scopeDigest)||!uuid(input.requestId)||typeof input.action!=='string'||!['accept-all','revoke-all','save'].includes(input.action)||!iso(input.clientAt)||!iso(input.recordedAt)||Date.parse(input.recordedAt)>env.now()+30000||Date.parse(input.clientAt)>Date.parse(input.recordedAt)+30000||!object(input.choices)||!object(input.expiresAt)) return fail();
    const ids=Object.keys(input.choices); const expiry=input.expiresAt;
    if(ids.length<1||ids.length>80||!exact(expiry,ids)||ids.some(id=>!slug(id)||typeof input.choices!=='object'||!iso(expiry[id]))||Object.values(input.choices).some(v=>typeof v!=='boolean')||input.action==='accept-all'&&Object.values(input.choices).some(v=>v!==true)||input.action==='revoke-all'&&Object.values(input.choices).some(v=>v!==false)) return fail();
    const base=Math.min(Date.parse(input.clientAt),Date.parse(input.recordedAt));
    if(ids.some(id=>Date.parse(String(expiry[id]))<=base||Date.parse(String(expiry[id]))>base+730*86400000)) return fail();
    return input as unknown as ConsentReceipt;
  }
  function matches(event:ConsentReceipt,saved:SavedConsentCommand):boolean {
    const {request:r,release}=saved;
    if(event.requestId!==r.requestId||event.noticeId!==r.noticeId||event.artifactId!==release.artifactId||event.scopeDigest!==release.scopeDigest||event.action!==r.action||event.clientAt!==r.clientAt||event.revision<=r.expectedRevision) return false;
    if(r.action!=='revoke-all'&&event.revision!==r.expectedRevision+1) return false;
    if(r.action==='revoke-all' ? Object.entries(r.choices).some(([id,v])=>event.choices[id]!==v)||Object.values(event.choices).some(Boolean) : !same(event.choices,r.choices)) return false;
    const base=Math.min(Date.parse(r.clientAt),Date.parse(event.recordedAt));
    return Object.entries(event.choices).every(([id,grant])=>Date.parse(event.expiresAt[id]!)===base+(grant?release.grantLifetimeDays:release.refusalLifetimeDays)*86400000);
  }
  function headValue(value:unknown):ConsentHead {
    if(!object(value)||!exact(value,['schemaVersion','siteId','scopeId','streamRef','revision','event'])||value.schemaVersion!==1||value.siteId!==notice.siteId||value.scopeId!==notice.scopeId||value.streamRef!==streamRef||!revision(value.revision)||value.revision<highestRevision) return fail();
    if(value.revision===0) { if(value.event!==null) return fail(); }
    else if(receiptValue(value.event).revision!==value.revision) return fail();
    return value as unknown as ConsentHead;
  }
  function acceptHead(next:ConsentHead):void {
    head=next; highestRevision=Math.max(highestRevision,next.revision); gate=undefined;
    if(current&&next.event&&matches(next.event,current)) {gate=next.event;status='recorded';}
    else status=current&&Object.values(current.request.choices).some(Boolean)?'review':'idle';
  }
  function track(task:Promise<void>):Promise<void> { pending.add(task); void task.finally(()=>pending.delete(task)); return task; }
  async function transport<T>(work:(signal:AbortSignal)=>Promise<T>,controller:AbortController):Promise<T> {
    let cancelTimeout:(()=>void)|undefined;
    let onAbort:(()=>void)|undefined;
    const stopped=new Promise<never>((_,reject)=>{
      onAbort=()=>reject(new ConsentEvidenceError('unavailable'));
      controller.signal.addEventListener('abort',onAbort,{once:true});
      cancelTimeout=env.schedule(()=>{reject(new ConsentEvidenceError('timeout'));controller.abort();},timeout);
    });
    try { return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted) throw new ConsentEvidenceError('unavailable');return work(controller.signal);}),stopped]); }
    finally { try{cancelTimeout?.();}catch{} if(onAbort) controller.signal.removeEventListener('abort',onAbort); }
  }
  function beginRead(saved:SavedConsentCommand|undefined):Promise<void> {
    if(destroyed||retired) return Promise.resolve();
    cancel(); current=saved; failure=undefined;status='checking'; busy=true; const generation=epoch; const controller=new AbortController();abort=controller;
    const task=(async()=>{
      try {
        const value=await transport(signal=>read({signal}),controller);
        if(destroyed||epoch!==generation) return;
        acceptHead(headValue(boundedCopy(value,32768))); busy=false;
        // Pending refusals may recover automatically; pending grants are never replayed on reload/resume.
        const recover=current&&!Object.values(current.request.choices).some(Boolean)&&!gate&&retryable();
        changed(); if(recover&&epoch===generation) void beginWrite();
      } catch(error) {
        if(destroyed||epoch!==generation) return;
        if(error instanceof ConsentEvidenceError&&error.code==='context-retired'){retire();return;}
        head=undefined; failure='read';status='error';busy=false;changed();
      }
    })(); changed(); return track(task);
  }
  function beginWrite():Promise<void> {
    if(destroyed||retired||!current) return Promise.resolve();
    if(!retryable()) {cancel();status='expired';changed();return Promise.resolve();}
    const saved=current; cancel(); failure=undefined;status='saving';busy=true;attempts++;
    const generation=epoch; const controller=new AbortController();abort=controller;
    const task=(async()=>{
      try {
        const value=boundedCopy(await transport(signal=>write(structuredClone(saved.request),{signal}),controller),65536);
        if(destroyed||epoch!==generation) return;
        if(!object(value)||!exact(value,['receipt','head'])) return fail();
        const receipt=receiptValue(value.receipt);const next=headValue(value.head);
        if(!matches(receipt,saved)||next.revision<receipt.revision||next.revision===receipt.revision&&!equalReceipt(next.event!,receipt)) return fail();
        acceptHead(next);busy=false;changed();
      } catch(error) {
        if(destroyed||epoch!==generation) return;
        busy=false;gate=undefined;failure='write';
        const code=error instanceof ConsentEvidenceError?error.code:'recording-failed';
        if(code==='context-retired'){retire();return;}
        status=code==='stale-notice'?'stale':code==='revision-conflict'?'review':code==='expired-command'?'expired':'error';
        if(status==='review') head=undefined; // A new head read is required before another grant can name a revision.
        changed();
        if(status==='review'&&epoch===generation) {void beginRead(current);return;}
        if(status==='error'&&attempts<=3&&retryable()&&epoch===generation) {
          const delay=[1000,5000,15000][attempts-1]!;
          try {cancelRetry=env.schedule(()=>{cancelRetry=undefined;if(!destroyed&&epoch===generation) void beginWrite();},Math.min(delay,Math.max(1,deadline(saved)-env.now()+1)));}catch{}
        }
      }
    })(); changed(); return track(task);
  }
  return {
    notice:()=>structuredClone(notice), snapshot, parseSaved,
    prepare(choices:Record<string,boolean>,action:ConsentChoiceRequest['action'],at:number):SavedConsentCommand|undefined {
      if(retired||destroyed)return undefined;
      if(Object.values(choices).some(Boolean)&&!snapshot().canGrant) return undefined;
      try {
        const requestId=globalThis.crypto?.randomUUID();const clientAt=new Date(at).toISOString();
        if(!uuid(requestId)||!iso(clientAt)) return undefined;
        return {schemaVersion:1,mode:'required',siteId:notice.siteId,scopeId:notice.scopeId,streamRef,release:{noticeId:notice.noticeId,artifactId:notice.artifactId,scopeDigest:notice.scopeDigest,mode:notice.mode,grantLifetimeDays:notice.policy.grantLifetimeDays,refusalLifetimeDays:notice.policy.refusalLifetimeDays,deliveryWindowSeconds:notice.policy.deliveryWindowSeconds},request:{schemaVersion:1,noticeId:notice.noticeId,requestId,expectedRevision:head?.revision??0,action,choices:{...choices},clientAt}};
      } catch {return undefined;}
    },
    commit(saved:SavedConsentCommand|undefined,persisted:boolean):void {
      if(retired||destroyed)return;
      cancel();current=saved;attempts=0;
      if(!saved||!persisted&&Object.values(saved.request.choices).some(Boolean)) {current=undefined;status='unavailable';changed();return;}
      void beginWrite();
    },
    refresh(saved:SavedConsentCommand|undefined):Promise<void> {attempts=0;return beginRead(saved);},
    retry():Promise<void> {if(!snapshot().canRetry)return Promise.resolve();return failure==='read'?beginRead(current):current?beginWrite():beginRead(undefined);},
    allows(id:string,saved:SavedConsentCommand|undefined):boolean {return !destroyed&&!retired&&!!gate&&!!saved&&saved.request.requestId===current?.request.requestId&&matches(gate,saved)&&gate.choices[id]===true&&Date.parse(gate.expiresAt[id]!)>env.now();},
    expiries():number[] {return gate?Object.entries(gate.choices).filter(([,grant])=>grant).map(([id])=>Date.parse(gate!.expiresAt[id]!)):[];},
    async settled():Promise<void> {while(pending.size) await Promise.all([...pending]);},
    destroy():void {if(destroyed)return;destroyed=true;cancel();status='destroyed';changed();},
  };
}
