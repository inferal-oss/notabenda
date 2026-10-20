// @requirements REQ-PRODUCT-SPECIALIST-PACKS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {packLibrary,packGroups,selectPacks,planPacks,createPackSetupPlan,reviewPackInputs,formatPackBrief} from '@notabenda/core/packs';
import {readSetupAnswers} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {assessIntegration} from '@notabenda/core/integration/assessment';
import {fixture} from './helpers.mjs';
import {exceptionFixture} from './storage-exception-helpers.mjs';
import {technologyExampleConfig} from '../../../examples/technology/config.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const additions=['technology-notices','assessed-storage-settings','google-basic'];
const questions=['technology-isolation','technology-activation-controls','storage-statistical-use','storage-appearance-use','storage-exception-assessment','storage-exception-isolation','storage-objection-controls','storage-preference-journal','google-basic-targets','google-basic-ownership','google-connected-destinations'];
const item=(review,id,key)=>review.packs.find(p=>p.id===id).items.find(i=>i.id===key);
function googleConfig(base){
 const config=structuredClone(base),purposeId=config.purposes[0].id;
 config.services.push({id:'google-measurement',name:'Optional measurement',provider:'Google',location:'Reviewed test locations',purposeIds:[purposeId],resourceOrigins:['https://www.googletagmanager.com'],processingActivities:[],googleBasic:{version:1,tagIds:['G-TEST1234'],signals:{analytics_storage:[purposeId],ad_storage:[],ad_user_data:[],ad_personalization:[]}}});
 config.consent={purposes:[{id:purposeId,scope:'measurement-1'}],services:[{id:'google-measurement',scope:'google-1'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:20};return config;
}

test('specialist packs retain distinct prerequisites and every original pin',()=>{
 const library=packLibrary();assert.equal(library.length,20);assert.deepEqual(packGroups().map(g=>library.filter(p=>p.shelf===g.id).length),[3,4,6,5,2]);
 for(const pack of library.filter(p=>!additions.includes(p.id)))assert.deepEqual(selectPacks([pack.id]).selected,[{id:pack.id,revision:'1'}]);
 const technology=planPacks(selectPacks(['technology-notices'])),storage=planPacks(selectPacks(['assessed-storage-settings'])),google=planPacks(selectPacks(['google-basic']));
 assert.deepEqual(technology.reference.requestedTargetIds,['technology-functions']);assert.deepEqual(storage.reference.requestedTargetIds,['storage-exceptions']);assert.deepEqual(google.reference.requestedTargetIds,['google-basic']);
 assert.deepEqual(storage.reference.targets.map(t=>t.id),['legal-pages','storage-exceptions']);
 for(const plan of [technology,google])assert.ok(plan.reference.targets.some(t=>t.id==='cookie-consent'&&t.selection==='prerequisite'));
 for(const plan of [technology,storage,google]){assert.equal(plan.policyProposals.length,0);assert.equal(plan.boundaries.activatesFeatures,false);assert.ok(!plan.reference.targets.some(t=>t.id==='evidence'));}
 assert.ok(storage.reference.relevantQuestionIds.includes('storage-preference-journal'));assert.equal(storage.reference.relevantQuestionIds.includes('optional-storage'),false);
});

test('new facts remain unknown on resume and answers cannot invent a profile, tag mapping or technology declaration',async()=>{
 const config=await fixture(),before=structuredClone(config),selection=selectPacks(additions),old={schemaVersion:1,questionnaireVersion:'7',kind:'private-setup-report',answers:{schemaVersion:1,markets:['UK','CA-QC'],answers:{'optional-storage':{choice:'no',justification:'PRIVATE_PRIOR_FACT'}}}};
 const answers=readSetupAnswers(old);for(const id of questions)assert.equal(answers.answers[id],undefined);
 for(const id of questions)answers.answers[id]={choice:'yes',justification:'PRIVATE_SPECIALIST_FACT'};
 const plan=createPackSetupPlan(selection,answers,{config});assert.deepEqual(config,before);assert.equal(plan.report.questionnaireVersion,'8');assert.deepEqual(plan.config.services,before.services);assert.deepEqual(plan.config.storage,before.storage);assert.equal(plan.config.storageExceptions,undefined);assert.equal(plan.config.consent,undefined);assert.equal(plan.config.technologyNotice,undefined);
 for(const [id,key] of [['technology-notices','enrollment'],['assessed-storage-settings','policy'],['assessed-storage-settings','entries'],['google-basic','declaration']])assert.equal(item(plan.report.packInputs,id,key).state,'missing');
 const brief=formatPackBrief(selection,'connect',{config:plan.config});assert.doesNotMatch(brief,/PRIVATE_PRIOR_FACT|PRIVATE_SPECIALIST_FACT/);assert.match(brief,/scope before compiling|Scope\(declaration\)/);assert.match(brief,/atomic journal/);assert.match(brief,/post-load.*silence/);assert.equal(plan.report.productionReady,false);
});

test('technology inventory conflicts remain visible without fabricating a selected descriptor or rewriting the facts',async()=>{
 const config=technologyExampleConfig(await fixture()),selection=selectPacks(['technology-notices']),before=structuredClone(config);
 const declared=reviewPackInputs(selection,config);assert.equal(item(declared,'technology-notices','inventory-service-0').state,'declared');assert.equal(item(declared,'technology-notices','declaration').state,'host-work');assert.equal(item(declared,'technology-notices','scope').state,'host-work');assert.equal(item(declared,'technology-notices','retention').state,'host-work');assert.deepEqual(config,before);
 config.purposes[0].collection.source='indirect';const conflict=reviewPackInputs(selection,config);assert.equal(item(conflict,'technology-notices','inventory-service-0').state,'needs-review');assert.equal(config.purposes[0].collection.source,'indirect');assert.match(item(conflict,'technology-notices','guards').label,/never mark them absent/);
 assert.match(formatPackBrief(selection,'connect',{config}),/including global accept-all/);assert.match(formatPackBrief(selection,'connect',{config}),/localization.collection/);assert.equal(config.consent.services[0].scope,before.consent.services[0].scope);
});

test('exception conditions and objections remain independent of consent, and non-English native controls stay unresolved',async()=>{
 const config=await exceptionFixture();config.purposes=config.purposes.filter(p=>p.id!=='marketing');config.services=config.services.filter(s=>s.id!=='marketing-service');config.storage=config.storage.filter(s=>s.id!=='marketing-storage');delete config.consent;
 const selection=selectPacks(['assessed-storage-settings']),before=structuredClone(config),review=reviewPackInputs(selection,config);
 assert.deepEqual(config,before);assert.equal(item(review,'assessed-storage-settings','policy').state,'declared');assert.equal(item(review,'assessed-storage-settings','entry-review-0').state,'declared');
 const paths=item(review,'assessed-storage-settings','entry-review-0').paths;for(const key of Object.keys(config.storageExceptions.entries[0].conditions))assert.ok(paths.includes('storageExceptions.entries.0.conditions.'+key));
 config.storageExceptions.entries[0].reviewStatus='draft';assert.equal(item(reviewPackInputs(selection,config),'assessed-storage-settings','entry-review-0').state,'needs-review');
 const pt=localizedExampleConfig(await fixture());config.site.locale=pt.site.locale;config.localization=pt.localization;
 const localized=reviewPackInputs(selection,config);assert.equal(item(localized,'assessed-storage-settings','language').state,'needs-review');assert.match(item(localized,'assessed-storage-settings','language').label,/custom headless presentation/);assert.equal(config.site.locale,'pt-BR');
 const answers=planPacks(selection).reference.targetAnswersTemplate;answers.answers['storage-exception-assessment']={choice:'no',justification:'PRIVATE_UNRESOLVED_QUALIFICATION'};
 const plan=createPackSetupPlan(selection,answers,{config});assert.equal(plan.config.consent,undefined);assert.deepEqual(plan.config.storageExceptions,config.storageExceptions);assert.ok(plan.report.reviewItems.some(i=>i.startsWith('Conflict: storage-exception assessment')));assert.match(formatPackBrief(selection,'connect',{config}),/cookie accept-all cannot clear an objection/);
});

test('Google target requires one declaration among unrelated services; multiple declarations prompt document ownership review',async()=>{
 const config=googleConfig(await fixture()),original=structuredClone(config),selection={schemaVersion:1,answers:{'google-basic-connection':'yes'}},report=assessIntegration({selection,config});
 assert.equal(report.validation.authoringShape.valid,true);assert.equal(report.validation.preview.valid,true);assert.equal(report.missingRequiredConfig.some(c=>c.path==='services.googleBasic'),false);
 const declared=report.targets.find(t=>t.id==='google-basic').configuration.find(c=>c.path==='services.googleBasic');assert.equal(declared.state,'partial');assert.equal(declared.requiredForTarget,true);assert.equal(declared.requiredCoverage,'at-least-one-populated-item');assert.equal(config.services[0].googleBasic,undefined);assert.deepEqual(config,original);
 const missing=structuredClone(config);delete missing.services[1].googleBasic;assert.ok(assessIntegration({selection,config:missing}).missingRequiredConfig.some(c=>c.path==='services.googleBasic'));
 const another=structuredClone(config.services[1]);another.id='google-on-another-page';another.googleBasic.tagIds=['G-OTHER1234'];config.services.push(another);config.consent.services.push({id:another.id,scope:'google-other-1'});
 const review=reviewPackInputs(selectPacks(['google-basic']),config);assert.equal(item(review,'google-basic','multiple-services').state,'needs-review');assert.match(item(review,'google-basic','multiple-services').label,/may belong to different pages/);assert.equal(assessIntegration({selection,config}).validation.preview.valid,true);
 const answers=planPacks(selectPacks(['google-basic'])).reference.targetAnswersTemplate;answers.answers['google-basic-targets']={choice:'no',justification:'PRIVATE_TARGET_FACT'};
 const plan=createPackSetupPlan(selectPacks(['google-basic']),answers,{config});assert.deepEqual(plan.config.services,config.services);assert.ok(plan.report.reviewItems.some(i=>i.startsWith('Conflict: supported Google targets')));assert.deepEqual(plan.config.services[1].googleBasic.signals.ad_storage,[]);
});

test('UI and CLI share focused questions, regenerated reviews and private-note separation across draft and resume',async()=>{
 const selection=selectPacks(additions),config=await fixture(),dom=new JSDOM('<main></main>',{url:'https://example.test/setup'}),d=dom.window.document;dom.window.fetch=()=>{throw Error('Setup must not make requests');};dom.window.URL.createObjectURL=()=> 'blob:test';dom.window.URL.revokeObjectURL=()=>{};
 const ui=mountSetup(d.querySelector('main'),{cartridges:selection,config});
 try{
  for(const id of questions)assert.equal(d.querySelector(`[data-question="${id}"]`).hidden,false);
  assert.equal(d.querySelector('[data-question="consumer-payments"]').hidden,true);
  d.querySelector('[data-question="storage-exception-assessment"] textarea').value='PRIVATE_JUSTIFICATION';d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  const plan=ui.getPlan();assert.deepEqual(plan.report.packInputs,reviewPackInputs(selection,plan.config));assert.equal(plan.report.answers.answers['storage-exception-assessment'].justification,'PRIVATE_JUSTIFICATION');assert.doesNotMatch(formatPackBrief(selection,'connect',{config:plan.config}),/PRIVATE_JUSTIFICATION/);assert.equal(d.querySelectorAll('[data-pack]').length,3);
 }finally{ui.destroy();dom.window.close();}
 const directory=await mkdtemp(join(tmpdir(),'notabenda-specialist-packs-')),cli=new URL('../dist/cli.js',import.meta.url).pathname,run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:directory,encoding:'utf8'});
 try{
  const answers=planPacks(selection).reference.targetAnswersTemplate;answers.answers['storage-exception-assessment']={choice:'unknown',justification:'PRIVATE_JUSTIFICATION'};
  await writeFile(join(directory,'answers.json'),JSON.stringify(answers));await writeFile(join(directory,'config.json'),JSON.stringify(config));
  const draft=run('wizard','--packs',additions.join(','),'--answers','answers.json','--config','config.json','--out-dir','draft');assert.equal(draft.status,0,draft.stderr);
  const report=JSON.parse(await readFile(join(directory,'draft/setup.private.json'),'utf8')),saved=JSON.parse(await readFile(join(directory,'draft/notabenda.config.json'),'utf8')),brief=await readFile(join(directory,'draft/notabenda-setup-brief.txt'),'utf8');
  assert.deepEqual(report.packInputs,reviewPackInputs(selection,saved));assert.equal(brief,formatPackBrief(selection,'connect',{config:saved}));assert.doesNotMatch(brief,/PRIVATE_JUSTIFICATION/);report.packInputs={installed:true};await writeFile(join(directory,'report.json'),JSON.stringify(report));
  const resumed=run('wizard','--answers','report.json','--config','draft/notabenda.config.json','--out-dir','resumed');assert.equal(resumed.status,0,resumed.stderr);const next=JSON.parse(await readFile(join(directory,'resumed/setup.private.json'),'utf8'));assert.deepEqual(next.packInputs,reviewPackInputs(selection,saved));assert.equal(next.answers.answers['storage-exception-assessment'].choice,'unknown');
 }finally{await rm(directory,{recursive:true,force:true});}
});
