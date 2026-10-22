// @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-AGENT-INTEGRATION
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createLegalDocument,toPublicConfig,renderLegalPage} from '@notabenda/core';
import {compileLegalDocuments,explainLegalDocument} from '@notabenda/core/content';
import {formatConfigSource} from '@notabenda/core/config/document';
import {fixture} from './helpers.mjs';
import {exceptionFixture} from './storage-exception-helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const review=(c,kind,options={mode:'preview'})=>explainLegalDocument(c,kind,options);
const section=(report,id)=>report.sections.find(s=>s.id===id);
const at=(value,path)=>path.slice(1).split('/').reduce((o,k)=>o[k.replace(/~1/gu,'/').replace(/~0/gu,'~')],value);
async function temp(run){const dir=await mkdtemp(join(tmpdir(),'notabenda-document-inputs-'));try{await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}

test('all current document sections have resolvable input paths without changing input or release bytes',async()=>{
 const c=await fixture();c.private={note:'PRIVATE_EXPLANATION_REASON'};const original=structuredClone(c),before=compileLegalDocuments(c,{mode:'preview'});
 for(const kind of ['privacy','cookies','terms']){
  const r=review(c,kind),d=createLegalDocument(c,kind),publicConfig=toPublicConfig(c);
  assert.deepEqual(r.sections.map(s=>[s.id,s.heading]),d.sections.map(s=>[s.id,s.heading]));
  assert.equal(r.sections.length,d.sections.length);assert.equal(r.mode,'preview');
  assert.deepEqual(r.limits,{determinesApplicability:false,verifiesFacts:false,approvesContent:false,verifiesPublication:false,includesPrivateMetadata:false});
  for(const path of [...r.metadataPaths,...r.sections.flatMap(s=>s.inputPaths)])assert.notEqual(at(publicConfig,path),undefined,path);
  for(const s of r.sections)assert.deepEqual(s.requirementIds,d.requirementIds);
  assert.doesNotMatch(JSON.stringify(r),/PRIVATE_EXPLANATION_REASON|necessityReasonValue/);
 }
 assert.deepEqual(c,original);assert.deepEqual(compileLegalDocuments(c,{mode:'preview'}),before);
});
test('supplied replacements and appended sections retain their actual origin, order and configuration index',async()=>{
 const c=await fixture();c.documents.privacy.source='supplied';c.documents.privacy.sections=[{id:'controller',heading:'Supplied contact wording',paragraphs:['Declared custom wording.']}];
 let r=review(c,'privacy');assert.equal(r.wording,'supplied');assert.deepEqual(r.sections.map(s=>({id:s.id,origin:s.origin,paths:s.inputPaths})),[{id:'controller',origin:'supplied',paths:['/documents/privacy/sections/0']}]);assert.ok(!section(r,'providers'));
 c.documents.cookies.sections=[{id:'first',heading:'First',paragraphs:['First addition.']},{id:'second',heading:'Second',paragraphs:['Second addition.']}];r=review(c,'cookies');
 assert.deepEqual(r.sections.slice(-2).map(s=>[s.id,s.origin,s.inputPaths]),[['additional-first','additional',['/documents/cookies/sections/0']],['additional-second','additional',['/documents/cookies/sections/1']]]);
});
test('empty inventories explain the actual empty-state sections without inventing facts or runtime controls',async()=>{
 const c=await fixture();delete c.consent;c.purposes=[];c.services=[];c.storage=[];
 const p=review(c,'privacy'),k=review(c,'cookies');
 assert.deepEqual(section(p,'purposes').inputPaths,['/purposes']);assert.deepEqual(section(p,'retention').inputPaths,['/purposes']);assert.deepEqual(section(p,'providers').inputPaths,['/services']);assert.deepEqual(section(k,'storage').inputPaths,['/storage']);
 assert.doesNotMatch(JSON.stringify([p,k]),/\/consent|\/private|\/jurisdictions/);
});
test('optional contact and signal sections follow actual inclusion while unrendered policy fields stay outside the report',async()=>{
 const c=await fixture();let p=review(c,'privacy');for(const id of ['dpo','representative','privacy-signals'])assert.equal(section(p,id),undefined);
 c.controller.dpo={name:'Sample contact',email:'contact@example.test'};c.controller.representative={name:'Sample representative',email:'representative@example.test',address:'Sample address'};
 for(const s of c.services)s.processingActivities=[];c.privacySignals={globalPrivacyControl:{appliesTo:['sale'],explanation:'Operator-declared signal information.'}};
 p=review(c,'privacy');assert.deepEqual(section(p,'dpo').inputPaths,['/controller/dpo/name','/controller/dpo/email']);assert.ok(section(p,'representative').inputPaths.includes('/controller/representative/address'));assert.deepEqual(section(p,'privacy-signals').inputPaths,['/privacySignals/globalPrivacyControl/explanation']);assert.doesNotMatch(JSON.stringify(p),/appliesTo/);
});
test('storage dependencies follow the referenced service, purposes and exception title rather than unrelated policy assertions',async()=>{
 const c=await exceptionFixture(),r=review(c,'cookies'),s=section(r,'storage');
 assert.ok(s.inputPaths.includes('/storageExceptions/entries/0/title'));assert.ok(s.inputPaths.includes('/storageExceptions/entries/1/title'));assert.ok(s.inputPaths.includes('/services/0/provider'));assert.ok(s.inputPaths.includes('/purposes/0/name'));assert.equal(new Set(s.inputPaths).size,s.inputPaths.length);
 assert.doesNotMatch(JSON.stringify(r),/\/conditions|\/scopeGuards|\/consent|\/storageExceptions\/entries\/\d+\/description/);
 const changed=structuredClone(c);changed.storageExceptions.entries[0].title='Changed declared title';assert.notEqual(renderLegalPage(c,'cookies'),renderLegalPage(changed,'cookies'));assert.deepEqual(s.inputPaths,section(review(changed,'cookies'),'storage').inputPaths);
});
test('host-localized generation uses actual localized sections and names the selected template dictionary',async()=>{
 const c=localizedExampleConfig(await fixture());for(const kind of ['privacy','cookies','terms']){
  const r=review(c,kind);assert.deepEqual(r.sections.map(s=>s.heading),createLegalDocument(c,kind).sections.map(s=>s.heading));
  for(const s of r.sections)assert.equal(s.inputPaths.includes('/localization/generatedDocuments'),s.origin==='generated');
  assert.equal(r.wording,kind==='terms'?'supplied':'host-localized');
 }
});
test('reports are detached, reject authoring typos and preserve explicit production review checks',async()=>{
 const c=await fixture(),r=review(c,'privacy');r.sections[0].inputPaths.length=0;r.sections[0].requirementIds.length=0;assert.ok(review(c,'privacy').sections[0].inputPaths.length);
 assert.throws(()=>explainLegalDocument(c,'privacy'));assert.throws(()=>review(c,'privacy',{mode:'production'}));c.conset={enabled:true};assert.throws(()=>review(c,'privacy'),e=>e.diagnostics.some(d=>d.path==='/conset'));delete c.conset;
 const declared=explainLegalDocument(await fixture({reviewed:true}),'terms');assert.equal(declared.mode,'production');assert.equal(declared.document.reviewStatus,'reviewed');assert.equal(declared.limits.approvesContent,false);
 Object.defineProperty(c,'controller',{enumerable:true,get(){throw Error('PRIVATE_GETTER_CALLED');}});assert.throws(()=>review(c,'privacy'),e=>!e.message.includes('PRIVATE_GETTER_CALLED'));
});
test('CLI reads JSON, YAML and Markdown notes privately and returns API-equivalent reports without writes',async()=>temp(async dir=>{
 const c=await fixture(),expected=review(c,'cookies',{mode:'preview'});
 for(const [format,ext] of [['json','json'],['yaml','yaml'],['markdown','md']]){
  const path=join(dir,'config.'+ext);await writeFile(path,await formatConfigSource(c,format,'\nPRIVATE_DOCUMENT_NOTES\n'));
  const before=await readFile(path,'utf8'),files=await readdir(dir),r=spawnSync(process.execPath,[cli,'explain','--config',path,'--document','cookies','--preview','--json'],{cwd:dir,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),expected);assert.doesNotMatch(r.stdout,/PRIVATE_DOCUMENT_NOTES/);assert.equal(await readFile(path,'utf8'),before);assert.deepEqual(await readdir(dir),files);
 }
}));
test('CLI requires explicit input/section flags, rejects output/network options and diagnoses production drafts',async()=>temp(async dir=>{
 const path=join(dir,'config.json');await writeFile(path,JSON.stringify(await fixture()));
 for(const args of [[],['--document','privacy'],['--config',path],['--config',path,'--document','unknown'],['--config',path,'--document','privacy','--document','cookies'],['--config',path,'--document','privacy','--out-dir','review'],['--config',path,'--document','privacy','--origin','https://example.test']])assert.notEqual(spawnSync(process.execPath,[cli,'explain',...args],{cwd:dir,encoding:'utf8'}).status,0);
 const result=spawnSync(process.execPath,[cli,'explain','--config',path,'--document','privacy'],{cwd:dir,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/review|draft/i);assert.equal(result.stdout,'');
}));
