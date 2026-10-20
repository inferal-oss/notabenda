// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-COLLECTION-NOTICE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {renderCollectionNotice} from '@notabenda/core';
import {verifyCollectionNotice} from '@notabenda/core/content';
import {serveHost} from '../host.mjs';
const root=new URL('../dist/public/',import.meta.url);
test('the localized collection example is static, exact, styled and needs no evidence workspace',async()=>{
 const html=await readFile(new URL('localization/collection/index.html',root),'utf8'),notice=JSON.parse(await readFile(new URL('localization/collection/notice.json',root),'utf8')),artifact=JSON.parse(await readFile(new URL('artifacts/'+notice.artifactId+'.json',root),'utf8'));
 assert.deepEqual(verifyCollectionNotice(notice,artifact,{mode:'preview'}),notice);assert.ok(html.includes(renderCollectionNotice(notice,{idPrefix:'message-privacy-pt',allowPreview:true})));
 const dom=new JSDOM(html),d=dom.window.document;
 try{
  assert.equal(d.documentElement.lang,'pt-BR');assert.equal(d.querySelector('.nb-collection-notice').dir,'ltr');assert.equal(d.querySelector('script,form,input[type=checkbox]'),null);
  assert.equal(d.querySelector('details').open,false);assert.ok(d.querySelector('a[href="/localization/permission/"]'));assert.ok(d.querySelector('.demo-corner'));
  assert.ok(d.querySelector('link[href="/assets/example-theme.css"]'));assert.ok(d.querySelector('input[readonly]'));assert.ok(d.querySelector('button[disabled]'));
  const group=d.querySelector('[aria-describedby="message-privacy-pt-summary"]');assert.ok(group);assert.equal(d.getElementById(group.getAttribute('aria-describedby')).textContent,notice.wording.intro);
 }finally{dom.window.close();}
 const forbidden={idFromName(){throw Error('Static collection information must not allocate storage.');}},env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},WORKSPACE:forbidden,DEMO_WORKSPACES:forbidden};
 const response=await serveHost(new Request('https://site.example.test/localization/collection/'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.ok((await response.text()).includes(notice.noticeId));
});
