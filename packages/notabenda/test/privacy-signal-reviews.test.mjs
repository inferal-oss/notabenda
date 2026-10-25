import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-US-OR-GPC REQ-US-MN-GPC REQ-US-TX-AGENT-SIGNALS REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {hasGlobalPrivacyControl,getPrivacySignalRestrictions,createProcessingChoices,toPublicConfig} from '@notabenda/core';
import {compileLegalDocuments,createProcessingNotice} from '@notabenda/core/content';
import {recordLegalRelease,registerProcessingNotice,getProcessingHead,recordProcessingRestriction} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {describeIntegration} from '@notabenda/core/integration';
import {createSetupPlan,readSetupAnswers} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {fixture} from './helpers.mjs';

const answers=()=>({schemaVersion:1,markets:[],answers:{}});
const reviews=()=>describeIntegration(['processing-opt-outs']).privacySignalReviews;
const regional=plan=>plan.report.recommendations.filter(r=>r.id.startsWith('privacy-signal-US-'));
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
async function inventory(){
  const c=await fixture({reviewed:true}),purpose=c.purposes[0].id;c.purposes=[c.purposes[0]];c.storage=[];
  c.services=[{id:'ad-service',name:'Fictional advertising',provider:'Fictional provider',location:'Synthetic test',purposeIds:[purpose],processingActivities:['sale','targeted-advertising']},{id:'local-tool',name:'Local tool',provider:'Fictional operator',location:'This browser',purposeIds:[purpose],processingActivities:[]}];
  c.consent={purposes:[{id:purpose,scope:'one'}],services:c.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
  c.privacySignals={globalPrivacyControl:{appliesTo:['sale','targeted-advertising'],explanation:'Synthetic policy: GPC restricts the declared sale and targeted-advertising services. Host account restrictions are applied separately.'}};
  return {c,purpose};
}

test('agent research resolves to read primary sources, partial requirements and exact dates',async()=>{
  const r=reviews(),catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8'));
  assert.equal(r.advisoryOnly,true);assert.equal(r.determinesApplicability,false);assert.equal(r.activatesPolicy,false);assert.equal(r.legalReviewStatus,'unreviewed');
  for(const source of r.sources){const authoritative=catalog.sources.find(s=>s.id===source.id);assert.ok(authoritative);assert.deepEqual(source,Object.fromEntries(Object.keys(source).map(key=>[key,authoritative[key]])));}
  assert.deepEqual(r.items.map(i=>[i.marketId,i.effectiveFrom]),[['US-TX','2025-01-01'],['US-OR','2026-01-01'],['US-MN','2025-07-31']]);
  for(const item of r.items){
    assert.deepEqual(item.processingActivities,['sale','targeted-advertising']);
    for(const id of item.requirementIds){const req=catalog.requirements.find(v=>v.id===id);assert.equal(req.jurisdiction,item.marketId);assert.equal(req.implementationStatus,'partial');assert.equal(req.legalReviewStatus,'unreviewed');assert.equal(req.effectiveFrom,item.effectiveFrom);assert.deepEqual(req.sourceRefs.map(v=>v.sourceId),item.sourceIds);}
    for(const id of item.sourceIds){const source=catalog.sources.find(v=>v.id===id);assert.equal(source.access,'read');assert.equal(source.checkedOn,item.checkedOn);assert.notEqual(source.kind,'secondary-explainer');}
  }
  assert.match(r.items.find(i=>i.marketId==='US-OR').limits.join(' '),/statute was not retrieved/);assert.match(r.items.find(i=>i.marketId==='US-MN').applicabilityChecks.join(' '),/2029/);
  r.items[0].sourceIds.push('mutated');r.hostChecks.length=0;assert.equal(reviews().items[0].sourceIds.includes('mutated'),false);assert.ok(reviews().hostChecks.length);
});

test('coverage interest and imported jurisdictions advise without changing configuration or overriding declared no',async()=>{
  for(const item of reviews().items)for(const imported of [false,true]){
    const c=await fixture({reviewed:true}),a=answers();if(imported)c.jurisdictions=[item.marketId];else a.markets=[item.marketId];
    a.answers['browser-opt-out-signals']={choice:'no',justification:'Private assessment still needs review.'};const before=structuredClone(c),original=structuredClone(a);
    const plan=createSetupPlan(a,{config:c,preserveConfig:true});assert.deepEqual(plan.config,toPublicConfig(before,{mode:'preview'}));assert.deepEqual(c,before);assert.deepEqual(a,original);
    assert.equal(plan.config.privacySignals,undefined);assert.equal(plan.report.productionReady,false);assert.equal(regional(plan).length,1);assert.deepEqual(regional(plan)[0].requirementIds,item.requirementIds);assert.match(regional(plan)[0].reason,new RegExp(reviews().revision.replaceAll('.','\\.')));
    assert.equal(plan.report.recommendations.find(r=>r.id==='browser-opt-out-signals').status,'declared-no');assert.ok(plan.report.reviewItems.some(v=>v.includes(item.label+':')));
  }
  assert.deepEqual(regional(createSetupPlan(answers())),[]);
});

test('explicit policy survives review; research revisions do not rewrite saved questionnaire facts',async()=>{
  const {c}=await inventory();c.jurisdictions=['US-OR','US-MN'];const a=answers(),before=structuredClone(c),plan=createSetupPlan(a,{config:c,preserveConfig:true});
  assert.deepEqual(plan.config,toPublicConfig(before,{mode:'preview'}));assert.equal(regional(plan).length,2);assert.equal(plan.report.questionnaireVersion,'8');
  const historical={schemaVersion:1,kind:'private-setup-report',questionnaireVersion:'8',answers:a,recommendations:[{id:'old-advice',reason:'Historical text'}]},saved=JSON.stringify(historical);
  const resumed=createSetupPlan(readSetupAnswers(historical),{config:c,preserveConfig:true});assert.equal(regional(resumed).length,2);assert.equal(JSON.stringify(historical),saved);assert.deepEqual(resumed.config,toPublicConfig(before,{mode:'preview'}));
  for(const version of ['1','7'])assert.deepEqual(readSetupAnswers({...historical,questionnaireVersion:version}),readSetupAnswers(historical));
});

test('CLI describe and wizard carry the same reviewed-market advice and keep private notes private',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'notabenda-signal-review-'));
  try{
    const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8'});
    const describe=run('describe','processing-opt-outs','--json');assert.equal(describe.status,0,describe.stderr);const ref=JSON.parse(describe.stdout);assert.deepEqual(ref.privacySignalReviews,reviews());
    assert.equal(ref.privacySignalReviews.mechanism.requiresLogin,false);assert.equal(ref.privacySignalReviews.mechanism.requiresReceiptStorage,false);assert.match(ref.targets.find(t=>t.id==='processing-opt-outs').hostWork.join(' '),/hasGlobalPrivacyControl\(request\)/);
    const a=answers();a.markets=['US-OR','US-MN'];a.answers['browser-opt-out-signals']={choice:'unknown',justification:'private-regional-note'};await writeFile(join(dir,'answers.json'),JSON.stringify(a));
    const result=run('wizard','--answers','answers.json');assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/private-regional-note/);
    const config=JSON.parse(await readFile(join(dir,'notabenda-setup/notabenda.config.json'),'utf8')),report=JSON.parse(await readFile(join(dir,'notabenda-setup/setup.private.json'),'utf8'));
    assert.deepEqual(report.recommendations.filter(r=>r.id.startsWith('privacy-signal-US-')),regional(createSetupPlan(a)));assert.equal(config.privacySignals,undefined);assert.deepEqual(config.jurisdictions,[]);assert.doesNotMatch(JSON.stringify(config),/private-regional-note/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('browser setup exposes the researched market choices and regenerates the same advisory review',()=>{
  const dom=new JSDOM('<main></main>',{url:'https://operator.example.test/setup'}),root=dom.window.document.querySelector('main');dom.window.URL.createObjectURL=()=> 'blob:synthetic-signal-review';dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(root);
  try{
    for(const label of ['Texas','Oregon','Minnesota']){const node=[...root.querySelectorAll('.nb-setup-markets label')].find(n=>n.textContent===label);assert.ok(node);node.querySelector('input').click();}
    root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));const plan=ui.getPlan();assert.equal(regional(plan).length,3);assert.equal(plan.config.privacySignals,undefined);assert.deepEqual(plan.config.jurisdictions,[]);assert.match(root.querySelector('[aria-label="Setup recommendations"]').textContent,/Review Oregon universal opt-outs/);assert.match(root.textContent,/Review Minnesota universal opt-outs/);assert.match(root.textContent,/Review Texas authorized-agent opt-outs/);
  }finally{ui.destroy();dom.window.close();}
});

