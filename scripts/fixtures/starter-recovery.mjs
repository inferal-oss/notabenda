// @requirements REQ-PRODUCT-CF-RECOVERY-REHEARSAL REQ-PRODUCT-EVIDENCE-LIFECYCLE
// Maintainer-only synthetic fixture. Never import this module into a shipped Worker.
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead,createConsentEvidenceStore,createEvidenceLifecycle} from '@notabenda/cloudflare';
const fenceKey='__fixture/recovery-isolated',appliedKey='__fixture/manifest-applied';
export function createRecoveryFixture(storage,data){
 const context=streamId=>({siteId:data.siteId,scopeId:data.scopeId,streamId,now:()=>new Date(data.now)});
 const lifecycle=streamId=>createEvidenceLifecycle(storage,{family:'consent',siteId:data.siteId,scopeId:data.scopeId,streamId},{now:()=>new Date(data.now)});
 const erased=()=>lifecycle('erased-context'),held=()=>lifecycle('held-context');
 const isolated=async()=>await storage.get(fenceKey)!==false;
 async function run(action,payload){
  if(action==='seed'){
   if(await storage.get(appliedKey)!==undefined||await storage.get(fenceKey)!==undefined)throw Error('Seed only a new source fixture.');
   await recordLegalRelease(storage,data.artifact);await registerConsentNotice(storage,data.notice,context('erased-context'));await setActiveConsentNotice(storage,data.notice.noticeId,context('erased-context'));
   for(const streamId of ['erased-context','held-context','retained-context'])await recordConsentChoice(storage,data.commands[streamId],context(streamId));
   const hold=await held();if(!await hold.getState())await hold.setHold({active:true,reviewAt:data.holdReviewAt,expectedRevision:0});
   await storage.put(fenceKey,false);return {seeded:3};
  }
  if(action==='snapshot'){
   const values=await storage.list({prefix:'notabenda/',limit:1001});if(values.size>1000)throw Error('Synthetic snapshot exceeds its fixed complete-fixture bound.');
   return {schemaVersion:1,kind:'synthetic-do-kv-backup',entries:[...values]};
  }
  if(action==='retire')return (await erased()).retire(data.decision);
  if(action==='purge')return (await erased()).purge({requestId:data.decision.requestId,legalHold:false,limit:1});
  if(action==='manifest')return (await erased()).getState();
  if(action==='hold-probe'){
   try{await (await held()).retire({...data.decision,requestId:data.holdRequestId});return {blocked:false};}catch(error){return {blocked:error.code==='legal-hold',code:error.code??'unexpected'};}
  }
  if(action==='hydrate'){
   if(!payload||payload.schemaVersion!==1||payload.kind!=='synthetic-do-kv-backup'||!Array.isArray(payload.entries)||payload.entries.length>1000)throw Error('Invalid synthetic backup.');
   return storage.transaction(async tx=>{
    if((await tx.list({limit:1})).size)throw Error('Restore only into an empty disposable target.');
    const seen=new Set();for(const entry of payload.entries){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!entry[0].startsWith('notabenda/')||seen.has(entry[0]))throw Error('Invalid fixture key.');seen.add(entry[0]);await tx.put(entry[0],entry[1]);}
    await tx.put(fenceKey,true);await tx.put(appliedKey,false);return {restored:seen.size,isolated:true};
   });
  }
  if(action==='apply-manifest'){
   if(!await isolated())throw Error('Recovery must remain isolated.');
   if(payload?.retirement?.requestId!==data.decision.requestId)throw Error('Wrong fixture retirement decision.');
   const state=await (await erased()).restore(payload);
   if(state.retirement?.requestId!==data.decision.requestId)throw Error('Wrong fixture retirement decision.');
   await storage.put(appliedKey,true);return state;
  }
  if(action==='open'){
   const state=await (await erased()).getState(),hold=await (await held()).getState();
   if(!await isolated()||await storage.get(appliedKey)!==true||state?.retirement?.requestId!==data.decision.requestId||state.phase!=='complete'||!hold?.hold.active)throw Error('Recovery prerequisites are incomplete.');
   await storage.put(fenceKey,false);return {opened:true};
  }
  if(action==='replay'){
   if(await isolated())return {blocked:true,code:'recovery-isolated'};
   try{await recordConsentChoice(storage,data.commands['erased-context'],context('erased-context'));return {blocked:false};}catch(error){return {blocked:error.code==='context-retired',code:error.code??'unexpected'};}
  }
  if(action==='summary'){
   const store=createConsentEvidenceStore(storage,{siteId:data.siteId,scopeId:data.scopeId}),page=await store.list({query:'',kind:'',keyPrefix:'',from:'',to:'',limit:50});
   const retirement=await (await erased()).getState();
   return {isolated:await isolated(),records:page.records.length,retirement,hold:await (await held()).getState(),heldHeadRevision:(await getConsentHead(storage,context('held-context'))).revision,headRevision:(await getConsentHead(storage,context('retained-context'))).revision,erasedHeadGone:retirement?.contextRef!==undefined&&await storage.get('notabenda/consent/'+data.siteId+'/heads/'+retirement.contextRef)===undefined};
  }
  throw Error('Unknown fixed recovery operation.');
 }
 return {isolated,run};
}
