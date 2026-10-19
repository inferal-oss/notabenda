// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('script-free guides expose a native collapsed mobile menu and keep the current area and links to every other area',async()=>{
 for(const route of ['cloudflare-doctor','package','requirements']){
  const html=await readFile(new URL('../dist/public/guide/'+route+'/index.html',import.meta.url),'utf8'),dom=new JSDOM(html),document=dom.window.document;
  assert.equal(document.querySelectorAll('script').length,0);
  const compact=document.querySelector('details.guide-nav-mobile');assert.ok(compact);assert.equal(compact.open,false);assert.match(compact.querySelector('summary').textContent,/Browse documentation/);
  const desktop=[...document.querySelectorAll('.guide-nav-desktop nav a')].map(a=>a.getAttribute('href')),mobile=[...compact.querySelectorAll('nav a')].map(a=>a.getAttribute('href'));
  assert.deepEqual(mobile,desktop);if(route==='cloudflare-doctor')assert.ok(mobile.includes('/guide/cloudflare-doctor'));assert.ok(mobile.length<20);assert.equal(mobile.filter(href=>href.startsWith('/guide/areas/')).length,7);assert.ok(document.querySelector('#main h1'));assert.equal(document.querySelector('.skip').getAttribute('href'),'#main');
  dom.window.close();
 }
});
