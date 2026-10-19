// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {pathToFileURL} from 'node:url';import {JSDOM} from 'jsdom';
import {buildControlsLayoutFixture} from '../../../scripts/build-controls-layout.mjs';
import {normalizeConsentNotice} from '../dist/consent-notice.js';import {normalizeConsentRuntimeConfig} from '../dist/consent-runtime-config.js';
test('repeatable local fixtures exercise accepted long copy without changing production graphs or making recorded-evidence claims',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nb-layout-'));try{
  await buildControlsLayoutFixture(pathToFileURL(dir+'/'));
  const html=await readFile(join(dir,'index.html'),'utf8'),doc=new JSDOM(html).window.document;
  assert.equal(doc.querySelector('meta[name=viewport]').content,'width=device-width,initial-scale=1');assert.equal(doc.querySelectorAll('select').length,5);assert.equal(doc.querySelectorAll('script').length,1);assert.match(doc.body.textContent,/English layout samples/);assert.match(doc.body.textContent,/in memory; nothing is recorded/);
  for(const copy of ['normal','long']){const config=normalizeConsentRuntimeConfig(JSON.parse(await readFile(join(dir,copy+'.config.json'),'utf8'))),notice=normalizeConsentNotice(JSON.parse(await readFile(join(dir,copy+'.notice.json'),'utf8')),{allowPreview:true});assert.equal(config.evidence,'local');assert.equal(notice.siteId,config.inventory.site.id);assert.ok((await readFile(join(dir,notice.documents.cookies.url),'utf8')).includes('<html'));if(copy==='long'){assert.ok(notice.wording.preferencesTitle.length>250);assert.ok(notice.wording.closeLabel.length>30);assert.ok(config.inventory.purposes[0].name.length>150);}}
  const script=await readFile(join(dir,'app.mjs'),'utf8');assert.doesNotMatch(script,/sendBeacon|XMLHttpRequest/);assert.equal((script.match(/fetch\(/gu)??[]).length,2);assert.equal(await readFile(join(dir,'consent.css'),'utf8'),await readFile(new URL('../dist/consent.css',import.meta.url),'utf8'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
