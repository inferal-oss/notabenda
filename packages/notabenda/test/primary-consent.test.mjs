// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-BUNDLE-BUDGET
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConsent} from '@notabenda/core';
import {createConsent as headless} from '@notabenda/core/headless';
import {createConsent as consentEntry,createConsentRuntime} from '@notabenda/core/consent';
import {createCompatibilityConsent} from '@notabenda/core/consent/compat';
import {compileConsentRuntimeConfig,compileLegalDocuments,createConsentNotice} from '@notabenda/core/content';
import {requiredConsentEvidence} from '@notabenda/core/consent/evidence';
import {exampleConsentConfig} from '../../../examples/static/choices-build.mjs';
import {fixture} from './helpers.mjs';

test('primary and headless consent accept compiled input only, before browser capabilities, and expose no full-site contact',async()=>{
 const config=exampleConsentConfig(await fixture({reviewed:true}));let touches=0;
 const trap={get storage(){touches++;throw Error('storage touched');},now(){touches++;return 0;}};
 for(const factory of [createConsent,headless,consentEntry]){
  assert.equal(factory,createConsentRuntime);assert.throws(()=>factory(config,trap));assert.throws(()=>factory({inventory:config},trap));
 }
 assert.equal(touches,0);
 const descriptor=compileConsentRuntimeConfig(config,{evidence:'local'}),values=new Map(),env={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}};
 const current=createConsent(descriptor,env),compat=createCompatibilityConsent(config,env);let starts=0,stops=0;
 try{
  assert.equal(current.getConfig().controller,undefined);assert.equal(compat.getConfig().controller.email,config.controller.email);
  current.registerService('sample-measurements',{purposes:['measurement'],start:()=>{starts++;return()=>{stops++;};}});await current.settled();assert.equal(starts,0);
  current.choose({measurement:true,suggestions:false});await current.settled();compat.refresh();assert.equal(starts,1);assert.equal(compat.isAllowed('measurement'),true);assert.equal(current.isAllowed('suggestions'),false);
  compat.rejectAll();current.refresh();await current.settled();assert.equal(stops,1);assert.equal(current.isAllowed('measurement'),false);
 }finally{current.destroy();compat.destroy();}
});

test('primary required mode requires the explicit opaque adapter and never starts work while evidence is pending',async()=>{
 const config=exampleConsentConfig(await fixture({reviewed:true})),notice=createConsentNotice(compileLegalDocuments(config).artifact,{scopeId:'primary-cookie-choices'}),descriptor=compileConsentRuntimeConfig(config,{evidence:'required'});let starts=0;
 const options={notice,streamRef:'a'.repeat(64),read:()=>new Promise(()=>{}),write:async()=>{throw Error('offline');}};
 for(const evidence of [undefined,{},options])assert.throws(()=>createConsent(descriptor,{}, {evidence}),/adapter/);
 const values=new Map(),controller=createConsent(descriptor,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}},{evidence:requiredConsentEvidence(options)});
 try{assert.equal(controller.getSnapshot().evidence.status,'checking');controller.registerService('sample-measurements',{purposes:['measurement'],start:()=>{starts++;return()=>{};}});controller.acceptAll();assert.equal(controller.isAllowed('measurement'),false);assert.equal(starts,0);assert.equal(controller.getSnapshot().evidence.status,'unavailable');}finally{controller.destroy();}
});
