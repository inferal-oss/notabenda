// @requirements REQ-EU-CONSENT REQ-CA-MEANINGFUL REQ-EU-MARKETING REQ-CA-CASL-OPTIN
// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-SCOPE-GUARDS REQ-PRODUCT-EVIDENCE-LIFECYCLE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createFormPermission,FormPermissionError,mountFormPermission,normalizeFormPermissionOffer,formPermissionGrantSupported} from '@notabenda/core';
import {compileLegalDocuments,createFormPermissionOffer,canonicalJson,sha256} from '@notabenda/core/content';
import {recordLegalRelease,registerFormPermissionOffer,setActiveFormPermissionOffer,formPermissionStreamRef,getFormPermissionState,recordFormPermission,createFormPermissionStore,createAdminWorker,createEvidenceLifecycle,createEvidenceLifecycleStore} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
const at='2026-10-18T12:00:00.000Z';
const absent=()=>({children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'});
const settings={permissionId:'newsletter-email',purposeId:'enquiries',channel:{id:'email',label:'Email'},revision:'newsletter-1',reviewStatus:'reviewed',withdrawalUrl:'/preferences',wording:{title:'Occasional product notes',statement:'Send me the fictional product newsletter by email.',grantLabel:'Save email permission',withdrawLabel:'Withdraw email permission',optionality:'Optional. You can use the service without this choice.',withdrawalExplanation:'Withdraw here at any time. This stops this purpose and channel only.'}};
const query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};
const reject=(promise,code)=>assert.rejects(promise,error=>error.code===code);
const deferred=()=>{let resolve,reject;return {promise:new Promise((a,b)=>{resolve=a;reject=b;}),get resolve(){return resolve;},get reject(){return reject;}};};
async function setup(){const config=await fixture({reviewed:true});config.scopeGuards={version:1,revision:'assessment-1',site:absent()};const build=compileLegalDocuments(config),offer=createFormPermissionOffer(build.artifact,settings),storage=createSyntheticStorage([]),context={siteId:config.site.id,permissionId:settings.permissionId,streamId:'person-one:contact-generation-one',now:()=>new Date(at)};await recordLegalRelease(storage,build.artifact);await registerFormPermissionOffer(storage,offer,context);await setActiveFormPermissionOffer(storage,offer.offerId,context);return {config,build,offer,storage,context,ref:await formPermissionStreamRef(context)};}
const grant=async(f,overrides={})=>{const state=await getFormPermissionState(f.storage,f.context);return {schemaVersion:1,offerId:f.offer.offerId,expectedStreamRef:f.ref,requestId:crypto.randomUUID(),action:'grant',clientAt:at,expectedRevision:state.revision,expectedActivation:state.activeRevision,...overrides};};
const withdraw=(f,overrides={})=>({schemaVersion:1,offerId:f.offer.offerId,expectedStreamRef:f.ref,requestId:crypto.randomUUID(),action:'withdraw',clientAt:at,...overrides});
const write=(f,command,context=f.context)=>recordFormPermission(f.storage,command,context);
const controller=async(f,extra={})=>createFormPermission(f.offer,{streamRef:await formPermissionStreamRef(f.context),read:()=>getFormPermissionState(f.storage,f.context),submit:body=>write(f,body),now:()=>new Date(at),...extra});
async function nextOffer(f,changes={},config=f.config){const build=compileLegalDocuments(config),offer=createFormPermissionOffer(build.artifact,{...settings,revision:'newsletter-2',...changes});await recordLegalRelease(f.storage,build.artifact);await registerFormPermissionOffer(f.storage,offer,f.context);return offer;}

test('permission offer binds exact reviewed wording, one purpose/channel, privacy facts, assessment and immutable document',async()=>{
 const f=await setup();assert.equal(createFormPermissionOffer(f.build.artifact,settings).offerId,f.offer.offerId);const {offerId,...descriptor}=f.offer;assert.equal(sha256(canonicalJson(descriptor)),offerId);assert.equal(f.offer.document.url,`/artifacts/${f.build.manifest.artifactId}/privacy.html`);assert.equal(f.offer.facts.purpose.id,'enquiries');assert.equal(f.offer.facts.scopeGuard.revision,'assessment-1');assert.equal(f.config.consent,undefined);
 const copy=normalizeFormPermissionOffer(f.offer);copy.wording.title='Mutated';assert.notEqual(copy.wording.title,f.offer.wording.title);
 const damaged=structuredClone(f.build.artifact);damaged.pages[damaged.manifest.documents[0].file]+='tampered';assert.throws(()=>createFormPermissionOffer(damaged,settings));
 for(const change of [n=>n.private='no',n=>n.wording.hidden='no',n=>n.channel.id='Email',n=>n.document.url='/privacy',n=>n.facts.purpose.id='other',n=>n.withdrawalUrl='https://user:secret@example.test',n=>n.mode=['production'],n=>n.revision='',n=>n.deliveryWindowSeconds=86401,n=>n.facts.scopeGuard.facts.hidden='absent']){const n=structuredClone(f.offer);change(n);assert.throws(()=>normalizeFormPermissionOffer(n));}
});

test('CF rechecks digests and archived facts, rejects absent/tampered archives and fixes stable purpose/channel and revision identities',async()=>{
 const f=await setup();await assert.rejects(registerFormPermissionOffer(createSyntheticStorage([]),f.offer,f.context));const forge=(change)=>{const n=structuredClone(f.offer);change(n);const {offerId,...descriptor}=n;n.offerId=sha256(canonicalJson(descriptor));return n;};
 for(const n of [forge(n=>n.document.sha256='a'.repeat(64)),forge(n=>n.facts.controller.name='Wrong controller'),forge(n=>n.facts.scopeGuard.facts.children='present'),forge(n=>n.withdrawalUrl='/bad%0a'),forge(n=>n.mode=['production'])])await assert.rejects(registerFormPermissionOffer(f.storage,n,f.context));
 await reject(registerFormPermissionOffer(f.storage,forge(n=>n.channel.id='sms'),f.context),'scope-mismatch');await reject(registerFormPermissionOffer(f.storage,forge(n=>n.wording.statement='Changed without a new material revision'),f.context),'idempotency-conflict');
 const other=await nextOffer(f,{permissionId:'newsletter-sms',channel:{id:'sms',label:'SMS'}});assert.notEqual(other.offerId,f.offer.offerId);assert.equal((await registerFormPermissionOffer(f.storage,f.offer,f.context)).created,false);
});

test('grants require reviewed production release and wording; preview is explicit and never relaxes scope guards',async()=>{
 const f=await setup();f.config.documents.privacy.review.status='draft';const build=compileLegalDocuments(f.config,{mode:'preview'});assert.throws(()=>createFormPermissionOffer(build.artifact,settings));const offer=createFormPermissionOffer(build.artifact,{...settings,revision:'preview-2'},{mode:'preview'});await recordLegalRelease(f.storage,build.artifact);await assert.rejects(registerFormPermissionOffer(f.storage,offer,f.context));const context={...f.context,allowPreview:true};await registerFormPermissionOffer(f.storage,offer,context);await setActiveFormPermissionOffer(f.storage,offer.offerId,context);assert.throws(()=>createFormPermission(offer,{streamRef:'a'.repeat(64),read:async()=>null,submit:async()=>null}));
});

test('optional field starts unchecked and makes no reads, grants, withdrawals or host form submission implicitly',async()=>{
 const f=await setup();let reads=0,writes=0;const c=await controller(f,{read(){reads++;return getFormPermissionState(f.storage,f.context);},submit(body){writes++;return write(f,body);}});const dom=new JSDOM('<form><div id="field"></div></form>',{url:'https://sample.example.test'}),d=dom.window.document,mount=mountFormPermission(d.getElementById('field'),{permission:c});assert.equal(reads,0);assert.equal(writes,0);const checkbox=d.querySelector('input[type=checkbox]');assert.equal(checkbox.checked,false);assert.equal(checkbox.required,false);assert.equal(checkbox.name,'');assert.ok([...d.querySelectorAll('button')].every(b=>b.type==='button'));
 d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));checkbox.checked=true;checkbox.dispatchEvent(new dom.window.Event('change'));assert.equal(writes,0);assert.equal(c.getSnapshot().allowed,false);await reject(c.grant(),'read-required');await c.refresh();assert.equal(reads,1);const result=await c.grant();assert.equal(writes,1);assert.equal(result.state.permitted,true);assert.equal(c.getSnapshot().allowed,true);assert.equal(checkbox.checked,false);assert.equal(checkbox.closest('label').hidden,true);mount.destroy();c.destroy();dom.window.close();
});

