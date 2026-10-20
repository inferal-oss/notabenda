// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-CF-DOCTOR REQ-PRODUCT-CF-STARTER
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm,symlink,readdir,lstat,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {inspectProject,parseJsonc,printReport} from '../bin/doctor.mjs';

const cli=fileURLToPath(new URL('../bin/notabenda-cf.mjs',import.meta.url));
const run=(cwd,args)=>spawnSync(process.execPath,[cli,'doctor',...args],{cwd,encoding:'utf8'});
const check=(report,id)=>report.checks.find(item=>item.id===id);
async function fixture(){
 const directory=await mkdtemp(join(tmpdir(),'notabenda-doctor-')),target=join(directory,'backend');
 const result=spawnSync(process.execPath,[cli,'init','--out-dir',target],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 return {directory,target,async ready(){
  await mkdir(join(target,'public/assets'),{recursive:true});await writeFile(join(target,'public/assets/setup.mjs'),'export {};');await writeFile(join(target,'public/assets/setup-preview.mjs'),'export {};');await writeFile(join(target,'public/assets/notabenda.css'),':root {}');await writeFile(join(target,'public/assets/cartridges.css'),'.cartridge-shell {}');
  for(const name of ['@notabenda/core','@notabenda/cloudflare','esbuild','wrangler']){await mkdir(join(target,'node_modules',name),{recursive:true});await writeFile(join(target,'node_modules',name,'package.json'),JSON.stringify({name,version:'0.1.0'}));}
  // This file would fail if imported. Existence is not an authorization verdict.
  await writeFile(join(target,'src/authorize.mjs'),"throw new Error('DOCTOR-MUST-NOT-EXECUTE'); export async function authorizeHostRequest(){return {inspect:true};}\n");
 },cleanup:()=>rm(directory,{recursive:true,force:true})};
}
async function config(target,change){const path=join(target,'wrangler.json'),raw=JSON.parse(await readFile(path,'utf8'));change(raw);await writeFile(path,JSON.stringify(raw));}
async function snapshot(root){const output={};async function walk(path,key=''){for(const entry of await readdir(path,{withFileTypes:true})){const child=join(path,entry.name),name=key+'/'+entry.name,info=await lstat(child);if(info.isSymbolicLink()){output[name]='link';continue;}if(info.isDirectory())await walk(child,name);else output[name]=[info.mode,info.mtimeMs,createHash('sha256').update(await readFile(child)).digest('hex')];}}await walk(root);return output;}

test('new starter doctor gives concrete local blockers without treating its deny-all auth as production readiness',async()=>{
 const f=await fixture();try{const result=run(f.target,['--json']);assert.equal(result.status,1,result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.schemaVersion,1);assert.equal(report.scope,'local-starter');assert.equal(report.productionReadiness,'not-assessed');assert.equal(report.localChecksPassed,false);assert.equal(check(report,'AUTHORIZATION').status,'error');assert.equal(check(report,'ASSET-DIRECTORY').status,'error');assert.equal(check(report,'DEPENDENCY-WRANGLER').status,'error');assert.equal(check(report,'EVIDENCE-BINDING').status,'pass');assert.equal(check(report,'SQLITE-EXPORT').status,'pass');assert.match(printReport(report),/No project code, credentials, network or remote resources were used/);}finally{await f.cleanup();}
});

test('read-only inspection preserves the tree, never imports host/settings/build code or prints private content, and keeps manual work separate',async()=>{
 const f=await fixture();try{
  await f.ready();await writeFile(join(f.target,'.dev.vars'),'SECRET=PRIVATE-DOCTOR-SENTINEL');await writeFile(join(f.target,'setup.private.json'),'PRIVATE-DOCTOR-SENTINEL');await writeFile(join(f.target,'scripts/build-assets.mjs'),"throw new Error('DOCTOR-MUST-NOT-EXECUTE');");
  const before=await snapshot(f.target),result=run(f.target,['--json']);assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.localChecksPassed,true);assert.equal(report.productionReadiness,'not-assessed');assert.equal(check(report,'AUTHORIZATION').status,'review');assert.equal(check(report,'RUNTIME-ACCESS').status,'review');assert.equal(check(report,'PRIVATE-IGNORE-RULES').status,'pass');assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE-DOCTOR-SENTINEL|DOCTOR-MUST-NOT-EXECUTE/);assert.deepEqual(await snapshot(f.target),before);
  await writeFile(join(f.target,'src/settings.mjs'),"export const settings = (()=>{throw Error('PRIVATE-DOCTOR-SENTINEL')})();");const dynamic=await inspectProject({directory:f.target});assert.equal(check(dynamic,'SITE-SETTINGS').status,'error');assert.doesNotMatch(printReport(dynamic,true),/PRIVATE-DOCTOR-SENTINEL/);
 }finally{await f.cleanup();}
});

