// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS
import {assertPlainCatalogData} from './catalog-plain.js';
import {createCollectionNotice,createFormPermissionOffer,canonicalJson,sha256} from './content.js';
import type {LegalArtifact} from './content.js';
import {normalizeCollectionFlow} from './collection-flow.js';
import type {CollectionFlow,CollectionFlowSettings,CollectionFlowDecision} from './collection-flow.js';
import type {FormPermissionOffer} from './form-permission.js';
import type {ValidationOptions} from './types.js';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const fail=():never=>{throw Error('Choose an explicit presentation for every direct-collection purpose after reviewing this exact artifact. No legal basis or consent route is inferred.');};
/** Produces display and permission descriptors; never chooses a processing condition or records a choice. */
export function createCollectionFlow(artifact:LegalArtifact,settings:CollectionFlowSettings,options:ValidationOptions={}):CollectionFlow{
 try{assertPlainCatalogData(settings);}catch{return fail();}
 if(!object(settings)||!exact(settings,['reviewedArtifactId','notice','decisions'])||settings.reviewedArtifactId!==artifact?.manifest?.artifactId||!Array.isArray(settings.decisions)||!settings.decisions.length||settings.decisions.length>8)return fail();
 if(!object(settings.notice)||!exact(settings.notice,['scopeId','purposeIds','reviewStatus','wording'])||!object(settings.notice.wording)||!exact(settings.notice.wording,['title','intro'],['detailsLabel','privacyLinkLabel']))return fail();
 const notice=createCollectionNotice(artifact,settings.notice,options),decisions=settings.decisions;
 if(decisions.length!==notice.purposes.length||new Set(decisions.map(d=>d?.purposeId)).size!==decisions.length||decisions.some(d=>!object(d)||!notice.purposes.some(p=>p.id===d.purposeId)))return fail();
 const permissions:FormPermissionOffer[]=[],routes:CollectionFlow['routes']=[];
 for(const purpose of notice.purposes){
  const d=decisions.find(d=>d.purposeId===purpose.id)!;
  if(d.presentation==='notice-only'){
   if(!exact(d,['purposeId','presentation']))return fail();routes.push({purposeId:purpose.id,presentation:'notice-only'});
  }else if(d.presentation==='separate-permission'){
   if(!exact(d,['purposeId','presentation','permission'])||!object(d.permission)||!exact(d.permission,['permissionId','channel','revision','reviewStatus','wording','withdrawalUrl'],['deliveryWindowSeconds','refusal']))return fail();
   const offer=createFormPermissionOffer(artifact,{...d.permission,purposeId:purpose.id},options);permissions.push(offer);routes.push({purposeId:purpose.id,presentation:'separate-permission',offerId:offer.offerId});
  }else return fail();
 }
 const flow=normalizeCollectionFlow({schemaVersion:1,kind:'notabenda-collection-flow',flowId:'0'.repeat(64),siteId:notice.siteId,artifactId:notice.artifactId,mode:notice.mode,notice,routes,permissions},{allowPreview:options.mode==='preview'});
 const {flowId:_,...body}=flow;return {...flow,flowId:sha256(canonicalJson(body))};
}
/** Rebuild every route and offer against a trusted intact release; hashes alone do not establish trust. */
export function verifyCollectionFlow(input:unknown,artifact:LegalArtifact,options:ValidationOptions={}):CollectionFlow{
 const flow=normalizeCollectionFlow(input,{allowPreview:options.mode==='preview'}),n=flow.notice;
 const decisions:CollectionFlowDecision[]=flow.routes.map(route=>{
  if(route.presentation==='notice-only')return {purposeId:route.purposeId,presentation:'notice-only'};
  const offer=flow.permissions.find(p=>p.offerId===route.offerId)!;
  const {permissionId,channel,revision,reviewStatus,wording,withdrawalUrl,deliveryWindowSeconds,refusal}=offer;
  return {purposeId:route.purposeId,presentation:'separate-permission',permission:{permissionId,channel,revision,reviewStatus,wording,withdrawalUrl,deliveryWindowSeconds,...(refusal?{refusal}:{})}};
 });
 const expected=createCollectionFlow(artifact,{reviewedArtifactId:flow.artifactId,notice:{scopeId:n.scopeId,purposeIds:n.purposes.map(p=>p.id),reviewStatus:n.reviewStatus,wording:{title:n.wording.title,intro:n.wording.intro,...(n.schemaVersion===1?{detailsLabel:n.wording.detailsLabel,privacyLinkLabel:n.wording.privacyLinkLabel}:{})}},decisions},options);
 if(canonicalJson(flow)!==canonicalJson(expected))throw Error('The collection flow does not match the reviewed release, selected purpose facts or exact permission offers.');
 return expected;
}
