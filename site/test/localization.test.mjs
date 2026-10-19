// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {siteSections,sectionForGuide} from '../navigation.mjs';
const root=new URL('../dist/public/',import.meta.url);
test('localized demo and documents keep their language and belong to the integration area',async()=>{
 const page=new JSDOM(await readFile(new URL('localization/index.html',root),'utf8')).window.document;
 assert.equal(page.documentElement.lang,'pt-BR');assert.equal(page.documentElement.dir,'ltr');assert.ok(page.querySelector('.demo-corner'));assert.ok(page.querySelector('#privacy-controls'));assert.equal(page.querySelectorAll('script:not([src])').length,0);assert.ok(page.querySelector('a[href="/guide/localization"]'));
 for(const kind of ['privacy','cookies','terms']){const d=new JSDOM(await readFile(new URL('localization/'+kind+'/index.html',root),'utf8')).window.document;assert.equal(d.documentElement.lang,'pt-BR');assert.equal(d.querySelector('article').dir,'ltr');assert.match(d.querySelector('.nb-contents').textContent,/Nesta página/u);assert.doesNotMatch(d.querySelector('article').textContent,/Who is responsible|On this page|Declared storage/u);}
 const runtime=JSON.parse(await readFile(new URL('localization/runtime.json',root),'utf8'));assert.equal(runtime.inventory.localization.locale,'pt-BR');assert.equal(runtime.inventory.localization.documents,undefined);assert.equal(runtime.inventory.localization.generatedDocuments,undefined);
 assert.equal(sectionForGuide('/guide/localization').id,'integrations');assert.ok(siteSections.find(s=>s.id==='integrations').topics.some(t=>t.id==='localization'));
});

test('the actual bundled example starts, records a choice and stops its local sample after withdrawal',async()=>{
 const html=await readFile(new URL('localization/index.html',root),'utf8'),script=await readFile(new URL('assets/localization.mjs',root),'utf8'),runtime=JSON.parse(await readFile(new URL('localization/runtime.json',root),'utf8'));
 const dom=new JSDOM(html,{url:'https://juniper.example.test/localization/'}),original=Object.fromEntries(['window','document','fetch'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 try{
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.fetch=async url=>{assert.equal(url,'/localization/runtime.json');return {json:async()=>runtime};};
  try{await import('data:text/javascript;base64,'+Buffer.from(script).toString('base64'));}catch(error){throw new Error(error.message);}
  const document=dom.window.document,buttons=document.querySelectorAll('.nb-consent-notice .nb-choice-button');assert.equal(buttons.length,2);assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');buttons[1].click();await new Promise(resolve=>setImmediate(resolve));assert.equal(document.querySelector('#reading-state').textContent,'Ativadas');assert.ok(dom.window.localStorage.getItem('notabenda:choices:v1:juniper-pt'));
  document.querySelector('.nb-preferences-trigger').click();document.querySelector('.nb-preferences-footer button').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');
 }finally{dom.window.close();for(const [key,descriptor] of Object.entries(original)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
