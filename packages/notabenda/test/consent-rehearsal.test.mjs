// @requirements REQ-PRODUCT-CONSENT-REHEARSAL REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountConsentRehearsal} from '@notabenda/core/setup/consent-rehearsal';
import {mountSetup} from '@notabenda/core/setup/ui';
import {setupQuestions} from '@notabenda/core/setup';
import {selectPacks} from '@notabenda/core/packs';
import {fixture} from './helpers.mjs';
import {exampleConsentConfig} from '../../../examples/static/choices-build.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function browser({styles='load'}={}){
 const dom=new JSDOM('<!doctype html><html lang="en"><head><title>Setup</title><link rel="stylesheet" href="/assets/notabenda.css"></head><body><main><button id="opener">Try controls</button><div id="mount"></div></main></body></html>',{url:'https://adopter.example.test/setup'}),d=dom.window.document;let storage=0,network=0;
 const patch=view=>{view.HTMLDialogElement.prototype.showModal=function(){this.open=true;};view.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new view.Event('close'));};Object.defineProperty(view,'localStorage',{get(){storage++;throw Error('Ambient storage must not be read.');}});view.fetch=()=>{network++;throw Error('No transport.');};};patch(dom.window);
 const observer=new dom.window.MutationObserver(()=>{for(const frame of d.querySelectorAll('iframe')){if(frame.dataset.testReady)continue;frame.dataset.testReady='true';patch(frame.contentWindow);for(const link of frame.contentDocument.querySelectorAll('link'))if(styles!=='hold')link.dispatchEvent(new frame.contentWindow.Event(styles==='load'?'load':'error'));}});observer.observe(d.body,{subtree:true,childList:true});
 return {dom,d,effects:()=>({storage,network}),close(){observer.disconnect();dom.window.close();}};
}
const config=async()=>exampleConsentConfig(await fixture({reviewed:true}));
const phase=(d,id)=>d.querySelector(`[data-service="${id}"] [data-phase]`).dataset.phase;
const child=d=>d.querySelector('iframe').contentDocument;
const button=(d,text)=>[...d.querySelectorAll('button')].find(b=>b.textContent===text);

test('actual controls operate on a detached draft with only inert services and temporary memory',async()=>{
 const c=await config(),before=structuredClone(c),b=browser(),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:c});
 try{await ui.open();assert.equal(phase(b.d,'sample-measurements'),'blocked');assert.equal(phase(b.d,'sample-suggestions'),'blocked');assert.equal(child(b.d).querySelector('.nb-consent-notice').hidden,false);assert.deepEqual(c,before);assert.deepEqual(b.effects(),{storage:0,network:0});assert.equal(b.d.querySelector('iframe').getAttribute('sandbox'),'allow-same-origin');assert.equal(child(b.d).querySelectorAll('script,form,a[href]').length,0);assert.match(child(b.d).querySelector('meta[http-equiv]').content,/connect-src 'none'/);assert.match(b.d.querySelector('dialog').textContent,/Required receipts/);assert.doesNotMatch(b.d.querySelector('dialog').textContent,/Synthetic private note/);
  button(child(b.d),'Reject optional').click();await tick();assert.equal(phase(b.d,'sample-measurements'),'blocked');button(b.d,'Simulate return visit').click();await tick();await tick();assert.equal(child(b.d).querySelector('.nb-consent-notice').hidden,true);assert.equal(phase(b.d,'sample-suggestions'),'blocked');assert.match(b.d.querySelector('.nb-rehearsal-toolbar').textContent,/Visit 2/);
  button(child(b.d),'Privacy choices').click();const measure=child(b.d).querySelector('input[name=measurement]');measure.checked=true;measure.dispatchEvent(new b.dom.window.Event('change',{bubbles:true}));button(child(b.d),'Save choices').click();await tick();assert.equal(phase(b.d,'sample-measurements'),'active');assert.equal(phase(b.d,'sample-suggestions'),'blocked');assert.match(b.d.querySelector('.nb-rehearsal-toolbar').textContent,/1 of 2 simulated services active/);
  button(child(b.d),'Privacy choices').click();button(child(b.d),'Reject optional').click();await tick();assert.equal(phase(b.d,'sample-measurements'),'blocked');assert.match(b.d.querySelector('[data-service="sample-measurements"]').textContent,/1 starts · 1 stops/);
  button(b.d,'Start fresh').click();await tick();await tick();assert.equal(child(b.d).querySelector('.nb-consent-notice').hidden,false);assert.match(b.d.querySelector('.nb-rehearsal-toolbar').textContent,/Visit 1/);assert.deepEqual(c,before);assert.deepEqual(b.effects(),{storage:0,network:0});
 }finally{ui.destroy();b.close();}
});

