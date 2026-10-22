// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME
import type {Purpose,Service,StorageItem} from './types.js';
import {normalizeGoogleBasic} from './google-basic-policy.js';

/** Internal allowlist projection after validation. Field order is part of saved consent scopes. */
function fields<T extends object,K extends keyof T>(input:T,keys:readonly K[]):Pick<T,K>{
 const result={} as Pick<T,K>;
 for(const key of keys){const value=input[key];if(value!==undefined)result[key]=value;}
 return result;
}
export function publicPurpose(p:Purpose):Purpose{
 return {...fields(p,['id','name','description','legalBasis','legitimateInterests']),dataCategories:[...p.dataCategories],retention:p.retention,collection:fields(p.collection,['source','description','required','consequences'])};
}
export function publicService(s:Service):Service{
 return {...(s.googleBasic===undefined?{}:{googleBasic:normalizeGoogleBasic(s.googleBasic,s.purposeIds)}),...fields(s,['id','name','provider']),purposeIds:[...s.purposeIds],...fields(s,['location','privacyUrl']),...(s.resourceOrigins===undefined?{}:{resourceOrigins:[...s.resourceOrigins]}),...(s.processingActivities===undefined?{}:{processingActivities:[...s.processingActivities]})};
}
export function publicStorage(s:StorageItem):StorageItem{
 return fields(s,['id','name','type','serviceId','duration','classification','exceptionId','necessityReason']);
}
