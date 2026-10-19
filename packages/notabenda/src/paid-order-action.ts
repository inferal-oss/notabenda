// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-SAFE-CONTENT
import {normalizePaidOrderReview,copyPaidOrderData,paidOrderHash} from './paid-order-policy.js';
import type {PaidOrderReview} from './paid-order-policy.js';
export interface PaidOrderRequest {schemaVersion:1;requestId:string;reviewId:string;definitionId:string;quoteId:string;quoteRevision:string;contextRef:string}
export type PaidOrderOutcome=PaidOrderRequest&({status:'received';id:string;receivedAt:string}|{status:'rejected';reason:'stale-quote'|'expired-quote'|'unavailable'|'checkout-used'});
export interface PaidOrderSnapshot {status:'ready'|'submitting'|'uncertain'|'reconciling'|'received'|'stale'|'unavailable'|'destroyed';presentationReady:boolean;canReconcile:boolean;request?:PaidOrderRequest;outcome?:PaidOrderOutcome}
export interface PaidOrderActionOptions {
 submit(request:PaidOrderRequest,context:{signal:AbortSignal}):Promise<unknown>;
 /** Reconcile or atomically replay the SAME attempt. A missing/uncertain outcome never permits a new nonce. */
 recoverAttempt?(request:PaidOrderRequest,context:{signal:AbortSignal}):Promise<unknown>;
 recovery?:PaidOrderRequest;allowPreview?:boolean;timeoutMs?:number;now?:()=>Date;
}
export interface PaidOrderActionController {
 getReview():PaidOrderReview;getSnapshot():PaidOrderSnapshot;getRecoveryRequest():PaidOrderRequest|undefined;
 subscribe(listener:(snapshot:PaidOrderSnapshot)=>void):()=>void;setPresentationReady(ready:boolean,guard?:()=>boolean):void;refresh():void;
 submit():Promise<PaidOrderOutcome>;reconcile():Promise<PaidOrderOutcome>;destroy():void;
}
export class PaidOrderActionError extends Error {constructor(readonly code:'presentation-required'|'stale-quote'|'reconciliation-required'|'uncertain'|'unavailable'|'destroyed'){super(code);this.name='PaidOrderActionError';}}
const canonical=(v:unknown):string=>v&&typeof v==='object'?Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}':JSON.stringify(v);
async function sha(value:unknown):Promise<string>{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');}
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
function requestValue(input:unknown,review:PaidOrderReview):PaidOrderRequest {
 const r=copyPaidOrderData(input) as PaidOrderRequest,q=review.quote;
 if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).sort().join(',')!==['schemaVersion','requestId','reviewId','definitionId','quoteId','quoteRevision','contextRef'].sort().join(',')||r.schemaVersion!==1||!uuid(r.requestId)||r.reviewId!==review.reviewId||r.definitionId!==review.definition.definitionId||r.quoteId!==q.quoteId||r.quoteRevision!==q.revision||r.contextRef!==q.contextRef)throw new PaidOrderActionError('unavailable');return r;
}
function outcomeValue(input:unknown,request:PaidOrderRequest,review:PaidOrderReview):PaidOrderOutcome {
 const r=copyPaidOrderData(input) as PaidOrderOutcome;
 if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Invalid order outcome');
 const fields=r.status==='received'?['status','id','receivedAt']:r.status==='rejected'?['status','reason']:[];
 if(!fields.length||Object.keys(r).sort().join(',')!==[...Object.keys(request),...fields].sort().join(',')||Object.entries(request).some(([k,v])=>(r as unknown as Record<string,unknown>)[k]!==v))throw Error('Mismatched order outcome');
 if(r.status==='received'){if(!paidOrderHash(r.id)||typeof r.receivedAt!=='string'||!Number.isFinite(Date.parse(r.receivedAt))||new Date(r.receivedAt).toISOString()!==r.receivedAt||Date.parse(r.receivedAt)<Date.parse(review.quote.issuedAt)||Date.parse(r.receivedAt)>=Date.parse(review.quote.expiresAt))throw Error('Invalid received time');}
 else if(!['stale-quote','expired-quote','unavailable','checkout-used'].includes(r.reason))throw Error('Invalid rejection');return r;
}
/** Host transport owns atomic quote admission, idempotency, payment and durable confirmation. Client state is not evidence of those outcomes. */
export function createPaidOrderAction(input:unknown,options:PaidOrderActionOptions):PaidOrderActionController {
 const review=normalizePaidOrderReview(input,{allowPreview:options?.allowPreview===true});
 if(!options||typeof options.submit!=='function'||options.recoverAttempt!==undefined&&typeof options.recoverAttempt!=='function'||options.now!==undefined&&typeof options.now!=='function'||options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean'||options.timeoutMs!==undefined&&(!Number.isInteger(options.timeoutMs)||options.timeoutMs<100||options.timeoutMs>60000))throw new PaidOrderActionError('unavailable');
 const submit=options.submit,recover=options.recoverAttempt,clock=options.now??(()=>new Date()),timeout=options.timeoutMs??15000,listeners=new Set<(s:PaidOrderSnapshot)=>void>();
 let request=options.recovery===undefined?undefined:requestValue(options.recovery,review),state:PaidOrderSnapshot={status:request?'uncertain':'ready',presentationReady:false,canReconcile:typeof recover==='function',...(request?{request}:{} )},flight:Promise<PaidOrderOutcome>|undefined,abort:AbortController|undefined,presentationGuard:(()=>boolean)|undefined;
 const snapshot=()=>copyPaidOrderData(state) as PaidOrderSnapshot;
 function emit(){for(const listener of [...listeners]){try{listener(snapshot());}catch{ /* An observer cannot interrupt order state changes. */ }}}
 function destroyed():boolean{return state.status==='destroyed';}
 function refresh(){if(state.status!=='ready')return;let at:number;try{at=clock().getTime();}catch{at=NaN;}if(state.status!=='ready')return;if(!Number.isFinite(at)||at<Date.parse(review.quote.issuedAt)){state={...state,status:'unavailable'};emit();}else if(at>=Date.parse(review.quote.expiresAt)){state={...state,status:'stale'};emit();}}
 function presented():boolean{try{if(!state.presentationReady||destroyed())return false;const allowed=!presentationGuard||presentationGuard();return allowed&&state.presentationReady&&!destroyed();}catch{return false;}}
 function checkPresented():boolean{if(presented())return true;state={...state,presentationReady:false};emit();return false;}
 function error(code:PaidOrderActionError['code']):never{throw new PaidOrderActionError(code);}
 function attempt(reconciling:boolean):Promise<PaidOrderOutcome>{
  if(destroyed())return Promise.reject(new PaidOrderActionError('destroyed'));
  if(flight)return flight;
  if(state.status==='received')return Promise.resolve(copyPaidOrderData(state.outcome) as PaidOrderOutcome);
  refresh();
  if(reconciling?state.status!=='uncertain'||!request||!recover:state.status==='uncertain')return Promise.reject(new PaidOrderActionError('reconciliation-required'));
  if(!reconciling&&state.status!=='ready')return Promise.reject(new PaidOrderActionError(state.status==='stale'?'stale-quote':'unavailable'));
  if(!reconciling&&!checkPresented())return Promise.reject(new PaidOrderActionError(destroyed()?'destroyed':'presentation-required'));
  // Defer notifications until flight is installed, including reentrant subscriptions.
  flight=Promise.resolve().then(async()=>{
   const {definitionId,...definition}=review.definition,{reviewId,...content}=review;
   let verified=false;try{verified=await sha(definition)===definitionId&&await sha(content)===reviewId;}catch{}
   if(destroyed())return error('destroyed');
   if(!verified){state={...state,status:'unavailable'};emit();return error('unavailable');}
   if(!reconciling){refresh();if(state.status!=='ready')return error(state.status==='stale'?'stale-quote':'unavailable');if(!checkPresented())return error(destroyed()?'destroyed':'presentation-required');}
   try{request??=requestValue({schemaVersion:1,requestId:crypto.randomUUID(),reviewId,definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef},review);}catch{state={...state,status:'unavailable'};emit();return error('unavailable');}
   state={...state,status:reconciling?'reconciling':'submitting',request};emit();
   if(destroyed())return error('destroyed');
   abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,dispatched=false;
   try{
    const sent=copyPaidOrderData(request) as PaidOrderRequest,transport=reconciling?recover!:submit;
    const result=await Promise.race([Promise.resolve().then(()=>{if(destroyed())return error('destroyed');if(!reconciling&&!checkPresented())return error(destroyed()?'destroyed':'presentation-required');dispatched=true;return transport(sent,{signal:abort!.signal});}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort?.abort();reject(new PaidOrderActionError('uncertain'));},timeout);})]);
    if(destroyed())return error('destroyed');const outcome=outcomeValue(result,request,review);
    state={...state,status:outcome.status==='received'?'received':['unavailable','checkout-used'].includes(outcome.reason)?'unavailable':'stale',outcome};emit();return copyPaidOrderData(outcome) as PaidOrderOutcome;
   }catch(cause){if(destroyed())return error('destroyed');if(!dispatched){state={...state,status: cause instanceof PaidOrderActionError&&cause.code==='presentation-required'?'ready':'unavailable',presentationReady:false};emit();throw cause;}state={...state,status:'uncertain',request};emit();throw new PaidOrderActionError('uncertain');}
   finally{if(timer!==undefined)clearTimeout(timer);abort=undefined;}
  });
  const current=flight;void current.finally(()=>{if(flight===current)flight=undefined;}).catch(()=>{});return current;
 }
 const controller:PaidOrderActionController={getReview:()=>copyPaidOrderData(review) as PaidOrderReview,getSnapshot:()=>{refresh();return snapshot();},getRecoveryRequest:()=>request?copyPaidOrderData(request) as PaidOrderRequest:undefined,
  subscribe(listener){listeners.add(listener);try{listener(controller.getSnapshot());}catch{}return ()=>listeners.delete(listener);},
  setPresentationReady(ready,guard){if(typeof ready!=='boolean'||guard!==undefined&&typeof guard!=='function')throw new PaidOrderActionError('unavailable');if(['received','stale','unavailable','destroyed'].includes(state.status))return;presentationGuard=guard;state={...state,presentationReady:ready};emit();},refresh,
  submit:()=>attempt(false),reconcile:()=>attempt(true),destroy(){if(destroyed())return;abort?.abort();state={...state,status:'destroyed',presentationReady:false};emit();listeners.clear();},
 };refresh();return controller;
}
