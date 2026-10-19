// @requirements REQ-PRODUCT-REACT
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {build as bundle} from 'esbuild';
import {createConsent} from 'notabenda';
import {compileLegalDocuments} from 'notabenda/content';
import {exampleConsentConfig} from '../static/choices-build.mjs';
import {App} from './view.mjs';

export async function reactFiles(base) {
  const config=exampleConsentConfig(base);config.site.id='juniper-react';
  for(const item of config.storage)if(item.serviceId==='privacy-choices')item.name=item.name.replace('juniper-choices',config.site.id);
  for(const item of config.storage)if(config.consent.services.some(s=>s.id===item.serviceId))item.name=`react-demo:${item.serviceId}`;
  const result={};
  for(const prefix of ['','/dark']) {
    const themed=structuredClone(config);for(const [kind,doc] of Object.entries(themed.documents))doc.route=`${prefix}/react/${kind}`;
    const release=compileLegalDocuments(themed,{mode:'preview',stylesheetUrl:prefix?'/assets/dark.css':'/assets/notabenda.css'});
    Object.assign(result,Object.fromEntries(Object.entries(release.files).filter(([path])=>path.startsWith('artifacts/')||path.startsWith(prefix? 'dark/react/':'react/'))));
    result[`${prefix.slice(1)}${prefix?'/':''}react/site.json`]=JSON.stringify(release.publicConfig);
    const controller=createConsent(release.publicConfig,{});
    const html=renderToString(createElement(App,{controller,config:release.publicConfig}));controller.destroy();
    result[`${prefix.slice(1)}${prefix?'/':''}react/index.html`]=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Juniper Notes · React choices</title><link rel="stylesheet" href="${prefix?'/assets/dark.css':'/assets/notabenda.css'}"><script type="module" src="/assets/react-demo.mjs"></script></head><body class="nb-page"><header class="nb-site-header"><a href="/">Juniper Notes</a><span>Independent words. Considered details.</span></header><div id="react-root" data-config="${prefix}/react/site.json">${html}</div><noscript><p class="nb-document">JavaScript is unavailable. Optional services remain off; the legal links still work.</p></noscript></body></html>`;
  }
  const output=await bundle({entryPoints:[new URL('./client.mjs',import.meta.url).pathname],outfile:'react-demo.mjs',bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
  result['assets/react-demo.mjs']=output.outputFiles[0].text;
  result['react/optional-sample.json']=JSON.stringify({example:'Optional response; no tracking service.'});
  return result;
}
