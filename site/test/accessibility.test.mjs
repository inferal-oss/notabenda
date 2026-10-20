// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAccessibilityAudit,auditAccessibility,accessibilityTags} from '../../scripts/accessibility-audit.mjs';
import axe from 'axe-core';
import {accessibilityFixtureData} from '../../scripts/accessibility-fixtures.mjs';
import {createConsentRuntime,mountControls} from 'notabenda/consent';
import {createTermsAcceptance,mountTermsAcceptance,createFormPermission,mountFormPermission} from 'notabenda';
import {mountSetup} from 'notabenda/setup/ui';
const shell='<!doctype html><html lang="en"><head><title>Component check</title></head><body><main id="main"><h1>Settings</h1><div id="component"></div></main></body></html>';
function visibleLabels(document){
 const words=value=>value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 for(const element of document.querySelectorAll('.topic-actions a[aria-label],.nb-setup-step[aria-label],.nb-setup-practice-notes>summary[aria-label],.nb-setup-navigation button[aria-label]')){
  const copy=element.cloneNode(true);for(const hidden of copy.querySelectorAll('[aria-hidden="true"]'))hidden.remove();
  assert.ok(words(element.getAttribute('aria-label')).includes(words(copy.textContent)),'Visible label missing from accessible name: '+copy.textContent);
 }
}
function clean(result){assert.deepEqual(result.violations,[],result.label);assert.deepEqual(result.structural,[],result.label);assert.deepEqual(result.warnings,[],result.label);assert.equal(result.incomplete.some(v=>v.id==='aria-prohibited-attr'),false,result.label+' has unresolved naming semantics');assert.equal(result.environment,'jsdom-semantic-only');assert.deepEqual(result.excludedRules,['color-contrast','label-content-name-mismatch']);}

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
 for(const path of ['index.html','guide/project/index.html','guide/agent-setup/index.html','examples/index.html','examples/privacy-choices/index.html','choices/index.html','dark/choices/index.html','google-basic/index.html','dark/google-basic/index.html','agreement/index.html','technology/index.html']){
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
