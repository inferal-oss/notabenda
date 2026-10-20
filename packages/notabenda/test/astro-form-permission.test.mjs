// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import {createFormPermission,createIndexedDBFormPermissionJournal} from '@notabenda/core';
import {mountAstroFormPermission} from '@notabenda/core/astro/client';
import {createFormPermissionOffer,compileLegalDocuments} from '@notabenda/core/content';
import {recordLegalRelease,registerFormPermissionOffer,setActiveFormPermissionOffer,formPermissionStreamRef,getFormPermissionState,recordFormPermission} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
async function setup(extra={}){
 const config=await fixture({reviewed:true});config.scopeGuards={version:1,revision:'ordinary-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 const release=compileLegalDocuments(config),offer=createFormPermissionOffer(release.artifact,{permissionId:'product-updates',purposeId:'enquiries',channel:{id:'email',label:'Email'},revision:'updates-1',reviewStatus:'reviewed',withdrawalUrl:'/preferences',wording:{title:'Product updates',statement:'Send me product updates by email.',grantLabel:'Save email permission',withdrawLabel:'Withdraw email permission',optionality:'Optional. Continue without updates.',withdrawalExplanation:'Withdraw this purpose and channel at any time.'}}),storage=createSyntheticStorage([]),context={siteId:config.site.id,permissionId:offer.permissionId,streamId:'opaque-contact-generation'};
 await recordLegalRelease(storage,release.artifact);await registerFormPermissionOffer(storage,offer,context);await setActiveFormPermissionOffer(storage,offer.offerId,context);
 let reads=0,writes=0;const commands=[];
 const controller=createFormPermission(offer,{streamRef:await formPermissionStreamRef(context),read:()=>{reads++;return getFormPermissionState(storage,context);},submit:async command=>{writes++;commands.push(command);const result=await recordFormPermission(storage,command,context);if(extra.loseAck?.())throw Error('Lost acknowledgment');return result;},...(extra.journal?{journal:extra.journal}:{})});
 return {controller,reads:()=>reads,writes:()=>writes,commands};
}

const markup=(offerId,id='email-updates')=>`<div data-notabenda-form-permission="${id}" data-notabenda-permission-offer="${offerId}"><div data-notabenda-permission-mount></div><div data-notabenda-permission-fallback>Contact the privacy team for help.</div></div>`;
const page=f=>{const dom=new JSDOM(markup(f.controller.getOffer().offerId),{url:'https://example.test/'});return {dom,document:dom.window.document,event:name=>dom.window.document.dispatchEvent(new dom.window.Event(name))};};
const mount=(f,p,id='email-updates')=>mountAstroFormPermission({permission:f.controller,document:p.document,id});

test('Astro permission bridge is server-safe, binds a named exact offer and makes no mount or page-load requests',async()=>{
 const f=await setup(),p=page(f);assert.throws(()=>mountAstroFormPermission({permission:f.controller,id:'email-updates'}),/browser document/);assert.throws(()=>mount(f,p,'invalid id'),/field ID/);const bridge=mount(f,p);
 for(let i=0;i<4;i++){bridge.refresh();p.event('astro:page-load');}assert.equal(p.document.querySelectorAll('.nb-form-permission').length,1);assert.equal(p.document.querySelector('[data-notabenda-permission-fallback]').hidden,true);assert.equal(f.reads(),0);assert.equal(f.writes(),0);bridge.destroy();assert.equal(p.document.querySelector('[data-notabenda-permission-fallback]').hidden,false);assert.equal(f.controller.getSnapshot().status,'idle');p.event('astro:page-load');assert.equal(p.document.querySelectorAll('.nb-form-permission').length,0);f.controller.destroy();p.dom.window.close();
});

test('Astro swaps preserve the host-owned draft without recording it and absent routes detach the field',async()=>{
 const f=await setup(),p=page(f),bridge=mount(f,p);await f.controller.refresh();p.document.querySelector('input').click();assert.equal(f.controller.getSnapshot().checked,true);p.event('astro:before-swap');assert.equal(p.document.querySelectorAll('.nb-form-permission').length,0);assert.equal(p.document.querySelector('[data-notabenda-permission-fallback]').hidden,false);p.document.body.innerHTML=markup(f.controller.getOffer().offerId);p.event('astro:page-load');assert.equal(p.document.querySelector('input').checked,true);assert.equal(f.reads(),1);assert.equal(f.writes(),0);
 p.event('astro:before-swap');p.document.body.innerHTML='<main>Another page</main>';p.event('astro:page-load');assert.equal(p.document.querySelectorAll('.nb-form-permission').length,0);assert.equal(f.controller.getSnapshot().checked,true);bridge.destroy();bridge.destroy();f.controller.destroy();p.dom.window.close();
});

test('changed offers and duplicate surfaces fail closed and can recover without leaking partial UI',async()=>{
 const f=await setup(),p=page(f),bridge=mount(f,p);p.document.body.innerHTML=markup('a'.repeat(64));assert.throws(()=>bridge.refresh(),/offer changed/);assert.equal(p.document.querySelectorAll('.nb-form-permission').length,0);assert.equal(p.document.querySelector('[data-notabenda-permission-fallback]').hidden,false);
 const html=markup(f.controller.getOffer().offerId);p.document.body.innerHTML=html+html;assert.throws(()=>bridge.refresh(),/one Astro FormPermissionField/);assert.equal(p.document.querySelectorAll('.nb-form-permission').length,0);p.document.body.innerHTML=html;bridge.refresh();assert.equal(p.document.querySelectorAll('.nb-form-permission').length,1);bridge.destroy();p.document.body.innerHTML=html+html;assert.throws(()=>mount(f,p),/one Astro FormPermissionField/);p.document.body.innerHTML=html;const recovered=mount(f,p);recovered.destroy();assert.equal(f.writes(),0);f.controller.destroy();p.dom.window.close();
});

test('multiple named Astro fields stay independent and duplicate owners or document IDs are rejected',async()=>{
 const a=await setup(),b=await setup(),p=page(a),q=page(a);p.document.body.innerHTML+=markup(b.controller.getOffer().offerId,'other-channel');const first=mount(a,p),second=mount(b,p,'other-channel');assert.equal(p.document.querySelectorAll('.nb-form-permission').length,2);assert.throws(()=>mount(a,q),/per form permission controller/);const third=await setup();assert.throws(()=>mount(third,p),/per document field ID/);first.destroy();const replaced=mount(third,p);assert.equal(p.document.querySelectorAll('.nb-form-permission').length,2);second.destroy();replaced.destroy();for(const f of [a,b,third])f.controller.destroy();p.dom.window.close();q.dom.window.close();
});

test('pending Astro recovery survives navigation and retries the same command only on an explicit action',async()=>{
 const journal=createIndexedDBFormPermissionJournal({indexedDB:new IDBFactory(),broadcastChannel:false});let lost=true;const f=await setup({journal,loseAck:()=>{const result=lost;lost=false;return result;}}),p=page(f),bridge=mount(f,p);await f.controller.refresh();f.controller.setChecked(true);await assert.rejects(f.controller.grant());assert.equal(f.writes(),1);p.event('astro:before-swap');p.document.body.innerHTML=markup(f.controller.getOffer().offerId);p.event('astro:page-load');assert.equal(f.writes(),1);assert.match(p.document.body.textContent,/Retry permission request/);await f.controller.retryPending();assert.equal(f.writes(),2);assert.deepEqual(f.commands[0],f.commands[1]);assert.match(p.document.body.textContent,/permission has been saved/);f.controller.destroy();assert.match(p.document.body.textContent,/This choice is closed/);bridge.destroy();journal.close();p.dom.window.close();
});