test('JSONC permits comments/trailing commas without damaging URLs, escaped quotes or string punctuation and redacts syntax failures',async()=>{
 assert.deepEqual(parseJsonc('\ufeff{/* comment */"url":"https://example.test/a//b", "literal":"/* no */ ,}","quote":"\\\"", // line\n "items":[1,2,],}'),{url:'https://example.test/a//b',literal:'/* no */ ,}',quote:'"',items:[1,2]});
 for(const value of ['{/* unterminated','{"value":"unterminated}', '{"x": undefined}', '{"x":1,,}'])assert.throws(()=>parseJsonc(value));
 const f=await fixture();try{await f.ready();await rename(join(f.target,'wrangler.json'),join(f.target,'wrangler.jsonc'));const path=join(f.target,'wrangler.jsonc'),source=await readFile(path,'utf8');await writeFile(path,'// comments are accepted\n'+source.replace(/\}\s*$/u,',}'));assert.equal((await inspectProject({directory:f.target})).localChecksPassed,true);await writeFile(path,'{"PRIVATE-DOCTOR-SENTINEL":');const result=run(f.target,['--json']);assert.equal(result.status,1);assert.equal(check(JSON.parse(result.stdout),'CONFIG').status,'error');assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE-DOCTOR-SENTINEL/);}finally{await f.cleanup();}
});

test('missing selected-environment bindings cannot borrow default bindings; inherited config is replaced as a whole',async()=>{
 const f=await fixture();try{
  await f.ready();await config(f.target,raw=>{raw.env={staging:{name:'staging-evidence',vars:{PRIVATE:'PRIVATE-DOCTOR-SENTINEL'}}};});
  let report=await inspectProject({directory:f.target,environment:'staging'});assert.equal(check(report,'EVIDENCE-BINDING').status,'error');assert.equal(check(report,'ASSET-GATE').status,'pass');assert.doesNotMatch(printReport(report,true),/PRIVATE-DOCTOR-SENTINEL/);
  await config(f.target,raw=>{raw.env.staging.durable_objects=raw.durable_objects;});report=await inspectProject({directory:f.target,environment:'staging'});assert.equal(report.localChecksPassed,true);assert.equal(report.environment,'named');
  await config(f.target,raw=>{raw.env.staging.assets={directory:'public'};});report=await inspectProject({directory:f.target,environment:'staging'});assert.equal(check(report,'ASSET-GATE').status,'error');
  assert.equal(check(await inspectProject({directory:f.target}),'ENVIRONMENT').status,'review');
  for(const environment of ['missing','','__proto__'])assert.equal(check(await inspectProject({directory:f.target,environment}),'ENVIRONMENT').status,'error');
 }finally{await f.cleanup();}
});

test('unsafe upload routing, nonlive/legacy class declarations and out-of-project paths produce actionable blockers',async()=>{
 const f=await fixture();try{
  await f.ready();await config(f.target,raw=>{raw.assets.run_worker_first=['/backoffice/*'];raw.exports.EvidenceWorkspace.state='deleted';raw.migrations=[];raw.main='../outside.mjs';});
  const report=await inspectProject({directory:f.target});for(const id of ['ASSET-GATE','SQLITE-EXPORT','CLASS-LIFECYCLE','WORKER-ENTRY'])assert.equal(check(report,id).status,'error',id);
  await config(f.target,raw=>{raw.durable_objects.bindings.push({...raw.durable_objects.bindings[0]});});assert.equal(check(await inspectProject({directory:f.target}),'EVIDENCE-BINDING').status,'error');
  for(const configOption of ['../outside.json','wrangler.toml',''])assert.equal(check(await inspectProject({directory:f.target,config:configOption}),'CONFIG').status,'error');
  await writeFile(join(f.target,'wrangler.jsonc'),'{}');assert.equal(check(await inspectProject({directory:f.target}),'CONFIG').status,'error');assert.equal(check(await inspectProject({directory:f.target,config:'wrangler.json'}),'CONFIG').status,'pass');
 }finally{await f.cleanup();}
});

