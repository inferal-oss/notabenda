// @requirements REQ-PRODUCT-PUBLICATION-CHECK REQ-PRODUCT-RETAINED-RELEASES
// Operator-invoked Node tooling. Never expose its network authority as a public proxy.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {normalizePublicLegalArtifact} from './release-files.js';
import {canonicalJson} from './content.js';
import {normalizeCartridgeSelection,selectCartridges} from './cartridges.js';
import type {CartridgeSelection} from './cartridges.js';

export interface LegalPublicationOptions {
 origin:string;
 mode?:'production'|'preview';
 allowLoopback?:boolean;
 /** Overall deadline, 1–30,000 ms. Each request is also limited to 4,000 ms. */
 timeoutMs?:number;
 /** Requested context only; a matching release does not establish pack installation. */
 packs?:CartridgeSelection;
}
export type PublicationOutcome='matched'|'different'|'missing'|'denied'|'redirect'|'http-error'|'media-type'|'charset'|'download-only'|'too-large'|'invalid-body'|'timeout'|'network-error'|'not-requested-deadline';
export interface PublicationResourceCheck {
 kind:'artifact'|'privacy'|'cookies'|'terms';url:string;
 comparison:'canonical-artifact'|'bytes';expectedSha256:string;
 outcome:PublicationOutcome;status?:number;observedSha256?:string;
}
export interface LegalPublicationReport {
 schemaVersion:1;kind:'private-legal-publication-check';
 requirementIds:readonly ['REQ-PRODUCT-PUBLICATION-CHECK','REQ-PRODUCT-RETAINED-RELEASES'];
 checker:{name:string;version:string;protocolVersion:1};
 startedAt:string;finishedAt:string;origin:string;configuredOrigin:string;originMatchesConfigured:boolean;
 validationMode:'production'|'preview';
 release:{artifactId:string;configSha256:string;siteId:string;mode:'production'|'preview'};
 requestedPacks:CartridgeSelection;checks:PublicationResourceCheck[];retainedFilesMatched:boolean;unverified:string[];
 boundaries:{anonymousRequests:true;followsRedirects:false;executesScripts:false;changesSite:false;establishesPackInstallation:false;establishesLegalCompliance:false};
}
const LIMIT=128*1024;
const digest=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const badOptions=():never=>{throw Error('Use an explicit origin-only HTTPS URL, optional preview mode, explicit loopback permission, a bounded timeout and installed pack revisions.');};
function checkedOptions(input:LegalPublicationOptions){
 if(!input||typeof input!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(input)))return badOptions();
 if(!Object.hasOwn(input,'origin'))return badOptions();
 const allowed=['origin','mode','allowLoopback','timeoutMs','packs'];
 for(const key of Reflect.ownKeys(input)){if(typeof key!=='string'||!allowed.includes(key))return badOptions();const d=Object.getOwnPropertyDescriptor(input,key)!;if(!d.enumerable||!Object.hasOwn(d,'value'))return badOptions();}
 input=Object.assign(Object.create(null),input) as LegalPublicationOptions;
 if(typeof input.origin!=='string'||input.origin.length>2048||!/^https?:\/\/[^\s/?#@]+\/?$/u.test(input.origin)||input.mode!==undefined&&!['production','preview'].includes(input.mode)||input.allowLoopback!==undefined&&typeof input.allowLoopback!=='boolean'||input.timeoutMs!==undefined&&(!Number.isInteger(input.timeoutMs)||input.timeoutMs<1||input.timeoutMs>30000))return badOptions();
 let url:URL;try{url=new URL(input.origin);}catch{return badOptions();}
 const host=url.hostname.replace(/\.+$/u,''),loopback=host==='localhost'||/^127(?:\.\d{1,3}){3}$/u.test(host)||host==='[::1]'||/^\[::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}\]$/u.test(host);
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||loopback&&!input.allowLoopback||url.protocol!=='https:'&&!(url.protocol==='http:'&&loopback&&input.allowLoopback))return badOptions();
 return {origin:url.origin,mode:input.mode??'production',timeoutMs:input.timeoutMs??15000,packs:normalizeCartridgeSelection(input.packs??selectCartridges([]))};
}
function mediaParameters(header:string){
 const parts:string[]=[];let start=0,quoted=false,escaped=false;
 for(let i=0;i<header.length;i++){const c=header[i];if(escaped){escaped=false;continue;}if(c==='\\'&&quoted){escaped=true;continue;}if(c==='"'){if(!quoted&&!/^\s*[!#$%&'*+\-.^_`|~0-9A-Za-z]+\s*=\s*$/u.test(header.slice(start,i)))return undefined;quoted=!quoted;}else if(c===';'&&!quoted){parts.push(header.slice(start,i).trim());start=i+1;}}
 if(quoted||escaped)return undefined;parts.push(header.slice(start).trim());return parts;
}
function abortable<T>(work:Promise<T>,signal:AbortSignal):Promise<T>{
 return new Promise((resolve,reject)=>{
  const abort=()=>{reject(new Error('Request ended.'));};
  if(signal.aborted){work.catch(()=>{});abort();return;}
  signal.addEventListener('abort',abort,{once:true});
  work.then(value=>{signal.removeEventListener('abort',abort);resolve(value);},()=>{signal.removeEventListener('abort',abort);reject(new Error('Request failed.'));});
 });
}
async function bodyBytes(response:Response,signal:AbortSignal):Promise<Uint8Array|undefined>{
 const declared=response.headers.get('content-length');if(declared!==null&&/^\d+$/u.test(declared)&&Number(declared)>LIMIT){void response.body?.cancel().catch(()=>{});return undefined;}
 if(!response.body)return new Uint8Array();
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let length=0;
 const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
 try{
  while(true){const next=await abortable(reader.read(),signal);if(next.done)break;length+=next.value.length;if(length>LIMIT){cancel();return undefined;}chunks.push(next.value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
 }finally{signal.removeEventListener('abort',cancel);reader.releaseLock();}
}
/** Four anonymous GETs of locally constructed pinned paths. No redirects, scripts, crawling or writes. */
export async function checkLegalPublication(input:unknown,options:LegalPublicationOptions):Promise<LegalPublicationReport>{
 const selected=checkedOptions(options);
 let artifact;try{artifact=normalizePublicLegalArtifact(input,{mode:selected.mode});}catch{throw Error('Artifact input cannot be checked. Supply an intact public release supported by the 128 KiB retained-artifact validator; larger artifacts are unsupported. No deployment was inspected.');}
 const metadata=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')) as {name:string;version:string};
 const artifactText=canonicalJson(artifact),id=artifact.manifest.artifactId;
 const resources:PublicationResourceCheck[]=[{kind:'artifact',url:selected.origin+'/artifacts/'+id+'.json',comparison:'canonical-artifact',expectedSha256:digest(artifactText),outcome:'not-requested-deadline'},...(['privacy','cookies','terms'] as const).map(kind=>({kind,url:selected.origin+'/artifacts/'+id+'/'+kind+'.html',comparison:'bytes' as const,expectedSha256:artifact.manifest.documents.find(d=>d.kind===kind)!.sha256,outcome:'not-requested-deadline' as const}))];
 const startedAt=new Date().toISOString(),deadline=new AbortController(),deadlineTimer=setTimeout(()=>deadline.abort(),selected.timeoutMs);
 try{
  for(const check of resources){
   if(deadline.signal.aborted)continue;
   const request=new AbortController(),timer=setTimeout(()=>request.abort(),4000),signal=AbortSignal.any([deadline.signal,request.signal]);let response:Response|undefined;
   try{
    response=await abortable(fetch(check.url,{method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{accept:check.kind==='artifact'?'application/json':'text/html'},signal}),signal);check.status=response.status;
    if(response.status>=300&&response.status<400){check.outcome='redirect';continue;}
    if(response.status===404||response.status===410){check.outcome='missing';continue;}
    if(response.status===401||response.status===403){check.outcome='denied';continue;}
    if(response.status!==200){check.outcome='http-error';continue;}
    const media=mediaParameters(response.headers.get('content-type')??'');
    if(media?.[0]?.toLowerCase()!==(check.kind==='artifact'?'application/json':'text/html')){check.outcome='media-type';continue;}
    const charsets=media.slice(1).filter(p=>/^charset(?:\s|=|$)/iu.test(p));
    if(charsets.length>1||charsets.length===1&&!/^charset\s*=\s*(?:utf-8|utf8|"utf-8"|"utf8")$/iu.test(charsets[0]!)){check.outcome='charset';continue;}
    const disposition=response.headers.get('content-disposition')?.split(';')[0]?.trim().toLowerCase();
    if(disposition&&disposition!=='inline'){check.outcome='download-only';continue;}
    const bytes=await bodyBytes(response,signal);if(signal.aborted)throw Error();if(bytes===undefined){check.outcome='too-large';continue;}
    if(check.kind==='artifact'){
     try{const remote=normalizePublicLegalArtifact(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),{mode:selected.mode});check.observedSha256=digest(canonicalJson(remote));}catch{check.outcome='invalid-body';continue;}
    }else check.observedSha256=digest(bytes);
    check.outcome=check.observedSha256===check.expectedSha256?'matched':'different';
   }catch{check.outcome=signal.aborted?'timeout':'network-error';}
   finally{clearTimeout(timer);request.abort();if(response?.body&&!response.body.locked)void response.body.cancel().catch(()=>{});}
  }
 }finally{clearTimeout(deadlineTimer);deadline.abort();}
 const configuredOrigin=new URL(artifact.publicConfig.site.url).origin;
 return {schemaVersion:1 as const,kind:'private-legal-publication-check' as const,requirementIds:['REQ-PRODUCT-PUBLICATION-CHECK','REQ-PRODUCT-RETAINED-RELEASES'],validationMode:selected.mode,checker:{name:metadata.name,version:metadata.version,protocolVersion:1},startedAt,finishedAt:new Date().toISOString(),origin:selected.origin,configuredOrigin,originMatchesConfigured:selected.origin===configuredOrigin,release:{artifactId:id,configSha256:artifact.manifest.configSha256,siteId:artifact.manifest.siteId,mode:artifact.manifest.mode},requestedPacks:selected.packs,checks:resources,retainedFilesMatched:resources.every(check=>check.outcome==='matched'),unverified:['Active notice and offer bindings','Current framework document routes','Service gating, withdrawal and browser storage','Evidence recording, identity and operator authorization','Legal applicability and review','Future retention and an atomic deployment snapshot'],boundaries:{anonymousRequests:true,followsRedirects:false,executesScripts:false,changesSite:false,establishesPackInstallation:false,establishesLegalCompliance:false}};
}
