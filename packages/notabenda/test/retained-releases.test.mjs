// @requirements REQ-PRODUCT-RETAINED-RELEASES REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-AUTHORING
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {compileLegalDocuments,createRetainedReleaseFiles,canonicalJson,sha256} from 'notabenda/content';
import {validateLegalArtifact} from '../../notabenda-cf/dist/history.js';
import {authoringExample} from '../../../examples/authoring/build.mjs';
import {fixture} from './helpers.mjs';

const reseal=a=>{a.manifest.configSha256=sha256(canonicalJson(a.publicConfig));const {artifactId,...descriptor}=a.manifest;a.manifest.artifactId=sha256(canonicalJson(descriptor));return a;};
async function releases(){const config=await fixture({reviewed:true});const first=compileLegalDocuments(config);config.documents.terms.version='2';config.documents.terms.sections[0].paragraphs.push('A later fictional provision.');return {first,latest:compileLegalDocuments(config),config,options:{siteId:config.site.id}};}

test('retained files preserve exact old HTML and hashes without emitting old mutable routes',async()=>{
  const {first,latest,options}=await releases();const files=createRetainedReleaseFiles([first.artifact,latest.artifact,structuredClone(first.artifact)],options);
  assert.equal(Object.keys(files).length,8);assert.ok(Object.keys(files).every(path=>/^artifacts\/[a-f0-9]{64}(?:\.json|\/(?:privacy|cookies|terms)\.html)$/u.test(path)));
  for(const build of [first,latest])for(const d of build.manifest.documents){const html=files[`artifacts/${build.manifest.artifactId}/${d.kind}.html`];assert.equal(html,build.artifact.pages[d.file]);assert.equal(sha256(html),d.sha256);}
  const complete={...latest.files,...files};assert.match(complete['terms/index.html'],/A later fictional provision/);assert.doesNotMatch(complete[`artifacts/${first.manifest.artifactId}/terms.html`],/A later fictional provision/);
  assert.deepEqual(createRetainedReleaseFiles([JSON.parse(files[`artifacts/${first.manifest.artifactId}.json`])],options),createRetainedReleaseFiles([first.artifact],options));
  assert.deepEqual(first.artifact,JSON.parse(files[`artifacts/${first.manifest.artifactId}.json`]));
  const conflict=structuredClone(first.artifact);conflict.renderedBodies={};assert.throws(()=>createRetainedReleaseFiles([first.artifact,conflict],options));
  await validateLegalArtifact(JSON.parse(files[`artifacts/${latest.manifest.artifactId}.json`]));
});

test('private source envelopes and nested private metadata fail even with recomputed hashes',async()=>{
  const {first,options}=await releases();const attempts=[];
  for(const change of [a=>a.sourceAttachments={terms:{source:'PRIVATE-MARKER'}},a=>a.manifest.private='PRIVATE-MARKER',a=>a.manifest.documents[0].private='PRIVATE-MARKER',a=>a.publicConfig.private={note:'PRIVATE-MARKER'},a=>a.documents.terms.sections[0].private='PRIVATE-MARKER',a=>a.documents.terms.private='PRIVATE-MARKER']){const a=structuredClone(first.artifact);change(a);attempts.push(reseal(a));}
  attempts.push({schemaVersion:1,artifact:first.artifact,sourceAttachments:{}});
  for(const a of attempts)assert.throws(()=>createRetainedReleaseFiles([a],options),error=>!/PRIVATE-MARKER/u.test(error.message));
  assert.throws(()=>createRetainedReleaseFiles([first.artifact],{siteId:'another-site'}));
});

test('corrupt identities, content, paths, document sets and unsupported schemas fail before publication',async()=>{
  const {first,options}=await releases();
  for(const change of [a=>a.manifest.artifactId='f'.repeat(64),a=>a.pages['terms/index.html']+='changed',a=>a.documents.terms.sections[0].paragraphs.push('Changed'),a=>a.manifest.documents[0].file='../outside.html',a=>delete a.documents.cookies,a=>a.pages['extra.html']='extra',a=>a.manifest.schemaVersion=2,a=>a.manifest.documents[0].requirementIds=['unknown']]){const a=structuredClone(first.artifact);change(a);assert.throws(()=>createRetainedReleaseFiles([a],options));}
  const reordered=structuredClone(first.artifact);reordered.pages=Object.fromEntries(Object.entries(reordered.pages).reverse());assert.deepEqual(createRetainedReleaseFiles([reordered],options),createRetainedReleaseFiles([first.artifact],options));
  const multiline=await fixture({reviewed:true});multiline.documents.terms.sections[0].paragraphs=['First line\nSecond line'];assert.ok(createRetainedReleaseFiles([compileLegalDocuments(multiline).artifact],{siteId:multiline.site.id}));
});

