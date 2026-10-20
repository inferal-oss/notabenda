// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-ASTRO
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountAgreementSession} from '../../../examples/agreements/astro-session.mjs';
import {termsFixture} from './terms-adapter-fixture.mjs';
const shell=(offerId,generation)=>`<main data-agreement-entry><div data-notabenda-terms="sample-signup" data-notabenda-terms-offer="${offerId}" data-notabenda-terms-context="sample-light-${generation}"><div data-notabenda-terms-mount></div><div data-notabenda-terms-fallback>Read the terms.</div></div><p data-agreement-state></p><a data-agreement-record hidden>Inspect</a></main>`;
function page(f){const dom=new JSDOM('<head><meta name="notabenda-demo-generation" content="session-a"><meta name="notabenda-terms-offer"></head><body>'+shell(f.offer.offerId,'session-a')+'</body>');dom.window.document.querySelector('meta[name=notabenda-terms-offer]').content=JSON.stringify(f.offer);let ended=0;const document=dom.window.document,session=mountAgreementSession({document,acceptance:f.controller,generation:'session-a',offerId:f.offer.offerId,onSessionEnded:()=>ended++});return {dom,document,session,ended:()=>ended,event:name=>document.dispatchEvent(new dom.window.Event(name))};}
test('recorded Astro receipt is cleared before a different session closes its old controller',async()=>{
 const f=await termsFixture();f.controller.setChecked(true);const receipt=await f.controller.submit();const p=page(f);assert.equal(p.document.querySelector('[data-agreement-record]').hidden,false);p.event('astro:before-swap');p.document.body.innerHTML=shell(f.offer.offerId,'session-b');p.document.querySelector('meta[name=notabenda-demo-generation]').content='session-b';
 // Even a retained stale link must be removed before destroy emits its retained receipt.
 const link=p.document.querySelector('[data-agreement-record]');link.hidden=false;link.href='/demo/admin/agreements/record?id='+receipt.id;p.event('astro:page-load');assert.equal(link.hidden,true);assert.equal(link.hasAttribute('href'),false);assert.equal(f.controller.getSnapshot().status,'destroyed');assert.equal(p.ended(),1);assert.equal(p.document.querySelectorAll('.nb-terms-acceptance').length,0);p.session.destroy();p.dom.window.close();
});
test('a late agreement acknowledgment during an Astro swap cannot paint its receipt onto the destination',async()=>{
 let release;const wait=new Promise(r=>release=r),f=await termsFixture({afterRecord:()=>wait}),p=page(f);f.controller.setChecked(true);const pending=f.controller.submit();await Promise.resolve();p.event('astro:before-swap');p.document.body.innerHTML=shell(f.offer.offerId,'session-b');release();await pending;
 const link=p.document.querySelector('[data-agreement-record]');assert.equal(link.hidden,true);assert.equal(link.hasAttribute('href'),false);assert.doesNotMatch(p.document.querySelector('[data-agreement-state]').textContent,/Agreement recorded/);p.document.querySelector('meta[name=notabenda-demo-generation]').content='session-b';p.event('astro:page-load');assert.equal(link.hasAttribute('href'),false);assert.equal(p.ended(),1);p.session.destroy();p.dom.window.close();
});
