// @requirements REQ-PRODUCT-COLLECTION-REHEARSAL
// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-COLLECTION-FLOW
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeCollectionNoticeContent,renderCollectionNoticePreview} from './collection.js';
import type {CollectionNoticeContent,CollectionNoticeSettings} from './collection.js';
import {normalizeCollectionFlow,renderCollectionFlowPermissionPreview} from './collection-flow.js';
import type {CollectionFlow,CollectionFlowSettings} from './collection-flow.js';
import {assembleFormPermissionContent} from './form-permission-content.js';
import type {FormPermissionContent} from './form-permission.js';
import {normalizeScopeGuardPolicy,scopeGuardFields} from './scope-guard-policy.js';
import {normalizeFormPermissionLocalization} from './form-permission-localization-policy.js';
import type {FormPermissionLocalization} from './form-permission-localization-policy.js';
export type CollectionNoticeFacts=Omit<CollectionNoticeContent,'scopeId'|'reviewStatus'|'wording'>;
export interface CollectionPermissionContext {scopeGuards:{purposeId:string;assessment:FormPermissionContent['facts']['scopeGuard']}[];localization?:FormPermissionLocalization}
export interface CollectionWorkbenchContext {schemaVersion:1;kind:'notabenda-collection-workbench';buildMethod:'configuration'|'final-artifact';facts:CollectionNoticeFacts;permissionContext?:CollectionPermissionContext;initial?:{settings:CollectionFlowSettings;flow:CollectionFlow}}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
const fail=():never=>{throw Error('Use a bounded prepared workbench context and explicit settings for every selected direct purpose.');};
function copy<T>(input:T):T {try{assertPlainCatalogData(input);let bytes=0,nodes=0;const count=(v:unknown):void=>{if(++nodes>10000)return fail();if(typeof v==='string')bytes+=new TextEncoder().encode(JSON.stringify(v)).length;else if(v&&typeof v==='object'){for(const [k,item] of Object.entries(v)){bytes+=new TextEncoder().encode(JSON.stringify(k)).length+2;count(item);}}else bytes+=32;if(bytes>256*1024)return fail();};count(input);if(new TextEncoder().encode(JSON.stringify(input)).length>256*1024)return fail();return structuredClone(input);}catch{return fail();}}
/** Shared selection and wording projection; no release verification or identity generation. */
export function assembleCollectionNoticeContent(facts:CollectionNoticeFacts,settings:CollectionNoticeSettings):CollectionNoticeContent {
 facts=copy(facts);settings=copy(settings);
 if(!settings||!Array.isArray(settings.purposeIds)||settings.purposeIds.length<1||settings.purposeIds.length>8||new Set(settings.purposeIds).size!==settings.purposeIds.length)return fail();
 const purposes=settings.purposeIds.map(id=>{const p=facts.purposes.find(p=>p.id===id);if(!p||p.collection.source==='indirect')return fail();return p;});
 const recipients=facts.recipients.filter(r=>r.purposeIds.some(id=>settings.purposeIds.includes(id))).map(r=>({...r,purposeIds:r.purposeIds.filter(id=>settings.purposeIds.includes(id))}));
 const l=facts.localization;
 if(l&&(settings.wording.detailsLabel!==undefined||settings.wording.privacyLinkLabel!==undefined))throw Error('Set collection link/detail labels in the versioned localization.collection dictionary.');
 return normalizeCollectionNoticeContent({...facts,scopeId:settings.scopeId,reviewStatus:settings.reviewStatus,purposes,recipients,wording:{title:settings.wording.title,intro:settings.wording.intro,detailsLabel:l?.collection.detailsLabel??settings.wording.detailsLabel??'Collection details and your rights',privacyLinkLabel:l?.collection.privacyLinkLabel??settings.wording.privacyLinkLabel??'Read the privacy policy'}});
}
/** A prepared context is public data supplied by the host, not proof of release authenticity. */
export function normalizeCollectionWorkbenchContext(input:unknown):CollectionWorkbenchContext {
 const c=copy(input);
 if(!object(c)||!exact(c,['schemaVersion','kind','buildMethod','facts',...(c.permissionContext===undefined?[]:['permissionContext']),...(c.initial===undefined?[]:['initial'])])||c.schemaVersion!==1||c.kind!=='notabenda-collection-workbench'||typeof c.buildMethod!=='string'||!['configuration','final-artifact'].includes(c.buildMethod)||!object(c.facts))return fail();
 const facts=c.facts as unknown as CollectionNoticeFacts;
 const n=assembleCollectionNoticeContent(facts,{scopeId:'workbench-validation',purposeIds:facts.purposes?.map(p=>p.id),reviewStatus:'draft',wording:{title:'Workbench validation',intro:'Workbench validation'}});
 if(n.purposes.some(p=>p.collection.source!=='direct'))throw Error('This composer supports direct-only purposes. Use the separate notice APIs for mixed or indirect collection.');
 const {scopeId:_,reviewStatus:__,wording:___,...normalizedFacts}=n;
 const result:CollectionWorkbenchContext={schemaVersion:1,kind:'notabenda-collection-workbench',buildMethod:c.buildMethod as CollectionWorkbenchContext['buildMethod'],facts:normalizedFacts};
 if(c.permissionContext!==undefined){
  const p=c.permissionContext;if(!object(p)||!exact(p,['scopeGuards',...(p.localization===undefined?[]:['localization'])])||!Array.isArray(p.scopeGuards)||p.scopeGuards.length!==normalizedFacts.purposes.length)return fail();
  const seen=new Set<string>(),scopeGuards:CollectionPermissionContext['scopeGuards']=[];
  for(const entry of p.scopeGuards){if(!object(entry)||!exact(entry,['purposeId','assessment'])||typeof entry.purposeId!=='string'||seen.has(entry.purposeId)||!normalizedFacts.purposes.some(n=>n.id===entry.purposeId))return fail();seen.add(entry.purposeId);
   const a=entry.assessment;if(a===null){scopeGuards.push({purposeId:entry.purposeId,assessment:null});continue;}
   if(!object(a)||!exact(a,['version','revision','facts']))return fail();const guard=normalizeScopeGuardPolicy({version:a.version,revision:a.revision,site:a.facts},[]);scopeGuards.push({purposeId:entry.purposeId,assessment:{version:1,revision:guard.revision,facts:guard.site}});
  }
  const localization=p.localization===undefined?undefined:normalizeFormPermissionLocalization(p.localization,{locale:normalizedFacts.locale,allowPreview:true});
  if(localization&&normalizedFacts.localization&&localization.direction!==normalizedFacts.localization.direction)return fail();
  result.permissionContext={scopeGuards,...(localization?{localization}:{})};
 }
 if(c.initial!==undefined){
  if(!object(c.initial)||!exact(c.initial,['settings','flow']))return fail();
  const flow=normalizeCollectionFlow(c.initial.flow,{allowPreview:true}),settings=c.initial.settings as unknown as CollectionFlowSettings;
  result.initial={settings,flow};
  const assembled=checkSettings(result,settings);const {noticeId,...notice}=flow.notice;
  if(canonical(assembled.permissions)!==canonical(flow.permissions.map(({offerId:_,...content})=>content))||canonical(assembled.notice)!==canonical(notice)||settings.decisions.length!==flow.routes.length||flow.routes.some(r=>settings.decisions.find(d=>d.purposeId===r.purposeId)?.presentation!==r.presentation))return fail();
 }
 return result;
}
/** Availability comes from the selected release, never from a route choice or legal-basis label. */
export function collectionPermissionAuthoring(context:CollectionWorkbenchContext,purposeId:string):{available:boolean;reason:string}{
 const p=context.permissionContext;if(!p)return {available:false,reason:'Prepare a new workbench from the release to author permission settings. This older context preserves supplied offers only.'};
 const a=p.scopeGuards.find(g=>g.purposeId===purposeId)?.assessment;
 if(!a||scopeGuardFields.some(k=>a.facts[k]!=='absent'))return {available:false,reason:'Separate permission is unavailable for this purpose: its release scope assessment is missing, unknown or restricted. Review the source configuration and rebuild; notice-only authoring remains available.'};
 if(!p.localization&&!/^en(?:-|$)/iu.test(context.facts.locale))return {available:false,reason:'Separate permission needs localization.formPermission messages in this release. Add the complete dictionary and rebuild; notice-only authoring remains available.'};
 return {available:true,reason:'Write a separate choice for this purpose. Ordinary form submission stays independent.'};
}
function checkSettings(context:CollectionWorkbenchContext,input:unknown):{settings:CollectionFlowSettings;notice:CollectionNoticeContent;permissions:FormPermissionContent[]} {
 const value=copy(input);
 if(!object(value)||!exact(value,['reviewedArtifactId','notice','decisions'])||value.reviewedArtifactId!==context.facts.artifactId||!object(value.notice)||!exact(value.notice,['scopeId','purposeIds','reviewStatus','wording'])||!object(value.notice.wording)||Object.keys(value.notice.wording).some(k=>!['title','intro','detailsLabel','privacyLinkLabel'].includes(k))||!Array.isArray(value.decisions))return fail();
 const settings=value as unknown as CollectionFlowSettings,notice=assembleCollectionNoticeContent(context.facts,settings.notice);
 if(settings.decisions.length!==notice.purposes.length||new Set(settings.decisions.map(d=>d?.purposeId)).size!==notice.purposes.length)return fail();
 const permissions:FormPermissionContent[]=[];
 for(const purpose of notice.purposes){
  const d=settings.decisions.find(d=>d?.purposeId===purpose.id);
  if(!d||!object(d))return fail();
  if(d.presentation==='notice-only'){if(!exact(d,['purposeId','presentation']))return fail();}
  else if(d.presentation==='separate-permission'){
   if(!exact(d,['purposeId','presentation','permission'])||!object(d.permission)||!['permissionId','channel','revision','reviewStatus','wording','withdrawalUrl'].every(k=>Object.hasOwn(d.permission,k))||Object.keys(d.permission).some(k=>!['permissionId','channel','revision','reviewStatus','wording','withdrawalUrl','deliveryWindowSeconds','refusal'].includes(k)))return fail();
   if(context.permissionContext){
    const availability=collectionPermissionAuthoring(context,purpose.id);if(!availability.available)throw Error(availability.reason);
    const offer=assembleFormPermissionContent({siteId:context.facts.siteId,artifactId:context.facts.artifactId,mode:context.facts.mode,document:context.facts.document,facts:{controller:context.facts.controller,purpose,recipients:notice.recipients.filter(r=>r.purposeIds.includes(purpose.id)).map(r=>({...r,purposeIds:[purpose.id]})),privacy:context.facts.privacy,scopeGuard:context.permissionContext.scopeGuards.find(g=>g.purposeId===purpose.id)!.assessment},...(context.permissionContext.localization?{localization:context.permissionContext.localization}:{})},{...d.permission,purposeId:purpose.id},{allowPreview:true});
    if(offer.wording.title.trim()===notice.wording.title.trim()||offer.wording.statement.trim()===notice.wording.intro.trim())throw Error('Keep notice information and permission wording distinct. Revise the duplicated heading or statement.');
    permissions.push(offer);
   }else{
   const existing=context.initial?.settings.decisions.find(e=>e.purposeId===purpose.id&&e.presentation==='separate-permission');
   const route=context.initial?.flow.routes.find(r=>r.purposeId===purpose.id&&r.presentation==='separate-permission');
   if(!existing||existing.presentation!=='separate-permission'||!route||route.presentation!=='separate-permission'||canonical(existing.permission)!==canonical(d.permission))throw Error('This permission needs complete host-authored settings in the prepared context. Existing permission wording is preserved; this editor does not create or revise offers.');
   const offer=context.initial!.flow.permissions.find(p=>p.offerId===route.offerId);
   if(!offer||offer.purposeId!==purpose.id)return fail();
   if(offer.wording.title.trim()===notice.wording.title.trim()||offer.wording.statement.trim()===notice.wording.intro.trim())throw Error('Keep notice information and permission wording distinct. Revise the notice heading or introduction.');
   const {permissionId,channel,revision,reviewStatus,wording,withdrawalUrl,deliveryWindowSeconds,refusal}=offer;
   const expected={permissionId,channel,revision,reviewStatus,wording,withdrawalUrl,...(Object.hasOwn(existing.permission,'deliveryWindowSeconds')?{deliveryWindowSeconds}:{}),...(refusal?{refusal}:{})};
   if(canonical(expected)!==canonical(existing.permission))return fail();const {offerId:_,...content}=offer;permissions.push(content);
   }
  }else throw Error('Choose notice-only or separate permission explicitly for every selected purpose.');
 }
 if(new Set(permissions.map(p=>p.permissionId)).size!==permissions.length)throw Error('Use a different permission ID for each selected purpose/channel stream.');
 if(settings.decisions.some(d=>!notice.purposes.some(p=>p.id===d.purposeId)))return fail();
 return {settings,notice,permissions};
}
/** Validated identity-free content for local preview/rehearsal, never a final compiled descriptor. */
export function prepareCollectionFlowPreview(contextInput:unknown,input:unknown,options:{releaseConfirmed:true}):{settings:CollectionFlowSettings;notice:CollectionNoticeContent;permissions:FormPermissionContent[]} {
 if(!options||options.releaseConfirmed!==true)throw Error('Confirm the exact prepared release before trying the form.');
 return checkSettings(normalizeCollectionWorkbenchContext(contextInput),input);
}
/** Export settings only after the operator explicitly chooses this exact release. Final build verification remains required. */
export function prepareCollectionFlowSettings(contextInput:unknown,input:unknown,options:{releaseConfirmed:true;idPrefix?:string}):{settings:CollectionFlowSettings;previewHtml:string} {
 if(!options||options.releaseConfirmed!==true)throw Error('Confirm the exact prepared release before exporting settings.');
 const context=normalizeCollectionWorkbenchContext(contextInput),result=checkSettings(context,input);
 const prefix=options.idPrefix??'workbench-preview',escape=(v:string)=>v.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const previewHtml=`<div class="nb-collection-flow" lang="${escape(result.notice.locale)}"${result.notice.localization?` dir="${result.notice.localization.direction}"`:''}>`+renderCollectionNoticePreview(result.notice,{idPrefix:prefix,headingLevel:3,allowPreview:true})+result.permissions.map(offer=>renderCollectionFlowPermissionPreview(offer,prefix+'-notice',3)).join('')+'</div>';
 return {settings:result.settings,previewHtml};
}

