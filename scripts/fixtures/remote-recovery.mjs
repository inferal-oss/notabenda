// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY REQ-PRODUCT-EVIDENCE-LIFECYCLE
// Maintainer-only synthetic integration. Never import this fixture into a deployed product host.
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead,createConsentEvidenceStore,createDocumentHistory,createEvidenceLifecycle} from '@notabenda/cloudflare';
import {createFamilyRecovery,validateFamilyRecoveryJournal} from './family-recovery.mjs';
import {createTransactionRecovery,validateTransactionJournal} from './transaction-recovery.mjs';
// Fixture journal identity uses the same canonical JSON convention as retained releases.
const canonicalJson=value=>value&&typeof value==='object'?Array.isArray(value)?'['+value.map(canonicalJson).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalJson(value[key])).join(',')+'}':JSON.stringify(value);
const sha256=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
const controlKey='__fixture/control',appliedKey='__fixture/applied-journal';
const fail=code=>{throw Error(code);};
const exact=(a,b)=>canonicalJson(a)===canonicalJson(b);
const unwrap=result=>result?.ok===true?result.value:fail(result?.error??'control-unavailable');
export function fixtureJson(value){return JSON.parse(JSON.stringify(value));}
export async function fixtureReply(operation){try{return fixtureJson({ok:true,value:await operation()});}catch(error){return {ok:false,error:typeof error?.code==='string'?error.code:/^[a-z-]{1,80}$/u.test(error?.message??'')?error.message:'fixture-operation-failed'};}}
export function createRemoteRecoveryControl(storage,data){
 const initial=()=>({runId:data.runId,phase:'closed',epoch:0,initialOpened:false,bookmark:null,journal:null,journalDigest:null,restoreIntent:null,restarts:0,...(data.families?{familyIntents:null,familyJournal:null}:{}),...(data.transactions?{transactionIntents:null,transactionJournal:null,transactionInFlight:null,transactionExpectedViews:null}:{})});
 const read=async tx=>await tx.get(controlKey)??initial();
 const change=callback=>storage.transaction(async tx=>{const state=await read(tx),result=await callback(state);await tx.put(controlKey,state);return result??state;});
 return {async run(action,payload){
  if(action==='state')return read(storage);
  if(action==='close')return change(state=>{if(state.phase==='open'){state.phase='closed';state.epoch++;}});
  if(action==='bookmark')return change(state=>{if(state.phase!=='closed'||state.initialOpened||state.bookmark!==null||typeof payload!=='string'||!payload.length||payload.length>256)fail('bookmark-not-allowed');state.bookmark=payload;});
  if(action==='family-intents')return change(state=>{if(!data.families||state.phase!=='closed'||!state.initialOpened||state.restoreIntent||!exact(payload,data.families.intents))fail('family-intents-not-allowed');if(state.familyIntents&&!exact(state.familyIntents,payload))fail('family-intents-conflict');state.familyIntents=structuredClone(payload);});
  if(action==='family-source-journal')return change(state=>{if(!data.families||state.phase!=='closed'||!state.initialOpened||state.restoreIntent||!exact(state.familyIntents,data.families.intents))fail('family-journal-not-allowed');validateFamilyRecoveryJournal(payload,data.families);if(state.familyJournal&&!exact(state.familyJournal,payload))fail('family-journal-conflict');state.familyJournal=structuredClone(payload);});
  if(action==='transaction-begin')return change(state=>{if(!data.transactions||state.phase!=='open'||state.transactionInFlight||typeof payload?.id!=='string'||!/^[a-f0-9-]{36}$/u.test(payload.id))fail('transaction-work-not-allowed');state.transactionInFlight={id:payload.id};});
  if(action==='transaction-end')return change(state=>{if(!state.transactionInFlight||state.transactionInFlight.id!==payload?.id)fail('transaction-work-mismatch');if(state.restoreIntent){if(!payload.views||!exact(Object.keys(payload.views).sort(),['contracts/delivered','contracts/held','contracts/uncertain','orders/delivered','orders/held','orders/uncertain']))fail('wrong-transaction-views');state.transactionExpectedViews=structuredClone(payload.views);}state.transactionInFlight=null;});
  if(action==='transaction-intents')return change(state=>{if(!data.transactions||state.phase!=='closed'||!state.initialOpened||state.restoreIntent||!exact(payload,data.transactions.intents))fail('transaction-intents-not-allowed');if(state.transactionIntents&&!exact(state.transactionIntents,payload))fail('transaction-intents-conflict');state.transactionIntents=structuredClone(payload);});
  if(action==='transaction-source-journal')return change(state=>{if(!data.transactions||state.phase!=='closed'||!state.initialOpened||state.restoreIntent||!exact(state.transactionIntents,data.transactions.intents))fail('transaction-journal-not-allowed');validateTransactionJournal(payload,data.transactions);if(state.transactionJournal&&!exact(state.transactionJournal,payload))fail('transaction-journal-conflict');state.transactionJournal=structuredClone(payload);});
  if(action==='journal'){
   if(!payload||!exact(payload.hold,data.laterHold)||payload.retirement?.retirement?.requestId!==data.decision.requestId||payload.retirement?.contextRef!==data.erasedRef||payload.retirement?.siteId!==data.siteId||payload.retirement?.family!=='consent'||payload.retirement?.phase!=='complete'||payload.retirement?.hold?.active!==false)fail('wrong-journal');
   const journal=structuredClone(payload),digest=await sha256(canonicalJson(journal));return change(state=>{if(state.phase!=='closed'||!state.initialOpened||state.restoreIntent)fail('journal-not-allowed');if(data.families&&(!state.familyJournal||!exact(journal.families,state.familyJournal)))fail('wrong-family-journal');if(data.transactions&&(!state.transactionJournal||!exact(journal.transactions,state.transactionJournal)))fail('wrong-transaction-journal');if(state.journalDigest&&state.journalDigest!==digest)fail('journal-conflict');state.journal=journal;state.journalDigest=digest;});
  }
  if(action==='restore-intent')return change(state=>{if(state.phase!=='closed'||state.transactionInFlight||!state.journalDigest||state.restoreIntent||payload?.epoch!==state.epoch||payload?.bookmark!==state.bookmark||typeof payload.undoBookmark!=='string'||!payload.undoBookmark.length||payload.undoBookmark.length>256)fail('restore-not-allowed');state.restoreIntent={epoch:state.epoch,bookmark:state.bookmark,undoBookmark:payload.undoBookmark,journalDigest:state.journalDigest};});
  if(action==='restart')return change(state=>{if(state.phase!=='closed'||!state.restoreIntent)fail('restart-not-allowed');state.restarts++;});
  if(action==='open-initial')return change(state=>{if(state.phase!=='closed'||state.epoch!==0||state.initialOpened||!state.bookmark||state.journal)fail('initial-open-not-allowed');state.initialOpened=true;state.phase='open';});
  if(action==='open-recovered')return change(state=>{if(state.phase!=='closed'||!state.restoreIntent||payload?.epoch!==state.epoch||payload?.journalDigest!==state.journalDigest)fail('recovery-open-not-allowed');state.phase='open';});
  fail('unknown-control-operation');
 }};
}
const familyActions=['family-inspect','family-replay-erased','permission-old-grant','processing-produce','processing-positive','processing-enqueue','processing-dispatch','processing-record','processing-read'];
const transactionActions=['transaction-inspect','transaction-source-delivery','transaction-replay-erased','transaction-dispatch-erased','transaction-retired-file','transaction-delivered-dispatch','transaction-uncertain-dispatch','transaction-uncertain-retry','transaction-files'];
const ordinary=new Set(['inspect','archive-write','grant',...familyActions,...transactionActions]);
/** Serialize every exposed target operation across its external gate check and full effect.
 * No alarms, sockets or scheduled/background dispatch. Bounded dispatch timers settle inside the gate.
 * Control and provider never call this object back.
 */
