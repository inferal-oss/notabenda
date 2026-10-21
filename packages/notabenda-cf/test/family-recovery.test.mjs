// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-PROCESSING-CHOICES
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {createRemoteRecoveryControl} from '../../../scripts/fixtures/remote-recovery.mjs';
import assert from 'node:assert/strict';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {exampleConsentConfig} from '../../../examples/static/choices-build.mjs';
import {compileLegalDocuments} from '@notabenda/core/content';
import {recordLegalRelease} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {createDeliverySink} from '../../../examples/processing-application/workspace.mjs';
import {prepareFamilyRecovery} from '../../../scripts/fixtures/family-recovery-data.mjs';
import {createFamilyRecovery,validateFamilyRecoveryJournal} from '../../../scripts/fixtures/family-recovery.mjs';
async function setup(){
 const config=exampleConsentConfig(await fixture({reviewed:true}));config.site.id='family-recovery';config.scopeGuards={version:1,revision:'synthetic-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};for(const s of config.services)s.processingActivities=s.id==='sample-suggestions'?['sale','targeted-advertising']:[];
 const artifact=compileLegalDocuments(config).artifact,data=prepareFamilyRecovery(config,artifact,'2026-10-21T12:00:00.000Z','2026-11-21T12:00:00.000Z'),source=createSyntheticStorage([]),sink=createDeliverySink(createSyntheticStorage([])),options={send:event=>sink.receive(event)};await recordLegalRelease(source,artifact);const current=createFamilyRecovery(source,data,options);await current.seed();assert.equal(await current.initialReady(),true);
 const snapshot=[...(await source.list({prefix:'',limit:1000}))];return {data,source,current,sink,options,snapshot};
}
async function completed(f){await f.current.afterBookmark();let purged;for(let n=0;n<50;n++){purged=await f.current.purge();if(Object.values(purged).every(v=>v.phase==='complete'))break;}assert.ok(Object.values(purged).every(v=>v.phase==='complete'));return f.current.journal();}
async function restore(f){const target=createSyntheticStorage([]);for(const [key,value] of f.snapshot)await target.put(key,value);return {target,restored:createFamilyRecovery(target,f.data,f.options)};}
test('fixed family replay preserves newer withdrawal, recorded opt-out and unconfirmed intent through interruption and purge restart',async()=>{
 const f=await setup();const baseline=await f.current.ordinary('processing-produce');assert.equal(baseline.state,'delivered');assert.equal((await f.sink.observations()).length,1);
 const journal=await completed(f);assert.deepEqual(await f.current.holdProbes(),{terms:true,permissions:true,processing:true});const {target,restored}=await restore(f),before=await restored.summary();
 assert.equal(before.permissionStates['permission-withdrawn'].permitted,true);assert.equal(before.processingHeads['processing-restricted'].revision,0);assert.equal(before.pending['processing-pending'],false);assert.equal(await restored.recoveredReady(journal),false);
 await assert.rejects(restored.replay(journal,{stopAfter:'permission-withdrawal'}),/synthetic-replay-interruption/);const restarted=createFamilyRecovery(target,f.data,f.options);assert.equal(await restarted.recoveredReady(journal),false);await restarted.replay(journal);await restarted.replay(journal);
 assert.equal((await restarted.summary()).processingHeads['processing-pending'].revision,0,'unconfirmed intent does not fabricate a receipt');assert.equal(await restarted.recoveredReady(journal),false);
 await restarted.purge();const again=createFamilyRecovery(target,f.data,f.options);let result;for(let n=0;n<50;n++){result=await again.purge();if(Object.values(result).every(v=>v.phase==='complete'))break;}assert.equal(await again.recoveredReady(journal),true);
 const beforeCheck=[...await target.list({prefix:'',limit:1000})];assert.equal(await again.recoveredReady(journal),true);assert.deepEqual([...await target.list({prefix:'',limit:1000})],beforeCheck,'opening validation must remain read-only');
 const state=await again.summary();for(const [family,ids,heads] of [['permissions',['permission-held','permission-retained'],state.permissionStates],['processing',['processing-held','processing-retained'],state.processingHeads]])for(const id of ids){const key='notabenda/'+family+'/'+f.data.siteId+'/heads/'+heads[id].streamRef,original=await target.get(key);assert.ok(original);await target.delete(key);assert.equal(await again.recoveredReady(journal),false,'missing '+id+' head must prevent reopening');await target.put(key,original);}
 assert.equal(await again.recoveredReady(journal),true);
 const oldGrant=await again.ordinary('permission-old-grant');assert.equal(oldGrant.receipt.action,'grant');assert.equal(oldGrant.state.permitted,false);assert.equal(oldGrant.state.reason,'withdrawn');
 assert.equal((await again.ordinary('processing-produce')).state,'blocked');const jobs=await again.ordinary('processing-dispatch');assert.ok(jobs.every(j=>j.state==='suppressed'&&j.attempts===0));assert.equal((await f.sink.observations()).length,1);
 const erased=await again.ordinary('family-replay-erased');assert.deepEqual(erased.terms,{signup:true,workspace:true});assert.equal(erased.permissions,true);assert.equal(erased.processing.state,'blocked');assert.equal((await f.sink.observations()).length,1);
 assert.equal((await again.ordinary('processing-positive')).state,'delivered');assert.equal((await f.sink.observations()).length,2);assert.deepEqual(await again.holdProbes(),{terms:true,permissions:true,processing:true});
});
test('fixed family journal rejects missing, duplicated and substituted decisions before replay touches storage',async()=>{
 const f=await setup(),journal=await completed(f);
 for(const change of [j=>j.intents.pop(),j=>j.intents.push(j.intents[0]),j=>j.intents[0].target='someone-else',j=>j.retirements.terms.family='permissions',j=>j.retirements.processing.contextRef='a'.repeat(64),j=>delete j.retirements.permissions,j=>j.outcomes.processingRestriction.receipt.provenance='gpc-header',j=>j.outcomes.unconfirmed=false]){const wrong=structuredClone(journal);change(wrong);assert.throws(()=>validateFamilyRecoveryJournal(wrong,f.data),/wrong-family-journal/);const {target,restored}=await restore(f),before=[...await target.list({prefix:'',limit:1000})];await assert.rejects(restored.replay(wrong));assert.deepEqual([...await target.list({prefix:'',limit:1000})],before);}
});

test('external control requires captured intents and the exact sealed family journal before accepting recovery',async()=>{
 const f=await setup(),complete=await completed(f),base={runId:randomUUID(),siteId:f.data.siteId,erasedRef:'a'.repeat(64),decision:{requestId:randomUUID()},laterHold:{id:randomUUID(),target:'new-held-context',active:true,reviewAt:f.data.reviewAt},families:f.data};
 const control=createRemoteRecoveryControl(createSyntheticStorage([]),base);await control.run('bookmark','synthetic-bookmark');await control.run('open-initial');await control.run('close');
 const journal={hold:base.laterHold,retirement:{retirement:{requestId:base.decision.requestId},contextRef:base.erasedRef,siteId:base.siteId,family:'consent',phase:'complete',hold:{active:false}},families:complete};
 await assert.rejects(control.run('journal',journal),/wrong-family-journal/);await assert.rejects(control.run('family-source-journal',complete),/family-journal-not-allowed/);
 const duplicated=[...f.data.intents,f.data.intents[0]];await assert.rejects(control.run('family-intents',duplicated),/family-intents-not-allowed/);await control.run('family-intents',f.data.intents);await control.run('family-source-journal',complete);
 for(const change of [j=>delete j.families,j=>j.families.intents.pop(),j=>j.families.intents.push(j.families.intents[0]),j=>j.families.outcomes.processingRestriction.receipt.recordedAt='2030-01-01T00:00:00.000Z',j=>j.families.retirements.terms.progress.deleted=100]){const wrong=structuredClone(journal);change(wrong);await assert.rejects(control.run('journal',wrong),/wrong-family-journal/);assert.equal((await control.run('state')).journal,null);}
 const saved=await control.run('journal',journal);assert.deepEqual(saved.familyIntents,f.data.intents);assert.deepEqual(saved.familyJournal,JSON.parse(JSON.stringify(complete)));assert.equal(Buffer.byteLength(JSON.stringify({action:'journal',payload:journal}))<16384,true,'actual fixed journal fits the HTTP boundary');
 await control.run('restore-intent',{epoch:1,bookmark:'synthetic-bookmark',undoBookmark:'synthetic-undo'});await assert.rejects(control.run('family-intents',f.data.intents),/family-intents-not-allowed/);await assert.rejects(control.run('family-source-journal',complete),/family-journal-not-allowed/);
});
