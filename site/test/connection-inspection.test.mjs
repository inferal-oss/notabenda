// @requirements REQ-PRODUCT-CONNECTION-INSPECTION REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createConsent} from '@notabenda/core';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {mountConnectionInspector} from '../../examples/static/connection-inspector.mjs';
import {exampleConsentConfig} from '../../examples/static/choices-build.mjs';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';

const shell='<!doctype html><html lang="en"><head><title>Connection</title></head><body><main><h1>Connection</h1><details open><summary>Inspect this connection</summary><button type="button">Inspect runtime</button><p role="status"></p><div data-connection-output hidden></div></details></main></body></html>';
test('example inspection separates observations, invalidates stale results and retains semantic controls',async()=>{
 const c=exampleConsentConfig(JSON.parse(await readFile(new URL('../../examples/static/notabenda.config.json',import.meta.url),'utf8')));for(const d of Object.values(c.documents))d.review.status='reviewed';let starts=0;const controller=createConsent(compileConsentRuntimeConfig(c,{evidence:'local',mode:'preview'}),{storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},schedule:()=>()=>{}}),audit=await createAccessibilityAudit(shell,{label:'connection inspection'}),root=audit.dom.window.document.querySelector('details');
 const ui=mountConnectionInspector(root,controller,compileConsentRuntimeConfig(c,{mode:'preview',evidence:'local'}));
 try{assert.match(root.textContent,/Matches the intended descriptor/);assert.match(root.textContent,/0 of 2 registered/);assert.match(root.textContent,/Not checked/);assert.match(root.textContent,/Not tested/);assert.equal(root.querySelectorAll('a[download]').length,1);assert.deepEqual((await audit.scan()).violations,[]);
  controller.registerService('sample-measurements',{purposes:['measurement'],start:()=>{starts++;return ()=>{};}});assert.equal(root.querySelector('[data-connection-output]').hidden,true);assert.equal(root.querySelector('a[download]'),null);assert.match(root.querySelector('[role=status]').textContent,/controller changed/);root.querySelector('button').click();assert.match(root.textContent,/1 of 2 registered/);assert.equal(starts,0);assert.deepEqual((await audit.scan()).violations,[]);
 }finally{ui.destroy();controller.destroy();audit.close();}
});
