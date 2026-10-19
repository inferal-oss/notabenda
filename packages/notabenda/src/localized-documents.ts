// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-SAFE-CONTENT
import {formatMessage} from './localization-policy.js';
import {declaredServices} from './service-inventory.js';
import type {GeneratedDocumentMessages} from './document-localization.js';
import type {PublicSiteConfig,LegalSection} from './types.js';
/** Host-reviewed templates insert declared text, never markup or inferred legal applicability. */
export function localizedSections(config:PublicSiteConfig,kind:'privacy'|'cookies'):LegalSection[]{
 const m=config.localization?.generatedDocuments;
 if(!m)throw new Error('Generated localized documents need a complete generatedDocuments message set.');
 const f=(key:keyof GeneratedDocumentMessages,values:Record<string,string|number>={})=>formatMessage(m[key],values);
 const list=(values:string[])=>values.join(m.listSeparator);
 const {controller,privacy}=config;
 if(kind==='privacy'){
  const sections:LegalSection[]=[{id:'controller',heading:m.controllerHeading,paragraphs:[controller.name,controller.address],links:[{label:controller.email,href:`mailto:${controller.email}`}]}];
  for(const [key,title] of [['representative',m.representativeHeading],['dpo',m.dpoHeading]] as const){const c=controller[key];if(c)sections.push({id:key,heading:title,paragraphs:[c.name,...(c.address?[c.address]:[])],links:[{label:c.email,href:`mailto:${c.email}`}]});}
  sections.push(
   {id:'purposes',heading:m.purposesHeading,...(config.purposes.length?{}:{paragraphs:[m.noPurposes]}),items:config.purposes.map(p=>f('purpose',{name:p.name,description:p.description,data:list(p.dataCategories),legalBasis:p.legalBasis,source:{direct:m.collectionDirect,indirect:m.collectionIndirect,both:m.collectionBoth}[p.collection.source],collection:p.collection.description,required:p.collection.required?m.required:m.optional,consequences:p.collection.consequences}))},
   {id:'retention',heading:m.retentionHeading,items:config.purposes.map(p=>f('retentionItem',{name:p.name,retention:p.retention})),...(config.purposes.length?{}:{paragraphs:[m.noRetention]})},
   {id:'providers',heading:m.providersHeading,items:declaredServices(config).map(s=>f('provider',{name:s.name,provider:s.provider,location:s.location,purposes:list(s.purposes.map(p=>p.name))})),...(config.services.length?{}:{paragraphs:[m.noProviders]}),links:config.services.filter(s=>s.privacyUrl).map(s=>({label:f('providerPrivacy',{name:s.name}),href:s.privacyUrl!}))},
   {id:'transfers',heading:m.transfersHeading,paragraphs:[privacy.transfers]},
   {id:'automated-decisions',heading:m.automatedHeading,paragraphs:[privacy.automatedDecisions]},
   {id:'rights',heading:m.rightsHeading,items:privacy.rights,links:[{label:m.contactInformation,href:`mailto:${controller.email}`},...(privacy.rightsUrl?[{label:m.exerciseRights,href:privacy.rightsUrl}]:[])]},
   {id:'complaints',heading:m.complaintsHeading,paragraphs:[privacy.complaints.description],...(privacy.complaints.url?{links:[{label:m.complaintInformation,href:privacy.complaints.url}]}:{})},
  );
  if(config.privacySignals)sections.push({id:'privacy-signals',heading:m.privacySignalsHeading,paragraphs:[config.privacySignals.globalPrivacyControl.explanation]});
  return sections;
 }
 const types={cookie:m.storageCookie,localStorage:m.storageLocalStorage,sessionStorage:m.storageSessionStorage,indexedDB:m.storageIndexedDB,other:m.storageOther};
 return [
  {id:'about',heading:m.cookiesHeading,paragraphs:[f('cookiesAbout',{siteName:config.site.name}),m.cookiesExplanation]},
  {id:'storage',heading:m.storageHeading,...(config.storage.length?{table:{caption:m.storageCaption,columns:[m.storageName,m.storageType,m.storageProvider,m.storagePurpose,m.storageDuration,m.storageClassification],rows:config.storage.map(s=>{
   const service=config.services.find(v=>v.id===s.serviceId)!;
   const classification=s.classification==='exception'?f('classificationException',{title:config.storageExceptions!.entries.find(v=>v.id===s.exceptionId)!.title}):s.classification==='necessary'?m.classificationNecessary:m.classificationOptional;
   return [s.name,types[s.type],`${service.provider} / ${service.name}`,list(service.purposeIds.map(id=>config.purposes.find(p=>p.id===id)!.name)),s.duration,s.necessityReason?f('classificationReason',{classification,reason:s.necessityReason}):classification];
  })}}:{paragraphs:[m.noStorage]})},
  {id:'purposes',heading:m.cookiePurposesHeading,items:config.purposes.map(p=>f('cookiePurpose',{name:p.name,description:p.description})),...(config.purposes.length?{}:{paragraphs:[m.noCookiePurposes]})},
  {id:'contact',heading:m.storageQuestions,links:[{label:controller.email,href:`mailto:${controller.email}`},{label:config.documents.privacy.title,href:config.documents.privacy.route}]},
 ];
}