/** Serialize only validated build settings; no private Markdown body notes are added. */
export async function formatCollectionWorkbenchSettings(context:unknown,input:unknown,format:'json'|'yaml'|'markdown'):Promise<string>{
 const settings=prepareCollectionFlowSettings(context,input,{releaseConfirmed:true}).settings;
 if(format==='json')return JSON.stringify(settings,null,2)+'\n';
 if(format!=='yaml'&&format!=='markdown')throw Error('Choose JSON, YAML or Markdown frontmatter.');
 const yaml=(await import('./config-yaml.js')).formatConfigYaml(settings);
 return format==='markdown'?'---\n'+yaml+'---\n':yaml;
}

/** Preserve production artifact identity even when the form wording itself is still draft. */
export function collectionWorkbenchHandoff(contextInput:unknown,input:unknown,extension='yaml'):{kind:'configuration'|'final-artifact';preview:boolean;command:string}{
 if(!['json','yaml','md'].includes(extension))throw Error('Choose a settings file extension.');
 const context=normalizeCollectionWorkbenchContext(contextInput),plan=checkSettings(context,input),draft=plan.notice.reviewStatus==='draft'||plan.permissions.some(p=>p.reviewStatus==='draft'),preview=context.facts.mode==='preview'||draft;
 if(context.buildMethod==='final-artifact'||context.facts.mode==='production'&&draft)return {kind:'final-artifact',preview,command:'createCollectionFlow(finalArtifact, settings'+(preview?", {mode: 'preview'}":'')+') — reuse the exact final artifact; a plain/preview configuration rebuild may have a different ID.'};
 return {kind:'configuration',preview,command:'notabenda build --config notabenda.yaml --collection-flow contact-flow.'+extension+(preview?' --preview':'')+' --out-dir legal-dist'};
}
