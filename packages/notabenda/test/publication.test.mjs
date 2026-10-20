// @requirements REQ-PRODUCT-PUBLICATION-CHECK REQ-PRODUCT-RETAINED-RELEASES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {gzipSync} from 'node:zlib';
import {mkdtemp,writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {checkLegalPublication} from '@notabenda/core/publication';
import {compileLegalDocuments,canonicalJson} from '@notabenda/core/content';
import {selectPacks} from '@notabenda/core/packs';
import {fixture} from './helpers.mjs';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
async function compiled(){return compileLegalDocuments(await fixture({reviewed:true}));}
async function serving(handler,work){const server=createServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');try{return await work('http://127.0.0.1:'+server.address().port);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
function retained(build){const id=build.manifest.artifactId;return new Map([['/artifacts/'+id+'.json',{type:'application/json',body:JSON.stringify(build.artifact,null,2)}],...build.manifest.documents.map(d=>['/artifacts/'+id+'/'+d.kind+'.html',{type:'text/html',body:build.artifact.pages[d.file]}])]);}
function send(files,req,res){const file=files.get(req.url);if(!file){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.type);res.end(file.body);}
async function run(args){const child=spawn(process.execPath,[cli,...args],{stdio:['ignore','pipe','pipe']}),out=[],err=[];child.stdout.on('data',c=>out.push(c));child.stderr.on('data',c=>err.push(c));const [code]=await once(child,'exit');return {code,stdout:Buffer.concat(out).toString(),stderr:Buffer.concat(err).toString()};}

test('four real anonymous requests match a compiled retained release, including formatted JSON',async()=>{
 const build=await compiled(),files=retained(build),requests=[];
 await serving((req,res)=>{requests.push(req.url);assert.equal(req.method,'GET');assert.equal(req.headers.cookie,undefined);assert.equal(req.headers.authorization,undefined);send(files,req,res);},async origin=>{
  const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true,packs:selectPacks(['privacy-pages','terms-agreement'])});
  assert.equal(report.retainedFilesMatched,true);assert.equal(report.validationMode,'production');assert.ok(report.requirementIds.includes('REQ-PRODUCT-PUBLICATION-CHECK'));assert.deepEqual(requests,[...files.keys()]);assert.deepEqual(report.checks.map(c=>c.outcome),Array(4).fill('matched'));assert.equal(report.release.artifactId,build.manifest.artifactId);assert.equal(report.release.configSha256,build.manifest.configSha256);assert.equal(report.origin,origin);assert.equal(report.configuredOrigin,new URL(build.publicConfig.site.url).origin);assert.equal(report.originMatchesConfigured,false);assert.equal(report.requestedPacks.selected.length,2);assert.ok(report.checker.version);assert.equal(report.boundaries.establishesPackInstallation,false);assert.ok(report.unverified.includes('Active notice and offer bindings'));assert.ok(Date.parse(report.finishedAt)>=Date.parse(report.startedAt));
 });
});

test('missing pages, changed bytes and a 200 SPA fallback cannot look like a matched publication',async()=>{
 const build=await compiled();
 for(const variant of ['missing','modified','spa','invalid-json']){
  const files=retained(build),path=[...files.keys()].find(p=>p.endsWith('/cookies.html'));
  if(variant==='missing')files.delete(path);if(variant==='modified')files.get(path).body+='\n';
  if(variant==='spa')for(const file of files.values())file.body='<html>PRIVATE FALLBACK</html>';
  if(variant==='invalid-json')files.get([...files.keys()][0]).body='{"private":"PRIVATE RESPONSE"}';
  await serving((req,res)=>send(files,req,res),async origin=>{const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true});assert.equal(report.retainedFilesMatched,false);if(variant==='missing')assert.equal(report.checks.find(c=>c.kind==='cookies').outcome,'missing');if(variant==='modified')assert.equal(report.checks.find(c=>c.kind==='cookies').outcome,'different');if(variant==='spa')assert.equal(report.checks.filter(c=>c.outcome==='different').length,3);if(variant==='invalid-json')assert.equal(report.checks[0].outcome,'invalid-body');assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);});
 }
});

