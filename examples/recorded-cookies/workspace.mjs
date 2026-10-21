// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CONSENT-NOTICE-FILES
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,getConsentHead,recordConsentChoice,getConsentRecordingSelection,createConsentEvidenceStore,createAdminWorker} from '@notabenda/cloudflare';

const publicErrors=new Set(['invalid-request','stale-notice','revision-conflict','expired-command','idempotency-conflict','scope-restricted','context-retired']);
/** RPC errors are data: custom Error properties need not survive a binding boundary. */
export async function cookieReply(work){
  try{return {ok:true,value:JSON.parse(JSON.stringify(await work()))};}
  catch(error){return {ok:false,code:publicErrors.has(error.code)?error.code:'unavailable'};}
}

/** Trusted application composition. No browser value selects a site, scope or notice. */
export function createCookieWorkspace(storage, release) {
  const fixed = {siteId:release.notice.siteId,scopeId:release.notice.scopeId,allowPreview:release.runtime.mode==='preview'};
  const context = streamId => ({...fixed,streamId});
  return {
    read: streamId => getConsentHead(storage,context(streamId)),
    record: (streamId,command) => recordConsentChoice(storage,command,context(streamId)),
    selection: () => getConsentRecordingSelection(storage,fixed),
    async register() {
      await recordLegalRelease(storage,release.artifact);
      return registerConsentNotice(storage,release.notice,fixed);
    },
    async activate() {
      await setActiveConsentNotice(storage,release.notice.noticeId,fixed);
      return {noticeId:release.notice.noticeId};
    },
    inspect(request) {
      return createAdminWorker({basePath:'/backoffice/choices',title:'Cookie choices',workspaceLabel:'Cookie recording example',navigation:[{label:'Notice setup',href:'/backoffice'},{label:'Cookie choices',href:'/backoffice/choices'},{label:'Visitor page',href:'/'}],authorize:()=>({store:createConsentEvidenceStore(storage,fixed),scopeLabel:fixed.siteId})}).fetch(request,{});
    },
  };
}
