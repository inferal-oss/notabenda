// @requirements REQ-PRODUCT-SERVICE-CATALOG
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
/** @requirements REQ-PRODUCT-SETUP */
import {createCatalogSelectionPlan,readSetupCatalogSelections} from './catalog-selection.js';
import type {CatalogServiceSelection} from './catalog-selection.js';
import {searchServiceCatalog} from './catalog.js';
import {createStarterConfig} from './starter.js';
import {reviewSetupPurposes} from './setup-purpose-cli.js';
import {createInterface} from 'node:readline/promises';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createSetupPlan,readSetupAnswers,setupQuestions,setupMarkets,setupFactFields} from './setup.js';
import {toPublicConfig} from './config.js';
import type {SetupAnswers,SetupChoice} from './setup.js';
async function readJson(path:string):Promise<unknown>{
  const chunks:Buffer[]=[];let size=0;
  try{for await(const chunk of createReadStream(resolve(path))){size+=chunk.length;if(size>512*1024)throw new Error();chunks.push(chunk as Buffer);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch{throw new Error('Setup input must be readable JSON no larger than 512 KiB.');}
}
export async function runSetupWizard(options:{answersPath?:string;configPath?:string;outDir:string}):Promise<void>{
  let base=options.configPath?toPublicConfig(await readJson(options.configPath),{mode:'preview'}):undefined;let answers:unknown;let catalogSelections:CatalogServiceSelection[]=[];
  if(options.answersPath){answers=await readJson(options.answersPath);catalogSelections=readSetupCatalogSelections(answers);}
  else{
    if(!process.stdin.isTTY||!process.stdout.isTTY)throw new Error('Interactive setup needs a terminal. Supply --answers FILE for noninteractive use.');
    const ui=createInterface({input:process.stdin,output:process.stdout});const result:SetupAnswers={schemaVersion:1,markets:[],answers:{},publicFacts:{},storageJustifications:{}};
    const ask=async(prompt:string,max=4000)=>{const value=await ui.question(prompt);if(value.length>max)throw new Error('Answer is too long.');return value.trim();};
    try{
      console.log('Notabenda setup · draft recommendations, no automatic activation or legal conclusion.\nPrivate notes are saved separately from the site config. Leave public facts blank to retain imported/starter values.');
      for(const [id,label] of setupFactFields)result.publicFacts![id]=await ask(label+': ');
      console.log(setupMarkets.map(m=>m.id+' — '+m.label).join('\n'));
      result.markets=(await ask('Coverage interests (comma-separated IDs; blank means unresolved): ',512)).split(',').map(s=>s.trim()).filter(Boolean);
      for(const q of setupQuestions){console.log('\n'+q.title+'\n'+q.detail);let choice='';while(!['yes','no','unknown'].includes(choice))choice=(await ask('yes / no / unknown [unknown]: ',16)).toLowerCase()||'unknown';result.answers[q.id]={choice:choice as SetupChoice,justification:await ask('Supporting facts / justification (blank leaves a review item): ')};}
      base=await reviewSetupPurposes(base,ask);
      const inventory=(base as {storage?:{id:string;classification:string}[]}|undefined)?.storage;
      if(Array.isArray(inventory))for(const item of inventory)if(item.classification==='necessary')result.storageJustifications![item.id]=await ask(`Private justification for necessary storage “${item.id}”: `);
      // Explicit opt-in: the large seed is not imported until the operator asks to search.
      if((await ask('Search the service reference catalog before review? yes / no [no]: ',16)).toLowerCase()==='yes'){
        const {serviceCatalogSeed}=await import('./catalog-seed.js');
        while(catalogSelections.length<32){
          const query=await ask('Provider, product or category (blank finishes): ',120);if(!query)break;
          const matches=searchServiceCatalog(serviceCatalogSeed,query,{limit:12});
          for(const match of matches)console.log(`${match.product.id} — ${match.product.name} / ${match.provider.name} · ${match.product.review}`);
          const productId=await ask('Product ID to review (blank searches again): ',120),match=matches.find(m=>m.product.id===productId);if(!match)continue;
          const config=base??createStarterConfig();if(!config.purposes.length){console.log('Declare actual processing purposes in a config and import it with --config before adding a catalog service. Reference search remains available.');continue;}console.log('Declared purposes: '+config.purposes.map(p=>p.id+' — '+p.name).join(', '));
          const serviceId=await ask('Unique local service ID: ',120),provider=await ask('Actual provider entity: ',300),location=await ask('Actual processing location: '),purposeIds=(await ask('Declared purpose IDs (comma-separated): ',1000)).split(',').map(s=>s.trim()).filter(Boolean),privacyUrl=await ask('Verified provider privacy HTTPS URL (optional): ',2048),justification=await ask('Supporting facts / justification (private): ');
          console.log('Reference '+serviceCatalogSeed.id+' / '+serviceCatalogSeed.revision+'; product revision '+match.product.revision+'. Source URLs are reference metadata; verify actual use.');
          const sourceIds=new Set([...match.product.sourceIds,...match.provider.sourceIds]);for(const source of serviceCatalogSeed.sources.filter(s=>sourceIds.has(s.id)))console.log(`Reference source: ${source.url} · ${source.access==='read'?'retrieved '+source.checkedOn:'URL only; not retrieved or verified'} · ${source.license}`);
          if((await ask('Confirm the actual provider, purpose and location? yes / no [no]: ',16)).toLowerCase()!=='yes')continue;
          try{const selected=createCatalogSelectionPlan(config,serviceCatalogSeed,{productId,serviceId,provider,location,purposeIds,...(privacyUrl?{privacyUrl}:{}),justification,confirmed:true});base=selected.config;catalogSelections.push(selected.selection);console.log('Added a service to the local draft; no integration or permission was enabled.');}
          catch{console.log('Selection was not added. Check the ID, declared purposes, actual provider/location, privacy URL and private justification.');}
        }
      }
      answers=result;
    }finally{ui.close();}
  }
  const plan=createSetupPlan(readSetupAnswers(answers),{...(base===undefined?{}:{config:base}),catalogSelections});
  // A new directory is the write boundary: never overwrite an existing config or report, including symlinks.
  const directory=resolve(options.outDir);await mkdir(directory,{mode:0o700});
  await writeFile(join(directory,'notabenda.config.json'),JSON.stringify(plan.config,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(directory,'setup.private.json'),JSON.stringify(plan.report,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(directory,'.gitignore'),'setup.private.json\n',{flag:'wx'});
  console.log(`Created a draft config and private setup report in ${options.outDir}.`);
  for(const recommendation of plan.report.recommendations)if(recommendation.status!=='declared-no')console.log(`${recommendation.status}: ${recommendation.title}\n  ${recommendation.reason}\n  ${recommendation.requirementIds.join(', ')}\n  Config / integration: ${recommendation.configPaths.join(', ')}\n  Guide: https://notabenda.org/guide/${recommendation.guide}`);
  console.log(`${plan.report.reviewItems.length} review items; ${plan.report.diagnostics.filter(d=>d.severity==='error').length} production validation errors. Review locally; no services were enabled or deployed.`);
}
