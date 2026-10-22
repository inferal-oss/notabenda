// @requirements REQ-PRODUCT-FORM-PERMISSION-CONNECTION REQ-PRODUCT-PACK-CONNECTION
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeFormPermissionOffer} from './form-permission.js';
import type {FormPermissionController,FormPermissionOffer,FormPermissionSnapshot,FormPermissionReceipt,FormPermissionState} from './form-permission.js';

export interface FormPermissionConnectionInspection {
 schemaVersion:1;kind:'private-form-permission-connection-inspection';observedAt:string;
 offer:{comparison:'not-requested'|'matched'|'different';differingFields:string[];offerId:string;artifactId:string;siteId:string;permissionId:string;purposeId:string;channelId:string;mode:'production'|'preview';reviewStatus:'draft'|'reviewed';localized:boolean;refusalAvailable:boolean;marketingRequest:boolean;documentSha256:string;documentContentSha256:string};
 stream:{comparison:'not-requested'|'matched'|'different'|'unavailable';basis:'controller-reported-local-comparison'};
 controller:{status:FormPermissionSnapshot['status'];checked:boolean;allowed:boolean;error?:FormPermissionSnapshot['error']};
 recovery?:FormPermissionSnapshot['recovery'];
 observedHead:{status:'not-observed'}|{status:'controller-observed';revision:number;activeRevision:number;reason:FormPermissionState['reason'];grantAllowed:boolean;permitted:boolean;activeOfferComparison:'mounted-offer'|'different-offer'|'inactive'};
 historicalReceipt:{status:'none'}|{status:'controller-confirmed';action:FormPermissionReceipt['action'];offerComparison:'mounted-offer'|'different-offer'};
 publication:{status:'not-checked'};backendSelection:{status:'not-checked'};behavior:{status:'not-tested'};limits:string[];
}
export interface FormPermissionConnectionInspectionOptions {expectedOffer?:FormPermissionOffer;expectedStreamRef?:string}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const shape=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const iso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const oneOf=(v:unknown,values:readonly string[])=>typeof v==='string'&&values.includes(v);
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
const fields=['schemaVersion','marketingRequest','refusal','localization','offerId','siteId','permissionId','purposeId','channel','revision','artifactId','mode','reviewStatus','document','facts','wording','withdrawalUrl','deliveryWindowSeconds'] as const;
const errors=['not-checked','read-required','scope-restricted','stale-offer','revision-conflict','expired-command','context-retired','unavailable','invalid-response','recording-failed','superseded','destroyed'];
/** Read memory from the supplied controller. Custom read/comparison methods remain trusted host code.
 * No refresh, journal access, subscription, permission action or backend verification is performed.
 */
