// @requirements REQ-PRODUCT-TERMS-REHEARSAL REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountTermsRehearsal} from '@notabenda/core/setup/terms-rehearsal';
import {mountTermsEditor} from '../dist/setup-terms-ui.js';
import {fixture} from './helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {mountSetup} from '@notabenda/core/setup/ui';
import {selectPacks} from '@notabenda/core/packs';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function config(){const c=await fixture();c.terms.agreements=[{scopeId:'signup',revision:'copy-1',statement:'I agree to these signup terms.',actionLabel:'Create sample account',reviewStatus:'draft'},{scopeId:'team',revision:'team-1',statement:'I agree to the team terms.',actionLabel:'Join sample team',reviewStatus:'draft'}];return c;}
function browser(){
 const dom=new JSDOM('<!doctype html><html lang="en"><body><button id="opener">Try agreement</button><div id="mount"></div></body></html>',{url:'https://adopter.example.test/setup'}),d=dom.window.document;let storage=0,network=0;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(dom.window,key,{get(){storage++;throw Error('No ambient storage.');}});dom.window.fetch=()=>{network++;throw Error('No transport.');};
 return {dom,d,effects:()=>({storage,network}),close(){dom.window.close();}};
}
const choice=d=>d.querySelector('.nb-terms-acceptance input');
const action=d=>d.querySelector('.nb-terms-acceptance .nb-terms-footer button');
const count=(d,name)=>d.querySelector('[data-rehearsal-'+name+']').textContent;
const button=(d,text)=>[...d.querySelectorAll('button')].find(b=>b.textContent===text);
function check(b){choice(b.d).checked=true;choice(b.d).dispatchEvent(new b.dom.window.Event('change',{bubbles:true}));}

test('the actual agreement flow starts unchecked, pins selected draft copy and has no ambient side effects',async()=>{
 const c=await config(),before=structuredClone(c),b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:c,scopeId:'signup'});
 try{await ui.open();assert.equal(choice(b.d).checked,false);assert.equal(action(b.d).disabled,true);assert.equal(count(b.d,'attempts'),'0');assert.equal(count(b.d,'records'),'0');assert.match(b.d.querySelector('.nb-terms-acceptance').textContent,/I agree to these signup terms/);assert.equal(action(b.d).textContent,'Create sample account');assert.equal(b.d.querySelector('.nb-terms-acceptance a'),null);
  check(b);await tick();assert.equal(count(b.d,'attempts'),'0');assert.equal(action(b.d).disabled,false);action(b.d).click();await tick();assert.equal(count(b.d,'attempts'),'1');assert.equal(count(b.d,'records'),'1');assert.match(b.d.querySelector('.nb-terms-rehearsal-status').textContent,/Simulated receipt returned/);assert.equal(action(b.d).disabled,true);assert.deepEqual(b.effects(),{storage:0,network:0});assert.deepEqual(c,before);assert.doesNotMatch(b.d.querySelector('dialog').textContent,/Synthetic private note/);
 }finally{ui.destroy();b.close();}
});

test('simulated failure returns no receipt, and deliberate retry uses the original request key',async()=>{
 const b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:await config(),scopeId:'signup'});
 try{await ui.open();b.d.querySelector('.nb-terms-rehearsal-failure input').checked=true;check(b);action(b.d).click();await tick();assert.equal(count(b.d,'attempts'),'1');assert.equal(count(b.d,'records'),'0');assert.equal(b.d.querySelector('.nb-terms-acceptance').dataset.status,'error');assert.match(b.d.querySelector('.nb-terms-rehearsal-status').textContent,/No simulated receipt returned/);
  b.d.querySelector('.nb-terms-rehearsal-failure input').checked=false;assert.equal(count(b.d,'attempts'),'1');action(b.d).click();await tick();assert.equal(count(b.d,'attempts'),'2');assert.equal(count(b.d,'records'),'1');assert.equal(count(b.d,'retry'),'Same key as previous attempt');assert.deepEqual(b.effects(),{storage:0,network:0});
 }finally{ui.destroy();b.close();}
});

test('fresh runs and close discard memory and make detached controls inert; close restores focus',async()=>{
 const b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:await config(),scopeId:'team'});
 try{b.d.querySelector('#opener').focus();await ui.open();check(b);const old=action(b.d);old.click();await tick();button(b.d,'Start fresh').click();for(let i=0;i<30&&!choice(b.d);i++)await tick();assert.equal(choice(b.d).checked,false);assert.equal(count(b.d,'records'),'0');old.click();await tick();assert.equal(count(b.d,'attempts'),'0');assert.equal(b.d.activeElement,choice(b.d));ui.close();assert.equal(b.d.activeElement.id,'opener');await ui.open();assert.equal(choice(b.d).checked,false);assert.equal(count(b.d,'attempts'),'0');assert.equal(action(b.d).textContent,'Join sample team');ui.destroy();ui.destroy();assert.equal(b.d.querySelector('dialog'),null);await assert.rejects(ui.open(),/ended/);
 }finally{ui.destroy();b.close();}
});

