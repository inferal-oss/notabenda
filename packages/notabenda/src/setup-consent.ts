// @requirements REQ-PRODUCT-CONSENT-AUTHORING REQ-PRODUCT-CONFIG REQ-PRODUCT-SCOPE-GUARDS
import {assertPlainCatalogData} from './catalog-plain.js';
import {toPublicConfig} from './config.js';
import {scopeGuardBlocked} from './scope-guard-policy.js';
import type {ConsentConfig,SiteConfig} from './types.js';

export type ConsentDraftSettings=Pick<ConsentConfig,'purposes'|'services'|'grantLifetimeDays'|'refusalLifetimeDays'|'dismissalMinutes'>;
export interface ConsentDraftChange {baseline:unknown;settings:ConsentDraftSettings}
export interface ConsentDraftPlan {config:SiteConfig;action:'add'|'update';blockedPurposeIds:string[];reviewItems:string[]}
const invalid=():never=>{throw Error('Choose declared services, their complete purpose scope, explicit material versions and separate grant, refusal and dismissal lifetimes.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';

/** Explicit local settings edit, bound to the public config that the operator reviewed. */
export function createConsentDraftPlan(input:unknown,change:ConsentDraftChange):ConsentDraftPlan {
 try{assertPlainCatalogData(input);assertPlainCatalogData(change);}catch{return invalid();}
 if(!object(change)||!exact(change,['baseline','settings'])||!object(change.settings)||!exact(change.settings,['purposes','services','grantLifetimeDays','refusalLifetimeDays','dismissalMinutes']))return invalid();
 const config=toPublicConfig(input,{mode:'preview'}),baseline=toPublicConfig(change.baseline,{mode:'preview'});
 if(canonical(config)!==canonical(baseline))throw Error('The site draft changed. Reopen cookie control settings before saving.');
 const settings=change.settings;
 for(const [key,max] of [['purposes',40],['services',80]] as const){
  const items=settings[key];if(!Array.isArray(items)||!items.length||items.length>max)return invalid();
  const ids=new Set<string>();for(const item of items){if(!object(item)||!exact(item,['id','scope'])||typeof item.id!=='string'||ids.has(item.id)||typeof item.scope!=='string'||!item.scope.trim()||item.scope!==item.scope.trim()||item.scope.length>200||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]|\{\{|\}\}/u.test(item.scope))return invalid();ids.add(item.id);}
 }
 const required=new Set(settings.services.flatMap(item=>config.services.find(s=>s.id===item.id)?.purposeIds??[]));
 if(required.size!==settings.purposes.length||settings.purposes.some(p=>!required.has(p.id)))throw Error('Enroll every purpose used by the selected services, and no unrelated purpose.');
 const previous=config.consent;
 const consent={...previous,...structuredClone(settings)};
 if(canonical(consent)===canonical(previous))throw Error('No control settings changed. Change a field or cancel the edit.');
 config.consent=consent;
 // Use the existing inventory, exception ownership and runtime-setting validation.
 const checked=toPublicConfig(config,{mode:'preview'});
 for(const document of Object.values(checked.documents))document.review.status='draft';
 return {config:checked,action:previous?'update':'add',blockedPurposeIds:checked.consent!.purposes.filter(p=>scopeGuardBlocked(checked.scopeGuards,p.id)).map(p=>p.id),reviewItems:[
  'Review the declared enrollment, material versions and separate lifetimes against actual practices and applicable rules. No legal defaults were selected.',
  'Connect the actual service start/cleanup lifecycles and test initial load, rejection, grants, reload and withdrawal. Settings do not activate services or grant permission.',
  ...(previous?.promptPolicy?['Review the preserved repeat-request policy and its processing revision against any material change. This editor does not renew or justify a regional exception.']:[]),
  ...(previous?.grantExpiryPolicy?['The existing grant-expiry policy is preserved; its cap remains separate from refusal and dismissal memory.']:[]),
 ]};
}
