// @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {toPublicConfig} from 'notabenda';
import {compileLegalDocuments} from 'notabenda/content';
import {renderServiceDirectoryPage} from 'notabenda/services';
export function serviceExampleConfig(base){
 const config=structuredClone(base);config.site.id='juniper-services';
 const purpose=(id,name,description,dataCategories,retention)=>({id,name,description,dataCategories,retention,legalBasis:'Illustrative basis; assess actual processing before use.',collection:{source:'direct',description:'Information supplied by a visitor or their browser.',required:false,consequences:'Related optional features may be unavailable.'}});
 config.purposes=[
  purpose('delivery','Delivering the website','Serve pages and protect the site from abusive requests.',['Request metadata','IP address'],'Request logs: 7 days in this example.'),
  purpose('enquiries','Replying to messages','Deliver your message to the studio and send a reply.',['Name','Email address','Message'],'Until resolved, then 90 days in this example.'),
  purpose('preferences','Remembering preferences','Keep the display setting you deliberately selected.',['Display setting'],'30 days in this example.'),
  purpose('measurement','Understanding readership','Measure which pages are useful, when you allow optional measurement.',['Page viewed','Approximate region'],'Aggregated reports: 30 days in this example.'),
 ];
 config.services=[
  {id:'hosting',name:'Website hosting',provider:'Fieldline Cloud',location:'Ireland',purposeIds:['delivery'],privacyUrl:'https://fieldline.example.test/privacy'},
  {id:'mail',name:'Message delivery',provider:'Brookpost',location:'Germany',purposeIds:['enquiries'],privacyUrl:'https://brookpost.example.test/privacy'},
  {id:'preferences',name:'Display preferences',provider:'Juniper Notes',location:'Your browser',purposeIds:['preferences']},
  {id:'measurement',name:'Readership measurement',provider:'Plainmeter',location:'Netherlands',purposeIds:['measurement'],privacyUrl:'https://plainmeter.example.test/privacy'},
 ];
 config.storage=[
  {id:'display',name:'display_mode',type:'cookie',serviceId:'preferences',duration:'30 days',classification:'necessary',necessityReason:'Records the display setting requested by the visitor; illustrative necessity assessment.'},
  {id:'readership',name:'readership_id',type:'localStorage',serviceId:'measurement',duration:'30 days',classification:'optional'},
 ];
 delete config.consent;delete config.rightsCenter;delete config.privacySignals;delete config.scopeGuards;
 for(const kind of ['privacy','cookies','terms'])config.documents[kind].route='/services/'+kind;
 return config;
}
export async function serviceDirectoryFiles(base){
 const config=serviceExampleConfig(base),release=compileLegalDocuments(config,{mode:'preview'});
 const css=await readFile(new URL('../../packages/notabenda/dist/services.css',import.meta.url),'utf8');
 const browser=await build({stdin:{contents:"import {mountServiceDirectory} from 'notabenda/services';const target=document.querySelector('[data-directory-root]');if(target)fetch('/services/site.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(config=>mountServiceDirectory(target,config,{idPrefix:'site-services',mode:'preview'})).catch(()=>{});",resolveDir:new URL('../../',import.meta.url).pathname},bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',minify:true});
 const page=(dark=false)=>renderServiceDirectoryPage(config,{idPrefix:'site-services',mode:'preview',stylesheetUrl:dark?'/assets/services-dark.css':'/assets/services.css'}).replace('<main id="main">','<main id="main"><div data-directory-root>').replace('</main>','</div></main>').replace('</body>','<script type="module" src="/assets/services.mjs"></script></body>');
 const dark='\n@layer example{.nb-service-page{color-scheme:dark;--nb-page-bg:#10121d;--nb-surface:#171b2b;--nb-soft:#202539;--nb-text:#eef0fc;--nb-muted:#adb5ce;--nb-line:#343b56;--nb-accent:#bdc4ff;--nb-focus:#a5acff}}';
 return {...Object.fromEntries(Object.entries(release.files).map(([path,value])=>[path.startsWith('notabenda.')?'services/'+path:path,value])),'services/index.html':page(),'dark/services/index.html':page(true),'services/site.json':JSON.stringify(toPublicConfig(config,{mode:'preview'})),'assets/services.css':css,'assets/services-dark.css':css+dark,'assets/services.mjs':browser.outputFiles[0].text};
}
