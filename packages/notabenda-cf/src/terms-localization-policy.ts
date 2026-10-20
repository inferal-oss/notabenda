// Generated from packages/notabenda/src/terms-localization-policy.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-TERMS-ACCEPTANCE
import {normalizeInterfaceLocalization} from './localization-policy.js';
export const termsMessageFields={regionLabel:[],heading:[],metadata:['version','effectiveDate'],draft:[],recorded:['version'],submitting:[],stale:[],retired:[],unavailable:[],error:[]} as const;
export type TermsMessages={[K in keyof typeof termsMessageFields]:string};
export interface TermsLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';terms:TermsMessages}
export const termsLocalizationPolicy={key:'terms',fields:termsMessageFields,maxBytes:8192,error:'Invalid terms localization. Supply a complete versioned message set for the selected language.'} as const;
/** Complete text for this one offered agreement; no browser-language inference or fallback. */
export function normalizeTermsLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):TermsLocalization{
 return normalizeInterfaceLocalization(input,termsLocalizationPolicy,options);
}
/** Select only the accepted-interface text from a fully validated site declaration. */
export function selectTermsLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';terms?:TermsMessages}):TermsLocalization{
 if(!input.terms)throw new Error('Localized acceptance needs localization.terms messages.');
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,terms:input.terms};
}
