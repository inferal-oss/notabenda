// @requirements REQ-PRODUCT-TERMS-AUTHORING
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createConfiguredTermsOffer,sha256} from '@notabenda/core/content';
const root=new URL('../dist/public/',import.meta.url);
test('agreement examples use explicit configured wording tied to their published archive',async()=>{
 for(const prefix of ['','dark/']){
  const offer=JSON.parse(await readFile(new URL(prefix+'agreement/offer.json',root),'utf8')),artifact=JSON.parse(await readFile(new URL('artifacts/'+offer.artifactId+'.json',root),'utf8'));
  assert.equal(artifact.publicConfig.terms.agreements.length,1);const settings=artifact.publicConfig.terms.agreements[0];assert.equal(settings.scopeId,offer.scopeId);assert.equal(settings.reviewStatus,'draft');assert.deepEqual(createConfiguredTermsOffer(artifact,settings.scopeId,{mode:'preview'}),offer);
  assert.equal(sha256(await readFile(new URL('artifacts/'+offer.artifactId+'/terms.html',root),'utf8')),offer.document.sha256);
 }
 const dom=new JSDOM(await readFile(new URL('guide/terms/index.html',root),'utf8'));
 try{const d=dom.window.document;assert.ok(d.querySelector('#configure-the-agreement-wording'));assert.ok(d.querySelector('#prepare-settings-with-the-wizard'));assert.match(d.body.textContent,/createConfiguredTermsOffer/);assert.match(d.body.textContent,/--terms agreements.json/);assert.ok(d.querySelector('pre code'));}finally{dom.window.close();}
});
