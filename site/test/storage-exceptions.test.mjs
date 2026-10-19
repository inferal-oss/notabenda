// @requirements REQ-UK-EXCEPTIONS REQ-PRODUCT-STORAGE-EXCEPTIONS REQ-PRODUCT-CF-HOST
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {validateSiteConfig} from 'notabenda';
import {serveHost} from '../host.mjs';

test('the static exception example publishes draft profiles, local bundled runtime and its specialist guide without allocating admin storage',async()=>{
 const root=new URL('../dist/public/',import.meta.url),html=await readFile(new URL('storage-exceptions/index.html',root),'utf8'),d=new JSDOM(html).window.document,config=JSON.parse(await readFile(new URL('storage-exceptions/site.json',root),'utf8'));assert.equal(validateSiteConfig(config,{mode:'preview'}).valid,true);assert.equal(validateSiteConfig(config,{mode:'production'}).valid,false);assert.ok(d.querySelector('.demo-corner'));assert.ok(d.querySelector('a[href="/guide/storage-exceptions"]'));assert.equal(d.querySelectorAll('dialog,[aria-modal=true]').length,0);assert.equal(d.querySelectorAll('script[type=module]').length,1);assert.ok(d.getElementById('exception-settings'));assert.ok(d.querySelector('#all-off'));for(const id of ['allow-recommendations','reject-recommendations','all-off'])assert.equal(d.getElementById(id).disabled,true);
 for(const node of d.querySelectorAll('script[src],link[rel=stylesheet]')){const path=node.getAttribute('src')??node.getAttribute('href');assert.ok(path.startsWith('/assets/'));const content=await readFile(new URL(path.slice(1),root),'utf8');assert.ok(content.length);}
 const assets={fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},env={ASSETS:assets,WORKSPACE:{get(){throw Error('No operational access');}},DEMO_WORKSPACES:{get(){throw Error('No demo allocation');}}};const response=await serveHost(new Request('https://example.test/storage-exceptions/'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.match(response.headers.get('Content-Security-Policy'),/connect-src 'self'/);
 const category=new JSDOM(await readFile(new URL('examples/privacy-choices/index.html',root),'utf8')).window.document;assert.ok(category.querySelector('a[href="/storage-exceptions"]'));await readFile(new URL('guide/storage-exceptions/index.html',root),'utf8');const privacy=await readFile(new URL('website-privacy/index.html',root),'utf8');assert.match(privacy,/notabenda-storage-exceptions-v1/);assert.match(privacy,/direct on\/off controls/);
});
