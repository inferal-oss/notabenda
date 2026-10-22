// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-SCOPE-GUARDS REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-CONFIG-SOURCES
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {prepareCollectionWorkbenchContext} from '@notabenda/core/authoring/collection';
import {prepareCollectionFlowSettings,formatCollectionWorkbenchSettings,normalizeCollectionWorkbenchContext,collectionPermissionAuthoring} from '@notabenda/core/authoring/collection/model';
import {mountCollectionWorkbench} from '@notabenda/core/authoring/collection/ui';
import {createCollectionFlow,verifyCollectionFlow,compileLegalDocuments,createFormPermissionOffer} from '@notabenda/core/content';
import {normalizeFormPermissionOffer} from '@notabenda/core';
import {parseConfigSource} from '@notabenda/core/config/document';
import {setup} from './collection-flow-fixture.mjs';
const prepare=(f,settings)=>prepareCollectionWorkbenchContext(f.build.artifact,{purposeIds:['message','updates'],...(settings?{settings}:{})});
const button=(d,text)=>[...d.querySelectorAll('button')].find(b=>b.textContent===text);
const tick=()=>new Promise(r=>setTimeout(r,0));
function browser(){const dom=new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>',{url:'https://editor.example.test/'}),d=dom.window.document;let effects=0;dom.window.fetch=()=>{effects++;throw Error('No transport');};for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(dom.window,key,{get(){effects++;throw Error('No storage');}});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};return {dom,d,effects:()=>effects};}
function set(b,suffix,value,event='input'){const n=b.d.querySelector('[id$="'+suffix+'"]');assert.ok(n,suffix);n.value=value;n.dispatchEvent(new b.dom.window.Event(event,{bubbles:true}));return n;}
function permissionFields(b,p){for(const [key,value] of Object.entries(p)){if(key==='refusal'||key==='reviewStatus')continue;if(value&&typeof value==='object'){for(const [child,text] of Object.entries(value))set(b,'-permission-updates-'+key+'-'+child,String(text));}else set(b,'-permission-updates-'+key,String(value));}}

test('fresh release contexts author ordinary offers and every settings format builds the same verified flow',async()=>{
 const f=await setup(),context=prepare(f),settings=structuredClone(f.settings),p=settings.decisions[1].permission;p.revision='two';p.wording.statement='Send me monthly reading updates by email.';p.withdrawalUrl='/account/reading';p.deliveryWindowSeconds=120;
 const before=structuredClone(context),plan=prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}),flow=createCollectionFlow(f.build.artifact,plan.settings);assert.deepEqual(verifyCollectionFlow(flow,f.build.artifact),flow);assert.equal(flow.permissions[0].wording.statement,p.wording.statement);assert.notEqual(flow.permissions[0].offerId,f.flow.permissions[0].offerId);assert.deepEqual(context,before);
 for(const format of ['json','yaml','markdown']){const text=await formatCollectionWorkbenchSettings(context,settings,format),parsed=(await parseConfigSource(text,format)).config;assert.deepEqual(parsed,settings);assert.deepEqual(createCollectionFlow(f.build.artifact,parsed),flow);}
 const d=new JSDOM(plan.previewHtml).window.document;assert.match(d.body.textContent,/monthly reading updates/);assert.equal(d.querySelector('[data-offer-id],[data-collection-flow-id],[data-collection-notice-id],input,button,form,script'),null);assert.doesNotMatch(plan.previewHtml,new RegExp(flow.permissions[0].offerId));assert.equal(context.initial,undefined);
 const offer=createFormPermissionOffer(f.build.artifact,{...p,purposeId:'updates'});assert.deepEqual(Object.keys(offer).slice(0,4),['schemaVersion','refusal','offerId','siteId']);assert.throws(()=>normalizeFormPermissionOffer((({offerId,...content})=>content)(offer)));
});

test('invalid permission settings fail in the workbench and final builder instead of being dropped or converted',async()=>{
 const f=await setup(),context=prepare(f);
 for(const mutate of [p=>p.purposeId='other',p=>p.marketingRequest={method:'email'},p=>p.methodLabel='Email',p=>p.extra=true,p=>p.channel.extra=true,p=>p.channel.id='Email',p=>p.permissionId='bad id',p=>p.withdrawalUrl='javascript:alert(1)',p=>p.withdrawalUrl='https://user:pass@example.test/',p=>p.deliveryWindowSeconds=29,p=>p.deliveryWindowSeconds=3601,p=>p.deliveryWindowSeconds=30.5,p=>p.deliveryWindowSeconds='600',p=>p.deliveryWindowSeconds=null,p=>p.refusal=null,p=>p.wording.statement+='\nAnother paragraph',p=>p.wording.title='😀'.repeat(76),p=>p.refusal={label:'No'},p=>p.wording.grantLabel='',p=>p.wording.statement=f.settings.notice.wording.intro]){
  const settings=structuredClone(f.settings);mutate(settings.decisions[1].permission);assert.throws(()=>prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}),undefined,mutate.toString());assert.throws(()=>createCollectionFlow(f.build.artifact,settings),undefined,mutate.toString());
 }
 const settings=structuredClone(f.settings);settings.decisions[0]={purposeId:'message',presentation:'separate-permission',permission:structuredClone(settings.decisions[1].permission)};assert.throws(()=>prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}),/different permission ID/);assert.throws(()=>createCollectionFlow(f.build.artifact,settings));
});

