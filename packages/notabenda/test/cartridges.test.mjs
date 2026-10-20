// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-SETUP REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {cartridgeLibrary,selectCartridges,normalizeCartridgeSelection,planCartridges,createCartridgeSetupPlan,readCartridgeSelection,formatCartridgeBrief} from '@notabenda/core/cartridges';
import {mountSetup} from '@notabenda/core/setup/ui';
import {readSetupAnswers} from '@notabenda/core/setup';
import {fixture} from './helpers.mjs';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;

test('cartridges resolve existing job contracts and supporting work without activation or invented answers',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8')),ids=new Set(catalog.requirements.map(r=>r.id));
 const library=cartridgeLibrary();assert.deepEqual(library.filter(c=>c.shelf==='basics').map(c=>c.id),['privacy-pages','cookie-choices','terms-agreement']);
 for(const c of library){for(const id of c.requirements)assert.ok(ids.has(id));const plan=planCartridges(selectCartridges([c.id]));assert.deepEqual(plan.reference.requestedTargetIds,[...c.targetIds]);assert.equal(plan.boundaries.activatesFeatures,false);for(const answer of Object.values(plan.reference.targetAnswersTemplate.answers))assert.deepEqual(answer,{choice:'unknown',justification:''});}
 const plan=planCartridges(selectCartridges(['gated-media','terms-agreement']));assert.deepEqual(plan.supportingWork.map(s=>s.id),['legal-pages','cookie-consent']);assert.equal(plan.cartridges.length,2);assert.equal(plan.reference.targets.find(t=>t.id==='legal-pages').selection,'prerequisite');
 const empty=planCartridges(selectCartridges([]));assert.deepEqual(empty.reference.targets,[]);assert.equal(empty.state,'choose-cartridges');assert.throws(()=>formatCartridgeBrief(empty.selection));
 const firstTitle=library[0].title;library[0].title='mutated';assert.equal(cartridgeLibrary()[0].title,firstTitle);plan.reference.targets[0].title='mutated';assert.notEqual(planCartridges(selectCartridges(['privacy-pages'])).reference.targets[0].title,'mutated');
});

test('regional cartridges retain distinct installed policy fields and do not enable either policy',()=>{
 const selection=selectCartridges(['ie-consent-duration','it-repeat-prompts']),plan=planCartridges(selection),draft=createCartridgeSetupPlan(selection,plan.reference.targetAnswersTemplate);
 assert.deepEqual(plan.policyProposals.map(p=>[p.path,p.profile,p.applied]),[['consent.grantExpiryPolicy','ie-dpc-six-month-default',false],['consent.promptPolicy','it-garante-2021',false]]);
 assert.deepEqual(plan.policyProposals[1].requiredFields,['profile','processingRevision']);assert.equal(draft.config.consent,undefined);assert.deepEqual(draft.report.answers.markets,[]);
 const brief=formatCartridgeBrief(selection);assert.match(brief,/processingRevision/u);assert.match(brief,/Selection has not enabled it/u);assert.doesNotMatch(brief,/it-six-month/u);
});

test('selections reject unknown IDs/revisions, executable properties, sparse arrays and hidden extras',()=>{
 const valid=selectCartridges(['cookie-choices']);assert.deepEqual(normalizeCartridgeSelection(valid),valid);
 for(const input of [null,[],{},Object.create(valid),{...valid,extra:true},{...valid,[Symbol('extra')]:true},{...valid,schemaVersion:2},{...valid,selected:[{id:'cookie-choices',revision:'2'}]},{...valid,selected:[{id:'unknown',revision:'1'}]},{...valid,selected:[...valid.selected,...valid.selected]}])assert.throws(()=>normalizeCartridgeSelection(input));
 let reads=0;const accessor={schemaVersion:1,get selected(){reads++;return []}};assert.throws(()=>normalizeCartridgeSelection(accessor));
 const list=['cookie-choices'];Object.defineProperty(list,'0',{get(){reads++;return 'cookie-choices'}});assert.throws(()=>selectCartridges(list));assert.equal(reads,0);
 const extra=structuredClone(valid);Object.defineProperty(extra,'hidden',{value:true});assert.throws(()=>normalizeCartridgeSelection(extra));assert.throws(()=>selectCartridges(Array(1)));assert.throws(()=>selectCartridges(['privacy-pages','privacy-pages']));
});