test('grant and withdrawal are atomic, replay-safe and return historical receipts separately from evaluated current state',async()=>{
 const f=await setup(),command=await grant(f);const first=await write(f,command);assert.equal(first.state.permitted,true);assert.equal(first.receipt.revision,1);const withdrawal=withdraw(f),stopped=await write(f,withdrawal);assert.equal(stopped.state.permitted,false);assert.equal(stopped.state.reason,'withdrawn');const replay=await write(f,command);assert.deepEqual(replay.receipt,first.receipt);assert.equal(replay.state.revision,2);assert.equal(replay.state.permitted,false);
 const second=await write(f,await grant(f));assert.equal(second.state.permitted,true);const retriedWithdrawal=await write(f,withdrawal);assert.deepEqual(retriedWithdrawal.receipt,stopped.receipt);assert.equal(retriedWithdrawal.state.permitted,true);assert.equal(retriedWithdrawal.state.revision,3);
 await reject(write(f,{...command,action:'withdraw',expectedRevision:undefined,expectedActivation:undefined}),'invalid-request');await reject(write(f,{...withdrawal,clientAt:'2026-10-18T12:00:01.000Z'}),'idempotency-conflict');
});

test('both grant/withdraw orderings, stale offers, current revisions and activation rollbacks stay restrictive',async()=>{
 for(const order of ['grant-first','withdraw-first']){const f=await setup(),g=await grant(f),w=withdraw(f);if(order==='grant-first'){await write(f,g);await write(f,w);}else{await write(f,w);await reject(write(f,g),'revision-conflict');}assert.equal((await getFormPermissionState(f.storage,f.context)).permitted,false);}
 const f=await setup(),g=await grant(f);await write(f,g);const next=await nextOffer(f);await setActiveFormPermissionOffer(f.storage,next.offerId,f.context);assert.equal((await getFormPermissionState(f.storage,f.context)).reason,'offer-changed');await reject(write(f,await grant(f)),'stale-offer');await write(f,withdraw(f));assert.equal((await getFormPermissionState(f.storage,f.context)).reason,'withdrawn');
 await setActiveFormPermissionOffer(f.storage,f.offer.offerId,f.context);assert.equal((await getFormPermissionState(f.storage,f.context)).permitted,false);const newGrant=await grant(f);await write(f,newGrant);await setActiveFormPermissionOffer(f.storage,null,f.context);assert.equal((await getFormPermissionState(f.storage,f.context)).reason,'inactive');await setActiveFormPermissionOffer(f.storage,f.offer.offerId,f.context);assert.equal((await getFormPermissionState(f.storage,f.context)).reason,'offer-changed');await reject(write(f,{...newGrant,requestId:crypto.randomUUID()}),'stale-offer');
});