test('scope and permission-language gaps block only separate permissions, including inherited site restrictions',async()=>{
 const f=await setup();for(const change of [c=>delete c.scopeGuards,c=>c.scopeGuards.site.children='unknown',c=>{c.scopeGuards.site.sensitiveData='present';c.scopeGuards.purposes=[{id:'updates',facts:{sensitiveData:'absent'}}];}]){
  const config=structuredClone(f.config);change(config);const build=compileLegalDocuments(config),context=prepareCollectionWorkbenchContext(build.artifact,{purposeIds:['message','updates']}),settings={...structuredClone(f.settings),reviewedArtifactId:build.manifest.artifactId};assert.equal(collectionPermissionAuthoring(context,'updates').available,false);assert.throws(()=>prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}),/assessment/);settings.decisions=settings.decisions.map(d=>({purposeId:d.purposeId,presentation:'notice-only'}));assert.equal(createCollectionFlow(build.artifact,prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}).settings).permissions.length,0);
 }
 const config=structuredClone(f.config);config.site.locale='pt-BR';config.localization=JSON.parse(await readFile(new URL('../../../examples/localization/messages.json',import.meta.url),'utf8'));config.localization.reviewStatus='reviewed';config.localization.collection=JSON.parse(await readFile(new URL('../../../examples/localization/collection-messages.json',import.meta.url),'utf8'));
 let build=compileLegalDocuments(config),settings={...structuredClone(f.settings),reviewedArtifactId:build.manifest.artifactId},context=prepareCollectionWorkbenchContext(build.artifact,{purposeIds:['message','updates']});assert.throws(()=>prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true}),/localization.formPermission/);
 config.localization.formPermission=JSON.parse(await readFile(new URL('../../../examples/localization/form-messages.json',import.meta.url),'utf8'));config.localization.direction='rtl';build=compileLegalDocuments(config);settings.reviewedArtifactId=build.manifest.artifactId;context=prepareCollectionWorkbenchContext(build.artifact,{purposeIds:['message','updates']});const plan=prepareCollectionFlowSettings(context,settings,{releaseConfirmed:true});assert.deepEqual(verifyCollectionFlow(createCollectionFlow(build.artifact,plan.settings),build.artifact).notice.locale,'pt-BR');assert.match(plan.previewHtml,/dir="rtl"/);assert.deepEqual(context.permissionContext.localization.formPermission,config.localization.formPermission);
 for(const mutate of [c=>c.permissionContext.scopeGuards.pop(),c=>c.permissionContext.scopeGuards.push(c.permissionContext.scopeGuards[0]),c=>c.permissionContext.scopeGuards[0].assessment.facts.children='maybe',c=>c.permissionContext.localization.locale='en',c=>c.permissionContext.localization.direction='ltr']){const copy=structuredClone(context);mutate(copy);assert.throws(()=>normalizeCollectionWorkbenchContext(copy));}
});

test('fresh UI authors a complete choice, keeps optional omissions, retains route drafts and resets review on every changed field',async()=>{
 const f=await setup(),b=browser(),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context:prepare(f)});
 try{for(const [key,value] of [['scopeId','reading-form'],['title','About reading updates'],['intro','We use your address for the purpose shown below.']])set(b,'-'+key,value);
 const box=b.d.querySelector('[data-purpose="updates"]');box.checked=true;box.dispatchEvent(new b.dom.window.Event('change'));set(b,'-route-updates','separate-permission','change');const p=structuredClone(f.settings.decisions[1].permission);delete p.refusal;permissionFields(b,p);set(b,'-wording-review','reviewed','change');b.d.querySelector('[data-workbench=release]').checked=true;set(b,'-permission-updates-review','reviewed','change');assert.equal(b.d.querySelector('[id$="-wording-review"]').value,'reviewed');assert.equal(b.d.querySelector('[data-workbench=release]').checked,false);b.d.querySelector('[data-workbench=release]').checked=true;const settings=ui.getSettings();assert.deepEqual(settings.decisions,[{purposeId:'updates',presentation:'separate-permission',permission:p}]);assert.equal(createCollectionFlow(f.build.artifact,settings).permissions.length,1);
 set(b,'-route-updates','notice-only','change');assert.ok(b.d.querySelector('.nb-workbench-permission-editor').hidden);set(b,'-route-updates','separate-permission','change');assert.equal(b.d.querySelector('[id$="-permission-updates-wording-statement"]').value,p.wording.statement);
 const editor=b.d.querySelector('[id$="-permission-updates-wording-statement"]').closest('fieldset');for(const field of editor.querySelectorAll('input[type=text],input[type=number],textarea')){if(field.disabled)continue;set(b,'-permission-updates-review','reviewed','change');b.d.querySelector('[data-workbench=release]').checked=true;field.dispatchEvent(new b.dom.window.Event('input',{bubbles:true}));assert.equal(b.d.querySelector('[id$="-permission-updates-review"]').value,'draft',field.id);assert.equal(b.d.querySelector('[data-workbench=release]').checked,false,field.id);}
 button(b.d,'Preview notice').click();assert.ok(b.d.querySelector('[data-collection-preview]'));const ids=[...b.d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);assert.equal(b.effects(),0);
 }finally{ui.destroy();b.dom.window.close();}
});

