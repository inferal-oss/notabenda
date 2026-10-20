// @requirements REQ-PRODUCT-STORAGE-EXCEPTIONS
// @requirements REQ-UK-EXCEPTIONS REQ-PRODUCT-CONFIG REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-STORAGE-CLEANUP REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import {createStorageExceptions,createIndexedDBStorageExceptionJournal} from '@notabenda/core/storage-exceptions';
import {mountStorageExceptionControls,rejectAllOptionalActivity} from '@notabenda/core/storage-exceptions/ui';
import {createConsent,toPublicConfig,validateSiteConfig,registerStorageService,mountControls} from '@notabenda/core';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {exceptionFixture,memoryJournal,deferred} from './storage-exception-helpers.mjs';
const supported=c=>Object.values(c.getSnapshot().servicePermissions).some(Boolean);
const flush=()=>new Promise(r=>setImmediate(r));
function register(c,id='improvement-service',start=()=>()=>{}){return c.registerService(id,{purposes:[id.replace('-service','')],start});}
const error=(promise,code)=>assert.rejects(promise,e=>e.code===code);

test('reviewed, exclusive host declarations are required; exceptions never enter ordinary consent scope',async()=>{
 const config=await exceptionFixture();assert.equal(validateSiteConfig(config,{mode:'production'}).valid,true);const pub=toPublicConfig(config);pub.storageExceptions.entries[0].conditions.soleImprovementStatistics=false;assert.equal(config.storageExceptions.entries[0].conditions.soleImprovementStatistics,true);
 const descriptor=compileConsentRuntimeConfig(config,{evidence:'local'});assert.deepEqual(descriptor.inventory.consent?.purposes?.map(p=>p.id)??descriptor.consent?.purposes?.map(p=>p.id),['marketing']);
 for(const change of [c=>delete c.scopeGuards,c=>delete c.storageExceptions,c=>c.storage[0].exceptionId='missing',c=>c.storage[0].classification='necessary',c=>c.services[0].processingActivities=['targeted-advertising'],c=>delete c.services[0].processingActivities,c=>c.consent.services.push({id:'improvement-service',scope:'one'}),c=>c.consent.purposes.push({id:'improvement',scope:'one'}),c=>c.storageExceptions.entries[0].conditions.noOtherUseOrLinking=false,c=>c.storageExceptions.entries[0].conditions.extra=true,c=>c.storageExceptions.entries[0].reviewStatus='draft',c=>c.storageExceptions.entries[0].revision=0,c=>c.storageExceptions.information.href='javascript:bad()',c=>c.storageExceptions.entries[1].serviceIds=['improvement-service'],c=>{c.storageExceptions.entries[1].purposeIds=['improvement'];c.services[1].purposeIds=['improvement'];}]){const bad=structuredClone(config);change(bad);assert.equal(validateSiteConfig(bad,{mode:'production'}).valid,false);assert.throws(()=>createStorageExceptions(bad,{journal:memoryJournal()}));}
});

test('hydration and a mounted information/objection route precede default activity, with no cookie consent grant',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal(),c=createStorageExceptions(config,{journal});let starts=0,stops=0;register(c,'improvement-service',()=>{starts++;return ()=>{stops++;};});assert.equal(supported(c),false);await c.settled();assert.equal(starts,0);assert.equal(c.getSnapshot().entries.improvement.reason,'waiting-for-controls');const detach=c.attachPresentation();await c.settled();assert.equal(starts,1);assert.equal(c.getSnapshot().entries.improvement.basis,'declared-storage-exception');
 const consent=createConsent(config,{});assert.equal(consent.isAllowed('marketing'),false);assert.deepEqual(Object.keys(consent.getSnapshot().permissions),['marketing']);assert.equal(journal.data.size,1);detach();await c.settled();assert.equal(stops,1);assert.equal(supported(c),false);consent.destroy();c.destroy();
});

