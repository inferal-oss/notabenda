// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,symlink,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import {scanProjectServices} from '@notabenda/core/catalog/project';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {normalizeServiceCatalog} from '@notabenda/core/catalog';
import {createCatalogSelectionPlan,normalizeCatalogServiceSelection} from '@notabenda/core/catalog/selection';
import {prepareCatalogSelectionReview} from '@notabenda/core/catalog/review';
import {fixture} from './helpers.mjs';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const scan=dir=>scanProjectServices(dir,serviceCatalogSeed);
async function project(run){const dir=await mkdtemp(join(tmpdir(),'notabenda-cargo-'));try{await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const evidence=(r,id)=>r.findings.find(f=>f.productId===id)?.evidence;

test('Cargo separates normal, optional, development and build declarations and respects package renaming',async()=>project(async dir=>{
 const source=`[package]
name="PRIVATE_PROJECT"
build="PRIVATE_BUILD.rs"
[dependencies]
aws-config="1"
PRIVATE_ALIAS={package="sentry",version="0.49",optional=true,features=["PRIVATE_FEATURE"]}
[dev-dependencies]
mongodb={version="3"}
[build-dependencies.redis]
version="1"
`;
 await writeFile(join(dir,'Cargo.toml'),source);const r=await scan(dir);assert.equal(r.coverage.limited,false);
 for(const [id,context] of [['aws-sdk','dependency'],['sentry-monitoring','optional-dependency'],['mongodb-client','development-dependency'],['redis-client','build-dependency']])assert.equal(evidence(r,id)[0].context,context);
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE_|0\.49/);assert.equal(await readFile(join(dir,'Cargo.toml'),'utf8'),source);
}));
test('all six exact Rust crate signatures carry retrieved references and remain review candidates',async()=>project(async dir=>{
 const products=serviceCatalogSeed.products.filter(p=>p.identifiers.some(r=>r.ecosystem==='cargo'));
 const rules=products.flatMap(p=>p.identifiers.filter(r=>r.ecosystem==='cargo'));assert.equal(products.length,4);assert.equal(rules.length,6);
 await writeFile(join(dir,'Cargo.toml'),'[dependencies]\n'+rules.map(r=>r.value+'="*"').join('\n'));const r=await scan(dir);assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings.map(f=>f.productId),products.map(p=>p.id).sort());
 for(const product of products){assert.equal(product.review,'unreviewed');for(const rule of product.identifiers.filter(r=>r.ecosystem==='cargo'))for(const id of rule.sourceIds){const s=serviceCatalogSeed.sources.find(s=>s.id===id);assert.equal(s.access,'read');assert.equal(s.checkedOn,'2026-10-22');}}
}));
test('target declarations retain their conditional contexts without evaluating targets or revealing conditions',async()=>project(async dir=>{
 await writeFile(join(dir,'Cargo.toml'),`[target.'cfg(PRIVATE_CONDITION)'.dependencies]
sentry="0.49"
redis={version="1",optional=true}
[target.'PRIVATE_TRIPLE'.dev-dependencies]
mongodb="3"
[target.'PRIVATE_TRIPLE'.build-dependencies]
aws-sdk-s3="1"
`);const r=await scan(dir);assert.equal(r.coverage.limited,true);
 for(const [id,context] of [['sentry-monitoring','target-dependency'],['redis-client','target-optional-dependency'],['mongodb-client','target-development-dependency'],['aws-sdk','target-build-dependency']])assert.equal(evidence(r,id)[0].context,context);
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE_/);
}));
test('workspace declarations are not asserted consumed and inherited aliases never become package identities',async()=>project(async dir=>{
 await writeFile(join(dir,'Cargo.toml'),'[workspace]\nmembers=["PRIVATE_MEMBER"]\n[workspace.dependencies]\nPRIVATE_ALIAS={package="redis",version="1"}\n[dependencies]\nsentry={workspace=true}\n');
 await mkdir(join(dir,'member'));await writeFile(join(dir,'member/Cargo.toml'),'[dependencies]\naws-config.workspace=true\n');
 const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings.map(f=>f.productId),['redis-client']);assert.equal(evidence(r,'redis-client')[0].context,'workspace-dependency');assert.doesNotMatch(JSON.stringify(r),/PRIVATE_|aws-config/);
}));
test('Cargo comments, metadata, features, source text, lock names and lookalikes do not create declarations',async()=>project(async dir=>{
 await writeFile(join(dir,'Cargo.toml'),`[package]
name="sentry"
description='''[dependencies]
mongodb="3"'''
# redis="1"
[package.metadata.example.dependencies]
aws-config="1"
[features]
default=["redis"]
[dependencies]
sentry-attacker="1"
Sentry="1"
aws_sdk_s3="1"
`);await writeFile(join(dir,'Cargo.lock'),'[[package]]\nname="sentry"\n');await writeFile(join(dir,'lib.rs'),'use mongodb::Client;');assert.deepEqual((await scan(dir)).findings,[]);
}));
test('quoted and dotted Cargo keys are parsed as TOML, not matched inside prose',async()=>project(async dir=>{
 await writeFile(join(dir,'Cargo.toml'),String.raw`dependencies."aws\u002dconfig"="1"
dependencies.PRIVATE_ALIAS={package="sentry",version="0.49"}
`);const r=await scan(dir);assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings.map(f=>f.productId),['aws-sdk','sentry-monitoring']);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_ALIAS/);
}));
test('redirected sources and overrides retain only named candidates and report unresolved coverage',async()=>project(async dir=>{
 for(const fields of ['path="../PRIVATE_PATH"','git="https://PRIVATE_HOST/PRIVATE_REPO"','version="1",registry="PRIVATE_REGISTRY"','version="1",branch="PRIVATE_BRANCH"']){
  await writeFile(join(dir,'Cargo.toml'),'[dependencies]\nredis={'+fields+'}\n');const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.equal(evidence(r,'redis-client')[0].context,'dependency');assert.doesNotMatch(JSON.stringify(r),/PRIVATE_/);
 }
 for(const suffix of ['[patch.crates-io]\nredis={path="PRIVATE_PATH"}','[replace]\n"redis:1.0.0"={path="PRIVATE_PATH"}','[package]\nworkspace="PRIVATE_ROOT"','cargo-features=["PRIVATE_FEATURE"]']){
  await writeFile(join(dir,'Cargo.toml'),suffix+'\n[dependencies]\nsentry="0.49"\n');const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings.map(f=>f.productId),['sentry-monitoring']);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_/);
 }
}));
test('malformed and unsupported Cargo inputs stay limited without source or parser diagnostics',async()=>project(async dir=>{
 for(const source of ['[dependencies]\nsentry="1"\nsentry="2"','[dependencies]\nsentry={','dependencies="PRIVATE_VALUE"','[dependencies]\nsentry=42','[dependencies]\nredis={package="PRIVATE/BAD",version="1"}','[dependencies]\nredis={version="1",optional="PRIVATE_VALUE"}','[build-dependencies]\nredis={version="1",optional=true}','[dependencies]\nredis={features=["PRIVATE_VALUE"]}','[dependencies]\nredis={version="1",features=42}','[workspace.dependencies]\nredis={version="1",optional=false}']){
  await writeFile(join(dir,'Cargo.toml'),source);const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_VALUE|TOML parse|line \d/);
 }
}));
test('Cargo extraction bounds entries, nesting and file bytes',async()=>project(async dir=>{
 for(const source of ['[dependencies]\n'+Array.from({length:10000},(_,i)=>'x'+i+'="1"').join('\n')+'\nsentry="1"','[package.metadata]\nx='+'['.repeat(40)+'"sentry"'+']'.repeat(40),' '.repeat(262145)]){
  await writeFile(join(dir,'Cargo.toml'),source);const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);
 }
}));
test('Cargo CLI retains file exclusions, skips configuration values and never invokes project tools',async()=>project(async dir=>{
 spawnSync('git',['init','--quiet'],{cwd:dir});await writeFile(join(dir,'.gitignore'),'ignored/\n');await writeFile(join(dir,'Cargo.toml'),'[dependencies]\nsentry="0.49"\n');
 for(const folder of ['ignored','target','credentials']){await mkdir(join(dir,folder));await writeFile(join(dir,folder,'Cargo.toml'),'[dependencies]\nredis="1"\n');}
 await mkdir(join(dir,'linked'));await symlink(join(dir,'Cargo.toml'),join(dir,'linked/Cargo.toml'));await mkdir(join(dir,'.cargo'));await writeFile(join(dir,'.cargo/config.toml'),'[registries.private]\ntoken="PRIVATE_TOKEN"\n');await writeFile(join(dir,'.cargo/credentials.toml'),'PRIVATE_TOKEN');
 await mkdir(join(dir,'bin'));for(const name of ['cargo','rustc'])await writeFile(join(dir,'bin',name),'#!/bin/sh\ntouch "'+join(dir,'EXECUTED')+'"\n',{mode:0o700});await writeFile(join(dir,'build.rs'),'panic!("DO_NOT_RUN");');
 const out=join(dir,'review'),args=[cli,'discover','--project',dir,'--out-dir',out,'--json'],options={encoding:'utf8',env:{...process.env,PATH:join(dir,'bin')+':'+process.env.PATH}},result=spawnSync(process.execPath,args,options);assert.equal(result.status,0,result.stderr);const r=JSON.parse(result.stdout);assert.equal(r.coverage.selection,'git-ignore-aware');assert.equal(r.coverage.limited,true);assert.equal(r.coverage.filesExamined,1);assert.deepEqual(r.findings.map(f=>f.productId),['sentry-monitoring']);assert.doesNotMatch(result.stdout,/PRIVATE_TOKEN|DO_NOT_RUN/);await assert.rejects(stat(join(dir,'EXECUTED')));
 assert.equal((await stat(out)).mode&0o777,0o700);assert.equal((await stat(join(out,'discovery.private.json'))).mode&0o777,0o600);assert.notEqual(spawnSync(process.execPath,args,options).status,0);
}));
test('custom Cargo rules have the same ASCII name and delimiter-prefix bounds in schema and runtime',async()=>{
 const schema=JSON.parse(await readFile(new URL('../../../catalog/schema.json',import.meta.url),'utf8')),validate=new Ajv2020({strict:false,validateFormats:false}).compile(schema);assert.equal(validate(serviceCatalogSeed),true,JSON.stringify(validate.errors));
 for(const [match,value,valid] of [['exact','sentry',true],['exact','some_crate',true],['prefix','aws-sdk-',true],['prefix','aws-sdk',false],['exact','sentry/extra',false],['exact','a'.repeat(65),false],['exact','séñtry',false],['prefix','aws/',false]]){
  const c=structuredClone(serviceCatalogSeed),rule=c.products.find(p=>p.id==='sentry-monitoring').identifiers.find(r=>r.ecosystem==='cargo');Object.assign(rule,{match,value});assert.equal(validate(c),valid,value);if(valid)assert.doesNotThrow(()=>normalizeServiceCatalog(c));else assert.throws(()=>normalizeServiceCatalog(c));
 }
 await project(async dir=>{const c=structuredClone(serviceCatalogSeed),rule=c.products.find(p=>p.id==='aws-sdk').identifiers.find(r=>r.ecosystem==='cargo');Object.assign(rule,{match:'prefix',value:'aws-sdk-'});await writeFile(join(dir,'Cargo.toml'),'[dependencies]\naws-sdk-custom="1"\naws-sdkattacker="1"\n');const r=await scanProjectServices(dir,c);assert.equal(r.findings.length,1);assert.equal(r.findings[0].evidence.length,1);assert.equal(r.findings[0].evidence[0].identifier,'aws-sdk-');});
});
test('Cargo seed updates preserve old selected snapshots and require an explicit reference review',async()=>{
 const old=structuredClone(serviceCatalogSeed);old.revision='before-cargo';for(const p of old.products){if(p.identifiers.some(r=>r.ecosystem==='cargo'))p.revision='prior-product';p.identifiers=p.identifiers.filter(r=>r.ecosystem!=='cargo');}
 const selected=createCatalogSelectionPlan(await fixture(),old,{productId:'sentry-monitoring',serviceId:'monitoring',purposeIds:['enquiries'],provider:'Declared operator',location:'Declared location',justification:'Private assessment',confirmed:true}),config=structuredClone(selected.config),pin=structuredClone(selected.selection);assert.deepEqual(normalizeCatalogServiceSelection(pin),pin);assert.ok(prepareCatalogSelectionReview(config,pin,serviceCatalogSeed).changes.includes('reference'));assert.deepEqual(selected.config,config);assert.deepEqual(selected.selection,pin);
});
