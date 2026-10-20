// @requirements REQ-QC-PROFILING REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {verifyTechnologyCollectionNotice} from 'notabenda/technology';
const root=new URL('../dist/public/',import.meta.url),key='notabenda:choices:v1:juniper-technology',profile='juniper-technology:interests';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function run(callback,{local={},session={},blocked=false}={}){
 const html=await readFile(new URL('technology/index.html',root),'utf8'),script=await readFile(new URL('assets/technology-example.mjs',root),'utf8'),runtime=JSON.parse(await readFile(new URL('technology/runtime.json',root),'utf8'));
 const dom=new JSDOM(html,{url:'https://juniper.example.test/technology/'}),document=dom.window.document,original=Object.fromEntries(['window','document','fetch'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let requests=0,geolocation=0;
 for(const [k,v] of Object.entries(local))dom.window.localStorage.setItem(k,v);for(const [k,v] of Object.entries(session))dom.window.sessionStorage.setItem(k,v);
 // Storage methods live on the prototype in JSDOM.
 if(blocked){const proto=Object.getPrototypeOf(dom.window.localStorage),set=proto.setItem;proto.setItem=function(...args){if(this===dom.window.localStorage)throw Error('Blocked preference writes');return set.apply(this,args);};}
 Object.defineProperty(dom.window.navigator,'geolocation',{value:{getCurrentPosition(){geolocation++;throw Error('Unexpected location access');},watchPosition(){geolocation++;throw Error('Unexpected location watch');}}});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 Object.defineProperty(globalThis,'window',{configurable:true,value:dom.window});Object.defineProperty(globalThis,'document',{configurable:true,value:document});Object.defineProperty(globalThis,'fetch',{configurable:true,value:async url=>{requests++;assert.equal(url,'/technology/runtime.json');return Response.json(runtime);}});
 try{
  await import('data:text/javascript;base64,'+Buffer.from(script).toString('base64')+'#'+crypto.randomUUID());await tick();
  const open=()=>document.querySelector('.nb-technology-activation a').click(),input=()=>document.querySelector('.nb-preferences input'),save=()=>document.querySelector('.nb-preferences-footer .nb-choice-button:last-child').click(),reject=()=>document.querySelector('.nb-preferences-footer .nb-choice-button:first-child').click(),topic=name=>document.querySelector(`[data-topic="${name}"]`).click();
  return await callback({dom,document,open,input,save,reject,topic,requests:()=>requests,geolocation:()=>geolocation});
 }finally{dom.window.close();for(const [k,d] of Object.entries(original))d?Object.defineProperty(globalThis,k,d):delete globalThis[k];}
}

test('static disclosure pins a retained policy and remains complete without scripts',async()=>{
 const document=new JSDOM(await readFile(new URL('technology/index.html',root),'utf8')).window.document,notice=JSON.parse(await readFile(new URL('technology/notice.json',root),'utf8'));
 const artifact=JSON.parse(await readFile(new URL('artifacts/'+notice.artifactId+'.json',root),'utf8'));assert.equal(verifyTechnologyCollectionNotice(notice,artifact,{mode:'preview'}).noticeId,notice.noticeId);
 const section=document.querySelector('.nb-technology-notice');assert.ok(section.textContent.includes(notice.declaration.technologyDescription));assert.ok(section.textContent.includes(notice.declaration.activationInstructions));assert.equal(section.querySelectorAll('details').length,0);assert.equal(section.getAttribute('data-technology-notice-id'),notice.noticeId);assert.equal(document.querySelector('#profile-state').textContent,'Off');assert.ok(section.compareDocumentPosition(document.querySelector('#privacy-choices'))&4);assert.match(document.querySelector('noscript').textContent,/stays off/u);
 assert.ok(document.querySelector('[aria-label="Demonstration"]'));
});

test('reading, disclosure and unsaved preferences do not create an interest profile',async()=>{
 await run(async({dom,document,open,input,topic,requests,geolocation})=>{
  assert.equal(document.querySelector('.nb-consent-notice').hidden,true);topic('Design');assert.equal(document.querySelector('#article-title').textContent,'Design');assert.equal(document.querySelector('#profile-state').textContent,'Off');assert.equal(dom.window.sessionStorage.getItem(profile),null);
  open();assert.equal(input().checked,false);input().click();document.querySelector('.nb-preferences-header button').click();await tick();topic('Culture');assert.equal(dom.window.sessionStorage.getItem(profile),null);open();assert.equal(input().checked,false);assert.equal(requests(),1);assert.equal(geolocation(),0);
 });
});

test('actual grant enables only the owned topic listener; reload and withdrawal retain the choice and exact cleanup',async()=>{
 const saved=await run(async({dom,document,open,input,save,topic})=>{
  open();input().click();save();await tick();assert.equal(document.querySelector('#profile-state').textContent,'On');topic('Design');topic('Design');assert.match(document.querySelector('#profile-suggestion').textContent,/Design · 2/u);assert.equal(JSON.parse(dom.window.sessionStorage.getItem(profile)).Design,2);
  return {local:{[key]:dom.window.localStorage.getItem(key)},session:{[profile]:dom.window.sessionStorage.getItem(profile),'unrelated:keep':'present'}};
 });
 await run(async({dom,document,open,reject,topic,requests})=>{
  assert.equal(document.querySelector('#profile-state').textContent,'On');assert.match(document.querySelector('#profile-suggestion').textContent,/Design · 2/u);open();reject();await tick();assert.equal(document.querySelector('#profile-state').textContent,'Off');assert.equal(dom.window.sessionStorage.getItem(profile),null);assert.equal(dom.window.sessionStorage.getItem('unrelated:keep'),'present');topic('Outdoors');assert.equal(document.querySelector('#article-title').textContent,'Outdoors');assert.equal(dom.window.sessionStorage.getItem(profile),null);assert.equal(requests(),1);
 },saved);
});

test('rejection and unavailable preference storage leave ordinary reading usable without profiling',async()=>{
 const local=await run(async({dom,document,open,reject,topic})=>{open();reject();await tick();topic('Culture');assert.equal(document.querySelector('#profile-state').textContent,'Off');assert.equal(dom.window.sessionStorage.getItem(profile),null);return {[key]:dom.window.localStorage.getItem(key)};});
 await run(async({document,open,input})=>{open();assert.equal(input().checked,false);assert.equal(document.querySelector('#profile-state').textContent,'Off');},{local});
 await run(async({dom,document,open,input,save,topic})=>{open();input().click();save();await tick();topic('Design');assert.equal(document.querySelector('#profile-state').textContent,'Off');assert.equal(dom.window.sessionStorage.getItem(profile),null);assert.equal(document.querySelector('#article-title').textContent,'Design');assert.match(document.querySelector('#privacy-controls').textContent,/could not|couldn’t|cannot|not be saved/u);},{blocked:true});
});

test('a prior profile cannot persist on a page with no usable grant; cleanup leaves unrelated storage intact',async()=>{
 await run(async({dom,document,topic})=>{
  assert.equal(document.querySelector('#profile-state').textContent,'Off');assert.equal(dom.window.sessionStorage.getItem(profile),null);assert.equal(dom.window.sessionStorage.getItem('unrelated:keep'),'present');topic('Design');assert.equal(dom.window.sessionStorage.getItem(profile),null);
 },{session:{[profile]:'{"Design":3,"Outdoors":0,"Culture":0}','unrelated:keep':'present'}});
});
