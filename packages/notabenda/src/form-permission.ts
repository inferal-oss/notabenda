// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH
// @requirements REQ-PRODUCT-LOCALIZATION
// @requirements REQ-ZA-MARKETING
import {normalizeSouthAfricaMarketingRequest} from './south-africa-marketing-policy.js';
import type {SouthAfricaMarketingRequest} from './south-africa-marketing-policy.js';
import {normalizeFormRefusalCopy} from './form-refusal-policy.js';
import type {FormRefusalCopy} from './form-refusal-policy.js';
import {normalizeFormPermissionLocalization} from './form-permission-localization-policy.js';
import type {FormPermissionLocalization,FormPermissionMessages} from './form-permission-localization-policy.js';
import {formatMessage} from './localization-policy.js';
// @requirements REQ-EU-CONSENT REQ-CA-MEANINGFUL REQ-EU-MARKETING REQ-CA-CASL-OPTIN
/** @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-SCOPE-GUARDS
 * Ordinary optional permission only. Hosts own identity, contact binding and downstream fulfillment.
 */
import {normalizeCollectionNoticeContent} from './collection.js';
import type {CollectionNotice} from './collection.js';
import {isSafeLink} from './config.js';
import {scopeGuardFields} from './scope-guard-policy.js';
import type {ScopeGuardFacts} from './scope-guard-policy.js';
import type {FormPermissionJournal} from './form-permission-journal.js';
export interface FormPermissionOffer {
  schemaVersion:1|2|3|4;marketingRequest?:SouthAfricaMarketingRequest;refusal?:FormRefusalCopy;localization?:FormPermissionLocalization;offerId:string;siteId:string;permissionId:string;purposeId:string;channel:{id:string;label:string};revision:string;
  artifactId:string;mode:'production'|'preview';reviewStatus:'draft'|'reviewed';document:CollectionNotice['document'];
  facts:{controller:CollectionNotice['controller'];purpose:CollectionNotice['purposes'][number];recipients:CollectionNotice['recipients'];privacy:CollectionNotice['privacy'];scopeGuard:null|{version:1;revision:string;facts:ScopeGuardFacts}};
  wording:{title:string;statement:string;grantLabel:string;withdrawLabel:string;optionality:string;withdrawalExplanation:string};
  withdrawalUrl:string;deliveryWindowSeconds:number;
}
/** Static permission facts and copy without an authoritative offer identity. */
export type FormPermissionContent=Omit<FormPermissionOffer,'offerId'>;
export type FormPermissionSettings=Pick<FormPermissionOffer,'permissionId'|'purposeId'|'channel'|'revision'|'reviewStatus'|'wording'|'withdrawalUrl'> & {deliveryWindowSeconds?:number;refusal?:FormRefusalCopy};
export type SouthAfricaMarketingOffer=FormPermissionOffer & {schemaVersion:4;marketingRequest:SouthAfricaMarketingRequest;refusal:FormRefusalCopy};
export type SouthAfricaMarketingSettings=Omit<FormPermissionSettings,'channel'|'refusal'> & {marketingRequest:SouthAfricaMarketingRequest;methodLabel:string;refusal:FormRefusalCopy};
export type FormPermissionCommand={schemaVersion:1;offerId:string;requestId:string;clientAt:string;expectedStreamRef:string} & ({action:'grant';expectedRevision:number;expectedActivation:number}|{action:'withdraw'|'refuse'});
export interface FormPermissionReceipt {schemaVersion:1;id:string;siteId:string;permissionId:string;streamRef:string;offerId:string;artifactId:string;requestId:string;action:'grant'|'withdraw'|'refuse';revision:number;activationRevision:number;clientAt:string;recordedAt:string}
export interface FormPermissionState {
  schemaVersion:1;siteId:string;permissionId:string;streamRef:string;revision:number;event:FormPermissionReceipt|null;
  activeOfferId:string|null;activeRevision:number;grantAllowed:boolean;permitted:boolean;
  reason:'granted'|'not-granted'|'withdrawn'|'refused'|'offer-changed'|'inactive'|'scope-restricted';
}
export interface FormPermissionResult {receipt:FormPermissionReceipt;state:FormPermissionState}
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const text=(v:unknown,max=2000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
const iso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
/** Shape checking is not authentication; CF independently verifies the offer against an archived release. */
function normalizePermission(input:unknown,options:{allowPreview?:boolean},identity:boolean):FormPermissionOffer|FormPermissionContent {
  let value:unknown;try{const serialized=JSON.stringify(input);if(new TextEncoder().encode(serialized).length+(identity?0:77)>32768)throw new Error();value=JSON.parse(serialized);}catch{throw new Error('Invalid form permission offer.');}
  if(!obj(value)||!exact(value,['schemaVersion',...(identity?['offerId']:[]),'siteId','permissionId','purposeId','channel','revision','artifactId','mode','reviewStatus','document','facts','wording','withdrawalUrl','deliveryWindowSeconds',...(value.schemaVersion===2||(value.schemaVersion===3||value.schemaVersion===4)&&Object.hasOwn(value,'localization')?['localization']:[]),...(value.schemaVersion===3||value.schemaVersion===4?['refusal']:[]),...(value.schemaVersion===4?['marketingRequest']:[])])||![1,2,3,4].some(version=>version===value.schemaVersion)||identity&&!hash(value.offerId)||!hash(value.artifactId)||!slug(value.siteId)||!slug(value.permissionId)||!slug(value.purposeId)||!text(value.revision,200)||!obj(value.channel)||!exact(value.channel,['id','label'])||!slug(value.channel.id)||!text(value.channel.label,120)||!['production','preview'].some(m=>m===value.mode)||!['draft','reviewed'].some(r=>r===value.reviewStatus)||!isSafeLink(value.withdrawalUrl)||!text(value.withdrawalUrl,2048)||!Number.isInteger(value.deliveryWindowSeconds)||Number(value.deliveryWindowSeconds)<30||Number(value.deliveryWindowSeconds)>3600||!obj(value.wording)||!exact(value.wording,['title','statement','grantLabel','withdrawLabel','optionality','withdrawalExplanation'])||Object.entries(value.wording).some(([key,v])=>!text(v,key.endsWith('Label')?120:key==='title'?300:2000))||!obj(value.facts)||!exact(value.facts,['controller','purpose','recipients','privacy','scopeGuard']))throw new Error('Invalid form permission offer.');
  if(value.schemaVersion===4){value.marketingRequest=normalizeSouthAfricaMarketingRequest(value.marketingRequest);if(value.channel.id!==(value.marketingRequest as SouthAfricaMarketingRequest).method)throw Error('Marketing method and permission channel must match.');}
  if(value.schemaVersion===3||value.schemaVersion===4)value.refusal=normalizeFormRefusalCopy(value.refusal);
  if(value.schemaVersion===2||(value.schemaVersion===3||value.schemaVersion===4)&&value.localization!==undefined)value.localization=normalizeFormPermissionLocalization(value.localization,{allowPreview:options.allowPreview===true});
  // Reuse the legacy direct-collection fact validator. This internal English
  // envelope is never rendered or exposed as the permission's selected locale.
  const facts=value.facts,w=value.wording;
  const n=normalizeCollectionNoticeContent({schemaVersion:1,renderingPolicy:'collection-v1',locale:'en',siteId:value.siteId,scopeId:value.permissionId,artifactId:value.artifactId,mode:value.mode,reviewStatus:value.reviewStatus,wording:{title:w.title,intro:w.statement,detailsLabel:'Collection details',privacyLinkLabel:'Privacy policy'},controller:facts.controller,purposes:[facts.purpose],recipients:facts.recipients,privacy:facts.privacy,document:value.document},options);
  if(n.purposes[0]!.id!==value.purposeId)throw new Error('Permission purpose mismatch.');
  const guard=facts.scopeGuard;
  if(guard!==null&&(!obj(guard)||!exact(guard,['version','revision','facts'])||guard.version!==1||!text(guard.revision,200)||!obj(guard.facts)||!exact(guard.facts,[...scopeGuardFields])||Object.values(guard.facts).some(f=>!['absent','present','unknown'].some(v=>f===v))))throw new Error('Invalid form scope assessment.');
  return value as unknown as FormPermissionOffer;
}
/** Validate provisional content without inventing an offer ID. */
export function normalizeFormPermissionContent(input:unknown,options:{allowPreview?:boolean}={allowPreview:true}):FormPermissionContent{return normalizePermission(input,options,false) as FormPermissionContent;}
export function normalizeFormPermissionOffer(input:unknown,options:{allowPreview?:boolean}={}):FormPermissionOffer{return normalizePermission(input,options,true) as FormPermissionOffer;}
export const formPermissionGrantSupported=(offer:Pick<FormPermissionContent,'facts'>):boolean=>offer.facts.scopeGuard!==null&&scopeGuardFields.every(field=>offer.facts.scopeGuard!.facts[field]==='absent');
export class FormPermissionError extends Error {constructor(readonly code:'not-checked'|'read-required'|'scope-restricted'|'stale-offer'|'revision-conflict'|'expired-command'|'context-retired'|'unavailable'|'invalid-response'|'recording-failed'|'superseded'|'destroyed'){super(code);this.name='FormPermissionError';}}
export interface FormPermissionSnapshot {checked:boolean;status:'idle'|'loading'|'submitting'|'recorded'|'error'|'retired'|'destroyed';allowed:boolean;current:FormPermissionState|null;receipt?:FormPermissionReceipt;error?:FormPermissionError['code'];recovery?:{status:'loading'|'ready'|'unavailable'|'invalid';pending:number;withdrawalPending:boolean;refusalPending?:boolean;blocked:boolean}}
export interface FormPermissionOptions {
  /** Opaque host-generated hash for this person AND contact generation. Never an email, token or browser-selected account. */
  streamRef:string;read(context:{signal:AbortSignal}):Promise<unknown>;submit(command:FormPermissionCommand,context:{signal:AbortSignal}):Promise<unknown>;
  allowPreview?:boolean;now?:()=>Date;timeoutMs?:number;journal?:FormPermissionJournal;
}
export interface FormPermissionController {getOffer():FormPermissionOffer;getSnapshot():FormPermissionSnapshot;subscribe(listener:(state:FormPermissionSnapshot)=>void):()=>void;setChecked(checked:boolean):void;refresh():Promise<FormPermissionState>;reconcile():Promise<void>;retryPending():Promise<FormPermissionResult|null>;grant():Promise<FormPermissionResult>;withdraw():Promise<FormPermissionResult>;refuse():Promise<FormPermissionResult>;destroy():void}
interface PendingPermission {command:FormPermissionCommand;artifactId:string;epoch:number}
interface PermissionJournalRecord {schemaVersion:1;siteId:string;permissionId:string;streamRef:string;epoch:number;blocked:boolean;retired:boolean;head:FormPermissionState|null;grant:PendingPermission|null;withdraw:PendingPermission|null}
/** Unchecked/absent fields and ordinary form submission never create a permission command. */
export function createFormPermission(input:unknown,options:FormPermissionOptions):FormPermissionController {
  const offer=normalizeFormPermissionOffer(input,options),streamRef=options.streamRef,read=options.read,submit=options.submit,now=options.now??(()=>new Date()),timeout=options.timeoutMs??15000,journal=options.journal;
  if(!hash(streamRef)||typeof read!=='function'||typeof submit!=='function'||!Number.isInteger(timeout)||timeout<100||timeout>60000)throw new Error('Provide a trusted stream reference and host transports.');
  const journalKey=`notabenda:permission:v1:${offer.siteId}:${offer.permissionId}:${streamRef}`;
  let state:FormPermissionSnapshot={checked:false,status:'idle',allowed:false,current:null},epoch=0,withdrawnLocally=false,recovery:FormPermissionCommand|undefined,recoveryArtifactId=offer.artifactId;
  let seenRevision=-1,seenActivation=-1,seenEvent='',seenActiveOffer:string|null=null,memoryHead:FormPermissionState|null=null;
  let local:PermissionJournalRecord|undefined,readEpoch:number|undefined,volatileWithdrawal:false|'withdraw'|'refuse'=false,journalStatus:NonNullable<FormPermissionSnapshot['recovery']>['status']='loading';
  const fingerprintReceipt=(event:FormPermissionReceipt|null)=>JSON.stringify(event===null?null:Object.entries(event).sort(([a],[b])=>a<b?-1:a>b?1:0));
  function monotonic(next:FormPermissionState,previous:FormPermissionState|null){if(previous&&(next.revision<previous.revision||next.activeRevision<previous.activeRevision||next.revision===previous.revision&&fingerprintReceipt(next.event)!==fingerprintReceipt(previous.event)||next.activeRevision===previous.activeRevision&&next.activeOfferId!==previous.activeOfferId))throw new FormPermissionError('invalid-response');}
  function acceptCurrent(next:FormPermissionState){const fingerprint=fingerprintReceipt(next.event);if(next.revision<seenRevision||next.activeRevision<seenActivation||next.revision===seenRevision&&seenEvent!==fingerprint||next.activeRevision===seenActivation&&seenActiveOffer!==next.activeOfferId)throw new FormPermissionError('invalid-response');seenRevision=next.revision;seenActivation=next.activeRevision;seenEvent=fingerprint;seenActiveOffer=next.activeOfferId;memoryHead=structuredClone(next);}
  let flight:{action:'grant'|'withdraw'|'refuse';promise:Promise<FormPermissionResult>;abort:AbortController}|undefined;let reading:AbortController|undefined;
  const listeners=new Set<(s:FormPermissionSnapshot)=>void>();
  const snapshot=()=>structuredClone({...state,...(journal?{recovery:{status:journalStatus,pending:Number(!!local?.grant)+Number(!!local?.withdraw),withdrawalPending:local?.withdraw?.command.action==='withdraw'||volatileWithdrawal==='withdraw',...(offer.refusal?{refusalPending:local?.withdraw?.command.action==='refuse'||volatileWithdrawal==='refuse'}:{}),blocked:withdrawnLocally}}:{})});
  const emit=()=>{state.allowed=!withdrawnLocally&&(!journal||journalStatus==='ready'&&!local?.grant&&!local?.withdraw)&&['idle','recorded'].includes(state.status)&&state.current?.permitted===true;for(const listener of [...listeners])try{listener(snapshot());}catch{}};
  const terminal=()=>state.status==='destroyed'?'destroyed':state.status==='retired'?'context-retired':null;
  async function transport(work:()=>Promise<unknown>,abort:AbortController,token:number):Promise<unknown>{
    let timer:ReturnType<typeof setTimeout>|undefined;let stop=()=>{};const cancelled=new Promise<never>((_,reject)=>{stop=()=>reject(new FormPermissionError(terminal()??(token!==epoch?'superseded':'recording-failed')));abort.signal.addEventListener('abort',stop,{once:true});timer=setTimeout(()=>abort.abort(),timeout);});
    try{return await Promise.race([Promise.resolve().then(()=>{if(abort.signal.aborted||token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');return work();}),cancelled]);}finally{clearTimeout(timer);abort.signal.removeEventListener('abort',stop);}
  }
  function receipt(v:unknown):FormPermissionReceipt {
    if(!obj(v)||!exact(v,['schemaVersion','id','siteId','permissionId','streamRef','offerId','artifactId','requestId','action','revision','activationRevision','clientAt','recordedAt'])||v.schemaVersion!==1||!hash(v.id)||v.siteId!==offer.siteId||v.permissionId!==offer.permissionId||v.streamRef!==streamRef||!hash(v.offerId)||!hash(v.artifactId)||!uuid(v.requestId)||!['grant','withdraw','refuse'].some(a=>a===v.action)||!integer(v.revision)||v.revision<1||!integer(v.activationRevision)||!iso(v.clientAt)||!iso(v.recordedAt))throw new FormPermissionError('invalid-response');
    return structuredClone(v) as unknown as FormPermissionReceipt;
  }
  function current(v:unknown):FormPermissionState {
    if(!obj(v)||!exact(v,['schemaVersion','siteId','permissionId','streamRef','revision','event','activeOfferId','activeRevision','grantAllowed','permitted','reason'])||v.schemaVersion!==1||v.siteId!==offer.siteId||v.permissionId!==offer.permissionId||v.streamRef!==streamRef||!integer(v.revision)||!integer(v.activeRevision)||!(v.activeOfferId===null||hash(v.activeOfferId))||typeof v.grantAllowed!=='boolean'||typeof v.permitted!=='boolean'||!['granted','not-granted','withdrawn','refused','offer-changed','inactive','scope-restricted'].some(r=>r===v.reason))throw new FormPermissionError('invalid-response');
    const event=v.event===null?null:receipt(v.event);
    if((v.revision===0)!==(event===null)||event!==null&&event.revision!==v.revision||v.permitted!==(v.reason==='granted')||v.permitted&&(!v.grantAllowed||event?.action!=='grant'||event.offerId!==v.activeOfferId||event.activationRevision!==v.activeRevision))throw new FormPermissionError('invalid-response');
    return {...v,event} as unknown as FormPermissionState;
  }
  function pending(v:unknown,kind:'grant'|'withdraw'):PendingPermission|null {
    if(v===null)return null;
    if(!obj(v)||!exact(v,['command','artifactId','epoch'])||!hash(v.artifactId)||!integer(v.epoch)||!obj(v.command))throw new FormPermissionError('invalid-response');
    const c=v.command,keys=['schemaVersion','offerId','requestId','clientAt','expectedStreamRef','action',...(kind==='grant'?['expectedRevision','expectedActivation']:[])];
    if(!exact(c,keys)||c.schemaVersion!==1||(kind==='grant'?c.action!=='grant':!['withdraw','refuse'].includes(String(c.action)))||!hash(c.offerId)||!uuid(c.requestId)||!iso(c.clientAt)||c.expectedStreamRef!==streamRef||kind==='grant'&&(!integer(c.expectedRevision)||!integer(c.expectedActivation)))throw new FormPermissionError('invalid-response');
    return structuredClone(v) as unknown as PendingPermission;
  }
  function record(v:unknown):PermissionJournalRecord {
    if(v===undefined)return {schemaVersion:1,siteId:offer.siteId,permissionId:offer.permissionId,streamRef,epoch:0,blocked:false,retired:false,head:null,grant:null,withdraw:null};
    if(!obj(v)||new TextEncoder().encode(JSON.stringify(v)).length>65536||!exact(v,['schemaVersion','siteId','permissionId','streamRef','epoch','blocked','retired','head','grant','withdraw'])||v.schemaVersion!==1||v.siteId!==offer.siteId||v.permissionId!==offer.permissionId||v.streamRef!==streamRef||!integer(v.epoch)||typeof v.blocked!=='boolean'||typeof v.retired!=='boolean')throw new FormPermissionError('invalid-response');
    const grant=pending(v.grant,'grant'),withdraw=pending(v.withdraw,'withdraw'),head=v.head===null?null:current(v.head);
    if(grant&&withdraw||grant&&grant.epoch!==v.epoch||withdraw&&(withdraw.epoch!==v.epoch||!v.blocked)||v.epoch===0&&v.blocked&&!v.retired)throw new FormPermissionError('invalid-response');
    return {...v,head,grant,withdraw} as unknown as PermissionJournalRecord;
  }
  function withMemoryFence(next:PermissionJournalRecord):PermissionJournalRecord {
    if(!memoryHead)return next;
    if(!next.head)return {...next,head:structuredClone(memoryHead)};
    if(next.head.revision<=memoryHead.revision&&next.head.activeRevision<=memoryHead.activeRevision){monotonic(memoryHead,next.head);return {...next,head:structuredClone(memoryHead)};}
    monotonic(next.head,memoryHead);return next;
  }
  function applyJournal(next:PermissionJournalRecord){
    next=withMemoryFence(next);
    if(local&&(next.epoch<local.epoch||local.retired&&!next.retired))throw new FormPermissionError('invalid-response');
    if(next.head)acceptCurrent(next.head);
    else if(seenRevision>=0)throw new FormPermissionError('invalid-response');
    if(state.current&&JSON.stringify(next.head)!==JSON.stringify(state.current)){
      state={...state,current:null,checked:false,allowed:false};readEpoch=undefined;
    }
    const advanced=next.epoch>(local?.epoch??0);local=next;journalStatus='ready';withdrawnLocally=withdrawnLocally||next.blocked;
    if(advanced){readEpoch=undefined;state={...state,checked:false,allowed:false};reading?.abort();if(flight?.action==='grant'){epoch++;flight.abort.abort();flight=undefined;}}
    if(next.retired){state={...state,status:'retired',checked:false,current:null,allowed:false};reading?.abort();flight?.abort.abort();}
    // Only an acknowledged same-epoch deliberate grant clears a persisted barrier.
    if(!next.blocked&&!volatileWithdrawal)withdrawnLocally=false;
  }
  async function localWork<T>(work:()=>Promise<T>):Promise<T>{
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{return await Promise.race([Promise.resolve().then(work),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new FormPermissionError('unavailable')),timeout);})]);}finally{clearTimeout(timer);}
  }
  async function journalRead():Promise<void>{if(!journal)return;try{const saved=await localWork(()=>journal.read(journalKey));if(state.status==='destroyed')throw new FormPermissionError('destroyed');applyJournal(record(saved));}catch(error){journalStatus=error instanceof FormPermissionError&&error.code==='invalid-response'?'invalid':'unavailable';withdrawnLocally=true;emit();throw error instanceof FormPermissionError?error:new FormPermissionError('unavailable');}}
  async function journalUpdate(change:(value:PermissionJournalRecord)=>PermissionJournalRecord):Promise<PermissionJournalRecord>{
    if(!journal)throw new Error('No journal.');let rejected:unknown;
    try{const saved=await localWork(()=>journal.update(journalKey,value=>{try{if(state.status==='destroyed')throw new FormPermissionError('destroyed');return change(withMemoryFence(record(value)));}catch(error){rejected=error;throw error;}}));const next=record(saved);if(state.status==='destroyed')throw new FormPermissionError('destroyed');applyJournal(next);return next;}
    catch(error){if(rejected instanceof FormPermissionError){if(rejected.code==='invalid-response')journalStatus='invalid';throw rejected;}journalStatus='unavailable';withdrawnLocally=true;emit();throw error instanceof FormPermissionError?error:new FormPermissionError('unavailable');}
  }
  async function reconcile():Promise<void>{if(terminal())throw new FormPermissionError(terminal()!);await journalRead();if(terminal())throw new FormPermissionError(terminal()!);emit();}
  const failure=(error:unknown):FormPermissionError=>{const code=obj(error)&&typeof error.code==='string'?error.code:error instanceof FormPermissionError?error.code:'';return new FormPermissionError(['scope-restricted','stale-offer','revision-conflict','expired-command','context-retired','invalid-response','superseded','destroyed','unavailable'].includes(code)?code as FormPermissionError['code']:'recording-failed');};
  async function closed(error:FormPermissionError){if(error.code==='context-retired'&&journal)try{await journalUpdate(d=>({...d,retired:true,blocked:true}));}catch{}}
  async function refresh():Promise<FormPermissionState>{
    const ended=terminal();if(ended)throw new FormPermissionError(ended);if(flight)throw new FormPermissionError('unavailable');
    try{await journalRead();}catch(error){if(terminal())throw new FormPermissionError(terminal()!);state={...state,status:'error',current:null,allowed:false,error:failure(error).code};emit();throw error;}if(terminal())throw new FormPermissionError(terminal()!);
    reading?.abort();const token=++epoch,abort=new AbortController(),observedEpoch=local?.epoch;reading=abort;state={...state,status:'loading',allowed:false};emit();
    try{const next=current(await transport(()=>read({signal:abort.signal}),abort,token));if(token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');
      if(journal)await journalUpdate(d=>{monotonic(next,d.head);if(d.epoch!==observedEpoch)throw new FormPermissionError('superseded');return {...d,head:next};});
      if(token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');acceptCurrent(next);readEpoch=local?.epoch;state={...state,current:next,status:'idle'};delete state.error;emit();return structuredClone(next);
    }catch(error){if(token!==epoch)throw new FormPermissionError(terminal()??'superseded');const e=failure(error);await closed(e);if(token!==epoch||terminal()==='destroyed')throw new FormPermissionError(terminal()??'superseded');state={...state,current:null,status:e.code==='context-retired'?'retired':'error',allowed:false,error:e.code};emit();throw e;}
  }
  function action(kind:'grant'|'withdraw'|'refuse',retained?:PendingPermission):Promise<FormPermissionResult>{
    const ended=terminal();if(ended)return Promise.reject(new FormPermissionError(ended));if(flight?.action===kind||kind!=='grant'&&flight&&flight.action!=='grant')return flight.promise;
    if(kind==='refuse'&&!offer.refusal&&!retained&&recovery?.action!=='refuse')return Promise.reject(new FormPermissionError('unavailable'));
    if(kind==='grant'&&journal&&volatileWithdrawal)return Promise.reject(new FormPermissionError('unavailable'));
    const checked=state.checked,head=state.current,capturedEpoch=readEpoch;
    if(kind==='grant'&&!retained){
      if(flight)return Promise.reject(new FormPermissionError('unavailable'));
      if(!checked)return Promise.reject(new FormPermissionError('not-checked'));
      if(!formPermissionGrantSupported(offer))return Promise.reject(new FormPermissionError('scope-restricted'));
      if(!head)return Promise.reject(new FormPermissionError('read-required'));
      if(head.activeOfferId!==offer.offerId||!head.grantAllowed)return Promise.reject(new FormPermissionError('stale-offer'));
    }else if(kind!=='grant'){withdrawnLocally=true;if(journal)volatileWithdrawal=kind as 'withdraw'|'refuse';state={...state,checked:false,allowed:false};flight?.abort.abort();flight=undefined;}
    reading?.abort();const token=++epoch,abort=new AbortController();let journaled=false;let command:FormPermissionCommand,artifactId=retained?.artifactId??((!journal||kind!=='grant'&&volatileWithdrawal)&&recovery?.action===kind?recoveryArtifactId:offer.artifactId);
    try{command=retained?structuredClone(retained.command):(!journal||kind!=='grant'&&volatileWithdrawal)&&recovery?.action===kind?structuredClone(recovery):{schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),expectedStreamRef:streamRef,action:kind,clientAt:now().toISOString(),...(kind==='grant'?{expectedRevision:head!.revision,expectedActivation:head!.activeRevision}:{})} as FormPermissionCommand;if(!uuid(command.requestId)||!iso(command.clientAt))throw new Error();}catch{state={...state,status:'error',error:'unavailable'};emit();return Promise.reject(new FormPermissionError('unavailable'));}
    recovery=command;recoveryArtifactId=artifactId;state={...state,status:'submitting'};delete state.error;
    const promise=transport(async()=>{
      if(journal){try{
        const saved=await journalUpdate(d=>{
          if(d.retired)throw new FormPermissionError('context-retired');
          if(kind!=='grant'){
            if(d.withdraw){command=structuredClone(d.withdraw.command);artifactId=d.withdraw.artifactId;return d;}
            if(retained)throw new FormPermissionError('superseded');
            return {...d,epoch:d.epoch+1,blocked:true,grant:null,withdraw:{command,artifactId,epoch:d.epoch+1}};
          }
          if(d.withdraw||retained&&d.grant?.command.requestId!==command.requestId||!retained&&capturedEpoch!==d.epoch)throw new FormPermissionError('superseded');
          if(d.grant){if(!retained&&d.grant.command.requestId!==command.requestId)throw new FormPermissionError('unavailable');command=structuredClone(d.grant.command);artifactId=d.grant.artifactId;return d;}
          if(retained)throw new FormPermissionError('superseded');
          if(!head)throw new FormPermissionError('read-required');monotonic(head,d.head);
          return {...d,grant:{command,artifactId,epoch:d.epoch}};
        });
        if(kind!=='grant')volatileWithdrawal=false;
        if(token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');
        // A second transaction fences a withdrawal arriving after preparation but before dispatch.
        await journalUpdate(d=>{const active=kind!=='grant'?d.withdraw:d.grant;if(d.retired||!active||active.command.requestId!==command.requestId||kind==='grant'&&d.epoch!==saved.epoch)throw new FormPermissionError(d.retired?'context-retired':'superseded');return d;});journaled=true;
      }catch(error){if(kind==='grant'||['context-retired','superseded','destroyed'].includes(failure(error).code))throw error;volatileWithdrawal=command.action as 'withdraw'|'refuse';withdrawnLocally=true;}}
      recovery=structuredClone(command);recoveryArtifactId=artifactId;
      if(abort.signal.aborted||token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');
      return submit(structuredClone(command),{signal:abort.signal});
    },abort,token).then(async raw=>{
      if(token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');
      if(!obj(raw)||!exact(raw,['receipt','state']))throw new FormPermissionError('invalid-response');const r=receipt(raw.receipt),next=current(raw.state);
      if(r.requestId!==command.requestId||r.offerId!==command.offerId||r.action!==command.action||r.clientAt!==command.clientAt||r.artifactId!==artifactId||r.revision>next.revision||r.revision===next.revision&&fingerprintReceipt(r)!==fingerprintReceipt(next.event))throw new FormPermissionError('invalid-response');
      if(journal&&journaled)await journalUpdate(d=>{const active=kind!=='grant'?d.withdraw:d.grant;if(d.retired||!active||active.command.requestId!==command.requestId||kind==='grant'&&active.epoch!==d.epoch)throw new FormPermissionError(d.retired?'context-retired':'superseded');monotonic(next,d.head);return {...d,head:next,[kind!=='grant'?'withdraw':'grant']:null,blocked:kind==='grant'?false:true};});
      if(token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');acceptCurrent(next);recovery=undefined;if(kind==='grant')withdrawnLocally=false;state={checked:false,status:'recorded',allowed:false,current:next,receipt:r};emit();if(token!==epoch||terminal())throw new FormPermissionError(terminal()??'superseded');return structuredClone({receipt:r,state:next});
    }).catch(async error=>{
      if(token!==epoch)throw new FormPermissionError(terminal()??'superseded');const e=failure(error);
      if(['stale-offer','revision-conflict','expired-command'].includes(e.code)){
        recovery=undefined;if(journal&&kind==='grant')try{await journalUpdate(d=>d.grant?.command.requestId===command.requestId?{...d,grant:null}:d);}catch{}
      }
      await closed(e);if(token!==epoch||terminal()==='destroyed')throw new FormPermissionError(terminal()??'superseded');state={...state,status:e.code==='context-retired'?'retired':'error',current:null,allowed:false,error:e.code};emit();throw e;
    }).finally(()=>{if(token===epoch)flight=undefined;});
    flight={action:kind,promise,abort};emit();return promise;
  }
  async function retryPending():Promise<FormPermissionResult|null>{
    const ended=terminal();if(ended)throw new FormPermissionError(ended);if(flight)return flight.promise;
    if(!journal)return recovery?action(recovery.action):null;
    if(volatileWithdrawal)return action(volatileWithdrawal);
    await journalRead();if(terminal())throw new FormPermissionError(terminal()!);
    const entry=local?.withdraw??local?.grant;if(!entry)return null;
    if(entry.command.action==='grant'&&entry.command.offerId!==offer.offerId){state={...state,status:'error',current:null,allowed:false,error:'stale-offer'};emit();throw new FormPermissionError('stale-offer');}
    return action(entry.command.action,entry);
  }
  const stop=journal?.subscribe?.(journalKey,()=>{if(!terminal())void reconcile().catch(()=>{});});
  return {getOffer:()=>structuredClone(offer),getSnapshot:snapshot,subscribe(listener){listeners.add(listener);try{listener(snapshot());}catch{}return()=>listeners.delete(listener);},setChecked(checked){if(typeof checked!=='boolean'||terminal()||flight)throw new Error('This permission draft cannot be edited.');state={...state,checked};emit();},refresh,reconcile,retryPending,grant:()=>action('grant'),withdraw:()=>action('withdraw'),refuse:()=>action('refuse'),destroy(){if(state.status==='destroyed')return;epoch++;reading?.abort();flight?.abort.abort();recovery=undefined;try{stop?.();}catch{}state={checked:false,status:'destroyed',current:null,allowed:false};emit();listeners.clear();}};
}
/** @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE No submit listener, identity fields, automatic network read, or forced privacy acceptance. */
// @requirements REQ-PRODUCT-COLLECTION-FLOW
export function mountFormPermission(container:HTMLElement,options:{permission:FormPermissionController;headingLevel?:2|3|4|5|6}):{destroy():void}{
  if(options.headingLevel!==undefined&&![2,3,4,5,6].includes(options.headingLevel))throw Error('Use a permission heading level from 2 to 6.');
  const c=options.permission,offer=c.getOffer(),doc=container.ownerDocument,l=offer.localization,m=l?.formPermission;
  const t=(key:keyof FormPermissionMessages,fallback:string,values:Record<string,string>={})=>m?formatMessage(m[key],values):formatMessage(fallback,values);
  const el=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const element=doc.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
  const root=el('section');root.className='nb-form-permission';root.setAttribute('aria-label',offer.wording.title);if(l){root.lang=l.locale;root.dir=l.direction;}
  const heading=el(('h'+(options.headingLevel??2)) as 'h2'|'h3'|'h4'|'h5'|'h6',offer.wording.title),identity=el('p',offer.facts.controller.name+' · '+offer.channel.label),label=el('label'),checkbox=el('input');
  identity.className='nb-form-permission-identity';checkbox.type='checkbox';label.className='nb-form-permission-choice';label.append(checkbox,el('span',offer.wording.statement));
  const assertion=el('p',offer.wording.statement);assertion.className='nb-form-permission-saved-statement';assertion.hidden=true;
  const optionality=el('p',offer.wording.optionality),policy=el('a',t('policy','Read the privacy policy · {version}',{version:offer.document.version}));policy.href=offer.document.url;
  const withdrawal=el('p',offer.wording.withdrawalExplanation),fallback=el('a',t('withdrawalHelp','Withdrawal help'));fallback.href=offer.withdrawalUrl;
  const actions=el('div');actions.className='nb-form-permission-actions';
  const button=(title:string,primary=false)=>{const b=el('button',title);b.type='button';b.className='nb-choice-button'+(primary?' nb-primary':'');return b;};
  const refuse=offer.refusal?button(offer.refusal.label):undefined;
  const load=button(t('checkSaved','Check saved permission')),grant=button(offer.wording.grantLabel,true),withdraw=button(offer.wording.withdrawLabel),retry=button(t('retryPermission','Retry saved request'),true);
  load.className='nb-text-button nb-form-permission-refresh';retry.hidden=true;actions.append(grant);if(refuse)actions.append(refuse);actions.append(withdraw,retry);
  const message=el('p');message.setAttribute('role','status');message.setAttribute('aria-atomic','true');message.className='nb-control-status';
  const details=el('details');details.className='nb-form-permission-details';details.append(el('summary',t('detailsSummary','How we use this information')),el('p',offer.facts.purpose.description),el('p',t('information','Information: {information}',{information:offer.facts.purpose.dataCategories.join(', ')})),el('p',t('retention','Retention: {retention}',{retention:offer.facts.purpose.retention})));
  if(offer.facts.recipients.length)details.append(el('p',t('providers','Providers: {providers}',{providers:offer.facts.recipients.map(r=>r.name+' ('+r.provider+')').join(', ')})));
  root.append(heading,identity,optionality);
  if(offer.marketingRequest){
    const request=offer.marketingRequest,disclosure=el('dl');disclosure.className='nb-marketing-request';
    const base='nb-marketing-request-'+offer.offerId;let id=base,suffix=1;while(doc.getElementById(id))id=base+'-'+suffix++;disclosure.id=id;
    const pair=(title:string,value:HTMLElement)=>{const group=el('div');group.append(el('dt',title),value);return group;};
    const goods=el('dd',request.goodsServices),method=el('dd',offer.channel.label),party=el('dd'),email=el('a',offer.facts.controller.email);email.href='mailto:'+offer.facts.controller.email;
    party.append(el('strong',offer.facts.controller.name),el('span',offer.facts.controller.address),email);
    disclosure.append(pair(request.labels.goodsServices,goods),pair(request.labels.method,method),pair(request.labels.responsibleParty,party));root.append(disclosure);checkbox.setAttribute('aria-describedby',id);
  }
  root.append(label,assertion,details,policy,withdrawal,fallback,message,actions,load);
  if(offer.mode==='preview'||offer.reviewStatus==='draft'||l?.reviewStatus==='draft'){const note=el('p',t('draft','Preview · Draft permission'));note.className='nb-draft';root.prepend(note);}container.append(root);
  refuse?.addEventListener('click',()=>{void c.refuse().catch(()=>{});});
  checkbox.addEventListener('change',()=>c.setChecked(checkbox.checked));load.addEventListener('click',()=>{void c.refresh().catch(()=>{});});grant.addEventListener('click',()=>{void c.grant().catch(()=>{});});withdraw.addEventListener('click',()=>{void c.withdraw().catch(()=>{});});retry.addEventListener('click',()=>{void c.retryPending().catch(()=>{});});
  let restoreFocus=false;message.tabIndex=-1;
  const unsubscribe=c.subscribe(s=>{
    const focused=doc.activeElement,ended=['retired','destroyed'].includes(s.status),busy=s.status==='submitting',pending=!!s.recovery?.pending,unsupported=!formPermissionGrantSupported(offer)||s.current?.reason==='scope-restricted',inactive=!!s.current&&s.current.activeOfferId===null,stale=!!s.current&&s.current.activeOfferId!==null&&s.current.activeOfferId!==offer.offerId;
    checkbox.checked=s.checked;label.hidden=s.allowed||pending||unsupported||inactive||stale;assertion.hidden=!label.hidden;grant.hidden=s.allowed||unsupported||inactive||stale||pending&&!busy;checkbox.disabled=ended||busy||pending||unsupported;
    grant.disabled=ended||busy||!!s.recovery&&(s.recovery.status!=='ready'||pending)||!s.checked||!s.current||s.current.activeOfferId!==offer.offerId||!s.current.grantAllowed||!formPermissionGrantSupported(offer);
    load.hidden=ended||!!s.current&&!inactive;load.textContent=inactive?t('checkAvailability','Check availability'):t('checkSaved','Check saved permission');load.disabled=ended||busy||s.status==='loading';withdraw.disabled=ended;retry.hidden=ended||!pending;retry.disabled=ended||busy;
    if(refuse){refuse.hidden=s.allowed||s.current?.event?.action==='grant';refuse.disabled=ended||busy&&s.current?.event?.action!=='grant'&&s.recovery?.refusalPending===true;withdraw.hidden=!refuse.hidden;}
    retry.textContent=s.recovery?.refusalPending&&offer.refusal?offer.refusal.retry:s.recovery?.withdrawalPending?t('retryWithdrawal','Retry withdrawal'):t('retryPermission','Retry permission request');
    root.setAttribute('aria-busy',String(busy||s.status==='loading'));
    message.textContent=ended?t('closed','This choice is closed. Use Withdrawal help to contact the site.'):unsupported?t('unsupported','This option needs a separate process and cannot be enabled here. You can still withdraw an earlier choice or use Withdrawal help.'):busy?t('saving','Saving your choice…'):s.status==='loading'?t('loading','Checking your saved choice…'):s.status==='error'?(s.error==='stale-offer'?t('stale','This information has changed. Reload the page before choosing again. You can still withdraw here.'):t('error','We could not confirm your choice. You can try again or withdraw.')):s.allowed?t('recorded','Your permission has been saved.'):inactive?t('inactive','This option is not available right now. You can still withdraw an earlier choice.'):stale?t('stale','This information has changed. Reload the page before choosing again. You can still withdraw here.'):s.current?.reason==='refused'&&offer.refusal?offer.refusal.recorded:s.current?.reason==='withdrawn'?t('withdrawn','Your withdrawal has been saved. This option is off.'):s.current?.reason==='offer-changed'?t('offerChanged','The information changed since your previous choice. Review it before choosing again.'):s.current?t('off','This option is off. Choosing it is optional.'):t('initial','Check your saved choice before allowing this option. You can withdraw at any time.');
    if(!ended&&s.recovery){
      if(s.recovery.status==='unavailable'||s.recovery.status==='invalid')message.textContent+=' '+t('recoveryUnavailable','Recovery on this device is unavailable. Unconfirmed actions may be lost when you leave.');
      else if(s.recovery.refusalPending&&offer.refusal)message.textContent=offer.refusal.pending;
      else if(s.recovery.withdrawalPending)message.textContent=t('withdrawalPending','Withdrawal saved on this device. Waiting for host confirmation. Retry when connected.');
      else if(pending)message.textContent=s.error==='stale-offer'?t('earlierPending','The saved request uses earlier wording. Withdraw it before making a new choice.'):t('permissionPending','Your choice is saved on this device, waiting for confirmation. Retry the permission request to check its outcome.');
    }
    if(focused===checkbox&&label.hidden||[grant,withdraw,load,retry,...(refuse?[refuse]:[])].some(button=>focused===button&&(button.hidden||button.disabled))){restoreFocus=true;message.focus();}
    if(restoreFocus&&!busy&&s.status!=='loading'&&doc.activeElement===message){const target=!retry.hidden&&!retry.disabled?retry:!label.hidden&&!checkbox.disabled?checkbox:refuse&&!refuse.hidden&&!refuse.disabled?refuse:!withdraw.hidden&&!withdraw.disabled?withdraw:message;target.focus();restoreFocus=false;}
    else if(restoreFocus&&doc.activeElement!==message)restoreFocus=false;
  });
  return {destroy(){unsubscribe();root.remove();}};
}
