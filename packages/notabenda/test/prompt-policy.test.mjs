import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CONFIG
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountControls,toPublicConfig,validateSiteConfig,defaultConsentWording,normalizeConsentNotice} from '@notabenda/core';
import {compileLegalDocuments,createConsentNotice,canonicalJson,sha256} from '@notabenda/core/content';
import {recordLegalRelease,registerConsentNotice} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';

const DAY=86400000;
async function setup(instant='2026-01-31T12:34:56.789Z') {
  const config=await fixture({reviewed:true});
  config.purposes=[config.purposes[0],{...structuredClone(config.purposes[0]),id:'suggestions',name:'Suggestions'}];
  config.services=[{id:'sample',name:'Sample',provider:'Fictional operator',location:'Local',purposeIds:config.purposes.map(p=>p.id)}];config.storage=[];
  config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:[{id:'sample',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:1,dismissalMinutes:0,promptPolicy:{profile:'it-garante-2021',processingRevision:'initial'}};
  const values=new Map(),timers=new Set();let now=Date.parse(instant);
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const env={storage,now:()=>now,schedule:(fn,delay)=>{const timer={fn,delay};timers.add(timer);return()=>timers.delete(timer);}};
  return {config,values,storage,env,timers,key:`notabenda:choices:v1:${config.site.id}`,setTime(value){now=typeof value==='number'?value:Date.parse(value);for(const t of [...timers])t.fn();},tick(ms){this.setTime(now+ms);}};
}
const changed=config=>{const c=structuredClone(config);c.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'new-service',materialChange:{fromRevision:'initial',summary:'A fictional measurement provider has changed. Review its updated purposes and recipients.'}};return c;};

test('explicit validated profile projects public revision/disclosure, and jurisdiction labels never enable it',async()=>{
  const f=await setup();assert.equal(validateSiteConfig(f.config).valid,true);
  for(const bad of [{profile:'italy',processingRevision:'one'},{profile:'it-garante-2021',processingRevision:''},{profile:'it-garante-2021',processingRevision:'one',extra:true},{profile:'it-garante-2021',processingRevision:'one',materialChange:{fromRevision:'one',summary:'Changed'}},{profile:'it-garante-2021',processingRevision:'two',materialChange:{fromRevision:'one',summary:'\n'}},{profile:'it-garante-2021',processingRevision:'two',materialChange:{fromRevision:'one',summary:'x'.repeat(1001)}}]){
    const config=structuredClone(f.config);config.consent.promptPolicy=bad;const result=validateSiteConfig(config);assert.equal(result.valid,false);assert.ok(result.diagnostics.some(d=>d.requirementIds.includes('REQ-IT-REPROMPT')));
  }
  const config=changed(f.config);config.private={reviewRationale:'PRIVATE OPERATOR NOTE'};const projected=toPublicConfig(config);assert.deepEqual(projected.consent.promptPolicy,config.consent.promptPolicy);assert.ok(!JSON.stringify(projected).includes('PRIVATE OPERATOR NOTE'));
  const ordinary=structuredClone(f.config);delete ordinary.consent.promptPolicy;ordinary.jurisdictions=['IT'];const controller=createConsent(ordinary,f.env);controller.rejectAll();f.tick(DAY+1);assert.equal(controller.getSnapshot().shouldPrompt,true);assert.equal(controller.getSnapshot().promptDecision,undefined);controller.destroy();
});

test('refusal floor survives reload and short choice expiry, schedules its calendar deadline and leaves preferences reachable',async()=>{
  const f=await setup();let c=createConsent(f.config,f.env);c.rejectAll();c.destroy();c=createConsent(f.config,f.env);f.tick(DAY+1);
  assert.equal(c.getSnapshot().shouldPrompt,false);assert.equal(c.getSnapshot().promptDecision.reason,'withholding-floor');assert.equal(c.getSnapshot().promptDecision.nextEligibleAt,'2026-07-31T12:34:56.789Z');assert.ok(f.timers.size);
  for(const value of Object.values(c.getSnapshot().purposes))assert.equal(value,'expired');assert.ok(Object.values(c.getSnapshot().permissions).every(v=>!v));
  c.openPreferences();assert.equal(c.getSnapshot().preferencesOpen,true);c.closePreferences();assert.equal(c.getSnapshot().shouldPrompt,false);
  f.setTime('2026-07-31T12:34:56.788Z');assert.equal(c.getSnapshot().shouldPrompt,false);f.tick(1);assert.equal(c.getSnapshot().shouldPrompt,true);assert.equal(c.getSnapshot().promptDecision.reason,'six-months-elapsed');assert.deepEqual(c.getSnapshot().promptDecision.requirementIds,['REQ-IT-REPROMPT']);c.destroy();
});

