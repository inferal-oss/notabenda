// @requirements REQ-PRODUCT-EMBED-LOCALIZATION
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {assessIntegration} from '@notabenda/core/integration/assessment';
import {describeIntegration} from '@notabenda/core/integration';
import {createSetupPlan} from '@notabenda/core/setup';
import {fixture} from './helpers.mjs';
const selection=answers=>({schemaVersion:1,answers});
const assess=(config,decisions,answers)=>assessIntegration({config,selection:selection(decisions),...(answers?{answers}:{})});

test('assessment enforces the installed authoring shape separately from runtime semantics',async()=>{
 const original=await fixture({reviewed:true});
 const cases=[
  [c=>{c.conset={privateValue:'PRIVATE-VALUE'};},'/conset','additionalProperties'],
  [c=>{c.services[0].resourceOrigin=['PRIVATE-VALUE'];},'/services/0/resourceOrigin','additionalProperties'],
  [c=>{delete c.controller.address;},'/controller/address','required'],
  [c=>{c.site.locale=42;},'/site/locale','type'],
  [c=>{c.documents.terms.review.status='PRIVATE-VALUE';},'/documents/terms/review/status','enum']
 ];
 for(const [change,path,code] of cases){
  const config=structuredClone(original);change(config);const before=structuredClone(config),report=assess(config,{documents:'yes'});
  assert.equal(report.status,'invalid-config');assert.equal(report.validation.authoringShape.valid,false);
  assert.ok(report.validation.authoringShape.diagnostics.some(d=>d.instancePath===path&&d.code===code),path);
  assert.deepEqual(config,before);assert.equal(report.productionReady,false);
  assert.doesNotMatch(JSON.stringify(report.validation.authoringShape),/PRIVATE-VALUE/u);
 }
 const unknown=structuredClone(original);unknown.conset={};const typo=assess(unknown,{documents:'yes'});
 assert.equal(typo.validation.preview.valid,true);assert.equal(typo.validation.production.valid,true);
 assert.equal(typo.validation.authoringShape.valid,false);assert.equal(typo.status,'invalid-config');
 const semantic=structuredClone(original);semantic.services[0].purposeIds=['missing-purpose'];
 const invalid=assess(semantic,{documents:'yes'});assert.equal(invalid.validation.authoringShape.valid,true);assert.equal(invalid.validation.preview.valid,false);assert.equal(invalid.status,'invalid-config');
 // Private application metadata is explicitly allowed; its values stay private.
 original.private={arbitrary:{nested:['PRIVATE-VALUE',true,null,1]}};
 const valid=assess(original,{documents:'yes'});assert.equal(valid.validation.authoringShape.valid,true);assert.doesNotMatch(JSON.stringify(valid),/PRIVATE-VALUE/u);
});

test('schema diagnostics preserve JSON Pointer escaping and limit report size',async()=>{
 const config=await fixture();config['bad/key~name']='PRIVATE-VALUE';
 const report=assess(config,{documents:'yes'});assert.ok(report.validation.authoringShape.diagnostics.some(d=>d.instancePath==='/bad~1key~0name'));
 for(let i=0;i<120;i++)config['unexpected'+i]='PRIVATE-VALUE';
 const many=assess(config,{documents:'yes'}).validation.authoringShape;assert.equal(many.diagnostics.length,100);assert.equal(many.truncated,true);assert.doesNotMatch(JSON.stringify(many),/PRIVATE-VALUE/u);
});