export function createRemoteRecoveryEvidence(ctx,control,data,sink,provider){
 const storage=ctx.storage;
 const families=data.families?createFamilyRecovery(storage,data.families,{send:async input=>unwrap(await sink.receive(input))}):null;
 const transactions=data.transactions?createTransactionRecovery(storage,data.transactions,{send:async input=>unwrap(await provider.transactionReceive(fixtureJson(input)))}):null;
 const transactionViews=async()=>{const result={};for(const family of ['contracts','orders'])for(const role of ['held','delivered','uncertain'])result[family+'/'+role]=await transactions.inspect(family,role);return result;};
 const state=async()=>unwrap(await control.command('state'));
 const context=streamId=>({siteId:data.siteId,scopeId:data.scopeId,streamId,now:()=>new Date(data.now)});
 const life=streamId=>createEvidenceLifecycle(storage,{family:'consent',siteId:data.siteId,scopeId:data.scopeId,streamId},{now:()=>new Date(data.now)});
 async function inspect(){
  const history=createDocumentHistory(storage),source=await history.getSource(data.authoredId,'terms');
  const records=await createConsentEvidenceStore(storage,{siteId:data.siteId,scopeId:data.scopeId}).list({query:'',kind:'',keyPrefix:'',from:'',to:'',limit:20});
  return {events:records.records.length,history:(await history.list({query:'',kind:'',keyPrefix:'',from:'',to:'',limit:20})).records.length,sourceSha256:source?await sha256(source.data.source):null};
 }
 async function summary(){
  const heads={},holds={};for(const id of data.streams){try{heads[id]=(await getConsentHead(storage,context(id))).revision;}catch(error){if(error.code!=='context-retired')throw error;heads[id]=null;}holds[id]=await (await life(id)).getState()??null;}
  return {...await inspect(),heads,holds,sql:[...storage.sql.exec('SELECT name, value FROM recovery_sentinel ORDER BY name')].map(row=>({name:row.name,value:row.value})),erasedPhysicalHeadGone:await storage.get('notabenda/consent/'+data.siteId+'/heads/'+data.erasedRef)===undefined,applied:await storage.get(appliedKey)??null,control:await state(),...(families?{families:await families.summary(),deliveries:unwrap(await sink.observations())}:{}),...(transactions?{transactions:await transactions.summary(),transactionProvider:unwrap(await provider.transactionObservations())}:{})};
 }
 async function run(action){
  const gate=await state();
  if(ordinary.has(action)){
   if(gate.phase!=='open')fail('recovery-closed');
   if(transactionActions.includes(action)){
    if(!transactions)fail('transactions-not-configured');
    const dispatchAction=['transaction-source-delivery','transaction-dispatch-erased','transaction-delivered-dispatch','transaction-uncertain-dispatch','transaction-uncertain-retry'].includes(action),operationId=crypto.randomUUID();
    if(dispatchAction)unwrap(await control.command('transaction-begin',{id:operationId}));
    let unresolved=false;try{
    if(action==='transaction-source-delivery'){
     if(gate.restoreIntent)fail('source-delivery-not-allowed');const result={};for(const family of ['contracts','orders'])for(const role of ['retired','delivered','uncertain'])result[family+'/'+role]=await transactions.dispatch(family,role,{loseResponse:role==='uncertain'});return result;
    }
    if(action==='transaction-inspect')return transactionViews();
    if(action==='transaction-files'){const result={};for(const role of ['held','delivered','uncertain'])result[role]=await transactions.files(role);return result;}
    if(action==='transaction-retired-file')return transactions.file('retired','terms');
    const result={};for(const family of ['contracts','orders']){
     if(action==='transaction-replay-erased'){try{result[family]=await transactions.replay(family,'retired');}catch(error){result[family]={error:error.code??error.message};}}
     else result[family]=await transactions.dispatch(family,action==='transaction-dispatch-erased'?'retired':action==='transaction-delivered-dispatch'?'delivered':'uncertain',{loseResponse:action==='transaction-uncertain-dispatch'});
    }return result;
    }catch(error){unresolved=error.message==='synthetic-provider-unresolved';throw error;}finally{if(dispatchAction&&!unresolved)unwrap(await control.command('transaction-end',fixtureJson({id:operationId,...(gate.restoreIntent?{views:await transactionViews()}:{})})));}
   }
   if(familyActions.includes(action))return families?families.ordinary(action):fail('families-not-configured');
   if(action==='inspect')return inspect();
   if(action==='archive-write')return recordLegalRelease(storage,data.releases[0]);
   return recordConsentChoice(storage,data.commands['erased-context'],context('erased-context'));
  }
  if(gate.phase!=='closed')fail('maintenance-requires-closed-gate');
  if(gate.transactionInFlight&&action!=='summary')fail('transaction-work-not-drained');
  if(action==='seed'){
   if(gate.initialOpened||(await storage.list({limit:1})).size)fail('seed-only-empty-fixture');
   for(const release of data.releases)await recordLegalRelease(storage,release);
   await registerConsentNotice(storage,data.notice,context('erased-context'));await setActiveConsentNotice(storage,data.notice.noticeId,context('erased-context'));
   for(const id of data.streams)await recordConsentChoice(storage,data.commands[id],context(id));
   if(families)await families.seed();
   if(transactions)await transactions.seed();
   await (await life('old-held-context')).setHold({active:true,reviewAt:data.reviewAt,expectedRevision:0});
   storage.sql.exec('CREATE TABLE recovery_sentinel (name TEXT PRIMARY KEY, value INTEGER NOT NULL)');storage.sql.exec("INSERT INTO recovery_sentinel VALUES ('baseline', 1)");return summary();
  }
  if(action==='bookmark'){
   if(gate.initialOpened||gate.bookmark)fail('bookmark-not-allowed');await storage.sync();const bookmark=await storage.getCurrentBookmark();unwrap(await control.command('bookmark',bookmark));return {bookmark};
  }
  if(action==='post-backup-decisions'){
   if(!gate.initialOpened||gate.restoreIntent)fail('decisions-not-allowed');
   if(families)unwrap(await control.command('family-intents',data.families.intents));
   if(transactions)unwrap(await control.command('transaction-intents',data.transactions.intents));
   if(families)await families.afterBookmark();
   if(transactions)await transactions.afterBookmark();
   await (await life('new-held-context')).setHold({active:true,reviewAt:data.reviewAt,expectedRevision:0});
   const retired=await (await life('erased-context')).retire(data.decision);
   storage.sql.exec("UPDATE recovery_sentinel SET value=2 WHERE name='baseline'");storage.sql.exec("INSERT INTO recovery_sentinel VALUES ('late-only', 2)");return retired;
  }
  if(action==='summary')return summary();
  if(action==='family-journal'){if(!families)fail('families-not-configured');const journal=await families.journal();unwrap(await control.command('family-source-journal',fixtureJson(journal)));return journal;}
  if(action==='transaction-journal'){if(!transactions)fail('transactions-not-configured');const journal=await transactions.journal();unwrap(await control.command('transaction-source-journal',fixtureJson(journal)));return journal;}
  if(action==='transaction-hold-probes')return transactions?transactions.holdProbes():fail('transactions-not-configured');
  if(action==='purge'){
   if(gate.restoreIntent){const applied=await storage.get(appliedKey);if(applied?.digest!==gate.journalDigest||!applied.hold||!applied.retirement)fail('journal-replay-required');}
   if(gate.restoreIntent&&families&&!await families.replayReady(gate.journal.families))fail('family-journal-replay-required');
   if(gate.restoreIntent&&transactions&&!await transactions.replayReady(gate.journal.transactions))fail('transaction-journal-replay-required');
   if(families)await families.purge();
   if(transactions)await transactions.purge();
   return (await life('erased-context')).purge({requestId:data.decision.requestId,legalHold:false,limit:1});
  }
  if(action==='restore'){
   if(!gate.journalDigest||!gate.bookmark||gate.restoreIntent)fail('restore-not-allowed');
   const undoBookmark=await storage.onNextSessionRestoreBookmark(gate.bookmark);
   unwrap(await control.command('restore-intent',{epoch:gate.epoch,bookmark:gate.bookmark,undoBookmark}));
   ctx.abort('Synthetic recovery: apply the recorded provider bookmark');
  }
  if(action==='restart'){
   unwrap(await control.command('restart'));ctx.abort('Synthetic recovery: restart during bounded purge');
  }
  if(action==='replay-transactions-partial'){if(!transactions||!gate.restoreIntent||!gate.journal)fail('journal-replay-not-allowed');return transactions.replayJournal(gate.journal.transactions,{stopAfterHolds:true});}
  if(action==='replay-journal'||action==='replay-journal-partial'){
   if(!gate.restoreIntent||!gate.journal)fail('journal-replay-not-allowed');
   const applied=await storage.get(appliedKey)??{digest:gate.journalDigest,hold:false,retirement:false};if(applied.digest!==gate.journalDigest)fail('journal-conflict');
   if(!applied.hold){const held=await life('new-held-context'),current=await held.getState();if(current?.hold.active){if(current.hold.reviewAt!==gate.journal.hold.reviewAt)fail('hold-journal-conflict');}else await held.setHold({active:true,reviewAt:gate.journal.hold.reviewAt,expectedRevision:current?.hold.revision??0});applied.hold=true;await storage.put(appliedKey,applied);}
   if(families&&!applied.families){await families.replay(gate.journal.families,action==='replay-journal-partial'?{stopAfter:'permission-withdrawal'}:{});applied.families=true;await storage.put(appliedKey,applied);}
   if(transactions&&!applied.transactions){await transactions.replayJournal(gate.journal.transactions);applied.transactions=true;await storage.put(appliedKey,applied);}
   if(!applied.retirement){await (await life('erased-context')).restore(gate.journal.retirement);applied.retirement=true;await storage.put(appliedKey,applied);}
   return summary();
  }
  if(action==='family-hold-probes')return families?families.holdProbes():fail('families-not-configured');
  if(action==='hold-probes'){
   const results={};for(const id of ['old-held-context','new-held-context']){try{await (await life(id)).retire({...data.decision,requestId:data.holdProbeIds[id]});results[id]=false;}catch(error){results[id]=error.code==='legal-hold';}}return results;
  }
  if(action==='open'){
   const s=await summary();
   if(!gate.initialOpened){if(families&&!await families.initialReady())fail('family-initial-incomplete');if(transactions&&!await transactions.initialReady())fail('transaction-initial-incomplete');if(s.events!==4||s.history!==2||s.sourceSha256!==data.sourceSha256||!s.holds['old-held-context']?.hold.active||s.holds['new-held-context']!==null||!exact(s.sql,[{name:'baseline',value:1}]))fail('initial-state-incomplete');unwrap(await control.command('open-initial'));return {opened:true};}
   if(transactions&&!await transactions.recoveredReady(gate.journal?.transactions,{expectedViews:gate.transactionExpectedViews}))fail('transaction-recovery-incomplete');
   if(families&&!await families.recoveredReady(gate.journal?.families))fail('family-recovery-incomplete');
   if(!gate.restoreIntent||s.applied?.digest!==gate.journalDigest||!s.applied.hold||!s.applied.retirement||s.holds['erased-context']?.phase!=='complete'||!s.erasedPhysicalHeadGone||s.events!==3||s.history!==2||s.sourceSha256!==data.sourceSha256||!exact(s.sql,[{name:'baseline',value:1}])||['old-held-context','new-held-context'].some(id=>!s.holds[id]?.hold.active)||['old-held-context','new-held-context','retained-context'].some(id=>s.heads[id]!==1))fail('recovery-incomplete');
   unwrap(await control.command('open-recovered',{epoch:gate.epoch,journalDigest:gate.journalDigest}));return {opened:true};
  }
  fail('unknown-evidence-operation');
 }
 return {command:action=>ctx.blockConcurrencyWhile(()=>fixtureReply(()=>run(action)))};
}