test('six-month floor clamps month ends in common/leap years and crosses December independently of 180-day lifetimes',async()=>{
  for(const [start,end] of [['2026-08-31T10:00:00Z','2027-02-28T10:00:00.000Z'],['2027-08-31T10:00:00Z','2028-02-29T10:00:00.000Z'],['2026-10-18T10:00:00Z','2027-04-18T10:00:00.000Z']]){
    const f=await setup(start),c=createConsent(f.config,f.env);c.rejectAll();assert.equal(c.getSnapshot().promptDecision.nextEligibleAt,end);f.setTime(Date.parse(end)-1);assert.equal(c.getSnapshot().shouldPrompt,false);f.tick(1);assert.equal(c.getSnapshot().shouldPrompt,true);c.destroy();
  }
});

test('partial consent, removed purposes, changed lifetimes and legacy records preserve withholding independently of grants',async()=>{
  const f=await setup();f.config.consent.refusalLifetimeDays=180;const c=createConsent(f.config,f.env);c.choose({[f.config.purposes[0].id]:true,suggestions:false});c.destroy();
  const modified=structuredClone(f.config);modified.consent.refusalLifetimeDays=1;modified.purposes=modified.purposes.filter(p=>p.id!=='suggestions');modified.consent.purposes=modified.consent.purposes.filter(p=>p.id!=='suggestions');modified.services[0].purposeIds=modified.purposes.map(p=>p.id);modified.purposes.push({...structuredClone(modified.purposes[0]),id:'new-purpose'});modified.consent.purposes.push({id:'new-purpose',scope:'new'});modified.services[0].purposeIds.push('new-purpose');
  const next=createConsent(modified,f.env);assert.equal(next.getSnapshot().shouldPrompt,false);assert.equal(next.getSnapshot().promptDecision.reason,'withholding-floor');assert.ok(Object.values(next.getSnapshot().permissions).every(v=>!v));next.destroy();
  const legacy=JSON.parse(f.values.get(f.key));delete legacy.promptPolicy;f.values.set(f.key,JSON.stringify(legacy));const upgrade=createConsent(changed(modified),f.env);assert.equal(upgrade.getSnapshot().promptDecision.reason,'withholding-floor');assert.equal(upgrade.getSnapshot().shouldPrompt,false);upgrade.destroy();
});

test('dismissal retains choices/evidence unchanged and records only solicitation memory, including failed-storage fallback',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);c.dismiss();assert.equal(f.values.has(f.key),false);assert.equal(c.getSnapshot().shouldPrompt,false);assert.ok(Object.values(c.getSnapshot().purposes).every(v=>v==='unknown'));c.destroy();
  const reload=createConsent(f.config,f.env);f.tick(10*DAY);assert.equal(reload.getSnapshot().shouldPrompt,false);assert.equal(reload.getSnapshot().promptDecision.reason,'withholding-floor');reload.destroy();
  const blocked=await setup();blocked.storage.setItem=()=>{throw Error('Blocked');};const fallback=createConsent(blocked.config,blocked.env);fallback.dismiss();fallback.refresh();assert.equal(fallback.getSnapshot().shouldPrompt,false);fallback.destroy();const again=createConsent(blocked.config,blocked.env);assert.equal(again.getSnapshot().shouldPrompt,true);again.destroy();
  const unavailable=createConsent(blocked.config,{now:blocked.env.now});assert.equal(unavailable.getSnapshot().promptDecision.reason,'prior-state-unavailable');unavailable.dismiss();unavailable.refresh();assert.equal(unavailable.getSnapshot().shouldPrompt,false);unavailable.destroy();
});

