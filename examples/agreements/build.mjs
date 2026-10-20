// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-REACT
import {createElement as h} from 'react';
import {renderToString} from 'react-dom/server';
import {build as bundle} from 'esbuild';
import {createTermsAcceptance,renderLegalLinks} from '@notabenda/core';
import {agreementExample} from './example.mjs';
import {ReactAgreementApp} from './react-view.mjs';
export async function reactAgreementFiles(base){
 const files={};
 for(const dark of [false,true]){
  const {config,offer}=agreementExample(base,{dark}),prefix=dark?'/dark':'',controller=createTermsAcceptance(offer,{operationId:'ssr-placeholder',allowPreview:true,submit:async()=>{throw Error('SSR never records agreements.');}}),body=renderToString(h(ReactAgreementApp,{controller,dark}));controller.destroy();
  const escape=value=>value.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  files[prefix.slice(1)+(dark?'/':'')+'agreement/react/index.html']=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="notabenda-terms-offer" content="${escape(JSON.stringify(offer))}"><title>Terms with React · Juniper Notes</title><link rel="stylesheet" href="${dark?'/assets/dark.css':'/assets/notabenda.css'}"><script type="module" src="/assets/react-agreement.mjs"></script></head><body class="nb-page nb-demo-page nb-demo-agreement"><header class="nb-site-header"><a href="/">Juniper Notes</a><span>Terms agreement</span></header><div id="react-agreement-root">${body}</div><footer class="nb-site-footer">${renderLegalLinks(config)}</footer></body></html>`;
 }
 const built=await bundle({entryPoints:[new URL('./react-client.mjs',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});files['assets/react-agreement.mjs']=built.outputFiles[0].text;return files;
}