test('objection aborts synchronously, retains local failure, retries it, and survives reload and material revisions',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal(),c=createStorageExceptions(config,{journal});let signal;register(c,'improvement-service',ctx=>{signal=ctx.signal;return ()=>{};});c.attachPresentation();await c.settled();journal.fail=true;const stop=c.object('improvement');assert.equal(signal.aborted,true);assert.equal(c.getSnapshot().servicePermissions['improvement-service'],false);await error(stop,'unavailable');assert.equal(c.getSnapshot().persistence,'unavailable');assert.equal(c.getSnapshot().entries.improvement.unsavedObjection,true);
 journal.fail=false;await c.refresh();await c.settled();assert.equal(c.getSnapshot().entries.improvement.unsavedObjection,false);assert.equal(c.getSnapshot().entries.improvement.objection,'objected');c.destroy();config.storageExceptions.entries[0].revision=2;config.storageExceptions.entries[0].description='Updated description.';
 const reloaded=createStorageExceptions(config,{journal});reloaded.attachPresentation();await reloaded.settled();assert.equal(reloaded.getSnapshot().entries.improvement.objection,'objected');assert.equal(reloaded.getSnapshot().servicePermissions['improvement-service'],false);reloaded.destroy();
});

test('explicit resume is atomic, revision-bound, and separate from accepting consent or rejecting all optional activity',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal(),a=createStorageExceptions(config,{journal}),b=createStorageExceptions(config,{journal});a.attachPresentation();b.attachPresentation();await Promise.all([a.settled(),b.settled()]);const stale=a.getSnapshot().revision;await b.object('improvement');await a.settled();await error(a.resume('improvement',{expectedRevision:stale}),'revision-conflict');await a.refresh();await a.settled();assert.equal(a.getSnapshot().entries.improvement.objection,'objected');
 await a.resume('improvement',{expectedRevision:a.getSnapshot().revision});await Promise.all([a.settled(),b.settled()]);assert.equal(b.getSnapshot().entries.improvement.objection,'none-recorded');const saved=new Map(),consent=createConsent(config,{storage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}});await rejectAllOptionalActivity(consent,a);await a.settled();consent.acceptAll();assert.equal(consent.isAllowed('marketing'),true);assert.equal(supported(a),false);consent.destroy();a.destroy();b.destroy();
});

test('a newer definition disables older tabs and same-revision wording changes cannot silently overwrite saved scopes',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal(),old=createStorageExceptions(config,{journal});old.attachPresentation();await old.settled();await old.object('improvement');
 const newer=structuredClone(config);newer.storageExceptions.entries[0].revision=2;newer.storageExceptions.entries[0].description='Revised facts';const next=createStorageExceptions(newer,{journal});next.attachPresentation();await Promise.all([next.settled(),old.settled()]);assert.equal(old.getSnapshot().entries.improvement.reason,'stale-definition');assert.equal(next.getSnapshot().entries.improvement.objection,'objected');await error(old.resume('improvement',{expectedRevision:old.getSnapshot().revision}),'stale-definition');
 const collision=structuredClone(newer);collision.storageExceptions.entries[0].title='Different with reused revision';const invalid=createStorageExceptions(collision,{journal});invalid.attachPresentation();await invalid.settled();assert.equal(invalid.getSnapshot().persistence,'unavailable');assert.equal(supported(invalid),false);old.destroy();next.destroy();invalid.destroy();
});

test('malformed or unreadable preference data is never erased or treated as no objection',async()=>{
 for(const value of [null,'invalid',{schemaVersion:1}, {schemaVersion:1,siteId:'wrong',revision:0,entries:{}}]){const config=await exceptionFixture(),journal=memoryJournal(),key='notabenda:storage-exceptions:v1:'+config.site.id;journal.data.set(key,value);const c=createStorageExceptions(config,{journal});c.attachPresentation();const seen=[];c.subscribe(s=>seen.push(s.persistence));await c.settled();assert.equal(supported(c),false);assert.equal(seen.at(-1),'unavailable');assert.deepEqual(journal.data.get(key),value);c.destroy();}
});

