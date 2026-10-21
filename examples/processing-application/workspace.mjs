// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
import {recordLegalRelease,registerProcessingNotice,getProcessingNotice,getProcessingHead,recordProcessingRestriction,createProcessingRestrictionStore,createAdminWorker} from '@notabenda/cloudflare';

const errors=new Set(['invalid-request','scope-mismatch','idempotency-conflict','context-retired','queue-full','not-found']);
export async function processingReply(work){try{return {ok:true,value:JSON.parse(JSON.stringify(await work()))};}catch(e){return {ok:false,code:errors.has(e.code)?e.code:'unavailable'};}}
const fail=code=>{throw Object.assign(Error(),{code});};
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(value);
const canonical=value=>JSON.stringify(value&&typeof value==='object'?ordered(value):value);
function ordered(value){return Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])])):value;}
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value))))].map(n=>n.toString(16).padStart(2,'0')).join('');}

/** One instance owns the admission boundary. Network calls never hold its serial queue. */
export function createProcessingWorkspace(storage,release,{send,now=()=>new Date()}={}){
  const fixed={siteId:release.notice.siteId,scopeId:release.notice.scopeId,allowPreview:release.runtime.mode==='preview'};
  const context=streamId=>({...fixed,streamId});let tail=Promise.resolve();const unconfirmedRestrictions=new Map(),inFlight=new Map();let uncertainAll=false;
  const serial=work=>{const result=tail.then(work);tail=result.catch(()=>{});return result;};
  const prefix='application:processing:jobs:',pendingPrefix='application:processing:pending:',overflowKey='application:processing:overflow';
  const activityNames=['sale','sharing','targeted-advertising'];
  function activities(value){return Array.isArray(value)&&value.length>0&&value.length<=3&&new Set(value).size===value.length&&value.every(a=>activityNames.includes(a));}
  function acceptedCommand(command){if(!command||typeof command!=='object'||Object.keys(command).sort().join(',')!=='activities,noticeId,requestId,schemaVersion'||command.schemaVersion!==1||!uuid(command.requestId)||typeof command.noticeId!=='string'||!/^[a-f0-9]{64}$/u.test(command.noticeId)||!activities(command.activities))fail('invalid-request');}
  const union=(...lists)=>activityNames.filter(a=>lists.some(list=>list.includes(a)));
  const markerKey=async streamId=>pendingPrefix+await digest([fixed.siteId,fixed.scopeId,streamId]);
  async function pendingActivities(streamId){
    const saved=await storage.get(await markerKey(streamId));
    if(saved!==undefined&&(!saved||Object.keys(saved).sort().join(',')!=='activities,schemaVersion'||saved.schemaVersion!==1||!activities(saved.activities)))throw Error('Invalid pending restriction.');
    return union(saved?.activities??[],unconfirmedRestrictions.get(streamId)??[]);
  }
  async function overflow(){uncertainAll=true;await storage.put(overflowKey,{schemaVersion:1,blocked:true});throw Error('Restriction capacity requires reconciliation.');}
  async function overflowed(){const saved=await storage.get(overflowKey);if(saved!==undefined&&(!saved||Object.keys(saved).sort().join(',')!=='blocked,schemaVersion'||saved.schemaVersion!==1||saved.blocked!==true))throw Error('Invalid overflow fence.');return uncertainAll||saved!==undefined;}
  async function mark(streamId,requested){
    if(unconfirmedRestrictions.size>=256&&!unconfirmedRestrictions.has(streamId))return overflow();
    unconfirmedRestrictions.set(streamId,union(unconfirmedRestrictions.get(streamId)??[],requested));
    const pending=await pendingActivities(streamId),key=await markerKey(streamId);
    if((await storage.list({prefix:pendingPrefix,limit:257})).size>=256&&await storage.get(key)===undefined)return overflow();
    // This admission fence commits before the evidence write and survives object recreation.
    await storage.put(key,{schemaVersion:1,activities:pending});
  }
  async function confirmed(streamId,current){
    const pending=await pendingActivities(streamId);
    if(pending.length&&pending.every(a=>current.event?.restrictions.includes(a))){await storage.delete(await markerKey(streamId));unconfirmedRestrictions.delete(streamId);}
  }
  async function registered(){const notice=await getProcessingNotice(storage,release.notice.noticeId,fixed);if(!notice||canonical(notice)!==canonical(release.notice))throw Error('Recording setup unavailable.');}
  async function head(streamId){await registered();return getProcessingHead(storage,context(streamId));}
  // An unrestricted synthetic sample is not affirmative permission or a legal-basis decision.
  // Real producers need the host's independent admission conditions in addition to this gate.
  async function restrictions(streamId,signal){
    if(signal)return {allowed:false,reason:'signal'};
    if(!streamId)return {allowed:false,reason:'context-unavailable'};
    try{const current=await head(streamId);if(await overflowed()||(await pendingActivities(streamId)).length)return {allowed:false,reason:'restriction-unconfirmed'};return {allowed:!current.event?.restrictions.some(a=>release.notice.activities.includes(a)),reason:current.event?.restrictions.some(a=>release.notice.activities.includes(a))?'retained-restriction':'unrestricted',revision:current.revision};}
    catch{return {allowed:false,reason:'read-unavailable'};}
  }
  async function saveJob(streamId,channel){
    const jobs=await storage.list({prefix,limit:33});if(jobs.size>=32)return fail('queue-full');
    const deliveryId=crypto.randomUUID(),payload={kind:'synthetic-processing-example',serviceId:'ad-service',channel},payloadDigest=await digest(payload);
    const job={deliveryId,streamId,channel,payload,payloadDigest,state:'queued',attempts:0,createdAt:now().toISOString()};await storage.put(prefix+deliveryId,job);return job;
  }
  function dispatch(deliveryId,signal=false){
    if(inFlight.has(deliveryId))return inFlight.get(deliveryId);
    const task=dispatchOnce(deliveryId,signal);inFlight.set(deliveryId,task);
    const clear=()=>{if(inFlight.get(deliveryId)===task)inFlight.delete(deliveryId);};task.then(clear,clear);return task;
  }
  async function dispatchOnce(deliveryId,signal=false){
    const admission=await serial(async()=>{
      if(!uuid(deliveryId))return fail('invalid-request');const job=await storage.get(prefix+deliveryId);if(!job)return fail('not-found');
      if(job.deliveryId!==deliveryId||!['queued','uncertain','delivered','suppressed'].includes(job.state)||!Number.isSafeInteger(job.attempts)||job.attempts<0||job.attempts>3||typeof job.streamId!=='string'||!['server','client','queued'].includes(job.channel)||canonical(job.payload)!==canonical({kind:'synthetic-processing-example',serviceId:'ad-service',channel:job.channel})||await digest(job.payload)!==job.payloadDigest)throw Error('Invalid stored job.');
      if(job.state==='delivered'||job.state==='suppressed')return {result:publicJob(job)};
      // Every retry is a new admission. An earlier attempt is never a permanent exception.
      const decision=await restrictions(job.streamId,signal);
      if(!decision.allowed){job.state=job.attempts?'uncertain':'suppressed';job.reason=decision.reason;await storage.put(prefix+deliveryId,job);return {result:publicJob(job)};}
      if(job.attempts>=3){job.state='uncertain';job.reason='attempt-limit';await storage.put(prefix+deliveryId,job);return {result:publicJob(job)};}
      job.attempts++;job.state='uncertain';job.reason='awaiting-delivery';job.admittedAt=now().toISOString();job.observedRevision=decision.revision;await storage.put(prefix+deliveryId,job);
      return {job,attempt:job.attempts};
    });
    if(admission.result)return admission.result;
    let delivered=false;try{const result=await send({...admission.job.payload,deliveryId,payloadDigest:admission.job.payloadDigest});delivered=result?.deliveryId===deliveryId&&result?.payloadDigest===admission.job.payloadDigest;}catch{}
    return serial(async()=>{const current=await storage.get(prefix+deliveryId);if(!current)throw Error('Missing admitted job.');if(current.attempts===admission.attempt){current.state=delivered?'delivered':'uncertain';current.reason=delivered?'sink-confirmed':'delivery-unconfirmed';await storage.put(prefix+deliveryId,current);}return publicJob(current);});
  }
  function publicJob(job){return {deliveryId:job.deliveryId,channel:job.channel,state:job.state,attempts:job.attempts,reason:job.reason??null,payloadDigest:job.payloadDigest,createdAt:job.createdAt,...(job.admittedAt?{admittedAt:job.admittedAt,observedRevision:job.observedRevision}:{})};}
  return {
    register:()=>serial(async()=>{await recordLegalRelease(storage,release.artifact);return registerProcessingNotice(storage,release.notice,fixed);}),
    read:streamId=>serial(()=>head(streamId)),
    pending:streamId=>serial(async()=>await overflowed()||(await pendingActivities(streamId)).length>0),
    record:(streamId,command)=>serial(async()=>{acceptedCommand(command);await mark(streamId,command.activities);await registered();const result=await recordProcessingRestriction(storage,command,{...context(streamId),provenance:'browser-report'});await confirmed(streamId,result.head);return result;}),
    observe:streamId=>serial(async()=>{await mark(streamId,release.notice.activities);const current=await head(streamId);const requested=release.notice.activities.filter(a=>!current.event?.restrictions.includes(a));if(!requested.length){await confirmed(streamId,current);return {changed:false,head:current};}const result=await recordProcessingRestriction(storage,{schemaVersion:1,noticeId:release.notice.noticeId,requestId:crypto.randomUUID(),activities:requested},{...context(streamId),provenance:'gpc-header'});await confirmed(streamId,result.head);return {changed:true,head:result.head};}),
    async produce(streamId,signal=false,channel='server'){
      const decision=await serial(()=>restrictions(streamId,signal));if(!decision.allowed)return {state:'blocked',reason:decision.reason};
      // Recheck at dispatch; enqueue eligibility never authorizes the later network call.
      const job=await serial(()=>saveJob(streamId,channel));return dispatch(job.deliveryId,signal);
    },
    enqueue:streamId=>serial(async()=>{await head(streamId);return publicJob(await saveJob(streamId,'queued'));}),
    dispatch:deliveryId=>dispatch(deliveryId),
    jobs:()=>serial(async()=>[...(await storage.list({prefix,limit:32})).values()].map(publicJob)),
    inspect(request){return createAdminWorker({basePath:'/backoffice/processing',title:'Processing restrictions',workspaceLabel:'Processing example',navigation:[{label:'Delivery queue',href:'/backoffice'},{label:'Restriction records',href:'/backoffice/processing'},{label:'Visitor page',href:'/'}],authorize:()=>({store:createProcessingRestrictionStore(storage,fixed),scopeLabel:fixed.siteId})}).fetch(request,{});},
  };
}

