// @requirements REQ-PRODUCT-TERMS-RECOVERY
// @requirements REQ-PRODUCT-COLLECTION-FLOW
// @requirements REQ-QC-PROFILING
// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-BUNDLE-BUDGET
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import postcss from 'postcss';
import {gzipSync} from 'node:zlib';
import * as headless from '../dist/headless.js';
import {createConsent} from '../dist/index.js';
import {measureBundles,formatBundleReport} from '../../../scripts/measure-bundles.mjs';

test('headless entry shares the exact consent engine and imports with browser globals unavailable',()=>{
 assert.equal(headless.createConsent,createConsent);
 assert.equal(Object.keys(headless).some(name=>/^(?:mount|render)/u.test(name)),false);
 const code=`for (const key of ['window','document','navigator']) Object.defineProperty(globalThis,key,{configurable:true,get(){throw Error('Browser capability read at import: '+key)}});const api=await import(${JSON.stringify(new URL('../dist/headless.js',import.meta.url).href)});if(typeof api.createConsent!=='function')process.exit(1);`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',timeout:10000});assert.equal(result.status,0,result.stderr);
});

const context=rule=>{const parents=[];for(let parent=rule.parent;parent&&parent.type!=='root';parent=parent.parent)parents.unshift('@'+parent.name+' '+parent.params);return parents.join('|');};
const declarations=rule=>rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,!!n.important]);
test('published consent CSS retains canonical declarations, cascade and accessibility media without unrelated components',async()=>{
 const source=await readFile(new URL('../src/styles.css',import.meta.url),'utf8'),full=await readFile(new URL('../dist/styles.css',import.meta.url),'utf8'),css=await readFile(new URL('../dist/consent.css',import.meta.url),'utf8');const handoff=await readFile(new URL('../src/agent-handoff.css',import.meta.url),'utf8');assert.equal(full,source+'\n'+handoff);
 const canonical=[];postcss.parse(source).walkRules(rule=>canonical.push({selector:rule.selector,context:context(rule),declarations:declarations(rule)}));
 let last=-1,count=0;const profile=postcss.parse(css);
 profile.walkRules(rule=>{const match={selector:rule.selector,context:context(rule),declarations:declarations(rule)},index=canonical.findIndex((item,i)=>i>last&&JSON.stringify(item)===JSON.stringify(match));assert.ok(index>last,'Canonical cascade/declarations missing for '+rule.selector);last=index;count++;});
 assert.ok(count>35);assert.ok(gzipSync(css,{level:9}).length<=5*1024);
 assert.match(css,/\.nb-controls \[hidden\][^}]*display:\s*none/u);assert.match(css,/\.nb-preferences::backdrop/u);assert.match(css,/forced-colors:\s*active/u);assert.match(css,/prefers-reduced-motion:\s*reduce/u);assert.match(css,/safe-area-inset-bottom/u);assert.match(css,/focus-visible/u);assert.match(css,/@media print/u);
 assert.doesNotMatch(css,/\.nb-(?:setup|contract|terms-acceptance|form-permission|rights-center|discovery|agent-)/u);assert.doesNotMatch(css,/@import|url\(/u);
});

