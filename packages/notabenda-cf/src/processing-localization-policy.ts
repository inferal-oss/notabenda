// Generated from packages/notabenda/src/processing-localization-policy.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-PRODUCT-BUNDLE-BUDGET
// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION REQ-PRODUCT-LOCALIZATION
import {normalizeInterfaceLocalization} from './localization-policy.js';
/** Status and recovery copy only. The action's substantive wording stays in its notice. */
export const processingMessageFields={retryLabel:[],draft:[],checking:[],ready:[],saving:[],recorded:[],error:[],retired:[],destroyed:[],needsConfirmation:[],recoveryUnavailable:[],recoveryInvalid:[]} as const;
export type ProcessingMessages={[K in keyof typeof processingMessageFields]:string};
export interface ProcessingLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';processingChoices:ProcessingMessages}
export const processingLocalizationPolicy={missing:'Localized processing choices need localization.processingChoices messages.',key:'processingChoices',fields:processingMessageFields,maxBytes:8192,error:'Invalid processing-choice localization. Supply a complete versioned message set for the selected language.'} as const;
export function normalizeProcessingLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):ProcessingLocalization {
 return normalizeInterfaceLocalization(input,processingLocalizationPolicy,options);
}
export function selectProcessingLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';processingChoices?:ProcessingMessages}):ProcessingLocalization {
 if(!input.processingChoices)throw Error(processingLocalizationPolicy.missing);
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,processingChoices:input.processingChoices};
}
