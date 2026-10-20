// @requirements REQ-PRODUCT-TERMS-CONNECTION REQ-PRODUCT-PACK-CONNECTION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {inspectTermsConnection} from '@notabenda/core/terms/inspect';
import {createTermsAcceptance,TermsAcceptanceError} from '@notabenda/core/terms';
import {compileLegalDocuments,createTermsOffer} from '@notabenda/core/content';
import {recordTermsAcceptance} from '@notabenda/cloudflare';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {fixture} from './helpers.mjs';
import {termsFixture} from './terms-adapter-fixture.mjs';
const key='6c9d1537-e1b1-4841-b886-c20f4bddb860';
const rejected=fn=>assert.throws(fn,e=>e.message==='Supply a terms controller and bounded optional expected offer/operation. No connection inspection was returned.');

test('inspection reads an actual controller without subscriptions, actions, submission, UUID creation or writes',async()=>{
 const f=await termsFixture();let reads=0;const observed={...f.controller,getOffer(){reads++;return f.controller.getOffer();},getSnapshot(){reads++;return f.controller.getSnapshot();},subscribe(){throw Error('must not subscribe');},setChecked(){throw Error('must not check');},submit(){throw Error('must not submit');},destroy(){throw Error('must not destroy');}};
 try{const before=f.controller.getSnapshot(),storage=JSON.stringify([...await f.storage.list({prefix:'',limit:10000})]);
  const r=inspectTermsConnection(observed,{expectedOffer:f.offer,expectedOperationId:'operation-one'});
  assert.equal(reads,2);assert.equal(r.offer.comparison,'matched');assert.deepEqual(r.offer.differingFields,[]);assert.equal(r.operation.comparison,'matched');assert.equal(r.operation.basis,'controller-reported-local-comparison');assert.deepEqual(r.controller,{status:'idle',checked:false,requestKeyPresent:false});assert.equal(r.receipt.status,'none');assert.deepEqual(f.controller.getSnapshot(),before);assert.equal(f.commands.length,0);assert.equal(JSON.stringify([...await f.storage.list({prefix:'',limit:10000})]),storage);
  assert.equal(r.publication.status,'not-checked');assert.equal(r.backendSelection.status,'not-checked');assert.equal(r.behavior.status,'not-tested');assert.match(r.limits.join(' '),/not an authenticated report/);
  assert.equal(inspectTermsConnection(observed).operation.comparison,'not-requested');assert.equal(inspectTermsConnection(observed).offer.comparison,'not-requested');
  f.controller.setChecked(true);assert.equal(inspectTermsConnection(observed).controller.checked,true);assert.equal(f.commands.length,0);
 }finally{f.controller.destroy();}
});

test('operation checks remain local, optional and independent of offer matches',async()=>{
 const f=await termsFixture({operationId:'private-host-operation'});
 try{assert.equal(f.controller.isForOperation('private-host-operation'),true);assert.equal(f.controller.isForOperation('other'),false);assert.throws(()=>f.controller.isForOperation('\nprivate-host-operation'));
  assert.equal(inspectTermsConnection(f.controller,{expectedOffer:f.offer,expectedOperationId:'different'}).operation.comparison,'different');
  const {isForOperation:_,...custom}=f.controller;
  assert.equal(inspectTermsConnection(custom,{expectedOperationId:'private-host-operation'}).operation.comparison,'unavailable');
  // A custom comparator is a host assertion, not factory provenance or server verification.
  assert.equal(inspectTermsConnection({...custom,isForOperation:()=>true},{expectedOperationId:'different'}).operation.comparison,'matched');
  for(const isForOperation of [true,()=>1,()=>{throw Error('PRIVATE');}])rejected(()=>inspectTermsConnection({...custom,isForOperation},{expectedOperationId:'private-host-operation'}));
 }finally{f.controller.destroy();}
});