test('selected native interfaces require only their own non-English dictionaries',async()=>{
 const {localizedExampleConfig}=await import('../../../examples/localization/config.mjs');
 const config=localizedExampleConfig(await fixture());delete config.localization.terms;
 const docs=assess(config,{documents:'yes'});assert.equal(docs.validation.authoringShape.valid,true);assert.equal(docs.validation.preview.valid,true);assert.equal(docs.missingRequiredConfig.length,0);
 const agreement=assess(config,{'explicit-agreement':'yes'});assert.ok(agreement.missingRequiredConfig.some(f=>f.path==='localization.terms'));assert.equal(agreement.missingRequiredConfig.some(f=>f.path==='localization.formPermission'),false);
 const form=assess(config,{'form-permission':'yes'});assert.ok(form.missingRequiredConfig.some(f=>f.path==='localization.formPermission'));assert.equal(form.missingRequiredConfig.some(f=>f.path==='localization.terms'),false);assert.ok(form.missingRequiredConfig.some(f=>f.path==='scopeGuards'));
 const dictionary=JSON.parse(await readFile(new URL('../../../examples/localization/form-messages.json',import.meta.url),'utf8'));config.localization.formPermission=dictionary;config.scopeGuards={version:1,revision:'test-1',site:{children:'unknown',sensitiveData:'unknown',highRiskProfiling:'unknown',regulatedSector:'unknown'}};
 assert.equal(assess(config,{'form-permission':'yes'}).missingRequiredConfig.length,0);
 delete config.localization;config.site.locale='en-GB';const english=assess(config,{'form-permission':'yes','explicit-agreement':'yes'});
 assert.equal(english.validation.preview.valid,true);assert.equal(english.missingRequiredConfig.some(f=>f.path.startsWith('localization.')),false);
 // Nothing about the selected locale introduces a regional target or policy.
 assert.equal(form.targets.some(t=>t.id==='regional-consent'),false);assert.equal(Object.hasOwn(config,'consent'),true);
});

test('form permission guidance exposes the guard prerequisite and actual grant support boundary',async()=>{
 const config=await fixture({reviewed:true}),report=assess(config,{'form-permission':'yes'});
 assert.equal(report.status,'needs-input');assert.ok(report.missingRequiredConfig.some(f=>f.targetId==='form-permissions'&&f.path==='scopeGuards'));
 for(const id of ['children','sensitive-data','high-risk-profiling','regulated-sector'])assert.ok(report.questions.some(q=>q.id===id&&q.status==='needs-answer'));
 assert.ok(report.targets.find(t=>t.id==='form-permissions').hostWorkToVerify.some(task=>task.includes('formPermissionGrantSupported(offer)')));
 assert.equal(config.scopeGuards,undefined);
});

test('exception settings select their own prerequisites without demanding consent enrollment',async()=>{
 const config=await fixture({reviewed:true}),report=assess(config,{'assessed-storage-exceptions':'yes','optional-service-control':'no'});
 assert.deepEqual(report.requestedTargetIds,['storage-exceptions']);assert.deepEqual(report.prerequisiteTargetIds,['legal-pages']);
 assert.deepEqual(report.missingRequiredConfig.map(f=>f.path),['storageExceptions','storageExceptions.entries','scopeGuards']);
 assert.equal(report.targets.some(t=>t.id==='cookie-consent'),false);assert.equal(report.targets.some(t=>t.id==='regional-consent'),false);
 assert.equal(Object.hasOwn(config,'consent'),false);assert.equal(Object.hasOwn(config,'storageExceptions'),false);
});

test('static collection work selects no permission controller and requests only its localized dictionary',async()=>{
 const {localizedExampleConfig}=await import('../../../examples/localization/config.mjs'),config=localizedExampleConfig(await fixture()),report=assess(config,{'collection-surface':'yes'});
 assert.deepEqual(report.requestedTargetIds,['collection-notice']);assert.deepEqual(report.prerequisiteTargetIds,['legal-pages']);assert.equal(report.targets.some(t=>['cookie-consent','form-permissions','evidence'].includes(t.id)),false);
 assert.deepEqual(report.missingRequiredConfig.map(f=>f.path),['localization.collection']);
 config.localization.collection=JSON.parse(await readFile(new URL('../../../examples/localization/collection-messages.json',import.meta.url),'utf8'));
 assert.equal(assess(config,{'collection-surface':'yes'}).missingRequiredConfig.length,0);
 config.purposes=[];config.services=[];config.storage=[];delete config.consent;assert.ok(assess(config,{'collection-surface':'yes'}).missingRequiredConfig.some(f=>f.path==='purposes'&&f.state==='empty'));
});

test('assessment identifies missing control config without inventing values or adding a backend',async()=>{
 const config=await fixture(),before=structuredClone(config);
 const result=assess(config,{'optional-service-control':'yes'});
 assert.deepEqual(result.requestedTargetIds,['cookie-consent']);assert.deepEqual(result.prerequisiteTargetIds,['legal-pages']);
 assert.deepEqual(result.missingRequiredConfig.map(f=>f.path),['consent','consent.purposes','consent.services']);
 assert.equal(result.status,'needs-input');assert.equal(result.productionReady,false);
 assert.ok(result.questions.some(q=>q.id==='children'&&q.choice==='unknown'));
 assert.equal(result.questions.some(q=>q.id==='consumer-payments'),false);
 assert.equal(result.targets.some(t=>t.id==='evidence'),false);assert.deepEqual(config,before);
 assert.ok(result.targets.find(t=>t.id==='cookie-consent').hostWorkToVerify.some(v=>v.includes('cleanup')));
 assert.equal(Object.hasOwn(result,'config'),false);assert.equal(Object.hasOwn(config,'consent'),false);
});

