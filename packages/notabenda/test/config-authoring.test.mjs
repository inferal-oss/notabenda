// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-AGENT-INTEGRATION REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,access} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawnSync} from 'node:child_process';
import {stringify} from 'yaml';import {build} from 'esbuild';
import {validateAuthoredConfig,inspectConfigAuthoringShape} from '@notabenda/core/config/validate';
import {readSiteConfig,readConfigSource,formatConfigSource} from '@notabenda/core/config/node';
import {validateSiteConfig,toPublicConfig} from '@notabenda/core';
import {assessIntegration} from '@notabenda/core/integration/assessment';
import {describeIntegration} from '@notabenda/core/integration';
import {fixture} from './helpers.mjs';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const run=(cwd,...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8',timeout:10000});

test('unknown fields fail authoring checks at their exact paths without values, coercion or mutation',async()=>{
 const contract=describeIntegration().configContract;assert.equal(contract.validationUsesAuthoringShape,true);assert.deepEqual(contract.sourceFormats,['json','yaml','markdown']);assert.deepEqual(contract.sourceExtensions,['.json','.yaml','.yml','.md']);assert.equal(contract.authoringValidator,'@notabenda/core/config/validate');
 const original=await fixture({reviewed:true});
 for(const [change,path] of [[c=>{c.conset={enabled:true,note:'PRIVATE_VALUE'};},'/conset'],[c=>{c.services[0].resourceOrigin=['PRIVATE_VALUE'];},'/services/0/resourceOrigin'],[c=>{c.documents.privacy.review.approvedBy='PRIVATE_VALUE';},'/documents/privacy/review/approvedBy'],[c=>{c['wrong/key~name']='PRIVATE_VALUE';},'/wrong~1key~0name']]){
  const config=structuredClone(original);change(config);const before=structuredClone(config),result=validateAuthoredConfig(config);
  assert.equal(result.valid,false);assert.ok(result.diagnostics.some(d=>d.path===path&&d.code==='config-shape-additionalProperties'),JSON.stringify(result));assert.doesNotMatch(JSON.stringify(result),/PRIVATE_VALUE/);assert.deepEqual(config,before);
  const shape=inspectConfigAuthoringShape(config);assert.equal(shape.valid,false);assert.ok(shape.diagnostics.some(d=>d.instancePath===path));
  const assessment=assessIntegration({config,selection:{schemaVersion:1,answers:{documents:'yes'}}});assert.deepEqual(assessment.validation.authoringShape,shape);
 }
});

test('known shape, semantic references and review declarations remain separate checks',async()=>{
 const valid=await fixture({reviewed:true}),before=structuredClone(valid);assert.deepEqual(validateAuthoredConfig(valid),validateSiteConfig(valid,{mode:'production'}));assert.deepEqual(valid,before);
 const invalid=structuredClone(valid);invalid.services[0].purposeIds=['not-declared'];assert.equal(inspectConfigAuthoringShape(invalid).valid,true);assert.deepEqual(validateAuthoredConfig(invalid),validateSiteConfig(invalid,{mode:'production'}));assert.equal(validateAuthoredConfig(invalid).valid,false);
 const draft=await fixture();assert.equal(validateAuthoredConfig(draft).valid,false);assert.equal(validateAuthoredConfig(draft,{mode:'preview'}).valid,true);assert.equal(draft.documents.privacy.review.status,'draft');
 const wrong=structuredClone(valid);wrong.consent={grantLifetimeDays:'180'};assert.equal(validateAuthoredConfig(wrong,{mode:'preview'}).valid,false);assert.equal(wrong.consent.grantLifetimeDays,'180');
});

test('private JSON metadata is allowed while ordinary programmatic public projection retains its contract',async()=>{
 const config=await fixture({reviewed:true});config.private={nested:{customField:['PRIVATE_VALUE',null,true,1]}};
 assert.equal(validateAuthoredConfig(config).valid,true);assert.doesNotMatch(JSON.stringify(toPublicConfig(config)),/PRIVATE_VALUE/);
 const hostObject={...config,hostOnlyMetadata:{text:'PRIVATE_VALUE'}};assert.equal(validateSiteConfig(hostObject,{mode:'production'}).valid,true);assert.equal(validateAuthoredConfig(hostObject).valid,false);assert.deepEqual(toPublicConfig(hostObject),toPublicConfig(config));
});

test('executable/nonplain API values and pathological inputs fail without invoking getters or serialization hooks',async()=>{
 const config=await fixture({reviewed:true});let called=0;
 const getter={...config};Object.defineProperty(getter,'site',{enumerable:true,get(){called++;throw Error('PRIVATE_VALUE');}});
 const jsonHook={...config,toJSON(){called++;throw Error('PRIVATE_VALUE');}};const cyclic={...config};cyclic.private=cyclic;
 const hidden={...config};Object.defineProperty(hidden,'extra',{value:1,enumerable:false});
 const sparse={...config,private:new Array(10)};const symbol={...config,[Symbol('PRIVATE_VALUE')]:true};
 let nested={};for(let i=0;i<70;i++)nested={child:nested};
 for(const value of [getter,jsonHook,cyclic,hidden,sparse,symbol,{...config,private:{x:Infinity}},{...config,private:{x:new Date()}},Object.create(config),{...config,private:nested},{...config,private:{text:'é'.repeat(600000)}}]){
  const result=validateAuthoredConfig(value);assert.equal(result.valid,false);assert.equal(result.diagnostics[0].code,'config-shape-plain-data');assert.doesNotMatch(JSON.stringify(result),/PRIVATE_VALUE/);
 }
 assert.equal(called,0);
});

test('large invalid inputs produce bounded, detached diagnostics and cannot poison a later result',async()=>{
 const config=await fixture({reviewed:true});for(let i=0;i<150;i++)config['unknown'+i]='PRIVATE_VALUE';
 const shape=inspectConfigAuthoringShape(config);assert.equal(shape.truncated,true);assert.equal(shape.diagnostics.length,100);
 const result=validateAuthoredConfig(config);assert.equal(result.diagnostics.length,101);assert.equal(result.diagnostics.at(-1).code,'config-shape-truncated');assert.doesNotMatch(JSON.stringify(result),/PRIVATE_VALUE/);
 shape.diagnostics[0].message='changed';assert.notEqual(inspectConfigAuthoringShape(config).diagnostics[0].message,'changed');assert.equal(validateAuthoredConfig(await fixture({reviewed:true})).valid,true);
});

test('all source formats reject a typo before build/setup output; assessment retains its structured invalid report',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-authoring-check-'));
 try{
  const config=await fixture({reviewed:true});config.conset={note:'PRIVATE_VALUE'};
  await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));await writeFile(join(cwd,'selection.json'),JSON.stringify({schemaVersion:1,answers:{documents:'yes'}}));
  for(const [extension,text] of [['json',JSON.stringify(config)],['yaml',stringify(config)],['yml',stringify(config)],['md','---\n'+stringify(config)+'---\nPRIVATE_BODY_NOTE\n']]){
   const file='site.'+extension,path=join(cwd,file);await writeFile(path,text);const before=await readFile(path,'utf8');
   const check=run(cwd,'check','--config',file,'--preview','--json');assert.equal(check.status,1,check.stderr);assert.ok(JSON.parse(check.stdout).diagnostics.some(d=>d.path==='/conset'));assert.doesNotMatch(check.stdout+check.stderr,/PRIVATE_VALUE|PRIVATE_BODY_NOTE/);
   for(const args of [['build','--config',file,'--preview','--out-dir','build-'+extension],['wizard','--config',file,'--answers','answers.json','--out-dir','setup-'+extension]]){const r=run(cwd,...args);assert.equal(r.status,1);assert.match(r.stderr,/Unknown configuration field/);assert.doesNotMatch(r.stderr,/PRIVATE_VALUE|PRIVATE_BODY_NOTE/);}
   await assert.rejects(access(join(cwd,'build-'+extension)),error=>error.code==='ENOENT');await assert.rejects(access(join(cwd,'setup-'+extension)),error=>error.code==='ENOENT');
   const discovery=run(cwd,'discover','--config',file,'--capture','absent.json','--json');assert.equal(discovery.status,1);assert.match(discovery.stderr,/Unknown configuration field/);
   const catalog=spawnSync(process.execPath,['--input-type=module','-e',`import {runCatalogReviewCli} from ${JSON.stringify(new URL('../dist/catalog-review-cli.js',import.meta.url).href)};Object.defineProperty(process.stdin,'isTTY',{value:true});Object.defineProperty(process.stdout,'isTTY',{value:true});try{await runCatalogReviewCli(JSON.parse(process.argv[1]));}catch(error){console.error(error.message);process.exitCode=1;}`,JSON.stringify(['--config',file,'--report','absent.json','--service','test','--out-dir','catalog-'+extension])],{cwd,encoding:'utf8',timeout:10000});assert.equal(catalog.status,1);assert.match(catalog.stderr,/Unknown configuration field/);await assert.rejects(access(join(cwd,'catalog-'+extension)),error=>error.code==='ENOENT');
   const assessment=run(cwd,'assess','--config',file,'--selection','selection.json','--json');assert.equal(assessment.status,0,assessment.stderr);assert.equal(JSON.parse(assessment.stdout).status,'invalid-config');
   await assert.rejects(readSiteConfig(path,{mode:'preview'}),error=>error.name==='SiteConfigError'&&error.diagnostics.some(d=>d.path==='/conset'));assert.equal((await readConfigSource(path)).config.conset.note,'PRIVATE_VALUE');assert.equal(await readFile(path,'utf8'),before);
  }
  await assert.rejects(formatConfigSource(config,'yaml'),error=>error.name==='SiteConfigError');
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('the optional authoring validator bundles for browsers while ordinary entry graphs exclude it',async()=>{
 for(const entry of ['@notabenda/core','@notabenda/core/headless','@notabenda/core/consent','@notabenda/core/config/validate']){
  const result=await build({stdin:{contents:`export * from '${entry}';`,resolveDir:process.cwd()},bundle:true,platform:'browser',write:false,metafile:true});
  const inputs=Object.keys(result.metafile.inputs);assert.equal(inputs.some(path=>path.endsWith('/config-authoring.ts')||path.endsWith('/config-authoring.js')),entry.endsWith('/config/validate'));assert.ok(inputs.every(path=>!/(?:config-source|config-yaml|node_modules\/yaml)/u.test(path)));
 }
});

test('human command errors escape control characters in field names while JSON retains the exact pointer',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-field-path-'));
 try{
  const config=await fixture({reviewed:true}),key='bad/\u001b[31mfield\n';config[key]='PRIVATE_VALUE';await writeFile(join(cwd,'site.json'),JSON.stringify(config));
  const json=run(cwd,'check','--config','site.json','--preview','--json');assert.equal(json.status,1);assert.ok(JSON.parse(json.stdout).diagnostics.some(d=>d.path==='/bad~1\u001b[31mfield\n'));
  for(const args of [['check','--config','site.json','--preview'],['build','--config','site.json','--preview']]){
   const result=run(cwd,...args);assert.equal(result.status,1);assert.doesNotMatch(result.stderr,/\u001b|PRIVATE_VALUE/);assert.ok(result.stderr.includes('\\u001b[31mfield\\u000a'));
  }
 }finally{await rm(cwd,{recursive:true,force:true});}
});