test('normalized offer comparison catches altered wording and document metadata even under a stale offer ID',async()=>{
 const f=await termsFixture();try{
  for(const [field,edit] of [['statement',o=>o.statement='A different private agreement statement.'],['actionLabel',o=>o.actionLabel='Different action'],['document',o=>o.document.title='Different title'],['document',o=>o.document.version='next-version'],['document',o=>o.document.contentSha256='a'.repeat(64)],['scopeId',o=>o.scopeId='other-scope'],['siteId',o=>o.siteId='other-site'],['mode',o=>o.mode='preview']]){
   const expected=structuredClone(f.offer);edit(expected);const r=inspectTermsConnection(f.controller,{expectedOffer:expected});assert.equal(r.offer.comparison,'different');assert.ok(r.offer.differingFields.includes(field),field);
  }
  const draft=structuredClone(f.offer);draft.mode='preview';draft.document.reviewStatus='draft';const c=createTermsAcceptance(draft,{operationId:'preview',allowPreview:true,submit:async()=>{throw Error('unused');}});
  try{const r=inspectTermsConnection(c,{expectedOffer:draft});assert.equal(r.offer.comparison,'matched');assert.equal(r.offer.reviewStatus,'draft');assert.equal(r.offer.mode,'preview');}finally{c.destroy();}
 }finally{f.controller.destroy();}
});

test('localized offers compare the entire selected dictionary without exporting its messages',async()=>{
 const c=localizedExampleConfig(await fixture({reviewed:true}));c.localization.reviewStatus='reviewed';for(const doc of Object.values(c.documents))doc.review.status='reviewed';
 const offer=createTermsOffer(compileLegalDocuments(c).artifact,{scopeId:'signup',statement:'Concordo com esta versão dos termos.',actionLabel:'Registrar concordância'}),controller=createTermsAcceptance(offer,{operationId:'localized-operation',submit:async()=>{throw Error('unused');}});
 try{assert.equal(inspectTermsConnection(controller,{expectedOffer:offer}).offer.localized,true);for(const edit of [o=>o.localization.terms.error='Uma mensagem diferente.',o=>o.localization.revision='next-copy',o=>o.localization.direction='rtl']){const expected=structuredClone(offer);edit(expected);const r=inspectTermsConnection(controller,{expectedOffer:expected});assert.deepEqual(r.offer.differingFields,['localization']);assert.doesNotMatch(JSON.stringify(r),/Uma mensagem|Concordo|Registrar concordância/);}}
 finally{controller.destroy();}
});

test('submitting, confirmed and destroyed states retain their distinct meaning and disclose no private receipt',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve),f=await termsFixture({operationId:'private-operation-not-exported',afterRecord:()=>gate});
 try{f.controller.setChecked(true);const pending=f.controller.submit(),starting=inspectTermsConnection(f.controller);assert.equal(starting.controller.status,'submitting');assert.equal(starting.controller.requestKeyPresent,true);assert.equal(starting.receipt.status,'none');await Promise.resolve();release();const receipt=await pending;
  for(const status of ['recorded','destroyed']){if(status==='destroyed')f.controller.destroy();const r=inspectTermsConnection(f.controller,{expectedOffer:f.offer,expectedOperationId:f.context.operationId}),json=JSON.stringify(r);assert.equal(r.controller.status,status);assert.equal(r.receipt.status,'controller-confirmed');assert.equal(r.operation.comparison,'matched');for(const privateValue of [receipt.id,receipt.requestId,receipt.operationId,f.offer.statement,f.offer.actionLabel,f.offer.document.title])assert.ok(!json.includes(privateValue),privateValue);assert.equal(r.backendSelection.status,'not-checked');assert.equal(r.behavior.status,'not-tested');}
  assert.equal(f.commands.length,1);
 }finally{release();f.controller.destroy();}
});

test('an idle recovery key and a failed acknowledgement do not prove whether a record exists',async()=>{
 const f=await termsFixture({afterRecord:()=>{throw Error('private response lost');}});
 const recovery=createTermsAcceptance(f.offer,{operationId:f.context.operationId,requestId:key,submit:async()=>{throw Error('unused');}});
 try{assert.deepEqual(inspectTermsConnection(recovery).controller,{status:'idle',checked:false,requestKeyPresent:true});assert.equal(inspectTermsConnection(recovery).receipt.status,'none');
  f.controller.setChecked(true);await assert.rejects(f.controller.submit());const state=f.controller.getSnapshot(),r=inspectTermsConnection(f.controller);assert.equal(r.controller.status,'error');assert.equal(r.controller.error,'recording-failed');assert.equal(r.receipt.status,'none');assert.equal(f.commands.length,1);
  // Server did save the original attempt: inspection must not retry or infer its absence.
  const saved=await recordTermsAcceptance(f.storage,f.commands[0],f.context);assert.equal(saved.requestId,state.requestId);assert.deepEqual(f.controller.getSnapshot(),state);assert.equal(f.commands.length,1);assert.doesNotMatch(JSON.stringify(r),/private response lost/);
 }finally{f.controller.destroy();recovery.destroy();}
});

