// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-PAID-ORDER-ARCHIVES
// Maintainer-only synthetic recovery fixture. Never scaffold or ship these controls.
import {DurableObject} from 'cloudflare:workers';
import {recordLegalRelease,registerContractActionDefinition,recordContractDeclaration,createContractDeclarationStore,dispatchContractDeclaration,createEvidenceLifecycle} from '@notabenda/cloudflare';
import {archivePaidOrderReview,activatePaidOrderReview,admitPaidOrder,getPaidOrderAttempt} from '@notabenda/cloudflare/orders';
import {preparePaidOrderConfirmation,readPaidOrderConfirmation,readPaidOrderConfirmationFile,dispatchPaidOrderConfirmation} from '@notabenda/cloudflare/order-confirmations';
import data from './data.mjs';

const gate='fixture/open',journalKey='fixture/reconciled',clockKey='fixture/clock';
const roles=['retired','held','delivered','uncertain'];
const familyNames=['contracts','orders'];
// Synthetic legacy-shaped heads, not records written by the current contract recorder.
const headKey=role=>'notabenda/contracts/'+data.siteId+'/heads/'+data.contracts[role].contextRef;
const headValue=role=>{const item=data.contracts[role];return {id:item.id,siteId:data.siteId,scopeId:data.definition.actionId,streamRef:item.contextRef,request:structuredClone(item.request)};};
const canonical=v=>JSON.stringify(v,(_k,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))):value);
async function headsMatch(storage,selectedRoles){for(const role of selectedRoles)if(canonical(await storage.get(headKey(role)))!==canonical(headValue(role)))return false;return true;}
const now=storage=>async()=>await storage.get(clockKey)??data.at;
const encode=value=>JSON.stringify(value,(_key,v)=>v instanceof Uint8Array?{fixtureBytes:[...v]}:v);
const decode=value=>JSON.parse(value,(_key,v)=>v&&typeof v==='object'&&Object.keys(v).length===1&&Array.isArray(v.fixtureBytes)?new Uint8Array(v.fixtureBytes):v);
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');

export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.origin!==env.RUNTIME_ORIGIN||request.headers.get('X-Notabenda-Runtime')!==env.RUNTIME_KEY)return new Response('Not found',{status:404});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 if(url.pathname==='/provider')return env.PROVIDER.getByName('independent-provider').fetch(new Request('https://provider.example.test/inspect',{method:'POST'}));
 const match=/^\/(source|restored)\/([a-z-]+)$/u.exec(url.pathname);
 if(!match)return new Response('Not found',{status:404});
 if(match[2]==='seed'&&match[1]!=='source'||match[2]==='hydrate'&&match[1]!=='restored')return Response.json({error:'wrong-fixture-target'},{status:409});
 return env.CASE.getByName(match[1]).fetch(request);
}};