test('old offers permit withdrawal after changes or deactivation; first late delivery withdraws a newer grant',async()=>{
 const f=await setup(),old=withdraw(f);await write(f,await grant(f));const next=await nextOffer(f);await setActiveFormPermissionOffer(f.storage,next.offerId,f.context);const newer={...f,offer:next};await write(f,await grant(newer));const result=await write(f,old);assert.equal(result.state.permitted,false);assert.equal(result.receipt.offerId,f.offer.offerId);await setActiveFormPermissionOffer(f.storage,null,f.context);assert.equal((await write(f,withdraw(f))).state.permitted,false);
});

test('non-cookie scope guards require explicit assessment and cannot be bypassed by a forged offer or absent cookie purposes',async()=>{
 for(const change of [c=>delete c.scopeGuards,...Object.keys(absent()).flatMap(key=>['present','unknown'].map(value=>c=>{c.scopeGuards.site[key]=value;})),c=>{c.scopeGuards.site.children='present';c.scopeGuards.purposes=[{id:'enquiries',facts:{children:'absent'}}];}]){
  const f=await setup();change(f.config);const offer=await nextOffer(f,{},f.config);await setActiveFormPermissionOffer(f.storage,offer.offerId,f.context);assert.equal(formPermissionGrantSupported(offer),false);const current=await getFormPermissionState(f.storage,f.context);assert.equal(current.grantAllowed,false);assert.equal(current.reason,'scope-restricted');await reject(write({...f,offer},await grant({...f,offer})),'scope-restricted');assert.equal((await write(f,withdraw(f))).state.permitted,false);const c=await controller({...f,offer});await c.refresh();c.setChecked(true);await reject(c.grant(),'scope-restricted');await c.withdraw();c.destroy();
 }
});

test('host contact generations, subjects and channels are isolated without raw addresses; browser selectors are rejected',async()=>{
 const f=await setup(),g=await grant(f);await write(f,g);for(const streamId of ['person-two:contact-generation-one','person-one:contact-generation-two']){const other={...f.context,streamId};assert.notEqual(await formPermissionStreamRef(other),await formPermissionStreamRef(f.context));assert.equal((await getFormPermissionState(f.storage,other)).permitted,false);await reject(write(f,g,other),'scope-mismatch');await write(f,withdraw(f,{expectedStreamRef:await formPermissionStreamRef(other)}),other);assert.equal((await getFormPermissionState(f.storage,f.context)).permitted,true);}
 const sms=await nextOffer(f,{permissionId:'newsletter-sms',channel:{id:'sms',label:'SMS'}}),context={...f.context,permissionId:'newsletter-sms'};await setActiveFormPermissionOffer(f.storage,sms.offerId,context);await write(f,withdraw({...f,offer:sms},{expectedStreamRef:await formPermissionStreamRef(context)}),context);assert.equal((await getFormPermissionState(f.storage,f.context)).permitted,true);
 for(const extra of [{streamId:'victim'},{permissionId:'other'},{subjectId:'victim'},{recordedAt:at}])await reject(write(f,{...withdraw(f),...extra}),'invalid-request');assert.doesNotMatch(JSON.stringify([...(await f.storage.list({prefix:'notabenda/permissions/',limit:100})).values()]),/person-one:contact-generation-one/);
});

test('grant delivery windows do not expire permission or limit withdrawal; malformed requests cannot record',async()=>{
 const f=await setup();await reject(write(f,await grant(f,{clientAt:'2026-10-18T11:49:00.000Z'})),'expired-command');await reject(write(f,await grant(f,{clientAt:'2026-10-18T12:01:00.000Z'})),'expired-command');const granted=await write(f,await grant(f));assert.equal((await getFormPermissionState(f.storage,{...f.context,now:()=>new Date('2030-01-01')})).permitted,true);assert.equal((await write(f,withdraw(f,{clientAt:'2000-01-01T00:00:00.000Z'}))).state.permitted,false);
 for(const command of [{}, {...await grant(f),expectedActivation:-1},{...await grant(f),expectedRevision:'2'},{...withdraw(f),clientAt:'2026-02-31T00:00:00.000Z'},{...withdraw(f),action:'decline'}])await reject(write(f,command),'invalid-request');assert.ok(granted.receipt.id);
});

test('uncertain acknowledgments retry identical commands and cannot replay a grant over a later withdrawal',async()=>{
 const f=await setup(),commands=[];let lost=true;const c=await controller(f,{async submit(command){commands.push(command);const result=await write(f,command);if(lost){lost=false;throw new Error('lost ack');}return result;}});await c.refresh();c.setChecked(true);await reject(c.grant(),'recording-failed');assert.equal(c.getSnapshot().allowed,false);await write(f,withdraw(f));await c.refresh();await c.grant();assert.deepEqual(commands[0],commands[1]);assert.equal(c.getSnapshot().allowed,false);assert.equal(c.getSnapshot().current.reason,'withdrawn');c.destroy();
});

