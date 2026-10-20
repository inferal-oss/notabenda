// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
import type {ProcessingMessages} from './processing-localization-policy.js';
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {normalizeProcessingNotice,processingActivities,processingCopy,processingExact,processingHash,processingObject,validProcessingActivities} from './processing.js';
import type {ProcessingNotice,ProcessingRequest,ProcessingReceipt,ProcessingHead} from './processing.js';
import type {ProcessingActivity} from './types.js';
import type {ChoiceStorage} from './consent.js';

export interface ProcessingChoicesSnapshot {
  siteId:string;scopeId:string;streamRef:string;noticeId:string;
  status:'checking'|'ready'|'saving'|'recorded'|'error'|'retired'|'destroyed';
  restrictedActivities:ProcessingActivity[];blockedActivities:ProcessingActivity[];
  pending:number;revision:number;needsConfirmation:boolean;persistence:'available'|'unavailable'|'invalid';destroyed:boolean;
}
export interface ProcessingChoicesOptions {
  streamRef:string;allowPreview?:boolean;timeoutMs?:number;
  read(context:{signal:AbortSignal}):Promise<unknown>;
  submit(request:ProcessingRequest,context:{signal:AbortSignal}):Promise<unknown>;
}
export class ProcessingChoicesError extends Error {
  constructor(readonly code:'context-retired'){super(code);this.name='ProcessingChoicesError';}
}
export interface ProcessingChoicesEnvironment {storage?:ChoiceStorage;subscribe?:(keyPrefix:string,refresh:()=>void)=>()=>void}
export interface ProcessingChoicesController {
  readonly storageKey:string;getNotice():ProcessingNotice;getSnapshot():ProcessingChoicesSnapshot;
  subscribe(listener:(snapshot:ProcessingChoicesSnapshot)=>void):()=>void;
  optOut():Promise<void>;retry():Promise<void>;refresh():Promise<void>;refreshLocal():void;settled():Promise<void>;destroy():void;
}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
const union=(...values:readonly ProcessingActivity[][]):ProcessingActivity[]=>processingActivities.filter(a=>values.some(list=>list.includes(a)));
const same=(a:ProcessingActivity[],b:ProcessingActivity[])=>a.length===b.length&&a.every(v=>b.includes(v));
function browserEnvironment():ProcessingChoicesEnvironment {
  if(typeof window==='undefined')return {};
  let storage:Storage|undefined;try{storage=window.localStorage;}catch{}
  return {...(storage?{storage}:{}),subscribe(prefix,refresh){const change=(event:StorageEvent)=>{if(event.key===null||event.key===prefix||event.key.startsWith(prefix+':'))refresh();};const visible=()=>{if(document.visibilityState==='visible')refresh();};window.addEventListener('storage',change);window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',visible);return ()=>{window.removeEventListener('storage',change);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',visible);};}};
}
interface PendingRequest extends ProcessingRequest {artifactId:string}
function requestValue(value:unknown):PendingRequest {
  if(!processingObject(value)||!processingExact(value,['schemaVersion','noticeId','requestId','activities','artifactId'])||value.schemaVersion!==1||!processingHash(value.artifactId)||!processingHash(value.noticeId)||!uuid(value.requestId)||!validProcessingActivities(value.activities))throw new Error('Invalid pending processing request.');
  return structuredClone(value) as unknown as PendingRequest;
}

/** @requirements REQ-PRODUCT-PROCESSING-CHOICES
 * Restriction state is monotonic; delivery/readiness is separate. No method grants or resets processing.
 */
