// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-COLLECTION-FLOW REQ-PRODUCT-A11Y REQ-PRODUCT-CONFIG-SOURCES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {createHash} from 'node:crypto';
import {prepareCollectionWorkbenchContext,createCollectionWorkbenchFiles} from '@notabenda/core/authoring/collection';
import {prepareCollectionFlowSettings,formatCollectionWorkbenchSettings,normalizeCollectionWorkbenchContext,collectionWorkbenchHandoff} from '@notabenda/core/authoring/collection/model';
import {mountCollectionWorkbench} from '@notabenda/core/authoring/collection/ui';
import {createCollectionFlow,compileLegalDocuments} from '@notabenda/core/content';
import {parseConfigSource} from '@notabenda/core/config/document';
import {setup} from './collection-flow-fixture.mjs';
const prepared=(f,initial=true)=>prepareCollectionWorkbenchContext(f.build.artifact,{purposeIds:['message','updates'],...(initial?{settings:f.settings}:{})});
const tick=()=>new Promise(r=>setTimeout(r,0));
const button=(d,text)=>[...d.querySelectorAll('button')].find(b=>b.textContent===text);

test('prepared public facts bind an intact final release; new notice-only and complete mixed settings round-trip unchanged',async()=>{
 const f=await setup(),before=structuredClone(f),context=prepared(f),plan=prepareCollectionFlowSettings(context,f.settings,{releaseConfirmed:true});
 assert.equal(context.facts.artifactId,f.build.manifest.artifactId);assert.deepEqual(plan.settings,f.settings);assert.deepEqual(createCollectionFlow(f.build.artifact,plan.settings),f.flow);assert.deepEqual(f,before);assert.ok(!Object.hasOwn(context.facts,'noticeId'));
 const d=new JSDOM(plan.previewHtml).window.document;assert.equal(d.querySelector('[data-collection-notice-id]'),null);assert.ok(d.querySelector('[data-collection-preview]'));assert.equal(d.querySelectorAll('input,button,form,script').length,0);assert.ok(d.body.textContent.includes('Send me email updates.'));
 const only=structuredClone(f.settings);only.decisions=only.decisions.map(d=>({purposeId:d.purposeId,presentation:'notice-only'}));const newPlan=prepareCollectionFlowSettings(prepared(f,false),only,{releaseConfirmed:true});assert.equal(createCollectionFlow(f.build.artifact,newPlan.settings).permissions.length,0);
 for(const mutate of [a=>a.pages[a.manifest.documents[0].file]+='changed',a=>a.manifest.artifactId='a'.repeat(64),a=>a.publicConfig.controller.name='Changed']){const a=structuredClone(f.build.artifact);mutate(a);assert.throws(()=>prepareCollectionWorkbenchContext(a,{purposeIds:['message']}));}
 const mixed=structuredClone(f.config);mixed.purposes[0].collection.source='both';const b=compileLegalDocuments(mixed);assert.throws(()=>prepareCollectionWorkbenchContext(b.artifact,{purposeIds:['message']}),/direct-only/);
});

test('release confirmation, complete explicit routes and preserved permission settings are required without inferred decisions',async()=>{
 const f=await setup(),context=prepared(f);assert.throws(()=>prepareCollectionFlowSettings(context,f.settings,{releaseConfirmed:false}),/Confirm/);
 for(const mutate of [s=>s.reviewedArtifactId='a'.repeat(64),s=>s.decisions.pop(),s=>s.decisions[0].presentation='unresolved',s=>s.decisions[0].permission={},s=>s.decisions.push(s.decisions[0]),s=>s.notice.purposeIds.push('unknown'),s=>s.notice.extra=true,s=>s.decisions[1].permission.refusal.retry='Changed',s=>s.decisions[1].permission.withdrawalUrl='/changed',s=>s.decisions[1].permission.channel.label='Changed']){const s=structuredClone(f.settings);mutate(s);assert.throws(()=>prepareCollectionFlowSettings(context,s,{releaseConfirmed:true}),undefined,mutate.toString());}
 assert.throws(()=>prepareCollectionFlowSettings(prepared(f,false),f.settings,{releaseConfirmed:true}),/complete host-authored/);
 const contextChanged=structuredClone(context);contextChanged.initial.flow.notice.purposes[0].description='Changed';assert.throws(()=>normalizeCollectionWorkbenchContext(contextChanged));
 const draft=structuredClone(f.settings);draft.notice.reviewStatus='draft';assert.equal(prepareCollectionFlowSettings(context,draft,{releaseConfirmed:true}).settings.notice.reviewStatus,'draft');assert.throws(()=>createCollectionFlow(f.build.artifact,draft));
});

