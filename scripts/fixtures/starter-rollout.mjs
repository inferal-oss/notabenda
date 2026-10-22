// @requirements REQ-PRODUCT-CF-ROLLOUT
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-REMOTE-RECOVERY
// Maintainer-only host adapter. Never copied into packages or generated starters.
const fail=code=>{throw Error(code);};
const json=value=>JSON.parse(JSON.stringify(value));
export async function rolloutReply(work){try{return json({ok:true,value:await work()});}catch(error){return {ok:false,error:/^[a-z-]{1,80}$/u.test(error?.code??error?.message??'')?error.code??error.message:'fixture-operation-failed'};}}
const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function rolloutCapability(key,role){
 if(!/^[a-f0-9]{64}$/u.test(key??'')||!['reader','editor'].includes(role))fail('invalid-fixture-capability');
 const encoder=new TextEncoder(),material=await crypto.subtle.importKey('raw',encoder.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',material,encoder.encode('starter-rollout:'+role)));
}
async function equal(a,b){const enc=new TextEncoder(),values=await Promise.all([a,b].map(x=>crypto.subtle.digest('SHA-256',enc.encode(x))));let diff=0;const left=new Uint8Array(values[0]),right=new Uint8Array(values[1]);for(let i=0;i<left.length;i++)diff|=left[i]^right[i];return diff===0;}
export async function authorizeRolloutRequest(request,env){
 if(!/^[a-f0-9]{64}$/u.test(env.FIXTURE_KEY??''))return null;const header=request.headers.get('Authorization')??'';if(!/^Bearer [a-f0-9]{64}$/u.test(header))return null;
 if(await equal(header,'Bearer '+await rolloutCapability(env.FIXTURE_KEY,'editor')))return {inspect:true,configure:true,export:true,source:true,catalogReview:true,termsSettings:true};
 if(await equal(header,'Bearer '+await rolloutCapability(env.FIXTURE_KEY,'reader')))return {inspect:true};return null;
}
export function createRolloutControl(storage,data,workspace){
 const key='__fixture/rollout-control',read=async()=>await storage.get(key)??{phase:'closed',epoch:0,operations:{}};
 return {async run(action){
  const state=await read();if(action==='state')return state;
  if(action==='close'){if(state.phase==='open'){state.phase='closed';state.epoch++;await storage.put(key,state);}return state;}
  if(action==='open'){if(state.phase!=='closed'||Object.values(state.operations).some(v=>v.state!=='settled'))fail('rollout-not-ready');state.phase='open';await storage.put(key,state);return state;}
  if(!['archive-first','archive-later'].includes(action))fail('unknown-control-operation');if(state.phase!=='closed')fail('maintenance-requires-closed-gate');
  const prior=state.operations[action];if(prior){if(prior.state!=='settled')fail('archive-outcome-unresolved');return prior.result;}
  // A transport rejection cannot prove the actual private write stopped. Leave the marker unresolved.
  state.operations[action]={state:'unresolved'};await storage.put(key,state);
  const release=data.releases[action==='archive-first'?0:1],result=await workspace.recordRelease(json(release),{recordedAt:data.now,changeNote:action==='archive-first'?'Initial rollout archive':'Later rollout archive'});
  state.operations[action]={state:'settled',result:json(result)};await storage.put(key,state);return result;
 }};
}
export function createRolloutCanary(storage,data){return {async read(){return await storage.get('__fixture/rollout-canary')??null;},async touch(){
 const key='__fixture/rollout-canary',expected={runId:data.runId,sentinel:'preserve-current-class-layout'};
 const existing=await storage.get(key);if(existing){if(JSON.stringify(existing)!==JSON.stringify(expected))fail('canary-conflict');return existing;}
 await storage.put(key,expected);return expected;
}};}
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
const unwrap=result=>result?.ok===true?result.value:fail(result?.error??'control-unavailable');
/** Generated host and workspace behavior is retained; this wrapper belongs only to the private exercise. */
export function createRolloutHost(host,authorize,data){return {async fetch(request,env){
 const url=new URL(request.url),control=()=>env.CONTROL.getByName('rollout:'+data.runId);
 if(url.pathname!=='/rehearse'){
  let access;try{access=await authorize(request,env);}catch{}if(!access||access.inspect!==true)return host(request,env);
  try{if(unwrap(await control().command('state')).phase!=='open')return new Response('Rollout closed.',{status:503,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});}catch{return new Response('Rollout unavailable.',{status:503,headers:{'Cache-Control':'private, no-store'}});}
  return host(request,env);
 }
 if(!/^[a-f0-9]{64}$/u.test(env.FIXTURE_KEY??'')||!await equal(request.headers.get('Authorization')??'','Bearer '+env.FIXTURE_KEY))return reply({error:'access-denied'},403);
 if(request.method!=='POST')return reply({error:'method-not-allowed'},405);
 let body;try{const reader=request.body?.getReader();if(!reader)throw Error();let length=0,parts=[];for(;;){const item=await reader.read();if(item.done)break;length+=item.value.length;if(length>1024){await reader.cancel();throw Error();}parts.push(item.value);}const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!body||Object.keys(body).join(',')!=='action'||!['state','open','close','archive-first','archive-later','canary','canary-read'].includes(body.action))throw Error();}catch{return reply({error:'invalid-request'},400);}
 try{
  if(body.action==='canary'||body.action==='canary-read'){if(!env.CANARY||unwrap(await control().command('state')).phase!=='closed')fail('canary-not-allowed');const canary=env.CANARY.getByName('canary:'+data.runId);return reply({ok:true,value:await (body.action==='canary'?canary.touch():canary.read())});}
  const result=await control().command(body.action);if(!result.ok)return reply(result,409);return reply({ok:true,value:{...json(result.value),build:data.variant,runId:data.runId}});
 }catch{return reply({ok:false,error:'operation-uncertain'},503);}
}};}
