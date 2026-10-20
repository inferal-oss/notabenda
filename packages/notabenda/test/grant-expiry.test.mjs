// @requirements REQ-IE-CONSENT-DURATION REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CONFIG
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConsent,validateSiteConfig,toPublicConfig,normalizeConsentNotice} from '@notabenda/core';
import {compileLegalDocuments,createConsentNotice,compileConsentRuntimeConfig,canonicalJson,sha256} from '@notabenda/core/content';
import {createConsentRuntime} from '@notabenda/core/consent';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {grantExpiresAt,sixCalendarMonthsAfter,receiptGrantExpiresAt} from '../dist/grant-expiry-policy.js';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
const cap={profile:'ie-dpc-six-month-default',version:1},DAY=86400000;
async function setup(at='2026-08-31T12:34:56.789Z'){
 const config=await fixture({reviewed:true}),p=config.purposes[0];config.purposes=[p,{...structuredClone(p),id:'second',name:'Second purpose'}];config.storage=[];config.services=config.purposes.map(p=>({id:p.id+'-service',name:p.name,provider:'Example operator',location:'This browser',purposeIds:[p.id]}));
 config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:365,refusalLifetimeDays:365,dismissalMinutes:0,grantExpiryPolicy:cap};
 let now=Date.parse(at);const values=new Map(),timers=new Set(),env={now:()=>now,storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule(fn,delay){const t={fn,delay};timers.add(t);return()=>timers.delete(t);}};
 return {config,env,values,key:'notabenda:choices:v1:'+config.site.id,setTime(at){now=typeof at==='number'?at:Date.parse(at);for(const t of [...timers])t.fn();},choice(id){return JSON.parse(values.get(this.key)).choices[id];}};
}
const noticeFor=config=>{const build=compileLegalDocuments(config);return {build,notice:createConsentNotice(build.artifact,{scopeId:'cookie-choices'})};};
const body=(n,at,grant=true)=>({schemaVersion:1,noticeId:n.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:grant?'accept-all':'revoke-all',choices:Object.fromEntries(Object.keys(n.scopes).map(id=>[id,grant])),clientAt:at});

test('calendar cap preserves UTC time, clamps month ends, handles leap years and never equates six months with 180 days',()=>{
 for(const [at,until] of [['2026-08-31T12:34:56.789Z','2027-02-28T12:34:56.789Z'],['2023-08-31T12:34:56.789Z','2024-02-29T12:34:56.789Z'],['2024-02-29T12:34:56.789Z','2024-08-29T12:34:56.789Z'],['2026-03-01T00:00:00.000Z','2026-09-01T00:00:00.000Z']]){
  assert.equal(new Date(sixCalendarMonthsAfter(Date.parse(at))).toISOString(),until);assert.equal(new Date(grantExpiresAt(Date.parse(at),365,cap)).toISOString(),until);
 }
 const at=Date.parse('2026-03-01T00:00:00.000Z');assert.equal(grantExpiresAt(at,365,cap)-at,184*DAY);assert.equal(grantExpiresAt(at,30,cap)-at,30*DAY);assert.equal(grantExpiresAt(at,365)-at,365*DAY);
});

test('full and compiled inputs require the exact explicit policy; locale and jurisdiction never activate it',async()=>{
 const f=await setup();for(const bad of [null,[],{...cap,version:2},{...cap,profile:'IE'},{...cap,justification:'longer'}, {profile:['ie-dpc-six-month-default'],version:1}]){
  const c=structuredClone(f.config);c.consent.grantExpiryPolicy=bad;const result=validateSiteConfig(c);assert.equal(result.valid,false);assert.ok(result.diagnostics.some(d=>d.requirementIds.includes('REQ-IE-CONSENT-DURATION')));
  const compiled=compileConsentRuntimeConfig(f.config,{mode:'preview',evidence:'local'});compiled.inventory.consent.grantExpiryPolicy=bad;assert.throws(()=>createConsentRuntime(compiled,f.env));
 }
 assert.deepEqual(toPublicConfig(f.config).consent.grantExpiryPolicy,cap);delete f.config.consent.grantExpiryPolicy;f.config.jurisdictions=['IE'];f.config.site.locale='en-IE';const c=createConsent(f.config,f.env);c.acceptAll();assert.equal(f.choice(f.config.purposes[0].id).until-f.env.now(),365*DAY);c.destroy();
});

