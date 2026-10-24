// @requirements REQ-PRODUCT-CF-HOST REQ-PRODUCT-RELEASE-CANDIDATE
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {serveHost} from '../host.mjs';
const output=new URL('../dist/public/',import.meta.url);

test('published screenshot extensions match their actual image containers',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8')),images=manifest.filter(path=>path.startsWith('docs/assets/screenshots/')&&/\.(?:png|jpg)$/u.test(path));assert.ok(images.length>=132);
 for(const path of images){const bytes=await readFile(new URL(path,output));if(path.endsWith('.png'))assert.deepEqual(bytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]),path);else{assert.equal(bytes[0],255,path);assert.equal(bytes[1],216,path);assert.equal(bytes[2],255,path);}}
});

test('legacy screenshot GET and HEAD URLs redirect to same-origin JPEG assets before storage access',async()=>{
 const {legacyScreenshotNames}=await import('../screenshot-aliases.mjs');assert.equal(legacyScreenshotNames.length,15);let assetReads=0;
 const env={ASSETS:{fetch(){assetReads++;throw Error('Redirect must precede asset lookup');}},WORKSPACE:{get(){throw Error('No operator records');}},DEMO_WORKSPACES:{get(){throw Error('No demo records');}}};
 for(const name of legacyScreenshotNames)for(const method of ['GET','HEAD']){
  const target='/docs/assets/screenshots/'+name+'.jpg',response=await serveHost(new Request('https://example.test/docs/assets/screenshots/'+name+'.png?download=1',{method}),env);
  assert.equal(response.status,308);assert.equal(response.headers.get('Location'),target);assert.equal(new URL(response.headers.get('Location'),'https://example.test').origin,'https://example.test');assert.match(response.headers.get('Cache-Control'),/no-transform/u);assert.equal(response.headers.get('Set-Cookie'),null);assert.equal(await response.text(),'');const bytes=await readFile(new URL(target.slice(1),output));assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 }
 assert.equal(assetReads,0);
 const denied=await serveHost(new Request('https://example.test/docs/assets/screenshots/consent-current.png',{method:'POST'}),env);assert.equal(denied.status,405);assert.equal(denied.headers.get('Location'),null);assert.equal(assetReads,0);
});

test('unknown and genuine PNG assets keep their existing asset lookup',async()=>{
 const paths=[],env={ASSETS:{fetch(request){paths.push(new URL(request.url).pathname);return new Response('asset');}}};
 for(const path of ['/docs/assets/screenshots/workspace-current.png','/docs/assets/screenshots/unknown.png','/docs/assets/screenshots/consent-current.png.extra']){const response=await serveHost(new Request('https://example.test'+path),env);assert.equal(response.status,200);assert.equal(response.headers.get('Location'),null);assert.equal(await response.text(),'asset');}
 assert.equal(paths.length,3);
});
