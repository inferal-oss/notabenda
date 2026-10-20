// @requirements REQ-PRODUCT-RECORDING-INSPECTION
// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {normalizeAdminPresentation} from './presentation.js';
import {escapeHtml as e,renderWorkspaceShell,renderRecordCards} from './render.js';
import {boundedText} from './records.js';
import {readRecordPage,recordQueryParams} from './export.js';
import type {AdminPresentation,AdminWorker,ExecutionContextLike,RecordStore,RecordQuery,RecordPage} from './types.js';

/** These stores must already be scoped by the host. Neither paths nor display IDs select storage. */
export interface WorkspaceArea {id:string;title:string;description:string;href:string;store:RecordStore;primary?:boolean}
export interface WorkspaceOverviewGrant {areas:readonly WorkspaceArea[];scopeLabel?:string;allowSetup?:boolean;allowRecordingInspection?:boolean}
export interface WorkspaceOverviewOptions<Env> extends AdminPresentation {
 authorize(request:Request,env:Env,context?:ExecutionContextLike):WorkspaceOverviewGrant|null|Promise<WorkspaceOverviewGrant|null>;
 basePath?:string;
 /** An optional destination, displayed only with this request's allowSetup grant. */
 setupPath?:string;recordingPath?:string;
}
const route=(value:unknown):value is string=>typeof value==='string'&&value.length<=250&&/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/u.test(value);
function normalizeGrant(input:WorkspaceOverviewGrant|null):WorkspaceOverviewGrant {
 if(!input||!Array.isArray(input.areas)||input.areas.length>10||input.scopeLabel!==undefined&&!boundedText(input.scopeLabel,200)||input.allowSetup!==undefined&&typeof input.allowSetup!=='boolean'||input.allowRecordingInspection!==undefined&&typeof input.allowRecordingInspection!=='boolean')throw Error('Invalid workspace grant.');
 const ids=new Set<string>(),paths=new Set<string>();let primary=0;
 const areas=input.areas.map(a=>{
  if(!a||typeof a.id!=='string'||!/^[a-z][a-z0-9-]{0,39}$/u.test(a.id)||ids.has(a.id)||!boundedText(a.title,80)||!a.title.trim()||!boundedText(a.description,300)||!route(a.href)||paths.has(a.href)||a.primary!==undefined&&typeof a.primary!=='boolean'||!a.store||typeof a.store.list!=='function'||typeof a.store.get!=='function')throw Error('Invalid workspace area.');
  ids.add(a.id);paths.add(a.href);if(a.primary&&++primary>3)throw Error('Use at most three primary jobs.');
  return {id:a.id,title:a.title,description:a.description,href:a.href,store:a.store,primary:a.primary===true};
 });
 return {areas,...(input.scopeLabel===undefined?{}:{scopeLabel:input.scopeLabel}),allowSetup:input.allowSetup===true,allowRecordingInspection:input.allowRecordingInspection===true};
}
export function createWorkspaceOverviewWorker<Env=unknown>(options:WorkspaceOverviewOptions<Env>):AdminWorker<Env> {
 if(!options||typeof options.authorize!=='function')throw Error('Workspace overview needs host authorization.');
 const basePath=options.basePath??'/admin/notabenda',setupPath=options.setupPath,recordingPath=options.recordingPath;
 if(!route(basePath)||setupPath!==undefined&&!route(setupPath)||recordingPath!==undefined&&!route(recordingPath))throw Error('Use clean workspace paths.');
 const authorize=options.authorize,presentation=normalizeAdminPresentation(options);
 return {async fetch(request,env,context){
  const headers=new Headers({'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store','Pragma':'no-cache','Vary':'Cookie, Authorization','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"});
  const reply=(body:string,status:number)=>new Response(request.method==='HEAD'?null:body,{status,headers});
  let grant:WorkspaceOverviewGrant;try{grant=normalizeGrant(await authorize(request,env,context));}catch{return reply('Access denied.',403);}
  if(!['GET','HEAD'].includes(request.method)){headers.set('Allow','GET, HEAD');return reply('Method not allowed.',405);}
  if(request.url.length>4096)return reply('Request is too long.',414);
  const url=new URL(request.url);
  if(![basePath,basePath+'/'].includes(url.pathname))return reply('Not found.',404);
  if([...url.searchParams.keys()].some(key=>key!=='q')||url.searchParams.getAll('q').length>1)return reply('Invalid search.',400);
  const query=url.searchParams.get('q')??'';if(!boundedText(query,256))return reply('Invalid search.',400);
  const searching=query.trim().length>0,selection:RecordQuery={query,kind:'',keyPrefix:'',from:'',to:'',limit:3};
  // A normal overview reads no records. Search reads exactly one validated segment per granted area.
  const results:{area:WorkspaceArea;page:RecordPage|undefined}[]=[];
  if(searching)for(const area of grant.areas){try{results.push({area,page:await readRecordPage(area.store,selection)});}catch{results.push({area,page:undefined});}}

  const primary=grant.areas.filter(a=>a.primary),more=grant.areas.filter(a=>!a.primary);
  const job=(a:WorkspaceArea,index:number)=>`<a class="workspace-job" href="${e(a.href)}"><span class="workspace-job-number" aria-hidden="true">0${index+1}</span><h3>${e(a.title)}</h3><p>${e(a.description)}</p><span class="workspace-job-open">Open records <span aria-hidden="true">↗</span></span></a>`;
  const moreJobs=more.length?`<details class="workspace-more"><summary>More records <span>${more.length} areas <i aria-hidden="true">›</i></span></summary><div class="workspace-more-grid">${more.map(a=>`<a href="${e(a.href)}"><strong>${e(a.title)} <span aria-hidden="true">↗</span></strong><span>${e(a.description)}</span></a>`).join('')}</div></details>`:'';
  const searchResult=searching?`<section class="workspace-search-results" aria-labelledby="search-results"><header><div><p class="eyebrow">Record finder</p><h2 id="search-results">Matching records</h2></div><a href="${e(basePath)}">Clear search</a></header><p class="hint">Showing up to three records per area. Open an area’s search to inspect more.</p>${results.length&&results.every(r=>r.page&&r.page.records.length===0&&r.page.nextAfter===undefined)?'<p>No matching records in the available areas.</p>':''}${results.filter(({page})=>!page||page.records.length||page.nextAfter!==undefined).map(({area,page})=>`<section class="workspace-area-results" aria-labelledby="result-${e(area.id)}"><div class="workspace-area-heading"><h3 id="result-${e(area.id)}">${e(area.title)}</h3><a href="${e(area.href+'?'+recordQueryParams(selection))}">Search this area <span aria-hidden="true">↗</span></a></div>${page===undefined?'<p class="workspace-read-error">Records could not be read. Open this area to try again.</p>':page.records.length?`<div class="cards${page.records.every(r=>r.data&&typeof r.data==='object'&&!Array.isArray(r.data)&&r.data.kind==='terms-acceptance')?' agreement-entries':''}">${renderRecordCards(page.records,area.href)}</div>`:`<p class="hint">${page.nextAfter===undefined?'No matches in this area.':'No matches in the examined segment. More records remain.'}</p>`}${page?.nextAfter===undefined?'':`<a class="workspace-continue" href="${e(area.href+'?'+recordQueryParams({...selection,after:page.nextAfter}))}">Continue search in ${e(area.title)} <span aria-hidden="true">→</span></a>`}</section>`).join('')}${results.some(r=>r.page&&r.page.records.length===0&&r.page.nextAfter===undefined)?`<details class="workspace-search-empty"><summary>Areas without matches</summary><ul>${results.filter(r=>r.page&&r.page.records.length===0&&r.page.nextAfter===undefined).map(r=>`<li><a href="${e(r.area.href+'?'+recordQueryParams(selection))}">${e(r.area.title)}</a></li>`).join('')}</ul></details>`:''}${grant.areas.length?'':'<p>No record areas are available for this request.</p>'}<details class="workspace-search-info"><summary>How this search works</summary><p>Each area supplies one bounded segment, in record-key order. A segment can be empty while more records remain. These are not totals or a snapshot; stored history does not establish current permission.</p></details></section>`:'';
  const body=`<div class="workspace-overview"><header class="workspace-overview-intro"><p class="eyebrow">${e(grant.scopeLabel??'Your workspace')}</p><h1>${searching?'Find records.':'Your records, by job.'}</h1>${searching?'':'<p>Find what someone was shown, what they chose, and the version it belongs to.</p>'}</header><form class="workspace-finder" action="${e(basePath)}" method="get" role="search"><label for="workspace-query">Find a record</label><div><input id="workspace-query" type="search" name="q" maxlength="256" value="${e(query)}" placeholder="Person, version, purpose or reference" aria-describedby="workspace-search-scope"><button class="button" type="submit">Search records <span aria-hidden="true">→</span></button></div><p id="workspace-search-scope">Search your available record areas. Source files are inspected separately.</p></form>${searchResult}${searching?'':`<section aria-labelledby="workspace-jobs"><div class="workspace-jobs-heading"><h2 id="workspace-jobs">Start here</h2><p>Choose the record you need to review.</p></div><div class="workspace-jobs">${primary.map(job).join('')}</div>${moreJobs}${grant.areas.length?'':'<p>No record areas are available for this request.</p>'}</section>`}${setupPath&&grant.allowSetup?`<aside class="workspace-configure"><div><h2>Add or change a pack</h2><p>Prepare a local draft for your site. Your stored records stay here.</p></div><a class="button" href="${e(setupPath)}">Open setup <span aria-hidden="true">→</span></a></aside>`:''}${recordingPath&&grant.allowRecordingInspection?`<aside class="workspace-configure"><div><h2>Check recording setup</h2><p>See which notices the backend currently selects.</p></div><a class="button" href="${e(recordingPath)}">Inspect selections <span aria-hidden="true">→</span></a></aside>`:''}<p class="footnote">Stored history helps you inspect events. It does not establish current permission, installation status or legal compliance.</p></div>`;
  const nonce=crypto.randomUUID().replaceAll('-','');headers.set('Content-Type','text/html; charset=utf-8');headers.set('Content-Security-Policy',headers.get('Content-Security-Policy')!.replace("default-src 'none';",`default-src 'none'; style-src 'nonce-${nonce}';`));
  return reply(renderWorkspaceShell(body,{...presentation,basePath,title:searching?'Find records':'Workspace overview',scopeLabel:grant.scopeLabel??'Host-authorized records',nonce},'','workspace-overview-page'),200);
 }};
}
