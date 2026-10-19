// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,StrictMode,act} from 'react';
import {renderToString,renderToStaticMarkup} from 'react-dom/server';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {createProcessingChoices,createConsent,renderLegalDocument,renderLegalLinks} from 'notabenda';
import {ConsentProvider,ConsentControls,PreferencesButton,useConsentController,useConsentSnapshot,usePurposeAllowed,useServiceAllowed} from 'notabenda/react';
import {LegalDocument,LegalLinks,CollectionNotice} from 'notabenda/react/documents';
import {compileLegalDocuments,createConsentNotice,createProcessingNotice,createCollectionNotice} from 'notabenda/content';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
import {App} from '../../../examples/react/view.mjs';

const instant='2026-10-18T12:00:00.000Z';
async function setup(id='react-example') {
  const config=await fixture({reviewed:true});config.site.id=id;
  config.services=[{id:'optional-sample',name:'Fictional optional service',provider:'Fictional operator',location:'Local test',purposeIds:config.purposes.map(p=>p.id)}];config.storage=[];
  config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
  const values=new Map();const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const env={storage,now:()=>Date.parse(instant),schedule:()=>()=>{}};
  return {config,values,env,purpose:config.consent.purposes[0].id,controller:createConsent(config,env)};
}
async function domTest(callback,html='') {
  const dom=new JSDOM(`<!doctype html><html><body><div id="root">${html}</div></body></html>`,{url:'https://fictional.example.test/'});
  const keys=['window','document','HTMLElement','Node','Event','MouseEvent','IS_REACT_ACT_ENVIRONMENT'];const previous=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const key of keys)Object.defineProperty(globalThis,key,{value:key==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[key],configurable:true,writable:true});
  // jsdom has no native modal implementation. Real dialog/layout behavior is verified separately in Chromium.
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  try{await callback(dom.window.document.getElementById('root'),dom.window);}finally{dom.window.close();for(const [key,value] of previous)value?Object.defineProperty(globalThis,key,value):delete globalThis[key];}
}
const Probe=({purpose,onSnapshot})=>{const state=useConsentSnapshot();const allowed=usePurposeAllowed(purpose);onSnapshot?.(state);return h('output',{'data-permission':allowed?'allowed':'blocked'},state.purposes[purpose]??'unknown');};

// @requirements REQ-PRODUCT-PRIVACY-SIGNALS
test('React service permission remains distinct from cookie permission, with pure immutable signal snapshots and conservative SSR',async()=>{
  const f=await setup();f.controller.destroy();f.config.services[0].processingActivities=['sharing'];f.config.privacySignals={globalPrivacyControl:{appliesTo:['sharing'],explanation:'Fictional sharing restriction.'}};
  const controller=createConsent(f.config,{...f.env,globalPrivacyControl:()=>true});controller.acceptAll();
  let captured;const SignalProbe=()=>{captured=useConsentSnapshot();return h('output',{'data-cookie':usePurposeAllowed(f.purpose),'data-service':useServiceAllowed('optional-sample')},captured.privacySignals?.globalPrivacyControl??'unknown');};
  const tree=h(ConsentProvider,{controller},h(SignalProbe));const html=renderToString(tree);assert.match(html,/data-cookie="false" data-service="false"/);
  controller.isServiceAllowed=()=>{throw new Error('React render cannot invoke effectful service checks.');};
  await domTest(async container=>{const root=createRoot(container);await act(async()=>root.render(tree));assert.equal(container.querySelector('output').dataset.cookie,'true');assert.equal(container.querySelector('output').dataset.service,'false');assert.equal(captured.privacySignals.globalPrivacyControl,'observed');assert.throws(()=>captured.servicePermissions['optional-sample']=true,TypeError);assert.throws(()=>captured.privacySignals.restrictedServices['optional-sample'].push('sale'),TypeError);await act(async()=>root.unmount());});controller.destroy();
});