test('restricted site and purpose facts also hold exceptions off without hiding ordinary documents',async()=>{
 for(const scope of ['site','purpose']){const config=await exceptionFixture();if(scope==='site')config.scopeGuards.site.children='unknown';else config.scopeGuards.purposes=[{id:'improvement',facts:{sensitiveData:'present'}}];const c=createStorageExceptions(config,{journal:memoryJournal()});c.attachPresentation();let starts=0;register(c,'improvement-service',()=>{starts++;return ()=>{};});await c.settled();assert.equal(starts,0);assert.equal(c.getSnapshot().entries.improvement.reason,'scope-restricted');await c.object('improvement');await c.settled();await error(c.resume('improvement',{expectedRevision:c.getSnapshot().revision}),'scope-restricted');assert.equal(c.getSnapshot().entries.improvement.objection,'objected');assert.equal(validateSiteConfig(config,{mode:'production'}).valid,true);c.destroy();}
});

test('late asynchronous start cleanup runs after objection and cannot reopen a revoked generation',async()=>{
 const config=await exceptionFixture(),c=createStorageExceptions(config,{journal:memoryJournal()}),started=deferred(),finish=deferred();let signal,cleanups=0;register(c,'improvement-service',ctx=>{signal=ctx.signal;started.resolve();return finish.promise;});c.attachPresentation();await started.promise;await c.object('improvement');assert.equal(signal.aborted,true);finish.resolve(()=>{cleanups++;});await c.settled();assert.equal(cleanups,1);assert.equal(c.getSnapshot().services['improvement-service'],'blocked');c.destroy();
});

test('native controls expose direct switches, persist independently and stop when detached',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal(),c=createStorageExceptions(config,{journal}),dom=new JSDOM('<main><div></div></main>',{url:'https://example.test'}),d=dom.window.document;let stops=0;register(c,'improvement-service',()=>()=>{stops++;});assert.throws(()=>mountStorageExceptionControls(d.createElement('div'),c,{idPrefix:'offscreen'}));const container=d.querySelector('div'),ui=mountStorageExceptionControls(container,c,{idPrefix:'settings'});await c.settled();assert.equal(d.querySelector('input').checked,true);assert.equal(d.querySelectorAll('dialog,[aria-modal]').length,0);assert.ok([...d.querySelectorAll('button')].every(b=>b.type==='button'));d.querySelector('input').click();await c.settled();assert.equal(d.querySelector('input').checked,false);assert.match(container.textContent,/Off · your choice/);
 d.querySelector('input').click();await c.settled();assert.equal(d.querySelector('input').checked,true);container.remove();await flush();await c.settled();assert.ok(stops>=2);assert.equal(supported(c),false);ui.destroy();c.destroy();dom.window.close();
});

test('actual IndexedDB persistence reopens with objections and rejects a stale resume',async()=>{
 const config=await exceptionFixture(),indexedDB=new IDBFactory(),options={indexedDB,broadcastChannel:null,databaseName:'exception-test'},journal=createIndexedDBStorageExceptionJournal(options),c=createStorageExceptions(config,{journal});c.attachPresentation();await c.settled();const revision=c.getSnapshot().revision;await c.object('improvement');await c.settled();await error(c.resume('improvement',{expectedRevision:revision}),'revision-conflict');c.destroy();journal.close();
 const reopened=createIndexedDBStorageExceptionJournal(options),next=createStorageExceptions(config,{journal:reopened});next.attachPresentation();await next.settled();assert.equal(next.getSnapshot().entries.improvement.objection,'objected');next.destroy();reopened.close();
});


test('a notification during an outstanding refresh cannot reopen an older no-objection result',async()=>{
 const config=await exceptionFixture(),base=memoryJournal(),captured=deferred(),release=deferred();let hold=false;
 const journal={...base,async update(key,change){const result=await base.update(key,change);if(hold){hold=false;captured.resolve();await release.promise;}return result;}};
 const a=createStorageExceptions(config,{journal}),b=createStorageExceptions(config,{journal:base});a.attachPresentation();b.attachPresentation();let starts=0;register(a,'improvement-service',()=>{starts++;return ()=>{};});await Promise.all([a.settled(),b.settled()]);assert.equal(starts,1);
 hold=true;const refresh=a.refresh();await captured.promise;await b.object('improvement');assert.equal(a.getSnapshot().servicePermissions['improvement-service'],false);release.resolve();await refresh;await Promise.all([a.settled(),b.settled()]);assert.equal(starts,1);assert.equal(a.getSnapshot().entries.improvement.objection,'objected');a.destroy();b.destroy();
});

