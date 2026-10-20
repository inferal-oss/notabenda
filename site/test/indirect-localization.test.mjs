// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION REQ-PRODUCT-INDIRECT-NOTICE REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {renderIndirectCollectionNotice,formatIndirectCollectionNotice} from '@notabenda/core/collection/indirect';
import {serveHost} from '../host.mjs';
import {siteSections} from '../navigation.mjs';
const root=new URL('../dist/public/',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
test('translated indirect example exposes complete phase-specific static notices, exact text and working policy links without a session',async()=>{
 const html=await read('localization/indirect/index.html'),notice=JSON.parse(await read('localization/indirect/notice.json')),advance=JSON.parse(await read('localization/indirect/advance.json')),dom=new JSDOM(html),d=dom.window.document;
 assert.equal(d.documentElement.lang,'pt-BR');assert.ok(d.querySelector('.demo-corner'));assert.ok(d.querySelector('link[href="/assets/example-theme.css"]'));assert.equal(d.querySelectorAll('[data-indirect-notice-id]').length,2);assert.equal(d.querySelector('details').open,false);assert.equal(d.querySelector('script,iframe,form,button,input'),null);assert.equal(d.querySelector('[data-collection-phase="collected"]').dir,'ltr');assert.equal(d.querySelector('[data-collection-phase="collected"] details'),null);assert.ok(d.querySelector('a[href="/examples/privacy-information/"]'));assert.ok(d.querySelector('a[href="/guide/indirect-collection"]'));assert.doesNotMatch(d.body.textContent,/We have collected|We plan to collect|Intended recipients|Collecting and holding agency/);
 for(const n of [notice,advance]){assert.ok(html.includes(renderIndirectCollectionNotice(n,{idPrefix:n.phase==='advance'?'advance-pt':'referral-pt',headingLevel:n.phase==='advance'?3:2,allowPreview:true})));assert.equal(await read('localization/indirect/'+(n.phase==='advance'?'advance':'notice')+'.txt'),formatIndirectCollectionNotice(n,{allowPreview:true}));assert.equal((await read(n.document.url.slice(1))).includes('lang="pt-BR"'),true);assert.equal(n.profile,'nz-ipp3a');}
 assert.ok(JSON.stringify(siteSections.flatMap(s=>s.topics).find(t=>t.id==='indirect-collection')).includes('/localization/indirect/'));dom.window.close();
 const env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},DEMO_WORKSPACES:{get(){throw Error('Static notice must not provision a workspace');}},WORKSPACE:{get(){throw Error('Static notice must not access records');}}};const response=await serveHost(new Request('https://example.test/localization/indirect/'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.match(response.headers.get('Content-Security-Policy'),/default-src 'none'/);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src|connect-src/);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/unsafe-inline|unsafe-eval/);
 const guide=await read('guide/indirect-collection/index.html');assert.ok(guide.includes('/source/examples/localization/indirect-messages.json.txt'));assert.deepEqual(JSON.parse(await read('source/examples/localization/indirect-messages.json.txt')),notice.localization.indirectCollection);
});
