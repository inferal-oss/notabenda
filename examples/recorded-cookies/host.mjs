// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CONSENT-NOTICE-FILES
// Application example HTTP policy, not a package-provided ingestion/authentication API.
const errors=new Set(['invalid-request','stale-notice','revision-conflict','expired-command','idempotency-conflict','scope-restricted','context-retired']);
const privateHeaders={'Cache-Control':'private, no-store','Vary':'Cookie, Authorization','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(value,status=200)=>Response.json(value,{status,headers:privateHeaders});
async function value(promise){const result=await promise;if(result?.ok!==true)throw Object.assign(Error(),{code:result?.code});return result.value;}
function privateResponse(response,head=false){const headers=new Headers(response.headers);for(const [name,value] of Object.entries(privateHeaders))headers.set(name,value);return new Response(head?null:response.body,{status:response.status,headers});}
async function body(request){
  if(request.headers.get('Content-Type')?.toLowerCase()!=='application/json')throw Object.assign(Error(),{status:415});
  // Count bytes while streaming. Content-Length is only an early bound, never the enforcement.
  const length=request.headers.get('Content-Length');if(length!==null&&(!/^\d+$/u.test(length)||Number(length)>8192))throw Object.assign(Error(),{status:413});
  const reader=request.body?.getReader();if(!reader)throw Object.assign(Error(),{status:400});
  let size=0;const chunks=[];
  try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>8192){await reader.cancel();throw Object.assign(Error(),{status:413});}chunks.push(next.value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let parsed;try{parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Object.assign(Error(),{status:400});}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Object.assign(Error(),{status:400});
  return parsed;
}
function originFor(env,release){
  const origin=env.APP_ORIGIN??new URL(release.runtime.inventory.site.url).origin;
  const url=new URL(origin);if(url.origin!==origin||url.username||url.password||url.protocol!=='https:'&&!(release.runtime.mode==='preview'&&url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('Invalid application origin.');
  if(release.runtime.mode!=='preview'&&origin!==new URL(release.runtime.inventory.site.url).origin)throw Error('Origin must match the production site.');
  return origin;
}

export function createCookieHost({release,authorizeVisitor,authorizeOperator}) {
  return async function fetch(request,env){
    const url=new URL(request.url),path=url.pathname;
    let origin;try{origin=originFor(env,release);}catch{return json({code:'unavailable'},503);}
    if(url.origin!==origin||path.includes('%')||path.includes('\\')||request.url.length>4096)return json({code:'invalid-request'},400);
    const visitor=['/api/cookies/bootstrap','/api/cookies/head','/api/cookies/record'].includes(path);
    const operator=['/backoffice/register','/backoffice/activate'].includes(path);
    const admin=path==='/backoffice'||/^\/backoffice\/choices(?:\/(?:record))?\/?$/u.test(path);
    if(url.search&&!admin)return json({code:'invalid-request'},400);
    if(!visitor&&!operator&&!admin){
      if(/^\/operator(?:\.html)?(?:\/|$)/u.test(path))return json({code:'not-found'},404);
      if(!['GET','HEAD'].includes(request.method))return json({code:'method-not-allowed'},405);
      return env.ASSETS.fetch(request);
    }
    const mutation=visitor||operator;
    if(mutation&&request.method!=='POST'||!mutation&&!['GET','HEAD'].includes(request.method))return json({code:'method-not-allowed'},405);
    // Compare with trusted configuration, never the incoming Host header. No CORS allowance.
    if(mutation&&(request.headers.get('Origin')!==origin||request.headers.get('X-Notabenda-Request')!=='1'))return json({code:'origin-denied'},403);
    let access;try{access=await (visitor?authorizeVisitor:authorizeOperator)(request,env);}catch{return json({code:'access-denied'},403);}
    if(visitor?typeof access?.streamId!=='string'||!access.streamId.trim()||new TextEncoder().encode(access.streamId).length>200:access?.inspect!==true)return json({code:'access-denied'},403);
    if(operator&&access.manageNotices!==true)return json({code:'access-denied'},403);
    let input;if(mutation){try{input=await body(request);}catch(e){return json({code:'invalid-request'},e.status??400);}if(path!=='/api/cookies/record'&&Object.keys(input).length)return json({code:'invalid-request'},400);}
    // Authorization, origin and bounded parsing precede object access. The name is fixed by this build.
    try{
      const workspace=env.EVIDENCE.getByName('notabenda:'+release.notice.siteId);
      if(path==='/api/cookies/bootstrap')return json({runtime:release.runtime,notice:release.notice,head:await value(workspace.read(access.streamId))});
      if(visitor){
        const head=await value(workspace.read(access.streamId));
        // The browser's digest is a precondition, never an identity selector. Resolve the host session again.
        if(request.headers.get('X-Notabenda-Stream')!==head.streamRef)return json({code:'context-changed'},403);
        if(path==='/api/cookies/head')return json(head);
      }
      if(path==='/api/cookies/record')return json(await value(workspace.record(access.streamId,input)));
      if(path==='/backoffice/register')return json(await value(workspace.register()));
      if(path==='/backoffice/activate')return json(await value(workspace.activate()));
      if(path==='/backoffice')return privateResponse(new Response(release.operatorHtml,{headers:{'Content-Type':'text/html; charset=utf-8'}}),request.method==='HEAD');
      return privateResponse(await workspace.inspect(request),request.method==='HEAD');
    }catch(error){return json({code:errors.has(error.code)?error.code:'unavailable'},errors.has(error.code)?409:503);}
  };
}
