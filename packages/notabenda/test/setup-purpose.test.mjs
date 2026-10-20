// @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-CONFIG REQ-PRODUCT-SCOPE-GUARDS REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-A11Y REQ-EU-INTERESTS-DISCLOSURE
import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {normalizeDraftPurpose,createPurposeDraftPlan} from '@notabenda/core/setup/purposes';import {mountPurposeEditor} from '@notabenda/core/setup/purposes/ui';
import {mountSetup} from '@notabenda/core/setup/ui';import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';import {validateSiteConfig,renderLegalDocument} from '@notabenda/core';
import {reviewSetupPurposes} from '../dist/setup-purpose-cli.js';import {createStarterConfig} from '../dist/starter.js';import {fixture} from './helpers.mjs';import {consentProfiles} from './consent-profiles.mjs';
const purpose=()=>({id:'support',name:'Respond to support enquiries',description:'Reply to messages sent through the contact form.',legalBasis:'{{purposes.support.legalBasis}}',dataCategories:['Email address','Message content'],retention:'{{purposes.support.retention}}',collection:{source:'direct',description:'Contact form',required:false,consequences:'{{purposes.support.collection.consequences}}'}});
function browser(){const dom=new JSDOM('<div id="root"></div>',{url:'https://operator.example.test/setup'});dom.window.URL.createObjectURL=()=> 'blob:purpose-test';dom.window.URL.revokeObjectURL=()=>{};return {dom,container:dom.window.document.getElementById('root')};}
const button=(f,name)=>[...f.container.querySelectorAll('button')].find(b=>b.textContent===name||b.getAttribute('aria-label')===name);
const field=(container,label)=>{const l=[...container.querySelectorAll('label')].find(l=>l.textContent===label);return l.htmlFor?container.ownerDocument.getElementById(l.htmlFor):l.querySelector('input,textarea,select');};
function fillPurpose(f){button(f,'Add a processing purpose').click();const panel=f.container.querySelector('.nb-setup-purpose-proposal');for(const [label,value] of [['Stable purpose ID','support'],['Purpose name','Respond to support enquiries'],['What you use the data for','Reply to messages sent through the contact form.'],['Data categories (one per line)','Email address\nMessage content'],['Where the data comes from','direct'],['Is providing this information required?','false'],['When and where you collect it','Contact form']])field(panel,label).value=value;return panel;}

test('purpose inputs are closed, bounded, detached plain public facts and never execute accessors',()=>{
 const input=purpose(),normalized=normalizeDraftPurpose(input);assert.deepEqual(normalized,input);normalized.dataCategories.push('Changed');assert.equal(input.dataCategories.length,2);
 for(const mutate of [p=>p.extra='misspelled fact',p=>p.collection.required='false',p=>p.collection.source=['direct'],p=>p.dataCategories=[],p=>p.dataCategories=Array(65).fill('x'),p=>p.description='x'.repeat(4001),p=>p.name='\u001b[31m',p=>p.collection.extra=true]){const input=purpose();mutate(input);assert.throws(()=>normalizeDraftPurpose(input));}
 let invoked=0;const inputWithGetter=purpose();Object.defineProperty(inputWithGetter,'description',{enumerable:true,get(){invoked++;return 'Should not run';}});assert.throws(()=>normalizeDraftPurpose(inputWithGetter));assert.equal(invoked,0);
});

test('purpose drafts preserve existing restrictions and inventory, reset reviews and keep unknown facts as production blockers',async()=>{
 const config=await fixture({reviewed:true}),original=structuredClone(config),added=createPurposeDraftPlan(config,{action:'add',purpose:purpose()});assert.deepEqual(config,original);assert.equal(added.config.private,undefined);assert.deepEqual(added.config.services,config.services);assert.deepEqual(added.config.storage,config.storage);assert.deepEqual(added.config.scopeGuards,config.scopeGuards);assert.equal(added.config.consent,config.consent);assert.ok(Object.values(added.config.documents).every(d=>d.review.status==='draft'));
 const diagnostics=validateSiteConfig(added.config,{mode:'production'}).diagnostics;assert.ok(diagnostics.some(d=>d.path==='purposes[2].legalBasis'&&d.code==='unresolved-placeholder'));assert.ok(diagnostics.some(d=>d.path==='purposes[2].retention'&&d.code==='unresolved-placeholder'));
 const next={...purpose(),name:'Support requests'},updated=createPurposeDraftPlan(added.config,{action:'update',previous:purpose(),purpose:next});assert.match(renderLegalDocument(updated.config,'privacy',{mode:'preview'}),/Support requests/);assert.equal(added.config.purposes.at(-1).name,purpose().name);assert.throws(()=>createPurposeDraftPlan(added.config,{action:'add',purpose:purpose()}),/already declared/);
 const removed=createPurposeDraftPlan(updated.config,{action:'remove',previous:next});assert.deepEqual(removed.config.purposes,config.purposes);assert.deepEqual(removed.config.services,config.services);
});

