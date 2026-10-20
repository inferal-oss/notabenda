// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY REQ-PRODUCT-EVIDENCE-LIFECYCLE
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRemoteRecoveryControl,createRemoteRecoveryEvidence,createRemoteRecoveryHandler} from '../../../scripts/fixtures/remote-recovery.mjs';
import {parseRemoteRecoveryArgs,checkRunIdentity,sourceBodyIdentity,reconcileOwnership,cleanup} from '../../../scripts/check-cf-remote-recovery.mjs';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {randomUUID,createHash} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const data={runId:randomUUID(),siteId:'synthetic',scopeId:'recovery',erasedRef:'a'.repeat(64),decision:{requestId:randomUUID()},laterHold:{id:randomUUID(),target:'new-held-context',active:true,reviewAt:'2026-12-01T00:00:00.000Z'}};
async function readyControl(){const storage=createSyntheticStorage([]),control=createRemoteRecoveryControl(storage,data);await control.run('bookmark','bookmark-one');await control.run('open-initial');await control.run('close');return {control,storage};}
const journal=()=>({hold:structuredClone(data.laterHold),retirement:{retirement:{requestId:data.decision.requestId},contextRef:data.erasedRef,siteId:data.siteId,family:'consent',phase:'complete',hold:{active:false}}});
test('external gate begins closed, retains monotonic recovery epochs and refuses premature state transitions',async()=>{
 const control=createRemoteRecoveryControl(createSyntheticStorage([]),data);assert.equal((await control.run('state')).phase,'closed');await assert.rejects(()=>control.run('open-recovered',{epoch:0}),/recovery-open-not-allowed/);await assert.rejects(()=>control.run('open-initial'),/initial-open-not-allowed/);
 await control.run('bookmark','bookmark-one');await control.run('open-initial');assert.equal((await control.run('state')).phase,'open');const closed=await control.run('close');assert.equal(closed.epoch,1);assert.deepEqual(await control.run('close'),closed);await assert.rejects(()=>control.run('open-initial'),/initial-open-not-allowed/);await assert.rejects(()=>control.run('bookmark','another'),/bookmark-not-allowed/);
});
test('journal pins the fixed later hold and retirement target, rejecting substitution before writes',async()=>{
 const {control}=await readyControl();for(const change of [v=>v.hold.target='unrelated',v=>v.retirement.contextRef='b'.repeat(64),v=>v.retirement.retirement.requestId=randomUUID(),v=>v.retirement.phase='purging',v=>v.retirement.siteId='other',v=>v.retirement.hold.active=true]){const value=journal();change(value);await assert.rejects(()=>control.run('journal',value),/wrong-journal/);assert.equal((await control.run('state')).journal,null);}
 const saved=await control.run('journal',journal());assert.match(saved.journalDigest,/^[a-f0-9]{64}$/);assert.deepEqual(await control.run('journal',journal()),saved);const changed=journal();changed.retirement.extra='changed';await assert.rejects(()=>control.run('journal',changed),/journal-conflict/);
});
test('restore intent is recorded externally once and binds bookmark, epoch and journal digest',async()=>{
 const {control}=await readyControl();await control.run('journal',journal());for(const v of [{epoch:0,bookmark:'bookmark-one',undoBookmark:'undo'},{epoch:1,bookmark:'another',undoBookmark:'undo'},{epoch:1,bookmark:'bookmark-one',undoBookmark:''}])await assert.rejects(()=>control.run('restore-intent',v),/restore-not-allowed/);
 const saved=await control.run('restore-intent',{epoch:1,bookmark:'bookmark-one',undoBookmark:'undo'});assert.equal(saved.restoreIntent.journalDigest,saved.journalDigest);await assert.rejects(()=>control.run('restore-intent',{epoch:1,bookmark:'bookmark-one',undoBookmark:'undo'}),/restore-not-allowed/);await assert.rejects(()=>control.run('open-recovered',{epoch:1,journalDigest:'bad'}),/recovery-open-not-allowed/);assert.equal((await control.run('restart')).restarts,1);
});
test('all ordinary target RPCs check the external closed gate before touching evidence storage',async()=>{
 let touched=0;const evidence=createRemoteRecoveryEvidence({storage:new Proxy({},{get(){touched++;throw Error('Evidence must remain inaccessible');}}),blockConcurrencyWhile:callback=>callback()},{command:async()=>({ok:true,value:{phase:'closed'}})},data);
 for(const action of ['inspect','archive-write','grant'])assert.deepEqual(await evidence.command(action),{ok:false,error:'recovery-closed'});assert.equal(touched,0);
});
test('closing the external gate then enqueuing maintenance drains an admitted read and blocks queued ordinary work',async()=>{
 let gate='open',release,entered;const started=new Promise(done=>entered=done),barrier=new Promise(done=>release=done),raw=createSyntheticStorage([]);let sqlReads=0;
 const storage={...raw,get:async key=>{if(key==='notabenda/releases/'+'a'.repeat(64)){entered();await barrier;}return raw.get(key);},sql:{exec(){sqlReads++;return [];}}};let tail=Promise.resolve();const ctx={storage,blockConcurrencyWhile(callback){const result=tail.then(callback);tail=result.catch(()=>{});return result;}};
 const evidence=createRemoteRecoveryEvidence(ctx,{command:async()=>({ok:true,value:{phase:gate}})},{...data,authoredId:'a'.repeat(64),streams:[]});const reading=evidence.command('inspect');await started;gate='closed';const maintenance=evidence.command('summary'),blocked=evidence.command('archive-write');await new Promise(done=>setImmediate(done));assert.equal(sqlReads,0);release();assert.equal((await reading).ok,true);assert.equal((await maintenance).value.control.phase,'closed');assert.equal(sqlReads,1);assert.deepEqual(await blocked,{ok:false,error:'recovery-closed'});
});
test('remote HTTP authentication and fixed routing precede object selection or body-driven operations',async()=>{
 const host=createRemoteRecoveryHandler(data),key='c'.repeat(64),lookups=[];const env={FIXTURE_KEY:key,CONTROL:{getByName(name){lookups.push(name);return {command:async action=>({ok:true,value:{action}})};}},EVIDENCE:{getByName(){throw Error('Unexpected evidence lookup');}}};
 const request=(body,auth='Bearer '+key)=>new Request('https://fixture.example.test/rehearse',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body});
 for(const auth of ['', 'Bearer wrong'])assert.equal((await host.fetch(request('{broken',auth),env)).status,403);for(const body of ['{broken',JSON.stringify({action:'open-recovered'}),JSON.stringify({action:'state',target:'production'}),'x'.repeat(16385)])assert.equal((await host.fetch(request(body),env)).status,400);assert.deepEqual(lookups,[]);
 const response=await host.fetch(request(JSON.stringify({action:'state'})),env);assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.deepEqual(lookups,['control:'+data.runId]);assert.deepEqual(await response.json(),{ok:true,value:{action:'state'}});
});
test('remote invocation requires explicit run/account or original cleanup identity',()=>{
 assert.deepEqual(parseRemoteRecoveryArgs(['--help']),{help:true});for(const args of [[],['--run'],['--account-id','a'.repeat(32)],['--run','--account-id','other'],['--run','--account-id','a'.repeat(32),'--name','production']])assert.throws(()=>parseRemoteRecoveryArgs(args));assert.equal(parseRemoteRecoveryArgs(['--run','--account-id','a'.repeat(32)]).accountId,'a'.repeat(32));
 const runId=randomUUID(),run={schemaVersion:1,kind:'notabenda-remote-recovery-run',accountId:'a'.repeat(32),runId,workerName:'notabenda-recovery-'+runId.replaceAll('-','').slice(0,16)};assert.deepEqual(checkRunIdentity(run),run);assert.throws(()=>checkRunIdentity({...run,workerName:'notabenda-site'}));assert.throws(()=>checkRunIdentity({...run,runId:'-'.repeat(36),workerName:'notabenda-recovery-'}));
});

