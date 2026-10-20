// @requirements REQ-PRODUCT-AGENT-INTEGRATION REQ-PRODUCT-CONFIG
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,readdir,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import {createConfigSchema} from '../scripts/config-schema.mjs';
import {validateSiteConfig} from 'notabenda';
import {describeIntegration} from 'notabenda/integration';
import {fixture} from './helpers.mjs';
const cli=fileURLToPath(new URL('../dist/cli.js',import.meta.url));
const schema=JSON.parse(await readFile(fileURLToPath(import.meta.resolve('notabenda/config/schema.json')),'utf8'));
const ajv=new Ajv({strict:true});ajv.addKeyword({keyword:'x-notabenda',schemaType:'object',valid:true});
const validate=ajv.compile(schema);
const run=(args,cwd)=>spawnSync(process.execPath,[cli,'schema',...args],{cwd,encoding:'utf8',timeout:10000});
const field=path=>{const result=run([path,'--json']);assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);};

test('packaged shape is generated from current SiteConfig and is valid draft 2020-12',async()=>{
 assert.deepEqual(schema,await createConfigSchema());assert.equal(ajv.validateSchema(schema),true);
 const config=await fixture(),before=structuredClone(config);config.private={unknown:{array:[null,1,true,'value']}};
 assert.equal(validate(config),true,JSON.stringify(validate.errors));config.private=before.private;assert.deepEqual(config,before);
 const meta=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(schema['x-notabenda'].version,meta.version);assert.equal(schema['x-notabenda'].completeRuntimeValidation,false);
 assert.equal(new URL(schema.$id).pathname,`/schemas/${meta.version}/site-config.schema.json`);
 // The shape is an authoring aid, deliberately not a substitute for semantic validation.
 config.services[0].purposeIds=['unknown-purpose'];assert.equal(validate(config),true);
 assert.equal(validateSiteConfig(config,{mode:'preview'}).valid,false);
});

test('shape rejects invented keys, omitted required fields and wrong literals at nested boundaries',async()=>{
 const original=await fixture();
 for(const change of [c=>{c.conset={};},c=>{delete c.controller.address;},c=>{c.site.locale=1;},c=>{c.schemaVersion=2;},c=>{c.documents.terms.review.status='approved';},c=>{c.services[0].resourceOrigin=[];},c=>{c.storage[0].classification='essential';},c=>{c.purposes[0].collection.required='yes';}]){
  const config=structuredClone(original);change(config);assert.equal(validate(config),false);
 }
 for(const scope of ['absent','present','unknown']){
  const config=structuredClone(original);config.scopeGuards={version:1,revision:'test',site:{children:scope,sensitiveData:scope,highRiskProfiling:scope,regulatedSector:scope},purposes:[{id:config.purposes[0].id,facts:{children:scope}}]};
  assert.equal(validate(config),true,JSON.stringify(validate.errors));config.scopeGuards.site.children='safe';assert.equal(validate(config),false);
 }
});

test('every advertised target path resolves to a self-contained schema without config access',()=>{
 for(const path of new Set(describeIntegration().targets.flatMap(t=>t.configPaths))){
  const shape=field(path);assert.equal(ajv.validateSchema(shape),true,path);assert.doesNotThrow(()=>new Ajv({strict:false}).compile(shape),path);
  assert.equal(shape['x-notabenda'].path,path);assert.equal(shape.$id,undefined);
  assert.equal(shape['x-notabenda'].completeRuntimeValidation,false);
 }
 const scope=field('consent.services.scope');assert.deepEqual(scope['x-notabenda'].optionalAncestors,['consent']);assert.deepEqual(scope['x-notabenda'].arrayItemPaths,['consent.services']);
 const validateScope=new Ajv({strict:false}).compile(scope);assert.equal(validateScope('material-revision'),true);assert.equal(validateScope(3),false);
 const policy=field('consent.grantExpiryPolicy'),validatePolicy=new Ajv({strict:false}).compile(policy);
 assert.equal(validatePolicy({profile:'ie-dpc-six-month-default',version:1}),true);assert.equal(validatePolicy({profile:'guess',version:1}),false);
 assert.deepEqual(policy['x-notabenda'].optionalAncestors,['consent','consent.grantExpiryPolicy']);
 const google=field('services.googleBasic.signals.ad_storage');assert.equal(google.type,'array');assert.deepEqual(google.items,{type:'string'});
});

test('field lookup retains discriminated alternatives, required localization messages and record bounds',()=>{
 const entries=field('storageExceptions.entries'),v=new Ajv({strict:false}).compile(entries);
 const base={id:'test',revision:1,serviceIds:[],purposeIds:[],storageIds:[],title:'test',description:'test',reviewStatus:'draft'};
 const conditions={informationSocietyService:true,soleAppearanceOrFunctionality:true,noBehaviouralContentSelection:true,onlyNecessaryPersonalData:true};
 assert.equal(v([{...base,profile:'uk-pecr-appearance',conditions}]),true);
 assert.equal(v([{...base,profile:'uk-pecr-statistical',conditions}]),false);
 assert.equal(v([{...base,profile:'uk-pecr-appearance',conditions:{...conditions,onlyNecessaryPersonalData:false}}]),false);
 const conditionsShape=field('storageExceptions.entries.conditions');assert.equal(conditionsShape['x-notabenda'].conditional,false);assert.deepEqual(conditionsShape['x-notabenda'].alternativeAncestors,['storageExceptions.entries']);
 const conditional=field('storageExceptions.entries.conditions.thirdPartyUse');assert.equal(conditional['x-notabenda'].conditional,true);assert.deepEqual(conditional['x-notabenda'].alternativeAncestors,['storageExceptions.entries']);assert.deepEqual(conditional.enum,['none','processor-improvement-only']);
 const messages=field('localization.consent'),vm=new Ajv({strict:false}).compile(messages);assert.equal(vm({}),false);
 const signals=field('services.googleBasic.signals'),vs=new Ajv({strict:false}).compile(signals);
 assert.equal(vs({analytics_storage:[],ad_storage:[],ad_user_data:[],ad_personalization:[]}),true);assert.equal(vs({ad_storage:[]}),false);
 assert.equal(Object.keys(signals.$defs).length,1); // no unrelated inventory or document definitions
});

test('schema CLI is offline and read-only; malformed paths/options never echo supplied values',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-schema-'));
 try{
  await writeFile(join(cwd,'notabenda.config.json'),'PRIVATE-CONFIG-MARKER');
  await writeFile(join(cwd,'notabenda.config.mjs'),"throw Error('Never execute the project');");
  const before=await readdir(cwd),result=run(['--json'],cwd);assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),schema);
  assert.deepEqual(await readdir(cwd),before);assert.equal(await readFile(join(cwd,'notabenda.config.json'),'utf8'),'PRIVATE-CONFIG-MARKER');
  for(const args of [['--json','--json'],['--config','PRIVATE-MARKER'],['services.0'],['site..name'],['consent.madeUp'],['private.PRIVATE_MARKER'],['site','consent'],['PRIVATE_MARKER']]){
   const invalid=run(args,cwd);assert.equal(invalid.status,1);assert.doesNotMatch(invalid.stdout+invalid.stderr,/PRIVATE[_-]MARKER/u);
  }
 }finally{await rm(cwd,{recursive:true,force:true});}
});
