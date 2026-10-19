import {consentProfiles} from './consent-profiles.mjs';
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {JSDOM} from 'jsdom';
import {test as nodeTest} from 'node:test';
import assert from 'node:assert/strict';
import {mountControls,ConsentEvidenceError} from 'notabenda';
import {compileLegalDocuments,createConsentNotice} from 'notabenda/content';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead,createConsentEvidenceStore,createEvidenceLifecycle} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-EU-CONSENT REQ-PRODUCT-CONSENT-RUNTIME
const instant=Date.parse('2026-10-18T12:00:00.000Z');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function createSetup(createConsent) {
  const config=await fixture({reviewed:true});config.storage=[];
  config.services=config.purposes.map((p,i)=>({id:`optional-${i}`,name:`Fictional optional ${i}`,provider:'Fictional operator',location:'Local test',purposeIds:[p.id]}));
  config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:10};
  const build=compileLegalDocuments(config);const notice=createConsentNotice(build.artifact,{scopeId:'cookie-choices'});
  const storage=createSyntheticStorage([]);let clock=instant;let serverOffset=0;
  const context={siteId:config.site.id,scopeId:notice.scopeId,streamId:'fictional-private-host-reference',now:()=>new Date(clock+serverOffset)};
  await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);
  const bootstrap=await getConsentHead(storage,context);const values=new Map();let writes=0;let failStorage=false;let read,write;const requests=[];const timers=new Set();
  const local={getItem:key=>values.get(key)??null,setItem(key,value){if(failStorage)throw new Error('blocked storage');writes++;values.set(key,value);},removeItem(key){if(failStorage)throw new Error('blocked storage');values.delete(key);}};
  const environment={storage:local,now:()=>clock,schedule(callback,delay){const timer={callback,at:clock+delay};timers.add(timer);return ()=>timers.delete(timer);}};
  const options={notice,streamRef:bootstrap.streamRef,timeoutMs:1000,read:ctx=>read?read(ctx):getConsentHead(storage,context),write:async(body,ctx)=>{
    requests.push(structuredClone(body));
    try{return write?await write(body,ctx):await recordConsentChoice(storage,body,context);}
    catch(error){if(['revision-conflict','stale-notice','expired-command'].includes(error.code))throw new ConsentEvidenceError(error.code);throw error;}
  }};
  return {config,build,notice,storage,context,values,local,environment,options,requests,key:`notabenda:choices:v1:${config.site.id}`,ids:config.purposes.map(p=>p.id),
    controller(overrides={}){return createConsent(config,environment,{evidence:{...options,...overrides}});},
    setRead(fn){read=fn;},setWrite(fn){write=fn;},failStorage(){failStorage=true;},setOffset(ms){serverOffset=ms;},writes:()=>writes,
    advance(ms){clock+=ms;let count=0;while([...timers].some(t=>t.at<=clock)){if(++count>100)throw new Error('timer loop');const due=[...timers].filter(t=>t.at<=clock);for(const t of due){timers.delete(t);t.callback();}}},
    service(c){let starts=0,stops=0,signal;c.registerService(config.services[0].id,{purposes:[config.purposes[0].id],start(ctx){starts++;signal=ctx.signal;return ()=>{stops++;};}});return {starts:()=>starts,stops:()=>stops,signal:()=>signal};},
  };
}

