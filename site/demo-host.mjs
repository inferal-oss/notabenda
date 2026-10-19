// @requirements REQ-PRODUCT-CF-HOST
import {demoStorageNote} from './website-notice.mjs';
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
import {contractActionOperationRef} from 'notabenda-cf';
import {contractContext} from './contract-context.mjs';
import {adminPresentation} from './admin-presentation.mjs';
// @requirements REQ-PRODUCT-DEMO-WORKSPACE
import {demoExpired} from './demo-presentation.mjs';
import {createSetupWorker} from 'notabenda-cf';
// @requirements REQ-PRODUCT-FORM-PERMISSIONS
import {formPermissionStreamRef} from 'notabenda-cf';
import {permissionContext} from './permission-context.mjs';
import data from './dist/server-data.json' with {type:'json'};
const cookieBase='notabenda_demo';
const permissionPage=/^\/(?:(?:dark\/)?form-permissions(?:\/react)?|form-permissions\/astro(?:\/review)?)(?:\/(?:index\.html)?)?$/u;
const contractPage=/^\/(?:dark\/)?contract-actions\/(withdrawal|cancellation)(?:\/(?:index\.html)?)?$/u;
const isPage=path=>permissionPage.test(path)||contractPage.test(path)||/^\/(?:agreement|dark\/agreement|recorded-choices|processing-choices)(?:\/|$)/u.test(path);
const admin=/^\/demo\/admin(?:\/|$)/u;
const api=/^\/demo\/(?:agreements\/(?:light|dark)|(?:choices|processing)\/(?:head|record)|permissions\/(?:state|record)|contracts\/(?:withdrawal|cancellation))$/u;
export const isDemoRoute=path=>isPage(path)||admin.test(path)||api.test(path);
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export async function serveDemo(request,env,{protect,readBody}){
 const url=new URL(request.url),path=url.pathname,cookieName=(url.protocol==='https:'?'__Host-':'')+cookieBase;
 const loopback=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
 const secret=/^[a-f0-9]{64}$/u.test(env.ADMIN_KEY??'')?env.ADMIN_KEY:env.NOTABENDA_LOCAL_DEV_AUTH==='1'&&loopback?'notabenda-local-demo-signing-v1':undefined;
 const finish=(response,session,clear=false)=>{
  if(response.status===410&&!api.test(path)&&request.method==='GET')response=demoExpired();
  const headers=new Headers(protect(response).headers);headers.set('Vary','Cookie');headers.delete('Content-Length');
  if(session||clear)headers.append('Set-Cookie',`${cookieName}=${session??''}; Path=/; HttpOnly; SameSite=Lax${clear?'; Max-Age=0':''}${url.protocol==='https:'?'; Secure':''}`);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 };
 if(url.protocol!=='https:'&&!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return finish(new Response('HTTPS is required.',{status:400}));
 if(!['GET','HEAD','POST'].includes(request.method))return finish(new Response('Method not allowed.',{status:405}));
 if(request.method==='POST'&&!api.test(path))return finish(new Response('Method not allowed.',{status:405}));
 let body;
 if(api.test(path)&&!/(?:head|state)$/u.test(path)){
  try{body=await readBody(request);}catch{return finish(Response.json({code:'invalid-request'},{status:400}));}
 }else if(request.method==='POST')return finish(new Response('Method not allowed.',{status:405}));
 if(!secret)return finish(new Response('Demo sessions are not configured.',{status:503}));
 const signingKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 const cookies=(request.headers.get('Cookie')??'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(cookieName+'='));
 let capability=cookies.length===1?cookies[0].slice(cookieName.length+1):undefined;
 let session;
 if(capability&&/^[a-f0-9]{64}\.[a-f0-9]{64}$/u.test(capability)){
  const [candidate,signature]=capability.split('.');const bytes=Uint8Array.from(signature.match(/../gu),hex=>parseInt(hex,16));
  if(await crypto.subtle.verify('HMAC',signingKey,bytes,new TextEncoder().encode(candidate)))session=candidate;
 }
 if(cookies.length&&!session)return finish(Response.json({code:'demo-expired'},{status:410}),undefined,true);
 if(!session&&(api.test(path)||request.method!=='GET'))return finish(Response.json({code:'demo-session-required'},{status:409}));
 const fresh=!session;
 if(fresh){const ip=request.headers.get('CF-Connecting-IP')??'local';if(!env.DEMO_PROVISION_LIMITER||(await env.DEMO_PROVISION_LIMITER.limit({key:await digest(ip)})).success!==true)return finish(new Response('Please wait a moment before starting another demo.',{status:429,headers:{'Retry-After':'60'}}));}
 session??=token();const generation=await digest(session);
 if(fresh){const signed=await crypto.subtle.sign('HMAC',signingKey,new TextEncoder().encode(session));capability=session+'.'+Array.from(new Uint8Array(signed),b=>b.toString(16).padStart(2,'0')).join('');}
 if(api.test(path)&&request.headers.get('X-Notabenda-Demo-Generation')!==generation)return finish(Response.json({code:'demo-generation-changed'},{status:409}));
 try{
  // A different binding and class: no input can name or reach the operational WORKSPACE.
  const stub=env.DEMO_WORKSPACES.get(env.DEMO_WORKSPACES.idFromName('public-demo/'+generation));
  const headers=new Headers(request.headers);headers.delete('Authorization');headers.delete('Content-Length');headers.set('X-Notabenda-Demo-Generation',generation);
  if(fresh){const provisionUrl=new URL('/demo/provision',url);const provision=await stub.fetch(new Request(provisionUrl,{method:'POST',headers}));if(!provision.ok)return finish(new Response('Demo workspace unavailable.',{status:503}));}
  if(!fresh&&(isPage(path)||['/demo/admin/setup','/demo/admin/setup/'].includes(path))){const sessionUrl=new URL('/demo/session',url);const current=await stub.fetch(new Request(sessionUrl,{headers}));if(!current.ok)return finish(current,undefined,current.status===410);}
  let response;
  if(isPage(path)){
   response=await env.ASSETS.fetch(request);
   const assetHeaders=new Headers(response.headers);assetHeaders.set('Content-Security-Policy',"default-src 'none'; style-src 'self'; img-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
   let content=response.body;if(response.headers.get('Content-Type')?.includes('text/html')&&request.method!=='HEAD'){
    const permissionEntry=permissionPage.test(path);
    const stream=permissionEntry?`<meta name="notabenda-permission-stream" content="${await formPermissionStreamRef(permissionContext(data.formPermissions.offer,generation))}">`:'';
    const contractRoute=contractPage.exec(path)?.[1],contract=contractRoute?`<meta name="notabenda-contract-operation" content="${await contractActionOperationRef(contractContext(data.contractActions.definitions[contractRoute],generation))}">`:'';
    content=(await response.text()).replace(/<main\b/u,demoStorageNote+'<main').replace('</head>',`<meta name="notabenda-demo-generation" content="${generation}">${stream}${contract}<link rel="stylesheet" href="/assets/website-notice.css"></head>`);
   }
   response=new Response(content,{status:response.status,headers:assetHeaders});
  }else if(['/demo/admin/setup','/demo/admin/setup/'].includes(path)){
   response=await createSetupWorker({...adminPresentation('/demo/admin'),basePath:'/demo/admin/setup',authorize:()=>true,scriptUrl:'/assets/setup.mjs',stylesheetUrl:'/assets/notabenda.css'}).fetch(request,env);
  }else{
   const forwarded=new Request(request.url,{method:request.method,headers,...(body?{body:JSON.stringify(body)}:{})});response=await stub.fetch(forwarded);
  }
  if(response.status===410){

   return finish(response,undefined,true);
  }
  return finish(response,capability);
 }catch{return finish(new Response('Demo workspace unavailable.',{status:503}));}
}
