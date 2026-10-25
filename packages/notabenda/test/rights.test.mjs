import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-EU-NOTICE REQ-US-CA-CHOICES REQ-US-VA-RIGHTS
// @requirements REQ-PRODUCT-RIGHTS-CENTER REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {renderRightsCenter,renderRightsPage,renderLegalLinks,toPublicConfig,validateSiteConfig} from '@notabenda/core';
import {RightsCenter} from '@notabenda/core/react/documents';
import {compileLegalDocuments} from '@notabenda/core/content';
import {compileAuthoredDocuments} from '@notabenda/authoring';
import {recordLegalRelease,createDocumentHistory} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {rightsExampleConfig,rightsFiles} from '../../../examples/rights/build.mjs';
import {fixture} from './helpers.mjs';
import {createSetupPlan} from '@notabenda/core/setup';
const configured=async()=>rightsExampleConfig(await fixture({reviewed:true}),{reviewed:true});

test('guided setup recommends operator-owned rights entry points without inventing actions and reopens review on imported pages',async()=>{
 const answers={schemaVersion:1,markets:[],answers:{'personal-data':{choice:'yes',justification:'Fictional account service for this test.'}}};
 const fresh=createSetupPlan(answers);assert.equal(fresh.config.rightsCenter,undefined);
 const recommendation=fresh.report.recommendations.find(item=>item.id==='personal-data');assert.ok(recommendation.configPaths.includes('rightsCenter'));assert.ok(recommendation.requirementIds.includes('REQ-PRODUCT-RIGHTS-CENTER'));
 const config=await configured(),plan=createSetupPlan(answers,{config});assert.equal(plan.config.rightsCenter.reviewStatus,'draft');assert.equal(config.rightsCenter.reviewStatus,'reviewed');assert.deepEqual(plan.config.rightsCenter.actions,config.rightsCenter.actions);assert.equal(plan.config.rightsCenter.contact.href,config.rightsCenter.contact.href);assert.ok(plan.report.reviewItems.some(item=>item.includes('Review the imported rights page')));assert.equal(plan.report.productionReady,false);
});

test('an optional rights center compiles a script-free supporting page, links it and binds its public declaration without changing legal artifact kinds',async()=>{
 const config=await configured(),build=compileLegalDocuments(config);assert.equal(build.publicConfig.privacy.rightsUrl,'/rights');assert.ok(build.files['rights/index.html']);assert.deepEqual(Object.keys(build.artifact.documents),['privacy','cookies','terms']);assert.equal(Object.keys(build.artifact.pages).length,3);assert.equal(build.files['rights/index.html'],renderRightsPage(config,{stylesheetUrl:'/assets/notabenda.css'}));
 assert.match(build.artifact.pages['rights/privacy/index.html'],/href="\/rights"/);assert.match(renderLegalLinks(config),/Privacy requests/);
 const storage=createSyntheticStorage([]);await recordLegalRelease(storage,build.artifact);const archived=await storage.get('notabenda/releases/'+build.manifest.artifactId);assert.equal(archived.artifact.publicConfig.rightsCenter.revision,'rights-2');assert.equal(Object.hasOwn((await createDocumentHistory(storage).get(build.manifest.artifactId)).data,'publicConfig'),false);
 const changed=structuredClone(config);changed.rightsCenter.actions[0].description='Changed operator guidance.';changed.rightsCenter.revision='rights-3';assert.notEqual(compileLegalDocuments(changed).manifest.artifactId,build.manifest.artifactId);
});

