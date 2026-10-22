// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-CF-HOST REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {publicResponse} from '../host.mjs';
import {mountCollectionWorkbench} from '@notabenda/core/authoring/collection/ui';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const read=p=>readFile(new URL('../dist/public/'+p,import.meta.url),'utf8');
test('the built workbench uses the reusable UI, declared sample release, script-only route and demo marker',async()=>{
 const html=await read('form-notice-workbench/index.html'),d=new JSDOM(html).window.document;assert.ok(d.querySelector('.demo-corner'));assert.ok(d.querySelector('script[src="./workbench.js"]'));assert.equal(d.querySelector('script[type=module]:not([src])'),null);const c=JSON.parse(d.querySelector('#collection-workbench-context').textContent),flow=JSON.parse(await read('collection-flow/flow.json'));assert.equal(c.facts.artifactId,flow.artifactId);assert.deepEqual(c.initial.flow,flow);assert.equal(c.buildMethod,'configuration');assert.equal(c.pages,undefined);assert.match(await read('guide/collection-workbench/index.md'),/same final build pipeline/);
 for(const path of ['/form-notice-workbench/','/form-notice-workbench/index.html'])assert.match(publicResponse(new Response(html),path).headers.get('Content-Security-Policy'),/script-src 'self'/);
 assert.doesNotMatch(publicResponse(new Response('<p>Guide</p>'),'/guide/collection-workbench/').headers.get('Content-Security-Policy'),/script-src/);
 assert.match(await read('examples/privacy-information/index.html'),/form-notice-workbench/);
 const dom=new JSDOM(html);dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};const ui=mountCollectionWorkbench(dom.window.document.querySelector('#collection-workbench'),{context:c});
 try{const preview=[...dom.window.document.querySelectorAll('button')].find(b=>b.textContent==='Preview notice');preview.click();const audit=await createAccessibilityAudit(dom.serialize(),{label:'collection workbench preview'});try{const result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);}finally{audit.close();}}finally{ui.destroy();dom.window.close();}
});
