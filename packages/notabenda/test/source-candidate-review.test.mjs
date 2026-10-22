// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {writeCandidateBrowserReview,candidateReviewHandler,serveCandidateReview} from '../../../scripts/source-candidate-review.mjs';
const origin='http://127.0.0.1:62546',id='a'.repeat(64),digest=b=>createHash('sha256').update(b).digest('hex');
async function fixture() {
 const parent=await mkdtemp(join(tmpdir(),'notabenda-native-review-test-')),directory=join(parent,'review');
 const artifact={manifest:{artifactId:id,documents:['privacy','cookies','terms'].map(kind=>({kind,file:kind+'/index.html'}))},pages:Object.fromEntries(['privacy','cookies','terms'].map(kind=>[kind+'/index.html','<!doctype html><p>'+kind+' exact copy</p>']))};
 const result=await writeCandidateBrowserReview({directory,bundle:'export const candidate=true;',consentCss:'.nb-root{color:blue}',documentCss:'.nb-page{color:black}',descriptor:{evidence:'local',inventory:{}},artifact});
 return {parent,directory,result,artifact,close:()=>rm(parent,{recursive:true,force:true})};
}
const request=(path='/',options={})=>new Request(origin+path,options);
test('review retains exact installed bundle and pinned HTML with an exclusive digest-bound manifest and native controls mount',async()=>{
 const f=await fixture();try {
  const bytes=await readFile(join(f.directory,'review-manifest.json')),manifest=JSON.parse(bytes);assert.equal(digest(bytes),f.result.manifestSha256);assert.equal(manifest.files.length,13);
  assert.equal(await readFile(join(f.directory,'runtime.js'),'utf8'),'export const candidate=true;');
  for(const kind of ['privacy','cookies','terms'])assert.equal(await readFile(join(f.directory,'artifacts',id,kind+'.html'),'utf8'),f.artifact.pages[kind+'/index.html']);
  const dom=new JSDOM(await readFile(join(f.directory,'index.html'),'utf8'));assert.equal(dom.window.document.querySelectorAll('h1').length,1);assert.equal(dom.window.document.querySelectorAll('main').length,1);assert.equal(dom.window.document.querySelectorAll('button').length,2);assert.equal(dom.window.document.querySelector('script').src,'/app.mjs');assert.equal(dom.window.document.querySelector('#controls').className,'nb-root');dom.window.close();
  await assert.rejects(writeCandidateBrowserReview({directory:f.directory,bundle:'changed',consentCss:'',documentCss:'',descriptor:{evidence:'local'},artifact:f.artifact}),e=>e.code==='EEXIST');assert.equal(await readFile(join(f.directory,'runtime.js'),'utf8'),'export const candidate=true;');
 }finally{await f.close();}
});
test('server snapshots only declared matching bytes, with private headers, local CSP and no source/report/archive access',async()=>{
 const f=await fixture();try {
  const handle=await candidateReviewHandler({...f,manifestSha256:f.result.manifestSha256,origin});
  await writeFile(join(f.directory,'runtime.js'),'changed after verified read');
  let response=await handle(request('/runtime.js'));assert.equal(response.status,200);assert.equal(await response.text(),'export const candidate=true;');assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('content-security-policy'),/connect-src 'self'/);assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(response.headers.get('access-control-allow-origin'),null);
  for(const path of ['/review-manifest.json','/source-candidate.json','/.env','/consumer/verify.mjs','/packages/core.tgz','/%2e%2e/.env','/artifacts/'+id+'/../private.json','/runtime.js?x=1','/?storage=anything'])assert.equal((await handle(request(path))).status,404,path);
  assert.equal((await handle(request('/?storage=unavailable'))).status,200);
  assert.equal(await (await handle(request('/cookies'))).text(),f.artifact.pages['cookies/index.html']);
  assert.equal(await (await handle(request('/terms/'))).text(),f.artifact.pages['terms/index.html']);
  response=await handle(request('/runtime.js',{method:'HEAD'}));assert.equal(response.status,200);assert.equal(await response.text(),'');
  assert.equal((await handle(request('/runtime.js',{method:'POST'}))).status,405);
 }finally{await f.close();}
});
test('local counter starts empty, counts only deliberate same-origin empty probes, and never resets or hides an admitted request',async()=>{
 const f=await fixture();try {
  const handle=await candidateReviewHandler({...f,manifestSha256:f.result.manifestSha256,origin});
  const count=async()=>Number((await (await handle(request('/observations'))).json()).attempts);
  await handle(request('/'));assert.equal(await count(),0);
  for(const method of ['GET','HEAD','OPTIONS','DELETE'])assert.equal((await handle(request('/probe',{method}))).status,405);
  const good={method:'POST',headers:{origin,'x-notabenda-review':'probe'}};
  for(const options of [{method:'POST'},{...good,headers:{origin}},{...good,body:'private input'},{...good,headers:{...good.headers,'content-length':'1'}},{...good,headers:{...good.headers,'transfer-encoding':'chunked'}}])assert.equal((await handle(request('/probe',options))).status,400);
  assert.equal((await handle(request('/probe?reset=true',good))).status,400);assert.equal(await count(),0);
  assert.equal((await handle(request('/probe',good))).status,200);assert.equal(await count(),1);
  assert.equal((await handle(request('/observations',{method:'DELETE'}))).status,405);await handle(request('/?storage=unavailable'));assert.equal(await count(),1);
 }finally{await f.close();}
});
test('cross-origin access and DNS-rebinding host overrides are denied before probes or assets',async()=>{
 const f=await fixture();try {
  const handle=await candidateReviewHandler({...f,manifestSha256:f.result.manifestSha256,origin});
  for(const headers of [{origin:'https://other.example'},{host:'other.example'},{'sec-fetch-site':'cross-site'}])for(const path of ['/','/observations','/probe'])assert.equal((await handle(request(path,{headers}))).status,403);
  assert.equal((await handle(new Request('http://localhost:62546/'))).status,403);
  assert.equal((await (await handle(request('/observations'))).json()).attempts,0);
 }finally{await f.close();}
});
test('changed, missing, linked and hostile review assets fail before server startup',async()=>{
 for(const mutation of ['changed','missing','linked','traversal','duplicate','oversize','manifest-linked']) {
  const f=await fixture();try {
   const manifestPath=join(f.directory,'review-manifest.json'),manifest=JSON.parse(await readFile(manifestPath));let expected=f.result.manifestSha256;
   if(mutation==='changed')await writeFile(join(f.directory,'runtime.js'),'changed');
   if(mutation==='missing')await rm(join(f.directory,'runtime.js'));
   if(mutation==='linked'){await rm(join(f.directory,'runtime.js'));await writeFile(join(f.parent,'outside.js'),'export const candidate=true;');await symlink(join(f.parent,'outside.js'),join(f.directory,'runtime.js'));}
   if(mutation==='traversal')manifest.files[0].path='../outside';
   if(mutation==='duplicate')manifest.files.push(manifest.files[0]);
   if(mutation==='oversize')manifest.files[0].bytes=2*1024*1024+1;
   if(['traversal','duplicate','oversize'].includes(mutation)){await writeFile(manifestPath,JSON.stringify(manifest));expected=digest(await readFile(manifestPath));}
   if(mutation==='manifest-linked'){await writeFile(join(f.parent,'manifest.json'),await readFile(manifestPath));await rm(manifestPath);await symlink(join(f.parent,'manifest.json'),manifestPath);}
   await assert.rejects(candidateReviewHandler({...f,manifestSha256:expected,origin}),undefined,mutation);
  }finally{await f.close();}
 }
});
test('unsuccessful candidates, missing review binding and invalid ports cannot start a review server',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'notabenda-native-review-report-'));try {
  for(const report of [{kind:'notabenda-source-candidate',status:'checking'},{kind:'notabenda-source-candidate',status:'source-built-consumer-checked',consumer:{}}]){await writeFile(join(parent,'source-candidate.json'),JSON.stringify(report));await assert.rejects(serveCandidateReview({candidate:parent,port:62546}),/successful candidate/);}
  await assert.rejects(serveCandidateReview({candidate:parent,port:0}),/Choose a port/);
  await assert.rejects(candidateReviewHandler({directory:parent,manifestSha256:'a'.repeat(64),origin:'http://0.0.0.0:62546'}),/loopback/);
 }finally{await rm(parent,{recursive:true,force:true});}
});
