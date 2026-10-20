// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-ASTRO REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {renderLegalDocument} from '@notabenda/core';
import {astroFiles} from '../../../examples/astro/build.mjs';
import {publicConfig} from '../../../examples/astro/src/lib/config.mjs';

test('real Astro builds script-free exact structured documents and a self-hosted interactive navigation example',async()=>{
  const files=await astroFiles();
  const {JSDOM}=await import('jsdom');
  assert.ok(files['assets/example-pages.css']);
  for(const kind of ['privacy','cookies','terms']){
    const html=files[`astro/${kind}/index.html`];assert.ok(html);assert.doesNotMatch(html,/<script|<style/);
    assert.ok(html.includes(renderLegalDocument(publicConfig,kind,{mode:'preview'})));assert.match(html,/Draft — for review/);
  }
  for(const path of ['astro/index.html','astro/notes/index.html']){
    const html=files[path];const document=new JSDOM(html).window.document;const requests=document.querySelector('[data-astro-requests]');assert.equal(requests.textContent,'0');assert.equal(requests.getAttribute('aria-label'),'Optional requests in this visit');assert.match(html,/data-notabenda-controls/);assert.match(html,/data-notabenda-preferences[^>]*hidden/);
    assert.match(html,/<script type="module" src="\/_astro\//);
    for(const [,attributes,body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)){
      assert.match(attributes,/src="\/_astro\/[a-zA-Z0-9_.-]+\.js"/u);assert.equal(body.trim(),'');
    }
  }
  for(const path of ['form-permissions/astro/index.html','form-permissions/astro/review/index.html']){
    const html=files[path];assert.ok(html);assert.match(html,/nb-demo-permissions/);assert.match(html,/<form[^>]*data-astro-reload/);assert.match(html,/data-notabenda-form-permission="product-news"/);assert.match(html,/data-notabenda-permission-fallback/);assert.doesNotMatch(html,/type="checkbox"|notabenda-demo-generation|notabenda-permission-stream/);assert.match(html,/form-permissions\/privacy/);assert.match(html,/<script type="module" src="\/_astro\//);assert.match(html,/assets\/form-permissions\.css/);
  }
  assert.deepEqual(JSON.parse(files['astro/site.json']),publicConfig);
  assert.equal(Object.hasOwn(JSON.parse(files['astro/site.json']),'private'),false);
  const manifest=JSON.parse(await readFile(new URL('../../../packages/notabenda/package.json',import.meta.url),'utf8'));assert.equal(manifest.peerDependenciesMeta.astro.optional,true);assert.equal(Object.keys(manifest.dependencies??{}).length,0);
  assert.equal(Object.keys(files).some(path=>/\.map$|\.astro\/|\.generated\/|node_modules|\.env/u.test(path)),false);
  const unmanaged=await mkdtemp(new URL('../../../examples/astro/.generated/public/.test-unmanaged-',import.meta.url).pathname);
  try{await writeFile(unmanaged+'/private-note.js','Not a public build input.');await assert.rejects(astroFiles(),/Unexpected Astro public input/);}
  finally{await rm(unmanaged,{recursive:true,force:true});}
});
