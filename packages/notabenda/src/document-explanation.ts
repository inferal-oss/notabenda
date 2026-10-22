// @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION REQ-PRODUCT-DOCUMENTS
import {toPublicConfig,SiteConfigError} from './config.js';
import {validateAuthoredConfig} from './config-authoring.js';
import {createLegalDocument} from './documents.js';
import type {DocumentKind,PublicSiteConfig,RequirementId,ValidationOptions} from './types.js';

export interface DocumentSectionExplanation {
 id:string;heading:string;origin:'generated'|'supplied'|'additional';
 reason:string;inputPaths:string[];requirementIds:RequirementId[];
}
export interface LegalDocumentExplanation {
 schemaVersion:1;kind:'document-input-review';mode:'preview'|'production';
 document:{kind:DocumentKind;source:'generated'|'supplied';version:string;reviewStatus:'draft'|'reviewed'};
 metadataPaths:string[];wording:'built-in-english'|'host-localized'|'supplied';
 requirementIds:RequirementId[];
 sections:DocumentSectionExplanation[];
 limits:{determinesApplicability:false;verifiesFacts:false;approvesContent:false;verifiesPublication:false;includesPrivateMetadata:false};
}
type Dependencies={reason:string;paths:string[]};
const fieldPaths=(base:string,value:object,fields:string[])=>fields.filter(k=>Object.hasOwn(value,k)).map(k=>base+'/'+k);
function generatedDependencies(c:PublicSiteConfig,kind:DocumentKind,id:string):Dependencies {
 const purposePaths=(fields:string[])=>c.purposes.length?c.purposes.flatMap((p,i)=>fieldPaths('/purposes/'+i,p,fields)):['/purposes'];
 const contacts=(key:'controller'|'representative'|'dpo')=>{
  const value=key==='controller'?c.controller:c.controller[key];
  if(!value)throw Error('Generated contact section has no declared contact.');
  return fieldPaths(key==='controller'?'/controller':'/controller/'+key,value,['name','address','email']);
 };
 if(kind==='privacy'){
  if(id==='controller'||id==='representative'||id==='dpo')return {reason:'Uses the declared contact details. A contact declaration does not establish appointment or legal qualification.',paths:contacts(id)};
  if(id==='purposes')return {reason:'Lists declared purposes, data, basis, collection context and consequences; an empty inventory produces an explicit empty-state section.',paths:purposePaths(['name','description','legalBasis','legitimateInterests','dataCategories','collection'])};
  if(id==='retention')return {reason:'Lists each declared purpose and retention statement; periods are not calculated or justified by the template.',paths:purposePaths(['name','retention'])};
  if(id==='providers'){
   const used=new Set(c.services.flatMap(s=>s.purposeIds));
   return {reason:'Lists all declared services and their purpose names and privacy links. Inclusion does not prove a recipient relationship or actual deployment.',paths:c.services.length?[...c.services.flatMap((s,i)=>fieldPaths('/services/'+i,s,['name','provider','location','purposeIds','privacyUrl'])),...c.purposes.flatMap((p,i)=>used.has(p.id)?['/purposes/'+i+'/id','/purposes/'+i+'/name']:[])]:['/services']};
  }
  if(id==='transfers')return {reason:'Includes the operator-supplied transfer statement; it does not derive safeguards from provider locations.',paths:['/privacy/transfers']};
  if(id==='automated-decisions')return {reason:'Includes the operator-supplied automated-decision statement.',paths:['/privacy/automatedDecisions']};
  if(id==='rights')return {reason:'Includes declared rights, the controller contact and any declared request-information link.',paths:['/privacy/rights','/controller/email',...fieldPaths('/privacy',c.privacy,['rightsUrl'])]};
  if(id==='complaints')return {reason:'Includes the declared complaint information and optional link.',paths:fieldPaths('/privacy/complaints',c.privacy.complaints,['description','url'])};
  if(id==='privacy-signals')return {reason:'Appears because a privacy-signal policy is declared; the page uses its explanation and does not enforce the policy.',paths:['/privacySignals/globalPrivacyControl/explanation']};
 }
 if(kind==='cookies'){
  if(id==='about')return {reason:'Introduces the declared storage inventory using the site name. Publishing this section does not control storage.',paths:['/site/name']};
  if(id==='storage'){
   const paths:string[]=[];
   for(const [i,item] of c.storage.entries()){
    paths.push(...fieldPaths('/storage/'+i,item,['name','type','serviceId','duration','classification','necessityReason','exceptionId']));
    const si=c.services.findIndex(s=>s.id===item.serviceId),service=c.services[si]!;
    paths.push(...fieldPaths('/services/'+si,service,['id','provider','name','purposeIds']));
    for(const [pi,p] of c.purposes.entries())if(service.purposeIds.includes(p.id))paths.push('/purposes/'+pi+'/id','/purposes/'+pi+'/name');
    if(item.classification==='exception'){
     const ei=c.storageExceptions!.entries.findIndex(e=>e.id===item.exceptionId);
     paths.push('/storageExceptions/entries/'+ei+'/id','/storageExceptions/entries/'+ei+'/title');
    }
   }
   return {reason:'Lists each declared storage item and its linked service/purpose names. Classifications and necessity reasons are operator assertions; an empty inventory is reported explicitly.',paths:paths.length?paths:['/storage']};
  }
  if(id==='purposes')return {reason:'Lists the names and descriptions of all declared purposes, including purposes that have no storage item.',paths:purposePaths(['name','description'])};
  if(id==='contact')return {reason:'Links the declared controller email and current privacy-page route.',paths:['/controller/email','/documents/privacy/title','/documents/privacy/route']};
 }
 throw Error('The generated document section has no input explanation. Update the section recipe before using this report.');
}

