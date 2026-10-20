// @requirements REQ-PRODUCT-AUTHORED-PREVIEW
// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountLegalPreview} from '@notabenda/core/setup/preview';
import {mountSetup} from '@notabenda/core/setup/ui';
import {selectCartridges} from '@notabenda/core/cartridges';
import {fixture} from './helpers.mjs';
function browser(){
 const dom=new JSDOM('<main><button id="opener">Read pages</button><div id="mount"></div></main>',{url:'https://adopter.example.test/setup'}),d=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){if(!this.isConnected)throw Error('Disconnected');this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 dom.window.URL.createObjectURL=()=> 'blob:fixture';dom.window.URL.revokeObjectURL=()=>{};
 return {dom,d};
}
test('page preview projects declared public facts without publishing, persisting or changing review status',async()=>{
 const config=await fixture(),before=structuredClone(config),{dom,d}=browser();let effects=0;
 dom.window.fetch=()=>{effects++;throw Error('No network');};dom.window.Storage.prototype.setItem=()=>{effects++;throw Error('No persistence');};
 const ui=mountLegalPreview(d.querySelector('#mount'),{config});
 try{
  const dialog=d.querySelector('dialog');assert.equal(dialog.open,false);d.querySelector('#opener').focus();ui.open();assert.equal(dialog.open,true);assert.equal(d.activeElement.textContent,'Configuration preview');
  assert.match(dialog.textContent,/Juniper Notes/);assert.match(dialog.textContent,/including placeholders/);assert.match(dialog.textContent,/Draft — for review/);assert.doesNotMatch(dialog.textContent,/Synthetic private note/);assert.deepEqual(config,before);assert.equal(effects,0);
  assert.equal(dialog.querySelector('.nb-document').dataset.documentKind,'privacy');
 }finally{ui.destroy();dom.window.close();}
});
test('switching documents keeps a fixed snapshot and preserves exact supplied text without executing expressions',async()=>{
 const config=await fixture({reviewed:true});config.documents.terms.sections[0].paragraphs.push('<script>globalThis.previewExecuted=true</script> {process.env.SECRET}');
 const {dom,d}=browser(),ui=mountLegalPreview(d.querySelector('#mount'),{config,initialDocument:'terms'});
 try{
  ui.open();assert.equal(d.querySelector('.nb-draft'),null);assert.equal(d.querySelector('dialog script'),null);assert.equal(dom.window.previewExecuted,undefined);assert.match(d.querySelector('dialog').textContent,/<script>/);
  config.site.name='Changed after mounting';config.documents.cookies.version='changed-version';
  [...d.querySelectorAll('.nb-legal-preview-navigation button')].find(b=>b.textContent==='Cookie policy').click();assert.equal(d.querySelector('.nb-document').dataset.documentKind,'cookies');assert.equal(d.querySelector('.nb-document').dataset.documentVersion,'draft-1');assert.match(d.querySelector('dialog').textContent,/Juniper Notes/);assert.doesNotMatch(d.querySelector('dialog').textContent,/Changed after mounting|changed-version/);
  assert.equal(d.querySelectorAll('[aria-pressed=true]').length,1);assert.equal(d.querySelector('.nb-storage-foldout').open,false);
 }finally{ui.destroy();dom.window.close();}
});
test('outside links have no navigable href; contents links stay inside the namespaced preview',async()=>{
 const {dom,d}=browser(),ui=mountLegalPreview(d.querySelector('#mount'),{config:await fixture()});
 try{
  ui.open();const dialog=d.querySelector('dialog'),links=[...dialog.querySelectorAll('a')];assert.ok(links.some(a=>a.getAttribute('aria-disabled')==='true'));
  for(const a of links){const href=a.getAttribute('href');assert.ok(href===null||href.startsWith('#nb-preview-'));if(href)assert.ok(dialog.querySelector('[id="'+href.slice(1)+'"]'));}
  assert.equal(dialog.querySelector('.nb-legal-preview-contents').open,false);dialog.querySelector('.nb-legal-preview-contents').open=true;
  const anchor=dialog.querySelector('a[href]'),target=d.getElementById(anchor.getAttribute('href').slice(1)),event=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true});anchor.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(d.activeElement,target);assert.equal(dom.window.location.href,'https://adopter.example.test/setup');
 }finally{ui.destroy();dom.window.close();}
});
test('multiple preview instances cannot collide with each other or host legal-document IDs',async()=>{
 const {dom,d}=browser();d.querySelector('main').insertAdjacentHTML('beforeend','<h1 id="nb-privacy-title">Host title</h1>');const config=await fixture(),one=mountLegalPreview(d.querySelector('#mount'),{config}),two=mountLegalPreview(d.querySelector('#mount'),{config});
 try{const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);for(const node of d.querySelectorAll('[aria-labelledby]'))for(const id of node.getAttribute('aria-labelledby').split(' '))assert.ok(d.getElementById(id));assert.equal(d.getElementById('nb-privacy-title').textContent,'Host title');}finally{one.destroy();two.destroy();dom.window.close();}
});
test('closing restores focus, reopening works, and destruction releases the modal without a stale close callback',async()=>{
 const {dom,d}=browser();let closes=0;const ui=mountLegalPreview(d.querySelector('#mount'),{config:await fixture(),onClose:()=>closes++});
 try{const opener=d.querySelector('#opener');opener.focus();ui.open();ui.close();assert.equal(closes,1);assert.equal(d.activeElement,opener);ui.open();ui.destroy();ui.destroy();assert.equal(closes,1);assert.equal(d.querySelector('dialog'),null);assert.throws(()=>ui.open(),/ended/);}finally{ui.destroy();dom.window.close();}
});
test('invalid config or document selection fails before changing host DOM',async()=>{
 const {dom,d}=browser(),root=d.querySelector('#mount');root.textContent='Keep host content';
 try{for(const options of [{config:{}},{config:await fixture(),initialDocument:'unknown'},{config:await fixture(),onClose:'invalid'}]){assert.throws(()=>mountLegalPreview(root,options));assert.equal(root.textContent,'Keep host content');}}finally{dom.window.close();}
});
test('missing supplied terms remain invalid; the preview cannot invent a document or relax validation',async()=>{
 const config=await fixture();config.documents.terms.sections=[];const {dom,d}=browser();
 try{assert.throws(()=>mountLegalPreview(d.querySelector('#mount'),{config,initialDocument:'terms'}),/Supplied documents require at least one section/);assert.equal(d.querySelector('dialog'),null);assert.deepEqual(config.documents.terms.sections,[]);}finally{dom.window.close();}
});
async function prepared(){
 const {dom,d}=browser(),ui=mountSetup(d.querySelector('#mount'),{cartridges:selectCartridges(['cookie-choices'])});d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));return {dom,d,ui};
}
test('the prepared draft opens its cookie page on demand and preserves draft/report state',async()=>{
 const {dom,d,ui}=await prepared();
  try{assert.equal(d.querySelector('dialog'),null);const before=ui.getPlan(),button=[...d.querySelectorAll('button')].find(b=>b.textContent==='Preview configuration');button.click();for(let i=0;i<10&&!d.querySelector('dialog[open]');i++)await new Promise(resolve=>setTimeout(resolve,0));assert.ok(d.querySelector('dialog[open]'));assert.equal(d.querySelector('dialog .nb-document').dataset.documentKind,'cookies');assert.deepEqual(ui.getPlan(),before);d.querySelector('.nb-legal-preview-close').click();assert.equal(d.querySelector('dialog').open,false);assert.equal(d.activeElement,button);ui.setCartridges(selectCartridges(['privacy-pages']));assert.equal(d.querySelector('dialog'),null);}finally{ui.destroy();dom.window.close();}
});
test('a draft invalidated during the asynchronous module load cannot open a stale preview',async()=>{
 const {dom,d,ui}=await prepared();
 try{[...d.querySelectorAll('button')].find(b=>b.textContent==='Preview configuration').click();ui.setCartridges(selectCartridges(['privacy-pages']));await new Promise(resolve=>setTimeout(resolve,0));assert.equal(d.querySelector('dialog'),null);assert.equal(ui.getPlan(),null);}finally{ui.destroy();dom.window.close();}
});
