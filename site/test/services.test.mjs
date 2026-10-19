// @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {serveHost} from '../host.mjs';
import {renderServiceDirectory} from 'notabenda/services';
const root=new URL('../dist/public/',import.meta.url);
test('both directory themes share the exact confirmed inventory and keep search scoped to example routes',async()=>{
 const config=JSON.parse(await readFile(new URL('services/site.json',root),'utf8'));assert.equal(config.services.length,4);assert.equal(config.private,undefined);
 for(const prefix of ['','dark/']){
  const path='/'+prefix+'services/',html=await readFile(new URL(prefix+'services/index.html',root),'utf8'),dom=new JSDOM(html),doc=dom.window.document;
  assert.ok(html.includes(renderServiceDirectory(config,{idPrefix:'site-services',mode:'preview'})));assert.ok(doc.querySelector('.nb-demo-services'));assert.equal(doc.querySelectorAll('a[href="#main"]').length,1);assert.ok(doc.querySelector('header nav a[href="/examples"]'));assert.equal(doc.querySelectorAll('.nb-service-card').length,4);assert.equal(doc.querySelectorAll('input,select').length,0);assert.equal(doc.querySelector('script').getAttribute('src'),'/assets/services.mjs');assert.ok(html.includes('example-pages.css'));assert.ok(html.includes('example-theme.css'));
  const response=await serveHost(new Request('https://example.test'+path),{ASSETS:{fetch:async()=>new Response('asset')},WORKSPACE:{get(){throw Error('Directory never allocates a workspace');}}});assert.equal(response.status,200);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);dom.window.close();
 }
 for(const path of ['/services/privacy/','/services/cookies/','/guide/services/']){const response=await serveHost(new Request('https://example.test'+path),{ASSETS:{fetch:async()=>new Response('asset')}});assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);}
 const js=await readFile(new URL('assets/services.mjs',root),'utf8');assert.doesNotMatch(js,/catalog-data|open-cookie-database|notabenda-cf|node:|document\.cookie\b|(?:localStorage|sessionStorage)\s*[.[]/);
 const privacy=await readFile(new URL('services/privacy/index.html',root),'utf8');assert.doesNotMatch(privacy,/<script/);for(const service of config.services)assert.ok(privacy.includes(service.name));
});
