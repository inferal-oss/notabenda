// @requirements REQ-PRODUCT-TERMS-ACCEPTANCE
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {request} from 'node:http';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {startTermsTransportFixture} from '../../scripts/terms-transport-fixture.mjs';
import {createTermsAcceptance} from '@notabenda/core/terms';

async function fixture(run){const f=await startTermsTransportFixture();try{const data=await(await fetch(f.origin+'/fixture.json')).json();await run({...f,data,headers:{Origin:f.origin,'Content-Type':'application/json','X-Notabenda-Demo':'1','X-Notabenda-Demo-Generation':data.generation}});}finally{await f.close();}}
const readState=async f=>(await fetch(f.origin+'/state.json')).json();
const command=f=>({schemaVersion:1,offerId:f.data.offer.offerId,requestId:crypto.randomUUID(),accepted:true});
const post=(f,body,headers=f.headers)=>fetch(f.origin+'/demo/agreements/light',{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});

test('an actual truncated HTTP acknowledgment leaves the controller uncertain and explicit retry recovers one record',async()=>fixture(async f=>{
 const bodies=[];const controller=createTermsAcceptance(f.data.offer,{operationId:'synthetic-light-operation-'+f.data.generation,async submit(body,{signal}){
  bodies.push(structuredClone(body));const response=await fetch(f.origin+'/demo/agreements/light',{method:'POST',headers:f.headers,body:JSON.stringify(body),signal});const value=await response.json().catch(()=>({}));if(!response.ok)throw Error('Not confirmed');return value;
 }});
 try{
  assert.deepEqual(await readState(f),{attempts:0,records:0,sameCommand:null,sameReceipt:null,droppedResponses:0});assert.equal(controller.getSnapshot().checked,false);await assert.rejects(controller.submit(),e=>e.code==='not-checked');assert.equal((await readState(f)).attempts,0);
  controller.setChecked(true);assert.equal((await readState(f)).attempts,0);await assert.rejects(controller.submit(),e=>e.code==='invalid-receipt');assert.equal(controller.getSnapshot().status,'error');assert.equal(controller.getSnapshot().receipt,undefined);
  assert.deepEqual(await readState(f),{attempts:1,records:1,sameCommand:null,sameReceipt:null,droppedResponses:1});
  const receipt=await controller.submit();assert.equal(controller.getSnapshot().status,'recorded');assert.equal(receipt.documentSha256,f.data.offer.document.sha256);assert.deepEqual(bodies[1],bodies[0]);
  assert.deepEqual(await readState(f),{attempts:2,records:1,sameCommand:true,sameReceipt:true,droppedResponses:1});await controller.submit();assert.equal((await readState(f)).attempts,2);
 }finally{controller.destroy();}
}));
test('fault injection really sends headers and partial JSON after commit; a changed command is visible rather than silently deduplicated',async()=>fixture(async f=>{
 const body=command(f),first=await post(f,body);assert.equal(first.status,200);assert.equal(first.headers.get('cache-control'),'no-store');await assert.rejects(first.json());assert.equal((await readState(f)).records,1);
 const second=await post(f,{...body,requestId:crypto.randomUUID()});assert.equal(second.status,200);await second.json();assert.deepEqual(await readState(f),{attempts:2,records:2,sameCommand:false,sameReceipt:false,droppedResponses:1});
}));
test('fixture request guards reject authority, shape, size and method errors before agreement recording',async()=>fixture(async f=>{
 const body=command(f);
 for(const headers of [{...f.headers,Origin:'https://elsewhere.test'},{...f.headers,'X-Notabenda-Demo-Generation':'other'},{...f.headers,'Sec-Fetch-Site':'cross-site'},{...f.headers,'X-Notabenda-Demo':'0'}])assert.equal((await post(f,body,headers)).status,403);
 assert.equal((await post(f,body,{...f.headers,'Content-Type':'text/plain'})).status,415);assert.equal((await post(f,{...body,subjectId:'browser-authority'})).status,400);assert.equal((await post(f,{...body,accepted:false})).status,400);assert.equal((await post(f,{...body,private:'X'.repeat(3000)})).status,413);
 assert.equal((await fetch(f.origin+'/fixture.json',{method:'POST'})).status,405);assert.equal((await fetch(f.origin+'/demo/agreements/light',{method:'OPTIONS'})).status,405);
 const wrongHost=await new Promise((resolve,reject)=>{const r=request(f.origin+'/',{headers:{Host:'elsewhere.test'}},response=>{response.resume();resolve(response.statusCode);});r.on('error',reject);r.end();});assert.equal(wrongHost,403);assert.equal((await readState(f)).attempts,0);
}));
test('only explicit fixture assets and exact pinned terms are served, without publishing or allocating agreement records',async()=>fixture(async f=>{
 const page=await fetch(f.origin+'/'),html=await page.text(),dom=new JSDOM(html);assert.equal(page.headers.get('cache-control'),'no-store');assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.ok(dom.window.document.querySelector('main h1'));assert.equal(dom.window.document.querySelector('script').src,'/fixture.mjs');assert.equal(dom.window.document.querySelectorAll('input').length,0);dom.window.close();
 const reader=await fetch(f.origin+f.data.offer.document.url),bytes=Buffer.from(await reader.arrayBuffer());assert.equal(reader.status,200);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.data.offer.document.sha256);
 for(const path of ['/private.json','/.dev.vars','/source/config.json','/artifacts/'+f.data.offer.artifactId+'.json','/qa-a11y/'])assert.equal((await fetch(f.origin+path)).status,404,path);
 const script=await(await fetch(f.origin+'/fixture.mjs')).text();assert.match(script,/Record sample agreement|Recording not confirmed/);assert.doesNotMatch(script,/node:http|recordTermsAcceptance|createSyntheticStorage/);assert.equal((await readState(f)).attempts,0);
 const manifest=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8'));assert.ok(manifest.every(path=>!/^fixture\.(?:mjs|json|css)$|^state\.json$/u.test(path)));
}));
test('concurrent submissions cannot exceed the disposable four-attempt bound',async()=>fixture(async f=>{
 const body=command(f);const results=await Promise.all(Array.from({length:12},async()=>{try{const r=await post(f,body);await r.text().catch(()=>{});return r.status;}catch{return 'interrupted';}}));
 assert.ok(results.includes(429));const state=await readState(f);assert.equal(state.attempts,4);assert.equal(state.records,1);assert.equal(state.sameCommand,true);assert.equal(state.sameReceipt,true);
}));