test('closing or resetting before the queued submit runs cannot create a late receipt',async()=>{
 for(const end of ['close','reset','destroy']){const b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:await config(),scopeId:'signup'});try{await ui.open();check(b);action(b.d).click();const status=b.d.querySelector('.nb-terms-rehearsal-status');if(end==='reset')button(b.d,'Start fresh').click();else ui[end]();const text=status.textContent;await tick();if(end!=='reset')assert.equal(status.textContent,text);if(end==='destroy')assert.equal(b.d.querySelector('dialog'),null);else assert.equal(count(b.d,'records'),'0');}finally{ui.destroy();b.close();}}
});

test('the local reader shows the captured draft and never follows an unpublished artifact or outside link',async()=>{
 const c=await config(),b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:c,scopeId:'signup'});c.documents.terms.title='Later changed title';
 try{await ui.open();button(b.d,'Terms of use').click();assert.equal(b.d.querySelectorAll('dialog[open]').length,2);const paper=b.d.querySelector('.nb-legal-preview-paper');assert.ok(paper);assert.doesNotMatch(paper.textContent,/Later changed title/);assert.ok([...paper.querySelectorAll('a[href]')].every(a=>a.getAttribute('href').startsWith('#')));assert.equal(count(b.d,'attempts'),'0');ui.close();assert.equal(b.d.querySelectorAll('dialog[open]').length,0);assert.deepEqual(b.effects(),{storage:0,network:0});
 }finally{ui.destroy();b.close();}
});

test('invalid configuration and absent scopes fail before changing DOM or upgrading draft review',async()=>{
 const b=browser(),c=await config(),mount=b.d.querySelector('#mount');mount.textContent='Keep host content';try{for(const options of [{config:{},scopeId:'signup'},{config:c,scopeId:'absent'},{config:c,scopeId:'signup',onClose:true}]){assert.throws(()=>mountTermsRehearsal(mount,options));assert.equal(mount.textContent,'Keep host content');}assert.equal(c.terms.agreements[0].reviewStatus,'draft');}finally{b.close();}
});

test('queued close notifications do not dispose a reopened run; callbacks are captured',async()=>{
 const b=browser();let closed=0;const options={config:await config(),scopeId:'signup',onClose:()=>{closed++;}},ui=mountTermsRehearsal(b.d.querySelector('#mount'),options),dialog=b.d.querySelector('dialog');dialog.close=function(){this.open=false;queueMicrotask(()=>this.dispatchEvent(new b.dom.window.Event('close')));};options.onClose=()=>{throw Error('Changed callback');};
 try{await ui.open();ui.close();await ui.open();await tick();assert.equal(dialog.open,true);assert.equal(closed,1);assert.equal(choice(b.d).checked,false);}finally{ui.destroy();b.close();}
});

test('each editor scope opens its current saved draft; refresh and disposal invalidate a lazy open',async()=>{
 const b=browser();let c=await config(),changes=0;const editor=mountTermsEditor(b.d.querySelector('#mount'),{getConfig:()=>c,onChange:()=>{changes++;}});
 try{editor.show();const session=editor.getSessionDraft();b.d.querySelector('[aria-label="Try agreement team"]').click();for(let i=0;i<30&&!b.d.querySelector('.nb-terms-rehearsal .nb-terms-acceptance');i++)await tick();assert.equal(action(b.d).textContent,'Join sample team');assert.deepEqual(editor.getSessionDraft(),session);button(b.d,'Close rehearsal').click();assert.equal(b.d.activeElement.getAttribute('aria-label'),'Try agreement team');b.d.querySelector('[aria-label="Try agreement team"]').click();for(let i=0;i<30&&!b.d.querySelector('.nb-terms-acceptance');i++)await tick();editor.refresh();assert.equal(b.d.querySelector('.nb-terms-rehearsal'),null);b.d.querySelector('[aria-label="Try agreement signup"]').click();editor.refresh();await tick();assert.equal(b.d.querySelector('.nb-terms-rehearsal'),null);assert.equal(changes,0);b.d.querySelector('[aria-label="Try agreement signup"]').click();editor.destroy();await tick();assert.equal(b.d.querySelector('dialog'),null);
 }finally{editor.destroy();b.close();}
});

