// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,act} from 'react';
import {renderToString} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import * as legacy from 'notabenda/react';
import * as compiled from 'notabenda/react/consent';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
async function setup(factory){
 const config=await fixture({reviewed:true});config.storage=[];config.services=[{id:'optional',name:'Optional',provider:'Sample',location:'This browser',purposeIds:config.purposes.map(p=>p.id)}];config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:[{id:'optional',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:0,promptPolicy:{profile:'it-garante-2021',processingRevision:'one'}};
 const values=new Map(),controller=factory(config,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}});
 return {controller};
}
async function domTest(run){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://sample.example.test/'}),keys=['window','document','HTMLElement','Node','IS_REACT_ACT_ENVIRONMENT'],before=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const k of keys)Object.defineProperty(globalThis,k,{value:k==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[k],configurable:true,writable:true});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 try{await run(dom.window.document.querySelector('#root'));}finally{dom.window.close();for(const [k,v] of before)v?Object.defineProperty(globalThis,k,v):delete globalThis[k];}
}
for(const [index,[profile,factory]] of consentProfiles.entries()){
 const api=index===0?legacy:compiled;
 test(`${profile}: regional prompt UI snapshots are deeply immutable and do not mutate the host decision`,async()=>{
  const {controller}=await setup(factory);controller.rejectAll();let snapshot;
  const Probe=()=>{snapshot=api.useConsentSnapshot();return h('output',null,snapshot.promptDecision?.reason);};
  await domTest(async container=>{const root=createRoot(container);await act(async()=>root.render(h(api.ConsentProvider,{controller},h(Probe))));assert.equal(container.textContent,'withholding-floor');
   for(const mutate of [()=>{snapshot.promptDecision.allowsPrompt=true;},()=>{snapshot.promptDecision.requirementIds[0]='OTHER';},()=>snapshot.promptDecision.sourceIds.push('OTHER')])assert.throws(mutate,TypeError);
   assert.equal(controller.getSnapshot().promptDecision.allowsPrompt,false);await act(async()=>root.unmount());});controller.destroy();
 });
}

test('entry point contexts cannot let a compiled getter masquerade as the full compatibility controller',async()=>{
 const {controller}=await setup(consentProfiles[1][1]),LegacyProbe=()=>h('span',null,legacy.useConsentController().getConfig().site.id),CompiledProbe=()=>h('span',null,compiled.useConsentController().getConfig().site.id);
 assert.throws(()=>renderToString(h(compiled.ConsentProvider,{controller},h(LegacyProbe))),/same Notabenda React entry/);
 assert.throws(()=>renderToString(h(legacy.ConsentProvider,{controller},h(CompiledProbe))),/same Notabenda React entry/);controller.destroy();
});

test('both entries share controls ownership across separately typed providers and recover after unmount',async()=>{
 const {controller}=await setup(consentProfiles[0][1]);let errors=[];
 await domTest(async container=>{
  const root=createRoot(container,{onCaughtError:error=>errors.push(error)});
  class Catch extends (await import('react')).Component{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?h('p',null,'One controls surface is already mounted.'):this.props.children;}}
  const tree=h(legacy.ConsentProvider,{controller},h(legacy.ConsentControls),h(Catch,null,h(compiled.ConsentProvider,{controller},h(compiled.ConsentControls))));
  await act(async()=>root.render(tree));assert.equal(container.querySelectorAll('.nb-controls').length,1);assert.equal(errors.length,1);assert.match(errors[0].message,/one ConsentControls/);assert.match(container.textContent,/One controls surface/);
  await act(async()=>root.unmount());assert.equal(controller.getSnapshot().destroyed,false);
  const remount=createRoot(container);await act(async()=>remount.render(h(compiled.ConsentProvider,{controller},h(compiled.ConsentControls))));assert.equal(container.querySelectorAll('.nb-controls').length,1);await act(async()=>remount.unmount());
 });controller.destroy();
});

test('compiled React import is SSR safe and its actual graph excludes full config, document/form renderers and frameworks other than its React peer',async()=>{
 const script=`for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{get(){throw Error(k)},configurable:true});const api=await import('notabenda/react/consent');if(typeof api.ConsentProvider!=='function')process.exit(1);`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:new URL('../../../',import.meta.url),encoding:'utf8',timeout:10000});assert.equal(child.status,0,child.stderr);
 const result=await build({stdin:{contents:"export * from 'notabenda/react/consent';",resolveDir:new URL('../../../',import.meta.url).pathname},bundle:true,write:false,metafile:true,format:'esm',platform:'browser',external:['react']});
 const output=Object.values(result.metafile.outputs)[0],inputs=Object.keys(output.inputs);assert.ok(inputs.some(p=>p.endsWith('/react-consent-bindings.js')));assert.ok(inputs.every(p=>!/(?:\/config|\/consent|consent-evidence|react-documents|react-form-permission|form-permission|documents|rights-policy|content|setup|discovery)\.js$/u.test(p)));assert.deepEqual(output.imports.map(i=>i.path),['react']);
});
