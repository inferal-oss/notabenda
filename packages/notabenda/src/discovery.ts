/** @requirements REQ-PRODUCT-DISCOVERY REQ-AU-PIXELS */
import {toPublicConfig} from './config.js';
import type {PublicSiteConfig,RequirementId} from './types.js';
import {normalizeDiscoveryCapture,cleanOrigin} from './discovery-capture.js';
import type {DiscoveryCapture,DiscoveryStorageType} from './discovery-capture.js';
export {captureDiscovery,normalizeDiscoveryCapture} from './discovery-capture.js';
export type {DiscoveryAccess,DiscoveryStorageType,DiscoveryCapture,DiscoveryEnvironment} from './discovery-capture.js';
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
