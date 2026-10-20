// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-FORM-PERMISSIONS
import {normalizeMessages} from './localization-policy.js';
export const formPermissionMessageFields={policy:['version'],withdrawalHelp:[],checkSaved:[],checkAvailability:[],retryPermission:[],retryWithdrawal:[],detailsSummary:[],information:['information'],retention:['retention'],providers:['providers'],draft:[],closed:[],unsupported:[],saving:[],loading:[],stale:[],error:[],recorded:[],inactive:[],withdrawn:[],offerChanged:[],off:[],initial:[],recoveryUnavailable:[],withdrawalPending:[],earlierPending:[],permissionPending:[]} as const;
export type FormPermissionMessages={[K in keyof typeof formPermissionMessageFields]:string};
export interface FormPermissionLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';formPermission:FormPermissionMessages}
/** One complete selected interface, pinned to its offer. No per-key fallback. */
export function normalizeFormPermissionLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):FormPermissionLocalization{
 const fail=():never=>{throw Error('Invalid form permission localization. Supply a complete versioned message set for the selected language.');};
 if(!input||typeof input!=='object'||Array.isArray(input))return fail();
 const keys=['schemaVersion','locale','direction','revision','reviewStatus','formPermission'],fields=Object.getOwnPropertyDescriptors(input);
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!fields[k]||!Object.hasOwn(fields[k]!,'value')))return fail();
 const v=Object.fromEntries(keys.map(k=>[k,fields[k]!.value]));
 try{if(typeof v.locale!=='string'||Intl.getCanonicalLocales(v.locale)[0]!==v.locale||options.locale!==undefined&&v.locale!==options.locale)return fail();}catch{return fail();}
 if(v.schemaVersion!==1||(v.direction!=='ltr'&&v.direction!=='rtl')||typeof v.revision!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(v.revision)||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!options.allowPreview&&v.reviewStatus!=='reviewed')return fail();
 const result:FormPermissionLocalization={schemaVersion:1,locale:v.locale as string,direction:v.direction,revision:v.revision,reviewStatus:v.reviewStatus,formPermission:normalizeMessages(v.formPermission,formPermissionMessageFields)};
 if(['withdrawalHelp','checkSaved','checkAvailability','retryPermission','retryWithdrawal'].some(key=>new TextEncoder().encode(result.formPermission[key as keyof FormPermissionMessages]).length>120))return fail();
 if(new TextEncoder().encode(JSON.stringify(result)).length>16384)return fail();return result;
}
export function selectFormPermissionLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';formPermission?:FormPermissionMessages}):FormPermissionLocalization{
 if(!input.formPermission)throw Error('Localized form permissions need localization.formPermission messages.');
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,formPermission:input.formPermission};
}