test('private report resume preserves cartridge revisions and existing runtime while unrelated answers stay unresolved',async()=>{
 const config=await fixture(),before=structuredClone(config),selection=selectCartridges(['terms-agreement']);
 const answers=planCartridges(selection).reference.targetAnswersTemplate;answers.answers['terms-agreement']={choice:'yes',justification:'PRIVATE workflow reason'};
 const plan=createCartridgeSetupPlan(selection,answers,{config});assert.deepEqual(plan.report.cartridges,selection);assert.deepEqual(config,before);assert.deepEqual(plan.config.services,config.services);assert.deepEqual(plan.config.consent,config.consent);
 assert.equal(plan.report.answers.answers['consumer-payments'],undefined);assert.equal(plan.report.recommendations.find(r=>r.id==='consumer-payments').status,'investigate');assert.equal(plan.report.productionReady,false);
 const resumed=createCartridgeSetupPlan(readCartridgeSelection(plan.report),readSetupAnswers(plan.report),{config:plan.config});assert.deepEqual(resumed.report.cartridges,selection);assert.equal(resumed.report.answers.answers['terms-agreement'].justification,'PRIVATE workflow reason');
 assert.doesNotMatch(JSON.stringify(plan.config),/PRIVATE workflow reason|cartridges/u);assert.equal(readCartridgeSelection({schemaVersion:1,markets:[],answers:{}}),undefined);
});

test('focused setup shows selected facts, retains pending input and exports the same scoped draft',()=>{
 const selection=selectCartridges(['terms-agreement']),scope=planCartridges(selection),dom=new JSDOM('<main></main>',{url:'https://host.example.test/setup'});dom.window.URL.createObjectURL=()=> 'blob:example';dom.window.URL.revokeObjectURL=()=>{};
 const root=dom.window.document.querySelector('main'),ui=mountSetup(root,{cartridges:selection});
 try{
  assert.equal(root.querySelectorAll('.nb-setup-step:not([hidden])').length,4);assert.equal(root.querySelector('[aria-current=step] .nb-setup-step-number').textContent,'01');assert.equal(root.querySelector('[aria-current=step] strong').textContent,'Site');
  const visible=[...root.querySelectorAll('[data-question]')].filter(c=>!c.hidden).map(c=>c.dataset.question);assert.deepEqual(new Set(visible),new Set(scope.reference.relevantQuestionIds));assert.ok(!visible.includes('consumer-payments'));assert.equal(root.querySelector('[data-question="terms-agreement"] input[value=unknown]').checked,true);
  const input=[...root.querySelectorAll('input')].find(el=>el.type==='email');input.value='pending@';
  const pending=ui.getDraft();assert.equal(pending.report.answers.publicFacts.controllerEmail,'pending@');assert.equal(pending.report.answers.answers['consumer-payments'].choice,'unknown');assert.deepEqual(pending.report.cartridges,selection);assert.equal(ui.getPlan(),null);
  input.value='privacy@example.test';root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));const result=ui.getPlan();assert.ok(result);assert.deepEqual(result.report.cartridges,selection);assert.ok(root.querySelector('.nb-setup-agent-handoff button'));assert.equal(root.querySelectorAll('a[download]').length,2);
  const saved=ui.getDraft();saved.report.answers.publicFacts.controllerEmail='mutated';assert.equal(ui.getDraft().report.answers.publicFacts.controllerEmail,'privacy@example.test');ui.setCartridges(selectCartridges(['privacy-pages']));assert.equal(ui.getPlan(),null);assert.equal(root.querySelector('button[type=submit]').hidden,false);
 }finally{ui.destroy();dom.window.close();}
});