test('only an exact declared material transition can reopen solicitation; dismissal acknowledges it without granting',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);c.rejectAll();c.destroy();f.tick(1);
  const revisionOnly=structuredClone(f.config);revisionOnly.consent.promptPolicy.processingRevision='new-service';let next=createConsent(revisionOnly,f.env);assert.equal(next.getSnapshot().shouldPrompt,false);next.destroy();
  const config=changed(f.config);next=createConsent(config,f.env);assert.equal(next.getSnapshot().shouldPrompt,true);assert.equal(next.getSnapshot().promptDecision.reason,'material-change');assert.ok(Object.values(next.getSnapshot().permissions).every(v=>!v));
  const before=f.values.get(f.key);next.dismiss();assert.equal(f.values.get(f.key),before);assert.equal(next.getSnapshot().shouldPrompt,false);next.destroy();
  const reload=createConsent(config,f.env);assert.equal(reload.getSnapshot().promptDecision.reason,'withholding-floor');assert.equal(reload.getSnapshot().shouldPrompt,false);reload.destroy();
});

test('newer cross-tab acknowledgement is not deleted by choose and equal timestamps prefer current-revision suppression',async()=>{
  const f=await setup();const old=createConsent(f.config,f.env);old.rejectAll();const current=createConsent(changed(f.config),f.env);
  const write=f.storage.setItem;let interleave=true;f.storage.setItem=(key,value)=>{write(key,value);if(key===f.key&&interleave){interleave=false;f.tick(1);current.dismiss();}};
  old.rejectAll();old.refresh();assert.ok(f.values.has(f.key+':prompt'));assert.equal(current.getSnapshot().promptDecision.reason,'withholding-floor');old.destroy();current.destroy();
  const same=await setup();const a=createConsent(same.config,same.env);a.rejectAll();a.destroy();const b=createConsent(changed(same.config),same.env);b.dismiss();b.destroy();const check=createConsent(changed(same.config),same.env);assert.equal(check.getSnapshot().shouldPrompt,false);assert.equal(check.getSnapshot().promptDecision.reason,'withholding-floor');check.destroy();
});

test('a suppressed prompt never extends an expired grant or changes service teardown',async()=>{
  const f=await setup(),c=createConsent(f.config,f.env);let starts=0,stops=0;
  c.registerService('sample',{purposes:f.config.services[0].purposeIds,start(){starts++;return()=>stops++;}});c.acceptAll();await c.settled();assert.equal(starts,1);f.tick(1);c.dismiss();f.tick(DAY+1);await c.settled();assert.equal(stops,1);assert.equal(c.getSnapshot().shouldPrompt,false);assert.ok(Object.values(c.getSnapshot().permissions).every(v=>!v));c.destroy();
});

test('material-change copy survives custom wording and is pinned with the policy while permission scopes remain stable',async()=>{
  const f=await setup();const original=compileLegalDocuments(f.config),config=changed(f.config),build=compileLegalDocuments(config);const before=createConsentNotice(original.artifact,{scopeId:'choices'}),notice=createConsentNotice(build.artifact,{scopeId:'choices',wording:{summary:'Your optional choices.',preferencesIntro:'Review your settings.'}});
  assert.equal(before.scopeDigest,notice.scopeDigest);assert.notEqual(before.noticeId,notice.noticeId);assert.deepEqual(notice.policy.promptPolicy,config.consent.promptPolicy);assert.match(notice.wording.summary,/^Your optional choices\. Changes to optional processing:/);assert.match(notice.wording.preferencesIntro,/^Review your settings\. Changes to optional processing:/);assert.ok(defaultConsentWording(toPublicConfig(config)).summary.includes(config.consent.promptPolicy.materialChange.summary));
  const broken=structuredClone(notice);broken.wording.summary='Overridden';assert.throws(()=>normalizeConsentNotice(broken));
  const store=createSyntheticStorage([]);await recordLegalRelease(store,build.artifact);await registerConsentNotice(store,notice,{siteId:config.site.id,scopeId:'choices',streamId:'synthetic-only'});
  const altered=structuredClone(notice);altered.policy.promptPolicy.processingRevision='unbound';const {noticeId:_,...descriptor}=altered;altered.noticeId=sha256(canonicalJson(descriptor));await assert.rejects(registerConsentNotice(store,altered,{siteId:config.site.id,scopeId:'choices'}),e=>e.code==='invalid-notice');
  const options={evidence:{notice:before,streamRef:'a'.repeat(64),read:async()=>null,write:async()=>null}};assert.throws(()=>createConsent(config,f.env,options),/prompt policy/);
});

