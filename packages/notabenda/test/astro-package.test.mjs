// @requirements REQ-PRODUCT-SERVICE-CATALOG
// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-COLLECTION-NOTICE
// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-PACKAGE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm,symlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {compileLegalDocuments,createCollectionNotice} from 'notabenda/content';
import {fixture} from './helpers.mjs';

test('packed Astro components compile in an isolated consumer, escape supplied content and enforce explicit draft preview',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'notabenda-astro-package-'));const root=fileURLToPath(new URL('../../..',import.meta.url));
  const env={...process.env,...(existsSync(join(root,'.local/npm-cache'))?{npm_config_cache:join(root,'.local/npm-cache')}:{ }),ASTRO_TELEMETRY_DISABLED:'1'};
  try {
    const packed=spawnSync('npm',['pack','--workspace','notabenda','--json','--ignore-scripts','--pack-destination',cwd],{cwd:root,encoding:'utf8',env});assert.equal(packed.status,0,packed.stderr);const manifest=JSON.parse(packed.stdout)[0];
    for(const path of ['dist/astro/ServiceDirectory.astro','dist/astro/FormPermissionField.astro','dist/astro/CollectionNotice.astro','dist/astro/LegalDocument.astro','dist/astro/LegalLinks.astro','dist/astro/ConsentControls.astro','dist/astro/PreferencesButton.astro','dist/astro-client.d.ts'])assert.ok(manifest.files.some(f=>f.path===path),path);
    await writeFile(join(cwd,'package.json'),'{"private":true,"type":"module"}');
    const installed=spawnSync('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',join(cwd,manifest.filename)],{cwd,encoding:'utf8',env});assert.equal(installed.status,0,installed.stderr);
    await assert.rejects(readFile(join(cwd,'node_modules/react/package.json')),error=>error.code==='ENOENT');
    await assert.rejects(readFile(join(cwd,'node_modules/astro/package.json')),error=>error.code==='ENOENT');
    // Reuse the pinned framework toolchain, as consumer type tests reuse TypeScript. Core comes only from the tarball.
    await symlink(join(root,'node_modules/astro'),join(cwd,'node_modules/astro'),'dir');
    await mkdir(join(cwd,'src/pages'),{recursive:true});
    const config=await fixture({reviewed:true});config.documents.terms.sections[0].paragraphs=['Literal <script>alert("fictional")</script> content.'];
    await writeFile(join(cwd,'src/site.json'),JSON.stringify(config));
    const notice=createCollectionNotice(compileLegalDocuments(config).artifact,{scopeId:'contact',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'About your enquiry',intro:'A fictional form context.'}});await writeFile(join(cwd,'src/notice.json'),JSON.stringify(notice));
    const page=`---\nimport FormPermissionField from 'notabenda/astro/FormPermissionField.astro';\nimport CollectionNotice from 'notabenda/astro/CollectionNotice.astro';\nimport notice from '../notice.json';\nimport LegalDocument from 'notabenda/astro/LegalDocument.astro';\nimport LegalLinks from 'notabenda/astro/LegalLinks.astro';\nimport ServiceDirectory from 'notabenda/astro/ServiceDirectory.astro';\nimport ConsentControls from 'notabenda/astro/ConsentControls.astro';\nimport PreferencesButton from 'notabenda/astro/PreferencesButton.astro';\nimport config from '../site.json';\n---\n<html><body><FormPermissionField id="email-updates" offerId={notice.noticeId}><p>Contact our privacy team for help.</p></FormPermissionField><CollectionNotice notice={notice} idPrefix="contact-privacy"/><LegalDocument config={config} kind="terms" /><LegalLinks config={config}/><ServiceDirectory config={config} idPrefix="services"/><ConsentControls/><PreferencesButton/></body></html>`;
    await writeFile(join(cwd,'src/pages/index.astro'),page);
    const build=()=>spawnSync(process.execPath,[join(cwd,'node_modules/astro/bin/astro.mjs'),'build','--root',cwd],{cwd,encoding:'utf8',env});
    const first=build();assert.equal(first.status,0,first.stdout+first.stderr);
    const html=await readFile(join(cwd,'dist/index.html'),'utf8');assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script/);assert.match(html,/data-collection-notice-id=/);assert.match(html,/data-service-directory="services"/);assert.match(html,/id="contact-privacy-summary"/);assert.match(html,/data-notabenda-form-permission="email-updates"/);assert.match(html,/data-notabenda-permission-fallback/);assert.match(html,/Contact our privacy team/);assert.doesNotMatch(html,/type="checkbox"/);assert.match(html,/data-notabenda-controls/);assert.match(html,/data-notabenda-preferences[^>]*hidden/);
    const imported=spawnSync(process.execPath,['--input-type=module','-e',"import {mountAstroFormPermission} from 'notabenda/astro/client';if(typeof mountAstroFormPermission!=='function')process.exit(1)"],{cwd,encoding:'utf8'});assert.equal(imported.status,0,imported.stderr);
    config.documents.terms.review.status='draft';await writeFile(join(cwd,'src/site.json'),JSON.stringify(config));const rejected=build();assert.notEqual(rejected.status,0);assert.match(rejected.stdout+rejected.stderr,/reviewed-content declaration/);
    await writeFile(join(cwd,'src/pages/index.astro'),page.replace('kind="terms"','kind="terms" mode="preview"').replace('idPrefix="services"','idPrefix="services" mode="preview"'));const preview=build();assert.equal(preview.status,0,preview.stdout+preview.stderr);assert.match(await readFile(join(cwd,'dist/index.html'),'utf8'),/Draft — for review/);
  }finally{await rm(cwd,{recursive:true,force:true});}
});