for(const [profile,createConsent] of consentProfiles){
 const test=(name,run)=>nodeTest(`${profile}: ${name}`,run);
 const setup=()=>createSetup(createConsent);
// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
for(const surface of ['page','drawer'])test(`recording retry on ${surface} preserves a visible focus destination without stealing later page focus`,async()=>{
 const f=await setup(),ack=deferred();let attempts=0;
 f.setWrite(async body=>{if(++attempts===1)throw new Error('offline');await ack.promise;return recordConsentChoice(f.storage,body,f.context);});
 const c=f.controller();await c.settled();c.acceptAll();await c.settled();assert.equal(c.getSnapshot().evidence.status,'error');
 const dom=new JSDOM('<input aria-label="Site search"><div id="controls"></div>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const ui=mountControls(doc.querySelector('#controls'),{consent:c});
 try{
  if(surface==='drawer')c.openPreferences();
  const scope=doc.querySelector(surface==='drawer'?'.nb-preferences-body':'.nb-controls');
  const retry=[...scope.querySelectorAll('button')].find(b=>b.textContent==='Try recording again'&&!b.hidden);
  assert.ok(retry);retry.focus();assert.equal(doc.activeElement,retry);retry.click();
  const status=doc.querySelector(surface==='drawer'?'.nb-preferences-body > [role=status]':'.nb-controls > [role=status]');
  assert.equal(retry.hidden,true);assert.equal(status.hidden,false);assert.equal(doc.activeElement,status);assert.match(status.textContent,/Saving your choice/);
  // A user can move away while delivery is pending. Its acknowledgment is not a new focus request.
  if(surface==='drawer')c.closePreferences();
  const search=doc.querySelector('input[aria-label="Site search"]');search.focus();ack.resolve();await c.settled();
  assert.equal(c.getSnapshot().evidence.status,'recorded');assert.equal(doc.activeElement,search);
 }finally{ack.resolve();ui.destroy();c.destroy();dom.window.close();}
});
test('required mode starts closed, records before starting optional work, and aborts immediately on withdrawal',async()=>{
  const f=await setup();const ack=deferred();const c=f.controller();const service=f.service(c);await c.settled();assert.equal(service.starts(),0);
  f.setWrite(async body=>{const result=await recordConsentChoice(f.storage,body,f.context);await ack.promise;return result;});
  c.acceptAll();await tick();assert.equal(c.getSnapshot().evidence.status,'saving');assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(service.starts(),0);
  ack.resolve();await c.settled();assert.equal(service.starts(),1);assert.equal(c.getSnapshot().evidence.status,'recorded');
  c.rejectAll();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(service.signal().aborted,true);await c.settled();assert.equal(service.stops(),1);c.destroy();
});

test('a lost acknowledgment retries identical bytes and never rewrites local choice storage from an acknowledgment',async()=>{
  const f=await setup();let lost=true;f.setWrite(async body=>{const result=await recordConsentChoice(f.storage,body,f.context);if(lost){lost=false;throw new Error('lost response');}return result;});
  const c=f.controller();await c.settled();c.acceptAll();await c.settled();assert.equal(c.getSnapshot().evidence.status,'error');assert.equal(c.isAllowed(f.ids[0]),false);
  const count=f.writes();const saved=f.values.get(f.key);await c.retryEvidence();await c.settled();assert.equal(c.isAllowed(f.ids[0]),true);
  assert.deepEqual(f.requests[0],f.requests[1]);assert.equal(f.values.get(f.key),saved);assert.equal(f.writes(),count);
  const events=await createConsentEvidenceStore(f.storage,f.context).list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50});assert.equal(events.records.length,1);c.destroy();
});

test('reload confirms an already committed event even after its delivery deadline, while an uncommitted grant needs a fresh choice',async()=>{
  const f=await setup();f.setWrite(async body=>{await recordConsentChoice(f.storage,body,f.context);throw new Error('lost');});
  let c=f.controller();await c.settled();c.acceptAll();await c.settled();c.destroy();f.advance(600000);c=f.controller();assert.equal(c.isAllowed(f.ids[0]),false);await c.settled();assert.equal(c.isAllowed(f.ids[0]),true);assert.equal(f.requests.length,1);c.destroy();
  const g=await setup();g.setWrite(async()=>{throw new Error('offline');});c=g.controller();await c.settled();c.acceptAll();await c.settled();c.destroy();
  c=g.controller();await c.settled();assert.equal(c.getSnapshot().evidence.status,'review');assert.equal(c.getSnapshot().shouldPrompt,true);assert.equal(c.isAllowed(g.ids[0]),false);assert.equal(g.requests.length,1);
  await c.retryEvidence();assert.equal(g.requests.length,1);c.destroy();
});

