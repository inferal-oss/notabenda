// @requirements REQ-PRODUCT-MARKETING-AUTHORING REQ-ZA-MARKETING REQ-PRODUCT-CONFIG-SOURCES
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeSouthAfricaMarketingRequest} from './south-africa-marketing-policy.js';
import {normalizeFormRefusalCopy} from './form-refusal-policy.js';
import {normalizeFormPermissionContent} from './form-permission.js';
import {assembleSouthAfricaMarketingContent} from './form-permission-content.js';
import type {FormPermissionPublicFacts} from './form-permission-content.js';
import type {SouthAfricaMarketingSettings,FormPermissionContent} from './form-permission.js';
import {isSafeLink} from './config.js';
export interface MarketingRequestSettings {schemaVersion:1;reviewedArtifactId:string;permission:SouthAfricaMarketingSettings}
export interface MarketingWorkbenchContext {schemaVersion:1;kind:'notabenda-marketing-workbench';locale:string;facts:FormPermissionPublicFacts;initial?:MarketingRequestSettings}
const fail=():never=>{throw Error('Supply complete South African web-request settings for the exact final release, including the future method, request particulars and explicit refusal copy.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
function snapshot(input:unknown,max=65536):unknown {try{assertPlainCatalogData(input);if(new TextEncoder().encode(JSON.stringify(input)).length>max)return fail();return structuredClone(input);}catch{return fail();}}
export function normalizeMarketingRequestSettings(input:unknown):MarketingRequestSettings {
 const s=snapshot(input,32768);
 if(!object(s)||!exact(s,['schemaVersion','reviewedArtifactId','permission'])||s.schemaVersion!==1||typeof s.reviewedArtifactId!=='string'||!/^[a-f0-9]{64}$/u.test(s.reviewedArtifactId)||!object(s.permission))return fail();
 const p=s.permission;
 if(!exact(p,['permissionId','purposeId','revision','reviewStatus','wording','withdrawalUrl','methodLabel','marketingRequest','refusal'],['deliveryWindowSeconds'])||!slug(p.permissionId)||!slug(p.purposeId)||!text(p.revision,200)||!['draft','reviewed'].includes(p.reviewStatus as string)||!text(p.methodLabel,120)||!text(p.withdrawalUrl,2048)||!isSafeLink(p.withdrawalUrl)||!object(p.wording)||!exact(p.wording,['title','statement','grantLabel','withdrawLabel','optionality','withdrawalExplanation']))return fail();
 for(const [key,v] of Object.entries(p.wording))if(!text(v,key.endsWith('Label')?120:key==='title'?300:2000))return fail();
 if(Object.hasOwn(p,'deliveryWindowSeconds')&&(!Number.isInteger(p.deliveryWindowSeconds)||Number(p.deliveryWindowSeconds)<30||Number(p.deliveryWindowSeconds)>3600))return fail();
 p.marketingRequest=normalizeSouthAfricaMarketingRequest(p.marketingRequest);p.refusal=normalizeFormRefusalCopy(p.refusal);
 return s as unknown as MarketingRequestSettings;
}
export function assembleMarketingRequestContent(facts:FormPermissionPublicFacts,input:unknown):FormPermissionContent {
 const settings=normalizeMarketingRequestSettings(input),f=snapshot(facts) as FormPermissionPublicFacts;
 if(settings.reviewedArtifactId!==f.artifactId||settings.permission.purposeId!==f.facts.purpose.id)throw Error('The settings name another release or purpose. Prepare a context for the intended purpose.');
 return assembleSouthAfricaMarketingContent(f,settings.permission,{allowPreview:true});
}
/** Validate only the selected release-owned facts. No marketing approach or grant is authorized. */
export function normalizeMarketingWorkbenchContext(input:unknown):MarketingWorkbenchContext {
 const c=snapshot(input);
 if(!object(c)||!exact(c,['schemaVersion','kind','locale','facts'],['initial'])||c.schemaVersion!==1||c.kind!=='notabenda-marketing-workbench'||!text(c.locale,80)||!object(c.facts)||!exact(c.facts,['siteId','artifactId','mode','document','facts'],['localization']))return fail();
 const f=c.facts as unknown as FormPermissionPublicFacts;
 const sample={schemaVersion:1,reviewedArtifactId:f.artifactId,permission:{permissionId:'workbench-validation',purposeId:f.facts?.purpose?.id,revision:'workbench-validation',reviewStatus:'draft',methodLabel:'Workbench validation',marketingRequest:{profile:'za-popia-web-request',version:1,goodsServices:'Workbench validation',method:'email',labels:{goodsServices:'Workbench validation',method:'Workbench validation',responsibleParty:'Workbench validation'}},refusal:{label:'Workbench validation',recorded:'Workbench validation',pending:'Workbench validation',retry:'Workbench validation'},wording:{title:'Workbench validation',statement:'Workbench validation',grantLabel:'Workbench validation',withdrawLabel:'Workbench validation',optionality:'Workbench validation',withdrawalExplanation:'Workbench validation'},withdrawalUrl:'/workbench-validation'}};
 const n=assembleMarketingRequestContent(f,sample);
 if(n.facts.purpose.collection.source==='indirect'||!/^en(?:-|$)/iu.test(c.locale)&&!n.localization||n.localization&&n.localization.locale!==c.locale)throw Error('Use a direct or mixed-source purpose and the release’s complete matching permission dictionary.');
 const {siteId,artifactId,mode,document,facts,localization}=normalizeFormPermissionContent(n);
 const result:MarketingWorkbenchContext={schemaVersion:1,kind:'notabenda-marketing-workbench',locale:c.locale,facts:{siteId,artifactId,mode,document,facts,...(localization?{localization}:{})}};
 if(Object.hasOwn(c,'initial')){const initial=normalizeMarketingRequestSettings(c.initial);assembleMarketingRequestContent(result.facts,initial);result.initial=initial;}
 return result;
}
export async function formatMarketingRequestSettings(input:unknown,format:'json'|'yaml'|'markdown'):Promise<string>{
 const s=normalizeMarketingRequestSettings(input);if(format==='json')return JSON.stringify(s,null,2)+'\n';
 if(format!=='yaml'&&format!=='markdown')throw Error('Choose JSON, YAML or Markdown frontmatter.');
 const yaml=(await import('./config-yaml.js')).formatConfigYaml(s);return format==='markdown'?'---\n'+yaml+'---\n':yaml;
}
export function marketingWorkbenchHandoff(format:'json'|'yaml'|'markdown'='yaml'):string {
 if(!['json','yaml','markdown'].includes(format))throw Error('Choose JSON, YAML or Markdown frontmatter.');const ext=format==='markdown'?'md':format;
 return 'Save marketing-request.'+ext+'. Run npx --no-install notabenda marketing-request --artifact ./artifact.json --settings ./marketing-request.'+ext+' --out-dir ./marketing-request-build against the exact final artifact. Add --preview for a preview artifact or draft wording. Publish the pinned files, then archive and activate the exact offer separately. The host supplies identity, recording, invitation eligibility/history and actual sending/suppression. A method change needs a different stable permission; changing a stream or revision cannot reset prior withholding.';
}
