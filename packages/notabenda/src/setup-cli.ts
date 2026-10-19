// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
/** @requirements REQ-PRODUCT-SETUP */
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
  const base=options.configPath?toPublicConfig(await readJson(options.configPath),{mode:'preview'}):undefined;let answers:unknown;
  if(options.answersPath)answers=await readJson(options.answersPath);
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
      const inventory=(base as {storage?:{id:string;classification:string}[]}|undefined)?.storage;
      if(Array.isArray(inventory))for(const item of inventory)if(item.classification==='necessary')result.storageJustifications![item.id]=await ask(`Private justification for necessary storage “${item.id}”: `);
      answers=result;
    }finally{ui.close();}
  }
  const plan=createSetupPlan(readSetupAnswers(answers),base===undefined?{}:{config:base});
  // A new directory is the write boundary: never overwrite an existing config or report, including symlinks.
  const directory=resolve(options.outDir);await mkdir(directory,{mode:0o700});
  await writeFile(join(directory,'notabenda.config.json'),JSON.stringify(plan.config,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(directory,'setup.private.json'),JSON.stringify(plan.report,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(directory,'.gitignore'),'setup.private.json\n',{flag:'wx'});
  console.log(`Created a draft config and private setup report in ${options.outDir}.`);
  for(const recommendation of plan.report.recommendations)if(recommendation.status!=='declared-no')console.log(`${recommendation.status}: ${recommendation.title}\n  ${recommendation.reason}\n  ${recommendation.requirementIds.join(', ')}\n  Config / integration: ${recommendation.configPaths.join(', ')}\n  Guide: https://notabenda.org/guide/${recommendation.guide}`);
  console.log(`${plan.report.reviewItems.length} review items; ${plan.report.diagnostics.filter(d=>d.severity==='error').length} production validation errors. Review locally; no services were enabled or deployed.`);
}
