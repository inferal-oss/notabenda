// @requirements REQ-PRODUCT-TERMS-RECOVERY REQ-PRODUCT-TERMS-ACCEPTANCE
import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createRecoverableTermsAcceptance,createIndexedDBTermsRecoveryJournal,TermsRecoveryError} from '@notabenda/core/terms/recovery';
import {compileLegalDocuments,createTermsOffer} from '@notabenda/core/content';
import {recordLegalRelease,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance,createTermsAcceptanceStore} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {fixture} from './helpers.mjs';
const contextId='opaque-host-context-for-one-workflow';
async function setup(){const config=await fixture({reviewed:true}),build=compileLegalDocuments(config),offer=createTermsOffer(build.artifact,{scopeId:'signup',statement:'I agree to these sample terms.',actionLabel:'Record sample agreement'}),storage=createSyntheticStorage([]),context={siteId:offer.siteId,scopeId:offer.scopeId,subjectId:'host-subject',operationId:'host-operation'};await recordLegalRelease(storage,build.artifact);await registerTermsOffer(storage,offer,context);await setActiveTermsOffer(storage,offer.offerId,context);return {offer,storage,context};}
function memory(){const rows=new Map();let queue=Promise.resolve();return {rows,read:async key=>structuredClone(rows.get(key)),update(key,change){const result=queue.then(()=>{const value=change(structuredClone(rows.get(key)));rows.set(key,structuredClone(value));return structuredClone(value);});queue=result.catch(()=>{});return result;}};}
const options=(f,journal,submit)=>({operationId:f.context.operationId,contextId,journal,submit});

test('reload remains unchecked and explicit retry reuses the original command and committed receipt',async()=>{
 const f=await setup(),factory=new IDBFactory(),commands=[];let original,lost=true;
 const submit=async command=>{commands.push(command);const receipt=await recordTermsAcceptance(f.storage,command,f.context);original??=receipt;if(lost){lost=false;throw Error('response lost after commit');}return receipt;};
 const firstJournal=createIndexedDBTermsRecoveryJournal({indexedDB:factory});const first=await createRecoverableTermsAcceptance(f.offer,options(f,firstJournal,submit));
 assert.equal(commands.length,0);assert.equal(first.getSnapshot().checked,false);first.setChecked(true);await assert.rejects(first.submit(),e=>e.code==='recording-failed');assert.equal(first.getSnapshot().receipt,undefined);first.destroy();firstJournal.close();
 const nextJournal=createIndexedDBTermsRecoveryJournal({indexedDB:factory});const next=await createRecoverableTermsAcceptance(f.offer,options(f,nextJournal,submit));
 assert.equal(next.getSnapshot().checked,false);assert.equal(next.getSnapshot().status,'idle');assert.equal(next.getSnapshot().receipt,undefined);assert.equal(commands.length,1);await assert.rejects(next.submit(),e=>e.code==='not-checked');assert.equal(commands.length,1);
 next.setChecked(true);assert.deepEqual(await next.submit(),original);assert.deepEqual(commands[1],commands[0]);const page=await createTermsAcceptanceStore(f.storage,f.context).list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:10});assert.equal(page.records.length,1);
 next.destroy();nextJournal.close();
});

test('simultaneous tabs atomically reserve one key and never store receipt, wording or operation identifiers',async()=>{
 const f=await setup(),factory=new IDBFactory(),journals=Array.from({length:8},()=>createIndexedDBTermsRecoveryJournal({indexedDB:factory}));let calls=0;
 const controllers=await Promise.all(journals.map(j=>createRecoverableTermsAcceptance(f.offer,options(f,j,async()=>{calls++;throw Error();}))));
 assert.equal(new Set(controllers.map(c=>c.getSnapshot().requestId)).size,1);assert.equal(calls,0);
 const value=await journals[0].read('notabenda:terms-recovery:v1:'+contextId);assert.deepEqual(Object.keys(value).sort(),['binding','requestId','schemaVersion']);assert.match(value.binding,/^[a-f0-9]{64}$/u);assert.doesNotMatch(JSON.stringify(value),new RegExp(f.context.operationId+'|host-subject|I agree|receipt'));
 controllers.forEach(c=>c.destroy());journals.forEach(j=>j.close());
});

test('changed operation, offer or same-ID wording cannot reuse or overwrite an existing context',async()=>{
 const f=await setup(),journal=memory(),base=options(f,journal,async()=>null),first=await createRecoverableTermsAcceptance(f.offer,base),before=structuredClone([...journal.rows]);
 for(const [offer,opts] of [[f.offer,{...base,operationId:'different-operation'}],[{...f.offer,offerId:'a'.repeat(64)},base],[{...f.offer,statement:'Changed under unchanged ID'},base]])await assert.rejects(createRecoverableTermsAcceptance(offer,opts),e=>e.code==='context-mismatch');
 assert.deepEqual([...journal.rows],before);first.destroy();
});

test('malformed and accessor-bearing rows are not repaired or interpreted as agreement',async()=>{
 const f=await setup();let getters=0,calls=0;
 for(const bad of [null,{}, {schemaVersion:1,binding:'a'.repeat(64),requestId:'weak'}, {schemaVersion:1,binding:'a'.repeat(64),requestId:crypto.randomUUID(),receipt:{}},Object.defineProperty({},'schemaVersion',{enumerable:true,get(){getters++;return 1;}})]){
  const journal={read:async()=>bad,update:async(_key,change)=>change(bad)};await assert.rejects(createRecoverableTermsAcceptance(f.offer,options(f,journal,async()=>{calls++;})),e=>e instanceof TermsRecoveryError);
 }
 assert.equal(getters,0);assert.equal(calls,0);
});

