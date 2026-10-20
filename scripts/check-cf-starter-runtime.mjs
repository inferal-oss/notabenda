// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CF-HISTORY
// Optional maintainer check. Disposable loopback fixtures are never scaffolded or shipped.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {fixture} from '../packages/notabenda/test/helpers.mjs';
import {compileLegalDocuments} from '@notabenda/core/content';
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
 const sourceResponse=await request('/studio/history/source?id='+authored.manifest.artifactId+'&kind=terms','editor');assert.equal(sourceResponse.status,200);assert.match(await sourceResponse.text(),/Retained private MDX starter fixture/);
 assert.equal((await request('/studio/history/export','reader',{headers:{'X-Notabenda-Export':'1'}})).status,403);
 assert.equal((await request('/studio/history','reader',{method:'POST',body:'{}'})).status,405);
 assert.equal((await request('/studio/other/history','reader')).status,404);
 const head=await request('/studio/history','reader',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 await stop();await start();
 const recovered=await request('/__fixture/archive','seed',{method:'POST'});assert.equal(recovered.status,200);assert.ok((await recovered.json()).every(record=>record.created===false));
 const restored=await request('/studio/history/record?id='+publicRelease.manifest.artifactId,'reader');assert.equal(restored.status,200);assert.match(await restored.text(),/Fictional starter integration archive/);
 console.log('Generated starter: private DO RPC, SQLite restart recovery, immutable/public/MDX archives, setup assets, permission separation and read-only routes passed.');
 console.log('Disposable fixture retained for inspection: '+target);
}catch(error){console.error(output.slice(-3000));throw error;}
finally{await stop();}
