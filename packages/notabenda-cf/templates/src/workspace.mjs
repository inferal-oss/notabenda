// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CF-HISTORY
import {createAdminWorker,createDocumentHistory,createConsentEvidenceStore,createTermsAcceptanceStore,createProcessingRestrictionStore,createFormPermissionStore,createContractDeclarationStore,recordLegalRelease,validateLegalSourceArchive} from 'notabenda-cf';
import {settings} from './settings.mjs';
import {presentation} from './host.mjs';

/** Private binding/RPC integration. This is not a public ingestion handler. */
export function createWorkspace(storage){return {
 async inspect(request,{allowExport=false,allowSource=false}={}){
  const path=new URL(request.url).pathname,section=path.slice(settings.basePath.length+1).split('/')[0];
  const stores={contracts:()=>createContractDeclarationStore(storage,{siteId:settings.siteId}),history:()=>createDocumentHistory(storage),choices:()=>createConsentEvidenceStore(storage,{siteId:settings.siteId}),agreements:()=>createTermsAcceptanceStore(storage,{siteId:settings.siteId}),processing:()=>createProcessingRestrictionStore(storage,{siteId:settings.siteId}),permissions:()=>createFormPermissionStore(storage,{siteId:settings.siteId})};
  if(!Object.hasOwn(stores,section))return new Response('Not found.',{status:404});
  const titles={contracts:'Contract declarations',history:'Document revisions',choices:'Cookie choices',agreements:'Terms agreements',processing:'Processing opt-outs',permissions:'Form permissions'};
  const store=stores[section]();
  const visibleStore=allowSource===true?store:{list:query=>store.list(query),get:id=>store.get(id)};
  return createAdminWorker({...presentation(),basePath:settings.basePath+'/'+section,title:titles[section],authorize:()=>({store:visibleStore,scopeLabel:settings.siteId,allowExport:allowExport===true})}).fetch(request,{});
 },
 async recordRelease(input,metadata={}){
  const {artifact,sourceAttachments}=await validateLegalSourceArchive(input);
  if(artifact.manifest.siteId!==settings.siteId)throw new Error('Release must belong to the configured site.');
  return recordLegalRelease(storage,{schemaVersion:1,artifact,sourceAttachments},metadata);
 },
};}
