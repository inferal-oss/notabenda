// @requirements REQ-PRODUCT-TERMS-CONNECTION
// @requirements REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {build as bundle} from 'esbuild';
import { readFile } from 'node:fs/promises';
import {agreementExample} from '../agreements/example.mjs';
import { renderLegalLinks } from '@notabenda/core';

export async function agreementFiles(base) {
  const files = {};
  for (const [theme,prefix] of [['light',''],['dark','/dark']]) {
    const {config,build,offer}=agreementExample(base,{dark:!!prefix});
    Object.assign(files,Object.fromEntries(Object.entries(build.files).filter(([file])=>file.startsWith('artifacts/') || file.startsWith(`${prefix ? 'dark/' : ''}agreement/`))));
    files[`${prefix ? 'dark/' : ''}agreement/offer.json`] = JSON.stringify(offer);
    files[`${prefix ? 'dark/' : ''}agreement/index.html`] = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Juniper Notes · Terms agreement</title><link rel="stylesheet" href="${prefix ? '/assets/dark.css' : '/assets/notabenda.css'}"><link rel="stylesheet" href="/assets/terms-inspector.css"><script type="module" src="/assets/agreement.mjs"></script></head><body class="nb-page"><header class="nb-site-header"><a href="/">Juniper Notes</a><span>Juniper Notes examples</span></header><main id="main" class="nb-document"><header class="agreement-intro"><p class="nb-eyebrow">Terms agreement</p><h1>Review your terms</h1><p>Read the terms before agreeing. Your choice is recorded only when saving is confirmed.</p></header><div id="terms-control"></div><aside class="agreement-context" aria-labelledby="agreement-context-title"><p class="nb-eyebrow">After you agree</p><h2 id="agreement-context-title">What gets recorded</h2><p>The record keeps the document version, the exact statement and the time it was received.</p><ul><li>Read the pinned terms</li><li>Choose whether to agree</li><li>Check the saved record</li></ul><p>Cookie choices are managed separately.</p><a href="/demo/admin/agreements">View agreement records <span aria-hidden="true">↗</span></a><a href="${prefix ? '/agreement' : '/dark/agreement'}">${prefix ? 'Light' : 'Dark'} appearance <span aria-hidden="true">↗</span></a></aside><noscript><p>JavaScript is unavailable. No agreement is submitted. The legal documents below remain readable.</p></noscript><details class="terms-inspector" data-terms-inspector><summary>Inspect this connection</summary><p>Compare the running terms controller with the offer and operation intended for this page. Inspection submits no agreement.</p><button type="button">Inspect runtime</button><p role="status" aria-live="polite"></p><div data-terms-inspection-output hidden></div></details></main><footer class="nb-site-footer">${renderLegalLinks(config)}</footer></body></html>`;
  }
  files['assets/terms-inspector.mjs']=(await bundle({entryPoints:[new URL('./terms-inspector.mjs',import.meta.url).pathname],bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,write:false})).outputFiles[0].text;
  files['assets/terms-inspector.css']=await readFile(new URL('./terms-inspector.css',import.meta.url),'utf8');
  files['assets/agreement.mjs'] = await readFile(new URL('./agreement.mjs',import.meta.url),'utf8');
  return files;
}