test('redirects are never followed, even to another allowed local server',async()=>{
 const build=await compiled();let followed=0;
 await serving((req,res)=>{followed++;res.end('PRIVATE');},async other=>{
  await serving((req,res)=>{res.writeHead(302,{location:other+'/private?token=PRIVATE'});res.end('PRIVATE BODY');},async origin=>{const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true});assert.deepEqual(report.checks.map(c=>c.outcome),Array(4).fill('redirect'));assert.equal(followed,0);assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);});
 });
});

test('media types, download-only responses and authorization failures are distinct observations',async()=>{
 const build=await compiled();
 for(const [status,headers,outcome] of [[200,{'Content-Type':'text/plain'},'media-type'],[200,{'Content-Type':'application/json','Content-Disposition':'attachment; filename=private'},'download-only'],[401,{},'denied'],[503,{},'http-error']]){
  await serving((req,res)=>{res.writeHead(status,headers);res.end('PRIVATE');},async origin=>{const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true});assert.equal(report.checks[0].outcome,outcome);assert.equal(report.retainedFilesMatched,false);assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);});
 }
});

test('response limits apply after decompression and also to chunked bodies',async()=>{
 const build=await compiled(),large=Buffer.alloc(128*1024+1,'x');
 for(const compressed of [true,false]){
  await serving((req,res)=>{res.setHeader('Content-Type',req.url.endsWith('.json')?'application/json':'text/html');if(compressed){res.setHeader('Content-Encoding','gzip');res.end(gzipSync(large));}else{res.write(large.subarray(0,65536));res.end(large.subarray(65536));}},async origin=>{const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true});assert.equal(report.retainedFilesMatched,false);assert.deepEqual(report.checks.map(c=>c.outcome),Array(4).fill('too-large'));});
 }
});

test('charset and disposition parameters cannot disguise unusable legal pages or harmless inline filenames',async()=>{
 const build=await compiled(),files=retained(build);
 for(const charset of ['UTF-16LE','utf-8; charset=UTF-16LE','"utf-8"; charset="utf-8"']){
  await serving((req,res)=>{const f=files.get(req.url);res.setHeader('Content-Type',f.type+'; charset='+charset);res.end(f.body);},async origin=>{const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true});assert.equal(report.retainedFilesMatched,false);assert.deepEqual(report.checks.map(c=>c.outcome),Array(4).fill('charset'));});
 }
 await serving((req,res)=>{const f=files.get(req.url);res.setHeader('Content-Type',f.type+'; profile="value; charset=UTF-16LE"; charset="UTF-8"');res.setHeader('Content-Disposition','inline; filename="attachment.html"');res.end(f.body);},async origin=>{assert.equal((await checkLegalPublication(build.artifact,{origin,allowLoopback:true})).retainedFilesMatched,true);});
 await serving((req,res)=>{const f=files.get(req.url);res.setHeader('Content-Type',f.type+'; foo=x"; charset=UTF-16LE; ignored="');res.end(f.body);},async origin=>{const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true});assert.equal(report.retainedFilesMatched,false);assert.deepEqual(report.checks.map(c=>c.outcome),Array(4).fill('media-type'));});
});

test('the operation deadline cancels a stalled body and does not start remaining requests',async()=>{
 const build=await compiled();let requests=0,closed=false;
 await serving((req,res)=>{requests++;req.once('close',()=>{closed=true;});res.writeHead(200,{'Content-Type':'application/json'});res.write('{');},async origin=>{
  const start=Date.now(),report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true,timeoutMs:80});assert.ok(Date.now()-start<1500);assert.equal(requests,1);assert.equal(report.checks[0].outcome,'timeout');assert.deepEqual(report.checks.slice(1).map(c=>c.outcome),Array(3).fill('not-requested-deadline'));
  for(let i=0;i<20&&!closed;i++)await new Promise(resolve=>setTimeout(resolve,5));assert.equal(closed,true);
 });
});

