// @requirements REQ-PRODUCT-RIGHTS-AUTHORING REQ-PRODUCT-RIGHTS-CENTER REQ-PRODUCT-DRAFT-PREVIEW REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mkdtemp,writeFile,readFile,rm,symlink,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRightsDraftPlan,normalizeRightsDraftInput} from '@notabenda/core/setup/rights';
import {mountRightsEditor} from '@notabenda/core/setup/rights/ui';
import {mountSetup} from '@notabenda/core/setup/ui';
import {mountLegalPreview} from '@notabenda/core/setup/preview';
import {selectPacks} from '@notabenda/core/packs';
import {compileLegalDocuments} from '@notabenda/core/content';
import {toPublicConfig} from '@notabenda/core';
import {applySetupRightsFile,reviewSetupRights} from '../dist/setup-rights-cli.js';
import {fixture} from './helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const settings=()=>({schemaVersion:1,revision:'request-page-1',route:'/requests',title:'Request help',intro:'Choose the route that fits your request.',contact:{label:'Email privacy',href:'mailto:privacy@example.test',description:'Use email if the account route does not fit.'},actions:[{id:'access',kind:'access',title:'Information about your account',description:'Ask for a copy.',scope:'Account information relating to you; identity checks happen in the linked application.',link:{label:'Open request workflow',href:'/account/requests'}}],nextSteps:['The linked workflow explains the next step.\nUse the email fallback if needed.']});
const input=()=>({schemaVersion:1,linkPrivacyToPage:true,settings:settings()});
const change=(config,value=settings())=>({baseline:config,settings:value,linkPrivacyToPage:true});
const button=(root,text)=>[...root.querySelectorAll('button')].find(e=>e.textContent===text);
function field(root,label){const caption=[...root.querySelectorAll('label')].find(e=>e.textContent===label);assert.ok(caption,label);return root.querySelector('#'+caption.htmlFor);}
function browser(){const dom=new JSDOM('<form><div id="root"></div></form>',{url:'https://adopter.example.test/setup'}),root=dom.window.document.getElementById('root');dom.window.URL.createObjectURL=()=> 'blob:local';dom.window.URL.revokeObjectURL=()=>{};dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};return {dom,root};}
function fill(root,value=settings()){for(const [label,text] of Object.entries({'Request page route':value.route,'New page revision':value.revision,'Page title':value.title,'Page introduction':value.intro,'Contact link label':value.contact.label,'Contact email or phone URI':value.contact.href,'When to use this contact':value.contact.description,'Stable destination ID':value.actions[0].id,'Request kind':value.actions[0].kind,'Destination title':value.actions[0].title,'Destination description':value.actions[0].description,'Who and what this route covers':value.actions[0].scope,'Destination link label':value.actions[0].link.label,'Destination URL':value.actions[0].link.href,'Next-step explanation':value.nextSteps[0]}))field(root,label).value=text;}

test('explicit request-page authoring is detached, atomic and preserves unrelated public facts',async()=>{
 const config=await fixture({reviewed:true}),before=structuredClone(config);config.privacy.rightsUrl='https://example.test/older-request-route';const publicBefore=toPublicConfig(config,{mode:'preview'}),plan=createRightsDraftPlan(config,change(config));
 assert.equal(plan.action,'add');assert.deepEqual(plan.privacyLink,{from:config.privacy.rightsUrl,to:'/requests'});assert.equal(plan.config.privacy.rightsUrl,'/requests');assert.deepEqual(plan.config.rightsCenter,{...settings(),reviewStatus:'draft'});assert.equal(plan.config.rightsCenter.actions.length,1);
 for(const key of ['site','controller','purposes','services','storage','terms','consent','scopeGuards'])assert.deepEqual(plan.config[key],publicBefore[key]);for(const doc of Object.values(plan.config.documents))assert.equal(doc.review.status,'draft');assert.deepEqual(config,{...before,privacy:{...before.privacy,rightsUrl:config.privacy.rightsUrl}});
 const compiled=compileLegalDocuments(plan.config,{mode:'preview'});assert.equal(Object.keys(compiled.artifact.pages).length,3);assert.deepEqual(Object.keys(compiled.artifact.documents),['privacy','cookies','terms']);assert.ok(compiled.files['requests/index.html']);assert.match(compiled.files['privacy/index.html']??Object.values(compiled.artifact.pages)[0],/\/requests/);
 plan.config.rightsCenter.actions[0].title='Detached';assert.equal(settings().actions[0].title,'Information about your account');
});

