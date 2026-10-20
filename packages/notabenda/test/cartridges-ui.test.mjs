// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-SETUP REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {renderCartridgeConsole,mountCartridgeConsole} from 'notabenda/cartridges/ui';
import {selectCartridges,createCartridgeSetupPlan} from 'notabenda/cartridges';

const selection=selectCartridges(['cookie-choices']);
function browser(html='<main id="mount"></main>'){
 const dom=new JSDOM(html,{url:'https://adopter.example.test/setup'}),d=dom.window.document,revoked=[];
 let url=0;dom.window.URL.createObjectURL=()=>`blob:owned-${++url}`;dom.window.URL.revokeObjectURL=value=>revoked.push(value);
 return {dom,d,revoked};
}
const submit=d=>d.querySelector('.cartridge-library').dispatchEvent(new d.defaultView.Event('submit',{cancelable:true,bubbles:true}));
test('reusable SSR has no website routing assumptions and validates host destinations before rendering',()=>{
 const html=renderCartridgeConsole(),{dom,d}=browser(html);
 try{
  assert.equal(d.querySelectorAll('h1').length,2);assert.equal(d.querySelector('[data-cartridge-setup]').hidden,true);
  assert.equal(d.querySelectorAll('a').length,4); // three shelf links and the hidden agent download
  assert.doesNotMatch(html,/\/demo\/admin|\/guide\/|notabenda\.org|<script|<style/);
  for(const url of ['javascript:alert(1)','//remote.test','https://remote.test/x','/x?secret=1','/a/../b','/x" onclick="bad'])assert.throws(()=>renderCartridgeConsole({mapUrl:url}));
  assert.throws(()=>renderCartridgeConsole({exampleLinks:{unknown:'/try'}}));
  const linked=new JSDOM(renderCartridgeConsole({exampleLinks:{'cookie-choices':'/try-cookies'},mapUrl:'/help/map',guideUrl:'/help/start'}));
  assert.equal(linked.window.document.querySelector('.cartridge-preview').getAttribute('href'),'/try-cookies');linked.window.close();
 }finally{dom.window.close();}
});
test('mount and SSR hydration retain the same focused editing session across cartridge changes',()=>{
 for(const hydrate of [false,true]){
  const {dom,d,revoked}=browser(hydrate?renderCartridgeConsole({cartridges:selection}):undefined),root=hydrate?d.querySelector('[data-cartridge-console]'):d.querySelector('#mount');
  let writes=0,network=0;dom.window.fetch=()=>{network++;throw Error('No network');};dom.window.Storage.prototype.setItem=()=>{writes++;throw Error('No persistence');};
  const app=mountCartridgeConsole(root,{cartridges:selection});
  try{
   assert.equal(d.querySelectorAll('input[name=cartridge]:checked').length,1);submit(d);
   assert.equal(d.activeElement.tagName,'H1');assert.equal(d.querySelectorAll('.nb-setup-step:not([hidden])').length,4);
   const email=d.querySelector('input[type=email]');email.value='unfinished@';email.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
   d.querySelector('[data-cartridge-back]').click();const add=d.querySelector('input[value=privacy-pages]');add.checked=true;add.dispatchEvent(new dom.window.Event('change',{bubbles:true}));submit(d);
   assert.equal(d.querySelector('input[type=email]'),email);assert.equal(email.value,'unfinished@');
   assert.deepEqual(app.getDraft().report.cartridges.selected.map(c=>c.id),['cookie-choices','privacy-pages']);
   assert.equal(app.getDraft().config,undefined);assert.equal(writes,0);assert.equal(network,0);
   app.destroy();app.destroy();assert.ok(revoked.length>=2);assert.equal(d.querySelector('[data-cartridge-brief]').hasAttribute('href'),false);
  }finally{app.destroy();dom.window.close();}
 }
});
test('private report resumes pinned selection; conflicting selection leaves host content untouched',()=>{
 const report=createCartridgeSetupPlan(selection,{schemaVersion:1,markets:[],answers:{}}).report;
 const {dom,d}=browser(),root=d.querySelector('#mount');root.textContent='Host content';
 try{
  assert.throws(()=>mountCartridgeConsole(root,{answers:report,cartridges:selectCartridges(['terms-agreement'])}),/conflict/);assert.equal(root.textContent,'Host content');
  const app=mountCartridgeConsole(root,{answers:report});try{assert.equal(d.querySelector('input[value=cookie-choices]').checked,true);submit(d);assert.deepEqual(app.getDraft().report.cartridges,selection);}finally{app.destroy();}
 }finally{dom.window.close();}
});
test('resuming a report preserves its cartridge pins when their order differs from the visible library',()=>{
 const pinned=selectCartridges(['terms-agreement','privacy-pages']),report=createCartridgeSetupPlan(pinned,{schemaVersion:1,markets:[],answers:{}}).report;
 const {dom,d}=browser(),app=mountCartridgeConsole(d.querySelector('#mount'),{answers:report});
 try{submit(d);assert.equal(d.querySelector('[data-cartridge-error]').hidden,true);assert.deepEqual(app.getDraft().report.cartridges,pinned);d.querySelector('[data-cartridge-back]').click();submit(d);assert.deepEqual(app.getDraft().report.cartridges,pinned);}finally{app.destroy();dom.window.close();}
});
test('unavailable brief downloads leave cartridge selection and setup usable',()=>{
 const {dom,d}=browser();delete dom.window.URL.createObjectURL;
 const app=mountCartridgeConsole(d.querySelector('#mount'),{cartridges:selection});
 try{assert.equal(d.querySelector('[data-cartridge-brief]').hidden,true);assert.equal(d.querySelector('[data-cartridge-continue]').disabled,false);submit(d);assert.equal(d.querySelector('[data-cartridge-setup]').hidden,false);}finally{app.destroy();dom.window.close();}
});
test('package publishes separate cartridge defaults without changing the visitor stylesheet entry',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.exports['./cartridges.css'],'./dist/cartridges.css');assert.ok(pkg.sideEffects.includes('./dist/cartridges.css'));
 const css=await readFile(new URL('../dist/cartridges.css',import.meta.url),'utf8');assert.match(css,/prefers-reduced-motion/);assert.match(css,/forced-colors/);assert.match(css,/--nb-action-bg/);
 const ordinary=await readFile(new URL('../dist/styles.css',import.meta.url),'utf8');assert.doesNotMatch(ordinary,/cartridge-deck/);
});

