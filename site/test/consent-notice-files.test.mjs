// @requirements REQ-PRODUCT-CONSENT-NOTICE-FILES REQ-PRODUCT-CF-HOST
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {canonicalJson,sha256,createConsentNoticeFiles} from '@notabenda/core/content';
import {serveHost} from '../host.mjs';
const root=new URL('../dist/public/',import.meta.url);

test('the recorded-choice example publishes its exact pinned notice without opening a workspace or setting session cookies',async()=>{
 const notice=JSON.parse(await readFile(new URL('recorded-choices/notice.json',root),'utf8')),path=`artifacts/${notice.artifactId}/consent/${notice.noticeId}.json`,body=await readFile(new URL(path,root),'utf8'),artifact=JSON.parse(await readFile(new URL(`artifacts/${notice.artifactId}.json`,root),'utf8'));
 assert.equal(body,canonicalJson(notice)+'\n');assert.equal(createConsentNoticeFiles(artifact,{scopeId:notice.scopeId},{mode:'preview'}).files[path],body);const {noticeId:_,...descriptor}=notice;assert.equal(sha256(canonicalJson(descriptor)),notice.noticeId);for(const d of Object.values(notice.documents))assert.equal(sha256(await readFile(new URL(d.url.slice(1),root),'utf8')),d.sha256);
 const response=await serveHost(new Request('https://example.test/'+path,{headers:{Cookie:'__Host-notabenda_demo=invalid'}}),{WORKSPACE:{get(){throw Error('Public notices do not open an evidence workspace.');}},ASSETS:{fetch:async request=>{assert.equal(new URL(request.url).pathname,'/'+path);return new Response(body,{headers:{'Content-Type':'application/json','Set-Cookie':'should-not-survive=1'}});}}});assert.equal(response.status,200);assert.equal(await response.text(),body);assert.equal(response.headers.get('Set-Cookie'),null);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src/);
});

test('agent metadata and readable guide expose the actual native notice and retention paths',async()=>{
 const reference=JSON.parse(await readFile(new URL('integration-reference.json',root),'utf8')),delivery=reference.configContract.consentRuntimeBuild;assert.equal(delivery.noticeScopeOption,'--consent-scope SLUG');assert.equal(delivery.noticeAlias,'consent-notice.json');assert.equal(delivery.pinnedNotice,'artifacts/{artifactId}/consent/{noticeId}.json');assert.equal(delivery.retainedNoticeNeedsLegalRelease,true);
 const dom=new JSDOM(await readFile(new URL('guide/consent-evidence/index.html',root),'utf8'));try{const d=dom.window.document;assert.ok(d.querySelector('#keep-earlier-notices-available'));assert.match(d.body.textContent,/--consent-scope cookie-choices/);assert.match(d.body.textContent,/--retain-consent-notice saved-notice.json/);assert.ok(d.querySelector('pre code span'));}finally{dom.window.close();}
});
