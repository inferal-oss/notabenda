// @requirements REQ-PRODUCT-MARKETING-AUTHORING REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-ZA-MARKETING
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
import {mountMarketingWorkbench} from '@notabenda/core/authoring/marketing/ui';
import {publicResponse} from '../host.mjs';
const root=new URL('../dist/public/',import.meta.url);
test('published marketing editor mounts complete inert request controls and passes the semantic scan',async()=>{
 const html=await readFile(new URL('marketing-request-workbench/index.html',root),'utf8'),audit=await createAccessibilityAudit(html,{label:'marketing request editor'}),d=audit.dom.window.document,context=JSON.parse(d.querySelector('#marketing-workbench-context').textContent),ui=mountMarketingWorkbench(d.querySelector('#marketing-workbench'),{context});
 try{[...d.querySelectorAll('button')].find(b=>b.textContent==='Preview request').click();const paper=d.querySelector('.nb-pw-paper');assert.ok(paper.textContent.includes(context.initial.permission.marketingRequest.goodsServices));assert.ok(paper.textContent.includes(context.facts.facts.controller.email));assert.equal(paper.querySelector('input').checked,false);assert.equal(paper.querySelector('input').disabled,true);assert.equal(paper.querySelector('a[href],[role=status]'),null);assert.deepEqual((await audit.scan()).violations,[]);assert.equal(d.querySelector('[data-marketing-release]').checked,false);assert.equal(context.facts.offerId,undefined);assert.ok(d.querySelector('.demo-corner'));}
 finally{ui.destroy();audit.close();}
});
test('effective Worker policy permits only the editor module and its browser bundle is self-contained',async()=>{
 for(const path of ['/marketing-request-workbench','/marketing-request-workbench/','/marketing-request-workbench/index.html']){const response=publicResponse(new Response('editor'),path),csp=response.headers.get('Content-Security-Policy');assert.match(csp,/script-src 'self'/);assert.doesNotMatch(csp,/unsafe-inline|unsafe-eval/);assert.equal(response.headers.get('Set-Cookie'),null);}
 assert.doesNotMatch(publicResponse(new Response('guide'),'/guide/marketing-workbench/').headers.get('Content-Security-Policy'),/script-src/);
 const script=await readFile(new URL('marketing-request-workbench/workbench.js',root),'utf8'),graph=await build({stdin:{contents:script},bundle:false,write:false,platform:'browser',format:'esm',metafile:true});assert.deepEqual(Object.values(graph.metafile.outputs)[0].imports,[]);assert.doesNotMatch(script,/ADMIN_KEY|@notabenda\/cloudflare/);
 const css=await readFile(new URL('marketing-request-workbench/workbench.css',root),'utf8');assert.match(css,/min-height:44px/);assert.match(css,/safe-area-inset-bottom/);assert.match(css,/forced-colors/);
 for(const [path,pattern] of [['start/index.html',/Marketing request editor/],['guide/south-africa-marketing/index.html',/marketing-workbench/],['guide/marketing-workbench/index.md',/notabenda marketing-request/],['examples/privacy-choices/index.html',/marketing-request-workbench/]])assert.match(await readFile(new URL(path,root),'utf8'),pattern);
});
