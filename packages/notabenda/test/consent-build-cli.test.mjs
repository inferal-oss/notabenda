// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,access} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {compileConsentRuntimeConfig,compileLegalDocuments,canonicalJson} from '@notabenda/core/content';
import {createConsentRuntime} from '@notabenda/core/consent';
import {formatConfigSource} from '@notabenda/core/config/document';
import {fixture} from './helpers.mjs';
import {describeIntegration} from '@notabenda/core/integration';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const run=(cwd,...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8',timeout:15000});
async function setup(){const config=await fixture({reviewed:true});config.storage=[];config.services=[{id:'sample-metrics',name:'Usage counts',provider:'Example provider',purposeIds:[config.purposes[0].id],location:'This browser'}];config.consent={purposes:[{id:config.purposes[0].id,scope:'purpose-one'}],services:[{id:'sample-metrics',scope:'service-one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:15};config.private={token:'PRIVATE_CONFIG_SENTINEL'};config.documents.terms.sections[0].paragraphs=['LEGAL_TERMS_BODY_SENTINEL'];return config;}
async function temporary(fn){const cwd=await mkdtemp(join(tmpdir(),'notabenda-consent-build-'));try{await fn(cwd);}finally{await rm(cwd,{recursive:true,force:true});}}

test('CLI builds the same bounded runtime from every config format with explicit evidence modes and separate consent CSS',()=>temporary(async cwd=>{
 const config=await setup(),legal=compileLegalDocuments(config);
 const delivery=describeIntegration().configContract.consentRuntimeBuild;assert.equal(delivery.option,'--consent-runtime local|required');assert.equal(delivery.primaryFactory,'createConsent');assert.equal(delivery.acceptedInput,'ConsentRuntimeConfig');assert.equal(delivery.fullSiteInputAccepted,false);assert.equal(delivery.compilerRunsIn,'build-or-ssr');assert.equal(delivery.requiredAdapterFactory,'requiredConsentEvidence');assert.equal(delivery.evidenceModeHasNoDefault,true);assert.equal(delivery.hostConnectionRequired,true);
 for(const [format,extension] of [['json','json'],['yaml','yaml'],['yaml','yml'],['markdown','md']]){
  const source=await formatConfigSource(config,format,format==='markdown'?'\nPRIVATE_BODY_SENTINEL\n':'');await writeFile(join(cwd,'site.'+extension),source);
  for(const mode of ['local','required']){
   const out='build-'+extension+'-'+mode,result=run(cwd,'build','--config','site.'+extension,'--consent-runtime',mode,'--out-dir',out);assert.equal(result.status,0,result.stderr);
   const text=await readFile(join(cwd,out,'consent-runtime.json'),'utf8'),descriptor=JSON.parse(text);assert.equal(text,canonicalJson(compileConsentRuntimeConfig(config,{evidence:mode}))+'\n');assert.equal(descriptor.mode,'production');assert.equal(descriptor.evidence,mode);await assert.rejects(access(join(cwd,out,'consent-notice.json')));assert.doesNotMatch(text,/PRIVATE_CONFIG_SENTINEL|PRIVATE_BODY_SENTINEL|LEGAL_TERMS_BODY_SENTINEL|controller|rightsCenter/);
   assert.equal(await readFile(join(cwd,out,'assets/notabenda-consent.css'),'utf8'),await readFile(new URL('../dist/consent.css',import.meta.url),'utf8'));
   assert.equal(await readFile(join(cwd,out,'notabenda.manifest.json'),'utf8'),canonicalJson(legal.manifest)+'\n');
   assert.match(result.stdout,new RegExp('Consent runtime: '+mode+' evidence mode'));
  }
 }
}));

test('local runtime needs an explicit grant, while required output cannot silently become local',()=>temporary(async cwd=>{
 const config=await setup();await writeFile(join(cwd,'site.json'),JSON.stringify(config));
 for(const evidence of ['local','required']){
  const result=run(cwd,'build','--config','site.json','--consent-runtime',evidence,'--out-dir',evidence);assert.equal(result.status,0,result.stderr);const descriptor=JSON.parse(await readFile(join(cwd,evidence,'consent-runtime.json'),'utf8'));
  if(evidence==='required'){let reads=0;const environment={get storage(){reads++;throw Error('must not read');}};assert.throws(()=>createConsentRuntime(descriptor,environment),/Required consent evidence needs an adapter/);assert.equal(reads,0);continue;}
  const values=new Map(),controller=createConsentRuntime(descriptor,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}});let starts=0,stops=0;
  controller.registerService('sample-metrics',{purposes:[config.purposes[0].id],start(){starts++;return ()=>{stops++;};}});await controller.settled();assert.equal(starts,0);controller.acceptAll();await controller.settled();assert.equal(starts,1);controller.rejectAll();await controller.settled();assert.equal(stops,1);assert.equal(controller.isServiceAllowed('sample-metrics'),false);controller.destroy();
 }
}));

test('default output is unchanged; existing runtime output requires an explicit mode on every rebuild',()=>temporary(async cwd=>{
 const config=await setup();await writeFile(join(cwd,'site.json'),JSON.stringify(config));let result=run(cwd,'build','--config','site.json','--out-dir','ordinary');assert.equal(result.status,0,result.stderr);await assert.rejects(access(join(cwd,'ordinary','consent-runtime.json')));await assert.rejects(access(join(cwd,'ordinary','assets/notabenda-consent.css')));
 result=run(cwd,'build','--config','site.json','--consent-runtime','local','--out-dir','with-runtime');assert.equal(result.status,0,result.stderr);const before=await readFile(join(cwd,'with-runtime','notabenda.public.json'),'utf8'),runtime=await readFile(join(cwd,'with-runtime','consent-runtime.json'),'utf8');config.site.name='Changed site';await writeFile(join(cwd,'site.json'),JSON.stringify(config));result=run(cwd,'build','--config','site.json','--out-dir','with-runtime');assert.equal(result.status,1);assert.match(result.stderr,/already contains consent-runtime.json/);assert.equal(await readFile(join(cwd,'with-runtime','notabenda.public.json'),'utf8'),before);assert.equal(await readFile(join(cwd,'with-runtime','consent-runtime.json'),'utf8'),runtime);
 result=run(cwd,'build','--config','site.json','--consent-runtime','required','--out-dir','with-runtime');assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(await readFile(join(cwd,'with-runtime','consent-runtime.json'),'utf8')).evidence,'required');
}));

test('invalid modes, missing consent, draft production and descriptor bounds fail before any output',()=>temporary(async cwd=>{
 const config=await setup();await writeFile(join(cwd,'site.json'),JSON.stringify(config));
 for(const args of [['build','--consent-runtime','best-effort'],['build','--consent-runtime'],['check','--consent-runtime','local'],['init','--consent-runtime','local'],['wizard','--consent-runtime','required'],['build','--consent-runtime','local','--consent-runtime','required']]){const result=run(cwd,...args,'--config','site.json',...(['build','wizard'].includes(args[0])?['--out-dir','failed']:[]));assert.equal(result.status,1);if(args[0]!=='build')assert.match(result.stderr,/--consent-runtime is only valid for build/);await assert.rejects(access(join(cwd,'failed')));}
 for(const [name,mutate] of [['no-consent',c=>delete c.consent],['draft',c=>c.documents.cookies.review.status='draft'],['oversized-runtime',c=>{for(let i=0;i<257;i++)c.services.push({...c.services[0],id:'extra-service-'+i});}],['unknown-field',c=>c.conset={}]]){const value=structuredClone(config);mutate(value);await writeFile(join(cwd,name+'.json'),JSON.stringify(value));const result=run(cwd,'build','--config',name+'.json','--consent-runtime','local','--out-dir',name);assert.equal(result.status,1,result.stdout);await assert.rejects(access(join(cwd,name)));}
 config.documents.cookies.review.status='draft';await writeFile(join(cwd,'draft.json'),JSON.stringify(config));const preview=run(cwd,'build','--preview','--config','draft.json','--consent-runtime','local','--out-dir','preview');assert.equal(preview.status,0,preview.stderr);assert.equal(JSON.parse(await readFile(join(cwd,'preview','consent-runtime.json'),'utf8')).mode,'preview');
}));
