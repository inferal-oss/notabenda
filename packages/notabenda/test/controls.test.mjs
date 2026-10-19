// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-CONSENT-RUNTIME
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountControls} from 'notabenda';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
async function setup(factory){
 const config=await fixture({reviewed:true});config.storage=[];
 config.services=[{id:'optional',name:'Optional tools',provider:'Sample provider',location:'This browser',purposeIds:config.purposes.map(p=>p.id)}];
 config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:[{id:'optional',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:10};
 const values=new Map(),environment={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}};
 const dom=new JSDOM('<input aria-label="Site search"><div id="controls"></div>',{url:'https://sample.example.test/'}),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
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
