// @requirements REQ-PRODUCT-PRIVACY-SIGNALS REQ-US-CA-GPC REQ-US-CO-GPC REQ-US-CT-GPC
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createConsent,createEmbedService,hasGlobalPrivacyControl,getPrivacySignalRestrictions,toPublicConfig,validateSiteConfig,renderLegalDocument,mountControls} from '@notabenda/core';
import {compileLegalDocuments,createConsentNotice} from '@notabenda/core/content';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';

const instant='2026-10-18T12:00:00.000Z';
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
async function setup(){
  const config=await fixture({reviewed:true});const id=config.purposes[0].id;config.storage=[];
  config.services=[{id:'sale-media',name:'Sale media',provider:'Fictional provider',location:'Synthetic test',purposeIds:[id],processingActivities:['sale','targeted-advertising'],resourceOrigins:['self']},{id:'local-tools',name:'Local tools',provider:'Fictional operator',location:'This browser',purposeIds:[id],processingActivities:[]}];
  config.purposes=[config.purposes[0]];
  config.privacySignals={globalPrivacyControl:{appliesTo:['sale','sharing','targeted-advertising'],explanation:'Fictional policy: this example restricts declared sale, sharing and targeted-advertising services when GPC is observed. No account processing is represented.'}};
  config.consent={purposes:[{id,scope:'one'}],services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
  const values=new Map();let signal=false;let reads=0;let notify;
  const env={storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},now:()=>Date.parse(instant),schedule:()=>()=>{},subscribe:(_key,callback)=>{notify=callback;return ()=>{};},globalPrivacyControl(){reads++;if(signal instanceof Error)throw signal;return signal;}};
  return {config,env,values,id,setSignal(value){signal=value;},get reads(){return reads;},notify(){notify?.();}};
}
const lifecycle=(f,c,id,events)=>c.registerService(id,{purposes:[f.id],start({signal}){events.push(['start',id]);signal.addEventListener('abort',()=>events.push(['abort',id]),{once:true});return ()=>{events.push(['cleanup',id]);};}});

test('prototype-shaped service IDs neither inherit a restriction nor suppress the consent prompt',async()=>{
  const f=await setup();f.config.services=[{...f.config.services[1],id:'constructor'}];f.config.consent.services=[{id:'constructor',scope:'one'}];f.setSignal(true);const c=createConsent(f.config,f.env);const events=[];
  assert.equal(c.getSnapshot().shouldPrompt,true);lifecycle(f,c,'constructor',events);c.acceptAll();await c.settled();assert.equal(c.isServiceAllowed('constructor'),true);assert.deepEqual(events,[['start','constructor']]);c.destroy();await c.settled();
});

test('default browser reader sees the boolean navigator signal even when the host supplies false',async()=>{
  const f=await setup();const dom=new JSDOM('',{url:'https://example.test/'});const previous=Object.getOwnPropertyDescriptor(globalThis,'window');Object.defineProperty(dom.window.navigator,'globalPrivacyControl',{value:true});Object.defineProperty(globalThis,'window',{value:dom.window,configurable:true});
  let c;
  try{const {globalPrivacyControl,...env}=f.env;c=createConsent(f.config,env,{globalPrivacyControl:false});c.acceptAll();assert.equal(c.getSnapshot().privacySignals.globalPrivacyControl,'observed');assert.equal(c.isServiceAllowed('sale-media'),false);}
  finally{c?.destroy();previous?Object.defineProperty(globalThis,'window',previous):delete globalThis.window;dom.window.close();}
});

test('request helper parses protocol fields without treating absence, malformed values or DNT as permission',async()=>{
  for(const [value,want] of [[null,false],['0',false],['true',false],['01',false],['1;extra',false],['1',true],['0, 1',true],['1, 1',true],['1x,0',false]]){
    const headers=new Headers({'DNT':'1'});if(value!==null)headers.set('Sec-GPC',value);
    assert.equal(hasGlobalPrivacyControl({headers}),want,String(value));
  }
  const f=await setup();const result=getPrivacySignalRestrictions(f.config,{globalPrivacyControl:true});assert.deepEqual(result.restrictedServices,{'sale-media':['sale','targeted-advertising']});
  assert.deepEqual(getPrivacySignalRestrictions(f.config,{globalPrivacyControl:false}).restrictedServices,{});assert.throws(()=>getPrivacySignalRestrictions(f.config,{globalPrivacyControl:'true'}));
});

