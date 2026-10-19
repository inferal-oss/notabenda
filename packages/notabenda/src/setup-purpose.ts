/** @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-CONFIG REQ-PRODUCT-SCOPE-GUARDS REQ-PRODUCT-SERVICE-CATALOG */
import {assertPlainCatalogData} from './catalog-plain.js';
import {toPublicConfig} from './config.js';
import {createStarterConfig} from './starter.js';
import type {Purpose,SiteConfig} from './types.js';

export type PurposeDraftChange = {action:'add';purpose:Purpose}|{action:'update';previous:Purpose;purpose:Purpose}|{action:'remove';previous:Purpose};
export interface PurposeDraftPlan {config:SiteConfig;action:PurposeDraftChange['action'];purposeId:string}
const invalid=():never=>{throw Error('Use a complete, bounded purpose with a stable lowercase ID, public processing facts and explicit collection source/requirement. Unresolved text must remain a draft placeholder.');};
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,fields:string[])=>fields.length===Object.keys(value).length&&fields.every(key=>Object.hasOwn(value,key));
const text=(value:unknown,max=4000):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
const canonical=(value:unknown):string=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical((value as Record<string,unknown>)[key])).join(',')+'}';

/** Closed purpose input. The normal public config validator additionally checks production readiness. */
export function normalizeDraftPurpose(input:unknown):Purpose {
 try{assertPlainCatalogData(input);}catch{return invalid();}
 if(!object(input)||!exact(input,['id','name','description','legalBasis','dataCategories','retention','collection'])||!text(input.id,120)||!/^[a-z][a-z0-9-]*$/u.test(input.id)||!text(input.name,300)||!text(input.description)||!text(input.legalBasis)||!text(input.retention)||!Array.isArray(input.dataCategories)||!input.dataCategories.length||input.dataCategories.length>64||input.dataCategories.some(value=>!text(value,300))||new Set(input.dataCategories).size!==input.dataCategories.length||!object(input.collection)||!exact(input.collection,['source','description','required','consequences'])||!['direct','indirect','both'].includes(input.collection.source as string)||typeof input.collection.source!=='string'||!text(input.collection.description)||typeof input.collection.required!=='boolean'||!text(input.collection.consequences))return invalid();
 const starter=createStarterConfig();starter.purposes=[input as unknown as Purpose];
 return toPublicConfig(starter,{mode:'preview'}).purposes[0]!;
}

/** Explicit detached inventory edit. Never changes scope versions, restrictions, integrations or service links. */
export function createPurposeDraftPlan(input:unknown,change:PurposeDraftChange):PurposeDraftPlan {
 try{assertPlainCatalogData(change);}catch{return invalid();}
 if(!object(change)||!['add','update','remove'].includes(change.action)||!exact(change,change.action==='add'?['action','purpose']:change.action==='update'?['action','previous','purpose']:['action','previous']))return invalid();
 const config=toPublicConfig(input,{mode:'preview'});
 let purposeId:string;
 if(change.action==='add'){
  const purpose=normalizeDraftPurpose(change.purpose);purposeId=purpose.id;
  if(config.purposes.length>=256)throw Error('Keep at most 256 purposes in a setup draft.');
  if(config.purposes.some(p=>p.id===purpose.id))throw Error('That purpose ID is already declared. Edit it or choose a unique ID.');
  config.purposes.push(purpose);
 }else{
  if(!object(change.previous)||typeof change.previous.id!=='string')return invalid();
  const index=config.purposes.findIndex(p=>p.id===change.previous.id);
  if(index<0||canonical(config.purposes[index])!==canonical(change.previous))throw Error('Purpose facts changed. Reopen the purpose before saving or removing it.');
  // Compare against the already validated public config. A valid imported purpose may
  // contain repeated categories that the authoring form should let the operator correct.
  const previous=config.purposes[index]!;purposeId=previous.id;
  if(change.action==='remove'){
   if(config.services.some(s=>s.purposeIds.includes(previous.id))||config.consent?.purposes.some(p=>p.id===previous.id)||config.scopeGuards?.purposes?.some(p=>p.id===previous.id))throw Error('This purpose is still referenced by a service, consent scope or scope restriction. Review those links separately before removing it.');
   config.purposes.splice(index,1);
  }else{
   const purpose=normalizeDraftPurpose(change.purpose);
   if(purpose.id!==previous.id)throw Error('Keep the stable purpose ID when editing. A replacement identity needs an explicit new purpose and link review.');
   if(canonical(purpose)===canonical(previous))throw Error('No purpose facts changed. Change a field or cancel the edit.');
   config.purposes[index]=purpose;
  }
 }
 for(const document of Object.values(config.documents))document.review.status='draft';
 return {config:toPublicConfig(config,{mode:'preview'}),action:change.action,purposeId};
}
