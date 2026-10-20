// @requirements REQ-PRODUCT-CONSENT-AUTHORING REQ-PRODUCT-CONFIG REQ-PRODUCT-SCOPE-GUARDS REQ-EU-DEVICE REQ-EU-FAIR-CHOICE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createConsentDraftPlan} from '@notabenda/core/setup/consent';
import {mountConsentEditor} from '@notabenda/core/setup/consent/ui';
import {mountSetup} from '@notabenda/core/setup/ui';
import {createSetupPlan} from '@notabenda/core/setup';
import {selectPacks} from '@notabenda/core/packs';
import {createCatalogSelectionPlan} from '@notabenda/core/catalog/selection';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {validateSiteConfig} from '@notabenda/core';
import {reviewSetupConsent} from '../dist/setup-consent-cli.js';
import {fixture} from './helpers.mjs';
import {exceptionFixture} from './storage-exception-helpers.mjs';
import {consentProfiles} from './consent-profiles.mjs';

const guards=fact=>({version:1,revision:'synthetic-scope-1',site:{children:fact,sensitiveData:fact,highRiskProfiling:fact,regulatedSector:fact}});
async function inventory(){const config=await fixture();const purpose=config.purposes[0];config.purposes=[purpose,{...structuredClone(purpose),id:'other',name:'Another purpose'}];config.services=[{id:'metrics',name:'Local metrics',provider:'Fictional',location:'Local test',purposeIds:[purpose.id]},{id:'combined',name:'Two-purpose tool',provider:'Fictional',location:'Local test',purposeIds:[purpose.id,'other']}];config.storage=[];delete config.consent;config.scopeGuards=guards('unknown');return config;}
const settings=(config,ids=['metrics'])=>{const needed=new Set(config.services.filter(s=>ids.includes(s.id)).flatMap(s=>s.purposeIds));return {services:ids.map(id=>({id,scope:id+'-1'})),purposes:config.purposes.filter(p=>needed.has(p.id)).map(p=>({id:p.id,scope:p.id+'-1'})),grantLifetimeDays:90,refusalLifetimeDays:180,dismissalMinutes:15};};
const button=(root,text)=>[...root.querySelectorAll('button')].find(el=>el.textContent===text);
const field=(root,label)=>{const caption=[...root.querySelectorAll('label')].find(el=>el.textContent===label);assert.ok(caption,label);return root.querySelector('#'+caption.htmlFor);};
function browser(){const dom=new JSDOM('<main><div id="root"></div></main>',{url:'https://adopter.example.test/setup'}),root=dom.window.document.getElementById('root'),revoked=[];let url=0;dom.window.URL.createObjectURL=()=> 'blob:local-'+(++url);dom.window.URL.revokeObjectURL=value=>revoked.push(value);return {dom,root,revoked};}
function fill(root,config,ids=['metrics']){for(const service of config.services){const input=root.querySelector('input[id$="-service-'+service.id+'"]');if(input.checked!==ids.includes(service.id)){input.checked=ids.includes(service.id);input.dispatchEvent(new root.ownerDocument.defaultView.Event('change',{bubbles:true}));}if(input.checked)field(root,service.name+' — service version').value=service.id+'-1';}for(const purpose of config.purposes){const label=[...root.querySelectorAll('label')].find(el=>el.textContent===purpose.name+' — purpose version');if(label)root.querySelector('#'+label.htmlFor).value=purpose.id+'-1';}field(root,'Remember grants (days)').value='90';field(root,'Remember refusals (days)').value='180';field(root,'Pause after dismissal (minutes)').value='15';}

