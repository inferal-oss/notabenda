// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {verifyCollectionFlow} from '@notabenda/core/content';
import data from '../dist/server-data.json' with {type:'json'};
const read=path=>readFile(new URL('../dist/public/'+path,import.meta.url),'utf8');
test('combined form keeps unconditional static notices and distinct permission text in both themes, with existing pack navigation',async()=>{
 const flow=JSON.parse(await read('collection-flow/flow.json'));assert.deepEqual(verifyCollectionFlow(flow,data.collectionFlow.artifact,{mode:'preview'}),flow);assert.equal(flow.permissions.length,1);assert.equal(flow.routes[0].presentation,'notice-only');
 for(const path of ['collection-flow/','dark/collection-flow/']){const html=await read(path+'index.html'),dom=new JSDOM(html),d=dom.window.document;assert.equal(d.querySelectorAll('.nb-collection-notice').length,1);assert.equal(d.querySelector('.nb-collection-notice input'),null);assert.equal(d.querySelectorAll('[data-collection-permission]').length,1);assert.equal(d.querySelector('button[type=submit]').disabled,true);assert.ok(d.querySelector('.demo-corner'));assert.match(d.querySelector('.nb-collection-notice').textContent,/Reply to your message/);assert.match(d.querySelector('.nb-form-permission').textContent,/Choose email updates/);assert.ok(d.querySelector('a[href="/guide/collection-flow/"]'));dom.window.close();}
 const directory=await read('examples/privacy-information/index.html');assert.match(directory,/collection-flow/);const guide=await read('guide/collection-flow/index.html');assert.match(guide,/YAML/);assert.match(await read('guide/turkey-processing/index.md'),/2025/);
});

test('collection flow teaching explains the two form jobs',async()=>{const {renderPackLearning}=await import('../../examples/static/pack-learning.mjs');const html=renderPackLearning(['collection-notices','form-permissions']);assert.match(html,/One form, two separate jobs/u);assert.doesNotMatch(html,/timing rules|consent grant lasts/u);assert.match(renderPackLearning(['ie-consent-duration','it-repeat-prompts']),/Two different timing rules/u);});
