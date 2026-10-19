// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
// @requirements REQ-PRODUCT-CF-DOCTOR
// @requirements REQ-GOOGLE-MODE
// @requirements REQ-PRODUCT-FORM-PERMISSIONS
// @requirements REQ-PRODUCT-RIGHTS-CENTER
// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-DISCOVERY
// @requirements REQ-PRODUCT-EVIDENCE-EXPORT
// @requirements REQ-PRODUCT-COLLECTION-NOTICE
// @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-STORAGE-CLEANUP
// @requirements REQ-PRODUCT-RETAINED-RELEASES
// @requirements REQ-PRODUCT-CF-STARTER
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-EMBEDS
test('packed npm tarball installs offline and exposes API, CLI, types, CSS and Apache license', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'notabenda-package-'));
  const root = fileURLToPath(new URL('../../..', import.meta.url));
  const env = { ...process.env, npm_config_cache: join(cwd, 'cache'), npm_config_update_notifier: 'false' };
  const npm = (...args) => spawnSync('npm', args, { cwd, encoding: 'utf8', env });
  try {
    const packed = spawnSync('npm', ['pack', '--workspace', 'notabenda', '--workspace', 'notabenda-cf', '--json', '--ignore-scripts', '--pack-destination', cwd], { cwd: root, encoding: 'utf8', env });
    assert.equal(packed.status, 0, packed.stderr);
    const packages = JSON.parse(packed.stdout);
    const manifest = packages.find(p => p.name === 'notabenda');
    assert.equal(packages.length, 2);
    for (const item of packages) {
      assert.ok(item.files.some(f => f.path === 'LICENSE'));
      assert.ok(item.files.some(f => f.path === 'README.md'));
    }
    assert.ok(manifest.files.some(f => f.path === 'LICENSE'));
    assert.ok(manifest.files.some(f => f.path === 'README.md'));
    assert.ok(manifest.files.some(f => f.path === 'dist/styles.css'));
    assert.ok(manifest.files.some(f=>f.path==='dist/consent.css'));
    assert.ok(manifest.files.some(f=>f.path==='dist/headless.js'));
    const headlessPackage=JSON.parse(await readFile(join(root,'packages/notabenda/package.json'),'utf8'));assert.equal(headlessPackage.exports['./consent.css'],'./dist/consent.css');
    assert.equal(manifest.files.some(f => /(?:test|regulatory|notabenda.config)/.test(f.path)), false);
    await writeFile(join(cwd, 'package.json'), '{"private":true,"type":"module"}');
    const installed = npm('install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', ...packages.map(item => join(cwd, item.filename)));
    assert.equal(installed.status, 0, installed.stderr);
    const installedPackage = JSON.parse(await readFile(join(cwd, 'node_modules/notabenda/package.json'), 'utf8'));
    assert.equal(installedPackage.license, 'Apache-2.0');
    assert.equal(Object.keys(installedPackage.dependencies ?? {}).length, 0);
    await assert.rejects(readFile(join(cwd,'node_modules/react/package.json'),'utf8'),error=>error.code==='ENOENT');
    await assert.rejects(readFile(join(cwd,'node_modules/astro/package.json'),'utf8'),error=>error.code==='ENOENT');
    const cfPackage = JSON.parse(await readFile(join(cwd, 'node_modules/notabenda-cf/package.json'), 'utf8'));
    assert.equal(cfPackage.license, 'Apache-2.0');
    assert.equal(Object.keys(cfPackage.dependencies ?? {}).length, 0);
    assert.equal(cfPackage.bin['notabenda-cf'],'./bin/notabenda-cf.mjs');
    const cfManifest=packages.find(item=>item.name==='notabenda-cf');assert.ok(cfManifest.files.some(file=>file.path==='templates/src/worker.mjs'));assert.ok(cfManifest.files.some(file=>file.path==='bin/notabenda-cf.mjs'));
    const cfInit=spawnSync(process.execPath,[join(cwd,'node_modules/notabenda-cf/bin/notabenda-cf.mjs'),'init','--out-dir',join(cwd,'backend'),'--site-id','packed-preview'],{cwd,encoding:'utf8'});assert.equal(cfInit.status,0,cfInit.stderr);
    const generated=JSON.parse(await readFile(join(cwd,'backend/wrangler.json'),'utf8'));assert.equal(generated.assets.run_worker_first,true);assert.equal(generated.exports.EvidenceWorkspace.storage,'sqlite');
    const generatedAuth=await import(pathToFileURL(join(cwd,'backend/src/authorize.mjs')));assert.equal(await generatedAuth.authorizeHostRequest(new Request('https://example.test/'),{}),null);
    const cfDoctor=spawnSync(process.execPath,[join(cwd,'node_modules/notabenda-cf/bin/notabenda-cf.mjs'),'doctor','--directory',join(cwd,'backend'),'--json'],{cwd,encoding:'utf8'});assert.equal(cfDoctor.status,1,cfDoctor.stderr);const doctorReport=JSON.parse(cfDoctor.stdout);assert.equal(doctorReport.productionReadiness,'not-assessed');assert.equal(doctorReport.checks.find(item=>item.id==='AUTHORIZATION').status,'error');assert.ok(cfManifest.files.some(file=>file.path==='bin/doctor.mjs'));
    const headlessImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createConsent} from 'notabenda/headless';import {createConsent as legacy} from 'notabenda';if(createConsent!==legacy)process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(headlessImport.status,0,headlessImport.stderr);
    const runtimeImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createConsentRuntime,mountControls} from 'notabenda/consent';import {requiredConsentEvidence} from 'notabenda/consent/evidence';import {compileConsentRuntimeConfig} from 'notabenda/content';if([createConsentRuntime,mountControls,requiredConsentEvidence,compileConsentRuntimeConfig].some(f=>typeof f!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(runtimeImport.status,0,runtimeImport.stderr);
    // @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION
    for(const file of ['dist/catalog-plain.js','dist/catalog-selection.js','dist/catalog-ui.js','dist/service-directory.js','dist/services.css','dist/astro/ServiceDirectory.astro','dist/catalog-data.json','dist/catalog/schema.json','dist/catalog/NOTICE.txt','dist/catalog/open-cookie-database-LICENSE.txt'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const catalogImport=spawnSync(process.execPath,['--input-type=module','-e',"import {normalizeServiceCatalog,searchServiceCatalog} from 'notabenda/catalog';import {serviceCatalogSeed} from 'notabenda/catalog/seed';import {scanProjectServices} from 'notabenda/catalog/project';if(normalizeServiceCatalog(serviceCatalogSeed).providers.length!==363||!searchServiceCatalog(serviceCatalogSeed,'email',{delivery:'backend'}).length||typeof scanProjectServices!=='function')process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(catalogImport.status,0,catalogImport.stderr);
    const catalogCli=spawnSync(process.execPath,[join(cwd,'node_modules/notabenda/dist/cli.js'),'catalog','search','stripe','--delivery','backend','--json'],{cwd,encoding:'utf8'});assert.equal(catalogCli.status,0,catalogCli.stderr);assert.equal(JSON.parse(catalogCli.stdout).results[0].product.id,'stripe-payments');
    for(const file of ['dist/setup-purpose.js','dist/setup-purpose-ui.js','dist/setup-purpose-cli.js'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const setupImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createSetupPlan} from 'notabenda/setup';import {mountSetup} from 'notabenda/setup/ui';import {createPurposeDraftPlan,normalizeDraftPurpose} from 'notabenda/setup/purposes';import {mountPurposeEditor} from 'notabenda/setup/purposes/ui';import {registerStorageService} from 'notabenda';import {createSetupWorker} from 'notabenda-cf';if([mountSetup,createPurposeDraftPlan,normalizeDraftPurpose,mountPurposeEditor,registerStorageService,createSetupWorker].some(f=>typeof f!=='function')||createSetupPlan({schemaVersion:1,markets:[],answers:{}}).report.productionReady!==false)process.exit(1)"],{cwd,encoding:'utf8'});assert.equal(setupImport.status,0,setupImport.stderr);
    const imported = spawnSync(process.execPath, ['--input-type=module', '-e', "import {validateSiteConfig, createTermsAcceptance, mountTermsAcceptance, createEmbedService, renderEmbedPlaceholder, hasGlobalPrivacyControl, getPrivacySignalRestrictions, createProcessingChoices, mountProcessingChoices} from 'notabenda'; import {compileLegalDocuments, createTermsOffer, createRetainedReleaseFiles} from 'notabenda/content'; import {createAdminWorker, recordTermsAcceptance, createTermsAcceptanceStore} from 'notabenda-cf'; if(validateSiteConfig(null).valid || [hasGlobalPrivacyControl,getPrivacySignalRestrictions,createProcessingChoices,mountProcessingChoices,createEmbedService,renderEmbedPlaceholder,compileLegalDocuments,createTermsOffer,createRetainedReleaseFiles,createTermsAcceptance,mountTermsAcceptance,recordTermsAcceptance,createTermsAcceptanceStore].some(value=>typeof value !== 'function') || typeof createAdminWorker({authorize:()=>null}).fetch !== 'function') process.exit(1)"], { cwd, encoding: 'utf8' });
    assert.equal(imported.status, 0, imported.stderr);
    const cli = spawnSync(process.execPath, [join(cwd, 'node_modules/notabenda/dist/cli.js'), '--help'], { cwd, encoding: 'utf8' });
    assert.equal(cli.status, 0, cli.stderr);
    await writeFile(join(cwd, 'consumer.ts'), "import {defineSite, type SiteConfig, renderLegalDocument, createTermsAcceptance, createEmbedService, type ConsentController} from 'notabenda';\nimport {compileLegalDocuments, createTermsOffer, createRetainedReleaseFiles} from 'notabenda/content';\nimport {createAdminWorker, recordLegalRelease, registerTermsOffer, setActiveTermsOffer, recordTermsAcceptance, createTermsAcceptanceStore, type HistoryStorage} from 'notabenda-cf';\ndeclare const config: SiteConfig;\ndeclare const storage: HistoryStorage;\nconst release = compileLegalDocuments(defineSite(config));\nrenderLegalDocument(release.publicConfig, 'privacy');\nrecordLegalRelease(storage, release.artifact);\ncreateAdminWorker({authorize: () => null});\nconst offer = createTermsOffer(release.artifact, {scopeId:'signup',statement:'I agree to these sample terms.',actionLabel:'Record agreement'});\nconst scope = {siteId:config.site.id,scopeId:'signup'};\nregisterTermsOffer(storage,offer,scope);\nsetActiveTermsOffer(storage,offer.offerId,scope);\ncreateTermsAcceptance(offer,{operationId:'operation-one',submit:body=>recordTermsAcceptance(storage,body,{...scope,subjectId:'subject-one',operationId:'operation-one'})});\ncreateTermsAcceptanceStore(storage,scope);\ndeclare const consent: ConsentController;\nconst media = createEmbedService({consent,serviceId:'optional-media'});\ndeclare const container: HTMLElement;\nmedia.mount(container,{kind:'image',src:'/image.svg',title:'Image',description:'Fictional',alt:'Alternative'});\n// @ts-expect-error image requires alternative text\nmedia.mount(container,{kind:'image',src:'/image.svg',title:'Image',description:'Fictional'});\n// @ts-expect-error unknown document kind\nrenderLegalDocument(config, 'unknown');\n");
    await writeFile(join(cwd, 'consumer.ts'), await readFile(join(cwd, 'consumer.ts'),'utf8') + `
import {normalizeServiceCatalog, searchServiceCatalog, createCatalogServiceDraft, type ServiceCatalog} from 'notabenda/catalog';
import {serviceCatalogSeed} from 'notabenda/catalog/seed';
import {createCatalogSelectionPlan,readSetupCatalogSelections} from 'notabenda/catalog/selection';
import {mountCatalogPicker} from 'notabenda/catalog/ui';
import {createPurposeDraftPlan,normalizeDraftPurpose,type PurposeDraftChange} from 'notabenda/setup/purposes';
import {mountPurposeEditor} from 'notabenda/setup/purposes/ui';
const purposeChange:PurposeDraftChange={action:'add',purpose:normalizeDraftPurpose(config.purposes[0])};
createPurposeDraftPlan(config,purposeChange);mountPurposeEditor(container,{getConfig:()=>config,onChange:plan=>plan.config});
// @ts-expect-error purpose removal must carry the previously reviewed purpose facts
createPurposeDraftPlan(config,{action:'remove',purposeId:'support'});
const selected=createCatalogSelectionPlan(config,serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:['checkout'],provider:'Selected entity',location:'Selected region',justification:'Reviewed actual use',confirmed:true});
readSetupCatalogSelections(selected);mountCatalogPicker(container,{catalog:serviceCatalogSeed,getConfig:()=>config,onSelect:result=>result.config});
import {createServiceDirectory,renderServiceDirectory,mountServiceDirectory} from 'notabenda/services';
createServiceDirectory(config);renderServiceDirectory(config,{idPrefix:'services'});mountServiceDirectory(container,config,{idPrefix:'services'});
import {scanProjectServices} from 'notabenda/catalog/project';
const catalog:ServiceCatalog=normalizeServiceCatalog(serviceCatalogSeed);
searchServiceCatalog(catalog,'stripe',{delivery:'backend'});
createCatalogServiceDraft(catalog,'stripe-payments',{id:'payments',purposeIds:['checkout'],location:'Selected host location'});
scanProjectServices('.',catalog);
// @ts-expect-error unknown catalog filter
searchServiceCatalog(catalog,'stripe',{delivery:'automatic'});
import {createProcessingChoices, mountProcessingChoices} from 'notabenda';
import {createProcessingNotice} from 'notabenda/content';
import {registerProcessingNotice,recordProcessingRestriction,getProcessingHead,createProcessingRestrictionStore} from 'notabenda-cf';
const notice=createProcessingNotice(release.artifact,{scopeId:'privacy-choices',activities:['sale'],wording:{title:'Privacy choices',description:'Fictional choice',actionLabel:'Opt out'}});
registerProcessingNotice(storage,notice,{siteId:notice.siteId});
const processingContext={siteId:notice.siteId,scopeId:notice.scopeId,streamId:'opaque-context'};
getProcessingHead(storage,processingContext);
const processing=createProcessingChoices(notice,{streamRef:'a'.repeat(64),read:()=>getProcessingHead(storage,processingContext),submit:body=>recordProcessingRestriction(storage,body,{...processingContext,provenance:'explicit-opt-out'})});
mountProcessingChoices(container,processing);
createProcessingRestrictionStore(storage,{siteId:notice.siteId});
const retained=createRetainedReleaseFiles([release.artifact],{siteId:config.site.id});
// @ts-expect-error retained publication needs an explicit site
createRetainedReleaseFiles([release.artifact],{});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {createFormPermission,mountFormPermission,createIndexedDBFormPermissionJournal,type FormPermissionJournal,type FormPermissionResult} from 'notabenda';\nimport {createFormPermissionOffer} from 'notabenda/content';\nimport {recordFormPermission,getFormPermissionState,formPermissionStreamRef,type FormPermissionResult as StoredFormPermissionResult} from 'notabenda-cf';\nconst permissionTypes=(result:StoredFormPermissionResult):FormPermissionResult=>result;\ndeclare const journal:FormPermissionJournal;\nvoid [createIndexedDBFormPermissionJournal,journal,createFormPermission,mountFormPermission,createFormPermissionOffer,recordFormPermission,getFormPermissionState,formPermissionStreamRef,permissionTypes];\n`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {createConsent as createHeadlessConsent,type ConsentController as HeadlessConsentController} from 'notabenda/headless';\nconst headlessController:HeadlessConsentController=createHeadlessConsent(config);\nimport {createSetupPlan,readSetupAnswers,type SetupAnswers} from 'notabenda/setup';\nimport {mountSetup} from 'notabenda/setup/ui';\nimport {registerStorageService} from 'notabenda';\nimport {createSetupWorker} from 'notabenda-cf';\nconst setupAnswers:SetupAnswers={schemaVersion:1,markets:[],answers:{}};\nconst setupPlan=createSetupPlan(readSetupAnswers(setupAnswers),{config});\nmountSetup(container,{answers:setupPlan.report});\nregisterStorageService({consent,serviceId:'sample',targets:[{storageId:'sample-storage'}],start:()=>()=>{}});\ncreateSetupWorker({authorize:()=>true,scriptUrl:'/assets/setup.mjs',stylesheetUrl:'/assets/notabenda.css'});\n`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {renderCollectionNotice,collectionNoticeIds,type CollectionNotice} from 'notabenda';\nimport {createCollectionNotice} from 'notabenda/content';\nconst collectionNotice:CollectionNotice=createCollectionNotice(release.artifact,{scopeId:'contact',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'About your message',intro:'Fictional context.'}});\nrenderCollectionNotice(collectionNotice,{idPrefix:collectionNoticeIds('contact').rootId,headingLevel:3});\n// @ts-expect-error no h1 or implied acceptance mode\nrenderCollectionNotice(collectionNotice,{idPrefix:'contact',headingLevel:1});\n`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createEvidenceExportSegment,type RecordStore,type EvidenceExportSegment} from 'notabenda-cf';
declare const authorizedStore:RecordStore;
const exported:EvidenceExportSegment=await createEvidenceExportSegment(authorizedStore,{query:'',kind:'',keyPrefix:'',from:'',to:'',limit:25},{scopeLabel:'Authorized scope'});
createAdminWorker({authorize:()=>({store:authorizedStore,allowExport:true})});
// @ts-expect-error export permission requires a boolean
createAdminWorker({authorize:()=>({store:authorizedStore,allowExport:'yes'})});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {captureDiscovery,analyzeDiscovery,type DiscoveryCapture} from 'notabenda/discovery';
import {mountDiscovery} from 'notabenda/discovery/ui';
const capture:DiscoveryCapture=captureDiscovery({routeLabel:'Public landing',scenario:'Initial load'});
analyzeDiscovery(config,[capture]);
mountDiscovery(container,{config});
// @ts-expect-error explicit scenario label required
captureDiscovery({routeLabel:'Public landing'});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createEvidenceLifecycle,createEvidenceLifecycleStore,EvidenceLifecycleError,type LifecycleStorage,type EvidenceLifecycleState} from 'notabenda-cf';
import {ConsentEvidenceError,ProcessingChoicesError,TermsAcceptanceError} from 'notabenda';
declare const lifecycleStorage:LifecycleStorage;
const lifecycle=await createEvidenceLifecycle(lifecycleStorage,{family:'consent',siteId:'site-one',scopeId:'cookie-choices',streamId:'host-resolved'});
const retirement:EvidenceLifecycleState=await lifecycle.retire({requestId:crypto.randomUUID(),reason:'retention-expired',eligibleAt:new Date().toISOString(),legalHold:false});
await lifecycle.restore(retirement);
await lifecycle.purge({requestId:retirement.retirement!.requestId,legalHold:false,limit:50});
createEvidenceLifecycleStore(lifecycleStorage,{family:'consent',siteId:'site-one'});
new EvidenceLifecycleError('context-retired');new ConsentEvidenceError('context-retired');new ProcessingChoicesError('context-retired');new TermsAcceptanceError('context-retired');
// @ts-expect-error whole-subject terms target has no scope selector
createEvidenceLifecycle(lifecycleStorage,{family:'terms',siteId:'site-one',subjectId:'resolved',scopeId:'scope'});
// @ts-expect-error cannot override a hold with a truthy decision
lifecycle.purge({requestId:crypto.randomUUID(),legalHold:true});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {evaluateScopeGuards,ScopeGuardError,type ScopeGuardPolicy,type ScopeGuardDecision} from 'notabenda';
const guards:ScopeGuardPolicy={version:1,revision:'assessment-2',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'unknown',regulatedSector:'absent'}};
const guardConfig={...config,scopeGuards:guards};const decision:ScopeGuardDecision=evaluateScopeGuards(guardConfig);new ScopeGuardError(decision.blockedPurposeIds);
// @ts-expect-error a review boolean cannot override a scope guard
const invalidGuard:ScopeGuardPolicy={...guards,reviewed:true};
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {renderRightsCenter,renderRightsPage,type RightsCenterConfig,type RightsActionKind} from 'notabenda';
declare const rightsCenter:RightsCenterConfig;
const rightsAction:RightsActionKind='appeal';
renderRightsCenter({...config,rightsCenter},{idPrefix:'account-rights',headingLevel:3});renderRightsPage({...config,rightsCenter});
// @ts-expect-error this is navigation, not an identity/fulfillment engine
const invalidRightsAction:RightsActionKind='verified-deletion';
// @ts-expect-error preserve room for each action's subordinate heading
renderRightsCenter({...config,rightsCenter},{headingLevel:6});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {registerGoogleBasic,createGoogleBasicBrowserEnvironment,type GoogleBasicSnapshot} from 'notabenda/google';
import {type GoogleBasicConfig} from 'notabenda';
const googleConfig:GoogleBasicConfig={version:1,tagIds:['G-TEST1234'],signals:{analytics_storage:['measurement'],ad_storage:[],ad_user_data:[],ad_personalization:[]}};
const google=registerGoogleBasic({consent,serviceId:'measurement'},createGoogleBasicBrowserEnvironment({document:container.ownerDocument}));
const googleState:GoogleBasicSnapshot=google.getSnapshot();google.event('page_view',{page_title:'Reviewed page'});
// @ts-expect-error no arbitrary gtag config interface
google.config('AW-12345',{});
// @ts-expect-error all four signals are explicit
const incompleteGoogle:GoogleBasicConfig={...googleConfig,signals:{analytics_storage:['measurement']}};
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createContractAction, mountContractAction, type ContractActionDefinition} from 'notabenda/contracts';
import {createContractActionDefinition} from 'notabenda/content';
import {registerContractActionDefinition, recordContractDeclaration, claimContractDelivery, settleContractDelivery, createContractDeclarationStore, dispatchContractDelivery, dispatchContractDeclaration} from 'notabenda-cf';
const contractDefinition=createContractActionDefinition(release.artifact,{actionId:'contract-withdrawal',revision:'one',profile:'eu-withdrawal',reviewStatus:'reviewed'});
const action=createContractAction(contractDefinition,{operationRef:'a'.repeat(64),submit:async()=>({})});
mountContractAction(container,{action});
registerContractActionDefinition(storage,contractDefinition,{siteId:config.site.id});
createContractDeclarationStore(storage,{siteId:config.site.id});
const dispatchContext={siteId:config.site.id,actionId:'contract-withdrawal'};
const dispatchResult=dispatchContractDeclaration(storage,'a'.repeat(64),dispatchContext,{acknowledgement:{deliver:async({lease,signal})=>({providerRef:lease.deliveryId})},application:{deliver:async({lease})=>({providerRef:lease.deliveryId})}});
dispatchContractDelivery(storage,'a'.repeat(64),'acknowledgement',dispatchContext,{deliver:async()=>({providerRef:'provider-accepted'})});
// @ts-expect-error callback must return an explicit provider reference
dispatchContractDelivery(storage,'a'.repeat(64),'application',dispatchContext,{deliver:async()=>true});
// @ts-expect-error both independent destinations must be configured
dispatchContractDeclaration(storage,'a'.repeat(64),dispatchContext,{application:{deliver:async()=>({providerRef:'accepted'})}});
// @ts-expect-error no universal contract profile
createContractActionDefinition(release.artifact,{actionId:'contract-withdrawal',revision:'one',profile:'universal',reviewStatus:'reviewed'});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createConsentRuntime,mountControls as mountCompiledControls,type ConsentRuntimeInventory} from 'notabenda/consent';
import {requiredConsentEvidence,type ConsentEvidenceOptions} from 'notabenda/consent/evidence';
import {compileConsentRuntimeConfig} from 'notabenda/content';
const runtimeConfig=compileConsentRuntimeConfig(config,{evidence:'local'});
const smallController=createConsentRuntime(runtimeConfig);
const smallInventory:ConsentRuntimeInventory=smallController.getConfig();
mountCompiledControls(container,{consent:smallController});
createEmbedService({consent:smallController,serviceId:'sample'});
registerStorageService({consent:smallController,serviceId:'sample',targets:[{storageId:'sample-storage'}],start:()=>()=>{}});
declare const requiredOptions:ConsentEvidenceOptions;
createConsentRuntime(runtimeConfig,undefined,{evidence:requiredConsentEvidence(requiredOptions)});
// @ts-expect-error runtime inventory deliberately omits operator contacts
smallInventory.controller.email;
// @ts-expect-error required mode cannot be silently chosen by omission
compileConsentRuntimeConfig(config,{});
// @ts-expect-error arbitrary objects cannot replace the required receipt adapter
createConsentRuntime(runtimeConfig,undefined,{evidence:{}});
`);
    const types = spawnSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--strict', '--noEmit', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', join(cwd, 'consumer.ts')], { cwd, encoding: 'utf8' });
    assert.equal(types.status, 0, types.stdout + types.stderr);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

// @requirements REQ-PRODUCT-PACKAGE
test('browser/SSR entry graph has no Node imports or runtime framework dependencies', async () => {
  const seen = new Set();
  async function walk(url) {
    if (seen.has(url.href)) return;
    seen.add(url.href);
    const code = await readFile(url, 'utf8');
    assert.doesNotMatch(code, /(?:from|import)\s*['"](?:node:|react|cloudflare:)/);
    for (const match of code.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)) if (match[1].startsWith('.')) await walk(new URL(match[1], url));
  }
  await walk(new URL('../dist/index.js', import.meta.url));
  await walk(new URL('../dist/discovery-ui.js', import.meta.url));
  assert.ok(seen.size >= 3);
});
