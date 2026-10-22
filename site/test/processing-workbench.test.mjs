// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
import {mountProcessingWorkbench} from '@notabenda/core/authoring/processing/ui';
test('published editor mounts with semantic controls and inert preview without a recording or network controller',async()=>{
 const html=await readFile(new URL('../dist/public/processing-notice-workbench/index.html',import.meta.url),'utf8'),audit=await createAccessibilityAudit(html,{label:'processing notice workbench'}),d=audit.dom.window.document;
 const context=JSON.parse(d.querySelector('#processing-workbench-context').textContent),ui=mountProcessingWorkbench(d.querySelector('#processing-workbench'),{context});
 try{assert.ok(d.querySelector('input[type=file]'));assert.equal(d.querySelector('[data-processing-release]').checked,false);[...d.querySelectorAll('button')].find(b=>b.textContent==='Preview notice').click();assert.equal(d.querySelector('.nb-pw-paper button').disabled,true);assert.equal(d.querySelector('.nb-pw-paper a[href],.nb-pw-paper [role=status]'),null);assert.deepEqual((await audit.scan()).violations,[]);assert.equal(context.facts.noticeId,undefined);assert.equal(context.pages,undefined);assert.ok(d.querySelector('a[href="/guide/processing-workbench/"]'));}
 finally{ui.destroy();audit.close();}
});
test('directory tool is standalone, has a bounded CSP and responsive defaults, and its guide/example are discoverable',async()=>{
 const root=new URL('../dist/public/',import.meta.url),html=await readFile(new URL('processing-notice-workbench/index.html',root),'utf8'),d=new JSDOM(html).window.document;
 assert.match(d.querySelector('[http-equiv="Content-Security-Policy"]').content,/form-action 'none'/);assert.ok(d.querySelector('script[src="./workbench.js"]'));assert.ok(d.querySelector('link[href="./workbench.css"]'));
 const script=await readFile(new URL('processing-notice-workbench/workbench.js',root),'utf8'),graph=await build({stdin:{contents:script},bundle:false,write:false,platform:'browser',format:'esm',metafile:true});assert.deepEqual(Object.values(graph.metafile.outputs)[0].imports,[]);assert.doesNotMatch(script,/ADMIN_KEY|@notabenda\/cloudflare/);
 const css=await readFile(new URL('processing-notice-workbench/workbench.css',root),'utf8');assert.match(css,/min-height:44px/);assert.match(css,/max-width:760px/);assert.match(css,/safe-area-inset-bottom/);assert.match(css,/forced-colors/);
 const examples=await readFile(new URL('examples/privacy-choices/index.html',root),'utf8'),guide=await readFile(new URL('guide/processing-workbench/index.html',root),'utf8');assert.match(examples,/processing-notice-workbench/);assert.match(guide,/processing-notice/);assert.match(guide,/Workflow scope/);
});
