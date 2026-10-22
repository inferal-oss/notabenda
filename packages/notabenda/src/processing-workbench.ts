// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH REQ-PRODUCT-CONFIG-SOURCES
import {processingCopy,validProcessingActivities,processingHash} from './processing.js';
import {normalizeProcessingNoticeContent} from './processing-notice-content.js';
import type {ProcessingNoticeContent} from './processing-notice-content.js';
import type {ProcessingActivity} from './types.js';
export interface ProcessingNoticeSettings {schemaVersion:1;reviewedArtifactId:string;scopeId:string;activities:ProcessingActivity[];wording:ProcessingNoticeContent['wording']}
export type ProcessingNoticeFacts=Omit<ProcessingNoticeContent,'scopeId'|'activities'|'wording'>;
export interface ProcessingWorkbenchContext {schemaVersion:1;kind:'notabenda-processing-workbench';facts:ProcessingNoticeFacts;initial?:ProcessingNoticeSettings}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const fail=():never=>{throw Error('Supply complete processing notice settings pinned to this exact public release. Choose a stable scope, explicit activities and all three wording fields.');};
export function normalizeProcessingNoticeSettings(input:unknown):ProcessingNoticeSettings {
 let s:unknown;try{s=processingCopy(input,8192);}catch{return fail();}
 if(!object(s)||!exact(s,['schemaVersion','reviewedArtifactId','scopeId','activities','wording'])||s.schemaVersion!==1||!processingHash(s.reviewedArtifactId)||typeof s.scopeId!=='string'||!/^[a-z][a-z0-9-]{0,119}$/u.test(s.scopeId)||!validProcessingActivities(s.activities)||!object(s.wording)||!exact(s.wording,['title','description','actionLabel']))return fail();
 for(const [key,max] of [['title',300],['description',2000],['actionLabel',120]] as const){const v=s.wording[key];if(typeof v!=='string'||!v.trim()||new TextEncoder().encode(v).length>max||/[\u0000-\u001f\u007f]/u.test(v))return fail();}
 return s as unknown as ProcessingNoticeSettings;
}
export function assembleProcessingNoticeContent(facts:ProcessingNoticeFacts,input:unknown):ProcessingNoticeContent {
 const settings=normalizeProcessingNoticeSettings(input),raw=processingCopy(facts);
 if(!object(raw)||!exact(raw,['schemaVersion','siteId','artifactId','mode','services','document',...(Object.hasOwn(raw,'localization')?['localization']:[])]))return fail();
 const f=raw as unknown as ProcessingNoticeFacts;
 if(settings.reviewedArtifactId!==f.artifactId)return fail();
 return normalizeProcessingNoticeContent({...f,scopeId:settings.scopeId,activities:settings.activities,wording:settings.wording});
}
/** Prepared facts are build-supplied public data. Final compilation must verify the actual artifact again. */
export function normalizeProcessingWorkbenchContext(input:unknown):ProcessingWorkbenchContext {
 const c=processingCopy(input,49152);
 if(!object(c)||!exact(c,['schemaVersion','kind','facts',...(Object.hasOwn(c,'initial')?['initial']:[])])||c.schemaVersion!==1||c.kind!=='notabenda-processing-workbench'||!object(c.facts))return fail();
 const facts=c.facts as unknown as ProcessingNoticeFacts;
 const n=assembleProcessingNoticeContent(facts,{schemaVersion:1,reviewedArtifactId:facts.artifactId,scopeId:'workbench-validation',activities:['sale'],wording:{title:'Workbench validation',description:'Workbench validation',actionLabel:'Workbench validation'}});
 const {scopeId,activities,wording,...normalized}=n;
 const result:ProcessingWorkbenchContext={schemaVersion:1,kind:'notabenda-processing-workbench',facts:normalized};
 if(Object.hasOwn(c,'initial')){const settings=normalizeProcessingNoticeSettings(c.initial);assembleProcessingNoticeContent(normalized,settings);result.initial=settings;}
 return result;
}
export async function formatProcessingNoticeSettings(input:unknown,format:'json'|'yaml'|'markdown'):Promise<string>{
 const s=normalizeProcessingNoticeSettings(input);if(format==='json')return JSON.stringify(s,null,2)+'\n';
 if(format!=='yaml'&&format!=='markdown')throw Error('Choose JSON, YAML or Markdown frontmatter.');
 const yaml=(await import('./config-yaml.js')).formatConfigYaml(s);return format==='markdown'?'---\n'+yaml+'---\n':yaml;
}
export function processingWorkbenchHandoff(format:'json'|'yaml'|'markdown'='yaml'):string{if(!['json','yaml','markdown'].includes(format))throw Error('Choose JSON, YAML or Markdown frontmatter.');const extension=format==='markdown'?'md':format;return 'Save the settings as processing-notice.'+extension+'. Run npx --no-install notabenda processing-notice --artifact ./artifact.json --settings ./processing-notice.'+extension+' --out-dir ./processing-notice-build using the exact final public artifact. Add --preview only for a preview release. Publish its pinned policy files and notice, then connect the real processing controller, host context, recorder and downstream restrictions. Do not change scope to clear an opt-out.';}