test('explicit two-activity policy blocks browser and server producers without login or receipt storage',async()=>{
  for(const {marketId} of reviews().items){
    const {c,purpose}=await inventory();c.jurisdictions=[marketId];const events=[],controller=createConsent(c,{storage:memory(),schedule:()=>()=>{},globalPrivacyControl:()=>true});
    try{
      for(const id of ['ad-service','local-tool'])controller.registerService(id,{purposes:[purpose],start(){events.push(id);}});
      controller.acceptAll();await controller.settled();assert.equal(controller.getSnapshot().permissions[purpose],true);assert.equal(controller.getSnapshot().evidence,undefined);assert.deepEqual(events,['local-tool']);
      const request=new Request('https://fictional.example.test/export',{headers:{'Sec-GPC':'1'}}),restricted=getPrivacySignalRestrictions(c,{globalPrivacyControl:hasGlobalPrivacyControl(request)});let providerCalls=0;
      if(!Object.hasOwn(restricted.restrictedServices,'ad-service'))providerCalls++;
      assert.equal(providerCalls,0);assert.deepEqual(restricted.restrictedServices['ad-service'],['sale','targeted-advertising']);
    }finally{controller.destroy();await controller.settled();}
  }
});

test('no signal grants nothing and cannot clear a separately retained processing restriction',async()=>{
  const {c,purpose}=await inventory(),build=compileLegalDocuments(c),notice=createProcessingNotice(build.artifact,{scopeId:'signal-review',activities:['sale','targeted-advertising'],wording:{title:'Processing choices',description:'Synthetic independent restriction.',actionLabel:'Opt out'}}),storage=createSyntheticStorage([]),context={siteId:c.site.id,scopeId:notice.scopeId,streamId:'synthetic-existing-restriction',provenance:'explicit-opt-out',now:()=>new Date('2026-10-20T12:00:00Z')};
  await recordLegalRelease(storage,build.artifact);await registerProcessingNotice(storage,notice,context);await recordProcessingRestriction(storage,{schemaVersion:1,noticeId:notice.noticeId,requestId:crypto.randomUUID(),activities:['sale']},context);const head=await getProcessingHead(storage,context);
  const processing=createProcessingChoices(notice,{streamRef:head.streamRef,read:()=>getProcessingHead(storage,context),submit:()=>{throw Error('No new request expected');}},{storage:memory()});await processing.settled();
  const controller=createConsent(c,{storage:memory(),schedule:()=>()=>{},globalPrivacyControl:()=>false},{processingChoices:processing});
  try{assert.equal(controller.getSnapshot().permissions[purpose],false);controller.acceptAll();await controller.settled();assert.equal(controller.isServiceAllowed('ad-service'),false);assert.equal(controller.isServiceAllowed('local-tool'),true);assert.equal((await getProcessingHead(storage,context)).revision,1);assert.deepEqual(processing.getSnapshot().blockedActivities,['sale']);}finally{controller.destroy();processing.destroy();}
});


