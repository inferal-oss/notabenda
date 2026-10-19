// @requirements REQ-PRODUCT-CF-HOST REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {siteSections,guideSections,exampleSectionUrl,guideSectionUrl,sectionForGuide} from '../navigation.mjs';
const root=new URL('../dist/public/',import.meta.url),page=async path=>{const route=path.replace(/^\//u,'').replace(/\/$/u,'');return new JSDOM(await readFile(new URL((route?route+'/':'')+'index.html',root),'utf8')).window.document;};
test('example overview is a short set of task areas; every family and variant has one category home',async()=>{
 const overview=await page('/examples');assert.equal(overview.querySelectorAll('.topic-destination').length,siteSections.length);assert.equal(overview.querySelectorAll('.example-feature-grid>a').length,2);assert.equal(overview.querySelectorAll('.topic-example').length,0);assert.equal(overview.querySelectorAll('script').length,0);
 const ids=new Set(),destinations=new Set(),linked=new Set();
 for(const section of siteSections){
  const document=await page(exampleSectionUrl(section));assert.equal(document.querySelectorAll('.topic-example').length,section.topics.length);assert.equal(document.querySelectorAll('script').length,0);assert.equal(document.querySelector('.topic-back').getAttribute('href'),'/examples');
  for(const topic of section.topics){assert.ok(!ids.has(topic.id),topic.id);ids.add(topic.id);assert.ok(!destinations.has(topic.href),topic.href);destinations.add(topic.href);const card=document.getElementById('example-'+topic.id).closest('article');assert.ok(card);assert.equal(card.closest('a'),null);assert.ok(card.querySelector(`a[href="${topic.href}"]`));assert.ok(card.querySelector(`a[href="${topic.guide}"]`));for(const variant of topic.variants)assert.ok(card.querySelector(`a[href="${variant.href}"]`));}
  for(const anchor of document.querySelectorAll('.topic-example a')){const href=anchor.getAttribute('href');linked.add(href);if(href.startsWith('/demo/')){assert.ok(['/demo/admin/orders','/demo/admin/setup','/demo/admin/history','/demo/admin/history/export','/demo/admin/lifecycle','/demo/admin'].includes(href),href);continue;}const target=href.split('#')[0].replace(/\/?$/u,'/')+'index.html';await readFile(new URL(target.slice(1),root),'utf8');}
 }
 const choices=siteSections.find(s=>s.id==='privacy-choices'),contracts=siteSections.find(s=>s.id==='contracts');assert.ok(!choices.topics.some(t=>/guarantee|orders|withdrawal|cancellation/u.test(t.id)));for(const id of ['producer-label','orders','withdrawal','cancellation'])assert.equal(contracts.topics.find(t=>t.id===id).section,'Consumer contracts');
 for(const fragment of ['essentials','interfaces','frameworks','evidence'])assert.ok(overview.getElementById(fragment));
 // Previous overview destinations remain discoverable through a category, including secondary variants.
 for(const route of ['/privacy','/cookies','/terms','/dark/privacy','/choices','/dark/choices','/services','/dark/services','/discovery','/rights','/collection','/indirect-collection','/form-permissions','/form-permissions/react/','/form-permissions/astro/','/embeds','/storage-cleanup','/privacy-signals','/google-basic','/scope-guards','/guarantees','/guarantees/product/','/orders/mixed/','/contract-actions/withdrawal','/contract-actions/cancellation','/react','/astro/','/authored/terms','/agreement','/recorded-choices','/demo/admin/history','/demo/admin','/demo/admin/lifecycle','/processing-choices','/releases','/catalog-releases','/demo/admin/setup'])assert.ok(linked.has(route),route);
});
test('grouped guide navigation exposes current context without nesting mobile disclosures',async()=>{
 for(const route of ['/guide/package','/guide/guarantee-producer-example','/guide/verification/paid-orders']){
  const document=await page(route),desktop=document.querySelector('.guide-nav-desktop'),mobile=document.querySelector('.guide-nav-mobile');assert.equal(desktop.querySelectorAll('details.guide-group').length,guideSections.length);assert.equal(mobile.open,false);assert.equal(mobile.querySelectorAll('details').length,0);assert.equal(mobile.querySelectorAll('.guide-group').length,guideSections.length);
  for(const navigation of [desktop,mobile]){const current=navigation.querySelector('[aria-current="page"]');assert.ok(current,route);assert.equal(current.getAttribute('href'),route);}
  assert.equal(desktop.querySelectorAll('details[open]').length,1);assert.ok(desktop.querySelector('[aria-current="page"]').closest('details').open);assert.equal(document.querySelectorAll('.guide-breadcrumb a').length,2);
 }
});
test('every generated guide remains reachable from the complete grouped reference index',async()=>{
 const document=await page('/guide/all'),linked=new Set([...document.querySelectorAll('#main a')].map(a=>a.getAttribute('href').replace(/\/$/u,''))),routes=[];
 async function visit(directory,prefix){for(const entry of await readdir(directory,{withFileTypes:true})){if(entry.isDirectory())await visit(new URL(entry.name+'/',directory),prefix+'/'+entry.name);else if(entry.name==='index.html')routes.push(prefix);}}
 await visit(new URL('guide/',root),'/guide');for(const route of routes)assert.ok(route==='/guide'||route==='/guide/all'||linked.has(route),route);assert.ok(routes.length>80);assert.equal(document.querySelector('.verification-index').open,false);
 const overview=await page('/guide');assert.equal(overview.querySelectorAll('.guide-breadcrumb').length,0);
 const project=await page('/guide/project');assert.match(project.querySelector('#main').textContent,/Host the HTML yourself and style it with your CSS/u);assert.ok(linked.has('/guide/project'));
 const home=await page('/');assert.equal(home.querySelectorAll('.trace').length,0);for(const section of ['privacy-information','contracts','records'])assert.ok(home.querySelector(`a[href="/examples/${section}/"]`));assert.ok(home.querySelector('a[href="/guide"]'));
});

// The hierarchy is structural: an added topic cannot silently disappear, duplicate
// another family, or turn every guide into an ungrouped reference entry.
test('each example appears in exactly one subgroup and area overviews connect guides to examples',async()=>{
 for(const section of siteSections){
  const grouped=section.groups.flatMap(group=>group.topicIds);assert.equal(new Set(grouped).size,grouped.length,section.id);assert.deepEqual([...grouped].sort(),section.topics.map(t=>t.id).sort(),section.id);
  const examples=await page(exampleSectionUrl(section)),area=await page(guideSectionUrl(section));
  assert.equal(examples.querySelectorAll('.topic-section').length,section.groups.filter(g=>g.topicIds.length).length);assert.ok(examples.querySelector(`a[href="${guideSectionUrl(section)}"]`));
  assert.equal(area.querySelectorAll('.guide-area-group').length,section.groups.length);assert.ok(area.querySelector(`a[href="${exampleSectionUrl(section)}"]`));
  for(const guide of section.guides){assert.ok(area.querySelector(`#main a[href="${guide.href}"]`),guide.href);await page(guide.href);}
  assert.equal(area.querySelectorAll('script').length,0);
 }
 const producer=await page('/guide/guarantee-producer-example');assert.equal(producer.querySelector('.guide-breadcrumb a:last-child').getAttribute('href'),'/guide/areas/contracts/');assert.ok(producer.querySelector('.guide-context a[href="/guide/guarantee-labels"]'));assert.ok(producer.querySelector('.guide-context a[href="/guarantees/product/"]'));
 assert.equal(sectionForGuide('/guide/verification/paid-orders').id,'contracts');assert.equal(sectionForGuide('/guide/verification/consent-focus').id,'privacy-choices');
 const home=await page('/'),overview=await page('/guide');for(const document of [home,overview])assert.deepEqual([...document.querySelectorAll('.starter-path a')].map(a=>a.getAttribute('href')),['/guide/package','/guide/authoring','/guide/consent']);
 assert.equal(home.querySelectorAll('.foundation,.closing').length,0);assert.equal(overview.querySelectorAll('.guide-topic').length,6);
});
