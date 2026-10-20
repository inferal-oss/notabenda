// @requirements REQ-PRODUCT-PRIVACY-PACKS REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-PACK-CONNECTION
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
import {rightsExampleConfig} from '../../../examples/rights/build.mjs';
import {fixture} from './helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const additions=['collection-notices','indirect-collection','privacy-requests','processing-opt-outs'];
const item=(review,id,key)=>review.packs.find(p=>p.id===id).items.find(i=>i.id===key);

test('new privacy jobs keep separate targets, language contracts and enforcement paths without changing older pins',()=>{
 const library=packLibrary();assert.equal(library.length,20);assert.deepEqual(packGroups().map(g=>library.filter(p=>p.shelf===g.id).length),[3,4,6,5,2]);
 const direct=planPacks(selectPacks(['collection-notices'])),indirect=planPacks(selectPacks(['indirect-collection']));
 assert.deepEqual(direct.reference.requestedTargetIds,['collection-notice']);assert.deepEqual(indirect.reference.requestedTargetIds,['indirect-collection-notice']);
 assert.ok(direct.reference.targets.find(t=>t.id==='collection-notice').conditionalConfig.some(r=>r.requiredPaths.includes('localization.collection')));
 assert.equal(indirect.reference.targets.find(t=>t.id==='indirect-collection-notice').conditionalConfig,undefined);
 for(const id of ['privacy-requests','processing-opt-outs']){const plan=planPacks(selectPacks([id]));assert.ok(!plan.reference.targets.some(t=>t.id==='cookie-consent'||t.id==='evidence'));}
 for(const id of ['privacy-pages','cookie-choices','terms-agreement','form-permissions','gated-media','evidence-workspace','ie-consent-duration','it-repeat-prompts'])assert.deepEqual(selectPacks([id]).selected,[{id,revision:'1'}]);
});

test('draft input review distinguishes missing classifications from deliberate empty lists without selecting a signal policy or recording workflow',async()=>{
 const config=await fixture(),selection=selectPacks(additions),before=structuredClone(config);delete config.services[0].processingActivities;
 const missing=reviewPackInputs(selection,config);assert.equal(item(missing,'processing-opt-outs','classification-0').state,'missing');assert.equal(item(missing,'privacy-requests','page').state,'missing');assert.equal(item(missing,'indirect-collection','purposes').state,'missing');
 config.services[0].processingActivities=[];config.purposes[0].collection.source='both';const declared=reviewPackInputs(selection,config);
 assert.equal(item(declared,'processing-opt-outs','classification-0').state,'declared');assert.equal(item(declared,'collection-notices','purposes').state,'declared');assert.equal(item(declared,'indirect-collection','purposes').state,'declared');
 assert.equal(item(declared,'processing-opt-outs','signals').state,'host-work');assert.equal(item(declared,'processing-opt-outs','recording').state,'host-work');assert.equal(config.privacySignals,undefined);assert.equal(declared.productionReady,false);
 assert.deepEqual(before.services.map(s=>s.name),config.services.map(s=>s.name));assert.doesNotMatch(JSON.stringify(declared),new RegExp(config.controller.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 const empty=structuredClone(config);empty.services=[];empty.storage=[];assert.equal(item(reviewPackInputs(selection,empty),'processing-opt-outs','inventory').state,'needs-review');
});

test('rights declarations and imported restrictions remain intact while the scoped draft reopens review; old reports leave added questions unknown',async()=>{
 const config=rightsExampleConfig(await fixture(),{reviewed:true});for(const service of config.services)service.processingActivities=[];
 config.privacySignals={globalPrivacyControl:{appliesTo:['sale'],explanation:'Fictional assessed restriction.'}};
 const original=structuredClone(config),selection=selectPacks(additions),answers=planPacks(selection).reference.targetAnswersTemplate;answers.answers['privacy-request-routes']={choice:'yes',justification:'PRIVATE_ROUTE_REVIEW'};
 const plan=createPackSetupPlan(selection,answers,{config});assert.deepEqual(config,original);assert.deepEqual(plan.config.rightsCenter.actions,config.rightsCenter.actions);assert.equal(plan.config.rightsCenter.reviewStatus,'draft');assert.deepEqual(plan.config.privacySignals,config.privacySignals);assert.deepEqual(plan.config.services,config.services);
 assert.equal(plan.report.questionnaireVersion,'8');assert.equal(item(plan.report.packInputs,'privacy-requests','review').state,'needs-review');assert.match(JSON.stringify(plan.report),/PRIVATE_ROUTE_REVIEW/);assert.doesNotMatch(formatPackBrief(selection,'connect',{config:plan.config}),/PRIVATE_ROUTE_REVIEW/);
 const old={schemaVersion:1,kind:'private-setup-report',questionnaireVersion:'5',answers:{schemaVersion:1,markets:[],answers:{'personal-data':{choice:'yes',justification:'Preserved previous note.'}}}};
 const resumed=createPackSetupPlan(selectPacks(['privacy-requests']),readSetupAnswers(old),{config});assert.equal(resumed.report.answers.answers['privacy-request-routes'],undefined);assert.equal(resumed.report.recommendations.find(r=>r.id==='privacy-request-routes').status,'investigate');assert.equal(resumed.report.answers.answers['personal-data'].justification,'Preserved previous note.');
});

test('each privacy pack exposes its focused questions and the same regenerated input review in UI, private report and agent brief',async()=>{
 const config=await fixture();
 for(const id of additions){
  const selection=selectPacks([id]),scope=planPacks(selection),dom=new JSDOM('<main></main>',{url:'https://host.example.test/setup'}),d=dom.window.document,blobs=new Map();let effects=0;
  dom.window.fetch=()=>{effects++;throw Error('No network');};dom.window.Storage.prototype.setItem=()=>{effects++;throw Error('No storage');};dom.window.URL.createObjectURL=b=>{const u='blob:local-'+blobs.size;blobs.set(u,b);return u;};dom.window.URL.revokeObjectURL=()=>{};
  const ui=mountSetup(d.querySelector('main'),{cartridges:selection,config});
  try{
   assert.deepEqual(new Set([...d.querySelectorAll('[data-question]')].filter(n=>!n.hidden).map(n=>n.dataset.question)),new Set(scope.reference.relevantQuestionIds));
   d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));const plan=ui.getPlan();assert.ok(plan,id);const review=plan.report.packInputs;
   assert.deepEqual(review,reviewPackInputs(selection,plan.config));const card=d.querySelector('[data-pack="'+id+'"]');for(const input of review.packs[0].items){const row=card.querySelector('[data-input="'+input.id+'"]');assert.equal(row.dataset.state,input.state);assert.ok(row.textContent.includes(input.label));}
   const link=d.querySelector('a[download="notabenda-setup-brief.txt"]');assert.equal(await blobs.get(link.href).text(),formatPackBrief(selection,'connect',{config:plan.config}));assert.equal(effects,0);
   ui.setCartridges(selectPacks(['privacy-pages']));assert.equal(d.querySelector('.nb-setup-pack-inputs'),null);assert.equal(ui.getPlan(),null);
  }finally{ui.destroy();dom.window.close();}
 }
});

