// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE
// Explicit synthetic local fixtures. No visitor context, public ingestion or deletion endpoint.
import {createEvidenceLifecycle,recordLegalRelease,registerConsentNotice,recordConsentChoice,registerProcessingNotice,recordProcessingRestriction,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance,getProcessingHead} from '@notabenda/cloudflare';
export const lifecycleDemoPrefix='host/lifecycle-demo/';
const at='2026-10-18T12:00:00.000Z',now=()=>new Date(at);
const requests={complete:'00000000-0000-4000-8000-000000000081',held:'00000000-0000-4000-8000-000000000082',pending:'00000000-0000-4000-8000-000000000083',processing:'00000000-0000-4000-8000-000000000084',terms:'00000000-0000-4000-8000-000000000085'};
const retirement=key=>({requestId:requests[key],reason:'retention-expired',eligibleAt:at,legalHold:false});
async function finish(controller,requestId){for(let i=0;i<10;i++){const state=await controller.purge({requestId,legalHold:false,limit:10});if(state.phase==='complete')return state;}throw Error('Synthetic lifecycle did not finish');}
export async function seedEvidenceLifecycle(storage,data){
 const bootstrapKey='host/lifecycle-demo-bootstrap/v1';if(await storage.get(bootstrapKey))return;
 const notice=data.consent.notice,base={siteId:notice.siteId,scopeId:notice.scopeId,prefix:lifecycleDemoPrefix,allowPreview:true,now};
 await recordLegalRelease(storage,data.consent.artifact);await registerConsentNotice(storage,notice,base);
 for(const mode of ['complete','held','pending']){
  const context={...base,streamId:'synthetic-lifecycle-'+mode},target={family:'consent',siteId:context.siteId,scopeId:context.scopeId,streamId:context.streamId,prefix:lifecycleDemoPrefix},controller=await createEvidenceLifecycle(storage,target,{now});
  const existing=await controller.getState();
  if(existing){if(mode==='complete'){await controller.restore(existing);await finish(controller,requests.complete);}continue;}
  const command={schemaVersion:1,noticeId:notice.noticeId,requestId:requests[mode],expectedRevision:0,action:'revoke-all',choices:Object.fromEntries(Object.keys(notice.scopes).map(id=>[id,false])),clientAt:at};
  const result=await recordConsentChoice(storage,command,context);
  if(mode==='held'){await controller.setHold({active:true,reviewAt:'2026-11-18T12:00:00.000Z',expectedRevision:0});continue;}
  await controller.retire(retirement(mode));
  if(mode==='complete'){
   const eventKey=lifecycleDemoPrefix+'events/'+result.receipt.id,headKey=lifecycleDemoPrefix+'heads/'+controller.contextRef,event=await storage.get(eventKey),head=await storage.get(headKey),manifest=await finish(controller,requests.complete);
   // Restore drill: old payload + head cannot authorize a retry while the marker survives.
   await storage.put(eventKey,event);await storage.put(headKey,head);
   try{await recordConsentChoice(storage,command,context);throw Error('Retired retry unexpectedly succeeded');}catch(error){if(error.code!=='context-retired')throw error;}
   await controller.restore(manifest);await finish(controller,requests.complete);
  }
 }
 const p=data.processing.notice,pc={siteId:p.siteId,scopeId:p.scopeId,streamId:'synthetic-lifecycle-processing',provenance:'explicit-opt-out',prefix:lifecycleDemoPrefix,allowPreview:true,now};
 const processing=await createEvidenceLifecycle(storage,{family:'processing',siteId:pc.siteId,scopeId:pc.scopeId,streamId:pc.streamId,prefix:lifecycleDemoPrefix},{now});
 if(!await processing.getState()){
  await recordLegalRelease(storage,data.processing.artifact);await registerProcessingNotice(storage,p,pc);await recordProcessingRestriction(storage,{schemaVersion:1,noticeId:p.noticeId,requestId:requests.processing,activities:[p.activities[0]]},pc);await processing.retire(retirement('processing'));await finish(processing,requests.processing);
 }else{const state=await processing.getState();await processing.restore(state);await finish(processing,requests.processing);}
 try{await getProcessingHead(storage,pc);throw Error('Retired processing unexpectedly became live');}catch(error){if(error.code!=='context-retired')throw error;}
 const offer=data.agreements[0].offer,tc={siteId:offer.siteId,scopeId:offer.scopeId,subjectId:'synthetic-lifecycle-subject',operationId:'synthetic-lifecycle-operation',prefix:lifecycleDemoPrefix,allowPreview:true,now};
 const terms=await createEvidenceLifecycle(storage,{family:'terms',siteId:tc.siteId,subjectId:tc.subjectId,prefix:lifecycleDemoPrefix},{now});
 if(!await terms.getState()){
  await registerTermsOffer(storage,offer,tc);await setActiveTermsOffer(storage,offer.offerId,tc);await recordTermsAcceptance(storage,{schemaVersion:1,offerId:offer.offerId,requestId:requests.terms,accepted:true},tc);await terms.retire(retirement('terms'));await finish(terms,requests.terms);
 }else{const state=await terms.getState();await terms.restore(state);await finish(terms,requests.terms);}
 await storage.put(bootstrapKey,{schemaVersion:1,synthetic:true});
}