test('shared-purpose enrollment and restrictive scope guards use the actual engine',async()=>{
 const c=await config();c.services.find(s=>s.id==='sample-suggestions').purposeIds=['measurement','suggestions'];const b=browser(),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:c});
 try{await ui.open();button(child(b.d),'Preferences').click();child(b.d).querySelector('input[name=measurement]').checked=true;button(child(b.d),'Save choices').click();await tick();assert.equal(phase(b.d,'sample-measurements'),'active');assert.equal(phase(b.d,'sample-suggestions'),'blocked');button(child(b.d),'Privacy choices').click();child(b.d).querySelector('input[name=suggestions]').checked=true;button(child(b.d),'Save choices').click();await tick();assert.equal(phase(b.d,'sample-suggestions'),'active');}finally{ui.destroy();b.close();}
 const guarded=await config();guarded.scopeGuards={version:1,revision:'rehearsal-guard-1',site:{children:'unknown',sensitiveData:'unknown',highRiskProfiling:'unknown',regulatedSector:'unknown'},purposes:[]};
 const g=browser();let second;try{second=mountConsentRehearsal(g.d.querySelector('#mount'),{config:guarded});await second.open();assert.ok([...child(g.d).querySelectorAll('.nb-purpose input')].every(i=>i.disabled));assert.equal(phase(g.d,'sample-measurements'),'blocked');}finally{second?.destroy();g.close();}
});

test('selected localization is rendered exactly and remains independent of English operator chrome',async()=>{
 const c=localizedExampleConfig(await config()),b=browser(),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:c});
 try{await ui.open();assert.equal(child(b.d).querySelector('.nb-controls').lang,'pt-BR');assert.equal(button(child(b.d),c.localization.consent.triggerLabel)?.textContent,c.localization.consent.triggerLabel);assert.ok(child(b.d).body.textContent.includes(c.localization.consent.cookiePolicy));assert.ok(b.d.querySelector('dialog').textContent.includes('Local choices only'));}finally{ui.destroy();b.close();}
});

test('legal and help links cannot navigate, including auxiliary clicks',async()=>{
 const b=browser(),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:await config()});try{await ui.open();const a=child(b.d).querySelector('a'),event=new (child(b.d).defaultView.MouseEvent)('auxclick',{bubbles:true,cancelable:true,button:1});a.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(a.hasAttribute('href'),false);assert.match(b.d.querySelector('.nb-rehearsal-status').textContent,/links are inactive/);}finally{ui.destroy();b.close();}
});

test('style failures keep controls unavailable and close restores focus; disposal releases all frames',async()=>{
 const b=browser({styles:'error'}),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:await config()});try{b.d.querySelector('#opener').focus();await ui.open();assert.match(b.d.querySelector('.nb-rehearsal-status').textContent,/Could not load/);assert.equal(b.d.querySelector('iframe'),null);assert.equal(b.d.querySelector('.nb-consent-notice'),null);ui.close();assert.equal(b.d.activeElement.id,'opener');ui.destroy();ui.destroy();assert.equal(b.d.querySelector('dialog'),null);await assert.rejects(ui.open(),/ended/);}finally{ui.destroy();b.close();}
});

