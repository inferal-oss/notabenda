// @requirements REQ-PRODUCT-PACK-CAPABILITIES REQ-ZA-MARKETING
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {packLibrary} from '@notabenda/core/packs';
const root=new URL('../dist/public/',import.meta.url);
test('public pack library exposes capability guides and the focused regional request without hiding any card',async()=>{
 const d=new JSDOM(await readFile(new URL('start/index.html',root),'utf8')).window.document;
 for(const pack of packLibrary()){
  const card=d.querySelector(`[data-cartridge="${pack.id}"]`);assert.equal(card.closest('details,[hidden]'),null);assert.equal(card.querySelector('[data-pack-capabilities]').open,false);
  for(const item of pack.capabilities){assert.ok(card.textContent.includes(item.title));assert.ok(card.textContent.includes(item.boundary));await access(new URL('guide/'+item.guide+'/index.html',root));}
 }
 const za=d.querySelector('[data-cartridge="za-marketing-requests"]');assert.ok(za.querySelector('a[href="/form-permissions"]'));assert.doesNotMatch(za.textContent,/timing example/);
 for(const path of ['index.html','guide/cartridges/index.html','guide/architecture/index.html']){const html=await readFile(new URL(path,root),'utf8');assert.match(html,/pack-za-marketing-requests/);}
});
test('shared live example teaches refusal and the specific request without decorating pinned documents',async()=>{
 const d=new JSDOM(await readFile(new URL('form-permissions/index.html',root),'utf8')).window.document;
 for(const id of ['form-permissions','za-marketing-requests']){const guide=d.querySelector(`[data-pack-guide="${id}"]`);assert.ok(guide);assert.equal(guide.open,false);assert.equal(guide.querySelectorAll('ol li').length,3);}
 assert.ok(d.querySelector('[data-pack-guide="za-marketing-requests"]').textContent.includes('sends no messages'));
 const cookie=new JSDOM(await readFile(new URL('choices/index.html',root),'utf8')).window.document;assert.ok(cookie.querySelector('[data-capability-kind="review"] a[href="/guide/singapore-cookies/"]'));
 const markdown=await readFile(new URL('guide/cartridges/index.md',root),'utf8');assert.match(markdown,/Included in this pack/);assert.match(markdown,/za-marketing-requests/);
});