for(const [profile,create] of consentProfiles){
 test(`${profile}: active services stop exactly at the calendar cap and reload cannot restore them`,async()=>{
  const f=await setup(),c=create(f.config,f.env),id=f.config.purposes[0].id;let starts=0,stops=0;c.registerService(id+'-service',{purposes:[id],start(){starts++;return()=>stops++;}});c.acceptAll();await c.settled();assert.equal(starts,1);const until=f.choice(id).until;assert.equal(new Date(until).toISOString(),'2027-02-28T12:34:56.789Z');f.setTime(until-1);assert.equal(c.isAllowed(id),true);f.setTime(until);await c.settled();assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes[id],'expired');assert.equal(stops,1);c.destroy();const reload=create(f.config,f.env);assert.equal(reload.isAllowed(id),false);reload.destroy();
 });
 test(`${profile}: shorter grants and refusal lifetimes remain independent of the cap`,async()=>{
  const f=await setup();f.config.consent.grantLifetimeDays=30;const c=create(f.config,f.env),id=f.config.purposes[0].id;c.choose({[id]:true,second:false});assert.equal(f.choice(id).until-f.env.now(),30*DAY);assert.equal(f.choice('second').until-f.env.now(),365*DAY);f.setTime(f.env.now()+31*DAY);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes.second,'denied');c.destroy();
 });
 test(`${profile}: adding and removing the policy discards positive authority without erasing negative intent or resurrecting an old grant`,async()=>{
  const f=await setup(),id=f.config.purposes[0].id,ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;let c=create(ordinary,f.env);c.choose({[id]:true,second:false});c.destroy();c=create(f.config,f.env);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes.second,'denied');c.destroy();c=create(ordinary,f.env);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes.second,'denied');c.destroy();
  c=create(f.config,f.env);c.choose({[id]:true,second:false});c.destroy();c=create(ordinary,f.env);assert.equal(c.isAllowed(id),false);c.destroy();c=create(f.config,f.env);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes.second,'denied');c.destroy();
 });
 test(`${profile}: expired grants stay off while a later Italian withholding floor suppresses prompting`,async()=>{
  const f=await setup();f.config.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'initial'};const c=create(f.config,f.env),id=f.config.purposes[0].id;c.acceptAll();f.setTime(f.env.now()+DAY);c.dismiss();f.setTime('2027-02-28T12:34:56.789Z');assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().shouldPrompt,false);assert.equal(c.getSnapshot().promptDecision.reason,'withholding-floor');c.openPreferences();assert.equal(c.getSnapshot().preferencesOpen,true);c.destroy();
 });
}

test('notice and CF archive verification bind the exact policy and changed positive scopes',async()=>{
 const f=await setup(),{build,notice}=noticeFor(f.config);assert.deepEqual(notice.policy.grantExpiryPolicy,cap);const ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;assert.notEqual(notice.scopeDigest,noticeFor(ordinary).notice.scopeDigest);
 const storage=createSyntheticStorage([]),context={siteId:f.config.site.id,scopeId:'cookie-choices',streamId:'example-stream'};await recordLegalRelease(storage,JSON.parse(canonicalJson(build.artifact)));await registerConsentNotice(storage,notice,context);
 for(const policy of [null,{...cap,version:2},undefined]){const n=structuredClone(notice);if(policy===undefined)delete n.policy.grantExpiryPolicy;else n.policy.grantExpiryPolicy=policy;const {noticeId:_,...descriptor}=n;n.noticeId=sha256(canonicalJson(descriptor));if(policy!==undefined)assert.throws(()=>normalizeConsentNotice(n));await assert.rejects(registerConsentNotice(storage,n,context));}
 assert.throws(()=>createConsent(ordinary,f.env,{evidence:{notice,streamRef:'a'.repeat(64),read:async()=>null,write:async()=>null}}));
});

test('CF uses the earlier client/server anchor and immutable retries retain the original cap after another notice is activated',async()=>{
 const f=await setup(),{build,notice}=noticeFor(f.config),storage=createSyntheticStorage([]);let server='2026-08-31T12:35:56.789Z';const context={siteId:f.config.site.id,scopeId:'cookie-choices',streamId:'example-stream',now:()=>new Date(server)};await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);
 const request=body(notice,'2026-08-31T12:34:56.789Z'),first=await recordConsentChoice(storage,request,context);for(const expiry of Object.values(first.receipt.expiresAt))assert.equal(expiry,'2027-02-28T12:34:56.789Z');
 const ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;const next=noticeFor(ordinary);await recordLegalRelease(storage,next.build.artifact);await registerConsentNotice(storage,next.notice,context);await setActiveConsentNotice(storage,next.notice.noticeId,context);server='2026-08-31T12:36:56.789Z';assert.deepEqual((await recordConsentChoice(storage,request,context)).receipt,first.receipt);
 const early={...context,streamId:'earlier-server',now:()=>new Date('2026-08-31T12:34:46.789Z')};await setActiveConsentNotice(storage,notice.noticeId,context);const skew=await recordConsentChoice(storage,body(notice,'2026-08-31T12:34:56.789Z'),early);for(const expiry of Object.values(skew.receipt.expiresAt))assert.equal(expiry,'2027-02-28T12:34:46.789Z');
});