test('page updates need a new current revision and an unchanged reviewed public baseline',async()=>{
 const original=createRightsDraftPlan(await fixture(),change(await fixture())).config;
 assert.throws(()=>createRightsDraftPlan(original,change(original)),/No request-page settings changed/);
 const updated=settings();updated.route='/new-requests';updated.title='Updated page';assert.throws(()=>createRightsDraftPlan(original,change(original,updated)),/new, never-reused/);updated.revision='request-page-2';
 const plan=createRightsDraftPlan(original,change(original,updated));assert.equal(plan.action,'update');assert.equal(plan.config.privacy.rightsUrl,'/new-requests');assert.equal(original.privacy.rightsUrl,'/requests');
 for(const mutate of [c=>c.site.name='Changed',c=>c.privacy.rightsUrl='https://example.test/change',c=>c.purposes[0].description='Changed facts',c=>c.documents.terms.version='other']){const base=await fixture(),changed=structuredClone(base);mutate(changed);assert.throws(()=>createRightsDraftPlan(changed,{...change(base),baseline:base}),/draft changed/);}
});

test('incomplete, executable, ambiguous and colliding proposals fail without mutation or inferred defaults',async()=>{
 const config=await fixture(),before=structuredClone(config);
 for(const mutate of [v=>delete v.contact,v=>v.reviewStatus='reviewed',v=>v.route='/privacy',v=>v.actions=[],v=>v.actions[0].kind='',v=>v.actions[0].link.href='javascript:alert(1)',v=>v.contact.href='mailto:privacy@example.test?body=private',v=>v.nextSteps=[],v=>v.extra=true,v=>v.actions.push(v.actions[0]),v=>v.revision='',v=>v.actions[0].extra=true]){const value=settings();mutate(value);assert.throws(()=>createRightsDraftPlan(config,change(config,value)));assert.deepEqual(config,before);}
 for(const linkPrivacyToPage of [undefined,false,'true'])assert.throws(()=>createRightsDraftPlan(config,{...change(config),linkPrivacyToPage}));
 let accessed=0;const value=settings();Object.defineProperty(value,'title',{enumerable:true,get(){accessed++;return 'PRIVATE';}});assert.throws(()=>createRightsDraftPlan(config,change(config,value)));assert.equal(accessed,0);
 for(const value of [{...input(),extra:true},{...input(),schemaVersion:2},{...input(),linkPrivacyToPage:false}])assert.throws(()=>normalizeRightsDraftInput(value));
 const sparse=settings();sparse.actions.length=2;assert.throws(()=>createRightsDraftPlan(config,change(config,sparse)));const symbolic=settings();symbolic[Symbol('private')]=1;assert.throws(()=>createRightsDraftPlan(config,change(config,symbolic)));
});

test('non-English authoring leaves the locale and imported declarations unresolved',async()=>{
 const config=localizedExampleConfig(await fixture());const before=structuredClone(config);assert.throws(()=>createRightsDraftPlan(config,change(config)),/localized UI/);assert.deepEqual(config,before);
 const f=browser(),ui=mountRightsEditor(f.root,{getConfig:()=>config,onChange:()=>assert.fail()});try{ui.open();assert.match(f.root.textContent,/English only/);assert.equal(f.root.querySelector('textarea'),null);assert.ok(button(f.root,'Cancel page changes'));}finally{ui.destroy();f.dom.window.close();}
});