test('React processing state is deeply immutable, conservative during reads and never invokes effectful permission checks',async()=>{
  const f=await setup();f.controller.destroy();f.config.services[0].processingActivities=['sale'];
  const release=compileLegalDocuments(f.config),notice=createProcessingNotice(release.artifact,{scopeId:'privacy-choices',activities:['sale'],wording:{title:'Privacy choices',description:'Fictional opt-out.',actionLabel:'Opt out'}});
  const processing=createProcessingChoices(notice,{streamRef:'a'.repeat(64),read:()=>new Promise(()=>{}),submit:async()=>{throw new Error('Unused');}},{storage:f.env.storage});
  const controller=createConsent(f.config,f.env,{processingChoices:processing});controller.acceptAll();let captured;
  controller.isServiceAllowed=()=>{throw new Error('Effectful check during render.');};
  const Component=()=>{captured=useConsentSnapshot();return h('output',{'data-cookie':usePurposeAllowed(f.purpose),'data-service':useServiceAllowed('optional-sample')},captured.processingChoices?.status);};
  const tree=h(ConsentProvider,{controller},h(Component));assert.match(renderToString(tree),/data-cookie="false" data-service="false"/);
  await domTest(async container=>{const root=createRoot(container);await act(async()=>root.render(tree));assert.equal(container.querySelector('output').dataset.cookie,'true');assert.equal(container.querySelector('output').dataset.service,'false');assert.equal(captured.processingChoices.status,'checking');assert.throws(()=>captured.processingChoices.blockedActivities.pop(),TypeError);assert.throws(()=>captured.processingChoices.restrictedActivities.push('sale'),TypeError);assert.throws(()=>captured.processingChoices.revision=1,TypeError);await act(async()=>root.unmount());});
  controller.destroy();processing.destroy();await processing.settled();
});

test('React document components preserve exact core escaping and work without a provider or client hooks',async()=>{
  const f=await setup();f.config.documents.terms.sections[0].paragraphs=['Literal <script>alert("sample")</script> text.'];
  assert.equal(renderToStaticMarkup(h(LegalDocument,{config:f.config,kind:'terms'})),`<div>${renderLegalDocument(f.config,'terms')}</div>`);
  assert.equal(renderToStaticMarkup(h(LegalLinks,{config:f.config})),`<div>${renderLegalLinks(f.config)}</div>`);
  assert.doesNotMatch(renderToStaticMarkup(h(LegalDocument,{config:f.config,kind:'terms'})),/<script/);
  f.config.documents.terms.review.status='draft';assert.throws(()=>renderToStaticMarkup(h(LegalDocument,{config:f.config,kind:'terms'})),/reviewed-content declaration/);
  assert.match(renderToStaticMarkup(h(LegalDocument,{config:f.config,kind:'terms',mode:'preview'})),/Draft — for review/);
  f.controller.destroy();
});

test('server snapshots are conservatively blocked even when the supplied controller has a saved grant',async()=>{
  const f=await setup();f.controller.acceptAll();assert.equal(f.controller.isAllowed(f.purpose),true);
  const html=renderToString(h(ConsentProvider,{controller:f.controller},h(Probe,{purpose:f.purpose}),h(ConsentControls)));
  assert.match(html,/data-permission="blocked">unknown/);assert.doesNotMatch(html,/<dialog|nb-consent-notice/);assert.equal(f.controller.getSnapshot().destroyed,false);f.controller.destroy();
  assert.throws(()=>renderToString(h(Probe,{purpose:f.purpose})),/ConsentProvider/);
});

test('SSR hydration matches before recovering a browser choice, with cached immutable snapshots',async()=>{
  const f=await setup();f.controller.acceptAll();const snapshots=[];
  const tree=h(ConsentProvider,{controller:f.controller},h(Probe,{purpose:f.purpose,onSnapshot:s=>snapshots.push(s)}));
  const html=renderToString(tree);const errors=[];
  await domTest(async container=>{
    let root;await act(async()=>{root=hydrateRoot(container,tree,{onRecoverableError:error=>errors.push(error)});});
    assert.equal(container.querySelector('output').dataset.permission,'allowed');assert.deepEqual(errors,[]);
    const last=snapshots.at(-1);await act(async()=>root.render(tree));assert.equal(snapshots.at(-1),last);
    assert.ok(Object.isFrozen(last)&&Object.isFrozen(last.permissions));assert.throws(()=>{last.permissions[f.purpose]=false;},TypeError);
    await act(async()=>f.controller.rejectAll());assert.equal(container.querySelector('output').dataset.permission,'blocked');
    await act(async()=>root.unmount());
  },html);f.controller.destroy();
});