test('withdrawal stays available after a failed read; late grant/read responses cannot overwrite its acknowledged state',async()=>{
 const f=await setup(),gate=deferred(),arrived=deferred();let delayed;const c=await controller(f,{async submit(command){const result=await write(f,command);if(command.action==='grant'){delayed=result;arrived.resolve();await gate.promise;}return result;}});await c.refresh();c.setChecked(true);const pending=c.grant();const rejectedPending=reject(pending,'superseded');await arrived.promise;assert.ok(delayed);const w=await c.withdraw();assert.equal(w.state.permitted,false);assert.equal(c.getSnapshot().allowed,false);gate.resolve();await rejectedPending;assert.equal(c.getSnapshot().current.reason,'withdrawn');c.destroy();
 const failed=await controller(f,{read:async()=>{throw new Error('unavailable');}});await reject(failed.refresh(),'recording-failed');await failed.withdraw();assert.equal(failed.getSnapshot().current.permitted,false);failed.destroy();
 const readGate=deferred(),late=await controller(f,{read:()=>readGate.promise});const r=late.refresh(),rejectedRead=reject(r,'superseded');const before=await getFormPermissionState(f.storage,f.context);await late.withdraw();readGate.resolve(before);await rejectedRead;assert.equal(late.getSnapshot().current.revision,before.revision+1);late.destroy();
});

test('concurrent duplicates append once; invalid acknowledgments, terminal contexts and destroy stay restrictive',async()=>{
 const f=await setup(),g=await grant(f),results=await Promise.all(Array.from({length:6},()=>write(f,g)));for(const result of results)assert.deepEqual(result,results[0]);assert.equal((await createFormPermissionStore(f.storage,f.context).list(query)).records.length,1);
 const wrong=await controller(f,{read:async()=>({...results[0].state,streamRef:'a'.repeat(64)})});await reject(wrong.refresh(),'invalid-response');assert.equal(wrong.getSnapshot().allowed,false);wrong.destroy();
 const gate=deferred(),c=await controller(f,{submit:()=>gate.promise});await c.refresh();c.setChecked(true);const pending=c.grant();c.destroy();gate.resolve(results[0]);await reject(pending,'destroyed');assert.equal(c.getSnapshot().allowed,false);await reject(c.withdraw(),'destroyed');
});

test('retirement blocks current reads, retries and empty streams before purge; purge preserves other channels, subjects and shared offers',async()=>{
 const f=await setup(),g=await grant(f);await write(f,g);await write(f,withdraw(f));const other={...f.context,streamId:'another-person:contact-one'};await reject(write(f,g,other),'scope-mismatch');await write(f,withdraw(f,{expectedStreamRef:await formPermissionStreamRef(other)}),other);const lifecycle=await createEvidenceLifecycle(f.storage,{family:'permissions',siteId:f.context.siteId,scopeId:f.context.permissionId,streamId:f.context.streamId},{now:f.context.now}),decision={requestId:crypto.randomUUID(),reason:'operator-erasure',eligibleAt:at,legalHold:false};
 await lifecycle.setHold({active:true,reviewAt:'2026-11-18T00:00:00.000Z',expectedRevision:0});await reject(lifecycle.retire(decision),'legal-hold');await lifecycle.setHold({active:false,reviewAt:null,expectedRevision:1});await lifecycle.retire(decision);await reject(getFormPermissionState(f.storage,f.context),'context-retired');await reject(write(f,g),'context-retired');const list=await createFormPermissionStore(f.storage,f.context).list(query);assert.equal(list.records.filter(r=>r.data.kind==='retired-evidence').length,2);assert.equal(list.records.filter(r=>r.data.kind==='form-permission').length,1);
 let result;do{result=await lifecycle.purge({requestId:decision.requestId,legalHold:false,limit:1});}while(result.phase!=='complete');assert.equal(result.progress.deleted,2);assert.equal((await getFormPermissionState(f.storage,other)).revision,1);assert.ok(await f.storage.get('notabenda/permissions/'+f.context.siteId+'/offers/'+f.offer.offerId));assert.ok(await f.storage.get('notabenda/releases/'+f.build.manifest.artifactId));await reject(getFormPermissionState(f.storage,f.context),'context-retired');await reject(write(f,g),'context-retired');
 const empty={...f.context,streamId:'empty-stream'},closed=await createEvidenceLifecycle(f.storage,{family:'permissions',siteId:empty.siteId,scopeId:empty.permissionId,streamId:empty.streamId},{now:empty.now});await closed.retire({...decision,requestId:crypto.randomUUID()});await reject(getFormPermissionState(f.storage,empty),'context-retired');
 const states=await createEvidenceLifecycleStore(f.storage,{family:'permissions',siteId:f.context.siteId}).list(query);assert.equal(states.records.length,2);
});

test('inspection and export distinguish historical grants from evaluated current state and keep host authorization mandatory',async()=>{
 const f=await setup(),g=await write(f,await grant(f));await write(f,withdraw(f));const store=createFormPermissionStore(f.storage,f.context),record=await store.get(g.receipt.id);assert.equal(record.data.action,'grant');assert.equal(record.data.currentState.permitted,false);assert.equal(record.data.currentState.reason,'withdrawn');const worker=createAdminWorker({basePath:'/permissions',authorize:request=>request.headers.get('X-Test-Operator')==='yes'?{store,allowExport:true}:null});assert.equal((await worker.fetch(new Request('https://sample.test/permissions'))).status,403);const result=await worker.fetch(new Request('https://sample.test/permissions/export.json',{headers:{'X-Test-Operator':'yes'}}));assert.equal(result.status,200);assert.match(await result.text(),/currentState/);const detail=await worker.fetch(new Request('https://sample.test/permissions/record?id='+g.receipt.id,{headers:{'X-Test-Operator':'yes'}}));const html=await detail.text();for(const phrase of ['Historical action','Grant recorded','Evaluated current state at read time','No current permission','Host-received time','Browser-reported time','Exact permission statement'])assert.ok(html.includes(phrase));
});

