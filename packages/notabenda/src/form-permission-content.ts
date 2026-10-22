// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-FORM-PERMISSIONS
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeFormPermissionContent} from './form-permission.js';
import type {FormPermissionContent,FormPermissionSettings} from './form-permission.js';
export type FormPermissionPublicFacts=Pick<FormPermissionContent,'siteId'|'artifactId'|'mode'|'document'|'facts'|'localization'>;
/** Shared ordinary offer projection. The Node builder supplies trusted release facts and hashes the result. */
export function assembleFormPermissionContent(facts:FormPermissionPublicFacts,settings:FormPermissionSettings,options:{allowPreview?:boolean}={}):FormPermissionContent {
 assertPlainCatalogData(facts);assertPlainCatalogData(settings);
 const required=['permissionId','purposeId','channel','revision','reviewStatus','wording','withdrawalUrl'],optional=['deliveryWindowSeconds','refusal'];
 if(!settings||typeof settings!=='object'||Array.isArray(settings)||!required.every(k=>Object.hasOwn(settings,k))||Object.keys(settings).some(k=>!required.includes(k)&&!optional.includes(k))||settings.purposeId!==facts.facts.purpose.id||Object.hasOwn(settings,'refusal')&&(!settings.refusal||typeof settings.refusal!=='object')||Object.hasOwn(settings,'deliveryWindowSeconds')&&(typeof settings.deliveryWindowSeconds!=='number'||!Number.isInteger(settings.deliveryWindowSeconds)||settings.deliveryWindowSeconds<30||settings.deliveryWindowSeconds>3600))throw Error('Supply complete ordinary permission settings; specialized marketing requests use their separate builder.');
 return normalizeFormPermissionContent({schemaVersion:settings.refusal?3:facts.localization?2:1,...(facts.localization?{localization:facts.localization}:{}),...(settings.refusal?{refusal:settings.refusal}:{}),siteId:facts.siteId,permissionId:settings.permissionId,purposeId:settings.purposeId,channel:settings.channel,revision:settings.revision,artifactId:facts.artifactId,mode:facts.mode,reviewStatus:settings.reviewStatus,document:facts.document,facts:facts.facts,wording:settings.wording,withdrawalUrl:settings.withdrawalUrl,deliveryWindowSeconds:settings.deliveryWindowSeconds??600},options);
}
