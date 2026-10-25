import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConsentNotice,defaultConsentWording} from '@notabenda/core';
import { compileLegalDocuments, createConsentNotice, canonicalJson, sha256 } from '@notabenda/core/content';
import { recordLegalRelease, registerConsentNotice, setActiveConsentNotice, recordConsentChoice, getConsentHead, createConsentEvidenceStore, createAdminWorker } from '@notabenda/cloudflare';
import { createSyntheticStorage } from '../../notabenda-cf/examples/synthetic.mjs';
import { fixture } from './helpers.mjs';

// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-EU-CONSENT
const instant='2026-10-18T12:00:00.000Z';
const query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};
async function setup() {
  const config=await fixture({reviewed:true});
  config.services=[{id:'fictional-optional',name:'Fictional optional service',provider:'Fictional operator',location:'Local test',purposeIds:config.purposes.map(p=>p.id)}]; config.storage=[];
  config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
  const build=compileLegalDocuments(config); const notice=createConsentNotice(build.artifact,{scopeId:'cookie-choices'});
  const storage=createSyntheticStorage([]); let clock=instant;
  const context={siteId:config.site.id,scopeId:'cookie-choices',streamId:'opaque-host-reference-one',now:()=>new Date(clock)};
  await recordLegalRelease(storage,JSON.parse(canonicalJson(build.artifact)));
  await registerConsentNotice(storage,notice,context);
  return {config,build,notice,storage,context,setClock(value){clock=value;}};
}
const command=(notice,expectedRevision=0,grant=true,action=grant?'accept-all':'revoke-all')=>({schemaVersion:1,noticeId:notice.noticeId,requestId:crypto.randomUUID(),expectedRevision,action,choices:Object.fromEntries(Object.keys(notice.scopes).map(id=>[id,grant])),clientAt:instant});
async function activate(f){await setActiveConsentNotice(f.storage,f.notice.noticeId,f.context);}
async function nextNotice(f,modify) {
  const config=structuredClone(f.config); modify(config); const build=compileLegalDocuments(config); const notice=createConsentNotice(build.artifact,{scopeId:f.context.scopeId});
  await recordLegalRelease(f.storage,build.artifact); await registerConsentNotice(f.storage,notice,f.context); await setActiveConsentNotice(f.storage,notice.noticeId,f.context); return notice;
}

test('notice binds the actual material scope, default UI copy and pinned archives independently of canonical archive key order',async()=>{
  const f=await setup(); assert.deepEqual(f.notice.wording,defaultConsentWording(f.build.publicConfig));
  assert.equal(normalizeConsentNotice(f.notice).noticeId,f.notice.noticeId);
  const choices=new Map(); const local=createConsent(f.config,{storage:{getItem:key=>choices.get(key)??null,setItem:(key,value)=>choices.set(key,value),removeItem:key=>choices.delete(key)},now:()=>Date.parse(instant)});
  local.acceptAll(); const saved=JSON.parse([...choices.values()][0]);
  for(const [id,scope] of Object.entries(f.notice.scopes)) assert.equal(saved.choices[id].scope,scope); local.destroy();
  for(const kind of ['privacy','cookies']) assert.equal(sha256(f.build.files[f.notice.documents[kind].url.slice(1)]),f.notice.documents[kind].sha256);
  const cssOnly=compileLegalDocuments(f.config,{stylesheetUrl:'/different.css'}); const cosmetic=createConsentNotice(cssOnly.artifact,{scopeId:f.context.scopeId});
  assert.notEqual(cosmetic.noticeId,f.notice.noticeId); assert.equal(cosmetic.scopeDigest,f.notice.scopeDigest);
  assert.notEqual(createConsentNotice(f.build.artifact,{scopeId:f.context.scopeId,wording:{summary:'Another explicit notice.'}}).noticeId,f.notice.noticeId);
  assert.deepEqual(await registerConsentNotice(f.storage,f.notice,f.context),{noticeId:f.notice.noticeId,created:false});
});

