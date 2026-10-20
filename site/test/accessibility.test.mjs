// @requirements REQ-PRODUCT-STORAGE-AUTHORING
// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAccessibilityAudit,auditAccessibility,accessibilityTags} from '../../scripts/accessibility-audit.mjs';
import axe from 'axe-core';
import {accessibilityFixtureData} from '../../scripts/accessibility-fixtures.mjs';
import {createConsentRuntime,mountControls} from '@notabenda/core/consent';
import {createTermsAcceptance,mountTermsAcceptance,createFormPermission,mountFormPermission} from '@notabenda/core';
import {mountSetup} from '@notabenda/core/setup/ui';
import {mountCartridgeConsole} from '@notabenda/core/cartridges/ui';
import {selectCartridges} from '@notabenda/core/cartridges';
import {createWorkspaceOverviewWorker} from '@notabenda/cloudflare';
import {mountLegalPreview} from '@notabenda/core/setup/preview';
import {mountConsentEditor} from '@notabenda/core/setup/consent/ui';
import {mountRightsEditor} from '@notabenda/core/setup/rights/ui';
import {mountStorageEditor} from '@notabenda/core/setup/storage/ui';
import {renderRightsPage} from '@notabenda/core';
import {localizedExampleConfig} from '../../examples/localization/config.mjs';
import {localizedRightsConfig} from '../../examples/localization/rights-build.mjs';
const shell='<!doctype html><html lang="en"><head><title>Component check</title></head><body><main id="main"><h1>Settings</h1><div id="component"></div></main></body></html>';
function visibleLabels(document){
 const words=value=>value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 for(const element of document.querySelectorAll('.topic-actions a[aria-label],.nb-setup-step[aria-label],.nb-setup-practice-notes>summary[aria-label],.nb-setup-navigation button[aria-label]')){
  const copy=element.cloneNode(true);for(const hidden of copy.querySelectorAll('[aria-hidden="true"]'))hidden.remove();
  assert.ok(words(element.getAttribute('aria-label')).includes(words(copy.textContent)),'Visible label missing from accessible name: '+copy.textContent);
 }
}
function clean(result){assert.deepEqual(result.violations,[],result.label);assert.deepEqual(result.structural,[],result.label);assert.deepEqual(result.warnings,[],result.label);assert.equal(result.incomplete.some(v=>v.id==='aria-prohibited-attr'),false,result.label+' has unresolved naming semantics');assert.equal(result.environment,'jsdom-semantic-only');assert.deepEqual(result.excludedRules,['color-contrast','label-content-name-mismatch']);}

// @requirements REQ-PRODUCT-CONSENT-AUTHORING
test('consent authoring labels its services, included purposes, memory fields and validation feedback',async()=>{
 const data=await accessibilityFixtureData(),audit=await createAccessibilityAudit(shell,{label:'consent settings editor'}),d=audit.dom.window.document;
 let config=structuredClone(data.config);delete config.consent;config.storage=[];
 const ui=mountConsentEditor(d.querySelector('#component'),{getConfig:()=>config,onChange:plan=>{config=plan.config;}});
 try{
  ui.open();clean(await audit.scan());
  const check=d.querySelector('.nb-setup-consent-service input[type=checkbox]');assert.ok(check);check.checked=true;check.dispatchEvent(new audit.dom.window.Event('change',{bubbles:true}));clean(await audit.scan());
  const save=[...d.querySelectorAll('button')].find(b=>b.textContent==='Save control settings');save.click();assert.equal(d.activeElement.getAttribute('aria-invalid'),'true');clean(await audit.scan());
  for(const input of d.querySelectorAll('.nb-setup-consent-panel input[required]:not(:disabled)'))input.value=input.type==='number'?'30':'reviewed-use-1';
  save.click();assert.ok(config.consent);clean(await audit.scan());
 }finally{ui.destroy();audit.close();}
});

// @requirements REQ-PRODUCT-CARTRIDGES
test('the deliberate page preview names its dialog, document choices and legal contents',async()=>{
 const data=await accessibilityFixtureData(),audit=await createAccessibilityAudit(shell,{label:'local document preview'}),d=audit.dom.window.document;
 audit.dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};audit.dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const ui=mountLegalPreview(d.querySelector('#component'),{config:data.config});
 try{ui.open();for(const kind of ['privacy','cookies','terms']){const buttons=[...d.querySelectorAll('.nb-legal-preview-navigation button')];buttons[['privacy','cookies','terms'].indexOf(kind)].click();clean(await audit.scan());}}finally{ui.destroy();audit.close();}
});

// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
test('operator overview and cross-area finder have native labels, headings and reachable records',async()=>{
 const areas=[{id:'choices',title:'Cookie choices',description:'Inspect choices and their notices.',href:'/workspace/choices',primary:true,store:{list:async()=>({records:[{id:'record-one',data:{kind:'inspection-note',subjectId:'reader'}}]}),get:async()=>undefined}}];
 const worker=createWorkspaceOverviewWorker({basePath:'/workspace',setupPath:'/workspace/setup',authorize:()=>({areas,allowSetup:true})});
 for(const query of ['', '?q=reader']){const response=await worker.fetch(new Request('https://example.test/workspace'+query),{}),audit=await createAccessibilityAudit(await response.text(),{label:'workspace overview '+query});try{clean(await audit.scan());assert.equal(audit.dom.window.document.querySelector('script'),null);if(query)assert.ok(audit.dom.window.document.querySelector('a[href="/workspace/choices/record?id=record-one"]'));}finally{audit.close();}}
});

// @requirements REQ-PRODUCT-CARTRIDGES
test('reusable cartridge library and its focused setup retain semantic names and focus',async()=>{
 const audit=await createAccessibilityAudit(shell.replace('<h1>Settings</h1>',''),{label:'cartridge console'}),d=audit.dom.window.document;
 audit.dom.window.URL.createObjectURL=()=> 'blob:semantic-fixture';audit.dom.window.URL.revokeObjectURL=()=>{};
 const ui=mountCartridgeConsole(d.querySelector('#component'),{cartridges:selectCartridges(['cookie-choices'])});
 try{
  clean(await audit.scan());
  d.querySelector('.cartridge-library').dispatchEvent(new audit.dom.window.Event('submit',{cancelable:true,bubbles:true}));
  assert.equal(d.activeElement.textContent,'Set up your selected packs');clean(await audit.scan());visibleLabels(d);
 }finally{ui.destroy();audit.close();}
});

// @requirements REQ-PRODUCT-PACK-CONNECTION
test('selected connection tasks, check disclosures and foundation guides have semantic structure',async()=>{
 const audit=await createAccessibilityAudit(shell.replace('<h1>Settings</h1>',''),{label:'pack connection guide'}),d=audit.dom.window.document;
 audit.dom.window.URL.createObjectURL=()=> 'blob:semantic-fixture';audit.dom.window.URL.revokeObjectURL=()=>{};
 const ui=mountCartridgeConsole(d.querySelector('#component'),{cartridges:selectCartridges(['cookie-choices','terms-agreement','it-repeat-prompts'])});
 try{
  d.querySelector('.cartridge-library').dispatchEvent(new audit.dom.window.Event('submit',{cancelable:true,bubbles:true}));
  d.querySelector('.nb-setup-form').dispatchEvent(new audit.dom.window.Event('submit',{cancelable:true,bubbles:true}));
  assert.ok(d.querySelector('.nb-setup-connection'));clean(await audit.scan());
  for(const details of d.querySelectorAll('.nb-setup-connection details'))details.open=true;
  clean(await audit.scan());
 }finally{ui.destroy();audit.close();}
});

test('the semantic guard catches real markup defects while retaining incomplete results',async()=>{
 for(const tag of new Set(axe.getRules().flatMap(rule=>rule.tags).filter(tag=>/^wcag(?:2|21|22)a{1,2}$/u.test(tag))))assert.ok(accessibilityTags.includes(tag),tag);
 const good=await auditAccessibility(shell);clean(good);assert.ok(good.incomplete.every(r=>Array.isArray(r.nodes)));
 const bad=await auditAccessibility(shell.replace('id="main"','id="wrong"').replace('<h1>Settings</h1>','<a class="nb-skip-link" href="#main">Skip</a><input><pre aria-label="Code">x</pre>'));
 assert.ok(bad.structural.some(v=>v.id==='skip-target'));assert.ok(bad.structural.some(v=>v.id==='page-heading'));
 const workspaceSkip=await auditAccessibility(shell.replace('id="main"','id="wrong"').replace('<h1>Settings</h1>','<h1>Settings</h1><a class="skip" href="#main">Skip to content</a>'));assert.ok(workspaceSkip.structural.some(v=>v.id==='skip-target'));
 assert.ok(bad.violations.some(v=>v.id==='label'));
 assert.ok([...bad.violations,...bad.incomplete].some(v=>v.id==='aria-prohibited-attr'));
 const audit=await createAccessibilityAudit(shell.replace('<div id="component"></div>','<div class="topic-actions"><a aria-label="Cookie choices" href="/choices">Open example</a></div>'));try{assert.throws(()=>visibleLabels(audit.dom.window.document),/Visible label missing/u);}finally{audit.close();}
});

test('current high-traffic pages and both Google themes retain sound semantic markup',async()=>{
 for(const path of ['start/index.html','index.html','guide/project/index.html','guide/architecture/index.html','guide/agent-setup/index.html','examples/index.html','examples/privacy-choices/index.html','choices/index.html','dark/choices/index.html','google-basic/index.html','dark/google-basic/index.html','agreement/index.html','agreement/react/index.html','dark/agreement/react/index.html','agreement/astro/index.html','agreement/astro/review/index.html','technology/index.html']){
  const audit=await createAccessibilityAudit(await readFile(new URL('../dist/public/'+path,import.meta.url),'utf8'),{label:path});try{clean(await audit.scan());visibleLabels(audit.dom.window.document);}finally{audit.close();}
 }
});