test('late grant acknowledgments and older reads cannot reopen permission after a newer local refusal',async()=>{
  const f=await setup();const late=deferred(),grantRecorded=deferred();const c=f.controller();await c.settled();const service=f.service(c);
  f.setWrite(async body=>{const result=await recordConsentChoice(f.storage,body,f.context);if(body.action==='accept-all'){grantRecorded.resolve();await late.promise;}return result;});
  c.acceptAll();await grantRecorded.promise;c.rejectAll();await c.settled();assert.equal(c.getSnapshot().evidence.status,'recorded');assert.equal(c.isAllowed(f.ids[0]),false);
  late.resolve();await tick();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(service.starts(),0);assert.equal((await getConsentHead(f.storage,f.context)).revision,2);
  const oldRead=deferred();const snapshot=await getConsentHead(f.storage,f.context);f.setRead(()=>oldRead.promise);c.refresh();c.rejectAll();await c.settled();oldRead.resolve(snapshot);await tick();assert.equal(c.getSnapshot().evidence.revision,3);assert.equal(c.isAllowed(f.ids[0]),false);c.destroy();
});

test('failed local withdrawal cannot revive a persisted grant, and failed local grants are never sent even through retry',async()=>{
  const f=await setup();const c=f.controller();await c.settled();const service=f.service(c);c.acceptAll();await c.settled();assert.equal(service.starts(),1);f.failStorage();
  assert.equal(c.rejectAll().persisted,false);assert.equal(service.signal().aborted,true);await c.settled();c.refresh();await c.settled();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(c.getSnapshot().purposes[f.ids[0]],'withdrawn');c.destroy();
  const g=await setup();const d=g.controller();await d.settled();g.failStorage();assert.equal(d.acceptAll().persisted,false);await d.settled();await d.retryEvidence();assert.equal(g.requests.length,0);assert.equal(d.isAllowed(g.ids[0]),false);d.destroy();
});

test('another tab writing refusal before a queued loader runs prevents its start even without a storage event',async()=>{
  const f=await setup();const c=f.controller();await c.settled();c.acceptAll();await c.settled();const service=f.service(c);
  // Service invocation is queued; synchronously replace storage with another tab's explicit refusal.
  const refusal=JSON.parse(f.values.get(f.key));delete refusal.evidence;for(const value of Object.values(refusal.choices))value.status='withdrawn';f.values.set(f.key,JSON.stringify(refusal));
  await c.settled();assert.equal(service.starts(),0);assert.equal(c.isAllowed(f.ids[0]),false);await c.settled();assert.equal(c.getSnapshot().purposes[f.ids[0]],'withdrawn');c.destroy();
});

test('stream changes and old local-only grants never replay requests or inherit remote permission',async()=>{
  const f=await setup();let c=createConsent(f.config,f.environment);c.acceptAll();c.destroy();
  c=f.controller();await c.settled();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(c.getSnapshot().shouldPrompt,true);assert.equal(f.requests.length,0);c.acceptAll();await c.settled();c.destroy();
  const context={...f.context,streamId:'another-host-stream'};const bootstrap=await getConsentHead(f.storage,context);
  c=f.controller({streamRef:bootstrap.streamRef,read:()=>getConsentHead(f.storage,context),write:body=>recordConsentChoice(f.storage,body,context)});await c.settled();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(c.getSnapshot().shouldPrompt,true);assert.equal((await getConsentHead(f.storage,context)).revision,0);c.destroy();
});