test('StrictMode leaves one native controls mount, preserves shared preferences and never destroys the host controller',async()=>{
  const f=await setup();let subscriptions=0;const subscribe=f.controller.subscribe;
  f.controller.subscribe=listener=>{subscriptions++;const remove=subscribe(listener);return ()=>{subscriptions--;remove();};};
  f.controller.openPreferences();
  await domTest(async container=>{
    const root=createRoot(container);await act(async()=>root.render(h(StrictMode,null,h(ConsentProvider,{controller:f.controller},h(ConsentControls)))));
    assert.equal(container.querySelectorAll('.nb-controls').length,1);assert.equal(container.querySelectorAll('dialog[open]').length,1);assert.equal(subscriptions,1);assert.equal(f.controller.getSnapshot().preferencesOpen,true);
    await act(async()=>root.unmount());assert.equal(subscriptions,0);assert.equal(f.controller.getSnapshot().destroyed,false);assert.equal(f.controller.getSnapshot().preferencesOpen,true);
  });f.controller.closePreferences();f.controller.destroy();
});

test('controller replacement and resubscription cannot retain an old permission, and destroyed controllers render blocked',async()=>{
  const a=await setup('react-one');const b=await setup('react-two');a.controller.acceptAll();let subscriptions=0;const subscribe=a.controller.subscribe;
  a.controller.subscribe=listener=>{subscriptions++;const remove=subscribe(listener);return ()=>{subscriptions--;remove();};};
  await domTest(async(container,window)=>{
    const root=createRoot(container);const tree=(controller,show=true)=>h(ConsentProvider,{controller},show?h(Probe,{purpose:a.purpose}):null,h(PreferencesButton,null,'Review choices'));
    await act(async()=>root.render(tree(a.controller)));assert.equal(container.querySelector('output').dataset.permission,'allowed');
    await act(async()=>root.render(tree(a.controller,false)));await act(async()=>a.controller.rejectAll());
    await act(async()=>root.render(tree(a.controller)));assert.equal(container.querySelector('output').dataset.permission,'blocked');
    await act(async()=>a.controller.acceptAll());await act(async()=>root.render(tree(b.controller)));assert.equal(subscriptions,0);assert.equal(container.querySelector('output').dataset.permission,'blocked');
    await act(async()=>container.querySelector('button').dispatchEvent(new window.MouseEvent('click',{bubbles:true})));assert.equal(b.controller.getSnapshot().preferencesOpen,true);
    await act(async()=>b.controller.destroy());assert.equal(container.querySelector('button').disabled,true);assert.equal(container.querySelector('output').dataset.permission,'blocked');
    await act(async()=>root.unmount());
  });a.controller.destroy();b.controller.destroy();
});

test('required-receipt React permissions stay blocked during delivery and read shared storage without render-time effects',async()=>{
  const f=await setup();f.controller.destroy();
  const build=compileLegalDocuments(f.config);const notice=createConsentNotice(build.artifact,{scopeId:'react-recorded'});const storage=createSyntheticStorage([]);
  const context={siteId:f.config.site.id,scopeId:notice.scopeId,streamId:'fictional-react-stream',now:()=>new Date(instant)};
  await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);
  const initial=await getConsentHead(storage,context);let deliver;const gate=new Promise(resolve=>{deliver=resolve;});let reads=0;
  const controller=createConsent(f.config,f.env,{evidence:{notice,streamRef:initial.streamRef,read:()=>{reads++;return getConsentHead(storage,context);},write:async body=>{await gate;return recordConsentChoice(storage,body,context);}}});
  let starts=0,stops=0;controller.registerService('optional-sample',{purposes:f.config.consent.purposes.map(p=>p.id),start(){starts++;return ()=>{stops++;};}});
  await controller.settled();controller.isAllowed=()=>{throw new Error('React render must not invoke this effectful method.');};
  await domTest(async container=>{
    const root=createRoot(container);const tree=extra=>h(ConsentProvider,{controller},h(Probe,{purpose:f.purpose}),h('span',null,extra));
    await act(async()=>root.render(tree('initial')));await act(async()=>controller.acceptAll());
    assert.equal(controller.getSnapshot().purposes[f.purpose],'granted');assert.equal(container.querySelector('output').dataset.permission,'blocked');assert.equal(starts,0);
    await act(async()=>{deliver();await controller.settled();});assert.equal(container.querySelector('output').dataset.permission,'allowed');assert.equal(starts,1);
    const previousReads=reads;f.values.set(`notabenda:choices:v1:${f.config.site.id}`,'{}');
    await act(async()=>root.render(tree('storage changed')));assert.equal(container.querySelector('output').dataset.permission,'blocked');assert.equal(reads,previousReads);
    await act(async()=>{controller.refresh();await controller.settled();});assert.equal(stops,1);
    await act(async()=>root.unmount());
  });controller.destroy();
});

