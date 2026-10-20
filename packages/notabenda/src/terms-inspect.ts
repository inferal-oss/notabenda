// @requirements REQ-PRODUCT-TERMS-CONNECTION REQ-PRODUCT-PACK-CONNECTION
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeTermsOffer,validTermsRequestId} from './terms.js';
import type {TermsAcceptanceController,TermsAcceptanceSnapshot,TermsAcceptanceStatus,TermsOffer} from './terms.js';

export interface TermsConnectionInspection {
 schemaVersion:1;kind:'private-terms-connection-inspection';observedAt:string;
 offer:{comparison:'not-requested'|'matched'|'different';differingFields:string[];offerId:string;artifactId:string;siteId:string;scopeId:string;mode:'preview'|'production';documentSha256:string;documentContentSha256:string;reviewStatus:'draft'|'reviewed';localized:boolean};
 operation:{comparison:'not-requested'|'matched'|'different'|'unavailable';basis:'controller-reported-local-comparison'};
 controller:{status:TermsAcceptanceStatus;checked:boolean;requestKeyPresent:boolean;error?:TermsAcceptanceSnapshot['error']};
 receipt:{status:'controller-confirmed'|'none'};
 publication:{status:'not-checked'};backendSelection:{status:'not-checked'};behavior:{status:'not-tested'};limits:string[];
}
export interface TermsConnectionInspectionOptions {expectedOffer?:TermsOffer;expectedOperationId?:string}
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const operation=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&new TextEncoder().encode(v).length<=200&&!/[\u0000-\u001f\u007f]/u.test(v);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const fields=['schemaVersion','offerId','artifactId','siteId','scopeId','mode','document','statement','actionLabel','localization'] as const;
/** Read the supplied controller only. Built-in read/comparison methods have no storage,
 * network, subscription or acceptance effects. Custom methods remain trusted host code.
 */
export function inspectTermsConnection(controller:TermsAcceptanceController,options:TermsConnectionInspectionOptions={}):TermsConnectionInspection {
 const fail=():never=>{throw Error('Supply a terms controller and bounded optional expected offer/operation. No connection inspection was returned.');};
 let current:TermsOffer,expected:TermsOffer|undefined,state:TermsAcceptanceSnapshot,comparison:TermsConnectionInspection['operation']['comparison']='not-requested';
 try{
  assertPlainCatalogData(options);
  if(!object(options)||Object.keys(options).some(k=>!['expectedOffer','expectedOperationId'].includes(k))||options.expectedOperationId!==undefined&&!operation(options.expectedOperationId))return fail();
  if(options.expectedOffer!==undefined)expected=normalizeTermsOffer(options.expectedOffer,{allowPreview:true});
  if(!controller||typeof controller.getOffer!=='function'||typeof controller.getSnapshot!=='function')return fail();
  const offer=controller.getOffer();assertPlainCatalogData(offer);current=normalizeTermsOffer(offer,{allowPreview:true});
  const snapshot=controller.getSnapshot();assertPlainCatalogData(snapshot);
  if(!object(snapshot)||Object.keys(snapshot).some(k=>!['checked','status','requestId','receipt','error'].includes(k))||typeof snapshot.checked!=='boolean'||typeof snapshot.status!=='string'||!['idle','submitting','recorded','error','stale','retired','destroyed'].includes(snapshot.status)||snapshot.requestId!==undefined&&!validTermsRequestId(snapshot.requestId)||snapshot.error!==undefined&&(typeof snapshot.error!=='string'||!['unavailable','recording-failed','invalid-receipt','stale-offer','context-retired'].includes(snapshot.error)))return fail();
  if(snapshot.receipt!==undefined){
   const r=snapshot.receipt;
   if(!object(r)||Object.keys(r).some(k=>!['schemaVersion','id','offerId','requestId','operationId','artifactId','documentSha256','documentVersion','recordedAt'].includes(k))||r.schemaVersion!==1||!hash(r.id)||r.offerId!==current.offerId||r.requestId!==snapshot.requestId||!validTermsRequestId(r.requestId)||!operation(r.operationId)||r.artifactId!==current.artifactId||r.documentSha256!==current.document.sha256||r.documentVersion!==current.document.version||typeof r.recordedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(r.recordedAt)||!Number.isFinite(Date.parse(r.recordedAt))||new Date(r.recordedAt).toISOString()!==r.recordedAt||!['recorded','destroyed'].includes(snapshot.status))return fail();
  }else if(snapshot.status==='recorded')return fail();
  state=snapshot as unknown as TermsAcceptanceSnapshot;
  if(options.expectedOperationId!==undefined){
   if(controller.isForOperation===undefined)comparison='unavailable';
   else {if(typeof controller.isForOperation!=='function')return fail();const match=controller.isForOperation(options.expectedOperationId);if(typeof match!=='boolean')return fail();comparison=match?'matched':'different';}
  }
 }catch{return fail();}
 const differingFields=expected?fields.filter(k=>canonical(current[k])!==canonical(expected[k])):[];
 return {schemaVersion:1,kind:'private-terms-connection-inspection',observedAt:new Date().toISOString(),
  offer:{comparison:expected?(differingFields.length?'different':'matched'):'not-requested',differingFields,offerId:current.offerId,artifactId:current.artifactId,siteId:current.siteId,scopeId:current.scopeId,mode:current.mode,documentSha256:current.document.sha256,documentContentSha256:current.document.contentSha256,reviewStatus:current.document.reviewStatus,localized:current.schemaVersion===2},
  operation:{comparison,basis:'controller-reported-local-comparison'},
  controller:{status:state.status,checked:state.checked,requestKeyPresent:state.requestId!==undefined,...(state.error?{error:state.error}:{})},
  receipt:{status:state.receipt?'controller-confirmed':'none'},publication:{status:'not-checked'},backendSelection:{status:'not-checked'},behavior:{status:'not-tested'},
  limits:[
   'A local observation of supplied controller methods, not an authenticated report, server binding or legal-compliance verdict. Custom controller methods are trusted host code.',
   'Offer comparison covers the complete normalized offer, including document metadata, statement, action and localization. It does not authenticate its digests, archive or publication.',
   'Operation matching is reported by the supplied optional comparison method. It does not verify server identity, authorization, operation selection or an Astro view context key.',
   'A request key can exist before submission or after an uncertain attempt. Its presence does not establish that a request was sent or a record exists.',
   'A confirmed receipt reflects this controller’s prior validation. Error or submission states leave server outcomes uncertain; destroyed controllers can retain historical receipts. No state grants current permission or performs fulfillment.',
   'The inspector does not subscribe, check a box, submit, retry, refresh or destroy the controller. Publication, current backend selection and real application behavior need separate checks. Keep this diagnostic private.'
  ]};
}