test('closing during style loading invalidates the old run without blocking a new open',async()=>{
 const b=browser({styles:'hold'}),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:await config()});try{const first=ui.open();await tick();const old=child(b.d).querySelector('link');ui.close();const next=ui.open();await tick();old.dispatchEvent(new b.dom.window.Event('load'));assert.equal(button(b.d,'Start fresh').disabled,true);for(const link of child(b.d).querySelectorAll('link'))link.dispatchEvent(new b.dom.window.Event('load'));await Promise.all([first,next]);assert.equal(button(b.d,'Start fresh').disabled,false);assert.equal(b.d.querySelectorAll('iframe').length,1);assert.equal(phase(b.d,'sample-measurements'),'blocked');}finally{ui.destroy();b.close();}
});

test('the prepared Cookie choices pack opens the current draft and invalidation removes its rehearsal',async()=>{
 const b=browser(),c=await config();b.dom.window.URL.createObjectURL=()=> 'blob:fixture';b.dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(b.d.querySelector('#mount'),{config:c,cartridges:selectPacks(['cookie-choices'])});
 try{b.d.querySelector('form').dispatchEvent(new b.dom.window.Event('submit',{bubbles:true,cancelable:true}));const before=ui.getPlan();button(b.d,'Try cookie controls').click();for(let i=0;i<20&&!b.d.querySelector('.nb-consent-rehearsal iframe:not([hidden])');i++)await tick();assert.ok(b.d.querySelector('.nb-consent-rehearsal iframe:not([hidden])'));assert.deepEqual(ui.getPlan(),before);ui.setCartridges(selectPacks(['privacy-pages']));assert.equal(b.d.querySelector('.nb-consent-rehearsal'),null);assert.equal(ui.getPlan(),null);}finally{ui.destroy();b.close();}
});

test('invalid styles/config fail before changing host DOM',async()=>{
 const b=browser(),root=b.d.querySelector('#mount');root.textContent='Keep host content';try{for(const options of [{config:{}},{config:await config(),stylesheetUrls:['https://other.example.test/style.css']},{config:await config(),stylesheetUrls:['/style.css?private']},{config:await config(),stylesheetUrls:Array(9).fill('/style.css')}]){assert.throws(()=>mountConsentRehearsal(root,options));assert.equal(root.textContent,'Keep host content');}}finally{b.close();}
});

test('return visits recheck actual configured expiry instead of preserving an old simulated grant',async()=>{
 const c=await config();c.consent.grantLifetimeDays=1;const b=browser(),real=Date.now;let instant=real();Date.now=()=>instant;const ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:c});
 try{await ui.open();button(child(b.d),'Accept optional').click();await tick();assert.equal(phase(b.d,'sample-measurements'),'active');instant+=2*86400000;button(b.d,'Simulate return visit').click();await tick();await tick();assert.equal(phase(b.d,'sample-measurements'),'blocked');assert.equal(child(b.d).querySelector('.nb-consent-notice').hidden,false);}finally{Date.now=real;ui.destroy();b.close();}
});

test('explicit GPC simulation applies only the declared restrictions without reading the real browser signal',async()=>{
 const c=await config();c.privacySignals={globalPrivacyControl:{appliesTo:['sale'],explanation:'Synthetic classification for the rehearsal test.'}};for(const service of c.services)service.processingActivities=[];c.services.find(s=>s.id==='sample-measurements').processingActivities=['sale'];const b=browser(),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:c});
 try{await ui.open();button(child(b.d),'Accept optional').click();await tick();assert.equal(phase(b.d,'sample-measurements'),'active');const input=b.d.querySelector('.nb-rehearsal-toolbar input');input.checked=true;input.dispatchEvent(new b.dom.window.Event('change',{bubbles:true}));await tick();await tick();assert.equal(phase(b.d,'sample-measurements'),'blocked');assert.equal(phase(b.d,'sample-suggestions'),'active');assert.deepEqual(b.effects(),{storage:0,network:0});}finally{ui.destroy();b.close();}
});

