/** @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION */
import {createCatalogSelectionPlan} from './catalog-selection.js';
import type {CatalogServiceSelection} from './catalog-selection.js';
import {searchServiceCatalog} from './catalog.js';
import type {ServiceCatalog,CatalogSearchResult} from './catalog.js';
import type {ProjectServiceReport} from './catalog-project.js';
import {loadServiceCatalog} from './catalog-node.js';
import {createStarterConfig} from './starter.js';
import type {SiteConfig} from './types.js';
type Ask=(prompt:string,max?:number)=>Promise<string>;
/** A candidate opens the same explicit actual-use review as a manual catalog search. */
export async function reviewSetupCatalog(base:SiteConfig|undefined,selections:CatalogServiceSelection[],ask:Ask,project?:{catalog:ServiceCatalog;report:ProjectServiceReport}):Promise<{base:SiteConfig|undefined;selections:CatalogServiceSelection[]}>{
 let catalog=project?.catalog;const selected=[...selections];
 async function review(match:CatalogSearchResult):Promise<void>{
  const config=base??createStarterConfig();if(!config.purposes.length){console.log('Declare actual processing purposes in a config and import it with --config before adding a catalog service. Reference search remains available.');return;}
  console.log('Declared purposes: '+config.purposes.map(p=>p.id+' — '+p.name).join(', '));
  const serviceId=await ask('Unique local service ID: ',120),provider=await ask('Actual provider entity: ',300),location=await ask('Actual processing location: '),purposeIds=(await ask('Declared purpose IDs (comma-separated): ',1000)).split(',').map(s=>s.trim()).filter(Boolean),privacyUrl=await ask('Verified provider privacy HTTPS URL (optional): ',2048),justification=await ask('Supporting facts / justification (private): ');
  console.log('Reference '+catalog!.id+' / '+catalog!.revision+'; product revision '+match.product.revision+'. Source URLs are reference metadata; verify actual use.');
  const sourceIds=new Set([...match.product.sourceIds,...match.provider.sourceIds]);for(const source of catalog!.sources.filter(s=>sourceIds.has(s.id)))console.log(`Reference source: ${source.url} · ${source.access==='read'?'retrieved '+source.checkedOn:'URL only; not retrieved or verified'} · ${source.license}`);
  if((await ask('Confirm the actual provider, purpose and location? yes / no [no]: ',16)).toLowerCase()!=='yes')return;
  try{const result=createCatalogSelectionPlan(config,catalog,{productId:match.product.id,serviceId,provider,location,purposeIds,...(privacyUrl?{privacyUrl}:{}),justification,confirmed:true});base=result.config;selected.push(result.selection);console.log('Added a service to the local draft; no integration or permission was enabled.');}
  catch{console.log('Selection was not added. Check the ID, declared purposes, actual provider/location, privacy URL and private justification.');}
 }
 if(project){
  const {report}=project;
  console.log(`\nProject review: ${report.coverage.filesExamined} files examined; ${report.findings.length} candidate(s); coverage ${report.coverage.limited?'limited':'bounded'}.`);
  console.log('Source matches do not prove production use. Development-only, unused and self-hosted integrations remain possible. Skipping a candidate leaves it unreviewed. The full findings will be saved in discovery.private.json.');
  if(report.findings.length&&(await ask('Review project service candidates now? yes / no [no]: ',16)).toLowerCase()==='yes'){
   let page=0;const pageSize=12;
   while(selected.length<32){
    console.log(`\nProject candidates ${page*pageSize+1}–${Math.min((page+1)*pageSize,report.findings.length)} of ${report.findings.length}:`);
    for(const f of report.findings.slice(page*pageSize,(page+1)*pageSize))console.log(`${f.productId} — ${f.productName} / ${f.providerName} · ${f.evidence.length} evidence item(s)`);
    const id=await ask('Project product ID to review, next / back, or blank to continue: ',120);if(!id)break;
    if(id==='next'||id==='back'){page=Math.max(0,Math.min(Math.ceil(report.findings.length/pageSize)-1,page+(id==='next'?1:-1)));continue;}
    const finding=report.findings.find(f=>f.productId===id),product=catalog!.products.find(p=>p.id===id),provider=product&&catalog!.providers.find(p=>p.id===product.providerId);
    if(!finding||!product||!provider){console.log('Choose a detected product ID; manual catalog search follows.');continue;}
    for(const evidence of finding.evidence.slice(0,8))console.log(`  ${evidence.file} · ${evidence.context} · ${evidence.identifier}${evidence.match==='prefix'?'*':''} [${evidence.ruleId}]`);
    if(finding.evidence.length>8)console.log('Additional evidence remains in the private discovery report.');
    const previous=selected.filter(s=>s.reference.products[0]?.id===id);if(previous.length)console.log('Existing selected local services: '+previous.map(s=>s.service.id).join(', ')+'. Add another only for a distinct actual use.');
    await review({product,provider});
   }
  }
 }
 // Explicit opt-in: ordinary setup never imports the large catalog unless asked.
 if(selected.length<32&&(await ask('Search the service reference catalog before review? yes / no [no]: ',16)).toLowerCase()==='yes'){
  catalog??=await loadServiceCatalog();
  while(selected.length<32){
   const query=await ask('Provider, product or category (blank finishes): ',120);if(!query)break;
   const matches=searchServiceCatalog(catalog,query,{limit:12});for(const match of matches)console.log(`${match.product.id} — ${match.product.name} / ${match.provider.name} · ${match.product.review}`);
   const productId=await ask('Product ID to review (blank searches again): ',120),match=matches.find(m=>m.product.id===productId);if(match)await review(match);
  }
 }
 if(selected.length>=32)console.log('This private setup report supports 32 catalog selections. Remaining scan candidates stay unreviewed.');
 return {base,selections:selected};
}
