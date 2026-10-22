// @requirements REQ-PRODUCT-MARKETING-AUTHORING REQ-ZA-MARKETING
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {normalizePublicLegalArtifact,createSouthAfricaMarketingOffer,createRetainedReleaseFiles,canonicalJson} from './content.js';
import {normalizeMarketingRequestSettings,normalizeMarketingWorkbenchContext} from './marketing-workbench.js';
import type {MarketingRequestSettings} from './marketing-workbench.js';
import type {ValidationOptions} from './types.js';
/** Data settings bind to one intact final release; no configuration recompile or automatic repinning. */
export function createMarketingRequestFromSettings(input:unknown,settings:unknown,options:ValidationOptions={}){
 const artifact=normalizePublicLegalArtifact(input,options),s=normalizeMarketingRequestSettings(settings);
 if(s.reviewedArtifactId!==artifact.manifest.artifactId)throw Error('The settings name another release. Review the exact final artifact before updating the pin.');
 return createSouthAfricaMarketingOffer(artifact,s.permission,options);
}
export function createMarketingRequestFiles(input:unknown,settings:unknown,options:ValidationOptions={}){
 const artifact=normalizePublicLegalArtifact(input,options),offer=createMarketingRequestFromSettings(artifact,settings,options),body=canonicalJson(offer)+'\n';
 return {offer,files:{...createRetainedReleaseFiles([artifact],{siteId:offer.siteId,mode:options.mode??'production'}),'marketing-request.json':body,['form-permissions/'+offer.offerId+'.json']:body}};
}
/** Only public facts for the explicitly chosen direct/mixed-source purpose enter this context. */
export function prepareMarketingWorkbenchContext(input:unknown,selection:{purposeId:string;settings?:MarketingRequestSettings},options:ValidationOptions={}){
 const artifact=normalizePublicLegalArtifact(input,options);
 const base=createSouthAfricaMarketingOffer(artifact,{permissionId:'workbench-validation',purposeId:selection.purposeId,revision:'workbench-validation',reviewStatus:'draft',methodLabel:'Workbench validation',marketingRequest:{profile:'za-popia-web-request',version:1,goodsServices:'Workbench validation',method:'email',labels:{goodsServices:'Workbench validation',method:'Workbench validation',responsibleParty:'Workbench validation'}},refusal:{label:'Workbench validation',recorded:'Workbench validation',pending:'Workbench validation',retry:'Workbench validation'},wording:{title:'Workbench validation',statement:'Workbench validation',grantLabel:'Workbench validation',withdrawLabel:'Workbench validation',optionality:'Workbench validation',withdrawalExplanation:'Workbench validation'},withdrawalUrl:'/workbench-validation'},{mode:'preview'});
 const {siteId,artifactId,mode,document,facts,localization}=base;
 return normalizeMarketingWorkbenchContext({schemaVersion:1,kind:'notabenda-marketing-workbench',locale:artifact.publicConfig.site.locale,facts:{siteId,artifactId,mode,document,facts,...(localization?{localization}:{})},...(selection.settings?{initial:selection.settings}:{})});
}
export async function createMarketingWorkbenchFiles(input:unknown,selection:{purposeId:string;settings?:MarketingRequestSettings},options:ValidationOptions&{delivery?:'standalone'|'directory'}={}):Promise<Record<string,string>>{
 const context=prepareMarketingWorkbenchContext(input,selection,options),script=await readFile(new URL('./marketing-workbench-app.js',import.meta.url),'utf8'),css=(await readFile(new URL('./styles.css',import.meta.url),'utf8'))+'\n'+await readFile(new URL('./marketing-workbench.css',import.meta.url),'utf8');
 if(/<\/script/iu.test(script)||/<\/style/iu.test(css))throw Error('Workbench assets cannot be embedded safely.');
 const directory=options.delivery==='directory';if(options.delivery!==undefined&&!directory&&options.delivery!=='standalone')throw Error('Choose standalone or directory delivery.');
 const digest=(v:string)=>createHash('sha256').update(v).digest('base64'),csp=directory?"default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'":`default-src 'none'; script-src 'sha256-${digest(script)}'; style-src 'sha256-${digest(css)}'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'`;
 return {...(directory?{'workbench.js':script,'workbench.css':css}:{}),'index.html':`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><title>Prepare a marketing request · Notabenda</title>${directory?'<link rel="stylesheet" href="./workbench.css">':`<style>${css}</style>`}</head><body class="nb-page"><main id="main" class="nb-processing-workbench-host"><header><p class="nb-eyebrow">Notabenda / South African web requests</p><h1>Make the request specific.</h1><p>Explain the products, future contact method and separate choice. Build against the exact policy release.</p></header><div id="marketing-workbench"></div><noscript><p>This local editor needs JavaScript. Use a settings file and the marketing-request command instead. No permission is recorded here.</p></noscript></main><script type="application/json" id="marketing-workbench-context">${JSON.stringify(context).replace(/</gu,'\\u003c')}</script>${directory?'<script type="module" src="./workbench.js"></script>':`<script type="module">${script}</script>`}</body></html>`};
}
