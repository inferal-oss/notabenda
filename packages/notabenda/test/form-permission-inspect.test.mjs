// @requirements REQ-PRODUCT-FORM-PERMISSION-CONNECTION REQ-PRODUCT-PACK-CONNECTION
import {test} from 'node:test';
import {formPermissionExample} from '../../../examples/form-permissions/example.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {localizedPermissionFiles} from '../../../examples/localization/permission-build.mjs';
import assert from 'node:assert/strict';
import {build as bundle} from 'esbuild';
import {inspectFormPermissionConnection as inspect} from '@notabenda/core/form-permissions/inspect';
import {createFormPermission} from '../dist/form-permission.js';
import {createFormPermissionOffer} from '@notabenda/core/content';
import {recordLegalRelease,registerFormPermissionOffer,setActiveFormPermissionOffer,formPermissionStreamRef,getFormPermissionState,recordFormPermission} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {setup} from './collection-flow-fixture.mjs';
const at='2026-10-18T12:00:00.000Z',other='f'.repeat(64);
const rejected=fn=>assert.throws(fn,e=>e.message==='Supply a form permission controller and bounded optional expected offer/stream. No connection inspection was returned.');
async function fixture(extra={}){
 const f=await setup(),offer=f.flow.permissions[0],storage=createSyntheticStorage([]),context={siteId:offer.siteId,permissionId:offer.permissionId,streamId:'private-person-and-contact-generation',now:()=>new Date(at)};
 await recordLegalRelease(storage,f.build.artifact);await registerFormPermissionOffer(storage,offer,context);await setActiveFormPermissionOffer(storage,offer.offerId,context);
 const streamRef=await formPermissionStreamRef(context),commands=[];
 const controller=createFormPermission(offer,{streamRef,now:()=>new Date(at),read:()=>getFormPermissionState(storage,context),submit:async body=>{commands.push(body);return recordFormPermission(storage,body,context);},...extra});
 return {...f,offer,storage,context,streamRef,commands,controller};
}
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('read-only inspection compares actual controller without actions, UUIDs, subscriptions, network or storage changes',async()=>{
 const f=await fixture(),before=f.controller.getSnapshot(),saved=JSON.stringify([...await f.storage.list({prefix:'',limit:10000})]);let reads=0;
 const guarded={...f.controller,getOffer(){reads++;return f.controller.getOffer();},getSnapshot(){reads++;return f.controller.getSnapshot();}};
 for(const key of ['subscribe','setChecked','refresh','reconcile','retryPending','grant','withdraw','refuse','destroy'])guarded[key]=()=>{throw Error('must not call '+key);};
 const original=crypto.randomUUID;crypto.randomUUID=()=>{throw Error('must not create UUID');};
 try{
  const r=inspect(guarded,{expectedOffer:f.offer,expectedStreamRef:f.streamRef});assert.equal(reads,2);assert.equal(r.offer.comparison,'matched');assert.equal(r.stream.comparison,'matched');assert.deepEqual(r.controller,{status:'idle',checked:false,allowed:false});assert.deepEqual(r.observedHead,{status:'not-observed'});assert.deepEqual(r.historicalReceipt,{status:'none'});
  assert.equal(r.publication.status,'not-checked');assert.equal(r.backendSelection.status,'not-checked');assert.equal(r.behavior.status,'not-tested');assert.deepEqual(f.controller.getSnapshot(),before);assert.equal(f.commands.length,0);assert.equal(JSON.stringify([...await f.storage.list({prefix:'',limit:10000})]),saved);
  f.controller.setChecked(true);assert.equal(inspect(guarded).controller.checked,true);assert.equal(inspect(guarded).stream.comparison,'not-requested');
 }finally{crypto.randomUUID=original;f.controller.destroy();}
});
test('stream comparator is optional, validated, local and independent from expected offer',async()=>{
 const f=await fixture();try{
  assert.equal(f.controller.isForStream(f.streamRef),true);assert.equal(f.controller.isForStream(other),false);assert.throws(()=>f.controller.isForStream('private-invalid'));
  assert.equal(inspect(f.controller,{expectedOffer:f.offer,expectedStreamRef:other}).stream.comparison,'different');
  const {isForStream:_,...custom}=f.controller;assert.equal(inspect(custom,{expectedStreamRef:f.streamRef}).stream.comparison,'unavailable');
  assert.equal(inspect({...custom,isForStream:()=>true},{expectedStreamRef:other}).stream.comparison,'matched');
  for(const isForStream of [true,()=>1,()=>{throw Error('PRIVATE');}])rejected(()=>inspect({...custom,isForStream},{expectedStreamRef:f.streamRef}));
  inspect({...custom,isForStream(){throw Error('must not compare without expected stream');}});
  f.controller.destroy();assert.equal(inspect(f.controller,{expectedStreamRef:f.streamRef}).stream.comparison,'matched');
 }finally{f.controller.destroy();}
});
test('complete normalized offer comparison detects changed content under an unchanged ID without exporting it',async()=>{
 const f=await fixture();try{
  for(const [field,edit] of [['wording',o=>o.wording.statement='PRIVATE changed statement'],['facts',o=>o.facts.controller.name='PRIVATE controller'],['facts',o=>o.facts.scopeGuard.revision='PRIVATE assessment'],['document',o=>o.document.version='PRIVATE version'],['channel',o=>o.channel.label='PRIVATE channel'],['revision',o=>o.revision='PRIVATE revision'],['refusal',o=>o.refusal.label='PRIVATE refusal'],['withdrawalUrl',o=>o.withdrawalUrl='/private-withdraw'],['deliveryWindowSeconds',o=>o.deliveryWindowSeconds=90],['permissionId',o=>o.permissionId='other-permission'],['artifactId',o=>{o.artifactId=other;o.document.url=`/artifacts/${other}/privacy.html`; }],['offerId',o=>o.offerId=other]]){
   const expected=structuredClone(f.offer);edit(expected);const r=inspect(f.controller,{expectedOffer:expected});assert.equal(r.offer.comparison,'different',field);assert.ok(r.offer.differingFields.includes(field));assert.ok(!JSON.stringify(r).includes('PRIVATE'));
  }
 }finally{f.controller.destroy();}
});
test('an observed granted head is separate from controller-confirmed action receipts and active offer comparison',async()=>{
 const f=await fixture();try{
  await f.controller.refresh();f.controller.setChecked(true);const result=await f.controller.grant();
  const reader=createFormPermission(f.offer,{streamRef:f.streamRef,read:()=>getFormPermissionState(f.storage,f.context),submit:async()=>{throw Error('unused');}});
  try{await reader.refresh();const r=inspect(reader);assert.equal(r.observedHead.reason,'granted');assert.equal(r.controller.allowed,true);assert.equal(r.historicalReceipt.status,'none');
   const changed=structuredClone(f.offer);changed.offerId=other;const c=createFormPermission(changed,{streamRef:f.streamRef,read:()=>getFormPermissionState(f.storage,f.context),submit:async()=>{throw Error('unused');}});
   try{await c.refresh();const v=inspect(c,{expectedOffer:changed});assert.equal(v.offer.comparison,'matched');assert.equal(v.observedHead.activeOfferComparison,'different-offer');assert.equal(v.controller.allowed,true);}finally{c.destroy();}
  }finally{reader.destroy();}
  const json=JSON.stringify(inspect(f.controller));for(const secret of [f.streamRef,result.receipt.id,result.receipt.requestId,result.receipt.clientAt,f.offer.wording.statement,f.offer.revision,f.offer.document.title])assert.ok(!json.includes(secret),secret);
 }finally{f.controller.destroy();}
});
test('historical receipt survives refresh, read failure and a later pending withdrawal',async()=>{
 const f=await fixture(),gate=defer();let failRead=false,waitRead=false,waitWrite=false;
 const c=createFormPermission(f.offer,{streamRef:f.streamRef,now:()=>new Date(at),read:async()=>{if(waitRead)await gate.promise;if(failRead)throw Error('PRIVATE');return getFormPermissionState(f.storage,f.context);},submit:async body=>{if(waitWrite)await gate.promise;return recordFormPermission(f.storage,body,f.context);}});
 try{
  await c.refresh();c.setChecked(true);await c.grant();waitRead=true;const pending=c.refresh();await Promise.resolve();await Promise.resolve();assert.equal(inspect(c).controller.status,'loading');assert.equal(inspect(c).historicalReceipt.action,'grant');gate.resolve();await pending;
  failRead=true;await assert.rejects(c.refresh());assert.equal(inspect(c).controller.status,'error');assert.equal(inspect(c).historicalReceipt.action,'grant');assert.equal(inspect(c).observedHead.status,'not-observed');
  // A newer action by another controller changes the observed head, not this controller's receipt.
  await f.controller.refuse();failRead=false;await c.refresh();const after=inspect(c);assert.equal(after.observedHead.reason,'refused');assert.equal(after.historicalReceipt.action,'grant');
  waitWrite=true;const withdrawing=c.withdraw();assert.equal(inspect(c).historicalReceipt.action,'grant');await withdrawing;assert.equal(inspect(c).historicalReceipt.action,'withdraw');
 }finally{gate.resolve();c.destroy();f.controller.destroy();}
});
test('lost acknowledgement can leave a saved server record without a confirmed receipt; volatile recovery and destruction are observable',async()=>{
 const f=await fixture();let saved;
 const c=createFormPermission(f.offer,{streamRef:f.streamRef,now:()=>new Date(at),journal:{read:async()=>{throw Error('offline journal');},update:async()=>{throw Error('offline journal');}},read:()=>getFormPermissionState(f.storage,f.context),submit:async body=>{saved=await recordFormPermission(f.storage,body,f.context);throw Error('PRIVATE lost acknowledgement');}});
 try{await assert.rejects(c.refuse());const before=c.getSnapshot(),r=inspect(c);assert.equal(saved.state.reason,'refused');assert.equal(r.historicalReceipt.status,'none');assert.equal(r.controller.allowed,false);assert.equal(r.recovery.pending,0);assert.equal(r.recovery.refusalPending,true);assert.equal(r.recovery.status,'unavailable');assert.deepEqual(c.getSnapshot(),before);c.destroy();assert.equal(inspect(c).controller.status,'destroyed');assert.equal(inspect(c).recovery.refusalPending,true);}finally{c.destroy();f.controller.destroy();}
});
test('recovery confirms an earlier negative command after offer and artifact changes',async()=>{
 const f=await fixture();let lost;
 const old=createFormPermission(f.offer,{streamRef:f.streamRef,now:()=>new Date(at),read:()=>getFormPermissionState(f.storage,f.context),submit:async body=>{lost=body;await recordFormPermission(f.storage,body,f.context);throw Error('lost');}});
 try{
  await assert.rejects(old.withdraw());const next=createFormPermissionOffer(f.build.artifact,{...f.settings.decisions[1].permission,purposeId:f.offer.purposeId,revision:'next'});
  await registerFormPermissionOffer(f.storage,next,f.context);await setActiveFormPermissionOffer(f.storage,next.offerId,f.context);
  const result=await recordFormPermission(f.storage,lost,f.context),snapshot={checked:false,status:'recorded',allowed:false,current:result.state,receipt:result.receipt};
  const r=inspect({...f.controller,getOffer:()=>next,getSnapshot:()=>snapshot});assert.equal(r.historicalReceipt.status,'controller-confirmed');assert.equal(r.historicalReceipt.offerComparison,'different-offer');assert.equal(r.observedHead.activeOfferComparison,'mounted-offer');
  const older=structuredClone(snapshot);older.receipt.artifactId=other;assert.equal(inspect({...f.controller,getOffer:()=>next,getSnapshot:()=>older}).historicalReceipt.status,'controller-confirmed');
 }finally{old.destroy();f.controller.destroy();}
});
test('invalid plain data fails generically before executing options or returning rejected values',async()=>{
 const f=await fixture();let invoked=0;const c={...f.controller,getOffer(){invoked++;return f.offer;}};const accessor={};Object.defineProperty(accessor,'expectedOffer',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});
 try{
  for(const options of [accessor,{expectedStreamRef:'PRIVATE'},Object.create({expectedOffer:f.offer}),{extra:'PRIVATE'},{expectedOffer:{...f.offer,toJSON(){invoked++;}}},{expectedOffer:{...f.offer,wording:{...f.offer.wording,statement:'PRIVATE\n'}}},{expectedStreamRef:other.repeat(5000)}])rejected(()=>inspect(c,options));assert.equal(invoked,0);
  const initial=f.controller.getSnapshot();for(const edit of [s=>delete s.allowed,s=>s.error='PRIVATE',s=>s.extra='PRIVATE',s=>s.status='PRIVATE',s=>s.recovery={status:'ready',pending:2,withdrawalPending:false,blocked:false},s=>s.receipt={id:'PRIVATE'},s=>s.current={streamRef:'PRIVATE'}]){const snapshot=structuredClone(initial);edit(snapshot);rejected(()=>inspect({...f.controller,getSnapshot:()=>snapshot}));}
  const snap=structuredClone(initial);Object.defineProperty(snap,'receipt',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});rejected(()=>inspect({...f.controller,getSnapshot:()=>snap}));assert.equal(invoked,0);
  await f.controller.refuse();const valid=f.controller.getSnapshot();for(const edit of [s=>s.receipt.clientAt='2026-02-30T12:00:00.000Z',s=>s.current.event.streamRef=other,s=>s.receipt.requestId='PRIVATE',s=>s.current.revision=9007199254740992,s=>s.current.event.extra='PRIVATE',s=>s.receipt.streamRef=other]){const snapshot=structuredClone(valid);edit(snapshot);rejected(()=>inspect({...f.controller,getSnapshot:()=>snapshot}));}
 }finally{f.controller.destroy();}
});
test('separate browser/SSR bundle has no backend, authoring compiler or Node dependency',async()=>{
 const built=await bundle({stdin:{contents:"export {inspectFormPermissionConnection} from '@notabenda/core/form-permissions/inspect';",resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm',metafile:true});assert.ok(Object.keys(built.metafile.inputs).every(p=>!p.includes('notabenda-cf')&&!p.includes('content-compile')&&!p.includes('catalog-data')&&!p.includes('node:')));
 const separate=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64')),f=await fixture();try{assert.equal(separate.inspectFormPermissionConnection(f.controller,{expectedOffer:f.offer,expectedStreamRef:f.streamRef}).stream.comparison,'matched');}finally{f.controller.destroy();}
});

test('regional and localized offer fields are compared completely without exporting authored messages',async()=>{
 const f=await fixture(),regional=formPermissionExample(f.config).offer;
 const localizedFiles=await localizedPermissionFiles(localizedExampleConfig(f.config)),localized=JSON.parse(localizedFiles['localization/permission/offer.json']);
 for(const offer of [regional,localized]){
  const c=createFormPermission(offer,{streamRef:f.streamRef,allowPreview:true,read:async()=>{throw Error('unused');},submit:async()=>{throw Error('unused');}});
  try{
   const r=inspect(c,{expectedOffer:offer});assert.equal(r.offer.comparison,'matched');assert.equal(r.offer.localized,!!offer.localization);assert.equal(r.offer.marketingRequest,!!offer.marketingRequest);
   const expected=structuredClone(offer),field=offer.marketingRequest?'marketingRequest':'localization';if(offer.marketingRequest)expected.marketingRequest.goodsServices='PRIVATE products';else expected.localization.formPermission.error='PRIVATE translated error';
   const changed=inspect(c,{expectedOffer:expected});assert.deepEqual(changed.offer.differingFields,[field]);assert.doesNotMatch(JSON.stringify(changed),/PRIVATE/);
  }finally{c.destroy();}
 }
 f.controller.destroy();
});