test('scoped CLI exports the concrete input review and matching brief, then recomputes them on resume',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-privacy-packs-')),cli=new URL('../dist/cli.js',import.meta.url).pathname,selection=selectPacks(additions),run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:directory,encoding:'utf8'});
 try{
  const listing=run('packs','--json');assert.equal(listing.status,0,listing.stderr);assert.deepEqual(JSON.parse(listing.stdout).groups,packGroups());assert.equal(JSON.parse(listing.stdout).cartridges.length,20);
  const answers=planPacks(selection).reference.targetAnswersTemplate;answers.answers['direct-collection']={choice:'yes',justification:'PRIVATE_FORM_REVIEW'};await writeFile(join(directory,'answers.json'),JSON.stringify(answers));
  const result=run('wizard','--packs',additions.join(','),'--answers','answers.json','--out-dir','draft');assert.equal(result.status,0,result.stderr);
  const config=JSON.parse(await readFile(join(directory,'draft/notabenda.config.json'),'utf8')),report=JSON.parse(await readFile(join(directory,'draft/setup.private.json'),'utf8')),brief=await readFile(join(directory,'draft/notabenda-setup-brief.txt'),'utf8');
  assert.deepEqual(report.packInputs,reviewPackInputs(selection,config));assert.equal(brief,formatPackBrief(selection,'connect',{config}));assert.doesNotMatch(brief,/PRIVATE_FORM_REVIEW/);assert.equal(config.rightsCenter,undefined);assert.equal(config.privacySignals,undefined);assert.equal(config.consent,undefined);
  report.packInputs={forged:'configured'};await writeFile(join(directory,'report.json'),JSON.stringify(report));const resume=run('wizard','--answers','report.json','--config','draft/notabenda.config.json','--out-dir','resumed');assert.equal(resume.status,0,resume.stderr);const next=JSON.parse(await readFile(join(directory,'resumed/setup.private.json'),'utf8'));assert.deepEqual(next.packInputs,reviewPackInputs(selection,config));assert.equal(next.answers.answers['direct-collection'].justification,'PRIVATE_FORM_REVIEW');
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('indirect setup exposes its English-only limit and a contradictory inventory without translating or rewriting it',async()=>{
 const config=localizedExampleConfig(await fixture());delete config.localization.collection;config.purposes[0].collection.source='both';const before=structuredClone(config),selection=selectPacks(['indirect-collection']),answers=planPacks(selection).reference.targetAnswersTemplate;answers.answers['indirect-collection']={choice:'no',justification:'Contradicts the imported inventory for this test.'};
 const plan=createPackSetupPlan(selection,answers,{config});assert.deepEqual(config,before);assert.equal(plan.config.site.locale,'pt-BR');assert.equal(item(plan.report.packInputs,'indirect-collection','language').state,'needs-review');assert.match(formatPackBrief(selection,'connect',{config:plan.config}),/English-only/);assert.equal(plan.config.localization?.collection,undefined);
 assert.equal(new Set(plan.report.recommendations.map(r=>r.id)).size,plan.report.recommendations.length);assert.equal(plan.report.recommendations.find(r=>r.id==='indirect-collection').status,'declared-no');assert.equal(plan.report.recommendations.find(r=>r.id==='indirect-collection-inventory').status,'review');assert.ok(plan.report.reviewItems.some(i=>i.startsWith('Conflict: indirect collection was denied')));
});
