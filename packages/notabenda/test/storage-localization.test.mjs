// @requirements REQ-PRODUCT-STORAGE-LOCALIZATION REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-STORAGE-EXCEPTIONS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {validateSiteConfig,toPublicConfig} from '@notabenda/core';
import {createStorageExceptions} from '@notabenda/core/storage-exceptions';
import {mountStorageExceptionControls} from '@notabenda/core/storage-exceptions/ui';
import {compileLegalDocuments,compileConsentRuntimeConfig,createConsentNotice} from '@notabenda/core/content';
import {recordLegalRelease,createDocumentHistory} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {exceptionFixture,memoryJournal,deferred} from './storage-exception-helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {selectPacks,reviewPackInputs,planPacks} from '@notabenda/core/packs';
import {assessIntegration} from '@notabenda/core/integration/assessment';
const messages=JSON.parse(await readFile(new URL('../../../examples/localization/storage-messages.json',import.meta.url),'utf8'));
async function configured(){const c=await exceptionFixture(),locale=localizedExampleConfig(c);c.site.locale='pt-BR';c.localization=locale.localization;c.localization.reviewStatus='reviewed';c.localization.storageExceptions=structuredClone(messages);return c;}
const browser=()=>{const dom=new JSDOM('<main><div id="settings"></div></main>',{url:'https://example.test'});return {dom,d:dom.window.document,root:dom.window.document.getElementById('settings')};};
const tick=()=>new Promise(r=>setImmediate(r));

test('complete selected messages and language metadata reach real controls without consent or policy mutation',async()=>{
 const c=await configured(),before=structuredClone(c),journal=memoryJournal(),controller=createStorageExceptions(c,{journal}),f=browser(),ui=mountStorageExceptionControls(f.root,controller,{idPrefix:'pt'});
 try{assert.equal(f.root.firstElementChild.lang,'pt-BR');assert.equal(f.root.firstElementChild.dir,'ltr');assert.equal(f.d.querySelector('h2').textContent,messages.title);assert.ok(f.root.textContent.includes(messages.description));await controller.settled();assert.ok(f.root.textContent.includes(messages.on));assert.ok(f.root.textContent.includes(messages.browserScope));assert.equal(f.d.querySelector('.nb-exception-off').textContent,messages.turnOffLabel);assert.equal(f.d.querySelector('a').getAttribute('href'),c.storageExceptions.information.href);f.d.querySelector('input').click();await controller.settled();assert.equal(controller.getSnapshot().entries.improvement.objection,'objected');assert.ok(f.root.textContent.includes(messages.objected));assert.doesNotMatch(f.root.textContent,/Off · your choice|Changes apply to this browser|Try again|Storage and access settings/);assert.deepEqual(c,before);}finally{ui.destroy();controller.destroy();f.dom.window.close();}
});

test('missing dictionaries reject native mounting before presentation; headless data remains usable',async()=>{
 const c=await configured();delete c.localization.storageExceptions;assert.equal(validateSiteConfig(c).valid,true);const controller=createStorageExceptions(c,{journal:memoryJournal()}),f=browser();let starts=0;controller.registerService('improvement-service',{purposes:['improvement'],start(){starts++;return ()=>{};}});
 try{assert.throws(()=>mountStorageExceptionControls(f.root,controller,{idPrefix:'missing'}),/localization.storageExceptions/);await controller.settled();assert.equal(starts,0);assert.equal(f.root.children.length,0);assert.equal(controller.getSnapshot().entries.improvement.availability,'waiting-for-controls');}finally{controller.destroy();f.dom.window.close();}
});

