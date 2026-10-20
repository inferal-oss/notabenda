// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING REQ-PRODUCT-RIGHTS-CENTER REQ-PRODUCT-CONFIG
import {assertPlainCatalogData} from './catalog-plain.js';
import {toPublicConfig} from './config.js';
import {selectRightsMessages} from './rights-localization-policy.js';
import {normalizeRightsCenter} from './rights-policy.js';
import type {RightsCenterConfig} from './rights-policy.js';
import type {SiteConfig} from './types.js';

export type RightsDraftSettings=Omit<RightsCenterConfig,'reviewStatus'>;
export interface RightsDraftInput {schemaVersion:1;settings:RightsDraftSettings;linkPrivacyToPage:true}
export interface RightsDraftChange {baseline:unknown;settings:RightsDraftSettings;linkPrivacyToPage:true}
export interface RightsDraftPlan {config:SiteConfig;action:'add'|'update';privacyLink:{from:string|undefined;to:string};reviewItems:string[]}
const invalid=():never=>{throw Error('Supply complete public request-page wording, actual destinations/contact and an explicit linkPrivacyToPage: true decision. Keep request contents and private assessments outside these settings.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
/** Complete public authoring input; review status is deliberately not an authoring option. */
export function normalizeRightsDraftSettings(input:unknown):RightsDraftSettings {
 try{assertPlainCatalogData(input);}catch{return invalid();}
 if(!object(input)||!exact(input,['schemaVersion','revision','route','title','intro','contact','actions','nextSteps']))return invalid();
 let result:RightsCenterConfig;try{result=normalizeRightsCenter({...input,reviewStatus:'draft'});}catch{return invalid();}
 const {reviewStatus,...settings}=result;return settings;
}
/** Versioned JSON file shape used by the local wizard; this reads no file itself. */
export function normalizeRightsDraftInput(input:unknown):RightsDraftInput {
 try{assertPlainCatalogData(input);}catch{return invalid();}
 if(!object(input)||!exact(input,['schemaVersion','settings','linkPrivacyToPage'])||input.schemaVersion!==1||input.linkPrivacyToPage!==true)return invalid();
 return {schemaVersion:1,settings:normalizeRightsDraftSettings(input.settings),linkPrivacyToPage:true};
}
/** A detached local edit, bound to the entire reviewed public baseline. No navigation, intake or deployment. */
export function createRightsDraftPlan(input:unknown,change:RightsDraftChange):RightsDraftPlan {
 try{assertPlainCatalogData(input);assertPlainCatalogData(change);}catch{return invalid();}
 if(!object(change)||!exact(change,['baseline','settings','linkPrivacyToPage'])||change.linkPrivacyToPage!==true)return invalid();
 const config=toPublicConfig(input,{mode:'preview'}),baseline=toPublicConfig(change.baseline,{mode:'preview'});
 if(canonical(config)!==canonical(baseline))throw Error('The site draft changed. Reopen the request-page editor before saving.');
 selectRightsMessages(config);
 const settings=normalizeRightsDraftSettings(change.settings),previous=config.rightsCenter;
 if(previous){
  const {reviewStatus,...previousSettings}=previous;
  if(canonical(settings)===canonical(previousSettings))throw Error('No request-page settings changed. Change a field or cancel the edit.');
  if(settings.revision===previous.revision)throw Error('Use a new, never-reused request-page revision when changing public wording, routes or contact. Only the supplied current revision can be checked here.');
 }
 const from=config.privacy.rightsUrl;
 config.rightsCenter={...settings,reviewStatus:'draft'};
 config.privacy.rightsUrl=settings.route;
 for(const document of Object.values(config.documents))document.review.status='draft';
 const checked=toPublicConfig(config,{mode:'preview'});
 return {config:checked,action:previous?'update':'add',privacyLink:{from,to:settings.route},reviewItems:[
  'Review the public page, scope explanations, actual request destinations, public contact fallback and next steps. The draft supplies no entitlement or working intake/fulfillment process.',
  'The privacy link now uses the request-page route. Plan redirects or aliases for an older route separately; no former destination was copied into an action.',
  'Use a never-reused revision and review the affected legal pages. The editor compares only the supplied current baseline; historical uniqueness remains host work.',
  'Preview links are inert. Verify the real destinations while logged out or without a suitable account, using keyboard and narrow-screen layouts.',
 ]};
}
