// @requirements REQ-PRODUCT-PACK-EDUCATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {packLibrary,planPacks,selectPacks} from '@notabenda/core/packs';
import {applyPackLearning,renderPackLearning,withPackLearningResponse} from '../../../examples/static/pack-learning.mjs';

test('all installed jobs have distinct use cases, short descriptions and a complete example flow without changing selection pins',()=>{
 const packs=packLibrary();assert.equal(packs.length,21);
 assert.equal(new Set(packs.map(p=>p.example.useCase)).size,21);
 for(const p of packs){assert.ok(p.outcome.length<=130,p.id);assert.ok(p.introduction.length<=200,p.id);assert.equal(p.example.steps.length,3,p.id);assert.ok(p.example.useCase.trim());assert.ok(p.example.observe.trim());const plan=planPacks(selectPacks([p.id]));assert.deepEqual(plan.selection.selected,[{id:p.id,revision:'1'}]);}
 const irish=packLibrary().find(p=>p.id==='ie-consent-duration'),italian=packLibrary().find(p=>p.id==='it-repeat-prompts');assert.notDeepEqual(irish.example.steps,italian.example.steps);assert.match(irish.example.steps[0],/six-month grant cap/);assert.match(italian.example.steps[0],/Reject/);
});
test('learning is static and collapsed, and only declared current example pages are decorated',()=>{
 const html='<html><head></head><body><main><h1>Example</h1></main></body></html>',files={'agreement/index.html':html,'artifacts/one/terms.html':html,'privacy/index.html':html,'agreement/terms/index.html':html,'agreement/offer.json':'{"offer":"untouched"}','choices/site.json':'{"config":"untouched"}'},result=applyPackLearning(files),dom=new JSDOM(result['agreement/index.html']),d=dom.window.document;
 assert.equal(d.querySelector('[data-pack-guide]').dataset.packGuide,'terms-agreement');assert.equal(d.querySelector('details').open,false);assert.equal(d.querySelectorAll('ol li').length,3);assert.equal(d.querySelectorAll('script,button,input,form').length,0);for(const key of Object.keys(files).filter(k=>k!=='agreement/index.html'))assert.equal(result[key],files[key]);assert.ok(result['assets/pack-learning.css']);assert.throws(()=>renderPackLearning(['unknown']),/Unknown pack/);dom.window.close();
});
test('teaching content stays outside framework hydration roots and timing guidance stays distinct',()=>{
 for(const id of ['react-agreement-root','react-permission-root']){const root='<div id="'+id+'"><main><h1>Framework owns this</h1></main></div>',html='<html><head></head><body>'+root+'</body></html>',path=id==='react-agreement-root'?'agreement/react/index.html':'form-permissions/react/index.html',d=new JSDOM(applyPackLearning({[path]:html})[path]).window.document;assert.equal(d.getElementById(id).outerHTML,root);assert.equal(d.querySelector('[data-pack-guide]').closest('#'+id),null);}
 const d=new JSDOM(renderPackLearning(['ie-consent-duration','it-repeat-prompts'])).window.document;assert.deepEqual([...d.querySelectorAll('[data-pack-guide]')].map(n=>n.dataset.packGuide),['ie-consent-duration','it-repeat-prompts']);assert.equal(d.querySelectorAll('ol').length,2);assert.ok([...d.querySelectorAll('details')].every(n=>!n.open));
});
test('demo operator walkthrough keeps the existing nonce policy and refuses unstyled or denied responses',async()=>{
 const html='<html><head></head><body><main>Records</main></body></html>',policy="default-src 'none'; style-src 'nonce-existingnonce'; frame-ancestors 'none'",headers={'Content-Type':'text/html','Content-Security-Policy':policy,'Cache-Control':'private, no-store'};
 const response=await withPackLearningResponse(new Response(html,{headers}),['evidence-workspace']),body=await response.text();assert.equal(response.headers.get('Content-Security-Policy'),policy);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match(body,/<style nonce="existingnonce">/);assert.match(body,/data-pack-guide="evidence-workspace"/);assert.doesNotMatch(body,/<script|<link/);
 for(const status of [403,404,500]){const denied=new Response(html,{status,headers});assert.equal(await withPackLearningResponse(denied,['evidence-workspace']),denied);}
 const noNonce=new Response(html,{headers:{'Content-Type':'text/html'}});assert.equal(await withPackLearningResponse(noNonce,['evidence-workspace']),noNonce);
});