export function createProcessingChoices(input:unknown,options:ProcessingChoicesOptions,environment?:ProcessingChoicesEnvironment):ProcessingChoicesController {
  const notice=normalizeProcessingNotice(input,{...(options.allowPreview===undefined?{}:{allowPreview:options.allowPreview})});
  if(!processingHash(options.streamRef)||typeof options.read!=='function'||typeof options.submit!=='function')throw new Error('Supply host-bound stream and processing transports.');
  const {streamRef,read,submit}=options;const timeout=options.timeoutMs??10000;if(!Number.isInteger(timeout)||timeout<1000||timeout>30000)throw new Error('Use a processing timeout of 1000–30000 milliseconds.');
  const env=environment??browserEnvironment();const storageKey=`notabenda:processing:v1:${notice.siteId}:${notice.scopeId}:${streamRef}`;
  let local:ProcessingActivity[]=[];let queue:PendingRequest[]=[];let minRevision=0;let head:ProcessingHead|undefined;
  let ready=false,failed=false,retired=false,destroyed=false;let persistence:ProcessingChoicesSnapshot['persistence']=env.storage?'available':'unavailable';
  let readTask:Promise<void>|undefined,writeTask:Promise<void>|undefined;const tasks=new Set<Promise<void>>(),aborts=new Set<AbortController>(),acknowledged=new Set<string>();
  const listeners=new Set<(snapshot:ProcessingChoicesSnapshot)=>void>();
  const identity={siteId:notice.siteId,scopeId:notice.scopeId,streamRef};
  function snapshot():ProcessingChoicesSnapshot {
    const restrictions=union(local,head?.event?.restrictions??[]);
    const status=destroyed?'destroyed':retired?'retired':failed||persistence==='invalid'?'error':writeTask?'saving':!ready?'checking':queue.length?'saving':restrictions.length?'recorded':'ready';
    const confirmed=restrictions.every(a=>head?.event?.restrictions.includes(a));
    return {...identity,noticeId:notice.noticeId,status:status==='recorded'&&!confirmed?'error':status,restrictedActivities:restrictions,blockedActivities:destroyed||retired||!ready||failed||persistence==='invalid'?[...processingActivities]:restrictions,needsConfirmation:!retired&&ready&&!queue.length&&restrictions.some(a=>!head?.event?.restrictions.includes(a)),pending:queue.length,revision:head?.revision??minRevision,persistence,destroyed};
  }
  function retire(){retired=true;ready=false;failed=false;for(const abort of aborts)abort.abort();}
  function emit(){for(const listener of [...listeners])try{listener(snapshot());}catch{}}
  function mergeLocal(){
    if(!env.storage)return;
    try{
      for(const activity of processingActivities){const raw=env.storage.getItem(storageKey+':'+activity);if(raw===null)continue;const item=processingCopy(JSON.parse(raw),2048);if(!processingObject(item)||!processingExact(item,['schemaVersion','siteId','scopeId','streamRef','restricted'])||item.schemaVersion!==1||item.restricted!==true||Object.entries(identity).some(([key,value])=>item[key]!==value))throw new Error();local=union(local,[activity]);}
      const raw=env.storage.getItem(storageKey);if(raw!==null){const item=processingCopy(JSON.parse(raw),16384);if(!processingObject(item)||!processingExact(item,['schemaVersion','siteId','scopeId','streamRef','minRevision','queue'])||item.schemaVersion!==1||Object.entries(identity).some(([key,value])=>item[key]!==value)||!Number.isSafeInteger(item.minRevision)||Number(item.minRevision)<0||!Array.isArray(item.queue)||item.queue.length>16)throw new Error();
        const pending=item.queue.map(requestValue);if(pending.some(r=>r.noticeId===notice.noticeId&&r.artifactId!==notice.artifactId))throw new Error();if(new Set(pending.map(r=>r.requestId)).size!==pending.length)throw new Error();
        minRevision=Math.max(minRevision,Number(item.minRevision));for(const request of pending)if(!acknowledged.has(request.requestId)&&!queue.some(r=>r.requestId===request.requestId)){queue.push(request);local=union(local,request.activities);}
      }
      if(queue.length>16)throw new Error();
    }catch{persistence='invalid';failed=true;}
  }
  let checkingLocal=false;
  function refreshLocal():void {
    if(destroyed||checkingLocal)return;checkingLocal=true;
    try{const before=JSON.stringify(snapshot());mergeLocal();if(head&&head.revision<minRevision){ready=false;failed=true;}if(JSON.stringify(snapshot())!==before)emit();}finally{checkingLocal=false;}
  }
  function persist(){
    if(!env.storage)return;
    mergeLocal();if(persistence==='invalid')return;
    try{
      // Separate true-only activity keys cannot overwrite another tab's different restriction.
      for(const activity of local)env.storage.setItem(storageKey+':'+activity,JSON.stringify({schemaVersion:1,...identity,restricted:true}));
      if(local.length||queue.length||minRevision)env.storage.setItem(storageKey,JSON.stringify({schemaVersion:1,...identity,minRevision,queue}));
    }catch{persistence='unavailable';}
  }
  function receiptValue(input:unknown):ProcessingReceipt {
    const r=processingCopy(input,8192);
    if(!processingObject(r)||!processingExact(r,['schemaVersion','id','siteId','scopeId','streamRef','revision','noticeId','artifactId','requestId','activities','restrictions','recordedAt','provenance'])||r.schemaVersion!==1||Object.entries(identity).some(([key,value])=>r[key]!==value)||!processingHash(r.id)||!processingHash(r.noticeId)||!processingHash(r.artifactId)||!uuid(r.requestId)||!Number.isSafeInteger(r.revision)||Number(r.revision)<1||!validProcessingActivities(r.activities)||!validProcessingActivities(r.restrictions)||r.activities.some(a=>!(r.restrictions as ProcessingActivity[]).includes(a))||typeof r.recordedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(r.recordedAt)||!Number.isFinite(Date.parse(r.recordedAt))||new Date(r.recordedAt).toISOString()!==r.recordedAt||typeof r.provenance!=='string'||!['explicit-opt-out','gpc-header','browser-report','trusted-application'].includes(r.provenance))throw new Error('Invalid processing receipt.');
    return {schemaVersion:1,id:r.id,siteId:notice.siteId,scopeId:notice.scopeId,streamRef,revision:Number(r.revision),noticeId:r.noticeId,artifactId:r.artifactId,requestId:r.requestId,activities:union(r.activities),restrictions:union(r.restrictions),recordedAt:r.recordedAt,provenance:r.provenance as ProcessingReceipt['provenance']};
  }
  function headValue(input:unknown):ProcessingHead {
    const h=processingCopy(input,12288);
    if(!processingObject(h)||!processingExact(h,['schemaVersion','siteId','scopeId','streamRef','revision','event'])||h.schemaVersion!==1||Object.entries(identity).some(([key,value])=>h[key]!==value)||!Number.isSafeInteger(h.revision)||Number(h.revision)<0)throw new Error('Invalid processing head.');
    const base={schemaVersion:1 as const,...identity,revision:Number(h.revision)};
    if(h.revision===0){if(h.event!==null)throw new Error('Invalid empty processing head.');return {...base,event:null};}
    const event=receiptValue(h.event);if(event.revision!==h.revision)throw new Error('Processing head revision does not match.');return {...base,event};
  }
  function applyHead(candidate:ProcessingHead,allowOlderAcknowledgment=false){
    if(head&&candidate.revision<head.revision){if(!allowOlderAcknowledgment||head.revision<minRevision)throw new Error('Processing read moved backwards.');ready=true;failed=false;return;}
    if(candidate.revision<minRevision||head&&head.event?.restrictions.some(a=>!candidate.event?.restrictions.includes(a))||head&&candidate.revision===head.revision&&JSON.stringify(candidate)!==JSON.stringify(head))throw new Error('Processing state moved backwards.');
    head=candidate;minRevision=Math.max(minRevision,candidate.revision);local=union(local,candidate.event?.restrictions??[]);ready=true;failed=false;persist();
  }
  async function transport(work:(context:{signal:AbortSignal})=>Promise<unknown>):Promise<unknown>{
    const controller=new AbortController();aborts.add(controller);let timer:ReturnType<typeof setTimeout>|undefined;let stopped:()=>void=()=>{};
    const cancelled=new Promise<never>((_,reject)=>{stopped=()=>reject(new Error('Processing transport stopped.'));controller.signal.addEventListener('abort',stopped,{once:true});timer=setTimeout(()=>controller.abort(),timeout);});
    try{return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted||destroyed)throw new Error('Processing transport stopped.');return work({signal:controller.signal});}),cancelled]);}
    finally{clearTimeout(timer);controller.signal.removeEventListener('abort',stopped);aborts.delete(controller);}
  }
  function track(task:Promise<void>){tasks.add(task);void task.finally(()=>tasks.delete(task));return task;}
  function refresh():Promise<void>{
    if(destroyed||retired)return Promise.resolve();if(readTask)return readTask;mergeLocal();ready=false;emit();
    readTask=track((async()=>{try{const value=await transport(read);if(!destroyed&&!retired)applyHead(headValue(value));}catch(error){if(!destroyed){if(error instanceof ProcessingChoicesError&&error.code==='context-retired')retire();else if(!retired){ready=false;failed=true;}}}finally{readTask=undefined;emit();}})());return readTask;
  }
  function retry():Promise<void>{
    if(destroyed||retired)return Promise.resolve();if(writeTask)return writeTask;mergeLocal();if(!queue.length){emit();return ready&&!failed&&!snapshot().needsConfirmation?Promise.resolve():refresh();}
    writeTask=track((async()=>{
      try{while(queue.length&&!destroyed&&!retired){const command=structuredClone(queue[0]!);const {artifactId,...request}=command;const value=processingCopy(await transport(context=>submit(structuredClone(request),context)),24576);if(destroyed||retired)return;
        if(!processingObject(value)||!processingExact(value,['receipt','head']))throw new Error('Invalid processing result.');const receipt=receiptValue(value.receipt),candidate=headValue(value.head);
        if(receipt.artifactId!==artifactId||receipt.noticeId!==command.noticeId||receipt.requestId!==command.requestId||!same(receipt.activities,command.activities)||candidate.revision<receipt.revision||receipt.restrictions.some(a=>!candidate.event?.restrictions.includes(a)))throw new Error('Processing acknowledgment does not match.');
        if(candidate.revision===receipt.revision&&JSON.stringify(candidate.event)!==JSON.stringify(receipt))throw new Error('Processing receipt and head disagree.');
        applyHead(candidate,true);acknowledged.add(command.requestId);queue=queue.filter(r=>r.requestId!==command.requestId);persist();emit();
      }}catch(error){if(!destroyed){if(error instanceof ProcessingChoicesError&&error.code==='context-retired')retire();else if(!retired){failed=true;ready=false;}}}finally{writeTask=undefined;emit();}
    })());emit();return writeTask;
  }
  mergeLocal();
  const stop=env.subscribe?.(storageKey,()=>{void refresh().then(()=>retry());});
  const controller:ProcessingChoicesController={storageKey,getNotice:()=>structuredClone(notice),getSnapshot:snapshot,subscribe(listener){if(destroyed)throw new Error('Processing controller has been destroyed.');listeners.add(listener);try{listener(snapshot());}catch{}return ()=>listeners.delete(listener);},
    optOut(){if(destroyed)throw new Error('Processing controller has been destroyed.');mergeLocal();local=union(local,notice.activities);if(retired){persist();emit();return Promise.resolve();}failed=false;
      // A deliberate current-notice action also recovers surviving intent whose original outbox was lost.
      const requested=notice.activities.filter(a=>!head?.event?.restrictions.includes(a)&&!queue.some(r=>r.activities.includes(a)));
      if(requested.length)try{queue.push({schemaVersion:1,noticeId:notice.noticeId,artifactId:notice.artifactId,requestId:crypto.randomUUID(),activities:[...requested].sort()});}catch{failed=true;}
      persist();emit();return retry();},retry,refresh,refreshLocal,async settled(){while(tasks.size)await Promise.all([...tasks]);},destroy(){if(destroyed)return;destroyed=true;ready=false;for(const abort of aborts)abort.abort();try{stop?.();}catch{}emit();listeners.clear();}};
  track((async()=>{await refresh();if(queue.length)await retry();})());return controller;
}