test('Texas generated advice distinguishes statutory qualification and commencement from toolkit dependencies',async()=>{
 const a=answers();a.markets=['US-TX'];a.answers['browser-opt-out-signals']={choice:'no',justification:'A private practice statement, not a legal scope finding.'};const plan=createSetupPlan(a),r=reviews(),texas=r.items.find(i=>i.marketId==='US-TX'),text=plan.report.reviewItems.join(' ');
 assert.equal(texas.effectiveFrom,'2025-01-01');assert.match(texas.summary,/541.055\(e\)/);assert.match(texas.summary,/January 2025/);assert.match(r.mechanism.dependencyScope,/Toolkit execution dependencies only/);assert.equal(r.mechanism.requiresLogin,false);assert.equal(r.mechanism.requiresReceiptStorage,false);
 for(const term of ['commercially reasonable effort','identity','agent-authority','residency','four request exceptions','non-default affirmative choice','existing account','request qualification remains separate'])assert.ok(text.includes(term),term);
 assert.doesNotMatch(text,/Do not wait for login|GPC is approved|GPC is certified|July 2026|July 1, 2026/);assert.match(text,/Toolkit execution without login is not a Texas no-authentication rule/);assert.equal(regional(plan).length,1);assert.equal(regional(plan)[0].guide,'privacy-signals#texas-agent-requests-through-technology');assert.equal(plan.config.privacySignals,undefined);assert.deepEqual(plan.config.jurisdictions,[]);assert.equal(plan.report.questionnaireVersion,'8');
 const catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8')),req=catalog.requirements.find(x=>x.id==='REQ-US-TX-AGENT-SIGNALS');assert.deepEqual(req.discoverySourceIds,['SRC-IUB-US-STANDARDS']);assert.equal(catalog.sources.find(x=>x.id===req.discoverySourceIds[0]).kind,'secondary-explainer');assert.match(catalog.sources.find(x=>x.id==='SRC-US-TX-CODE').note,/browser-read/);
});

test('a Texas market label and observed GPC activate no policy or classifications',async()=>{
 const {c,purpose}=await inventory();c.jurisdictions=['US-TX'];delete c.privacySignals;const before=structuredClone(c),started=[],controller=createConsent(c,{storage:memory(),schedule:()=>()=>{},globalPrivacyControl:()=>true});
 try{for(const id of ['ad-service','local-tool'])controller.registerService(id,{purposes:[purpose],start(){started.push(id);}});assert.equal(controller.getSnapshot().permissions[purpose],false);controller.acceptAll();await controller.settled();assert.deepEqual(started,['ad-service','local-tool']);assert.equal(controller.getSnapshot().privacySignals,undefined);assert.deepEqual(c,before);assert.equal(getPrivacySignalRestrictions(c,{globalPrivacyControl:true}),undefined);}finally{controller.destroy();await controller.settled();}
});
