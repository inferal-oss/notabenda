// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-RIGHTS-AUTHORING REQ-PRODUCT-RIGHTS-CENTER
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {renderRightsCenter,renderRightsPage,toPublicConfig,validateSiteConfig} from '@notabenda/core';
import {RightsCenter} from '@notabenda/core/react/documents';
import {compileLegalDocuments,compileConsentRuntimeConfig,createConsentNotice,canonicalJson} from '@notabenda/core/content';
import {createRightsDraftPlan} from '@notabenda/core/setup/rights';
import {mountRightsEditor} from '@notabenda/core/setup/rights/ui';
import {mountLegalPreview} from '@notabenda/core/setup/preview';
import {reviewPackInputs,selectPacks,planPacks} from '@notabenda/core/packs';
import {assessIntegration} from '@notabenda/core/integration/assessment';
import {recordLegalRelease,createDocumentHistory,registerConsentNotice,setActiveConsentNotice,getConsentHead,recordConsentChoice} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {localizedRightsConfig,localizedRightsFiles} from '../../../examples/localization/rights-build.mjs';
import {fixture} from './helpers.mjs';
import {consentProfiles} from './consent-profiles.mjs';
const configured=async()=>localizedRightsConfig(localizedExampleConfig(await fixture()));
const settings=config=>{const {reviewStatus,...value}=structuredClone(config.rightsCenter);return value;};
const button=(root,name)=>[...root.querySelectorAll('button')].find(e=>e.textContent===name);
function browser(){const dom=new JSDOM('<main><div id="root"></div></main>',{url:'https://adopter.example.test/setup'});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};return {dom,root:dom.window.document.getElementById('root')};}

test('the full page and fragment use every selected visitor message and language metadata',async()=>{
 const c=await configured(),before=structuredClone(c),html=renderRightsPage(c,{mode:'preview'}),dom=new JSDOM(html),d=dom.window.document;
 try{assert.equal(d.documentElement.lang,'pt-BR');assert.equal(d.documentElement.dir,'ltr');assert.equal(d.querySelector('.nb-rights-center').lang,'pt-BR');assert.equal(d.querySelector('.nb-rights-center').dir,'ltr');for(const text of Object.values(c.localization.rights))assert.ok(d.body.textContent.includes(text),text);assert.equal(d.querySelector('.nb-skip-link').textContent,c.localization.documents.skipToContent);assert.equal(d.querySelector('.nb-site-header span').textContent,c.localization.documents.privacyRequests);assert.equal(d.querySelector('.nb-rights-link').getAttribute('href'),c.rightsCenter.actions[0].link.href);assert.equal(d.querySelector('script,form'),null);assert.doesNotMatch(d.body.textContent,/Your information|REQUEST OPTION|Draft rights information|Contact the operator|What happens next|Skip to content|Privacy requests/);assert.deepEqual(c,before);
 assert.equal(renderToStaticMarkup(createElement(RightsCenter,{config:c,mode:'preview',idPrefix:'pt-requests'})),'<div>'+renderRightsCenter(c,{mode:'preview',idPrefix:'pt-requests'})+'</div>');
 }finally{dom.window.close();}
});

test('message sets are complete, plain text, closed and bounded; getters never execute',async()=>{
 const original=await configured();for(const mutate of [c=>delete c.localization.rights.draft,c=>c.localization.rights.extra='Unused',c=>c.localization.rights.contactHeading='<b>Contact</b>',c=>c.localization.rights.nextStepsHeading='{unknown}',c=>c.localization.rights.yourInformation='',c=>c.localization.rights.requestOption='x'.repeat(2001),c=>c.localization.rights.draft='x\n',c=>c.localization.rights=null]){const c=structuredClone(original);mutate(c);assert.equal(validateSiteConfig(c,{mode:'preview'}).valid,false);assert.throws(()=>renderRightsCenter(c,{mode:'preview'}));}
 let invoked=0;const c=structuredClone(original);Object.defineProperty(c.localization.rights,'draft',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});assert.throws(()=>toPublicConfig(c,{mode:'preview'}));assert.equal(invoked,0);
});

test('missing page messages stay unresolved without disabling the other legal previews',async()=>{
 const c=await configured();delete c.localization.rights;const before=structuredClone(c),f=browser();try{assert.equal(validateSiteConfig(c,{mode:'preview'}).valid,true);assert.throws(()=>renderRightsCenter(c,{mode:'preview'}),/localization.rights/);assert.throws(()=>createRightsDraftPlan(c,{baseline:c,settings:settings(c),linkPrivacyToPage:true}),/localization.rights/);const ui=mountLegalPreview(f.root,{config:c});try{assert.match(f.root.querySelector('button:disabled').textContent,/translations needed/);ui.open();assert.ok(f.root.querySelector('.nb-document'));}finally{ui.destroy();}assert.deepEqual(c,before);}finally{f.dom.window.close();}
});

