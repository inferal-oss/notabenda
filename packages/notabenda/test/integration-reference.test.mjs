// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {describeIntegration} from 'notabenda/integration';
import {setupQuestions,createSetupPlan} from 'notabenda/setup';
import {fixture} from './helpers.mjs';
const cli=fileURLToPath(new URL('../dist/cli.js',import.meta.url));

test('targets distinguish requested outcomes, prerequisites and host implementation without activation',()=>{
 const reference=describeIntegration(['terms-agreement','cookie-consent','terms-agreement']);
 assert.deepEqual(reference.requestedTargetIds,['terms-agreement','cookie-consent']);
 assert.deepEqual(reference.targets.map(t=>[t.id,t.selection]),[['legal-pages','prerequisite'],['terms-agreement','requested'],['cookie-consent','requested']]);
 assert.equal(reference.targets.some(t=>t.id==='evidence'),false,'recording backend selection stays explicit');
 assert.ok(reference.relevantQuestionIds.includes('optional-storage'));assert.equal(reference.relevantQuestionIds.includes('consumer-payments'),false);
 assert.equal(reference.targets.find(t=>t.id==='terms-agreement').hostWork.length>0,true);
 assert.deepEqual(reference.boundaries,{advisoryOnly:true,writesFiles:false,readsProject:false,activatesFeatures:false,legalReview:false});
 for(const bad of [['unknown'],['__proto__'],['constructor'],new Array(1),Array(33).fill('legal-pages'),null,{}])assert.throws(()=>describeIntegration(bad),/Unknown integration target/u);
});

test('every advertised config path typechecks against the installed SiteConfig declaration',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-type-map-'));
 try{
  const reference=describeIntegration(),paths=[...reference.targets.flatMap(t=>t.configPaths),...reference.questions.flatMap(q=>q.configPaths)],file=join(cwd,'paths.mts');
  const filename=fileURLToPath(new URL('../dist/types.js',import.meta.url));
  const declarations=paths.map((path,index)=>`type Check${index} = ${path.split('.').reduce((type,key)=>`Item<${type}>[${JSON.stringify(key)}]`,'SiteConfig')};`).join('\n');
  const source=`import type {SiteConfig} from ${JSON.stringify(filename)};\ntype Item<T> = NonNullable<T> extends readonly (infer U)[] ? NonNullable<U> : NonNullable<T>;\n${declarations}\n`;
  await writeFile(file,source);
  const tsc=fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc',import.meta.url)),run=()=>spawnSync(process.execPath,[tsc,'--noEmit','--target','es2022','--module','nodenext','--moduleResolution','nodenext','--strict','--skipLibCheck',file],{cwd,encoding:'utf8',timeout:30000});
  const valid=run();assert.equal(valid.status,0,valid.stdout+valid.stderr);
  // Prove this guard rejects a field typo rather than only accepting the fixture.
  await writeFile(file,source+"type Bad = SiteConfig['inventedAgentField'];\n");const invalid=run();assert.notEqual(invalid.status,0);assert.match(invalid.stdout+invalid.stderr,/inventedAgentField/u);
  for(const question of reference.questions)assert.ok(question.hostWorkRefs.every(p=>p.startsWith('host.')));
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('setup questions stay connected to real IDs and unknown answers preserve imported runtime settings',async()=>{
 const reference=describeIntegration(),ids=new Set(setupQuestions.map(q=>q.id));
 assert.deepEqual(reference.questions.map(q=>q.id),setupQuestions.map(q=>q.id));
 for(const target of reference.targets){for(const id of target.questionIds)assert.ok(ids.has(id),id);for(const id of target.prerequisites)assert.ok(reference.targets.some(t=>t.id===id),id);assert.ok(target.factsNeeded.length&&target.verify.length);}
 assert.ok(Object.values(reference.answersTemplate.answers).every(a=>a.choice==='unknown'&&a.justification===''));
 const config=await fixture();config.consent={purposes:[...new Set(config.services.flatMap(s=>s.purposeIds))].map(id=>({id,scope:'host-scope-v9'})),services:config.services.map(s=>({id:s.id,scope:'host-service-v3'})),grantLifetimeDays:30,refusalLifetimeDays:90,dismissalMinutes:60};
 const plan=createSetupPlan(reference.answersTemplate,{config});
 assert.deepEqual(plan.config.consent,config.consent);assert.deepEqual(plan.config.services,config.services);assert.equal(plan.report.productionReady,false);
 assert.ok(plan.report.recommendations.some(r=>r.status==='investigate'));
 reference.targets[0].configPaths.push('invalid');reference.answersTemplate.answers['optional-storage'].choice='yes';
 assert.equal(describeIntegration().targets[0].configPaths.includes('invalid'),false);
 assert.equal(describeIntegration().answersTemplate.answers['optional-storage'].choice,'unknown');
});

test('describe identifies the installed version without reading or mutating project facts',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-reference-'));
 try{
  await writeFile(join(cwd,'notabenda.config.json'),'INVALID PRIVATE-CONFIG-MARKER');
  await writeFile(join(cwd,'notabenda.config.mjs'),"throw Error('Never execute project code');");
  const before=await readdir(cwd),run=(...args)=>spawnSync(process.execPath,[cli,'describe',...args],{cwd,encoding:'utf8'});
  const result=run('cookie-consent','--json');assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/PRIVATE-CONFIG-MARKER/u);
  const reference=JSON.parse(result.stdout),metadata=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));assert.deepEqual(reference.package,{name:metadata.name,version:metadata.version});
  assert.deepEqual(reference.requestedTargetIds,['cookie-consent']);assert.deepEqual(await readdir(cwd),before);
  assert.equal(await readFile(join(cwd,'notabenda.config.json'),'utf8'),'INVALID PRIVATE-CONFIG-MARKER');
  for(const args of [['--config','private.json'],['--json','--json'],['PRIVATE-TARGET-MARKER']]){const invalid=run(...args);assert.equal(invalid.status,1);assert.doesNotMatch(invalid.stderr,/PRIVATE-TARGET-MARKER/u);}
  assert.match(run().stdout,/terms-agreement/u);
 }finally{await rm(cwd,{recursive:true,force:true});}
});