test('a completely idle React store resamples current permissions when every consumer remounts',async()=>{
  const f=await setup();f.controller.acceptAll();let subscribers=0;const subscribe=f.controller.subscribe;
  f.controller.subscribe=listener=>{subscribers++;const remove=subscribe(listener);return ()=>{subscribers--;remove();};};
  await domTest(async container=>{
    const root=createRoot(container);const tree=show=>h(ConsentProvider,{controller:f.controller},show?h(Probe,{purpose:f.purpose}):null);
    await act(async()=>root.render(tree(true)));assert.equal(container.querySelector('output').dataset.permission,'allowed');
    await act(async()=>root.render(tree(false)));assert.equal(subscribers,0);f.controller.rejectAll();
    await act(async()=>root.render(tree(true)));assert.equal(container.querySelector('output').dataset.permission,'blocked');
    await act(async()=>root.unmount());assert.equal(subscribers,0);
  });f.controller.destroy();
});

test('the example hydrates without recovery when a saved choice starts optional work before hydration',async()=>{
  const f=await setup();let requests=0;
  const html=renderToString(h(App,{controller:f.controller,config:f.config}));f.controller.acceptAll();
  f.controller.registerService('optional-sample',{purposes:f.config.consent.purposes.map(p=>p.id),start(){requests++;return ()=>{};}});
  await f.controller.settled();assert.equal(requests,1);const errors=[];
  await domTest(async container=>{
    let root;await act(async()=>{root=hydrateRoot(container,h(App,{controller:f.controller,config:f.config,getRequestCount:()=>requests}),{onRecoverableError:error=>errors.push(error)});});
    assert.deepEqual(errors,[]);assert.equal(container.querySelector('[data-request-count]').textContent,'1');assert.equal(container.querySelectorAll('.nb-controls').length,1);
    await act(async()=>root.unmount());
  },html);f.controller.destroy();
});

// @requirements REQ-PRODUCT-COLLECTION-NOTICE
test('React collection notice renders exact core static markup without a provider, hooks or implied acceptance',async()=>{
  const config=await fixture({reviewed:true});const notice=createCollectionNotice(compileLegalDocuments(config).artifact,{scopeId:'contact',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'About your enquiry',intro:'Fictional collection context.'}});
  const {renderCollectionNotice}=await import('notabenda');assert.equal(renderToStaticMarkup(h(CollectionNotice,{notice,idPrefix:'contact-notice',headingLevel:3,className:'host-wrap'})),`<div class="host-wrap">${renderCollectionNotice(notice,{idPrefix:'contact-notice',headingLevel:3})}</div>`);
  notice.reviewStatus='draft';assert.throws(()=>renderToStaticMarkup(h(CollectionNotice,{notice,idPrefix:'contact-notice'})));assert.match(renderToStaticMarkup(h(CollectionNotice,{notice,idPrefix:'contact-notice',allowPreview:true})),/Draft collection notice/);
});

// @requirements REQ-PRODUCT-SCOPE-GUARDS
test('React scope decisions stay deeply immutable and cannot turn a guarded service on through hydration or terms state',async()=>{
 const f=await setup();f.controller.destroy();f.config.scopeGuards={version:1,revision:'assessment-1',site:{children:'present',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};const controller=createConsent(f.config,f.env);controller.acceptAll();let state;const GuardProbe=()=>{state=useConsentSnapshot();return h('output',{'data-allowed':useServiceAllowed('optional-sample')},state.scopeGuards.status);};const tree=h(ConsentProvider,{controller},h(GuardProbe));assert.match(renderToString(tree),/data-allowed="false"/);
 await domTest(async root=>{const app=createRoot(root);await act(async()=>app.render(tree));assert.equal(state.scopeGuards.status,'restricted');assert.throws(()=>state.scopeGuards.blockedPurposeIds.push('forged'),TypeError);const reasons=state.scopeGuards.purposeRestrictions[f.purpose];assert.throws(()=>reasons[0].requirementIds.push('forged'),TypeError);assert.throws(()=>reasons.pop(),TypeError);assert.equal(controller.isServiceAllowed('optional-sample'),false);await act(async()=>app.unmount());});controller.destroy();
});