test('policy demands exhaustive classification, survives public projection, renders supplied explanation and scopes activity changes',async()=>{
  const f=await setup();assert.equal(validateSiteConfig(f.config).valid,true);assert.deepEqual(toPublicConfig(f.config).privacySignals,f.config.privacySignals);assert.match(renderLegalDocument(f.config,'privacy'),/Fictional policy/);
  for(const mutate of [c=>delete c.services[1].processingActivities,c=>c.services[0].processingActivities=['profiling'],c=>c.services[0].processingActivities=['sale','sale'],c=>c.privacySignals.globalPrivacyControl.appliesTo=[],c=>c.privacySignals.globalPrivacyControl.appliesTo=['all'],c=>c.privacySignals.globalPrivacyControl.explanation='']){
    const changed=structuredClone(f.config);mutate(changed);assert.equal(validateSiteConfig(changed).valid,false);
  }
  let c=createConsent(f.config,f.env);c.acceptAll();c.destroy();f.config.services[1].processingActivities=['sharing'];c=createConsent(f.config,f.env);assert.equal(c.getSnapshot().permissions[f.id],false);c.destroy();
});

test('GPC precedes registration, cookie accept-all cannot bypass it, and observation survives false/missing/error reads',async()=>{
  const f=await setup();f.setSignal(true);const c=createConsent(f.config,f.env);const events=[];lifecycle(f,c,'sale-media',events);lifecycle(f,c,'local-tools',events);
  c.acceptAll();await c.settled();assert.equal(c.getSnapshot().permissions[f.id],true);assert.deepEqual(c.getSnapshot().servicePermissions,{'sale-media':false,'local-tools':true});assert.deepEqual(events,[['start','local-tools']]);
  for(const value of [false,undefined,new Error('reader unavailable')]){f.setSignal(value);c.refresh();c.acceptAll();await c.settled();assert.equal(c.isServiceAllowed('sale-media'),false);assert.equal(c.getSnapshot().privacySignals.globalPrivacyControl,'observed');}
  assert.equal(c.isServiceAllowed('unknown'),false);const reads=f.reads;c.getSnapshot();c.getSnapshot();assert.equal(f.reads,reads,'snapshots do not read the browser');c.destroy();await c.settled();
});

test('host/browser sources combine monotonically and unsupported or failing signal reads never invent cookie permission',async()=>{
  for(const [host,browser] of [[true,false],[true,undefined],[false,true]]){
    const f=await setup();f.setSignal(browser);const c=createConsent(f.config,f.env,{globalPrivacyControl:host});c.acceptAll();assert.equal(c.isServiceAllowed('sale-media'),false);assert.equal(c.getSnapshot().privacySignals.globalPrivacyControl,'observed');c.destroy();
  }
  const f=await setup();f.setSignal(new Error('blocked getter'));const c=createConsent(f.config,f.env);c.acceptAll();assert.equal(c.getSnapshot().privacySignals.globalPrivacyControl,'unavailable');assert.equal(c.isServiceAllowed('sale-media'),false);assert.equal(c.isServiceAllowed('local-tools'),true);c.destroy();
  const g=await setup();g.setSignal(undefined);const noSignal=createConsent(g.config,g.env);assert.equal(noSignal.isServiceAllowed('sale-media'),false);noSignal.acceptAll();assert.equal(noSignal.isServiceAllowed('sale-media'),true);noSignal.destroy();
});

