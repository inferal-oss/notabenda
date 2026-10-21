// @requirements REQ-PRODUCT-CONSENT-NOTICE-FILES
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-RETAINED-RELEASES REQ-PRODUCT-CONSENT-RUNTIME
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {formatConfigSource} from '@notabenda/core/config/document';
import {createConsentRuntime} from '@notabenda/core/consent';
import {requiredConsentEvidence} from '@notabenda/core/consent/evidence';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,getConsentRecordingSelection,recordConsentChoice,getConsentHead} from '@notabenda/cloudflare';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {createSyntheticStorage} from '../examples/synthetic.mjs';

test('CLI-built YAML runtime and notice register in the CF ledger and gate actual service lifecycle on its receipt',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-cli-ledger-'));let controller;
 try{
  const config=await fixture({reviewed:true});config.storage=[];config.services=[{id:'metrics',name:'Usage counts',provider:'Example provider',purposeIds:[config.purposes[0].id],location:'This browser'}];config.consent={purposes:[{id:config.purposes[0].id,scope:'purpose-one'}],services:[{id:'metrics',scope:'service-one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:15};await writeFile(join(cwd,'site.yaml'),await formatConfigSource(config,'yaml'));
  const result=spawnSync(process.execPath,[new URL('../../notabenda/dist/cli.js',import.meta.url).pathname,'build','--config','site.yaml','--consent-runtime','required','--consent-scope','cookie-choices','--out-dir','public'],{cwd,encoding:'utf8',timeout:15000});assert.equal(result.status,0,result.stderr);
  const notice=JSON.parse(await readFile(join(cwd,'public','consent-notice.json'),'utf8')),artifact=JSON.parse(await readFile(join(cwd,'public','artifacts',notice.artifactId+'.json'),'utf8')),descriptor=JSON.parse(await readFile(join(cwd,'public','consent-runtime.json'),'utf8')),storage=createSyntheticStorage([]),instant=Date.parse('2026-10-20T12:00:00Z'),context={siteId:config.site.id,scopeId:notice.scopeId,streamId:'host-owned-test-stream',now:()=>new Date(instant)};
  await recordLegalRelease(storage,artifact);assert.equal((await registerConsentNotice(storage,notice,context)).created,true);assert.equal((await getConsentRecordingSelection(storage,context)).status,'unconfigured');await setActiveConsentNotice(storage,notice.noticeId,context);assert.equal((await getConsentRecordingSelection(storage,context)).selected.id,notice.noticeId);
  const bootstrap=await getConsentHead(storage,context),values=new Map();let releaseWrite;const gate=new Promise(resolve=>{releaseWrite=resolve;});
  controller=createConsentRuntime(descriptor,{now:()=>instant,storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}},{evidence:requiredConsentEvidence({notice,streamRef:bootstrap.streamRef,read:()=>getConsentHead(storage,context),write:async command=>{await gate;return recordConsentChoice(storage,command,context);}})});
  let starts=0,stops=0;controller.registerService('metrics',{purposes:[config.purposes[0].id],start(){starts++;return ()=>{stops++;};}});await controller.settled();assert.equal(starts,0);controller.acceptAll();await new Promise(resolve=>setImmediate(resolve));assert.equal(starts,0);releaseWrite();await controller.settled();assert.equal(starts,1);assert.equal(controller.getSnapshot().evidence.status,'recorded');controller.rejectAll();assert.equal(controller.isServiceAllowed('metrics'),false);await controller.settled();assert.equal(stops,1);assert.equal((await getConsentHead(storage,context)).event.choices[config.purposes[0].id],false);
 }finally{controller?.destroy();await rm(cwd,{recursive:true,force:true});}
});
