// @requirements REQ-PRODUCT-CONSENT-EVIDENCE
// Fixed fictional reports for inspecting the ledger. This does not capture visitor choices.
import { recordLegalRelease, registerConsentNotice, setActiveConsentNotice, recordConsentChoice, createConsentEvidenceStore } from '@notabenda/cloudflare';
export async function seedConsentExample(storage,{artifact,notice}) {
  const context={siteId:notice.siteId,scopeId:notice.scopeId,streamId:'fictional-cookie-stream:'+notice.noticeId,allowPreview:true};
  await recordLegalRelease(storage,artifact); await registerConsentNotice(storage,notice,context);
  await setActiveConsentNotice(storage,notice.noticeId,context);
  const ids=Object.keys(notice.scopes); const records=[];
  for(const [revision,action,clientAt,recordedAt] of [
    [0,'accept-all','2026-10-18T09:00:00.000Z','2026-10-18T09:00:01.000Z'],
    [1,'revoke-all','2026-10-18T10:00:00.000Z','2026-10-18T10:00:02.000Z'],
    [2,'save','2026-10-18T11:00:00.000Z','2026-10-18T11:00:01.000Z'],
  ]) {
    const result=await recordConsentChoice(storage,{schemaVersion:1,noticeId:notice.noticeId,requestId:`00000000-0000-4000-8000-00000000000${revision}`,expectedRevision:revision,action,choices:Object.fromEntries(ids.map((id,index)=>[id,action==='accept-all'||action==='save'&&index===0])),clientAt},{...context,now:()=>new Date(recordedAt)});
    records.push(result.receipt.id);
  }
  return {records,store:createConsentEvidenceStore(storage,context)};
}
