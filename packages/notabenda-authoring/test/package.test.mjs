// @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-PACKAGE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fixture} from '../../notabenda/test/helpers.mjs';

test('authoring tarball installs offline, compiles documents and exposes usable consumer declarations',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'notabenda-authoring-package-'));
  const root=fileURLToPath(new URL('../../..',import.meta.url));
  const env={...process.env,...(existsSync(join(root,'.local/npm-cache')) ? {npm_config_cache:join(root,'.local/npm-cache')} : {}),npm_config_update_notifier:'false'};
  try{
    const pack=spawnSync('npm',['pack','--workspace','notabenda','--workspace','notabenda-authoring','--json','--ignore-scripts','--pack-destination',cwd],{cwd:root,encoding:'utf8',env});assert.equal(pack.status,0,pack.stderr);
    const packages=JSON.parse(pack.stdout);const authoring=packages.find(p=>p.name==='notabenda-authoring');
    for(const path of ['LICENSE','README.md','dist/index.js','dist/index.d.ts'])assert.ok(authoring.files.some(f=>f.path===path),path);
    assert.equal(authoring.files.some(f=>/^(?:src|test|examples)\//u.test(f.path)),false);
    await writeFile(join(cwd,'package.json'),'{"private":true,"type":"module"}');
    const install=spawnSync('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',...packages.map(p=>join(cwd,p.filename))],{cwd,encoding:'utf8',env});assert.equal(install.status,0,install.stderr);
    const source='---\nkind: terms\ntitle: Sample terms\nroute: /terms\nversion: "one"\neffectiveDate: 2026-10-18\nreview:\n  status: reviewed\n---\n## Example\n\nFictional terms.';
    await writeFile(join(cwd,'site.json'),JSON.stringify(await fixture({reviewed:true})));
    const run=spawnSync(process.execPath,['--input-type=module','-e',`import {readFile} from 'node:fs/promises';import {compileAuthoredDocuments} from 'notabenda-authoring';const config=JSON.parse(await readFile('./site.json','utf8'));const release=await compileAuthoredDocuments(config,{terms:{format:'md',source:${JSON.stringify(source)}}});if(!release.fragments.terms.includes('Fictional terms.'))process.exit(1);`],{cwd,encoding:'utf8'});assert.equal(run.status,0,run.stderr);
    await writeFile(join(cwd,'consumer.ts'),`import {compileAuthoredDocuments,readDocumentSource,type DocumentSource} from 'notabenda-authoring';\nconst source:DocumentSource={format:'md',source:${JSON.stringify(source)}};\nconst file=await readDocumentSource('./legal/terms.mdx');\nconst build=await compileAuthoredDocuments({}, {terms:source},{mode:'preview'});\nconst text:string=build.archive.sourceAttachments.terms!.source;\nvoid file;void text;`);
    const types=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--module','nodenext','--moduleResolution','nodenext','--target','es2022',join(cwd,'consumer.ts')],{cwd,encoding:'utf8'});assert.equal(types.status,0,types.stdout+types.stderr);
  }finally{await rm(cwd,{recursive:true,force:true});}
});
