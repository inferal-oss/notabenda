// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
import {browserCatalogSeed} from '@notabenda/core/catalog/browser/seed';import {normalizeBrowserRuleSet} from '@notabenda/core/catalog/browser';
const root=new URL('../dist/public/',import.meta.url);
test('the shipped optional browser seed contains the exact installed coverage and remains within snapshot bounds',async()=>{
 const {browserCatalogSeed:shipped}=await import(new URL('assets/browser-rules.mjs',root));assert.deepEqual(shipped,browserCatalogSeed);const normalized=normalizeBrowserRuleSet(shipped);assert.equal(normalized.rules.length,19);assert.equal(normalized.catalog.products.length,16);assert.ok(Buffer.byteLength(JSON.stringify(normalized))<512*1024);
 const client=await readFile(new URL('assets/discovery-demo.mjs',root),'utf8');assert.match(client,/browser-rules\.mjs/);assert.match(client,/browserRules:browserCatalogSeed/);
});
test('the guide enumerates the actual sixteen browser products and explains limits separately from project evidence',async()=>{
 const html=await readFile(new URL('guide/discovery/index.html',root),'utf8'),d=new JSDOM(html).window.document,h=d.getElementById('which-browser-services-can-it-recognize');assert.ok(h);let table=h.nextElementSibling;while(table&&table.tagName!=='TABLE')table=table.nextElementSibling;assert.ok(table);assert.equal(table.querySelectorAll('tbody tr').length,16);
 for(const name of ['Segment','Sentry','Datadog RUM','Zendesk Web Widget','Cloudflare Web Analytics','Plausible','Fathom','Umami Cloud','Microsoft Clarity','Crisp'])assert.ok(table.textContent.includes(name));assert.match(d.body.textContent,/does not validate region or version/);assert.match(d.body.textContent,/A global queue alone remains a partial hint/);
 for(const pkg of ['@microsoft/clarity','@plausible-analytics/tracker','crisp-sdk-web'])assert.ok(d.body.textContent.includes(pkg));const markdown=await readFile(new URL('guide/discovery/index.md',root),'utf8');assert.match(markdown,/sixteen products/);assert.match(markdown,/SDK ran/);
});
