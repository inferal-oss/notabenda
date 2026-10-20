// @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-CF-HISTORY REQ-PRODUCT-RETAINED-RELEASES REQ-PRODUCT-AUTHORING REQ-EU-INTERESTS-DISCLOSURE
import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm,stat,symlink} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
import {attachCatalogReview} from 'notabenda/catalog/release';import {serviceCatalogSeed} from 'notabenda/catalog/seed';import {createCatalogSelectionPlan} from 'notabenda/catalog/selection';import {createSetupPlan} from 'notabenda/setup';
import {compileLegalDocuments,createRetainedReleaseFiles,canonicalJson,sha256,createTermsOffer} from 'notabenda/content';import {compileAuthoredDocuments} from 'notabenda-authoring';
import {recordLegalRelease,createDocumentHistory,validateLegalSourceArchive,createAdminWorker} from 'notabenda-cf';import {validateLegalArtifact,validateStoredLegalRelease} from '../../notabenda-cf/dist/history.js';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';import {fixture} from './helpers.mjs';
const selected=async()=>createCatalogSelectionPlan(await fixture({reviewed:true}),serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Explicit entity',location:'Selected region',justification:'PRIVATE_JUSTIFICATION_SENTINEL',confirmed:true});

test('selected provider review archives preserve public interests and independently reject an omitted statement',async()=>{
 const c=await fixture({reviewed:true});c.purposes[0].legitimateInterests='Our interest is to protect the support inbox from abuse.';
 const {config,selection}=createCatalogSelectionPlan(c,serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Explicit entity',location:'Selected region',justification:'PRIVATE_ASSESSMENT',confirmed:true});
 const finalized=attachCatalogReview(compileLegalDocuments(config,{mode:'preview'}),[selection]);
 assert.equal(finalized.archive.catalogReview.selections[0].purposes[0].legitimateInterests,c.purposes[0].legitimateInterests);
 assert.doesNotMatch(JSON.stringify(finalized.archive.catalogReview),/PRIVATE_ASSESSMENT/);
 const storage=createSyntheticStorage([]);await recordLegalRelease(storage,finalized.archive);
 const store=createDocumentHistory(storage),worker=createAdminWorker({basePath:'/admin',authorize:()=>({store,allowCatalogReview:true})});
 const response=await worker.fetch(new Request('https://example.test/admin/catalog-review?id='+finalized.manifest.artifactId),{});assert.equal(response.status,200);assert.match(await response.text(),/Legitimate interests<\/dt><dd>Our interest is to protect the support inbox from abuse\./);
 const forged=structuredClone(selection);delete forged.purposes[0].legitimateInterests;
 assert.throws(()=>attachCatalogReview(compileLegalDocuments(config,{mode:'preview'}),[forged]));
});
const query={query:'',kind:'',keyPrefix:'',from:'',to:'',limit:25};
const request=path=>new Request('https://example.test/admin'+path);
async function pair(){const {config,selection}=await selected();selection.reference.sources[0].note+=' RETAINED_REFERENCE_ONLY_SENTINEL';const base=compileLegalDocuments(config,{mode:'preview'}),first=attachCatalogReview(base,[selection]);const later=structuredClone(selection);later.reference.revision+='-new';return {config,selection,base,first,latest:attachCatalogReview(base,[later])};}

test('finalization binds selected facts without changing legal bytes or publishing private notes, seeds or questionnaires',async()=>{
 const {config,selection,base,first,latest}=await pair(),original=structuredClone(base);assert.notEqual(first.manifest.artifactId,base.manifest.artifactId);assert.notEqual(first.manifest.artifactId,latest.manifest.artifactId);assert.deepEqual(base,original);
 assert.deepEqual(first.artifact.pages,base.artifact.pages);assert.deepEqual(first.manifest.documents,base.manifest.documents);assert.deepEqual(first.publicConfig,base.publicConfig);assert.equal(first.manifest.catalogReview.sha256,sha256(canonicalJson(first.archive.catalogReview)));assert.equal(first.manifest.catalogReview.selectionCount,1);
 assert.equal(first.archive.catalogReview.selections[0].reference.products.length,1);assert.deepEqual(first.archive.catalogReview.selections[0].reference.products[0].identifiers,[]);
 assert.doesNotMatch(JSON.stringify(first),/PRIVATE_JUSTIFICATION_SENTINEL/);for(const value of Object.values(first.files))assert.doesNotMatch(value,/catalog-release-review|operator-confirmed|catalogSelections|private-setup-report|justification/);
 assert.equal(Object.hasOwn(first.files,`artifacts/${base.manifest.artifactId}.json`),false);assert.equal(createTermsOffer(first.artifact,{scopeId:'join',statement:'I agree',actionLabel:'Agree'},{mode:'preview'}).artifactId,first.manifest.artifactId);
 const noteOnly=structuredClone(selection);noteOnly.justification='Another private reason';assert.equal(attachCatalogReview(base,[noteOnly]).manifest.artifactId,first.manifest.artifactId);assert.throws(()=>attachCatalogReview(first,[selection]),/fresh/);
 await validateLegalArtifact(first.artifact);await validateLegalSourceArchive(first.archive);const retained=createRetainedReleaseFiles([base.artifact,first.artifact,latest.artifact],{siteId:config.site.id,mode:'preview'});assert.equal(retained[`artifacts/${first.manifest.artifactId}/terms.html`],base.artifact.pages['terms/index.html']);
 for(const name of ['catalog-profile.ts','catalog-reference.ts','catalog-plain.ts','catalog-release-policy.ts'])assert.equal(await readFile(new URL('../src/'+name,import.meta.url),'utf8'),await readFile(new URL('../../notabenda-cf/src/'+name,import.meta.url),'utf8'));
});

test('stale or unrelated pins, duplicate services and private attachment changes fail before archival',async()=>{
 const {config,selection,base,first}=await pair();
 for(const change of [c=>c.services.at(-1).name='Changed',c=>c.services.at(-1).provider='Changed',c=>c.services.pop(),c=>c.purposes[0].retention='Changed']){const c=structuredClone(config);change(c);assert.throws(()=>attachCatalogReview(compileLegalDocuments(c,{mode:'preview'}),[selection]));}
 assert.throws(()=>attachCatalogReview(base,[selection,selection]));assert.throws(()=>attachCatalogReview(base,[]));
 await assert.rejects(validateLegalSourceArchive(first.artifact),/catalog review/);
 for(const mutate of [a=>delete a.catalogReview,a=>a.catalogReview.selections[0].reference.revision+='tampered',a=>a.catalogReview.selections[0].justification='PRIVATE_SENTINEL',a=>a.catalogReview.selections[0].service.provider='Changed',a=>a.catalogReview.selections[0].purposes[0].retention='Changed']){const a=structuredClone(first.archive);mutate(a);await assert.rejects(validateLegalSourceArchive(a));}
 await assert.rejects(validateLegalSourceArchive({schemaVersion:1,artifact:base.artifact,sourceAttachments:{},catalogReview:first.archive.catalogReview}));
 const storage=createSyntheticStorage([]);assert.deepEqual(await recordLegalRelease(storage,first.archive),{id:first.manifest.artifactId,created:true});assert.deepEqual(await recordLegalRelease(storage,first.archive),{id:first.manifest.artifactId,created:false});await validateStoredLegalRelease(await storage.get('notabenda/releases/'+first.manifest.artifactId));
 await assert.rejects(recordLegalRelease(storage,first.archive,{changeNote:'New metadata'}),/immutable/);await recordLegalRelease(storage,base.artifact);assert.equal(await createDocumentHistory(storage).getCatalogReview(base.manifest.artifactId),undefined);
});

test('authored sources, output and private reviews share one validated immutable archive',async()=>{
 const {config,selection}=await selected();const authored=await compileAuthoredDocuments(config,{terms:{format:'md',source:'---\nkind: terms\ntitle: Authored terms\nroute: /terms\nversion: authored-1\neffectiveDate: 2026-10-19\nsource: supplied\nreview:\n  status: draft\n---\n## Provision\nA retained authored provision.\n'}},{mode:'preview'});
 const result=attachCatalogReview(authored,[selection]);assert.deepEqual(result.archive.sourceAttachments,authored.archive.sourceAttachments);assert.deepEqual(result.artifact.renderedBodies,authored.artifact.renderedBodies);assert.deepEqual(result.fragments,authored.fragments);assert.deepEqual(result.artifact.pages,authored.artifact.pages);await validateLegalSourceArchive(result.archive);const broken=structuredClone(authored);broken.archive.sourceAttachments.terms.source+='changed';assert.throws(()=>attachCatalogReview(broken,[selection]),/sources no longer match/);
 const storage=createSyntheticStorage([]);await recordLegalRelease(storage,result.archive);const store=createDocumentHistory(storage);assert.match((await store.getSource(result.manifest.artifactId,'terms')).data.source,/retained authored/);assert.ok(await store.getCatalogReview(result.manifest.artifactId));
});

test('catalog history permission is independent and ordinary list, detail and export omit attachment facts',async()=>{
 const {first,latest}=await pair(),storage=createSyntheticStorage([]);for(const build of [first,latest])await recordLegalRelease(storage,build.archive);const store=createDocumentHistory(storage);let privateReads=0;const guarded={...store,getCatalogReview:async id=>{privateReads++;return store.getCatalogReview(id);}};
 for(const allowed of [undefined,false,true]){
  const worker=createAdminWorker({basePath:'/admin',authorize:()=>({store:guarded,allowExport:true,...(allowed===undefined?{}:{allowCatalogReview:allowed})})});
  const view=await worker.fetch(request('/catalog-review?id='+first.manifest.artifactId),{});assert.equal(view.status,allowed?200:403);
  if(allowed){const html=await view.text();assert.match(html,/Explicit entity/);assert.match(html,/Selected region/);assert.doesNotMatch(html,/PRIVATE_JUSTIFICATION_SENTINEL/);assert.match(view.headers.get('Cache-Control'),/private/);assert.doesNotMatch(html,/<script/);}
  for(const path of ['/','/record?id='+first.manifest.artifactId,'/export.json']){const response=await worker.fetch(request(path),{});assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/catalog-release-review-record|PRIVATE_JUSTIFICATION_SENTINEL|RETAINED_REFERENCE_ONLY_SENTINEL|catalog-release-review"/);}
 }
 assert.equal(privateReads,1);
 const worker=createAdminWorker({basePath:'/admin',authorize:()=>({store,allowCatalogReview:true})});const comparison=await worker.fetch(request('/catalog-review-diff?before='+first.manifest.artifactId+'&after='+latest.manifest.artifactId),{});assert.equal(comparison.status,200);assert.match(await comparison.text(),/Changed: catalog facts/);
 const diff=await worker.fetch(request('/diff?before='+first.manifest.artifactId+'&after='+latest.manifest.artifactId+'&kind=privacy'),{});assert.equal(diff.status,200);assert.match(await diff.text(),/Selected catalog review changed/);
 for(const path of ['/catalog-review?id=bad','/catalog-review?id='+first.manifest.artifactId+'&id='+first.manifest.artifactId])assert.equal((await worker.fetch(request(path),{})).status,400);
 assert.equal((await worker.fetch(request('/catalog-review?id='+'a'.repeat(64)),{})).status,404);
 assert.equal((await createAdminWorker({basePath:'/admin',authorize:()=>null}).fetch(request('/catalog-review?id='+first.manifest.artifactId),{})).status,403);
 const page=await store.list(query);assert.equal(page.records.length,2);assert.doesNotMatch(JSON.stringify(page),/catalog-release-review"|justification/);
});

test('CLI uses explicit bounded reports and separate exclusive private output, without modifying current config',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'nb-catalog-release-')),cli=new URL('../dist/cli.js',import.meta.url).pathname,{config,selection}=await selected();
 try{
  const report=createSetupPlan({schemaVersion:1,markets:[],answers:{}},{config,catalogSelections:[selection]}).report;await writeFile(join(cwd,'config.json'),JSON.stringify(config));await writeFile(join(cwd,'report.json'),JSON.stringify(report));const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8',timeout:15000});
  const args=['build','--preview','--config','config.json','--catalog-report','report.json','--private-out-dir','private','--out-dir','public'];const result=run(...args);assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/PRIVATE_JUSTIFICATION_SENTINEL/);
  const archive=JSON.parse(await readFile(join(cwd,'private/release.private.json'),'utf8'));await validateLegalSourceArchive(archive);assert.equal((await stat(join(cwd,'private'))).mode&0o777,0o700);assert.equal((await stat(join(cwd,'private/release.private.json'))).mode&0o777,0o600);assert.equal(await readFile(join(cwd,'private/.gitignore'),'utf8'),'*\n');
  assert.doesNotMatch(await readFile(join(cwd,'public/artifacts/'+archive.artifact.manifest.artifactId+'.json'),'utf8'),/catalog-release-review"|justification/);assert.equal(run(...args).status,1);assert.equal(JSON.parse(await readFile(join(cwd,'config.json'),'utf8')).services.at(-1).provider,'Explicit entity');
  for(const [priv,pub] of [['nested/p','nested'],['same','same'],['outer','outer/public']]){const bad=run('build','--preview','--config','config.json','--catalog-report','report.json','--private-out-dir',priv,'--out-dir',pub);assert.equal(bad.status,1);}
  await writeFile(join(cwd,'CaseProbe'),'case');let insensitive=false;try{insensitive=(await readFile(join(cwd,'caseprobe'),'utf8'))==='case';}catch{}
  if(insensitive){const alias=run('build','--preview','--config','config.json','--catalog-report','report.json','--private-out-dir','MixedCase','--out-dir','mixedcase');assert.equal(alias.status,1);await assert.rejects(stat(join(cwd,'mixedcase/release.private.json')));}
  await symlink(join(cwd,'public'),join(cwd,'alias'));assert.equal(run('build','--preview','--config','config.json','--catalog-report','report.json','--private-out-dir','alias/private','--out-dir','public').status,1);await assert.rejects(stat(join(cwd,'public/private')));
  assert.equal(run('check','--preview','--config','config.json','--catalog-report','report.json','--private-out-dir','bad').status,1);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('review snapshots and combined archives reject oversized or hostile input without leaking its contents',async()=>{
 const {config,selection}=await selected();let oversized;
 for(let count=1;count<60;count++){
  const c=structuredClone(config);c.documents.terms.sections=[{id:'budget',heading:'Budget',paragraphs:Array(count).fill('x'.repeat(1000))}];const build=compileLegalDocuments(c,{mode:'preview'});
  const publicBytes=Buffer.byteLength(canonicalJson(build.artifact));if(publicBytes>122*1024&&publicBytes<128*1024){oversized=build;break;}
 }
 assert.ok(oversized);assert.throws(()=>attachCatalogReview(oversized,[selection]));
 const tooLarge=structuredClone(selection);tooLarge.reference.sources[0].note='PRIVATE_OVERSIZED_MARKER'.repeat(2500);assert.throws(()=>attachCatalogReview(compileLegalDocuments(config,{mode:'preview'}),[tooLarge]),error=>!error.message.includes('PRIVATE_OVERSIZED_MARKER'));
 let invoked=0;const hostile={get reference(){invoked++;return selection.reference;}};assert.throws(()=>attachCatalogReview(compileLegalDocuments(config,{mode:'preview'}),[hostile]));assert.equal(invoked,0);
});

test('multiline public purpose facts survive attachment, but non-string collection kinds fail private validation',async()=>{
 const base=await fixture();base.purposes[0].description+='\nSecond paragraph.\tMore context.';
 const {config,selection}=createCatalogSelectionPlan(base,serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Explicit entity',location:'Region',justification:'Private reason',confirmed:true});const build=attachCatalogReview(compileLegalDocuments(config,{mode:'preview'}),[selection]);await validateLegalSourceArchive(build.archive);assert.equal(build.archive.catalogReview.selections[0].purposes[0].description,config.purposes[0].description);
 const malformed=structuredClone(build.archive);malformed.catalogReview.selections[0].purposes[0].collection.source=['direct'];malformed.artifact.publicConfig.purposes[0].collection.source=['direct'];malformed.artifact.manifest.configSha256=sha256(canonicalJson(malformed.artifact.publicConfig));malformed.artifact.manifest.catalogReview.sha256=sha256(canonicalJson(malformed.catalogReview));const {artifactId,...descriptor}=malformed.artifact.manifest;malformed.artifact.manifest.artifactId=sha256(canonicalJson(descriptor));await assert.rejects(validateLegalSourceArchive(malformed));
});
