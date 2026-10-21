// @requirements REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-CONFIG REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,symlink,mkdir} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawnSync} from 'node:child_process';
import {parseConfigSource,readConfigSource,readSiteConfig,formatConfigSource,MAX_CONFIG_SOURCE_BYTES} from '@notabenda/core/config/node';
import {validateSiteConfig} from '@notabenda/core';
import {compileLegalDocuments} from '@notabenda/core/content';
import {build} from 'esbuild';
const fixture=async()=>JSON.parse(await readFile(new URL('../../../examples/static/notabenda.config.json',import.meta.url),'utf8'));
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const run=(cwd,...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8',timeout:10000});

test('JSON, YAML and Markdown configuration produce identical files and release identities; notes never enter output',async()=>{
 const config=await fixture(),expected=compileLegalDocuments(config,{mode:'preview'});
 for(const file of ['notabenda.config.yaml','notabenda.config.md'])assert.deepEqual((await readConfigSource(new URL('../../../examples/configuration/'+file,import.meta.url).pathname)).config,config);
 for(const format of ['json','yaml','markdown']){
  const source=await formatConfigSource(config,format,format==='markdown'?'\n# PRIVATE_OPERATOR_NOTE\n\n<script>throw Error("never execute")</script>\n':''),parsed=await parseConfigSource(source,format);
  assert.deepEqual(parsed.config,config);assert.equal(parsed.format,format);assert.equal(parsed.notes.includes('PRIVATE_OPERATOR_NOTE'),format==='markdown');
  assert.deepEqual(compileLegalDocuments(parsed.config,{mode:'preview'}),expected);
 }
 const markdown=await formatConfigSource(config,'markdown');
 const changed=await parseConfigSource(markdown+'\nA different private note.\n','markdown');
 assert.deepEqual(compileLegalDocuments(changed.config,{mode:'preview'}),expected);
});

test('YAML 1.2 retains dates, multiline prose and boolean-looking text without interpolation or includes',async()=>{
 const source='schemaVersion: 1\nsite:\n  name: No\n  description: |\n    First paragraph.\n    ${PRIVATE_TOKEN} stays literal.\ndate: 2026-10-20\nversion: "1.0"\nflag: false\ninclude: ./do-not-read.yaml\n';
 const {config}=await parseConfigSource(source,'yaml');
 assert.equal(config.site.name,'No');assert.equal(config.site.description,'First paragraph.\n${PRIVATE_TOKEN} stays literal.\n');assert.equal(config.date,'2026-10-20');assert.equal(config.version,'1.0');assert.equal(config.flag,false);assert.equal(config.include,'./do-not-read.yaml');
 const prototype=await parseConfigSource('__proto__: {polluted: true}\nconstructor: literal\n','yaml');assert.equal(Object.getPrototypeOf(prototype.config),Object.prototype);assert.equal({}.polluted,undefined);assert.equal(Object.hasOwn(prototype.config,'__proto__'),true);
});

test('ambiguous or executable YAML features and malformed frontmatter fail without echoing private source',async()=>{
 for(const source of ['x: one\nx: PRIVATE_VALUE\n','x: !PRIVATE_VALUE unsafe\n','x: !!str PRIVATE_VALUE\n','x: &PRIVATE_VALUE plain\n','x: *PRIVATE_VALUE\n','x: .inf\n','x: .nan\n','? [PRIVATE_VALUE]\n: bad\n','1: PRIVATE_VALUE\n','<<: PRIVATE_VALUE\n','x: PRIVATE_VALUE\n---\nx: two\n','%YAML 1.1\n---\nx: PRIVATE_VALUE\n','%TAG !p! tag:PRIVATE_VALUE\n---\nx: one\n','x: [PRIVATE_VALUE\n']){
  await assert.rejects(parseConfigSource(source,'yaml'),error=>!error.message.includes('PRIVATE_VALUE'));
 }
 for(const source of ['# Missing frontmatter\n','---\nx: PRIVATE_VALUE\n','---\n- PRIVATE_VALUE\n---\n'])await assert.rejects(parseConfigSource(source,'markdown'),error=>!error.message.includes('PRIVATE_VALUE'));
 for(const [source,format] of [['null','json'],['[]','yaml'],['x: \0','yaml'],['x: '+ 'é'.repeat(MAX_CONFIG_SOURCE_BYTES),'yaml'],['{PRIVATE_VALUE','json']])await assert.rejects(parseConfigSource(source,format),error=>!error.message.includes('PRIVATE_VALUE'));
 const deep='x: '.repeat(100)+'end';await assert.rejects(parseConfigSource(deep,'yaml'));
 const nested=Array.from({length:100},(_,i)=>' '.repeat(i)+'x:').join('\n');await assert.rejects(parseConfigSource(nested,'yaml'),/nesting|Invalid YAML/);
});

test('ordinary bounded UTF-8 file reading refuses symlinks, invalid encoding, directories and executable formats',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-config-files-'));
 try{
  const path=join(cwd,'site.yaml');await writeFile(path,await formatConfigSource(await fixture(),'yaml'));
  assert.equal((await readConfigSource(path)).format,'yaml');await readSiteConfig(path,{mode:'preview'});await assert.rejects(readSiteConfig(path),error=>error.name==='SiteConfigError');
  await symlink(path,join(cwd,'alias.yaml'));await assert.rejects(readConfigSource(join(cwd,'alias.yaml')),/ordinary/);
  await writeFile(join(cwd,'encoding.yaml'),Buffer.from([0xc3,0x28]));await assert.rejects(readConfigSource(join(cwd,'encoding.yaml')),/UTF-8/);
  await mkdir(join(cwd,'dir.yaml'));await assert.rejects(readConfigSource(join(cwd,'dir.yaml')),/ordinary/);
  await writeFile(join(cwd,'site.mjs'),'throw Error("PRIVATE_EXECUTION")');await assert.rejects(readConfigSource(join(cwd,'site.mjs')),error=>!error.message.includes('PRIVATE_EXECUTION'));
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('the installed CLI initializes all formats without overwriting and shares check, build, assess and wizard imports',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-config-cli-'));
 try{
  const config=await fixture();await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));
  await writeFile(join(cwd,'selection.json'),JSON.stringify({schemaVersion:1,answers:{documents:'yes'}}));
  await writeFile(join(cwd,'capture.json'),JSON.stringify({schemaVersion:1,kind:'browser-discovery-capture',capturedAt:'2026-10-20T12:00:00.000Z',pageOrigin:config.site.url,routeLabel:'Landing',scenario:'Initial',coverage:{resources:'available',dom:'available',cookies:'available',localStorage:'available',sessionStorage:'available'},network:[],references:[],storage:[],omitted:{nonHttpReferences:0,oversizedNames:0}}));
  let previous;
  for(const [format,extension] of [['json','json'],['yaml','yaml'],['yaml','yml'],['markdown','md']]){
   const name='site.'+extension,init=run(cwd,'init','--config',name);assert.equal(init.status,0,init.stderr);const initial=await readFile(join(cwd,name),'utf8');assert.notEqual(run(cwd,'init','--config',name).status,0);assert.equal(await readFile(join(cwd,name),'utf8'),initial);
   await writeFile(join(cwd,name),await formatConfigSource(config,format,format==='markdown'?'\nPRIVATE_OPERATOR_NOTE\n':''));
   const checked=run(cwd,'check','--config',name,'--preview','--json');assert.equal(checked.status,0,checked.stderr);assert.deepEqual(JSON.parse(checked.stdout),validateSiteConfig(config,{mode:'preview'}));assert.notEqual(run(cwd,'check','--config',name).status,0);
   const built=run(cwd,'build','--config',name,'--preview','--out-dir','out-'+extension);assert.equal(built.status,0,built.stderr);
   const output=await readFile(join(cwd,'out-'+extension,'notabenda.public.json'),'utf8');assert.doesNotMatch(output,/PRIVATE_OPERATOR_NOTE/);if(previous)assert.equal(output,previous);previous=output;
   const discovered=run(cwd,'discover','--capture','capture.json','--config',name,'--json');assert.equal(discovered.status,0,discovered.stderr);assert.equal(JSON.parse(discovered.stdout).siteId,config.site.id);
   const assessed=run(cwd,'assess','--selection','selection.json','--config',name,'--json');assert.equal(assessed.status,0,assessed.stderr);assert.equal(JSON.parse(assessed.stdout).validation.preview.valid,true);
   const wizard=run(cwd,'wizard','--config',name,'--answers','answers.json','--out-dir','setup-'+extension);assert.equal(wizard.status,0,wizard.stderr);const draft=JSON.parse(await readFile(join(cwd,'setup-'+extension,'notabenda.config.json'),'utf8'));assert.equal(draft.site.id,config.site.id);
  }
  await writeFile(join(cwd,'site.yaml'),'site:\n  id: invalid');const bad=run(cwd,'check','--config','site.yaml','--preview','--json');assert.equal(bad.status,1);assert.equal(JSON.parse(bad.stdout).valid,false);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('browser entry graphs exclude YAML and the Node configuration reader',async()=>{
 for(const entry of ['@notabenda/core','@notabenda/core/headless','@notabenda/core/consent']){
  const result=await build({stdin:{contents:`export * from '${entry}';`,resolveDir:process.cwd()},bundle:true,platform:'browser',write:false,metafile:true});
  assert.ok(Object.keys(result.metafile.inputs).every(path=>!/(?:config-source|config-yaml|node_modules\/yaml)/u.test(path)),entry);
 }
});
