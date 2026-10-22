// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION
import {contractActionLocalizationPolicy} from './contract-action-localization.js';
import type {ContractActionMessages} from './contract-action-localization.js';
// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION
import {indirectCollectionLocalizationPolicy,selectIndirectCollectionLocalization} from './indirect-collection-localization-policy.js';
// @requirements REQ-PRODUCT-EMBED-LOCALIZATION
import {embedLocalizationPolicy} from './embed-localization.js';
import type {EmbedMessages} from './embed-localization.js';
import type {IndirectCollectionMessages} from './indirect-collection-localization-policy.js';
// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION
import {serviceDirectoryLocalizationPolicy,selectServiceDirectoryLocalization} from './service-directory-localization.js';
import type {ServiceDirectoryMessages} from './service-directory-localization.js';
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
export interface SiteLocalization extends ConsentLocalization {documents:DocumentMessages;generatedDocuments?:GeneratedDocumentMessages;terms?:TermsMessages;formPermission?:FormPermissionMessages;collection?:CollectionMessages;indirectCollection?:IndirectCollectionMessages;rights?:RightsMessages;storageExceptions?:StorageExceptionMessages;processingChoices?:ProcessingMessages;serviceDirectory?:ServiceDirectoryMessages;embeds?:EmbedMessages;contractActions?:ContractActionMessages}
// @requirements REQ-PRODUCT-BUNDLE-BUDGET
// Keep output order stable. Selectors retain the interface-specific missing-body diagnostics.
const interfaces = [
 {policy:contractActionLocalizationPolicy},
 {policy:embedLocalizationPolicy},
 {policy:indirectCollectionLocalizationPolicy,select:selectIndirectCollectionLocalization},
 {policy:serviceDirectoryLocalizationPolicy,select:selectServiceDirectoryLocalization},
 {policy:processingLocalizationPolicy,select:selectProcessingLocalization},
 {policy:{key:'storageExceptions',fields:storageExceptionMessageFields}},
 {policy:{key:'rights',fields:rightsMessageFields}},
 {policy:collectionLocalizationPolicy,select:selectCollectionLocalization},
 {policy:formPermissionLocalizationPolicy,select:selectFormPermissionLocalization},
 {policy:termsLocalizationPolicy,select:selectTermsLocalization},
] as const;
const consentFields=['schemaVersion','locale','direction','revision','disclosureRevision','reviewStatus','consent'];
const optionalFields=['generatedDocuments',...interfaces.map(({policy})=>policy.key)];
/** Full authoring messages stay outside the compiled consent runtime. */
export function normalizeSiteLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):SiteLocalization{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid site localization.');
 const fields=Object.getOwnPropertyDescriptors(input),keys=[...consentFields,'documents',...optionalFields.filter(key=>Object.hasOwn(fields,key))];
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!fields[k]||!Object.hasOwn(fields[k]!,'value')))throw new Error('Invalid site localization fields.');
 const v=Object.fromEntries(keys.map(k=>[k,fields[k]!.value]));
 const normalized=normalizeConsentLocalization(Object.fromEntries(consentFields.map(k=>[k,v[k]])),options);
 const bodies:Record<string,unknown>={};
 for(const entry of interfaces){
  const policy=entry.policy,body=v[policy.key];
  if(body===undefined)continue;
  if('select' in entry)entry.select({...normalized,[policy.key]:body});
  bodies[policy.key]='maxBytes' in policy?normalizeInterfaceMessages<string,Record<string,readonly string[]>>(normalized,body,policy)[policy.key]:normalizeMessages(body,policy.fields);
 }
 return {...normalized,...bodies,documents:normalizeMessages(v.documents,documentMessageFields),...(v.generatedDocuments===undefined?{}:{generatedDocuments:normalizeMessages(v.generatedDocuments,generatedDocumentFields)})};
}
export function consentLocalization(localization:SiteLocalization):ConsentLocalization{
 return selectConsentLocalization(localization);
}
/** Components whose fixed chrome has no localization contract must fail explicitly. */
export function requireEnglishSurface(config:{site:{locale:string}},surface:string):void{
 if(!/^en(?:-|$)/iu.test(config.site.locale))throw new Error(`${surface} does not yet support localized UI. Use the headless data and supply your own interface.`);
}
