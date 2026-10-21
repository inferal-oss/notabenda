// @requirements REQ-PRODUCT-RELEASE-CANDIDATE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {mkdtemp,readFile,writeFile,chmod,mkdir,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readPackageArchive,checkPackageArchive,PackageCheckError,isPinnedVersion} from '../../../scripts/release-package.mjs';
const license=Buffer.from('SPDX-License-Identifier: Apache-2.0 OR MIT\n'),metadata={name:'@notabenda/core',version:'0.1.0',license:'(Apache-2.0 OR MIT)',type:'module',exports:{'.':'./dist/index.js','./astro/*.astro':'./dist/astro/*.astro'},bin:{notabenda:'./dist/cli.js'},peerDependencies:{react:'^19.0.0',astro:'^7.0.0'},peerDependenciesMeta:{react:{optional:true},astro:{optional:true}}};
function header(path,size,{type='0',link='',mode=0o644,uid=0,gid=0,uname='',gname=''}={}){const b=Buffer.alloc(512),put=(text,start,length)=>b.write(text,start,length,'ascii'),num=(value,start,length)=>put(value.toString(8).padStart(length-1,'0')+'\0',start,length);put(path,0,100);num(mode,100,8);num(uid,108,8);num(gid,116,8);num(size,124,12);num(0,136,12);put('        ',148,8);put(type,156,1);put(link,157,100);put('ustar\0',257,6);put('00',263,2);put(uname,265,32);put(gname,297,32);num([...b].reduce((n,v)=>n+v,0),148,8);return b;}
function archive(entries,{trailer=true}={}){const parts=[];for(const [path,content,options] of entries){const data=Buffer.isBuffer(content)?content:Buffer.from(content);parts.push(header(path,data.length,options),data,Buffer.alloc((512-data.length%512)%512));}if(trailer)parts.push(Buffer.alloc(1024));return gzipSync(Buffer.concat(parts));}
const base=(m=metadata)=>[['package/package.json',JSON.stringify(m)],['package/LICENSE',license],['package/LICENSE-APACHE','Apache License\nVersion 2.0\n'],['package/LICENSE-MIT','MIT License\n'],['package/README.md','Example'],['package/dist/index.js','export {};'],['package/dist/cli.js','#!/usr/bin/env node\n',{mode:0o755}],['package/dist/astro/Control.astro','<p>Example</p>']];
const policy={name:metadata.name,version:metadata.version,license,allowedFiles:new Set(['package.json','LICENSE','LICENSE-APACHE','LICENSE-MIT','README.md','dist/index.js','dist/cli.js','dist/astro/Control.astro'])};
const rejects=(work,code)=>assert.throws(work,e=>e instanceof PackageCheckError&&e.code===code);

test('actual bytes determine file inventory, exported targets, executable bins and both digests',()=>{
 const bytes=archive(base()),before=Buffer.from(bytes),result=checkPackageArchive(bytes,policy);assert.equal(result.name,metadata.name);assert.equal(result.files.length,8);assert.equal(result.exportTargets,2);assert.equal(result.binTargets,1);assert.match(result.sha256,/^[a-f0-9]{64}$/u);assert.match(result.integrity,/^sha512-/u);assert.deepEqual(bytes,before);assert.equal(readPackageArchive(bytes).files.get('README.md').data.toString(),'Example');assert.equal(result.files.find(f=>f.path==='dist/cli.js').bytes,20);
});

