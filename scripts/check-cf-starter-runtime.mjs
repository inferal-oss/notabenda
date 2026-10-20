// @requirements REQ-PRODUCT-CF-RECOVERY-REHEARSAL REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CF-HISTORY
// Optional maintainer check. Disposable loopback fixtures are never scaffolded or shipped.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,symlink,stat} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {exampleConsentConfig} from '../examples/static/choices-build.mjs';
import {fixture} from '../packages/notabenda/test/helpers.mjs';
import {compileLegalDocuments,createConsentNotice} from '@notabenda/core/content';
import {compileAuthoredDocuments} from '@notabenda/authoring';

const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.NOTABENDA_STARTER_CHECK_PORT??4181);
if(!Number.isInteger(port)||port<4181||port>4190)throw Error('Use a loopback test port from 4181 to 4190.');
const origin='http://127.0.0.1:'+port,target=resolve(root,'.local/cf-starter-check-'+randomUUID()),logs=resolve(root,'.local/wrangler-logs');
await mkdir(logs,{recursive:true});
const env={...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:logs};
let child,output='';
function command(args){const result=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
async function start(){
 output='';child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',target+'/wrangler.json','--ip','127.0.0.1','--port',String(port),'--persist-to',target+'/.wrangler/state'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
 await new Promise((done,reject)=>{
  const timer=setTimeout(()=>reject(Error('Local starter did not become ready. '+output.slice(-3000))),25000);
  const consume=chunk=>{output=(output+chunk).slice(-12000);if(output.includes('Ready on '+origin)){clearTimeout(timer);done();}};
  child.stdout.on('data',consume);child.stderr.on('data',consume);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Starter exited before ready ('+code+'). '+output.slice(-3000)));});
 });
}
async function stop(){
 if(!child||child.exitCode!==null||child.signalCode!==null)return;
 const processToStop=child;
 await new Promise(done=>{const timer=setTimeout(()=>processToStop.kill('SIGKILL'),5000);processToStop.once('exit',()=>{clearTimeout(timer);done();});processToStop.kill('SIGINT');});
}
const request=(path,role,options={})=>fetch(origin+path,{...options,headers:{...(role?{'X-Starter-Role':role}:{}),...options.headers},signal:AbortSignal.timeout(5000),redirect:'manual'});
function retainedSource(html){const dom=new JSDOM(html);try{const nodes=dom.window.document.querySelectorAll('pre code');assert.equal(nodes.length,1);return nodes[0].textContent;}finally{dom.window.close();}}

try{
 command([resolve(root,'packages/notabenda-cf/bin/notabenda-cf.mjs'),'init','--out-dir',target,'--name','fictional-starter-check','--site-id','juniper-notes','--base-path','/studio']);
 await symlink(resolve(root,'node_modules'),target+'/node_modules','dir');command([target+'/scripts/build-assets.mjs']);
 command([resolve(root,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config',target+'/wrangler.json','--outdir',target+'/dist']);
 await start();
 for(const path of ['/studio/history','/studio/setup','/assets/setup.mjs','/assets/notabenda.css']){const response=await request(path,'editor');assert.equal(response.status,403);assert.match(response.headers.get('Cache-Control'),/private, no-store/);}
 await stop();
 console.log('Generated starter: unchanged host hook denies pages and assets.');

 // Replace only the disposable copy with explicit fictional local test authorization.
 await writeFile(target+'/src/authorize.mjs',`export async function authorizeHostRequest(request){const role=request.headers.get('X-Starter-Role');return role==='reader'?{inspect:true}:role==='editor'?{inspect:true,configure:true,export:true,source:true}:null;}\n`);
 const config=await fixture({reviewed:true});config.site.id='juniper-notes';
 const publicRelease=compileLegalDocuments(config).artifact;
 const authored=await compileAuthoredDocuments(config,{terms:{format:'mdx',source:'---\nkind: terms\ntitle: Fictional starter terms\nroute: /terms\nversion: source-1\neffectiveDate: 2026-10-18\nreview:\n  status: reviewed\n---\n## A fictional note\n\nRetained private MDX starter fixture.'}});
 await writeFile(target+'/src/fixture-releases.mjs','export const releases = '+JSON.stringify([publicRelease,authored.archive])+';\n');
 const source=await readFile(target+'/src/worker.mjs','utf8');
 await writeFile(target+'/src/worker.mjs',source.replace('export default {fetch:createHost(authorizeHostRequest)};',`import {settings} from './settings.mjs';
import {releases} from './fixture-releases.mjs';
const host=createHost(authorizeHostRequest);
export default {async fetch(request,env){
 if(new URL(request.url).pathname==='/__fixture/archive'&&request.method==='POST'&&request.headers.get('X-Starter-Role')==='seed'){
  const object=env.EVIDENCE.getByName('notabenda:'+settings.siteId),records=[];
  for(const release of releases)records.push(await object.recordRelease(release,{changeNote:'Fictional starter integration archive',recordedAt:'2026-10-18T12:00:00Z'}));
  return Response.json(records);
 }
 return host(request,env);
}};`));
 await start();
 for(const section of ['history','choices','agreements','processing']){const response=await request('/studio/'+section,'reader');assert.equal(response.status,200);assert.match(await response.text(),/No matches/);}
 const seed=await request('/__fixture/archive','seed',{method:'POST'});assert.equal(seed.status,200);assert.ok((await seed.json()).every(record=>record.created));
 const history=await request('/studio/history','reader');assert.match(await history.text(),/Fictional starter integration archive/);
 for(const path of ['/studio/setup','/assets/setup.mjs','/assets/notabenda.css','/studio/history/export'])assert.equal((await request(path,'reader')).status,403);
 for(const path of ['/studio/setup','/assets/setup.mjs','/assets/notabenda.css','/studio/history/export'])assert.equal((await request(path,'editor')).status,200,path);
 assert.equal((await request('/studio/history/source?id='+authored.manifest.artifactId+'&kind=terms','reader',{headers:{'X-Notabenda-Source':'1'}})).status,404);
 const sourceResponse=await request('/studio/history/source?id='+authored.manifest.artifactId+'&kind=terms','editor');assert.equal(sourceResponse.status,200);const privateSource=retainedSource(await sourceResponse.text());assert.equal(privateSource,authored.archive.sourceAttachments.terms.source);
 assert.equal((await request('/studio/history/export.json','reader')).status,403);
 const segmentResponse=await request('/studio/history/export.json','editor');assert.equal(segmentResponse.status,200);const evidenceSegment=await segmentResponse.json();
 assert.equal(evidenceSegment.kind,'notabenda-evidence-segment');assert.equal(evidenceSegment.read.consistency,'live-segment');assert.equal(evidenceSegment.records.length,2);assert.equal(evidenceSegment.segment.continuationRequired,false);
 assert.deepEqual(evidenceSegment.exclusions,['application-data-outside-this-store','separately-authorized-source-archives','externally-linked-artifacts']);assert.ok(evidenceSegment.records.every(record=>!Object.hasOwn(record.data,'sourceAttachments')));assert.ok(!JSON.stringify(evidenceSegment).includes(JSON.stringify(authored.archive.sourceAttachments.terms.source)));
 assert.equal((await request('/studio/history/export','reader',{headers:{'X-Notabenda-Export':'1'}})).status,403);
 assert.equal((await request('/studio/history','reader',{method:'POST',body:'{}'})).status,405);
 assert.equal((await request('/studio/other/history','reader')).status,404);
 const head=await request('/studio/history','reader',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 await stop();await start();
 const recovered=await request('/__fixture/archive','seed',{method:'POST'});assert.equal(recovered.status,200);assert.ok((await recovered.json()).every(record=>record.created===false));
 const restored=await request('/studio/history/record?id='+publicRelease.manifest.artifactId,'reader');assert.equal(restored.status,200);assert.match(await restored.text(),/Fictional starter integration archive/);
 console.log('Generated starter: private DO RPC, SQLite restart recovery, immutable/public/MDX archives, setup assets, permission separation and read-only routes passed.');
 // A pre-erasure backup is restored into a DIFFERENT local SQLite object.
 // The extra RPC/HTTP controls exist only in this disposable generated copy.
 await stop();
 const consentConfig=exampleConsentConfig(config);consentConfig.site.id=config.site.id;
 const consentBuild=compileLegalDocuments(consentConfig),scopeId='starter-recovery',notice=createConsentNotice(consentBuild.artifact,{scopeId}),now='2026-10-20T12:00:00.000Z';
 const recoveryData={siteId:config.site.id,scopeId,artifact:consentBuild.artifact,notice,now,holdReviewAt:'2026-11-20T12:00:00.000Z',holdRequestId:randomUUID(),decision:{requestId:randomUUID(),reason:'operator-erasure',eligibleAt:now,legalHold:false},commands:Object.fromEntries(['erased-context','held-context','retained-context'].map(id=>[id,{schemaVersion:1,noticeId:notice.noticeId,requestId:randomUUID(),expectedRevision:0,action:'accept-all',choices:Object.fromEntries(Object.keys(notice.scopes).map(id=>[id,true])),clientAt:now}]))};
 await writeFile(target+'/src/fixture-recovery-data.mjs','export const recoveryData='+JSON.stringify(recoveryData)+';\n',{mode:0o600});
 await writeFile(target+'/src/fixture-recovery.mjs',await readFile(resolve(root,'scripts/fixtures/starter-recovery.mjs'),'utf8'));
 let worker=await readFile(target+'/src/worker.mjs','utf8');
 worker="import {createRecoveryFixture} from './fixture-recovery.mjs';\nimport {recoveryData} from './fixture-recovery-data.mjs';\n"+worker;
 worker=worker.replace('this.workspace=createWorkspace(ctx.storage);','this.workspace=createWorkspace(ctx.storage);this.recovery=createRecoveryFixture(ctx.storage,recoveryData);');
 worker=worker.replace('return this.workspace.inspect(request,access);',"if(await this.recovery.isolated())return new Response('Recovery isolated.',{status:503});return this.workspace.inspect(request,access);");
 worker=worker.replace('return this.workspace.recordRelease(artifact,metadata);',"if(await this.recovery.isolated())throw Error('Recovery isolated.');return this.workspace.recordRelease(artifact,metadata);");
 worker=worker.replace('async recordRelease(artifact,metadata){','async fixtureRecovery(action,payload){return JSON.parse(JSON.stringify(await this.recovery.run(action,payload)));  }\n async recordRelease(artifact,metadata){');
 worker=worker.replace(" if(new URL(request.url).pathname==='/__fixture/archive'",` if(new URL(request.url).pathname==='/__fixture/recovery'){
  if(request.method!=='POST'||request.headers.get('X-Starter-Role')!=='seed')return new Response('Access denied.',{status:403});
  const body=await request.json();if(!['source','restored'].includes(body.target))return new Response('Unknown fixture.',{status:400});
  if(body.target==='restored'&&['seed','snapshot','retire','manifest'].includes(body.action))return new Response('Source-only fixture operation.',{status:409});
  const object=env.EVIDENCE.getByName('notabenda:'+settings.siteId+(body.target==='restored'?':isolated-recovery':''));
  if(body.action==='inspect')return object.inspect(new Request(new URL('/studio/history',request.url)),{allowExport:false,allowSource:false});
  if(body.action==='source-inspect')return object.inspect(new Request(new URL('/studio/history/source?id='+releases[1].artifact.manifest.artifactId+'&kind=terms',request.url)),{allowExport:false,allowSource:true});
  try{if(body.action==='archive-probe')return Response.json(await object.recordRelease(releases[0]));return Response.json(await object.fixtureRecovery(body.action,body.payload));}catch(error){return Response.json({error:error.code??'recovery-incomplete'},{status:409});}
 }
 if(new URL(request.url).pathname==='/__fixture/archive'`);
 assert.ok(worker.includes('async fixtureRecovery('));assert.ok(worker.includes('Recovery isolated.'));await writeFile(target+'/src/worker.mjs',worker);
 await start();
 const operation=async(action,targetName='source',payload,expected=200)=>{const response=await request('/__fixture/recovery','seed',{method:'POST',body:JSON.stringify({action,target:targetName,...(payload===undefined?{}:{payload})})});assert.equal(response.status,expected,response.status===expected?action:action+' '+await response.clone().text());return response;};
 assert.equal((await request('/__fixture/recovery',undefined,{method:'POST',body:'{}'})).status,403);
 assert.deepEqual(await (await operation('seed')).json(),{seeded:3});assert.deepEqual(await (await operation('hold-probe')).json(),{blocked:true,code:'legal-hold'});
 const backup=await (await operation('snapshot')).json(),backupPath=target+'/recovery-backup.private.json',manifestPath=target+'/retirement.private.json';
 const backupText=JSON.stringify(backup),backupDigest=createHash('sha256').update(backupText).digest('hex');
 await writeFile(backupPath,backupText,{flag:'wx',mode:0o600});
 await operation('retire');let purge=await (await operation('purge')).json();assert.equal(purge.phase,'purging');
 await stop();await start();
 for(let batch=0;purge.phase!=='complete'&&batch<30;batch++)purge=await (await operation('purge')).json();assert.equal(purge.phase,'complete');assert.equal(purge.progress.deleted,1);
 const manifest=await (await operation('manifest')).json();await writeFile(manifestPath,JSON.stringify(manifest),{flag:'wx',mode:0o600});
 assert.deepEqual(await (await operation('replay')).json(),{blocked:true,code:'context-retired'});assert.equal((await (await operation('summary')).json()).records,2);
 const diskBackup=await readFile(backupPath,'utf8');assert.equal(createHash('sha256').update(diskBackup).digest('hex'),backupDigest);
 assert.equal((await operation('inspect','restored',undefined,503)).status,503);await operation('archive-probe','restored',undefined,409);
 await operation('seed','restored',undefined,409);
 await operation('hydrate','restored',JSON.parse(diskBackup));await operation('hydrate','restored',backup,409);
 await operation('seed','restored',undefined,409);
 assert.equal((await operation('inspect','restored',undefined,503)).status,503);await operation('open','restored',undefined,409);
 assert.deepEqual(await (await operation('replay','restored')).json(),{blocked:true,code:'recovery-isolated'});
 await stop();await start();
 assert.equal((await operation('inspect','restored',undefined,503)).status,503);await operation('open','restored',undefined,409);
 const wrongManifest=JSON.parse(await readFile(manifestPath,'utf8'));wrongManifest.retirement.requestId=randomUUID();await operation('apply-manifest','restored',wrongManifest,409);
 const restoredManifest=await (await operation('apply-manifest','restored',JSON.parse(await readFile(manifestPath,'utf8')))).json();assert.equal(restoredManifest.phase,'purging');assert.equal(restoredManifest.progress.after,null);await operation('open','restored',undefined,409);
 let replayed=await (await operation('purge','restored')).json();assert.equal(replayed.phase,'purging');
 await stop();await start();
 for(let batch=0;replayed.phase!=='complete'&&batch<30;batch++)replayed=await (await operation('purge','restored')).json();assert.equal(replayed.phase,'complete');assert.equal(replayed.progress.deleted,1);assert.ok(replayed.restoredAt);
 assert.deepEqual(await (await operation('hold-probe','restored')).json(),{blocked:true,code:'legal-hold'});await operation('open','restored');
 assert.deepEqual(await (await operation('replay','restored')).json(),{blocked:true,code:'context-retired'});
 const restoredSummary=await (await operation('summary','restored')).json();assert.equal(restoredSummary.records,2);assert.equal(restoredSummary.hold.hold.active,true);assert.equal(restoredSummary.heldHeadRevision,1);assert.equal(restoredSummary.headRevision,1);assert.equal(restoredSummary.erasedHeadGone,true);assert.equal(restoredSummary.isolated,false);
 const restoredInspection=await operation('inspect','restored');assert.match(await restoredInspection.text(),/Fictional starter integration archive/);
 assert.deepEqual(Buffer.from(retainedSource(await (await operation('source-inspect','restored')).text())),Buffer.from(privateSource));
 const report={schemaVersion:1,kind:'synthetic-starter-recovery-rehearsal',freshLocalObject:true,privateBackupFile:true,backupEntries:backup.entries.length,backupSha256:backupDigest,recoveryRestarts:3,deletedEvents:replayed.progress.deleted,retainedEvents:restoredSummary.records,erasedHeadGone:true,holdPreserved:true,heldHeadPreserved:true,privateSourceBytesPreserved:true,adminExportIsInspectionSegment:true,trafficFencedUntilReplay:true,oldGrantReplayBlocked:true,limits:['Local Wrangler SQLite KV snapshot, not a Cloudflare account backup or infrastructure disaster-recovery certification.','One consent context; other families, external copies, authenticity/completeness of host manifests and production authorization remain separate.']};
 const reportPath=target+'/recovery-report.private.json';await writeFile(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 for(const path of [backupPath,manifestPath,reportPath])assert.equal((await stat(path)).mode&0o777,0o600);
 console.log('Generated starter recovery: private pre-erasure KV backup, different SQLite target, restart-persistent isolation, deletion replay/resume, preserved hold and unrelated records, and denied old grant verified.');
 console.log('Disposable fixture retained for inspection: '+target);
}catch(error){console.error(output.slice(-3000));throw error;}
finally{await stop();}