test('JSON, YAML and Markdown export compile through the existing CLI to exact mixed descriptors and static fragments',async()=>{
 const f=await setup(),context=prepared(f),dir=await mkdtemp(join(tmpdir(),'notabenda-workbench-export-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;
 try{await writeFile(join(dir,'config.json'),JSON.stringify(f.config));for(const format of ['json','yaml','markdown']){const text=await formatCollectionWorkbenchSettings(context,f.settings,format),ext=format==='markdown'?'md':format;assert.deepEqual((await parseConfigSource(text,format)).config,f.settings);await writeFile(join(dir,'flow.'+ext),text);const run=spawnSync(process.execPath,[cli,'build','--config','config.json','--collection-flow','flow.'+ext,'--out-dir','build-'+ext],{cwd:dir,encoding:'utf8',timeout:20000});assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(await readFile(join(dir,'build-'+ext,'collection-flow.json'),'utf8')),f.flow);assert.match(await readFile(join(dir,'build-'+ext,'collection-flow.html'),'utf8'),new RegExp('/artifacts/'+f.build.manifest.artifactId+'/privacy.html'));}}finally{await rm(dir,{recursive:true,force:true});}
});

test('standalone CLI output is new-only, self-contained and CSP-bound, with no raw release pages or private source',async()=>{
 const f=await setup(),dir=await mkdtemp(join(tmpdir(),'notabenda-workbench-cli-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;
 try{await writeFile(join(dir,'artifact.json'),JSON.stringify(f.build.artifact));await writeFile(join(dir,'flow.json'),JSON.stringify(f.settings));const args=['form-workbench','--artifact','artifact.json','--purposes','message,updates','--settings','flow.json','--out-dir','editor'];const run=()=>spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8',timeout:20000});const first=run();assert.equal(first.status,0,first.stderr);assert.deepEqual(await readdir(join(dir,'editor')),['index.html']);const html=await readFile(join(dir,'editor','index.html'),'utf8'),d=new JSDOM(html).window.document;assert.equal(d.querySelectorAll('script[src],link[href],img,iframe').length,0);const script=d.querySelector('script[type=module]').textContent,css=d.querySelector('style').textContent,csp=d.querySelector('[http-equiv="Content-Security-Policy"]').content;for(const content of [script,css])assert.ok(csp.includes(createHash('sha256').update(content).digest('base64')));assert.match(csp,/default-src 'none'/);assert.doesNotMatch(csp,/connect-src|unsafe-eval|unsafe-inline/);const context=JSON.parse(d.querySelector('#collection-workbench-context').textContent);assert.equal(context.pages,undefined);assert.equal(context.publicConfig,undefined);assert.equal(context.facts.artifactId,f.build.manifest.artifactId);assert.equal(run().status,1);assert.equal(await readFile(join(dir,'editor','index.html'),'utf8'),html);
 const files=await createCollectionWorkbenchFiles(f.build.artifact,{purposeIds:['message']},{delivery:'directory'});assert.deepEqual(Object.keys(files).sort(),['index.html','workbench.css','workbench.js']);assert.match(files['index.html'],/src=".\/workbench.js"/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('malformed, oversized and executable values fail before invoking accessors or modifying the host DOM',async()=>{
 const f=await setup(),context=prepared(f);let invoked=0;const broken=structuredClone(context);Object.defineProperty(broken.facts,'controller',{enumerable:true,get(){invoked++;return {};}});assert.throws(()=>normalizeCollectionWorkbenchContext(broken));assert.equal(invoked,0);const excessive=structuredClone(context);excessive.extra='x'.repeat(300000);assert.throws(()=>normalizeCollectionWorkbenchContext(excessive));
 const dom=new JSDOM('<div id="host">Keep me</div>');assert.throws(()=>mountCollectionWorkbench(dom.window.document.querySelector('#host'),{context:broken}));assert.equal(dom.window.document.querySelector('#host').textContent,'Keep me');dom.window.close();
});

function browser(){const dom=new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>',{url:'https://adopter.example.test/prepare'}),d=dom.window.document;let network=0,storage=0;dom.window.fetch=()=>{network++;throw Error('No network');};for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(dom.window,key,{get(){storage++;throw Error('No storage');}});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};return {dom,d,effects:()=>({network,storage})};}
test('UI opens with unconfirmed release, uses an inert current preview, clears review on edits, and exports full settings with clipboard fallback',async()=>{
 const f=await setup(),b=browser(),context=prepared(f),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context});context.facts.controller.name='Changed caller';
 try{assert.equal(b.d.querySelector('[data-workbench=release]').checked,false);assert.throws(()=>ui.getSettings(),/Confirm/);button(b.d,'Preview notice').click();assert.ok(b.d.querySelector('.nb-workbench-paper').textContent.includes(f.config.controller.name));assert.equal(b.d.querySelector('.nb-workbench-paper a[href],.nb-workbench-paper input,.nb-workbench-paper [data-collection-notice-id]'),null);const ids=[...b.d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
 const title=b.d.querySelector('input[id$="-title"]');title.value='About this contact form';title.dispatchEvent(new b.dom.window.Event('input',{bubbles:true}));assert.equal(b.d.querySelector('select[id$="-wording-review"]').value,'draft');assert.equal(b.d.querySelector('[data-workbench=release]').checked,false);b.d.querySelector('[data-workbench=release]').checked=true;const settings=ui.getSettings();assert.equal(settings.notice.wording.title,title.value);assert.deepEqual(settings.decisions,f.settings.decisions);
 button(b.d,'Copy build settings').click();await tick();await tick();const dialog=b.d.querySelector('dialog');assert.equal(dialog.open,true);assert.ok(b.d.querySelector('textarea[readonly]').value.includes('reviewedArtifactId'));button(b.d,'Copy settings').click();await tick();assert.match(dialog.textContent,/Clipboard unavailable/);assert.equal(b.d.activeElement,b.d.querySelector('textarea[readonly]'));button(b.d,'Close settings').click();assert.equal(b.d.activeElement,button(b.d,'Copy build settings'));assert.equal(b.d.querySelector('textarea[readonly]').value,'');assert.deepEqual(b.effects(),{network:0,storage:0});
 }finally{ui.destroy();assert.throws(()=>ui.getSettings(),/ended/);b.dom.window.close();}
});

test('an empty context starts with no purpose selections or routes; unresolved separate permission cannot export',async()=>{
 const f=await setup(),b=browser(),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context:prepared(f,false)});
 try{assert.ok([...b.d.querySelectorAll('[data-purpose]')].every(i=>!i.checked));assert.ok([...b.d.querySelectorAll('select[id*="-route-"]')].every(i=>i.value===''));button(b.d,'Preview notice').click();assert.equal(b.d.querySelector('[data-collection-preview]'),null);const purpose=b.d.querySelector('[data-purpose="message"]');purpose.checked=true;purpose.dispatchEvent(new b.dom.window.Event('change'));b.d.querySelector('select[id$="-route-message"]').value='separate-permission';for(const [key,value] of [['scopeId','contact'],['title','About this form'],['intro','We use these details to answer your message.']])b.d.querySelector('input[id$="-'+key+'"],textarea[id$="-'+key+'"]').value=value;b.d.querySelector('[data-workbench=release]').checked=true;assert.throws(()=>ui.getSettings(),/Complete the separate permission/);assert.deepEqual(b.effects(),{network:0,storage:0});}finally{ui.destroy();b.dom.window.close();}
});

test('mixed preview/export preserves route meaning, separate wording and language direction, including maximum render prefixes',async()=>{
 const f=await setup(),context=prepared(f);
 for(const mutate of [s=>s.notice.wording.title=s.decisions[1].permission.wording.title,s=>s.notice.wording.intro=s.decisions[1].permission.wording.statement]){const s=structuredClone(f.settings);mutate(s);assert.throws(()=>prepareCollectionFlowSettings(context,s,{releaseConfirmed:true}),/distinct/);assert.throws(()=>createCollectionFlow(f.build.artifact,s));}
 const mismatched=structuredClone(context);mismatched.initial.settings.decisions[1]={purposeId:'updates',presentation:'notice-only'};assert.throws(()=>normalizeCollectionWorkbenchContext(mismatched));
 const {renderCollectionFlow}=await import('@notabenda/core/collection/flow');for(const length of [114,120])assert.match(renderCollectionFlow(f.flow,{idPrefix:'a'.repeat(length)}),/nb-collection-flow-slot/);
 const config=structuredClone(f.config);config.site.locale='pt-BR';config.localization=JSON.parse(await readFile(new URL('../../../examples/localization/messages.json',import.meta.url),'utf8'));config.localization.reviewStatus='reviewed';config.localization.direction='rtl';config.localization.collection=JSON.parse(await readFile(new URL('../../../examples/localization/collection-messages.json',import.meta.url),'utf8'));config.localization.formPermission=JSON.parse(await readFile(new URL('../../../examples/localization/form-messages.json',import.meta.url),'utf8'));
 const build=compileLegalDocuments(config),settings=structuredClone(f.settings);settings.reviewedArtifactId=build.manifest.artifactId;const c=prepareCollectionWorkbenchContext(build.artifact,{purposeIds:['message','updates'],settings}),plan=prepareCollectionFlowSettings(c,settings,{releaseConfirmed:true}),d=new JSDOM(plan.previewHtml).window.document;
 const section=d.querySelector('.nb-form-permission');assert.equal(section.closest('[lang]').getAttribute('lang'),'pt-BR');assert.equal(section.closest('[dir]').getAttribute('dir'),'rtl');assert.equal(d.querySelector('[data-collection-notice-id],[data-collection-flow-id]'),null);assert.deepEqual(createCollectionFlow(build.artifact,plan.settings),c.initial.flow);
});

test('authored releases keep their final identity and select the original build pipeline instead of a plain-config rebuild',async()=>{
 const f=await setup(),{compileAuthoredDocuments}=await import('@notabenda/authoring');
 const authored=await compileAuthoredDocuments(f.config,{terms:{format:'mdx',source:'---\nkind: terms\ntitle: Reviewed sample terms\nroute: /terms\nversion: authored-one\neffectiveDate: 2026-10-22\nreview:\n  status: reviewed\n---\n## Supplied terms\n\nRetained authored wording for this fixture.'}});
 const settings={...structuredClone(f.settings),reviewedArtifactId:authored.manifest.artifactId},context=prepareCollectionWorkbenchContext(authored.artifact,{purposeIds:['message','updates'],settings});assert.equal(context.buildMethod,'final-artifact');assert.equal(context.facts.artifactId,authored.manifest.artifactId);assert.notEqual(context.facts.artifactId,f.build.manifest.artifactId);assert.doesNotMatch(JSON.stringify(context),/Retained authored wording|sourceAttachments|renderedBodies/);const exported=prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}).settings;assert.deepEqual(createCollectionFlow(authored.artifact,exported),context.initial.flow);assert.throws(()=>createCollectionFlow(f.build.artifact,exported));
 const b=browser(),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context});try{b.d.querySelector('[data-workbench=release]').checked=true;button(b.d,'Copy build settings').click();await tick();await tick();assert.match(b.d.querySelector('dialog').textContent,/createCollectionFlow\(finalArtifact, settings\)/);assert.doesNotMatch(b.d.querySelector('dialog').textContent,/notabenda build --config/);}finally{ui.destroy();b.dom.window.close();}
});

test('handoffs preserve production artifact identity for draft wording and require actual build-method enum strings',async()=>{
 const f=await setup(),context=prepared(f),draft=structuredClone(f.settings);draft.notice.reviewStatus='draft';
 const plan=collectionWorkbenchHandoff(context,draft);assert.equal(plan.kind,'final-artifact');assert.equal(plan.preview,true);assert.match(plan.command,/mode: 'preview'/);assert.doesNotMatch(plan.command,/notabenda build/);
 const flow=createCollectionFlow(f.build.artifact,draft,{mode:'preview'});assert.equal(flow.artifactId,f.build.manifest.artifactId);const changed=compileLegalDocuments(f.config,{mode:'preview'});assert.notEqual(changed.manifest.artifactId,draft.reviewedArtifactId);assert.throws(()=>createCollectionFlow(changed.artifact,draft,{mode:'preview'}));
 assert.equal(collectionWorkbenchHandoff(context,f.settings).kind,'configuration');
 const authored=structuredClone(context);authored.buildMethod='final-artifact';assert.match(collectionWorkbenchHandoff(authored,draft).command,/mode: 'preview'/);
 for(const value of [['final-artifact'],{},1,true]){const c=structuredClone(context);c.buildMethod=value;assert.throws(()=>normalizeCollectionWorkbenchContext(c));}
});

test('even structured releases use their exact artifact when a default CLI rebuild cannot reproduce custom build options',async()=>{
 const f=await setup(),custom=compileLegalDocuments(f.config,{stylesheetUrl:'/assets/custom-policy.css'}),settings={...structuredClone(f.settings),reviewedArtifactId:custom.manifest.artifactId},context=prepareCollectionWorkbenchContext(custom.artifact,{purposeIds:['message','updates'],settings});
 assert.equal(context.buildMethod,'final-artifact');assert.notEqual(custom.manifest.artifactId,f.build.manifest.artifactId);assert.equal(collectionWorkbenchHandoff(context,settings).kind,'final-artifact');assert.deepEqual(createCollectionFlow(custom.artifact,prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}).settings),context.initial.flow);
});