test('registration is not activation; append and head update are atomic, immutable and idempotent under duplicate delivery',async()=>{
  const f=await setup(); const body=command(f.notice);
  assert.equal((await getConsentHead(f.storage,f.context)).revision,0);
  await assert.rejects(recordConsentChoice(f.storage,body,f.context),e=>e.code==='stale-notice'); await activate(f);
  const [a,b]=await Promise.all([recordConsentChoice(f.storage,body,f.context),recordConsentChoice(f.storage,structuredClone(body),f.context)]);
  assert.deepEqual(a,b); assert.equal(a.head.revision,1); assert.equal(a.receipt.recordedAt,instant);
  assert.equal((await createConsentEvidenceStore(f.storage,f.context).list(query)).records.length,1);
  const values=await f.storage.list({prefix:`notabenda/consent/${f.config.site.id}/`,limit:100});
  assert.equal([...values.values()].some(v=>JSON.stringify(v).includes(f.context.streamId)),false);
  await assert.rejects(recordConsentChoice(f.storage,{...body,clientAt:'2026-10-18T11:59:59.000Z'},f.context),e=>e.code==='idempotency-conflict');
});

test('concurrent grant snapshots use CAS; stale grants cannot resurrect permission after revoke-all',async()=>{
  const f=await setup(); await activate(f);
  const results=await Promise.allSettled([recordConsentChoice(f.storage,command(f.notice),f.context),recordConsentChoice(f.storage,command(f.notice),f.context)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1); assert.equal(results.find(r=>r.status==='rejected').reason.code,'revision-conflict');
  const grant=results.find(r=>r.status==='fulfilled').value;
  const denied=await recordConsentChoice(f.storage,command(f.notice,0,false),f.context); assert.equal(denied.head.revision,2);
  await assert.rejects(recordConsentChoice(f.storage,command(f.notice,1),f.context),e=>e.code==='revision-conflict');
  assert.equal((await getConsentHead(f.storage,f.context)).event.id,denied.receipt.id);
  assert.equal(grant.receipt.revision,1); // Historical receipt remains historical; it cannot advance the stream.
});

test('retry returns original receipt and current head after withdrawal or regrant, without reapplying the historical command',async()=>{
  const f=await setup(); await activate(f); const grant=command(f.notice); const first=await recordConsentChoice(f.storage,grant,f.context);
  const deny=command(f.notice,1,false); const second=await recordConsentChoice(f.storage,deny,f.context);
  const lateGrantAck=await recordConsentChoice(f.storage,grant,f.context);
  assert.deepEqual(lateGrantAck.receipt,first.receipt); assert.deepEqual(lateGrantAck.head,second.head);
  const third=await recordConsentChoice(f.storage,command(f.notice,2),f.context); const oldDenyAck=await recordConsentChoice(f.storage,deny,f.context);
  assert.deepEqual(oldDenyAck.receipt,second.receipt); assert.deepEqual(oldDenyAck.head,third.head); assert.equal(oldDenyAck.head.revision,3);
  await assert.rejects(recordConsentChoice(f.storage,{...deny,expectedRevision:3},f.context),e=>e.code==='idempotency-conflict');
});

test('a known older notice can explicitly revoke all newer purposes, including ones it never mentioned',async()=>{
  const f=await setup(); await activate(f);
  const next=await nextNotice(f,config=>{const purpose=structuredClone(config.purposes[0]); purpose.id='new-purpose'; purpose.name='New optional purpose'; config.purposes.push(purpose); config.services[0].purposeIds.push(purpose.id); config.consent.purposes.push({id:purpose.id,scope:'new'});});
  await recordConsentChoice(f.storage,command(next),f.context);
  await assert.rejects(recordConsentChoice(f.storage,command(f.notice,1),f.context),e=>e.code==='stale-notice');
  const request=command(f.notice,0,false); const denied=await recordConsentChoice(f.storage,request,f.context);
  assert.equal(denied.head.event.choices['new-purpose'],false); assert.equal(Object.values(denied.head.event.choices).some(Boolean),false);
  const record=await createConsentEvidenceStore(f.storage,f.context).get(denied.receipt.id);
  assert.equal(record.data.expectedRevision,0); assert.equal(record.data.supersededRevision,1);
  assert.equal(Object.hasOwn(record.data.submittedChoices,'new-purpose'),false); assert.equal(record.data.purposeChoices['new-purpose'],false);
  await setActiveConsentNotice(f.storage,null,f.context); await recordConsentChoice(f.storage,command(f.notice,0,false),f.context);
  await assert.rejects(recordConsentChoice(f.storage,command(f.notice,2,false,'save'),f.context),e=>e.code==='stale-notice');
});

test('time bounds reject delayed grants, preserve original expiry on retries and keep client time separate from receipt time',async()=>{
  const f=await setup(); await activate(f); const request=command(f.notice); f.setClock('2026-10-18T12:01:00.000Z');
  const saved=await recordConsentChoice(f.storage,request,f.context); assert.equal(saved.receipt.clientAt,instant); assert.notEqual(saved.receipt.recordedAt,instant);
  for(const expiry of Object.values(saved.receipt.expiresAt)) assert.equal(expiry,'2026-11-17T12:00:00.000Z');
  f.setClock('2026-10-18T12:10:00.000Z'); assert.deepEqual((await recordConsentChoice(f.storage,request,f.context)).receipt,saved.receipt);
  await assert.rejects(recordConsentChoice(f.storage,command(f.notice,1),f.context),e=>e.code==='expired-command');
  const lateDenial=await recordConsentChoice(f.storage,command(f.notice,0,false),f.context); assert.equal(Object.values(lateDenial.head.event.choices).some(Boolean),false);
  f.setClock('2026-10-18T11:00:00.000Z'); await assert.rejects(recordConsentChoice(f.storage,command(f.notice,2),f.context),e=>e.code==='invalid-request');
  f.setClock('invalid'); await assert.rejects(recordConsentChoice(f.storage,command(f.notice,2),f.context),e=>e.code==='invalid-clock');
  f.setClock('+010000-01-01T00:00:00.000Z'); await assert.rejects(recordConsentChoice(f.storage,command(f.notice,2),f.context),e=>e.code==='invalid-clock');
});

test('strict body, trusted scope, stream binding and independent server preview guard prevent authority injection',async()=>{
  const f=await setup(); await activate(f); const body=command(f.notice); const id=Object.keys(body.choices)[0];
  for(const altered of [{...body,subjectId:'someone'},{...body,streamId:'victim'},{...body,recordedAt:instant},{...body,requestId:'weak'},{...body,expectedRevision:-1},{...body,choices:{}},{...body,choices:{[id]:1}},{...body,clientAt:'2026-10-18'},{...body,action:'revoke-all'}]) await assert.rejects(recordConsentChoice(f.storage,altered,f.context));
  await assert.rejects(recordConsentChoice(f.storage,body,{...f.context,scopeId:'other'}),e=>e.code==='scope-mismatch');
  const a=await recordConsentChoice(f.storage,body,f.context); const b=await recordConsentChoice(f.storage,body,{...f.context,streamId:'separate-stream'});
  assert.notEqual(a.receipt.id,b.receipt.id); assert.notEqual(a.receipt.streamRef,b.receipt.streamRef);
  assert.equal((await getConsentHead(f.storage,{...f.context,scopeId:'other'})).revision,0);
  const preview=compileLegalDocuments(f.config,{mode:'preview'}); const n=createConsentNotice(preview.artifact,{scopeId:f.context.scopeId},{mode:'preview'});
  await recordLegalRelease(f.storage,preview.artifact); await assert.rejects(registerConsentNotice(f.storage,n,f.context),e=>e.code==='invalid-notice');
  await registerConsentNotice(f.storage,n,{...f.context,allowPreview:true}); await setActiveConsentNotice(f.storage,n.noticeId,{...f.context,allowPreview:true});
  await assert.rejects(recordConsentChoice(f.storage,command(n,1),f.context),e=>e.code==='invalid-notice');
  const allowed={...f.context,allowPreview:true}; const saved=await recordConsentChoice(f.storage,command(n,1),allowed);
  await assert.rejects(recordConsentChoice(f.storage,{...body,requestId:saved.receipt.requestId,noticeId:n.noticeId,expectedRevision:1},f.context));
  await assert.rejects(getConsentHead(f.storage,f.context),e=>e.code==='invalid-notice');
  await assert.rejects(recordConsentChoice(f.storage,body,f.context),e=>e.code==='invalid-notice');
  assert.equal((await getConsentHead(f.storage,allowed)).event.noticeId,n.noticeId);
});

test('enum values never coerce arrays or objects, and build-time UTF-8 bounds match the backend contract',async()=>{
  const f=await setup(); await activate(f);
  await assert.rejects(recordConsentChoice(f.storage,{...command(f.notice),action:['save']},f.context),e=>e.code==='invalid-request');
  for(const mode of [['production'],{},1]) assert.throws(()=>normalizeConsentNotice({...f.notice,mode},{allowPreview:true}));
  for(const reviewStatus of [['reviewed'],{},1]) assert.throws(()=>normalizeConsentNotice({...f.notice,documents:{...f.notice.documents,cookies:{...f.notice.documents.cookies,reviewStatus}}},{allowPreview:true}));
  assert.throws(()=>createConsentNotice(f.build.artifact,{scopeId:f.context.scopeId,wording:{summary:'é'.repeat(1001)}}));
  const n=createConsentNotice(f.build.artifact,{scopeId:f.context.scopeId,wording:{summary:'é'.repeat(1000)}});
  await registerConsentNotice(f.storage,n,f.context);
});

test('notice tampering, missing release and falsely claimed purpose/lifetime metadata cannot register even with a recalculated notice ID',async()=>{
  const f=await setup(); const rehash=n=>{const {noticeId:_,...descriptor}=n; return {...n,noticeId:sha256(canonicalJson(descriptor))};};
  const wrong=structuredClone(f.notice); wrong.policy.grantLifetimeDays=730;
  await assert.rejects(registerConsentNotice(f.storage,rehash(wrong),f.context));
  const poisoned=structuredClone(f.notice); const id=Object.keys(poisoned.scopes)[0]; const scope=JSON.parse(poisoned.scopes[id]); scope.purpose.name='Undisclosed'; poisoned.scopes[id]=JSON.stringify(scope); poisoned.scopeDigest=sha256(canonicalJson(poisoned.scopes));
  await assert.rejects(registerConsentNotice(f.storage,rehash(poisoned),f.context));
  await assert.rejects(registerConsentNotice(createSyntheticStorage([]),f.notice,f.context));
  assert.throws(()=>normalizeConsentNotice({...f.notice,documents:{...f.notice.documents,cookies:{...f.notice.documents.cookies,url:'/cookies'}}}));
  assert.throws(()=>createConsentNotice(f.build.artifact,{scopeId:f.context.scopeId,wording:{summary:'x'.repeat(40000)}}));
});

test('failed transactions leave neither an event nor an advanced head; retry can safely record once',async()=>{
  const f=await setup(); await activate(f); const body=command(f.notice); let writes=0;
  const broken={...f.storage,transaction:callback=>f.storage.transaction(tx=>callback({...tx,async put(key,value){await tx.put(key,value); if(++writes===2) throw new Error('simulated failure');}}))};
  await assert.rejects(recordConsentChoice(broken,body,f.context),/simulated failure/);
  assert.equal((await getConsentHead(f.storage,f.context)).revision,0); assert.equal((await createConsentEvidenceStore(f.storage,f.context).list(query)).records.length,0);
  assert.equal((await recordConsentChoice(f.storage,body,f.context)).head.revision,1);
});

test('scoped evidence search includes pinned wording and purpose names without exposing notices, heads, raw stream references or executable text',async()=>{
  const f=await setup(); const n=createConsentNotice(f.build.artifact,{scopeId:f.context.scopeId,wording:{summary:'Allow a fictional <img src=x onerror=alert(1)> purpose?'}});
  await registerConsentNotice(f.storage,n,f.context); await setActiveConsentNotice(f.storage,n.noticeId,f.context); const saved=await recordConsentChoice(f.storage,command(n),f.context);
  const store=createConsentEvidenceStore(f.storage,f.context); const page=await store.list({...query,query:'fictional onerror'}); assert.equal(page.records.length,1);
  assert.equal(await store.get(`heads/${saved.receipt.streamRef}`),undefined); assert.equal(await store.get(`notices/${n.noticeId}`),undefined);
  const worker=createAdminWorker({basePath:'/admin',authorize:()=>({store,scopeLabel:'Fictional cookie records'})}); const response=await worker.fetch(new Request(`https://example.test/admin/record?id=${saved.receipt.id}`),{}); const html=await response.text();
  assert.equal(response.status,200); assert.doesNotMatch(html,/<img src=x/); assert.match(html,/&lt;img/);
  assert.match(html,/Purpose disclosed/); assert.match(html,/datetime="2026-11-17T12:00:00.000Z"/); assert.match(html,/UTC/);
  assert.equal(html.includes(f.context.streamId),false);
  const key=`notabenda/consent/${f.config.site.id}/events/${saved.receipt.id}`; const raw=await f.storage.get(key); await f.storage.transaction(tx=>tx.put(key,{...raw,siteId:'another-site'}));
  await assert.rejects(store.list({...query,query:'no-match'}),e=>e.code==='scope-mismatch');
});