test('stale revision responses refresh the head but never rebase or automatically replay a grant',async()=>{
  const f=await setup();const c=f.controller();await c.settled();
  await recordConsentChoice(f.storage,{schemaVersion:1,noticeId:f.notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:'revoke-all',choices:Object.fromEntries(f.ids.map(id=>[id,false])),clientAt:new Date(instant).toISOString()},f.context);
  c.acceptAll();await c.settled();assert.equal(c.getSnapshot().evidence.status,'review');assert.equal(c.getSnapshot().evidence.revision,1);assert.equal(c.getSnapshot().evidence.canGrant,true);assert.equal(f.requests.length,1);assert.equal(c.isAllowed(f.ids[0]),false);
  c.acceptAll();await c.settled();assert.equal(f.requests[1].expectedRevision,1);assert.notEqual(f.requests[0].requestId,f.requests[1].requestId);assert.equal(c.isAllowed(f.ids[0]),true);c.destroy();
});

test('malformed receipts, mismatched current heads and revision regressions stay closed',async()=>{
  for(const mutate of [
    result=>{result.receipt.choices=Object.fromEntries(Object.keys(result.receipt.choices).map(id=>[id,'true']));},
    result=>{result.receipt.requestId=crypto.randomUUID();},
    result=>{result.head.event.expiresAt[Object.keys(result.head.event.choices)[0]]='2099-01-01T00:00:00.000Z';},
    result=>{result.receipt.artifactId='a'.repeat(64);},
    result=>{result.head.streamRef='a'.repeat(64);},
  ]) {
    const f=await setup();f.setWrite(async body=>{const result=JSON.parse(JSON.stringify(await recordConsentChoice(f.storage,body,f.context)));mutate(result);return result;});
    const c=f.controller();await c.settled();c.acceptAll();await c.settled();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(c.getSnapshot().evidence.status,'error');c.destroy();
  }
  const f=await setup();const empty=await getConsentHead(f.storage,f.context);const c=f.controller();await c.settled();c.acceptAll();await c.settled();f.setRead(async()=>empty);await c.refreshEvidence();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(c.getSnapshot().evidence.status,'error');c.destroy();
});

test('server expiry stops active work at its own earlier deadline rather than waiting for the local clock-derived expiry',async()=>{
  const f=await setup();f.setOffset(-30000);const c=f.controller();await c.settled();const service=f.service(c);c.acceptAll();await c.settled();assert.equal(service.starts(),1);
  f.advance(86400000-30000);await c.settled();assert.equal(c.isAllowed(f.ids[0]),false);assert.equal(service.signal().aborted,true);assert.equal(c.getSnapshot().evidence.status,'expired');c.destroy();
});

test('cosmetic notice revisions preserve a matching committed grant, while material changes do not',async()=>{
  const f=await setup();let c=f.controller();await c.settled();c.acceptAll();await c.settled();c.destroy();
  const build=compileLegalDocuments(f.config,{stylesheetUrl:'/another.css'});const notice=createConsentNotice(build.artifact,{scopeId:f.notice.scopeId});assert.notEqual(notice.noticeId,f.notice.noticeId);assert.equal(notice.scopeDigest,f.notice.scopeDigest);
  c=f.controller({notice});await c.settled();assert.equal(c.isAllowed(f.ids[0]),true);c.destroy();
  const changed=structuredClone(f.config);changed.consent.services[0].scope='two';const next=compileLegalDocuments(changed);const changedNotice=createConsentNotice(next.artifact,{scopeId:f.notice.scopeId});
  c=createConsent(changed,f.environment,{evidence:{...f.options,notice:changedNotice}});await c.settled();assert.equal(c.isAllowed(f.ids[0]),false);c.destroy();
});

