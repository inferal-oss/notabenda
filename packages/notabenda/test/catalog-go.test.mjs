// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,symlink,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {scanProjectServices} from '@notabenda/core/catalog/project';
import {normalizeServiceCatalog} from '@notabenda/core/catalog';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {createCatalogSelectionPlan,normalizeCatalogServiceSelection} from '@notabenda/core/catalog/selection';
import {prepareCatalogSelectionReview} from '@notabenda/core/catalog/review';
import {fixture} from './helpers.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
async function project(run){const dir=await mkdtemp(join(tmpdir(),'notabenda-go-review-'));try{await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const scan=dir=>scanProjectServices(dir,serviceCatalogSeed);
test('Go manifest and import readers distinguish requirements, indirect modules and test imports without running Go',async()=>project(async dir=>{
 await writeFile(join(dir,'go.mod'),'module example.test/site\n\ngo 1.24\nrequire "github.com/stripe/stripe-go/v87" v87.0.0\nrequire (\n github.com/aws/aws-sdk-go-v2/service/s3 v1.0.0 // indirect\n "github.com/getsentry/sentry-go" v0.1.0\n)\n');
 await writeFile(join(dir,'main.go'),'package main\nimport\n(\n pay "github.com/stripe/stripe-go/v87/customer"\n _ "github.com/twilio/twilio-go"\n . `github.com/digitalocean/godo`\n)\nvar ignored = "DO_NOT_EXPORT_SOURCE_VALUES"\n');
 await writeFile(join(dir,'main_test.go'),'package main\nimport "github.com/getsentry/sentry-go"\n');
 await mkdir(join(dir,'bin'));await writeFile(join(dir,'bin/go'),'#!/bin/sh\ntouch "'+join(dir,'GO_EXECUTED')+'"\n',{mode:0o700});
 const before=await readFile(join(dir,'go.mod'),'utf8'),r=spawnSync(process.execPath,[cli,'discover','--project',dir,'--json'],{encoding:'utf8',env:{...process.env,PATH:join(dir,'bin')+':'+process.env.PATH}});assert.equal(r.status,0,r.stderr);
 const report=JSON.parse(r.stdout);assert.equal(report.coverage.limited,false);assert.deepEqual(report.findings.map(f=>f.productId),['aws-sdk','digitalocean-platform','sentry-monitoring','stripe-payments','twilio-messaging']);
 const contexts=id=>new Set(report.findings.find(f=>f.productId===id).evidence.map(e=>e.context));assert.ok(contexts('aws-sdk').has('indirect-dependency'));assert.ok(contexts('stripe-payments').has('dependency'));assert.ok(contexts('stripe-payments').has('source-import'));assert.ok(contexts('sentry-monitoring').has('test-source-import'));
 assert.doesNotMatch(r.stdout,/DO_NOT_EXPORT_SOURCE_VALUES|v87\.0\.0|\/customer/);assert.equal(await readFile(join(dir,'go.mod'),'utf8'),before);await assert.rejects(stat(join(dir,'GO_EXECUTED')));
}));
test('all seven source-linked Go SDK rules match exact roots and slash-bound subpackages, with minimized evidence',async()=>project(async dir=>{
 const products=serviceCatalogSeed.products.filter(p=>p.identifiers.some(r=>r.ecosystem==='go'));assert.equal(products.length,7);
 const paths=products.map(p=>p.identifiers.find(r=>r.ecosystem==='go'&&r.match==='exact').value);
 await writeFile(join(dir,'go.mod'),'module example.test/site\nrequire (\n'+paths.map(p=>p+' v1.0.0').join('\n')+'\n)\n');
 await writeFile(join(dir,'sdk.go'),'package main\nimport (\n'+paths.map(p=>'"'+p+'/PRIVATE_SUBPACKAGE"').join('\n')+'\n)\n');
 const report=await scan(dir);assert.equal(report.coverage.limited,false);assert.deepEqual(report.findings.map(f=>f.productId),products.map(p=>p.id).sort());assert.doesNotMatch(JSON.stringify(report),/PRIVATE_SUBPACKAGE/);
 for(const product of products){const finding=report.findings.find(f=>f.productId===product.id);assert.ok(finding.evidence.some(e=>e.match==='exact'&&e.context==='dependency'));assert.ok(finding.evidence.some(e=>e.match==='prefix'&&e.context==='source-import'));for(const rule of product.identifiers.filter(r=>r.ecosystem==='go'))for(const id of rule.sourceIds)assert.equal(serviceCatalogSeed.sources.find(s=>s.id===id).access,'read');}
}));
test('Go comments, literal contents, module identity, sums and namespace lookalikes do not become candidates',async()=>project(async dir=>{
 await writeFile(join(dir,'go.mod'),'module github.com/stripe/stripe-go/v87\ngo 1.24\n// require github.com/twilio/twilio-go v1.0.0\n');
 await writeFile(join(dir,'go.sum'),'github.com/getsentry/sentry-go v1.0.0 h1:PRIVATE_CHECKSUM\n');
 const noise=['package main','import (','"github.com/stripe/stripe-go-evil/v87"','"github.com/getsentry/sentry-go.attacker.test/sdk"','"attacker.test/github.com/twilio/twilio-go"','"github.com/azure/azure-sdk-for-go/sdk/azcore"','"cloud.google.com/go-evil/storage"',')','// import "github.com/stripe/stripe-go/v87"','/* import ("github.com/twilio/twilio-go") */','const quoted = '+JSON.stringify('import "github.com/stripe/stripe-go/v87"'),'const raw = `import "github.com/digitalocean/godo"`',`const quote = '"'`].join('\n');await writeFile(join(dir,'noise.go'),noise);
 const report=await scan(dir);assert.equal(report.coverage.limited,false);assert.deepEqual(report.findings,[]);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_CHECKSUM/);
}));
test('unresolved replacements, excludes and workspace files make Go coverage limited without following their paths',async()=>project(async dir=>{
 await writeFile(join(dir,'go.mod'),'module example.test/site\nrequire github.com/stripe/stripe-go/v87 v87.0.0\nreplace github.com/stripe/stripe-go/v87 => ../PRIVATE_REPLACEMENT\nexclude github.com/twilio/twilio-go v1.0.0\n');await writeFile(join(dir,'go.work'),'go 1.24\nuse ../PRIVATE_WORKSPACE\n');
 const report=await scan(dir);assert.equal(report.coverage.limited,true);assert.deepEqual(report.findings.map(f=>f.productId),['stripe-payments']);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_REPLACEMENT|PRIVATE_WORKSPACE/);
}));
test('secret files, vendor trees, symlinks and Git-ignored Go files retain the existing scan boundaries',async()=>project(async dir=>{
 spawnSync('git',['init','--quiet'],{cwd:dir});await writeFile(join(dir,'.gitignore'),'ignored/\n');await writeFile(join(dir,'visible.go'),'package main\nimport "github.com/twilio/twilio-go"\n');
 for(const folder of ['vendor','ignored','credentials']){await mkdir(join(dir,folder));await writeFile(join(dir,folder,'hidden.go'),'package main\nimport "github.com/stripe/stripe-go/v87"\n');}await symlink(join(dir,'visible.go'),join(dir,'linked.go'));
 const report=await scan(dir);assert.equal(report.coverage.selection,'git-ignore-aware');assert.deepEqual(report.findings.map(f=>f.productId),['twilio-messaging']);assert.deepEqual(report.findings[0].evidence.map(e=>e.file),['visible.go']);
}));
test('damaged Go declarations and escaped import paths are reported as limited without echoing source',async()=>project(async dir=>{
 await writeFile(join(dir,'bad.go'),'package main\nimport "github.com/stripe/stripe-go\\x2fv87"\n/* PRIVATE_UNTERMINATED');
 await writeFile(join(dir,'go.mod'),'module example.test/site\nrequire (\n github.com/twilio/twilio-go\n');const report=await scan(dir);assert.equal(report.coverage.limited,true);assert.deepEqual(report.findings,[]);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_UNTERMINATED|x2f/);
}));
test('Go namespace rules are bounded, case-sensitive ordinary paths with explicit subpackage boundaries',()=>{
 const product=serviceCatalogSeed.products.find(p=>p.id==='stripe-payments');
 for(const value of ['github.com/stripe/stripe-go','github.com/stripe/stripe-go-','github.com//stripe/','github.com/stripe/../','https://github.com/stripe/','github.com/stripe/\n','github.com/stripe/\\']){const c=structuredClone(serviceCatalogSeed);c.products.find(p=>p.id===product.id).identifiers.find(r=>r.ecosystem==='go'&&r.match==='prefix').value=value;assert.throws(()=>normalizeServiceCatalog(c));}
});
test('Go npx output keeps the existing private, exclusive report contract',async()=>project(async dir=>{
 await writeFile(join(dir,'go.mod'),'module example.test/site\nrequire github.com/twilio/twilio-go v1.0.0\n');const out=join(dir,'review'),args=[cli,'discover','--project',dir,'--out-dir',out,'--json'];const first=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(first.status,0,first.stderr);assert.equal(JSON.parse(first.stdout).findings[0].productId,'twilio-messaging');assert.equal((await stat(join(out,'discovery.private.json'))).mode&0o777,0o600);assert.equal((await stat(out)).mode&0o777,0o700);assert.notEqual(spawnSync(process.execPath,args,{encoding:'utf8'}).status,0);
}));
test('indirect annotations follow the Go toolchain comment forms without guessing from a prefix',async()=>project(async dir=>{
 const comments=['indirect','indirect; PRIVATE_EXPLANATION','indirect more words','indirect;','indirectness'],expected=['indirect-dependency','indirect-dependency','dependency','dependency','dependency'];
 for(let i=0;i<comments.length;i++){await writeFile(join(dir,'go.mod'),'module example.test/site\nrequire github.com/twilio/twilio-go v1.0.0 // '+comments[i]+'\n');const report=await scan(dir);assert.equal(report.coverage.limited,false);assert.equal(report.findings[0].evidence[0].context,expected[i]);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_EXPLANATION/);}
}));
test('adding Go reference signatures leaves prior selection pins readable and requires explicit renewal',async()=>{
 const old=structuredClone(serviceCatalogSeed);old.revision='before-go-discovery';for(const product of old.products){if(product.identifiers.some(r=>r.ecosystem==='go'))product.revision='previous-product';product.identifiers=product.identifiers.filter(r=>r.ecosystem!=='go');}
 const selected=createCatalogSelectionPlan(await fixture(),old,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Operator-declared entity',location:'Operator-declared deployment',justification:'Private actual-use review',confirmed:true}),config=structuredClone(selected.config),pin=structuredClone(selected.selection);
 assert.deepEqual(normalizeCatalogServiceSelection(pin),pin);const proposal=prepareCatalogSelectionReview(selected.config,pin,serviceCatalogSeed);assert.ok(proposal.changes.includes('reference'));assert.deepEqual(selected.config,config);assert.deepEqual(selected.selection,pin);assert.equal(selected.selection.reference.revision,'before-go-discovery');
});
test('Go lexical work stops at its per-file token budget and reports limited coverage',async()=>project(async dir=>{
 await writeFile(join(dir,'bounded.go'),'package main\n'+';'.repeat(70000)+'\nimport "github.com/twilio/twilio-go"');const report=await scan(dir);assert.equal(report.coverage.limited,true);assert.deepEqual(report.findings,[]);
}));
test('the published catalog schema and runtime accept the same bounded Go namespace shapes',async()=>{
 const schema=JSON.parse(await readFile(new URL('../../../catalog/schema.json',import.meta.url),'utf8')),validate=new Ajv2020({strict:false,validateFormats:false}).compile(schema);assert.equal(validate(serviceCatalogSeed),true,JSON.stringify(validate.errors));
 for(const [match,value,valid] of [['exact','example.test/sdk~preview',true],['prefix','github.com/stripe/stripe-go/',true],['prefix','github.com/stripe/stripe-go',false],['exact','github.com/stripe/stripe-go/',false],['prefix','github.com/stripe/../',false]]){
  const c=structuredClone(serviceCatalogSeed),rule=c.products.find(p=>p.id==='stripe-payments').identifiers.find(r=>r.ecosystem==='go');rule.match=match;rule.value=value;assert.equal(validate(c),valid,value);if(valid)assert.doesNotThrow(()=>normalizeServiceCatalog(c));else assert.throws(()=>normalizeServiceCatalog(c));
 }
});