test('queued negative actions cannot be cleared by a preceding resume or an earlier negative completion',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal(),c=createStorageExceptions(config,{journal});c.attachPresentation();await c.settled();await c.object('improvement');await c.settled();const resume=c.resume('improvement',{expectedRevision:c.getSnapshot().revision}),first=c.object('improvement'),second=c.object('improvement');assert.equal(c.getSnapshot().servicePermissions['improvement-service'],false);await Promise.all([resume,first,second]);await c.settled();assert.equal(c.getSnapshot().entries.improvement.objection,'objected');assert.equal(c.getSnapshot().entries.improvement.pending,false);c.destroy();
});

test('sparse arrays, hostile accessors and oversized text are rejected before serialization or storage access',async()=>{
 const config=await exceptionFixture();let touched=0;const journal={read(){touched++;throw Error();},update(){touched++;throw Error();}};
 const huge=[];huge[100_000_000]={};for(const value of [huge,new Array(2),{get schemaVersion(){throw Error('accessor evaluated');}}]){const bad=structuredClone(config);bad.storageExceptions=value;assert.throws(()=>createStorageExceptions(bad,{journal}));}
 const large=structuredClone(config);large.storageExceptions.preferenceNotice='x'.repeat(131073);assert.throws(()=>createStorageExceptions(large,{journal}));assert.equal(touched,0);
});

test('initial persistence failure is visible to subscribers and the native retry can recover safely',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal();journal.fail=true;const c=createStorageExceptions(config,{journal}),dom=new JSDOM('<main></main>'),container=dom.window.document.querySelector('main'),ui=mountStorageExceptionControls(container,c,{idPrefix:'retry'});await c.settled();assert.equal(c.getSnapshot().persistence,'unavailable');assert.match(container.textContent,/off because your saved settings/);const retry=[...container.querySelectorAll('button')].find(b=>b.textContent==='Try again');assert.equal(retry.hidden,false);journal.fail=false;retry.click();await c.settled();assert.equal(c.getSnapshot().persistence,'available');assert.equal(container.querySelector('input').checked,true);ui.destroy();c.destroy();dom.window.close();
});


test('exception cleanup uses exact owned markers, preserves the journal and consent memory, and retries before restarting',async()=>{
 const config=await exceptionFixture(),journal=memoryJournal(),c=createStorageExceptions(config,{journal}),values=new Map([['test-improvement','old'],['unrelated','keep']]),storage={removeItem:k=>values.delete(k),getItem:k=>values.get(k)??null};
 const adapter=registerStorageService({exceptions:c,serviceId:'improvement-service',targets:[{storageId:'improvement-storage'}],start(){values.set('test-improvement','on');return ()=>values.set('test-improvement','late');}},{localStorage:()=>storage});assert.equal(values.get('test-improvement'),'old');c.attachPresentation();await c.settled();assert.equal(values.get('test-improvement'),'on');await c.object('improvement');await c.settled();assert.equal(values.has('test-improvement'),false);assert.equal(values.get('unrelated'),'keep');assert.equal(journal.data.size,1);assert.equal(adapter.getSnapshot().report.failed,false);assert.throws(()=>registerStorageService({exceptions:c,serviceId:'improvement-service',targets:[{storageId:'marketing-storage'}],start:()=>()=>{}},{localStorage:()=>storage}));await adapter.destroy();c.destroy();
});

test('consent defaults clearly scope their accept/reject labels when exception settings exist',async()=>{
 const config=await exceptionFixture(),c=createConsent(config,{}),dom=new JSDOM('<div></div>');dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};const ui=mountControls(dom.window.document.querySelector('div'),{consent:c});const text=dom.window.document.body.textContent;assert.match(text,/Allow these services/);assert.match(text,/Reject these services/);assert.match(text,/separate on\/off controls/);ui.destroy();c.destroy();dom.window.close();
});


