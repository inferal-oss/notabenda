// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS REQ-PRODUCT-CONFIG-SOURCES
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {stringify} from 'yaml';
import {setup} from './collection-flow-fixture.mjs';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
async function paths(root,prefix=''){const result=[];for(const item of await readdir(join(root,prefix),{withFileTypes:true})){const path=prefix+item.name;if(item.isDirectory())result.push(...await paths(root,path+'/'));else result.push(path);}return result.sort();}
test('CLI composes identical JSON/YAML/YML/Markdown frontmatter flows, excludes notes, and protects stale output',async()=>{
 const f=await setup(),dir=await mkdtemp(join(tmpdir(),'notabenda-collection-flow-'));
 try{
  await writeFile(join(dir,'site.yaml'),stringify(f.config));const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8',timeout:20000});let expected;
  for(const [ext,body] of [['json',JSON.stringify(f.settings)],['yaml',stringify(f.settings)],['yml',stringify(f.settings)],['md','---\n'+stringify(f.settings)+'---\n# PRIVATE-FLOW-NOTES\nDo not publish the private assessment.\n']]){
   const file='flow.'+ext,out='out-'+ext;await writeFile(join(dir,file),body);const result=run('build','--config','site.yaml','--collection-flow',file,'--out-dir',out);assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/PRIVATE-FLOW/);
   const names=await paths(join(dir,out)),files=Object.fromEntries(await Promise.all(names.map(async p=>[p,await readFile(join(dir,out,p),'utf8')])));assert.deepEqual(JSON.parse(files['collection-flow.json']),f.flow);assert.match(files['collection-flow.html'],/data-collection-flow-id=/);assert.ok(names.includes('collection-flows/'+f.flow.flowId+'/permissions/updates-email.json'));assert.doesNotMatch(Object.values(files).join(''),/PRIVATE-FLOW-NOTES|private assessment/);if(expected)assert.deepEqual(files,expected);else expected=files;
   const again=run('build','--config','site.yaml','--out-dir',out);assert.equal(again.status,1);assert.match(again.stderr,/already contains collection-flow/);assert.equal(await readFile(join(dir,out,'collection-flow.json'),'utf8'),files['collection-flow.json']);
  }
  const stale=structuredClone(f.settings);stale.reviewedArtifactId='a'.repeat(64);await writeFile(join(dir,'stale.json'),JSON.stringify(stale));const result=run('build','--config','site.yaml','--collection-flow','stale.json','--out-dir','never-created');assert.equal(result.status,1);await assert.rejects(readdir(join(dir,'never-created')),{code:'ENOENT'});
  for(const args of [['check','--collection-flow','flow.json'],['build','--collection-flow'],['build','--collection-flow','flow.json','--collection-flow','flow.json']])assert.equal(run(...args).status,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
