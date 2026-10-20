// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
// @requirements REQ-PRODUCT-CARTRIDGES
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-PACKAGE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CF-HISTORY
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,symlink,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {compileLegalDocuments} from '@notabenda/core/content';
import {compileAuthoredDocuments} from '@notabenda/authoring';
const root=fileURLToPath(new URL('../../../',import.meta.url)),cli=fileURLToPath(new URL('../bin/notabenda-cf.mjs',import.meta.url));
const run=(cwd,args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'});
async function directory(){return mkdtemp(join(tmpdir(),'notabenda-cf-starter-'));}
async function scaffold(cwd,siteId='site-one'){
 const target=join(cwd,'backend'),result=run(cwd,['init','--out-dir',target,'--site-id',siteId,'--name','fictional-evidence','--base-path','/workspace']);assert.equal(result.status,0,result.stderr);
 await symlink(join(root,'node_modules'),join(target,'node_modules'),'dir');return target;
}

test('CLI creates a standalone project with declared SQLite storage, local build commands, host auth and no install/deployment side effect',async()=>{
 const cwd=await directory();try{
  const target=await scaffold(cwd),config=JSON.parse(await readFile(join(target,'wrangler.json'),'utf8')),pkg=JSON.parse(await readFile(join(target,'package.json'),'utf8'));
  assert.deepEqual(config.exports,{EvidenceWorkspace:{type:'durable-object',storage:'sqlite'}});assert.equal(config.migrations,undefined);assert.equal(config.assets.run_worker_first,true);assert.equal(config.routes,undefined);assert.equal(config.account_id,undefined);assert.equal(config.observability.enabled,false);
  assert.match(pkg.scripts.check,/--dry-run/);assert.equal(pkg.dependencies['@notabenda/cloudflare'],'0.1.0');assert.equal(pkg.dependencies['@notabenda/core'],'0.1.0');assert.equal(pkg.private,true);
  assert.match(await readFile(join(target,'LICENSE'),'utf8'),/Apache License/);assert.match(await readFile(join(target,'.gitignore'),'utf8'),/\.dev.vars/);
  const {authorizeHostRequest}=await import(pathToFileURL(join(target,'src/authorize.mjs')));assert.equal(await authorizeHostRequest(new Request('https://example.test/'),{}),null);
  await assert.rejects(readFile(join(target,'.dev.vars')),e=>e.code==='ENOENT');await assert.rejects(readFile(join(target,'package-lock.json')),e=>e.code==='ENOENT');
  assert.equal(run(cwd,['--help']).status,0);assert.notEqual(run(cwd,['deploy']).status,0);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('scaffolding rejects malformed options and existing paths, including symlinks, without overwriting caller files',async()=>{
 const cwd=await directory();try{
  const victim=join(cwd,'existing');await mkdir(victim);await writeFile(join(victim,'keep.txt'),'KEEP');await symlink(victim,join(cwd,'linked'));
  for(const args of [[],['--name','Bad Name'],['--site-id','../other'],['--base-path','/assets/private'],['--base-path','/admin?key=private'],['--name','a','--name','b'],['--unknown','x'],['--name'],['--out-dir',victim],['--out-dir',join(cwd,'linked')]]){
   const result=run(cwd,['init',...args,...(args.length?[]:['--out-dir',victim])]);assert.notEqual(result.status,0,args.join(' '));
  }
  assert.equal(await readFile(join(victim,'keep.txt'),'utf8'),'KEEP');await assert.rejects(readFile(join(victim,'package.json')),e=>e.code==='ENOENT');
  const missing=run(cwd,['init','--out-dir',join(cwd,'missing','backend')]);assert.notEqual(missing.status,0);assert.match(missing.stderr,/parent must already exist/);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('generated host authorizes before assets or DO access and independently gates setup/export without accepting browser grants or scope selectors',async()=>{
 const cwd=await directory();try{
  const target=await scaffold(cwd),{createHost}=await import(pathToFileURL(join(target,'src/host.mjs')));let lookups=0,assets=0,received;
  const env={
   ASSETS:{fetch:async()=>{assets++;return new Response('asset');}},
   EVIDENCE:{getByName(name){lookups++;assert.equal(name,'notabenda:site-one');return {inspect:async(request,access)=>{received=access;return new Response('scoped');}};}},
  };
  const request=(path,options)=>new Request('https://example.test'+path,options);
  for(const authorize of [()=>null,()=>({inspect:'true'}),()=>{throw Error('PRIVATE');}])for(const path of ['/workspace/history','/workspace/setup','/assets/setup.mjs','/assets/setup-preview.mjs','/assets/cartridges.css','/other']){const response=await createHost(authorize)(request(path),env);assert.equal(response.status,403);assert.equal(await response.text(),'Access denied.');}
  assert.equal(lookups,0);assert.equal(assets,0);
  const overviewRead=createHost(()=>({inspect:true}));assert.equal((await overviewRead(request('/workspace?q=reader'),env)).status,200);assert.deepEqual(received,{allowSetup:false});assert.equal((await createHost(()=>({inspect:true,configure:true}))(request('/workspace'),env)).status,200);assert.deepEqual(received,{allowSetup:true});lookups=0;
  const read=createHost(()=>({inspect:true}));assert.equal((await read(request('/workspace/history',{headers:{'X-Notabenda-Export':'1','X-Site-Id':'other'}}),env)).status,200);assert.deepEqual(received,{allowExport:false,allowSource:false,allowCatalogReview:false});
  for(const path of ['/workspace/setup','/assets/setup.mjs','/assets/setup-preview.mjs','/assets/cartridges.css'])assert.equal((await read(request(path),env)).status,403);
  for(const path of ['/workspace/private','/workspace/other/history','/workspace/history/write'])assert.equal((await read(request(path),env)).status,404);
  assert.equal((await read(request('/workspace/history',{method:'POST',body:'private'}),env)).status,405);assert.equal(assets,0);assert.equal(lookups,1);
  const configure=createHost(()=>({inspect:true,configure:true,export:true,source:true,catalogReview:true}));const setup=await configure(request('/workspace/setup'),env);assert.equal(setup.status,200);assert.match(await setup.text(),/data-notabenda-setup/);assert.equal(setup.headers.get('Cache-Control'),'private, no-store');
  assert.equal((await configure(request('/assets/setup.mjs'),env)).status,200);assert.equal(assets,1);assert.equal((await configure(request('/assets/cartridges.css'),env)).status,200);assert.equal(assets,2);assert.equal((await configure(request('/assets/setup-preview.mjs'),env)).status,200);assert.equal(assets,3);await configure(request('/workspace/history'),env);assert.deepEqual(received,{allowExport:true,allowSource:true,allowCatalogReview:true});
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('generated workspace starts empty, archives only matching sites and preserves private MDX history without a public mutation route',async()=>{
 const cwd=await directory();try{
  const config=await fixture({reviewed:true}),target=await scaffold(cwd,config.site.id),{createWorkspace}=await import(pathToFileURL(join(target,'src/workspace.mjs'))),storage=createSyntheticStorage([]),workspace=createWorkspace(storage);
  const request=path=>new Request('https://example.test/workspace/'+path);
  for(const section of ['history','choices','agreements','processing','permissions','contracts']){const response=await workspace.inspect(request(section));assert.equal(response.status,200);assert.match(await response.text(),/No matches/);}
  const build=compileLegalDocuments(config);await workspace.recordRelease(build.artifact,{changeNote:'Fictional starter test'});assert.match(await (await workspace.inspect(request('history'))).text(),/Fictional starter test/);
  const overview=await workspace.inspect(new Request('https://example.test/workspace?q='+build.artifact.manifest.artifactId));assert.match(await overview.text(),/history\/record\?id=/);
  const other=structuredClone(config);other.site.id='another-site';await assert.rejects(workspace.recordRelease(compileLegalDocuments(other).artifact),/configured site/);
  const authored=await compileAuthoredDocuments(config,{terms:{format:'mdx',source:'---\nkind: terms\ntitle: Sample terms\nroute: /terms\nversion: authored-1\neffectiveDate: 2026-10-18\nreview:\n  status: reviewed\n---\n## First section\n\nFictional authored terms.'}});await workspace.recordRelease(authored.archive);
  const id=authored.manifest.artifactId;assert.equal((await workspace.inspect(request('history/source?id='+id+'&kind=terms'))).status,404);const response=await workspace.inspect(request('history/source?id='+id+'&kind=terms'),{allowSource:true});assert.equal(response.status,200);assert.match(await response.text(),/Fictional authored terms/);
  assert.equal((await workspace.inspect(request('history/export'))).status,403);assert.equal((await workspace.inspect(request('history/export'),{allowExport:true,allowSource:false})).status,200);
  const invalid={...build.artifact,pages:{...build.artifact.pages,'terms/index.html':'tampered'}};await assert.rejects(workspace.recordRelease(invalid));
 }finally{await rm(cwd,{recursive:true,force:true});}
});

// @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-CF-HISTORY
test('generated workspace preserves catalog attachments and uses an independent private inspection grant',async()=>{
 const {catalogReleaseExample}=await import('../../../examples/catalog-releases/build.mjs'),{first}=catalogReleaseExample(await fixture()),cwd=await directory();
 try{const target=await scaffold(cwd,first.manifest.siteId),{createWorkspace}=await import(pathToFileURL(join(target,'src/workspace.mjs'))),workspace=createWorkspace(createSyntheticStorage([]));
  await workspace.recordRelease(first.archive);await assert.rejects(workspace.recordRelease(first.artifact));
  const request=new Request('https://example.test/workspace/history/catalog-review?id='+first.manifest.artifactId);
  for(const access of [{},{allowSource:true},{allowExport:true}])assert.equal((await workspace.inspect(request,access)).status,403);
  const response=await workspace.inspect(request,{allowCatalogReview:true});assert.equal(response.status,200);assert.match(await response.text(),/Cedar Mail/);
 }finally{await rm(cwd,{recursive:true,force:true});}
});
