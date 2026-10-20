// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION
// @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {build} from 'esbuild';
import {createServiceInventory,createServiceDirectory,renderServiceDirectory,renderServiceDirectoryPage,mountServiceDirectory} from '@notabenda/core/services';
import {ServiceDirectory} from '@notabenda/core/react/documents';
import {createLegalDocument} from '@notabenda/core';
import {compileLegalDocuments} from '@notabenda/core/content';
import {fixture} from './helpers.mjs';
import {serviceExampleConfig} from '../../../examples/services/build.mjs';
const settings={idPrefix:'test-services'};
const config=async()=>serviceExampleConfig(await fixture({reviewed:true}));

test('directory and privacy use detached declared service facts, including custom services, with selected-only public data',async()=>{
 const c=await config();c.services[0].resourceOrigins=['https://internal-scope.example.test'];c.private={note:'PRIVATE_SENTINEL'};
 const model=createServiceDirectory(c);assert.equal(model.services.length,4);assert.equal(model.totalServices,4);assert.equal(model.policies.privacy.version,c.documents.privacy.version);
 const inventory=createServiceInventory(c),privacy=createLegalDocument(c,'privacy').sections.find(s=>s.id==='providers');for(const service of inventory){assert.ok(privacy.items.some(item=>item.includes(service.name)&&item.includes(service.provider)&&item.includes(service.location)));}
 assert.doesNotMatch(JSON.stringify(model),/PRIVATE_SENTINEL|internal-scope|resourceOrigins|scopeGuards|googleBasic|catalogRevision/);
 model.services[0].purposes[0].dataCategories.push('Changed');model.services[0].provider='Changed';assert.notEqual(c.services[0].provider,'Changed');assert.ok(!c.purposes[0].dataCategories.includes('Changed'));
 const pinned=compileLegalDocuments(c).artifact,old=renderServiceDirectory(pinned.publicConfig,settings);c.services[0].name='Later inventory revision';assert.equal(renderServiceDirectory(pinned.publicConfig,settings),old);assert.notEqual(renderServiceDirectory(c,settings),old);
});

test('directory filters are literal bounded searches with declared-purpose validation and clear partial counts',async()=>{
 const c=await config();assert.equal(createServiceDirectory(c,{query:'brookpost'}).services[0].id,'mail');assert.equal(createServiceDirectory(c,{query:'IP address'}).services[0].id,'hosting');assert.equal(createServiceDirectory(c,{query:'readership_id',purposeId:'measurement'}).services[0].id,'measurement');assert.equal(createServiceDirectory(c,{query:'(a+)+'}).services.length,0);
 assert.match(renderServiceDirectory(c,{...settings,purposeId:'measurement'}),/Showing 1 of 4 declared services/);
 for(const bad of [{query:null},{query:'a'.repeat(121)},{query:'\u001b[2J'},{purposeId:'unknown'},{purposeId:['measurement']}])assert.throws(()=>createServiceDirectory(c,bad));
});

test('native directory is script-free, escaped, keyboard-readable and makes missing facts explicit',async()=>{
 const c=await config();c.services[0].name='<script>literal()</script>';c.services[0].provider='Provider <img src=x onerror=alert(1)>';
 const html=renderServiceDirectory(c,{...settings,headingLevel:2});const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('article').length,4);assert.equal(doc.querySelectorAll('details > summary').length,4);assert.equal(doc.querySelectorAll('input,select,button,script,img').length,0);assert.equal(doc.querySelector('article h3').textContent,c.services[0].name);assert.equal(doc.querySelectorAll('details section h4').length,8);
 assert.match(html,/A provider privacy link is not declared/);assert.match(html,/No browser storage is declared for this service/);assert.match(html,/&lt;script&gt;/);for(const node of doc.querySelectorAll('[aria-labelledby]'))assert.ok(doc.getElementById(node.getAttribute('aria-labelledby')));
 assert.equal(new Set([...doc.querySelectorAll('[id]')].map(n=>n.id)).size,doc.querySelectorAll('[id]').length);
 for(const bad of [{idPrefix:'bad id'},{...settings,headingLevel:6},{...settings,title:'\u202eunsafe'},{...settings,description:'x'.repeat(1001)}])assert.throws(()=>renderServiceDirectory(c,bad));
 c.services[0].privacyUrl='javascript:alert(1)';assert.throws(()=>renderServiceDirectory(c,settings));dom.window.close();
});

