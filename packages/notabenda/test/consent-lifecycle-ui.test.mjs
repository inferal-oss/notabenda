// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-STORAGE-CLEANUP REQ-PRODUCT-A11Y
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountConsentLifecycleFixture} from '../../../scripts/consent-lifecycle-fixture.mjs';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
import {exampleConsentConfig} from '../../../examples/static/choices-build.mjs';

for(const [profile,create] of consentProfiles)for(const failure of ['start','stop','storage']){
 test(`${profile}: native ${failure} failure stays visible and cannot restart through another grant`,async()=>{
  const config=exampleConsentConfig(await fixture({reviewed:true})),before=structuredClone(config),values=new Map();
  const dom=new JSDOM('<main><h1>Lifecycle check</h1><input aria-label="Site search"><div id="host"></div></main>',{url:'https://example.test/'}),doc=dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const controller=create(config,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}});
  const view=await mountConsentLifecycleFixture(doc.querySelector('#host'),{controller,failure});
  const visibleStatus=()=>[...doc.querySelectorAll('.nb-control-status')].filter(el=>!el.hidden&&!el.closest('[hidden]')&&(!el.closest('dialog')||el.closest('dialog').open));
  try{
   const observation=view.getObservation();assert.equal(observation.phase,'reload-required');assert.equal(observation.starts,1);assert.equal(observation.abortObserved,true);assert.equal(observation.cleanupAttempts,failure==='start'?0:1);
   if(failure==='storage'){assert.equal(observation.markerPresent,true);assert.equal(observation.cleanupFailed,true);}
   assert.ok(visibleStatus().some(el=>/Reload this page/.test(el.textContent)));assert.doesNotMatch(doc.body.textContent,/PRIVATE_/);
   doc.querySelector('.nb-preferences-trigger').click();assert.equal(doc.querySelector('dialog').open,true);assert.ok(visibleStatus().some(el=>el.closest('dialog')&&/Reload this page/.test(el.textContent)));
   const reject=doc.querySelector('.nb-preferences-footer button');reject.click();await controller.settled();assert.equal(doc.querySelector('dialog').open,false);assert.equal(controller.getSnapshot().permissions.measurement,false);
   doc.querySelector('.nb-preferences-trigger').click();for(const input of doc.querySelectorAll('dialog input[type=checkbox]'))input.checked=true;
   [...doc.querySelectorAll('.nb-preferences-footer button')].at(-1).click();await controller.settled();assert.equal(controller.getSnapshot().permissions.measurement,true);assert.equal(view.getObservation().starts,1);assert.equal(view.getObservation().phase,'reload-required');assert.ok(visibleStatus().some(el=>/Reload this page/.test(el.textContent)));
   const search=doc.querySelector('input[aria-label="Site search"]');search.focus();controller.rejectAll();await controller.settled();assert.equal(doc.activeElement,search);assert.equal(view.getObservation().starts,1);assert.equal(view.getObservation().cleanupAttempts,failure==='start'?0:1);
   const detached=view.getObservation();detached.starts=500;assert.equal(view.getObservation().starts,1);assert.deepEqual(config,before);assert.doesNotMatch(JSON.stringify([...values]),/PRIVATE_/);
  }finally{await view.destroy();assert.equal(controller.getSnapshot().destroyed,true);assert.equal(doc.querySelector('#host').children.length,0);dom.window.close();}
 });
}
