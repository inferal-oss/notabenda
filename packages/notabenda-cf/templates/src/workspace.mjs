// @requirements REQ-PRODUCT-TERMS-HISTORY
// @requirements REQ-PRODUCT-RECORDING-INSPECTION
import {createRecordingInspectionWorker} from '@notabenda/cloudflare';
// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
// @requirements REQ-PRODUCT-CARTRIDGES
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CF-HISTORY
import {createAdminWorker,createWorkspaceOverviewWorker,createDocumentHistory,createConsentEvidenceStore,createTermsAcceptanceStore,createProcessingRestrictionStore,createFormPermissionStore,createContractDeclarationStore,recordLegalRelease,validateLegalSourceArchive} from '@notabenda/cloudflare';
import {settings} from './settings.mjs';
import {presentation} from './host.mjs';

/** Private binding/RPC integration. This is not a public ingestion handler. */
// Supply fixed host-owned readers here; request values must never select their site or scope.
export function createWorkspace(storage,{recordingTargets=[]}={}){return {
 async inspect(request,{allowExport=false,allowSource=false,allowCatalogReview=false,allowTermsSettings=false,allowSetup=false}={}){
  const path=new URL(request.url).pathname,section=path.slice(settings.basePath.length+1).split('/')[0];
  if(path===settings.basePath+'/recording'||path===settings.basePath+'/recording/')return createRecordingInspectionWorker({...presentation(),basePath:settings.basePath+'/recording',historyPath:settings.basePath+'/history',authorize:()=>({targets:recordingTargets,scopeLabel:settings.siteId})}).fetch(request,{});
  const stores={contracts:()=>createContractDeclarationStore(storage,{siteId:settings.siteId}),history:()=>createDocumentHistory(storage),choices:()=>createConsentEvidenceStore(storage,{siteId:settings.siteId}),agreements:()=>createTermsAcceptanceStore(storage,{siteId:settings.siteId}),processing:()=>createProcessingRestrictionStore(storage,{siteId:settings.siteId}),permissions:()=>createFormPermissionStore(storage,{siteId:settings.siteId})};
  if(path===settings.basePath||path===settings.basePath+'/'){
   const jobs=[['history','Privacy pages','Compare retained privacy, cookie and terms versions.',true],['choices','Cookie choices','Inspect choices and the notices they refer to.',true],['agreements','Terms agreement','Review the person, exact terms version and recorded statement.',true],['permissions','Form permissions','Inspect optional permissions and later withdrawals.'],['processing','Processing opt-outs','Review requests and retained processing restrictions.'],['contracts','Contract declarations','Inspect declarations and independent handoff states.']];
   return createWorkspaceOverviewWorker({...presentation(),basePath:settings.basePath,setupPath:settings.basePath+'/setup',recordingPath:settings.basePath+'/recording',authorize:()=>({scopeLabel:settings.siteId,allowRecordingInspection:true,allowSetup:allowSetup===true,areas:jobs.map(([id,title,description,primary=false])=>({id,title,description,primary,href:settings.basePath+'/'+id,store:stores[id]()}))})}).fetch(request,{});
  }
  if(!Object.hasOwn(stores,section))return new Response('Not found.',{status:404});
  const titles={contracts:'Contract declarations',history:'Document revisions',choices:'Cookie choices',agreements:'Terms agreements',processing:'Processing opt-outs',permissions:'Form permissions'};
  const store=stores[section]();
  const visibleStore={list:query=>store.list(query),get:id=>store.get(id),...(allowSource===true&&store.getSource?{getSource:(...args)=>store.getSource(...args)}:{}),...(allowTermsSettings===true&&store.getTermsSettings?{getTermsSettings:id=>store.getTermsSettings(id)}:{}),...(allowCatalogReview===true&&store.getCatalogReview?{getCatalogReview:id=>store.getCatalogReview(id)}:{})};
  return createAdminWorker({...presentation(),basePath:settings.basePath+'/'+section,title:titles[section],authorize:()=>({store:visibleStore,scopeLabel:settings.siteId,allowExport:allowExport===true,allowCatalogReview:allowCatalogReview===true,allowTermsSettings:allowTermsSettings===true})}).fetch(request,{});
 },
 async recordRelease(input,metadata={}){
  const {artifact,sourceAttachments,catalogReview}=await validateLegalSourceArchive(input);
  if(artifact.manifest.siteId!==settings.siteId)throw new Error('Release must belong to the configured site.');
  return recordLegalRelease(storage,{schemaVersion:1,artifact,sourceAttachments,...(catalogReview===undefined?{}:{catalogReview})},metadata);
 },
};}