test('observed head and activation high-water marks survive errors and reject captured older permission',async()=>{
 for(const boundary of ['activation','head']){const f=await setup();const positive=(await write(f,await grant(f))).state;if(boundary==='activation')await setActiveFormPermissionOffer(f.storage,null,f.context);else await write(f,withdraw(f));const restrictive=await getFormPermissionState(f.storage,f.context);let phase=0;const c=await controller(f,{async read(){if(phase++===0)return restrictive;if(phase===2)throw new Error('lost read');return positive;}});await c.refresh();assert.equal(c.getSnapshot().allowed,false);await reject(c.refresh(),'recording-failed');await reject(c.refresh(),'invalid-response');assert.equal(c.getSnapshot().allowed,false);c.destroy();}
});

test('synchronous destroy or withdrawal from a submitting subscriber prevents an unsent grant',async()=>{
 for(const end of ['destroy','withdraw']){const f=await setup(),commands=[];const c=await controller(f,{submit(command){commands.push(command);return write(f,command);}});await c.refresh();c.setChecked(true);let stopped=false,withdrawal;const remove=c.subscribe(s=>{if(s.status==='submitting'&&!stopped){stopped=true;if(end==='destroy')c.destroy();else withdrawal=c.withdraw();}});const pending=c.grant();await reject(pending,end==='destroy'?'destroyed':'superseded');if(withdrawal)await withdrawal;assert.ok(commands.every(command=>command.action!=='grant'));assert.equal((await getFormPermissionState(f.storage,f.context)).permitted,false);remove();c.destroy();}
});

test('hung reads and withdrawal acknowledgments time out, retry the same nonce, and ignore late work',async()=>{
 const f=await setup(),commands=[];let attempts=0;const c=await controller(f,{timeoutMs:100,read:()=>new Promise(()=>{}),async submit(command){commands.push(command);const result=await write(f,command);if(attempts++===0)return new Promise(()=>{});return result;}});await reject(c.refresh(),'recording-failed');await reject(c.withdraw(),'recording-failed');assert.equal(c.getSnapshot().allowed,false);await c.withdraw();assert.deepEqual(commands[0],commands[1]);assert.equal(c.getSnapshot().current.revision,1);c.destroy();
});

async function journalPair(){const {IDBFactory}=await import('fake-indexeddb'),{createIndexedDBFormPermissionJournal}=await import('@notabenda/core');const indexedDB=new IDBFactory(),databaseName='permission-test';return [0,1].map(()=>createIndexedDBFormPermissionJournal({indexedDB,databaseName,broadcastChannel:null}));}
const key=f=>`notabenda:permission:v1:${f.offer.siteId}:${f.offer.permissionId}:${f.ref}`;

test('transactional journal survives lost grant acknowledgment and reload without automatic delivery or changed nonce',async()=>{
 const f=await setup(),[journal,other]=await journalPair(),commands=[];
 const first=await controller(f,{journal,async submit(command){commands.push(command);await write(f,command);throw Error('lost acknowledgment');}});
 await first.refresh();first.setChecked(true);await reject(first.grant(),'recording-failed');assert.equal(first.getSnapshot().recovery.pending,1);first.destroy();
 let reads=0;const second=await controller(f,{journal:other,read(){reads++;return getFormPermissionState(f.storage,f.context);},submit(command){commands.push(command);return write(f,command);}});
 await second.reconcile();assert.equal(reads,0);assert.equal(commands.length,1);assert.equal(second.getSnapshot().checked,false);assert.equal(second.getSnapshot().allowed,false);
 const result=await second.retryPending();assert.deepEqual(commands[1],commands[0]);assert.equal(result.state.revision,1);assert.equal(second.getSnapshot().allowed,true);assert.equal(second.getSnapshot().recovery.pending,0);second.destroy();journal.close();other.close();
});

test('offline withdrawal survives reload and offer replacement with its exact original artifact and nonce',async()=>{
 const f=await setup(),[journal,other]=await journalPair();await write(f,await grant(f));const commands=[];
 const first=await controller(f,{journal,submit(command){commands.push(command);throw Error('offline');}});
 await reject(first.withdraw(),'recording-failed');first.destroy();const saved=await journal.read(key(f));assert.ok(saved.withdraw);assert.equal(saved.blocked,true);
 const next=await nextOffer(f);await setActiveFormPermissionOffer(f.storage,next.offerId,f.context);
 const second=await controller({...f,offer:next},{journal:other,submit(command){commands.push(command);return write(f,command);}});
 await second.reconcile();await second.refresh();assert.equal(second.getSnapshot().allowed,false);assert.equal(second.getSnapshot().recovery.withdrawalPending,true);
 const result=await second.retryPending();assert.deepEqual(commands[0],commands[1]);assert.equal(result.receipt.offerId,f.offer.offerId);assert.equal(result.state.reason,'withdrawn');assert.equal(second.getSnapshot().recovery.pending,0);second.destroy();journal.close();other.close();
});

test('withdrawing after an uncertain grant permanently supersedes its recovery, including after reload',async()=>{
 const f=await setup(),[journal,other]=await journalPair(),commands=[];const first=await controller(f,{journal,async submit(command){commands.push(command);await write(f,command);throw Error('lost');}});
 await first.refresh();first.setChecked(true);await reject(first.grant(),'recording-failed');await reject(first.withdraw(),'recording-failed');first.destroy();
 const second=await controller(f,{journal:other,submit(command){commands.push(command);return write(f,command);}});await second.reconcile();assert.equal(second.getSnapshot().recovery.pending,1);await second.retryPending();assert.deepEqual(commands.map(c=>c.action),['grant','withdraw','withdraw']);assert.deepEqual(commands[1],commands[2]);assert.equal(second.getSnapshot().allowed,false);assert.equal((await getFormPermissionState(f.storage,f.context)).reason,'withdrawn');second.destroy();journal.close();other.close();
});

