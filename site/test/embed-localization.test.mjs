// @requirements REQ-PRODUCT-EMBED-LOCALIZATION REQ-PRODUCT-EMBEDS REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {publicResponse,serveHost} from '../host.mjs';
import {siteSections} from '../navigation.mjs';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const root=new URL('../dist/public/',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
test('Portuguese media has complete inert fallback copy, independent preference names and a linked example',async()=>{
 const html=await read('localization/embeds/index.html'),config=JSON.parse(await read('localization/embeds/site.json')),dom=new JSDOM(html),d=dom.window.document,copy=config.localization.embeds;
 try{
  assert.equal(d.documentElement.lang,'pt-BR');assert.equal(d.querySelectorAll('.nb-embed').length,2);assert.ok(d.querySelector('.demo-corner'));assert.ok(d.querySelector('link[href="/assets/example-theme.css"]'));
  for(const fallback of d.querySelectorAll('.nb-embed')){assert.equal(fallback.lang,'pt-BR');assert.equal(fallback.dir,'ltr');assert.equal(fallback.querySelector('[role=status]').textContent,copy.waiting);assert.equal(fallback.querySelector('button').textContent,copy.preferencesLabel);assert.equal(fallback.querySelector('button').hidden,true);assert.equal(fallback.querySelectorAll('[src],iframe,img,link').length,0);}
  assert.ok(config.storage.every(item=>item.name.includes('juniper-embeds-pt')));assert.equal(d.querySelectorAll('script:not([src])').length,0);assert.ok(d.querySelector('script[src="/assets/localized-embeds.mjs"]'));assert.ok(d.querySelector('a[href="/guide/embeds"]'));assert.ok(siteSections.flatMap(s=>s.topics).find(t=>t.id==='embeds').variants.some(v=>v.href==='/localization/embeds/'));
  const source=JSON.parse(await read('source/examples/localization/embed-messages.json.txt'));assert.deepEqual(source,copy);
 }finally{dom.window.close();}
 const env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},DEMO_WORKSPACES:{get(){assert.fail('Local choices do not allocate a demo database');}},WORKSPACE:{get(){assert.fail('Media must not access operational records');}}};const response=await serveHost(new Request('https://host.example.test/localization/embeds/'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);
 const audit=await createAccessibilityAudit(html,{label:'Portuguese gated media'});try{assert.deepEqual((await audit.scan()).violations,[]);}finally{audit.close();}
});
test('localized entry and script-free child have narrowly scoped frame policies',()=>{
 for(const path of ['/localization/embeds','/localization/embeds/','/localization/embeds/index.html']){
  const csp=publicResponse(new Response('media'),path).headers.get('Content-Security-Policy');assert.match(csp,/script-src 'self'; connect-src 'self'/);assert.match(csp,/frame-src 'self'/);assert.match(csp,/frame-ancestors 'none'/);assert.doesNotMatch(csp,/unsafe-inline|unsafe-eval/);
 }
 for(const path of ['/localization/embeds/frame/','/localization/embeds/frame/index.html']){const csp=publicResponse(new Response('child'),path).headers.get('Content-Security-Policy');assert.match(csp,/frame-ancestors 'self'/);assert.doesNotMatch(csp,/script-src|connect-src/);}
 assert.doesNotMatch(publicResponse(new Response('privacy'),'/localization/embeds/privacy').headers.get('Content-Security-Policy'),/script-src|frame-src 'self'/);
});
