// @requirements REQ-PRODUCT-PACK-EDUCATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {packLibrary} from '@notabenda/core/packs';
const root=new URL('../dist/public/',import.meta.url);
test('every public pack example includes its own use case and collapsed walkthrough',async()=>{
 for(const pack of packLibrary()){
  if(pack.preview.startsWith('/demo/admin'))continue;
  const path=pack.preview.replace(/^\//u,'').replace(/\/$/u,'')+'/index.html',dom=new JSDOM(await readFile(new URL(path,root),'utf8')),d=dom.window.document,guide=d.querySelector('[data-pack-guide="'+pack.id+'"]');
  assert.ok(guide,path);assert.ok(guide.textContent.includes(pack.example.useCase),pack.id);assert.deepEqual([...guide.querySelectorAll('ol li')].map(n=>n.textContent),pack.example.steps);assert.ok(guide.textContent.includes(pack.example.observe));assert.equal((guide.matches('details')?guide:guide.querySelector('details')).open,false);assert.ok(d.querySelector('link[href="/assets/pack-learning.css"]'));assert.equal(guide.querySelectorAll('script,button,input,form').length,0);dom.window.close();
 }
});
test('order variants explain their own charges and framework teaching stays outside hydration roots',async()=>{
 const pack=packLibrary().find(p=>p.id==='paid-order-review');
 for(const variant of ['deferred','conditional']){const d=new JSDOM(await readFile(new URL('orders/'+variant+'/index.html',root),'utf8')).window.document,guide=d.querySelector('[data-pack-guide="paid-order-review"]');assert.ok(guide.textContent.includes(pack.example.variants[variant].useCase));assert.deepEqual([...guide.querySelectorAll('ol li')].map(n=>n.textContent),pack.example.variants[variant].steps);assert.ok(!guide.textContent.includes('lamp and membership'));}
 for(const [path,id] of [['agreement/react/index.html','react-agreement-root'],['dark/agreement/react/index.html','react-agreement-root'],['form-permissions/react/index.html','react-permission-root']]){const d=new JSDOM(await readFile(new URL(path,root),'utf8')).window.document;assert.equal(d.getElementById(id).querySelector('[data-pack-guide]'),null);assert.ok(d.querySelector('[data-pack-guide]'));}
});
test('the library, home and textual guide retain the same installed explanations',async()=>{
 const packs=packLibrary();
 for(const path of ['start/index.html','index.html','guide/cartridges/index.html']){const dom=new JSDOM(await readFile(new URL(path,root),'utf8'));for(const pack of packs)assert.ok(dom.window.document.body.textContent.includes(pack.outcome),path+' '+pack.id);dom.window.close();}
 const markdown=await readFile(new URL('guide/cartridges/index.md',root),'utf8');for(const pack of packs)assert.ok(markdown.includes(pack.outcome));assert.doesNotMatch(markdown,/notabenda:packs/);
});
