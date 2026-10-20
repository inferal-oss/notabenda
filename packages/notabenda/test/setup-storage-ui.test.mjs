// @requirements REQ-PRODUCT-STORAGE-AUTHORING REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountStorageEditor} from '@notabenda/core/setup/storage/ui';
import {mountSetup} from '@notabenda/core/setup/ui';
import {selectPacks} from '@notabenda/core/packs';
import {fixture} from './helpers.mjs';
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const button=(root,name)=>[...root.querySelectorAll('button')].find(e=>e.textContent===name||e.getAttribute('aria-label')===name);
const field=(root,name)=>{const label=[...root.querySelectorAll('label')].find(e=>e.textContent===name);assert.ok(label,name);return root.querySelector('#'+label.htmlFor);};
function browser(){const dom=new JSDOM('<form><main id="root"></main></form>',{url:'https://adopter.example.test/setup'});dom.window.URL.createObjectURL=()=> 'blob:review';dom.window.URL.revokeObjectURL=()=>{};return {dom,root:dom.window.document.querySelector('#root')};}
async function config(){const c=await fixture();c.storage=[];c.services=[{id:'metrics',name:'Reading metrics',provider:'Local demonstration',purposeIds:[c.purposes[0].id],location:'This browser'}];c.consent={purposes:[{id:c.purposes[0].id,scope:'purpose-1'}],services:[{id:'metrics',scope:'metrics-1'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:15};return c;}
function fill(f){for(const [name,value] of Object.entries({'Stable storage ID':'reading-count','Actual storage name':'reading-count','Storage type':'sessionStorage','Owning service':'metrics','Actual duration':'Until the session ends or the feature is withdrawn.','Storage classification':'optional'})){const el=field(f.root,name);el.value=value;el.dispatchEvent(new f.dom.window.Event('change',{bubbles:true}));}field(f.root,'Reading metrics — new material version').value='metrics-2';}

test('the editor requires actual fields, fresh material versions and explicit confirmation',async()=>{
 const f=browser();let c=await config(),calls=0,effects=0;f.dom.window.Storage.prototype.setItem=()=>{effects++;throw Error('No storage writes');};const ui=mountStorageEditor(f.root,{getConfig:()=>c,onChange:p=>{c=p.config;calls++;}});
 try{ui.open();assert.equal(field(f.root,'Storage type').value,'');assert.equal(field(f.root,'Storage classification').value,'');assert.equal(field(f.root,'Owning service').value,'');fill(f);button(f.root,'Save storage declaration').click();await settle();assert.equal(calls,0);assert.match(f.root.querySelector('[role=alert]').textContent,/confirm/);
 const key=new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});field(f.root,'Actual storage name').dispatchEvent(key);assert.equal(key.defaultPrevented,true);assert.equal(calls,0);f.root.querySelector('input[type=checkbox]').checked=true;button(f.root,'Save storage declaration').click();await settle();assert.equal(calls,1);assert.equal(c.storage[0].type,'sessionStorage');assert.equal(c.consent.services[0].scope,'metrics-2');assert.equal(effects,0);assert.equal(f.root.querySelector('a[download]').hidden,false);assert.match(f.root.querySelector('[role=status]').textContent,/no browser data was changed/i);
 }finally{ui.destroy();f.dom.window.close();}
});

test('cancel, stale facts and failed host adoption cannot claim a save or expose host errors',async()=>{
 const f=browser();let c=await config(),calls=0,fail=false;const ui=mountStorageEditor(f.root,{getConfig:()=>c,onChange:()=>{if(fail)throw Error('PRIVATE HOST');calls++;}});
 try{ui.open();fill(f);button(f.root,'Cancel storage changes').click();assert.equal(calls,0);ui.open();fill(f);f.root.querySelector('input[type=checkbox]').checked=true;c.controller.name='Changed';button(f.root,'Save storage declaration').click();await settle();assert.equal(calls,0);assert.match(f.root.querySelector('[role=alert]').textContent,/draft changed/);ui.open();fill(f);f.root.querySelector('input[type=checkbox]').checked=true;fail=true;button(f.root,'Save storage declaration').click();await settle();assert.equal(calls,0);assert.match(f.root.querySelector('[role=alert]').textContent,/Could not confirm/);assert.doesNotMatch(f.root.textContent,/PRIVATE HOST/);
 }finally{ui.destroy();f.dom.window.close();}
});

test('storage search and pagination keep a large inventory bounded and preserve exact identities',async()=>{
 const f=browser(),c=await config();c.storage=Array.from({length:25},(_,i)=>({id:'marker-'+i,name:'marker-'+i,type:'localStorage',serviceId:'metrics',duration:'One session',classification:'optional'}));const ui=mountStorageEditor(f.root,{getConfig:()=>c,onChange:()=>{}});
 try{assert.equal(f.root.querySelectorAll('.nb-setup-purpose-list>section').length,12);button(f.root,'Next storage items').click();assert.match(f.root.textContent,/Showing 13–24 of 25/);const search=f.root.querySelector('input[type=search]');search.value='marker-24';search.dispatchEvent(new f.dom.window.Event('input',{bubbles:true}));assert.equal(f.root.querySelectorAll('.nb-setup-purpose-list>section').length,1);assert.ok(button(f.root,'Edit storage marker-24'));assert.equal(button(f.root,'Previous storage items').parentElement.hidden,true);
 }finally{ui.destroy();f.dom.window.close();}
});

