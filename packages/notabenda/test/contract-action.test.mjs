// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-DE-CANCEL REQ-DE-WITHDRAWAL REQ-EU-WITHDRAWAL REQ-BR-CONTRACT REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createContractAction,mountContractAction,normalizeContractActionDefinition} from '@notabenda/core/contracts';
import {compileLegalDocuments,createContractActionDefinition} from '@notabenda/core/content';
import {recordLegalRelease,registerContractActionDefinition,contractActionOperationRef,recordContractDeclaration} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
const reject=(promise,code)=>assert.rejects(promise,error=>error.code===code);
async function setup(profile='eu-withdrawal'){
 const config=await fixture({reviewed:true}),build=compileLegalDocuments(config),storage=createSyntheticStorage([]),context={siteId:config.site.id,actionId:'contract-ending',operationId:'anonymous-admitted-session'},definition=createContractActionDefinition(build.artifact,{actionId:context.actionId,revision:'action-1',profile,reviewStatus:'reviewed'});
 await recordLegalRelease(storage,build.artifact);await registerContractActionDefinition(storage,definition,context);
 const initial={name:'Avery Linden',contract:'Sample contract 24017\nOne contract part',email:'avery@example.test',...(profile==='de-cancellation'?{cancellation:{kind:'extraordinary',reason:'A sample reason\nWith a second line',ending:''}}:{})},options={operationRef:await contractActionOperationRef(context),initial,submit:request=>recordContractDeclaration(storage,request,context)};
 return {definition,storage,context,initial,options};
}

test('withdrawal requires explicit review; cancellation supports a direct final action and neither performs mount-time work',async()=>{
 for(const profile of ['eu-withdrawal','de-withdrawal','br-withdrawal','de-cancellation']){const f=await setup(profile);let calls=0;const c=createContractAction(f.definition,{...f.options,submit:request=>{calls++;return f.options.submit(request);}});assert.equal(calls,0);assert.equal(c.getSnapshot().status,'editing');if(profile!=='de-cancellation'){await reject(c.submit(),'review-required');assert.equal(calls,0);c.review();}const a=c.submit(),b=c.submit();assert.equal(a,b);const receipt=await a;assert.equal(calls,1);assert.equal(c.getSnapshot().status,'received');assert.equal(receipt.stage,'received');assert.match(receipt.acknowledgement.text,/24017/);assert.equal(receipt.acknowledgement.status,'pending');c.destroy();}
});

test('uncertain capture seals the exact command; recovery retries the same nonce and cannot silently edit or duplicate a declaration',async()=>{
 const f=await setup(),sent=[];const c=createContractAction(f.definition,{...f.options,submit:async request=>{sent.push(structuredClone(request));const receipt=await f.options.submit(request);if(sent.length===1)throw Error('response lost');return receipt;}});c.review();await reject(c.submit(),'recording-uncertain');assert.equal(c.getSnapshot().status,'uncertain');assert.throws(()=>c.setFields({...f.initial,name:'Different'}));const recovery=c.getRecoveryRequest();assert.ok(recovery);const receipt=await c.submit();assert.deepEqual(sent[0],sent[1]);assert.equal((await f.storage.list({prefix:'notabenda/contracts/'+f.context.siteId+'/events/',limit:50})).size,1);assert.deepEqual(await c.submit(),receipt);
 const resumed=createContractAction(f.definition,{operationRef:f.options.operationRef,recovery,submit:f.options.submit});assert.equal(resumed.getSnapshot().status,'uncertain');assert.deepEqual(await resumed.submit(),receipt);const snapshot=c.getSnapshot();snapshot.receipt.acknowledgement.text='mutated';assert.notEqual(c.getSnapshot().receipt.acknowledgement.text,'mutated');c.destroy();resumed.destroy();
});

test('mismatched receipts and hung responses stay uncertain; late completion cannot replace a confirmed retry or destroyed context',async()=>{
 const f=await setup();let count=0,release,first;
 const c=createContractAction(f.definition,{...f.options,timeoutMs:100,submit:async request=>{const receipt=await f.options.submit(request);if(++count===1){first=receipt;return new Promise(resolve=>{release=resolve;});}return receipt;}});c.review();await reject(c.submit(),'recording-uncertain');const nonce=c.getRecoveryRequest().requestId,confirmed=await c.submit();assert.equal(confirmed.requestId,nonce);release(first);await Promise.resolve();assert.equal(c.getSnapshot().status,'received');
 const bad=createContractAction(f.definition,{...f.options,submit:async request=>({...await f.options.submit(request),id:'b'.repeat(64)})});bad.review();await reject(bad.submit(),'invalid-receipt');assert.equal(bad.getSnapshot().status,'uncertain');
 let transports=0;const stopped=createContractAction(f.definition,{...f.options,submit:async()=>{transports++;throw Error('unexpected');}});stopped.review();stopped.subscribe(state=>{if(state.status==='submitting')stopped.destroy();});await reject(stopped.submit(),'destroyed');assert.equal(transports,0);assert.equal(stopped.getSnapshot().status,'destroyed');c.destroy();bad.destroy();
});

