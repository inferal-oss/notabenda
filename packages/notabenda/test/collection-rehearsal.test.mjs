// @requirements REQ-PRODUCT-COLLECTION-REHEARSAL REQ-PRODUCT-COLLECTION-FLOW REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {mountCollectionRehearsal} from '@notabenda/core/authoring/collection/rehearsal';
import {prepareCollectionWorkbenchContext} from '@notabenda/core/authoring/collection';
import {mountCollectionWorkbench} from '@notabenda/core/authoring/collection/ui';
import {compileLegalDocuments} from '@notabenda/core/content';
import {setup} from './collection-flow-fixture.mjs';
const tick=()=>new Promise(r=>setTimeout(r,0));
async function settle(){for(let i=0;i<8;i++)await tick();}
const button=(d,label)=>[...d.querySelectorAll('button')].find(n=>n.textContent===label);
const report=(d,id='updates-email')=>d.querySelector(`[data-rehearsal-state="${id}"]`).parentElement;
const counts=(d,id='updates-email')=>d.querySelector(`[data-rehearsal-counts="${id}"]`).textContent;
const permission=(d,index=0)=>d.querySelectorAll('.nb-collection-rehearsal .nb-form-permission')[index];
const prepared=f=>prepareCollectionWorkbenchContext(f.build.artifact,{purposeIds:['message','updates'],settings:f.settings});
function browser(){const dom=new JSDOM('<!doctype html><html lang="en"><body><button id="open">Open rehearsal</button><div id="host"></div></body></html>',{url:'https://adopter.example.test/prepare'}),d=dom.window.document;let network=0,storage=0;
 for(const key of ['localStorage','sessionStorage','indexedDB','BroadcastChannel'])Object.defineProperty(dom.window,key,{get(){storage++;throw Error('No storage.');}});
 dom.window.fetch=dom.window.XMLHttpRequest=()=>{network++;throw Error('No network.');};dom.window.navigator.sendBeacon=()=>{network++;throw Error('No beacon.');};
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){if(this.open){this.open=false;this.dispatchEvent(new dom.window.Event('close'));}};
 return {dom,d,effects:()=>({network,storage}),close:()=>dom.window.close()};}
function check(b,index=0){const input=permission(b.d,index).querySelector('input');input.checked=true;input.dispatchEvent(new b.dom.window.Event('change',{bubbles:true}));}
function scenario(d,value){d.querySelector('.nb-collection-rehearsal select').value=value;}
async function mount(f=undefined){f??=await setup();const b=browser(),context=prepared(f),before=structuredClone({context,settings:f.settings}),ui=mountCollectionRehearsal(b.d.querySelector('#host'),{context,settings:f.settings,releaseConfirmed:true});await ui.open();return {...b,f,context,before,ui,end(){ui.destroy();b.close();}};}

test('rehearsal starts unchecked without reads, commands, active links or changes to the selected release',async()=>{
 const b=await mount();try{assert.equal(permission(b.d).querySelector('input').checked,false);assert.equal(button(permission(b.d),'Save permission').disabled,true);assert.equal(counts(b.d),'Reads 0 · Attempts 0 · Events 0');assert.equal(b.d.querySelector('.nb-collection-rehearsal a[href]'),null);assert.equal(b.d.querySelector('[data-collection-notice-id]'),null);assert.ok(b.d.querySelector('[data-collection-preview]'));assert.match(b.d.querySelector('.nb-collection-rehearsal').textContent,/recovery journal exists only in memory/);
 assert.deepEqual({context:b.context,settings:b.f.settings},b.before);const ids=[...b.d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const n of b.d.querySelectorAll('[aria-describedby]'))for(const id of n.getAttribute('aria-describedby').split(' '))assert.ok(b.d.getElementById(id),id);assert.deepEqual(b.effects(),{network:0,storage:0});
 }finally{b.end();}
});

test('ordinary submission stays independent before and after deliberate permission recording',async()=>{
 const b=await mount();try{button(b.d,'Try ordinary submission').click();assert.match(b.d.querySelector('[data-rehearsal-submissions]').textContent,/1$/);assert.equal(counts(b.d),'Reads 0 · Attempts 0 · Events 0');button(b.d,'Check saved permissions').click();await settle();check(b);assert.equal(counts(b.d),'Reads 1 · Attempts 0 · Events 0');button(permission(b.d),'Save permission').click();await settle();assert.equal(counts(b.d),'Reads 1 · Attempts 1 · Events 1');assert.equal(report(b.d).dataset.allowed,'true');button(b.d,'Try ordinary submission').click();assert.equal(counts(b.d),'Reads 1 · Attempts 1 · Events 1');assert.match(b.d.querySelector('[data-rehearsal-submissions]').textContent,/2$/);assert.deepEqual({context:b.context,settings:b.f.settings},b.before);assert.deepEqual(b.effects(),{network:0,storage:0});}finally{b.end();}
});