const actions=new Set(['seed','bookmark','open','inspect','archive-write','grant','post-backup-decisions','purge','summary','restore','restart','replay-journal','replay-journal-partial','family-journal','family-hold-probes','hold-probes',...familyActions,...transactionActions,'transaction-journal','transaction-hold-probes','replay-transactions-partial']);
const privateResponse=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export function createRemoteRecoveryHandler(data){return {async fetch(request,env){
 if(new URL(request.url).pathname!=='/rehearse'||request.method!=='POST')return privateResponse({error:'not-found'},404);
 const credential=request.headers.get('Authorization');
 if(typeof env.FIXTURE_KEY!=='string'||!/^[a-f0-9]{64}$/u.test(env.FIXTURE_KEY)||typeof credential!=='string'||credential.length>100)return privateResponse({error:'access-denied'},403);
 const [a,b]=await Promise.all([credential,'Bearer '+env.FIXTURE_KEY].map(v=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))));let difference=0;const left=new Uint8Array(a),right=new Uint8Array(b);for(let i=0;i<left.length;i++)difference|=left[i]^right[i];if(difference)return privateResponse({error:'access-denied'},403);
 let body;try{const reader=request.body?.getReader();if(!reader)throw Error();const chunks=[];let bytes=0;for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>16384){await reader.cancel();throw Error();}chunks.push(part.value);}const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer));if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['action','payload'].includes(k)))throw Error();}catch{return privateResponse({error:'invalid-request'},400);}
 if(!['state','close','journal'].includes(body.action)&&!(actions.has(body.action)&&body.payload===undefined))return privateResponse({error:'unknown-operation'},400);
 const control=env.CONTROL.getByName('control:'+data.runId);
 try{
  let result;
  if(['state','close','journal'].includes(body.action))result=await control.command(body.action,body.payload);
  else if(actions.has(body.action)&&body.payload===undefined)result=await env.EVIDENCE.getByName('evidence:'+data.runId).command(body.action);
  else return privateResponse({error:'unknown-operation'},400);
  return privateResponse(result,result.ok?200:result.error==='recovery-closed'?503:409);
 }catch(error){return privateResponse({ok:false,error:'operation-uncertain',diagnostic:String(error?.message??'RPC interrupted').slice(0,400)},503);}
}};}