test('right-to-left metadata reaches the page, fragment and isolated action ordinal',async()=>{
 const c=await configured();c.site.locale=c.localization.locale='ar';c.localization.direction='rtl';const dom=new JSDOM(renderRightsPage(c,{mode:'preview'}));try{assert.equal(dom.window.document.documentElement.dir,'rtl');assert.equal(dom.window.document.querySelector('.nb-rights-center').dir,'rtl');assert.equal(dom.window.document.querySelector('.nb-rights-center').lang,'ar');assert.equal(dom.window.document.querySelector('.nb-rights-number bdi').textContent,'01');}finally{dom.window.close();}
});

test('localized authoring preserves the locale/dictionary and scopes the local supporting preview',async()=>{
 const c=await configured(),before=structuredClone(c),value=settings(c);value.title='Sua solicitação';value.revision='requests-pt-2';const plan=createRightsDraftPlan(c,{baseline:c,settings:value,linkPrivacyToPage:true});assert.equal(plan.config.site.locale,'pt-BR');assert.deepEqual(plan.config.localization,c.localization);assert.equal(plan.config.rightsCenter.title,value.title);assert.deepEqual(c,before);
 const f=browser(),ui=mountLegalPreview(f.root,{config:plan.config,initialDocument:'rights'});try{ui.open();assert.equal(f.root.querySelector('.nb-rights-center').lang,'pt-BR');for(const a of f.root.querySelectorAll('.nb-rights-center a')){assert.equal(a.getAttribute('href'),null);assert.equal(a.getAttribute('aria-disabled'),'true');}assert.match(f.root.textContent,/Sua solicitação/);assert.equal(f.root.querySelector('.nb-legal-preview-navigation').children.length,4);}finally{ui.destroy();f.dom.window.close();}
});

test('the setup editor works with supplied messages and rejects a stale dictionary edit',async()=>{
 let c=await configured(),calls=0;const f=browser(),editor=mountRightsEditor(f.root,{getConfig:()=>c,onChange:plan=>{calls++;c=plan.config;}});const field=label=>{const el=[...f.root.querySelectorAll('label')].find(e=>e.textContent===label);return f.root.querySelector('#'+el.htmlFor);};
 try{editor.open();assert.ok(f.root.querySelector('textarea'));field('New page revision').value='requests-pt-2';field('Page title').value='Sua solicitação';f.root.querySelector('input[type=checkbox]').checked=true;c.localization.rights.contactHeading='Outro contato';button(f.root,'Save page and privacy link').click();assert.match(f.root.querySelector('[role=alert]').textContent,/draft changed/);assert.equal(calls,0);editor.open();field('New page revision').value='requests-pt-2';field('Page title').value='Sua solicitação';f.root.querySelector('input[type=checkbox]').checked=true;button(f.root,'Save page and privacy link').click();assert.equal(calls,1);assert.equal(c.site.locale,'pt-BR');assert.equal(c.localization.rights.contactHeading,'Outro contato');assert.equal(c.rightsCenter.reviewStatus,'draft');}finally{editor.destroy();f.dom.window.close();}
});

test('draft translation status is visible and cannot pass a production build',async()=>{
 const c=await configured();c.rightsCenter.reviewStatus='reviewed';for(const doc of Object.values(c.documents))doc.review.status='reviewed';assert.match(renderRightsCenter(c,{mode:'preview'}),new RegExp(c.localization.rights.draft));assert.throws(()=>renderRightsPage(c));c.localization.reviewStatus='reviewed';assert.equal(validateSiteConfig(c,{mode:'production'}).valid,true);assert.doesNotMatch(renderRightsCenter(c),/class="nb-draft"/);
});

test('retained releases bind complete request-page messages without adding a fourth legal document',async()=>{
 const c=await configured(),build=compileLegalDocuments(c,{mode:'preview'}),store=createSyntheticStorage([]);assert.equal(Object.keys(build.artifact.pages).length,3);assert.deepEqual(Object.keys(build.artifact.documents),['privacy','cookies','terms']);assert.deepEqual(build.artifact.publicConfig.localization.rights,c.localization.rights);await recordLegalRelease(store,JSON.parse(canonicalJson(build.artifact)));assert.ok((await createDocumentHistory(store).get(build.manifest.artifactId)).data);
 const changed=structuredClone(c);changed.localization.revision+='-2';changed.localization.rights.contactHeading='Outra forma de contato';assert.notEqual(compileLegalDocuments(changed,{mode:'preview'}).manifest.artifactId,build.manifest.artifactId);assert.equal(compileConsentRuntimeConfig(c,{mode:'preview',evidence:'local'}).inventory.localization.rights,undefined);
});

