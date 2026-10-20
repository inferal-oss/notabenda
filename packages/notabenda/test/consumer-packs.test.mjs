// @requirements REQ-PRODUCT-CONSUMER-PACKS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {packLibrary,selectPacks,planPacks,createPackSetupPlan,reviewPackInputs,formatPackBrief} from '@notabenda/core/packs';
import {readSetupAnswers} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {fixture} from './helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const additions=['contract-withdrawal','subscription-cancellation','paid-order-review','customer-confirmations','guarantee-information'];
const questions=['contract-public-entry','consumer-goods','consumer-digital-content','consumer-variable-charges','customer-copy-delivery','order-admission-archive','shop-guarantee-notice','producer-guarantee-labels'];
const item=(review,id,key)=>review.packs.find(p=>p.id===id).items.find(i=>i.id===key);

test('consumer jobs stay independent, including the backend-dependent confirmation path and separate guarantee branches',()=>{
 const library=packLibrary();assert.equal(library.filter(p=>p.shelf==='consumer').length,5);
 for(const id of additions){
  const plan=planPacks(selectPacks([id]));assert.deepEqual(plan.reference.requestedTargetIds,[id]);assert.equal(plan.policyProposals.length,0);
  assert.ok(!plan.reference.targets.some(t=>['consumer-contracts','terms-agreement','cookie-consent','evidence'].includes(t.id)));
  assert.deepEqual(plan.boundaries,{changesSite:false,activatesFeatures:false,verifiesDeployment:false,legalReview:false});
 }
 const confirmation=planPacks(selectPacks(['customer-confirmations']));assert.deepEqual(confirmation.reference.targets.map(t=>t.id),['customer-confirmations']);
 assert.ok(confirmation.reference.relevantQuestionIds.includes('order-admission-archive'));assert.ok(!confirmation.reference.relevantQuestionIds.includes('consumer-variable-charges'));
 assert.match(confirmation.reference.targets[0].hostWork.join(' '),/received event and retained review in the same checkout context/);
 const guarantee=planPacks(selectPacks(['guarantee-information']));assert.deepEqual(guarantee.reference.targets[0].prerequisites,[]);assert.ok(guarantee.reference.relevantQuestionIds.includes('shop-guarantee-notice'));assert.ok(guarantee.reference.relevantQuestionIds.includes('producer-guarantee-labels'));
 for(const id of ['privacy-pages','cookie-choices','terms-agreement','collection-notices','indirect-collection','privacy-requests','form-permissions','gated-media','evidence-workspace','processing-opt-outs','ie-consent-duration','it-repeat-prompts'])assert.deepEqual(selectPacks([id]).selected,[{id,revision:'1'}]);
});

