// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {normalizePublicLegalArtifact,createProcessingNotice,createRetainedReleaseFiles,canonicalJson} from './content.js';
import {normalizeProcessingNoticeSettings,normalizeProcessingWorkbenchContext} from './processing-workbench.js';
import type {ProcessingNoticeSettings} from './processing-workbench.js';
import type {ValidationOptions} from './types.js';
/** Compile only against the intact final public release. No config recompile or silent repinning. */
export function createProcessingNoticeFromSettings(input:unknown,settings:unknown,options:ValidationOptions={}){
 const artifact=normalizePublicLegalArtifact(input,options),s=normalizeProcessingNoticeSettings(settings);
 if(s.reviewedArtifactId!==artifact.manifest.artifactId)throw Error('The settings name a different release. Review the final artifact before updating its pin.');
 return createProcessingNotice(artifact,{scopeId:s.scopeId,activities:s.activities,wording:s.wording},options);
}
export function createProcessingNoticeFiles(input:unknown,settings:unknown,options:ValidationOptions={}){
 const artifact=normalizePublicLegalArtifact(input,options),notice=createProcessingNoticeFromSettings(artifact,settings,options),body=canonicalJson(notice)+'\n';
 return {notice,files:{...createRetainedReleaseFiles([artifact],{siteId:notice.siteId,mode:options.mode??'production'}),'processing-notice.json':body,['processing-notices/'+notice.noticeId+'.json']:body}};
}
export function prepareProcessingWorkbenchContext(input:unknown,selection:{settings?:ProcessingNoticeSettings}={},options:ValidationOptions={}){
 const artifact=normalizePublicLegalArtifact(input,options);
 // Internal validation copy is discarded; no activity, scope or wording is preselected in a new editor.
 const {noticeId,scopeId,activities,wording,...facts}=createProcessingNotice(artifact,{scopeId:'workbench-validation',activities:['sale'],wording:{title:'Workbench validation',description:'Workbench validation',actionLabel:'Workbench validation'}},options);
 return normalizeProcessingWorkbenchContext({schemaVersion:1,kind:'notabenda-processing-workbench',facts,...(selection.settings?{initial:selection.settings}:{})});
}
export async function createProcessingWorkbenchFiles(input:unknown,selection:{settings?:ProcessingNoticeSettings}={},options:ValidationOptions&{delivery?:'standalone'|'directory'}={}):Promise<Record<string,string>>{
 const context=prepareProcessingWorkbenchContext(input,selection,options),script=await readFile(new URL('./processing-workbench-app.js',import.meta.url),'utf8'),css=(await readFile(new URL('./styles.css',import.meta.url),'utf8'))+'\n'+await readFile(new URL('./processing-workbench.css',import.meta.url),'utf8');
 if(/<\/script/iu.test(script)||/<\/style/iu.test(css))throw Error('Workbench assets cannot be embedded safely.');
 const directory=options.delivery==='directory';if(options.delivery!==undefined&&!directory&&options.delivery!=='standalone')throw Error('Choose standalone or directory delivery.');
 const digest=(v:string)=>createHash('sha256').update(v).digest('base64'),csp=directory?"default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'":`default-src 'none'; script-src 'sha256-${digest(script)}'; style-src 'sha256-${digest(css)}'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'`;
 return {...(directory?{'workbench.js':script,'workbench.css':css}:{}),'index.html':`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><title>Prepare a processing opt-out · Notabenda</title>${directory?'<link rel="stylesheet" href="./workbench.css">':`<style>${css}</style>`}</head><body class="nb-page"><main id="main" class="nb-processing-workbench-host"><header><p class="nb-eyebrow">Notabenda / processing choices</p><h1>Make the opt-out clear.</h1><p>Choose what this action restricts, write its explanation, then build it against your policy release.</p></header><div id="processing-workbench"></div><noscript><p>This local editor needs JavaScript. Use the settings file and processing-notice command directly when JavaScript is unavailable. No choice is recorded here.</p></noscript></main><script type="application/json" id="processing-workbench-context">${JSON.stringify(context).replace(/</gu,'\\u003c')}</script>${directory?'<script type="module" src="./workbench.js"></script>':`<script type="module">${script}</script>`}</body></html>`};
}