test('read failures do not record or permit and do not prevent ordinary submission',async()=>{
 const b=await mount();try{scenario(b.d,'read');button(b.d,'Check saved permissions').click();await settle();assert.equal(counts(b.d),'Reads 1 · Attempts 0 · Events 0');assert.equal(report(b.d).dataset.allowed,'false');check(b);assert.equal(button(permission(b.d),'Save permission').disabled,true);button(b.d,'Try ordinary submission').click();assert.match(b.d.querySelector('[data-rehearsal-submissions]').textContent,/1$/);scenario(b.d,'none');button(b.d,'Check saved permissions').click();await settle();check(b);button(permission(b.d),'Save permission').click();await settle();assert.equal(report(b.d).dataset.allowed,'true');}finally{b.end();}
});

for(const mode of ['before','after'])test(mode+' failure keeps permission off until explicit same-key retry; lost response is deduplicated',async()=>{
 const b=await mount();try{button(b.d,'Check saved permissions').click();await settle();scenario(b.d,mode);check(b);button(permission(b.d),'Save permission').click();await settle();assert.equal(counts(b.d),`Reads 1 · Attempts 1 · Events ${mode==='after'?1:0}`);assert.equal(report(b.d).dataset.allowed,'false');assert.equal(report(b.d).dataset.pending,'1');if(mode==='after')assert.match(report(b.d).textContent,/Recorder state · granted · Controller permission off/);
 button(b.d,'Try ordinary submission').click();assert.equal(counts(b.d),`Reads 1 · Attempts 1 · Events ${mode==='after'?1:0}`);scenario(b.d,'none');await settle();assert.equal(report(b.d).dataset.pending,'1');const retry=button(permission(b.d),'Retry permission request');assert.equal(retry.hidden,false);retry.click();await settle();assert.equal(counts(b.d),'Reads 1 · Attempts 2 · Events 1');assert.equal(report(b.d).dataset.allowed,'true');assert.match(report(b.d).textContent,/Same key as previous attempt/);assert.deepEqual(b.effects(),{network:0,storage:0});}finally{b.end();}
});

test('lost grant followed by refusal cannot be revived; refusal and withdrawal losses retry without duplicate events',async()=>{
 const b=await mount();try{button(b.d,'Check saved permissions').click();await settle();scenario(b.d,'after');check(b);button(permission(b.d),'Save permission').click();await settle();assert.equal(report(b.d).dataset.allowed,'false');const oldRetry=button(permission(b.d),'Retry permission request');button(permission(b.d),'No updates').click();await settle();assert.match(report(b.d).textContent,/Recorder state · refused/);assert.equal(report(b.d).dataset.pending,'1');scenario(b.d,'none');oldRetry.click();await settle();assert.equal(counts(b.d),'Reads 1 · Attempts 3 · Events 2');assert.equal(report(b.d).dataset.allowed,'false');assert.match(report(b.d).textContent,/refused/);
 button(b.d,'Check saved permissions').click();await settle();check(b);button(permission(b.d),'Save permission').click();await settle();assert.equal(report(b.d).dataset.allowed,'true');scenario(b.d,'after');button(permission(b.d),'Withdraw permission').click();await settle();assert.equal(report(b.d).dataset.allowed,'false');assert.match(report(b.d).textContent,/withdrawn/);scenario(b.d,'none');button(permission(b.d),'Retry withdrawal').click();await settle();assert.equal(report(b.d).dataset.allowed,'false');assert.equal(counts(b.d),'Reads 2 · Attempts 6 · Events 4');button(b.d,'Try ordinary submission').click();assert.match(b.d.querySelector('[data-rehearsal-submissions]').textContent,/1$/);
 }finally{b.end();}
});