test('the installed pack and target expose the exact translation input without assuming reviewed coverage',async()=>{
 const c=await configured(),selection=selectPacks(['privacy-requests']);
 const review=reviewPackInputs(selection,c);assert.equal(review.productionReady,false);assert.equal(review.packs[0].items.find(i=>i.id==='language').state,'declared');const serialized=JSON.stringify(review);assert.match(serialized,/localization.rights/);const target=planPacks(selection).reference.targets.find(t=>t.id==='privacy-rights');assert.ok(target.conditionalConfig.some(rule=>rule.requiredPaths.includes('localization.rights')));
 const targetSelection={schemaVersion:1,answers:{'rights-entry':'yes'}},assessed=assessIntegration({selection:targetSelection,config:c});assert.equal(assessed.validation.authoringShape.valid,true);assert.equal(assessed.missingRequiredConfig.some(item=>item.path==='localization.rights'),false);const missing=structuredClone(c);delete missing.localization.rights;assert.ok(assessIntegration({selection:targetSelection,config:missing}).missingRequiredConfig.some(item=>item.path==='localization.rights'));
});

test('the Portuguese example supplies complete static pages and an explicit no-submission destination',async()=>{
 const config=localizedExampleConfig(await fixture()),before=structuredClone(config),files=localizedRightsFiles(config);assert.deepEqual(config,before);assert.match(files['localization/rights/index.html'],/Solicitações de privacidade/);assert.doesNotMatch(files['localization/rights/index.html'],/<script|<form/);assert.match(files['localization/rights/workflow/index.html'],/Nenhuma solicitação foi enviada/);assert.ok(files['localization/rights/privacy/index.html']);
});

for(const [profile,factory] of consentProfiles)test(`${profile}: consent registration and actual choice recording ignore page-only messages`,async()=>{
 const c=await configured();c.localization.reviewStatus=c.rightsCenter.reviewStatus='reviewed';for(const doc of Object.values(c.documents))doc.review.status='reviewed';const build=compileLegalDocuments(c),notice=createConsentNotice(build.artifact,{scopeId:'privacy'}),store=createSyntheticStorage([]),context={siteId:c.site.id,scopeId:'privacy',streamId:'rights-language-test',allowPreview:true,now:()=>new Date('2026-10-20T12:00:00.000Z')};
 await recordLegalRelease(store,JSON.parse(canonicalJson(build.artifact)));assert.equal(notice.localization.rights,undefined);await registerConsentNotice(store,notice,context);await setActiveConsentNotice(store,notice.noticeId,context);const head=await getConsentHead(store,context),values=new Map();
 const controller=factory(c,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse('2026-10-20T12:00:00.000Z'),schedule:()=>()=>{}},{evidence:{notice,streamRef:head.streamRef,read:()=>getConsentHead(store,context),write:body=>recordConsentChoice(store,body,context)}});
 try{await controller.settled();controller.acceptAll();await controller.settled();assert.equal(controller.isAllowed('suggestions'),true,JSON.stringify(controller.getSnapshot()));assert.ok((await getConsentHead(store,context)).event);controller.rejectAll();await controller.settled();assert.equal(controller.isAllowed('suggestions'),false);}finally{controller.destroy();}
 const wrong=structuredClone(notice);wrong.localization.rights=c.localization.rights;await assert.rejects(registerConsentNotice(store,wrong,context));
});

test('the unattended wizard authors non-English settings with supplied messages and exposes their installed shape',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-rights-language-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;
 try{const config=await configured(),value=settings(config);value.revision='requests-pt-2';value.title='Sua solicitação';const original=JSON.stringify(config);await writeFile(join(cwd,'config.json'),original);await writeFile(join(cwd,'page.json'),JSON.stringify({schemaVersion:1,settings:value,linkPrivacyToPage:true}));await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));
 const run=args=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'}),schema=run(['schema','localization.rights','--json']);assert.equal(schema.status,0,schema.stderr);const shape=JSON.parse(schema.stdout);assert.deepEqual(shape.$defs[shape.$ref.split('/').at(-1)].required.sort(),Object.keys(config.localization.rights).sort());
 const result=run(['wizard','--packs','privacy-requests','--config','config.json','--answers','answers.json','--rights','page.json','--out-dir','review']);assert.equal(result.status,0,result.stderr);const output=JSON.parse(await readFile(join(cwd,'review/notabenda.config.json'),'utf8'));assert.equal(output.site.locale,'pt-BR');assert.deepEqual(output.localization.rights,config.localization.rights);assert.equal(output.rightsCenter.title,value.title);assert.equal(await readFile(join(cwd,'config.json'),'utf8'),original);
 }finally{await rm(cwd,{recursive:true,force:true});}
});