test('explicit settings create a detached configured draft while unknown guards and unrelated facts remain intact',async()=>{
 const config=await inventory(),before=structuredClone(config),value=settings(config,['metrics','combined']),plan=createConsentDraftPlan(config,{baseline:config,settings:value});
 assert.equal(plan.action,'add');assert.deepEqual(plan.config.consent,value);assert.deepEqual(config,before);assert.deepEqual(plan.config.scopeGuards,config.scopeGuards);assert.deepEqual(plan.blockedPurposeIds,config.purposes.map(p=>p.id));assert.equal(validateSiteConfig(plan.config,{mode:'preview'}).valid,true);
 for(const key of ['site','controller','purposes','services','storage','privacy','terms'])assert.deepEqual(plan.config[key],config[key]);for(const doc of Object.values(plan.config.documents))assert.equal(doc.review.status,'draft');
 plan.config.consent.services[0].scope='changed';assert.equal(value.services[0].scope,'metrics-1');
});

test('existing regional policies, information and purpose restrictions survive a settings edit',async()=>{
 const config=await inventory();config.scopeGuards.purposes=[{id:config.purposes[0].id,facts:{children:'present'}}];config.consent={...settings(config),promptPolicy:{profile:'it-garante-2021',processingRevision:'existing-material-1'},grantExpiryPolicy:{profile:'ie-dpc-six-month-default',version:1},information:{rights:{label:'Privacy requests',url:'/requests'}}};
 const before=structuredClone(config),value={...settings(config),grantLifetimeDays:60},plan=createConsentDraftPlan(config,{baseline:config,settings:value});
 for(const key of ['promptPolicy','grantExpiryPolicy','information'])assert.deepEqual(plan.config.consent[key],before.consent[key]);assert.deepEqual(plan.config.scopeGuards,before.scopeGuards);assert.deepEqual(config,before);assert.match(plan.reviewItems.join(' '),/preserved repeat-request/);assert.deepEqual(plan.blockedPurposeIds,[config.purposes[0].id]);
});

test('incomplete, executable, duplicate and incompatible enrollment is rejected without defaults',async()=>{
 const config=await inventory(),value=settings(config),before=structuredClone(config);
 for(const mutate of [s=>delete s.grantLifetimeDays,s=>s.grantLifetimeDays=0,s=>s.refusalLifetimeDays=731,s=>s.dismissalMinutes=undefined,s=>s.dismissalMinutes=NaN,s=>s.services=[],s=>s.services.push(s.services[0]),s=>s.services[0].id='unknown',s=>s.services[0].scope='',s=>s.services[0].scope='{{version}}',s=>s.services[0].scope='x\n',s=>s.purposes=[],s=>s.purposes.push({id:'other',scope:'other-1'}),s=>s.extra=true]){const bad=structuredClone(value);mutate(bad);assert.throws(()=>createConsentDraftPlan(config,{baseline:config,settings:bad}));assert.deepEqual(config,before);}
 let touched=0;const bad={...value,get grantLifetimeDays(){touched++;throw Error('PRIVATE');}};assert.throws(()=>createConsentDraftPlan(config,{baseline:config,settings:bad}));assert.equal(touched,0);
 const optional=structuredClone(config);optional.storage=[{id:'combined-store',name:'local-tool',type:'localStorage',serviceId:'combined',duration:'One day',classification:'optional'}];assert.throws(()=>createConsentDraftPlan(optional,{baseline:optional,settings:value}));
 const exception=await exceptionFixture();const selected={...exception.consent,services:[...exception.consent.services,{id:'improvement-service',scope:'improvement-1'}],purposes:[...exception.consent.purposes,{id:'improvement',scope:'improvement-1'}]};assert.throws(()=>createConsentDraftPlan(exception,{baseline:exception,settings:selected}));
});

test('all reviewed public draft changes fence a stale consent save',async()=>{
 const original=await inventory(),value=settings(original);
 for(const mutate of [c=>c.site.id='changed-site',c=>c.services[0].provider='Changed provider',c=>c.purposes[0].description='Changed facts',c=>c.scopeGuards.site.children='present',c=>c.storage.push({id:'item',name:'local-item',type:'localStorage',serviceId:'metrics',duration:'One day',classification:'optional'}),c=>c.consent=settings(c)]){const changed=structuredClone(original);mutate(changed);assert.throws(()=>createConsentDraftPlan(changed,{baseline:original,settings:value}),/draft changed/);}
 const configured=createConsentDraftPlan(original,{baseline:original,settings:value}).config;assert.throws(()=>createConsentDraftPlan(configured,{baseline:configured,settings:value}),/No control settings changed/);
});

