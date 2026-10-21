// Generated from packages/notabenda/src/contract-action-localization.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION REQ-PRODUCT-LOCALIZATION
import {normalizeInterfaceLocalization} from './localization-policy.js';
/** Interface and acknowledgement labels; substantive declaration wording stays explicit. */
export const contractActionMessageFields={retry:[],newTab:[],preview:[],name:[],contract:[],email:[],type:[],choose:[],ordinary:[],extraordinary:[],reason:[],ending:[],earliest:[],review:[],edit:[],received:[],pending:[],download:[],copy:[],saving:[],uncertain:[],invalid:[],unavailable:[],sentBy:[],clientAt:[],receivedAt:[],request:[],definition:[],scope:[]} as const;
export type ContractActionMessages={[K in keyof typeof contractActionMessageFields]:string};
export interface ContractActionLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';contractActions:ContractActionMessages}
export const contractActionLocalizationPolicy={key:'contractActions',fields:contractActionMessageFields,maxBytes:12288,shortFields:['retry','newTab','preview','name','contract','email','type','choose','ordinary','extraordinary','reason','ending','earliest','review','edit','received','download','copy','sentBy','clientAt','receivedAt','request','definition'],error:'Invalid contract-action localization. Supply complete versioned labels and messages for the selected language.'} as const;
export function normalizeContractActionLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):ContractActionLocalization {
 return normalizeInterfaceLocalization(input,contractActionLocalizationPolicy,options);
}
export function selectContractActionLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';contractActions?:ContractActionMessages}):ContractActionLocalization {
 if(!input.contractActions)throw Error('Localized contract forms need localization.contractActions messages.');
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,contractActions:input.contractActions};
}
