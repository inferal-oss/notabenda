// @requirements REQ-PRODUCT-AGENT-HANDOFF REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountAgentHandoff} from '@notabenda/core/agent-handoff';
import {mountPackConsole,renderPackConsole} from '@notabenda/core/packs/ui';
import {selectPacks,formatPackBrief} from '@notabenda/core/packs';
function browser(){
 const dom=new JSDOM('<main><button id="opener">Agent instructions</button><div id="mount"></div></main>',{url:'https://example.test'}),d=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 return {dom,d,root:d.querySelector('#mount'),opener:d.querySelector('#opener')};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('the drawer displays literal instructions and copies the exact snapshot only on request',async()=>{
 const b=browser();let copied=[],effects=0;Object.defineProperty(b.dom.window.navigator,'clipboard',{value:{writeText:async text=>copied.push(text)}});b.dom.window.fetch=()=>effects++;b.dom.window.Storage.prototype.setItem=()=>effects++;b.dom.window.URL.createObjectURL=()=>effects++;
 const options={text:'Selected packs\n<script>run()</script>\nKeep the private report local.'},ui=mountAgentHandoff(b.root,options);options.text='Changed outside';
 try{
  assert.equal(b.d.querySelector('dialog').open,false);b.opener.focus();ui.open();assert.equal(b.d.activeElement.textContent,'Instructions for your agent');assert.equal(b.d.querySelector('script'),null);const field=b.d.querySelector('textarea');assert.equal(field.readOnly,true);assert.match(field.value,/<script>run/);assert.doesNotMatch(field.value,/Changed outside/);assert.deepEqual(copied,[]);
  b.d.querySelector('.nb-agent-copy').click();await tick();assert.deepEqual(copied,[field.value]);assert.equal(b.d.querySelector('[role=status]').textContent,'Instructions copied.');assert.equal(effects,0);assert.equal(b.d.querySelector('a[download]'),null);
 }finally{ui.destroy();b.dom.window.close();}
});
test('missing or denied clipboard offers manual selection without another sharing or download mechanism',async()=>{
 for(const denied of [false,true]){
  const b=browser();if(denied)Object.defineProperty(b.dom.window.navigator,'clipboard',{value:{writeText:async()=>{throw Error('PRIVATE failure');}}});const ui=mountAgentHandoff(b.root,{text:'Copy this manually.'});
  try{ui.open();b.d.querySelector('.nb-agent-copy').click();await tick();assert.match(b.d.querySelector('[role=status]').textContent,/copy it manually/);assert.doesNotMatch(b.root.textContent,/PRIVATE/);const select=b.d.querySelector('.nb-agent-select');assert.equal(select.hidden,false);select.click();const field=b.d.querySelector('textarea');assert.equal(b.d.activeElement,field);assert.equal(field.selectionStart,0);assert.equal(field.selectionEnd,field.value.length);}finally{ui.destroy();b.dom.window.close();}
 }
});
test('closing restores focus and stale clipboard completions cannot change a reopened or destroyed drawer',async()=>{
 const b=browser();let finish,closes=0;Object.defineProperty(b.dom.window.navigator,'clipboard',{value:{writeText:()=>new Promise(resolve=>finish=resolve)}});const ui=mountAgentHandoff(b.root,{text:'A fixed brief',onClose:()=>closes++});
 try{b.opener.focus();ui.open();b.d.querySelector('.nb-agent-copy').click();ui.close();assert.equal(b.d.activeElement,b.opener);assert.equal(closes,1);ui.open();finish();await tick();assert.equal(b.d.querySelector('[role=status]').textContent,'');assert.equal(b.d.querySelector('.nb-agent-copy').disabled,false);b.d.querySelector('.nb-agent-copy').click();ui.destroy();finish();await tick();assert.equal(b.d.querySelector('dialog'),null);assert.equal(b.d.activeElement,b.opener);assert.equal(closes,1);ui.destroy();assert.throws(()=>ui.open(),/ended/);}finally{ui.destroy();b.dom.window.close();}
});
test('multiple drawers have distinct label IDs and invalid inputs preserve host content',()=>{
 const b=browser();try{b.root.textContent='Keep this';for(const options of [{text:''},{text:'x'.repeat(262145)},{text:'Good',title:''},{text:'Good',onClose:1}])assert.throws(()=>mountAgentHandoff(b.root,options));assert.equal(b.root.textContent,'Keep this');const a=mountAgentHandoff(b.root,{text:'First'}),c=mountAgentHandoff(b.root,{text:'Second'});const ids=[...b.d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const label of b.d.querySelectorAll('label'))assert.ok(b.d.getElementById(label.htmlFor));a.destroy();c.destroy();}finally{b.dom.window.close();}
});
test('the pack library opens current instructions without downloads and invalidates them after selection changes',()=>{
 const b=browser();delete b.dom.window.URL.createObjectURL;const selected=selectPacks(['terms-agreement']),ui=mountPackConsole(b.root,{cartridges:selected});
 try{
  const button=b.d.querySelector('[data-cartridge-brief]');assert.equal(button.tagName,'BUTTON');button.focus();button.click();assert.equal(b.d.querySelector('dialog').open,true);assert.equal(b.d.querySelector('textarea').value,formatPackBrief(selected));b.d.querySelector('.nb-agent-close').click();assert.equal(b.d.activeElement,button);
  const field=b.d.querySelector('input[value=privacy-pages]');field.checked=true;field.dispatchEvent(new b.dom.window.Event('change',{bubbles:true}));assert.equal(b.d.querySelector('dialog'),null);button.click();assert.match(b.d.querySelector('textarea').value,/Legal pages/);ui.destroy();assert.equal(b.d.querySelector('dialog'),null);button.click();assert.equal(b.d.querySelector('dialog'),null);
 }finally{ui.destroy();b.dom.window.close();}
});
test('hydration upgrades the previous anchor handoff to a keyboard-accessible button',()=>{
 const b=browser();b.root.innerHTML=renderPackConsole({cartridges:selectPacks(['privacy-pages'])});const root=b.root.firstElementChild,old=b.d.querySelector('[data-cartridge-brief]'),anchor=b.d.createElement('a');anchor.dataset.cartridgeBrief='';anchor.href='blob:old';anchor.download='old.txt';anchor.textContent='Give to my agent ↗';old.replaceWith(anchor);const ui=mountPackConsole(root,{cartridges:selectPacks(['privacy-pages'])});try{const button=root.querySelector('[data-cartridge-brief]');assert.equal(button.tagName,'BUTTON');assert.equal(button.hasAttribute('href'),false);button.click();assert.ok(b.d.querySelector('dialog[open]'));}finally{ui.destroy();b.dom.window.close();}
});