test('imported permission fields become the editable source, including refusal and delivery window, with fresh confirmation',async()=>{
 const f=await setup(),b=browser(),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context:prepare(f,f.settings)}),changed=structuredClone(f.settings);changed.decisions[1].permission.revision='imported-two';changed.decisions[1].permission.wording.statement='Send me quarterly updates.';changed.decisions[1].permission.deliveryWindowSeconds=90;
 try{const file=b.d.querySelector('input[type=file]');Object.defineProperty(file,'files',{configurable:true,value:[{size:1000,name:'flow.yaml',text:async()=>formatCollectionWorkbenchSettings(prepare(f),changed,'yaml')}]});file.dispatchEvent(new b.dom.window.Event('change'));await tick();await tick();assert.equal(b.d.querySelector('[data-workbench=release]').checked,false);assert.equal(b.d.querySelector('[id$="-permission-updates-wording-statement"]').value,'Send me quarterly updates.');b.d.querySelector('[data-workbench=release]').checked=true;assert.deepEqual(ui.getSettings(),changed);
 set(b,'-permission-updates-wording-statement','Send me annual updates.');set(b,'-permission-updates-revision','imported-three');set(b,'-permission-updates-review','reviewed','change');set(b,'-wording-review','reviewed','change');b.d.querySelector('[data-workbench=release]').checked=true;const edited=ui.getSettings();assert.equal(edited.decisions[1].permission.wording.statement,'Send me annual updates.');assert.equal(edited.decisions[1].permission.deliveryWindowSeconds,90);assert.deepEqual(edited.decisions[1].permission.refusal,changed.decisions[1].permission.refusal);assert.notDeepEqual(createCollectionFlow(f.build.artifact,edited),f.flow);
 button(b.d,'Copy build settings').click();await tick();await tick();assert.match(b.d.querySelector('textarea[readonly]').value,/annual updates/);assert.doesNotMatch(b.d.querySelector('textarea[readonly]').value,/quarterly updates/);assert.equal(b.effects(),0);
 }finally{ui.destroy();b.dom.window.close();}
});


test('a late file import cannot overwrite permission edits made after it started',async()=>{
 const f=await setup(),b=browser(),ui=mountCollectionWorkbench(b.d.querySelector('#host'),{context:prepare(f,f.settings)});let resolve;
 try{const source=new Promise(r=>resolve=r),file=b.d.querySelector('input[type=file]');Object.defineProperty(file,'files',{configurable:true,value:[{size:1000,name:'flow.json',text:()=>source}]});file.dispatchEvent(new b.dom.window.Event('change'));set(b,'-permission-updates-wording-statement','Keep this later local edit.');resolve(JSON.stringify(f.settings));await tick();await tick();assert.equal(b.d.querySelector('[id$="-permission-updates-wording-statement"]').value,'Keep this later local edit.');assert.equal(b.d.querySelector('[data-workbench=release]').checked,false);assert.equal(b.d.querySelector('[id$="-permission-updates-review"]').value,'draft');assert.equal(b.effects(),0);
 }finally{ui.destroy();b.dom.window.close();}
});

test('identity-free permission validation reserves the authoritative offer identity within the same byte bound',async()=>{
 const f=await setup(),offer=structuredClone(f.flow.permissions[0]),{normalizeFormPermissionContent}=await import('../dist/form-permission.js');
 const {offerId,...content}=offer;assert.deepEqual(normalizeFormPermissionContent(content),content);assert.throws(()=>normalizeFormPermissionOffer(content));
 content.facts.recipients=Array.from({length:60},(_,i)=>({id:'recipient-'+i,name:'Recipient',provider:'Example provider',location:'x'.repeat(400),purposeIds:['updates']}));
 const bytes=()=>new TextEncoder().encode(JSON.stringify(content)).length;
 while(bytes()>32691)content.facts.recipients.pop();let cursor=0;while(bytes()<32691)content.facts.recipients[cursor++%content.facts.recipients.length].location+='x';
 assert.equal(bytes(),32691);assert.ok(content.facts.recipients.every(r=>r.location.length<=4000));assert.deepEqual(normalizeFormPermissionContent(content),content);content.facts.recipients[0].location+='x';assert.equal(bytes(),32692);assert.throws(()=>normalizeFormPermissionContent(content));assert.throws(()=>normalizeFormPermissionOffer({schemaVersion:content.schemaVersion,offerId,...content},{allowPreview:true}));
});