test('two permission streams have independent state, event counts and pending requests',async()=>{
 const f=await setup(),p=structuredClone(f.settings.decisions[1]);p.purposeId='message';p.permission.permissionId='message-followup';p.permission.wording.title='Message follow-up';p.permission.wording.statement='You may follow up separately.';f.settings.decisions[0]=p;const b=await mount(f);
 try{button(b.d,'Check saved permissions').click();await settle();check(b,0);button(permission(b.d,0),'Save permission').click();await settle();assert.equal(report(b.d,'message-followup').dataset.allowed,'true');assert.equal(report(b.d).dataset.allowed,'false');assert.equal(counts(b.d),'Reads 1 · Attempts 0 · Events 0');scenario(b.d,'before');button(permission(b.d,1),'No updates').click();await settle();assert.equal(report(b.d).dataset.pending,'1');assert.equal(report(b.d,'message-followup').dataset.pending,'0');assert.equal(report(b.d,'message-followup').dataset.allowed,'true');}finally{b.end();}
});

test('fresh, close, Escape notification and destroy discard memory and make detached controls inert',async()=>{
 for(const end of ['fresh','close','escape','destroy']){const b=await mount();try{button(b.d,'Check saved permissions').click();await settle();check(b);const old=button(permission(b.d),'Save permission');old.click();if(end==='fresh')button(b.d,'Start fresh').click();else if(end==='escape')b.d.querySelector('dialog').close();else b.ui[end]();await settle();if(end==='fresh'){assert.equal(counts(b.d),'Reads 0 · Attempts 0 · Events 0');old.click();await settle();assert.equal(counts(b.d),'Reads 0 · Attempts 0 · Events 0');}else if(end!=='destroy'){await b.ui.open();assert.equal(counts(b.d),'Reads 0 · Attempts 0 · Events 0');assert.equal(permission(b.d).querySelector('input').checked,false);}else await assert.rejects(b.ui.open(),/ended/);}finally{b.end();}}
});

test('close restores focus; queued close cannot dispose a newly opened session',async()=>{
 const b=await mount(),dialog=b.d.querySelector('dialog');b.ui.close();b.d.querySelector('#open').focus();await b.ui.open();dialog.close=function(){this.open=false;queueMicrotask(()=>this.dispatchEvent(new b.dom.window.Event('close')));};try{b.ui.close();assert.equal(b.d.activeElement.id,'open');await b.ui.open();await settle();assert.equal(dialog.open,true);assert.ok(permission(b.d));}finally{b.end();}
});

test('a closed preparation cannot mount late controls; hashing errors leave a closable failure',async()=>{
 const f=await setup(),b=browser(),ui=mountCollectionRehearsal(b.d.querySelector('#host'),{context:prepared(f),settings:f.settings,releaseConfirmed:true}),original=crypto.subtle.digest,pending=[];crypto.subtle.digest=function(...args){return new Promise((resolve,reject)=>pending.push(()=>original.apply(this,args).then(resolve,reject)));};
 try{const first=ui.open();ui.close();crypto.subtle.digest=original;for(const finish of pending)finish();await first;assert.equal(permission(b.d),undefined);crypto.subtle.digest=async()=>{throw Error('Unavailable');};await ui.open();assert.equal(permission(b.d),undefined);assert.match(b.d.querySelector('[role=status]').textContent,/secure browser context/);ui.close();}finally{crypto.subtle.digest=original;ui.destroy();b.close();}
});

test('notice-only and localized flows keep the chosen content and have no live links',async()=>{
 const f=await setup();f.settings.decisions=f.settings.decisions.map(d=>({purposeId:d.purposeId,presentation:'notice-only'}));const b=await mount(f);try{assert.equal(permission(b.d),undefined);assert.match(b.d.querySelector('.nb-form-rehearsal-results').textContent,/Notice-only/);button(b.d,'Try ordinary submission').click();assert.match(b.d.querySelector('[data-rehearsal-submissions]').textContent,/1$/);}finally{b.end();}
 const x=await setup();x.config.site.locale='pt-BR';x.config.localization=JSON.parse(await readFile(new URL('../../../examples/localization/messages.json',import.meta.url),'utf8'));x.config.localization.direction='rtl';x.config.localization.reviewStatus='reviewed';x.config.localization.collection=JSON.parse(await readFile(new URL('../../../examples/localization/collection-messages.json',import.meta.url),'utf8'));x.config.localization.formPermission=JSON.parse(await readFile(new URL('../../../examples/localization/form-messages.json',import.meta.url),'utf8'));x.build=compileLegalDocuments(x.config);x.settings.reviewedArtifactId=x.build.manifest.artifactId;const c=await mount(x);try{assert.equal(permission(c.d).lang,'pt-BR');assert.equal(permission(c.d).dir,'rtl');assert.equal(c.d.querySelector('.nb-collection-rehearsal a[href]'),null);}finally{c.end();}
});