test('explicit origin authority, preview and supported input limits are checked before requests',async()=>{
 const build=await compiled();let requests=0;
 await serving((req,res)=>{requests++;send(retained(build),req,res);},async origin=>{
  for(const bad of [origin,origin+'/subpath',origin+'?',origin+'#',origin+'?secret=PRIVATE','http://localhost.evil.test','https://name:PRIVATE@example.test','https://example.test/path','file:///tmp/private','https://127.0.0.2','https://127.1','https://2130706433','https://localhost.','https://[::ffff:127.0.0.1]'])await assert.rejects(checkLegalPublication(build.artifact,{origin:bad}),/origin-only/);
  let touched=0;await assert.rejects(checkLegalPublication(build.artifact,{get origin(){touched++;return origin;}}),/origin-only/);assert.equal(touched,0);
  await assert.rejects(checkLegalPublication({...build.artifact,manifest:{...build.manifest,artifactId:'0'.repeat(64)}},{origin,allowLoopback:true}),/Artifact input/);
  const preview=compileLegalDocuments(await fixture(),{mode:'preview'});await assert.rejects(checkLegalPublication(preview.artifact,{origin,allowLoopback:true}),/Artifact input/);
  const config=await fixture({reviewed:true});config.documents.terms.sections[0].paragraphs=['Synthetic larger document. '.repeat(4000)];const large=compileLegalDocuments(config);assert.ok(Buffer.byteLength(JSON.stringify(large.artifact))>128*1024);await assert.rejects(checkLegalPublication(large.artifact,{origin,allowLoopback:true}),/128 KiB/);assert.equal(requests,0);
 });
});

test('CLI checks real fixture responses and rejects unsupported local inputs without executing them',async()=>{
 const build=await compiled(),files=retained(build),directory=await mkdtemp(join(tmpdir(),'notabenda-publication-'));let requests=0;
 try{
  const file=join(directory,'release.json');await writeFile(file,canonicalJson(build.artifact));await symlink(file,join(directory,'link.json'));
  await serving((req,res)=>{requests++;send(files,req,res);},async origin=>{
   const args=['check-publication','--artifact',file,'--origin',origin,'--allow-loopback','--packs','privacy-pages','--json'],success=await run(args);assert.equal(success.code,0,success.stderr);const report=JSON.parse(success.stdout);assert.equal(report.retainedFilesMatched,true);assert.equal(report.requestedPacks.selected[0].id,'privacy-pages');assert.equal(requests,4);
   const denied=await run(['check-publication','--artifact',join(directory,'link.json'),'--origin',origin,'--allow-loopback','--json']);assert.equal(denied.code,1);assert.equal(requests,4);
   files.delete([...files.keys()].find(p=>p.endsWith('/terms.html')));const mismatch=await run(args);assert.equal(mismatch.code,1);assert.equal(JSON.parse(mismatch.stdout).checks.find(c=>c.kind==='terms').outcome,'missing');
   const malformed=await run([...args,'--json']);assert.equal(malformed.code,1);assert.equal(requests,8);
  });
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('preview artifacts require explicit permission and the report records that validation mode',async()=>{
 const build=compileLegalDocuments(await fixture(),{mode:'preview'}),files=retained(build);let requests=0;
 await serving((req,res)=>{requests++;send(files,req,res);},async origin=>{
  await assert.rejects(checkLegalPublication(build.artifact,{origin,allowLoopback:true}),/Artifact input/);assert.equal(requests,0);
  const report=await checkLegalPublication(build.artifact,{origin,allowLoopback:true,mode:'preview',packs:selectPacks(['privacy-requests'])});assert.equal(report.retainedFilesMatched,true);assert.equal(report.validationMode,'preview');assert.equal(report.release.mode,'preview');assert.equal(report.requestedPacks.selected[0].id,'privacy-requests');assert.ok(report.unverified.includes('Current framework document routes'));assert.equal(requests,4);
 });
});
