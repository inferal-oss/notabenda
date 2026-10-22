// @requirements REQ-PRODUCT-COLLECTION-REHEARSAL REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {mountCollectionWorkbench} from '@notabenda/core/authoring/collection/ui';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const read=p=>readFile(new URL('../dist/public/'+p,import.meta.url),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,0));
const button=(d,label)=>[...d.querySelectorAll('button')].find(b=>b.textContent===label);
test('the built form workbench delivers rehearsal with isolated assets and accessible notice/choice associations',async()=>{
 const html=await read('form-notice-workbench/index.html'),app=await read('form-notice-workbench/workbench.js');assert.match(app,/Try form flow/);assert.match(app,/Response lost after recording/);assert.doesNotMatch(app,/from[\s\"\x27]+node:|import[\s(\"\x27]+node:|\.indexedDB\b|\.localStorage\b|\.sessionStorage\b/);
 for(const name of ['assets/consent.mjs','assets/consent.css'])assert.doesNotMatch(await read(name),/nb-collection-rehearsal|Try ordinary submission/);
 const dom=new JSDOM(html,{url:'https://notabenda.example.test/form-notice-workbench/'}),d=dom.window.document;dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const ui=mountCollectionWorkbench(d.querySelector('#collection-workbench'),{context:JSON.parse(d.querySelector('#collection-workbench-context').textContent)});
 try{d.querySelector('[data-workbench=release]').checked=true;button(d,'Try form flow').click();for(let i=0;i<30&&!d.querySelector('.nb-collection-rehearsal .nb-form-permission');i++)await tick();assert.ok(d.querySelector('dialog[open]'));assert.ok(d.querySelector('.nb-form-permission'));assert.equal(d.querySelector('.nb-collection-rehearsal a[href]'),null);
  const audit=await createAccessibilityAudit(dom.serialize(),{label:'collection form rehearsal'});try{const result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);}finally{audit.close();}
 }finally{ui.destroy();dom.window.close();}
});
