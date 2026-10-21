// @requirements REQ-PRODUCT-TERMS-AUTHORING REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-SETUP-SESSION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile,writeFile,mkdtemp,rm,symlink,stat,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {toPublicConfig,validateSiteConfig,createConsent} from '@notabenda/core';
import {createTermsDraftPlan,normalizeTermsDraftInput} from '@notabenda/core/setup/terms';
import {mountTermsEditor} from '@notabenda/core/setup/terms/ui';
import {mountSetup} from '@notabenda/core/setup/ui';
import {selectPacks,reviewPackInputs} from '@notabenda/core/packs';
import {compileLegalDocuments,createTermsOffer,createConfiguredTermsOffer,createConfiguredTermsOfferFiles,compileConsentRuntimeConfig,canonicalJson,sha256} from '@notabenda/core/content';
import {createRetainedReleaseFiles} from '../dist/release-files.js';
import {readSetupEditorDrafts} from '../dist/setup-session-editors.js';
import {applySetupTermsFile,reviewSetupTerms} from '../dist/setup-terms-cli.js';
import {recordLegalRelease,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
import {compileAuthoredDocuments} from '@notabenda/authoring';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {attachCatalogReview} from '@notabenda/core/catalog/release';
import {createCatalogSelectionPlan} from '@notabenda/core/catalog/selection';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {createSetupPlan} from '@notabenda/core/setup';
const setting=(scopeId='account-terms')=>({scopeId,revision:'wording-1',statement:'I agree to the account terms.',actionLabel:'Create account'});
const batch=(value=setting(),action='add')=>({schemaVersion:1,changes:[{action,settings:value}]});
const configured=async()=>{const c=await fixture({reviewed:true});c.terms.agreements=[{...setting(),reviewStatus:'reviewed'},{...setting('workspace-terms'),statement:'I agree to the workspace terms.',actionLabel:'Create workspace',reviewStatus:'reviewed'}];return c;};
const build=async()=>compileLegalDocuments(await configured());
const reseal=artifact=>{artifact.manifest.configSha256=sha256(canonicalJson(artifact.publicConfig));const {artifactId,...descriptor}=artifact.manifest;artifact.manifest.artifactId=sha256(canonicalJson(descriptor));return artifact;};
const button=(root,text)=>[...root.querySelectorAll('button')].find(e=>e.textContent===text);
function field(root,label){const caption=[...root.querySelectorAll('label')].find(e=>e.textContent===label);assert.ok(caption,label);return root.querySelector('#'+caption.htmlFor);}
function browser(){const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/start/'});dom.window.URL.createObjectURL=()=> 'blob:test';dom.window.URL.revokeObjectURL=()=>{};return {dom,root:dom.window.document.getElementById('root')};}
function fill(root,value=setting()){for(const [label,text] of Object.entries({'Workflow scope':value.scopeId,'Wording revision':value.revision,'Agreement statement':value.statement,'Button label':value.actionLabel}))field(root,label).value=text;}

test('absent settings preserve legacy public data and offer identity; configured scopes are explicitly selected',async()=>{
 const config=await fixture({reviewed:true}),legacy=compileLegalDocuments(config),wording=setting();assert.equal(Object.hasOwn(legacy.publicConfig.terms,'agreements'),false);assert.deepEqual(createConfiguredTermsOfferFiles(legacy.artifact),{});
 const offer=createTermsOffer(legacy.artifact,wording),{offerId,...descriptor}=offer;assert.equal(offerId,sha256(canonicalJson(descriptor)));assert.throws(()=>createConfiguredTermsOffer(legacy.artifact,'account-terms'),/explicitly configured/);
 const release=await build(),first=createConfiguredTermsOffer(release.artifact,'account-terms'),other=createConfiguredTermsOffer(release.artifact,'workspace-terms');assert.notEqual(first.offerId,other.offerId);assert.equal(other.statement,'I agree to the workspace terms.');assert.throws(()=>createConfiguredTermsOffer(release.artifact,undefined),/explicitly configured/);
 assert.throws(()=>createTermsOffer(release.artifact,{...wording,statement:'Different'}),/configured wording/);assert.equal(createTermsOffer(release.artifact,{...wording,scopeId:'host-workflow',statement:'Host-authored copy'}).scopeId,'host-workflow');
 assert.deepEqual(Object.keys(createConfiguredTermsOfferFiles(release.artifact)),[first,other].map(o=>`artifacts/${o.artifactId}/agreements/terms-${o.scopeId}.json`));
 const corruptModel=structuredClone(release.artifact);corruptModel.documents.terms.sections[0].heading='Changed model';assert.throws(()=>createConfiguredTermsOffer(corruptModel,'account-terms'));
 const tampered=structuredClone(release.artifact);tampered.publicConfig.terms.agreements[0].statement='Undeclared change';assert.throws(()=>createConfiguredTermsOffer(tampered,'account-terms'),/retained public release/);
});

test('whole agreement declarations reject malformed, ambiguous, draft production and executable data',async()=>{
 for(const mutate of [a=>a.push(a[0]),a=>a[1].scopeId='../escape',a=>a[1].revision='',a=>a[1].reviewStatus='draft',a=>a[1].extra=true,a=>a[1].actionLabel='x'.repeat(121),a=>a[1].statement='x\ny',a=>a[1].statement='{{review}}',a=>a.splice(0),a=>a.push(...Array.from({length:15},(_,i)=>({...a[0],scopeId:'scope-'+i})))]){
  const c=await configured();mutate(c.terms.agreements);assert.ok(validateSiteConfig(c,{mode:'production'}).diagnostics.some(d=>d.code==='invalid-terms-agreements'));assert.throws(()=>compileLegalDocuments(c));
 }
 const c=await configured();let accessed=0;Object.defineProperty(c.terms.agreements[0],'statement',{enumerable:true,get(){accessed++;return 'PRIVATE';}});assert.throws(()=>toPublicConfig(c));assert.equal(accessed,0);
 const draft=createTermsDraftPlan(await fixture(),{baseline:await fixture(),input:batch()}).config;assert.throws(()=>compileLegalDocuments(draft));const preview=compileLegalDocuments(draft,{mode:'preview'});assert.throws(()=>createConfiguredTermsOffer(preview.artifact,'account-terms'));assert.equal(createConfiguredTermsOffer(preview.artifact,'account-terms',{mode:'preview'}).mode,'preview');
});

test('baseline-bound batches preserve unrelated settings, require new revisions and never grant review or retirement',async()=>{
 const config=await configured(),before=structuredClone(config),value={...setting(),revision:'wording-2',actionLabel:'Continue'};
 const plan=createTermsDraftPlan(config,{baseline:config,input:batch(value,'update')});assert.deepEqual(config,before);assert.equal(plan.config.terms.agreements[0].reviewStatus,'draft');assert.equal(plan.config.terms.agreements[1].reviewStatus,'reviewed');
 for(const key of ['site','controller','purposes','services','storage','consent','privacy','scopeGuards'])assert.deepEqual(plan.config[key],toPublicConfig(config,{mode:'preview'})[key]);for(const document of Object.values(plan.config.documents))assert.equal(document.review.status,'draft');
 assert.throws(()=>createTermsDraftPlan(config,{baseline:config,input:batch(setting(),'update')}),/fresh/);const changed=structuredClone(config);changed.controller.name='Changed';assert.throws(()=>createTermsDraftPlan(changed,{baseline:config,input:batch(value,'update')}),/draft changed/);
 for(const input of [{schemaVersion:1,changes:[{action:['update'],settings:setting()}]},{schemaVersion:1,changes:[{action:{toString:'update'},settings:setting()}]},{...batch(),extra:true},batch({...setting(),reviewStatus:'reviewed'}),{schemaVersion:1,changes:[{action:'remove',scopeId:'account-terms',confirmed:false}]},{schemaVersion:1,changes:[batch().changes[0],batch().changes[0]]}])assert.throws(()=>normalizeTermsDraftInput(input));
 const removed=createTermsDraftPlan(config,{baseline:config,input:{schemaVersion:1,changes:config.terms.agreements.map(a=>({action:'remove',scopeId:a.scopeId,confirmed:true}))}});assert.equal(Object.hasOwn(removed.config.terms,'agreements'),false);assert.match(removed.reviewItems.join(' '),/does not deactivate/);
 const review=reviewPackInputs(selectPacks(['terms-agreement']),await fixture());assert.equal(review.packs[0].items.find(i=>i.id==='wording').state,'host-work');
});

test('wording-only changes do not enroll services or invalidate remembered cookie grants',async()=>{
 const c=await fixture();c.services=[{id:'metrics',name:'Local metrics',provider:'Test provider',location:'This browser',purposeIds:c.purposes.map(p=>p.id)}];c.storage=[];c.consent={purposes:c.purposes.map(p=>({id:p.id,scope:'purpose-1'})),services:c.services.map(s=>({id:s.id,scope:'service-1'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:60};
 const values=new Map(),environment={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>1000000000};const first=createConsent(c,environment);first.acceptAll();first.destroy();const plan=createTermsDraftPlan(c,{baseline:c,input:batch()}),second=createConsent(plan.config,environment);
 assert.ok(second.isAllowed(c.purposes[0].id));second.destroy();assert.deepEqual(compileConsentRuntimeConfig(c,{mode:'preview',evidence:'local'}),compileConsentRuntimeConfig(plan.config,{mode:'preview',evidence:'local'}));assert.doesNotMatch(JSON.stringify(compileConsentRuntimeConfig(plan.config,{mode:'preview',evidence:'local'})),/account-terms|wording-1/);
});

test('CF validates archived declarations and exact copy, independent scopes and acknowledged historical retries',async()=>{
 const release=await build(),storage=createSyntheticStorage([]),base={siteId:release.manifest.siteId,subjectId:'person-one',operationId:'signup-one'};await recordLegalRelease(storage,release.artifact);
 const a=createConfiguredTermsOffer(release.artifact,'account-terms'),b=createConfiguredTermsOffer(release.artifact,'workspace-terms'),context={...base,scopeId:a.scopeId};await registerTermsOffer(storage,a,context);await registerTermsOffer(storage,b,{...base,scopeId:b.scopeId});
 const request={schemaVersion:1,offerId:a.offerId,requestId:crypto.randomUUID(),accepted:true};await assert.rejects(recordTermsAcceptance(storage,request,context),e=>e.code==='stale-offer');await setActiveTermsOffer(storage,a.offerId,context);const receipt=await recordTermsAcceptance(storage,request,context);await setActiveTermsOffer(storage,null,context);assert.deepEqual(await recordTermsAcceptance(storage,request,context),receipt);await assert.rejects(recordTermsAcceptance(storage,{...request,requestId:crypto.randomUUID()},context),e=>e.code==='stale-offer');
 const wrong={...a,statement:'Other copy'};const {offerId,...descriptor}=wrong;wrong.offerId=sha256(canonicalJson(descriptor));await assert.rejects(registerTermsOffer(storage,wrong,context),e=>e.code==='invalid-offer');
 for(const mutate of [a=>a.push(a[0]),a=>a[1].reviewStatus='draft',a=>a[1].extra=true]){const archive=structuredClone(release.artifact);mutate(archive.publicConfig.terms.agreements);reseal(archive);await recordLegalRelease(storage,archive);const altered={...a,artifactId:archive.manifest.artifactId,document:{...a.document,url:`/artifacts/${archive.manifest.artifactId}/terms.html`}};const {offerId,...body}=altered;altered.offerId=sha256(canonicalJson(body));await assert.rejects(registerTermsOffer(storage,altered,context),e=>e.code==='invalid-offer');}
 const retained=createRetainedReleaseFiles([release.artifact],{siteId:release.manifest.siteId});assert.equal(JSON.parse(retained[`artifacts/${a.artifactId}/agreements/terms-account-terms.json`]).offerId,a.offerId);
 const portable=await readFile(new URL('../../notabenda-cf/src/terms-settings.ts',import.meta.url),'utf8'),source=await readFile(new URL('../src/terms-settings.ts',import.meta.url),'utf8');assert.equal(portable.replace(/^\/\/ Generated[^\n]*\n/u,''),source);
});

test('editor preserves unfinished input, blocks stale and failed adoption and makes retained controls inert',async()=>{
 const f=browser();let c=await fixture(),calls=0,fail=false,readFail=false;const ui=mountTermsEditor(f.root,{getConfig:()=>{if(readFail)throw Error('PRIVATE_HOST_DETAIL');return c;},onChange:plan=>{if(fail)throw Error('PRIVATE');calls++;c=plan.config;}});
 try{ui.show();button(f.root,'Add an agreement scope').click();assert.equal(field(f.root,'Agreement statement').value,'');fill(f.root);const enter=new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});field(f.root,'Workflow scope').dispatchEvent(enter);assert.equal(enter.defaultPrevented,true);
 c.controller.name='Changed';button(f.root,'Save agreement draft').click();assert.equal(calls,0);assert.match(f.root.textContent,/draft changed/);button(f.root,'Cancel').click();button(f.root,'Add an agreement scope').click();fill(f.root);fail=true;button(f.root,'Save agreement draft').click();assert.doesNotMatch(f.root.textContent,/PRIVATE/);assert.equal(calls,0);fail=false;readFail=true;button(f.root,'Save agreement draft').click();assert.doesNotMatch(f.root.textContent,/PRIVATE_HOST_DETAIL/);assert.equal(calls,0);readFail=false;button(f.root,'Save agreement draft').click();assert.equal(calls,1);
 button(f.root,'Remove').click();const ack=f.root.querySelector('input[type=checkbox]');ack.checked=true;const saved=ui.getSessionDraft();assert.equal(saved.proposal.fields.values[0].checked,false);ui.refresh({discardDraft:true});ui.restoreSessionDraft(saved);assert.equal(f.root.querySelector('input[type=checkbox]').checked,false);button(f.root,'Remove settings').click();assert.equal(calls,1);
 const retained=button(f.root,'Remove settings');ui.destroy();retained.click();assert.equal(calls,1);
 }finally{ui.destroy();f.dom.window.close();}
});

test('setup exposes explicit settings, invalidates prepared exports only on save and resumes unfinished editors',async()=>{
 const f=browser(),c=await fixture(),ui=mountSetup(f.root,{config:c,cartridges:selectPacks(['terms-agreement'])}),submit=()=>f.root.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 try{submit();assert.ok(ui.getPlan());button(f.root,'Configure terms agreements').click();button(f.root,'Add an agreement scope').click();fill(f.root);assert.ok(ui.getPlan());const saved=ui.getSessionDraft();assert.ok(readSetupEditorDrafts(saved.editors).terms.proposal);button(f.root,'Save agreement draft').click();assert.equal(ui.getPlan(),null);submit();assert.equal(ui.getPlan().config.terms.agreements[0].reviewStatus,'draft');
 ui.destroy();const resumed=mountSetup(f.root,{config:saved.config,answers:saved.report,resumeDraft:saved,cartridges:selectPacks(['terms-agreement'])});try{assert.equal(field(f.root,'Agreement statement').value,setting().statement);assert.equal(resumed.getDraft().config.terms.agreements,undefined);button(f.root,'Save agreement draft').click();assert.equal(resumed.getDraft().config.terms.agreements[0].scopeId,'account-terms');}finally{resumed.destroy();}
 }finally{ui.destroy();f.dom.window.close();}
});

test('CLI proposal confirmation rechecks the baseline and wizard/build emit final scope-bound offers',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-terms-authoring-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;try{
  const path=join(cwd,'terms.json'),c=await fixture();await writeFile(path,JSON.stringify(batch()));assert.equal((await applySetupTermsFile(c,path)).terms.agreements[0].reviewStatus,'draft');await symlink(path,join(cwd,'alias'));await assert.rejects(applySetupTermsFile(c,join(cwd,'alias')));
  let answers=['yes',path,'yes'],count=0;assert.equal(await reviewSetupTerms(c,async()=>{if(++count===3)c.controller.name='Changed during confirmation';return answers.shift();}),c);
  await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));await writeFile(join(cwd,'config.json'),JSON.stringify(c));const run=args=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'});
  const wizard=run(['wizard','--packs','terms-agreement','--answers','answers.json','--config','config.json','--terms','terms.json','--out-dir','draft']);assert.equal(wizard.status,0,wizard.stderr);assert.equal((await stat(join(cwd,'draft'))).mode&0o777,0o700);assert.equal((await stat(join(cwd,'draft/notabenda.config.json'))).mode&0o777,0o600);assert.notEqual(run(['validate','--terms','terms.json']).status,0);assert.notEqual(run(['wizard','--answers','answers.json','--terms','terms.json','--out-dir','draft']).status,0);
  await writeFile(join(cwd,'reviewed.json'),JSON.stringify(await configured()));const output=run(['build','--config','reviewed.json','--out-dir','public']);assert.equal(output.status,0,output.stderr);const manifest=JSON.parse(await readFile(join(cwd,'public/notabenda.manifest.json'),'utf8')),artifact=JSON.parse(await readFile(join(cwd,`public/artifacts/${manifest.artifactId}.json`),'utf8'));const offers=await readdir(join(cwd,`public/artifacts/${manifest.artifactId}/agreements`));assert.equal(offers.length,2);for(const scope of ['account-terms','workspace-terms'])assert.deepEqual(JSON.parse(await readFile(join(cwd,`public/artifacts/${manifest.artifactId}/agreements/terms-${scope}.json`),'utf8')),createConfiguredTermsOffer(artifact,scope));
 }finally{await rm(cwd,{recursive:true,force:true});}
});