test('unavailable or replaced storage stops transmission, and a destroyed waiting controller cannot submit',async()=>{
 const f=await setup(),journal=memory();let calls=0;const c=await createRecoverableTermsAcceptance(f.offer,options(f,journal,async()=>{calls++;}));c.setChecked(true);
 const original=journal.read;journal.read=async()=>{throw Error('private storage error');};await assert.rejects(c.submit(),e=>e.code==='recording-failed');assert.equal(calls,0);
 journal.read=original;journal.rows.clear();await assert.rejects(c.submit(),e=>e.code==='recording-failed');assert.equal(calls,0);c.destroy();
 const other=memory();const d=await createRecoverableTermsAcceptance(f.offer,options(f,other,async()=>{calls++;}));let release;other.read=()=>new Promise(resolve=>{release=()=>resolve([...other.rows.values()][0]);});d.setChecked(true);const pending=d.submit();await Promise.resolve();d.destroy();release();await assert.rejects(pending,e=>e.code==='destroyed');assert.equal(calls,0);
});

test('host input is fixed before asynchronous storage and invalid options cause no journal work',async()=>{
 const f=await setup(),journal=memory();let writes=0;const guarded={read:journal.read,update(...args){writes++;return journal.update(...args);}};
 for(const opts of [{contextId:'short'},{operationId:''},{requestId:crypto.randomUUID()},{submit:null}])await assert.rejects(createRecoverableTermsAcceptance(f.offer,{...options(f,guarded,async()=>null),...opts}));assert.equal(writes,0);
 let release;const waiting={read:journal.read,update:(key,change)=>new Promise(resolve=>{release=()=>resolve(journal.update(key,change));})},opts=options(f,waiting,command=>recordTermsAcceptance(f.storage,command,f.context)),building=createRecoverableTermsAcceptance(f.offer,opts);
 while(!release)await new Promise(resolve=>setImmediate(resolve));opts.operationId='changed';opts.submit=async()=>{throw Error('changed');};release();const c=await building;assert.equal(c.isForOperation(f.context.operationId),true);c.setChecked(true);assert.equal((await c.submit()).operationId,f.context.operationId);c.destroy();
});

test('IndexedDB transactions roll back callback failures, enforce data bounds and close explicitly',async()=>{
 const indexedDB=new IDBFactory(),journal=createIndexedDBTermsRecoveryJournal({indexedDB});await journal.update('key',()=>({value:1}));await assert.rejects(journal.update('key',()=>{throw Error('abort');}));assert.deepEqual(await journal.read('key'),{value:1});await assert.rejects(journal.update('key',()=>({value:'x'.repeat(65537)})));assert.deepEqual(await journal.read('key'),{value:1});await assert.rejects(journal.update('key',()=>Promise.resolve({value:2})));assert.deepEqual(await journal.read('key'),{value:1});journal.close();journal.close();await assert.rejects(journal.read('key'),e=>e.code==='unavailable');
 const closing=createIndexedDBTermsRecoveryJournal({indexedDB,databaseName:'closing'}),pending=closing.read('key');closing.close();await assert.rejects(pending,e=>e.code==='unavailable');
});


test('replaced retry keys stop old controllers and explicit host cleanup removes only the selected context',async()=>{
 const f=await setup(),indexedDB=new IDBFactory(),journal=createIndexedDBTermsRecoveryJournal({indexedDB});let calls=0;const c=await createRecoverableTermsAcceptance(f.offer,options(f,journal,async()=>{calls++;}));
 const key='notabenda:terms-recovery:v1:'+contextId,otherId='another-opaque-host-context';await journal.update(key,row=>({...row,requestId:crypto.randomUUID()}));c.setChecked(true);await assert.rejects(c.submit(),e=>e.code==='recording-failed');assert.equal(calls,0);c.destroy();
 await journal.update('notabenda:terms-recovery:v1:'+otherId,()=>({other:true}));await journal.remove(contextId);assert.equal(await journal.read(key),undefined);assert.deepEqual(await journal.read('notabenda:terms-recovery:v1:'+otherId),{other:true});await journal.remove(contextId);await assert.rejects(journal.remove('short'));journal.close();await assert.rejects(journal.remove(contextId));
});


test('localized copy changes under unchanged offer IDs cannot inherit the original reservation',async()=>{
 const config=localizedExampleConfig(await fixture({reviewed:true}));config.localization.reviewStatus='reviewed';for(const doc of Object.values(config.documents))doc.review.status='reviewed';const build=compileLegalDocuments(config),offer=createTermsOffer(build.artifact,{scopeId:'localized',statement:'Concordo com estes termos.',actionLabel:'Registrar'}),journal=memory(),opts={operationId:'localized-operation',contextId,journal,submit:async()=>null},c=await createRecoverableTermsAcceptance(offer,opts);
 const changed=structuredClone(offer);changed.localization.terms.heading='Revise esta versão';await assert.rejects(createRecoverableTermsAcceptance(changed,opts),e=>e.code==='context-mismatch');c.destroy();
});
