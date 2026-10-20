// @requirements REQ-PRODUCT-STORAGE-LOCALIZATION REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-STORAGE-EXCEPTIONS REQ-PRODUCT-CF-HOST
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import {createStorageExceptions,createIndexedDBStorageExceptionJournal} from '@notabenda/core/storage-exceptions';
import {mountStorageExceptionControls} from '@notabenda/core/storage-exceptions/ui';
import {validateSiteConfig} from '@notabenda/core';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
import {memoryJournal} from '../../packages/notabenda/test/storage-exception-helpers.mjs';
import {serveHost} from '../host.mjs';
const root=new URL('../dist/public/',import.meta.url),file=path=>readFile(new URL(path,root),'utf8');

test('Portuguese storage settings publish local assets and script-free legal pages without backend allocation',async()=>{
 const html=await file('localization/storage/index.html'),d=new JSDOM(html).window.document,c=JSON.parse(await file('localization/storage/site.json'));assert.equal(d.documentElement.lang,'pt-BR');assert.equal(d.documentElement.dir,'ltr');assert.equal(validateSiteConfig(c,{mode:'preview'}).valid,true);assert.equal(validateSiteConfig(c,{mode:'production'}).valid,false);assert.equal(d.querySelectorAll('script[type=module]').length,1);assert.ok(d.querySelector('.demo-corner'));assert.equal(c.site.id,'juniper-storage-pt');assert.equal(c.consent,undefined);assert.equal(c.storage.some(s=>s.id==='consent-memory'||s.id==='recommendations-storage'),false);assert.deepEqual(c.jurisdictions,['GB']);assert.ok(c.storage.filter(s=>s.classification==='exception').every(s=>s.name.startsWith('juniper-storage-pt:')));assert.ok(d.getElementById('change-layout').disabled);assert.ok(d.getElementById('sample-interaction').disabled);
 const forbidden=()=>{throw Error('No backend allocation');},env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},WORKSPACE:{get:forbidden},DEMO_WORKSPACES:{get:forbidden}};const response=await serveHost(new Request('https://example.test/localization/storage/'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);
 for(const node of d.querySelectorAll('script[src],link[rel=stylesheet]')){const path=node.getAttribute('src')??node.getAttribute('href');assert.ok(path.startsWith('/assets/'));assert.ok((await file(path.slice(1))).length);}
 for(const kind of ['privacy','cookies','terms']){const policy=await file('localization/storage/'+kind+'/index.html');assert.doesNotMatch(policy,/<script/u);const result=await serveHost(new Request('https://example.test/localization/storage/'+kind+'/'),env);assert.doesNotMatch(result.headers.get('Content-Security-Policy'),/script-src|connect-src/);}
 const category=new JSDOM(await file('examples/privacy-choices/index.html')).window.document;assert.ok(category.querySelector('a[href="/localization/storage/"]'));
});

test('actual Portuguese bootstrap gates local work, remembers objections, cleans markers and keeps other storage',async()=>{
 const html=await file('localization/storage/index.html'),config=JSON.parse(await file('localization/storage/site.json')),dom=new JSDOM(html,{url:'https://example.test/localization/storage/'}),d=dom.window.document,indexedDB=new IDBFactory(),journals=[],controllers=[];
 const journal=options=>{const j=createIndexedDBStorageExceptionJournal({...options,indexedDB,broadcastChannel:null,databaseName:'portuguese-example-test'});journals.push(j);return j;},controller=(...args)=>{const c=createStorageExceptions(...args);controllers.push(c);return c;};
 const source=await readFile(new URL('../../examples/localization/storage-client.mjs',import.meta.url),'utf8'),body=source.replace(/^import[^\n]*\n/gmu,'');dom.window.localStorage.setItem('unrelated','keep');
 const run=new Function('document','window','localStorage','fetch','createStorageExceptions','createIndexedDBStorageExceptionJournal','mountStorageExceptionControls','return (async()=>{'+body+'})()');
 try{await run(d,dom.window,dom.window.localStorage,async()=>Response.json(config),controller,journal,mountStorageExceptionControls);await controllers[0].settled();assert.equal(d.querySelector('#pt-storage-appearance').checked,true);assert.equal(d.querySelector('#pt-storage-improvement').checked,true);d.getElementById('sample-interaction').click();assert.equal(d.getElementById('sample-total').textContent,'1');d.getElementById('change-layout').click();assert.equal(d.getElementById('sample-layout').textContent,'Compacto');d.querySelector('#pt-storage-appearance').click();await controllers[0].settled();assert.equal(d.getElementById('change-layout').disabled,true);const key=config.storage.find(s=>s.id==='appearance-storage').name;assert.equal(dom.window.localStorage.getItem(key),null);assert.equal(dom.window.localStorage.getItem('unrelated'),'keep');
 const next=createStorageExceptions(config,{journal:journals[0],allowPreview:true});try{next.attachPresentation();await next.settled();assert.equal(next.getSnapshot().entries.appearance.objection,'objected');}finally{next.destroy();}
 dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pagehide',{persisted:false}));await controllers[0].settled();assert.equal(controllers[0].getSnapshot().destroyed,true);
 }finally{for(const c of controllers)c.destroy();for(const j of journals)j.close();dom.window.close();}
});

test('the real translated initial, active and objection surfaces retain semantic names and labels',async()=>{
 const audit=await createAccessibilityAudit(await file('localization/storage/index.html'),{label:'Portuguese storage settings'}),c=JSON.parse(await file('localization/storage/site.json')),controller=createStorageExceptions(c,{journal:memoryJournal(),allowPreview:true}),d=audit.dom.window.document,root=d.getElementById('exception-settings');let ui;
 const clean=async()=>{const result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);assert.deepEqual(result.warnings,[]);assert.equal(result.incomplete.some(v=>v.id==='aria-prohibited-attr'),false);};
 try{await clean();root.replaceChildren();ui=mountStorageExceptionControls(root,controller,{idPrefix:'audit'});await controller.settled();await clean();d.querySelector('#audit-appearance').click();await controller.settled();await clean();for(const input of root.querySelectorAll('input')){assert.ok(d.querySelector('label[for="'+input.id+'"]'));assert.ok(d.getElementById(input.getAttribute('aria-describedby')));}}
 finally{ui?.destroy();controller.destroy();audit.close();}
});