test('stale facts, renames and referenced purpose removals reject without unlinking or relaxing inventory',async()=>{
 const config=await fixture(),before=structuredClone(config),linked=config.purposes.find(p=>p.id==='display-preferences');assert.throws(()=>createPurposeDraftPlan(config,{action:'remove',previous:linked}),/still referenced/);assert.deepEqual(config,before);
 const previous=config.purposes[0],changed={...previous,name:'A changed purpose'};assert.throws(()=>createPurposeDraftPlan(config,{action:'remove',previous:changed}),/facts changed/);assert.throws(()=>createPurposeDraftPlan(config,{action:'update',previous,purpose:{...previous,id:'different'}}),/stable purpose ID/);
 config.scopeGuards={version:1,revision:'guard-one',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'},purposes:[{id:previous.id,facts:{sensitiveData:'present'}}]};assert.throws(()=>createPurposeDraftPlan(config,{action:'remove',previous}),/scope restriction/);const edited=createPurposeDraftPlan(config,{action:'update',previous,purpose:changed});assert.deepEqual(edited.config.scopeGuards,config.scopeGuards);
 const repeated=await fixture();repeated.purposes[0].dataCategories.push(repeated.purposes[0].dataCategories[0]);assert.equal(validateSiteConfig(repeated,{mode:'preview'}).valid,true);const correction={...repeated.purposes[0],dataCategories:[...new Set(repeated.purposes[0].dataCategories)]};assert.deepEqual(createPurposeDraftPlan(repeated,{action:'update',previous:repeated.purposes[0],purpose:correction}).config.purposes[0],correction);
});

// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-EU-CONSENT
test('edited purpose meaning cannot inherit a persisted visitor grant in either runtime profile',async()=>{
 const config=await fixture();config.services=[{id:'support-service',name:'Support',provider:'Local fixture',purposeIds:['enquiries'],location:'Test region'}];config.storage=[];config.consent={purposes:[{id:'enquiries',scope:'one'}],services:[{id:'support-service',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:30,dismissalMinutes:5};
 for(const [name,create] of consentProfiles){const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},environment={storage,now:()=>Date.parse('2026-10-19T12:00:00Z')};let c=create(config,environment);c.acceptAll();assert.equal(c.isAllowed('enquiries'),true,name);c.destroy();const previous=config.purposes[0],edited=createPurposeDraftPlan(config,{action:'update',previous,purpose:{...previous,description:'A different material use of the data.'}});assert.deepEqual(edited.config.consent,config.consent);c=create(edited.config,environment);assert.equal(c.isAllowed('enquiries'),false,name);c.destroy();}
});

test('purpose editor supports explicit create/edit/remove, unresolved placeholders, validation, cancellation and status focus',()=>{
 const f=browser();let config=createStarterConfig(),calls=0;const editor=mountPurposeEditor(f.container,{getConfig:()=>config,onChange:result=>{calls++;config=result.config;}});f.container.querySelector('details').open=true;button(f,'Add a processing purpose').click();button(f,'Add purpose to draft').click();assert.equal(calls,0);assert.ok(f.container.querySelector('[aria-invalid=true]'));button(f,'Cancel purpose edit').click();assert.equal(calls,0);
 const panel=fillPurpose(f);const input=field(panel,'Purpose name'),enter=new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});input.dispatchEvent(enter);assert.equal(enter.defaultPrevented,true);button(f,'Add purpose to draft').click();assert.equal(calls,1);assert.deepEqual(config.purposes,[purpose()]);assert.equal(f.dom.window.document.activeElement,f.container.querySelector('[role=status]'));
 button(f,'Edit purpose '+purpose().name).click();assert.equal(field(f.container.querySelector('.nb-setup-purpose-proposal'),'Stable purpose ID').readOnly,true);field(f.container.querySelector('.nb-setup-purpose-proposal'),'Purpose name').value='Support requests';button(f,'Save purpose changes').click();assert.equal(config.purposes[0].name,'Support requests');button(f,'Remove purpose Support requests').click();assert.equal(config.purposes.length,1);button(f,'Confirm purpose removal').click();assert.equal(config.purposes.length,0);editor.destroy();assert.equal(f.container.childElementCount,0);f.dom.window.close();
});

