// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
// Copied into a separate adopter directory. All library imports below resolve from its installed archives.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,dirname,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readSiteConfig,formatConfigSource} from '@notabenda/core/config/node';
import {compileConsentRuntimeConfig,createCollectionFlow,verifyCollectionFlow,createConsentNoticeFiles} from '@notabenda/core/content';
import {createConsent as createPrimaryConsent} from '@notabenda/core';
import {createConsentRuntime,mountControls} from '@notabenda/core/consent';
import {renderCollectionFlow} from '@notabenda/core/collection/flow';
import {compileAuthoredDocuments} from '@notabenda/authoring';
import {JSDOM} from 'jsdom';
import {build as bundle} from 'esbuild';
import {writeCandidateBrowserReview} from './source-candidate-review.mjs';
const cwd=process.cwd(),checks=[];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function run(file,args,directory=cwd){const result=spawnSync(process.execPath,[file,...args],{cwd:directory,encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);return result;}
const packageFile=(name,file)=>join(cwd,'node_modules',name,file);
const cli=packageFile('@notabenda/core','dist/cli.js');
run(cli,['init','--config','site.yaml']);
const config=JSON.parse(await readFile('inputs/site.json','utf8'));
config.site.id='candidate-example';config.scopeGuards={version:1,revision:'candidate-scope',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
function purpose(id,name){return {...structuredClone(config.purposes[0]),id,name,description:name+' in this synthetic package exercise.',dataCategories:['Sample choice'],collection:{source:'direct',description:'A deliberate sample interaction.',required:false,consequences:'The main task works without this optional use.'}};}
config.purposes.push(purpose('audience-measurement','Measure sample visits'),purpose('product-updates','Send optional product updates'));
config.services.push({id:'sample-metrics',name:'Sample metrics',provider:'Local simulation',purposeIds:['audience-measurement'],location:'This test process',processingActivities:[]});
config.storage.push({id:'sample-metrics',name:'sample_metrics',type:'localStorage',serviceId:'sample-metrics',duration:'Until withdrawal in this exercise',classification:'optional'});
config.consent={purposes:[{id:'audience-measurement',scope:'candidate-1'}],services:[{id:'sample-metrics',scope:'candidate-1'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:60};
await writeFile('site.yaml',await formatConfigSource(config,'yaml'));const loaded=await readSiteConfig('site.yaml',{mode:'preview'});assert.deepEqual(loaded,config);
const rejected=spawnSync(process.execPath,[cli,'check','--config','site.yaml'],{encoding:'utf8'});assert.notEqual(rejected.status,0);for(const doc of Object.values(config.documents))doc.review.status='reviewed';// Synthetic review declarations exercise production validation; they are not legal review.
await writeFile('site.yaml',await formatConfigSource(config,'yaml'));
run(cli,['check','--config','site.yaml']);run(cli,['build','--config','site.yaml','--consent-runtime','local','--out-dir','legal']);
const descriptor=JSON.parse(await readFile('legal/consent-runtime.json','utf8'));assert.deepEqual(descriptor,compileConsentRuntimeConfig(config,{evidence:'local'}));checks.push('yaml-cli-and-compiled-runtime');
const source='---\nkind: terms\ntitle: Example terms\nroute: /terms\nversion: candidate-authored-1\neffectiveDate: 2026-10-22\nreview:\n  status: reviewed\n---\n## Sample terms\n\nThis document exercises the installed Markdown and MDX compiler.\n\n<span className="candidate-authored">Keep a copy of this example.</span>\n';
const authored=await compileAuthoredDocuments(config,{terms:{format:'mdx',source}}),artifact=authored.artifact,id=authored.manifest.artifactId;
assert.equal(id,artifact.manifest.artifactId);assert.match(artifact.pages[authored.manifest.documents.find(d=>d.kind==='terms').file],/class="candidate-authored"/);assert.deepEqual(compileConsentRuntimeConfig(artifact.publicConfig,{evidence:'local'}),descriptor);
await mkdir('authored');for(const [path,body] of Object.entries(authored.files)){await mkdir(dirname(join('authored',path)),{recursive:true});await writeFile(join('authored',path),body);}checks.push('installed-mdx-authoring');
const published=createConsentNoticeFiles(artifact,{scopeId:'candidate-choices'});assert.equal(published.notice.artifactId,id);assert.equal(published.notice.mode,'production');assert.equal(published.files['consent-notice.json'],published.files['artifacts/'+id+'/consent/'+published.notice.noticeId+'.json']);
for(const document of authored.manifest.documents)assert.equal(await readFile('authored/artifacts/'+id+'/'+document.kind+'.html','utf8'),artifact.pages[document.file]);for(const [path,body] of Object.entries(published.files)){await mkdir(dirname(join('authored',path)),{recursive:true});await writeFile(join('authored',path),body);}checks.push('production-pinned-documents-and-notice');
const settings={reviewedArtifactId:id,notice:{scopeId:'contact-and-updates',purposeIds:['enquiries','product-updates'],reviewStatus:'reviewed',wording:{title:'About this form',intro:'Your enquiry and optional product updates are separate.'}},decisions:[{purposeId:'enquiries',presentation:'notice-only'},{purposeId:'product-updates',presentation:'separate-permission',permission:{permissionId:'product-updates-email',channel:{id:'email',label:'Email'},revision:'candidate-1',reviewStatus:'reviewed',withdrawalUrl:'/privacy',wording:{title:'Product updates',statement:'Send me email about these sample products.',grantLabel:'Save email permission',withdrawLabel:'Withdraw email permission',optionality:'Optional. You can send an enquiry without updates.',withdrawalExplanation:'Withdraw here at any time.'},refusal:{label:'No updates',recorded:'Refusal recorded.',pending:'Refusal awaiting confirmation.',retry:'Retry refusal'}}}]};
await writeFile('collection-settings.json',JSON.stringify(settings,null,2)+'\n');
const flow=verifyCollectionFlow(createCollectionFlow(artifact,settings),artifact);assert.equal(flow.artifactId,id);assert.match(renderCollectionFlow(flow,{idPrefix:'candidate-form',allowPreview:true}),/Your enquiry and optional product updates are separate/);
run(cli,['form-workbench','--artifact','authored/artifacts/'+id+'.json','--purposes','enquiries,product-updates','--settings','collection-settings.json','--out-dir','form-editor']);
assert.match(await readFile('form-editor/index.html','utf8'),new RegExp(id));checks.push('exact-authored-release-form-flow');
const dom=new JSDOM('<!doctype html><html lang="en"><head><title>Candidate</title></head><body><main><h1>Candidate controls</h1><div id="controls"></div></main></body></html>',{url:'https://candidate.example.test/'}),values=new Map();let starts=0,stops=0;
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
assert.equal(createPrimaryConsent,createConsentRuntime);
assert.throws(()=>createPrimaryConsent(config,{}));
const controller=createPrimaryConsent(descriptor,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse('2026-10-22T12:00:00Z'),schedule:()=>()=>{}}),controls=mountControls(dom.window.document.getElementById('controls'),{consent:controller});
try{controller.registerService('sample-metrics',{purposes:['audience-measurement'],start:()=>{starts++;return()=>{stops++;};}});await controller.settled();assert.equal(starts,0);controller.openPreferences();assert.equal(starts,0);assert.ok(dom.window.document.querySelector('dialog'));controller.acceptAll();await controller.settled();assert.equal(starts,1);assert.equal(controller.isServiceAllowed('sample-metrics'),true);controller.rejectAll();await controller.settled();assert.equal(stops,1);assert.equal(controller.isServiceAllowed('sample-metrics'),false);}finally{controls.destroy();controller.destroy();dom.window.close();}checks.push('native-controls-with-dom-dialog-shim-and-service-gating');
await writeFile('browser-entry.mjs',"export {createConsent,mountControls} from '@notabenda/core';\n");const browser=await bundle({entryPoints:['browser-entry.mjs'],outfile:'browser/consent.js',bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',metafile:true});
for(const input of Object.keys(browser.metafile.inputs)){const path=resolve(input);assert.ok(path===join(cwd,'browser-entry.mjs')||path.startsWith(join(cwd,'node_modules')+'/'));assert.doesNotMatch(input,/node:|notabenda-authoring|notabenda-cf|content\.js|config-source\.js/);}
await mkdir('browser');await writeFile('browser/consent.js',browser.outputFiles[0].contents);await writeFile('browser/consent.css',await readFile(fileURLToPath(import.meta.resolve('@notabenda/core/consent.css'))));checks.push('browser-bundle-boundary');
const browserReview=await writeCandidateBrowserReview({directory:'browser-review',bundle:browser.outputFiles[0].contents,consentCss:await readFile('browser/consent.css'),documentCss:await readFile(fileURLToPath(import.meta.resolve('@notabenda/core/styles.css'))),descriptor,artifact});checks.push('installed-native-browser-review-prepared');
const cfCli=packageFile('@notabenda/cloudflare','bin/notabenda-cf.mjs');run(cfCli,['init','--site-id',config.site.id,'--out-dir','backend']);
checks.push('starter-generated');
await writeFile('consumer.ts',`import {createConsentRuntime,type ConsentRuntimeConfig} from '@notabenda/core/consent';\nimport {compileAuthoredDocuments,type DocumentSource} from '@notabenda/authoring';\nimport {createWorkspaceOverviewWorker} from '@notabenda/cloudflare';\nimport {createCollectionFlow,type CollectionFlowSettings} from '@notabenda/core/content';\ndeclare const runtime:ConsentRuntimeConfig;createConsentRuntime(runtime);\nconst source:DocumentSource={format:'mdx',source:'# Example'};void source;void compileAuthoredDocuments;void createWorkspaceOverviewWorker;declare const settings:CollectionFlowSettings;void settings;void createCollectionFlow;\n`);
run(packageFile('typescript','bin/tsc'),['--noEmit','--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','consumer.ts']);checks.push('installed-types');
await writeFile('consumer-result.json',JSON.stringify({schemaVersion:1,status:'passed',checks,artifactId:id,browserBundleSha256:sha(browser.outputFiles[0].contents),browserReview,boundaries:{syntheticReviewedFixtures:true,syntheticServices:true,hostAuthorizationProvided:false,cloudDeployment:false,physicalBrowser:false,realProviderTraffic:false}},null,2)+'\n');
process.stdout.write(JSON.stringify({status:'passed',checks,artifactId:id})+'\n');
