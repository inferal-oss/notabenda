import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-PRODUCT-RELEASE-CANDIDATE REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-STORAGE-CLEANUP
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountControls,registerStorageService} from '@notabenda/core';
import {fixture} from './helpers.mjs';

test('migration does not import opaque old grants; on-demand controls grant nothing and withdrawal preserves unrelated history',async()=>{
 const config=await fixture(),purpose=config.purposes[0];config.purposes=[purpose];config.services=[{id:'metrics',name:'Local sample',provider:'Sample',location:'This browser',purposeIds:[purpose.id]}];config.storage=[{id:'marker',name:'new-sample-marker',type:'localStorage',serviceId:'metrics',duration:'Until withdrawal',classification:'optional'}];config.consent={purposes:[{id:purpose.id,scope:'current-1'}],services:[{id:'metrics',scope:'current-1'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
 const legacy=JSON.stringify({accepted:true,revision:'unmapped-legacy-version'}),values=new Map([['legacy-cmp',legacy],['unrelated','keep']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},consent=createConsent(config,{storage,schedule:()=>()=>{}}),dom=new JSDOM('<main><div id="controls"></div></main>'),d=dom.window.document;dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};let starts=0,stops=0;
 const service=registerStorageService({consent,serviceId:'metrics',targets:[{storageId:'marker'}],start(){starts++;values.set('new-sample-marker','active');return ()=>{stops++;};}},{localStorage:()=>storage}),controls=mountControls(d.getElementById('controls'),{consent,noticeMode:'on-demand'});
 try{await consent.settled();assert.equal(starts,0);assert.equal(consent.isAllowed(purpose.id),false);assert.equal(d.querySelector('.nb-consent-notice').hidden,true);consent.openPreferences();assert.equal(starts,0);assert.equal(consent.isAllowed(purpose.id),false);assert.equal(values.get('legacy-cmp'),legacy);consent.acceptAll();await consent.settled();assert.equal(starts,1);assert.equal(values.get('new-sample-marker'),'active');consent.rejectAll();await consent.settled();assert.equal(stops,1);assert.equal(values.has('new-sample-marker'),false);assert.equal(values.get('legacy-cmp'),legacy);assert.equal(values.get('unrelated'),'keep');controls.destroy();consent.destroy();await service.destroy();
 const next=createConsent(config,{storage,schedule:()=>()=>{}});try{assert.equal(next.isAllowed(purpose.id),false);assert.equal(next.getSnapshot().purposes[purpose.id],'withdrawn');}finally{next.destroy();}}
 finally{controls.destroy();consent.destroy();await service.destroy();dom.window.close();}
});