test('archive reading rejects traversal, aliases, links, nonzero trailers, checksum damage and oversized expansion',()=>{
 for(const path of ['/package/a','package/../secret','package//a','outside/a','package/a\\b','package/.env','package/dist/config.private.json'])assert.throws(()=>readPackageArchive(archive([[path,'private']])));
 rejects(()=>readPackageArchive(archive([['package/a','one'],['package/a','two']])),'duplicate-or-excessive-files');
 rejects(()=>readPackageArchive(archive([['package/a','',{uid:501,uname:'local-user'}]])),'unsupported-tar-owner');
 for(const type of ['1','2','x','g','7'])rejects(()=>readPackageArchive(archive([['package/a','',{type,link:'../private'}]])),'unsupported-tar-entry');
 rejects(()=>readPackageArchive(archive([['package/a','one']],{trailer:false})),'invalid-tar-trailer');
 const tar=gunzipSync(archive(base()));tar[0]^=1;rejects(()=>readPackageArchive(gzipSync(tar)),'invalid-tar-checksum');const appended=Buffer.concat([gunzipSync(archive(base())),Buffer.alloc(512,1)]);rejects(()=>readPackageArchive(gzipSync(appended)),'invalid-tar-trailer');rejects(()=>readPackageArchive(Buffer.from('invalid')),'unsupported-gzip-header');rejects(()=>readPackageArchive(gzipSync(Buffer.alloc(65*1024*1024))),'invalid-gzip');
});

test('candidate policy rejects stale output, missing exports, licenses, install scripts and dependency widening',()=>{
 rejects(()=>checkPackageArchive(archive([...base(),['package/dist/stale.js','old']]),policy),'unexpected-package-file');
 rejects(()=>checkPackageArchive(archive(base().filter(([p])=>!p.endsWith('index.js'))),policy),'missing-export');
 rejects(()=>checkPackageArchive(archive(base().map(e=>e[0]==='package/LICENSE'?[e[0],'Other']:e)),policy),'license-mismatch');
 for(const file of ['LICENSE-APACHE','LICENSE-MIT']){rejects(()=>checkPackageArchive(archive(base().filter(([p])=>p!=='package/'+file)),policy),'missing-package-file');rejects(()=>checkPackageArchive(archive(base().map(e=>e[0]==='package/'+file?[e[0],'Other']:e)),{...policy,requiredContents:new Map([[file,Buffer.from('Expected license')]])}),'required-content-mismatch');}
 for(const scripts of [{install:'send private files'},{prepare:'execute'}])rejects(()=>checkPackageArchive(archive(base({...metadata,scripts})),policy),'consumer-lifecycle-script');
 rejects(()=>checkPackageArchive(archive(base({...metadata,dependencies:{tracker:'1.0.0'}})),policy),'unexpected-runtime-dependency');
 for(const v of ['^1.2.3','latest','file:../other','1.2.3-.','01.2.3','1.2.3-01','1.2.3+'])assert.equal(isPinnedVersion(v),false,v);for(const v of ['0.1.0','1.2.3-beta.1','1.2.3+build.01'])assert.equal(isPinnedVersion(v),true,v);
 rejects(()=>checkPackageArchive(archive(base({...metadata,optionalDependencies:{tracker:'1.0.0'}})),policy),'unsupported-dependency-class');
 rejects(()=>checkPackageArchive(archive(base({...metadata,exports:{'.':'../outside'}})),policy),'unsafe-export');
 rejects(()=>checkPackageArchive(archive(base({...metadata,peerDependenciesMeta:{}})),policy),'mandatory-framework-peer');
 rejects(()=>checkPackageArchive(archive(base().map(e=>e[0]==='package/dist/index.js'?[e[0],e[1],{mode:0o755}]:e)),policy),'unexpected-executable');
 rejects(()=>checkPackageArchive(archive(base({...metadata,description:'changed'})),{...policy,metadata}),'package-metadata-mismatch');
 rejects(()=>checkPackageArchive(archive(base()),{...policy,requiredContents:new Map([['README.md',Buffer.from('Changed')]])}),'required-content-mismatch');
 rejects(()=>checkPackageArchive(archive(base().map(e=>e[0]==='package/dist/index.js'?[e[0],e[1],{mode:0o666}]:e)),policy),'writable-package-file');
});

