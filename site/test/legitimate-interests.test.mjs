// @requirements REQ-EU-INTERESTS-DISCLOSURE REQ-PRODUCT-COLLECTION-NOTICE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {verifyCollectionNotice} from '@notabenda/core/content';
const root=new URL('../dist/public/',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');

test('light and dark collection examples show the same reviewed-as-draft interests and exact pinned release',async()=>{
 for(const prefix of ['','dark/']){
  const notice=JSON.parse(await read(prefix+'collection/notice.json'));
  const artifact=JSON.parse(await read('artifacts/'+notice.artifactId+'.json'));
  assert.deepEqual(verifyCollectionNotice(notice,artifact,{mode:'preview'}),notice);
  const statement=notice.purposes[0].legitimateInterests;assert.equal(statement,'Juniper Notes has an interest in answering voluntary enquiries about its work.');
  const dom=new JSDOM(await read(prefix+'collection/index.html'));
  try{const d=dom.window.document,details=d.querySelector('.nb-collection-details');assert.equal(details.open,false);assert.ok(details.textContent.includes(statement));assert.ok(d.querySelector('.nb-draft'));assert.equal(d.querySelector('form').getAttribute('aria-describedby'),d.querySelector('.nb-collection-notice > p[id]').id);}finally{dom.window.close();}
  assert.ok((await read('artifacts/'+notice.artifactId+'/privacy.html')).includes(statement));
 }
});

test('agent schema and guides expose the explicit field and applicability boundary',async()=>{
 const guide=await read('guide/collection/index.html'),markdown=await read('guide/collection/index.md');
 for(const content of [guide,markdown]){assert.match(content,/legitimateInterests/);assert.match(content,/REQ-EU-INTERESTS-DISCLOSURE/);assert.match(content,/does not parse free-form/);}
 const reference=JSON.parse(await read('integration-reference.json'));assert.ok(reference.targets.find(t=>t.id==='legal-pages').configPaths.includes('purposes.legitimateInterests'));
 const schema=JSON.parse(await read('site-config.schema.json'));assert.ok(Object.values(schema.$defs).some(d=>d.properties?.legitimateInterests?.type==='string'));
});
