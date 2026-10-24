// @requirements REQ-ZA-MARKETING REQ-PRODUCT-AGENT-INTEGRATION
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {toPublicConfig} from '@notabenda/core';
import {createSetupPlan,readSetupAnswers} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {describeIntegration} from '@notabenda/core/integration';
import {fixture} from './helpers.mjs';

const reviews=()=>describeIntegration(['south-africa-marketing-request']).marketingRequestReviews;
const answers=()=>({schemaVersion:1,markets:[],answers:{}});
const advice=plan=>plan.report.recommendations.filter(r=>r.id==='marketing-request-ZA');

test('marketing review ties selected sources and screened health instrument to partial, unreviewed coverage',async()=>{
  const r=reviews(),catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8'));
  assert.equal(r.advisoryOnly,true);assert.equal(r.authorizesApproach,false);assert.equal(r.determinesApplicability,false);assert.equal(r.legalReviewStatus,'unreviewed');
  assert.equal(r.mechanism.maintainsResponsiblePartySubjectHistory,false);assert.equal(r.mechanism.admitsInvitations,false);assert.equal(r.mechanism.implementsCustomerException,false);assert.equal(r.mechanism.sendsMessages,false);
  for(const source of [...r.sources,...r.screenedSources]){
    const registered=catalog.sources.find(s=>s.id===source.id);assert.ok(registered);
    for(const key of ['url','checkedOn','access'])assert.equal(source[key],registered[key]);
  }
  const item=r.items[0],req=catalog.requirements.find(v=>v.id==='REQ-ZA-MARKETING');
  assert.equal(req.implementationStatus,'partial');assert.equal(req.legalReviewStatus,'unreviewed');
  for(const check of item.checks){assert.ok(item.sourceIds.includes(check.sourceId));assert.ok(req.sourceRefs.some(s=>s.sourceId===check.sourceId));assert.ok(check.locator);}
  assert.equal(r.screenedSources[0].result,'different-subject');assert.ok(req.discoverySourceIds.includes(r.screenedSources[0].id));assert.ok(!req.sourceRefs.some(s=>s.sourceId===r.screenedSources[0].id));
  assert.match(item.limits.join(' '),/remains planned/);assert.match(item.engineeringChecks.join(' '),/old backups/);
  r.items[0].checks.length=0;r.mechanism.admitsInvitations=true;assert.equal(reviews().items[0].checks.length,4);assert.equal(reviews().mechanism.admitsInvitations,false);
});

test('South Africa interest and existing declarations advise without changing config, private answers or old reports',async()=>{
  for(const imported of [false,true]){
    const config=await fixture({reviewed:true}),input=answers();if(imported)config.jurisdictions=['ZA'];else input.markets=['ZA'];
    input.answers['personal-data']={choice:'no',justification:'PRIVATE_PRIOR_HISTORY_ASSESSMENT'};
    const original=structuredClone(config),a=structuredClone(input),plan=createSetupPlan(input,{config,preserveConfig:true});
    assert.deepEqual(plan.config,toPublicConfig(original,{mode:'preview'}));assert.deepEqual(config,original);assert.deepEqual(input,a);assert.equal(advice(plan).length,1);
    assert.equal(plan.report.recommendations.find(r=>r.id==='personal-data').status,'declared-no');assert.equal(plan.report.productionReady,false);
    assert.ok(plan.report.reviewItems.some(t=>t.includes('SRC-ZA-DM')&&t.includes('7.2.2')));assert.ok(plan.report.reviewItems.some(t=>t.includes('Durable Objects')));
    const old={schemaVersion:1,kind:'private-setup-report',questionnaireVersion:'7',answers:input,recommendations:[{id:'old',reason:'Earlier review'}]},bytes=JSON.stringify(old);
    assert.equal(advice(createSetupPlan(readSetupAnswers(old),{config,preserveConfig:true})).length,1);assert.equal(JSON.stringify(old),bytes);
  }
  assert.equal(advice(createSetupPlan(answers())).length,0);
  const duplicate=answers();duplicate.markets=['ZA'];const config=await fixture();config.jurisdictions=['ZA'];assert.equal(advice(createSetupPlan(duplicate,{config})).length,1);
});

test('installed CLI exposes the same source review and keeps host history out of public configuration',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'notabenda-marketing-review-'));try{
    const cli=new URL('../dist/cli.js',import.meta.url).pathname,run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8'});
    const described=run('describe','south-africa-marketing-request','--json');assert.equal(described.status,0,described.stderr);const reference=JSON.parse(described.stdout);
    assert.deepEqual(reference.marketingRequestReviews,reviews());assert.match(reference.targets.find(t=>t.id==='south-africa-marketing-request').hostWork.join(' '),/marketingRequestReviews/);
    const input=answers();input.markets=['ZA'];input.answers['personal-data']={choice:'unknown',justification:'PRIVATE_CONTACT_HISTORY'};await writeFile(join(dir,'answers.json'),JSON.stringify(input));
    const result=run('wizard','--answers','answers.json');assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/PRIVATE_CONTACT_HISTORY/);
    const config=JSON.parse(await readFile(join(dir,'notabenda-setup/notabenda.config.json'),'utf8')),report=JSON.parse(await readFile(join(dir,'notabenda-setup/setup.private.json'),'utf8'));
    assert.equal(advice({report}).length,1);assert.deepEqual(config.jurisdictions,[]);assert.equal(config.marketingApproachHistory,undefined);assert.doesNotMatch(JSON.stringify(config),/PRIVATE_CONTACT_HISTORY/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('browser setup shows the approach review without creating permission or approving readiness',()=>{
  const dom=new JSDOM('<main></main>',{url:'https://operator.example.test/setup'}),root=dom.window.document.querySelector('main');dom.window.URL.createObjectURL=()=> 'blob:marketing-history-review';dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(root);
  try{
    const market=[...root.querySelectorAll('.nb-setup-markets label')].find(n=>n.textContent==='South Africa');assert.ok(market);market.querySelector('input').click();root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
    const plan=ui.getPlan();assert.equal(advice(plan).length,1);assert.deepEqual(plan.config.jurisdictions,[]);assert.equal(plan.report.productionReady,false);assert.equal(plan.config.marketingApproachHistory,undefined);
    assert.match(root.querySelector('[aria-label="Setup recommendations"]').textContent,/Review whether you may ask for marketing consent/);
  }finally{ui.destroy();dom.window.close();}
});
