// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {readFile} from 'node:fs/promises';
import {compileLegalDocuments,createContractActionDefinition} from 'notabenda/content';
import {renderLegalLinks} from 'notabenda';
export function contractActionExample(base){
 const config=structuredClone(base);config.site.id='juniper-contract-actions';config.site.name='Juniper Notes';for(const [kind,doc] of Object.entries(config.documents))doc.route='/contract-actions/'+kind;
 const build=compileLegalDocuments(config,{mode:'preview'}),definitions={};
 for(const [route,profile] of [['withdrawal','eu-withdrawal'],['cancellation','de-cancellation']])definitions[route]=createContractActionDefinition(build.artifact,{actionId:route,revision:'form-1',profile,reviewStatus:'draft'},{mode:'preview'});
 return {build,definitions};
}
export async function contractActionFiles(base){
 const {build,definitions}=contractActionExample(base),files={...build.files,'assets/contract-actions.mjs':await readFile(new URL('./client.mjs',import.meta.url),'utf8'),'assets/contract-actions.css':await readFile(new URL('./style.css',import.meta.url),'utf8')};
 for(const [route,d] of Object.entries(definitions)){
  files['contract-actions/'+route+'/definition.json']=JSON.stringify(d);
  for(const dark of [false,true]){const prefix=dark?'dark/':'',de=route==='cancellation';
   files[prefix+'contract-actions/'+route+'/index.html']=`<!doctype html><html lang="${d.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${de?'Vertrag kündigen':'Submit a withdrawal request'} · Juniper Notes</title><link rel="stylesheet" href="${dark?'/assets/dark.css':'/assets/notabenda.css'}"><link rel="stylesheet" href="/assets/contract-actions.css"><script type="module" src="/assets/contract-actions.mjs"></script></head><body class="nb-page"><header class="nb-site-header"><a href="/">Juniper Notes</a></header><main class="nb-document"><p class="nb-eyebrow">Notabenda · ${de?'Vertragskündigung':'Contract withdrawal'}</p><h1>${de?'Vertrag kündigen':'Submit a withdrawal request'}</h1><p>${de?'Ihre Erklärung, mit den Angaben zum Vertrag und einer Kopie zum Speichern.':'Your declaration, the details that identify your contract, and a copy you can keep.'}</p><section class="contract-example-form" data-contract-route="${route}"><div id="contract-action"><p role="status">${de?'Formular wird vorbereitet…':'Preparing the form…'}</p></div><p class="contract-example-note">${de?'Demonstration: Nutzen Sie eine example.test-Adresse. Es wird keine E-Mail versandt und kein echter Vertrag beendet.':'Demonstration: use an example.test address. No email is sent and no real contract is changed.'}</p><a id="contract-record" hidden>${de?'Erklärung im Demo-Workspace ansehen ↗':'Inspect this declaration in your demo workspace ↗'}</a></section><noscript><p>${de?'Das Formular benötigt JavaScript. Die Dokumente bleiben unten lesbar.':'This form needs JavaScript. The documents below remain readable.'}</p></noscript></main><footer class="nb-site-footer">${renderLegalLinks(build.publicConfig)}<a href="/${dark?'':'dark/'}contract-actions/${route}">${dark?'Light':'Midnight'} theme ↗</a></footer></body></html>`;
  }
 }
 return files;
}
