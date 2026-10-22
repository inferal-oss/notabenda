// @requirements REQ-PRODUCT-TERMS-REHEARSAL REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {mountTermsRehearsal} from '@notabenda/core/setup/terms-rehearsal';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const root=new URL('../dist/public/',import.meta.url);
test('terms rehearsal stays in a standalone optional setup asset, outside visitor controls',async()=>{
 const entry=await readFile(new URL('assets/cartridges.mjs',root),'utf8'),rehearsal=await readFile(new URL('assets/runtime/setup-terms-rehearsal.js',root),'utf8');
 assert.match(entry,/import\(["']\/assets\/runtime\/setup-terms-rehearsal\.js["']\)/);assert.doesNotMatch(entry,/Simulated recorder/);assert.match(rehearsal,/Simulated recorder/);assert.doesNotMatch(rehearsal,/node:|notabenda-cf|\b(?:indexedDB|localStorage|sessionStorage)\s*\./);
 const graph=await build({stdin:{contents:rehearsal},bundle:false,platform:'browser',format:'esm',write:false,metafile:true});assert.deepEqual(Object.values(graph.metafile.outputs)[0].imports,[]);
 for(const path of ['assets/consent.mjs','assets/consent.css'])assert.doesNotMatch(await readFile(new URL(path,root),'utf8'),/nb-terms-rehearsal|Simulated recorder|setup-terms-rehearsal/);
 const guide=await readFile(new URL('guide/terms-rehearsal/index.html',root),'utf8');assert.match(guide,/Try agreement/);assert.match(guide,/REQ-PRODUCT-TERMS-REHEARSAL/);
});
test('rehearsal shell, actual terms controls and local reader have semantic labels',async()=>{
 const audit=await createAccessibilityAudit('<!doctype html><html lang="en"><head><title>Terms rehearsal</title></head><body><main><h1>Setup</h1><div id="mount"></div></main></body></html>',{url:'https://adopter.example.test/setup',label:'terms rehearsal'}),d=audit.dom.window.document;
 audit.dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};audit.dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new audit.dom.window.Event('close'));};
 const c=JSON.parse(await readFile(new URL('../../examples/static/notabenda.config.json',import.meta.url),'utf8'));c.terms.agreements=[{scopeId:'signup',revision:'copy-1',statement:'I agree to the terms for this sample account.',actionLabel:'Create sample account',reviewStatus:'draft'}];const ui=mountTermsRehearsal(d.querySelector('#mount'),{config:c,scopeId:'signup'});
 try{await ui.open();let result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);d.querySelector('.nb-terms-rehearsal-read').click();result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);}finally{ui.destroy();audit.close();}
});