test('editor starts blank, requires explicit link replacement and saves complete operator wording only',async()=>{
 const f=browser();let config=await fixture(),calls=0;config.privacy.rightsUrl='https://example.test/current';const ui=mountRightsEditor(f.root,{getConfig:()=>config,onChange:plan=>{calls++;config=plan.config;}});
 try{ui.open();assert.equal(field(f.root,'Request kind').value,'');assert.equal(field(f.root,'Page title').value,'');assert.equal(f.root.querySelector('input[type=checkbox]').checked,false);fill(f.root);button(f.root,'Save page and privacy link').click();assert.equal(calls,0);assert.match(f.root.querySelector('[role=alert]').textContent,/current and proposed/);assert.match(f.root.textContent,/https:\/\/example.test\/current/);
 const key=new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});field(f.root,'Page title').dispatchEvent(key);assert.equal(key.defaultPrevented,true);assert.equal(calls,0);
 f.root.querySelector('input[type=checkbox]').checked=true;button(f.root,'Save page and privacy link').click();assert.equal(calls,1);assert.deepEqual(config.rightsCenter,{...settings(),reviewStatus:'draft'});assert.equal(config.privacy.rightsUrl,'/requests');assert.equal(f.dom.window.document.activeElement.textContent,'Edit request page');assert.match(f.root.querySelector('[role=status]').textContent,/local draft/);
 ui.open();assert.equal(f.root.querySelector('details').open,false);assert.equal(field(f.root,'Stable destination ID').readOnly,true);field(f.root,'Destination title').value='';button(f.root,'Save page and privacy link').click();assert.equal(f.root.querySelector('details').open,true);assert.equal(f.dom.window.document.activeElement,field(f.root,'Destination title'));assert.equal(calls,1);
 }finally{ui.destroy();f.dom.window.close();}
});

test('cancellation, stale saves and host failure cannot claim an adopted page',async()=>{
 const f=browser();let config=await fixture(),calls=0,fail=false;const ui=mountRightsEditor(f.root,{getConfig:()=>config,onChange:()=>{if(fail)throw Error('PRIVATE');calls++;}});
 try{ui.open();fill(f.root);button(f.root,'Cancel page changes').click();assert.equal(calls,0);ui.open();fill(f.root);f.root.querySelector('input[type=checkbox]').checked=true;config.site.name='Other name';button(f.root,'Save page and privacy link').click();assert.match(f.root.querySelector('[role=alert]').textContent,/draft changed/);assert.equal(calls,0);ui.open();fill(f.root);f.root.querySelector('input[type=checkbox]').checked=true;fail=true;button(f.root,'Save page and privacy link').click();assert.match(f.root.querySelector('[role=alert]').textContent,/Could not confirm/);assert.doesNotMatch(f.root.textContent,/PRIVATE/);assert.equal(calls,0);
 }finally{ui.destroy();f.dom.window.close();}
});

test('setup exposes the pack editor and invalidates prepared exports only on adopted edits',async()=>{
 const f=browser(),config=await fixture(),ui=mountSetup(f.root,{config,cartridges:selectPacks(['privacy-requests'])}),submit=()=>f.root.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 try{submit();const before=ui.getPlan();assert.ok(before);button(f.root,'Configure request page').click();assert.equal(f.root.querySelector('.nb-setup-rights-panel').hidden,false);fill(f.root);field(f.root,'Page title').dispatchEvent(new f.dom.window.Event('input',{bubbles:true}));assert.deepEqual(ui.getPlan(),before);f.root.querySelector('.nb-setup-rights-panel input[type=checkbox]').checked=true;button(f.root,'Save page and privacy link').click();assert.equal(ui.getPlan(),null);submit();assert.deepEqual(ui.getPlan().config.rightsCenter,{...settings(),reviewStatus:'draft'});assert.ok(button(f.root,'Edit request page'));}finally{ui.destroy();f.dom.window.close();}
});

test('local supporting-page previews are inert and leave the three pinned document kinds intact',async()=>{
 const config=createRightsDraftPlan(await fixture(),change(await fixture())).config,f=browser(),before=structuredClone(config);let effects=0;f.dom.window.fetch=()=>{effects++;throw Error('Network');};const ui=mountLegalPreview(f.root,{config,initialDocument:'rights'}),other=mountLegalPreview(f.root,{config,initialDocument:'rights'});
 try{ui.open();assert.ok(f.root.querySelector('.nb-rights-center'));assert.match(f.root.querySelector('.nb-legal-preview-status').textContent,/Supporting page · Revision request-page-1/);assert.equal(f.root.querySelectorAll('.nb-legal-preview-navigation')[0].children.length,4);for(const a of f.root.querySelectorAll('.nb-rights-center a')){assert.equal(a.getAttribute('href'),null);assert.equal(a.getAttribute('aria-disabled'),'true');}const ids=[...f.root.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);assert.deepEqual(config,before);assert.equal(effects,0);
 }finally{ui.destroy();other.destroy();f.dom.window.close();}
});

