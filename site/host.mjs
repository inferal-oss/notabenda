// @requirements REQ-PRODUCT-CARTRIDGES
// @requirements REQ-QC-PROFILING
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
import {adminPresentation} from './admin-presentation.mjs';
// @requirements REQ-PRODUCT-DEMO-WORKSPACE
import {isDemoRoute,serveDemo} from './demo-host.mjs';
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
// @requirements REQ-PRODUCT-CF-HOST
import {createSetupWorker} from 'notabenda-cf';
// Website integration only. Authentication is deliberately outside both reusable packages.
export function canonicalRequest(request) {
  const url = new URL(request.url);
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return null; }
  if (/[\u0000-\u0020\u007f\\%]/u.test(path)) return null;
  url.pathname = path.replace(/\/{2,}/gu,'/');
  return new Request(url,request);
}
export const isProtected = path => /^\/(?:backoffice|demo\/processing|demo\/agreements|demo\/choices)(?:\/|$)/u.test(path);
export function protectedResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control','private, no-store, no-transform'); headers.set('Vary','Authorization');
  headers.set('Referrer-Policy','no-referrer'); headers.set('X-Content-Type-Options','nosniff');
  headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export async function hostAuthorization(request, env) {
  const url = new URL(request.url);
  const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const localDev=env.NOTABENDA_LOCAL_DEV_AUTH==='1'&&loopback;
  if (url.protocol !== 'https:' && !loopback) return protectedResponse(new Response('HTTPS is required.',{status:400}));
  if (!localDev&&(typeof env.ADMIN_KEY !== 'string' || !/^[a-f0-9]{64}$/u.test(env.ADMIN_KEY))) return protectedResponse(new Response('Admin access is not configured.',{status:503}));
  const header = request.headers.get('Authorization') ?? '';
  let credential = '';
  try { if (header.length <= 512 && /^Basic [A-Za-z0-9+/]+=*$/u.test(header)) credential = atob(header.slice(6)); } catch {}
  const expected = localDev?'admin:admin':`admin:${env.ADMIN_KEY}`;
  const [left,right] = await Promise.all([credential,expected].map(value=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
  const a = new Uint8Array(left), b = new Uint8Array(right); let different = 0;
  for(let i=0;i<a.length;i++) different |= a[i] ^ b[i];
  return different ? protectedResponse(new Response('Admin authentication required.',{status:401,headers:{'WWW-Authenticate':`Basic realm="${localDev?'Notabenda local development':'Notabenda workspace'}", charset="UTF-8"`}})) : null;
}
export async function readDemoRequest(request) {
  const url = new URL(request.url);
  if (request.method !== 'POST' || request.headers.get('Origin') !== url.origin || request.headers.get('Content-Type') !== 'application/json' || request.headers.get('X-Notabenda-Demo') !== '1') {
    await request.body?.cancel().catch(()=>{});
    throw new Error('Invalid demo request.');
  }
  const reader = request.body?.getReader(); if (!reader) throw new Error('Missing request.');
  const maxBytes=/^\/demo\/contracts\/(?:withdrawal|cancellation)$/u.test(url.pathname)?16384:2048;
  const chunks = []; let size = 0;
  try {
    while(true) { const {done,value} = await reader.read(); if(done) break; size += value.length; if(size > maxBytes) throw new Error('Oversized request.'); chunks.push(value); }
  } catch(error) { await reader.cancel().catch(()=>{}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset=0; for(const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export function publicResponse(response, path) {
  const headers = new Headers(response.headers);
  // @requirements REQ-PRODUCT-AGENT-INTEGRATION
  if(response.ok&&(/^\/guide\/.+\/index\.md$/u.test(path)||['/skills/notabenda/SKILL.md','/skills/notabenda/references/configuration-target.md'].includes(path))){
    headers.set('Content-Type','text/markdown; charset=utf-8');
    headers.set('Link','</llms.txt>; rel="describedby"');
  }
  if(response.ok&&(path==='/llms.txt'||path==='/skills/notabenda/agents/openai.yaml'))headers.set('Content-Type','text/plain; charset=utf-8');
  if(response.ok&&path==='/integration-reference.json')headers.set('Content-Type','application/json; charset=utf-8');
  if(response.ok&&(path==='/site-config.schema.json'||/^\/schemas\/[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?\/site-config\.schema\.json$/u.test(path)))headers.set('Content-Type','application/schema+json; charset=utf-8');
  // Preserve exact built/released bytes at intermediary caches, including HTML injection.
  const caching=headers.get('Cache-Control');
  if(!caching?.split(',').some(value=>value.trim().toLowerCase()==='no-transform'))headers.set('Cache-Control',caching?caching+', no-transform':'no-transform');
  const embeds=/^\/embeds(?:\/|\/index\.html)?$/u.test(path);
  const sampleFrame=/^\/embeds\/frame(?:\/|\/index\.html)?$/u.test(path);
  const runtime = embeds || /^\/(?:dark\/)?(?:start|choices|react|google-basic|storage-cleanup|storage-exceptions|localization|technology|privacy-signals|discovery|repeat-prompts|scope-guards|services)(?:\/|\/index\.html)?$/u.test(path) || /^\/astro(?:\/notes)?(?:\/|\/index\.html)?$/u.test(path);
  headers.set('Content-Security-Policy',`default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; ${runtime ? "script-src 'self'; connect-src 'self';" : ''} ${embeds?"frame-src 'self'; ":''}base-uri 'none'; form-action 'self'; frame-ancestors ${sampleFrame?"'self'":"'none'"}`);
  headers.set('X-Content-Type-Options','nosniff'); headers.set('Referrer-Policy','no-referrer');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export async function serveHost(input, env) {
  const request = canonicalRequest(input);
  if (!request) return protectedResponse(new Response('Invalid path.',{status:400}));
  const path = new URL(request.url).pathname;
  if(isDemoRoute(path))return serveDemo(request,env,{protect:protectedResponse,readBody:readDemoRequest});
  if (isProtected(path)) {
    const denied = await hostAuthorization(request,env); if(denied) return denied;
    try {
      if(['/backoffice/setup','/backoffice/setup/'].includes(path))return protectedResponse(await createSetupWorker({...adminPresentation('/backoffice'),basePath:'/backoffice/setup',authorize:()=>true,scriptUrl:'/assets/setup.mjs',stylesheetUrl:'/assets/notabenda.css'}).fetch(request,env));
      if (/^\/backoffice(?:\/|$)/u.test(path) || /^\/demo\/(?:agreements|choices|processing)(?:\/|$)/u.test(path)) {
        let forwarded=request;
        if(path.startsWith('/demo/agreements/')||path==='/demo/choices/record'||path==='/demo/processing/record') {
          if(!/^\/demo\/(?:agreements\/(?:light|dark)|(?:choices|processing)\/record)$/u.test(path)) return protectedResponse(new Response('Not found.',{status:404}));
          let body;
          try { body=await readDemoRequest(request); }
          catch { return protectedResponse(Response.json({code:'recording-failed'},{status:400})); }
          const headers=new Headers(request.headers); headers.delete('Content-Length');
          forwarded=new Request(request.url,{method:'POST',headers,body:JSON.stringify(body)});
        } else if(!['GET','HEAD'].includes(request.method)) {
          return protectedResponse(new Response('Method not allowed.',{status:405,headers:{Allow:'GET, HEAD'}}));
        }
        const stub=env.WORKSPACE.get(env.WORKSPACE.idFromName('synthetic-workspace'));
        return protectedResponse(await stub.fetch(forwarded));
      }
      if (!['GET','HEAD'].includes(request.method)) return protectedResponse(new Response('Method not allowed.',{status:405,headers:{Allow:'GET, HEAD'}}));
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set('Content-Security-Policy',"default-src 'none'; style-src 'self'; img-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      return protectedResponse(new Response(response.body,{status:response.status,statusText:response.statusText,headers}));
    } catch { return protectedResponse(new Response('Workspace unavailable.',{status:503})); }
  }
  if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed.',{status:405,headers:{Allow:'GET, HEAD'}});
  return publicResponse(await env.ASSETS.fetch(request),path);
}
