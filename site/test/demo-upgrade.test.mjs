// @requirements REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-RETAINED-RELEASES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {createConsentNotice,createProcessingNotice,createContractActionDefinition} from '@notabenda/core/content';
import {createSyntheticStorage} from '../../packages/notabenda-cf/examples/synthetic.mjs';
import {DemoWorkspace} from '../worker.mjs';
import current from '../dist/server-data.json' with {type:'json'};

test('a deployed demo with earlier document pins upgrades without replacing its session or existing evidence',async()=>{
 const previous=JSON.parse(await readFile(new URL('../../examples/releases/previous-preview-releases.json',import.meta.url),'utf8'));
 const documents=a=>JSON.stringify(a.manifest.documents.map(d=>[d.kind,d.version,d.route]));
 const older=a=>previous.find(p=>p.manifest.siteId===a.manifest.siteId&&p.manifest.artifactId!==a.manifest.artifactId&&documents(p)===documents(a))??a;
 const old=structuredClone(current);
 for(const key of ['consent','recordedConsent']){
  const item=old[key];item.artifact=older(item.artifact);
  item.notice=createConsentNotice(item.artifact,{scopeId:item.notice.scopeId,wording:item.notice.wording,deliveryWindowSeconds:item.notice.deliveryWindowSeconds},{mode:'preview'});
 }
 old.processing.artifact=older(old.processing.artifact);
 old.processing.notice=createProcessingNotice(old.processing.artifact,{scopeId:old.processing.notice.scopeId,activities:old.processing.notice.activities,wording:old.processing.notice.wording},{mode:'preview'});
 old.contractActions.artifact=older(old.contractActions.artifact);
 assert.notEqual(old.contractActions.artifact.manifest.artifactId,current.contractActions.artifact.manifest.artifactId);
 for(const [route,d] of Object.entries(old.contractActions.definitions))old.contractActions.definitions[route]=createContractActionDefinition(old.contractActions.artifact,{actionId:d.actionId,revision:'form-1',profile:d.profile,reviewStatus:d.reviewStatus},{mode:'preview'});
 old.version=createHash('sha256').update(JSON.stringify(old)).digest('hex');
 const folder=await mkdtemp(join(tmpdir(),'notabenda-demo-upgrade-'));
 try{
  // Load the actual host with the earlier public facts, then replace the Worker over the same database.
  const output=join(folder,'previous-worker.mjs');
  await build({entryPoints:[fileURLToPath(new URL('../worker.mjs',import.meta.url))],outfile:output,bundle:true,platform:'node',format:'esm',plugins:[{name:'earlier-public-facts',setup(b){b.onLoad({filter:/server-data\.json$/},()=>({contents:JSON.stringify(old),loader:'json'}));}}]});
  const {DemoWorkspace:PreviousWorkspace}=await import(pathToFileURL(output).href);
  const storage=createSyntheticStorage([]);storage.setAlarm=async()=>{};
  const state={storage,blockConcurrencyWhile:f=>f()},env={},generation='c'.repeat(64),headers={'X-Notabenda-Demo-Generation':generation};
  const first=new PreviousWorkspace(state,env);
  assert.equal((await first.fetch(new Request('https://example.test/demo/provision',{method:'POST',headers}))).status,204);
  const session=await storage.get('demo/session'),events=[...await storage.list({prefix:'notabenda/',limit:10000})].filter(([key])=>key.includes('/events/'));
  assert.ok(events.length>30);
  const next=new DemoWorkspace(state,env);
  for(const section of ['agreements','contracts','history','choices']){
   const result=await next.fetch(new Request('https://example.test/demo/admin/'+section,{headers}));
   assert.equal(result.status,200,await result.clone().text());
  }
  const updated=await storage.get('demo/session');assert.equal(updated.createdAt,session.createdAt);assert.equal(updated.generation,generation);
  for(const [key,value] of events)assert.deepEqual(await storage.get(key),value,key);
  for(const d of Object.values(old.contractActions.definitions))assert.ok(await storage.get('notabenda/contracts/'+d.siteId+'/definitions/'+d.definitionId));
 }finally{await rm(folder,{recursive:true,force:true});}
});
