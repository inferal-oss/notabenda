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
import {normalizeServiceCatalog as backendNormalize} from '../../notabenda-cf/dist/catalog-reference.js';
import {createCatalogSelectionPlan,normalizeCatalogServiceSelection} from '@notabenda/core/catalog/selection';
import {prepareCatalogSelectionReview} from '@notabenda/core/catalog/review';
import {fixture} from './helpers.mjs';
import {nugetIdentifiers} from '../dist/catalog-nuget.js';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
async function project(run){const dir=await mkdtemp(join(tmpdir(),'notabenda-nuget-'));try{await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const scan=dir=>scanProjectServices(dir,serviceCatalogSeed);
const evidence=(r,id)=>r.findings.find(f=>f.productId===id)?.evidence;
const xml=body=>'<Project><ItemGroup>'+body+'</ItemGroup></Project>';

test('NuGet declarations preserve six contexts and omit versions, conditions, names and repository values',async()=>project(async dir=>{
 await writeFile(join(dir,'app.csproj'),xml('<PackageReference Include="STRIPE.NET" Version="PRIVATE_VERSION"/><PackageReference Update="Sentry" Version="PRIVATE_UPDATE"/><PackageReference Include="Twilio" Condition="PRIVATE_CONDITION"/><PackageReference Remove="MongoDB.Driver"/><PackageReference Include="$(PRIVATE_PACKAGE)"/>'));
 await writeFile(join(dir,'Directory.Packages.props'),xml('<PackageVersion Include="SendGrid" Version="PRIVATE_CENTRAL"/><GlobalPackageReference Include="Sentry.AspNetCore" Version="PRIVATE_GLOBAL"/>'));
 await writeFile(join(dir,'packages.config'),'<packages><package id="MongoDB.Driver" version="PRIVATE_LEGACY"/></packages>');
 const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings.map(f=>f.productId),['mongodb-client','sendgrid-email','sentry-monitoring','stripe-payments','twilio-messaging']);
 assert.deepEqual(evidence(r,'stripe-payments').map(e=>e.context),['dependency']);assert.deepEqual(evidence(r,'sentry-monitoring').map(e=>e.context).sort(),['global-package-reference','package-update']);assert.equal(evidence(r,'sendgrid-email')[0].context,'central-package-version');assert.equal(evidence(r,'mongodb-client')[0].context,'legacy-package-entry');assert.equal(evidence(r,'twilio-messaging')[0].context,'conditional-dependency');assert.doesNotMatch(JSON.stringify(r),/PRIVATE_/);
}));
test('central catalogs and Update or Remove never become direct dependency observations',()=>{
 for(const [body,context] of [['<PackageVersion Include="Sentry"/>','central-package-version'],['<PackageReference Update="Sentry"/>','package-update'],['<GlobalPackageReference Include="Sentry"/>','global-package-reference']]){const r=nugetIdentifiers(xml(body),'central');assert.deepEqual(r.identifiers,[{identifier:'sentry',context}]);assert.equal(r.limited,true);}
 assert.deepEqual(nugetIdentifiers(xml('<PackageReference Remove="Sentry"/>'),'project'),{identifiers:[],limited:true});
});
test('namespace-aware XML skips comments and CDATA, recognizes default/prefixed MSBuild and rejects foreign scope',()=>{
 const body='<PackageReference Include="Stripe.net"/>',expected=[{identifier:'stripe.net',context:'dependency'}];assert.deepEqual(nugetIdentifiers(xml(body),'project'),{identifiers:expected,limited:false});
 assert.deepEqual(nugetIdentifiers('<Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003"><ItemGroup>'+body+'</ItemGroup></Project>','project').identifiers,expected);
 assert.deepEqual(nugetIdentifiers('<m:Project xmlns:m="http://schemas.microsoft.com/developer/msbuild/2003"><m:ItemGroup><m:PackageReference Include="Stripe&#46;net"/></m:ItemGroup></m:Project>','project').identifiers,expected);
 const r=nugetIdentifiers('<Project><!-- '+body+' --><PropertyGroup><Text><![CDATA['+body+']]></Text></PropertyGroup><ItemGroup xmlns="urn:foreign">'+body+'</ItemGroup><PropertyGroup><ItemGroup>'+body+'</ItemGroup></PropertyGroup></Project>','project');assert.deepEqual(r.identifiers,[]);assert.equal(r.limited,true);
});
test('conditions, SDK/imports, build tasks and inherited settings remain unresolved without evaluating source',()=>{
 for(const source of ['<Project Sdk="PRIVATE_SDK"><ItemGroup><PackageReference Include="Sentry"/></ItemGroup></Project>','<Project><Import Project="PRIVATE_PATH"/>'+xml('<PackageReference Include="Sentry"/>').slice(9,-10)+'</Project>','<Project><Choose><When Condition="PRIVATE_CONDITION"><ItemGroup><PackageReference Include="Sentry"/></ItemGroup></When></Choose></Project>','<Project><Target Name="PRIVATE_TARGET"><ItemGroup><PackageReference Include="Sentry"/></ItemGroup></Target></Project>']){
  const r=nugetIdentifiers(source,'project');assert.equal(r.limited,true);assert.equal(r.identifiers.length,1);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_/);
 }
 assert.equal(nugetIdentifiers('<Project/>','build').limited,true);assert.equal(nugetIdentifiers('<Project/>','central').limited,true);
});
test('DTD, entities, malformed XML, duplicate attributes, expression IDs and parser bounds do not yield false completeness',()=>{
 const bad=['<!DOCTYPE Project SYSTEM "https://PRIVATE_HOST/steal"><Project/>','<!DOCTYPE Project [<!ENTITY sdk "Sentry">]>'+xml('<PackageReference Include="&sdk;"/>'),xml('<PackageReference Include="Sentry" Include="Stripe.net"/>'),xml('<PackageReference Include="Sentry"/>')+'broken','<Project><ItemGroup><PackageReference Include="Sentry"></ItemGroup></Project>','<Project xmlns:x="urn:a" xmlns:y="urn:a"><ItemGroup><PackageReference x:Include="Sentry" y:Include="Stripe.net"/></ItemGroup></Project>','<Project>'+('<X>'.repeat(33))+('</X>'.repeat(33))+'</Project>','<Project>'+('<X/>'.repeat(10001))+'</Project>',' '.repeat(262145)];
 for(const source of bad)assert.deepEqual(nugetIdentifiers(source,'project'),{identifiers:[],limited:true});
 for(const id of ['$(PRIVATE_ID)','Sentry*','https://PRIVATE_HOST/pkg','Sentry%2Enet'])assert.deepEqual(nugetIdentifiers(xml('<PackageReference Include="'+id+'"/>'),'project'),{identifiers:[],limited:true});
});
test('all twelve source-backed signatures match case-insensitively as candidates across nine existing SDK families',async()=>project(async dir=>{
 const seed=JSON.parse(await readFile(new URL('../../../catalog/nuget-providers.json',import.meta.url),'utf8')),ids=Object.values(seed.productIdentifierAdditions).flat().map(r=>r.value);assert.equal(ids.length,12);assert.equal(Object.keys(seed.productIdentifierAdditions).length,9);
 await writeFile(join(dir,'app.fsproj'),xml(ids.map(id=>'<PackageReference Include="'+id.toUpperCase()+'"/>').join('')));const r=await scan(dir);assert.deepEqual(r.findings.map(f=>f.productId),Object.keys(seed.productIdentifierAdditions).sort());assert.equal(r.findings.flatMap(f=>f.evidence).length,12);
 for(const [product,rules] of Object.entries(seed.productIdentifierAdditions)){assert.deepEqual(evidence(r,product).map(e=>e.identifier).sort(),rules.map(r=>r.value).sort());for(const rule of rules)for(const id of rule.sourceIds)assert.equal(seed.sources.find(s=>s.id===id).access,'read');}
}));
test('NuGet manifests obey ignore, symlink and credential boundaries and do not execute installed tool shims',async()=>project(async dir=>{
 spawnSync('git',['init','--quiet'],{cwd:dir});await writeFile(join(dir,'.gitignore'),'ignored/\n');await writeFile(join(dir,'app.vbproj'),xml('<PackageReference Include="Stripe.net" Version="PRIVATE_VERSION"/>'));
 for(const folder of ['ignored','obj','.nuget','credentials']){await mkdir(join(dir,folder));await writeFile(join(dir,folder,'other.csproj'),xml('<PackageReference Include="Twilio"/>'));}await symlink(join(dir,'app.vbproj'),join(dir,'linked.csproj'));
 await writeFile(join(dir,'NuGet.Config'),'<configuration><password>PRIVATE_CREDENTIAL</password></configuration>');await mkdir(join(dir,'bin'));for(const name of ['dotnet','nuget','msbuild'])await writeFile(join(dir,'bin',name),'#!/bin/sh\ntouch "'+join(dir,'EXECUTED')+'"\n',{mode:0o700});
 const out=join(dir,'review'),args=[cli,'discover','--project',dir,'--out-dir',out,'--json'],opts={encoding:'utf8',env:{...process.env,PATH:join(dir,'bin')+':'+process.env.PATH}},result=spawnSync(process.execPath,args,opts);assert.equal(result.status,0,result.stderr);const r=JSON.parse(result.stdout);assert.equal(r.coverage.selection,'git-ignore-aware');assert.equal(r.coverage.filesExamined,1);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings.map(f=>f.productId),['stripe-payments']);assert.doesNotMatch(result.stdout,/PRIVATE_/);await assert.rejects(stat(join(dir,'EXECUTED')));const file=join(out,'discovery.private.json');assert.equal((await stat(file)).mode&0o777,0o600);assert.equal(spawnSync(process.execPath,args,opts).status,1);
}));
test('NuGet schema, frontend and backend validators agree while old catalog snapshots retain their exact form',async()=>{
 const schema=JSON.parse(await readFile(new URL('../../../catalog/schema.json',import.meta.url),'utf8')),valid=new Ajv2020({strict:false,validateFormats:false}).compile(schema),seed=structuredClone(serviceCatalogSeed);assert.equal(valid(seed),true,JSON.stringify(valid.errors));assert.deepEqual(backendNormalize(seed),normalizeServiceCatalog(seed));
 const p=seed.products.find(p=>p.id==='stripe-payments'),base=p.identifiers.find(r=>r.ecosystem==='nuget');for(const [match,value,ok] of [['exact','stripe.net',true],['prefix','stripe.',true],['prefix','stripe',false],['exact','Stripe.net',false],['exact','x'.repeat(101),false],['exact','$(Private)',false],['exact','_internal',true],['exact','sentry..bad',false],['exact','sentry-',false]]){base.match=match;base.value=value;assert.equal(valid(seed),ok,value);if(ok){normalizeServiceCatalog(seed);backendNormalize(seed);}else{assert.throws(()=>normalizeServiceCatalog(seed));assert.throws(()=>backendNormalize(seed));}}
 const previous=structuredClone(serviceCatalogSeed);previous.revision='before-nuget';for(const p of previous.products){if(p.identifiers.some(r=>r.ecosystem==='nuget'))p.revision='prior-product';p.identifiers=p.identifiers.filter(r=>r.ecosystem!=='nuget');}assert.deepEqual(normalizeServiceCatalog(previous),backendNormalize(previous));
 const selected=createCatalogSelectionPlan(await fixture(),previous,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Declared operator',location:'Declared location',justification:'Private assessment',confirmed:true}),config=structuredClone(selected.config),pin=structuredClone(selected.selection);assert.deepEqual(normalizeCatalogServiceSelection(pin),pin);assert.ok(prepareCatalogSelectionReview(config,pin,serviceCatalogSeed).changes.includes('reference'));assert.deepEqual(selected.config,config);assert.deepEqual(selected.selection,pin);
});


test('legacy package entries cannot be spoofed beneath nested packages wrappers',()=>{
 for(const source of ['<packages><other><packages><package id="Sentry" version="1"/></packages></other></packages>','<packages><packages><package id="Sentry" version="1"/></packages></packages>','<packages><other><package id="Sentry" version="1"/></other></packages>'])assert.deepEqual(nugetIdentifiers(source,'legacy'),{identifiers:[],limited:true});
});
test('literal item lists are distinct candidates, while null XML and source selection remain honestly limited',async()=>project(async dir=>{
 await writeFile(join(dir,'APP.CSPROJ'),xml('<PackageReference Include="Sentry; Stripe.net"/>'));let r=await scan(dir);assert.deepEqual(r.findings.map(f=>f.productId),['sentry-monitoring','stripe-payments']);assert.equal(r.coverage.limited,false);
 await writeFile(join(dir,'APP.CSPROJ'),xml('<PackageReference Include="Sentry"/>')+'\0');r=await scan(dir);assert.deepEqual(r.findings,[]);assert.equal(r.coverage.limited,true);assert.ok(r.coverage.skippedFiles>0);
 await writeFile(join(dir,'APP.CSPROJ'),'<Project><PropertyGroup><RestoreSources>https://PRIVATE_FEED/</RestoreSources></PropertyGroup><ItemGroup><PackageReference Include="Stripe.net"/></ItemGroup></Project>');r=await scan(dir);assert.equal(r.coverage.limited,true);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_FEED/);
}));