test('the editor starts blank, shows the complete multipurpose effect and saves only on confirmation',async()=>{
 const f=browser();let config=await inventory(),calls=0;const editor=mountConsentEditor(f.root,{getConfig:()=>config,onChange:plan=>{calls++;config=plan.config;}});
 try{
  editor.open();for(const label of ['Remember grants (days)','Remember refusals (days)','Pause after dismissal (minutes)'])assert.equal(field(f.root,label).value,'');assert.equal(f.root.querySelectorAll('input[type=checkbox]:checked').length,0);
  const both=f.root.querySelector('input[id$="-service-combined"]');both.checked=true;both.dispatchEvent(new f.dom.window.Event('change',{bubbles:true}));assert.ok(field(f.root,config.purposes[0].name+' — purpose version'));assert.ok(field(f.root,'Another purpose — purpose version'));assert.match(f.root.textContent,/Purposes: .*Another purpose/);
  button(f.root,'Save control settings').click();assert.equal(calls,0);assert.match(f.root.querySelector('[role=alert]').textContent,/no implicit default/);
  fill(f.root,config,['combined']);button(f.root,'Cancel control changes').click();assert.equal(calls,0);assert.equal(config.consent,undefined);
  editor.open();fill(f.root,config,['combined']);button(f.root,'Save control settings').click();assert.equal(calls,1);assert.deepEqual(config.consent,settings(config,['combined']));assert.match(f.root.querySelector('[role=status]').textContent,/remain blocked/);assert.equal(f.dom.window.document.activeElement.textContent,'Edit control settings');
 }finally{editor.destroy();f.dom.window.close();}
});

test('stale inventory and host errors cannot silently apply edits or expose private diagnostics',async()=>{
 const f=browser();let config=await inventory(),calls=0,fail=false;
 const editor=mountConsentEditor(f.root,{getConfig:()=>config,onChange:()=>{if(fail)throw Error('PRIVATE HOST ERROR');calls++;}});
 try{editor.open();fill(f.root,config);config.services[0].provider='Changed';button(f.root,'Save control settings').click();assert.equal(calls,0);assert.match(f.root.querySelector('[role=alert]').textContent,/draft changed/);editor.open();fill(f.root,config);fail=true;button(f.root,'Save control settings').click();assert.doesNotMatch(f.root.querySelector('[role=alert]').textContent,/PRIVATE/);assert.match(f.root.querySelector('[role=alert]').textContent,/Could not confirm/);}finally{editor.destroy();f.dom.window.close();}
});

test('the pack action opens the editor, canceled typing preserves exports, and saving invalidates them',async()=>{
 const config=await inventory(),f=browser(),ui=mountSetup(f.root,{config,cartridges:selectPacks(['cookie-choices'])}),submit=()=>f.root.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{cancelable:true,bubbles:true}));
 try{
  submit();const before=ui.getPlan();assert.ok(before);button(f.root,'Configure cookie controls').click();assert.equal(f.root.querySelector('.nb-setup-existing').open,true);assert.equal(f.root.querySelector('.nb-setup-consent-panel').hidden,false);
  fill(f.root,config);
  const stage=f.root.querySelector('.nb-setup-outline [aria-current="step"]');assert.ok(stage);
  for(const input of [field(f.root,'Local metrics — service version'),field(f.root,'Remember grants (days)')]){
   input.focus();const enter=new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});input.dispatchEvent(enter);
   assert.equal(enter.defaultPrevented,true);assert.equal(f.root.querySelector('.nb-setup-outline [aria-current="step"]'),stage);assert.equal(f.dom.window.document.activeElement,input);assert.deepEqual(ui.getPlan(),before);
  }
  fill(f.root,config);field(f.root,'Remember grants (days)').dispatchEvent(new f.dom.window.Event('input',{bubbles:true}));assert.deepEqual(ui.getPlan(),before);button(f.root,'Cancel control changes').click();assert.deepEqual(ui.getPlan(),before);
  button(f.root,'Configure cookie choices').click();fill(f.root,config);button(f.root,'Save control settings').click();assert.equal(ui.getPlan(),null);assert.ok(f.revoked.length>=3);submit();assert.deepEqual(ui.getPlan().config.consent,settings(config));assert.deepEqual(ui.getPlan().config.scopeGuards,before.config.scopeGuards);assert.ok(button(f.root,'Edit cookie controls'));
 }finally{ui.destroy();f.dom.window.close();}
});