/** Current-input review only. It does not modify document output or attest to a retained release. */
export function explainLegalDocument(input:unknown,kind:DocumentKind,options:ValidationOptions={}):LegalDocumentExplanation {
 const mode=options.mode??'production';
 const validation=validateAuthoredConfig(input,{mode});if(!validation.valid)throw new SiteConfigError(validation.diagnostics);
 const c=toPublicConfig(input,{mode}),doc=createLegalDocument(c,kind,{mode}),settings=c.documents[kind];
 const supplied=settings.sections??[],generatedCount=settings.source==='supplied'?0:doc.sections.length-supplied.length;
 const sections=doc.sections.map((section,index):DocumentSectionExplanation=>{
  const origin=settings.source==='supplied'?'supplied':index>=generatedCount?'additional':'generated';
  const dependencies=origin==='generated'?generatedDependencies(c,kind,section.id):{reason:origin==='supplied'?'Uses the supplied structured section in its declared order; generated clauses are replaced.':'Appends the supplied structured section after generated content with an additional- section ID.',paths:['/documents/'+kind+'/sections/'+(origin==='supplied'?index:index-generatedCount)]};
  return {id:section.id,heading:section.heading,origin,reason:dependencies.reason,inputPaths:[...new Set([...dependencies.paths,...(origin==='generated'&&c.localization?['/localization/generatedDocuments']:[])])],requirementIds:[...doc.requirementIds]};
 });
 return {schemaVersion:1,kind:'document-input-review',mode,document:{kind,source:settings.source,version:doc.version,reviewStatus:doc.reviewStatus},metadataPaths:fieldPaths('/documents/'+kind,settings,['title','route','version','effectiveDate','source','review']),wording:settings.source==='supplied'?'supplied':c.localization?'host-localized':'built-in-english',requirementIds:['REQ-PRODUCT-DOCUMENT-EXPLANATION',...doc.requirementIds],sections,limits:{determinesApplicability:false,verifiesFacts:false,approvesContent:false,verifiesPublication:false,includesPrivateMetadata:false}};
}
