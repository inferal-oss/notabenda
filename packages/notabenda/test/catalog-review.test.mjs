/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SETUP REQ-PRODUCT-A11Y */
import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {createCatalogSelectionPlan,normalizeSetupCatalogSelections} from '@notabenda/core/catalog/selection';
import {prepareCatalogSelectionReview,confirmCatalogSelectionReview,readSetupCatalogRevisions,normalizeCatalogSelectionRevisions} from '@notabenda/core/catalog/review';
import {mountCatalogSelectionReview} from '@notabenda/core/catalog/ui';import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {createSetupPlan} from '@notabenda/core/setup';import {mountSetup} from '@notabenda/core/setup/ui';import {compileLegalDocuments} from '@notabenda/core/content';
import {fixture} from './helpers.mjs';import {promptCatalogSelectionReview} from '../dist/catalog-review-cli.js';
const answers={schemaVersion:1,markets:[],answers:{}};
const initial=async()=>createCatalogSelectionPlan(await fixture({reviewed:true}),serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Reviewed entity',location:'Region A',justification:'OLD_PRIVATE_REASON',confirmed:true});
function browser(){const dom=new JSDOM('<div id="root"></div>',{url:'https://operator.example.test/setup'});dom.window.URL.createObjectURL=()=> 'blob:test';dom.window.URL.revokeObjectURL=()=>{};return {dom,root:dom.window.document.getElementById('root')};}
const button=(root,text)=>[...root.querySelectorAll('button')].find(b=>b.textContent===text);
const finish=(root,reason='NEW_PRIVATE_REASON')=>{root.querySelector('.nb-catalog-review textarea').value=reason;root.querySelector('.nb-catalog-review input[type=checkbox]').checked=true;button(root,'Confirm renewed review').click();};

test('renewal compares changed purpose/provider facts and preserves enforcement fields, unrelated data and prior pins',async()=>{
 const {config,selection}=await initial();config.services.at(-1).provider='Actual entity B';config.services.at(-1).resourceOrigins=['https://payment.example.test'];config.services.at(-1).processingActivities=[];config.purposes[0].description+=' Updated actual use';const original=structuredClone(config),old=structuredClone(selection);
 const review=prepareCatalogSelectionReview(config,selection);assert.deepEqual(review.changes,['service','purposes']);assert.equal(review.proposed.reference.revision,selection.reference.revision);assert.deepEqual(config,original);assert.deepEqual(selection,old);
 const result=confirmCatalogSelectionReview(config,review,{confirmed:true,justification:'NEW_PRIVATE_REASON'});assert.deepEqual(result.config.services,config.services);assert.deepEqual(result.config.storage,config.storage);assert.deepEqual(result.config.consent,config.consent);assert.equal(normalizeSetupCatalogSelections([result.selection],result.config).length,1);assert.equal(result.revision.previous.justification,'OLD_PRIVATE_REASON');assert.equal(result.revision.next.justification,'NEW_PRIVATE_REASON');assert.deepEqual(config,original);assert.deepEqual(selection,old);
 const plan=createSetupPlan(answers,{config:result.config,catalogSelections:[result.selection],catalogSelectionRevisions:[result.revision]});assert.equal(readSetupCatalogRevisions(plan.report)[0].previous.reference.revision,selection.reference.revision);assert.doesNotMatch(JSON.stringify(compileLegalDocuments(plan.config,{mode:'preview'})),/OLD_PRIVATE_REASON|NEW_PRIVATE_REASON|catalog-selection-review|catalogSelectionRevisions/);
});

test('a reference-only revision changes private provenance while leaving public inventory and compiled documents unchanged',async()=>{
 const {config,selection}=await initial();for(const d of Object.values(config.documents))d.review.status='reviewed';const before=compileLegalDocuments(config,{mode:'preview'}),catalog=structuredClone(selection.reference);catalog.revision='new-reference';catalog.sources[0].note+=' Newly reviewed source note';
 const review=prepareCatalogSelectionReview(config,selection,catalog);assert.deepEqual(review.changes,['reference']);const result=confirmCatalogSelectionReview(config,review,{confirmed:true,justification:'Checked the source correction'});
 assert.deepEqual(result.config,config);assert.deepEqual(compileLegalDocuments(result.config,{mode:'preview'}),before);assert.equal(result.selection.reference.revision,'new-reference');assert.equal(selection.reference.revision,serviceCatalogSeed.revision);
 const renamed=structuredClone(catalog);renamed.products[0].name='Updated product label';const renamedReview=prepareCatalogSelectionReview(config,selection,renamed);assert.deepEqual(renamedReview.changes,['reference']);const changed=confirmCatalogSelectionReview(config,renamedReview,{confirmed:true,justification:'Reviewed label change'});assert.equal(changed.config.services.at(-1).name,config.services.at(-1).name);assert.deepEqual(changed.config,config);
});

test('confirmation rejects stale full service facts, purpose facts, forged comparisons, missing confirmation and executable inputs',async()=>{
 const {config,selection}=await initial(),review=prepareCatalogSelectionReview(config,selection);
 for(const mutate of [c=>c.services.at(-1).provider='Other entity',c=>c.services.at(-1).resourceOrigins=['https://changed.test'],c=>c.purposes[0].retention='A new lifetime']){const changed=structuredClone(config);mutate(changed);assert.throws(()=>confirmCatalogSelectionReview(changed,review,{confirmed:true,justification:'Reason'}),/changed/);}
 for(const mutate of [r=>r.changes.push('reference'),r=>r.currentService.name='Forged',r=>r.proposed.service.name='Forged']){const forged=structuredClone(review);mutate(forged);assert.throws(()=>confirmCatalogSelectionReview(config,forged,{confirmed:true,justification:'Reason'}));}
 assert.throws(()=>confirmCatalogSelectionReview(config,review,{confirmed:false,justification:'Reason'}));assert.throws(()=>confirmCatalogSelectionReview(config,review,{confirmed:true,justification:''}));
 let invoked=0;const hostile={get previous(){invoked++;return selection;}};assert.throws(()=>confirmCatalogSelectionReview(config,hostile,{confirmed:true,justification:'Reason'}));assert.equal(invoked,0);
 const other=structuredClone(selection.reference);other.id='different-catalog';assert.throws(()=>prepareCatalogSelectionReview(config,selection,other),/same catalog identity/);const missing=structuredClone(config);missing.services.pop();assert.throws(()=>prepareCatalogSelectionReview(missing,selection),/no matching service/);
});

test('private revision logs are bounded, detached, validated and retained through report resume',async()=>{
 const {config,selection}=await initial(),result=confirmCatalogSelectionReview(config,prepareCatalogSelectionReview(config,selection),{confirmed:true,justification:'New reason'});
 const history=normalizeCatalogSelectionRevisions([result.revision]);history[0].previous.reference.revision='Modified copy';assert.notEqual(result.revision.previous.reference.revision,'Modified copy');assert.deepEqual(readSetupCatalogRevisions(answers),[]);
 assert.throws(()=>normalizeCatalogSelectionRevisions(Array(33).fill(result.revision)));assert.throws(()=>normalizeCatalogSelectionRevisions([{...result.revision,extra:true}]));const changed=structuredClone(result.revision);changed.next.service.id='another';assert.throws(()=>normalizeCatalogSelectionRevisions([changed]),/same local service/);
 const report=createSetupPlan(answers,{config:result.config,catalogSelections:[result.selection],catalogSelectionRevisions:[result.revision]}).report;
 assert.deepEqual(createSetupPlan(answers,{config,catalogSelections:report.catalogSelections,catalogSelectionRevisions:readSetupCatalogRevisions(report)}).report.catalogSelectionRevisions,report.catalogSelectionRevisions);
});

test('operator UI requires explicit new review, displays current facts, resets consent after reference changes and never applies stale snapshots',async()=>{
 const f=browser(),{config,selection}=await initial();let current=config,calls=0,last;const latest=structuredClone(selection.reference);latest.revision='latest-reference';
 const ui=mountCatalogSelectionReview(f.root,{previous:selection,getConfig:()=>current,catalog:latest,onConfirm:r=>{calls++;last=r;}});
 assert.equal(f.dom.window.document.activeElement,f.root.querySelector('h3'));assert.match(f.root.textContent,/Prior review/);assert.match(f.root.textContent,/Proposed review/);assert.equal(f.root.querySelector('textarea').value,'');button(f.root,'Confirm renewed review').click();assert.equal(calls,0);
 finish(f.root);assert.equal(calls,1);assert.equal(last.selection.reference.revision,selection.reference.revision);
 button(f.root,'Compare current reference catalog').click();await new Promise(r=>setImmediate(r));assert.match(f.root.textContent,/latest-reference/);assert.equal(f.root.querySelector('input[type=checkbox]').checked,false);assert.equal(f.root.querySelector('textarea').value,'');
 current=structuredClone(config);current.purposes[0].description='Changed while reviewing';finish(f.root);assert.equal(calls,1);assert.match(f.root.querySelector('[role=alert]').textContent,/reopen/);ui.destroy();f.dom.window.close();
});

test('failed and late reference loads cannot confirm an obsolete proposal or mutate a destroyed UI',async()=>{
 const f=browser(),{config,selection}=await initial();let attempts=0,resolve;
 const ui=mountCatalogSelectionReview(f.root,{previous:selection,getConfig:()=>config,loadCatalog:()=>++attempts===1?Promise.reject(Error('PRIVATE_ERROR')):new Promise(r=>{resolve=r;}),onConfirm:()=>assert.fail()});
 button(f.root,'Compare current reference catalog').click();assert.equal(button(f.root,'Confirm renewed review').disabled,true);await new Promise(r=>setImmediate(r));assert.equal(button(f.root,'Confirm renewed review').disabled,true);assert.doesNotMatch(f.root.textContent,/PRIVATE_ERROR/);button(f.root,'Compare current reference catalog').click();ui.destroy();resolve(selection.reference);await new Promise(r=>setImmediate(r));assert.equal(f.root.childElementCount,0);f.dom.window.close();
});

test('setup renews stale notes without removing the service and exports prior/new pins privately',async()=>{
 const f=browser(),{config,selection}=await initial();const old=createSetupPlan(answers,{config,catalogSelections:[selection]});config.purposes[0].description+=' Changed use';const ui=mountSetup(f.root,{config,answers:old.report,catalog:serviceCatalogSeed});
 assert.match(f.root.textContent,/Needs renewed review/);button(f.root,'Re-review Stripe payment libraries').click();finish(f.root);f.root.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{cancelable:true}));const plan=ui.getPlan();assert.ok(plan);assert.equal(plan.config.services.length,config.services.length);assert.equal(plan.report.catalogSelections[0].purposes[0].description,config.purposes[0].description);assert.equal(plan.report.catalogSelectionRevisions.length,1);assert.equal(plan.report.catalogSelectionRevisions[0].previous.justification,'OLD_PRIVATE_REASON');assert.match(f.root.textContent,/Downloads are ready/);ui.destroy();f.dom.window.close();
});