for(const [code,status] of [['stale-offer','stale'],['context-retired','retired'],['invalid-receipt','error']])test('inspection observes '+code+' without reactivating or retrying the attempt',async()=>{
 const f=await termsFixture(),c=createTermsAcceptance(f.offer,{operationId:'private-operation',submit:async()=>{throw new TermsAcceptanceError(code);}});
 try{c.setChecked(true);await assert.rejects(c.submit());const before=c.getSnapshot(),r=inspectTermsConnection(c);assert.equal(r.controller.status,status);assert.equal(r.controller.error,code);assert.equal(r.receipt.status,'none');assert.deepEqual(c.getSnapshot(),before);c.destroy();assert.equal(inspectTermsConnection(c).controller.status,'destroyed');}finally{c.destroy();f.controller.destroy();}
});

test('inspection does not generate request keys even when UUID creation is unavailable',async()=>{
 const f=await termsFixture(),original=crypto.randomUUID;let generated=0;
 crypto.randomUUID=()=>{generated++;throw Error('PRIVATE UUID FAILURE');};
 try{inspectTermsConnection(f.controller);assert.equal(generated,0);f.controller.setChecked(true);inspectTermsConnection(f.controller);assert.equal(generated,0);await assert.rejects(f.controller.submit(),e=>e.code==='unavailable');assert.equal(generated,1);const r=inspectTermsConnection(f.controller);assert.equal(generated,1);assert.deepEqual(r.controller,{status:'error',checked:true,requestKeyPresent:false,error:'unavailable'});assert.equal(r.receipt.status,'none');assert.doesNotMatch(JSON.stringify(r),/PRIVATE UUID/);}
 finally{crypto.randomUUID=original;f.controller.destroy();}
});

test('malformed options fail before reading the host and rejected values never enter errors or results',async()=>{
 const f=await termsFixture();let invoked=0;const controller={...f.controller,getOffer(){invoked++;return f.offer;}};
 try{const accessor={};Object.defineProperty(accessor,'expectedOffer',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});const cycle={};cycle.self=cycle;
  for(const opts of [accessor,cycle,{extra:'PRIVATE'},Object.create({expectedOffer:f.offer}),{expectedOffer:{...f.offer,statement:'PRIVATE\n'}},{expectedOperationId:'PRIVATE\n'},{expectedOperationId:'x'.repeat(201)},{expectedOperationId:'😀'.repeat(51)},{toJSON(){invoked++;return {};}}])rejected(()=>inspectTermsConnection(controller,opts));
  assert.equal(invoked,0);
  for(const state of [{checked:false,status:'recorded'},{checked:false,status:'idle',requestId:'PRIVATE'},{checked:true,status:'error',error:'PRIVATE'},{checked:false,status:'idle',receipt:{schemaVersion:1,id:'PRIVATE'}},{checked:false,status:'idle',extra:'PRIVATE'}])rejected(()=>inspectTermsConnection({...f.controller,getSnapshot:()=>state}));
  const snap={checked:false,status:'idle'};Object.defineProperty(snap,'receipt',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});rejected(()=>inspectTermsConnection({...f.controller,getSnapshot:()=>snap}));assert.equal(invoked,0);
  rejected(()=>inspectTermsConnection({...f.controller,getOffer(){throw Error('PRIVATE');}}));
 }finally{f.controller.destroy();}
});

test('separately bundled browser and SSR entries compare without a shared module registry or Node dependencies',async()=>{
 const bundled=await build({stdin:{contents:"export {inspectTermsConnection} from '@notabenda/core/terms/inspect';",resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm',metafile:true});
 assert.ok(Object.keys(bundled.metafile.inputs).every(p=>!p.includes('node:')&&!p.includes('notabenda-cf')&&!p.includes('catalog-data')&&!p.includes('content-compile')));
 const separate=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64')),f=await termsFixture();
 try{assert.equal(separate.inspectTermsConnection(f.controller,{expectedOffer:f.offer,expectedOperationId:f.context.operationId}).operation.comparison,'matched');}finally{f.controller.destroy();}
});
