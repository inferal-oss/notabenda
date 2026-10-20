// @requirements REQ-PRODUCT-TERMS-CONNECTION REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {mountTermsInspector} from '../../examples/static/terms-inspector.mjs';
import {termsFixture} from '../../packages/notabenda/test/terms-adapter-fixture.mjs';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const shell='<!doctype html><html lang="en"><head><title>Terms connection</title></head><body><main><h1>Terms connection</h1><details open><summary>Inspect this connection</summary><button type="button">Inspect runtime</button><p role="status" aria-live="polite"></p><div data-terms-inspection-output hidden></div></details></main></body></html>';
test('terms inspection UI separates observations, invalidates snapshots and releases downloads without submitting',async()=>{
 const f=await termsFixture(),audit=await createAccessibilityAudit(shell,{label:'terms connection'}),root=audit.dom.window.document.querySelector('details');let created=0,revoked=0;
 const make=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=()=>{created++;return 'blob:private-'+created;};URL.revokeObjectURL=()=>{revoked++;};
 const ui=mountTermsInspector(root,f.controller,f.offer,f.context.operationId);
 try{assert.equal(f.commands.length,0);assert.match(root.textContent,/Matches this page’s intended offer/);assert.match(root.textContent,/Matches the expected local operation/);assert.match(root.textContent,/idle · checkbox not selected/);assert.match(root.textContent,/No receipt confirmed/);assert.match(root.textContent,/Not checked/);assert.match(root.textContent,/Not tested/);assert.equal(root.querySelectorAll('a[download]').length,1);assert.equal(created,1);assert.deepEqual((await audit.scan()).violations,[]);
  f.controller.setChecked(true);assert.equal(root.querySelector('[data-terms-inspection-output]').hidden,true);assert.equal(root.querySelector('a[download]'),null);assert.match(root.querySelector('[role=status]').textContent,/state changed/);assert.equal(revoked,1);root.querySelector('button').click();assert.match(root.textContent,/idle · checkbox selected/);assert.equal(f.commands.length,0);
  await f.controller.submit();assert.equal(root.querySelector('[data-terms-inspection-output]').hidden,true);root.querySelector('button').click();assert.match(root.textContent,/Previously confirmed by this controller/);assert.equal(f.commands.length,1);assert.deepEqual((await audit.scan()).violations,[]);
  ui.destroy();ui.destroy();assert.equal(created,revoked);root.querySelector('button').click();assert.equal(created,revoked);assert.equal(f.controller.getSnapshot().status,'recorded');
 }finally{ui.destroy();URL.createObjectURL=make;URL.revokeObjectURL=revoke;f.controller.destroy();audit.close();}
});

test('UI renders generic errors and differing fields without executing or disclosing host values',async()=>{
 const f=await termsFixture(),dom=new JSDOM(shell),root=dom.window.document.querySelector('details'),expected=structuredClone(f.offer);expected.statement='PRIVATE DIFFERENT STATEMENT';
 const ui=mountTermsInspector(root,f.controller,expected,'other-operation');
 try{assert.match(root.textContent,/Different: statement/);assert.match(root.textContent,/Different local operation/);assert.doesNotMatch(root.textContent,/PRIVATE DIFFERENT STATEMENT/);ui.destroy();
  const invalid=mountTermsInspector(root,{...f.controller,getOffer(){throw Error('PRIVATE');}},expected,'other-operation');try{assert.match(root.querySelector('[role=status]').textContent,/Could not inspect/);assert.doesNotMatch(root.textContent,/PRIVATE/);assert.equal(root.querySelector('a[download]'),null);}finally{invalid.destroy();}
 }finally{ui.destroy();f.controller.destroy();dom.window.close();}
});

test('published terms panels start collapsed and load their self-contained inspector only on request',async()=>{
 const root=new URL('../dist/public/',import.meta.url);
 for(const prefix of ['','dark/']){const html=await readFile(new URL(prefix+'agreement/index.html',root),'utf8'),dom=new JSDOM(html),panel=dom.window.document.querySelector('[data-terms-inspector]');assert.ok(panel);assert.equal(panel.open,false);assert.equal(panel.querySelector('[data-terms-inspection-output]').hidden,true);assert.equal(panel.querySelector('button').textContent,'Inspect runtime');assert.ok(dom.window.document.querySelector('link[href="/assets/terms-inspector.css"]'));dom.window.close();}
 const script=await readFile(new URL('assets/agreement.mjs',root),'utf8');assert.match(script,/button\.addEventListener\('click',async\(\)=>/);assert.match(script,/await import\('\/assets\/terms-inspector\.mjs'\)/);assert.match(script,/if\(!ended\)/);assert.match(script,/inspector\?\.destroy\(\)/);
 const inspector=await readFile(new URL('assets/terms-inspector.mjs',root),'utf8'),graph=await build({stdin:{contents:inspector},bundle:false,platform:'browser',format:'esm',write:false,metafile:true});assert.deepEqual(Object.values(graph.metafile.outputs)[0].imports,[]);assert.doesNotMatch(inspector,/node:|notabenda-cf|ADMIN_KEY|localhost:/u);
 const css=await readFile(new URL('assets/terms-inspector.css',root),'utf8');assert.match(css,/min-height:44px/);assert.match(css,/forced-colors/);
});
