// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {JSDOM} from 'jsdom';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTermsAcceptance, mountTermsAcceptance, TermsAcceptanceError, normalizeTermsOffer } from 'notabenda';
import { compileLegalDocuments, createTermsOffer, canonicalJson, sha256 } from 'notabenda/content';
import { recordLegalRelease, registerTermsOffer, setActiveTermsOffer, recordTermsAcceptance, createTermsAcceptanceStore, createAdminWorker, createEvidenceLifecycle } from 'notabenda-cf';
import { createSyntheticStorage } from '../../notabenda-cf/examples/synthetic.mjs';
import { fixture } from './helpers.mjs';

// @requirements REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-ARTIFACTS
const wording = {scopeId:'signup',statement:'I agree to the supplied sample terms.',actionLabel:'Record sample agreement'};
const request = offer => ({schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),accepted:true});
const deferred = () => { let resolve; let reject; const promise = new Promise((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject}; };
async function setup() {
  const config = await fixture({reviewed:true}); // Synthetic review declaration, not a legal review.
  const build = compileLegalDocuments(config); const offer = createTermsOffer(build.artifact,wording);
  const storage = createSyntheticStorage([]); const context = {siteId:config.site.id,scopeId:'signup',subjectId:'subject-one',operationId:'operation-one',now:()=>new Date('2026-10-18T12:00:00.000Z')};
  await recordLegalRelease(storage,build.artifact); await registerTermsOffer(storage,offer,context);
  return {config,build,offer,storage,context};
}

test('offers bind exact versioned HTML, content and action wording deterministically; previews are explicit', async () => {
  const f = await setup(); const d = f.build.manifest.documents.find(d=>d.kind==='terms');
  assert.equal(f.offer.document.url,`/artifacts/${f.build.manifest.artifactId}/terms.html`);
  assert.equal(sha256(f.build.files[f.offer.document.url.slice(1)]),d.sha256);
  const pinned = f.build.files[f.offer.document.url.slice(1)];
  assert.match(pinned,/href="#nb-terms-section-/); assert.doesNotMatch(pinned,/href="\/terms#nb-terms-section-/);
  assert.equal(createTermsOffer(f.build.artifact,wording).offerId,f.offer.offerId);
  assert.notEqual(createTermsOffer(f.build.artifact,{...wording,statement:'A different explicit statement'}).offerId,f.offer.offerId);
  const draft = compileLegalDocuments(await fixture(),{mode:'preview'});
  assert.throws(()=>createTermsOffer(draft.artifact,wording),/reviewed production/);
  const preview = createTermsOffer(draft.artifact,wording,{mode:'preview'});
  assert.throws(()=>createTermsAcceptance(preview,{operationId:'one',submit:async()=>null}),/reviewed production/);
  assert.equal(normalizeTermsOffer(preview,{allowPreview:true}).mode,'preview');
  assert.throws(()=>normalizeTermsOffer({...f.offer,document:{...f.offer.document,url:'/terms'}}),/reference/);
});

test('frontend requires an explicit check, coalesces submits, and never reports success before a matching receipt', async () => {
  const f = await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); const gate = deferred(); let calls = 0;
  const c = createTermsAcceptance(f.offer,{operationId:f.context.operationId,submit:async body=>{calls++; await gate.promise; return recordTermsAcceptance(f.storage,body,f.context);}});
  assert.equal(c.getSnapshot().checked,false); await assert.rejects(c.submit(),error=>error.code==='not-checked'); assert.equal(calls,0);
  c.setChecked(true); const first = c.submit(); const second = c.submit(); assert.equal(first,second); await Promise.resolve(); assert.equal(calls,1); assert.equal(c.getSnapshot().status,'submitting');
  assert.throws(()=>c.setChecked(false),/cannot be edited/); gate.resolve(); const receipt = await first;
  assert.equal(c.getSnapshot().status,'recorded'); assert.equal(receipt.documentSha256,f.offer.document.sha256); assert.deepEqual(await c.submit(),receipt); assert.equal(calls,1);
  const copy = c.getSnapshot(); copy.receipt.id = 'tampered'; assert.equal(c.getSnapshot().receipt.id,receipt.id); c.destroy();
});

test('uncertain transport failure retries the same idempotency key and recovers the single stored acceptance', async () => {
  const f = await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); const requests = []; let lost = true;
  const c = createTermsAcceptance(f.offer,{operationId:f.context.operationId,submit:async body=>{requests.push(body); const receipt = await recordTermsAcceptance(f.storage,body,f.context); if(lost){lost=false;throw new Error('lost acknowledgment');} return receipt;}});
  c.setChecked(true); await assert.rejects(c.submit(),error=>error.code==='recording-failed'); assert.equal(c.getSnapshot().status,'error');
  const receipt = await c.submit(); assert.deepEqual(requests[0],requests[1]);
  const page = await createTermsAcceptanceStore(f.storage,f.context).list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50});
  assert.equal(page.records.length,1); assert.equal(page.records[0].id,receipt.id); c.destroy();
});

