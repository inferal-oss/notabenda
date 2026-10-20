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
 const report=await measureBundles();assert.equal(report.schemaVersion,1);assert.equal(report.tool.target,'es2022');assert.equal(report.compression.level,9);
 const core=report.profiles.find(p=>p.id==='core-controls'),state=report.profiles.find(p=>p.id==='headless'),css=report.profiles.find(p=>p.id==='consent-css');assert.equal(core.budgetBytes,15*1024);assert.equal(css.budgetBytes,5*1024);assert.ok(css.withinBudget);
 for(const profile of [core,state]){assert.ok(profile.gzipBytes>0);assert.ok(profile.inputs.some(path=>path.endsWith('/consent.js')));assert.ok(profile.inputs.every(path=>!/(?:notabenda-cf|notabenda-authoring|node_modules\/(?:react|astro)|\/(?:cli|content|setup|discovery)\.js$)/u.test(path)));}
 assert.ok(state.inputs.every(path=>!/(?:controls|documents|terms|react)\.js$/u.test(path)));assert.ok(core.inputs.some(path=>path.endsWith('/controls.js')));
 const compiled=report.profiles.find(p=>p.id==='compiled-local'),required=report.profiles.find(p=>p.id==='compiled-required');
 assert.ok(compiled.withinBudget);assert.ok(compiled.inputs.some(path=>path.endsWith('/consent-engine.js')));assert.ok(compiled.inputs.every(path=>!/\/(?:config|consent-evidence|documents|rights-policy|content|consent-compile)\.js$/u.test(path)));assert.ok(required.inputs.some(path=>path.endsWith('/consent-evidence.js')));
 const react=report.profiles.find(p=>p.id==='react-compiled');assert.deepEqual(react.external,['react']);assert.ok(react.imports.some(i=>i.entry==='@notabenda/core/consent'));assert.ok(react.inputs.every(path=>!/(?:node_modules\/react|\/(?:config|consent-evidence|react-documents|react-form-permission))\.js$/u.test(path)));
 const exceptions=report.profiles.find(p=>p.id==='storage-exceptions');assert.ok(exceptions.gzipBytes>0);assert.ok(exceptions.inputs.every(path=>!/(?:notabenda-cf|notabenda-authoring|node_modules\/(?:react|astro)|\/(?:content|setup|cli)\.js$)/u.test(path)));assert.ok(compiled.inputs.every(path=>!path.endsWith('/storage-exceptions.js')));
 const technologyCss=report.profiles.find(p=>p.id==='technology-notice-css');assert.equal(technologyCss.entry,'@notabenda/core/technology.css');assert.equal(technologyCss.gzipBytes,gzipSync(await readFile(new URL('../dist/technology.css',import.meta.url)),{level:9}).length);
 const failed=report.profiles.filter(p=>p.budgetBytes!==null&&p.gzipBytes>p.budgetBytes);assert.equal(report.allBudgetsMet,failed.length===0);
 assert.match(formatBundleReport(report),core.withinBudget?/core-controls.*within target/u:/core-controls.*OVER TARGET/u);assert.doesNotMatch(JSON.stringify(report),/\/Users\/|ADMIN_KEY/u);
 const cli=spawnSync(process.execPath,[new URL('../../../scripts/measure-bundles.mjs',import.meta.url).pathname,'--json','--check'],{encoding:'utf8',timeout:10000});assert.equal(cli.status,report.allBudgetsMet?0:1,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),report);
 const invalid=spawnSync(process.execPath,[new URL('../../../scripts/measure-bundles.mjs',import.meta.url).pathname,'--invented'],{encoding:'utf8',timeout:10000});assert.equal(invalid.status,2);assert.match(invalid.stderr,/Usage/);
});