test('finalized catalog attachments and translated agreement interfaces keep their exact release identity',async()=>{
 const c=await configured(),{config,selection}=createCatalogSelectionPlan(c,serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:[c.purposes[0].id],provider:'Declared test entity',location:'Declared test region',justification:'PRIVATE review',confirmed:true});
 for(const d of Object.values(config.documents))d.review.status='reviewed';
 const preliminary=compileLegalDocuments(config),finalized=attachCatalogReview(preliminary,[selection]),offer=createConfiguredTermsOffer(finalized.artifact,'account-terms');assert.notEqual(offer.artifactId,preliminary.manifest.artifactId);assert.equal(offer.artifactId,finalized.manifest.artifactId);assert.ok(createConfiguredTermsOfferFiles(finalized.artifact)[`artifacts/${offer.artifactId}/agreements/terms-account-terms.json`]);
 const localized=localizedExampleConfig(c);localized.terms.agreements=[{...setting(),statement:'Concordo com os termos da conta.',actionLabel:'Criar conta',reviewStatus:'draft'}];const translated=createConfiguredTermsOffer(compileLegalDocuments(localized,{mode:'preview'}).artifact,'account-terms',{mode:'preview'});assert.equal(translated.schemaVersion,2);assert.equal(translated.statement,'Concordo com os termos da conta.');delete localized.localization.terms;assert.throws(()=>createConfiguredTermsOffer(compileLegalDocuments(localized,{mode:'preview'}).artifact,'account-terms',{mode:'preview'}),/localization.terms/);
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-terms-final-'));try{const cli=new URL('../dist/cli.js',import.meta.url).pathname,report=createSetupPlan({schemaVersion:1,markets:[],answers:{}},{config,catalogSelections:[selection]}).report;await writeFile(join(cwd,'config.json'),JSON.stringify(config));await writeFile(join(cwd,'report.json'),JSON.stringify(report));const result=spawnSync(process.execPath,[cli,'build','--config','config.json','--catalog-report','report.json','--private-out-dir','private','--out-dir','public'],{cwd,encoding:'utf8'});assert.equal(result.status,0,result.stderr);const manifest=JSON.parse(await readFile(join(cwd,'public/notabenda.manifest.json'),'utf8'));assert.equal(manifest.artifactId,finalized.manifest.artifactId);const emitted=JSON.parse(await readFile(join(cwd,`public/artifacts/${manifest.artifactId}/agreements/terms-account-terms.json`),'utf8'));assert.deepEqual(emitted,offer);}finally{await rm(cwd,{recursive:true,force:true});}
});


test('Markdown and MDX releases generate configured offers only from their final authored artifact',async()=>{
 for(const format of ['md','mdx']){const config=await configured(),source='---\nkind: terms\ntitle: Account terms\nroute: /terms\nversion: authored-2\neffectiveDate: 2026-10-20\nsource: supplied\nreview:\n  status: draft\n---\n## Your account\nReview these terms before creating an account.\n';const release=await compileAuthoredDocuments(config,{terms:{format,source}},{mode:'preview'}),offer=createConfiguredTermsOffer(release.artifact,'account-terms',{mode:'preview'});assert.equal(offer.artifactId,release.manifest.artifactId);assert.equal(offer.document.version,'authored-2');assert.equal(offer.document.sha256,sha256(release.artifact.pages['terms/index.html']));const retained=createRetainedReleaseFiles([release.artifact],{siteId:config.site.id,mode:'preview'});assert.equal(JSON.parse(retained[`artifacts/${offer.artifactId}/agreements/terms-account-terms.json`]).offerId,offer.offerId);}
});