test('localized agreement messages retain their language while reader metadata stays operator copy',async()=>{
 const c=localizedExampleConfig(await config());c.terms.agreements=[{scopeId:'reading',revision:'pt-1',statement:'Concordo com os termos de leitura.',actionLabel:'Continuar a leitura',reviewStatus:'draft'}];const b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:c,scopeId:'reading'});
 try{await ui.open();assert.equal(b.d.querySelector('.nb-terms-acceptance').lang,'pt-BR');assert.equal(action(b.d).textContent,'Continuar a leitura');b.d.querySelector('.nb-terms-rehearsal-failure input').checked=true;check(b);action(b.d).click();await tick();assert.equal(b.d.querySelector('.nb-terms-acceptance [role=status]').textContent,c.localization.terms.error);assert.match(b.d.querySelector('.nb-document-meta').textContent,/local reading preview/);}finally{ui.destroy();b.close();}
 const missing=structuredClone(c);delete missing.localization.terms;const second=browser();try{assert.throws(()=>mountTermsRehearsal(second.d.querySelector('#mount'),{config:missing,scopeId:'reading'}));assert.equal(second.d.querySelector('dialog'),null);}finally{second.close();}
});

test('unsaved editor proposals cannot be mistaken for the saved rehearsal wording',async()=>{
 const b=browser(),c=await config(),editor=mountTermsEditor(b.d.querySelector('#mount'),{getConfig:()=>c,onChange:()=>{throw Error('No draft update expected.');}});
 try{editor.show();b.d.querySelector('[aria-label="Edit signup"]').click();b.d.querySelector('[aria-label="Try agreement signup"]').click();await tick();assert.equal(b.d.querySelector('dialog'),null);assert.match(b.d.querySelector('.nb-setup-terms-editor [role=status]').textContent,/Save or cancel/);assert.ok(editor.getSessionDraft().proposal);}finally{editor.destroy();b.close();}
});

test('unavailable hashing leaves a closable error instead of usable unbound controls',async()=>{
 const b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:await config(),scopeId:'signup'}),original=crypto.subtle.digest;crypto.subtle.digest=async()=>{throw Error('No hashing');};
 try{await ui.open();assert.equal(choice(b.d),null);assert.match(b.d.querySelector('.nb-terms-rehearsal-status').textContent,/secure context/);assert.equal(count(b.d,'records'),'0');ui.close();assert.equal(b.d.querySelector('dialog').open,false);}finally{crypto.subtle.digest=original;ui.destroy();b.close();}
});

test('a stale asynchronous preparation cannot mount into a closed or newer rehearsal',{timeout:5000},async()=>{
 const b=browser(),ui=mountTermsRehearsal(b.d.querySelector('#mount'),{config:await config(),scopeId:'signup'}),original=crypto.subtle.digest,pending=[];crypto.subtle.digest=function(...args){return new Promise((resolve,reject)=>pending.push(()=>original.apply(this,args).then(resolve,reject)));};
 try{const first=ui.open();assert.equal(count(b.d,'records'),'0');ui.close();const next=ui.open();assert.equal(pending.length,6);crypto.subtle.digest=original;for(const release of pending.splice(0,3))release();await first;assert.equal(choice(b.d),null);for(const release of pending.splice(0))release();await next;assert.equal(b.d.querySelectorAll('.nb-terms-acceptance').length,1);assert.equal(choice(b.d).checked,false);}finally{crypto.subtle.digest=original;for(const release of pending)release();ui.destroy();b.close();}
});

test('the prepared terms pack reaches rehearsal without putting simulated acceptance into setup exports',async()=>{
 const b=browser();b.dom.window.URL.createObjectURL=()=> 'blob:fixture';b.dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(b.d.querySelector('#mount'),{config:await config(),cartridges:selectPacks(['terms-agreement'])});
 try{b.d.querySelector('form').dispatchEvent(new b.dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.ok(ui.getPlan());button(b.d,'Review terms agreements').click();const before=ui.getSessionDraft();b.d.querySelector('[aria-label="Try agreement team"]').click();for(let i=0;i<30&&!b.d.querySelector('.nb-terms-acceptance');i++)await tick();check(b);action(b.d).click();await tick();assert.equal(count(b.d,'records'),'1');assert.deepEqual(ui.getSessionDraft(),before);ui.destroy();assert.equal(b.d.querySelector('dialog'),null);assert.deepEqual(b.effects(),{storage:0,network:0});}finally{ui.destroy();b.close();}
});
