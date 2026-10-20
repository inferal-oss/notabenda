// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION REQ-PRODUCT-LOCALIZATION
import {normalizeInterfaceLocalization} from './localization-policy.js';
export const indirectCollectionMessageFields={
 draft:[],draftText:[],advance:[],collected:[],informationLabel:[],sourceLabel:[],
 lawHeading:[],requires:[],authorises:[],lawLinkLabel:[],recipientsHeading:[],collectorHeading:[],
 accessHeading:[],accessLinkLabel:[],effectiveDate:['effectiveDate'],listSeparator:[],
} as const;
export type IndirectCollectionMessages={[K in keyof typeof indirectCollectionMessageFields]:string};
export interface IndirectCollectionLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';indirectCollection:IndirectCollectionMessages}
export const indirectCollectionLocalizationPolicy={key:'indirectCollection',fields:indirectCollectionMessageFields,maxBytes:16384,error:'Invalid indirect-collection localization. Supply complete versioned plain-text messages for the selected language.'} as const;
/** Complete selected copy; no collection facts, applicability or delivery decisions. */
export function normalizeIndirectCollectionLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):IndirectCollectionLocalization{
 return normalizeInterfaceLocalization(input,indirectCollectionLocalizationPolicy,options);
}
export function selectIndirectCollectionLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';indirectCollection?:IndirectCollectionMessages}):IndirectCollectionLocalization{
 if(!input.indirectCollection)throw Error('Localized indirect-collection notices need localization.indirectCollection messages.');
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,indirectCollection:input.indirectCollection};
}