test('imported values and timing policy review stay visible, including after a notification callback fails',async()=>{
 const f=browser();let config=await inventory();config.consent={...settings(config),promptPolicy:{profile:'it-garante-2021',processingRevision:'material-one'},grantExpiryPolicy:{profile:'ie-dpc-six-month-default',version:1}};
 const editor=mountConsentEditor(f.root,{getConfig:()=>config,onChange:plan=>{config=plan.config;},onStatus:()=>{throw Error('PRIVATE NOTIFICATION');}});
 try{
  editor.open();assert.equal(field(f.root,'Remember grants (days)').value,'90');assert.equal(field(f.root,'Local metrics — service version').value,'metrics-1');assert.match(f.root.querySelector('.nb-setup-consent-preserved').textContent,/it-garante-2021/);assert.match(f.root.querySelector('.nb-setup-consent-preserved').textContent,/ie-dpc-six-month-default/);
  field(f.root,'Remember grants (days)').value='60';button(f.root,'Save control settings').click();assert.equal(config.consent.grantLifetimeDays,60);assert.match(f.root.querySelector('[role=status]').textContent,/saved/);assert.doesNotMatch(f.root.textContent,/PRIVATE NOTIFICATION/);
 }finally{editor.destroy();f.dom.window.close();}
});

test('CLI confirmation rechecks the public baseline before accepting a settings edit',async()=>{
 const config=await inventory(),replies=['yes','metrics','metrics-1',config.purposes[0].id+'-1','90','180','15','yes'];
 const result=await reviewSetupConsent(config,async prompt=>{if(prompt.startsWith('Save these settings'))config.services[0].provider='Changed while reviewing';return replies.shift();});
 assert.equal(result,config);assert.equal(config.consent,undefined);assert.equal(replies.length,0);
});

test('control editing preserves catalog selection pins rather than silently renewing their review',async()=>{
 const selected=createCatalogSelectionPlan(await fixture(),serviceCatalogSeed,{productId:'stripe-payments',serviceId:'payments',purposeIds:['enquiries'],provider:'Fictional reviewed entity',location:'Example region',privacyUrl:'https://stripe.com/privacy',justification:'PRIVATE inventory review',confirmed:true});
 const prepared=createSetupPlan({schemaVersion:1,markets:[],answers:{}},{config:selected.config,catalogSelections:[selected.selection]}),f=browser(),ui=mountSetup(f.root,{config:prepared.config,answers:prepared.report,cartridges:selectPacks(['cookie-choices'])});
 try{const submit=()=>f.root.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{bubbles:true,cancelable:true}));button(f.root,'Configure cookie choices').click();fill(f.root,prepared.config,['payments']);button(f.root,'Save control settings').click();submit();assert.ok(ui.getPlan());assert.deepEqual(ui.getPlan().report.catalogSelections,prepared.report.catalogSelections);assert.equal(ui.getPlan().report.catalogSelectionRevisions,undefined);assert.doesNotMatch(JSON.stringify(ui.getPlan().config),/PRIVATE inventory review/);}finally{ui.destroy();f.dom.window.close();}
});