const englishProcessingMessages:ProcessingMessages={
 retryLabel:'Try recording again',draft:'Preview — this opt-out notice needs review.',
 checking:'Checking saved restrictions. Covered processing stays off.',
 ready:'No opt-out is recorded for this context. This does not grant permission.',
 saving:'Restricted in this browser. Waiting for the record to be confirmed.',
 recorded:'Your opt-out is recorded. The site must also apply it to its processing.',
 error:'The record could not be confirmed. Covered processing stays off. Try again.',
 retired:'This processing context has closed. Covered processing stays off. Contact the site operator for help.',
 destroyed:'This privacy control has closed.',
 needsConfirmation:'A local restriction remains, but its request could not be recovered. Use the opt-out action to record it with this notice. Restrictions outside this notice need host review.',
 recoveryUnavailable:'Local recovery is unavailable; an unconfirmed request may be lost on reload.',
 recoveryInvalid:'Local recovery data needs review.',
};
/** @requirements REQ-PRODUCT-PROCESSING-CHOICES A separate deliberate opt-out surface, never a cookie consent toggle. */
export function mountProcessingChoices(container:HTMLElement,controller:ProcessingChoicesController):{destroy():void}{
  const notice=controller.getNotice(),m=notice.localization?.processingChoices??englishProcessingMessages,doc=container.ownerDocument,root=doc.createElement('section');root.className='nb-processing-choices';root.lang=notice.localization?.locale??'en';root.dir=notice.localization?.direction??'ltr';root.setAttribute('aria-label',notice.wording.title);
  const title=doc.createElement('h2');title.textContent=notice.wording.title;const description=doc.createElement('p');description.textContent=notice.wording.description;const status=doc.createElement('p');status.setAttribute('role','status');
  const action=doc.createElement('button');action.type='button';action.className='nb-choice-button';action.textContent=notice.wording.actionLabel;const retryButton=doc.createElement('button');retryButton.type='button';retryButton.className='nb-text-button';retryButton.textContent=m.retryLabel;
  const link=doc.createElement('a');link.href=notice.document.url;link.textContent=notice.document.title;root.append(title,description);
  if(notice.mode==='preview'||notice.document.reviewStatus!=='reviewed'){const draft=doc.createElement('p');draft.className='nb-draft';draft.textContent=m.draft;root.append(draft);}
  root.append(status,action,retryButton,link);container.append(root);
  const optOut=()=>{void controller.optOut();},retry=()=>{void controller.retry();};action.addEventListener('click',optOut);retryButton.addEventListener('click',retry);
  const unsubscribe=controller.subscribe(state=>{status.textContent=[state.needsConfirmation?m.needsConfirmation:m[state.status],state.persistence==='unavailable'?m.recoveryUnavailable:state.persistence==='invalid'?m.recoveryInvalid:''].filter(Boolean).join(' ');action.disabled=state.destroyed||state.status==='retired'||state.status==='saving'||notice.activities.every(a=>state.restrictedActivities.includes(a))&&state.status==='recorded';retryButton.hidden=state.destroyed||state.needsConfirmation||state.status!=='error';});
  return {destroy(){unsubscribe();action.removeEventListener('click',optOut);retryButton.removeEventListener('click',retry);root.remove();}};
}