for(const [profile,create] of consentProfiles)test(`${profile}: required evidence survives reload and rejects a day-only acknowledgement with the archived cap`,async()=>{
 const f=await setup(),{build,notice}=noticeFor(f.config),storage=createSyntheticStorage([]),context={siteId:f.config.site.id,scopeId:'cookie-choices',streamId:'example-stream',now:()=>new Date(f.env.now())};await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);const head=await getConsentHead(storage,context),evidence={notice,streamRef:head.streamRef,read:()=>getConsentHead(storage,context),write:request=>recordConsentChoice(storage,request,context)};
 const id=f.config.purposes[0].id;let c=create(f.config,f.env,{evidence});await c.refreshEvidence();c.acceptAll();await c.settled();assert.equal(c.isAllowed(id),true);assert.deepEqual(JSON.parse(f.values.get(f.key)).evidence.release.grantExpiryPolicy,cap);c.destroy();c=create(f.config,f.env,{evidence});await c.refreshEvidence();assert.equal(c.isAllowed(id),true);c.destroy();
 const bad=await setup();const badEvidence={...evidence,write:async request=>{const result=await recordConsentChoice(storage,request,context);for(const key of Object.keys(result.receipt.expiresAt))result.receipt.expiresAt[key]=new Date(Date.parse(request.clientAt)+365*DAY).toISOString();return result;}};const d=create(bad.config,bad.env,{evidence:badEvidence});await d.refreshEvidence();d.acceptAll();await d.settled();assert.equal(d.isAllowed(id),false);d.destroy();
});

// @requirements REQ-PRODUCT-SETUP
// Exercise the real noninteractive wizard boundary, not only the recommendation helper.
test('Irish setup advice is shared by CLI/admin and never enables or extends grants',async()=>{
 const {createSetupPlan,readSetupAnswers}=await import('@notabenda/core/setup');const {mountSetup}=await import('@notabenda/core/setup/ui');const {JSDOM}=await import('jsdom');const {mkdtemp,writeFile,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const f=await setup(),ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;const answers={schemaVersion:1,markets:['IE','FR','IT','ES'],answers:{'optional-storage':{choice:'yes',justification:'PRIVATE_DURATION_ASSESSMENT'}}};const plan=createSetupPlan(answers,{config:ordinary});assert.equal(plan.report.questionnaireVersion,'5');assert.equal(plan.config.consent.grantExpiryPolicy,undefined);assert.equal(plan.config.consent.grantLifetimeDays,365);assert.equal(plan.report.recommendations.find(r=>r.id==='irish-grant-expiry').status,'review');assert.ok(plan.report.recommendations.find(r=>r.id==='market-IE').requirementIds.includes('REQ-IE-CONSENT-DURATION'));assert.doesNotMatch(JSON.stringify(plan.config),/PRIVATE_DURATION/);
 for(const version of ['1','2','3','4'])assert.deepEqual(readSetupAnswers({schemaVersion:1,questionnaireVersion:version,kind:'private-setup-report',answers}),plan.report.answers);
 const dom=new JSDOM('<div id="setup"></div>');dom.window.URL.createObjectURL=()=> 'blob:example';dom.window.URL.revokeObjectURL=()=>{};const host=dom.window.document.querySelector('#setup'),ui=mountSetup(host,{config:ordinary,answers,documentationBase:'/guide'});host.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));assert.deepEqual(ui.getPlan().report.recommendations,plan.report.recommendations);assert.ok(host.querySelector('a[href="/guide/requirements#req-ie-consent-duration"]'));ui.destroy();dom.window.close();
 const dir=await mkdtemp(join(tmpdir(),'notabenda-grant-expiry-'));try{await writeFile(join(dir,'answers.json'),JSON.stringify(answers));await writeFile(join(dir,'config.json'),JSON.stringify(ordinary));const cli=new URL('../dist/cli.js',import.meta.url);const result=spawnSync(process.execPath,[cli.pathname,'wizard','--answers','answers.json','--config','config.json','--out-dir','review'],{cwd:dir,encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/PRIVATE_DURATION/);const report=JSON.parse(await readFile(join(dir,'review/setup.private.json'),'utf8'));assert.deepEqual(report.recommendations,plan.report.recommendations);assert.match(JSON.stringify(report),/PRIVATE_DURATION/);assert.equal(JSON.parse(await readFile(join(dir,'review/notabenda.config.json'),'utf8')).consent.grantExpiryPolicy,undefined);}finally{await rm(dir,{recursive:true,force:true});}
});

