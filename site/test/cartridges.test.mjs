// @requirements REQ-PRODUCT-PRIVACY-PACKS
// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {cartridgeLibrary} from '@notabenda/core/cartridges';
import {cartridgePage} from '../cartridge-page.mjs';
import {mountCartridgeConsole} from '../cartridges-app.mjs';
import {serveHost} from '../host.mjs';
import {packDirectory,expandPackDirectory} from '../pack-directory.mjs';
const root=new URL('../dist/public/',import.meta.url);
test('home and architecture expose every installed pack with a direct, existing setup target',async()=>{
 const library=cartridgeLibrary(),setup=new JSDOM(await readFile(new URL('start/index.html',root),'utf8')).window.document;
 for(const route of ['index.html','guide/architecture/index.html']){
  const d=new JSDOM(await readFile(new URL(route,root),'utf8')).window.document;
  assert.match(d.querySelector('header nav a[href="/start"]').textContent,/Packs 17/);
  assert.deepEqual([...d.querySelectorAll('.pack-directory-group')].map(group=>group.querySelectorAll('[data-pack-link]').length),[3,3,4,5,2]);
  const links=[...d.querySelectorAll('[data-pack-link]')];assert.deepEqual(links.map(a=>a.dataset.packLink),library.map(p=>p.id));
  for(const a of links){assert.equal(a.closest('details,[hidden]'),null);const url=new URL(a.href,'https://example.test');assert.equal(url.pathname,'/start/');const target=setup.querySelector(url.hash);assert.equal(target.dataset.cartridge,a.dataset.packLink);assert.equal(target.tabIndex,-1);}
 }
 const markdown=await readFile(new URL('guide/architecture/index.md',root),'utf8');
 for(const p of library)assert.ok(markdown.includes(`[${p.title}](/start/#pack-${p.id})`));
 assert.doesNotMatch(markdown,/notabenda:packs|pack-directory/u);
});
test('pack overview expansion leaves code samples alone and produces an equivalent text list',()=>{
 const marker='<!-- notabenda:packs -->',code='```html\n'+marker+'\n```';
 assert.equal(expandPackDirectory(code,{graphical:true}),code);
 assert.equal(new JSDOM(packDirectory()).window.document.querySelectorAll('[data-pack-link]').length,17);
 assert.equal(expandPackDirectory(marker,{graphical:true}),packDirectory());
 for(const p of cartridgeLibrary())assert.ok(expandPackDirectory(marker).includes(p.outcome));
});
test('the product front door exposes all seventeen packs in five visible groups',async()=>{
 const html=await readFile(new URL('start/index.html',root),'utf8'),dom=new JSDOM(html),d=dom.window.document;
 try{
  const all=cartridgeLibrary();assert.deepEqual([...d.querySelectorAll('.pack-shelf')].map(el=>el.querySelectorAll('[data-cartridge]').length),[3,3,4,5,2]);assert.equal(d.querySelector('.cartridge-more'),null);assert.match(d.querySelector('.pack-index').textContent,/17 packs/);for(const card of d.querySelectorAll('[data-cartridge]'))assert.equal(card.closest('details,[hidden]'),null);assert.equal(d.querySelectorAll('input:checked').length,0);assert.equal(d.querySelector('.demo-corner'),null);
  for(const c of all){assert.ok(d.querySelector(`[data-cartridge="${c.id}"]`));assert.ok(d.body.textContent.includes(c.outcome));}
  assert.ok(d.querySelector('script[src="/assets/cartridges.mjs"]'));assert.ok(d.querySelector('link[href="/assets/cartridges.css"]'));
  const home=await readFile(new URL('index.html',root),'utf8');assert.match(home,/href="\/start">Choose a pack/u);
  const forbidden=()=>{throw Error('Product setup must not allocate demo or operational storage');};
  const env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},DEMO_WORKSPACES:{idFromName:forbidden,get:forbidden},WORKSPACE:{idFromName:forbidden,get:forbidden}};
  const response=await serveHost(new Request('https://host.example.test/start/'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.equal(await response.text(),html);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'/u);
 }finally{dom.window.close();}
});
test('cartridge choice opens focused setup and returning to the library preserves unprepared answers',()=>{
 const dom=new JSDOM(cartridgePage(),{url:'https://host.example.test/start/'}),d=dom.window.document;let urls=0;dom.window.URL.createObjectURL=()=> 'blob:example-'+(++urls);dom.window.URL.revokeObjectURL=()=>{};
 const root=d.querySelector('[data-cartridge-console]'),app=mountCartridgeConsole(root);
 try{
  const choose=id=>{const input=d.querySelector(`input[value="${id}"]`);input.checked=true;input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
  choose('terms-agreement');assert.match(d.querySelector('[data-cartridge-count]').textContent,/1 pack/u);assert.ok(d.querySelector('[data-cartridge-brief]').hasAttribute('download'));
  d.querySelector('.cartridge-library').dispatchEvent(new dom.window.Event('submit',{cancelable:true,bubbles:true}));assert.equal(d.querySelector('[data-cartridge-setup]').hidden,false);assert.equal(d.activeElement.tagName,'H1');
  const email=[...root.querySelectorAll('input')].find(input=>input.type==='email');email.value='pending@';d.querySelector('[data-cartridge-back]').click();assert.equal(d.querySelector('[data-cartridge-library]').hidden,false);
  choose('privacy-pages');d.querySelector('.cartridge-library').dispatchEvent(new dom.window.Event('submit',{cancelable:true,bubbles:true}));assert.equal([...root.querySelectorAll('input')].find(input=>input.type==='email').value,'pending@');assert.equal(d.querySelector('[data-cartridge-error]').hidden,true);
  assert.equal(root.querySelector('[data-question="consumer-payments"]').hidden,true);
 }finally{app.destroy();dom.window.close();}
});

test('changing scope preserves unfinished notes without validating or replacing the editing session',()=>{
 const dom=new JSDOM(cartridgePage(),{url:'https://host.example.test/start/'}),d=dom.window.document;dom.window.URL.createObjectURL=()=> 'blob:example';dom.window.URL.revokeObjectURL=()=>{};
 const root=d.querySelector('[data-cartridge-console]'),app=mountCartridgeConsole(root);
 try{
  d.querySelector('input[value=privacy-pages]').checked=true;d.querySelector('.cartridge-library').dispatchEvent(new dom.window.Event('submit',{cancelable:true,bubbles:true}));
  const note=root.querySelector('textarea');note.value='x'.repeat(4001);d.querySelector('[data-cartridge-back]').click();d.querySelector('input[value=cookie-choices]').checked=true;d.querySelector('.cartridge-library').dispatchEvent(new dom.window.Event('submit',{cancelable:true,bubbles:true}));
  assert.equal(d.querySelector('[data-cartridge-setup]').hidden,false);assert.equal(root.querySelector('textarea'),note);assert.equal(note.value.length,4001);assert.equal(d.querySelector('[data-cartridge-error]').hidden,true);assert.equal(root.querySelector('[data-question=optional-storage]').hidden,false);
 }finally{app.destroy();dom.window.close();}
});