test('source maps bind only to their maintained relative public source, without host paths or inline copies',()=>{
 const path='dist/index.js.map',map={version:3,file:'index.js',sources:['../src/index.ts'],sourceRoot:'',names:[],mappings:''},p={...policy,allowedFiles:new Set([...policy.allowedFiles,path]),sourceMaps:new Map([[path,'src/index.ts']])};assert.ok(checkPackageArchive(archive([...base(),['package/'+path,JSON.stringify(map)]]),p));
 for(const change of [{file:'/Users/private/index.js'},{extra:'private'},{sources:['/Users/private/src/index.ts']},{sources:['../../other.ts']},{sourceRoot:'/private'},{sourcesContent:['private']},{sources:['..\\src\\index.ts']}])rejects(()=>checkPackageArchive(archive([...base(),['package/'+path,JSON.stringify({...map,...change})]]),p),'unsafe-source-map');
});

test('the offline command checks all three real tarballs, records provenance and refuses overwriting a candidate',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'notabenda-release-test-')),out=join(temp,'candidate'),script=new URL('../../../scripts/check-package-release.mjs',import.meta.url).pathname,root=new URL('../../../',import.meta.url).pathname;
 try{const run=()=>spawnSync(process.execPath,[script,'--out-dir',out],{cwd:root,encoding:'utf8',timeout:120000});const first=run();assert.equal(first.status,0,first.stderr);const report=JSON.parse(await readFile(join(out,'candidate.json'),'utf8'));assert.equal(report.status,'package-contents-checked');assert.equal(report.packages.length,3);assert.equal(report.boundaries.published,false);assert.equal(report.boundaries.testsRun,false);assert.equal(report.boundaries.sourceBuildMatchProven,false);assert.match(report.source.lockfileSha256,/^[a-f0-9]{64}$/u);assert.equal(typeof report.source.trackedChangesPresent,'boolean');for(const p of report.packages){assert.equal(p.license,'(Apache-2.0 OR MIT)');for(const file of ['LICENSE','LICENSE-APACHE','LICENSE-MIT'])assert.ok(p.files.some(f=>f.path===file),file);assert.ok(p.files.some(f=>f.path==='README.md'));assert.match(p.sha256,/^[a-f0-9]{64}$/u);assert.doesNotMatch(JSON.stringify(p),new RegExp(temp));}assert.equal((await readdir(out)).filter(p=>p.endsWith('.tgz')).length,3);const before=await readFile(join(out,'candidate.json'),'utf8'),second=run();assert.equal(second.status,1);assert.match(second.stderr,/output-already-exists/);assert.equal(await readFile(join(out,'candidate.json'),'utf8'),before);assert.doesNotMatch(first.stdout,/npm publish|NODE_AUTH_TOKEN|\/Users\//u);}
 finally{await rm(temp,{recursive:true,force:true});}
});

test('failed pack output produces a failed local report, and source-tree destinations cannot be created',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'notabenda-release-failure-')),bin=join(temp,'bin'),out=join(temp,'failed'),script=new URL('../../../scripts/check-package-release.mjs',import.meta.url).pathname,root=new URL('../../../',import.meta.url).pathname;
 try{await mkdir(bin);await writeFile(join(bin,'npm'),'#!/usr/bin/env node\nprocess.stdout.write("[]");\n');await chmod(join(bin,'npm'),0o755);const result=spawnSync(process.execPath,[script,'--out-dir',out],{cwd:root,encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH}});assert.equal(result.status,1);assert.match(result.stderr,/npm-pack-output/);const report=JSON.parse(await readFile(join(out,'candidate.json'),'utf8'));assert.equal(report.status,'failed');assert.equal(report.boundaries.published,false);assert.deepEqual(report.packages,[]);
 const unsafe=spawnSync(process.execPath,[script,'--out-dir',join(root,'packages','release-review-fixture')],{cwd:root,encoding:'utf8'});assert.equal(unsafe.status,1);assert.match(unsafe.stderr,/unsafe-output-location/);}
 finally{await rm(temp,{recursive:true,force:true});}
});