for(const [profile,create] of consentProfiles)test(`${profile}: a failed policy migration cannot authorize stale grants in the current instance`,async()=>{
 const f=await setup(),ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;const id=f.config.purposes[0].id;let c=create(ordinary,f.env);c.choose({[id]:true,second:false});c.destroy();f.env.storage.setItem=()=>{throw Error('Read-only storage');};f.env.storage.removeItem=()=>{throw Error('Read-only storage');};c=create(f.config,f.env);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes.second,'denied');assert.equal(c.getSnapshot().persistence,'unavailable');c.refresh();assert.equal(c.isAllowed(id),false);c.destroy();
});

for(const [profile,create] of consentProfiles)test(`${profile}: a policy migration preserves independent Italian withholding after the refused purpose was removed`,async()=>{
 const f=await setup(),ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;ordinary.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'initial'};const id=f.config.purposes[0].id;let c=create(ordinary,f.env);c.choose({[id]:true,second:false});c.destroy();const next=structuredClone(ordinary);next.consent.grantExpiryPolicy=cap;next.purposes=next.purposes.filter(p=>p.id!== 'second');next.services=next.services.filter(s=>!s.purposeIds.includes('second'));next.consent.purposes=next.consent.purposes.filter(p=>p.id!== 'second');next.consent.services=next.consent.services.filter(s=>s.id!== 'second-service');c=create(next,f.env);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().shouldPrompt,false);c.destroy();c=create(next,f.env);assert.equal(c.getSnapshot().shouldPrompt,false);assert.equal(c.getSnapshot().promptDecision.reason,'withholding-floor');assert.equal(JSON.parse(f.values.get(f.key)).promptPolicy.processingRevision,'initial');c.destroy();
});

test('receipt caps compare both clocks independently across a clamped month end',async()=>{
 const client='2026-08-30T23:59:50.000Z',server='2026-08-31T00:00:00.000Z';assert.equal(new Date(receiptGrantExpiresAt(Date.parse(client),Date.parse(server),365,cap)).toISOString(),'2027-02-28T00:00:00.000Z');assert.equal(new Date(receiptGrantExpiresAt(Date.parse(server),Date.parse(client),365,cap)).toISOString(),'2027-02-28T00:00:00.000Z');
 const f=await setup(client),{build,notice}=noticeFor(f.config),storage=createSyntheticStorage([]),context={siteId:f.config.site.id,scopeId:'cookie-choices',streamId:'month-end-stream',now:()=>new Date(server)};await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);const bootstrap=await getConsentHead(storage,context);const c=createConsent(f.config,f.env,{evidence:{notice,streamRef:bootstrap.streamRef,read:()=>getConsentHead(storage,context),write:request=>recordConsentChoice(storage,request,context)}});await c.settled();c.acceptAll();await c.settled();assert.equal(c.isAllowed(f.config.purposes[0].id),true);const result=await getConsentHead(storage,context);for(const until of Object.values(result.event.expiresAt))assert.equal(until,'2027-02-28T00:00:00.000Z');f.setTime('2027-02-28T00:00:00.000Z');await c.settled();assert.equal(c.isAllowed(f.config.purposes[0].id),false);c.destroy();
});

for(const [profile,create] of consentProfiles){
 test(`${profile}: a removed granted purpose cannot return through a later policy rollback`,async()=>{
  const f=await setup(),ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;const id=f.config.purposes[0].id;let c=create(ordinary,f.env);c.choose({[id]:true,second:false});c.destroy();const removed=structuredClone(f.config);removed.purposes=removed.purposes.filter(p=>p.id==='second');removed.services=removed.services.filter(s=>s.id==='second-service');removed.consent.purposes=removed.consent.purposes.filter(p=>p.id==='second');removed.consent.services=removed.consent.services.filter(s=>s.id==='second-service');c=create(removed,f.env);assert.equal(c.getSnapshot().purposes.second,'denied');c.destroy();c=create(ordinary,f.env);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes.second,'denied');c.destroy();
 });
 test(`${profile}: quota failure during migration preserves the readable durable refusal record`,async()=>{
  const f=await setup(),ordinary=structuredClone(f.config);delete ordinary.consent.grantExpiryPolicy;ordinary.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'initial'};const id=f.config.purposes[0].id;let c=create(ordinary,f.env);c.choose({[id]:true,second:false});c.destroy();const prior=f.values.get(f.key);let deletes=0;f.env.storage.setItem=()=>{throw Error('Quota');};f.env.storage.removeItem=key=>{deletes++;f.values.delete(key);};const next=structuredClone(ordinary);next.consent.grantExpiryPolicy=cap;c=create(next,f.env);assert.equal(c.isAllowed(id),false);assert.equal(c.getSnapshot().purposes.second,'denied');assert.equal(c.getSnapshot().shouldPrompt,false);assert.equal(c.getSnapshot().persistence,'unavailable');assert.equal(deletes,0);assert.equal(f.values.get(f.key),prior);c.destroy();
 });
}