test('message validation is closed, bounded and plain text; invalid accessors never execute',async()=>{
 const original=await configured();for(const mutate of [m=>delete m.on,m=>m.extra='unused',m=>m.title='',m=>m.description='<b>Text</b>',m=>m.on='{state}',m=>m.off='x\n',m=>m.retryLabel='x'.repeat(121),m=>m.checking='x'.repeat(2001)]){const c=structuredClone(original);mutate(c.localization.storageExceptions);assert.equal(validateSiteConfig(c).valid,false);assert.throws(()=>createStorageExceptions(c,{journal:memoryJournal()}));}
 for(const value of [null,false,[],{},'words']){const c=structuredClone(original);c.localization.storageExceptions=value;assert.throws(()=>toPublicConfig(c));}
 let calls=0;const c=structuredClone(original);Object.defineProperty(c.localization.storageExceptions,'title',{enumerable:true,get(){calls++;throw Error('private');}});assert.throws(()=>toPublicConfig(c));assert.equal(calls,0);
 const long=structuredClone(original);for(const key of Object.keys(long.localization.storageExceptions))long.localization.storageExceptions[key]='x'.repeat(key.endsWith('Label')?120:2000);assert.throws(()=>toPublicConfig(long));
});

test('translations are retained in releases but stay out of cookie runtime and notice scopes',async()=>{
 const c=await configured(),one=compileLegalDocuments(c),next=structuredClone(c);next.localization.storageExceptions.on='Em uso';next.localization.revision+='-2';const two=compileLegalDocuments(next),store=createSyntheticStorage([]);assert.notEqual(one.manifest.artifactId,two.manifest.artifactId);assert.deepEqual(one.artifact.publicConfig.localization.storageExceptions,messages);await recordLegalRelease(store,one.artifact);assert.ok((await createDocumentHistory(store).get(one.manifest.artifactId)).data);assert.equal(compileConsentRuntimeConfig(c,{evidence:'local'}).inventory.localization.storageExceptions,undefined);const a=createConsentNotice(one.artifact,{scopeId:'settings'}),b=createConsentNotice(two.artifact,{scopeId:'settings'});assert.equal(a.localization.storageExceptions,undefined);assert.equal(a.scopeDigest,b.scopeDigest);
});

test('copy changes preserve recorded objections and journal entry identity',async()=>{
 const c=await configured(),journal=memoryJournal(),a=createStorageExceptions(c,{journal});let detach=a.attachPresentation();await a.settled();await a.object('improvement');await a.settled();const before=structuredClone(journal.data.get(a.storageKey));detach();a.destroy();c.localization.revision+='-2';c.localization.storageExceptions.objected='Sua opção foi mantida';const b=createStorageExceptions(c,{journal}),f=browser(),ui=mountStorageExceptionControls(f.root,b,{idPrefix:'new'});try{await b.settled();assert.deepEqual(journal.data.get(b.storageKey),before);assert.equal(b.getSnapshot().entries.improvement.objection,'objected');assert.ok(f.root.textContent.includes('Sua opção foi mantida'));}finally{ui.destroy();b.destroy();f.dom.window.close();}
});

test('failure, pending, retry and terminal states use selected text without reopening restricted work',async()=>{
 const c=await configured(),journal=memoryJournal();journal.fail=true;const a=createStorageExceptions(c,{journal}),f=browser(),ui=mountStorageExceptionControls(f.root,a,{idPrefix:'failure'});try{assert.ok(f.root.textContent.includes(messages.checking));await a.settled();assert.ok(f.root.textContent.includes(messages.unavailable));const retry=[...f.d.querySelectorAll('button')].find(b=>b.textContent===messages.retryLabel);assert.equal(retry.hidden,false);journal.fail=false;retry.click();await a.settled();const hold=deferred();journal.hold=hold.promise;f.d.querySelector('input').click();await tick();assert.ok(f.root.textContent.includes(messages.saving)||f.root.textContent.includes(messages.objected));assert.equal(a.getSnapshot().servicePermissions['improvement-service'],false);hold.resolve();await a.settled();a.destroy();assert.ok(f.root.textContent.includes(messages.destroyed));assert.ok([...f.d.querySelectorAll('input,button')].every(b=>b.disabled));}finally{ui.destroy();a.destroy();f.dom.window.close();}
});

