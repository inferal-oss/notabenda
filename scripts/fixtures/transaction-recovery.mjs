// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-ORDER-CONFIRMATION
// Fixed maintainer exercise only. No public recovery or provider API.
import {recordLegalRelease,registerContractActionDefinition,recordContractDeclaration,createContractDeclarationStore,dispatchContractDeclaration,createEvidenceLifecycle} from '@notabenda/cloudflare';
import {archivePaidOrderReview,activatePaidOrderReview,admitPaidOrder,getPaidOrderAttempt} from '@notabenda/cloudflare/orders';
import {preparePaidOrderConfirmation,readPaidOrderConfirmation,readPaidOrderConfirmationFile,dispatchPaidOrderConfirmation} from '@notabenda/cloudflare/order-confirmations';
const roles=['retired','held','delivered','uncertain'],families=['contracts','orders'];
const initialKey='__fixture/transactions/initial',appliedKey='__fixture/transactions/applied';
const fail=code=>{throw Error(code);};
const canonical=value=>JSON.stringify(order(value));
function order(v){return Array.isArray(v)?v.map(order):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,order(v[k])])):v;}
const same=(a,b)=>canonical(a)===canonical(b);
export const transactionHash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof bytes==='string'?new TextEncoder().encode(bytes):bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function expandTransactionFile(file){
 const r=file.recipe;if(!r||typeof r.prefix!=='string'||r.prefix.length>1000||!Number.isInteger(r.repeat)||r.repeat<0||r.repeat>150000||typeof r.suffix!=='string'||r.suffix.length>100)fail('wrong-file-recipe');
 return new TextEncoder().encode(r.prefix+'.'.repeat(r.repeat)+r.suffix);
}
export function validateTransactionJournal(journal,data){
 if(!journal||!same(Object.keys(journal).sort(),['entries','intents'])||!same(journal.intents,data.intents)||!Array.isArray(journal.entries)||journal.entries.length!==4)fail('wrong-transaction-journal');
 const seen=new Set();for(const entry of journal.entries){
  const {family,role,state}=entry??{},key=family+'/'+role;if(!families.includes(family)||!['held','retired'].includes(role)||seen.has(key))fail('wrong-transaction-journal');seen.add(key);
  if(!state||state.family!==family||state.siteId!==data.siteId||state.contextRef!==data[family][role].contextRef||role==='held'&&(!state.hold?.active||state.hold.reviewAt!==data.holdReviewAt||state.retirement!==null)||role==='retired'&&(state.phase!=='complete'||state.hold?.active!==false||state.retirement?.requestId!==data.decisions[family].requestId))fail('wrong-transaction-journal');
 }
 return journal;
}
/** Independent synthetic endpoint hashes the full immutable payload itself and deduplicates stable IDs. */
export function createTransactionProvider(storage){return {
 async receive(input){
  if(!input||!same(Object.keys(input).sort(),['deliveryId','payload'])||!/^[a-f0-9]{64}$/u.test(input.deliveryId))fail('invalid-provider-input');
  const encoded=canonical(input.payload);if(typeof encoded!=='string'||encoded.length>700000)fail('invalid-provider-input');
  const digest=await transactionHash(encoded);
  return storage.transaction(async tx=>{const key='provider/'+input.deliveryId,prior=await tx.get(key);if(prior&&prior.digest!==digest)fail('provider-idempotency-conflict');const value=prior?{...prior,calls:prior.calls+1}:{deliveryId:input.deliveryId,digest,calls:1,commits:1,providerRef:'sample-'+input.deliveryId};await tx.put(key,value);return {providerRef:value.providerRef};});
 },
 async observations(){return Object.fromEntries(await storage.list({prefix:'provider/',limit:20}));},
};}
export function createTransactionRecovery(storage,data,{send}={}){
 const now=()=>new Date(data.at),context=(family,role)=>({...data[family][role].context,now});
 const selected=(family,role)=>families.includes(family)&&roles.includes(role)?data[family][role]:fail('wrong-transaction-context');
 const target=(family,role)=>({family,siteId:data.siteId,scopeId:family==='contracts'?data.definition.actionId:'checkout',streamId:family==='contracts'?data.contracts[role].request.requestId:data.orders[role].context.checkoutId});
 const life=(family,role)=>createEvidenceLifecycle(storage,target(family,role),{now});
 // Synthetic legacy-shaped input exercises the lifecycle's existing head cleanup branch.
 const headKey=role=>'notabenda/contracts/'+data.siteId+'/heads/'+data.contracts[role].contextRef;
 const headValue=role=>{const item=data.contracts[role];return {id:item.id,siteId:data.siteId,scopeId:data.definition.actionId,streamRef:item.contextRef,request:structuredClone(item.request)};};
 async function headsMatch(selectedRoles){for(const role of selectedRoles)if(!same(await storage.get(headKey(role)),headValue(role)))return false;return true;}
 async function inspect(family,role){const item=selected(family,role);if(family==='contracts')return await createContractDeclarationStore(storage,{siteId:data.siteId}).get(item.id)??null;const c=context(family,role);return {receipt:await getPaidOrderAttempt(storage,item.request,c),confirmation:await readPaidOrderConfirmation(storage,c)};}
 async function files(role){selected('orders',role);const result={};for(const file of data.orders[role].bundle.files){const bytes=await readPaidOrderConfirmationFile(storage,file.id,context('orders',role));result[file.id]={bytes:bytes.length,sha256:await transactionHash(bytes)};}return result;}
 async function views(){const result={};for(const family of families)for(const role of ['held','delivered','uncertain']){const value=await inspect(family,role);if(!value)fail('missing-transaction-record');if(family==='contracts'){const {delivery,...immutable}=value.data;result[family+'/'+role]={...value,data:immutable};}else result[family+'/'+role]={receipt:value.receipt,manifest:value.confirmation?.manifest,files:await files(role)};}return result;}
 async function summary(){
  const held={},retirements={},physical={};for(const family of families){held[family]=await (await life(family,'held')).getState()??null;retirements[family]=await (await life(family,'retired')).getState()??null;const item=data[family].retired,prefix='notabenda/'+family+'/'+data.siteId+'/';physical[family]={eventGone:await storage.get(prefix+'events/'+(family==='orders'?'checkout/':'')+item.id)===undefined,...(family==='contracts'?{headGone:await storage.get(headKey('retired'))===undefined}:{payloadKeys:(await storage.list({prefix:prefix+'intents/'+item.contextRef+'/',limit:1000})).size})};}
  return {held,retirements,physical,applied:await storage.get(appliedKey)??null};
 }
 async function dispatch(family,role,{loseResponse=false}={}){
  const item=selected(family,role),c=context(family,role),pending=[];
  const deliver=async({lease})=>{
   const payload=family==='contracts'?{channel:lease.channel,payloadSha256:lease.payloadSha256,definition:lease.definition,request:lease.request,receipt:lease.receipt}:{manifest:lease.archive.manifest,files:lease.files.map(f=>({id:f.id,bytes:[...f.bytes]}))};
   const operation=Promise.resolve().then(()=>send({deliveryId:lease.deliveryId,payload}));pending.push(operation);const result=await operation;if(loseResponse)fail('synthetic-response-lost');return result;
  };
  // The bounded synthetic RPC settles before its whole-operation gate is released.
  const settings={deliver,timeoutMs:2000,leaseMs:5000,maxAttempts:5};try{return await (family==='contracts'?dispatchContractDeclaration(storage,item.id,c,{acknowledgement:settings,application:settings}):dispatchPaidOrderConfirmation(storage,c,settings));}finally{const drained=await Promise.allSettled(pending);if(drained.some(result=>result.status!=='fulfilled'))fail('synthetic-provider-unresolved');}
 }
 return {
  async seed(){
   await recordLegalRelease(storage,data.artifact);await registerContractActionDefinition(storage,data.definition,context('contracts','retired'));
   for(const role of roles){await recordContractDeclaration(storage,data.contracts[role].request,context('contracts',role));await storage.put(headKey(role),headValue(role));const order=data.orders[role],c=context('orders',role);await archivePaidOrderReview(storage,order.review,c);await activatePaidOrderReview(storage,{reviewId:order.review.reviewId,expectedRevision:0},c);await admitPaidOrder(storage,order.request,c,{hostPrefix:'fixture-host/stock/',async decide(){return {status:'admit',writes:[]};}});await preparePaidOrderConfirmation(storage,{...order.bundle,files:order.bundle.files.map(({recipe,...f})=>({...f,bytes:expandTransactionFile({...f,recipe})}))},c);}
   const initial={views:await views(),pending:{}};for(const family of families)for(const role of roles)initial.pending[family+'/'+role]=await inspect(family,role);await storage.put(initialKey,initial);return summary();
  },
  inspect,files,dispatch,summary,
  async file(role,id){selected('orders',role);return {bytes:[...await readPaidOrderConfirmationFile(storage,id,context('orders',role))]};},
  async replay(family,role){const item=selected(family,role),c=context(family,role);if(family==='contracts')return recordContractDeclaration(storage,item.request,c);let decideInvoked=false;try{return await admitPaidOrder(storage,item.request,c,{hostPrefix:'fixture-host/stock/',async decide(){decideInvoked=true;fail('unexpected-admission');}});}catch(error){return {error:error.code??error.message,decideInvoked};}},
  async afterBookmark(){for(const family of families){await (await life(family,'held')).setHold({active:true,reviewAt:data.holdReviewAt,expectedRevision:0});await (await life(family,'retired')).retire(data.decisions[family]);}return summary();},
  async purge(){const result={};for(const family of families)result[family]=await (await life(family,'retired')).purge({requestId:data.decisions[family].requestId,legalHold:false,limit:1});return result;},
  async journal(){const entries=[];for(const family of families)for(const role of ['held','retired'])entries.push({family,role,state:await (await life(family,role)).getState()});return validateTransactionJournal({intents:data.intents,entries},data);},
  async replayJournal(journal,{stopAfterHolds=false}={}){
   validateTransactionJournal(journal,data);const digest=await transactionHash(canonical(journal)),saved=await storage.get(appliedKey)??{digest,steps:[]};if(saved.digest!==digest)fail('transaction-journal-conflict');
   const step=async(key,work)=>{if(saved.steps.includes(key))return;await work();saved.steps.push(key);await storage.put(appliedKey,saved);};
   for(const family of families)await step('hold:'+family,async()=>{const l=await life(family,'held'),current=await l.getState();if(current?.hold.active){if(current.hold.reviewAt!==data.holdReviewAt)fail('transaction-hold-conflict');}else await l.setHold({active:true,reviewAt:data.holdReviewAt,expectedRevision:current?.hold.revision??0});});
   if(stopAfterHolds)fail('synthetic-transaction-interruption');
   for(const family of families)await step('retirement:'+family,()=>life(family,'retired').then(l=>l.restore(journal.entries.find(e=>e.family===family&&e.role==='retired').state)));
   return summary();
  },
  async holdProbes(){const result={};for(const family of families)try{await (await life(family,'held')).retire({...data.decisions[family],requestId:data.holdProbeId});result[family]=false;}catch(e){result[family]=e.code==='legal-hold';}return result;},
  async initialReady(){const initial=await storage.get(initialKey);if(!initial||!await headsMatch(roles))return false;for(const family of families)for(const role of roles)if(!same(await inspect(family,role),initial.pending[family+'/'+role]))return false;return same(await views(),initial.views);},
  async replayReady(journal){const applied=await storage.get(appliedKey);return !!applied&&applied.digest===await transactionHash(canonical(journal))&&same([...applied.steps].sort(),['hold:contracts','hold:orders','retirement:contracts','retirement:orders']);},
  async recoveredReady(journal,{expectedViews}={}){
   if(!journal)return false;const s=await summary(),initial=await storage.get(initialKey);if(!initial||!s.applied||s.applied.digest!==await transactionHash(canonical(journal))||!same([...s.applied.steps].sort(),['hold:contracts','hold:orders','retirement:contracts','retirement:orders'])||!Object.values(s.held).every(v=>v?.hold.active)||!Object.values(s.retirements).every(v=>v?.phase==='complete')||!Object.values(s.physical).every(v=>v.eventGone&&v.headGone!==false&&(v.payloadKeys===undefined||v.payloadKeys===0)))return false;
   if(!await headsMatch(['held','delivered','uncertain']))return false;
   for(const family of families)if(!same(await inspect(family,'held'),initial.pending[family+'/held']))return false;
   for(const family of families)for(const role of ['held','delivered','uncertain'])if(!same(await inspect(family,role),(expectedViews??initial.pending)[family+'/'+role]))return false;
   return same(await views(),initial.views);
  },
 };
}
