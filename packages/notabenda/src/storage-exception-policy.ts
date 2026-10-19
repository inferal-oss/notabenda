// @requirements REQ-PRODUCT-STORAGE-EXCEPTIONS
// @requirements REQ-UK-EXCEPTIONS REQ-PRODUCT-CONFIG
import {isSafeLink} from './safe-links.js';
import {normalizeScopeGuardPolicy} from './scope-guard-policy.js';
import type {ScopeGuardPolicy} from './scope-guard-policy.js';
export interface StatisticalConditions {informationSocietyService:true;soleImprovementStatistics:true;aggregateNonIdentifyingResults:true;noIndividualDecisions:true;deleteIndividualDataAfterAggregation:true;noAutomaticallyEmittedSignals:true;thirdPartyUse:'none'|'processor-improvement-only';noOtherUseOrLinking:true}
export interface AppearanceConditions {informationSocietyService:true;soleAppearanceOrFunctionality:true;noBehaviouralContentSelection:true;onlyNecessaryPersonalData:true}
interface ExceptionEntry {id:string;revision:number;serviceIds:string[];purposeIds:string[];storageIds:string[];title:string;description:string;reviewStatus:'draft'|'reviewed'}
export type StorageExceptionEntry=ExceptionEntry&({profile:'uk-pecr-statistical';conditions:StatisticalConditions}|{profile:'uk-pecr-appearance';conditions:AppearanceConditions});
export interface StorageExceptionPolicy {schemaVersion:1;applicability:'host-assessed-uk-pecr';preferenceRetention:'until-cleared';preferenceNotice:string;information:{label:string;href:string};entries:StorageExceptionEntry[]}
export interface ExceptionInventory {site:{id:string};purposes:{id:string}[];services:{id:string;purposeIds:string[];processingActivities?:string[];googleBasic?:unknown}[];storage:{id:string;serviceId:string;classification:string;exceptionId?:string}[];consent?:{purposes:{id:string}[];services:{id:string}[]};scopeGuards?:ScopeGuardPolicy}
export const exceptionObject=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const exceptionExact=(v:unknown,keys:string[]):v is Record<string,unknown>=>exceptionObject(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export const exceptionSlug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
export const exceptionText=(v:unknown,max=2000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
export const exceptionRevision=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
export class StorageExceptionError extends Error {constructor(readonly code:'invalid-policy'|'invalid-descriptor'|'unavailable'|'revision-conflict'|'stale-definition'|'invalid-state'|'destroyed'|'invalid-service'|'busy'|'scope-restricted'){super(code);this.name='StorageExceptionError';}}
export const exceptionFail=(code:StorageExceptionError['code']):never=>{throw new StorageExceptionError(code);};
export function copyExceptionData(input:unknown):unknown {
 let count=0,bytes=0;const seen=new Set<object>();
 const textBudget=(value:string)=>{if(value.length>131072||(bytes+=new TextEncoder().encode(value).length)>131072)return exceptionFail('invalid-policy');};
 function copy(v:unknown,depth:number):unknown {
  if(++count>12000||depth>20)return exceptionFail('invalid-policy');
  if(typeof v==='string'){textBudget(v);return v;}
  if(v===null||typeof v==='boolean')return v;if(typeof v==='number'&&Number.isFinite(v))return v;
  if(!v||typeof v!=='object'||seen.has(v)||![Object.prototype,null,Array.prototype].includes(Object.getPrototypeOf(v)))return exceptionFail('invalid-policy');
  const keys=Reflect.ownKeys(v);if(keys.length>12001)return exceptionFail('invalid-policy');
  if(Array.isArray(v)&&(v.length>12000||keys.length!==v.length+1||keys.some(key=>key!=='length'&&(typeof key!=='string'||!/^(?:0|[1-9][0-9]*)$/u.test(key)||Number(key)>=v.length))))return exceptionFail('invalid-policy');
  seen.add(v);const d=Object.getOwnPropertyDescriptors(v),result=Array.isArray(v)?[]:{};
  for(const key of keys){if(Array.isArray(v)&&key==='length')continue;if(typeof key!=='string'||!d[key]!.enumerable||!('value' in d[key]!))return exceptionFail('invalid-policy');textBudget(key);Object.defineProperty(result,key,{value:copy(d[key]!.value,depth+1),enumerable:true,writable:true,configurable:true});}
  seen.delete(v);return result;
 }
 const result=copy(input,0);if(new TextEncoder().encode(JSON.stringify(result)).length>131072)return exceptionFail('invalid-policy');return result;
}
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.length>0&&v.length<=80&&v.every(exceptionSlug)&&new Set(v).size===v.length;
/** Qualifications are explicit host assertions. This validates their shape and scope, not their truth. */
export function normalizeStorageExceptionPolicy(input:unknown,inventory:ExceptionInventory,{allowPreview=false}={}):StorageExceptionPolicy {
 const p=copyExceptionData(input);if(!exceptionExact(p,['schemaVersion','applicability','preferenceRetention','preferenceNotice','information','entries'])||p.schemaVersion!==1||p.applicability!=='host-assessed-uk-pecr'||p.preferenceRetention!=='until-cleared'||!exceptionText(p.preferenceNotice)||!exceptionExact(p.information,['label','href'])||!exceptionText(p.information.label,200)||!exceptionText(p.information.href,2000)||!isSafeLink(p.information.href)||! /^(?:https:\/\/|\/(?!\/)|#)/u.test(p.information.href)||!Array.isArray(p.entries)||!p.entries.length||p.entries.length>32)return exceptionFail('invalid-policy');
 const ids=new Set<string>(),services=new Set<string>(),ownedPurposes=new Set<string>(),purposes=new Set(inventory.purposes.map(p=>p.id)),storage=new Set<string>();
 if(!inventory.scopeGuards)return exceptionFail('invalid-policy');normalizeScopeGuardPolicy(inventory.scopeGuards,[...purposes]);
 for(const e of p.entries){
  if(!exceptionExact(e,['id','revision','serviceIds','purposeIds','storageIds','title','description','reviewStatus','profile','conditions'])||!exceptionSlug(e.id)||ids.has(e.id)||!exceptionRevision(e.revision)||!strings(e.serviceIds)||!strings(e.purposeIds)||!strings(e.storageIds)||!exceptionText(e.title,200)||!exceptionText(e.description)||!['draft','reviewed'].includes(e.reviewStatus as string)||!allowPreview&&e.reviewStatus!=='reviewed')return exceptionFail('invalid-policy');ids.add(e.id);
  if(e.purposeIds.some(id=>ownedPurposes.has(id)||!purposes.has(id)||inventory.consent?.purposes.some(p=>p.id===id)))return exceptionFail('invalid-policy');
  e.purposeIds.forEach(id=>ownedPurposes.add(id));
  const conditions=e.conditions,keys=e.profile==='uk-pecr-statistical'?['informationSocietyService','soleImprovementStatistics','aggregateNonIdentifyingResults','noIndividualDecisions','deleteIndividualDataAfterAggregation','noAutomaticallyEmittedSignals','thirdPartyUse','noOtherUseOrLinking']:e.profile==='uk-pecr-appearance'?['informationSocietyService','soleAppearanceOrFunctionality','noBehaviouralContentSelection','onlyNecessaryPersonalData']:[];
  if(!keys.length||!exceptionExact(conditions,keys)||keys.some(k=>k==='thirdPartyUse'?!['none','processor-improvement-only'].includes(conditions[k] as string):conditions[k]!==true))return exceptionFail('invalid-policy');
  const boundPurposes=new Set<string>();for(const id of e.serviceIds){const service=inventory.services.find(s=>s.id===id);if(!service||services.has(id)||inventory.consent?.services.some(s=>s.id===id)||service.googleBasic!==undefined||!Array.isArray(service.processingActivities)||service.processingActivities.length||!service.purposeIds.length||service.purposeIds.some(p=>!(e.purposeIds as string[]).includes(p)))return exceptionFail('invalid-policy');services.add(id);service.purposeIds.forEach(id=>boundPurposes.add(id));}
  if(e.purposeIds.some(id=>!boundPurposes.has(id)))return exceptionFail('invalid-policy');
  for(const id of e.storageIds){const item=inventory.storage.find(s=>s.id===id);if(!item||storage.has(id)||!e.serviceIds.includes(item.serviceId)||item.classification!=='exception'||item.exceptionId!==e.id)return exceptionFail('invalid-policy');storage.add(id);}
  if(inventory.storage.some(s=>(e.serviceIds as string[]).includes(s.serviceId)&&(!(e.storageIds as string[]).includes(s.id)||s.classification!=='exception'||s.exceptionId!==e.id)))return exceptionFail('invalid-policy');
 }
 if(inventory.storage.some(s=>s.classification==='exception'&&!storage.has(s.id)))return exceptionFail('invalid-policy');return p as unknown as StorageExceptionPolicy;
}
