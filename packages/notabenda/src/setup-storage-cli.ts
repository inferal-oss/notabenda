// @requirements REQ-PRODUCT-STORAGE-AUTHORING
import {readCliJson} from './cli-json.js';
import {toPublicConfig} from './config.js';
import {createStarterConfig} from './starter.js';
import {createStorageDraftPlan,normalizeStorageDraftInput,serializeStorageDraftReview,storageDraftReviewStep} from './setup-storage.js';
import type {StorageDraftPlan} from './setup-storage.js';
import type {SiteConfig} from './types.js';
export function storageDraftReview(plan:StorageDraftPlan){return JSON.parse(serializeStorageDraftReview([storageDraftReviewStep(plan)]));}
export async function readSetupStorageProposal(path:string){return normalizeStorageDraftInput(await readCliJson(path,128*1024,'Storage proposal must be ordinary UTF-8 JSON no larger than 128 KiB.'));}
export async function applySetupStorageFile(base:SiteConfig|undefined,path:string):Promise<StorageDraftPlan>{
 const proposal=await readSetupStorageProposal(path),snapshot=toPublicConfig(base??createStarterConfig(),{mode:'preview'});
 const plan=await createStorageDraftPlan(base??snapshot,{baseline:snapshot,changes:proposal.changes,serviceScopes:proposal.serviceScopes});
 console.log('Prepared '+plan.changes.length+' storage declaration change(s) in the local draft. No storage, loader, permission or deployment was changed.');return plan;
}
export async function reviewSetupStorage(base:SiteConfig|undefined,ask:(prompt:string,max?:number)=>Promise<string>):Promise<StorageDraftPlan|undefined>{
 if((await ask('Review storage declarations from a complete JSON proposal? yes / no [no]: ',16)).toLowerCase()!=='yes')return;
 try{const path=await ask('Storage proposal JSON file (blank cancels): ',4096);if(!path)return;const proposal=await readSetupStorageProposal(path),snapshot=toPublicConfig(base??createStarterConfig(),{mode:'preview'}),plan=await createStorageDraftPlan(base??snapshot,{baseline:snapshot,changes:proposal.changes,serviceScopes:proposal.serviceScopes});
  console.log(JSON.stringify(storageDraftReview(plan),null,2));
  if((await ask('Save these inventory and material-version changes in the local draft? yes / no [no]: ',16)).toLowerCase()!=='yes')return;
  return await createStorageDraftPlan(base??snapshot,{baseline:snapshot,changes:proposal.changes,serviceScopes:proposal.serviceScopes});
 }catch(e){console.log((e instanceof Error?e.message:'Check the storage proposal.')+' No storage changes were confirmed.');return;}
}
