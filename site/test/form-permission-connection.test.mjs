// @requirements REQ-PRODUCT-FORM-PERMISSION-CONNECTION REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {mountFormPermissionInspector} from '../../examples/form-permissions/inspector.mjs';
import {createFormPermission} from '../../packages/notabenda/dist/form-permission.js';
import {setup} from '../../packages/notabenda/test/collection-flow-fixture.mjs';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const shell='<!doctype html><html lang="en"><head><title>Permission connection</title></head><body><main><h1>Permission connection</h1><details open><summary>Inspect this connection</summary><button type="button">Inspect runtime</button><p role="status" aria-live="polite"></p><div data-permission-inspection-output hidden></div></details></main></body></html>';
const stream='c'.repeat(64);
async function controller(){const f=await setup();return {offer:f.flow.permissions[0],controller:createFormPermission(f.flow.permissions[0],{streamRef:stream,read:async()=>{throw Error('must not read');},submit:async()=>{throw Error('must not submit');}})};}
test('permission panel exposes separate observations, invalidates snapshots and revokes downloads without actions',async()=>{
 const f=await controller(),audit=await createAccessibilityAudit(shell,{label:'form permission connection'}),root=audit.dom.window.document.querySelector('details');let created=0,revoked=0;
 const make=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=()=>{created++;return 'blob:private-'+created;};URL.revokeObjectURL=()=>{revoked++;};
 const ui=mountFormPermissionInspector(root,f.controller,f.offer,stream);
 try{assert.match(root.textContent,/Matches this page’s intended offer/);assert.match(root.textContent,/Matches the expected local stream/);assert.match(root.textContent,/Not observed; server state is unknown/);assert.match(root.textContent,/No action confirmed by this controller/);assert.match(root.textContent,/Not checked/);assert.match(root.textContent,/Not tested/);assert.equal(created,1);assert.deepEqual((await audit.scan()).violations,[]);
  f.controller.setChecked(true);assert.equal(root.querySelector('[data-permission-inspection-output]').hidden,true);assert.equal(root.querySelector('a[download]'),null);assert.equal(revoked,1);root.querySelector('button').click();assert.match(root.textContent,/idle · checkbox selected/);assert.equal(f.controller.getSnapshot().current,null);assert.deepEqual((await audit.scan()).violations,[]);
  ui.destroy();ui.destroy();assert.equal(created,revoked);root.querySelector('button').click();assert.equal(created,revoked);assert.equal(f.controller.getSnapshot().status,'idle');
 }finally{ui.destroy();URL.createObjectURL=make;URL.revokeObjectURL=revoke;f.controller.destroy();audit.close();}
});
test('panel exposes fixed differing fields and generic failures without leaking custom host strings',async()=>{
 const f=await controller(),dom=new JSDOM(shell),root=dom.window.document.querySelector('details'),expected=structuredClone(f.offer);expected.wording.title='PRIVATE author copy';
 const ui=mountFormPermissionInspector(root,f.controller,expected,'d'.repeat(64));
 try{assert.match(root.textContent,/Different: wording/);assert.match(root.textContent,/Different local stream/);assert.doesNotMatch(root.textContent,/PRIVATE author copy/);ui.destroy();
  const invalid=mountFormPermissionInspector(root,{...f.controller,getSnapshot(){throw Error('PRIVATE');}},expected,stream);try{assert.match(root.querySelector('[role=status]').textContent,/Could not inspect/);assert.doesNotMatch(root.textContent,/PRIVATE/);assert.equal(root.querySelector('a[download]'),null);}finally{invalid.destroy();}
 }finally{ui.destroy();f.controller.destroy();dom.window.close();}
});
test('light and midnight panels are collapsed, lazy, self-contained and disposed with their page controller',async()=>{
 const root=new URL('../dist/public/',import.meta.url);
 for(const prefix of ['','dark/']){const dom=new JSDOM(await readFile(new URL(prefix+'form-permissions/index.html',root),'utf8')),panel=dom.window.document.querySelector('[data-permission-inspector]');assert.ok(panel);assert.equal(panel.open,false);assert.equal(panel.querySelector('[data-permission-inspection-output]').hidden,true);assert.equal(panel.querySelector('button').textContent,'Inspect runtime');assert.ok(dom.window.document.querySelector('link[href="/assets/form-permission-inspector.css"]'));dom.window.close();}
 const script=await readFile(new URL('assets/form-permissions.mjs',root),'utf8');assert.match(script,/button\.addEventListener\('click',async\(\)=>/);assert.match(script,/await import\('\/assets\/form-permission-inspector\.mjs'\)/);assert.match(script,/if\(!ended\)/);assert.match(script,/inspector\?\.destroy\(\)/);assert.match(script,/!event.persisted/);
 const inspector=await readFile(new URL('assets/form-permission-inspector.mjs',root),'utf8'),graph=await build({stdin:{contents:inspector},bundle:false,platform:'browser',format:'esm',write:false,metafile:true});assert.deepEqual(Object.values(graph.metafile.outputs)[0].imports,[]);assert.doesNotMatch(inspector,/node:|notabenda-cf|ADMIN_KEY|localhost:/u);
 const css=await readFile(new URL('assets/form-permission-inspector.css',root),'utf8');assert.match(css,/min-height:44px/);assert.match(css,/forced-colors/);assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
});
