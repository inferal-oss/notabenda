// @requirements REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
import {normalizeConsentInformation} from './consent-information.js';
// @requirements REQ-EU-INTERESTS-DISCLOSURE
import {isLegitimateInterests} from './purpose-disclosures.js';
// @requirements REQ-IE-CONSENT-DURATION
import {isGrantExpiryPolicy} from './grant-expiry-policy.js';
// @requirements REQ-PRODUCT-LOCALIZATION
import {normalizeConsentLocalization} from './localization-policy.js';
import type {ConsentLocalization} from './localization-policy.js';
// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME
import type {PublicSiteConfig,DocumentConfig,BuildMode} from './types.js';
import {isResourceOrigin,isSafeLink} from './safe-links.js';
import {normalizeGoogleBasic} from './google-basic-policy.js';
import {normalizeScopeGuardPolicy} from './scope-guard-policy.js';
import {isPromptPolicy} from './prompt-policy.js';
/** Material inventory remains public; authoring bodies, operator contacts and other workflows are omitted. */
export type ConsentRuntimeInventory=Pick<PublicSiteConfig,'schemaVersion'|'site'|'purposes'|'services'|'storage'|'consent'|'scopeGuards'|'privacySignals'>&{
 documents:Record<'privacy'|'cookies',Omit<DocumentConfig,'sections'>>;localization?:ConsentLocalization;
};
export interface ConsentRuntimeConfig {
 schemaVersion:1;
 kind:'notabenda-consent-runtime';
 mode:BuildMode;
 /** Explicit host decision. Required mode cannot start without the separately imported adapter. */
 evidence:'local'|'required';
 inventory:ConsentRuntimeInventory;
}
const fail=():never=>{throw new Error('Invalid consent runtime configuration. Compile a bounded site configuration with an explicit evidence mode.');};
function need(value:unknown):asserts value {if(!value)fail();}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function shape(v:unknown,required:string[],optional:string[]=[]):asserts v is Record<string,unknown>{need(object(v)&&required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k)));}
const text=(v:unknown,max=4096):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
function strings(v:unknown,min=0,max=256,unique=false):asserts v is string[]{need(Array.isArray(v)&&v.length>=min&&v.length<=max&&v.every(x=>text(x))&&(!unique||new Set(v).size===v.length));}
function entries(v:unknown,max:number):asserts v is Record<string,unknown>[]{need(Array.isArray(v)&&v.length<=max&&v.every(x=>object(x)&&slug(x.id))&&new Set(v.map(x=>x.id)).size===v.length);}
const member=(v:unknown,values:readonly unknown[])=>values.includes(v);
const activities=['sale','sharing','targeted-advertising'];
/** Treat descriptors as untrusted JSON. No browser, storage, transport or DOM access while parsing. */
export function normalizeConsentRuntimeConfig(input:unknown):ConsentRuntimeConfig {
 let value:unknown;
 try{const json=JSON.stringify(input);need(typeof json==='string'&&new TextEncoder().encode(json).length<=262144);value=JSON.parse(json);}catch{return fail();}
 shape(value,['schemaVersion','kind','mode','evidence','inventory']);
 need(value.schemaVersion===1&&value.kind==='notabenda-consent-runtime'&&member(value.mode,['preview','production'])&&member(value.evidence,['local','required']));
 const c=value.inventory;
 shape(c,['schemaVersion','site','purposes','services','storage','consent','documents'],['scopeGuards','privacySignals','localization']);need(c.schemaVersion===1);
 shape(c.site,['id','name','url','locale','description']);const site=c.site;need(slug(site.id)&&['name','url','locale','description'].every(k=>text(site[k])));
 try{const url=new URL(String(c.site.url));need(isSafeLink(c.site.url)&&url.protocol==='https:'&&!url.search&&!url.hash&&(c.localization===undefined?Intl.getCanonicalLocales(String(c.site.locale)).length&&/^en(?:-|$)/iu.test(String(c.site.locale)):Intl.getCanonicalLocales(String(c.site.locale))[0]===c.site.locale));}catch{return fail();}
 const localization=c.localization===undefined?undefined:normalizeConsentLocalization(c.localization,{locale:String(site.locale),allowPreview:value.mode==='preview'});
 entries(c.purposes,256);entries(c.services,256);entries(c.storage,512);
 const purposes=c.purposes.map(p=>{
  shape(p,['id','name','description','legalBasis','dataCategories','retention','collection'],['legitimateInterests']);need(p.legitimateInterests===undefined||isLegitimateInterests(p.legitimateInterests));need(['name','description','legalBasis','retention'].every(k=>text(p[k])));strings(p.dataCategories,1);
  shape(p.collection,['source','description','required','consequences']);const q=p.collection;need(member(q.source,['direct','indirect','both'])&&text(q.description)&&typeof q.required==='boolean'&&text(q.consequences));
  // Keep the compatibility scope encoding's exact field order, independently of incoming JSON key order.
  return {id:p.id,name:p.name,description:p.description,legalBasis:p.legalBasis,...(p.legitimateInterests===undefined?{}:{legitimateInterests:p.legitimateInterests}),dataCategories:[...p.dataCategories],retention:p.retention,collection:{source:q.source,description:q.description,required:q.required,consequences:q.consequences}};
 });
 const purposeIds=purposes.map(p=>p.id);
 const services=c.services.map(s=>{
  shape(s,['id','name','provider','purposeIds','location'],['googleBasic','privacyUrl','resourceOrigins','processingActivities']);need(['name','provider','location'].every(k=>text(s[k])));strings(s.purposeIds,1,256);need(s.purposeIds.every(id=>purposeIds.includes(id)));
  if(s.privacyUrl!==undefined)need(text(s.privacyUrl)&&isSafeLink(s.privacyUrl));
  if(s.resourceOrigins!==undefined){strings(s.resourceOrigins,1,16,true);need(s.resourceOrigins.every(isResourceOrigin));}
  if(s.processingActivities!==undefined){strings(s.processingActivities,0,3,true);need(s.processingActivities.every(a=>activities.includes(a)));}
  return {...(s.googleBasic===undefined?{}:{googleBasic:normalizeGoogleBasic(s.googleBasic,s.purposeIds)}),id:s.id,name:s.name,provider:s.provider,purposeIds:[...s.purposeIds],location:s.location,...(s.privacyUrl===undefined?{}:{privacyUrl:s.privacyUrl}),...(s.resourceOrigins===undefined?{}:{resourceOrigins:[...s.resourceOrigins as string[]]}),...(s.processingActivities===undefined?{}:{processingActivities:[...s.processingActivities as string[]]})};
 });
 const serviceIds=services.map(s=>s.id);
 const storage=c.storage.map(s=>{
  shape(s,['id','name','type','serviceId','duration','classification'],['necessityReason','exceptionId']);need(text(s.name)&&text(s.duration)&&serviceIds.includes(s.serviceId)&&member(s.type,['cookie','localStorage','sessionStorage','indexedDB','other'])&&member(s.classification,['necessary','optional','exception']));
  need(s.classification==='exception'?slug(s.exceptionId):s.exceptionId===undefined);
  if(s.classification==='necessary'||s.necessityReason!==undefined)need(text(s.necessityReason));
  return {id:s.id,name:s.name,type:s.type,serviceId:s.serviceId,duration:s.duration,classification:s.classification,...(s.exceptionId===undefined?{}:{exceptionId:s.exceptionId}),...(s.necessityReason===undefined?{}:{necessityReason:s.necessityReason})};
 });
 const policy=c.consent;shape(policy,['purposes','services','grantLifetimeDays','refusalLifetimeDays','dismissalMinutes'],['promptPolicy','grantExpiryPolicy','information']);
 entries(policy.purposes,40);entries(policy.services,80);
 for(const [list,ids] of [[policy.purposes,purposeIds],[policy.services,serviceIds]] as const)for(const entry of list){shape(entry,['id','scope']);need(ids.includes(entry.id)&&text(entry.scope,200));}
 const optionalPurposes=policy.purposes.map(p=>p.id),optionalServices=policy.services.map(s=>s.id);
 for(const service of services){if(optionalServices.includes(service.id))need(service.purposeIds.every(id=>optionalPurposes.includes(id)));if(service.googleBasic)need(optionalServices.includes(service.id)&&service.resourceOrigins?.includes('https://www.googletagmanager.com')&&service.processingActivities!==undefined);}
 for(const id of optionalPurposes)need(services.some(s=>optionalServices.includes(s.id)&&s.purposeIds.includes(String(id))));
 for(const item of storage){if(item.classification==='optional')need(optionalServices.includes(item.serviceId));if(item.classification==='exception')need(!optionalServices.includes(item.serviceId));}
 for(const key of ['grantLifetimeDays','refusalLifetimeDays'])need(Number.isInteger(policy[key])&&Number(policy[key])>=1&&Number(policy[key])<=730);
 need(Number.isInteger(policy.dismissalMinutes)&&Number(policy.dismissalMinutes)>=0&&Number(policy.dismissalMinutes)<=43200);
 if(policy.grantExpiryPolicy!==undefined)need(isGrantExpiryPolicy(policy.grantExpiryPolicy));
 if(policy.promptPolicy!==undefined)need(isPromptPolicy(policy.promptPolicy));
 const consent={...(policy.information===undefined?{}:{information:normalizeConsentInformation(policy.information)}),...(isGrantExpiryPolicy(policy.grantExpiryPolicy)?{grantExpiryPolicy:{profile:policy.grantExpiryPolicy.profile,version:policy.grantExpiryPolicy.version}}:{}),purposes:policy.purposes.map(p=>({id:p.id,scope:p.scope})),services:policy.services.map(s=>({id:s.id,scope:s.scope})),grantLifetimeDays:policy.grantLifetimeDays,refusalLifetimeDays:policy.refusalLifetimeDays,dismissalMinutes:policy.dismissalMinutes,...(policy.promptPolicy===undefined?{}:{promptPolicy:policy.promptPolicy})};
 let scopeGuards;
 if(c.scopeGuards!==undefined)scopeGuards=normalizeScopeGuardPolicy(c.scopeGuards,purposeIds as string[]);
 let privacySignals;
 if(c.privacySignals!==undefined){shape(c.privacySignals,['globalPrivacyControl']);const g=c.privacySignals.globalPrivacyControl;shape(g,['appliesTo','explanation']);strings(g.appliesTo,1,3,true);need(g.appliesTo.every(a=>activities.includes(a))&&text(g.explanation)&&services.every(s=>s.processingActivities!==undefined));privacySignals={globalPrivacyControl:{appliesTo:[...g.appliesTo],explanation:g.explanation}};}
 shape(c.documents,['privacy','cookies']);const documents:Record<string,unknown>={},routes=new Set();
 for(const kind of ['privacy','cookies']){
  const d=c.documents[kind];shape(d,['title','route','version','effectiveDate','source','review']);shape(d.review,['status']);
  need(text(d.title)&&text(d.version,200)&&typeof d.route==='string'&&/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/u.test(d.route)&&!routes.has(d.route.toLowerCase())&&member(d.source,['generated','supplied'])&&member(d.review.status,['draft','reviewed'])&&(value.mode==='preview'||d.review.status==='reviewed'));
  need(typeof d.effectiveDate==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate)&&Number.isFinite(Date.parse(d.effectiveDate))&&new Date(d.effectiveDate).toISOString().slice(0,10)===d.effectiveDate);routes.add(d.route.toLowerCase());
  documents[kind]={title:d.title,route:d.route,version:d.version,effectiveDate:d.effectiveDate,source:d.source,review:{status:d.review.status}};
 }
 return {schemaVersion:1,kind:'notabenda-consent-runtime',mode:value.mode,evidence:value.evidence,inventory:{schemaVersion:1,site:c.site,...(localization===undefined?{}:{localization}),purposes,services,storage,consent,documents,...(scopeGuards===undefined?{}:{scopeGuards}),...(privacySignals===undefined?{}:{privacySignals})}} as ConsentRuntimeConfig;
}