test('native form exposes distinct actions, accessible fields and a savable exact received declaration without a privacy-acceptance checkbox',async()=>{
 for(const profile of ['eu-withdrawal','de-cancellation']){const f=await setup(profile),c=createContractAction(f.definition,f.options),dom=new JSDOM('<div id="root"></div>'),doc=dom.window.document,blobs=[];dom.window.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:example-'+blobs.length;};dom.window.URL.revokeObjectURL=()=>{};const mounted=mountContractAction(doc.getElementById('root'),{action:c}),button=doc.querySelector('button[type=submit]');assert.equal(doc.querySelectorAll('input[type=checkbox]').length,0);assert.equal(doc.querySelectorAll('form').length,1);for(const link of doc.querySelectorAll('.nb-contract-links a')){assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener');assert.match(link.textContent,/opens in a new tab|öffnet in einem neuen Tab/);}assert.equal(doc.querySelectorAll('label').length,profile==='de-cancellation'?6:3);assert.equal(button.textContent,profile==='de-cancellation'?f.definition.wording.confirmLabel:'Review details');
  if(profile!=='de-cancellation'){doc.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(c.getSnapshot().status,'reviewing');assert.equal(button.textContent,f.definition.wording.confirmLabel);assert.equal(doc.activeElement,button);}button.focus();const result=await c.submit();assert.equal(doc.querySelector('.nb-contract-copy').hidden,false);assert.equal(doc.querySelector('.nb-contract-copy pre').textContent,result.acknowledgement.text);assert.equal(doc.querySelector('.nb-contract-copy a').download,'declaration-'+result.id+'.txt');assert.equal(blobs.length,1);assert.equal(doc.activeElement,doc.querySelector('[role=status]'));assert.equal(doc.querySelector('form').hidden,true);mounted.destroy();c.destroy();dom.window.close();
 }
});

test('untrusted definition accessors, unknown fields and incompatible recovery are rejected without invoking getters or transport',async()=>{
 const f=await setup();let reads=0;const definition={...f.definition};Object.defineProperty(definition,'wording',{enumerable:true,get(){reads++;return f.definition.wording;}});assert.throws(()=>normalizeContractActionDefinition(definition));assert.equal(reads,0);assert.throws(()=>createContractAction({...f.definition,loginRequired:true},f.options));assert.throws(()=>createContractAction(f.definition,{...f.options,recovery:{}}));const c=createContractAction(f.definition,f.options);c.review();c.edit();c.setFields({...f.initial,email:'invalid'});assert.throws(()=>c.review());assert.equal(c.getSnapshot().status,'editing');c.destroy();
});

test('displayed-definition digests are verified before transport, so changed wording never commits the archived declaration',async()=>{
 const f=await setup('de-cancellation');let calls=0;const altered=structuredClone(f.definition);altered.wording.statement='Information only; this does not cancel a contract.';
 const c=createContractAction(altered,{...f.options,submit:request=>{calls++;return f.options.submit(request);}});await reject(c.submit(),'invalid-definition');assert.equal(calls,0);assert.equal(c.getSnapshot().status,'unavailable');assert.equal((await f.storage.list({prefix:'notabenda/contracts/'+f.context.siteId+'/events/',limit:10})).size,0);await reject(c.submit(),'unavailable');
 assert.throws(()=>c.setFields(f.initial));c.destroy();
});

test('editing-stage submit validates the visible fields and never sends an older draft after invalid or silent DOM changes',async()=>{
 for(const profile of ['de-cancellation','eu-withdrawal']){
  const f=await setup(profile),sent=[],c=createContractAction(f.definition,{...f.options,submit:request=>{sent.push(request);return f.options.submit(request);}}),dom=new JSDOM('<main></main>'),doc=dom.window.document,mounted=mountContractAction(doc.querySelector('main'),{action:c}),name=doc.querySelector('input[name=name]'),form=doc.querySelector('form');
  name.value='界'.repeat(101);name.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(name.checkValidity(),true,'native maxlength does not enforce the UTF-8 boundary');form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setImmediate(resolve));assert.equal(sent.length,0);assert.equal(c.getSnapshot().status,'editing');assert.equal(doc.activeElement,doc.querySelector('[role=status]'));
  name.value='Visible updated name';form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));if(profile!=='de-cancellation'){assert.equal(c.getSnapshot().status,'reviewing');assert.match(doc.querySelector('.nb-contract-review').textContent,/Visible updated name/);form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));}
  await c.submit();assert.equal(sent.length,1);assert.equal(sent[0].fields.name,'Visible updated name');mounted.destroy();c.destroy();dom.window.close();
 }
});
