// @requirements REQ-PRODUCT-LOCALIZATION
// Kept byte-identical in notabenda-cf: its standalone validator has no frontend dependency.
export const consentMessageFields = {
 title:[],summary:[],preferencesTitle:[],preferencesIntro:[],essentialNote:[],
 acceptLabel:[],rejectLabel:[],saveLabel:[],preferencesLabel:[],dismissLabel:[],closeLabel:[],
 triggerLabel:[],noticeLabel:[],cookiePolicy:[],retryLabel:[],services:['services'],
 scopeUnavailable:[],privacyInformation:[],storageUnavailable:[],reloadRequired:[],
 checking:[],saving:[],recorded:[],error:[],review:[],stale:[],expired:[],unavailable:[],retired:[],
 signalObserved:[],signalUnavailable:[],processingRecorded:[],processingPending:[],destroyed:[],choicesChanged:[],
 restrictedSummary:[],exceptionsSummary:[],unavailableSummary:[],restrictedIntro:[],materialChange:['summary'],
} as const;
export type ConsentMessages = {[K in keyof typeof consentMessageFields]:string};
export interface ConsentLocalization {
 schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;disclosureRevision:string;
 reviewStatus:'draft'|'reviewed';consent:ConsentMessages;
}
const fail=():never=>{throw new Error('Invalid localization: supply a canonical locale, direction, revisions and a complete plain-text message set with the documented placeholders.');};
function record(input:unknown,keys:string[]):Record<string,unknown>{
 if(!input||typeof input!=='object'||Array.isArray(input))return fail();
 const descriptors=Object.getOwnPropertyDescriptors(input);
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!Object.hasOwn(descriptors,k)||!Object.hasOwn(descriptors[k]!,'value')))return fail();
 return Object.fromEntries(keys.map(k=>[k,descriptors[k]!.value]));
}
export function normalizeMessages<T extends Record<string,readonly string[]>>(input:unknown,fields:T):{[K in keyof T]:string}{
 const value=record(input,Object.keys(fields));let bytes=0;
 for(const [key,args] of Object.entries(fields)){
  const message=value[key];
  if(typeof message!=='string'||!message.trim()||/[<>\u0000-\u001f\u007f]/u.test(message))return fail();
  const size=new TextEncoder().encode(message).length;bytes+=size;
  if(size>(key.endsWith('Label')?120:2000)||bytes>20000)return fail();
  const placeholders=[...message.matchAll(/\{([a-zA-Z]+)\}/gu)].map(m=>m[1]!);
  if(message.replace(/\{[a-zA-Z]+\}/gu,'').match(/[{}]/u)||placeholders.some(p=>!args.includes(p))||args.some(p=>!placeholders.includes(p)))return fail();
 }
 return value as {[K in keyof T]:string};
}
/** Shared metadata and body checks for selected interfaces; no default messages. */
export interface InterfaceLocalizationMetadata {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed'}
interface InterfaceMessagePolicy<K extends string,T extends Record<string,readonly string[]>> {key:K;fields:T;maxBytes:number;error:string;shortFields?:readonly (keyof T&string)[]}
type InterfaceLocalization<K extends string,T extends Record<string,readonly string[]>>=InterfaceLocalizationMetadata&Record<K,{[P in keyof T]:string}>;
/** Internal body path: metadata must already have passed its complete interface/site validator. */
export function normalizeInterfaceMessages<K extends string,T extends Record<string,readonly string[]>>(metadata:InterfaceLocalizationMetadata,input:unknown,policy:InterfaceMessagePolicy<K,T>):InterfaceLocalization<K,T>{
 const messages=normalizeMessages(input,policy.fields);
 const result={schemaVersion:1,locale:metadata.locale,direction:metadata.direction,revision:metadata.revision,reviewStatus:metadata.reviewStatus,[policy.key]:messages} as InterfaceLocalization<K,T>;
 if(policy.shortFields?.some(key=>new TextEncoder().encode(messages[key]!).length>120)||new TextEncoder().encode(JSON.stringify(result)).length>policy.maxBytes)throw Error(policy.error);
 return result;
}
export function normalizeInterfaceLocalization<K extends string,T extends Record<string,readonly string[]>>(input:unknown,policy:InterfaceMessagePolicy<K,T>,options:{locale?:string;allowPreview?:boolean}={}):InterfaceLocalization<K,T>{
 const invalid=():never=>{throw Error(policy.error);};
 if(!input||typeof input!=='object'||Array.isArray(input))return invalid();
 const keys=['schemaVersion','locale','direction','revision','reviewStatus',policy.key],fields=Object.getOwnPropertyDescriptors(input);
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!fields[k]||!Object.hasOwn(fields[k]!,'value')))return invalid();
 const v=Object.fromEntries(keys.map(k=>[k,fields[k]!.value]));
 try{if(typeof v.locale!=='string'||Intl.getCanonicalLocales(v.locale)[0]!==v.locale||options.locale!==undefined&&v.locale!==options.locale)return invalid();}catch{return invalid();}
 if(v.schemaVersion!==1||(v.direction!=='ltr'&&v.direction!=='rtl')||typeof v.revision!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(v.revision)||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!options.allowPreview&&v.reviewStatus!=='reviewed')return invalid();
 return normalizeInterfaceMessages({schemaVersion:1,locale:v.locale as string,direction:v.direction,revision:v.revision,reviewStatus:v.reviewStatus},v[policy.key],policy);
}
/** Fixed named placeholders only. Replacement values remain text and are never recursively parsed. */
export function formatMessage(template:string,values:Record<string,string|number>):string{
 return template.replace(/\{([a-zA-Z]+)\}/gu,(_,key:string)=>String(values[key]));
}
export function normalizeConsentLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):ConsentLocalization{
 const v=record(input,['schemaVersion','locale','direction','revision','disclosureRevision','reviewStatus','consent']);
 const revision=(x:unknown)=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(x);
 let locale:string;try{if(typeof v.locale!=='string')return fail();locale=Intl.getCanonicalLocales(v.locale)[0]!;if(locale!==v.locale||options.locale!==undefined&&locale!==options.locale)return fail();}catch{return fail();}
 if(v.schemaVersion!==1||(v.direction!=='ltr'&&v.direction!=='rtl')||!revision(v.revision)||!revision(v.disclosureRevision)||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!options.allowPreview&&v.reviewStatus!=='reviewed')return fail();
 return {schemaVersion:1,locale,direction:v.direction as 'ltr'|'rtl',revision:v.revision as string,disclosureRevision:v.disclosureRevision as string,reviewStatus:v.reviewStatus as 'draft'|'reviewed',consent:normalizeMessages(v.consent,consentMessageFields)};
}
export function localizedConsentWording(localization:ConsentLocalization,context:{available:boolean;restricted:boolean;exceptions:boolean;changeSummary?:string}){
 const m=localization.consent;
 const change=context.changeSummary?formatMessage(m.materialChange,{summary:context.changeSummary}):'';
 return {title:m.title,summary:[context.available?m.summary:m.unavailableSummary,context.available&&context.restricted?m.restrictedSummary:'',context.exceptions?m.exceptionsSummary:'',change].filter(Boolean).join(' '),preferencesTitle:m.preferencesTitle,preferencesIntro:[m.preferencesIntro,context.restricted?m.restrictedIntro:'',change].filter(Boolean).join(' '),essentialNote:m.essentialNote,acceptLabel:m.acceptLabel,rejectLabel:m.rejectLabel,saveLabel:m.saveLabel,preferencesLabel:m.preferencesLabel,dismissLabel:m.dismissLabel,closeLabel:m.closeLabel};
}

export function selectConsentLocalization(value:ConsentLocalization):ConsentLocalization{
 const {schemaVersion,locale,direction,revision,disclosureRevision,reviewStatus,consent}=value;
 return {schemaVersion,locale,direction,revision,disclosureRevision,reviewStatus,consent};
}
