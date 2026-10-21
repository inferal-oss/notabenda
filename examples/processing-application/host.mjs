// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
import {hasGlobalPrivacyControl} from '@notabenda/core';
import {operationalEvent} from './workspace.mjs';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie, Sec-GPC','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const fail=status=>{throw Object.assign(Error(),{status});};
async function bounded(promise,timeout=5000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Unconfirmed host operation.')),timeout);})]);}finally{clearTimeout(timer);}}
async function value(promise,timeout=5000){let timer;try{const result=await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Unconfirmed RPC.')),timeout);})]);if(result?.ok!==true)throw Object.assign(Error(),{code:result?.code});return result.value;}finally{clearTimeout(timer);}}
async function body(request){
  if(request.headers.get('Content-Type')?.toLowerCase()!=='application/json')return fail(415);
  const size=request.headers.get('Content-Length');if(size!==null&&(!/^\d+$/u.test(size)||Number(size)>4096))return fail(413);
  const reader=request.body?.getReader();if(!reader)return fail(400);const parts=[];let bytes=0;
  try{for(;;){const item=await reader.read();if(item.done)break;bytes+=item.value.byteLength;if(bytes>4096){await reader.cancel();return fail(413);}parts.push(item.value);}}finally{reader.releaseLock();}
  const all=new Uint8Array(bytes);let offset=0;for(const part of parts){all.set(part,offset);offset+=part.length;}
  try{const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));if(!input||typeof input!=='object'||Array.isArray(input))return fail(400);return input;}catch{return fail(400);}
}
function originFor(env,release){const origin=env.APP_ORIGIN??new URL(release.runtime.inventory.site.url).origin,url=new URL(origin);if(url.origin!==origin||url.username||url.password||url.protocol!=='https:'&&!(release.runtime.mode==='preview'&&url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error();if(release.runtime.mode!=='preview'&&origin!==new URL(release.runtime.inventory.site.url).origin)throw Error();return origin;}
function privateResponse(response,extra,head=false){const result=new Headers(response.headers);for(const [k,v] of Object.entries(headers))result.set(k,v);for(const [k,v] of new Headers(extra??{}))result.set(k,v);return new Response(head?null:response.body,{status:response.status,headers:result});}

/** Application routes. Context and operator permissions remain host-owned. */
export function createProcessingHost({release,resolveVisitor,authorizeOperator,rpcTimeoutMs=5000}){
  if(!Number.isInteger(rpcTimeoutMs)||rpcTimeoutMs<1||rpcTimeoutMs>5000)throw Error('Invalid host timeout.');
  const rpc=promise=>value(promise,rpcTimeoutMs);
  return async(request,env)=>{
    const url=new URL(request.url),path=url.pathname;let origin;try{origin=originFor(env,release);}catch{return json({code:'unavailable'},503);}
    if(url.origin!==origin||request.url.length>4096||path.includes('%')||path.includes('\\'))return json({code:'invalid-request'},400);
    // Passive observation belongs to ordinary navigation too: no Origin header or account prerequisite.
    const observed=hasGlobalPrivacyControl(request);
    const api=['/api/processing/bootstrap','/api/processing/head','/api/processing/record','/api/processing/queue','/api/processing/client'].includes(path);
    const operatorMutation=['/backoffice/register','/backoffice/dispatch'].includes(path),admin=path==='/backoffice'||path==='/backoffice/data'||/^\/backoffice\/processing(?:\/record)?\/?$/u.test(path);
    if(url.search&&!admin)return json({code:'invalid-request'},400);
    if(!api&&!operatorMutation&&!admin&&path!=='/'){
      if(path.startsWith('/api/')||/^\/operator(?:\.html)?(?:\/|$)/u.test(path))return json({code:'not-found'},404);
      return ['GET','HEAD'].includes(request.method)?env.ASSETS.fetch(request):json({code:'method-not-allowed'},405);
    }
    if(api||operatorMutation){if(request.method!=='POST')return json({code:'method-not-allowed'},405);if(request.headers.get('Origin')!==origin||request.headers.get('X-Notabenda-Request')!=='1')return json({code:'origin-denied'},403);}
    else if(!['GET','HEAD'].includes(request.method))return json({code:'method-not-allowed'},405);
    let operator;
    if(admin||operatorMutation){try{operator=await bounded(Promise.resolve().then(()=>authorizeOperator(request,env)),rpcTimeoutMs);}catch{}if(operator?.inspect!==true||path==='/backoffice/register'&&operator.manageNotices!==true||path==='/backoffice/dispatch'&&operator.dispatch!==true)return json({code:'access-denied'},403);}
    let input;if(api||operatorMutation)try{input=await body(request);if(!['/api/processing/record','/backoffice/dispatch'].includes(path)&&Object.keys(input).length)throw Error();}catch(e){return json({code:'invalid-request'},e.status??400);}
    const workspace=()=>env.EVIDENCE.getByName('processing:'+release.notice.siteId),sink=()=>env.DELIVERIES.getByName('processing:'+release.notice.siteId);
    try{
      if(path==='/backoffice')return privateResponse(new Response(release.operatorHtml,{headers:{'Content-Type':'text/html; charset=utf-8'}}),null,request.method==='HEAD');
      if(path==='/backoffice/data')return json({jobs:await rpc(workspace().jobs()),deliveries:await rpc(sink().observations()),boundary:'Delivery observations are separate from restriction receipts. No new admission is allowed after a committed restriction; earlier admitted calls cannot be recalled.'});
      if(path==='/backoffice/register')return json(await rpc(workspace().register()));
      if(path==='/backoffice/dispatch'){if(Object.keys(input).join(',')!=='deliveryId')return json({code:'invalid-request'},400);return json(await rpc(workspace().dispatch(input.deliveryId)));}
      if(admin)return privateResponse(await workspace().inspect(request),null,request.method==='HEAD');
      let visitor;try{visitor=await bounded(Promise.resolve().then(()=>resolveVisitor(request,env)),rpcTimeoutMs);}catch{}
      const streamId=typeof visitor?.streamId==='string'&&/^[A-Za-z0-9._:-]{1,200}$/u.test(visitor.streamId)?visitor.streamId:null;
      let persistence=streamId?'confirmed':'unconfirmed';
      if(observed&&streamId)try{await rpc(workspace().observe(streamId));}catch{persistence='unconfirmed';}
      if(path==='/'){
        if(request.method==='HEAD')return privateResponse(await env.ASSETS.fetch(request),visitor?.headers,true);
        // Unrelated work has its own destination observation and no visitor payload.
        let operational='unconfirmed';try{await rpc(sink().receive(await operationalEvent()));operational='delivered';}catch{}
        let covered={state:'blocked',reason:observed?'signal':'context-unavailable'};
        if(!observed&&streamId&&persistence==='confirmed')try{covered=await rpc(workspace().produce(streamId,false,'server'));if(['read-unavailable','restriction-unconfirmed'].includes(covered.reason))persistence='unconfirmed';}catch{covered={state:'uncertain',reason:'delivery-unconfirmed'};persistence='unconfirmed';}
        const observation={observed,covered,operational,persistence};const asset=await env.ASSETS.fetch(request),text=await asset.text(),encoded=JSON.stringify(observation).replaceAll('<','\\u003c');
        return privateResponse(new Response(text.replace('<!--PROCESSING_OBSERVATION-->','<script type="application/json" id="server-observation">'+encoded+'</script>'),{status:asset.status,headers:{'Content-Type':'text/html; charset=utf-8'}}),{...Object.fromEntries(new Headers(visitor?.headers??{})),'X-Example-Processing':covered.state,'X-Example-Persistence':persistence});
      }
      if(!streamId)return json({code:'context-unavailable'},503);
      const head=await rpc(workspace().read(streamId));if(await rpc(workspace().pending(streamId)))persistence='unconfirmed';
      if(path==='/api/processing/bootstrap')return privateResponse(json({runtime:release.runtime,notice:release.notice,head,observed,persistence}),visitor?.headers);
      if(request.headers.get('X-Notabenda-Stream')!==head.streamRef)return json({code:'context-changed'},403);
      if(path==='/api/processing/head')return persistence==='confirmed'?json(head):json({code:'unavailable'},503);
      if(path==='/api/processing/record')return json(await rpc(workspace().record(streamId,input)));
      if(path==='/api/processing/queue')return observed||persistence!=='confirmed'?json({state:'blocked',reason:observed?'signal':'unconfirmed'}):json(await rpc(workspace().enqueue(streamId)));
      if(path==='/api/processing/client')return json(await rpc(workspace().produce(streamId,observed,'client')));
      return json({code:'not-found'},404);
    }catch(e){return json({code:['invalid-request','scope-mismatch','idempotency-conflict','context-retired','queue-full','not-found'].includes(e.code)?e.code:'unavailable'},e.code==='invalid-request'?400:e.code==='idempotency-conflict'?409:503);}
  };
}
