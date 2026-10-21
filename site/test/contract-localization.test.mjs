// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import data from '../dist/server-data.json' with {type:'json'};
const root=new URL('../dist/public/',import.meta.url);
test('German cancellation retains its own release and complete dictionary while withdrawal keeps legacy bytes',async()=>{
 const d=data.contractActions.definitions.cancellation;assert.equal(d.schemaVersion,2);assert.equal(d.locale,'de-DE');assert.equal(d.localization.contractActions.name,'Ihr Name');assert.equal(d.wording.confirmLabel,'jetzt kündigen');assert.equal(data.contractActions.definitions.withdrawal.schemaVersion,1);
 const release=data.contractActions.artifacts.find(a=>a.manifest.artifactId===d.artifactId);assert.ok(release);assert.equal(release.manifest.locale,'de-DE');assert.deepEqual(d.localization.contractActions,release.publicConfig.localization.contractActions);assert.equal(data.contractActions.artifacts.length,2);
 for(const prefix of ['','dark/']){const dom=new JSDOM(await readFile(new URL(prefix+'contract-actions/cancellation/index.html',root),'utf8'));try{assert.equal(dom.window.document.documentElement.lang,'de-DE');assert.ok(dom.window.document.querySelector('a[href="/contract-actions/german/privacy"]'));assert.equal(dom.window.document.querySelectorAll('script[src="/assets/contract-actions.mjs"]').length,1);}finally{dom.window.close();}}
 for(const kind of ['privacy','cookies','terms']){const dom=new JSDOM(await readFile(new URL('contract-actions/german/'+kind+'/index.html',root),'utf8'));try{assert.equal(dom.window.document.documentElement.lang,'de-DE');assert.equal(dom.window.document.querySelectorAll('script').length,0);}finally{dom.window.close();}}
});
