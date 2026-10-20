import {normalizeFormPermissionLocalization,selectFormPermissionLocalization} from './form-permission-localization-policy.js';
import type {FormPermissionMessages} from './form-permission-localization-policy.js';
import {normalizeCollectionLocalization,selectCollectionLocalization} from './collection-localization-policy.js';
import type {CollectionMessages} from './collection-localization-policy.js';
import {normalizeTermsLocalization,selectTermsLocalization} from './terms-localization-policy.js';
import type {TermsMessages} from './terms-localization-policy.js';
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-DOCUMENTS
import {normalizeConsentLocalization,normalizeMessages,selectConsentLocalization} from './localization-policy.js';
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
export interface SiteLocalization extends ConsentLocalization {documents:DocumentMessages;generatedDocuments?:GeneratedDocumentMessages;terms?:TermsMessages;formPermission?:FormPermissionMessages;collection?:CollectionMessages}
/** Full authoring messages stay outside the compiled consent runtime. */
export function normalizeSiteLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):SiteLocalization{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid site localization.');
 const fields=Object.getOwnPropertyDescriptors(input),keys=['schemaVersion','locale','direction','revision','disclosureRevision','reviewStatus','consent','documents',...(Object.hasOwn(fields,'generatedDocuments')?['generatedDocuments']:[]),...(Object.hasOwn(fields,'terms')?['terms']:[]),...(Object.hasOwn(fields,'formPermission')?['formPermission']:[]),...(Object.hasOwn(fields,'collection')?['collection']:[])];
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!fields[k]||!Object.hasOwn(fields[k]!,'value')))throw new Error('Invalid site localization fields.');
 const v=Object.fromEntries(keys.map(k=>[k,fields[k]!.value])),{documents,generatedDocuments,terms,formPermission,collection,...consent}=v;
 const normalized=normalizeConsentLocalization(consent,options);
 const localizedCollection=collection===undefined?undefined:normalizeCollectionLocalization(selectCollectionLocalization({...normalized,collection:collection as CollectionMessages}),options).collection;
 const permission=formPermission===undefined?undefined:normalizeFormPermissionLocalization(selectFormPermissionLocalization({...normalized,formPermission:formPermission as FormPermissionMessages}),options).formPermission;
 const localizedTerms=terms===undefined?undefined:normalizeTermsLocalization(selectTermsLocalization({...normalized,terms:terms as TermsMessages}),options).terms;
 return {...normalized,...(localizedCollection===undefined?{}:{collection:localizedCollection}),...(permission===undefined?{}:{formPermission:permission}),...(localizedTerms===undefined?{}:{terms:localizedTerms}),documents:normalizeMessages(documents,documentMessageFields),...(generatedDocuments===undefined?{}:{generatedDocuments:normalizeMessages(generatedDocuments,generatedDocumentFields)})};
}
export function consentLocalization(localization:SiteLocalization):ConsentLocalization{
 return selectConsentLocalization(localization);
}
/** Components whose fixed chrome has no localization contract must fail explicitly. */
export function requireEnglishSurface(config:{site:{locale:string}},surface:string):void{
 if(!/^en(?:-|$)/iu.test(config.site.locale))throw new Error(`${surface} does not yet support localized UI. Use the headless data and supply your own interface.`);
}
