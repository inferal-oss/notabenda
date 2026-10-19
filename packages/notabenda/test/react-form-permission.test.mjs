// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-A11Y REQ-PRODUCT-SCOPE-GUARDS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,StrictMode,act} from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import {createFormPermission,createIndexedDBFormPermissionJournal} from 'notabenda';
import {createFormPermissionOffer,compileLegalDocuments} from 'notabenda/content';
import {FormPermissionProvider,FormPermissionField,useFormPermissionController,useFormPermissionSnapshot,useFormPermissionAllowed} from 'notabenda/react';
import {recordLegalRelease,registerFormPermissionOffer,setActiveFormPermissionOffer,formPermissionStreamRef,getFormPermissionState,recordFormPermission} from 'notabenda-cf';
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
async function domTest(callback,html=''){
 const dom=new JSDOM('<!doctype html><html><body><div id="root">'+html+'</div></body></html>',{url:'https://example.test/'}),keys=['window','document','HTMLElement','Node','Event','MouseEvent','IS_REACT_ACT_ENVIRONMENT'],previous=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const key of keys)Object.defineProperty(globalThis,key,{value:key==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[key],configurable:true,writable:true});
 try{await callback(dom.window.document.getElementById('root'),dom.window);}finally{dom.window.close();for(const [key,value] of previous)value?Object.defineProperty(globalThis,key,value):delete globalThis[key];}
}
function Probe({capture}){const state=useFormPermissionSnapshot(),controller=useFormPermissionController(),allowed=useFormPermissionAllowed();capture?.(state,controller);return h('output',{'data-allowed':String(allowed),'data-checked':String(state.checked)},state.status);}
const tree=(controller,capture)=>h(FormPermissionProvider,{controller},h(Probe,{capture}),h(FormPermissionField,{fallback:h('p',null,'Use the privacy contact if controls are unavailable.')}));

test('permission SSR is unchecked and off even with a live grant, and rendering initiates no transport',async()=>{
 const f=await setup();await f.controller.refresh();f.controller.setChecked(true);await f.controller.grant();assert.equal(f.controller.getSnapshot().allowed,true);const reads=f.reads(),writes=f.writes();
 const html=renderToString(tree(f.controller));assert.match(html,/data-allowed="false" data-checked="false">idle/);assert.doesNotMatch(html,/<input|nb-form-permission|opaque-contact|streamRef/);assert.match(html,/Use the privacy contact/);assert.equal(f.reads(),reads);assert.equal(f.writes(),writes);assert.throws(()=>renderToString(h(Probe)),/FormPermissionProvider/);f.controller.destroy();
});

test('permission hydration and StrictMode reuse one native field, immutable cached snapshots and a host-owned controller',async()=>{
 const f=await setup();await f.controller.refresh();f.controller.setChecked(true);await f.controller.grant();let captured,owner,subscriptions=0;const subscribe=f.controller.subscribe;f.controller.subscribe=fn=>{subscriptions++;const off=subscribe(fn);return ()=>{subscriptions--;off();};};
 const app=h(StrictMode,null,tree(f.controller,(state,controller)=>{captured=state;owner=controller;})),html=renderToString(app),errors=[],reads=f.reads(),writes=f.writes();
 await domTest(async container=>{let root;await act(async()=>{root=hydrateRoot(container,app,{onRecoverableError:e=>errors.push(e)});});assert.deepEqual(errors,[]);assert.equal(container.querySelector('output').dataset.allowed,'true');assert.equal(container.querySelectorAll('.nb-form-permission').length,1);assert.equal(owner,f.controller);assert.ok(subscriptions>=1);assert.equal(container.querySelector('input').closest('label').hidden,true);
  const snapshot=captured;await act(async()=>root.render(app));assert.equal(captured,snapshot);assert.throws(()=>captured.current.event.revision=99,TypeError);assert.throws(()=>captured.current.permitted=false,TypeError);assert.throws(()=>captured.checked=false,TypeError);assert.equal(f.reads(),reads);assert.equal(f.writes(),writes);
  await act(async()=>root.unmount());assert.equal(subscriptions,0);assert.equal(f.controller.getSnapshot().status,'recorded');assert.equal(f.controller.getSnapshot().allowed,true);
 },html);f.controller.destroy();
});