test('input review preserves inventory and keeps country, locale and audience separate from actual builder and host inputs',async()=>{
 const config=localizedExampleConfig(await fixture()),before=structuredClone(config),selection=selectPacks(additions);config.terms.audience='business';config.jurisdictions=['DE','BR'];
 const original=structuredClone(config),review=reviewPackInputs(selection,config);assert.deepEqual(config,original);assert.equal(review.productionReady,false);
 for(const id of additions.filter(id=>id!=='guarantee-information'))assert.equal(item(review,id,'audience').state,'needs-review');
 assert.equal(item(review,'contract-withdrawal','profile').state,'host-work');assert.match(item(review,'contract-withdrawal','profile').label,/de-DE, en or pt-BR/);assert.match(item(review,'subscription-cancellation','profile').label,/not a generic subscription/);
 assert.equal(item(review,'customer-confirmations','foundation').state,'host-work');assert.match(item(review,'customer-confirmations','foundation').label,/cannot accept arbitrary external receipts/);
 assert.equal(item(review,'paid-order-review','prices').state,'host-work');assert.equal(item(review,'guarantee-information','product').state,'host-work');assert.match(item(review,'guarantee-information','product').label,/do not establish that no label is needed/);
 config.terms.audience='mixed';assert.equal(item(reviewPackInputs(selection,config),'paid-order-review','audience').state,'declared');assert.equal(item(reviewPackInputs(selection,config),'paid-order-review','admission').state,'host-work');
 assert.doesNotMatch(JSON.stringify(review),new RegExp(before.controller.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('old reports leave newly added practices unknown and conflicting charges never rewrite facts or install a flow',async()=>{
 const config=await fixture(),before=structuredClone(config),selection=selectPacks(additions),old={schemaVersion:1,questionnaireVersion:'6',kind:'private-setup-report',answers:{schemaVersion:1,markets:[],answers:{'consumer-payments':{choice:'no',justification:'PRIVATE_PAYMENT_FACT'}}}};
 const resumed=readSetupAnswers(old);for(const id of questions)assert.equal(resumed.answers[id],undefined);
 resumed.answers['consumer-variable-charges']={choice:'yes',justification:'PRIVATE_PRICE_FACT'};
 const plan=createPackSetupPlan(selection,resumed,{config});assert.deepEqual(config,before);assert.equal(plan.report.questionnaireVersion,'8');assert.ok(plan.report.reviewItems.some(i=>i.startsWith('Conflict: payment obligations')));
 assert.equal(plan.report.recommendations.find(r=>r.id==='order-admission-archive').status,'investigate');assert.deepEqual(plan.config.terms,before.terms);assert.equal(plan.config.site.locale,before.site.locale);
 for(const key of ['contractActions','orderQuotes','orderConfirmations','producerGuaranteeLabels'])assert.equal(plan.config[key],undefined);
 const brief=formatPackBrief(selection,'connect',{config:plan.config});assert.doesNotMatch(brief,/PRIVATE_PAYMENT_FACT|PRIVATE_PRICE_FACT/);assert.match(brief,/separate builder inputs|separate from SiteConfig/);assert.match(brief,/received.*Cloudflare|received @notabenda\/cloudflare/);
});

test('UI and CLI share regenerated consumer input reviews and keep new factual notes in the private report',async()=>{
 const config=await fixture(),selection=selectPacks(additions),dom=new JSDOM('<main></main>',{url:'https://example.test/setup'}),d=dom.window.document;
 dom.window.fetch=()=>{throw Error('Setup must make no requests');};dom.window.URL.createObjectURL=()=> 'blob:test';dom.window.URL.revokeObjectURL=()=>{};
 const ui=mountSetup(d.querySelector('main'),{cartridges:selection,config});
 try{
  for(const id of questions)assert.equal(d.querySelector(`[data-question="${id}"]`).hidden,false);
  assert.equal(d.querySelector('[data-question="optional-storage"]').hidden,true);
  d.querySelector('[data-question="order-admission-archive"] textarea').value='PRIVATE_ARCHIVE_REVIEW';
  d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  const plan=ui.getPlan();assert.deepEqual(plan.report.packInputs,reviewPackInputs(selection,plan.config));assert.equal(plan.report.answers.answers['order-admission-archive'].justification,'PRIVATE_ARCHIVE_REVIEW');
  assert.ok(d.querySelector('[data-pack="customer-confirmations"]').textContent.includes('same checkout context'));assert.doesNotMatch(formatPackBrief(selection,'connect',{config:plan.config}),/PRIVATE_ARCHIVE_REVIEW/);
 }finally{ui.destroy();dom.window.close();}
 const directory=await mkdtemp(join(tmpdir(),'notabenda-consumer-packs-')),cli=new URL('../dist/cli.js',import.meta.url).pathname,run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:directory,encoding:'utf8'});
 try{
  const answers=planPacks(selection).reference.targetAnswersTemplate;answers.answers['order-admission-archive']={choice:'unknown',justification:'PRIVATE_ARCHIVE_REVIEW'};
  await writeFile(join(directory,'answers.json'),JSON.stringify(answers));await writeFile(join(directory,'config.json'),JSON.stringify(config));
  const result=run('wizard','--packs',additions.join(','),'--answers','answers.json','--config','config.json','--out-dir','draft');assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(await readFile(join(directory,'draft/setup.private.json'),'utf8')),draft=JSON.parse(await readFile(join(directory,'draft/notabenda.config.json'),'utf8')),brief=await readFile(join(directory,'draft/notabenda-setup-brief.txt'),'utf8');
  assert.deepEqual(report.packInputs,reviewPackInputs(selection,draft));assert.equal(brief,formatPackBrief(selection,'connect',{config:draft}));assert.doesNotMatch(brief,/PRIVATE_ARCHIVE_REVIEW/);
  report.packInputs={configured:true};await writeFile(join(directory,'report.json'),JSON.stringify(report));
  const resume=run('wizard','--answers','report.json','--config','draft/notabenda.config.json','--out-dir','resumed');assert.equal(resume.status,0,resume.stderr);
  const regenerated=JSON.parse(await readFile(join(directory,'resumed/setup.private.json'),'utf8'));assert.deepEqual(regenerated.packInputs,reviewPackInputs(selection,draft));assert.equal(regenerated.answers.answers['order-admission-archive'].choice,'unknown');
 }finally{await rm(directory,{recursive:true,force:true});}
});