/** Independent fake destination. A received attempt and one committed delivery are distinct. */
export function createDeliverySink(storage){
  return {
    async receive(input){
      if(!input||typeof input!=='object'||Object.keys(input).sort().join(',')!=='channel,deliveryId,kind,payloadDigest,serviceId'||!uuid(input.deliveryId)||input.kind!=='synthetic-processing-example'||!['ad-service','operational'].includes(input.serviceId)||!['server','client','queued','operational'].includes(input.channel))return fail('invalid-request');
      const {deliveryId,payloadDigest,...payload}=input;if(payloadDigest!==await digest(payload))return fail('invalid-request');
      return storage.transaction(async tx=>{const key='sink:'+deliveryId,old=await tx.get(key);if(old&&old.payloadDigest!==payloadDigest)return fail('idempotency-conflict');if(!old&&(await tx.list({prefix:'sink:',limit:257})).size>=256)return fail('queue-full');const row={...input,attempts:(old?.attempts??0)+1};await tx.put(key,row);return {deliveryId,payloadDigest};});
    },
    async observations(){return [...(await storage.list({prefix:'sink:',limit:256})).values()];},
  };
}

export async function operationalEvent(){const payload={kind:'synthetic-processing-example',serviceId:'operational',channel:'operational'};return {...payload,deliveryId:crypto.randomUUID(),payloadDigest:await digest(payload)};}
