import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-US-CA-CHOICES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createProcessingChoices,mountProcessingChoices,normalizeProcessingNotice,ProcessingChoicesError} from '@notabenda/core';
import {compileLegalDocuments,createProcessingNotice,sha256,canonicalJson} from '@notabenda/core/content';
import {recordLegalRelease,registerProcessingNotice,recordProcessingRestriction,getProcessingHead,createProcessingRestrictionStore,createAdminWorker,createEvidenceLifecycle} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';

const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const memory=()=>{const values=new Map();return {values,storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};};
async function setup(){
  const config=await fixture({reviewed:true});config.purposes=[config.purposes[0]];const purpose=config.purposes[0].id;
  config.services=[{id:'advertising',name:'Fictional advertising',provider:'Fictional provider',location:'Synthetic test only',purposeIds:[purpose],processingActivities:['sale']},{id:'tools',name:'Local tools',provider:'Fictional operator',location:'Local test',purposeIds:[purpose],processingActivities:[]}];config.storage=[];
  config.consent={purposes:[{id:purpose,scope:'one'}],services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
  const build=compileLegalDocuments(config);const settings={scopeId:'privacy-choices',activities:['sale','sharing','targeted-advertising'],wording:{title:'Your privacy choices',description:'A fictional opt-out action independent of cookies.',actionLabel:'Opt out of sale, sharing and targeted advertising'}};
  const notice=createProcessingNotice(build.artifact,settings),storage=createSyntheticStorage([]),context={siteId:config.site.id,scopeId:notice.scopeId,streamId:'opaque-synthetic-subject-reference',provenance:'explicit-opt-out',now:()=>new Date('2026-10-18T12:00:00.000Z')};
  await recordLegalRelease(storage,build.artifact);await registerProcessingNotice(storage,notice,context);const initial=await getProcessingHead(storage,context);const local=memory();
  const options={streamRef:initial.streamRef,read:()=>getProcessingHead(storage,context),submit:body=>recordProcessingRestriction(storage,body,context)};
  return {config,purpose,build,settings,notice,storage,context,initial,local,options};
}
const command=(f,activities=['sale'])=>({schemaVersion:1,noticeId:f.notice.noticeId,requestId:crypto.randomUUID(),activities});

test('notices bind exact privacy archives, classification and explicit preview policy; requests cannot inject host authority',async()=>{
  const f=await setup();assert.equal(normalizeProcessingNotice(f.notice).document.sha256,f.notice.document.sha256);
  const changed=structuredClone(f.notice);changed.wording.title='Changed';await assert.rejects(registerProcessingNotice(f.storage,changed,f.context));
  const forged=structuredClone(f.notice);forged.document.sha256='1'.repeat(64);const {noticeId,...descriptor}=forged;forged.noticeId=sha256(canonicalJson(descriptor));await assert.rejects(registerProcessingNotice(f.storage,forged,f.context));
  for(const extra of [{streamId:'victim'},{siteId:'other'},{provenance:'gpc-header'},{recordedAt:'2026-10-18'}])await assert.rejects(recordProcessingRestriction(f.storage,{...command(f),...extra},f.context),e=>e.code==='invalid-request');
  for(const activities of [[],['profiling'],['sale','sale'],[true],['sale',null]])await assert.rejects(recordProcessingRestriction(f.storage,command(f,activities),f.context));
  const preview=compileLegalDocuments(f.config,{mode:'preview'}),n=createProcessingNotice(preview.artifact,f.settings,{mode:'preview'});await recordLegalRelease(f.storage,preview.artifact);await assert.rejects(registerProcessingNotice(f.storage,n,f.context));await registerProcessingNotice(f.storage,n,{...f.context,allowPreview:true});await assert.rejects(recordProcessingRestriction(f.storage,{...command(f),noticeId:n.noticeId},f.context));
});

test('concurrent append unions restrictions, immutable retries return current head and provenance cannot be rewritten',async()=>{
  const f=await setup(),a=command(f),b=command(f,['sharing']);const [one,duplicate]=await Promise.all([recordProcessingRestriction(f.storage,a,f.context),recordProcessingRestriction(f.storage,structuredClone(a),f.context)]);assert.deepEqual(one,duplicate);assert.equal(one.head.revision,1);
  const second=await recordProcessingRestriction(f.storage,b,{...f.context,provenance:'gpc-header'});assert.deepEqual(second.head.event.restrictions,['sale','sharing']);assert.equal(second.receipt.provenance,'gpc-header');
  const retry=await recordProcessingRestriction(f.storage,a,f.context);assert.deepEqual(retry.receipt,one.receipt);assert.equal(retry.head.revision,2);assert.deepEqual(retry.head.event.restrictions,['sale','sharing']);
  await assert.rejects(recordProcessingRestriction(f.storage,a,{...f.context,provenance:'browser-report'}),e=>e.code==='idempotency-conflict');
  assert.equal((await getProcessingHead(f.storage,{...f.context,streamId:'another-opaque-context'})).revision,0);
  const values=await f.storage.list({prefix:`notabenda/processing/${f.config.site.id}/`,limit:100});assert.equal([...values.values()].some(v=>JSON.stringify(v).includes(f.context.streamId)),false);
});

test('failed transaction commits neither an event nor a head',async()=>{
  const f=await setup();let writes=0;const broken={get:key=>f.storage.get(key),list:q=>f.storage.list(q),transaction:work=>f.storage.transaction(tx=>work({get:key=>tx.get(key),async put(key,value){if(++writes===2)throw new Error('Synthetic write failure');await tx.put(key,value);}}))};
  await assert.rejects(recordProcessingRestriction(broken,command(f),f.context));assert.equal((await getProcessingHead(f.storage,f.context)).revision,0);assert.equal((await f.storage.list({prefix:`notabenda/processing/${f.config.site.id}/events/`,limit:100})).size,0);
});

test('lost acknowledgment survives reload with the original nonce and one durable event',async()=>{
  const f=await setup();const sent=[];let lose=true;const options={...f.options,async submit(body){sent.push(structuredClone(body));const result=await f.options.submit(body);if(lose){lose=false;throw new Error('Acknowledgment lost');}return result;}};
  let p=createProcessingChoices(f.notice,options,{storage:f.local.storage});await p.settled();assert.equal(p.getSnapshot().status,'ready');const done=p.optOut();assert.deepEqual(p.getSnapshot().blockedActivities,['sale','sharing','targeted-advertising']);await done;assert.equal(p.getSnapshot().status,'error');assert.equal(p.getSnapshot().pending,1);p.destroy();
  p=createProcessingChoices(f.notice,options,{storage:f.local.storage});await p.settled();assert.equal(p.getSnapshot().status,'recorded');assert.equal(p.getSnapshot().pending,0);assert.deepEqual(sent[0],sent[1]);assert.equal((await getProcessingHead(f.storage,f.context)).revision,1);p.destroy();
});

test('an older acknowledgment cannot replace newer retained restrictions, including after notice replacement',async()=>{
  const f=await setup();const entered=deferred(),release=deferred();const options={...f.options,async submit(body){const result=await f.options.submit(body);entered.resolve();await release.promise;return result;}};
  const saleNotice=createProcessingNotice(f.build.artifact,{...f.settings,activities:['sale']});await registerProcessingNotice(f.storage,saleNotice,f.context);
  const p=createProcessingChoices(saleNotice,options,{storage:f.local.storage});await p.settled();const pending=p.optOut();await entered.promise;
  await recordProcessingRestriction(f.storage,command(f,['sharing']),{...f.context,provenance:'trusted-application'});await p.refresh();assert.equal(p.getSnapshot().revision,2);release.resolve();await pending;assert.deepEqual(p.getSnapshot().restrictedActivities,['sale','sharing']);assert.equal(p.getSnapshot().revision,2);p.destroy();
  const next=createProcessingChoices(saleNotice,f.options,{storage:f.local.storage});await next.settled();assert.deepEqual(next.getSnapshot().restrictedActivities,['sale','sharing']);assert.equal(next.getSnapshot().status,'recorded');next.destroy();
});

test('pending or malformed reads never establish an unrestricted context; local intent does not expire with delivery failure',async()=>{
  const f=await setup();const gate=deferred();const p=createProcessingChoices(f.notice,{...f.options,read:()=>gate.promise},{storage:f.local.storage});assert.deepEqual(p.getSnapshot().blockedActivities,['sale','sharing','targeted-advertising']);gate.resolve({revision:0});await p.settled();assert.equal(p.getSnapshot().status,'error');assert.equal(p.getSnapshot().blockedActivities.length,3);p.destroy();
  const unavailable={getItem(){throw new Error('Blocked storage');},setItem(){throw new Error('Blocked storage');},removeItem(){throw new Error('Blocked storage');}};
  const q=createProcessingChoices(f.notice,{...f.options,submit:async()=>{throw new Error('Backend unavailable');}},{storage:unavailable});await q.settled();await q.optOut();assert.equal(q.getSnapshot().status,'error');assert.equal(q.getSnapshot().blockedActivities.length,3);q.destroy();
});

test('a stale read becomes an actionable error and retry recovers without shrinking restrictions',async()=>{
  const f=await setup();await recordProcessingRestriction(f.storage,command(f),f.context);let stale=false;
  const p=createProcessingChoices(f.notice,{...f.options,read:()=>stale?Promise.resolve(f.initial):f.options.read()},{storage:f.local.storage});await p.settled();
  stale=true;await p.refresh();assert.equal(p.getSnapshot().status,'error');assert.equal(p.getSnapshot().blockedActivities.length,3);
  stale=false;await p.retry();assert.equal(p.getSnapshot().status,'recorded');assert.deepEqual(p.getSnapshot().restrictedActivities,['sale']);p.destroy();
});

test('surviving intent without its request requires a fresh deliberate action under the current notice',async()=>{
  const f=await setup();let attempts=0;let p=createProcessingChoices(f.notice,{...f.options,submit:async()=>{throw new Error('Offline');}},{storage:f.local.storage});await p.settled();await p.optOut();const key=p.storageKey;p.destroy();f.local.values.delete(key);
  p=createProcessingChoices(f.notice,{...f.options,submit:body=>{attempts++;return f.options.submit(body);}},{storage:f.local.storage});await p.settled();assert.equal(p.getSnapshot().needsConfirmation,true);assert.equal(p.getSnapshot().blockedActivities.length,3);assert.equal(attempts,0);
  const dom=new JSDOM('<div></div>');const ui=mountProcessingChoices(dom.window.document.querySelector('div'),p);assert.match(dom.window.document.querySelector('[role=status]').textContent,/Use the opt-out action/);assert.equal(dom.window.document.querySelectorAll('button')[1].hidden,true);
  dom.window.document.querySelector('button').click();await p.settled();assert.equal(attempts,1);assert.equal(p.getSnapshot().status,'recorded');ui.destroy();dom.window.close();p.destroy();
});

test('an acknowledgment cannot substitute another policy artifact; destruction aborts hanging delivery',async()=>{
  const f=await setup();const p=createProcessingChoices(f.notice,{...f.options,async submit(body){const result=await f.options.submit(body);result.receipt.artifactId='f'.repeat(64);result.head.event.artifactId='f'.repeat(64);return result;}},{storage:f.local.storage});await p.settled();await p.optOut();assert.equal(p.getSnapshot().status,'error');assert.equal(p.getSnapshot().pending,1);p.destroy();
  const other=await setup();let signal;const gate=deferred();const q=createProcessingChoices(other.notice,{...other.options,submit:(_body,context)=>{signal=context.signal;return gate.promise;}},{storage:other.local.storage});await q.settled();const writing=q.optOut();await Promise.resolve();q.destroy();await writing;assert.equal(signal.aborted,true);assert.equal(q.getSnapshot().status,'destroyed');assert.equal(q.getSnapshot().blockedActivities.length,3);gate.resolve({});
});

test('one current-notice action recovers surviving intent together with newly listed activities',async()=>{
  const f=await setup();const old=createProcessingNotice(f.build.artifact,{...f.settings,activities:['sale']});await registerProcessingNotice(f.storage,old,f.context);
  let p=createProcessingChoices(old,{...f.options,submit:async()=>{throw new Error('Offline');}},{storage:f.local.storage});await p.settled();await p.optOut();const key=p.storageKey;p.destroy();f.local.values.delete(key);
  const sent=[];p=createProcessingChoices(f.notice,{...f.options,submit:body=>{sent.push(structuredClone(body));return f.options.submit(body);}},{storage:f.local.storage});await p.settled();await p.optOut();assert.equal(sent.length,1);assert.deepEqual(sent[0].activities,['sale','sharing','targeted-advertising']);assert.equal(p.getSnapshot().needsConfirmation,false);assert.equal(p.getSnapshot().status,'recorded');p.destroy();
});

test('equal revisions require the same event while harmless JSON field ordering is normalized',async()=>{
  const f=await setup();const reorder=value=>Object.fromEntries(Object.entries(value).reverse());
  const p=createProcessingChoices(f.notice,{...f.options,async read(){const h=await f.options.read();if(h.event)h.event=reorder(h.event);return reorder(h);},async submit(body){const result=await f.options.submit(body);result.head.event.requestId=crypto.randomUUID();return result;}},{storage:f.local.storage});await p.settled();await p.optOut();assert.equal(p.getSnapshot().status,'error');assert.equal(p.getSnapshot().pending,1);p.destroy();
  const q=createProcessingChoices(f.notice,{...f.options,async read(){const h=await f.options.read();if(h.event)h.event=reorder(h.event);return reorder(h);}},{storage:memory().storage});await q.settled();assert.equal(q.getSnapshot().status,'recorded');await q.refresh();assert.equal(q.getSnapshot().status,'recorded');q.destroy();
});

test('core service eligibility binds the notice and pauses covered work independently of cookie acceptance',async()=>{
  const f=await setup(),gate=deferred(),p=createProcessingChoices(f.notice,{...f.options,read:()=>gate.promise},{storage:f.local.storage}),cookies=memory();const c=createConsent(f.config,{storage:cookies.storage,schedule:()=>()=>{}},{processingChoices:p});let starts=0,stops=0;
  c.registerService('advertising',{purposes:[f.purpose],start(){starts++;return ()=>{stops++;};}});c.acceptAll();await c.settled();assert.equal(c.getSnapshot().permissions[f.purpose],true);assert.equal(starts,0);gate.resolve(f.initial);await p.settled();await c.settled();assert.equal(starts,1);
  const writing=p.optOut();assert.equal(c.getSnapshot().servicePermissions.advertising,false);await writing;await c.settled();assert.equal(stops,1);c.acceptAll();await c.settled();assert.equal(starts,1);assert.equal(c.getSnapshot().permissions[f.purpose],true);
  const wrong=structuredClone(f.config);wrong.services[0].processingActivities=[];assert.throws(()=>createConsent(wrong,{storage:cookies.storage},{processingChoices:p}),/Bind processing/);c.destroy();p.destroy();
});

test('queued starts and effectful service checks resample another tab restriction before its storage event',async()=>{
  const f=await setup(),p=createProcessingChoices(f.notice,f.options,{storage:f.local.storage}),other=createProcessingChoices(f.notice,{...f.options,submit:()=>new Promise(()=>{})},{storage:f.local.storage});await p.settled();await other.settled();
  const cookies=memory(),c=createConsent(f.config,{storage:cookies.storage,schedule:()=>()=>{}},{processingChoices:p});let starts=0;
  c.registerService('advertising',{purposes:[f.purpose],start(){starts++;return ()=>{};}});c.acceptAll();
  // Another tab persists before the queued start, without a storage-event callback in this fixture.
  void other.optOut();await c.settled();assert.equal(starts,0);assert.equal(c.isServiceAllowed('advertising'),false);assert.equal(c.getSnapshot().permissions[f.purpose],true);
  assert.deepEqual(p.getSnapshot().restrictedActivities,['sale','sharing','targeted-advertising']);c.destroy();p.destroy();other.destroy();await other.settled();
});

test('the UI distinguishes pending recording from confirmation, and event search excludes internal ledger keys',async()=>{
  const f=await setup(),gate=deferred();const p=createProcessingChoices(f.notice,{...f.options,async submit(body){await gate.promise;return f.options.submit(body);}},{storage:f.local.storage});await p.settled();
  const dom=new JSDOM('<div></div>');const ui=mountProcessingChoices(dom.window.document.querySelector('div'),p);const button=dom.window.document.querySelector('button');button.click();assert.match(dom.window.document.querySelector('[role=status]').textContent,/Waiting for the record/);gate.resolve();await p.settled();assert.match(dom.window.document.querySelector('[role=status]').textContent,/opt-out is recorded/);assert.equal(button.disabled,true);
  const store=createProcessingRestrictionStore(f.storage,{siteId:f.config.site.id});const page=await store.list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50});assert.equal(page.records.length,1);assert.equal(page.records[0].data.kind,'processing-restriction');assert.equal(page.records[0].data.notice.wording.title,f.notice.wording.title);
  const denied=await createAdminWorker({authorize:()=>null}).fetch(new Request('https://example.test/'));assert.equal(denied.status,403);ui.destroy();p.destroy();dom.window.close();
});