test('queued native close events cannot tear down a reopened rehearsal',async()=>{
 const b=browser({styles:'hold'}),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:await config()}),dialog=b.d.querySelector('dialog');
 dialog.close=function(){this.open=false;queueMicrotask(()=>this.dispatchEvent(new b.dom.window.Event('close')));};
 try{const first=ui.open();await tick();ui.close();assert.equal(b.d.querySelector('iframe'),null);const next=ui.open();await tick();for(const link of child(b.d).querySelectorAll('link'))link.dispatchEvent(new b.dom.window.Event('load'));await Promise.all([first,next]);assert.equal(dialog.open,true);assert.equal(phase(b.d,'sample-measurements'),'blocked');}finally{ui.destroy();b.close();}
});

test('closing cancels real expiry timers and destroys the native preferences view',async()=>{
 const b=browser(),ui=mountConsentRehearsal(b.d.querySelector('#mount'),{config:await config()}),nativeSet=setTimeout,nativeClear=clearTimeout,pending=new Set();
 globalThis.setTimeout=(callback,delay,...args)=>{const id=nativeSet(callback,delay,...args);if(delay>=1000)pending.add(id);return id;};globalThis.clearTimeout=id=>{pending.delete(id);return nativeClear(id);};
 try{await ui.open();button(child(b.d),'Accept optional').click();await tick();assert.ok(pending.size>0);button(child(b.d),'Privacy choices').click();assert.equal(child(b.d).querySelector('.nb-preferences').open,true);ui.close();assert.equal(b.d.querySelector('iframe'),null);assert.equal(pending.size,0);}finally{ui.destroy();globalThis.setTimeout=nativeSet;globalThis.clearTimeout=nativeClear;b.close();}
});

test('draft invalidation while the module loads cannot create a rehearsal from stale facts',async()=>{
 const b=browser();b.dom.window.URL.createObjectURL=()=> 'blob:fixture';b.dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(b.d.querySelector('#mount'),{config:await config(),cartridges:selectPacks(['cookie-choices'])});
 try{b.d.querySelector('form').dispatchEvent(new b.dom.window.Event('submit',{bubbles:true,cancelable:true}));button(b.d,'Try cookie controls').click();ui.setCartridges(selectPacks(['privacy-pages']));await tick();assert.equal(b.d.querySelector('.nb-consent-rehearsal'),null);}finally{ui.destroy();b.close();}
});

test('saved setup drafts contain no rehearsal choices and restoring them starts a fresh rehearsal',async()=>{
 const b=browser();b.dom.window.URL.createObjectURL=()=> 'blob:fixture';b.dom.window.URL.revokeObjectURL=()=>{};const c=await config();c.scopeGuards={version:1,revision:'fixture-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};const answers={schemaVersion:1,markets:[],answers:Object.fromEntries(setupQuestions.map(q=>[q.id,{choice:q.id==='optional-storage'?'yes':'no',justification:'Fictional session fixture.'}])),storageJustifications:{}};let ui=mountSetup(b.d.querySelector('#mount'),{config:c,answers,cartridges:selectPacks(['cookie-choices'])});
 try{b.d.querySelector('form').dispatchEvent(new b.dom.window.Event('submit',{bubbles:true,cancelable:true}));const before=ui.getSessionDraft();button(b.d,'Try cookie controls').click();for(let i=0;i<20&&!b.d.querySelector('.nb-consent-rehearsal iframe:not([hidden])');i++)await tick();button(child(b.d),'Reject optional').click();await tick();assert.deepEqual(ui.getSessionDraft(),before);ui.destroy();ui=mountSetup(b.d.querySelector('#mount'),{config:before.config,answers:before.report,resumeDraft:before});button(b.d,'Try cookie controls').click();for(let i=0;i<20&&!b.d.querySelector('.nb-consent-rehearsal iframe:not([hidden])');i++)await tick();assert.equal(child(b.d).querySelector('.nb-consent-notice').hidden,false);assert.equal(phase(b.d,'sample-measurements'),'blocked');}finally{ui.destroy();b.close();}
});