test('CLI and UI use equivalent explicit settings, while missing values and cancellation preserve the base',async()=>{
 const config=await inventory(),replies=['yes','metrics','metrics-1',config.purposes[0].id+'-1','90','180','15','yes'],prompts=[];
 const edited=await reviewSetupConsent(config,async prompt=>{prompts.push(prompt);return replies.shift();});assert.equal(replies.length,0);assert.deepEqual(edited.consent,settings(config));assert.deepEqual(edited.scopeGuards,config.scopeGuards);
 const canceled=['yes','metrics','metrics-1',config.purposes[0].id+'-1','90','180','15','no'];assert.equal(await reviewSetupConsent(config,async()=>canceled.shift()),config);
 const missing=['yes','metrics','metrics-1',config.purposes[0].id+'-1','','180','15'];assert.equal(await reviewSetupConsent(config,async()=>missing.shift()),config);assert.ok(prompts.some(p=>p.includes('no default for new settings')));
 const f=browser();let saved;const editor=mountConsentEditor(f.root,{getConfig:()=>config,onChange:plan=>saved=plan.config});editor.open();fill(f.root,config);button(f.root,'Save control settings').click();assert.deepEqual(saved,edited);editor.destroy();f.dom.window.close();
 const directory=await mkdtemp(join(tmpdir(),'notabenda-controls-'));
 try{await writeFile(join(directory,'config.json'),JSON.stringify(edited));await writeFile(join(directory,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));const result=spawnSync(process.execPath,[new URL('../dist/cli.js',import.meta.url).pathname,'wizard','--packs','cookie-choices','--config','config.json','--answers','answers.json'],{cwd:directory,encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(await readFile(join(directory,'notabenda-setup/notabenda.config.json'),'utf8')).consent,edited.consent);}finally{await rm(directory,{recursive:true,force:true});}
});

for(const [profile,createConsent] of consentProfiles){
 test(profile+': authored settings enforce actual synthetic service rejection, granular grants, withdrawal and reload',async()=>{
  const config=await inventory();config.scopeGuards=guards('absent');const authored=createConsentDraftPlan(config,{baseline:config,settings:settings(config,['metrics','combined'])}).config;
  const values=new Map(),environment={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse('2026-10-18T12:00:00Z'),schedule:()=>()=>{},subscribe:()=>()=>{}};const starts={metrics:0,combined:0},stops={metrics:0,combined:0};
  const mount=()=>{const c=createConsent(authored,environment);for(const service of authored.services)c.registerService(service.id,{purposes:service.purposeIds,start(){starts[service.id]++;return ()=>stops[service.id]++;}});return c;};
  let c=mount();await c.settled();assert.deepEqual(starts,{metrics:0,combined:0});c.rejectAll();await c.settled();assert.deepEqual(starts,{metrics:0,combined:0});c.choose({[config.purposes[0].id]:true,other:false});await c.settled();assert.deepEqual(starts,{metrics:1,combined:0});c.acceptAll();await c.settled();assert.deepEqual(starts,{metrics:1,combined:1});c.rejectAll();await c.settled();assert.deepEqual(stops,{metrics:1,combined:1});c.destroy();
  c=mount();await c.settled();assert.deepEqual(starts,{metrics:1,combined:1});c.acceptAll();await c.settled();c.destroy();const before={...starts};c=mount();await c.settled();assert.deepEqual(starts,{metrics:before.metrics+1,combined:before.combined+1});c.destroy();
 });
 test(profile+': authored settings never relax unknown or present scope restrictions',async()=>{
  for(const fact of ['unknown','present']){const config=await inventory();config.scopeGuards=guards(fact);const plan=createConsentDraftPlan(config,{baseline:config,settings:settings(config)}),values=new Map();let starts=0;const c=createConsent(plan.config,{storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse('2026-10-18T12:00:00Z')});c.registerService('metrics',{purposes:[config.purposes[0].id],start(){starts++;return ()=>{};}});c.acceptAll();await c.settled();assert.equal(starts,0);assert.equal(c.isAllowed(config.purposes[0].id),false);assert.deepEqual(plan.config.scopeGuards,config.scopeGuards);c.destroy();}
 });
}
