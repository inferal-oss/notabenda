// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
import {readCliJson} from './cli-json.js';
import {toPublicConfig} from './config.js';
import {createStarterConfig} from './starter.js';
import {createRightsDraftPlan,normalizeRightsDraftInput} from './setup-rights.js';
import type {SiteConfig} from './types.js';

export async function applySetupRightsFile(base:SiteConfig|undefined,path:string):Promise<SiteConfig>{
 const input=normalizeRightsDraftInput(await readCliJson(path,128*1024,'Request-page input must be ordinary UTF-8 JSON no larger than 128 KiB.'));
 const snapshot=toPublicConfig(base??createStarterConfig(),{mode:'preview'});
 const plan=createRightsDraftPlan(base??snapshot,{baseline:snapshot,settings:input.settings,linkPrivacyToPage:input.linkPrivacyToPage});
 console.log('Request page prepared in the local draft; privacy.rightsUrl now uses '+plan.privacyLink.to+'. No workflow was contacted, verified or deployed.');
 return plan.config;
}
/** Interactive setup can review the same explicit JSON proposal used by agents. */
export async function reviewSetupRights(base:SiteConfig|undefined,ask:(prompt:string,max?:number)=>Promise<string>):Promise<SiteConfig|undefined>{
 if((await ask('Configure a privacy request page from a complete JSON proposal? yes / no [no]: ',16)).toLowerCase()!=='yes')return base;
 try{
  const path=await ask('Request-page JSON file (blank cancels): ',4096);if(!path)return base;
  const input=normalizeRightsDraftInput(await readCliJson(path,128*1024,'Request-page input must be ordinary UTF-8 JSON no larger than 128 KiB.'));
  const snapshot=toPublicConfig(base??createStarterConfig(),{mode:'preview'});
  const proposal=createRightsDraftPlan(base??snapshot,{baseline:snapshot,settings:input.settings,linkPrivacyToPage:input.linkPrivacyToPage});
  console.log('Proposed public request page:\n'+JSON.stringify(input.settings,null,2)+'\nPrivacy link: '+(proposal.privacyLink.from??'none')+' → '+proposal.privacyLink.to+'. No former destination is copied into an action.');
  if((await ask('Save this page and replace the privacy link in the local draft? yes / no [no]: ',16)).toLowerCase()!=='yes')return base;
  return createRightsDraftPlan(base??snapshot,{baseline:snapshot,settings:input.settings,linkPrivacyToPage:true}).config;
 }catch(e){console.log((e instanceof Error?e.message:'Check the request-page proposal.')+' No request-page changes were confirmed.');return base;}
}