test('purpose editor rejects stale site or purpose facts, renders text safely and distinguishes a host update failure',()=>{
 const f=browser();let config=createPurposeDraftPlan(createStarterConfig(),{action:'add',purpose:purpose()}).config,calls=0;const editor=mountPurposeEditor(f.container,{getConfig:()=>config,onChange:()=>calls++});f.container.querySelector('details').open=true;button(f,'Edit purpose '+purpose().name).click();field(f.container.querySelector('.nb-setup-purpose-proposal'),'Purpose name').value='<img src=x onerror=alert(1)>';config.purposes[0].retention='Changed externally';button(f,'Save purpose changes').click();assert.equal(calls,0);assert.match(f.container.querySelector('[role=alert]').textContent,/Purpose facts changed/);assert.equal(f.container.querySelector('img'),null);
 fillPurpose(f);config.site.id='another-site';button(f,'Add purpose to draft').click();assert.match(f.container.querySelector('[role=alert]').textContent,/site changed/);assert.equal(calls,0);editor.destroy();
 const failed=mountPurposeEditor(f.container,{getConfig:()=>createStarterConfig(),onChange:()=>{throw Error('private host error');}});f.container.querySelector('details').open=true;fillPurpose(f);button(f,'Add purpose to draft').click();assert.match(f.container.querySelector('[role=alert]').textContent,/Could not confirm the host draft update/);assert.doesNotMatch(f.container.querySelector('[role=alert]').textContent,/Nothing was changed|private host error/);failed.destroy();f.dom.window.close();
});

test('fresh setup authors a purpose before selecting a provider; purpose edits invalidate exports and mark prior selection notes stale',()=>{
 const f=browser(),ui=mountSetup(f.container,{catalog:serviceCatalogSeed}),submit=()=>f.container.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{cancelable:true}));submit();assert.ok(ui.getPlan());fillPurpose(f);assert.ok(ui.getPlan(),'unfinished purpose input has not changed the config');button(f,'Add purpose to draft').click();assert.equal(ui.getPlan(),null);
 const query=f.container.querySelector('input[type=search]');query.value='stripe';button(f,'Search catalog').click();button(f,'Review Stripe payment libraries').click();const proposal=f.container.querySelector('.nb-catalog-proposal');field(proposal,'Actual processing location').value='Example processing region';field(proposal,'Supporting facts / justification (private)').value='PRIVATE_PURPOSE_REVIEW';proposal.querySelector('input[value=support]').checked=true;proposal.querySelectorAll('input[type=checkbox]').item(proposal.querySelectorAll('input[type=checkbox]').length-1).checked=true;button(f,'Add reviewed service to draft').click();submit();assert.equal(ui.getPlan().config.services.length,1);assert.deepEqual(ui.getPlan().report.catalogSelections[0].purposes,[purpose()]);assert.doesNotMatch(JSON.stringify(ui.getPlan().config),/PRIVATE_PURPOSE_REVIEW/);
 button(f,'Edit purpose '+purpose().name).click();field(f.container.querySelector('.nb-setup-purpose-proposal'),'Purpose name').value='A newly assessed purpose';button(f,'Save purpose changes').click();assert.equal(ui.getPlan(),null);assert.match(f.container.querySelector('.nb-setup-selected-services').textContent,/Needs renewed review/);submit();assert.equal(ui.getPlan(),null);button(f,'Remove catalog selection for Stripe payment libraries').click();submit();assert.equal(ui.getPlan().config.services.length,1,'changed purpose facts cannot delete associated existing inventory through note removal');assert.equal(ui.getPlan().report.catalogSelections,undefined);ui.destroy();f.dom.window.close();
});

