// @requirements REQ-PRODUCT-DEMO-WORKSPACE
// Deliberately fictional journeys generated through the same immutable ledger APIs as integrations.
import {recordConsentChoice,recordTermsAcceptance,recordProcessingRestriction} from '@notabenda/cloudflare';
const uuid=n=>`d3e00000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export async function seedDemoWorkspace(storage,data){
 const marker='demo/seed-v1';if(await storage.get(marker))return;
 let started=await storage.get('demo/seed-time');if(!started){started=new Date().toISOString();await storage.put('demo/seed-time',started);}
 const base=Date.parse(started),ids=Object.keys(data.consent.notice.scopes);
 for(let visitor=0;visitor<18;visitor++){
  const streamId=`fictional-reader-${String(visitor+1).padStart(3,'0')}`;
  const context={siteId:data.consent.notice.siteId,scopeId:data.consent.notice.scopeId,streamId,allowPreview:true};
  const actions=visitor%3===0?['accept-all','revoke-all']:visitor%3===1?['save']:['revoke-all'];
  for(let revision=0;revision<actions.length;revision++){
   const action=actions[revision],at=new Date(base-(18-visitor)*3600000+revision*1200000);
   await recordConsentChoice(storage,{schemaVersion:1,noticeId:data.consent.notice.noticeId,requestId:uuid(visitor*10+revision+1),expectedRevision:revision,action,choices:Object.fromEntries(ids.map((id,index)=>[id,action==='accept-all'||action==='save'&&index===0])),clientAt:new Date(at.getTime()-1200).toISOString()},{...context,now:()=>at});
  }
 }
 for(let reader=0;reader<10;reader++){
  const {offer}=data.agreements.find(entry=>entry.theme==='light');
  await recordTermsAcceptance(storage,{schemaVersion:1,offerId:offer.offerId,requestId:uuid(1000+reader),accepted:true},{siteId:offer.siteId,scopeId:offer.scopeId,subjectId:`fictional-member-${String(reader+1).padStart(3,'0')}`,operationId:`fictional-membership-${reader+1}`,allowPreview:true,now:()=>new Date(base-(12-reader)*3600000)});
 }
 for(let reader=0;reader<8;reader++){
  const notice=data.processing.notice;
  await recordProcessingRestriction(storage,{schemaVersion:1,noticeId:notice.noticeId,requestId:uuid(2000+reader),activities:['sale']},{siteId:notice.siteId,scopeId:notice.scopeId,streamId:`fictional-privacy-reader-${reader+1}`,provenance:'explicit-opt-out',allowPreview:true,now:()=>new Date(base-(10-reader)*3600000)});
 }
 await storage.put(marker,{kind:'fictional-seed',version:1,seededAt:started,journeys:36});
}