test('a stale checked tab cannot acquire a newer withdrawal epoch; a fresh read and deliberate check are required',async()=>{
 const f=await setup(),[journal,other]=await journalPair(),a=await controller(f,{journal}),b=await controller(f,{journal:other});await a.refresh();a.setChecked(true);await b.withdraw();
 await reject(a.grant(),'superseded');assert.equal((await getFormPermissionState(f.storage,f.context)).revision,1);await a.reconcile();assert.equal(a.getSnapshot().checked,false);assert.equal(a.getSnapshot().allowed,false);
 await a.refresh();a.setChecked(true);await a.grant();assert.equal(a.getSnapshot().allowed,true);assert.equal((await journal.read(key(f))).blocked,false);a.destroy();b.destroy();journal.close();other.close();
});

test('a late grant acknowledgment cannot settle or clear a newer journal withdrawal',async()=>{
 const f=await setup(),[journal,other]=await journalPair(),arrived=deferred(),release=deferred();const a=await controller(f,{journal,async submit(command){const result=await write(f,command);arrived.resolve();await release.promise;return result;}}),b=await controller(f,{journal:other});
 await a.refresh();a.setChecked(true);const request=a.grant(),rejected=assert.rejects(request,error=>['superseded','recording-failed'].includes(error.code));await arrived.promise;await b.withdraw();release.resolve();await rejected;await a.reconcile();assert.equal(a.getSnapshot().allowed,false);assert.equal((await journal.read(key(f))).blocked,true);assert.equal((await getFormPermissionState(f.storage,f.context)).reason,'withdrawn');a.destroy();b.destroy();journal.close();other.close();
});

test('journal failure gates grants before send and never erases a volatile withdrawal barrier on a successful read',async()=>{
 const f=await setup(),[base,other]=await journalPair();let fail=false,writes=0;
 const journal={read:base.read,update:(...args)=>{if(fail)throw Error('Quota');return base.update(...args);}};
 const c=await controller(f,{journal,submit(command){writes++;return write(f,command);}});await c.refresh();c.setChecked(true);fail=true;await reject(c.grant(),'unavailable');assert.equal(writes,0);
 fail=false;await c.refresh();c.setChecked(true);await c.grant();assert.equal(writes,1);fail=true;await c.withdraw();assert.equal(c.getSnapshot().recovery.status,'unavailable');assert.equal(c.getSnapshot().allowed,false);fail=false;await c.refresh();assert.equal(c.getSnapshot().allowed,false);c.setChecked(true);await reject(c.grant(),'unavailable');assert.equal(writes,2);
 await c.withdraw();assert.equal(writes,3);assert.equal(c.getSnapshot().current.reason,'withdrawn');c.destroy();base.close();other.close();
});

test('journal high-water fences survive controller recreation, compaction and terminal context retirement',async()=>{
 const f=await setup(),[journal,other]=await journalPair(),c=await controller(f,{journal});await c.refresh();c.setChecked(true);const old=(await c.grant()).state;await c.withdraw();c.destroy();
 const d=await controller(f,{journal:other,read:async()=>old});await d.reconcile();await reject(d.refresh(),'invalid-response');assert.equal(d.getSnapshot().allowed,false);d.destroy();
 const retired=await controller(f,{journal,read:async()=>{throw new FormPermissionError('context-retired');}});await reject(retired.refresh(),'context-retired');retired.destroy();const last=await controller(f,{journal:other});await reject(last.reconcile(),'context-retired');assert.equal(last.getSnapshot().allowed,false);last.destroy();journal.close();other.close();
});

test('changed contacts and offers cannot recover a grant from another binding, and pending withdrawal has no arbitrary expiry',async()=>{
 const f=await setup(),[journal,other]=await journalPair();const a=await controller(f,{journal,submit:async()=>{throw Error('offline');}});await a.refresh();a.setChecked(true);await reject(a.grant(),'recording-failed');a.destroy();
 const next=await nextOffer(f),b=await controller({...f,offer:next},{journal:other});await b.reconcile();await reject(b.retryPending(),'stale-offer');assert.equal(b.getSnapshot().allowed,false);await b.withdraw();b.destroy();
 const context={...f.context,streamId:'person-one:contact-generation-two'},different=await controller({...f,context},{journal});await different.reconcile();assert.equal(different.getSnapshot().recovery.pending,0);assert.equal(await different.retryPending(),null);different.destroy();
 const offline=await controller(f,{journal,submit:async()=>{throw Error('offline');}});await reject(offline.withdraw(),'recording-failed');offline.destroy();const future=await controller(f,{journal:other,now:()=>new Date('2030-01-01')});await future.reconcile();assert.equal(future.getSnapshot().recovery.withdrawalPending,true);await future.retryPending();assert.equal(future.getSnapshot().allowed,false);future.destroy();journal.close();other.close();
});

test('IndexedDB journal updates serialize across connections and abort without publishing partial writes',async()=>{
 const [a,b]=await journalPair();await Promise.all(Array.from({length:20},(_,i)=>(i%2?a:b).update('atomic',value=>({count:(value?.count??0)+1}))));assert.deepEqual(await a.read('atomic'),{count:20});
 await assert.rejects(a.update('atomic',value=>{value.count=999;throw Error('rollback');}));assert.deepEqual(await b.read('atomic'),{count:20});await assert.rejects(a.update('atomic',()=>({large:'x'.repeat(70000)})));assert.deepEqual(await b.read('atomic'),{count:20});a.close();b.close();await assert.rejects(a.read('atomic'));
});

