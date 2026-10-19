/** @requirements REQ-PRODUCT-DISCOVERY REQ-AU-PIXELS */
import {toPublicConfig} from './config.js';
import type {PublicSiteConfig,RequirementId} from './types.js';
export type DiscoveryAccess='available'|'limited'|'unavailable';
export type DiscoveryStorageType='cookie'|'localStorage'|'sessionStorage';
const initiators=['script','css','img','link','fetch','xmlhttprequest','iframe','beacon','other','audio','video','object','embed','navigation','early-hints'] as const;
const referenceKinds=['script','image','frame','media','object','stylesheet','preload','modulepreload','prefetch','preconnect','dns-prefetch','prerender'] as const;
export interface DiscoveryCapture {
 schemaVersion:1;kind:'browser-discovery-capture';capturedAt:string;pageOrigin:string;routeLabel:string;scenario:string;
 coverage:{resources:DiscoveryAccess;dom:DiscoveryAccess;cookies:DiscoveryAccess;localStorage:DiscoveryAccess;sessionStorage:DiscoveryAccess};
 network:{origin:string;initiator:typeof initiators[number];count:number}[];
 references:{origin:string;kind:typeof referenceKinds[number];count:number}[];
 storage:{type:DiscoveryStorageType;name:string}[];
 omitted:{nonHttpReferences:number;oversizedNames:number};
}
export interface DiscoveryEnvironment {
 document:Document;
 performance?:Pick<Performance,'getEntriesByType'>;
 localStorage?:()=>Pick<Storage,'length'|'key'>;
 sessionStorage?:()=>Pick<Storage,'length'|'key'>;
 cookies?:()=>string;
}
const encoder=new TextEncoder();
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max&&encoder.encode(v).length<=max&&!/[\u0000-\u001f\u007f-\u009f]/u.test(v);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&Object.keys(v).every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(v,k)!,'value'));
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function origin(value:string,base?:string):string|undefined {try{const url=new URL(value,base);return ['https:','http:'].includes(url.protocol)?url.origin:undefined;}catch{return;}}
const cleanOrigin=(v:unknown):v is string=>text(v,512)&&origin(v)===v;
const access=(v:unknown):v is DiscoveryAccess=>typeof v==='string'&&['available','limited','unavailable'].includes(v);
function invalid():never{throw new Error('Use a bounded version-1 discovery capture with origins, declared types and names only.');}
export function normalizeDiscoveryCapture(input:unknown):DiscoveryCapture {
 if(!object(input)||!exact(input,['schemaVersion','kind','capturedAt','pageOrigin','routeLabel','scenario','coverage','network','references','storage','omitted'])||input.schemaVersion!==1||input.kind!=='browser-discovery-capture'||!text(input.capturedAt,24)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(input.capturedAt)||!Number.isFinite(Date.parse(input.capturedAt))||new Date(input.capturedAt).toISOString()!==input.capturedAt||!cleanOrigin(input.pageOrigin)||!text(input.routeLabel,120)||!input.routeLabel.trim()||!text(input.scenario,80)||!input.scenario.trim())return invalid();
 if(!object(input.coverage)||!exact(input.coverage,['resources','dom','cookies','localStorage','sessionStorage'])||!Object.values(input.coverage).every(access)||!object(input.omitted)||!exact(input.omitted,['nonHttpReferences','oversizedNames'])||Object.values(input.omitted).some(v=>!Number.isSafeInteger(v)||Number(v)<0||Number(v)>1_000_000))return invalid();
 for(const [key,type,values] of [['network','initiator',initiators],['references','kind',referenceKinds]] as const){
  const list=input[key];if(!Array.isArray(list)||list.length>500)return invalid();const seen=new Set<string>();
  for(const item of list){if(!object(item)||!exact(item,['origin',type,'count'])||!cleanOrigin(item.origin)||typeof item[type]!=='string'||!values.includes(item[type] as never)||!Number.isSafeInteger(item.count)||Number(item.count)<1||Number(item.count)>1_000_000)return invalid();const id=JSON.stringify([item.origin,item[type]]);if(seen.has(id))return invalid();seen.add(id);}
 }
 if(!Array.isArray(input.storage)||input.storage.length>600)return invalid();const seen=new Set<string>();
 for(const item of input.storage){if(!object(item)||!exact(item,['type','name'])||typeof item.type!=='string'||!['cookie','localStorage','sessionStorage'].includes(item.type)||!text(item.name,256)||!item.name)return invalid();const id=JSON.stringify([item.type,item.name]);if(seen.has(id))return invalid();seen.add(id);}
 // The fixed fields, bounded strings and arrays are now safe to serialize and detach.
 const json=JSON.stringify(input);if(encoder.encode(json).length>1024*1024)return invalid();return JSON.parse(json) as DiscoveryCapture;
}
function browserEnvironment(doc:Document):DiscoveryEnvironment {
 const view=doc.defaultView;
 return {document:doc,...(view?{performance:view.performance,localStorage:()=>view.localStorage,sessionStorage:()=>view.sessionStorage}:{}),cookies:()=>doc.cookie};
}
/** Explicit point-in-time capture. Reads names and origins; never headers, bodies, storage values or URL paths. */
export function captureDiscovery(labels:{routeLabel:string;scenario:string},environment?:DiscoveryEnvironment):DiscoveryCapture {
 if(!text(labels.routeLabel,120)||!labels.routeLabel.trim()||!text(labels.scenario,80)||!labels.scenario.trim())throw new Error('Supply short route and scenario labels without control characters.');
 const env=environment??(typeof document==='undefined'?undefined:browserEnvironment(document));
 if(!env)throw new Error('Discovery capture requires a browser document.');
 const doc=env.document,pageOrigin=origin(doc.URL);if(!pageOrigin)throw new Error('Discovery requires an HTTP or HTTPS document.');
 const result:DiscoveryCapture={schemaVersion:1,kind:'browser-discovery-capture',capturedAt:new Date().toISOString(),pageOrigin,routeLabel:labels.routeLabel,scenario:labels.scenario,coverage:{resources:'unavailable',dom:'unavailable',cookies:'unavailable',localStorage:'unavailable',sessionStorage:'unavailable'},network:[],references:[],storage:[],omitted:{nonHttpReferences:0,oversizedNames:0}};
 const network=new Map<string,DiscoveryCapture['network'][number]>(),references=new Map<string,DiscoveryCapture['references'][number]>();
 function add(target:typeof network|typeof references,url:string,type:string):void {
  const resolved=origin(url,doc.baseURI);if(!resolved){result.omitted.nonHttpReferences++;return;}
  if(!text(resolved,512)){result.omitted.nonHttpReferences++;return;}
  const id=JSON.stringify([resolved,type]),item=target.get(id);if(item){item.count++;return;}
  if(target.size>=500){result.coverage[target===network?'resources':'dom']='limited';return;}
  target.set(id,(target===network?{origin:resolved,initiator:type,count:1}:{origin:resolved,kind:type,count:1}) as never);
 }
 try{
  if(env.performance){const entries=env.performance.getEntriesByType('resource');result.coverage.resources=entries.length>2000?'limited':'available';
   for(const entry of entries.slice(0,2000)){const type=(entry as PerformanceResourceTiming).initiatorType;add(network,entry.name,initiators.includes(type as never)?type:'other');}}
 }catch{result.coverage.resources='unavailable';network.clear();}
 try{
  result.coverage.dom='available';const walker=doc.createTreeWalker(doc.documentElement,1);let node:Node|null=doc.documentElement,visited=0;
  while(node&&visited++<5000){const element=node as Element,tag=element.localName;
   const attribute=tag==='object'?'data':'src';
   const kinds:Record<string,typeof referenceKinds[number]>={script:'script',img:'image',iframe:'frame',audio:'media',video:'media',source:'media',embed:'object',object:'object'};
   if(kinds[tag]){const value=element.getAttribute(attribute);if(value)add(references,value,kinds[tag]);if(tag==='img'){const current=(element as HTMLImageElement).currentSrc;if(current&&origin(current,doc.baseURI)!==(value?origin(value,doc.baseURI):undefined))add(references,current,'image');}if(tag==='video'){const poster=element.getAttribute('poster');if(poster)add(references,poster,'image');}}
   if(tag==='link')for(const rel of (element.getAttribute('rel')??'').toLowerCase().split(/\s+/u)){if(['stylesheet','preload','modulepreload','prefetch','preconnect','dns-prefetch','prerender'].includes(rel)){const href=element.getAttribute('href');if(href)add(references,href,rel);}}
   node=walker.nextNode();
  }
  if(node)result.coverage.dom='limited';
 }catch{result.coverage.dom='unavailable';references.clear();}
 const names=new Set<string>();
 function addName(type:DiscoveryStorageType,name:string):void {
  if(!name||!text(name,256)){result.omitted.oversizedNames++;result.coverage[type==='cookie'?'cookies':type]='limited';return;}
  const id=JSON.stringify([type,name]);if(!names.has(id)){result.storage.push({type,name});names.add(id);}
 }
 for(const type of ['localStorage','sessionStorage'] as const){try{const storage=env[type]?.();if(storage){const length=storage.length;if(!Number.isSafeInteger(length)||length<0)throw new Error();result.coverage[type]=length>200?'limited':'available';for(let i=0;i<Math.min(200,length);i++){const name=storage.key(i);if(name!==null)addName(type,name);}}}catch{result.coverage[type]='unavailable';result.storage=result.storage.filter(item=>item.type!==type);}}
 try{if(env.cookies){const cookies=env.cookies();if(typeof cookies!=='string')throw new Error();if(cookies.length>65536)result.coverage.cookies='limited';else{const parts=cookies?cookies.split(';'):[];result.coverage.cookies=parts.length>200?'limited':'available';for(const part of parts.slice(0,200)){const equals=part.indexOf('=');if(equals>0)addName('cookie',part.slice(0,equals).trim());}}}}catch{result.coverage.cookies='unavailable';result.storage=result.storage.filter(item=>item.type!=='cookie');}
 result.network=[...network.values()];result.references=[...references.values()];
 return normalizeDiscoveryCapture(result);
}
export interface DiscoveryFinding {
 kind:'network'|'reference'|'storage';label:string;origin?:string;storageType?:DiscoveryStorageType;count:number;scenario:string;routeLabel:string;
 relation:'same-origin'|'cross-origin'|'storage';candidateServiceIds:string[];candidatePurposeIds:string[];mapping:'origin-candidate'|'exact-name-candidate'|'unmapped';
 requirementIds:RequirementId[];
}
export interface DiscoveryReport {schemaVersion:1;kind:'discovery-review';siteId:string;configuredOrigin:string;observedOrigin:string;captureCount:number;captures:DiscoveryCapture[];findings:DiscoveryFinding[];unmappedCount:number;reviewNotes:string[]}
/** Compare explicit observations to declared origins and exact storage names. No legal/purpose/vendor inference. */
export function analyzeDiscovery(input:unknown,captures:readonly unknown[],options:{captureOrigin?:string}={}):DiscoveryReport {
 const config:PublicSiteConfig=toPublicConfig(input,{mode:'preview'});
 if(!Array.isArray(captures)||!captures.length||captures.length>20)throw new Error('Supply between 1 and 20 discovery captures.');
 const normalized=captures.map(normalizeDiscoveryCapture),findings:DiscoveryFinding[]=[];
 const declaredOrigin=new URL(config.site.url).origin,observedOrigin=options.captureOrigin===undefined?declaredOrigin:options.captureOrigin;
 if(!cleanOrigin(observedOrigin))throw new Error('Supply a clean explicit capture origin.');
 for(const capture of normalized){
  if(capture.pageOrigin!==observedOrigin)throw new Error('Capture origin does not match the selected observation origin.');
  const base={scenario:capture.scenario,routeLabel:capture.routeLabel,requirementIds:['REQ-PRODUCT-DISCOVERY','REQ-AU-PIXELS'] as RequirementId[]};
  for(const [kind,items] of [['network',capture.network],['reference',capture.references]] as const)for(const item of items){
   const candidates=config.services.filter(s=>s.resourceOrigins?.some(value=>(value==='self'?observedOrigin:value)===item.origin));
   findings.push({...base,kind,label:'initiator' in item?item.initiator:item.kind,origin:item.origin,count:item.count,relation:item.origin===capture.pageOrigin?'same-origin':'cross-origin',candidateServiceIds:candidates.map(s=>s.id),candidatePurposeIds:[...new Set(candidates.flatMap(s=>s.purposeIds))],mapping:candidates.length?'origin-candidate':'unmapped'});
  }
  for(const item of capture.storage){const declared=config.storage.filter(s=>s.type===item.type&&s.name===item.name),ids=[...new Set(declared.map(s=>s.serviceId))],purposes=[...new Set(config.services.filter(s=>ids.includes(s.id)).flatMap(s=>s.purposeIds))];
   findings.push({...base,kind:'storage',label:item.name,storageType:item.type,count:1,relation:'storage',candidateServiceIds:ids,candidatePurposeIds:purposes,mapping:ids.length?'exact-name-candidate':'unmapped'});
  }
 }
 return {schemaVersion:1,kind:'discovery-review',siteId:config.site.id,configuredOrigin:declaredOrigin,observedOrigin,captureCount:normalized.length,captures:normalized,findings,unmappedCount:findings.filter(f=>f.mapping==='unmapped').length,reviewNotes:[
  ...(observedOrigin===declaredOrigin?[]:['An explicit capture-origin override is active. These observations are from '+observedOrigin+', not the configured deployment '+declaredOrigin+'.']),
  'Observations and operator labels are unverified. Candidate mappings do not establish ownership, purpose, necessity, exemption or permission.',
  'Resource Timing is a current buffered timeline, not a complete network log. Counts can include cache/aborted fetches and overlap across captures; a scenario label does not isolate its requests.',
  'Only this document and accessible storage names are inspected. HttpOnly/partitioned/other-path cookies, frame internals, IndexedDB, caches, workers and server-side activity are outside coverage.',
  'No URLs beyond origins, storage values, headers or bodies are included. Origins, names and operator labels may still be sensitive; review files before sharing.',
  'Unavailable, limited or empty observations never prove absence of tracking. Use fresh contexts and a network inspector to verify each lifecycle scenario.',
  'No configuration is changed, legal score assigned, CI workflow required or data uploaded.',
 ]};
}
