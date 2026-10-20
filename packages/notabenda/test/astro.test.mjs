// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-CONSENT-RUNTIME
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createConsent} from '@notabenda/core';
import {mountAstroConsent} from '@notabenda/core/astro/client';
import {fixture} from './helpers.mjs';
import {exampleConsentConfig} from '../../../examples/static/choices-build.mjs';

const markup='<button type="button" data-notabenda-preferences hidden><span>Review choices</span></button><div data-notabenda-controls></div>';
async function setup(html=markup) {
  const config=exampleConsentConfig(await fixture());const values=new Map();
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const consent=createConsent(config,{storage,schedule:()=>()=>{}});
  const dom=new JSDOM(`<!doctype html><body>${html}</body>`,{url:'https://fictional.example.test/astro/'});
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  let subscriptions=0;const subscribe=consent.subscribe;
  consent.subscribe=listener=>{subscriptions++;const unsubscribe=subscribe(listener);return ()=>{subscriptions--;unsubscribe();};};
  return {consent,values,doc:dom.window.document,event:name=>dom.window.document.dispatchEvent(new dom.window.Event(name)),subscriptions:()=>subscriptions,close(){consent.destroy();dom.window.close();}};
}

test('Astro import is server-safe and repeated page loads mount one controls UI and subscription pair',async()=>{
  const f=await setup();assert.throws(()=>mountAstroConsent({consent:f.consent}),/browser document/);
  const bridge=mountAstroConsent({consent:f.consent,document:f.doc});
  for(let i=0;i<4;i++){f.event('astro:page-load');bridge.refresh();}
  assert.equal(f.doc.querySelectorAll('.nb-controls').length,1);assert.equal(f.subscriptions(),2);assert.equal(f.doc.querySelector('[data-notabenda-preferences]').hidden,false);assert.equal(f.values.size,0);
  f.doc.querySelector('[data-notabenda-preferences] span').click();assert.equal(f.consent.getSnapshot().preferencesOpen,true);
  bridge.destroy();bridge.destroy();assert.equal(f.subscriptions(),0);assert.equal(f.doc.querySelectorAll('.nb-controls').length,0);assert.equal(f.consent.getSnapshot().destroyed,false);assert.equal(f.consent.getSnapshot().preferencesOpen,false);assert.equal(f.doc.querySelector('[data-notabenda-preferences]').hidden,true);
  f.doc.querySelector('[data-notabenda-preferences] span').click();assert.equal(f.consent.getSnapshot().preferencesOpen,false);f.close();
});

test('page swaps discard unfinished drafts without granting, preserve refusal and reuse existing service lifecycles',async()=>{
  const f=await setup();let starts=0,stops=0;
  f.consent.registerService('sample-measurements',{purposes:['measurement'],start(){starts++;return ()=>{stops++;};}});
  const bridge=mountAstroConsent({consent:f.consent,document:f.doc});f.consent.openPreferences();
  f.doc.querySelector('input[name="measurement"]').checked=true;
  f.event('astro:before-swap');assert.equal(f.consent.getSnapshot().preferencesOpen,false);assert.equal(f.consent.isAllowed('measurement'),false);assert.equal(f.values.size,0);
  f.doc.body.innerHTML=markup;f.event('astro:page-load');assert.equal(f.doc.querySelectorAll('.nb-controls').length,1);assert.equal(starts,0);
  f.consent.choose({measurement:true,suggestions:false});await f.consent.settled();assert.equal(starts,1);
  f.event('astro:before-swap');f.doc.body.innerHTML=markup;f.event('astro:page-load');await f.consent.settled();assert.equal(starts,1);assert.equal(stops,0);assert.equal(f.consent.isAllowed('measurement'),true);
  f.consent.rejectAll();await f.consent.settled();assert.equal(stops,1);
  f.event('astro:before-swap');f.doc.body.innerHTML=markup;f.event('astro:page-load');assert.equal(f.doc.querySelector('.nb-consent-notice').hidden,true);assert.equal(f.consent.isAllowed('measurement'),false);
  bridge.destroy();assert.equal(f.subscriptions(),0);f.close();
});

test('pages without a controls surface hide reopen buttons and later navigation mounts cleanly',async()=>{
  const f=await setup('<button type="button" data-notabenda-preferences hidden>Review</button>');
  const bridge=mountAstroConsent({consent:f.consent,document:f.doc});assert.equal(f.doc.querySelector('button').hidden,true);
  f.doc.body.innerHTML=markup;f.event('astro:page-load');assert.equal(f.doc.querySelector('button').hidden,false);assert.equal(f.doc.querySelectorAll('.nb-controls').length,1);
  f.event('astro:before-swap');f.doc.body.innerHTML='<button type="button" data-notabenda-preferences>Review</button>';f.event('astro:page-load');assert.equal(f.doc.querySelector('button').hidden,true);assert.equal(f.subscriptions(),1);
  bridge.destroy();f.close();
});

test('duplicate controllers, documents and controls are rejected without leaking a partially mounted bridge',async()=>{
  const f=await setup();const other=await setup();const bridge=mountAstroConsent({consent:f.consent,document:f.doc});
  assert.throws(()=>mountAstroConsent({consent:f.consent,document:other.doc}),/one Astro controls bridge/);
  assert.throws(()=>mountAstroConsent({consent:other.consent,document:f.doc}),/per document/);
  bridge.destroy();
  f.doc.body.innerHTML=markup+markup;assert.throws(()=>mountAstroConsent({consent:f.consent,document:f.doc}),/one Astro ConsentControls/);assert.equal(f.subscriptions(),0);assert.equal(f.doc.querySelectorAll('.nb-controls').length,0);
  f.doc.body.innerHTML=markup;const recovered=mountAstroConsent({consent:f.consent,document:f.doc});assert.equal(f.doc.querySelectorAll('.nb-controls').length,1);recovered.destroy();f.close();other.close();
});

test('destroyed controllers cannot mount or leave a functional external preferences action',async()=>{
  const f=await setup();const bridge=mountAstroConsent({consent:f.consent,document:f.doc});f.consent.destroy();assert.equal(f.doc.querySelector('[data-notabenda-preferences]').hidden,true);bridge.refresh();bridge.destroy();
  assert.throws(()=>mountAstroConsent({consent:f.consent,document:f.doc}),/live consent controller/);assert.equal(f.subscriptions(),0);f.close();
});