test('CLI prompt cancellation leaves pins alone, confirmation requires a renewed reason',async()=>{
 const {config,selection}=await initial(),review=prepareCatalogSelectionReview(config,selection),before=structuredClone(config);const prompts=[];let values=['Unused new reason','no'];const ask=async p=>{prompts.push(p);return values.shift();};
 assert.equal(await promptCatalogSelectionReview(config,review,ask),undefined);assert.deepEqual(config,before);assert.equal(selection.justification,'OLD_PRIVATE_REASON');values=['New reason','yes'];const result=await promptCatalogSelectionReview(config,review,ask);assert.equal(result.selection.justification,'New reason');values=['','yes'];await assert.rejects(promptCatalogSelectionReview(config,review,ask));assert.equal(prompts.length,6);
});

test('operator-renamed services stay named and focused report refresh never reapplies old site/contact/scope answers',async()=>{
 const {config,selection}=await initial();config.services.at(-1).name='Actual checkout service';config.site.name='Current site';config.controller.email='current@example.test';for(const doc of Object.values(config.documents))doc.review.status='reviewed';
 const review=prepareCatalogSelectionReview(config,selection);assert.deepEqual(review.changes,['service']);assert.equal(review.proposed.service.name,'Actual checkout service');const result=confirmCatalogSelectionReview(config,review,{confirmed:true,justification:'Confirmed custom service name'});assert.deepEqual(result.config,config);
 const historical={schemaVersion:1,markets:[],publicFacts:{siteName:'Old site',controllerEmail:'old@example.test'},answers:{children:{choice:'yes',justification:'Historical assessment'}}};
 const plan=createSetupPlan(historical,{config:result.config,catalogSelections:[result.selection],catalogSelectionRevisions:[result.revision],preserveConfig:true});assert.deepEqual(plan.config,config);assert.equal(plan.report.answers.publicFacts.siteName,'Old site');assert.equal(plan.report.catalogSelectionRevisions[0].next.service.name,'Actual checkout service');assert.match(plan.report.reviewItems.join(' '),/context only/);
 const f=browser();const ui=mountCatalogSelectionReview(f.root,{previous:selection,getConfig:()=>config,onConfirm:()=>{}});assert.match(f.root.querySelector('[role=status]').textContent,/service disclosure/);assert.match(f.root.textContent,/Actual checkout service/);ui.destroy();f.dom.window.close();
});