export class RecoveryCase extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.storage=ctx.storage;this.env=env;}
 async fetch(request){
  // Serialize whole fixture operations, including provider callbacks. Production hosts own their gates.
  return this.ctx.blockConcurrencyWhile(async()=>{
   try{return await this.run(request);}catch(error){return Response.json({error:error.code??error.message},{status:409});}
  });
 }
 async run(request){
  const action=new URL(request.url).pathname.split('/').at(-1),body=await request.json(),s=this.storage;
  const at=await (now(s))(),context=(family,role)=>({...data[family][role].context,now:()=>new Date(at)});
  const target=(family,role)=>({family,siteId:data.siteId,scopeId:family==='contracts'?data.definition.actionId:'checkout',streamId:family==='contracts'?data.contracts[role].request.requestId:data.orders[role].context.checkoutId});
  const lifecycle=(family,role)=>createEvidenceLifecycle(s,target(family,role),{now:()=>new Date(at)});
  const open=await s.get(gate)===true;
  const selected=()=>{
   if(!familyNames.includes(body.family)||!roles.includes(body.role))throw Error('Invalid fixed fixture context.');
   return data[body.family][body.role];
  };
  if(['inspect','dispatch','replay','file'].includes(action)&&!open)return Response.json({error:'recovery-isolated'},{status:503});
  if(action==='clock'){
   if(!/^2026-10-20T12:0[0-9]:00\.000Z$/u.test(body.at)||body.at<at)throw Error('Invalid fixture clock.');
   await s.put(clockKey,body.at);return Response.json({ok:true});
  }
  if(action==='seed'){
   if((await s.list({limit:1})).size)throw Error('Seed only a fresh source.');
   await recordLegalRelease(s,data.artifact);await registerContractActionDefinition(s,data.definition,context('contracts','retired'));
   for(const role of roles){
    await recordContractDeclaration(s,data.contracts[role].request,context('contracts',role));
    await s.put(headKey(role),headValue(role));
    const order=data.orders[role],c=context('orders',role);
    await archivePaidOrderReview(s,order.review,c);await activatePaidOrderReview(s,{reviewId:order.review.reviewId,expectedRevision:0},c);
    await admitPaidOrder(s,order.request,c,{hostPrefix:'fixture-host/stock/',async decide(){return {status:'admit',writes:[]};}});
    await preparePaidOrderConfirmation(s,{...order.bundle,files:order.bundle.files.map(f=>({...f,bytes:new Uint8Array(f.bytes)}))},c);
   }
   await s.put(gate,true);return Response.json({contracts:4,orders:4});
  }
  if(action==='snapshot'){
   if(!open)throw Error('Snapshot only the live source.');
   const entries=await s.list({prefix:'notabenda/',limit:1001});if(entries.size>1000)throw Error('Fixture snapshot exceeds its complete bound.');
   return Response.json({kind:'synthetic-transaction-kv-backup',schemaVersion:1,encoded:encode([...entries])});
  }
  if(action==='hydrate'){
   if(body.kind!=='synthetic-transaction-kv-backup'||body.schemaVersion!==1||typeof body.encoded!=='string'||body.encoded.length>8*1024*1024)throw Error('Invalid bounded fixture snapshot.');
   const entries=decode(body.encoded);
   if(!Array.isArray(entries)||!entries.length||entries.length>1000)throw Error('Invalid fixture entries.');
   await s.transaction(async tx=>{
    if((await tx.list({limit:1})).size)throw Error('Restore only into an empty target.');
    const seen=new Set();
    for(const entry of entries){
     if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!entry[0].startsWith('notabenda/')||seen.has(entry[0]))throw Error('Invalid fixture key.');
     seen.add(entry[0]);await tx.put(entry[0],entry[1]);
    }
    await tx.put(gate,false);
   });return Response.json({restored:entries.length,isolated:true});
  }
  if(action==='inspect'){
   const item=selected(),c=context(body.family,body.role);
   if(body.family==='contracts')return Response.json(await createContractDeclarationStore(s,{siteId:data.siteId}).get(item.id)??null);
   return Response.json({receipt:await getPaidOrderAttempt(s,item.request,c),confirmation:await readPaidOrderConfirmation(s,c)});
  }
  if(action==='file'){
   selected();if(body.family!=='orders')throw Error('Order file only.');
   const bytes=await readPaidOrderConfirmationFile(s,body.file,context('orders',body.role));
   return Response.json({bytes:[...bytes]});
  }
  if(action==='replay'){
   const item=selected(),c=context(body.family,body.role);
   if(body.family==='contracts')return Response.json(await recordContractDeclaration(s,item.request,c));
   let decideInvoked=false;
   try{return Response.json(await admitPaidOrder(s,item.request,c,{hostPrefix:'fixture-host/stock/',async decide(){decideInvoked=true;throw Error('Unexpected admission decision during replay.');}}));}
   catch(error){return Response.json({error:error.code??error.message,decideInvoked},{status:409});}
  }
  if(action==='dispatch'){
   const item=selected(),c=context(body.family,body.role),sink=this.env.PROVIDER.getByName('independent-provider');
   const deliver=async({lease})=>{
    // Hash exact immutable content, including every file byte and destination, independently of attempt tokens.
    const payload=body.family==='contracts'?{channel:lease.channel,payloadSha256:lease.payloadSha256,definition:lease.definition,request:lease.request,receipt:lease.receipt}: {manifest:lease.archive.manifest,files:lease.files.map(f=>({id:f.id,bytes:[...f.bytes]}))};
    const response=await sink.fetch(new Request('https://provider.example.test/accept',{method:'POST',body:JSON.stringify({deliveryId:lease.deliveryId,digest:await digest(encode(payload))})}));
    if(!response.ok)throw Error('Provider conflict.');
    const result=await response.json();if(body.loseResponse)throw Error('Simulated response loss after provider acceptance.');return result;
   };
   return Response.json(body.family==='contracts'?await dispatchContractDeclaration(s,item.id,c,{acknowledgement:{deliver},application:{deliver}}):await dispatchPaidOrderConfirmation(s,c,{deliver}));
  }
  if(action==='hold'){
   if(!open)throw Error('Use reconciliation while isolated.');
   const result={};for(const family of familyNames)result[family]=await (await lifecycle(family,'held')).setHold({active:true,reviewAt:data.holdReviewAt,expectedRevision:0});
   return Response.json(result);
  }
  if(action==='retire'){
   if(!open)throw Error('Use reconciliation while isolated.');
   const result={};for(const family of familyNames)result[family]=await (await lifecycle(family,'retired')).retire(data.decisions[family]);return Response.json(result);
  }
  if(action==='journal'){
   if(!open)throw Error('Read the source journal only.');
   const entries=[];for(const family of familyNames)for(const role of ['held','retired'])entries.push({family,role,state:await (await lifecycle(family,role)).getState()});
   return Response.json({kind:'synthetic-transaction-decisions',schemaVersion:1,siteId:data.siteId,entries});
  }
  if(action==='reconcile'){
   if(open||await s.get(gate)!==false)throw Error('Reconcile only a hydrated isolated target.');
   // Trusted runner-supplied journal with fixed target identities; no authentication/completeness claim.
   if(body.kind!=='synthetic-transaction-decisions'||body.schemaVersion!==1||body.siteId!==data.siteId||!Array.isArray(body.entries)||body.entries.length!==4)throw Error('Wrong fixture journal.');
   const indexed=new Map();for(const e of body.entries){
    if(!familyNames.includes(e.family)||!['held','retired'].includes(e.role)||indexed.has(e.family+'/'+e.role))throw Error('Wrong journal entry.');
    const life=await lifecycle(e.family,e.role);
    if(e.state?.contextRef!==life.contextRef||e.state?.siteId!==data.siteId||e.state?.family!==e.family||e.role==='held'&&(!e.state.hold?.active||e.state.retirement!==null)||e.role==='retired'&&e.state.retirement?.requestId!==data.decisions[e.family].requestId)throw Error('Wrong journal target.');
    indexed.set(e.family+'/'+e.role,e);
   }
   // Hold-only decisions are not retirement manifests: replay them through the revision-checked hold API first.
   for(const family of familyNames){const life=await lifecycle(family,'held'),state=await life.getState();if(!state?.hold.active)await life.setHold({active:true,reviewAt:indexed.get(family+'/held').state.hold.reviewAt,expectedRevision:state?.hold.revision??0});}
   if(body.stopAfterHolds)return Response.json({holdsApplied:true,retirementsApplied:false});
   for(const family of familyNames)await (await lifecycle(family,'retired')).restore(indexed.get(family+'/retired').state);
   await s.put(journalKey,true);return Response.json({holdsApplied:true,retirementsApplied:true});
  }
  if(action==='purge'){
   const result={};for(const family of familyNames)result[family]=await (await lifecycle(family,'retired')).purge({requestId:data.decisions[family].requestId,legalHold:false,limit:1});return Response.json(result);
  }
  if(action==='hold-probe'){
   const result={};for(const family of familyNames){try{await (await lifecycle(family,'held')).retire({...data.decisions[family],requestId:data.holdProbeId});result[family]='unexpected-success';}catch(e){result[family]=e.code??'unexpected-error';}}return Response.json(result);
  }
  if(action==='open'){
   if(open||await s.get(journalKey)!==true)throw Error('Reconciliation incomplete.');
   for(const family of familyNames)if((await (await lifecycle(family,'retired')).getState())?.phase!=='complete'||!(await (await lifecycle(family,'held')).getState())?.hold.active)throw Error('Reconciliation incomplete.');
   if(await s.get(headKey('retired'))!==undefined||!await headsMatch(s,['held','delivered','uncertain']))throw Error('Contract head reconciliation incomplete.');
   await s.put(gate,true);return Response.json({opened:true});
  }
  if(action==='status'){
   const result={open};for(const family of familyNames)result[family]={retired:await (await lifecycle(family,'retired')).getState()??null,held:await (await lifecycle(family,'held')).getState()??null};
   result.retiredPayloadKeys={};result.retiredEventPresent={};result.retiredHeadPresent={};
   for(const family of familyNames){
    const life=await lifecycle(family,'retired'),prefix='notabenda/'+family+'/'+data.siteId+'/';
    const eventId=family==='orders'?data.orders.retired.id:data.contracts.retired.id;
    result.retiredEventPresent[family]=await s.get(prefix+'events/'+(family==='orders'?'checkout/':'')+eventId)!==undefined;
    result.retiredHeadPresent[family]=await s.get(prefix+'heads/'+life.contextRef)!==undefined;
    result.retiredPayloadKeys[family]=family==='orders'?(await s.list({prefix:prefix+'intents/'+life.contextRef+'/',limit:1000})).size:result.retiredEventPresent[family]?1:0;
   }
   result.contractHeadsMatch=await headsMatch(s,open&&result.contracts.retired?.phase!=='complete'?roles:['held','delivered','uncertain']);
   return Response.json(result);
  }
  return new Response('Not found',{status:404});
 }
}

export class IndependentProvider extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.storage=ctx.storage;}
 async fetch(request){
  if(new URL(request.url).pathname==='/inspect')return Response.json(Object.fromEntries(await this.storage.list({prefix:'provider/'})));
  const body=await request.json();if(!/^[a-f0-9]{64}$/u.test(body.deliveryId)||!/^[a-f0-9]{64}$/u.test(body.digest))return new Response('Invalid provider input',{status:400});
  return this.storage.transaction(async tx=>{
   const key='provider/'+body.deliveryId,prior=await tx.get(key);
   if(prior&&prior.digest!==body.digest)return new Response('Idempotency conflict',{status:409});
   const value=prior?{...prior,calls:prior.calls+1}:{...body,calls:1,commits:1,providerRef:'sample-'+body.deliveryId};
   await tx.put(key,value);return Response.json({providerRef:value.providerRef});
  });
 }
}
