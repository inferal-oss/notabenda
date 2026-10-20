// @requirements REQ-PRODUCT-STORAGE-AUTHORING REQ-PRODUCT-CONFIG REQ-PRODUCT-STORAGE-CLEANUP REQ-PRODUCT-SCOPE-GUARDS
import {assertPlainCatalogData} from './catalog-plain.js';
import {toPublicConfig} from './config.js';
import {technologyCollectionScope} from './technology-collection-policy.js';
import type {TechnologyCollectionSettings} from './technology-collection-policy.js';
import type {SiteConfig,StorageItem} from './types.js';
export type StorageDraftItem=Pick<StorageItem,'id'|'name'|'type'|'serviceId'|'duration'>&({classification:'necessary';necessityReason:string}|{classification:'optional';necessityReason?:string});
export type StorageInventoryChange={action:'add';item:StorageDraftItem}|{action:'update';storageId:string;item:StorageDraftItem}|{action:'remove';storageId:string};
export interface StorageServiceScope {id:string;scope:string;technology?:TechnologyCollectionSettings}
export interface StorageDraftInput {schemaVersion:1;changes:StorageInventoryChange[];serviceScopes:StorageServiceScope[]}
export interface StorageDraftChange {baseline:unknown;changes:StorageInventoryChange[];serviceScopes:StorageServiceScope[]}
export interface StorageDraftPlan {
 config:SiteConfig;
 changes:{action:StorageInventoryChange['action'];storageId:string;previous?:StorageItem;item?:StorageItem}[];
 affectedServiceIds:string[];
 scopeChanges:{serviceId:string;previous:string;next:string}[];
 technologyBindings:{serviceId:string;scope:string;settings:TechnologyCollectionSettings}[];
 reviewItems:string[];
}
const invalid=():never=>{throw Error('Supply complete public storage declarations and explicit affected service versions. Keep storage values, identifiers, tokens and private assessments outside these settings.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const text=(v:unknown,max=2000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(v);
const slug=(v:unknown):v is string=>text(v,120)&&/^[a-z][a-z0-9-]*$/u.test(v);
const scope=(v:unknown):v is string=>text(v,200)&&v===v.trim()&&!/\{\{|\}\}/u.test(v);
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
/** Ordinary inventory facts only. Assessed exceptions need their complete separate profile review. */
export function normalizeDraftStorage(input:unknown):StorageDraftItem {
 try{assertPlainCatalogData(input);}catch{return invalid();}
 if(!object(input)||!exact(input,['id','name','type','serviceId','duration','classification'],['necessityReason'])||!slug(input.id)||!text(input.name,300)||!slug(input.serviceId)||!text(input.duration)||!['cookie','localStorage','sessionStorage','indexedDB','other'].includes(input.type as string)||!['necessary','optional'].includes(input.classification as string)||input.classification==='necessary'&&!text(input.necessityReason)||input.necessityReason!==undefined&&!text(input.necessityReason))return invalid();
 return structuredClone(input) as unknown as StorageDraftItem;
}
/** Versioned complete batch; normalization performs no file, browser or network work. */
export async function normalizeStorageDraftInput(input:unknown):Promise<StorageDraftInput> {
 try{assertPlainCatalogData(input);}catch{return invalid();}
 input=structuredClone(input);
 if(!object(input)||!exact(input,['schemaVersion','changes','serviceScopes'])||input.schemaVersion!==1||!Array.isArray(input.changes)||!input.changes.length||input.changes.length>32||!Array.isArray(input.serviceScopes)||input.serviceScopes.length>64||new TextEncoder().encode(JSON.stringify(input)).length>128*1024)return invalid();
 const ids=new Set<string>(),changes:StorageInventoryChange[]=[];
 for(const change of input.changes){
  if(!object(change)||!['add','update','remove'].includes(change.action as string)||!exact(change,change.action==='add'?['action','item']:change.action==='update'?['action','storageId','item']:['action','storageId']))return invalid();
  const item=change.action==='remove'?undefined:normalizeDraftStorage(change.item),id=change.action==='add'?item!.id:change.storageId;
  if(!slug(id)||ids.has(id)||item&&item.id!==id)return invalid();ids.add(id);
  changes.push(change.action==='add'?{action:'add',item:item!}:change.action==='update'?{action:'update',storageId:id,item:item!}:{action:'remove',storageId:id});
 }
 const owners=new Set<string>(),serviceScopes:StorageServiceScope[]=[];
 for(const item of input.serviceScopes){
  if(!object(item)||!exact(item,['id','scope'],['technology'])||!slug(item.id)||owners.has(item.id)||!scope(item.scope))return invalid();owners.add(item.id);
  if(item.technology!==undefined){let derived:string;try{derived=await technologyCollectionScope(item.technology as TechnologyCollectionSettings);}catch{return invalid();}if(!object(item.technology)||item.technology.serviceId!==item.id||derived!==item.scope)throw Error('Supply the complete revised technology declaration and its matching derived service scope.');}
  serviceScopes.push(structuredClone(item) as unknown as StorageServiceScope);
 }
 return {schemaVersion:1,changes,serviceScopes};
}
/** Inventory and explicit material versions commit together to a detached local draft. */
export async function createStorageDraftPlan(input:unknown,change:StorageDraftChange):Promise<StorageDraftPlan> {
 try{assertPlainCatalogData(input);assertPlainCatalogData(change);}catch{return invalid();}
 change=structuredClone(change);
 if(!object(change)||!exact(change,['baseline','changes','serviceScopes']))return invalid();
 const config=toPublicConfig(input,{mode:'preview'}),baseline=toPublicConfig(change.baseline,{mode:'preview'});
 if(canonical(config)!==canonical(baseline))throw Error('The site draft changed. Reopen storage authoring before saving.');
 const proposal=await normalizeStorageDraftInput({schemaVersion:1,changes:change.changes,serviceScopes:change.serviceScopes}),owners=new Set<string>(),protectedOwners=new Set(config.storageExceptions?.entries.flatMap(entry=>entry.serviceIds)??[]),changes:StorageDraftPlan['changes']=[];
 for(const mutation of proposal.changes){
  const id=mutation.action==='add'?mutation.item.id:mutation.storageId,index=config.storage.findIndex(item=>item.id===id),previous=index<0?undefined:config.storage[index],item=mutation.action==='remove'?undefined:mutation.item;
  if(mutation.action==='add'&&previous)throw Error('That storage ID is already declared. Edit it or choose a unique ID.');
  if(mutation.action!=='add'&&!previous)throw Error('Choose an existing storage ID.');
  if(previous?.classification==='exception'||previous&&protectedOwners.has(previous.serviceId)||item&&protectedOwners.has(item.serviceId))throw Error('Storage owned by an assessed-exception profile needs a complete separate profile review. This editor cannot reclassify it or change its service membership.');
  if(item&&!config.services.some(service=>service.id===item.serviceId))throw Error('Reference an actual declared service. Storage authoring does not create or enroll services.');
  if(previous&&item&&canonical(previous)===canonical(item))throw Error('No storage facts changed. Change a field or cancel the edit.');
  if(previous)owners.add(previous.serviceId);if(item)owners.add(item.serviceId);
  changes.push({action:mutation.action,storageId:id,...(previous?{previous:structuredClone(previous)}:{}),...(item?{item:structuredClone(item)}:{})});
  if(mutation.action==='add')config.storage.push(item!);else if(item)config.storage[index]=item;else config.storage.splice(index,1);
 }
 if(config.storage.length>512)throw Error('Keep at most 512 declared storage items in this setup draft.');
 const enrolled=config.consent?.services.filter(service=>owners.has(service.id))??[],expected=new Set(enrolled.map(service=>service.id));
 if(proposal.serviceScopes.length!==expected.size||proposal.serviceScopes.some(item=>!expected.has(item.id)))throw Error('Supply one fresh material service version for every affected consent-managed old/new owner, and no unrelated version. Enrollment and purpose versions stay unchanged.');
 const technologyBindings:StorageDraftPlan['technologyBindings']=[],scopeChanges:StorageDraftPlan['scopeChanges']=[];
 for(const replacement of proposal.serviceScopes){
  const service=enrolled.find(item=>item.id===replacement.id)!;
  if(replacement.scope===service.scope)throw Error('Use a fresh, never-reused material service version for changed storage facts. Only the supplied current version can be checked here.');
  const bound=service.scope.startsWith('technology-v1:')||replacement.scope.startsWith('technology-v1:');
  if(bound&&!replacement.technology||!bound&&replacement.technology)throw Error('A technology-bound service needs the complete revised declaration and its derived technology scope; do not replace that binding with a generic version.');
  if(replacement.technology)technologyBindings.push({serviceId:replacement.id,scope:replacement.scope,settings:structuredClone(replacement.technology)});
  scopeChanges.push({serviceId:service.id,previous:service.scope,next:replacement.scope});service.scope=replacement.scope;
 }
 for(const document of Object.values(config.documents))document.review.status='draft';
 const checked=toPublicConfig(config,{mode:'preview'});
 if(new TextEncoder().encode(JSON.stringify(checked,null,2)+'\n').length>512*1024)throw Error('Keep the resulting setup config within the 512 KiB import limit.');
 assertStorageDraftBaseline(input,baseline);
 const reviewItems=[
  'Review actual names, types, owners, duration and classification. A necessary-storage reason is a public assertion, not proof of an exemption; private questionnaire notes and catalog hints do not qualify it.',
  'Changing storage and material service versions does not configure a loader, set or remove browser data, grant permission or publish a notice. Review the revised disclosures and actual runtime before deployment.',
  'Updates/removals retain the previous declaration in this plan for host migration review. Stop old producers and handle historical markers/cleanup targets separately; removal from inventory does not remove stored data.',
  ...(checked.storage.some(item=>item.classification==='optional'&&!checked.consent)?['Optional storage is declared without consent controls. Configure the actual owner enrollment and lifetimes separately before integration.']:[]),
  ...(technologyBindings.length?['Retain the supplied revised technology declarations, compile the release with their derived scopes and rebuild matching technology descriptors. This draft does not publish or render those descriptors.']:[]),
 ];
 for(const item of checked.storage){if(checked.storage.some(other=>other.id!==item.id&&other.type===item.type&&other.name===item.name))reviewItems.push('Cleanup ambiguity: '+item.id+' shares a declared type/name with another item. Review real ownership/scopes; declarations alone do not establish that these are the same stored item.');if(['indexedDB','other'].includes(item.type))reviewItems.push(item.id+': inventory disclosure is supported; the built-in exact storage cleanup adapter does not handle this type.');}
 return {config:checked,changes,affectedServiceIds:[...owners].sort(),scopeChanges,technologyBindings,reviewItems:[...new Set(reviewItems)]};
}

/** Recheck the host's current value immediately before adopting an asynchronously prepared plan. */
export function assertStorageDraftBaseline(current:unknown,baseline:unknown):void {
 try{assertPlainCatalogData(current);assertPlainCatalogData(baseline);}catch{return invalid();}
 if(canonical(toPublicConfig(current,{mode:'preview'}))!==canonical(toPublicConfig(baseline,{mode:'preview'})))throw Error('The site draft changed. Reopen storage authoring before saving.');
}
export type StorageDraftReviewStep=Omit<StorageDraftPlan,'config'>&{siteId:string};
export function storageDraftReviewStep(plan:StorageDraftPlan):StorageDraftReviewStep {
 const {config,...review}=plan;return structuredClone({siteId:config.site.id,...review});
}
/** A bounded cumulative local review, separate from public config and setup answers. */
export function serializeStorageDraftReview(steps:readonly StorageDraftReviewStep[]):string {
 try{assertPlainCatalogData(steps);}catch{return invalid();}
 if(steps.length>128)throw Error('Export the storage-change review and begin a new setup session before adding more than 128 changes.');
 const text=JSON.stringify({schemaVersion:1,kind:'private-storage-change-review',steps},null,2)+'\n';
 if(new TextEncoder().encode(text).length>512*1024)throw Error('Export the storage-change review and begin a new setup session before the review exceeds 512 KiB.');
 return text;
}
