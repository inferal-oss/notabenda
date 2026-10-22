// @requirements REQ-PRODUCT-PUBLICATION-INSPECTION REQ-PRODUCT-CF-ADMIN
import {normalizeRecord} from './records.js';
export interface PublishedDocumentSource {
 /** Fixed host-owned origin. Never derive it from query parameters or submitted configuration. */
 origin:string;
 /** Explain the actual reader, for example Public website or Website asset binding. */
 label:string;
 fetch(request:Request):Promise<Response>;
 /** Local development only; permits HTTP on literal loopback hostnames. */
 allowHttpLoopback?:boolean;
}
export interface PublishedDocumentReference {path:string;sha256:string}
export interface PublicationCheckOptions extends PublishedDocumentSource {timeoutMs?:number;maxBytes?:number;signal?:AbortSignal}
export type PublicationFailure='timeout'|'aborted'|'transport'|'http-status'|'not-html'|'too-large'|'work-limit'|'invalid-response';
export interface PublicationCheck {
 schemaVersion:1;status:'matched'|'different'|'missing'|'unavailable';checkedAt:string;
 source:{origin:string;label:string};url:string;expectedSha256:string;
 actualSha256?:string;bytes?:number;httpStatus?:number;reason?:PublicationFailure;
}
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
/** Internal shared validation also captures grant configuration before any asynchronous reads. */
export function normalizePublicationSource(input:PublishedDocumentSource):PublishedDocumentSource {
 if(!input||typeof input.origin!=='string'||input.origin.length>2048||typeof input.label!=='string'||!input.label.trim()||input.label.length>120||/[\u0000-\u001f\u007f]/u.test(input.label)||typeof input.fetch!=='function'||input.allowHttpLoopback!==undefined&&typeof input.allowHttpLoopback!=='boolean')throw Error('Use a fixed publication origin, reader label and fetch callback.');
 const url=new URL(input.origin),local=input.allowHttpLoopback===true&&url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||url.origin!==input.origin.replace(/\/$/u,'')||url.protocol!=='https:'&&!local)throw Error('Use an HTTPS origin without credentials, path, query or fragment.');
 return {origin:url.origin,label:input.label,fetch:input.fetch,...(local?{allowHttpLoopback:true}:{})};
}
/** Compare bounded HTML bytes from an explicitly supplied host reader. No credentials or redirects. */
export async function checkDocumentPublication(reference:PublishedDocumentReference,options:PublicationCheckOptions):Promise<PublicationCheck> {
 const raw=normalizeRecord({id:'document',data:reference},1024).data as Record<string,unknown>;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==2||!hash(raw.sha256)||typeof raw.path!=='string'||!/^\/artifacts\/[a-f0-9]{64}\/(?:privacy|cookies|terms)\.html$/u.test(raw.path))throw Error('Use an exact retained legal-document path and SHA-256.');
 const source=normalizePublicationSource(options),timeout=options.timeoutMs??5000,maxBytes=options.maxBytes??256*1024,external=options.signal;
 if(!Number.isInteger(timeout)||timeout<1||timeout>30000||!Number.isInteger(maxBytes)||maxBytes<1||maxBytes>1024*1024||external!==undefined&&!(external instanceof AbortSignal))throw Error('Use bounded publication-check limits and an optional AbortSignal.');
 const url=source.origin+raw.path,expectedSha256=raw.sha256,abort=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,timer:ReturnType<typeof setTimeout>|undefined,reason:PublicationFailure='transport';
 const result=(status:PublicationCheck['status'],extra:Partial<PublicationCheck>={}):PublicationCheck=>({schemaVersion:1,status,checkedAt:new Date().toISOString(),source:{origin:source.origin,label:source.label},url,expectedSha256,...extra});
 const cancel=()=>{if(reader)void reader.cancel().catch(()=>{});};
 let interrupted:(value:PublicationCheck)=>void=()=>{};
 const stopped=new Promise<PublicationCheck>(resolve=>{interrupted=resolve;});
 const stop=(why:PublicationFailure)=>{if(abort.signal.aborted)return;reason=why;abort.abort();cancel();interrupted(result('unavailable',{reason:why}));};
 const externalStop=()=>stop('aborted');
 if(external?.aborted)return result('unavailable',{reason:'aborted'});
 external?.addEventListener('abort',externalStop,{once:true});
 timer=setTimeout(()=>stop('timeout'),timeout);
 const read=async():Promise<PublicationCheck>=>{
  try{
   const request=new Request(url,{method:'GET',redirect:'manual',credentials:'omit',referrerPolicy:'no-referrer',signal:abort.signal,headers:{Accept:'text/html','Cache-Control':'no-cache'}});
   const response=await source.fetch(request);
   if(!(response instanceof Response))return result('unavailable',{reason:'invalid-response'});
   if(abort.signal.aborted){void response.body?.cancel().catch(()=>{});return result('unavailable',{reason});}
   const httpStatus=response.status;
   const reject=(status:PublicationCheck['status'],failure?:PublicationFailure)=>{void response.body?.cancel().catch(()=>{});return result(status,{httpStatus,...(failure?{reason:failure}:{})});};
   if(httpStatus===404||httpStatus===410)return reject('missing');
   if(httpStatus!==200||response.redirected)return reject('unavailable','http-status');
   if(!/^text\/html(?:\s*;|\s*$)/iu.test(response.headers.get('Content-Type')??''))return reject('unavailable','not-html');
   if(!response.body)return reject('unavailable','invalid-response');
   reader=response.body.getReader();const chunks:Uint8Array[]=[];let bytes=0,reads=0;
   while(true){
    // Count every read, including empty chunks. Yield tasks so an immediately
    // available stream cannot starve cancellation/deadline timers.
    if(reads===16384){cancel();return result('unavailable',{httpStatus,reason:'work-limit'});}
    if(reads>0&&reads%64===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
    if(abort.signal.aborted)return result('unavailable',{reason});
    reads++;const part=await reader.read();
    if(abort.signal.aborted)return result('unavailable',{reason});
    if(part.done)break;
    if(!(part.value instanceof Uint8Array)){cancel();return result('unavailable',{reason:'invalid-response'});}
    bytes+=part.value.byteLength;
    if(bytes>maxBytes){cancel();return result('unavailable',{httpStatus,reason:'too-large'});}
    if(part.value.byteLength>0)chunks.push(part.value.slice());
   }
   const body=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
   const actualSha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',body))].map(n=>n.toString(16).padStart(2,'0')).join('');
   if(abort.signal.aborted)return result('unavailable',{reason});
   return result(actualSha256===expectedSha256?'matched':'different',{httpStatus,bytes,actualSha256});
  }catch{cancel();return result('unavailable',{reason:abort.signal.aborted?reason:'transport'});}
  finally{try{reader?.releaseLock();}catch{}}
 };
 try{return await Promise.race([read(),stopped]);}
 finally{if(timer!==undefined)clearTimeout(timer);external?.removeEventListener('abort',externalStop);}
}