test('actual consent notice and preference states have no detected semantic violations',async()=>{
 const data=await accessibilityFixtureData();
 for(const preferences of [false,true]){
  const audit=await createAccessibilityAudit(shell,{label:'consent '+preferences}),d=audit.dom.window.document,values=new Map();
  // Semantic-only shim. Browser fixtures exercise the real modal/top-layer implementation separately.
  audit.dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};audit.dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const controller=createConsentRuntime(data.runtimeConfig,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}}),ui=mountControls(d.querySelector('#component'),{consent:controller});
  try{if(preferences)controller.openPreferences();for(const trigger of d.querySelectorAll('[aria-controls]'))assert.equal(d.querySelectorAll('[id="'+trigger.getAttribute('aria-controls')+'"]').length,1);clean(await audit.scan());}finally{ui.destroy();controller.destroy();audit.close();}
 }
});

test('agreement and form permission initial and failed-transport states retain names and labels',async()=>{
 const data=await accessibilityFixtureData();
 for(const kind of ['terms','permission'])for(const failure of [false,true]){
  const audit=await createAccessibilityAudit(shell,{label:kind+' '+failure}),host=audit.dom.window.document.querySelector('#component');
  const controller=kind==='terms'?createTermsAcceptance(data.offer,{operationId:'a11y-signup',submit:async()=>{throw Error('Fixture transport failure');}}):createFormPermission(data.permissionOffer,{streamRef:data.streamRef,read:async()=>data.permissionState,submit:async()=>{throw Error('Fixture transport failure');}});
  const ui=kind==='terms'?mountTermsAcceptance(host,{acceptance:controller}):mountFormPermission(host,{permission:controller});
  try{if(kind==='permission')await controller.refresh();if(failure){controller.setChecked(true);await assert.rejects(kind==='terms'?controller.submit():controller.grant());}clean(await audit.scan());}finally{ui.destroy();controller.destroy();audit.close();}
 }
});

test('operator evidence, release details, document comparison and setup use the same semantic checks',async()=>{
 const data=await accessibilityFixtureData();
 for(const page of data.pages){const audit=await createAccessibilityAudit(page.html,{label:page.name});try{for(const pre of audit.dom.window.document.querySelectorAll('pre'))assert.equal(pre.tabIndex,0,page.name+' keyboard-scrollable text');clean(await audit.scan());}finally{audit.close();}}
 const audit=await createAccessibilityAudit(shell,{label:'mounted setup'}),ui=mountSetup(audit.dom.window.document.querySelector('#component'),{config:data.config});
 try{clean(await audit.scan());visibleLabels(audit.dom.window.document);const reason=audit.dom.window.document.querySelector('.nb-setup-practice-notes textarea');for(const value of ['Operator supplied a private supporting note.','']){reason.value=value;reason.dispatchEvent(new audit.dom.window.Event('input',{bubbles:true}));visibleLabels(audit.dom.window.document);}}finally{ui.destroy();audit.close();}
});

// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
test('request page editor exposes labeled fields, grouped destinations and link confirmation',async()=>{
 const data=await accessibilityFixtureData(),audit=await createAccessibilityAudit(shell,{label:'request page editor'}),d=audit.dom.window.document;
 const ui=mountRightsEditor(d.querySelector('#component'),{getConfig:()=>data.config,onChange:()=>{}});
 try{ui.open();clean(await audit.scan());d.querySelector('.nb-setup-rights-actions button').click();assert.ok(d.activeElement.hasAttribute('aria-invalid'));clean(await audit.scan());const add=[...d.querySelectorAll('button')].find(b=>b.textContent==='Add destination');add.click();clean(await audit.scan());}finally{ui.destroy();audit.close();}
});

// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
test('localized request pages label sections and links in their selected language',async()=>{
 const data=await accessibilityFixtureData(),config=localizedRightsConfig(localizedExampleConfig(data.config));
 clean(await auditAccessibility(renderRightsPage(config,{mode:'preview'}),{label:'Portuguese request page'}));
});

// @requirements REQ-PRODUCT-STORAGE-AUTHORING
test('storage authoring names public fields, affected versions and the explicit local decision',async()=>{
 const data=await accessibilityFixtureData(),audit=await createAccessibilityAudit(shell,{label:'storage authoring editor'}),d=audit.dom.window.document;
 const ui=mountStorageEditor(d.querySelector('#component'),{getConfig:()=>data.config,onChange:()=>{}});
 try{ui.open();clean(await audit.scan());[...d.querySelectorAll('button')].find(b=>b.textContent==='Save storage declaration').click();assert.ok(d.activeElement.hasAttribute('aria-invalid'));clean(await audit.scan());}finally{ui.destroy();audit.close();}
});
