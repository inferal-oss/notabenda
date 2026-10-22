// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-COLLECTION-FLOW
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {normalizePublicLegalArtifact,createCollectionNotice,createCollectionFlow,compileLegalDocuments} from './content.js';
import {normalizeCollectionWorkbenchContext} from './collection-workbench.js';
import type {CollectionWorkbenchContext} from './collection-workbench.js';
import type {CollectionFlowSettings} from './collection-flow.js';
import type {ValidationOptions} from './types.js';
/** Prepare public facts from an intact host-selected final release. No private source/config notes are copied. */
export function prepareCollectionWorkbenchContext(input:unknown,selection:{purposeIds:readonly string[];settings?:CollectionFlowSettings},options:ValidationOptions={}):CollectionWorkbenchContext {
 const artifact=normalizePublicLegalArtifact(input,options);
 const notice=createCollectionNotice(artifact,{scopeId:'form-notice',purposeIds:selection.purposeIds,reviewStatus:'draft',wording:{title:'Unconfigured notice',intro:'Write the form-specific introduction in the workbench.'}},{mode:'preview'});
 const {noticeId,scopeId,reviewStatus,wording,...facts}=notice;
 const initial=selection.settings===undefined?undefined:{settings:selection.settings,flow:createCollectionFlow(artifact,selection.settings,{mode:'preview'})};
 let buildMethod:CollectionWorkbenchContext['buildMethod']='final-artifact';
 try{if(compileLegalDocuments(artifact.publicConfig,{mode:artifact.manifest.mode}).manifest.artifactId===artifact.manifest.artifactId)buildMethod='configuration';}catch{}
 return normalizeCollectionWorkbenchContext({schemaVersion:1,kind:'notabenda-collection-workbench',buildMethod,facts,...(initial?{initial}:{})});
}
/** A self-contained local HTML tool. It exports settings, never authoritative fragments or descriptors. */
export async function createCollectionWorkbenchFiles(input:unknown,selection:{purposeIds:readonly string[];settings?:CollectionFlowSettings},options:ValidationOptions&{delivery?:'standalone'|'directory'}={}):Promise<Record<string,string>> {
 const context=prepareCollectionWorkbenchContext(input,selection,options),script=await readFile(new URL('./collection-workbench-app.js',import.meta.url),'utf8');
 if(/<\/script/iu.test(script))throw Error('Workbench script cannot be embedded safely.');
 const css=(await readFile(new URL('./styles.css',import.meta.url),'utf8'))+'\n'+await readFile(new URL('./collection-workbench.css',import.meta.url),'utf8');
 if(/<\/style/iu.test(css))throw Error('Workbench styles cannot be embedded safely.');
 const digest=(v:string)=>createHash('sha256').update(v).digest('base64'),data=JSON.stringify(context).replace(/</gu,'\\u003c');
 const directory=options.delivery==='directory';if(options.delivery!==undefined&&!directory&&options.delivery!=='standalone')throw Error('Choose standalone or directory delivery.');
 const csp=directory?"default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'":`default-src 'none'; script-src 'sha256-${digest(script)}'; style-src 'sha256-${digest(css)}'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'`;
 return {...(directory?{'workbench.js':script,'workbench.css':css}:{}),'index.html':`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><title>Prepare a form notice · Notabenda</title>${directory?'<link rel="stylesheet" href="./workbench.css">':`<style>${css}</style>`}</head><body class="nb-page"><main id="main" class="nb-collection-workbench-host"><header><p class="nb-eyebrow">Notabenda / form notices</p><h1>Explain what this form collects.</h1><p>Choose its purposes, write the notice, then decide which uses need a separate permission.</p></header><div id="collection-workbench"></div><noscript><p>This local editor needs JavaScript. Use the collection-flow settings file and build command directly when JavaScript is unavailable. This page creates no permission or form submission.</p></noscript></main><script type="application/json" id="collection-workbench-context">${data}</script>${directory?'<script type="module" src="./workbench.js"></script>':`<script type="module">${script}</script>`}</body></html>`};
}