test('signal enabled before queued work or while cleanup is pending stops restricted generations',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);const events=[];lifecycle(f,c,'sale-media',events);c.acceptAll();f.setSignal(true);await c.settled();assert.deepEqual(events,[]);c.destroy();
  const g=await setup();const d=createConsent(g.config,g.env);const entered=deferred();const completion=deferred();let abort;let starts=0,stops=0;
  d.registerService('sale-media',{purposes:[g.id],start({signal}){starts++;abort=signal;entered.resolve();return completion.promise;}});
  d.acceptAll();await entered.promise;g.setSignal(true);d.refresh();assert.equal(abort.aborted,true);d.acceptAll();completion.resolve(()=>{stops++;});await d.settled();assert.equal(starts,1);assert.equal(stops,1);assert.equal(d.getSnapshot().services['sale-media'],'blocked');d.destroy();
});

test('resume aborts running work and an embed uses service restrictions rather than a preserved cookie purpose grant',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);const dom=new JSDOM('<div id="media"></div>',{url:'https://fictional.example.test/'});const container=dom.window.document.querySelector('#media');const group=createEmbedService({consent:c,serviceId:'sale-media'});
  group.mount(container,{kind:'image',src:'/image.svg',title:'Fictional media',description:'Synthetic image',alt:'Fictional shape'});c.acceptAll();await c.settled();assert.ok(container.querySelector('img'));
  f.setSignal(true);f.notify();assert.equal(container.querySelector('img'),null);assert.equal(c.getSnapshot().permissions[f.id],true);assert.equal(c.getSnapshot().servicePermissions['sale-media'],false);await c.settled();
  group.mount(dom.window.document.body.appendChild(dom.window.document.createElement('div')),{kind:'image',src:'/second.svg',title:'Second',description:'Late mount',alt:'Second shape'});assert.equal(dom.window.document.querySelectorAll('img').length,0);group.destroy();c.destroy();dom.window.close();
});

test('all-restricted purposes do not prompt for cookies and the controls explain the independent restriction',async()=>{
  const f=await setup();f.config.services=[f.config.services[0]];f.config.consent.services=[f.config.consent.services[0]];f.setSignal(true);const c=createConsent(f.config,f.env);assert.equal(c.getSnapshot().shouldPrompt,false);
  const dom=new JSDOM('<div></div>',{url:'https://example.test/'});const proto=dom.window.HTMLDialogElement.prototype;proto.showModal=function(){this.open=true;};proto.close=function(){this.open=false;};
  const ui=mountControls(dom.window.document.querySelector('div'),{consent:c});assert.equal(dom.window.document.querySelector('.nb-consent-notice').hidden,true);assert.match(dom.window.document.querySelector('.nb-control-status').textContent,/Cookie choices do not override/);
  c.openPreferences();assert.match(dom.window.document.querySelector('.nb-preferences-body').textContent,/Global Privacy Control is active/);ui.destroy();c.destroy();dom.window.close();
});

// @requirements REQ-PRODUCT-CONSENT-EVIDENCE
test('late acknowledged cookie evidence cannot start GPC-restricted processing or fabricate a cookie rejection',async()=>{
  const f=await setup();const build=compileLegalDocuments(f.config);const notice=createConsentNotice(build.artifact,{scopeId:'privacy-signals'});const storage=createSyntheticStorage([]);const context={siteId:f.config.site.id,scopeId:notice.scopeId,streamId:'fictional-signal-stream',now:()=>new Date(instant)};
  await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);const initial=await getConsentHead(storage,context);const gate=deferred();let writes=0;
  const c=createConsent(f.config,f.env,{evidence:{notice,streamRef:initial.streamRef,read:()=>getConsentHead(storage,context),write:async body=>{writes++;await gate.promise;return recordConsentChoice(storage,body,context);}}});const events=[];lifecycle(f,c,'sale-media',events);lifecycle(f,c,'local-tools',events);await c.settled();c.acceptAll();f.setSignal(true);assert.equal(c.isServiceAllowed('sale-media'),false);gate.resolve();await c.settled();
  assert.equal(writes,1);assert.equal(c.getSnapshot().permissions[f.id],true);assert.equal(c.getSnapshot().servicePermissions['sale-media'],false);assert.deepEqual(events,[['start','local-tools']]);const head=await getConsentHead(storage,context);assert.equal(head.event.choices[f.id],true);assert.equal(head.revision,1);c.destroy();await c.settled();
});
