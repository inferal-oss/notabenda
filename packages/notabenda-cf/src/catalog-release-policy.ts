/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-CF-HISTORY */
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeServiceCatalog} from './catalog-reference.js';
import type {ServiceCatalog} from './catalog-reference.js';
export interface CatalogReviewService {id:string;name:string;provider:string;purposeIds:string[];location:string;privacyUrl?:string}
export interface CatalogReviewPurpose {id:string;name:string;description:string;legalBasis:string;dataCategories:string[];retention:string;collection:{source:'direct'|'indirect'|'both';description:string;required:boolean;consequences:string}}
export interface CatalogReleaseSelection {reference:ServiceCatalog;service:CatalogReviewService;purposes:CatalogReviewPurpose[];review:'operator-confirmed'}
/** Selected references and public site-use facts only. Private reasons and questionnaire history are excluded. */
export interface CatalogReleaseReview {schemaVersion:1;kind:'catalog-release-review';selections:CatalogReleaseSelection[]}
export interface CatalogReviewDescriptor {schemaVersion:1;sha256:string;selectionCount:number}
export const MAX_CATALOG_REVIEW_BYTES=48*1024;
const fail=():never=>{throw Error('Invalid release catalog review. Supply current selected reference and site-use facts without private notes.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[],optional:string[]=[])=>keys.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>keys.includes(k)||optional.includes(k));
const text=(v:unknown,max=4000):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(v);
const prose=(v:unknown):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=16384;
const proseList=(v:unknown):v is string[]=>Array.isArray(v)&&v.length>0&&v.every(prose);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const strings=(v:unknown,max=40):v is string[]=>Array.isArray(v)&&v.length>0&&v.length<=max&&v.every(x=>text(x,300))&&new Set(v).size===v.length;
const https=(v:unknown)=>{try{const u=new URL(String(v));return text(v,2048)&&u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export const catalogReviewCanonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(catalogReviewCanonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+catalogReviewCanonical((v as Record<string,unknown>)[k])).join(',')+'}';
/** Pure, detached validation against the final public release, independent of the seed or draft authoring. */
export function normalizeCatalogReleaseReview(input:unknown,publicConfig:unknown):CatalogReleaseReview {
 assertPlainCatalogData(input);
 if(!object(publicConfig))return fail();
 const descriptors=Object.getOwnPropertyDescriptors(publicConfig),services=descriptors.services,purposes=descriptors.purposes;
 if(!services||!purposes||!('value' in services)||!('value' in purposes))return fail();
 publicConfig={services:services.value,purposes:purposes.value};assertPlainCatalogData(publicConfig);
 if(new TextEncoder().encode(JSON.stringify(input)).length>MAX_CATALOG_REVIEW_BYTES||!object(input)||!exact(input,['schemaVersion','kind','selections'])||input.schemaVersion!==1||input.kind!=='catalog-release-review'||!Array.isArray(input.selections)||input.selections.length<1||input.selections.length>32||!object(publicConfig)||!Array.isArray(publicConfig.services)||!Array.isArray(publicConfig.purposes))return fail();
 const ids=new Set<string>();
 for(const raw of input.selections){
  if(!object(raw)||!exact(raw,['reference','service','purposes','review'])||raw.review!=='operator-confirmed'||!object(raw.service)||!Array.isArray(raw.purposes))return fail();
  const service=raw.service;
  if(!exact(service,['id','name','provider','purposeIds','location'],['privacyUrl'])||!slug(service.id)||ids.has(service.id)||!prose(service.name)||!text(service.provider,300)||!text(service.location)||!strings(service.purposeIds)||!service.purposeIds.every(slug)||service.privacyUrl!==undefined&&!https(service.privacyUrl))return fail();ids.add(service.id);
  const reference=normalizeServiceCatalog(raw.reference),product=reference.products[0],provider=reference.providers[0];
  if(reference.products.length!==1||reference.providers.length!==1||!product||!provider||product.identifiers.length||product.storageHints.length||product.providerId!==provider.id||reference.sources.some(source=>![...product.sourceIds,...provider.sourceIds].includes(source.id)))return fail();
  const current=publicConfig.services.filter(s=>object(s)&&s.id===service.id);
  if(current.length!==1||!object(current[0]))return fail();
  const projection=Object.fromEntries(['id','name','provider','purposeIds','location','privacyUrl'].filter(k=>Object.hasOwn(current[0],k)).map(k=>[k,current[0][k]]));
  if(catalogReviewCanonical(service)!==catalogReviewCanonical(projection)||raw.purposes.length!==service.purposeIds.length)return fail();
  for(const [index,purpose] of raw.purposes.entries()){
   if(!object(purpose)||!exact(purpose,['id','name','description','legalBasis','dataCategories','retention','collection'])||purpose.id!==service.purposeIds[index]||!['name','description','legalBasis','retention'].every(k=>prose(purpose[k]))||!proseList(purpose.dataCategories)||!object(purpose.collection)||!exact(purpose.collection,['source','description','required','consequences'])||typeof purpose.collection.source!=='string'||!['direct','indirect','both'].includes(purpose.collection.source)||typeof purpose.collection.required!=='boolean'||!prose(purpose.collection.description)||!prose(purpose.collection.consequences))return fail();
   const matches=publicConfig.purposes.filter(p=>object(p)&&p.id===purpose.id);if(matches.length!==1||catalogReviewCanonical(matches[0])!==catalogReviewCanonical(purpose))return fail();
  }
 }
 return JSON.parse(JSON.stringify(input)) as CatalogReleaseReview;
}
export function normalizeCatalogReviewDescriptor(input:unknown):CatalogReviewDescriptor {
 assertPlainCatalogData(input);
 if(!object(input)||!exact(input,['schemaVersion','sha256','selectionCount'])||input.schemaVersion!==1||typeof input.sha256!=='string'||! /^[a-f0-9]{64}$/u.test(input.sha256)||!Number.isInteger(input.selectionCount)||Number(input.selectionCount)<1||Number(input.selectionCount)>32)return fail();
 return {schemaVersion:1,sha256:input.sha256,selectionCount:Number(input.selectionCount)};
}