test('source attestation hashes a single module independently of multipart boundaries and rejects extra modules',async()=>{
 const source='export default {};',make=extra=>{const form=new FormData();form.append('metadata','{}');form.append('worker.js',new Blob([source]),'worker.js');if(extra)form.append('extra.js',new Blob(['extra']),'extra.js');return new Response(form);};const one=await sourceBodyIdentity(make()),two=await sourceBodyIdentity(make());assert.deepEqual(one,two);assert.equal(one.sha256,createHash('sha256').update(source).digest('hex'));await assert.rejects(()=>sourceBodyIdentity(make(true)),/Unexpected rehearsal source/);
});
test('uncertain deployments recover exact ownership, preserve namespace identities and refuse outside changes',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-remote-ownership-'));try{
  const runId=randomUUID(),code='export const run='+JSON.stringify(runId)+';',run={schemaVersion:1,kind:'notabenda-remote-recovery-run',accountId:'a'.repeat(32),runId,workerName:'notabenda-recovery-'+runId.replaceAll('-','').slice(0,16),stage:'deploying',preflightAbsent:true,expectedSourceSha256:createHash('sha256').update(code).digest('hex')};let live={id:run.workerName,tag:'unique-script',modified_on:'one'},rows=[{id:'namespace-one',script:run.workerName,class:'RecoveryControl',use_sqlite:true}];
  const api=async path=>path==='/workers/scripts'?{result:live?[live]:[]}:{result:rows,result_info:{total_pages:1}};api.source=async()=>({sha256:run.expectedSourceSha256,text:code});assert.equal((await reconcileOwnership(directory,run,api)).live,true);assert.equal(run.workerTag,'unique-script');assert.equal(JSON.parse(await readFile(join(directory,'run.private.json'),'utf8')).namespaces[0].id,'namespace-one');
  run.stage='deployed';live={...live,modified_on:'outside'};await assert.rejects(()=>reconcileOwnership(directory,run,api),/Worker changed/);run.stage='secret-updating';await reconcileOwnership(directory,run,api);assert.equal(run.workerModifiedOn,'outside');run.stage='cleanup-started';rows=[];run.cleanupSourceSha256=run.expectedSourceSha256;await reconcileOwnership(directory,run,api);assert.equal(run.namespaces.length,1);
  live=undefined;rows=[{id:'namespace-one',script:'transferred-outside',class:'RecoveryControl',use_sqlite:true}];await assert.rejects(()=>cleanup(directory,run,api),/changed ownership/);assert.equal(run.cleanup,undefined);
  rows=[];await cleanup(directory,run,api);assert.equal(run.cleanup.verified,true);
 }finally{await rm(directory,{recursive:true,force:true});}
});
