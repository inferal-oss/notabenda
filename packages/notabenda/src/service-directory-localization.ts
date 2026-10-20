// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION REQ-PRODUCT-LOCALIZATION
import {normalizeInterfaceLocalization} from './localization-policy.js';
import type {InterfaceLocalizationMetadata} from './localization-policy.js';
/** Display-only copy. Provider, purpose, storage and policy facts remain host-authored. */
export const serviceDirectoryMessageFields={
 eyebrow:['siteName'],title:[],description:[],draft:[],relatedPoliciesLabel:[],purposesLabel:[],locationLabel:[],privacyLinkLabel:['serviceName'],unlistedPrivacy:[],detailsLabel:[],dataCategoriesLabel:[],legalBasisLabel:[],retentionLabel:[],storageHeading:[],storageCookie:[],storageLocalStorage:[],storageSessionStorage:[],storageIndexedDB:[],storageOther:[],necessary:[],optional:[],exception:[],noStorage:[],emptyInventory:[],noMatches:[],searchLabel:[],searchPlaceholder:[],purposeLabel:[],allPurposes:[],totalOne:['total'],totalMany:['total'],filteredCount:['shown','total'],listSeparator:[],skipToContent:[],pageTitle:[],sitebarLabel:[],footer:[],
} as const;
export type ServiceDirectoryMessages={[K in keyof typeof serviceDirectoryMessageFields]:string};
export interface ServiceDirectoryLocalization extends InterfaceLocalizationMetadata {serviceDirectory:ServiceDirectoryMessages}
export const serviceDirectoryLocalizationPolicy={key:'serviceDirectory',fields:serviceDirectoryMessageFields,maxBytes:16384,error:'Invalid service-directory localization. Supply a complete versioned message set for the selected language.'} as const;
export function normalizeServiceDirectoryLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):ServiceDirectoryLocalization {
 return normalizeInterfaceLocalization(input,serviceDirectoryLocalizationPolicy,options);
}
export function selectServiceDirectoryLocalization(input:InterfaceLocalizationMetadata&{serviceDirectory?:ServiceDirectoryMessages}):ServiceDirectoryLocalization {
 if(!input.serviceDirectory)throw Error('Localized service directories need localization.serviceDirectory messages.');
 const {schemaVersion,locale,direction,revision,reviewStatus,serviceDirectory}=input;return {schemaVersion,locale,direction,revision,reviewStatus,serviceDirectory};
}
/** Legacy English output remains unchanged when no dictionary is supplied. */
export const defaultServiceDirectoryMessages:ServiceDirectoryMessages={
 eyebrow:'{siteName} / Service directory',title:'The services behind this site',description:'Who provides each service, why it is used, and the data and storage declared for it.',draft:'Preview inventory — review before publishing.',relatedPoliciesLabel:'Related policies',purposesLabel:'Purposes',locationLabel:'Processing location',privacyLinkLabel:'{serviceName} privacy notice',unlistedPrivacy:'A provider privacy link is not declared.',detailsLabel:'Data & storage details',dataCategoriesLabel:'Purpose data categories',legalBasisLabel:'Purpose legal basis',retentionLabel:'Purpose retention',storageHeading:'Browser storage',storageCookie:'cookie',storageLocalStorage:'localStorage',storageSessionStorage:'sessionStorage',storageIndexedDB:'indexedDB',storageOther:'other',necessary:'necessary',optional:'optional',exception:'exception',noStorage:'No browser storage is declared for this service.',emptyInventory:'No services are declared in this inventory.',noMatches:'No declared services match this selection.',searchLabel:'Find a service',searchPlaceholder:'Service, provider or data',purposeLabel:'Purpose',allPurposes:'All purposes',totalOne:'{total} declared service',totalMany:'{total} declared services',filteredCount:'Showing {shown} of {total} declared services',listSeparator:', ',skipToContent:'Skip to content',pageTitle:'Service directory',sitebarLabel:'Services used by this site',footer:'Describes the services declared for this site. Viewing this directory does not change your privacy choices.',
};
