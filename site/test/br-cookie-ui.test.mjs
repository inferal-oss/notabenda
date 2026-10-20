// @requirements REQ-BR-COOKIE-UI REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const root=new URL('../dist/public/',import.meta.url),key='notabenda:choices:v1:juniper-pt',counter='juniper-pt:reading-count';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function run(callback,{local={},session={},blocked=false}={}){
 const html=await readFile(new URL('localization/index.html',root),'utf8'),script=await readFile(new URL('assets/localization.mjs',root),'utf8'),runtime=JSON.parse(await readFile(new URL('localization/runtime.json',root),'utf8'));
 const dom=new JSDOM(html,{url:'https://juniper.example.test/localization/'}),document=dom.window.document,original=Object.fromEntries(['window','document','fetch'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let requests=0;
 for(const [k,v] of Object.entries(local))dom.window.localStorage.setItem(k,v);for(const [k,v] of Object.entries(session))dom.window.sessionStorage.setItem(k,v);
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(blocked){const set=dom.window.Storage.prototype.setItem;dom.window.Storage.prototype.setItem=function(k,v){if(this===dom.window.localStorage)throw new dom.window.DOMException('Blocked','SecurityError');return set.call(this,k,v);};}
 try{
  globalThis.window=dom.window;globalThis.document=document;globalThis.fetch=async url=>{requests++;assert.equal(url,'/localization/runtime.json');return {json:async()=>runtime};};
  await import('data:text/javascript;base64,'+Buffer.from(script).toString('base64')+'#'+crypto.randomUUID());await tick();
  return await callback({dom,document,runtime,requests:()=>requests,open:()=>document.querySelector('.nb-preferences-trigger').click(),input:id=>document.querySelector(`input[name="${id}"]`),save:()=>document.querySelector('.nb-preferences-footer button:last-child').click(),reject:()=>document.querySelector('.nb-preferences-footer button:first-child').click()});
 }finally{dom.window.close();for(const [name,descriptor] of Object.entries(original)){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
}

test('Portuguese first layer exposes rejection and rights; purpose and help drafts grant nothing',async()=>{
 await run(async({dom,document,open,input,requests})=>{
  const notice=document.querySelector('.nb-consent-notice');assert.equal(notice.hidden,false);assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(document.querySelector('#count-state').textContent,'Desativada');assert.equal(dom.window.sessionStorage.getItem(counter),null);
  const actions=notice.querySelectorAll('.nb-choice-button');assert.equal(actions.length,2);assert.match(actions[0].textContent,/Recusar/u);assert.equal(actions[0].className,actions[1].className);
  assert.equal(notice.querySelector('[data-nb-information="rights"]').getAttribute('href'),'/localization/privacy#nb-privacy-section-rights');
  open();assert.equal(document.querySelectorAll('.nb-preferences input:checked').length,0);assert.equal(document.querySelectorAll('.nb-purpose').length,2);assert.match(document.querySelector('.nb-purpose').textContent,/Sugestões de leitura/u);
  const help=document.querySelector('.nb-consent-help');assert.equal(help.open,false);help.querySelector('summary').click();assert.equal(help.open,true);assert.match(help.textContent,/Bloquear apenas cookies não garante/u);assert.equal(help.querySelectorAll('a').length,2);assert.equal(dom.window.localStorage.getItem(key),null);
  input('suggestions').click();document.querySelector('.nb-preferences-header button').click();await tick();assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(dom.window.localStorage.getItem(key),null);
  open();assert.equal(input('suggestions').checked,false);assert.equal(input('reading-count').checked,false);assert.equal(requests(),1);
  const policy=new JSDOM(await readFile(new URL('localization/privacy/index.html',root),'utf8')).window.document;assert.ok(policy.getElementById('nb-privacy-section-rights'));
 });
});

test('independent grants drive actual services; reload increments only the allowed counter and withdrawal removes its marker',async()=>{
 const saved=await run(async({dom,document,open,input,save,requests})=>{
  open();input('suggestions').click();save();await tick();assert.equal(document.querySelector('#reading-state').textContent,'Ativadas');assert.equal(document.querySelector('#count-state').textContent,'Desativada');assert.equal(dom.window.sessionStorage.getItem(counter),null);
  open();input('suggestions').click();input('reading-count').click();save();await tick();assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(document.querySelector('#count-state').textContent,'1');assert.equal(dom.window.sessionStorage.getItem(counter),'1');assert.equal(requests(),1);
  return {local:{[key]:dom.window.localStorage.getItem(key)},session:{[counter]:'1','unrelated:keep':'present'}};
 });
 await run(async({dom,document,open,reject,requests})=>{
  assert.equal(document.querySelector('.nb-consent-notice').hidden,true);assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(document.querySelector('#count-state').textContent,'2');assert.equal(dom.window.sessionStorage.getItem(counter),'2');
  open();reject();await tick();assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(document.querySelector('#count-state').textContent,'Desativada');assert.equal(dom.window.sessionStorage.getItem(counter),null);assert.equal(dom.window.sessionStorage.getItem('unrelated:keep'),'present');assert.equal(requests(),1);
 },saved);
});

test('rejection works on both layers and survives a fresh page without starting either service',async()=>{
 const local=await run(async({dom,document,open,input,reject})=>{
  document.querySelector('.nb-consent-notice .nb-choice-button').click();await tick();assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(dom.window.sessionStorage.getItem(counter),null);
  open();input('suggestions').click();input('reading-count').click();reject();await tick();assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(document.querySelector('#count-state').textContent,'Desativada');
  return {[key]:dom.window.localStorage.getItem(key)};
 });
 await run(async({dom,document,open})=>{assert.equal(document.querySelector('.nb-consent-notice').hidden,true);open();assert.equal(document.querySelectorAll('.nb-preferences input:checked').length,0);assert.equal(dom.window.sessionStorage.getItem(counter),null);},{local});
});

test('blocked preference storage leaves both services off with the localized explanation',async()=>{
 await run(async({dom,document,runtime})=>{
  document.querySelectorAll('.nb-consent-notice .nb-choice-button')[1].click();await tick();assert.equal(document.querySelector('#reading-state').textContent,'Desativadas');assert.equal(document.querySelector('#count-state').textContent,'Desativada');assert.equal(dom.window.sessionStorage.getItem(counter),null);
  assert.ok(document.querySelector('#privacy-controls').textContent.includes(runtime.inventory.localization.consent.storageUnavailable));
 },{blocked:true});
});