test('real browser entry measurements expose missed targets and exclude backend, build and framework modules',async()=>{
 const report=await measureBundles();assert.equal(report.schemaVersion,1);assert.equal(report.tool.target,'es2022');assert.equal(report.compression.level,9);assert.equal(report.compression.version,process.versions.zlib);assert.equal(report.environment.version,process.version);
 const core=report.profiles.find(p=>p.id==='core-controls'),state=report.profiles.find(p=>p.id==='headless'),css=report.profiles.find(p=>p.id==='consent-css');assert.equal(core.budgetBytes,15*1024);assert.equal(css.budgetBytes,5*1024);assert.ok(css.withinBudget);
 for(const profile of [core,state]){assert.ok(profile.gzipBytes>0);assert.ok(profile.inputs.some(path=>path.endsWith('/consent.js')));assert.ok(profile.inputs.every(path=>!/(?:notabenda-cf|notabenda-authoring|node_modules\/(?:react|astro)|\/(?:cli|content|setup|discovery)\.js$)/u.test(path)));}
 assert.ok(state.inputs.every(path=>!/(?:controls|documents|terms|react)\.js$/u.test(path)));assert.ok(core.inputs.some(path=>path.endsWith('/controls.js')));
 const compiled=report.profiles.find(p=>p.id==='compiled-local'),required=report.profiles.find(p=>p.id==='compiled-required');
 assert.ok(compiled.withinBudget);assert.ok(compiled.inputs.some(path=>path.endsWith('/consent-engine.js')));assert.ok(compiled.inputs.every(path=>!/\/(?:config|consent-evidence|documents|rights-policy|content|consent-compile)\.js$/u.test(path)));assert.ok(required.inputs.some(path=>path.endsWith('/consent-evidence.js')));
 const react=report.profiles.find(p=>p.id==='react-compiled');assert.deepEqual(react.external,['react']);assert.ok(react.imports.some(i=>i.entry==='@notabenda/core/consent'));assert.ok(react.inputs.every(path=>!/(?:node_modules\/react|\/(?:config|consent-evidence|react-documents|react-form-permission))\.js$/u.test(path)));
 const exceptions=report.profiles.find(p=>p.id==='storage-exceptions');assert.ok(exceptions.gzipBytes>0);assert.ok(exceptions.inputs.every(path=>!/(?:notabenda-cf|notabenda-authoring|node_modules\/(?:react|astro)|\/(?:content|setup|cli)\.js$)/u.test(path)));assert.ok(compiled.inputs.every(path=>!path.endsWith('/storage-exceptions.js')));
 const recovery=report.profiles.find(p=>p.id==='terms-recovery');assert.ok(recovery.gzipBytes>0);assert.ok(recovery.inputs.every(path=>!/(?:notabenda-cf|notabenda-authoring|node_modules\/(?:react|astro)|\/(?:content|setup|cli)\.js$)/u.test(path)));assert.ok(compiled.inputs.every(path=>!path.endsWith('/terms-recovery.js')));
 const flow=report.profiles.find(p=>p.id==='collection-flow');assert.ok(flow.gzipBytes>0);assert.ok(flow.inputs.some(path=>path.endsWith('/collection-flow.js')));assert.ok(flow.inputs.every(path=>!/(?:notabenda-cf|notabenda-authoring|node_modules\/(?:react|astro)|\/(?:collection-flow-build|content|setup|cli)\.js$)/u.test(path)));assert.ok(compiled.inputs.every(path=>!path.endsWith('/collection-flow.js')));
 const technologyCss=report.profiles.find(p=>p.id==='technology-notice-css');assert.equal(technologyCss.entry,'@notabenda/core/technology.css');assert.equal(technologyCss.gzipBytes,gzipSync(await readFile(new URL('../dist/technology.css',import.meta.url)),{level:9}).length);
 for(const profile of report.profiles){assert.match(profile.sha256,/^[a-f0-9]{64}$/u);assert.ok(profile.inputs.every(path=>!/\/catalog-(?:project|composer|python-project|nuget)\.js$/u.test(path)),'Node-only discovery in '+profile.id);}
 const failed=report.profiles.filter(p=>p.budgetBytes!==null&&p.gzipBytes>p.budgetBytes);assert.equal(report.allBudgetsMet,failed.length===0);
 assert.match(formatBundleReport(report),core.withinBudget?/core-controls.*within target/u:/core-controls.*OVER TARGET/u);assert.doesNotMatch(JSON.stringify(report),/\/Users\/|ADMIN_KEY/u);
 const cli=spawnSync(process.execPath,[new URL('../../../scripts/measure-bundles.mjs',import.meta.url).pathname,'--json','--check'],{encoding:'utf8',timeout:10000});assert.equal(cli.status,report.allBudgetsMet?0:1,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),report);
 const invalid=spawnSync(process.execPath,[new URL('../../../scripts/measure-bundles.mjs',import.meta.url).pathname,'--invented'],{encoding:'utf8',timeout:10000});assert.equal(invalid.status,2);assert.match(invalid.stderr,/Usage/);
});

test('size explanations measure real public boundaries without changing budgets or depending on the caller directory',async()=>{
 const report=await measureBundles({explain:true}),plain=await measureBundles();
 assert.deepEqual(report.profiles,plain.profiles);assert.equal(report.allBudgetsMet,plain.allBudgetsMet);
 const e=report.explanation;assert.equal(e.sizesAreAdditive,false);assert.equal(e.kind,'current-public-composition');
 assert.deepEqual(e.publicBoundaryProfiles.map(p=>p.exports),[['validateSiteConfig'],['toPublicConfig'],['toPublicConfig','mountControls']]);
 for(const p of e.publicBoundaryProfiles){assert.equal(p.entry,'@notabenda/core');assert.equal(p.budgetBytes,null);assert.equal(p.withinBudget,null);assert.ok(p.gzipBytes>0);assert.match(p.sha256,/^[a-f0-9]{64}$/u);assert.ok(p.inputs.some(path=>path.endsWith('/config.js')));assert.ok(p.inputs.every(path=>!/(?:consent-engine|consent-evidence)\.js$/u.test(path)));}
 assert.ok(e.publicBoundaryProfiles.at(-1).inputs.some(path=>path.endsWith('/controls.js')));
 const core=report.profiles.find(p=>p.id==='core-controls');assert.deepEqual(e.coreInputContributions.map(c=>c.path),core.inputs);assert.ok(e.coreInputContributions.every(c=>Number.isSafeInteger(c.bytesInOutput)&&c.bytesInOutput>0));
 assert.ok(e.coreInputContributions.reduce((n,c)=>n+c.bytesInOutput,0)<=core.bytes);
 assert.match(formatBundleReport(report),/gzip sizes are not additive; original budgets are unchanged/u);
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),cwd=await mkdtemp(join(tmpdir(),'nb-size-caller-'));
 try{
  const cli=spawnSync(process.execPath,[new URL('../../../scripts/measure-bundles.mjs',import.meta.url).pathname,'--json','--check','--explain'],{cwd,encoding:'utf8',timeout:10000});
  assert.equal(cli.status,plain.allBudgetsMet?0:1,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),report);
  for(const p of [...report.profiles,...e.publicBoundaryProfiles])assert.ok(p.inputs.every(path=>!/(?:^|\/)\.\.(?:\/|$)|^\/|^[A-Za-z]:/u.test(path)));
  assert.doesNotMatch(cli.stdout,/\/Users\/|ADMIN_KEY|nb-size-caller-/u);
 }finally{await rm(cwd,{recursive:true,force:true});}
});
