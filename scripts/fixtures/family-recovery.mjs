// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-PROCESSING-CHOICES
// Fixed maintainer fixture, not a generic journal importer or production recovery endpoint.
import {registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance,createTermsAcceptanceStore,registerFormPermissionOffer,setActiveFormPermissionOffer,getFormPermissionState,recordFormPermission,createFormPermissionStore,getProcessingHead,createProcessingRestrictionStore,createEvidenceLifecycle} from '@notabenda/cloudflare';
import {createProcessingWorkspace} from '../../examples/processing-application/workspace.mjs';
const canonical=value=>JSON.stringify(order(value));
function order(value){return Array.isArray(value)?value.map(order):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,order(value[k])])):value;}
const same=(a,b)=>canonical(a)===canonical(b),fail=message=>{throw Error(message);};
const query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50},baseKey='__fixture/families',appliedKey=baseKey+'/applied',initialKey=baseKey+'/initial',outcomeKey=baseKey+'/outcomes';
const sha=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value))))].map(v=>v.toString(16).padStart(2,'0')).join('');
export function validateFamilyRecoveryJournal(value,data){
 if(!value||!same(Object.keys(value).sort(),['intents','outcomes','retirements'])||!same(value.intents,data.intents)||!value.outcomes||!same(Object.keys(value.outcomes).sort(),['permissionWithdrawal','processingRestriction','unconfirmed'])||value.outcomes.unconfirmed!==true||!same(Object.keys(value.retirements??{}).sort(),Object.keys(data.targets).sort()))fail('wrong-family-journal');
 for(const family of Object.keys(data.targets)){
  const r=value.retirements[family],target=data.targets[family];
  if(!r||r.family!==family||r.siteId!==data.siteId||r.retirement?.requestId!==data.decisions[family].requestId||r.phase!=='complete'||r.hold?.active!==false||r.contextRef!==data.contextRefs[family])fail('wrong-family-journal');
 }
 const permission=value.outcomes.permissionWithdrawal,processing=value.outcomes.processingRestriction;
 if(permission?.receipt?.requestId!==data.withdrawal.requestId||permission.receipt.action!=='withdraw'||permission.state?.permitted!==false||processing?.receipt?.requestId!==data.processingCommands['processing-restricted'].requestId||processing.receipt.provenance!=='browser-report')fail('wrong-family-journal');
 return value;
}
export function createFamilyRecovery(storage,data,{send}={}){
 let failEvent=false;
 const now=()=>new Date(data.now),life=target=>createEvidenceLifecycle(storage,target,{now});
 const termContext=(subjectId,scopeId)=>({siteId:data.siteId,subjectId,scopeId,operationId:subjectId+':'+scopeId+':original',now});
 const permissionContext=streamId=>({siteId:data.siteId,permissionId:data.permissionId,streamId,now});
 const processingContext=streamId=>({siteId:data.siteId,scopeId:data.processingScope,streamId});
 const wrapped=new Proxy(storage,{get(target,key){if(key==='transaction')return work=>target.transaction(tx=>work(new Proxy(tx,{get(t,k){if(k==='put')return (name,value)=>{if(failEvent&&name.includes('/events/'))throw Error('synthetic-pending-write');return t.put(name,value);};return typeof t[k]==='function'?t[k].bind(t):t[k];}})));return typeof target[key]==='function'?target[key].bind(target):target[key];}});
 const processing=createProcessingWorkspace(wrapped,{artifact:data.artifact,runtime:data.runtime,notice:data.processingNotice},{send,now});
 async function survivingEvents(){
  const events={};
  const read=async(family,id)=>{const key='notabenda/'+family+'/'+data.siteId+'/events/'+id;events[key]=await storage.get(key);};
  for(const subject of data.termsSubjects)if(subject!=='terms-erased')for(const scope of data.termsScopes)await read('terms',await sha([data.siteId,subject,data.termsCommands[subject][scope].requestId]));
  for(const id of data.permissionStreams)if(id!=='permission-erased')await read('permissions',await sha([await sha([data.siteId,data.permissionId,id]),data.permissionGrants[id].requestId]));
  for(const id of ['processing-held','processing-retained'])await read('processing',await sha([await sha([data.siteId,data.processingScope,id]),data.processingCommands[id].requestId]));
  return events;
 }
 async function summary(){
  const held={},retirements={};for(const family of Object.keys(data.targets)){held[family]=await (await life(data.heldTargets[family])).getState()??null;retirements[family]=await (await life(data.targets[family])).getState()??null;}
  const permissionStates={};for(const id of data.permissionStreams)try{permissionStates[id]=await getFormPermissionState(storage,permissionContext(id));}catch(e){if(e.code!=='context-retired')throw e;permissionStates[id]={retired:true};}
  const processingHeads={},pending={};for(const id of data.processingStreams){try{processingHeads[id]=await getProcessingHead(storage,processingContext(id));}catch(e){if(e.code!=='context-retired')throw e;processingHeads[id]={retired:true};}pending[id]=await processing.pending(id);}
  const list=async store=>(await store.list(query)).records;
  const termRecords=await list(createTermsAcceptanceStore(storage,{siteId:data.siteId})),permissionRecords=await list(createFormPermissionStore(storage,{siteId:data.siteId})),processingRecords=await list(createProcessingRestrictionStore(storage,{siteId:data.siteId,scopeId:data.processingScope}));
  const physical={};for(const family of Object.keys(data.targets)){const prefix='notabenda/'+family+'/'+data.siteId+'/';physical[family]={events:[...(await storage.list({prefix:prefix+'events/',limit:100})).values()].filter(e=>family==='terms'?e.subjectId==='terms-erased':e.streamRef===data.contextRefs[family]).length,...(family==='terms'?{}:{headGone:await storage.get(prefix+'heads/'+data.contextRefs[family])===undefined})};}
  return {counts:{terms:termRecords.length,permissions:permissionRecords.length,processing:processingRecords.length},held,retirements,permissionStates,processingHeads,pending,physical,applied:await storage.get(appliedKey)??null};
 }
 return {
  async seed(){
   for(const scope of data.termsScopes){await registerTermsOffer(storage,data.termsOffers[scope],{siteId:data.siteId});await setActiveTermsOffer(storage,data.termsOffers[scope].offerId,{siteId:data.siteId,scopeId:scope});}
   for(const subject of data.termsSubjects)for(const scope of data.termsScopes)await recordTermsAcceptance(storage,data.termsCommands[subject][scope],termContext(subject,scope));
   await registerFormPermissionOffer(storage,data.permissionOffer,{siteId:data.siteId,permissionId:data.permissionId});await setActiveFormPermissionOffer(storage,data.permissionOffer.offerId,{siteId:data.siteId,permissionId:data.permissionId});
   for(const id of data.permissionStreams)await recordFormPermission(storage,data.permissionGrants[id],permissionContext(id));
   await processing.register();for(const id of ['processing-erased','processing-held','processing-retained'])await processing.record(id,data.processingCommands[id]);
   const queued={};for(const id of ['processing-restricted','processing-pending'])queued[id]=await processing.enqueue(id);
   await storage.put(initialKey,{events:await survivingEvents(),state:await summary(),queued});return summary();
  },
  async afterBookmark(){
   for(const family of Object.keys(data.targets))await (await life(data.heldTargets[family])).setHold({active:true,reviewAt:data.reviewAt,expectedRevision:0});
   const permissionWithdrawal=await recordFormPermission(storage,data.withdrawal,permissionContext('permission-withdrawn'));
   const processingRestriction=await processing.record('processing-restricted',data.processingCommands['processing-restricted']);
   failEvent=true;try{await processing.record('processing-pending',data.processingCommands['processing-pending']);fail('pending-write-did-not-fail');}catch(e){if(e.message!=='synthetic-pending-write')throw e;}finally{failEvent=false;}
   await storage.put(outcomeKey,{permissionWithdrawal,processingRestriction,unconfirmed:true});
   for(const family of Object.keys(data.targets))await (await life(data.targets[family])).retire(data.decisions[family]);
   return summary();
  },
  async purge(){const result={};for(const family of Object.keys(data.targets))result[family]=await (await life(data.targets[family])).purge({requestId:data.decisions[family].requestId,legalHold:false,limit:1});return result;},
  async journal(){const value={intents:data.intents,outcomes:await storage.get(outcomeKey),retirements:{}};for(const family of Object.keys(data.targets))value.retirements[family]=await (await life(data.targets[family])).getState();return validateFamilyRecoveryJournal(value,data);},
  async replay(journal,{stopAfter}={}){
   validateFamilyRecoveryJournal(journal,data);const digest=await sha(journal),saved=await storage.get(appliedKey)??{digest,steps:[]};if(saved.digest!==digest)fail('family-journal-conflict');
   const step=async(id,work)=>{if(saved.steps.includes(id))return;await work();saved.steps.push(id);await storage.put(appliedKey,saved);if(stopAfter===id)fail('synthetic-replay-interruption');};
   // Holds and newer negative choices precede retirement and destructive work.
   for(const family of Object.keys(data.targets))await step('hold:'+family,async()=>{const item=await life(data.heldTargets[family]),current=await item.getState();if(current?.hold.active){if(current.hold.reviewAt!==data.reviewAt)fail('family-hold-conflict');}else await item.setHold({active:true,reviewAt:data.reviewAt,expectedRevision:current?.hold.revision??0});});
   await step('permission-withdrawal',async()=>{const restored=await recordFormPermission(storage,data.withdrawal,permissionContext('permission-withdrawn'));if(!same(restored,journal.outcomes.permissionWithdrawal))fail('withdrawal-replay-mismatch');});
   await step('processing-recorded',async()=>{const restored=await processing.record('processing-restricted',data.processingCommands['processing-restricted']);if(!same(restored,journal.outcomes.processingRestriction))fail('restriction-replay-mismatch');});
   await step('processing-pending',()=>processing.fence('processing-pending',data.processingCommands['processing-pending'].activities));
   for(const family of Object.keys(data.targets))await step('retirement:'+family,async()=>{await (await life(data.targets[family])).restore(journal.retirements[family]);});
   return summary();
  },
  async holdProbes(){const result={};for(const family of Object.keys(data.targets))try{await (await life(data.heldTargets[family])).retire({...data.decisions[family],requestId:data.holdProbeIds[family]});result[family]=false;}catch(e){result[family]=e.code==='legal-hold';}return result;},
  async initialReady(){const s=await summary();return same(s.counts,{terms:6,permissions:4,processing:3})&&Object.values(s.held).every(v=>v===null)&&s.permissionStates['permission-withdrawn'].permitted&&s.processingHeads['processing-restricted'].revision===0&&!s.pending['processing-pending'];},
  async replayReady(journal){const saved=await storage.get(appliedKey);return !!saved&&saved.digest===await sha(journal)&&saved.steps.length===9;},
  async recoveredReady(journal){
   if(!journal)return false;const s=await summary(),initial=await storage.get(initialKey),events=await survivingEvents(),required=['hold:terms','hold:permissions','hold:processing','permission-withdrawal','processing-recorded','processing-pending','retirement:terms','retirement:permissions','retirement:processing'];
   return !!initial&&Object.values(events).every(v=>v!==undefined)&&same(events,initial.events)&&['permission-held','permission-retained'].every(id=>s.permissionStates[id].revision===1&&s.permissionStates[id].permitted===true&&same(s.permissionStates[id],initial.state.permissionStates[id]))&&['processing-held','processing-retained'].every(id=>s.processingHeads[id].revision===1&&same(s.processingHeads[id],initial.state.processingHeads[id])&&!s.pending[id])&&s.applied?.digest===await sha(journal)&&same([...s.applied.steps].sort(),required.sort())&&same(s.counts,{terms:4,permissions:4,processing:3})&&Object.values(s.held).every(v=>v?.hold.active)&&Object.values(s.retirements).every(v=>v?.phase==='complete')&&Object.values(s.physical).every(v=>v.events===0&&(v.headGone===undefined||v.headGone))&&s.permissionStates['permission-withdrawn'].permitted===false&&s.permissionStates['permission-withdrawn'].reason==='withdrawn'&&same(s.processingHeads['processing-restricted'].event,journal.outcomes.processingRestriction.receipt)&&s.pending['processing-pending']&&s.processingHeads['processing-pending'].revision===0;
  },
  summary,
  async ordinary(action){
   if(action==='family-inspect')return summary();
   if(action==='family-replay-erased'){
    const terms={};for(const scope of data.termsScopes)try{await recordTermsAcceptance(storage,data.termsCommands['terms-erased'][scope],termContext('terms-erased',scope));terms[scope]=false;}catch(e){terms[scope]=e.code==='context-retired';}
    let permissions=false;try{await recordFormPermission(storage,data.permissionGrants['permission-erased'],permissionContext('permission-erased'));}catch(e){permissions=e.code==='context-retired';}
    return {terms,permissions,processing:await processing.produce('processing-erased')};
   }
   if(action==='permission-old-grant')return recordFormPermission(storage,data.permissionGrants['permission-withdrawn'],permissionContext('permission-withdrawn'));
   if(action==='processing-produce')return processing.produce('processing-restricted');
   if(action==='processing-positive')return processing.produce('processing-positive');
   if(action==='processing-record')return processing.record('processing-restricted',data.processingCommands['processing-restricted']);
   if(action==='processing-read')return processing.read('processing-restricted');
   if(action==='processing-enqueue')return processing.enqueue('processing-restricted');
   if(action==='processing-dispatch'){const initial=await storage.get(initialKey);return Promise.all(['processing-restricted','processing-pending'].map(id=>processing.dispatch(initial.queued[id].deliveryId)));}
   fail('unknown-family-operation');
  },
 };
}
