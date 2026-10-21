// @requirements REQ-PRODUCT-TERMS-HISTORY
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {sha256} from '@notabenda/core/content';
import {createSyntheticStorage} from '../../packages/notabenda-cf/examples/synthetic.mjs';
import {DemoWorkspace} from '../worker.mjs';
import {serveHost} from '../host.mjs';
import data from '../dist/server-data.json' with {type:'json'};
const releases=data.releases.map(r=>({...r,artifact:r.artifact.artifact??r.artifact})).filter(r=>r.artifact.manifest.siteId==='juniper-agreement-history').sort((a,b)=>a.metadata.recordedAt.localeCompare(b.metadata.recordedAt));
test('the seeded wording comparison retains both exact releases with unchanged terms document bytes',async()=>{
 assert.equal(releases.length,2);const [a,b]=releases.map(r=>r.artifact);assert.notEqual(a.manifest.artifactId,b.manifest.artifactId);assert.deepEqual(a.manifest.documents.find(d=>d.kind==='terms'),b.manifest.documents.find(d=>d.kind==='terms'));assert.deepEqual(a.pages,b.pages);assert.equal(a.publicConfig.terms.agreements[0].revision,'account-wording-1');assert.equal(b.publicConfig.terms.agreements[0].revision,'account-wording-2');
 for(const artifact of [a,b]){const stored=JSON.parse(await readFile(new URL('../dist/public/artifacts/'+artifact.manifest.artifactId+'.json',import.meta.url),'utf8'));assert.deepEqual(stored,artifact);const html=await readFile(new URL('../dist/public/artifacts/'+artifact.manifest.artifactId+'/terms.html',import.meta.url),'utf8');assert.equal(sha256(html),artifact.manifest.documents.find(d=>d.kind==='terms').sha256);}
 const guide=new JSDOM(await readFile(new URL('../dist/public/guide/terms/index.html',import.meta.url),'utf8'));try{assert.ok(guide.window.document.querySelector('#review-archived-agreement-wording'));assert.ok(guide.window.document.querySelector('a[href*="Account+agreement+wording"]'));}finally{guide.window.close();}
});
test('demo operators reach the comparison through seeded history without reading operational storage',async()=>{
 const objects=new Map();let operational=0;const env={ADMIN_KEY:'b'.repeat(64),DEMO_PROVISION_LIMITER:{limit:async()=>({success:true})},WORKSPACE:{idFromName(){operational++;throw Error('Operational access');}}};
 env.DEMO_WORKSPACES={idFromName:name=>name,get(name){if(!objects.has(name)){const storage=createSyntheticStorage([]);storage.setAlarm=async()=>{};storage.deleteAll=async()=>{};objects.set(name,{storage,worker:new DemoWorkspace({storage,blockConcurrencyWhile:fn=>fn()},env)});}return {fetch:request=>objects.get(name).worker.fetch(request)};}};
 const origin='https://example.test',first=await serveHost(new Request(origin+'/demo/admin/history?q=Account+agreement+wording&kind=document-release'),env);assert.equal(first.status,200);const html=await first.text();assert.match(html,/Account agreement wording/);assert.match(html,/<option value="terms-settings">Agreement settings/);assert.equal(objects.size,1);assert.equal(operational,0);
 const cookie=first.headers.getSetCookie()[0].split(';')[0],storage=[...objects.values()][0].storage,before=await storage.list({prefix:'notabenda/',limit:10000});
 const params=new URLSearchParams({before:releases[0].artifact.manifest.artifactId,after:releases[1].artifact.manifest.artifactId,kind:'terms-settings'}),response=await serveHost(new Request(origin+'/demo/admin/history/diff?'+params,{headers:{Cookie:cookie}}),env);assert.equal(response.status,200);const comparison=await response.text();assert.match(comparison,/Agreement wording changes/);assert.match(comparison,/Pinned terms HTML unchanged/);assert.match(comparison,/Create workspace/);assert.doesNotMatch(comparison,/<script\b/u);assert.match(response.headers.get('Cache-Control'),/private/);assert.deepEqual(await storage.list({prefix:'notabenda/',limit:10000}),before);assert.equal(operational,0);
});
