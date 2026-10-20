// @requirements REQ-PRODUCT-STORAGE-AUTHORING
import {applySetupStorageFile,reviewSetupStorage,storageDraftReview} from './setup-storage-cli.js';
import type {StorageDraftPlan} from './setup-storage.js';
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
import {applySetupRightsFile,reviewSetupRights} from './setup-rights-cli.js';
// @requirements REQ-PRODUCT-PRIVACY-PACKS
// @requirements REQ-PRODUCT-CONSENT-AUTHORING
import {reviewSetupConsent} from './setup-consent-cli.js';
// @requirements REQ-PRODUCT-PACK-CONNECTION
// @requirements REQ-PRODUCT-CARTRIDGES
import {selectCartridges,readCartridgeSelection,planCartridges,createCartridgeSetupPlan,formatCartridgeBrief,cartridgeRecommendations} from './cartridges.js';
import {readSetupCatalogRevisions} from './catalog-review.js';
// @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
/** @requirements REQ-PRODUCT-SETUP */
import {readSetupCatalogSelections} from './catalog-selection.js';
import type {CatalogServiceSelection} from './catalog-selection.js';
import {reviewSetupCatalog} from './setup-catalog-cli.js';
import {readCliJson} from './cli-json.js';
import {loadServiceCatalog} from './catalog-node.js';
import {scanProjectServices} from './catalog-project.js';
import type {ProjectServiceReport} from './catalog-project.js';
import type {ServiceCatalog} from './catalog.js';
import {reviewSetupPurposes} from './setup-purpose-cli.js';
import {createInterface} from 'node:readline/promises';
import {mkdir,writeFile,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createSetupPlan,readSetupAnswers,setupQuestions,setupMarkets,setupFactFields} from './setup.js';
import {toPublicConfig} from './config.js';
import type {SetupAnswers,SetupChoice} from './setup.js';
const readJson=(path:string)=>readCliJson(path,512*1024,'Setup input must be ordinary UTF-8 JSON no larger than 512 KiB.');
export async function runSetupWizard(options:{answersPath?:string;configPath?:string;outDir:string;projectDirectory?:string;catalogPath?:string;cartridgeIds?:string[];rightsPath?:string;storagePath?:string}):Promise<void>{
  if(options.catalogPath&&!options.projectDirectory)throw Error('Wizard --catalog requires an explicit --project directory.');
  if(!options.answersPath&&(!process.stdin.isTTY||!process.stdout.isTTY))throw new Error('Interactive setup needs a terminal. Supply --answers FILE for noninteractive use.');
  const directory=resolve(options.outDir);try{await lstat(directory);throw Object.assign(Error('Output already exists.'),{code:'EEXIST'});}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  let storagePlan:StorageDraftPlan|undefined;
  let selection=options.cartridgeIds?selectCartridges(options.cartridgeIds):undefined;
  let base=options.configPath?toPublicConfig(await readJson(options.configPath),{mode:'preview'}):undefined;let answers:unknown;let catalogSelections:CatalogServiceSelection[]=[];let catalogSelectionRevisions:ReturnType<typeof readSetupCatalogRevisions>=[];
  if(options.answersPath){const input=await readJson(options.answersPath);answers=readSetupAnswers(input);const resumed=readCartridgeSelection(input);if(selection&&resumed&&JSON.stringify(selection)!==JSON.stringify(resumed))throw Error('Selected packs conflict with the saved report. Resume it without --packs or prepare a separate plan.');selection??=resumed;catalogSelections=readSetupCatalogSelections(input);catalogSelectionRevisions=readSetupCatalogRevisions(input);createSetupPlan(answers as SetupAnswers,{...(base===undefined?{}:{config:base}),catalogSelections,catalogSelectionRevisions});}
  if(options.rightsPath)base=await applySetupRightsFile(base,options.rightsPath);
  let project: {catalog:ServiceCatalog;report:ProjectServiceReport}|undefined;
  if(options.projectDirectory){const catalog=await loadServiceCatalog(options.catalogPath);console.log('Scanning the explicitly selected project locally; no project code, installers or network probes run.');project={catalog,report:await scanProjectServices(options.projectDirectory,catalog)};}
  if(!options.answersPath){
    const ui=createInterface({input:process.stdin,output:process.stdout});const result:SetupAnswers={schemaVersion:1,markets:[],answers:{},publicFacts:{},storageJustifications:{}};
    const ask=async(prompt:string,max=4000)=>{const value=await ui.question(prompt);if(value.length>max)throw new Error('Answer is too long.');return value.trim();};
    try{
      console.log('Notabenda setup · draft recommendations, no automatic activation or legal conclusion.\nPrivate notes are saved separately from the site config. Leave public facts blank to retain imported/starter values.');
      for(const [id,label] of setupFactFields)result.publicFacts![id]=await ask(label+': ');
      console.log(setupMarkets.map(m=>m.id+' — '+m.label).join('\n'));
      result.markets=(await ask('Coverage interests (comma-separated IDs; blank means unresolved): ',512)).split(',').map(s=>s.trim()).filter(Boolean);
      const selectedQuestions=selection?new Set(planCartridges(selection).reference.relevantQuestionIds):undefined;
      for(const q of setupQuestions.filter(q=>!selectedQuestions||selectedQuestions.has(q.id))){console.log('\n'+q.title+'\n'+q.detail);let choice='';while(!['yes','no','unknown'].includes(choice))choice=(await ask('yes / no / unknown [unknown]: ',16)).toLowerCase()||'unknown';result.answers[q.id]={choice:choice as SetupChoice,justification:await ask('Supporting facts / justification (blank leaves a review item): ')};}
      base=await reviewSetupPurposes(base,ask);
      const inventory=(base as {storage?:{id:string;classification:string}[]}|undefined)?.storage;
      if(Array.isArray(inventory))for(const item of inventory)if(item.classification==='necessary')result.storageJustifications![item.id]=await ask(`Private justification for necessary storage “${item.id}”: `);
      const reviewed=await reviewSetupCatalog(base,catalogSelections,ask,project);base=reviewed.base;catalogSelections=reviewed.selections;
      base=await reviewSetupConsent(base,ask);
      if(!options.storagePath){storagePlan=await reviewSetupStorage(base,ask);if(storagePlan)base=storagePlan.config;}
      if(!options.rightsPath&&(!selection||planCartridges(selection).reference.targets.some(t=>t.id==='privacy-rights')))base=await reviewSetupRights(base,ask);
      answers=result;
    }finally{ui.close();}
  }
  if(options.storagePath){storagePlan=await applySetupStorageFile(base,options.storagePath);base=storagePlan.config;}
  const prepare=selection?(input:unknown,opts:Parameters<typeof createSetupPlan>[1])=>createCartridgeSetupPlan(selection,input,opts):createSetupPlan;
  const plan=prepare(readSetupAnswers(answers),{...(base===undefined?{}:{config:base}),catalogSelections,catalogSelectionRevisions});
  const configText=JSON.stringify(plan.config,null,2)+'\n';
  if(new TextEncoder().encode(configText).length>512*1024)throw Error('Keep the resulting setup config within the 512 KiB import limit.');
  const storageReview=storagePlan?JSON.stringify(storageDraftReview(storagePlan),null,2)+'\n':undefined;
  // A new directory is the write boundary: never overwrite an existing config or report, including symlinks.
  await mkdir(directory,{mode:0o700});
  await writeFile(join(directory,'notabenda.config.json'),configText,{flag:'wx',mode:0o600});
  await writeFile(join(directory,'setup.private.json'),JSON.stringify(plan.report,null,2)+'\n',{flag:'wx',mode:0o600});
  if(selection)await writeFile(join(directory,'notabenda-setup-brief.txt'),formatCartridgeBrief(selection,'connect',{config:plan.config}),{flag:'wx',mode:0o600});
  if(project)await writeFile(join(directory,'discovery.private.json'),JSON.stringify(project.report,null,2)+'\n',{flag:'wx',mode:0o600});
  if(storageReview)await writeFile(join(directory,'storage-change-review.private.json'),storageReview,{flag:'wx',mode:0o600});
  await writeFile(join(directory,'.gitignore'),'setup.private.json\n'+(project?'discovery.private.json\n':'')+(storagePlan?'storage-change-review.private.json\n':''),{flag:'wx'});
  if(project)console.log(`Saved ${project.report.findings.length} project candidate(s) separately in discovery.private.json; coverage ${project.report.coverage.limited?'limited':'bounded'}. Findings never add services without actual-use confirmation.`);
  console.log(`Created a draft config and private setup report in ${options.outDir}.`);
  if(selection)console.log('Saved notabenda-setup-brief.txt with the selected connection steps and application checks. Keep it alongside the config and private report for your coding agent.');
  for(const recommendation of selection?cartridgeRecommendations(selection,plan.report.recommendations):plan.report.recommendations)if(recommendation.status!=='declared-no')console.log(`${recommendation.status}: ${recommendation.title}\n  ${recommendation.reason}\n  ${recommendation.requirementIds.join(', ')}\n  Config / integration: ${recommendation.configPaths.join(', ')}\n  Guide: https://notabenda.org/guide/${recommendation.guide}`);
  console.log(`${selection?'Complete private report: ':''}${plan.report.reviewItems.length} review items; ${plan.report.diagnostics.filter(d=>d.severity==='error').length} production validation errors. Review locally; no services were enabled or deployed.`);
}