test('registration is not activation; activation changes reject stale new attempts while accepted retries retain their original version', async () => {
  const f = await setup(); const first = request(f.offer);
  await assert.rejects(recordTermsAcceptance(f.storage,first,f.context),error=>error.code==='stale-offer');
  await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); const saved = await recordTermsAcceptance(f.storage,first,f.context);
  f.config.documents.terms.version = 'next'; f.config.documents.terms.sections[0].paragraphs.push('A changed synthetic term.');
  const next = compileLegalDocuments(f.config); const nextOffer = createTermsOffer(next.artifact,wording);
  await recordLegalRelease(f.storage,next.artifact); await registerTermsOffer(f.storage,nextOffer,f.context); await setActiveTermsOffer(f.storage,nextOffer.offerId,f.context);
  await assert.rejects(recordTermsAcceptance(f.storage,request(f.offer),f.context),error=>error.code==='stale-offer');
  assert.deepEqual(await recordTermsAcceptance(f.storage,first,f.context),saved);
  await assert.rejects(recordTermsAcceptance(f.storage,{...first,offerId:nextOffer.offerId},f.context),error=>error.code==='idempotency-conflict');
  await setActiveTermsOffer(f.storage,null,f.context); await assert.rejects(recordTermsAcceptance(f.storage,request(nextOffer),f.context),error=>error.code==='stale-offer');
});

test('server binds site, subject, operation and intended scope, rejecting browser authority and malformed assertions', async () => {
  const f = await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); const body = request(f.offer);
  for (const altered of [{...body,subjectId:'victim'}, {...body,operationId:'order-other'}, {...body,accepted:false}, {...body,accepted:'true'}, {...body,requestId:'weak'}, {...body,recordedAt:'2000-01-01'}]) await assert.rejects(recordTermsAcceptance(f.storage,altered,f.context));
  await assert.rejects(recordTermsAcceptance(f.storage,body,{...f.context,scopeId:'different-action'}),error=>error.code==='scope-mismatch');
  await assert.rejects(recordTermsAcceptance(f.storage,body,{...f.context,siteId:'different-site'}));
  const saved = await recordTermsAcceptance(f.storage,body,f.context);
  await assert.rejects(recordTermsAcceptance(f.storage,body,{...f.context,operationId:'different-operation'}),error=>error.code==='idempotency-conflict');
  const other = await recordTermsAcceptance(f.storage,body,{...f.context,subjectId:'subject-two'}); assert.notEqual(saved.id,other.id);
});

test('offer tampering, mutable document links, missing archives and server preview bypasses cannot register or record', async () => {
  const f = await setup();
  await assert.rejects(registerTermsOffer(f.storage,{...f.offer,statement:'Hidden changed wording'},f.context));
  const wrong = {...f.offer,document:{...f.offer.document,sha256:'a'.repeat(64)}}; const {offerId:_,...descriptor}=wrong; wrong.offerId=sha256(canonicalJson(descriptor));
  await assert.rejects(registerTermsOffer(f.storage,wrong,f.context));
  await assert.rejects(registerTermsOffer(createSyntheticStorage([]),f.offer,f.context));
  const build = compileLegalDocuments(await fixture(),{mode:'preview'}); const preview = createTermsOffer(build.artifact,wording,{mode:'preview'}); await recordLegalRelease(f.storage,build.artifact);
  await assert.rejects(registerTermsOffer(f.storage,preview,f.context));
  const allowed = {...f.context,allowPreview:true}; await registerTermsOffer(f.storage,preview,allowed); await setActiveTermsOffer(f.storage,preview.offerId,allowed);
  await assert.rejects(recordTermsAcceptance(f.storage,request(preview),f.context));
  assert.equal((await recordTermsAcceptance(f.storage,request(preview),allowed)).documentVersion,preview.document.version);
});

