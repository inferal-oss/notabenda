// @requirements REQ-PRODUCT-TERMS-AUTHORING
import {readCliJson} from './cli-json.js';
import {toPublicConfig} from './config.js';
import {createStarterConfig} from './starter.js';
import {createTermsDraftPlan,normalizeTermsDraftInput} from './setup-terms.js';
import type {SiteConfig} from './types.js';
const readProposal=async(path:string)=>normalizeTermsDraftInput(await readCliJson(path,128*1024,'Agreement input must be ordinary UTF-8 JSON no larger than 128 KiB.'));
export async function applySetupTermsFile(base:SiteConfig|undefined,path:string):Promise<SiteConfig>{
 const snapshot=toPublicConfig(base??createStarterConfig(),{mode:'preview'});
 const plan=createTermsDraftPlan(snapshot,{baseline:snapshot,input:await readProposal(path)});
 console.log('Agreement settings saved as a local draft. Review the wording and generate offers from the final release; no backend offer was activated or retired.');
 return plan.config;
}
/** Review the same explicit batch used by agents; no default legal wording is supplied. */
export async function reviewSetupTerms(base:SiteConfig|undefined,ask:(prompt:string,max?:number)=>Promise<string>):Promise<SiteConfig|undefined>{
 if((await ask('Configure terms agreement wording from a JSON proposal? yes / no [no]: ',16)).toLowerCase()!=='yes')return base;
 try{
  const path=await ask('Agreement settings JSON file (blank cancels): ',4096);if(!path)return base;
  const snapshot=toPublicConfig(base??createStarterConfig(),{mode:'preview'}),input=await readProposal(path);
  const plan=createTermsDraftPlan(snapshot,{baseline:snapshot,input});
  console.log('Proposed agreement changes:\n'+JSON.stringify(input.changes,null,2)+'\nThese settings remain draft. Removing a scope does not deactivate an existing backend offer.');
  if((await ask('Save these agreement settings in the local draft? yes / no [no]: ',16)).toLowerCase()!=='yes')return base;
  return createTermsDraftPlan(base??snapshot,{baseline:snapshot,input}).config;
 }catch(error){console.log((error instanceof Error?error.message:'Check the agreement proposal.')+' No agreement changes were confirmed.');return base;}
}