// @requirements REQ-PRODUCT-RETAINED-RELEASES
test('revised rights example keeps previous artifact URLs and their exact legal HTML',async()=>{
 const base=await fixture(),files=await rightsFiles(base);
 const retained=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../../../examples/rights/retained-artifacts.json',import.meta.url),'utf8'));
 assert.equal(retained.length,2);
 for(const artifact of retained){
  assert.equal(artifact.publicConfig.rightsCenter.revision,'rights-1');
  assert.deepEqual(JSON.parse(files[`artifacts/${artifact.manifest.artifactId}.json`]),artifact);
  for(const document of artifact.manifest.documents)assert.equal(files[`artifacts/${artifact.manifest.artifactId}/${document.kind}.html`],artifact.pages[document.file]);
 }
 for(const prefix of ['','/dark']){
  const current=compileLegalDocuments(rightsExampleConfig(base,{prefix}),{mode:'preview',stylesheetUrl:prefix?'/assets/dark.css':'/assets/notabenda.css'});
  assert.equal(current.publicConfig.rightsCenter.revision,'rights-2');
  assert.ok(retained.every(a=>a.manifest.artifactId!==current.manifest.artifactId));
  assert.equal(files[prefix.slice(1)+(prefix?'/':'')+'rights/index.html'],current.files[prefix.slice(1)+(prefix?'/':'')+'rights/index.html']);
 }
});

test('no rights actions are inferred from jurisdictions, published claims or a consent choice',async()=>{
 const config=await fixture({reviewed:true});assert.equal(toPublicConfig(config).rightsCenter,undefined);assert.throws(()=>renderRightsCenter(config));assert.doesNotMatch(renderLegalLinks(config),/Privacy requests/);
 const phone=await configured();phone.rightsCenter.contact.href='tel:+12025550123';assert.match(renderRightsCenter(phone),/href="tel:\+12025550123"/);
 const supplied=await configured();supplied.rightsCenter.actions=[supplied.rightsCenter.actions[0]];supplied.jurisdictions=['EU-EEA','US-VA'];const dom=new JSDOM(renderRightsCenter(supplied));assert.equal(dom.window.document.querySelectorAll('.nb-rights-action').length,1);assert.doesNotMatch(dom.window.document.querySelector('.nb-rights-grid').textContent,/appeal|erasure|withdrawal/i);dom.window.close();
});