test('setup invalidates prepared exports on adoption and reset closes an unsaved storage proposal',async()=>{
 const f=browser(),ui=mountSetup(f.root,{config:await config(),cartridges:selectPacks(['cookie-choices'])}),submit=()=>f.root.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 try{submit();const before=ui.getPlan();button(f.root,'Declare storage').click();fill(f);assert.deepEqual(ui.getPlan(),before);f.root.querySelector('.nb-setup-storage-editor input[type=checkbox]').checked=true;button(f.root,'Save storage declaration').click();await settle();assert.equal(ui.getPlan(),null);submit();assert.equal(ui.getPlan().config.storage[0].id,'reading-count');button(f.root,'Declare storage').click();button(f.root,'Start without an imported config').click();assert.equal(f.root.querySelector('.nb-setup-storage-editor .nb-setup-purpose-proposal').hidden,true);assert.equal(ui.getDraft().config,undefined);
 }finally{ui.destroy();f.dom.window.close();}
});

test('opening a stale storage card uses current facts and preserves the exact storage key',async()=>{
 const f=browser();let c=await config();c.storage=[{id:'exact-key',name:' marker ',type:'localStorage',serviceId:'metrics',duration:'Old duration',classification:'optional'}];const ui=mountStorageEditor(f.root,{getConfig:()=>c,onChange:p=>{c=p.config;}});
 try{c=structuredClone(c);c.storage[0].duration='Current duration';button(f.root,'Edit storage  marker ').click();assert.equal(field(f.root,'Actual duration').value,'Current duration');field(f.root,'Actual duration').value='Revised duration';field(f.root,'Reading metrics — new material version').value='metrics-2';f.root.querySelector('input[type=checkbox]').checked=true;button(f.root,'Save storage declaration').click();await settle();assert.equal(c.storage[0].name,' marker ');assert.equal(c.storage[0].duration,'Revised duration');
 }finally{ui.destroy();f.dom.window.close();}
});

test('successive removals retain every old marker and site context across refresh and reset',async()=>{
 const f=browser(),blobs=[];f.dom.window.Blob=Blob;f.dom.window.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:review-'+blobs.length;};let c=await config();c.storage=['first','second'].map(id=>({id,name:id,type:'localStorage',serviceId:'metrics',duration:'One session',classification:'optional'}));const ui=mountStorageEditor(f.root,{getConfig:()=>c,onChange:p=>{c=p.config;}});
 try{for(const [i,name] of ['first','second'].entries()){button(f.root,'Remove storage '+name).click();field(f.root,'Reading metrics — new material version').value='metrics-'+(i+2);f.root.querySelector('input[type=checkbox]').checked=true;button(f.root,'Remove declaration').click();await settle();ui.refresh({discardDraft:true});assert.equal(f.root.querySelector('a[download]').hidden,false);}const review=JSON.parse(await blobs.at(-1).text());assert.equal(review.kind,'private-storage-change-review');assert.equal(review.steps.length,2);assert.deepEqual(review.steps.map(s=>s.changes[0].previous.name),['first','second']);assert.ok(review.steps.every(s=>s.siteId===c.site.id));assert.equal(c.storage.length,0);
 }finally{ui.destroy();f.dom.window.close();}
});

test('pending saves cannot overwrite replaced host facts or survive cancel, import reset or destruction',async()=>{
 for(const action of ['replace','cancel','reset','destroy']){const f=browser();let c=await config(),calls=0;const ui=mountStorageEditor(f.root,{getConfig:()=>c,onChange:p=>{calls++;c=p.config;}});try{ui.open();fill(f);f.root.querySelector('input[type=checkbox]').checked=true;button(f.root,'Save storage declaration').click();if(action==='replace'){c=structuredClone(c);c.controller.name='New host value';}else if(action==='cancel')button(f.root,'Cancel storage changes').click();else if(action==='reset')ui.refresh({discardDraft:true});else ui.destroy();await settle();assert.equal(calls,0,action);assert.equal(c.storage.length,0);if(action==='replace')assert.match(f.root.querySelector('[role=alert]').textContent,/draft changed/);}finally{ui.destroy();f.dom.window.close();}}
});

test('unavailable review downloads prevent adoption rather than losing migration history',async()=>{
 const f=browser();let c=await config(),calls=0;f.dom.window.URL.createObjectURL=()=>{throw Error('unavailable');};const ui=mountStorageEditor(f.root,{getConfig:()=>c,onChange:p=>{calls++;c=p.config;}});try{ui.open();fill(f);f.root.querySelector('input[type=checkbox]').checked=true;button(f.root,'Save storage declaration').click();await settle();assert.equal(calls,0);assert.equal(c.storage.length,0);assert.match(f.root.querySelector('[role=alert]').textContent,/download is unavailable/);}finally{ui.destroy();f.dom.window.close();}
});