test('empty control scopes and absent technology guards remain explicit missing prerequisites',async()=>{
 const config=await fixture({reviewed:true});
 config.consent={purposes:[],services:[],grantLifetimeDays:30,refusalLifetimeDays:30,dismissalMinutes:15};
 const result=assess(config,{'optional-service-control':'yes'});
 assert.equal(result.validation.production.valid,true);
 assert.deepEqual(result.missingRequiredConfig.map(f=>[f.path,f.state]),[['consent.purposes','empty'],['consent.services','empty']]);
 assert.equal(result.status,'needs-input');
 assert.ok(assess(config,{'technology-notice':'yes'}).missingRequiredConfig.some(f=>f.targetId==='technology-functions'&&f.path==='scopeGuards'));
});

test('minimum target prerequisites are distinct from optional fields and array coverage',async()=>{
 const config=await fixture();
 config.services[0].resourceOrigins=['https://media.example.test'];config.services.push({...config.services[0],id:'other',resourceOrigins:undefined});delete config.services[1].resourceOrigins;
 const result=assess(config,{'remote-media':'yes'}),media=result.targets.find(t=>t.id==='embeds');
 assert.deepEqual(media.configuration,[{path:'services.resourceOrigins',state:'partial',matchedItems:1,totalItems:2,requiredForTarget:false},{path:'localization.embeds',state:'absent',matchedItems:0,totalItems:1,requiredForTarget:false}]);
 assert.equal(result.missingRequiredConfig.some(f=>f.path==='services.resourceOrigins'),false);
 for(const [question,path] of [['rights-entry','rightsCenter'],['translated-copy','localization']]){
  const report=assess(config,{[question]:'yes'});assert.ok(report.missingRequiredConfig.some(f=>f.path===path));
 }
 const empty=assess(config,{});assert.equal(empty.status,'no-targets');assert.deepEqual(empty.questions,[]);assert.deepEqual(empty.targets,[]);
});

test('answered questions and valid configuration never assert host behavior or legal readiness',async()=>{
 const config=await fixture({reviewed:true}),reference=describeIntegration(['terms-agreement']);
 assert.deepEqual(Object.keys(reference.targetAnswersTemplate.answers),reference.relevantQuestionIds);
 assert.equal(Object.hasOwn(reference.targetAnswersTemplate.answers,'children'),false);
 const answers=reference.targetAnswersTemplate;
 for(const answer of Object.values(answers.answers)){answer.choice='yes';answer.justification='Operator supplied synthetic test facts.';}
 const result=assess(config,{'explicit-agreement':'yes'},answers);
 assert.equal(result.validation.production.valid,true);assert.equal(result.status,'needs-verification');assert.equal(result.productionReady,false);
 assert.ok(result.questions.every(q=>q.status==='recorded-unverified'));
 for(const question of describeIntegration().questions.filter(q=>!reference.relevantQuestionIds.includes(q.id)))assert.equal(result.sharedReviewItems.some(item=>item.startsWith(question.title)),false,question.id);
 assert.ok(result.targets.find(t=>t.id==='terms-agreement').acceptanceScenarios.some(v=>v.includes('unchecked')));
 assert.ok(result.targets.every(t=>t.factsToConfirm.length&&t.hostWorkToVerify.length));
 config.documents.terms.review.status='draft';assert.equal(assess(config,{'explicit-agreement':'yes'},answers).status,'needs-review');
 answers.publicFacts={controllerName:'PRIVATE-OTHER-NAME'};
 const conflict=assess(config,{'explicit-agreement':'yes'},answers);assert.equal(conflict.status,'needs-input');
 assert.deepEqual(conflict.factConflicts.map(f=>[f.factId,f.path]),[['controllerName','controller.name']]);
 assert.doesNotMatch(JSON.stringify(conflict),/PRIVATE-OTHER-NAME/u);
});