test('public private-file patterns, symlinks and bounds are detected without following or disclosing targets',async()=>{
 const f=await fixture();try{
  await f.ready();await writeFile(join(f.directory,'outside.txt'),'PRIVATE-DOCTOR-SENTINEL');await symlink(join(f.directory,'outside.txt'),join(f.target,'public','linked.txt'));await writeFile(join(f.target,'public','.env.production'),'PRIVATE-DOCTOR-SENTINEL');
  let report=await inspectProject({directory:f.target});assert.equal(check(report,'ASSET-LINKS').status,'error');assert.equal(check(report,'PUBLIC-FILENAMES').status,'error');assert.doesNotMatch(printReport(report,true),/PRIVATE-DOCTOR-SENTINEL|outside\.txt|linked\.txt/);
  await symlink(f.directory,join(f.target,'outside-assets'));await config(f.target,raw=>{raw.assets.directory='outside-assets';});assert.equal(check(await inspectProject({directory:f.target}),'ASSET-DIRECTORY').status,'error');
  await config(f.target,raw=>{raw.assets.directory='public';});let path=join(f.target,'public/deep');for(let i=0;i<26;i++){path=join(path,'d');await mkdir(path,{recursive:true});}report=await inspectProject({directory:f.target});assert.equal(check(report,'PUBLIC-FILENAMES').status,'error');assert.match(check(report,'PUBLIC-FILENAMES').message,/could not finish/);
 }finally{await f.cleanup();}
});

test('CLI checks selected directory, rejects unknown/duplicate/missing arguments and never accepts deployment or credentials',async()=>{
 const f=await fixture();try{
  await f.ready();const success=run(f.directory,['--directory',f.target,'--config','wrangler.json']);assert.equal(success.status,0,success.stderr);assert.match(success.stdout,/Production readiness was not assessed/);
  for(const args of [['--directory'],['--json','--json'],['--env'],['--token','PRIVATE-DOCTOR-SENTINEL'],['--deploy'],['--fix'],['--url','https://example.test']]){const result=run(f.target,args);assert.equal(result.status,1);assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE-DOCTOR-SENTINEL/);}
 }finally{await f.cleanup();}
});

test('metadata checks never read entries/assets and private aliases or external dependency symlinks cannot cross the content-read boundary',async()=>{
 const f=await fixture();let originalRead;try{
  await f.ready();await writeFile(join(f.target,'.dev.vars'),'PRIVATE-DOCTOR-SENTINEL');await config(f.target,raw=>{raw.main='.dev.vars';});
  const external=join(f.directory,'external-package');await mkdir(external);await writeFile(join(external,'package.json'),JSON.stringify({name:'@notabenda/core',version:'0.1.0',privateValue:'PRIVATE-DOCTOR-SENTINEL'}));await rm(join(f.target,'node_modules/@notabenda/core'),{recursive:true});await symlink(external,join(f.target,'node_modules/@notabenda/core'));
  await rm(join(f.target,'src/settings.mjs'));await symlink(join(f.target,'.dev.vars'),join(f.target,'src/settings.mjs'));
  const reads=[];originalRead=fs.promises.readFile;fs.promises.readFile=async function(path,...args){reads.push(String(path));return originalRead.call(this,path,...args);};syncBuiltinESMExports();
  const report=await inspectProject({directory:f.target});for(const id of ['WORKER-ENTRY','SITE-SETTINGS','DEPENDENCY-NOTABENDA'])assert.equal(check(report,id).status,'error',id);
  assert.equal(reads.some(path=>path.includes('.dev.vars')||path.includes('external-package')||path.includes('node_modules/@notabenda/core/')||path.includes('public/assets/')),false,reads.join('\n'));
  await config(f.target,raw=>{raw.main='src/worker.mjs';});reads.length=0;const second=await inspectProject({directory:f.target});assert.equal(check(second,'WORKER-ENTRY').status,'pass');assert.equal(reads.some(path=>path.endsWith('/src/worker.mjs')||path.includes('public/assets/')),false);
  await symlink(join(f.target,'.dev.vars'),join(f.target,'private-alias.json'));reads.length=0;assert.equal(check(await inspectProject({directory:f.target,config:'private-alias.json'}),'CONFIG').status,'error');assert.equal(reads.some(path=>path.includes('.dev.vars')),false);
 }finally{if(originalRead){fs.promises.readFile=originalRead;syncBuiltinESMExports();}await f.cleanup();}
});
