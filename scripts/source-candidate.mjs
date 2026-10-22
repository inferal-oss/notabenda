// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,rm,realpath,lstat,copyFile,rename,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const names=['@notabenda/core','@notabenda/cloudflare','@notabenda/authoring'];
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export class SourceCandidateError extends Error {constructor(code,stage){super(code);this.code=code;this.stage=stage;}}
const fail=(code,stage)=>{throw new SourceCandidateError(code,stage);};
const contains=(parent,child)=>{const path=relative(parent,child);return !path||path!=='..'&&!path.startsWith('..'+sep)&&!path.startsWith(sep);};
const safePath=p=>typeof p==='string'&&p.length>0&&Buffer.byteLength(p)<512&&!/[\\:\u0000-\u001f\u007f]/u.test(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..'&&s!=='.git'&&!/[ .]$/u.test(s))&&!p.startsWith('/');
/** Regular tracked blobs only. No checkout, archive extraction, submodule or symlink traversal. */
export function parseSourceTree(bytes){
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>8*1024*1024||bytes.at(-1)!==0)fail('invalid-source-tree');
 const text=bytes.toString('utf8');if(!Buffer.from(text).equals(bytes))fail('invalid-source-path-encoding');
 const entries=[],seen=new Set();let total=0;
 for(const row of text.slice(0,-1).split('\0')){const match=/^(100644|100755) blob ([a-f0-9]{40}|[a-f0-9]{64}) +([0-9]+)\t(.+)$/u.exec(row);if(!match||!safePath(match[4]))fail('unsupported-source-entry');const [,mode,oid,size,path]=match,bytes=Number(size);if(!Number.isSafeInteger(bytes)||bytes>32*1024*1024||seen.has(path)||entries.length>=10000||(total+=bytes)>128*1024*1024)fail('source-tree-bounds');seen.add(path);entries.push({path,oid,bytes,mode:mode==='100755'?0o755:0o644});}
 return entries;
}
/** Check lengths and object identities before any selected blob becomes a build input. */
export function readSourceBlobs(entries,output){
 const files=[];let offset=0;
 for(const entry of entries){const end=output.indexOf(10,offset);if(end<0||end-offset>100)fail('invalid-source-blob');const header=output.subarray(offset,end).toString('ascii');if(header!==`${entry.oid} blob ${entry.bytes}`)fail('source-blob-mismatch');offset=end+1;const data=output.subarray(offset,offset+entry.bytes);if(data.length!==entry.bytes||output[offset+entry.bytes]!==10)fail('invalid-source-blob');const oid=createHash(entry.oid.length===40?'sha1':'sha256').update(Buffer.from(`blob ${entry.bytes}\0`)).update(data).digest('hex');if(oid!==entry.oid)fail('source-blob-mismatch');files.push({...entry,data,sha256:digest(data)});offset+=entry.bytes+1;}
 if(offset!==output.length)fail('unexpected-source-blob-output');return files;
}
export function candidateEnvironment(cache,config){
 const env={};for(const key of ['PATH','TMPDIR','TMP','TEMP','SystemRoot','COMSPEC','PATHEXT'])if(process.env[key])env[key]=process.env[key];
 return {...env,CI:'1',npm_config_cache:cache,npm_config_userconfig:config,npm_config_globalconfig:config+'.global',npm_config_offline:'true',npm_config_audit:'false',npm_config_fund:'false',npm_config_update_notifier:'false',WRANGLER_SEND_METRICS:'false'};
}
function git(repository,args,options={}){const env={};for(const key of ['PATH','TMPDIR','TMP','TEMP','SystemRoot','COMSPEC','PATHEXT'])if(process.env[key])env[key]=process.env[key];Object.assign(env,{GIT_NO_REPLACE_OBJECTS:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null'});const result=spawnSync('git',args,{cwd:repository,env,maxBuffer:140*1024*1024,...options});if(result.status!==0)fail('git-source-read');return result.stdout;}
export async function selectedSource(repository,revision){
 if(typeof revision!=='string'||!revision||revision.startsWith('-')||revision.length>240||/[\u0000-\u001f]/u.test(revision))fail('invalid-revision');
 const commit=git(repository,['rev-parse','--verify','--end-of-options',revision+'^{commit}']).toString('ascii').trim();if(!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(commit))fail('invalid-revision');
 const entries=parseSourceTree(git(repository,['ls-tree','-r','--full-tree','--long','-z',commit]));
 // npm project config can override isolated installation flags. This recipe deliberately has none.
 if(entries.some(e=>e.path.split('/').at(-1)==='.npmrc'))fail('source-npm-config');
 const files=readSourceBlobs(entries,git(repository,['cat-file','--batch'],{input:entries.map(e=>e.oid+'\n').join('')}));
 for(const name of ['package.json','package-lock.json','scripts/check-package-release.mjs'])if(!files.some(f=>f.path===name))fail('missing-source-build-input');
 const tree=git(repository,['rev-parse',commit+'^{tree}']).toString('ascii').trim();return {commit,tree,files};
}
export async function materializeSource(directory,files){
 await mkdir(directory);for(const {path,data,mode} of files){await mkdir(dirname(join(directory,path)),{recursive:true});await writeFile(join(directory,path),data,{flag:'wx',mode});}
}
export function compareCandidates(a,b){
 if(a?.status!=='package-contents-checked'||b?.status!=='package-contents-checked'||a.packages?.length!==3||b.packages?.length!==3)fail('invalid-built-candidate');
 for(const name of names){const first=a.packages.find(p=>p.name===name),second=b.packages.find(p=>p.name===name);if(!first||!second||first.version!==second.version||first.sha256!==second.sha256||first.integrity!==second.integrity||JSON.stringify(first.files)!==JSON.stringify(second.files))fail('builds-differ');}
 return a.packages.map(p=>({name:p.name,version:p.version,filename:p.filename,sha256:p.sha256,integrity:p.integrity,fileCount:p.files.length}));
}
/** Retain the locked dependency closure, replacing only the three workspace links with exact archives. */
export function consumerLockfile(source,metadata,packages){
 if(source?.lockfileVersion!==3||!source.packages)fail('unsupported-source-lock');
 const pool=structuredClone(source.packages),directories=['notabenda','notabenda-cf','notabenda-authoring'];
 for(const [index,name] of names.entries()){
  const p=packages.find(p=>p.name===name),entry=pool['packages/'+directories[index]];if(!p||entry?.version!==p.version)fail('consumer-sibling-version');
  const next={};for(const key of ['version','license','dependencies','peerDependencies','peerDependenciesMeta','engines','bin'])if(entry[key]!==undefined)next[key]=entry[key];
  pool['node_modules/'+name]={...next,resolved:'file:packages/'+p.filename,integrity:p.integrity};
 }
 const selected={'':metadata},queue=[...Object.keys(metadata.dependencies),...Object.keys(metadata.devDependencies)];
 function locate(parent,name){let at=parent;for(;;){const path=(at?at+'/':'')+'node_modules/'+name;if(pool[path])return path;if(!at)return undefined;const pos=at.lastIndexOf('/node_modules/');at=pos<0?'':at.slice(0,pos);}}
 const pending=queue.map(name=>({parent:'',name,optional:false}));
 while(pending.length){const {parent,name,optional}=pending.shift(),path=locate(parent,name);if(!path){if(optional)continue;fail('consumer-lock-missing-dependency');}if(selected[path])continue;const entry=pool[path];if(entry.link||names.some(n=>path.endsWith('/node_modules/'+n)))fail('consumer-lock-link');selected[path]=entry;
  for(const name of Object.keys(entry.dependencies??{}))pending.push({parent:path,name,optional:false});
  for(const name of Object.keys(entry.optionalDependencies??{}))pending.push({parent:path,name,optional:true});
  for(const name of Object.keys(entry.peerDependencies??{}))pending.push({parent:path,name,optional:entry.peerDependenciesMeta?.[name]?.optional===true});
 }
 return {name:metadata.name,lockfileVersion:3,requires:true,packages:selected};
}
/** Installed sibling packages must be real copies of the exact candidate bytes, never workspace links. */
export async function verifyInstalledPackages(consumer,candidate){
 const base=await realpath(consumer),lock=JSON.parse(await readFile(join(base,'package-lock.json'),'utf8')),results=[];
 for(const p of candidate.packages){const directory=join(base,'node_modules',p.name),stat=await lstat(directory);if(!stat.isDirectory()||stat.isSymbolicLink()||await realpath(directory)!==directory)fail('linked-consumer-package');const declaration=lock.packages?.['node_modules/'+p.name];if(declaration?.link||declaration?.version!==p.version||declaration?.integrity!==p.integrity||declaration?.resolved!=='file:packages/'+p.filename)fail('consumer-package-substitution');
  for(const [path,entry] of Object.entries(lock.packages??{}))if(path!=='node_modules/'+p.name&&path.endsWith('/node_modules/'+p.name))fail('nested-sibling-package');
  for(const file of p.files){if(!safePath(file.path))fail('invalid-candidate-file');const target=join(directory,file.path);if(!(await lstat(target)).isFile()||await realpath(target)!==target||digest(await readFile(target))!==file.sha256)fail('installed-package-mismatch');}results.push({name:p.name,version:p.version,filesVerified:p.files.length});
 }
 return results;
}
function options(args){const values={};while(args.length){const key=args.shift();if(!['--revision','--cache','--out-dir'].includes(key)||Object.hasOwn(values,key)||!args.length||args[0].startsWith('-'))fail('usage');values[key]=args.shift();}if(Object.keys(values).length!==3)fail('usage');return values;}
export async function runSourceCandidate({repository=root,revision,cache,output}){
 const parent=await realpath(dirname(resolve(output))),destination=join(parent,resolve(output).split(sep).at(-1)),repositoryRoot=await realpath(repository),relativeOutput=relative(repositoryRoot,destination);
 if(contains(repositoryRoot,destination)&&relativeOutput!=='.local'&&!relativeOutput.startsWith('.local'+sep)&&relativeOutput!=='dist'&&!relativeOutput.startsWith('dist'+sep))fail('unsafe-output-location');
 const cacheRoot=await realpath(cache).catch(()=>fail('offline-cache-unavailable'));if(!(await lstat(cacheRoot)).isDirectory()||contains(destination,cacheRoot)||contains(cacheRoot,destination))fail('unsafe-cache-location');
 await mkdir(destination,{mode:0o700});await mkdir(join(destination,'logs'));
 const report={schemaVersion:1,kind:'notabenda-source-candidate',status:'checking',generatedAt:new Date().toISOString(),stages:[],boundaries:{published:false,sourceWorkingTreeIncluded:false,dependencyInstallScripts:false,buildNetworkIsolationProven:false,toolchainMatrix:false,physicalBrowserAcceptance:false,legalReview:false,signedProvenance:false}};
 let temporary;
 async function save(){await writeFile(join(destination,'source-candidate.json'),JSON.stringify(report,null,2)+'\n');}
 try{
  const source=await selectedSource(repositoryRoot,revision),inputs=source.files.map(({path,oid,bytes,mode,sha256})=>({path,oid,bytes,mode,sha256}));
  report.source={commit:source.commit,tree:source.tree,fileCount:inputs.length,lockfileSha256:inputs.find(f=>f.path==='package-lock.json').sha256,inputsSha256:digest(Buffer.from(JSON.stringify(inputs)))};
  await writeFile(join(destination,'source-inputs.json'),JSON.stringify(inputs,null,2)+'\n');
  temporary=await mkdtemp(join(tmpdir(),'notabenda-source-candidate-'));if(contains(repositoryRoot,temporary))fail('temporary-inside-repository');
  const config=join(temporary,'empty.npmrc');await writeFile(config,'');await writeFile(config+'.global','');const env=candidateEnvironment(cacheRoot,config);
  const toolVersion=spawnSync('npm',['--version'],{env,encoding:'utf8',timeout:10000});if(toolVersion.status!==0||!/^\d+\.\d+\.\d+\s*$/u.test(toolVersion.stdout))fail('npm-unavailable');
  report.tools={node:process.version,npm:toolVersion.stdout.trim(),platform:process.platform,architecture:process.arch};
  const harness=await readFile(new URL('./source-candidate-consumer.mjs',import.meta.url)),backendHarness=await readFile(new URL('./source-candidate-backend.mjs',import.meta.url));
  const reviewFiles={};for(const file of ['source-candidate-review.mjs','source-candidate-review-app.mjs','source-candidate-review.css'])reviewFiles[file]=await readFile(new URL('./'+file,import.meta.url));
  report.verifier={consumerHarnessSha256:digest(harness),backendHarnessSha256:digest(backendHarness),orchestratorSha256:digest(await readFile(fileURLToPath(import.meta.url))),browserReviewFiles:Object.fromEntries(Object.entries(reviewFiles).map(([file,body])=>[file,digest(body)]))};
  const scrub=text=>{let clean=text;for(const [value,label] of [[temporary,'<temporary>'],[repositoryRoot,'<repository>'],[cacheRoot,'<npm-cache>']])clean=clean.split(value).join(label);return clean;};
  async function stage(id,command,args,cwd,{accept=[0],timeout=180000}={}){
   const start=Date.now(),result=spawnSync(command,args,{cwd,env,encoding:'utf8',timeout,maxBuffer:16*1024*1024}),body=(result.stdout??'')+'\n'+(result.stderr??''),blocked=!accept.includes(result.status)&&/ENOTCACHED|cache mode is 'only-if-cached'/u.test(body),status=accept.includes(result.status)?'passed':blocked?'blocked':'failed';
   const log='logs/'+id+'.log';await writeFile(join(destination,log),scrub(body));report.stages.push({id,status,exitCode:result.status,signal:result.signal??null,durationMs:Date.now()-start,log});await save();if(status!=='passed')fail(blocked?'offline-dependency-missing':result.error?.code==='ETIMEDOUT'?'stage-timeout':'stage-failed',id);return result;
  }
  const builds=[];
  for(const name of ['a','b']){const directory=join(temporary,'build-'+name);await materializeSource(directory,source.files);await stage('build-'+name+'-install','npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund'],directory);await stage('build-'+name, 'npm',['run','build'],directory);await mkdir(join(directory,'.local'));await stage('build-'+name+'-pack',process.execPath,['scripts/check-package-release.mjs','--out-dir','.local/candidate'],directory);builds.push({directory,candidate:JSON.parse(await readFile(join(directory,'.local/candidate/candidate.json'),'utf8'))});}
  report.packages=compareCandidates(builds[0].candidate,builds[1].candidate);report.reproduction={buildCount:2,allArchiveBytesEqual:true,sameToolchain:true};await mkdir(join(destination,'packages'));for(const p of report.packages){const bytes=await readFile(join(builds[0].directory,'.local/candidate',p.filename)),other=await readFile(join(builds[1].directory,'.local/candidate',p.filename));if(digest(bytes)!==p.sha256||!bytes.equals(other))fail('candidate-changed');await writeFile(join(destination,'packages',p.filename),bytes,{flag:'wx'});}
  const consumer=join(temporary,'consumer');await mkdir(consumer);await mkdir(join(consumer,'packages'));
  for(const p of report.packages)await copyFile(join(destination,'packages',p.filename),join(consumer,'packages',p.filename));
  const metadata=JSON.parse(source.files.find(f=>f.path==='package.json').data.toString('utf8')),devDependencies={};for(const name of ['esbuild','jsdom','typescript','@types/node']){const version=metadata.devDependencies?.[name];if(!/^\d+\.\d+\.\d+$/u.test(version??''))fail('unpinned-consumer-tool');devDependencies[name]=version;}
  const consumerMetadata={name:'notabenda-candidate-consumer',private:true,type:'module',dependencies:Object.fromEntries(report.packages.map(p=>[p.name,'file:packages/'+p.filename])),devDependencies};
  await writeFile(join(consumer,'package.json'),JSON.stringify(consumerMetadata,null,2)+'\n');
  const consumerLock=consumerLockfile(JSON.parse(source.files.find(f=>f.path==='package-lock.json').data.toString('utf8')),consumerMetadata,report.packages);await writeFile(join(consumer,'package-lock.json'),JSON.stringify(consumerLock,null,2)+'\n');
  await writeFile(join(consumer,'verify.mjs'),harness);await mkdir(join(consumer,'inputs'));const fixture=source.files.find(f=>f.path==='examples/static/notabenda.config.json');if(!fixture)fail('missing-consumer-fixture');await writeFile(join(consumer,'inputs/site.json'),fixture.data);
  for(const [file,body] of Object.entries(reviewFiles))await writeFile(join(consumer,file),body);
  await stage('consumer-install','npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund'],consumer);report.installedPackages=await verifyInstalledPackages(consumer,builds[0].candidate);
  await stage('consumer-workflow',process.execPath,['verify.mjs'],consumer);report.consumer=JSON.parse(await readFile(join(consumer,'consumer-result.json'),'utf8'));if(report.consumer?.status!=='passed')fail('invalid-consumer-result');
  const backend=join(temporary,'backend');await rename(join(consumer,'backend'),backend);const generated=JSON.parse(await readFile(join(backend,'package.json'),'utf8')),backendMetadata=structuredClone(generated),backendPackages=report.packages.filter(p=>p.name!=='@notabenda/authoring');
  if(JSON.stringify(Object.keys(generated.dependencies??{}).sort())!==JSON.stringify(backendPackages.map(p=>p.name).sort())||backendPackages.some(p=>generated.dependencies[p.name]!==p.version)||Object.keys(generated.devDependencies??{}).sort().join(',')!=='esbuild,wrangler'||['esbuild','wrangler'].some(n=>generated.devDependencies[n]!==metadata.devDependencies[n]))fail('generated-starter-manifest');
  await writeFile(join(backend,'generated-package.json'),JSON.stringify(generated,null,2)+'\n');await mkdir(join(backend,'packages'));for(const p of backendPackages){backendMetadata.dependencies[p.name]='file:packages/'+p.filename;await copyFile(join(destination,'packages',p.filename),join(backend,'packages',p.filename));}
  await writeFile(join(backend,'package.json'),JSON.stringify(backendMetadata,null,2)+'\n');await writeFile(join(backend,'package-lock.json'),JSON.stringify(consumerLockfile(JSON.parse(source.files.find(f=>f.path==='package-lock.json').data.toString('utf8')),backendMetadata,report.packages),null,2)+'\n');await writeFile(join(backend,'verify.mjs'),backendHarness);
  await stage('starter-install','npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund'],backend);report.installedStarterPackages=await verifyInstalledPackages(backend,{packages:builds[0].candidate.packages.filter(p=>p.name!=='@notabenda/authoring')});await stage('starter-check','npm',['run','check'],backend);await stage('starter-default-denial',process.execPath,['verify.mjs'],backend);report.starter=JSON.parse(await readFile(join(backend,'backend-result.json'),'utf8'));if(report.starter?.status!=='passed')fail('invalid-starter-result');
  await mkdir(join(destination,'consumer'));for(const file of ['package.json','package-lock.json','consumer-result.json','consumer.ts'])await copyFile(join(consumer,file),join(destination,'consumer',file));
  // Portable reproduction recipe and exact test inputs; no temporary node_modules or host paths.
  await copyFile(join(consumer,'verify.mjs'),join(destination,'consumer/verify.mjs'));await mkdir(join(destination,'consumer/inputs'));await copyFile(join(consumer,'inputs/site.json'),join(destination,'consumer/inputs/site.json'));await mkdir(join(destination,'consumer/packages'));for(const p of report.packages)await copyFile(join(destination,'packages',p.filename),join(destination,'consumer/packages',p.filename));
  for(const file of Object.keys(reviewFiles))await copyFile(join(consumer,file),join(destination,'consumer',file));
  await mkdir(join(destination,'evidence'));for(const path of ['site.yaml','collection-settings.json','authored','browser','browser-review'])await cp(join(consumer,path),join(destination,'evidence',path),{recursive:true});await mkdir(join(destination,'starter'));for(const file of ['generated-package.json','package.json','package-lock.json','backend-result.json'])await copyFile(join(backend,file),join(destination,'starter',file));
  report.status='source-built-consumer-checked';
 }catch(error){report.status=error instanceof SourceCandidateError&&error.code==='offline-dependency-missing'?'blocked':'failed';report.error={code:error instanceof SourceCandidateError?error.code:'local-operation-failed',...(error?.stage?{stage:error.stage}:{})};}
 finally{if(temporary)try{await rm(temporary,{recursive:true,force:true});report.temporaryCleanup='completed';}catch{report.temporaryCleanup='failed';report.status='failed';report.error={code:'temporary-cleanup-failed'};}await save();}
 return report;
}
async function main(){try{if(process.argv.slice(2).join(' ')==='--help'){process.stdout.write('Usage: node scripts/source-candidate.mjs --revision REF --cache OFFLINE_NPM_CACHE --out-dir NEW_DIRECTORY\nBuilds trusted selected source twice and exercises exact archives in an isolated adopter. No publication.\n');return;}const args=options(process.argv.slice(2)),report=await runSourceCandidate({revision:args['--revision'],cache:args['--cache'],output:args['--out-dir']});process.stdout.write(JSON.stringify({status:report.status,source:report.source,reproduction:report.reproduction,packages:report.packages,error:report.error},null,2)+'\n');if(report.status!=='source-built-consumer-checked')process.exitCode=1;}catch(error){process.stderr.write(JSON.stringify({status:error?.code==='offline-cache-unavailable'?'blocked':'failed',code:error?.code==='EEXIST'?'output-already-exists':error instanceof SourceCandidateError?error.code:'local-operation-failed'})+'\n');process.exitCode=1;}}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
