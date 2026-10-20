// @requirements REQ-PRODUCT-CONNECTION-INSPECTION
// @requirements REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-PACKAGE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {createConsentRuntime} from '@notabenda/core/consent';

test('cookie examples serve component styles while their legal documents retain the complete stylesheet',async()=>{
 const root=new URL('../dist/public/',import.meta.url);
 for(const [route,css] of [['choices','consent.css'],['dark/choices','consent-dark.css'],['recorded-choices','consent.css']]){
  const dom=new JSDOM(await readFile(new URL(route+'/index.html',root),'utf8')),links=[...dom.window.document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.getAttribute('href'));assert.ok(links.includes('/assets/'+css));assert.ok(!links.includes('/assets/notabenda.css'));assert.ok(!links.includes('/assets/dark.css'));assert.ok(dom.window.document.querySelector('#privacy-controls'));dom.window.close();
 }
 for(const [route,css] of [['choices/privacy','notabenda.css'],['dark/choices/privacy','dark.css']]){
  const dom=new JSDOM(await readFile(new URL(route+'/index.html',root),'utf8'));assert.ok(dom.window.document.querySelector(`link[href="/assets/${css}"]`));dom.window.close();
 }
 assert.equal(await readFile(new URL('assets/consent.css',root),'utf8'),await readFile(new URL('../../packages/notabenda/dist/consent.css',import.meta.url),'utf8'));
});

test('the cookie runtime stays bundled and only its optional inspector is a separate dynamic import',async()=>{
 const script=await readFile(new URL('../dist/public/assets/consent.mjs',import.meta.url),'utf8');
 const parsed=await build({stdin:{contents:script,sourcefile:'published-consent.mjs'},bundle:false,platform:'browser',format:'esm',target:'es2022',write:false,metafile:true,logLevel:'silent'});
 assert.deepEqual(Object.values(parsed.metafile.outputs)[0].imports,[{path:'/assets/connection-inspector.mjs',kind:'dynamic-import',external:true}]);
 const inspector=await readFile(new URL('../dist/public/assets/connection-inspector.mjs',import.meta.url),'utf8'),inspectionGraph=await build({stdin:{contents:inspector,sourcefile:'inspection.mjs'},bundle:false,platform:'browser',format:'esm',target:'es2022',write:false,metafile:true,logLevel:'silent'});
 assert.deepEqual(Object.values(inspectionGraph.metafile.outputs)[0].imports,[]);assert.doesNotMatch(inspector,/node:|\/assets\/runtime\/|ADMIN_KEY/u);assert.match(script,/sample-measurements/u);assert.match(script,/\/choices\/site\.json/u);assert.doesNotMatch(script,/\/assets\/runtime\/|notabenda-cf|node:fs|localhost:|ADMIN_KEY/u);
});


test('both cookie themes serve independently validated compiled descriptors with no authoring bodies or private facts',async()=>{
 const root=new URL('../dist/public/',import.meta.url);
 for(const prefix of ['','dark/']){
  const descriptor=JSON.parse(await readFile(new URL(prefix+'choices/site.json',root),'utf8'));assert.equal(descriptor.kind,'notabenda-consent-runtime');assert.equal(descriptor.evidence,'local');assert.equal(descriptor.mode,'preview');assert.doesNotMatch(JSON.stringify(descriptor),/"(?:controller|private|sections|rightsCenter)":/);
  const consent=createConsentRuntime(descriptor,{});assert.equal(consent.getConfig().documents.privacy.route,'/'+prefix+'choices/privacy');assert.equal(consent.getSnapshot().permissions.measurement,false);consent.destroy();
 }
});
