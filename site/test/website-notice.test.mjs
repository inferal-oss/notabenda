// @requirements REQ-PRODUCT-CF-HOST
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {websiteNoticeFacts,websiteNoticeBody} from '../website-notice.mjs';
import {serveHost} from '../host.mjs';
import {adminPresentation} from '../admin-presentation.mjs';

test('public website builds require explicit operator/contact facts and never invent a personal contact',()=>{
 assert.equal(websiteNoticeFacts().ready,false);
 assert.throws(()=>websiteNoticeFacts({}, {production:true}),/requires NOTABENDA_WEBSITE_OPERATOR/);
 for(const contact of ['javascript:alert(1)','http://example.test/contact','https://name:secret@example.test','broken','a@b.test\r\nBcc:elsewhere'])assert.throws(()=>websiteNoticeFacts({NOTABENDA_WEBSITE_OPERATOR:'Example operator',NOTABENDA_WEBSITE_PRIVACY_CONTACT:contact}),/privacy contact/);
 assert.throws(()=>websiteNoticeFacts({NOTABENDA_WEBSITE_OPERATOR:'Example operator'}),/both/);
 assert.throws(()=>websiteNoticeFacts({NOTABENDA_WEBSITE_OPERATOR:12}),/must be text/);
 assert.equal(websiteNoticeFacts({NOTABENDA_WEBSITE_OPERATOR:'Example operator',NOTABENDA_WEBSITE_PRIVACY_CONTACT:'privacy+requests@example.test'}).href,'mailto:privacy%2Brequests@example.test');
 const facts=websiteNoticeFacts({NOTABENDA_WEBSITE_OPERATOR:'Example <Operator>',NOTABENDA_WEBSITE_PRIVACY_CONTACT:'privacy@example.test'}, {production:true});
 const dom=new JSDOM(websiteNoticeBody(facts)),document=dom.window.document;
 assert.match(document.querySelector('#website-operator').parentElement.textContent,/Example <Operator>/);assert.equal(document.querySelector('a').getAttribute('href'),'mailto:privacy@example.test');assert.equal(document.querySelectorAll('script,operator,[onclick],.website-notice-draft').length,0);dom.window.close();
 assert.equal(websiteNoticeFacts({NOTABENDA_WEBSITE_OPERATOR:'Example operator',NOTABENDA_WEBSITE_PRIVACY_CONTACT:'https://example.test/contact'}).href,'https://example.test/contact');
});

test('website privacy is distinct from sample policies and stays script-free without allocating a demo session',async()=>{
 const html=await readFile(new URL('../dist/public/website-privacy/index.html',import.meta.url),'utf8'),home=await readFile(new URL('../dist/public/index.html',import.meta.url),'utf8'),sample=await readFile(new URL('../dist/public/privacy/index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html),document=dom.window.document;
 assert.equal(document.querySelectorAll('script,form').length,0);assert.match(document.querySelector('h1').textContent,/Privacy, in plain view/);assert.ok(document.querySelector('.website-notice-draft')||document.querySelector('#website-operator'));
 for(const phrase of ['__Host-notabenda_demo','Cloudflare','one day without use','not immediately delete','not uploaded','not advertising','sample details']){
  assert.ok(document.body.textContent.includes(phrase),phrase);
 }
 assert.match(home,/href="\/website-privacy">Website privacy/);assert.match(sample,/Juniper/);assert.doesNotMatch(sample,/Privacy, in plain view/);dom.window.close();
 const env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},DEMO_WORKSPACES:{get(){throw Error('Privacy does not allocate a database');}},WORKSPACE:{get(){throw Error('Privacy does not access operational data');}}};
 const response=await serveHost(new Request('https://example.test/website-privacy'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src|'unsafe-inline'/);
 assert.equal((await serveHost(new Request('https://example.test/website-privacy',{method:'POST'}),env)).status,405);
 assert.ok(adminPresentation('/demo/admin').navigation.some(link=>link.href==='/website-privacy'));
});

test('recorded demo pages disclose real entry storage before their form without changing archive bytes',async()=>{
 const page='<!doctype html><head></head><body><header>Example</header><main><form><input name="name"></form></main></body>',env={ADMIN_KEY:'a'.repeat(64),ASSETS:{fetch:async()=>new Response(page,{headers:{'Content-Type':'text/html'}})},DEMO_PROVISION_LIMITER:{limit:async()=>({success:true})},DEMO_WORKSPACES:{idFromName:name=>name,get:()=>({fetch:async()=>new Response('ok')})}};
 const response=await serveHost(new Request('https://example.test/contract-actions/withdrawal/'),env);assert.equal(response.status,200);
 const html=await response.text(),dom=new JSDOM(html),document=dom.window.document;
 assert.equal(document.querySelectorAll('.demo-data-notice').length,1);assert.equal(document.querySelector('.demo-data-notice').lang,'en');assert.match(document.querySelector('.demo-data-notice').textContent,/stores your entries/);assert.equal(document.querySelector('.demo-data-notice a').getAttribute('href'),'/website-privacy');assert.ok(html.indexOf('demo-data-notice')<html.indexOf('<form>'));assert.ok(document.querySelector('link[href="/assets/website-notice.css"]'));assert.equal(document.querySelectorAll('script,[style]').length,0);dom.window.close();
 // The archived/public document route remains an ordinary static asset, never rewritten as a demo entry.
 const artifact=await serveHost(new Request('https://example.test/artifacts/0123/terms.html'),env);assert.equal(await artifact.text(),page);assert.equal(artifact.headers.get('Set-Cookie'),null);
});

test('the actual public build stops before changing existing assets when operator facts are absent',async()=>{
 const manifest=new URL('../dist/asset-manifest.json',import.meta.url),before=await readFile(manifest,'utf8');
 const result=spawnSync(process.execPath,[new URL('../build.mjs',import.meta.url).pathname,'--production'],{env:{PATH:process.env.PATH},encoding:'utf8',timeout:10000});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Public website build requires NOTABENDA_WEBSITE_OPERATOR/);assert.equal(await readFile(manifest,'utf8'),before);
});
