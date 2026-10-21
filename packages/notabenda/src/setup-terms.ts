// @requirements REQ-PRODUCT-TERMS-AUTHORING REQ-PRODUCT-CONFIG
import {assertPlainCatalogData} from './catalog-plain.js';
import {toPublicConfig} from './config.js';
import {normalizeTermsAgreementSettings} from './terms-settings.js';
import type {TermsAgreementSetting} from './terms-settings.js';
import type {SiteConfig} from './types.js';
export type TermsDraftSetting=Omit<TermsAgreementSetting,'reviewStatus'>;
export type TermsDraftMutation={action:'add'|'update';settings:TermsDraftSetting}|{action:'remove';scopeId:string;confirmed:true};
export interface TermsDraftInput {schemaVersion:1;changes:TermsDraftMutation[]}
export interface TermsDraftPlan {config:SiteConfig;changedScopes:string[];removedScopes:string[];reviewItems:string[]}
const invalid=():never=>{throw Error('Supply a versioned terms-agreement batch with complete explicit wording, workflow scopes and revisions. Removal requires confirmed: true; authoring never marks wording reviewed.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
export function normalizeTermsDraftInput(input:unknown):TermsDraftInput {
 try{assertPlainCatalogData(input);}catch{return invalid();}
 if(!object(input)||!exact(input,['schemaVersion','changes'])||input.schemaVersion!==1||!Array.isArray(input.changes)||!input.changes.length||input.changes.length>32||new TextEncoder().encode(JSON.stringify(input)).length>128*1024)return invalid();
 const ids=new Set<string>(),changes:TermsDraftMutation[]=[];
 for(const value of input.changes){
  if(!object(value))return invalid();
  if(value.action==='remove'){
   if(!exact(value,['action','scopeId','confirmed'])||value.confirmed!==true||typeof value.scopeId!=='string'||!(/^[a-z][a-z0-9-]{0,119}$/u.test(value.scopeId))||ids.has(value.scopeId))return invalid();ids.add(value.scopeId);changes.push({action:'remove',scopeId:value.scopeId,confirmed:true});
  }else{
   if((value.action!=='add'&&value.action!=='update')||!exact(value,['action','settings'])||!object(value.settings)||!exact(value.settings,['scopeId','revision','statement','actionLabel']))return invalid();
   const normalized=normalizeTermsAgreementSettings([{...value.settings,reviewStatus:'draft'}],{allowPreview:true})[0]!;if(ids.has(normalized.scopeId))return invalid();ids.add(normalized.scopeId);
   const {reviewStatus,...settings}=normalized;changes.push({action:value.action as 'add'|'update',settings});
  }
 }
 return {schemaVersion:1,changes};
}
/** Synchronous, baseline-bound local edit. No offer registration, activation or retirement. */
export function createTermsDraftPlan(input:unknown,change:{baseline:unknown;input:TermsDraftInput}):TermsDraftPlan {
 try{assertPlainCatalogData(input);assertPlainCatalogData(change);}catch{return invalid();}
 if(!object(change)||!exact(change,['baseline','input']))return invalid();
 const config=toPublicConfig(input,{mode:'preview'}),baseline=toPublicConfig(change.baseline,{mode:'preview'});if(canonical(config)!==canonical(baseline))throw Error('The site draft changed. Reopen terms agreement editing before saving.');
 const batch=normalizeTermsDraftInput(change.input),agreements=normalizeTermsAgreementSettings(config.terms.agreements,{allowPreview:true}),changedScopes:string[]=[],removedScopes:string[]=[];
 for(const mutation of batch.changes){
  const id=mutation.action==='remove'?mutation.scopeId:mutation.settings.scopeId,index=agreements.findIndex(entry=>entry.scopeId===id),previous=agreements[index];
  if(mutation.action==='add'&&previous)throw Error('That terms scope is already configured. Edit it or choose another workflow scope.');
  if(mutation.action!=='add'&&!previous)throw Error('Choose an existing terms scope. Renaming is a separate removal and addition.');
  if(mutation.action==='remove'){agreements.splice(index,1);removedScopes.push(id);continue;}
  if(previous){if(previous.revision===mutation.settings.revision)throw Error('Use a fresh, never-reused agreement revision when editing. Only the current revision can be checked here.');}
  const next={...mutation.settings,reviewStatus:'draft' as const};if(previous)agreements[index]=next;else agreements.push(next);changedScopes.push(id);
 }
 if(agreements.length)config.terms.agreements=normalizeTermsAgreementSettings(agreements,{allowPreview:true});else delete config.terms.agreements;
 for(const document of Object.values(config.documents))document.review.status='draft';
 const checked=toPublicConfig(config,{mode:'preview'});if(new TextEncoder().encode(JSON.stringify(checked)).length>512*1024)throw Error('Keep the setup configuration within the 512 KiB import limit.');
 return {config:checked,changedScopes,removedScopes,reviewItems:[
  'Review the actual statement, action label, terms document and selected language for each named workflow. A scope is not an identity or operation reference.',
  'Generate offers from the final retained release, after any catalog or authored-source attachments. Use the exact selected scope; no default is inferred.',
  'Publishing configuration or an offer does not activate it, identify a person, accept terms or change an existing backend selection. Register and activate only through your authorized application.',
  'Removing or renaming a setting does not deactivate an earlier backend offer. Retire the actual old workflow separately and preserve acknowledged retries and retained records.',
  'Use never-reused revisions. This editor compares the current public baseline only; historical uniqueness and legal review remain host responsibilities.',
 ]};
}
