// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-COLLECTION-NOTICE
import {normalizeInterfaceLocalization} from './localization-policy.js';
export const collectionMessageFields={
 draft:[],responsibleLabel:[],mixedSources:[],informationLabel:[],providingLabel:[],required:[],optional:[],consequencesLabel:[],
 detailsLabel:[],privacyLinkLabel:[],controllerHeading:[],representativeHeading:[],dpoHeading:[],purposeDetails:['purpose'],
 collectionSourceLabel:[],directSource:[],bothSource:[],sourceDetailsLabel:[],legalBasisLabel:[],retentionLabel:[],
 recipientsHeading:[],recipientPurposes:['purposes'],providerPrivacyLabel:[],noRecipients:[],transfersHeading:[],automatedHeading:[],
 rightsHeading:[],exerciseRightsLabel:[],complaintsHeading:[],complaintInfoLabel:[],privacyVersion:['version'],effectiveDate:['effectiveDate'],listSeparator:[],
} as const;
export type CollectionMessages={[K in keyof typeof collectionMessageFields]:string};
export interface CollectionLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';collection:CollectionMessages}
export const collectionLocalizationPolicy={key:'collection',fields:collectionMessageFields,maxBytes:16384,error:'Invalid collection localization. Supply complete versioned plain-text messages for the selected language.'} as const;
/** Complete selected static interface; the descriptor supplies no processing facts. */
export function normalizeCollectionLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):CollectionLocalization{
 return normalizeInterfaceLocalization(input,collectionLocalizationPolicy,options);
}
export function selectCollectionLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';collection?:CollectionMessages}):CollectionLocalization{
 if(!input.collection)throw Error('Localized collection notices need localization.collection messages.');
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,collection:input.collection};
}
