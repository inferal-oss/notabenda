// @requirements REQ-PRODUCT-CONFIG-SOURCES
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SETUP */
import {createInterface} from 'node:readline/promises';
import {lstat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {readCliJson} from './cli-json.js';
import {readSiteConfig} from './config-source.js';
import {loadServiceCatalog} from './catalog-node.js';
import {readSetupCatalogSelections} from './catalog-selection.js';
import {prepareCatalogSelectionReview,confirmCatalogSelectionReview,readSetupCatalogRevisions} from './catalog-review.js';
import type {CatalogSelectionReview} from './catalog-review.js';
import {createSetupPlan,readSetupAnswers} from './setup.js';
export async function promptCatalogSelectionReview(config:unknown,review:CatalogSelectionReview,ask:(prompt:string,max:number)=>Promise<string>):Promise<ReturnType<typeof confirmCatalogSelectionReview>|undefined>{
 console.log('Catalog selection review · '+review.currentService.id);
 console.log('Changed areas: '+(review.changes.join(', ')||'none; explicit review still required'));
 for(const [label,selection] of [['Prior review',review.previous],['Proposed review',review.proposed]] as const){
  console.log(`\n${label}\n${selection.service.name} / ${selection.service.provider}\nLocation: ${selection.service.location}\nPrivacy URL: ${selection.service.privacyUrl??'not declared'}\nReference: ${selection.reference.id} / ${selection.reference.revision}`);
  console.log('Reviewed purposes: '+JSON.stringify(selection.purposes,null,2));console.log('Selected reference facts: '+JSON.stringify(selection.reference,null,2));
 }
 console.log('Enforcement settings and other inventory are preserved. Reference metadata does not establish verified provider practices. This updates a local draft only.');
 const justification=await ask('Supporting facts for this renewed review (private): ',4000);
 if((await ask('Confirm these provider, purpose and reference facts? yes / no [no]: ',16)).toLowerCase()!=='yes')return undefined;
 return confirmCatalogSelectionReview(config,review,{confirmed:true,justification});
}
export async function runCatalogReviewCli(args:string[]):Promise<void>{
 let configPath:string|undefined,reportPath:string|undefined,serviceId:string|undefined,catalogPath:string|undefined,out:string|undefined,latest=false;const seen=new Set<string>();
 while(args.length){const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate catalog review option.');seen.add(flag);if(flag==='--latest'){latest=true;continue;}
  if(!['--config','--report','--service','--catalog','--out-dir'].includes(flag))throw Error('Use catalog review --config FILE --report FILE --service ID --out-dir NEW [--catalog FILE | --latest].');
  const value=args.shift();if(!value||value.startsWith('--'))throw Error('Catalog review option requires a value.');
  if(flag==='--config')configPath=value;else if(flag==='--report')reportPath=value;else if(flag==='--service')serviceId=value;else if(flag==='--catalog')catalogPath=value;else out=value;
 }
 if(!configPath||!reportPath||!serviceId||!out||latest&&catalogPath)throw Error('Supply config, private report, local service ID and a new output directory. Choose either --latest or --catalog FILE.');
 if(!process.stdin.isTTY||!process.stdout.isTTY)throw Error('Catalog re-review needs a terminal for explicit confirmation. Use the catalog/review API for a host-owned review workflow.');
 const directory=resolve(out);try{await lstat(directory);throw Object.assign(Error('Output already exists.'),{code:'EEXIST'});}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const config=await readSiteConfig(configPath,{mode:'preview'}),report=await readCliJson(reportPath,512*1024,'Report must be ordinary bounded UTF-8 JSON.');
 const answers=readSetupAnswers(report),selections=readSetupCatalogSelections(report),history=readSetupCatalogRevisions(report),previous=selections.filter(s=>s.service.id===serviceId);
 if(previous.length!==1)throw Error('Choose exactly one existing catalog selection from the private report.');
 const catalog=latest||catalogPath?await loadServiceCatalog(catalogPath):undefined,review=prepareCatalogSelectionReview(config,previous[0],catalog);
 const ui=createInterface({input:process.stdin,output:process.stdout});let result:ReturnType<typeof confirmCatalogSelectionReview>|undefined;
 try{result=await promptCatalogSelectionReview(config,review,async(prompt,max)=>{const value=(await ui.question(prompt)).trim();if(value.length>max)throw Error('Answer is too long.');return value;});}finally{ui.close();}
 if(!result){console.log('Review cancelled. No files or pins changed.');return;}
 const plan=createSetupPlan(answers,{config:result.config,catalogSelections:selections.map(s=>s.service.id===serviceId?result!.selection:s),catalogSelectionRevisions:[...history,result.revision],preserveConfig:true});
 await mkdir(directory,{mode:0o700});
 for(const [name,value] of [['notabenda.config.json',plan.config],['setup.private.json',plan.report]] as const)await writeFile(join(directory,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 await writeFile(join(directory,'.gitignore'),'setup.private.json\n',{flag:'wx',mode:0o600});
 console.log('Created a new local draft and private report. Prior and renewed pins are retained in catalogSelectionRevisions. Nothing was published or enabled.');
}
