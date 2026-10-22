// @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION
// @requirements REQ-PRODUCT-DOCS-SEARCH
// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {guideSections,sectionForGuide} from '../navigation.mjs';

// @requirements REQ-PRODUCT-AGENT-INTEGRATION
test('every grouped guide has a human label, including technology functions',()=>{
 for(const section of guideSections)for(const entry of section.guides)assert.notEqual(entry.label,entry.href.split('/').at(-1),'Missing human label for '+entry.href);
 assert.equal(guideSections.flatMap(s=>s.guides).find(g=>g.href==='/guide/technology-collection').label,'Technology functions');
});

test('script-free guides expose a native collapsed mobile menu and keep the current area and links to every other area',async()=>{
 for(const route of ['cloudflare-doctor','cloudflare-recovery','package','requirements']){
  const html=await readFile(new URL('../dist/public/guide/'+route+'/index.html',import.meta.url),'utf8'),dom=new JSDOM(html),document=dom.window.document;
  assert.equal(document.querySelectorAll('script').length,0);
  const compact=document.querySelector('details.guide-nav-mobile');assert.ok(compact);assert.equal(compact.open,false);assert.match(compact.querySelector('summary').textContent,/Browse documentation/);
  const desktop=[...document.querySelectorAll('.guide-nav-desktop nav a')].map(a=>a.getAttribute('href')),mobile=[...compact.querySelectorAll('nav a')].map(a=>a.getAttribute('href'));
  assert.deepEqual(mobile,desktop);if(route==='cloudflare-doctor')assert.ok(mobile.includes('/guide/cloudflare-doctor'));assert.ok(mobile.includes('/guide/search/'));assert.ok(mobile.filter(href=>href!=='/guide/search/').length<20);assert.equal(mobile.filter(href=>href.startsWith('/guide/areas/')).length,7);assert.ok(document.querySelector('#main h1'));assert.equal(document.querySelector('.skip').getAttribute('href'),'#main');
  dom.window.close();
 }
});

// @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION
test('document input review and its verification stay in the document publishing path',async()=>{
 for(const route of ['/guide/document-inputs','/guide/verification/document-inputs']){
  assert.equal(sectionForGuide(route).id,'privacy-information');
  const dom=new JSDOM(await readFile(new URL('../dist/public'+route+'/index.html',import.meta.url),'utf8')),document=dom.window.document;
  const active=document.querySelector('.guide-nav-desktop [aria-current="page"]');assert.ok(active,route);assert.equal(active.getAttribute('href'),route);assert.match(active.closest('details').querySelector('summary').textContent,/Publish privacy information/);
  assert.equal(document.querySelector('.guide-breadcrumb a:last-child').getAttribute('href'),'/guide/areas/privacy-information/');dom.window.close();
 }
 const area=new JSDOM(await readFile(new URL('../dist/public/guide/areas/privacy-information/index.html',import.meta.url),'utf8'));assert.ok(area.window.document.querySelector('#main a[href="/guide/document-inputs"]'));area.window.close();
});

// @requirements REQ-PRODUCT-SERVICE-DETECTION
test('Composer discovery stays in the service setup path with a working section and verification link',async()=>{
 const route='/guide/verification/composer-discovery';assert.equal(sectionForGuide(route).id,'start');
 const doc=new JSDOM(await readFile(new URL('../dist/public/guide/service-catalog/index.html',import.meta.url),'utf8'));
 assert.match(doc.window.document.querySelector('#php-composer-projects').textContent,/Composer/);assert.ok(doc.window.document.querySelector('#main a[href="/guide/verification/composer-discovery"]'));doc.window.close();
 const report=new JSDOM(await readFile(new URL('../dist/public'+route+'/index.html',import.meta.url),'utf8'));
 assert.equal(report.window.document.querySelector('.guide-breadcrumb a:last-child').getAttribute('href'),'/guide/areas/start/');assert.equal(report.window.document.querySelector('.guide-nav-desktop [aria-current="page"]').getAttribute('href'),route);report.window.close();
});

// @requirements REQ-PRODUCT-SERVICE-DETECTION
test('Cargo discovery stays with project setup and links its declaration contexts to verification',async()=>{
 const route='/guide/verification/cargo-discovery';assert.equal(sectionForGuide(route).id,'start');
 const doc=new JSDOM(await readFile(new URL('../dist/public/guide/service-catalog/index.html',import.meta.url),'utf8'));
 assert.match(doc.window.document.querySelector('#rust-cargo-projects').textContent,/Rust/);assert.ok(doc.window.document.querySelector('#main a[href="/guide/verification/cargo-discovery"]'));assert.match(doc.window.document.querySelector('#main').textContent,/workspace-dependency/);doc.window.close();
 const report=new JSDOM(await readFile(new URL('../dist/public'+route+'/index.html',import.meta.url),'utf8'));
 assert.equal(report.window.document.querySelector('.guide-breadcrumb a:last-child').getAttribute('href'),'/guide/areas/start/');report.window.close();
});

// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
test('source candidate is the maintainer path while the pack-only checker remains reachable reference',async()=>{
 const area=new JSDOM(await readFile(new URL('../dist/public/guide/areas/integrations/index.html',import.meta.url),'utf8'));const d=area.window.document;assert.ok(d.querySelector('section.guide-area-group a[href="/guide/source-candidate"]'));assert.ok(d.querySelector('details.guide-supporting a[href="/guide/release-candidate"]'));area.window.close();
 for(const route of ['source-candidate','release-candidate']){assert.equal(sectionForGuide('/guide/'+route).id,'integrations');const dom=new JSDOM(await readFile(new URL('../dist/public/guide/'+route+'/index.html',import.meta.url),'utf8'));assert.equal(dom.window.document.querySelector('.guide-nav-desktop [aria-current="page"]').getAttribute('href'),'/guide/'+route);dom.window.close();}
});