test('all eight packs are discoverable without opening a disclosure, including in multiple consoles',()=>{
 const {dom,d}=browser(renderCartridgeConsole()+renderCartridgeConsole());
 try{
  const ids=[...d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const root of d.querySelectorAll('[data-cartridge-console]')){
   assert.match(root.querySelector('.pack-index').textContent,/8 packs for your site/);
   assert.deepEqual([...root.querySelectorAll('.pack-shelf')].map(el=>el.querySelectorAll('[data-cartridge]').length),[3,3,2]);
   for(const card of root.querySelectorAll('[data-cartridge]'))assert.equal(card.closest('details,[hidden]'),null);
   for(const link of root.querySelectorAll('.pack-index a'))assert.ok(root.querySelector(link.getAttribute('href')));
  }
 }finally{dom.window.close();}
});
test('pack import aliases share the original implementation and persisted contract',async()=>{
 const packs=await import('notabenda/packs'),old=await import('notabenda/cartridges'),ui=await import('notabenda/packs/ui');
 assert.equal(packs.packLibrary,old.cartridgeLibrary);assert.equal(packs.selectPacks,old.selectCartridges);assert.equal(packs.planPacks,old.planCartridges);assert.equal(ui.mountPackConsole,mountCartridgeConsole);assert.equal(ui.renderPackConsole,renderCartridgeConsole);
 const selected=packs.selectPacks(['terms-agreement']);assert.deepEqual(packs.readPackSelection({cartridges:selected}),selected);
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));assert.equal(pkg.exports['./packs.css'],pkg.exports['./cartridges.css']);
});