test('valid object-property names are ordinary entry IDs and removed IDs retain their saved objection',async()=>{
 const config=await exceptionFixture();config.storageExceptions.entries[0].id='constructor';config.storage[0].exceptionId='constructor';const journal=memoryJournal(),first=createStorageExceptions(config,{journal});first.attachPresentation();await first.settled();assert.equal(first.getSnapshot().entries.constructor.availability,'available');await first.object('constructor');await first.settled();first.destroy();
 const reduced=structuredClone(config);reduced.storageExceptions.entries.shift();reduced.services=reduced.services.filter(s=>s.id!=='improvement-service');reduced.storage=reduced.storage.filter(s=>s.id!=='improvement-storage');const second=createStorageExceptions(reduced,{journal});second.attachPresentation();await second.settled();assert.equal(journal.data.get(second.storageKey).entries.constructor.objected,true);second.destroy();const third=createStorageExceptions(config,{journal});third.attachPresentation();await third.settled();assert.equal(third.getSnapshot().entries.constructor.objection,'objected');third.destroy();
});


test('held initialization and synchronously delivered journal notifications settle into usable current state',async()=>{
 for(const synchronous of [false,true]){
  const config=await exceptionFixture(),captured=deferred(),release=deferred(),base=memoryJournal();let first=true,updates=0;
  const values=new Map(),listeners=new Set();
  const journal=synchronous?{read:async k=>values.get(k),update(k,change){updates++;const old=values.get(k),next=change(structuredClone(old));values.set(k,structuredClone(next));if(JSON.stringify(old)!==JSON.stringify(next))for(const fn of listeners)fn();return Promise.resolve(structuredClone(next));},subscribe(k,fn){listeners.add(fn);return ()=>listeners.delete(fn);}}:{...base,async update(k,change){updates++;const result=await base.update(k,change);if(first){first=false;captured.resolve();await release.promise;}return result;}};
  const c=createStorageExceptions(config,{journal});c.attachPresentation();let starts=0;register(c,'improvement-service',()=>{starts++;return ()=>{};});if(!synchronous){await captured.promise;assert.equal(supported(c),false);release.resolve();}await c.settled();assert.equal(c.getSnapshot().persistence,'available');assert.equal(starts,1);assert.ok(updates<=3);c.destroy();
 }
});


test('a broad rejection still stops consent if the other controller is already destroyed',async()=>{
 const config=await exceptionFixture(),saved=new Map(),consent=createConsent(config,{storage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}),exceptions=createStorageExceptions(config,{journal:memoryJournal()});consent.acceptAll();assert.equal(consent.isAllowed('marketing'),true);exceptions.destroy();await error(rejectAllOptionalActivity(consent,exceptions),'destroyed');assert.equal(consent.isAllowed('marketing'),false);consent.destroy();
});


test('focused native controls retain focus and reject repeat input while a preference transaction is pending',async()=>{
 const config=await exceptionFixture(),base=memoryJournal(),captured=deferred(),release=deferred();let hold=false;
 const journal={...base,async update(key,change){const result=await base.update(key,change);if(hold){hold=false;captured.resolve();await release.promise;}return result;}};
 const c=createStorageExceptions(config,{journal}),dom=new JSDOM('<main></main>'),root=dom.window.document.querySelector('main'),ui=mountStorageExceptionControls(root,c,{idPrefix:'focus'});await c.settled();const input=root.querySelector('input');input.focus();hold=true;input.click();await captured.promise;assert.equal(input.disabled,false);assert.equal(input.getAttribute('aria-disabled'),'true');assert.equal(dom.window.document.activeElement,input);input.click();assert.equal(input.checked,false);release.resolve();await c.settled();assert.equal(dom.window.document.activeElement,input);assert.equal(input.getAttribute('aria-disabled'),'false');assert.equal(c.getSnapshot().entries.improvement.objection,'objected');ui.destroy();c.destroy();dom.window.close();
});