test('concurrent duplicate writes are one event, activation races are serialized, and failed writes do not return a receipt', async () => {
  const f = await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); const body=request(f.offer);
  const replies = await Promise.all(Array.from({length:8},()=>recordTermsAcceptance(f.storage,body,f.context))); for(const receipt of replies) assert.deepEqual(receipt,replies[0]);
  const failed=request(f.offer); const original=f.storage.transaction;
  f.storage.transaction = callback=>original(tx=>callback({...tx,put:async()=>{throw new Error('write failed');}}));
  await assert.rejects(recordTermsAcceptance(f.storage,failed,f.context),/write failed/); f.storage.transaction=original;
  await setActiveTermsOffer(f.storage,null,f.context); await assert.rejects(recordTermsAcceptance(f.storage,request(f.offer),f.context),error=>error.code==='stale-offer');
  const page=await createTermsAcceptanceStore(f.storage,f.context).list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50}); assert.equal(page.records.length,1);
});

test('activation cannot change between the active-offer check and an acceptance commit', async () => {
  const f=await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); const checked=deferred(); const proceed=deferred(); const original=f.storage.transaction;
  f.storage.transaction=callback=>original(tx=>callback({...tx,get:async key=>{const value=await tx.get(key); if(key.endsWith('/active/signup')){checked.resolve();await proceed.promise;} return value;}}));
  const pending=recordTermsAcceptance(f.storage,request(f.offer),f.context); await checked.promise;
  const deactivate=setActiveTermsOffer(f.storage,null,f.context); proceed.resolve(); const saved=await pending; await deactivate; f.storage.transaction=original;
  assert.equal(saved.documentVersion,f.offer.document.version); await assert.rejects(recordTermsAcceptance(f.storage,request(f.offer),f.context),error=>error.code==='stale-offer');
});

test('frontend rejects mismatched receipts and stale targets, and destroy aborts pending transport without claiming withdrawal', async () => {
  const f=await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context);
  for(const field of ['id','offerId','requestId','operationId','artifactId','documentSha256','documentVersion','recordedAt']) {
    const c=createTermsAcceptance(f.offer,{operationId:f.context.operationId,submit:async body=>({...await recordTermsAcceptance(f.storage,body,f.context),[field]:'wrong'})}); c.setChecked(true); await assert.rejects(c.submit(),error=>error.code==='invalid-receipt'); assert.equal(c.getSnapshot().status,'error'); c.destroy();
  }
  const gate=deferred(); let signal; const c=createTermsAcceptance(f.offer,{operationId:f.context.operationId,submit:(_body,context)=>{signal=context.signal;return gate.promise;}}); c.setChecked(true); const pending=c.submit(); await Promise.resolve(); c.destroy(); assert.equal(signal.aborted,true); gate.resolve({}); await assert.rejects(pending,error=>error.code==='destroyed'); assert.equal(c.getSnapshot().status,'destroyed');
  const stale=createTermsAcceptance(f.offer,{operationId:f.context.operationId,submit:async()=>{throw new TermsAcceptanceError('stale-offer');}}); stale.setChecked(true); await assert.rejects(stale.submit()); assert.equal(stale.getSnapshot().status,'stale'); stale.destroy();
});

test('acceptance state resists caller mutation and observer reentrancy, with no preselected or optimistic completion', async () => {
  const f=await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); let calls=0; const c=createTermsAcceptance(f.offer,{operationId:f.context.operationId,submit:body=>{calls++;return recordTermsAcceptance(f.storage,body,f.context);}});
  c.getOffer().statement='mutated'; f.offer.statement='mutated'; c.getSnapshot().checked=true; await assert.rejects(c.submit(),error=>error.code==='not-checked');
  c.subscribe(state=>{if(state.status==='submitting') void c.submit().catch(()=>{});}); c.subscribe(()=>{throw new Error();}); c.setChecked(true); await c.submit(); assert.equal(calls,1); c.destroy();
});

