// @requirements REQ-PRODUCT-PRIVACY-CHOICE-LINK
// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION
// @requirements REQ-PRODUCT-TERMS-HISTORY
// @requirements REQ-PRODUCT-TERMS-AUTHORING
// @requirements REQ-PRODUCT-EMBED-LOCALIZATION
// @requirements REQ-PRODUCT-CONSENT-REHEARSAL
// @requirements REQ-PRODUCT-TERMS-CONNECTION
// @requirements REQ-PRODUCT-CONNECTION-INSPECTION
// @requirements REQ-PRODUCT-STORAGE-AUTHORING
// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
// @requirements REQ-PRODUCT-PRIVACY-PACKS
// @requirements REQ-PRODUCT-CONSENT-AUTHORING
// @requirements REQ-EU-ORDER-ACTION
// @requirements REQ-EU-GUARANTEE-LABEL
// @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE
// @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
// @requirements REQ-PRODUCT-SERVICE-PROFILES
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
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
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
    const packed = spawnSync('npm', ['pack', '--workspace', '@notabenda/core', '--workspace', '@notabenda/cloudflare', '--json', '--ignore-scripts', '--pack-destination', cwd], { cwd: root, encoding: 'utf8', env });
    assert.equal(packed.status, 0, packed.stderr);
    const packages = JSON.parse(packed.stdout);
    const manifest = packages.find(p => p.name === '@notabenda/core');
    assert.equal(packages.length, 2);
    for (const item of packages) {
      assert.ok(item.files.some(f => f.path === 'LICENSE'));
      assert.ok(item.files.some(f => f.path === 'README.md'));
    }
    assert.ok(manifest.files.some(f => f.path === 'LICENSE'));
    assert.ok(manifest.files.some(f => f.path === 'README.md'));
    for(const file of ['dist/privacy-choices-link.js','dist/privacy-choices-link.d.ts','assets/privacy-choices/NOTICE.md','assets/privacy-choices/manifest.json','assets/privacy-choices/privacyoptions.svg'])assert.ok(manifest.files.some(f=>f.path===file),file);
    assert.ok(manifest.files.some(f => f.path === 'dist/styles.css'));
    assert.ok(manifest.files.some(f=>f.path==='dist/consent.css'));
    assert.ok(manifest.files.some(f=>f.path==='dist/headless.js'));
    assert.ok(manifest.files.some(f=>f.path==='dist/paid-order.js'));assert.ok(manifest.files.some(f=>f.path==='dist/orders.css'));assert.ok(manifest.files.some(f=>f.path==='dist/astro/PaidOrderReview.astro'));assert.ok(manifest.files.some(f=>f.path==='dist/guarantee-label.js'));assert.ok(manifest.files.some(f=>f.path==='dist/astro/DurabilityGuaranteeLabel.astro'));assert.ok(!manifest.files.some(f=>/guarantee-label-(?:build|image)/u.test(f.path)));
    const headlessPackage=JSON.parse(await readFile(join(root,'packages/notabenda/package.json'),'utf8'));assert.equal(headlessPackage.exports['./consent.css'],'./dist/consent.css');
    assert.equal(manifest.files.some(f => /(?:test|regulatory|notabenda.config)/.test(f.path)), false);
    await writeFile(join(cwd, 'package.json'), '{"private":true,"type":"module"}');
    const installed = npm('install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', ...packages.map(item => join(cwd, item.filename)));
    assert.equal(installed.status, 0, installed.stderr);
    const installedPackage = JSON.parse(await readFile(join(cwd, 'node_modules/@notabenda/core/package.json'), 'utf8'));
    assert.equal(installedPackage.name,'@notabenda/core');assert.equal(installedPackage.publishConfig.access,'public');assert.deepEqual(Object.keys(installedPackage.bin),['notabenda']);
    assert.equal(installedPackage.license, 'Apache-2.0');
    assert.equal(Object.keys(installedPackage.dependencies ?? {}).length, 0);
    await assert.rejects(readFile(join(cwd,'node_modules/react/package.json'),'utf8'),error=>error.code==='ENOENT');
    await assert.rejects(readFile(join(cwd,'node_modules/astro/package.json'),'utf8'),error=>error.code==='ENOENT');
    const cfPackage = JSON.parse(await readFile(join(cwd, 'node_modules/@notabenda/cloudflare/package.json'), 'utf8'));
    assert.equal(cfPackage.name,'@notabenda/cloudflare');assert.equal(cfPackage.publishConfig.access,'public');
    assert.equal(cfPackage.license, 'Apache-2.0');
    assert.equal(Object.keys(cfPackage.dependencies ?? {}).length, 0);
    assert.equal(cfPackage.bin['notabenda-cf'],'./bin/notabenda-cf.mjs');
    const cfManifest=packages.find(item=>item.name==='@notabenda/cloudflare');assert.ok(cfManifest.files.some(file=>file.path==='templates/src/worker.mjs'));assert.ok(cfManifest.files.some(file=>file.path==='bin/notabenda-cf.mjs'));
    const cfInit=spawnSync(process.execPath,[join(cwd,'node_modules/@notabenda/cloudflare/bin/notabenda-cf.mjs'),'init','--out-dir',join(cwd,'backend'),'--site-id','packed-preview'],{cwd,encoding:'utf8'});assert.equal(cfInit.status,0,cfInit.stderr);
    const generated=JSON.parse(await readFile(join(cwd,'backend/wrangler.json'),'utf8'));assert.equal(generated.assets.run_worker_first,true);assert.equal(generated.exports.EvidenceWorkspace.storage,'sqlite');
    const generatedAuth=await import(pathToFileURL(join(cwd,'backend/src/authorize.mjs')));assert.equal(await generatedAuth.authorizeHostRequest(new Request('https://example.test/'),{}),null);
    const cfDoctor=spawnSync(process.execPath,[join(cwd,'node_modules/@notabenda/cloudflare/bin/notabenda-cf.mjs'),'doctor','--directory',join(cwd,'backend'),'--json'],{cwd,encoding:'utf8'});assert.equal(cfDoctor.status,1,cfDoctor.stderr);const doctorReport=JSON.parse(cfDoctor.stdout);assert.equal(doctorReport.productionReadiness,'not-assessed');assert.equal(doctorReport.checks.find(item=>item.id==='AUTHORIZATION').status,'error');assert.ok(cfManifest.files.some(file=>file.path==='bin/doctor.mjs'));
    // @requirements REQ-PRODUCT-CONFIG-SOURCES
    for(const file of ['dist/config-source.js','dist/config-yaml.js','dist/licenses/yaml-LICENSE.txt'])assert.ok(manifest.files.some(f=>f.path===file),file);
    await assert.rejects(readFile(join(cwd,'node_modules/yaml/package.json'),'utf8'),error=>error.code==='ENOENT');
    const yamlInit=spawnSync(process.execPath,[join(cwd,'node_modules/@notabenda/core/dist/cli.js'),'init','--config',join(cwd,'notabenda.config.yaml')],{cwd,encoding:'utf8'});assert.equal(yamlInit.status,0,yamlInit.stderr);
    const yamlCheck=spawnSync(process.execPath,[join(cwd,'node_modules/@notabenda/core/dist/cli.js'),'check','--config',join(cwd,'notabenda.config.yaml'),'--preview'],{cwd,encoding:'utf8'});assert.equal(yamlCheck.status,0,yamlCheck.stderr);
    const strictAuthoring=spawnSync(process.execPath,['--input-type=module','-e',"import {readSiteConfig} from '@notabenda/core/config/node';import {validateAuthoredConfig} from '@notabenda/core/config/validate';const config=await readSiteConfig('./notabenda.config.yaml',{mode:'preview'});config.conset={enabled:true};const checked=validateAuthoredConfig(config,{mode:'preview'});if(checked.valid||!checked.diagnostics.some(d=>d.path==='/conset'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(strictAuthoring.status,0,strictAuthoring.stderr);
    const headlessImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createConsent} from '@notabenda/core/headless';import {createConsent as legacy} from '@notabenda/core';if(createConsent!==legacy)process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(headlessImport.status,0,headlessImport.stderr);
    const runtimeImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createConsentRuntime,mountControls} from '@notabenda/core/consent';import {requiredConsentEvidence} from '@notabenda/core/consent/evidence';import {compileConsentRuntimeConfig} from '@notabenda/core/content';if([createConsentRuntime,mountControls,requiredConsentEvidence,compileConsentRuntimeConfig].some(f=>typeof f!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(runtimeImport.status,0,runtimeImport.stderr);
    // @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION
    for(const file of ['dist/catalog-profile.js','dist/catalog-profile.d.ts','dist/catalog-plain.js','dist/catalog-selection.js','dist/catalog-ui.js','dist/catalog-review.js','dist/catalog-review-ui.js','dist/catalog-review-cli.js','dist/service-directory.js','dist/services.css','dist/astro/ServiceDirectory.astro','dist/catalog-data.json','dist/catalog/schema.json','dist/catalog/NOTICE.txt','dist/catalog/open-cookie-database-LICENSE.txt'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const catalogImport=spawnSync(process.execPath,['--input-type=module','-e',"import {normalizeServiceCatalog,searchServiceCatalog} from '@notabenda/core/catalog';import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';import {scanProjectServices} from '@notabenda/core/catalog/project';if(normalizeServiceCatalog(serviceCatalogSeed).providers.length!==368||!searchServiceCatalog(serviceCatalogSeed,'email',{delivery:'backend'}).length||typeof scanProjectServices!=='function')process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(catalogImport.status,0,catalogImport.stderr);
    for(const file of ['dist/catalog-browser.js','dist/catalog-browser-policy.js','dist/catalog-browser-capture.js','dist/catalog-browser-cli.js','dist/catalog-browser-ui.js','dist/catalog-browser-data.json','dist/discovery-capture.js'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const browserImport=spawnSync(process.execPath,['--input-type=module','-e',"import {normalizeBrowserRuleSet,captureBrowserCatalog,analyzeBrowserCatalogCapture} from '@notabenda/core/catalog/browser';import {browserCatalogSeed} from '@notabenda/core/catalog/browser/seed';import {mountBrowserCatalogReview} from '@notabenda/core/catalog/browser/ui';if(normalizeBrowserRuleSet(browserCatalogSeed).rules.length!==19||[captureBrowserCatalog,analyzeBrowserCatalogCapture,mountBrowserCatalogReview].some(f=>typeof f!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(browserImport.status,0,browserImport.stderr);
    const catalogCli=spawnSync(process.execPath,[join(cwd,'node_modules/@notabenda/core/dist/cli.js'),'catalog','search','stripe','--delivery','backend','--json'],{cwd,encoding:'utf8'});assert.equal(catalogCli.status,0,catalogCli.stderr);assert.equal(JSON.parse(catalogCli.stdout).results[0].product.id,'stripe-payments');
    for(const file of ['dist/setup-catalog-cli.js','dist/cli-json.js','dist/catalog-node.js'])assert.ok(manifest.files.some(f=>f.path===file),file);
    await mkdir(join(cwd,'project'));await writeFile(join(cwd,'project/package.json'),JSON.stringify({dependencies:{stripe:'PRIVATE_DEPENDENCY_VERSION'}}));await writeFile(join(cwd,'project-answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));
    const projectWizard=spawnSync(process.execPath,[join(cwd,'node_modules/@notabenda/core/dist/cli.js'),'wizard','--answers','project-answers.json','--project','project','--out-dir','project-setup'],{cwd,encoding:'utf8'});assert.equal(projectWizard.status,0,projectWizard.stderr);const projectReport=JSON.parse(await readFile(join(cwd,'project-setup/discovery.private.json'),'utf8'));assert.ok(projectReport.findings.some(f=>f.productId==='stripe-payments'));assert.doesNotMatch(JSON.stringify(projectReport),/PRIVATE_DEPENDENCY_VERSION/);assert.deepEqual(JSON.parse(await readFile(join(cwd,'project-setup/notabenda.config.json'),'utf8')).services,[]);
    for(const file of ['dist/setup-purpose.js','dist/setup-purpose-ui.js','dist/setup-purpose-cli.js'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const setupImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createSetupPlan} from '@notabenda/core/setup';import {mountSetup} from '@notabenda/core/setup/ui';import {createPurposeDraftPlan,normalizeDraftPurpose} from '@notabenda/core/setup/purposes';import {mountPurposeEditor} from '@notabenda/core/setup/purposes/ui';import {registerStorageService} from '@notabenda/core';import {createSetupWorker} from '@notabenda/cloudflare';if([mountSetup,createPurposeDraftPlan,normalizeDraftPurpose,mountPurposeEditor,registerStorageService,createSetupWorker].some(f=>typeof f!=='function')||createSetupPlan({schemaVersion:1,markets:[],answers:{}}).report.productionReady!==false)process.exit(1)"],{cwd,encoding:'utf8'});assert.equal(setupImport.status,0,setupImport.stderr);
    const imported = spawnSync(process.execPath, ['--input-type=module', '-e', "import {validateSiteConfig, createTermsAcceptance, mountTermsAcceptance, createEmbedService, renderEmbedPlaceholder, hasGlobalPrivacyControl, getPrivacySignalRestrictions, createProcessingChoices, mountProcessingChoices} from '@notabenda/core'; import {compileLegalDocuments, createTermsOffer, createRetainedReleaseFiles} from '@notabenda/core/content'; import {createAdminWorker, recordTermsAcceptance, createTermsAcceptanceStore} from '@notabenda/cloudflare'; if(validateSiteConfig(null).valid || [hasGlobalPrivacyControl,getPrivacySignalRestrictions,createProcessingChoices,mountProcessingChoices,createEmbedService,renderEmbedPlaceholder,compileLegalDocuments,createTermsOffer,createRetainedReleaseFiles,createTermsAcceptance,mountTermsAcceptance,recordTermsAcceptance,createTermsAcceptanceStore].some(value=>typeof value !== 'function') || typeof createAdminWorker({authorize:()=>null}).fetch !== 'function') process.exit(1)"], { cwd, encoding: 'utf8' });
    assert.equal(imported.status, 0, imported.stderr);
    const cli = spawnSync(process.execPath, [join(cwd, 'node_modules/@notabenda/core/dist/cli.js'), '--help'], { cwd, encoding: 'utf8' });
    assert.equal(cli.status, 0, cli.stderr);
    await writeFile(join(cwd, 'consumer.ts'), "import {defineSite, type SiteConfig, renderLegalDocument, createTermsAcceptance, createEmbedService, type ConsentController} from '@notabenda/core';\nimport {compileLegalDocuments, createTermsOffer, createRetainedReleaseFiles} from '@notabenda/core/content';\nimport {createAdminWorker, createDocumentHistory, recordLegalRelease, registerTermsOffer, setActiveTermsOffer, recordTermsAcceptance, createTermsAcceptanceStore, type HistoryStorage} from '@notabenda/cloudflare';\ndeclare const config: SiteConfig;\ndeclare const storage: HistoryStorage;\nconst release = compileLegalDocuments(defineSite(config));\nrenderLegalDocument(release.publicConfig, 'privacy');\nrecordLegalRelease(storage, release.artifact);\ncreateAdminWorker({authorize: () => null});\nconst offer = createTermsOffer(release.artifact, {scopeId:'signup',statement:'I agree to these sample terms.',actionLabel:'Record agreement'});\nconst scope = {siteId:config.site.id,scopeId:'signup'};\nregisterTermsOffer(storage,offer,scope);\nsetActiveTermsOffer(storage,offer.offerId,scope);\ncreateTermsAcceptance(offer,{operationId:'operation-one',submit:body=>recordTermsAcceptance(storage,body,{...scope,subjectId:'subject-one',operationId:'operation-one'})});\ncreateTermsAcceptanceStore(storage,scope);\ndeclare const consent: ConsentController;\nconst media = createEmbedService({consent,serviceId:'optional-media'});\ndeclare const container: HTMLElement;\nmedia.mount(container,{kind:'image',src:'/image.svg',title:'Image',description:'Fictional',alt:'Alternative'});\n// @ts-expect-error image requires alternative text\nmedia.mount(container,{kind:'image',src:'/image.svg',title:'Image',description:'Fictional'});\n// @ts-expect-error unknown document kind\nrenderLegalDocument(config, 'unknown');\n");
    await writeFile(join(cwd, 'consumer.ts'), await readFile(join(cwd, 'consumer.ts'),'utf8') + `
import {normalizeServiceCatalog, searchServiceCatalog, createCatalogServiceDraft, type ServiceCatalog} from '@notabenda/core/catalog';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {renderCatalogProductProfile,readCatalogProductProfile,formatCatalogProductProfile} from '@notabenda/core/catalog/profile';
renderCatalogProductProfile(serviceCatalogSeed,'stripe-payments');readCatalogProductProfile(serviceCatalogSeed,'stripe-payments');formatCatalogProductProfile(serviceCatalogSeed,'stripe-payments');
import {createCatalogSelectionPlan,readSetupCatalogSelections} from '@notabenda/core/catalog/selection';
import {mountCatalogPicker} from '@notabenda/core/catalog/ui';
import {createPurposeDraftPlan,normalizeDraftPurpose,type PurposeDraftChange} from '@notabenda/core/setup/purposes';
import {mountPurposeEditor} from '@notabenda/core/setup/purposes/ui';
const purposeChange:PurposeDraftChange={action:'add',purpose:normalizeDraftPurpose(config.purposes[0])};
createPurposeDraftPlan(config,purposeChange);mountPurposeEditor(container,{getConfig:()=>config,onChange:plan=>plan.config});
// @ts-expect-error purpose removal must carry the previously reviewed purpose facts
createPurposeDraftPlan(config,{action:'remove',purposeId:'support'});
const selected=createCatalogSelectionPlan(config,serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:['checkout'],provider:'Selected entity',location:'Selected region',justification:'Reviewed actual use',confirmed:true});
readSetupCatalogSelections(selected);mountCatalogPicker(container,{catalog:serviceCatalogSeed,getConfig:()=>config,onSelect:result=>result.config});
import {createServiceDirectory,renderServiceDirectory,mountServiceDirectory} from '@notabenda/core/services';
createServiceDirectory(config);renderServiceDirectory(config,{idPrefix:'services'});mountServiceDirectory(container,config,{idPrefix:'services'});
import {captureBrowserCatalog,analyzeBrowserCatalogCapture,normalizeBrowserRuleSet,type BrowserCatalogCapture} from '@notabenda/core/catalog/browser';
import {browserCatalogSeed} from '@notabenda/core/catalog/browser/seed';
import {mountBrowserCatalogReview} from '@notabenda/core/catalog/browser/ui';
const rules=normalizeBrowserRuleSet(browserCatalogSeed);
const browserCapture:BrowserCatalogCapture=captureBrowserCatalog({routeLabel:'Landing',scenario:'Rejected'},rules);
analyzeBrowserCatalogCapture(browserCapture,{expectedRules:rules});mountBrowserCatalogReview(container,browserCapture);
// @ts-expect-error capture requires deliberate scenario context
captureBrowserCatalog({routeLabel:'Landing'},rules);
import {scanProjectServices} from '@notabenda/core/catalog/project';
const catalog:ServiceCatalog=normalizeServiceCatalog(serviceCatalogSeed);
searchServiceCatalog(catalog,'stripe',{delivery:'backend'});
createCatalogServiceDraft(catalog,'stripe-payments',{id:'payments',purposeIds:['checkout'],location:'Selected host location'});
scanProjectServices('.',catalog);
// @ts-expect-error unknown catalog filter
searchServiceCatalog(catalog,'stripe',{delivery:'automatic'});
import {createProcessingChoices, mountProcessingChoices} from '@notabenda/core';
import {createProcessingNotice} from '@notabenda/core/content';
import {registerProcessingNotice,recordProcessingRestriction,getProcessingHead,createProcessingRestrictionStore} from '@notabenda/cloudflare';
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
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {createFormPermission,mountFormPermission,createIndexedDBFormPermissionJournal,type FormPermissionJournal,type FormPermissionResult} from '@notabenda/core';\nimport {createFormPermissionOffer} from '@notabenda/core/content';\nimport {recordFormPermission,getFormPermissionState,formPermissionStreamRef,type FormPermissionResult as StoredFormPermissionResult} from '@notabenda/cloudflare';\nconst permissionTypes=(result:StoredFormPermissionResult):FormPermissionResult=>result;\ndeclare const journal:FormPermissionJournal;\nvoid [createIndexedDBFormPermissionJournal,journal,createFormPermission,mountFormPermission,createFormPermissionOffer,recordFormPermission,getFormPermissionState,formPermissionStreamRef,permissionTypes];\n`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {createConsent as createHeadlessConsent,type ConsentController as HeadlessConsentController} from '@notabenda/core/headless';\nconst headlessController:HeadlessConsentController=createHeadlessConsent(config);\nimport {createSetupPlan,readSetupAnswers,type SetupAnswers} from '@notabenda/core/setup';\nimport {mountSetup} from '@notabenda/core/setup/ui';\nimport {registerStorageService} from '@notabenda/core';\nimport {createSetupWorker} from '@notabenda/cloudflare';\nconst setupAnswers:SetupAnswers={schemaVersion:1,markets:[],answers:{}};\nconst setupPlan=createSetupPlan(readSetupAnswers(setupAnswers),{config});\nmountSetup(container,{answers:setupPlan.report});\nregisterStorageService({consent,serviceId:'sample',targets:[{storageId:'sample-storage'}],start:()=>()=>{}});\ncreateSetupWorker({authorize:()=>true,scriptUrl:'/assets/setup.mjs',stylesheetUrl:'/assets/notabenda.css'});\n`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {renderCollectionNotice,collectionNoticeIds,type CollectionNotice} from '@notabenda/core';\nimport {createCollectionNotice} from '@notabenda/core/content';\nconst collectionNotice:CollectionNotice=createCollectionNotice(release.artifact,{scopeId:'contact',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'About your message',intro:'Fictional context.'}});\nrenderCollectionNotice(collectionNotice,{idPrefix:collectionNoticeIds('contact').rootId,headingLevel:3});\n// @ts-expect-error no h1 or implied acceptance mode\nrenderCollectionNotice(collectionNotice,{idPrefix:'contact',headingLevel:1});\n`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createEvidenceExportSegment,type RecordStore,type EvidenceExportSegment} from '@notabenda/cloudflare';
declare const authorizedStore:RecordStore;
const exported:EvidenceExportSegment=await createEvidenceExportSegment(authorizedStore,{query:'',kind:'',keyPrefix:'',from:'',to:'',limit:25},{scopeLabel:'Authorized scope'});
createAdminWorker({authorize:()=>({store:authorizedStore,allowExport:true})});
// @ts-expect-error export permission requires a boolean
createAdminWorker({authorize:()=>({store:authorizedStore,allowExport:'yes'})});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {captureDiscovery,analyzeDiscovery,type DiscoveryCapture} from '@notabenda/core/discovery';
import {mountDiscovery} from '@notabenda/core/discovery/ui';
const capture:DiscoveryCapture=captureDiscovery({routeLabel:'Public landing',scenario:'Initial load'});
analyzeDiscovery(config,[capture]);
mountDiscovery(container,{config});
// @ts-expect-error explicit scenario label required
captureDiscovery({routeLabel:'Public landing'});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createEvidenceLifecycle,createEvidenceLifecycleStore,EvidenceLifecycleError,type LifecycleStorage,type EvidenceLifecycleState} from '@notabenda/cloudflare';
import {ConsentEvidenceError,ProcessingChoicesError,TermsAcceptanceError} from '@notabenda/core';
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
import {evaluateScopeGuards,ScopeGuardError,type ScopeGuardPolicy,type ScopeGuardDecision} from '@notabenda/core';
const guards:ScopeGuardPolicy={version:1,revision:'assessment-2',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'unknown',regulatedSector:'absent'}};
const guardConfig={...config,scopeGuards:guards};const decision:ScopeGuardDecision=evaluateScopeGuards(guardConfig);new ScopeGuardError(decision.blockedPurposeIds);
// @ts-expect-error a review boolean cannot override a scope guard
const invalidGuard:ScopeGuardPolicy={...guards,reviewed:true};
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {renderRightsCenter,renderRightsPage,type RightsCenterConfig,type RightsActionKind} from '@notabenda/core';
declare const rightsCenter:RightsCenterConfig;
const rightsAction:RightsActionKind='appeal';
renderRightsCenter({...config,rightsCenter},{idPrefix:'account-rights',headingLevel:3});renderRightsPage({...config,rightsCenter});
// @ts-expect-error this is navigation, not an identity/fulfillment engine
const invalidRightsAction:RightsActionKind='verified-deletion';
// @ts-expect-error preserve room for each action's subordinate heading
renderRightsCenter({...config,rightsCenter},{headingLevel:6});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {registerGoogleBasic,createGoogleBasicBrowserEnvironment,type GoogleBasicSnapshot} from '@notabenda/core/google';
import {type GoogleBasicConfig} from '@notabenda/core';
const googleConfig:GoogleBasicConfig={version:1,tagIds:['G-TEST1234'],signals:{analytics_storage:['measurement'],ad_storage:[],ad_user_data:[],ad_personalization:[]}};
const google=registerGoogleBasic({consent,serviceId:'measurement'},createGoogleBasicBrowserEnvironment({document:container.ownerDocument}));
const googleState:GoogleBasicSnapshot=google.getSnapshot();google.event('page_view',{page_title:'Reviewed page'});
// @ts-expect-error no arbitrary gtag config interface
google.config('AW-12345',{});
// @ts-expect-error all four signals are explicit
const incompleteGoogle:GoogleBasicConfig={...googleConfig,signals:{analytics_storage:['measurement']}};
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createContractAction, mountContractAction, normalizeContractActionLocalization, type ContractActionDefinition, type ContractActionLocalization, type ContractActionMessages} from '@notabenda/core/contracts';
declare const contractLanguage:ContractActionLocalization;
const contractLabels:ContractActionMessages=normalizeContractActionLocalization(contractLanguage,{allowPreview:true}).contractActions;
import {createContractActionDefinition} from '@notabenda/core/content';
import {registerContractActionDefinition, recordContractDeclaration, claimContractDelivery, settleContractDelivery, createContractDeclarationStore, dispatchContractDelivery, dispatchContractDeclaration} from '@notabenda/cloudflare';
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
import {createConsentRuntime,mountControls as mountCompiledControls,type ConsentRuntimeInventory} from '@notabenda/core/consent';
import {requiredConsentEvidence,type ConsentEvidenceOptions} from '@notabenda/core/consent/evidence';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
const runtimeConfig=compileConsentRuntimeConfig(config,{evidence:'local'});
const smallController=createConsentRuntime(runtimeConfig);
const smallInventory:ConsentRuntimeInventory=smallController.getConfig();
mountCompiledControls(container,{consent:smallController});
createEmbedService({consent:smallController,serviceId:'sample'});
import {selectEmbedLocalization,normalizeEmbedLocalization,renderEmbedPlaceholder,type EmbedMessages} from '@notabenda/core';
const embedCopy=selectEmbedLocalization(config);
createEmbedService({consent:smallController,serviceId:'sample',localization:embedCopy});
renderEmbedPlaceholder({title:'Media',description:'Wait for a choice'},{localization:embedCopy});
if(embedCopy)normalizeEmbedLocalization(embedCopy);
const embedMessages:EmbedMessages={preferencesLabel:'Preferences',waiting:'Waiting',allowed:'Permitted',error:'Unavailable'};
// @ts-expect-error complete embed messages include an error state
const incompleteEmbedMessages:EmbedMessages={preferencesLabel:'Preferences',waiting:'Waiting',allowed:'Permitted'};
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
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createIndirectCollectionNotice,verifyIndirectCollectionNotice} from '@notabenda/core/content';
import {renderIndirectCollectionNotice,formatIndirectCollectionNotice,type IndirectCollectionNoticeSettings} from '@notabenda/core/collection/indirect';
const indirectSettings:IndirectCollectionNoticeSettings={profile:'nz-ipp3a',scopeId:'referrals',phase:'advance',reviewStatus:'reviewed',wording:{title:'Referral',intro:'Partner referral context.'},collections:[{purposeId:'enquiries',dataCategories:['Reply address'],sourceDescription:'A partner studio.',authority:{kind:'not-relied-on'}}],recipientStatement:'Our enquiries team.',accessCorrection:{statement:'Ask for access or correction.',url:'mailto:privacy@example.test'}};
const indirectNotice=createIndirectCollectionNotice(release.artifact,indirectSettings);
verifyIndirectCollectionNotice(indirectNotice,release.artifact);
renderIndirectCollectionNotice(indirectNotice,{idPrefix:'referral'});
formatIndirectCollectionNotice(indirectNotice);
// @ts-expect-error collection phase is explicit
const invalidPhase:IndirectCollectionNoticeSettings={...indirectSettings,phase:'sent'};
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {buildLegalGuaranteeNotice,verifyLegalGuaranteeNotice} from '@notabenda/core/guarantees/content';
import {renderLegalGuaranteeNotice,guaranteeNoticeLanguages} from '@notabenda/core/guarantees';
const guarantee=await buildLegalGuaranteeNotice({language:'en',reviewStatus:'draft',allowPreview:true});
renderLegalGuaranteeNotice(guarantee.notice,{idPrefix:'guarantee',allowPreview:true});
verifyLegalGuaranteeNotice(guarantee.notice,{allowPreview:true});
// @ts-expect-error selected official languages only
buildLegalGuaranteeNotice({language:'zz',reviewStatus:'reviewed'});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {renderDurabilityGuaranteeLabel,normalizeDurabilityGuaranteeLabel,type DurabilityGuaranteeLabel} from '@notabenda/core/guarantees/label';\ndeclare const label:DurabilityGuaranteeLabel;normalizeDurabilityGuaranteeLabel(label);renderDurabilityGuaranteeLabel(label,{idPrefix:'label'});\n`);
    const guaranteeRuntime=spawnSync(process.execPath,['--input-type=module','-e',"import {buildLegalGuaranteeNotice} from '@notabenda/core/guarantees/content'; const result=await buildLegalGuaranteeNotice({language:'en',reviewStatus:'draft',allowPreview:true}); if(Object.keys(result.files).length!==1||!Object.values(result.files)[0].includes('<svg'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(guaranteeRuntime.status,0,guaranteeRuntime.stderr);
    for(const file of ['dist/setup-terms.js','dist/setup-terms-ui.js','dist/setup-terms-cli.js','dist/setup-terms.d.ts','dist/setup-terms-ui.d.ts'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const termsImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createTermsDraftPlan,normalizeTermsDraftInput} from '@notabenda/core/setup/terms';import {mountTermsEditor} from '@notabenda/core/setup/terms/ui';import {createConfiguredTermsOffer,createConfiguredTermsOfferFiles} from '@notabenda/core/content';if([createTermsDraftPlan,normalizeTermsDraftInput,mountTermsEditor,createConfiguredTermsOffer,createConfiguredTermsOfferFiles].some(f=>typeof f!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(termsImport.status,0,termsImport.stderr);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createTermsDraftPlan,normalizeTermsDraftInput,type TermsDraftInput} from '@notabenda/core/setup/terms';
import {mountTermsEditor} from '@notabenda/core/setup/terms/ui';
import {createConfiguredTermsOffer,createConfiguredTermsOfferFiles} from '@notabenda/core/content';
import type {TermsAgreementSetting} from '@notabenda/core';
declare const agreementSettings:TermsAgreementSetting;
const agreementBatch:TermsDraftInput={schemaVersion:1,changes:[{action:'add',settings:{scopeId:'account-terms',revision:'wording-1',statement:'I agree.',actionLabel:'Continue'}}]};
createTermsDraftPlan(config,{baseline:config,input:normalizeTermsDraftInput(agreementBatch)});
mountTermsEditor(container,{getConfig:()=>config,onChange:plan=>{plan.config.terms.agreements;}});
createConfiguredTermsOfferFiles(compileLegalDocuments(config,{mode:'preview'}).artifact,{mode:'preview'});
// @ts-expect-error authoring cannot grant review status
agreementBatch.changes=[{action:'add',settings:{scopeId:'scope',revision:'one',statement:'I agree.',actionLabel:'Continue',reviewStatus:'reviewed'}}];
`);
    for(const file of ['dist/setup-rights.js','dist/setup-rights-ui.js','dist/setup-rights-cli.js','dist/setup-rights.d.ts','dist/setup-rights-ui.d.ts'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const rightsImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createRightsDraftPlan,normalizeRightsDraftInput} from '@notabenda/core/setup/rights';import {mountRightsEditor} from '@notabenda/core/setup/rights/ui';if([createRightsDraftPlan,normalizeRightsDraftInput,mountRightsEditor].some(f=>typeof f!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(rightsImport.status,0,rightsImport.stderr);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createRightsDraftPlan,normalizeRightsDraftInput,type RightsDraftSettings} from '@notabenda/core/setup/rights';
import {mountRightsEditor} from '@notabenda/core/setup/rights/ui';
import {mountLegalPreview,type PreviewPageKind} from '@notabenda/core/setup/preview';
declare const rightsSettings:RightsDraftSettings;
import type {RightsMessages} from '@notabenda/core';
declare const rightsMessages:RightsMessages;
config.localization!.rights=rightsMessages;
// @ts-expect-error the visitor message set is closed
rightsMessages.unknown='text';
const rightsDraft=createRightsDraftPlan(config,{baseline:config,settings:rightsSettings,linkPrivacyToPage:true});
mountRightsEditor(container,{getConfig:()=>rightsDraft.config,onChange:plan=>{void plan.privacyLink.to;}}).refresh({discardDraft:true});
const supportingKind:PreviewPageKind='rights';mountLegalPreview(container,{config:rightsDraft.config,initialDocument:supportingKind});
// @ts-expect-error changing the privacy link needs explicit acknowledgement
createRightsDraftPlan(config,{baseline:config,settings:rightsSettings});
// @ts-expect-error page authoring cannot self-declare reviewed status
rightsSettings.reviewStatus='reviewed';
`);
    for(const file of ['dist/setup-storage.js','dist/setup-storage-ui.js','dist/setup-storage-cli.js','dist/setup-storage.d.ts','dist/setup-storage-ui.d.ts'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const inspectionImport=spawnSync(process.execPath,['--input-type=module','-e',"import {inspectConsentConnection} from '@notabenda/core/consent/inspect';import {inspectTermsConnection} from '@notabenda/core/terms/inspect';if(typeof inspectConsentConnection!=='function'||typeof inspectTermsConnection!=='function')process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(inspectionImport.status,0,inspectionImport.stderr);
    const storageImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createStorageDraftPlan,normalizeStorageDraftInput} from '@notabenda/core/setup/storage';import {mountStorageEditor} from '@notabenda/core/setup/storage/ui';if([createStorageDraftPlan,normalizeStorageDraftInput,mountStorageEditor].some(f=>typeof f!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(storageImport.status,0,storageImport.stderr);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {mountConsentRehearsal,type MountedConsentRehearsal} from '@notabenda/core/setup/consent-rehearsal';
const previewCookies:MountedConsentRehearsal=mountConsentRehearsal(container,{config,stylesheetUrls:['/assets/notabenda.css']});
const previewOpened:Promise<void>=previewCookies.open();previewCookies.close();previewCookies.destroy();
// @ts-expect-error rehearsal does not accept host provider callbacks or receipt transport
mountConsentRehearsal(container,{config,submit:()=>Promise.resolve()});
import {inspectTermsConnection,type TermsConnectionInspection} from '@notabenda/core/terms/inspect';
import type {TermsAcceptanceController,TermsOffer} from '@notabenda/core/terms';
declare const termsDiagnosticController:TermsAcceptanceController;
declare const expectedTermsOffer:TermsOffer;
const termsConnectionReport:TermsConnectionInspection=inspectTermsConnection(termsDiagnosticController,{expectedOffer:expectedTermsOffer,expectedOperationId:'host-operation'});
const localOperationMatch:boolean|undefined=termsDiagnosticController.isForOperation?.('host-operation');
// @ts-expect-error inspection has no submit option
inspectTermsConnection(termsDiagnosticController,{submit:true});
// @ts-expect-error local inspection never verifies backend activation
const backendVerified:'verified'=termsConnectionReport.backendSelection.status;
import {inspectConsentConnection,type ConsentConnectionInspection} from '@notabenda/core/consent/inspect';
import {type ServiceRegistration} from '@notabenda/core/consent';
import type {ConsentRuntimeConfig} from '@notabenda/core/consent';
declare const descriptor:ConsentRuntimeConfig;
const diagnosticController=createConsentRuntime(descriptor);
const registrations:Record<string,ServiceRegistration>=diagnosticController.getServiceRegistrations();
const connectionReport:ConsentConnectionInspection=inspectConsentConnection(diagnosticController,{expected:descriptor});
void registrations;void connectionReport;
import {createStorageDraftPlan,type StorageDraftItem} from '@notabenda/core/setup/storage';
import {mountStorageEditor} from '@notabenda/core/setup/storage/ui';
declare const storageItem:StorageDraftItem;
const storageDraft=await createStorageDraftPlan(config,{baseline:config,changes:[{action:'add',item:storageItem}],serviceScopes:[]});
mountStorageEditor(container,{getConfig:()=>storageDraft.config,onChange:plan=>{void plan.scopeChanges;void plan.technologyBindings;}}).show();
// @ts-expect-error exception storage requires complete separate profile review
const unsupported:StorageDraftItem={id:'example',name:'marker',type:'cookie',serviceId:'example',duration:'One session',classification:'exception',exceptionId:'profile'};
`);
    const controlsImport=spawnSync(process.execPath,['--input-type=module','-e',"import {createConsentDraftPlan} from '@notabenda/core/setup/consent';import {mountConsentEditor} from '@notabenda/core/setup/consent/ui';if([createConsentDraftPlan,mountConsentEditor].some(f=>typeof f!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(controlsImport.status,0,controlsImport.stderr);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {createConsentDraftPlan,type ConsentDraftSettings} from '@notabenda/core/setup/consent';
import {mountConsentEditor} from '@notabenda/core/setup/consent/ui';
declare const settings:ConsentDraftSettings;
const controlsDraft=createConsentDraftPlan(config,{baseline:config,settings});
const controlsEditor=mountConsentEditor(container,{getConfig:()=>controlsDraft.config,onChange:plan=>{void plan.blockedPurposeIds;}});
controlsEditor.refresh({discardDraft:true});controlsEditor.destroy();
// @ts-expect-error memory periods are numbers, not unchecked text
settings.grantLifetimeDays='90';
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {packLibrary,packGroups,selectPacks,reviewPackInputs,type PackInputReview} from '@notabenda/core/packs';
const packInputReview:PackInputReview=reviewPackInputs(selectPacks(['privacy-requests','technology-notices','assessed-storage-settings','google-basic']),config);
const unresolved: false=packInputReview.productionReady;void packLibrary;void packGroups;void unresolved;
// @ts-expect-error declaration checks do not supply a configured or verified state
const configured: true=packInputReview.productionReady;
`);
    for(const file of ['dist/publication.js','dist/publication.d.ts','dist/publication-cli.js'])assert.ok(manifest.files.some(f=>f.path===file),file);
    const publicationImport=spawnSync(process.execPath,['--input-type=module','-e',"import {checkLegalPublication} from '@notabenda/core/publication'; if(typeof checkLegalPublication!=='function')process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(publicationImport.status,0,publicationImport.stderr);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {checkLegalPublication,type LegalPublicationReport} from '@notabenda/core/publication';
const publication:Promise<LegalPublicationReport>=checkLegalPublication(release.artifact,{origin:'https://example.test',packs:selectPacks(['privacy-pages'])});
declare const published:LegalPublicationReport;
const noInstallation:false=published.boundaries.establishesPackInstallation;
// @ts-expect-error matching files never establish legal compliance
const compliance:true=published.boundaries.establishesLegalCompliance;
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {normalizeTermsSettingsRelease,type TermsSettingsRelease} from '@notabenda/cloudflare';
declare const settingsProjection: unknown;
const termsSettingsProjection:TermsSettingsRelease=normalizeTermsSettingsRelease(settingsProjection);
const termsSettingsKind:'terms-agreement-settings'=termsSettingsProjection.kind;
createAdminWorker({authorize:()=>({store:createDocumentHistory(storage),allowTermsSettings:true})});
// @ts-expect-error host permission is boolean, not a browser string
createAdminWorker({authorize:()=>({store:createDocumentHistory(storage),allowTermsSettings:'true'})});
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {renderPrivacyChoicesLink,normalizePrivacyChoicesLink,type PrivacyChoicesLink} from '@notabenda/core/privacy-choices';
const choiceLink:PrivacyChoicesLink=normalizePrivacyChoicesLink({schemaVersion:1,revision:'choices-1',href:'/choices/',label:'Privacy choices',presentation:'text',reviewStatus:'reviewed'});
renderPrivacyChoicesLink(choiceLink);
config.privacy.choicesLink=choiceLink;
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
  await walk(new URL('../dist/setup-storage.js', import.meta.url));
  await walk(new URL('../dist/setup-storage-ui.js', import.meta.url));
  await walk(new URL('../dist/consent-inspect.js', import.meta.url));
  assert.ok(seen.size >= 3);
});
