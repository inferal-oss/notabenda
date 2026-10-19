import type {ProcessingActivity} from './types.js';
export const processingActivities:readonly ProcessingActivity[]=['sale','sharing','targeted-advertising'];
export interface ProcessingNotice {
  schemaVersion:1;noticeId:string;siteId:string;scopeId:string;artifactId:string;mode:'preview'|'production';activities:ProcessingActivity[];
  services:{id:string;activities:ProcessingActivity[]}[];
  wording:{title:string;description:string;actionLabel:string};
  document:{title:string;url:string;version:string;effectiveDate:string;sha256:string;contentSha256:string;reviewStatus:'draft'|'reviewed'};
}
export interface ProcessingRequest {schemaVersion:1;noticeId:string;requestId:string;activities:ProcessingActivity[]}
export type ProcessingProvenance='explicit-opt-out'|'gpc-header'|'browser-report'|'trusted-application';
export interface ProcessingReceipt {
  schemaVersion:1;id:string;siteId:string;scopeId:string;streamRef:string;revision:number;noticeId:string;artifactId:string;requestId:string;
  activities:ProcessingActivity[];restrictions:ProcessingActivity[];recordedAt:string;provenance:ProcessingProvenance;
}
export interface ProcessingHead {schemaVersion:1;siteId:string;scopeId:string;streamRef:string;revision:number;event:ProcessingReceipt|null}
export interface ProcessingResult {receipt:ProcessingReceipt;head:ProcessingHead}
export const processingHash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
export function processingObject(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
export function processingExact(v:Record<string,unknown>,keys:string[]):boolean{return Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
export function validProcessingActivities(value:unknown,empty=false):value is ProcessingActivity[]{return Array.isArray(value)&&(empty||value.length>0)&&value.length<=3&&new Set(value).size===value.length&&value.every(v=>processingActivities.includes(v));}
function text(v:unknown,max:number):v is string{return typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);}
export function processingCopy(input:unknown,max=32768):unknown {const raw=JSON.stringify(input);if(new TextEncoder().encode(raw).length>max)throw new Error('Processing value exceeds its size limit.');return JSON.parse(raw);}
export function processingServiceScope(services:{id:string;processingActivities?:ProcessingActivity[]}[]):ProcessingNotice['services'] {
  if(services.some(s=>!s.processingActivities))throw new Error('Explicitly classify every service for processing choices.');
  return services.map(s=>({id:s.id,activities:[...s.processingActivities!].sort()})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}

/** @requirements REQ-PRODUCT-PROCESSING-CHOICES Immutable wording and privacy reference; no identity or publication claim. */
export function normalizeProcessingNotice(input:unknown,options:{allowPreview?:boolean}={}):ProcessingNotice {
  const n=processingCopy(input);const invalid=():never=>{throw new Error('Invalid processing-choice notice.');};
  if(!processingObject(n)||!processingExact(n,['schemaVersion','noticeId','siteId','scopeId','artifactId','mode','activities','services','wording','document'])||n.schemaVersion!==1||!processingHash(n.noticeId)||!processingHash(n.artifactId)||!slug(n.siteId)||!slug(n.scopeId)||!['production','preview'].includes(String(n.mode))||typeof n.mode!=='string'||!validProcessingActivities(n.activities)||!Array.isArray(n.services)||n.services.length>80||n.services.some(s=>!processingObject(s)||!processingExact(s,['id','activities'])||!slug(s.id)||!validProcessingActivities(s.activities,true))||new Set(n.services.map(s=>(s as Record<string,unknown>).id)).size!==n.services.length)return invalid();
  if(!processingObject(n.wording)||!processingExact(n.wording,['title','description','actionLabel'])||!text(n.wording.title,300)||!text(n.wording.description,2000)||!text(n.wording.actionLabel,120))return invalid();
  const d=n.document;
  if(!processingObject(d)||!processingExact(d,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus'])||!text(d.title,300)||!text(d.version,200)||d.url!==`/artifacts/${n.artifactId}/privacy.html`||!processingHash(d.sha256)||!processingHash(d.contentSha256)||typeof d.reviewStatus!=='string'||!['reviewed','draft'].includes(d.reviewStatus)||typeof d.effectiveDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate)||!Number.isFinite(Date.parse(d.effectiveDate))||new Date(d.effectiveDate).toISOString().slice(0,10)!==d.effectiveDate)return invalid();
  if(!options.allowPreview&&(n.mode!=='production'||d.reviewStatus!=='reviewed'))throw new Error('Processing choices require a reviewed production privacy notice; preview must be explicit.');
  return n as unknown as ProcessingNotice;
}