test('accepted versions and exact action text remain inspectable through the authorized evidence backoffice', async () => {
  const f=await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context); const receipt=await recordTermsAcceptance(f.storage,request(f.offer),f.context);
  const worker=createAdminWorker({authorize:()=>({store:createTermsAcceptanceStore(f.storage,f.context)})});
  const detail=await worker.fetch(new Request(`https://example.test/admin/notabenda/record?id=${receipt.id}`),{}); assert.equal(detail.status,200); const html=await detail.text();
  assert.match(html,/I agree to the supplied sample terms/); assert.match(html,/Record sample agreement/); assert.match(html,/host-received-assertion/); assert.doesNotMatch(html,/<script/);
});

test('unavailable secure request IDs surface a visible error state without invoking transport', async () => {
  const f=await setup(); let calls=0; const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const c=createTermsAcceptance(f.offer,{operationId:'operation-one',submit:async()=>{calls++;}}); c.setChecked(true);
  try {
    Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});
    await assert.rejects(c.submit(),error=>error.code==='unavailable');
    assert.equal(c.getSnapshot().error,'unavailable'); assert.equal(c.getSnapshot().status,'error'); assert.equal(calls,0);
  } finally { Object.defineProperty(globalThis,'crypto',descriptor); c.destroy(); }
});

test('agreement inspection rejects cross-site data even under a custom shared prefix, and invalid server clocks cannot write', async () => {
  const f=await setup(); await setActiveTermsOffer(f.storage,f.offer.offerId,f.context);
  await assert.rejects(recordTermsAcceptance(f.storage,request(f.offer),{...f.context,now:()=>new Date('+010000-01-01T00:00:00Z')}));
  const body=request(f.offer); const saved=await recordTermsAcceptance(f.storage,body,f.context);
  const store=createTermsAcceptanceStore(f.storage,{siteId:'another-site',prefix:`notabenda/terms/${f.context.siteId}/`});
  await assert.rejects(store.get(saved.id),error=>error.code==='scope-mismatch');
  await assert.rejects(store.list({query:'no-match',kind:'',from:'',to:'',keyPrefix:'',limit:50}),error=>error.code==='scope-mismatch');
  const events=await createTermsAcceptanceStore(f.storage,f.context).list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50}); assert.equal(events.records.length,1);
});

// @requirements REQ-PRODUCT-TERMS-ACCEPTANCE
test('retired terms contexts close acceptance and cannot be edited or retried',async()=>{
 const f=await setup();await setActiveTermsOffer(f.storage,f.offer.offerId,f.context);const lifecycle=await createEvidenceLifecycle(f.storage,{family:'terms',siteId:f.context.siteId,subjectId:f.context.subjectId},{now:f.context.now});await lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:f.context.now().toISOString(),legalHold:false});let calls=0;
 const c=createTermsAcceptance(f.offer,{operationId:f.context.operationId,async submit(body){calls++;try{return await recordTermsAcceptance(f.storage,body,f.context);}catch(error){if(error.code==='context-retired')throw new TermsAcceptanceError('context-retired');throw error;}}});
 c.setChecked(true);await assert.rejects(c.submit(),e=>e.code==='context-retired');assert.equal(c.getSnapshot().status,'retired');await assert.rejects(c.submit(),e=>e.code==='context-retired');assert.equal(calls,1);assert.throws(()=>c.setChecked(true),/cannot be edited/);
 const dom=new JSDOM('<div></div>');const ui=mountTermsAcceptance(dom.window.document.querySelector('div'),{acceptance:c});assert.match(dom.window.document.querySelector('[role=status]').textContent,/context has closed/);assert.equal(dom.window.document.querySelector('button').disabled,true);assert.equal(dom.window.document.querySelector('input').disabled,true);ui.destroy();dom.window.close();c.destroy();
});
