// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
import {normalizeProcessingLocalization} from './processing-localization-policy.js';
import type {ProcessingLocalization} from './processing-localization-policy.js';
import type {ProcessingActivity} from './types.js';
export const processingActivities:readonly ProcessingActivity[]=['sale','sharing','targeted-advertising'];
export interface ProcessingNotice {
  schemaVersion:1|2;noticeId:string;localization?:ProcessingLocalization;siteId:string;scopeId:string;artifactId:string;mode:'preview'|'production';activities:ProcessingActivity[];
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
/** Snapshot JSON data without invoking accessors or toJSON methods. */
export function processingCopy(input:unknown,max=32768):unknown {
 let nodes=0;const active=new Set<object>(),invalid=():never=>{throw Error('Invalid or oversized processing data.');};
 function copy(value:unknown,depth:number):unknown {
  if(++nodes>10000||depth>32)return invalid();
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='string')return value.length<=max?value:invalid();
  if(typeof value==='number')return Number.isFinite(value)?value:invalid();
  if(!value||typeof value!=='object'||active.has(value))return invalid();
  const array=Array.isArray(value);if(!array&&![Object.prototype,null].includes(Object.getPrototypeOf(value)))return invalid();
  const fields=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(value);
  if(keys.some(k=>typeof k!=='string'||!Object.hasOwn(fields[k]!,'value')||k!=='length'&&!fields[k]!.enumerable))return invalid();
  active.add(value);let result:unknown;
  if(array){if(value.length>10000||keys.length!==value.length+1||!Array.from({length:value.length},(_,i)=>Object.hasOwn(fields,String(i))).every(Boolean))return invalid();result=Array.from({length:value.length},(_,i)=>copy(fields[String(i)]!.value,depth+1));}
  else result=Object.fromEntries((keys as string[]).map(k=>[k,copy(fields[k]!.value,depth+1)]));
  active.delete(value);return result;
 }
 const result=copy(input,0);if(new TextEncoder().encode(JSON.stringify(result)).length>max)return invalid();return result;
}
export function processingServiceScope(services:{id:string;processingActivities?:ProcessingActivity[]}[]):ProcessingNotice['services'] {
  if(services.some(s=>!s.processingActivities))throw new Error('Explicitly classify every service for processing choices.');
  return services.map(s=>({id:s.id,activities:[...s.processingActivities!].sort()})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}

/** @requirements REQ-PRODUCT-PROCESSING-CHOICES Immutable wording and privacy reference; no identity or publication claim. */
export function normalizeProcessingNotice(input:unknown,options:{allowPreview?:boolean}={}):ProcessingNotice {
  const n=processingCopy(input);const invalid=():never=>{throw new Error('Invalid processing-choice notice.');};
  if(!processingObject(n)||!processingExact(n,['schemaVersion','noticeId','siteId','scopeId','artifactId','mode','activities','services','wording','document',...(n.schemaVersion===2?['localization']:[])])||![1,2].includes(Number(n.schemaVersion))||typeof n.schemaVersion!=='number'||!processingHash(n.noticeId)||!processingHash(n.artifactId)||!slug(n.siteId)||!slug(n.scopeId)||!['production','preview'].includes(String(n.mode))||typeof n.mode!=='string'||!validProcessingActivities(n.activities)||!Array.isArray(n.services)||n.services.length>80||n.services.some(s=>!processingObject(s)||!processingExact(s,['id','activities'])||!slug(s.id)||!validProcessingActivities(s.activities,true))||new Set(n.services.map(s=>(s as Record<string,unknown>).id)).size!==n.services.length)return invalid();
  if(!processingObject(n.wording)||!processingExact(n.wording,['title','description','actionLabel'])||!text(n.wording.title,300)||!text(n.wording.description,2000)||!text(n.wording.actionLabel,120))return invalid();
  if(n.schemaVersion===2)n.localization=normalizeProcessingLocalization(n.localization,{allowPreview:options.allowPreview===true});
  const d=n.document;
  if(!processingObject(d)||!processingExact(d,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus'])||!text(d.title,300)||!text(d.version,200)||d.url!==`/artifacts/${n.artifactId}/privacy.html`||!processingHash(d.sha256)||!processingHash(d.contentSha256)||typeof d.reviewStatus!=='string'||!['reviewed','draft'].includes(d.reviewStatus)||typeof d.effectiveDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate)||!Number.isFinite(Date.parse(d.effectiveDate))||new Date(d.effectiveDate).toISOString().slice(0,10)!==d.effectiveDate)return invalid();
  if(!options.allowPreview&&(n.mode!=='production'||d.reviewStatus!=='reviewed'))throw new Error('Processing choices require a reviewed production privacy notice; preview must be explicit.');
  return n as unknown as ProcessingNotice;
}
