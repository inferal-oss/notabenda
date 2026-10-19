// Generated from packages/notabenda/src/terms-localization-policy.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-TERMS-ACCEPTANCE
import {normalizeMessages} from './localization-policy.js';
export const termsMessageFields={regionLabel:[],heading:[],metadata:['version','effectiveDate'],draft:[],recorded:['version'],submitting:[],stale:[],retired:[],unavailable:[],error:[]} as const;
export type TermsMessages={[K in keyof typeof termsMessageFields]:string};
export interface TermsLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';terms:TermsMessages}
/** Complete text for this one offered agreement; no browser-language inference or fallback. */
export function normalizeTermsLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):TermsLocalization{
 const fail=():never=>{throw new Error('Invalid terms localization. Supply a complete versioned message set for the selected language.');};
 if(!input||typeof input!=='object'||Array.isArray(input))return fail();
 const keys=['schemaVersion','locale','direction','revision','reviewStatus','terms'],fields=Object.getOwnPropertyDescriptors(input);
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!fields[k]||!Object.hasOwn(fields[k]!,'value')))return fail();
 const v=Object.fromEntries(keys.map(k=>[k,fields[k]!.value]));
 try{if(typeof v.locale!=='string'||Intl.getCanonicalLocales(v.locale)[0]!==v.locale||options.locale!==undefined&&v.locale!==options.locale)return fail();}catch{return fail();}
 if(v.schemaVersion!==1||(v.direction!=='ltr'&&v.direction!=='rtl')||typeof v.revision!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(v.revision)||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!options.allowPreview&&v.reviewStatus!=='reviewed')return fail();
 const result:TermsLocalization={schemaVersion:1,locale:v.locale as string,direction:v.direction,revision:v.revision,reviewStatus:v.reviewStatus,terms:normalizeMessages(v.terms,termsMessageFields)};
 if(new TextEncoder().encode(JSON.stringify(result)).length>8192)return fail();
 return result;
}
/** Select only the accepted-interface text from a fully validated site declaration. */
export function selectTermsLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';terms?:TermsMessages}):TermsLocalization{
 if(!input.terms)throw new Error('Localized acceptance needs localization.terms messages.');
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,terms:input.terms};
}
