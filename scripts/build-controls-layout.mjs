// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
/** Local maintainer fixture. It is not part of the public site or npm browser graph. */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {compileConsentRuntimeConfig,compileLegalDocuments,createConsentNotice} from '@notabenda/core/content';
import {exampleConsentConfig} from '../examples/static/choices-build.mjs';
export async function buildControlsLayoutFixture(output=new URL('../.local/controls-layout/',import.meta.url)) {
 await mkdir(output,{recursive:true});
 const write=async(name,content)=>{const path=new URL(name,output);await mkdir(new URL('.',path),{recursive:true});await writeFile(path,content);};
 const base=JSON.parse(await readFile(new URL('../examples/static/notabenda.config.json',import.meta.url),'utf8'));
 for(const copy of ['normal','long']){
  const config=exampleConsentConfig(base);config.site.id='controls-layout-'+copy;for(const item of config.storage)if(item.serviceId==='privacy-choices')item.name=item.name.replace('juniper-choices',config.site.id);
  if(copy==='long'){
   config.purposes[0].name='MeasurementAndHelpfulSuggestionsWithoutAnySpaces'.repeat(4);
   config.purposes[0].description='Long-copy fixture: '+('This explanation names the purpose, the provider and how to change the choice. '.repeat(8));
   config.services[0].name='ProviderProductIdentifier'.repeat(10);
  }
  const release=compileLegalDocuments(config,{mode:'preview',stylesheetUrl:'/styles.css'});
  const notice=createConsentNotice(release.artifact,{scopeId:'layout-check',...(copy==='long'?{wording:{preferencesTitle:'PrivacyPreferenceHeadingWithoutWordBoundaries'.repeat(6),closeLabel:'Close without saving this optional choice',rejectLabel:'Reject all optional purposes and keep them disabled',saveLabel:'Save the individual choices selected in this panel'}}:{})},{mode:'preview'});
  await write(copy+'.config.json',JSON.stringify(compileConsentRuntimeConfig(config,{mode:'preview',evidence:'local'})));
  await write(copy+'.notice.json',JSON.stringify(notice));
  for(const [path,content] of Object.entries(release.files))if(path.startsWith('artifacts/'))await write(path,content);
 }
 const script=`import {createConsentRuntime,mountControls} from '@notabenda/core/consent';
const params=new URL(location.href).searchParams;
const copy=params.get('copy')==='long'?'long':'normal';
document.documentElement.dir=params.get('direction')==='rtl'?'rtl':'ltr';
document.documentElement.style.fontSize=params.get('text')==='large'?'32px':'16px';
document.body.classList.toggle('nb-demo-midnight',params.get('theme')==='midnight');
for(const control of document.querySelectorAll('select'))if(params.has(control.name)&&[...control.options].some(o=>o.value===params.get(control.name)))control.value=params.get(control.name);
if(params.get('observer')==='off')window.ResizeObserver=undefined;
const [config,notice]=await Promise.all([fetch('./'+copy+'.config.json').then(r=>r.json()),fetch('./'+copy+'.notice.json').then(r=>r.json())]);
const values=new Map();const consent=createConsentRuntime(config,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}});
// Vary copy using a validated notice, without pretending this local-only fixture records evidence.
mountControls(document.querySelector('#controls'),{consent:{...consent,getNotice:()=>notice}});
const status=document.querySelector('#fixture-state');consent.subscribe(state=>{status.textContent=JSON.stringify({purposes:state.purposes,preferencesOpen:state.preferencesOpen},null,2)});
`;
 const bundle=await build({stdin:{contents:script,resolveDir:fileURLToPath(new URL('../',import.meta.url))},bundle:true,write:false,platform:'browser',format:'esm'});await write('app.mjs',bundle.outputFiles[0].contents);
 for(const [file,source] of [['consent.css','packages/notabenda/dist/consent.css'],['styles.css','packages/notabenda/dist/styles.css'],['theme.css','examples/static/example-theme.css']])await write(file,await readFile(new URL('../'+source,import.meta.url)));
 const select=(name,label,options)=>`<label>${label}<select name="${name}">${options.map(([id,text])=>`<option value="${id}">${text}</option>`).join('')}</select></label>`;
 await write('index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Controls layout check</title><link rel="stylesheet" href="consent.css"><link rel="stylesheet" href="theme.css"><style>body{margin:0;padding:1rem;font-family:system-ui}main{max-width:65ch;margin:auto}form{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr));gap:1rem}form label{display:grid;gap:.5rem}form :is(select,button),main>p input{font:inherit;min-height:44px;max-width:100%;min-width:0}pre{white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:1.8rem;line-height:1.15}</style></head><body class="nb-demo-page"><main><h1>Controls layout check</h1><p>Choose a layout fixture, then open preferences. These are English layout samples, including an RTL flow and enlarged text. Choices are synthetic and in memory; nothing is recorded.</p><form action="index.html" method="get">${select('copy','Copy',[['normal','Normal labels'],['long','Long labels and unbroken text']])}${select('direction','Direction',[['ltr','Left to right'],['rtl','Right to left']])}${select('text','Text size',[['normal','16px root'],['large','32px root']])}${select('theme','Theme',[['light','Light'],['midnight','Midnight']])}${select('observer','Resize observer',[['on','Available'],['off','Unavailable fallback']])}<button type="submit">Load fixture</button></form><p><label>Site search<input type="search"></label></p><div id="controls"></div><pre id="fixture-state" aria-label="Synthetic controller state"></pre></main><script type="module" src="app.mjs"></script></body></html>`);
 return fileURLToPath(output);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length!==2)throw Error('Run without arguments; output is .local/controls-layout.');
 console.log('Built controls layout fixture: '+await buildControlsLayoutFixture());
}