// @requirements REQ-PRODUCT-PROCESSING-CHOICES
test('retirement on read or write is terminal, keeps all processing blocked and preserves local restrictions',async()=>{
 for(const via of ['read','write']){
  const f=await setup();let reads=0,writes=0;const map=async work=>{try{return await work();}catch(error){if(error.code==='context-retired')throw new ProcessingChoicesError('context-retired');throw error;}};
  const p=createProcessingChoices(f.notice,{...f.options,read:()=>{reads++;return map(f.options.read);},submit:body=>{writes++;return map(()=>f.options.submit(body));}},{storage:f.local.storage});await p.settled();
  if(via==='read')await p.optOut();const lifecycle=await createEvidenceLifecycle(f.storage,{family:'processing',siteId:f.context.siteId,scopeId:f.context.scopeId,streamId:f.context.streamId},{now:f.context.now});await lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:f.context.now().toISOString(),legalHold:false});
  if(via==='read')await p.refresh();else await p.optOut();assert.equal(p.getSnapshot().status,'retired');assert.equal(p.getSnapshot().blockedActivities.length,3);assert.equal(p.getSnapshot().needsConfirmation,false);const before=[reads,writes];await p.retry();await p.refresh();await p.optOut();await p.settled();assert.deepEqual([reads,writes],before);assert.equal(p.getSnapshot().restrictedActivities.length,3);assert.equal(p.getSnapshot().status,'retired');
  const dom=new JSDOM('<div></div>');const ui=mountProcessingChoices(dom.window.document.querySelector('div'),p);assert.match(dom.window.document.querySelector('[role=status]').textContent,/context has closed/);assert.equal(dom.window.document.querySelector('button').disabled,true);assert.equal(dom.window.document.querySelectorAll('button')[1].hidden,true);ui.destroy();dom.window.close();p.destroy();
 }
});
test('a successful in-flight processing write cannot reopen a context retired by a concurrent read',async()=>{
 const f=await setup(),entered=deferred(),release=deferred();let retiring=false;
 const p=createProcessingChoices(f.notice,{...f.options,read:()=>{if(retiring)throw new ProcessingChoicesError('context-retired');return f.options.read();},async submit(body){const result=await f.options.submit(body);entered.resolve();await release.promise;return result;}},{storage:f.local.storage});await p.settled();const writing=p.optOut();await entered.promise;retiring=true;await p.refresh();assert.equal(p.getSnapshot().status,'retired');release.resolve();await writing;assert.equal(p.getSnapshot().status,'retired');assert.equal(p.getSnapshot().blockedActivities.length,3);p.destroy();
});