test('historical MDX retains rich output and public provenance without re-evaluation or source publication',async()=>{
  const {first,latest}=await authoringExample(),options={siteId:first.publicConfig.site.id,mode:'preview'};const files=createRetainedReleaseFiles([first.artifact,latest.artifact],options);
  const html=files[`artifacts/${first.manifest.artifactId}/terms.html`];assert.equal(html,first.artifact.pages['authored/terms/index.html']);assert.match(html,/class="policy-note"/);assert.doesNotMatch(html,/<script|import .*PolicyNote/);
  assert.equal(Object.hasOwn(JSON.parse(files[`artifacts/${first.manifest.artifactId}.json`]),'sourceAttachments'),false);assert.equal(Object.values(files).some(value=>value.includes(first.archive.sourceAttachments.terms.source)),false);assert.ok(Object.keys(files).every(path=>!path.endsWith('.mdx')));assert.throws(()=>createRetainedReleaseFiles([first.archive],options));
  assert.throws(()=>createRetainedReleaseFiles([first.artifact],{siteId:first.publicConfig.site.id}));
  const bad=structuredClone(first.artifact);bad.renderedBodies.terms+='changed';assert.throws(()=>createRetainedReleaseFiles([bad],options));
});

test('bounded data-only input rejects cycles, accessors and non-JSON values without invoking them',async()=>{
  const {first,options}=await releases();let called=false;const getter={};Object.defineProperty(getter,'manifest',{enumerable:true,get(){called=true;return first.manifest;}});
  for(const a of [getter,{...first.artifact,extra:undefined},{...first.artifact,extra:()=>{}},new Date(),{...first.artifact,extra:'x'.repeat(128*1024)}])assert.throws(()=>createRetainedReleaseFiles([a],options));assert.equal(called,false);
  const arrayProperty=structuredClone(first.artifact);arrayProperty.documents.terms.sections.private='PRIVATE-MARKER';assert.throws(()=>createRetainedReleaseFiles([arrayProperty],options));const hidden=structuredClone(first.artifact);Object.defineProperty(hidden,'private',{value:'PRIVATE-MARKER'});assert.throws(()=>createRetainedReleaseFiles([hidden],options));
  const largeConfig=await fixture({reviewed:true});largeConfig.documents.terms.sections[0].paragraphs=['x'.repeat(18000)];const large=compileLegalDocuments(largeConfig).artifact;assert.ok(Buffer.byteLength(canonicalJson(large))<128*1024);assert.throws(()=>createRetainedReleaseFiles(Array(256).fill(large),options));
  const cyclic={};cyclic.loop=cyclic;assert.throws(()=>createRetainedReleaseFiles([cyclic],options));assert.throws(()=>createRetainedReleaseFiles(Array(257).fill(first.artifact),options));assert.throws(()=>createRetainedReleaseFiles([],{siteId:undefined}));
});

test('CLI clean deployment explicitly retains old public artifacts and rejects private or malformed input before writes',async()=>{
  const {first,latest,config}=await releases(),cwd=await mkdtemp(join(tmpdir(),'notabenda-retained-'));const cli=fileURLToPath(new URL('../dist/cli.js',import.meta.url));const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'});
  try{
    await writeFile(join(cwd,'notabenda.config.json'),JSON.stringify(config));await writeFile(join(cwd,'prior.json'),JSON.stringify(first.artifact));
    const result=run('build','--out-dir','clean','--retain-artifact','prior.json','--retain-artifact','prior.json');assert.equal(result.status,0,result.stderr);
    assert.equal(await readFile(join(cwd,`clean/artifacts/${first.manifest.artifactId}/terms.html`),'utf8'),first.artifact.pages['terms/index.html']);assert.match(await readFile(join(cwd,'clean/terms/index.html'),'utf8'),/A later fictional provision/);assert.equal(JSON.parse(await readFile(join(cwd,'clean/notabenda.manifest.json'),'utf8')).artifactId,latest.manifest.artifactId);
    for(const [name,value] of [['private',{schemaVersion:1,artifact:first.artifact,sourceAttachments:{terms:{source:'PRIVATE-MARKER'}}}],['bad','not-json'],['large','x'.repeat(128*1024+1)]]){
      await writeFile(join(cwd,name+'.json'),name==='private'?JSON.stringify(value):value);const rejected=run('build','--out-dir',name,'--retain-artifact',name+'.json');assert.equal(rejected.status,1);assert.doesNotMatch(rejected.stderr,/PRIVATE-MARKER/);await assert.rejects(readFile(join(cwd,name,'terms/index.html')),error=>error.code==='ENOENT');
    }
    const largeConfig=structuredClone(config);largeConfig.documents.terms.sections[0].paragraphs=['x'.repeat(40000)];assert.ok(Buffer.byteLength(canonicalJson(compileLegalDocuments(largeConfig).artifact))>128*1024);await writeFile(join(cwd,'large-current.json'),JSON.stringify(largeConfig));assert.equal(run('build','--config','large-current.json','--out-dir','large-current').status,0);
    for(const args of [['check','--retain-artifact','prior.json'],['init','--retain-artifact','prior.json'],['build','--retain-artifact']])assert.equal(run(...args).status,1);
  }finally{await rm(cwd,{recursive:true,force:true});}
});