test('unsupported rights preview is disabled without breaking legal previews or changing locale',async()=>{
 const config=createRightsDraftPlan(await fixture(),change(await fixture())).config;const localized=localizedExampleConfig(await fixture());config.site.locale=localized.site.locale;config.localization=localized.localization;const f=browser();try{assert.throws(()=>mountLegalPreview(f.root,{config,initialDocument:'rights'}),/English only/);assert.equal(f.root.children.length,0);const ui=mountLegalPreview(f.root,{config});try{assert.match(f.root.querySelector('button:disabled').textContent,/English renderer only/);ui.open();assert.equal(f.root.querySelector('.nb-document').dataset.documentKind,'privacy');assert.equal(config.site.locale,'pt-BR');}finally{ui.destroy();}}finally{f.dom.window.close();}
});

test('bounded ordinary JSON proposal files are required and interactive confirmation rechecks the current baseline',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-rights-'));try{const path=join(cwd,'page.json');await writeFile(path,JSON.stringify(input()));const config=await fixture(),adopted=await applySetupRightsFile(config,path);assert.equal(adopted.privacy.rightsUrl,'/requests');
 for(const contents of ['{}','null','x'.repeat(128*1024+1)]){await writeFile(path,contents);await assert.rejects(applySetupRightsFile(config,path));}
 await writeFile(path,JSON.stringify(input()));const alias=join(cwd,'alias.json');await symlink(path,alias);await assert.rejects(applySetupRightsFile(config,alias));await mkdir(join(cwd,'directory'));await assert.rejects(applySetupRightsFile(config,join(cwd,'directory')));
 let answers=['yes',path,'no'];assert.equal(await reviewSetupRights(config,async()=>answers.shift()),config);answers=['yes',path,'yes'];let count=0;assert.equal(await reviewSetupRights(config,async()=>{count++;if(count===3)config.site.name='Changed at confirmation';return answers.shift();}),config);assert.equal(config.rightsCenter,undefined);
 answers=['yes',path,'yes'];const result=await reviewSetupRights(config,async()=>answers.shift());assert.equal(result.rightsCenter.revision,'request-page-1');
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('wizard --rights applies the shared plan, preserves original files and rejects the flag on other commands',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-rights-cli-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;try{const config=await fixture(),original=JSON.stringify(config);await writeFile(join(cwd,'config.json'),original);await writeFile(join(cwd,'rights.json'),JSON.stringify(input()));await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));
 const result=spawnSync(process.execPath,[cli,'wizard','--packs','privacy-requests','--answers','answers.json','--config','config.json','--rights','rights.json','--out-dir','draft'],{cwd,encoding:'utf8'});assert.equal(result.status,0,result.stderr);const output=JSON.parse(await readFile(join(cwd,'draft/notabenda.config.json'),'utf8'));assert.deepEqual(output.rightsCenter,{...settings(),reviewStatus:'draft'});assert.equal(output.privacy.rightsUrl,'/requests');assert.equal(await readFile(join(cwd,'config.json'),'utf8'),original);
 const bad=spawnSync(process.execPath,[cli,'validate','--rights','rights.json'],{cwd,encoding:'utf8'});assert.notEqual(bad.status,0);await writeFile(join(cwd,'rights.json'),'{}');const failed=spawnSync(process.execPath,[cli,'wizard','--answers','answers.json','--rights','rights.json','--out-dir','invalid'],{cwd,encoding:'utf8'});assert.notEqual(failed.status,0);await assert.rejects(readFile(join(cwd,'invalid/notabenda.config.json')));
 }finally{await rm(cwd,{recursive:true,force:true});}
});