test('local reconciliation invalidates a formerly positive view when another tab observes a newer activation',async()=>{
 const f=await setup(),[journal,other]=await journalPair();await write(f,await grant(f));const a=await controller(f,{journal}),b=await controller(f,{journal:other});await a.refresh();await b.refresh();assert.equal(a.getSnapshot().allowed,true);
 await setActiveFormPermissionOffer(f.storage,null,f.context);await b.refresh();await a.reconcile();assert.equal(a.getSnapshot().allowed,false);assert.equal(a.getSnapshot().current,null);a.destroy();b.destroy();journal.close();other.close();
});

test('fallback withdrawal supersedes retained grant recovery even when another host action grants later',async()=>{
 const f=await setup(),[base,other]=await journalPair();let fail=false,lost=true;const commands=[];
 const journal={read:base.read,update:(...args)=>{if(fail)throw Error('Quota');return base.update(...args);}};
 const c=await controller(f,{journal,async submit(command){commands.push(command);const result=await write(f,command);if(lost){lost=false;throw Error('lost');}return result;}});
 await c.refresh();c.setChecked(true);await reject(c.grant(),'recording-failed');fail=true;await c.withdraw();assert.equal(c.getSnapshot().recovery.withdrawalPending,true);await write(f,await grant(f));fail=false;
 await c.retryPending();assert.deepEqual(commands.map(command=>command.action),['grant','withdraw','withdraw']);assert.equal(c.getSnapshot().allowed,false);assert.equal((await getFormPermissionState(f.storage,f.context)).reason,'withdrawn');assert.equal((await base.read(key(f))).grant,null);c.destroy();base.close();other.close();
});

test('destroy remains terminal while rejected-command cleanup is waiting on a journal transaction',async()=>{
 const f=await setup(),[base,other]=await journalPair(),arrived=deferred(),release=deferred();let updates=0;
 const journal={read:base.read,async update(...args){if(++updates===4){arrived.resolve();await release.promise;}return base.update(...args);}};
 const c=await controller(f,{journal,submit:async()=>{throw new FormPermissionError('stale-offer');}});await c.refresh();c.setChecked(true);const task=c.grant(),rejected=reject(task,'destroyed');await arrived.promise;c.destroy();release.resolve();await rejected;assert.equal(c.getSnapshot().status,'destroyed');assert.equal(c.getSnapshot().allowed,false);base.close();other.close();
});

test('malformed journal data and hung local storage cannot grant or remove the withdrawal control',async()=>{
 const f=await setup(),[base,other]=await journalPair();await base.update(key(f),()=>({schemaVersion:1,streamRef:'wrong'}));const invalid=await controller(f,{journal:base});await reject(invalid.reconcile(),'invalid-response');assert.equal(invalid.getSnapshot().recovery.status,'invalid');await invalid.withdraw();assert.equal(invalid.getSnapshot().allowed,false);invalid.destroy();
 const journal={read:()=>new Promise(()=>{}),update:()=>new Promise(()=>{})},hung=await controller(f,{journal,timeoutMs:100});await reject(hung.refresh(),'unavailable');assert.equal(hung.getSnapshot().allowed,false);await reject(hung.withdraw(),'recording-failed');assert.equal(hung.getSnapshot().recovery.status,'unavailable');hung.destroy();base.close();other.close();
});

test('old-offer withdrawal keeps its original artifact through quota fallback and repeated lost acknowledgments',async()=>{
 const f=await setup(),[base,other]=await journalPair(),first=await controller(f,{journal:base,submit:async()=>{throw Error('offline');}});await reject(first.withdraw(),'recording-failed');first.destroy();
 const config=structuredClone(f.config);config.controller.name='A revised public controller label';const offer=await nextOffer(f,{},config);assert.notEqual(offer.artifactId,f.offer.artifactId);let lost=true;const commands=[];
 const journal={read:other.read,update:async()=>{throw Error('Quota');}},c=await controller({...f,offer},{journal,async submit(command){commands.push(command);const result=await write(f,command);if(lost){lost=false;throw Error('lost');}return result;}});
 await c.reconcile();await reject(c.retryPending(),'recording-failed');const saved=await c.retryPending();assert.deepEqual(commands[0],commands[1]);assert.equal(saved.receipt.artifactId,f.offer.artifactId);assert.equal(c.getSnapshot().allowed,false);c.destroy();base.close();other.close();
});

