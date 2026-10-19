// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import data from '../dist/server-data.json' with {type:'json'};
const source=(await readFile(new URL('../../examples/astro/src/scripts/permission-client.mjs',import.meta.url),'utf8')).replace(/^import .+;\n/gmu,'');
const boot=new Function('document','createFormPermission','createIndexedDBFormPermissionJournal','FormPermissionError','mountAstroFormPermission','demoSessionEnded',source);
const markup='<main data-permission-entry><form id="astro-workspace-draft" data-astro-reload><input id="astro-workspace-title" value="Weekend reading"><button type="submit" disabled>Prepare draft</button><p data-workspace-result></p></form><output data-permission-current></output><output data-permission-revision></output><output data-permission-action></output><a data-permission-record hidden></a></main>';

test('Astro host bootstrap preserves local drafts, reads once per page and closes changed session/contact/offer contexts before bridge refresh',()=>{
 for(const change of ['notabenda-demo-generation','notabenda-permission-stream','notabenda-permission-offer']){
  const dom=new JSDOM('<!doctype html><html><head></head><body>'+markup+'</body></html>',{url:'https://example.test/form-permissions/astro/'}),document=dom.window.document,offer=data.formPermissions.offer;
  for(const [name,value] of [['notabenda-demo-generation','a'.repeat(64)],['notabenda-permission-stream','b'.repeat(64)],['notabenda-permission-offer',JSON.stringify(offer)]]){const meta=document.createElement('meta');meta.name=name;meta.content=value;document.head.append(meta);}
  let reads=0,writes=0,ended=0,destroyed=false;const inspected=[],listeners=new Set();const snapshot=()=>({status:destroyed?'destroyed':'idle',allowed:false,current:null});
  const controller={getSnapshot:snapshot,refresh(){reads++;return Promise.resolve();},destroy(){destroyed=true;for(const fn of listeners)fn();},subscribe(fn){listeners.add(fn);fn();return()=>listeners.delete(fn);},grant(){writes++;},withdraw(){writes++;}};
  boot(document,()=>controller,()=>({}),class extends Error{},()=>{document.addEventListener('astro:page-load',()=>inspected.push(destroyed));},()=>{ended++;return true;});assert.equal(reads,1);
  document.dispatchEvent(new dom.window.Event('astro:page-load'));assert.equal(reads,1);
  const input=document.querySelector('input');input.value='A quieter weekend';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));const submit=new dom.window.Event('submit',{bubbles:true,cancelable:true});document.querySelector('form').dispatchEvent(submit);assert.equal(submit.defaultPrevented,true);assert.match(document.querySelector('[data-workspace-result]').textContent,/A quieter weekend/);assert.equal(writes,0);
  document.querySelector('main').outerHTML=markup;document.dispatchEvent(new dom.window.Event('astro:page-load'));assert.equal(reads,2);assert.equal(document.querySelector('input').value,'A quieter weekend');assert.match(document.querySelector('[data-workspace-result]').textContent,/Email permission is unchanged/);assert.equal(inspected.at(-1),false);
  document.querySelector(`meta[name=${change}]`).content=change==='notabenda-permission-offer'?JSON.stringify({...offer,offerId:'c'.repeat(64)}):'c'.repeat(64);document.querySelector('main').outerHTML=markup;document.dispatchEvent(new dom.window.Event('astro:page-load'));assert.equal(destroyed,true);assert.equal(inspected.at(-1),true);assert.equal(reads,2);assert.equal(ended,1);assert.equal(writes,0);assert.equal(document.querySelector('[data-permission-current]').textContent,'Context closed');dom.window.close();
 }
});
