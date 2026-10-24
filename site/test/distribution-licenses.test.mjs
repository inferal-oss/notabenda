// @requirements REQ-PRODUCT-RELEASE-CANDIDATE
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const output=new URL('../dist/public/',import.meta.url),root=new URL('../../',import.meta.url);
test('deployed examples retain full upstream license texts with a versioned index',async()=>{
 const index=await readFile(new URL('assets/THIRD-PARTY-NOTICES.txt',output),'utf8');
 for(const name of ['yaml','ajv','react','react-dom','scheduler','astro']){
  const base=new URL('node_modules/'+name+'/',root),metadata=JSON.parse(await readFile(new URL('package.json',base),'utf8'));
  const target='assets/licenses/'+name+'-LICENSE.txt';
  assert.deepEqual(await readFile(new URL(target,output)),await readFile(new URL('LICENSE',base)),name);
  assert.ok(index.includes(name+' '+metadata.version),name);assert.ok(index.includes('/'+target),target);
 }
 for(const name of ['LICENSE','LICENSE-APACHE','LICENSE-MIT'])assert.deepEqual(await readFile(new URL('assets/licenses/notabenda-'+name+'.txt',output)),await readFile(new URL(name,root)));
 for(const [target,source] of [['assets/catalog/NOTICE.txt','catalog/NOTICE'],['assets/catalog/open-cookie-database-LICENSE.txt','catalog/sources/open-cookie-database/LICENSE']]){
  assert.ok(index.includes('/'+target));assert.deepEqual(await readFile(new URL(target,output)),await readFile(new URL(source,root)));
 }
 const home=await readFile(new URL('index.html',output),'utf8');assert.match(home,/<a href="\/assets\/THIRD-PARTY-NOTICES\.txt">Third-party notices<\/a>/u);
});
