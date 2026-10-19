// @requirements REQ-PRODUCT-MOBILE
// @requirements REQ-PRODUCT-A11Y
/** @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-CF-ADMIN */
import type {ExecutionContextLike,AdminWorker,AdminPresentation} from './types.js';
import {normalizeAdminPresentation} from './presentation.js';
import {renderWorkspaceShell} from './render.js';
export interface SetupWorkerOptions<Env> extends AdminPresentation {
  /** Host verifies operator access on every request; no package-owned identity system. */
  authorize(request:Request,env:Env,context?:ExecutionContextLike):boolean|Promise<boolean>;
  basePath?:string;
  /** Hosted same-origin module that calls mountSetup from notabenda/setup/ui. */
  scriptUrl:string;
  stylesheetUrl:string;
}
const path=(value:unknown):value is string=>typeof value==='string'&&value.length<=300&&/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*$/u.test(value)&&!value.split('/').some(part=>part==='.'||part==='..');
export function createSetupWorker<Env=unknown>(options:SetupWorkerOptions<Env>):AdminWorker<Env> {
  if(!options||typeof options.authorize!=='function'||!path(options.scriptUrl)||!path(options.stylesheetUrl))throw new Error('Setup needs host authorization and explicit same-origin script/style paths.');
  const basePath=options.basePath??'/admin/notabenda/setup';if(!path(basePath)||basePath.includes('.'))throw new Error('Use a clean setup base path.');
  const {authorize,scriptUrl,stylesheetUrl}=options;
  const presentation=normalizeAdminPresentation(options);
  return {async fetch(request,env,context){
    const headers=new Headers({'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store','Pragma':'no-cache','Vary':'Cookie, Authorization','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"});
    const response=(text:string,status:number)=>new Response(request.method==='HEAD'?null:text,{status,headers});
    try{if(await authorize(request,env,context)!==true)return response('Access denied.',403);}catch{return response('Access denied.',403);}
    if(!['GET','HEAD'].includes(request.method)){headers.set('Allow','GET, HEAD');return response('Method not allowed.',405);}
    const url=new URL(request.url);if(![basePath,basePath+'/'].includes(url.pathname)||url.search)return response('Not found.',404);
    headers.set('Content-Type','text/html; charset=utf-8');
    const nonce=crypto.randomUUID().replaceAll('-','');
    headers.set('Content-Security-Policy',headers.get('Content-Security-Policy')!.replace("style-src 'self'",`style-src 'self' 'nonce-${nonce}'`));
    return response(renderWorkspaceShell(`<header class="setup-intro"><div><p class="eyebrow">Guided setup</p><h1>Site configuration</h1><p class="intro">Describe your site, its services and processing purposes.<br> Review a local draft before publishing.</p></div><aside class="setup-intro-note"><span aria-hidden="true">↳</span><p>Your facts become a draft.<br><strong>You decide what goes live.</strong></p></aside></header><div data-notabenda-setup></div><noscript><p>JavaScript is required for this local questionnaire. You can use the CLI wizard instead.</p></noscript>`,{...presentation,basePath,title:'Guided setup',scopeLabel:'Private working draft',nonce},`<link rel="stylesheet" href="${stylesheetUrl}"><script type="module" src="${scriptUrl}"></script>`,'workspace-setup'),200);
  }};
}
