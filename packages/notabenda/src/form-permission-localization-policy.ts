// @requirements REQ-PRODUCT-BUNDLE-BUDGET
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-FORM-PERMISSIONS
import {normalizeInterfaceLocalization} from './localization-policy.js';
export const formPermissionMessageFields={policy:['version'],withdrawalHelp:[],checkSaved:[],checkAvailability:[],retryPermission:[],retryWithdrawal:[],detailsSummary:[],information:['information'],retention:['retention'],providers:['providers'],draft:[],closed:[],unsupported:[],saving:[],loading:[],stale:[],error:[],recorded:[],inactive:[],withdrawn:[],offerChanged:[],off:[],initial:[],recoveryUnavailable:[],withdrawalPending:[],earlierPending:[],permissionPending:[]} as const;
export type FormPermissionMessages={[K in keyof typeof formPermissionMessageFields]:string};
export interface FormPermissionLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';formPermission:FormPermissionMessages}
export const formPermissionLocalizationPolicy={missing:'Localized form permissions need localization.formPermission messages.',key:'formPermission',fields:formPermissionMessageFields,maxBytes:16384,error:'Invalid form permission localization. Supply a complete versioned message set for the selected language.',shortFields:['withdrawalHelp','checkSaved','checkAvailability','retryPermission','retryWithdrawal']} as const;
/** One complete selected interface, pinned to its offer. No per-key fallback. */
export function normalizeFormPermissionLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):FormPermissionLocalization{
 return normalizeInterfaceLocalization(input,formPermissionLocalizationPolicy,options);
}
export function selectFormPermissionLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';formPermission?:FormPermissionMessages}):FormPermissionLocalization{
 if(!input.formPermission)throw Error(formPermissionLocalizationPolicy.missing);
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,formPermission:input.formPermission};
}
