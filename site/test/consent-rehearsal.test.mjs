// @requirements REQ-PRODUCT-CONSENT-REHEARSAL REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
import {mountConsentRehearsal} from '@notabenda/core/setup/consent-rehearsal';
import {exampleConsentConfig} from '../../examples/static/choices-build.mjs';
import {serveHost} from '../host.mjs';
const root=new URL('../dist/public/',import.meta.url);
test('rehearsal is a separate local asset and never enters the ordinary visitor bundle',async()=>{
 const entry=await readFile(new URL('assets/cartridges.mjs',root),'utf8'),preview=await readFile(new URL('assets/runtime/setup-consent-rehearsal.js',root),'utf8');
 assert.match(entry,/import\(["']\/assets\/runtime\/setup-consent-rehearsal\.js["']\)/);assert.doesNotMatch(entry,/Preparing your local controls/);assert.match(preview,/Preparing your local controls/);assert.match(preview,/allow-same-origin/);assert.doesNotMatch(preview,/allow-scripts|allow-forms|allow-popups|notabenda-cf|node:fs/);
 const graph=await build({stdin:{contents:preview},bundle:false,platform:'browser',format:'esm',write:false,metafile:true});assert.deepEqual(Object.values(graph.metafile.outputs)[0].imports,[]);
 for(const path of ['assets/consent.mjs','assets/consent.css'])assert.doesNotMatch(await readFile(new URL(path,root),'utf8'),/nb-rehearsal|mountConsentRehearsal|setup-consent-rehearsal/);
 const html=await readFile(new URL('start/index.html',root),'utf8'),env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})}};const response=await serveHost(new Request('https://example.test/start/'),env);assert.equal(response.status,200);assert.match(response.headers.get('Content-Security-Policy'),/frame-src 'self'/);
});
test('rehearsal shell and configured child controls retain semantic names and landmarks',async()=>{
 const audit=await createAccessibilityAudit('<!doctype html><html lang="en"><head><title>Rehearsal</title><link rel="stylesheet" href="/assets/notabenda.css"></head><body><main><h1>Setup</h1><div id="mount"></div></main></body></html>',{url:'https://adopter.example.test/setup',label:'cookie rehearsal'}),d=audit.dom.window.document;
 const patch=w=>{w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};};patch(audit.dom.window);
 const observer=new audit.dom.window.MutationObserver(()=>{for(const frame of d.querySelectorAll('iframe'))if(!frame.dataset.ready){frame.dataset.ready='true';patch(frame.contentWindow);for(const link of frame.contentDocument.querySelectorAll('link'))link.dispatchEvent(new frame.contentWindow.Event('load'));}});observer.observe(d.body,{childList:true,subtree:true});
 const c=exampleConsentConfig(JSON.parse(await readFile(new URL('../../examples/static/notabenda.config.json',import.meta.url),'utf8'))),ui=mountConsentRehearsal(d.querySelector('#mount'),{config:c});let childAudit;
 try{await ui.open();assert.deepEqual((await audit.scan()).violations,[]);assert.equal(d.querySelector('iframe').title,'Your configured cookie controls');const child=d.querySelector('iframe').contentDocument;childAudit=await createAccessibilityAudit(child.documentElement.outerHTML,{label:'rehearsal native controls'});const result=await childAudit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);}finally{ui.destroy();observer.disconnect();childAudit?.close();audit.close();}
});
