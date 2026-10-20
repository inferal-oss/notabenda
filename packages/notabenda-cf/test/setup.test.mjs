// @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-CF-ADMIN
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSetupWorker} from 'notabenda-cf';
const options={basePath:'/workspace/setup',scriptUrl:'/assets/setup.mjs',stylesheetUrl:'/assets/notabenda.css'};
test('setup worker requires host access on every request and never accepts questionnaire answers as server writes',async()=>{
  assert.throws(()=>createSetupWorker(options));for(const result of [false,null,{},'yes']){let called=0;const worker=createSetupWorker({...options,authorize(){called++;return result;}});assert.equal((await worker.fetch(new Request('https://example.test/workspace/setup'),{})).status,403);assert.equal(called,1);}
  assert.equal((await createSetupWorker({...options,authorize(){throw new Error('private exception');}}).fetch(new Request('https://example.test/workspace/setup'),{})).status,403);
  let calls=0;const worker=createSetupWorker({...options,authorize(){calls++;return true;}});for(const [method,path,status] of [['GET','/workspace/setup',200],['HEAD','/workspace/setup/',200],['POST','/workspace/setup',405],['GET','/workspace/setup?answers=private',404],['GET','/other',404]]){const response=await worker.fetch(new Request('https://example.test'+path,{method}),{});assert.equal(response.status,status);assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.match(response.headers.get('Content-Security-Policy'),/default-src 'none'/);assert.match(response.headers.get('Content-Security-Policy'),/form-action 'none'/);if(method==='HEAD')assert.equal(await response.text(),'');}assert.equal(calls,5);
  const html=await (await worker.fetch(new Request('https://example.test/workspace/setup'),{})).text();assert.match(html,/data-notabenda-setup/);assert.match(html,/src="\/assets\/setup.mjs"/);assert.doesNotMatch(html,/private exception|<script>/);
});
test('setup asset paths cannot inject markup or third-party script origins',()=>{for(const scriptUrl of ['https://remote.test/x.js','//remote.test/x.js','/assets/../x.js','/assets/x.js?secret=1','/assets/" onload="bad'])assert.throws(()=>createSetupWorker({...options,scriptUrl,authorize:()=>true}));});
// @requirements REQ-PRODUCT-CARTRIDGES
test('cartridge entry loads only the host-provided local assets and keeps setup authorization',async()=>{
 for(const cartridgeStylesheetUrl of ['https://remote.test/style.css','//remote.test/style.css','/assets/../style.css','/style.css?token=private','/x" onclick="bad'])assert.throws(()=>createSetupWorker({...options,cartridgeStylesheetUrl,authorize:()=>true}));
 const cartridgeStylesheetUrl='/assets/cartridges.css';
 const denied=createSetupWorker({...options,cartridgeStylesheetUrl,authorize:()=>false});assert.equal((await denied.fetch(new Request('https://example.test/workspace/setup'),{})).status,403);
 const worker=createSetupWorker({...options,cartridgeStylesheetUrl,authorize:()=>true}),response=await worker.fetch(new Request('https://example.test/workspace/setup'),{}),html=await response.text();
 assert.equal(response.status,200);assert.match(html,/href="\/assets\/cartridges.css"/);assert.match(html,/data-notabenda-setup/);assert.doesNotMatch(html,/class="setup-intro"/);assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/connect-src|https:/);
});
