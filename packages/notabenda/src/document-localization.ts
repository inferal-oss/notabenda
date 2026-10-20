// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
import {processingLocalizationPolicy,selectProcessingLocalization} from './processing-localization-policy.js';
import type {ProcessingMessages} from './processing-localization-policy.js';
// @requirements REQ-PRODUCT-STORAGE-LOCALIZATION
import {storageExceptionMessageFields} from './storage-exception-localization.js';
import type {StorageExceptionMessages} from './storage-exception-localization.js';
// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
import {rightsMessageFields} from './rights-localization-policy.js';
import type {RightsMessages} from './rights-localization-policy.js';
import {formPermissionLocalizationPolicy,selectFormPermissionLocalization} from './form-permission-localization-policy.js';
import type {FormPermissionMessages} from './form-permission-localization-policy.js';
import {collectionLocalizationPolicy,selectCollectionLocalization} from './collection-localization-policy.js';
import type {CollectionMessages} from './collection-localization-policy.js';
import {termsLocalizationPolicy,selectTermsLocalization} from './terms-localization-policy.js';
import type {TermsMessages} from './terms-localization-policy.js';
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-DOCUMENTS
import {normalizeConsentLocalization,normalizeMessages,normalizeInterfaceMessages,selectConsentLocalization} from './localization-policy.js';
import type {ConsentLocalization} from './localization-policy.js';
export const documentMessageFields={legalEyebrow:['siteName'],versionLabel:[],effectiveLabel:[],draft:[],contents:[],storageItem:['count'],storageItems:['count'],legalLabel:[],privacyRequests:[],skipToContent:[],legalInformation:[]} as const;
export const generatedDocumentFields={
 controllerHeading:[],representativeHeading:[],dpoHeading:[],purposesHeading:[],noPurposes:[],
 purpose:['name','description','data','legalBasis','source','collection','required','consequences'],listSeparator:[],
 collectionDirect:[],collectionIndirect:[],collectionBoth:[],required:[],optional:[],
 retentionHeading:[],retentionItem:['name','retention'],noRetention:[],providersHeading:[],
 provider:['name','provider','location','purposes'],noProviders:[],providerPrivacy:['name'],
 transfersHeading:[],automatedHeading:[],rightsHeading:[],contactInformation:[],exerciseRights:[],
 complaintsHeading:[],complaintInformation:[],privacySignalsHeading:[],cookiesHeading:[],cookiesAbout:['siteName'],cookiesExplanation:[],
 storageHeading:[],storageCaption:[],storageName:[],storageType:[],storageProvider:[],storagePurpose:[],storageDuration:[],storageClassification:[],
 storageCookie:[],storageLocalStorage:[],storageSessionStorage:[],storageIndexedDB:[],storageOther:[],
 classificationNecessary:[],classificationOptional:[],classificationException:['title'],classificationReason:['classification','reason'],noStorage:[],
 cookiePurposesHeading:[],cookiePurpose:['name','description'],noCookiePurposes:[],storageQuestions:[],
} as const;
export type DocumentMessages={[K in keyof typeof documentMessageFields]:string};
export type GeneratedDocumentMessages={[K in keyof typeof generatedDocumentFields]:string};
export interface SiteLocalization extends ConsentLocalization {documents:DocumentMessages;generatedDocuments?:GeneratedDocumentMessages;terms?:TermsMessages;formPermission?:FormPermissionMessages;collection?:CollectionMessages;rights?:RightsMessages;storageExceptions?:StorageExceptionMessages;processingChoices?:ProcessingMessages}
/** Full authoring messages stay outside the compiled consent runtime. */
export function normalizeSiteLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):SiteLocalization{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid site localization.');
 const fields=Object.getOwnPropertyDescriptors(input),keys=['schemaVersion','locale','direction','revision','disclosureRevision','reviewStatus','consent','documents',...(Object.hasOwn(fields,'generatedDocuments')?['generatedDocuments']:[]),...(Object.hasOwn(fields,'terms')?['terms']:[]),...(Object.hasOwn(fields,'formPermission')?['formPermission']:[]),...(Object.hasOwn(fields,'collection')?['collection']:[]),...(Object.hasOwn(fields,'rights')?['rights']:[]),...(Object.hasOwn(fields,'storageExceptions')?['storageExceptions']:[]),...(Object.hasOwn(fields,'processingChoices')?['processingChoices']:[])];
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!fields[k]||!Object.hasOwn(fields[k]!,'value')))throw new Error('Invalid site localization fields.');
 const v=Object.fromEntries(keys.map(k=>[k,fields[k]!.value])),{documents,generatedDocuments,terms,formPermission,collection,rights,storageExceptions,processingChoices,...consent}=v;
 const normalized=normalizeConsentLocalization(consent,options);
 const localizedProcessing=processingChoices===undefined?undefined:normalizeInterfaceMessages(normalized,selectProcessingLocalization({...normalized,processingChoices:processingChoices as ProcessingMessages}).processingChoices,processingLocalizationPolicy).processingChoices;
 const localizedCollection=collection===undefined?undefined:normalizeInterfaceMessages(normalized,selectCollectionLocalization({...normalized,collection:collection as CollectionMessages}).collection,collectionLocalizationPolicy).collection;
 const permission=formPermission===undefined?undefined:normalizeInterfaceMessages(normalized,selectFormPermissionLocalization({...normalized,formPermission:formPermission as FormPermissionMessages}).formPermission,formPermissionLocalizationPolicy).formPermission;
 const localizedTerms=terms===undefined?undefined:normalizeInterfaceMessages(normalized,selectTermsLocalization({...normalized,terms:terms as TermsMessages}).terms,termsLocalizationPolicy).terms;
 return {...normalized,...(localizedProcessing===undefined?{}:{processingChoices:localizedProcessing}),...(storageExceptions===undefined?{}:{storageExceptions:normalizeMessages(storageExceptions,storageExceptionMessageFields)}),...(rights===undefined?{}:{rights:normalizeMessages(rights,rightsMessageFields)}),...(localizedCollection===undefined?{}:{collection:localizedCollection}),...(permission===undefined?{}:{formPermission:permission}),...(localizedTerms===undefined?{}:{terms:localizedTerms}),documents:normalizeMessages(documents,documentMessageFields),...(generatedDocuments===undefined?{}:{generatedDocuments:normalizeMessages(generatedDocuments,generatedDocumentFields)})};
}
export function consentLocalization(localization:SiteLocalization):ConsentLocalization{
 return selectConsentLocalization(localization);
}
/** Components whose fixed chrome has no localization contract must fail explicitly. */
export function requireEnglishSurface(config:{site:{locale:string}},surface:string):void{
 if(!/^en(?:-|$)/iu.test(config.site.locale))throw new Error(`${surface} does not yet support localized UI. Use the headless data and supply your own interface.`);
}