test('native field keeps keyboard focus when read and retry actions disappear, and explains unsupported scopes',async()=>{
 const f=await setup(),[journal,other]=await journalPair();let lost=true;
 const c=await controller(f,{journal,async submit(command){const result=await write(f,command);if(lost){lost=false;throw Error('lost');}return result;}}),dom=new JSDOM('<main></main>'),doc=dom.window.document,mount=mountFormPermission(doc.querySelector('main'),{permission:c});
 const button=label=>[...doc.querySelectorAll('button')].find(b=>b.textContent===label),checkbox=doc.querySelector('input');
 const wait=predicate=>new Promise(resolve=>{const off=c.subscribe(s=>{if(predicate(s))queueMicrotask(()=>{off();resolve();});});});
 const loaded=wait(s=>!!s.current);button('Check saved permission').focus();button('Check saved permission').click();await loaded;assert.equal(doc.activeElement,checkbox);
 checkbox.checked=true;checkbox.dispatchEvent(new dom.window.Event('change'));button(f.offer.wording.grantLabel).focus();await reject(c.grant(),'recording-failed');assert.equal(doc.activeElement,button('Retry permission request'));assert.equal(checkbox.closest('label').hidden,true);assert.equal(doc.querySelector('.nb-form-permission-saved-statement').textContent,f.offer.wording.statement);
 const saved=wait(s=>s.status==='recorded'&&!s.recovery.pending);button('Retry permission request').click();await saved;assert.equal(doc.activeElement,button(f.offer.wording.withdrawLabel));mount.destroy();c.destroy();dom.window.close();journal.close();other.close();
 const config=structuredClone(f.config);config.scopeGuards.site.children='unknown';const offer=await nextOffer(f,{},config);await setActiveFormPermissionOffer(f.storage,offer.offerId,f.context);const restricted=await controller({...f,offer}),page=new JSDOM('<main></main>'),field=mountFormPermission(page.window.document.querySelector('main'),{permission:restricted});await restricted.refresh();assert.equal(page.window.document.querySelector('label').hidden,true);assert.match(page.window.document.querySelector('[role=status]').textContent,/separate process/);assert.equal([...page.window.document.querySelectorAll('button')].find(b=>b.textContent===offer.wording.withdrawLabel).disabled,false);field.destroy();restricted.destroy();page.window.close();
});

test('the current replacement offer can be reviewed without an endless reload instruction',async()=>{
 const f=await setup();await write(f,await grant(f));const offer=await nextOffer(f);await setActiveFormPermissionOffer(f.storage,offer.offerId,f.context);const c=await controller({...f,offer}),dom=new JSDOM('<main></main>'),mount=mountFormPermission(dom.window.document.querySelector('main'),{permission:c});await c.refresh();assert.equal(c.getSnapshot().current.reason,'offer-changed');const message=dom.window.document.querySelector('[role=status]').textContent;assert.match(message,/Review it/);assert.doesNotMatch(message,/Reload/);assert.equal(dom.window.document.querySelector('label').hidden,false);mount.destroy();c.destroy();dom.window.close();
});

test('operator history follows one contact reference in event order and keeps export scoped to that search',async()=>{
 const f=await setup(),first=await write(f,await grant(f)),last=await write(f,withdraw(f));const other={...f.context,streamId:'another-contact'},ref=await formPermissionStreamRef(other);await write(f,withdraw(f,{expectedStreamRef:ref}),other);
 const store=createFormPermissionStore(f.storage,f.context),worker=createAdminWorker({basePath:'/permissions',authorize:()=>({store,allowExport:true})});
 const detail=await worker.fetch(new Request('https://example.test/permissions/record?id='+first.receipt.id)),dom=new JSDOM(await detail.text()),link=dom.window.document.querySelector('.permission-history-link');assert.equal(link.getAttribute('href'),'/permissions?q='+f.ref);
 const response=await worker.fetch(new Request('https://example.test'+link.getAttribute('href'))),page=new JSDOM(await response.text()),records=[...page.window.document.querySelectorAll('.record-link')];assert.deepEqual(records.map(a=>new URL(a.getAttribute('href'),'https://example.test').searchParams.get('id')),[first.receipt.id,last.receipt.id]);assert.match(page.window.document.body.textContent,/Permission history/);assert.match(page.window.document.body.textContent,/recorded event order/);assert.match(page.window.document.querySelector('.export-link').href,new RegExp('q='+f.ref));dom.window.close();page.window.close();
});

test('operator permission state filters use current evaluation, preserve contact searches and export the same scope',async()=>{
 const f=await setup(),first=await write(f,await grant(f));await write(f,withdraw(f));
 const other={...f.context,streamId:'another-contact'},ref=await formPermissionStreamRef(other);await write(f,await grant({...f,context:other,ref}),other);
 const store=createFormPermissionStore(f.storage,f.context),worker=createAdminWorker({basePath:'/permissions',authorize:()=>({store,allowExport:true})});
 const read=async q=>{const response=await worker.fetch(new Request('https://example.test/permissions?'+new URLSearchParams({q})));assert.equal(response.status,200);return new JSDOM(await response.text());};
 const all=await read(f.ref),filter=all.window.document.querySelector('nav[aria-label="Current permission states"]'),allowed=[...filter.querySelectorAll('a')].find(a=>a.textContent==='Allowed'),allowedUrl=new URL(allowed.href,'https://example.test');assert.equal(allowedUrl.searchParams.get('q'),f.ref+' permission:allowed');
 const empty=await read(allowedUrl.searchParams.get('q'));assert.equal(empty.window.document.querySelectorAll('.record-link').length,0);assert.match(empty.window.document.body.textContent,/No matches/);assert.ok(empty.window.document.querySelector('nav[aria-label="Current permission states"]'));
 const withdrawn=await read(f.ref+' permission:withdrawn');assert.equal(withdrawn.window.document.querySelectorAll('.record-link').length,2);assert.match(withdrawn.window.document.body.textContent,/Permission history/);assert.equal(new URL(withdrawn.window.document.querySelector('.export-link').href,'https://example.test').searchParams.get('q'),f.ref+' permission:withdrawn');
 const allowedOther=await store.list({query:'permission:allowed',kind:'',keyPrefix:'',from:'',to:'',limit:50});assert.equal(allowedOther.records.length,1);assert.equal(allowedOther.records[0].data.streamRef,ref);assert.notEqual(allowedOther.records[0].id,first.receipt.id);
 const noMatch=await store.list({query:'permission:unknown',kind:'',keyPrefix:'',from:'',to:'',limit:50});assert.equal(noMatch.records.length,0);
 for(const page of [all,empty,withdrawn])page.window.close();
});