test('unavailable reads, secure randomness failure, timeout and destroy still leave rejection usable and optional work blocked',async()=>{
  const f=await setup();f.setRead(async()=>{throw new Error('offline');});const c=f.controller();await c.settled();assert.equal(c.getSnapshot().evidence.canGrant,false);c.acceptAll();await c.settled();assert.equal(f.requests.length,0);assert.equal(c.getSnapshot().shouldPrompt,true);
  c.rejectAll();await c.settled();assert.equal(f.requests[0].action,'revoke-all');assert.equal(c.isAllowed(f.ids[0]),false);c.destroy();
  const g=await setup();const d=g.controller();await d.settled();const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});assert.doesNotThrow(()=>d.rejectAll());assert.equal(d.getSnapshot().evidence.status,'unavailable');assert.equal(d.isAllowed(g.ids[0]),false);}finally{Object.defineProperty(globalThis,'crypto',descriptor);d.destroy();}
  const h=await setup();h.setWrite(()=>new Promise(()=>{}));const e=h.controller();await e.settled();e.acceptAll();await tick();h.advance(1000);await e.settled();assert.equal(e.getSnapshot().evidence.status,'error');h.advance(400000);await e.settled();assert.equal(e.getSnapshot().evidence.status,'expired');assert.equal(h.requests.length,1);e.destroy();
  const k=await setup();k.setRead(()=>new Promise(()=>{}));const z=k.controller();z.destroy();await z.settled();assert.equal(z.getSnapshot().evidence.status,'destroyed');assert.equal(z.isAllowed(k.ids[0]),false);
});

test('missing or throwing browser storage cannot recurse during evidence initialization or later permission checks',async()=>{
  const f=await setup();
  for(const storage of [undefined,{getItem(){throw new Error('blocked getter');},setItem(){throw new Error();},removeItem(){throw new Error();}}]) {
    const c=createConsent(f.config,{...f.environment,storage},{evidence:f.options});await c.settled();assert.equal(c.getSnapshot().persistence,'unavailable');assert.equal(c.isAllowed(f.ids[0]),false);c.rejectAll();await c.settled();c.destroy();
  }
  const c=f.controller();await c.settled();const service=f.service(c);c.acceptAll();await c.settled();assert.equal(service.starts(),1);
  const get=f.local.getItem;f.local.getItem=()=>{throw new Error('storage revoked');};assert.equal(c.isAllowed(f.ids[0]),false);await c.settled();assert.equal(service.signal().aborted,true);f.local.getItem=get;c.destroy();
});

test('valid maximum-size old-notice revoke-all results with eighty purpose IDs fit both write and read bounds',async()=>{
  const f=await setup();const storage=createSyntheticStorage([]);
  async function release(prefix){
    const config=await fixture({reviewed:true});config.storage=[];
    config.purposes=Array.from({length:40},(_,i)=>({id:(prefix+i+'-').padEnd(120,'a'),name:'A',description:'A',legalBasis:'A',dataCategories:['A'],retention:'A',collection:{source:'direct',description:'A',required:false,consequences:'A'}}));
    config.services=config.purposes.map((p,i)=>({id:'s'+i,name:'S',provider:'S',location:'S',purposeIds:[p.id]}));
    config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'1'})),services:config.services.map(s=>({id:s.id,scope:'1'})),grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:10};
    const build=compileLegalDocuments(config);const notice=createConsentNotice(build.artifact,{scopeId:f.context.scopeId});await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,f.context);return {config,notice};
  }
  const old=await release('old');const next=await release('new');await setActiveConsentNotice(storage,next.notice.noticeId,f.context);
  await recordConsentChoice(storage,{schemaVersion:1,noticeId:next.notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action:'accept-all',choices:Object.fromEntries(Object.keys(next.notice.scopes).map(id=>[id,true])),clientAt:new Date(instant).toISOString()},f.context);
  const streamRef=(await getConsentHead(storage,f.context)).streamRef;let bytes=0;
  const options={evidence:{notice:old.notice,streamRef,read:()=>getConsentHead(storage,f.context),write:async body=>{const result=await recordConsentChoice(storage,body,f.context);bytes=Buffer.byteLength(JSON.stringify(result));return result;}}};
  let c=createConsent(old.config,f.environment,options);await c.settled();c.rejectAll();await c.settled();assert.ok(bytes>40000);assert.equal(c.getSnapshot().evidence.status,'recorded');c.destroy();
  const head=await getConsentHead(storage,f.context);assert.equal(Object.keys(head.event.choices).length,80);assert.ok(Buffer.byteLength(JSON.stringify(head))>20000);
  c=createConsent(old.config,f.environment,options);await c.settled();assert.equal(c.getSnapshot().evidence.status,'recorded');c.destroy();
});