test('CLI purpose review requires explicit confirmation, preserves draft unknowns and can edit/remove with guarded plans',async()=>{
 const originalLog=console.log,log=[];console.log=(...parts)=>log.push(parts.join(' '));
 try{
  assert.equal(await reviewSetupPurposes(undefined,async()=> 'no'),undefined);
  const entry=['support','Respond to support enquiries','Reply to messages sent through the contact form.','Email address, Message content','','','','direct','no','Contact form',''];
  const queue=['yes','add',...entry,'no','add',...entry,'yes','edit','support','Support requests','','','','','','','','','','yes','done'];
  const config=await reviewSetupPurposes(undefined,async()=>{assert.ok(queue.length,'unexpected extra CLI prompt');return queue.shift();});assert.equal(queue.length,0);assert.equal(config.purposes.length,1);assert.equal(config.purposes[0].name,'Support requests');assert.equal(config.purposes[0].legalBasis,'{{purposes.support.legalBasis}}');assert.equal(config.consent,undefined);assert.ok(log.some(line=>line.includes('"legalBasis": "{{purposes.support.legalBasis}}"')));
  const removal=['yes','remove','support','yes','done'];const removed=await reviewSetupPurposes(config,async()=>removal.shift());assert.equal(removed.purposes.length,0);assert.equal(config.purposes.length,1);
 }finally{console.log=originalLog;}
});

test('a completed local config import immediately exposes editable imported purposes and closes an unsaved proposal',async()=>{
 const f=browser(),ui=mountSetup(f.container),config=await fixture();fillPurpose(f);const file=f.container.querySelector('input[type=file]');Object.defineProperty(file,'files',{value:[{size:100,text:async()=>JSON.stringify(config)}]});file.dispatchEvent(new f.dom.window.Event('change'));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.container.querySelectorAll('.nb-setup-purpose-card').length,2);assert.equal(f.container.querySelector('.nb-setup-purpose-proposal').hidden,true);assert.match(f.container.querySelector('.nb-setup-purpose-editor summary').textContent,/2 declared/);button(f,'Edit purpose '+config.purposes[0].name).click();assert.equal(field(f.container.querySelector('.nb-setup-purpose-proposal'),'Purpose name').value,config.purposes[0].name);ui.destroy();f.dom.window.close();
});

test('purpose UI preserves imported public interests and saves explicit edits or removal without changing the basis',()=>{
 const f=browser(),statement='Our interest is to protect the support inbox from abuse.';
 let config=createPurposeDraftPlan(createStarterConfig(),{action:'add',purpose:{...purpose(),legitimateInterests:statement}}).config;
 const editor=mountPurposeEditor(f.container,{getConfig:()=>config,onChange:result=>config=result.config});
 const edit=()=>{button(f,'Edit purpose '+purpose().name).click();return field(f.container.querySelector('.nb-setup-purpose-proposal'),'Legitimate interests (when applicable)');};
 assert.equal(edit().value,statement);field(f.container.querySelector('.nb-setup-purpose-proposal'),'How long you keep the data').value='30 days';button(f,'Save purpose changes').click();assert.equal(config.purposes[0].legitimateInterests,statement);
 edit().value='The operator protects the support inbox and its users from abuse.';button(f,'Save purpose changes').click();assert.match(config.purposes[0].legitimateInterests,/its users/);
 edit().value='';button(f,'Save purpose changes').click();assert.equal(Object.hasOwn(config.purposes[0],'legitimateInterests'),false);assert.equal(config.purposes[0].legalBasis,purpose().legalBasis);editor.destroy();f.dom.window.close();
});

test('CLI purpose editing preserves interests on blank, clears only on explicit removal and keeps unknown text as draft',async()=>{
 const originalLog=console.log;console.log=()=>{};
 try{
  const start=createPurposeDraftPlan(createStarterConfig(),{action:'add',purpose:{...purpose(),legitimateInterests:'Our interest is to protect the inbox from abuse.'}}).config;
  for(const [answer,expected] of [['',start.purposes[0].legitimateInterests],['-',undefined],['?','{{purposes.support.legitimateInterests}}']]){
   let action=0;const config=await reviewSetupPurposes(start,async prompt=>{
    if(prompt.startsWith('Review processing'))return 'yes';if(prompt.startsWith('Purpose action'))return action++?'done':'edit';if(prompt.startsWith('Existing purpose ID'))return 'support';if(prompt.startsWith('Purpose name'))return 'Updated support';if(prompt.startsWith('Public legitimate'))return answer;if(prompt.startsWith('Confirm these'))return 'yes';return '';
   });assert.equal(config.purposes[0].legitimateInterests,expected);assert.equal(config.purposes[0].legalBasis,start.purposes[0].legalBasis);
  }
 }finally{console.log=originalLog;}
});
