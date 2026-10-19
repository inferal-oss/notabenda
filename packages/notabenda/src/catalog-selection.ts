/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SETUP */
import {normalizeServiceCatalog,createCatalogServiceDraft} from './catalog.js';
import type {ServiceCatalog} from './catalog.js';
import {assertPlainCatalogData} from './catalog-plain.js';
import {toPublicConfig,validateSiteConfig} from './config.js';
import {createStarterConfig} from './starter.js';
import type {Purpose,Service,SiteConfig} from './types.js';
export interface CatalogSelectionInput {productId:string;serviceId:string;purposeIds:string[];provider:string;location:string;privacyUrl?:string;justification:string;confirmed:true;reviewedPurposes?:Purpose[]}
/** Private, operator-declared review. A pin is provenance, not independently verified provider facts. */
export interface CatalogServiceSelection {schemaVersion:1;kind:'catalog-service-selection';reference:ServiceCatalog;service:Service;purposes:Purpose[];justification:string;review:'operator-confirmed'}
const fail=():never=>{throw Error('Review the catalog product, unique local service ID, declared purposes, actual provider/location and private justification before adding a draft service.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const note=(v:unknown):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=4000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(v);
const canonical=(value:unknown):string=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical((value as Record<string,unknown>)[key])).join(',')+'}';

export function normalizeCatalogServiceSelection(input:unknown):CatalogServiceSelection {
 assertPlainCatalogData(input);
 if(!object(input)||!keys(input,['schemaVersion','kind','reference','service','purposes','justification','review'])||input.schemaVersion!==1||input.kind!=='catalog-service-selection'||input.review!=='operator-confirmed'||!note(input.justification)||!object(input.service)||!Array.isArray(input.purposes))return fail();
 const service=input.service;
 if(!keys(service,['id','name','provider','purposeIds','location'],['privacyUrl']))return fail();
 const reference=normalizeServiceCatalog(input.reference);
 if(reference.products.length!==1||reference.providers.length!==1||reference.products[0]!.identifiers.length||reference.products[0]!.storageHints.length)return fail();
 const proposed=createCatalogServiceDraft(reference,reference.products[0]!.id,{id:service.id as string,purposeIds:service.purposeIds as string[],location:service.location as string,provider:service.provider as string,...(service.privacyUrl===undefined?{}:{privacyUrl:service.privacyUrl as string})}).service;
 if(canonical(service)!==canonical(proposed))return fail();
 const purposeConfig=createStarterConfig();purposeConfig.purposes=input.purposes as Purpose[];purposeConfig.services=[proposed];
 const purposes=toPublicConfig(purposeConfig,{mode:'preview'}).purposes;
 if(canonical(input.purposes)!==canonical(purposes)||canonical(purposes.map(p=>p.id))!==canonical(proposed.purposeIds))return fail();
 const result:CatalogServiceSelection={schemaVersion:1,kind:'catalog-service-selection',reference,service:proposed,purposes,justification:input.justification.trim(),review:'operator-confirmed'};
 if(new TextEncoder().encode(JSON.stringify(result)).length>128*1024)return fail();
 return result;
}

/** Explicit local draft change. Existing storage, consent scopes and restrictions stay intact. */
export function createCatalogSelectionPlan(input:unknown,catalog:unknown,selection:CatalogSelectionInput):{config:SiteConfig;selection:CatalogServiceSelection} {
 assertPlainCatalogData(selection);
 if(!object(selection)||!keys(selection,['productId','serviceId','purposeIds','provider','location','justification','confirmed'],['privacyUrl','reviewedPurposes'])||selection.confirmed!==true||!note(selection.justification)||typeof selection.provider!=='string'||!selection.provider.trim())return fail();
 const config=toPublicConfig(input,{mode:'preview'}),draft=createCatalogServiceDraft(catalog,selection.productId,{id:selection.serviceId,purposeIds:selection.purposeIds,provider:selection.provider,location:selection.location,...(selection.privacyUrl===undefined?{}:{privacyUrl:selection.privacyUrl})});
 if(config.services.some(s=>s.id===draft.service.id)||!draft.service.purposeIds.every(id=>config.purposes.some(p=>p.id===id)))return fail();
 // Retain only reference metadata used during selection, not detector rules or unselected cookie hints.
 const {product,provider,sources,catalogId,catalogRevision}=draft.catalogSelection;
 const reference:ServiceCatalog={schemaVersion:1,kind:'notabenda-service-catalog',id:catalogId,revision:catalogRevision,sources,providers:[provider],products:[{...product,identifiers:[],storageHints:[]}]};
 const purposes=draft.service.purposeIds.map(id=>config.purposes.find(p=>p.id===id)!);
 if(selection.reviewedPurposes!==undefined&&canonical(selection.reviewedPurposes)!==canonical(purposes))throw Error('Purpose facts changed. Reopen the service review and confirm the current purposes before adding it.');
 const record=normalizeCatalogServiceSelection({schemaVersion:1,kind:'catalog-service-selection',reference,service:draft.service,purposes,justification:selection.justification,review:'operator-confirmed'});
 config.services.push(structuredClone(record.service));for(const doc of Object.values(config.documents))doc.review.status='draft';
 if(!validateSiteConfig(config,{mode:'preview'}).valid)return fail();
 return {config,selection:record};
}

/** Validate private report pins against exactly matching local service facts. Never apply a report as config. */
export function normalizeSetupCatalogSelections(input:unknown,config:unknown):CatalogServiceSelection[] {
 assertPlainCatalogData(input);
 if(!Array.isArray(input)||input.length>32)throw Error('Keep at most 32 catalog selections in one private setup report.');
 const publicConfig=toPublicConfig(config,{mode:'preview'}),records=input.map(normalizeCatalogServiceSelection),ids=new Set<string>();
 for(const record of records){if(ids.has(record.service.id)||canonical(record.purposes)!==canonical(record.service.purposeIds.map(id=>publicConfig.purposes.find(p=>p.id===id)))||!publicConfig.services.some(service=>{const {id,name,provider,purposeIds,location,privacyUrl}=service;return canonical({id,name,provider,purposeIds,location,...(privacyUrl===undefined?{}:{privacyUrl})})===canonical(record.service);}))throw Error('Catalog notes need the matching draft config and reviewed purpose facts. Import it separately, or remove stale selection notes before review.');ids.add(record.service.id);}
 return records;
}
export function readSetupCatalogSelections(input:unknown):CatalogServiceSelection[] {
 assertPlainCatalogData(input);
 if(!object(input)||input.kind!=='private-setup-report'||input.catalogSelections===undefined)return [];
 if(!Array.isArray(input.catalogSelections)||input.catalogSelections.length>32)throw Error('Invalid private catalog selections.');
 return input.catalogSelections.map(normalizeCatalogServiceSelection);
}