// @requirements REQ-PRODUCT-CONSENT-EVIDENCE
test('retired evidence closes read and write workflows without retries, new grants or repeat prompts',async()=>{
 for(const via of ['read','write']){
  const f=await setup();let reads=0,writes=0;
  const map=async work=>{try{return await work();}catch(error){if(error.code==='context-retired')throw new ConsentEvidenceError('context-retired');throw error;}};
  const c=f.controller({read:()=>{reads++;return map(()=>getConsentHead(f.storage,f.context));},write:body=>{writes++;return map(()=>recordConsentChoice(f.storage,body,f.context));}});
  await c.settled();const service=f.service(c);
  if(via==='read'){c.acceptAll();await c.settled();assert.equal(service.starts(),1);}
  const lifecycle=await createEvidenceLifecycle(f.storage,{family:'consent',siteId:f.context.siteId,scopeId:f.context.scopeId,streamId:f.context.streamId},{now:f.context.now});
  await lifecycle.retire({requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:new Date(instant).toISOString(),legalHold:false});
  if(via==='read')await c.refreshEvidence();else{c.acceptAll();await c.settled();}
  const state=c.getSnapshot();assert.equal(state.evidence.status,'retired');assert.equal(state.evidence.canGrant,false);assert.equal(state.evidence.canRetry,false);assert.equal(state.shouldPrompt,false);assert.equal(c.isAllowed(f.ids[0]),false);if(via==='read')assert.equal(service.signal().aborted,true);
  const before=[reads,writes];c.acceptAll();c.rejectAll();c.refresh();await c.refreshEvidence();await c.retryEvidence();f.advance(60000);await c.settled();assert.deepEqual([reads,writes],before);assert.equal(c.getSnapshot().evidence.status,'retired');
  const dom=new JSDOM('<div></div>');dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};const ui=mountControls(dom.window.document.querySelector('div'),{consent:c});assert.match(dom.window.document.body.textContent,/context has closed/);assert.doesNotMatch(dom.window.document.body.textContent,/Retry before leaving/);ui.destroy();dom.window.close();c.destroy();
 }
});


// @requirements REQ-PRODUCT-CONSENT-EVIDENCE
test('removing an adapter cannot turn pending, acknowledged or malformed evidence into local permission',async()=>{
 for(const state of ['pending','acknowledged','malformed']){
  const f=await setup();if(state==='pending')f.setWrite(async()=>{throw Error('offline');});
  const required=f.controller();await required.settled();required.acceptAll();await required.settled();
  assert.equal(required.isAllowed(f.ids[0]),state!=='pending');
  if(state==='malformed'){const value=JSON.parse(f.values.get(f.key));value.evidence=null;f.values.set(f.key,JSON.stringify(value));}
  const original=f.values.get(f.key),local=createConsent(f.config,f.environment);assert.equal(local.isAllowed(f.ids[0]),false);assert.equal(local.getSnapshot().purposes[f.ids[0]],'unknown');assert.equal(f.values.get(f.key),original);
  local.acceptAll();assert.equal(local.isAllowed(f.ids[0]),true);assert.equal(required.isAllowed(f.ids[0]),false);await required.settled();assert.equal(required.isAllowed(f.ids[0]),false);local.destroy();required.destroy();
 }
});

}