test('in-memory navigation preserves a fresh base and does not turn explicit scope answers into imported restrictions',()=>{
 const selection=selectCartridges(['cookie-choices']),dom=new JSDOM('<main></main>');dom.window.URL.createObjectURL=()=> 'blob:example';dom.window.URL.revokeObjectURL=()=>{};
 const root=dom.window.document.querySelector('main');let ui=mountSetup(root,{cartridges:selection});
 try{
  for(const id of ['children','sensitive-data','high-risk-profiling','regulated-sector']){root.querySelector(`[data-question="${id}"] input[value=no]`).checked=true;root.querySelector(`[data-question="${id}"] textarea`).value='Reviewed the actual site practices.';}
  const pending=ui.getDraft();assert.equal(pending.config,undefined);
  root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));const before=ui.getPlan();assert.equal(before.config.scopeGuards.site.children,'absent');
  ui.destroy();ui=mountSetup(root,{cartridges:selection,answers:pending.report});root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.deepEqual(ui.getPlan().config.scopeGuards,before.config.scopeGuards);
 }finally{ui.destroy();dom.window.close();}
});

test('an imported draft can resume unfinished public fields for correction without applying them at mount time',async()=>{
 const config=await fixture(),selection=selectCartridges(['privacy-pages']);
 for(const [field,value] of [['controllerEmail','pending@'],['siteUrl','https://'],['siteId','NOT READY']]){
  const dom=new JSDOM('<main></main>');dom.window.URL.createObjectURL=()=> 'blob:example';dom.window.URL.revokeObjectURL=()=>{};
  const root=dom.window.document.querySelector('main'),answers={schemaVersion:1,publicFacts:{[field]:value},markets:[],answers:{}};
  const ui=mountSetup(root,{cartridges:selection,config,answers});try{assert.equal(ui.getDraft().report.answers.publicFacts[field],value);assert.deepEqual(ui.getDraft().config,config);assert.equal(ui.getPlan(),null);}finally{ui.destroy();dom.window.close();}
 }
});

test('CLI plans are read-only and scoped wizard exports resume without silently switching jobs',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-cartridges-'));const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'});
 try{
  await writeFile(join(cwd,'notabenda.config.mjs'),"throw Error('PRIVATE must not execute')");const before=await readdir(cwd);
  const planResult=run('cartridges','cookie-choices','--json');assert.equal(planResult.status,0,planResult.stderr);const plan=JSON.parse(planResult.stdout);assert.deepEqual(plan.cartridges.map(c=>c.id),['cookie-choices']);assert.deepEqual(await readdir(cwd),before);
  assert.equal(run('cartridges','--json').status,0);assert.equal(run('packs','cookie-choices','--json').stdout,planResult.stdout);assert.match(run('packs').stdout,/Choose a pack/u);assert.notEqual(run('wizard','--packs','cookie-choices','--cartridges','cookie-choices','--answers','answers.json').status,0);assert.match(run('cartridges','cookie-choices','--brief').stdout,/wizard --packs cookie-choices/u);
  for(const args of [['cartridges','invented'],['cartridges','--brief'],['cartridges','cookie-choices','--json','--brief'],['check','--cartridges','cookie-choices']])assert.notEqual(run(...args).status,0);
  await writeFile(join(cwd,'answers.json'),JSON.stringify(plan.reference.targetAnswersTemplate));
  const first=run('wizard','--packs','cookie-choices','--answers','answers.json');assert.equal(first.status,0,first.stderr);
  const report=JSON.parse(await readFile(join(cwd,'notabenda-setup/setup.private.json'),'utf8'));assert.deepEqual(report.cartridges,selectCartridges(['cookie-choices']));assert.equal(report.answers.answers['consumer-payments'],undefined);
  const resume=run('wizard','--answers','notabenda-setup/setup.private.json','--config','notabenda-setup/notabenda.config.json','--out-dir','resumed');assert.equal(resume.status,0,resume.stderr);assert.deepEqual(JSON.parse(await readFile(join(cwd,'resumed/setup.private.json'),'utf8')).cartridges,report.cartridges);
  const conflict=run('wizard','--cartridges','privacy-pages','--answers','notabenda-setup/setup.private.json','--out-dir','conflict');assert.notEqual(conflict.status,0);assert.ok(!(await readdir(cwd)).includes('conflict'));
 }finally{await rm(cwd,{recursive:true,force:true});}
});