test('invalid settings fail before modifying the DOM; shared scope and localization guards are preserved',async()=>{
 const f=await setup(),b=browser(),host=b.d.querySelector('#host');host.textContent='Keep me';try{for(const mutate of [v=>v.settings.reviewedArtifactId='a'.repeat(64),v=>v.settings.decisions.pop(),v=>v.releaseConfirmed=false,v=>v.context.permissionContext.scopeGuards[1].assessment.facts.children='unknown',v=>v.settings.decisions[1].permission.marketingRequest={}]){const value={context:prepared(f),settings:structuredClone(f.settings),releaseConfirmed:true};mutate(value);assert.throws(()=>mountCollectionRehearsal(host,value));assert.equal(host.textContent,'Keep me');}}finally{b.close();}
});

test('workbench tries current values without changing review/export; edits and import start invalidate the rehearsal',async()=>{
 const f=await setup(),b=browser(),context=prepared(f),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context});try{button(b.d,'Try form flow').click();await settle();assert.equal(b.d.querySelector('.nb-collection-rehearsal'),null);assert.match(b.d.querySelector('.nb-workbench-status').textContent,/Confirm/);b.d.querySelector('[data-workbench=release]').checked=true;const before=ui.getSettings();button(b.d,'Try form flow').click();await settle();assert.ok(permission(b.d));button(b.d,'Try ordinary submission').click();assert.deepEqual(ui.getSettings(),before);button(b.d,'Close rehearsal').click();assert.equal(b.d.activeElement,button(b.d,'Try form flow'));
 button(b.d,'Try form flow').click();await settle();const title=b.d.querySelector('input[id$="-title"]');title.value='Current edited notice';title.dispatchEvent(new b.dom.window.Event('input'));assert.equal(b.d.querySelector('.nb-collection-rehearsal'),null);b.d.querySelector('[data-workbench=release]').checked=true;button(b.d,'Try form flow').click();await settle();assert.match(b.d.querySelector('.nb-collection-rehearsal').textContent,/Current edited notice/);
 const file=b.d.querySelector('input[type=file]');Object.defineProperty(file,'files',{value:[{size:20,name:'broken.json',text:async()=>'{broken'}]});file.dispatchEvent(new b.dom.window.Event('change'));assert.equal(b.d.querySelector('.nb-collection-rehearsal'),null);await settle();assert.deepEqual(b.effects(),{network:0,storage:0});}finally{ui.destroy();b.close();}
});

test('an import completing after an old-settings rehearsal opens disposes that run and requires a new release confirmation',async()=>{
 const f=await setup(),b=browser(),context=prepared(f),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context});let finish;const text=new Promise(resolve=>{finish=resolve;});
 try{const imported=structuredClone(f.settings);imported.notice.wording.title='Imported replacement form';const file=b.d.querySelector('input[type=file]');Object.defineProperty(file,'files',{value:[{size:1000,name:'settings.json',text:()=>text}]});file.dispatchEvent(new b.dom.window.Event('change'));b.d.querySelector('[data-workbench=release]').checked=true;button(b.d,'Try form flow').click();await settle();assert.ok(permission(b.d));finish(JSON.stringify(imported));await settle();assert.equal(b.d.querySelector('.nb-collection-rehearsal'),null);assert.equal(b.d.querySelector('input[id$="-title"]').value,'Imported replacement form');assert.equal(b.d.querySelector('[data-workbench=release]').checked,false);assert.throws(()=>ui.getSettings(),/Confirm/);b.d.querySelector('[data-workbench=release]').checked=true;button(b.d,'Try form flow').click();await settle();assert.match(b.d.querySelector('.nb-collection-rehearsal').textContent,/Imported replacement form/);}finally{finish('{}');ui.destroy();b.close();}
});

test('English release content retains its language and direction inside a non-English RTL operator page',async()=>{
 const f=await setup(),b=browser();b.d.documentElement.lang='ar';b.d.documentElement.dir='rtl';const ui=mountCollectionRehearsal(b.d.querySelector('#host'),{context:prepared(f),settings:f.settings,releaseConfirmed:true});try{await ui.open();const surface=permission(b.d);assert.equal(surface.closest('[lang]').lang,'en');assert.equal(surface.closest('[dir]').dir,'ltr');assert.equal(b.d.querySelector('.nb-collection-notice').lang,'en');}finally{ui.destroy();b.close();}
});
