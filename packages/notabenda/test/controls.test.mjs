// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-CONSENT-RUNTIME
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountControls} from 'notabenda';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
async function setup(factory,configure=()=>{}){
 const config=await fixture({reviewed:true});config.storage=[];
 config.services=[{id:'optional',name:'Optional tools',provider:'Sample provider',location:'This browser',purposeIds:config.purposes.map(p=>p.id)}];
 config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:[{id:'optional',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:10};
 const values=new Map(),environment={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}};
 const dom=new JSDOM('<input aria-label="Site search"><div id="controls"></div>',{url:'https://sample.example.test/'}),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 configure(dom.window);
 const consent=factory(config,environment),ui=mountControls(doc.querySelector('#controls'),{consent});
 return {config,doc,consent,other:()=>factory(config,environment),close(){ui.destroy();consent.destroy();dom.window.close();}};
}
for(const [profile,factory] of consentProfiles){
 test(`${profile}: native drawer entries expose state and purpose names separately from descriptions`,async()=>{
  const f=await setup(factory);try{
   const trigger=f.doc.querySelector('.nb-preferences-trigger'),preferences=f.doc.querySelector('.nb-choice-secondary button'),drawer=f.doc.querySelector('dialog');
   for(const button of [trigger,preferences]){assert.equal(button.getAttribute('aria-haspopup'),'dialog');assert.equal(button.getAttribute('aria-controls'),drawer.id);assert.equal(button.getAttribute('aria-expanded'),'false');}
   trigger.click();assert.equal(f.doc.activeElement,f.doc.querySelector('dialog h2'));
   for(const button of [trigger,preferences])assert.equal(button.getAttribute('aria-expanded'),'true');
   for(const [i,input] of [...f.doc.querySelectorAll('input[type=checkbox]')].entries()){
    assert.equal(f.doc.getElementById(input.getAttribute('aria-labelledby')).textContent,f.config.purposes[i].name);
    const descriptions=input.getAttribute('aria-describedby').split(' ').map(id=>f.doc.getElementById(id)?.textContent);
    assert.deepEqual(descriptions,[f.config.purposes[i].description,'Services: Optional tools (Sample provider)']);
   }
   f.consent.closePreferences();assert.equal(trigger.getAttribute('aria-expanded'),'false');
  }finally{f.close();}
 });
 test(`${profile}: a background choice moves focus out of the hidden notice but leaves unrelated page focus alone`,async()=>{
  const f=await setup(factory),other=f.other();try{
   const notice=f.doc.querySelector('.nb-consent-notice'),accept=notice.querySelectorAll('.nb-choice-button')[1],trigger=f.doc.querySelector('.nb-preferences-trigger');
   accept.focus();assert.equal(f.doc.activeElement,accept);other.rejectAll();f.consent.refresh();assert.equal(notice.hidden,true);assert.equal(f.doc.activeElement,trigger);
   const search=f.doc.querySelector('input[aria-label="Site search"]');search.focus();other.acceptAll();f.consent.refresh();assert.equal(f.doc.activeElement,search);
   trigger.focus();f.consent.destroy();const status=f.doc.querySelector('.nb-controls > [role=status]');assert.equal(status.hidden,false);assert.equal(f.doc.activeElement,status);assert.match(status.textContent,/unavailable/);
  }finally{other.destroy();f.close();}
 });
}

for(const [profile,factory] of consentProfiles){
 test(`${profile}: absent resize observation retains safe whole-dialog scrolling`,async()=>{
  const f=await setup(factory);try{f.consent.openPreferences();assert.equal(f.doc.querySelector('dialog').dataset.nbScroll,'dialog');f.doc.querySelector('input[type=checkbox]').checked=true;f.consent.closePreferences();assert.equal(f.consent.getSnapshot().purposes.enquiries,'unknown');}finally{f.close();}
 });
 test(`${profile}: text-relative layout fallback preserves drafts and focused controls, then disconnects`,async()=>{
  let observer,disconnected=0;
  const f=await setup(factory,view=>{view.ResizeObserver=class{constructor(callback){this.callback=callback;this.parts=[];observer=this;}observe(part){this.parts.push(part);}disconnect(){disconnected++;}};});
  try{
   const drawer=f.doc.querySelector('dialog'),header=f.doc.querySelector('.nb-preferences-header'),footer=f.doc.querySelector('.nb-preferences-footer'),body=f.doc.querySelector('.nb-preferences-body'),input=body.querySelector('input');let height=600,headerHeight=60,footerHeight=60,scrolls=0;
   Object.defineProperty(drawer,'clientHeight',{get:()=>height});Object.defineProperty(header,'offsetHeight',{get:()=>headerHeight});Object.defineProperty(footer,'offsetHeight',{get:()=>footerHeight});body.style.fontSize='16px';body.style.padding='20px';
   drawer.getBoundingClientRect=()=>({top:0,bottom:height,left:0,right:300});body.getBoundingClientRect=()=>({top:60,bottom:height-footerHeight,left:0,right:300});input.getBoundingClientRect=()=>({top:500,bottom:520,left:50,right:70});input.scrollIntoView=options=>{scrolls++;assert.deepEqual(options,{block:'nearest',inline:'nearest',behavior:'instant'});};
   f.consent.openPreferences();assert.equal(drawer.dataset.nbScroll,'body');assert.equal(observer.parts.length,3);input.checked=true;input.focus();
   // An ordinary resize with the same scroll mode still reveals the same focused control.
   height=450;observer.callback();assert.equal(drawer.dataset.nbScroll,'body');assert.equal(f.doc.activeElement,input);assert.equal(scrolls,1);
   // Header/footer plus the text-relative body minimum and padding no longer fit: all content scrolls in order.
   headerHeight=300;observer.callback();assert.equal(drawer.dataset.nbScroll,'dialog');assert.equal(f.doc.activeElement,input);assert.equal(input.checked,true);assert.equal(f.consent.getSnapshot().purposes.enquiries,'unknown');assert.equal(scrolls,2);
   headerHeight=60;body.style.fontSize='32px';height=350;observer.callback();assert.equal(drawer.dataset.nbScroll,'dialog');height=600;observer.callback();assert.equal(drawer.dataset.nbScroll,'body');assert.equal(input.checked,true);
   f.consent.closePreferences();observer.callback();assert.equal(f.consent.getSnapshot().purposes.enquiries,'unknown');
  }finally{f.close();}
  assert.equal(disconnected,1);observer.callback();
 });
}