test('legacy dismissal upgrades conservatively, while malformed enum or future-time metadata cannot masquerade as valid memory',async()=>{
  const f=await setup();const old=structuredClone(f.config);delete old.consent.promptPolicy;old.consent.dismissalMinutes=60;const before=createConsent(old,f.env);before.dismiss();before.destroy();f.tick(DAY);
  const upgraded=createConsent(changed(f.config),f.env);assert.equal(upgraded.getSnapshot().shouldPrompt,false);assert.equal(upgraded.getSnapshot().promptDecision.reason,'withholding-floor');upgraded.destroy();
  for(const outcome of [['withheld'],{toString:'withheld'},null]){
    f.values.set(f.key+':prompt',JSON.stringify({schemaVersion:1,siteId:f.config.site.id,at:f.env.now(),until:f.env.now(),regional:{profile:'it-garante-2021',processingRevision:'initial',at:f.env.now(),outcome}}));const bad=createConsent(f.config,f.env);assert.equal(bad.getSnapshot().shouldPrompt,true);assert.equal(bad.getSnapshot().promptDecision.reason,'no-prior-withholding');bad.destroy();
  }
  f.values.clear();f.values.set(f.key,JSON.stringify({schemaVersion:1,siteId:f.config.site.id,dismissedUntil:0,choices:{bad:{scope:'old',status:['denied'],at:f.env.now(),until:f.env.now()+DAY}}}));const badLegacy=createConsent(f.config,f.env);assert.equal(badLegacy.getSnapshot().shouldPrompt,true);badLegacy.destroy();
  f.values.clear();f.values.set(f.key+':prompt',JSON.stringify({schemaVersion:1,siteId:f.config.site.id,at:f.env.now()+DAY,until:f.env.now()+DAY,regional:{profile:'it-garante-2021',processingRevision:'initial',at:f.env.now()+DAY,outcome:'withheld'}}));const future=createConsent(f.config,f.env);assert.equal(future.getSnapshot().shouldPrompt,true);future.destroy();
});

test('evidence-driven requests for a fresh choice respect the floor and never permit an unacknowledged saved grant',async()=>{
  const f=await setup();const local=createConsent(f.config,f.env);local.acceptAll();f.tick(1);local.dismiss();local.destroy();
  const build=compileLegalDocuments(f.config),notice=createConsentNotice(build.artifact,{scopeId:'choices'}),streamRef='a'.repeat(64);
  const controller=createConsent(f.config,f.env,{evidence:{notice,streamRef,read:async()=>({schemaVersion:1,siteId:f.config.site.id,scopeId:'choices',streamRef,revision:0,event:null}),write:async()=>{throw Error('No synthetic write expected');}}});await controller.refreshEvidence();assert.equal(controller.getSnapshot().evidence.requiresChoice,true);assert.equal(controller.getSnapshot().shouldPrompt,false);assert.ok(Object.values(controller.getSnapshot().permissions).every(v=>!v));controller.destroy();
});

test('native controls show the declared disclosure and keep manual preferences available while solicitation is suppressed',async()=>{
  const f=await setup();let c=createConsent(f.config,f.env);c.rejectAll();c.destroy();c=createConsent(changed(f.config),f.env);
  const dom=new JSDOM('<div id="controls"></div>',{url:'https://fictional.example.test'});
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const host=dom.window.document.querySelector('#controls'),ui=mountControls(host,{consent:c});
  assert.ok(host.textContent.includes(changed(f.config).consent.promptPolicy.materialChange.summary));c.dismiss();assert.equal(c.getSnapshot().shouldPrompt,false);c.openPreferences();assert.equal(host.querySelector('dialog').open,true);c.closePreferences();ui.destroy();c.destroy();dom.window.close();
});