export function inspectFormPermissionConnection(controller:FormPermissionController,options:FormPermissionConnectionInspectionOptions={}):FormPermissionConnectionInspection {
 const fail=():never=>{throw Error('Supply a form permission controller and bounded optional expected offer/stream. No connection inspection was returned.');};
 let offer:FormPermissionOffer,expected:FormPermissionOffer|undefined,state:FormPermissionSnapshot,comparison:FormPermissionConnectionInspection['stream']['comparison']='not-requested';
 try{
  assertPlainCatalogData(options);
  if(!object(options)||!shape(options,[],['expectedOffer','expectedStreamRef'])||JSON.stringify(options).length>65536||options.expectedStreamRef!==undefined&&!hash(options.expectedStreamRef))return fail();
  if(options.expectedOffer!==undefined)expected=normalizeFormPermissionOffer(options.expectedOffer,{allowPreview:true});
  if(!controller||typeof controller.getOffer!=='function'||typeof controller.getSnapshot!=='function')return fail();
  const raw=controller.getOffer();assertPlainCatalogData(raw);offer=normalizeFormPermissionOffer(raw,{allowPreview:true});
  const snapshot=controller.getSnapshot();assertPlainCatalogData(snapshot);
  if(!object(snapshot)||JSON.stringify(snapshot).length>16384||!shape(snapshot,['checked','status','allowed','current'],['receipt','error','recovery'])||typeof snapshot.checked!=='boolean'||typeof snapshot.allowed!=='boolean'||!oneOf(snapshot.status,['idle','loading','submitting','recorded','error','retired','destroyed'])||Object.hasOwn(snapshot,'error')&&!oneOf(snapshot.error,errors))return fail();
  const receipt=(v:unknown):FormPermissionReceipt=>{
   if(!object(v)||!shape(v,['schemaVersion','id','siteId','permissionId','streamRef','offerId','artifactId','requestId','action','revision','activationRevision','clientAt','recordedAt'])||v.schemaVersion!==1||!hash(v.id)||v.siteId!==offer.siteId||v.permissionId!==offer.permissionId||!hash(v.streamRef)||!hash(v.offerId)||!hash(v.artifactId)||typeof v.requestId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v.requestId)||!oneOf(v.action,['grant','withdraw','refuse'])||!integer(v.revision)||v.revision<1||!integer(v.activationRevision)||!iso(v.clientAt)||!iso(v.recordedAt))return fail();
   return v as unknown as FormPermissionReceipt;
  };
  if(snapshot.current!==null){
   const h=snapshot.current;
   if(!object(h)||!shape(h,['schemaVersion','siteId','permissionId','streamRef','revision','event','activeOfferId','activeRevision','grantAllowed','permitted','reason'])||h.schemaVersion!==1||h.siteId!==offer.siteId||h.permissionId!==offer.permissionId||!hash(h.streamRef)||!integer(h.revision)||!integer(h.activeRevision)||!(h.activeOfferId===null||hash(h.activeOfferId))||typeof h.grantAllowed!=='boolean'||typeof h.permitted!=='boolean'||!oneOf(h.reason,['granted','not-granted','withdrawn','refused','offer-changed','inactive','scope-restricted']))return fail();
   const event=h.event===null?null:receipt(h.event);
   if((h.revision===0)!==(event===null)||event&&(event.streamRef!==h.streamRef||event.revision!==h.revision)||h.permitted!==(h.reason==='granted')||h.permitted&&(!h.grantAllowed||event?.action!=='grant'||event.offerId!==h.activeOfferId||event.activationRevision!==h.activeRevision))return fail();
  }
  if(Object.hasOwn(snapshot,'receipt')){
   const r=receipt(snapshot.receipt);
   if(snapshot.current!==null&&r.streamRef!==(snapshot.current as unknown as FormPermissionState).streamRef)return fail();
  }
  if(Object.hasOwn(snapshot,'recovery')){
   const r=snapshot.recovery;
   if(!object(r)||!shape(r,['status','pending','withdrawalPending','blocked'],['refusalPending'])||!oneOf(r.status,['loading','ready','unavailable','invalid'])||!integer(r.pending)||r.pending>1||typeof r.withdrawalPending!=='boolean'||typeof r.blocked!=='boolean'||Object.hasOwn(r,'refusalPending')&&typeof r.refusalPending!=='boolean')return fail();
  }
  state=snapshot as unknown as FormPermissionSnapshot;
  if(options.expectedStreamRef!==undefined){
   if(controller.isForStream===undefined)comparison='unavailable';
   else{if(typeof controller.isForStream!=='function')return fail();const match=controller.isForStream(options.expectedStreamRef);if(typeof match!=='boolean')return fail();comparison=match?'matched':'different';}
  }
 }catch{return fail();}
 const differingFields=expected?fields.filter(k=>canonical(offer[k])!==canonical(expected[k])):[];
 return {schemaVersion:1,kind:'private-form-permission-connection-inspection',observedAt:new Date().toISOString(),
  offer:{comparison:expected?(differingFields.length?'different':'matched'):'not-requested',differingFields,offerId:offer.offerId,artifactId:offer.artifactId,siteId:offer.siteId,permissionId:offer.permissionId,purposeId:offer.purposeId,channelId:offer.channel.id,mode:offer.mode,reviewStatus:offer.reviewStatus,localized:offer.localization!==undefined,refusalAvailable:offer.refusal!==undefined,marketingRequest:offer.marketingRequest!==undefined,documentSha256:offer.document.sha256,documentContentSha256:offer.document.contentSha256},
  stream:{comparison,basis:'controller-reported-local-comparison'},
  controller:{status:state.status,checked:state.checked,allowed:state.allowed,...(state.error?{error:state.error}:{})},
  ...(state.recovery?{recovery:{status:state.recovery.status,pending:state.recovery.pending,withdrawalPending:state.recovery.withdrawalPending,blocked:state.recovery.blocked,...(state.recovery.refusalPending!==undefined?{refusalPending:state.recovery.refusalPending}:{})}}:{}),
  observedHead:state.current?{status:'controller-observed',revision:state.current.revision,activeRevision:state.current.activeRevision,reason:state.current.reason,grantAllowed:state.current.grantAllowed,permitted:state.current.permitted,activeOfferComparison:state.current.activeOfferId===null?'inactive':state.current.activeOfferId===offer.offerId?'mounted-offer':'different-offer'}:{status:'not-observed'},
  historicalReceipt:state.receipt?{status:'controller-confirmed',action:state.receipt.action,offerComparison:state.receipt.offerId===offer.offerId?'mounted-offer':'different-offer'}:{status:'none'},
  publication:{status:'not-checked'},backendSelection:{status:'not-checked'},behavior:{status:'not-tested'},limits:[
   'A local observation of supplied controller methods, not an authenticated report, server binding or legal-compliance verdict. Custom controller methods are trusted host code.',
   'Offer comparison covers the complete normalized offer, including wording, facts, localization, refusal and marketing-request settings. It does not authenticate digests, archives, publication or legal suitability.',
   'Stream matching is a local controller assertion. It does not verify identity, contact generation, authorization or server selection. No stream reference is included in this report.',
   'Allowed is the controller’s local projection. The observed head may be old or refer to another offer; active-offer comparison is reported separately. Refresh and application checks remain the host’s responsibility.',
   'An observed head is not a receipt for an action taken by this controller. A historical receipt can survive later reads, errors or pending actions and can refer to earlier wording. Neither establishes current downstream permission.',
   'No observed head or confirmed receipt does not establish absence of a server record. An unconfirmed action may already have been saved. Pending counts and local negative-action flags describe different recovery facts.',
   'This inspection does not subscribe, read a journal, refresh, change a checkbox, submit, retry or destroy. Publication, backend selection and downstream behavior need separate checks. Keep this diagnostic private.'
  ]};
}