test('assessment reuses wizard conflict advice without rewriting declarations',async()=>{
 const config=await fixture(),before=structuredClone(config);
 const result=assess(config,{documents:'yes'},{schemaVersion:1,markets:[],answers:{'personal-data':{choice:'no',justification:'Test declaration contradicts inventory.'}}});
 assert.ok(result.sharedReviewItems.some(s=>s.startsWith('Conflict: personal-data')));assert.deepEqual(config,before);
 assert.ok(result.practiceConflicts.length);assert.equal(result.status,'needs-input');
 const report=createSetupPlan({schemaVersion:1,markets:[],answers:{}},{config}).report;
 assert.deepEqual(assess(config,{documents:'yes'},report).questions,assess(config,{documents:'yes'},report.answers).questions);
 config.site.url='invalid';const invalid=assess(config,{documents:'yes'});assert.equal(invalid.status,'invalid-config');
 assert.ok(invalid.validation.preview.diagnostics.some(d=>d.path==='site.url'));
 const contradictory={schemaVersion:1,markets:[],answers:{'personal-data':{choice:'no',justification:'PRIVATE-JUSTIFICATION-MARKER'}}};
 config.site.url=before.site.url;assert.doesNotMatch(JSON.stringify(assess(config,{documents:'yes'},contradictory)),/PRIVATE-JUSTIFICATION-MARKER/u);
});

test('API rejects executable, cyclic and oversized inputs before invoking user code',async()=>{
 const config=await fixture(),valid={config,selection:selection({documents:'yes'})};let reads=0;
 const accessor={...valid,get answers(){reads++;return {};}};
 const nested=structuredClone(valid);Object.defineProperty(nested.config.controller,'name',{enumerable:true,get(){reads++;return 'bad';}});
 const custom={...valid,config:{toJSON(){reads++;return config;}}};
 const cyclic={...valid};cyclic.extra=cyclic;
 for(const value of [null,[],{},accessor,nested,custom,cyclic,{...valid,extra:true},{...valid,config:{private:{huge:'x'.repeat(1024*1024+1)}}},{...valid,config:new Date()}, {...valid,config:[,]}])assert.throws(()=>assessIntegration(value),/bounded plain JSON/u);
 assert.equal(reads,0);
});

test('CLI reads only explicit files, returns private diagnostics, and changes nothing',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-assess-')),cli=fileURLToPath(new URL('../dist/cli.js',import.meta.url));
 try{
  const config=await fixture();config.private={secret:'PRIVATE-SECRET-MARKER'};
  await writeFile(join(cwd,'config.json'),JSON.stringify(config));await writeFile(join(cwd,'scope.json'),JSON.stringify(selection({'optional-service-control':'yes'})));
  await writeFile(join(cwd,'notabenda.config.mjs'),"throw Error('Do not execute project code');");
  const before=await readdir(cwd),original=await readFile(join(cwd,'config.json'),'utf8');
  const run=(...args)=>spawnSync(process.execPath,[cli,'assess',...args],{cwd,encoding:'utf8',timeout:10000});
  const result=run('--selection','scope.json','--config','config.json','--json');assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);assert.equal(report.kind,'private-integration-assessment');assert.ok(report.package.version);assert.equal(report.status,'needs-input');assert.doesNotMatch(result.stdout,/PRIVATE-SECRET-MARKER/u);
  assert.deepEqual(await readdir(cwd),before);assert.equal(await readFile(join(cwd,'config.json'),'utf8'),original);
  const text=run('--selection','scope.json','--config','config.json');assert.equal(text.status,0);assert.match(text.stdout,/No files changed/u);
  await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{'personal-data':{choice:'no',justification:'Contradicts the test inventory.'}}}));
  const conflict=run('--selection','scope.json','--config','config.json','--answers','answers.json');assert.equal(conflict.status,0);assert.match(conflict.stdout,/0 public facts, 1 practice declarations/u);
  await symlink('config.json',join(cwd,'linked.json'));
  for(const args of [[],['--selection','scope.json'],['--config','config.json'],['--selection','scope.json','--config','linked.json'],['--selection','scope.json','--config','.'],['--selection','scope.json','--config','PRIVATE-NOT-FOUND'],['--selection','scope.json','--config','config.json','--json','--json'],['--selection','scope.json','--config','config.json','--preview']]){
   const failed=run(...args);assert.equal(failed.status,1);assert.doesNotMatch(failed.stderr,/PRIVATE-NOT-FOUND|PRIVATE-SECRET-MARKER/u);
  }
 }finally{await rm(cwd,{recursive:true,force:true});}
});
