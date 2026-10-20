// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-CARTRIDGES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../dist/public/',import.meta.url);
test('the document preview loads as a separate local module and is absent from ordinary consent delivery',async()=>{
 const entry=await readFile(new URL('assets/cartridges.mjs',root),'utf8'),preview=await readFile(new URL('assets/runtime/setup-preview.js',root),'utf8'),setup=await readFile(new URL('assets/runtime/setup-ui.js',root),'utf8');
 assert.match(entry,/import\(["']\/assets\/runtime\/setup-preview\.js["']\)/);assert.doesNotMatch(entry,/nb-document-meta/);assert.match(preview,/nb-document-meta/);assert.match(preview,/mountLegalPreview/);assert.match(setup,/import\(['"]\.\/setup-preview\.js['"]\)/);
 const visitor=await readFile(new URL('assets/consent.mjs',root),'utf8');assert.doesNotMatch(visitor,/nb-legal-preview|mountLegalPreview|setup-preview/);
});