test('the React field does not read on mount or bind permission to ordinary form submission',async()=>{
 const f=await setup();let submitted=0;
 await domTest(async(container,window)=>{const root=createRoot(container);await act(async()=>root.render(h(FormPermissionProvider,{controller:f.controller},h('form',{onSubmit:event=>{event.preventDefault();submitted++;}},h(FormPermissionField),h('button',{type:'submit'},'Continue')))));assert.equal(f.reads(),0);assert.equal(f.writes(),0);
  const form=container.querySelector('form');await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(submitted,1);assert.equal(f.writes(),0);
  await act(async()=>f.controller.refresh());const input=container.querySelector('input');await act(async()=>input.click());assert.equal(f.controller.getSnapshot().checked,true);await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(submitted,2);assert.equal(f.writes(),0);
  for(const button of container.querySelectorAll('.nb-form-permission button'))assert.equal(button.type,'button');await act(async()=>f.controller.grant());assert.equal(f.writes(),1);assert.match(container.textContent,/permission has been saved/);await act(async()=>f.controller.withdraw());assert.equal(f.writes(),2);assert.match(container.textContent,/withdrawal has been saved/);assert.equal(input.checked,false);await act(async()=>root.unmount());
 });f.controller.destroy();
});

test('replacing a React permission controller detaches the old context and never destroys either owner',async()=>{
 const a=await setup(),b=await setup();await a.controller.refresh();a.controller.setChecked(true);await a.controller.grant();let captured;
 await domTest(async container=>{const root=createRoot(container),render=c=>tree(c,state=>{captured=state;});await act(async()=>root.render(render(a.controller)));assert.equal(captured.allowed,true);await act(async()=>root.render(render(b.controller)));assert.equal(captured.allowed,false);assert.equal(container.querySelectorAll('.nb-form-permission').length,1);assert.equal(b.reads(),0);
  await act(async()=>a.controller.withdraw());assert.equal(captured.status,'idle');await act(async()=>b.controller.refresh());assert.equal(captured.current.revision,0);await act(async()=>b.controller.destroy());assert.equal(captured.allowed,false);assert.match(container.textContent,/This choice is closed/);await act(async()=>root.unmount());assert.notEqual(a.controller.getSnapshot().status,'destroyed');
 });a.controller.destroy();b.controller.destroy();
});

test('pending recovery survives StrictMode unmount/remount and retries only after an explicit action',async()=>{
 const journal=createIndexedDBFormPermissionJournal({indexedDB:new IDBFactory(),broadcastChannel:false});let lost=true;const f=await setup({journal,loseAck:()=>{const value=lost;lost=false;return value;}});
 await domTest(async container=>{let root=createRoot(container);await act(async()=>root.render(h(StrictMode,null,tree(f.controller))));assert.equal(f.reads(),0);await act(async()=>f.controller.refresh());await act(async()=>f.controller.setChecked(true));await act(async()=>assert.rejects(f.controller.grant()));assert.equal(f.writes(),1);assert.match(container.textContent,/Retry permission request/);await act(async()=>root.unmount());assert.equal(f.controller.getSnapshot().recovery.pending,1);
  root=createRoot(container);await act(async()=>root.render(h(StrictMode,null,tree(f.controller))));assert.equal(f.writes(),1);assert.equal(container.querySelectorAll('.nb-form-permission').length,1);assert.match(container.textContent,/Retry permission request/);await act(async()=>f.controller.retryPending());assert.equal(f.writes(),2);assert.deepEqual(f.commands[0],f.commands[1]);assert.equal(container.querySelector('output').dataset.allowed,'true');await act(async()=>root.unmount());
 });f.controller.destroy();journal.close();
});

test('the complete React example hydrates after an early host read without recovery or accidental form writes',async()=>{
 const {ReactPermissionApp}=await import('../../../examples/form-permissions/react-view.mjs'),f=await setup(),offer=f.controller.getOffer(),app=h(StrictMode,null,h(ReactPermissionApp,{controller:f.controller,offer,dark:false})),html=renderToString(app);await f.controller.refresh();f.controller.setChecked(true);await f.controller.grant();const writes=f.writes(),errors=[];
 await domTest(async(container,window)=>{let root;await act(async()=>{root=hydrateRoot(container,app,{onRecoverableError:error=>errors.push(error)});});assert.deepEqual(errors,[]);assert.equal(container.querySelectorAll('.nb-form-permission').length,1);assert.match(container.textContent,/Permission recorded/);assert.equal(container.querySelector('button[type=submit]').disabled,false);
  await act(async()=>container.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));assert.match(container.querySelector('[data-workspace-result]').textContent,/Email permission is unchanged/);assert.equal(f.writes(),writes);await act(async()=>root.unmount());
 },html);f.controller.destroy();
});