test('destroyed and synchronously detached controls cannot issue new commands through retained nodes',async()=>{
 for(const explicit of [true,false]){const c=await configured(),journal=memoryJournal(),a=createStorageExceptions(c,{journal}),f=browser(),ui=mountStorageExceptionControls(f.root,a,{idPrefix:'detach'});await a.settled();await a.object('improvement');await a.settled();const input=f.d.querySelector('input'),off=f.d.querySelector('.nb-exception-off'),before=structuredClone(journal.data.get(a.storageKey));if(explicit)ui.destroy();else f.root.replaceChildren();input.click();input.checked=true;input.dispatchEvent(new f.dom.window.Event('change',{bubbles:true}));off.click();await tick();await a.settled();assert.deepEqual(journal.data.get(a.storageKey),before);assert.equal(a.getSnapshot().servicePermissions['improvement-service'],false);ui.destroy();a.destroy();f.dom.window.close();}
});

test('direction and authored overrides remain explicit; production rejects draft translations',async()=>{
 const c=await configured();c.site.locale=c.localization.locale='ar';c.localization.direction='rtl';const a=createStorageExceptions(c,{journal:memoryJournal()}),f=browser(),ui=mountStorageExceptionControls(f.root,a,{idPrefix:'rtl',title:'عنوان',description:'وصف'});try{assert.equal(f.root.firstElementChild.dir,'rtl');assert.equal(f.root.firstElementChild.lang,'ar');assert.equal(f.d.querySelector('h2').textContent,'عنوان');await a.settled();}finally{ui.destroy();a.destroy();f.dom.window.close();}c.localization.reviewStatus='draft';assert.throws(()=>createStorageExceptions(c,{journal:memoryJournal()}));const preview=createStorageExceptions(c,{journal:memoryJournal(),allowPreview:true});preview.destroy();
});

test('pack and agent assessments identify the exact missing dictionary and preserve unknowns',async()=>{
 const c=await configured(),selection=selectPacks(['assessed-storage-settings']);assert.equal(reviewPackInputs(selection,c).packs[0].items.find(x=>x.id==='language').state,'declared');assert.ok(planPacks(selection).reference.targets.find(t=>t.id==='storage-exceptions').conditionalConfig.some(r=>r.requiredPaths.includes('localization.storageExceptions')));
 const targetSelection={schemaVersion:1,answers:{'assessed-storage-exceptions':'yes'}};assert.equal(assessIntegration({selection:targetSelection,config:c}).missingRequiredConfig.some(x=>x.path==='localization.storageExceptions'),false);
 delete c.localization.storageExceptions;assert.equal(reviewPackInputs(selection,c).packs[0].items.find(x=>x.id==='language').state,'needs-review');assert.ok(assessIntegration({selection:targetSelection,config:c}).missingRequiredConfig.some(x=>x.path==='localization.storageExceptions'));
});

test('stale definitions, scope restrictions, failed actions and failed service starts retain their selected labels',async()=>{
 for(const kind of ['stale','restricted','action','reload']){
  const c=await configured(),journal=memoryJournal();if(kind==='restricted')c.scopeGuards.site.children='unknown';const a=createStorageExceptions(c,{journal}),f=browser();if(kind==='reload')a.registerService('improvement-service',{purposes:['improvement'],start(){throw Error('sample failure');}});const ui=mountStorageExceptionControls(f.root,a,{idPrefix:'state'});let newer;
  try{await a.settled();if(kind==='stale'){const next=structuredClone(c);next.storageExceptions.entries[0].revision++;next.storageExceptions.entries[0].description+=' Updated.';newer=createStorageExceptions(next,{journal});newer.attachPresentation();await Promise.all([newer.settled(),a.settled()]);assert.ok(f.root.textContent.includes(messages.stale));assert.equal(a.getSnapshot().servicePermissions['improvement-service'],false);}else if(kind==='restricted'){assert.ok(f.root.textContent.includes(messages.restricted));assert.equal(a.getSnapshot().servicePermissions['improvement-service'],false);}else if(kind==='reload'){assert.ok(f.root.textContent.includes(messages.enabledReload));assert.equal(a.getSnapshot().services['improvement-service'],'reload-required');}else{journal.fail=true;f.d.querySelector('input').click();await a.settled();await tick();assert.ok(f.root.textContent.includes(messages.unconfirmed));assert.equal(a.getSnapshot().servicePermissions['improvement-service'],false);}}
  finally{ui.destroy();a.destroy();newer?.destroy();f.dom.window.close();}
 }
});
