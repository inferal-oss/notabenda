// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,symlink,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {scanProjectServices} from '@notabenda/core/catalog/project';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {normalizeServiceCatalog} from '@notabenda/core/catalog';
import {createCatalogSelectionPlan,normalizeCatalogServiceSelection} from '@notabenda/core/catalog/selection';
import {prepareCatalogSelectionReview} from '@notabenda/core/catalog/review';
import {fixture} from './helpers.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
const scan=dir=>scanProjectServices(dir,serviceCatalogSeed),cli=new URL('../dist/cli.js',import.meta.url).pathname;
async function project(run){const dir=await mkdtemp(join(tmpdir(),'notabenda-composer-'));try{await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const json=(dir,file,value)=>writeFile(join(dir,file),JSON.stringify(value));
const evidence=(r,id)=>r.findings.find(f=>f.productId===id)?.evidence;

test('Composer requirements and lock observations retain separate contexts without exposing values',async()=>project(async dir=>{
 const manifest={name:'private/project',require:{'stripe/stripe-php':'PRIVATE_VERSION',php:'^8.2','ext-json':'*'},'require-dev':{'sentry/sentry':'PRIVATE_DEV_VERSION'},scripts:{install:'DO_NOT_RUN'},config:{'http-basic':{'private.test':{password:'PRIVATE_PASSWORD'}}}};
 const lock={packages:[{name:'stripe/stripe-php',version:'PRIVATE_LOCK_VERSION',dist:{url:'https://PRIVATE_HOST/file.zip'}},{name:'aws/aws-sdk-php',require:{'twilio/sdk':'*'},description:'PRIVATE_DESCRIPTION'}],'packages-dev':[{name:'sentry/sentry'}],'content-hash':'PRIVATE_HASH'};
 await json(dir,'composer.json',manifest);await json(dir,'composer.lock',lock);const r=await scan(dir);
 assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings.map(f=>f.productId),['aws-sdk','sentry-monitoring','stripe-payments']);
 assert.deepEqual(evidence(r,'stripe-payments').map(e=>e.context),['dependency','locked-dependency']);assert.deepEqual(evidence(r,'sentry-monitoring').map(e=>e.context),['development-dependency','locked-development-dependency']);
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE_|DO_NOT_RUN|private\/project/);assert.deepEqual(JSON.parse(await readFile(join(dir,'composer.json'),'utf8')),manifest);
}));
test('all seven Composer product signatures are exact source-linked candidates, including self-hostable clients',async()=>project(async dir=>{
 const products=serviceCatalogSeed.products.filter(p=>p.identifiers.some(r=>r.ecosystem==='composer'));assert.equal(products.length,7);
 await json(dir,'composer.json',{require:Object.fromEntries(products.map(p=>[p.identifiers.find(r=>r.ecosystem==='composer').value,'*']))});const r=await scan(dir);assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings.map(f=>f.productId),products.map(p=>p.id).sort());assert.ok(r.findings.every(f=>f.reviewRequired));
 for(const product of products){assert.equal(product.review,'unreviewed');for(const rule of product.identifiers.filter(r=>r.ecosystem==='composer')){assert.equal(rule.match,'exact');for(const id of rule.sourceIds){const s=serviceCatalogSeed.sources.find(s=>s.id===id);assert.equal(s.access,'read');assert.equal(s.checkedOn,'2026-10-22');}}}
}));
test('identity, suggestions, metadata, autoload and PHP strings do not become required package evidence',async()=>project(async dir=>{
 await json(dir,'composer.json',{name:'stripe/stripe-php',description:'sentry/sentry',suggest:{'twilio/sdk':'*'},conflict:{'sendgrid/sendgrid':'*'},autoload:{files:['PRIVATE_FILE.php']},extra:{require:{'aws/aws-sdk-php':'*'}},require:{'stripe/stripe-php-attacker':'*','attacker/stripe-php':'*'}});
 await writeFile(join(dir,'app.php'),'<?php /* stripe/stripe-php */ die("DO_NOT_RUN");');await json(dir,'other.lock',{packages:[{name:'sentry/sentry'}]});const r=await scan(dir);assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings,[]);
}));
test('Composer JSON decoding handles escaped names while rejecting duplicate decoded keys and excessive structure',async()=>project(async dir=>{
 await writeFile(join(dir,'composer.json'),String.raw`{"require":{"stripe\u002fstripe-php":"*"},"description":"escaped quote: \" brackets: {}[]"}`);assert.equal(evidence(await scan(dir),'stripe-payments')[0].context,'dependency');
 for(const source of [String.raw`{"require":{"stripe/stripe-php":"*","stripe\u002fstripe-php":"*"}}`, '{"require":{"stripe/stripe-php":"*"},"require":{}}','{"extra":'+ '['.repeat(33)+'0'+']'.repeat(33)+'}', '{"require":{"stripe/stripe-php":"*",']){
  await writeFile(join(dir,'composer.json'),source);const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);
 }
}));
test('malformed package fields are limited without turning arbitrary values into candidates',async()=>project(async dir=>{
 for(const manifest of [[],{require:[]},{require:'PRIVATE_VALUE'},{require:{'stripe/stripe-php':42}},{require:{'Stripe/stripe-php':'*'}},{require:{'stripe/stripe-php/extra':'*'}},{require:{'stripe/stripe-php':''}},{require:{'https://PRIVATE_HOST':'*'}}]){
  await json(dir,'composer.json',manifest);const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_VALUE|PRIVATE_HOST/);
 }
 for(const lock of [{packages:{name:'stripe/stripe-php'},'packages-dev':[]},{packages:[{name:42}],'packages-dev':[]},{packages:[]}, {packages:[],'packages-dev':['sentry/sentry']}]){
  await json(dir,'composer.json',{});await json(dir,'composer.lock',lock);const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);
 }
}));
test('unresolved repositories, replacement and provision retain named candidates but mark coverage limited',async()=>project(async dir=>{
 for(const field of ['repositories','replace','provide']){
  await json(dir,'composer.json',{require:{'stripe/stripe-php':'*'},[field]:{'PRIVATE_NAME':'PRIVATE_VALUE'}});const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings.map(f=>f.productId),['stripe-payments']);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_NAME|PRIVATE_VALUE/);
 }
}));
test('lock-only observations never become direct dependencies or expand nested package requirements',async()=>project(async dir=>{
 await json(dir,'composer.lock',{packages:[{name:'stripe/stripe-php',require:{'sentry/sentry':'*'},provide:{'twilio/sdk':'*'}}],'packages-dev':[{name:'aws/aws-sdk-php'}]});const r=await scan(dir);assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings.map(f=>f.productId),['aws-sdk','stripe-payments']);assert.equal(evidence(r,'stripe-payments')[0].context,'locked-dependency');assert.equal(evidence(r,'aws-sdk')[0].context,'locked-development-dependency');
 await json(dir,'composer.lock',{packages:[{name:'stripe/stripe-php'},{name:'stripe/stripe-php'}],'packages-dev':[]});assert.equal((await scan(dir)).coverage.limited,true);
}));
test('oversized files and bounded Composer structures report limited coverage rather than silently finishing',async()=>project(async dir=>{
 await writeFile(join(dir,'composer.json'),JSON.stringify({require:Object.fromEntries(Array.from({length:10001},(_,i)=>['p/p'+i,'*']))}));assert.equal((await scan(dir)).coverage.limited,true);
 await json(dir,'composer.json',{});await json(dir,'composer.lock',{packages:Array.from({length:10001},()=>({name:'unknown/sdk'})),'packages-dev':[]});assert.equal((await scan(dir)).coverage.limited,true);
 await writeFile(join(dir,'composer.lock'),' '.repeat(262145));const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.ok(r.coverage.skippedFiles>0);
}));
test('Composer CLI retains ignore, symlink, secret, no-execution and exclusive private export boundaries',async()=>project(async dir=>{
 spawnSync('git',['init','--quiet'],{cwd:dir});await writeFile(join(dir,'.gitignore'),'ignored/\n');await json(dir,'composer.json',{require:{'stripe/stripe-php':'*'},scripts:{'post-install-cmd':'DO_NOT_RUN'}});
 for(const folder of ['ignored','vendor','credentials']){await mkdir(join(dir,folder));await json(join(dir,folder),'composer.json',{require:{'twilio/sdk':'*'}});}
 await mkdir(join(dir,'linked'));await symlink(join(dir,'composer.json'),join(dir,'linked/composer.json'));await json(dir,'auth.json',{'http-basic':{'private.test':{password:'PRIVATE_PASSWORD'}}});
 await mkdir(join(dir,'bin'));for(const name of ['composer','php'])await writeFile(join(dir,'bin',name),'#!/bin/sh\ntouch "'+join(dir,'EXECUTED')+'"\n',{mode:0o700});
 const out=join(dir,'review'),args=[cli,'discover','--project',dir,'--out-dir',out,'--json'],options={encoding:'utf8',env:{...process.env,PATH:join(dir,'bin')+':'+process.env.PATH}},first=spawnSync(process.execPath,args,options);assert.equal(first.status,0,first.stderr);const r=JSON.parse(first.stdout);assert.equal(r.coverage.selection,'git-ignore-aware');assert.equal(r.coverage.filesExamined,1);assert.deepEqual(r.findings.map(f=>f.productId),['stripe-payments']);assert.deepEqual(evidence(r,'stripe-payments').map(e=>e.file),['composer.json']);assert.doesNotMatch(first.stdout,/PRIVATE_PASSWORD|DO_NOT_RUN/);await assert.rejects(stat(join(dir,'EXECUTED')));
 assert.equal((await stat(out)).mode&0o777,0o700);assert.equal((await stat(join(out,'discovery.private.json'))).mode&0o777,0o600);assert.notEqual(spawnSync(process.execPath,args,options).status,0);
}));
test('Composer custom identifiers have matching runtime/schema package and vendor boundaries',async()=>{
 const schema=JSON.parse(await readFile(new URL('../../../catalog/schema.json',import.meta.url),'utf8')),validate=new Ajv2020({strict:false,validateFormats:false}).compile(schema);assert.equal(validate(serviceCatalogSeed),true,JSON.stringify(validate.errors));
 for(const [match,value,valid] of [['exact','vendor/sdk',true],['exact','v.name/package--name',true],['prefix','vendor/',true],['prefix','vendor/sdk',false],['exact','Vendor/sdk',false],['exact','vendor/sdk/extra',false],['exact','vendor/../sdk',false],['exact','vendor/pkg---bad',false],['prefix','vendor/sdk/',false]]){
  const c=structuredClone(serviceCatalogSeed),rule=c.products.find(p=>p.id==='stripe-payments').identifiers.find(r=>r.ecosystem==='composer');Object.assign(rule,{match,value});assert.equal(validate(c),valid,value);if(valid)assert.doesNotThrow(()=>normalizeServiceCatalog(c));else assert.throws(()=>normalizeServiceCatalog(c));
 }
 await project(async dir=>{const c=structuredClone(serviceCatalogSeed);const rule=c.products.find(p=>p.id==='stripe-payments').identifiers.find(r=>r.ecosystem==='composer');Object.assign(rule,{match:'prefix',value:'stripe/'});await json(dir,'composer.json',{require:{'stripe/custom-sdk':'*','stripe-attacker/sdk':'*'}});const r=await scanProjectServices(dir,c);assert.equal(r.findings.length,1);assert.equal(r.findings[0].evidence[0].identifier,'stripe/');});
});
test('new Composer references preserve historical selection pins and require explicit renewal',async()=>{
 const old=structuredClone(serviceCatalogSeed);old.revision='before-composer';for(const p of old.products){if(p.identifiers.some(r=>r.ecosystem==='composer'))p.revision='prior-product';p.identifiers=p.identifiers.filter(r=>r.ecosystem!=='composer');}
 const selected=createCatalogSelectionPlan(await fixture(),old,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Operator-declared entity',location:'Operator-declared location',justification:'Private review',confirmed:true}),config=structuredClone(selected.config),pin=structuredClone(selected.selection);
 assert.deepEqual(normalizeCatalogServiceSelection(pin),pin);assert.ok(prepareCatalogSelectionReview(config,pin,serviceCatalogSeed).changes.includes('reference'));assert.deepEqual(selected.config,config);assert.deepEqual(selected.selection,pin);
});