test('rights navigation has no collection fields, implicit submission, storage writes or consent/terms mutation',async()=>{
 const config=await configured();config.services.push({id:'optional-read',name:'Fictional reading helper',provider:'Fictional operator',location:'This test only',purposeIds:[config.purposes[0].id]});config.consent={purposes:[{id:config.purposes[0].id,scope:'one'}],services:[{id:'optional-read',scope:'one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:60};const storage=new Map();const controller=createConsent(config,{storage:{getItem:key=>storage.get(key)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});const before=controller.getSnapshot();
 const dom=new JSDOM(renderRightsPage(config));assert.equal(dom.window.document.querySelectorAll('script,form,input,textarea,button').length,0);assert.equal(storage.size,0);assert.deepEqual(controller.getSnapshot(),before);assert.match(dom.window.document.querySelector('.nb-rights-contact a').href,/^mailto:/);assert.doesNotMatch(dom.window.document.body.textContent,/successfully submitted|request received/i);dom.window.close();controller.destroy();
});

test('review and placeholders block production while preview shows its state; malformed and ambiguous declarations fail closed',async()=>{
 const config=await configured(),bad=change=>{const c=structuredClone(config);change(c);assert.equal(validateSiteConfig(c).valid,false);assert.throws(()=>renderRightsCenter(c));};
 for(const mutate of [c=>c.rightsCenter.actions=[],c=>c.rightsCenter.actions.push(c.rightsCenter.actions[0]),c=>c.rightsCenter.actions[0].id='bad id',c=>c.rightsCenter.actions[0].kind='grant-access',c=>c.rightsCenter.actions[0].kind=['access'],c=>c.rightsCenter.reviewStatus=['draft'],c=>c.rightsCenter.reviewStatus={toString:()=> 'reviewed'},c=>c.rightsCenter.contact.href='tel:+12025550123?body=private',c=>c.rightsCenter.contact.href='/login',c=>c.rightsCenter.contact.href='mailto:privacy@example.test?body=private',c=>c.rightsCenter.actions[0].link.href='javascript:alert(1)',c=>c.rightsCenter.actions[0].link.href='//attacker.test/',c=>c.rightsCenter.actions[0].link.href='https://user:secret@example.test/',c=>c.rightsCenter.route=c.documents.privacy.route,c=>c.rightsCenter.route=c.documents.privacy.route.toUpperCase(),c=>c.documents.cookies.route=c.documents.privacy.route.toUpperCase(),c=>c.privacy.rightsUrl='/different-center',c=>c.rightsCenter.nextSteps=[],c=>c.rightsCenter.reviewed=true,c=>c.rightsCenter.actions[0].submitted=true,c=>c.rightsCenter.revision='x'.repeat(201),c=>c.rightsCenter.actions[0].description='x'.repeat(2001)])bad(mutate);
 config.rightsCenter.reviewStatus='draft';assert.throws(()=>renderRightsCenter(config));assert.throws(()=>renderRightsPage(config));assert.throws(()=>renderToStaticMarkup(createElement(RightsCenter,{config})));assert.throws(()=>renderRightsCenter(config,{mode:'production'}));assert.match(renderRightsCenter(config,{mode:'preview'}),/Draft rights information/);
 config.rightsCenter.reviewStatus='reviewed';config.rightsCenter.intro='{{review-this}}';assert.equal(validateSiteConfig(config,{mode:'production'}).valid,false);
});

test('all public wording is escaped, snapshots are detached and private notes stay out of files and the page',async()=>{
 const config=await configured();config.private={workflowNotes:'PRIVATE-ASSESSMENT'};config.rightsCenter.title='<img src=x onerror=alert(1)>';config.rightsCenter.actions[0].description='</section><script>alert(1)</script>';const publicConfig=toPublicConfig(config);publicConfig.rightsCenter.actions[0].title='Changed copy';assert.notEqual(publicConfig.rightsCenter.actions[0].title,config.rightsCenter.actions[0].title);const build=compileLegalDocuments(config);assert.ok(!JSON.stringify(build).includes('PRIVATE-ASSESSMENT'));
 const dom=new JSDOM(build.files['rights/index.html']);assert.equal(dom.window.document.querySelectorAll('script,img').length,0);assert.match(dom.window.document.body.textContent,/<img src=x/);assert.match(dom.window.document.body.textContent,/<script>alert/);dom.window.close();
});

test('native headings, IDs and links provide an accessible static surface and React renders the identical core fragment',async()=>{
 const config=await configured(),html=renderRightsCenter(config,{idPrefix:'account-help',headingLevel:3});assert.equal(renderToStaticMarkup(createElement(RightsCenter,{config,idPrefix:'account-help',headingLevel:3})),`<div>${html}</div>`);
 const dom=new JSDOM(html),doc=dom.window.document;assert.equal(doc.querySelector('h3').textContent,config.rightsCenter.title);assert.equal(doc.querySelectorAll('h4').length,config.rightsCenter.actions.length+2);const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const section of doc.querySelectorAll('[aria-labelledby]'))assert.ok(doc.getElementById(section.getAttribute('aria-labelledby')));assert.throws(()=>renderRightsCenter(config,{idPrefix:'<bad>'}));assert.throws(()=>renderRightsCenter(config,{headingLevel:6}));assert.throws(()=>renderRightsPage(config,{stylesheetUrl:'javascript:alert(1)'}));dom.window.close();
});

test('Markdown and MDX legal authoring retain the supporting rights page while immutable archive pages remain exactly the three legal documents',async()=>{
 for(const format of ['md','mdx']){
  const config=await configured();const source='---\nkind: terms\ntitle: Sample terms\nroute: /rights/terms\nversion: authored-1\neffectiveDate: 2026-10-18\nreview:\n  status: reviewed\n---\n## A sample\n\nFictional terms.';
  const result=await compileAuthoredDocuments(config,{terms:{format,source}});assert.ok(result.files['rights/index.html']);assert.match(result.files['rights/index.html'],/Your information/);assert.equal(Object.keys(result.artifact.pages).length,3);await recordLegalRelease(createSyntheticStorage([]),result.archive);
 }
});
