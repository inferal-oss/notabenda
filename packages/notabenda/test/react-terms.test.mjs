// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-REACT REQ-PRODUCT-TERMS-ACCEPTANCE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,StrictMode,act,useLayoutEffect} from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {TermsAcceptanceProvider,TermsAcceptanceControl,useTermsAcceptanceController,useTermsAcceptanceSnapshot} from '@notabenda/core/react/terms';
import {mountAstroTermsAcceptance} from '@notabenda/core/astro/client';
import {TermsAcceptanceError} from '@notabenda/core/terms';
import {termsFixture} from './terms-adapter-fixture.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {fixture} from './helpers.mjs';
async function page(callback,html=''){
 const dom=new JSDOM('<div id="root">'+html+'</div>',{url:'https://example.test/'}),keys=['window','document','HTMLElement','Node','Event','MouseEvent','IS_REACT_ACT_ENVIRONMENT'],previous=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const k of keys)Object.defineProperty(globalThis,k,{value:k==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[k],configurable:true,writable:true});
 try{await callback(dom.window.document.getElementById('root'),dom.window);}finally{dom.window.close();for(const [k,v] of previous)v?Object.defineProperty(globalThis,k,v):delete globalThis[k];}
}
function Probe({capture}){const state=useTermsAcceptanceSnapshot(),controller=useTermsAcceptanceController();capture?.(state,controller);return h('output',{'data-checked':String(state.checked)},state.status);}
const tree=(controller,capture)=>h(TermsAcceptanceProvider,{controller},h(Probe,{capture}),h(TermsAcceptanceControl,{fallback:h('p',null,'Read the terms or contact support if controls are unavailable.')}));
test('terms SSR hides recorded receipts and hydration reuses the actual host controller without a write',async()=>{
 const f=await termsFixture();f.controller.setChecked(true);await f.controller.submit();let snapshot,owner,subscriptions=0;const subscribe=f.controller.subscribe;f.controller.subscribe=fn=>{subscriptions++;const off=subscribe(fn);return ()=>{subscriptions--;off();};};
 const app=h(StrictMode,null,tree(f.controller,(s,c)=>{snapshot=s;owner=c;})),html=renderToString(app),errors=[];
 assert.match(html,/data-checked="false">idle/);assert.match(html,/Read the terms/);assert.doesNotMatch(html,/<input|requestId|receipt|operation-one|nb-terms-acceptance/);
 await page(async container=>{let root;await act(async()=>{root=hydrateRoot(container,app,{onRecoverableError:e=>errors.push(e)});});assert.deepEqual(errors,[]);assert.equal(container.querySelectorAll('.nb-terms-acceptance').length,1);assert.equal(container.querySelector('output').textContent,'recorded');assert.equal(owner,f.controller);assert.equal(f.commands.length,1);assert.equal(f.destroyed(),0);
  const previous=snapshot;await act(async()=>root.render(app));assert.equal(snapshot,previous);assert.throws(()=>snapshot.receipt.documentVersion='wrong',TypeError);assert.throws(()=>snapshot.checked=false,TypeError);await act(async()=>root.unmount());assert.equal(subscriptions,0);assert.equal(f.destroyed(),0);assert.equal(f.controller.getSnapshot().status,'recorded');
 },html);assert.throws(()=>renderToString(h(Probe)),/TermsAcceptanceProvider/);f.controller.destroy();
});
test('only the explicit agreement action writes; ordinary form submit and detached controls do nothing',async()=>{
 const f=await termsFixture();let submitted=0;
 await page(async(container,window)=>{const root=createRoot(container);await act(async()=>root.render(h(TermsAcceptanceProvider,{controller:f.controller},h('form',{onSubmit:e=>{e.preventDefault();submitted++;}},h(TermsAcceptanceControl),h('button',{type:'submit'},'Continue')))));
  const checkbox=container.querySelector('input'),button=container.querySelector('.nb-terms-acceptance button');assert.equal(checkbox.checked,false);assert.equal(button.disabled,true);await act(async()=>checkbox.click());assert.equal(f.commands.length,0);assert.equal(button.type,'button');await act(async()=>container.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(submitted,1);assert.equal(f.commands.length,0);
  await act(async()=>root.unmount());checkbox.checked=false;checkbox.dispatchEvent(new window.Event('change',{bubbles:true}));button.click();assert.equal(f.controller.getSnapshot().checked,true);assert.equal(f.commands.length,0);assert.equal(f.destroyed(),0);
 });f.controller.destroy();
});
test('uncertain agreement survives view remount and retries its exact request only on explicit action',async()=>{
 let lose=true;const f=await termsFixture({afterRecord:()=>{if(lose){lose=false;throw Error('Lost acknowledgment');}}});
 await page(async container=>{let root=createRoot(container);await act(async()=>root.render(tree(f.controller)));await act(async()=>{f.controller.setChecked(true);await assert.rejects(f.controller.submit());});assert.equal(f.commands.length,1);const request=f.commands[0];assert.equal(container.querySelector('output').textContent,'error');await act(async()=>root.unmount());root=createRoot(container);await act(async()=>root.render(tree(f.controller)));assert.equal(f.commands.length,1);assert.equal(container.querySelector('input').checked,true);
  await act(async()=>{container.querySelector('.nb-terms-acceptance button').click();await f.controller.submit();});assert.deepEqual(f.commands,[request,request]);assert.equal(container.querySelector('output').textContent,'recorded');await act(async()=>root.unmount());
 });f.controller.destroy();
});
test('replacing a pending React controller isolates the new operation from late acknowledgments',async()=>{
 let release;const wait=new Promise(r=>release=r),a=await termsFixture({afterRecord:()=>wait}),b=await termsFixture({operationId:'operation-two'});
 await page(async container=>{const root=createRoot(container);await act(async()=>root.render(tree(a.controller)));let pending;await act(async()=>{a.controller.setChecked(true);pending=a.controller.submit();await Promise.resolve();});assert.equal(container.querySelector('output').textContent,'submitting');await act(async()=>root.render(tree(b.controller)));assert.equal(container.querySelector('output').textContent,'idle');assert.equal(container.querySelector('input').checked,false);await act(async()=>{release();await pending;});assert.equal(a.controller.getSnapshot().status,'recorded');assert.equal(container.querySelector('output').textContent,'idle');assert.equal(b.commands.length,0);assert.equal(a.destroyed(),0);await act(async()=>root.unmount());
 });a.controller.destroy();b.controller.destroy();
});
test('React commit cannot expose the old checked operation to a parent layout effect',async()=>{
 const a=await termsFixture(),b=await termsFixture({operationId:'operation-two'});a.controller.setChecked(true);let oldButton;
 function Parent({controller,probe}){useLayoutEffect(()=>{if(probe){oldButton.click();document.querySelector('.nb-terms-acceptance button')?.click();}},[controller,probe]);return tree(controller);}
 await page(async container=>{const root=createRoot(container);await act(async()=>root.render(h(Parent,{controller:a.controller})));oldButton=container.querySelector('.nb-terms-acceptance button');assert.equal(oldButton.disabled,false);await act(async()=>root.render(h(Parent,{controller:b.controller,probe:true})));assert.equal(a.commands.length,0);assert.equal(b.commands.length,0);assert.equal(container.querySelector('input').checked,false);await act(async()=>root.unmount());});a.controller.destroy();b.controller.destroy();
});
test('terminal errors and shared Astro ownership remain respected by React',async()=>{
 const f=await termsFixture({afterRecord:()=>{throw new TermsAcceptanceError('context-retired');}});
 await page(async container=>{const root=createRoot(container);await act(async()=>root.render(tree(f.controller)));assert.throws(()=>mountAstroTermsAcceptance({acceptance:f.controller,id:'signup',contextKey:'one',document:container.ownerDocument}),/one framework agreement/);await act(async()=>{f.controller.setChecked(true);await assert.rejects(f.controller.submit(),e=>e.code==='context-retired');});assert.equal(container.querySelector('output').textContent,'retired');assert.equal(container.querySelector('input').disabled,true);assert.match(container.textContent,/context has closed/);await act(async()=>root.unmount());});f.controller.destroy();
});
test('framework views preserve localized native labels, direction, exact statement and pinned document',async()=>{
 const config=localizedExampleConfig(await fixture({reviewed:true}));config.localization.reviewStatus='reviewed';for(const doc of Object.values(config.documents))doc.review.status='reviewed';config.site.locale=config.localization.locale='ar';config.localization.direction='rtl';const f=await termsFixture({config});
 const check=container=>{const control=container.querySelector('.nb-terms-acceptance');assert.equal(control.lang,'ar');assert.equal(control.dir,'rtl');assert.equal(control.querySelector('h2').textContent,f.offer.localization.terms.heading);assert.equal(control.querySelector('.nb-terms-statement span').textContent,f.offer.statement);assert.equal(control.querySelector('button').textContent,f.offer.actionLabel);assert.equal(control.querySelector('a').getAttribute('href'),f.offer.document.url);};
 await page(async container=>{const root=createRoot(container);await act(async()=>root.render(tree(f.controller)));check(container);await act(async()=>root.unmount());container.innerHTML=`<div data-notabenda-terms="signup" data-notabenda-terms-offer="${f.offer.offerId}" data-notabenda-terms-context="localized-one"><div data-notabenda-terms-mount></div><div data-notabenda-terms-fallback>Help</div></div>`;const bridge=mountAstroTermsAcceptance({acceptance:f.controller,id:'signup',contextKey:'localized-one',document:container.ownerDocument});check(container);bridge.destroy();assert.equal(f.commands.length,0);});f.controller.destroy();
});