test('production review, empty inventories, page link validation and exact React server parity are enforced',async()=>{
 const c=await config();assert.equal(renderToStaticMarkup(createElement(ServiceDirectory,{config:c,...settings,className:'host'})),`<div class="host">${renderServiceDirectory(c,settings)}</div>`);
 const html=renderServiceDirectoryPage(c,{...settings,stylesheetUrl:'/assets/services.css'});assert.doesNotMatch(html,/<script/);assert.match(html,/<h1/);assert.match(html,/Skip to content/);assert.throws(()=>renderServiceDirectoryPage(c,{...settings,stylesheetUrl:'javascript:evil()'}));
 c.documents.privacy.review.status='draft';assert.throws(()=>renderServiceDirectory(c,settings),/reviewed-content declaration/);assert.ok(renderServiceDirectory(c,{...settings,mode:'preview'}));
 c.services=[];c.storage=[];assert.match(renderServiceDirectory(c,{...settings,mode:'preview'}),/No services are declared in this inventory/);
});

test('optional search preserves existing details and focus, filters locally, announces counts and destroys without stale controls',async()=>{
 const c=await config(),dom=new JSDOM('<div id="root">'+renderServiceDirectory(c,settings)+'</div>'),doc=dom.window.document,target=doc.getElementById('root'),detail=target.querySelector('details');detail.open=true;detail.querySelector('summary').focus();const focused=doc.activeElement;
 const mounted=mountServiceDirectory(target,c,settings);assert.equal(doc.activeElement,focused);assert.equal(detail.open,true);assert.throws(()=>mountServiceDirectory(target,c,settings));
 const search=target.querySelector('input'),purpose=target.querySelector('select'),status=target.querySelector('[role=status]');search.focus();search.value='brookpost';search.dispatchEvent(new dom.window.Event('input'));assert.equal(doc.activeElement,search);assert.equal(target.querySelectorAll('.nb-service-list > li:not([hidden])').length,1);assert.match(status.textContent,/Showing 1 of 4/);assert.equal(status.getAttribute('aria-live'),'polite');assert.equal(search.labels[0].textContent,'Find a service');
 search.value='';purpose.value='measurement';purpose.dispatchEvent(new dom.window.Event('change'));assert.equal(target.querySelectorAll('.nb-service-list > li:not([hidden])').length,1);assert.equal(target.querySelector('.nb-service-list > li:not([hidden])').dataset.serviceId,'measurement');
 search.value='no-match';search.dispatchEvent(new dom.window.Event('input'));assert.equal(target.querySelector('[data-service-empty]').hidden,false);
 mounted.destroy();mounted.destroy();assert.equal(target.querySelectorAll('input,select').length,0);assert.equal(target.querySelectorAll('.nb-service-list > li[hidden]').length,0);search.value='brookpost';search.dispatchEvent(new dom.window.Event('input'));assert.equal(status.textContent,'4 declared services');assert.equal(detail.open,true);
 const again=mountServiceDirectory(target,c,{...settings,query:'brookpost'});assert.equal(target.querySelectorAll('.nb-service-list > li:not([hidden])').length,1);again.destroy();dom.window.close();
});

test('invalid mount input leaves host content intact and actual browser directory graphs exclude seed, Node and backend code',async()=>{
 const c=await config(),dom=new JSDOM('<div id="root"><p>Keep this content</p></div>'),target=dom.window.document.getElementById('root');assert.throws(()=>mountServiceDirectory(target,c,{idPrefix:'bad id'}));assert.equal(target.textContent,'Keep this content');
 const bundle=await build({stdin:{contents:"export {renderServiceDirectory,mountServiceDirectory} from '@notabenda/core/services';",resolveDir:new URL('../../../',import.meta.url).pathname},bundle:true,write:false,metafile:true,platform:'browser',format:'esm'});assert.ok(Object.keys(bundle.metafile.inputs).every(path=>!path.includes('/catalog')&&!path.includes('node:')&&!path.includes('@notabenda/cloudflare')));dom.window.close();
});
