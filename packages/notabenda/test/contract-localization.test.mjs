// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-CONTRACT-ACTIONS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {compileLegalDocuments,createContractActionDefinition,compileConsentRuntimeConfig,createConsentNotice,canonicalJson,sha256} from '@notabenda/core/content';
import {createContractAction,mountContractAction,contractActionLabels,normalizeContractActionDefinition,normalizeContractActionLocalization} from '@notabenda/core/contracts';
import {recordLegalRelease,registerContractActionDefinition,recordContractDeclaration,contractActionOperationRef,claimContractDelivery,createContractDeclarationStore,createAdminWorker} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {contractActionAcknowledgement} from '../dist/contract-action-policy.js';
import {fixture} from './helpers.mjs';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const wording={title:'Cancelar o contrato',entryLabel:'Cancelar contrato',confirmLabel:'Confirmar cancelamento',statement:'Declaro o cancelamento do contrato identificado.'};
const settings={actionId:'cancel-plan',revision:'form-1',profile:'de-cancellation',reviewStatus:'draft',wording};
const fields={name:'Avery Linden',email:'avery@example.test',contract:'Plano 24017',cancellation:{kind:'ordinary',reason:'',ending:''}};
const timestamp='2026-10-20T12:00:00.000Z';
async function config(){const c=localizedExampleConfig(await fixture());c.localization.contractActions={...contractActionLabels('br-withdrawal'),retry:'Tentar novamente com a mesma solicitação',name:'Seu nome',email:'E-mail para receber a cópia'};return c;}
const compile=c=>{const release=compileLegalDocuments(c,{mode:'preview'});return {release,definition:createContractActionDefinition(release.artifact,settings,{mode:'preview'})};};
const reseal=d=>{const {definitionId,...v}=d;return {...v,definitionId:sha256(canonicalJson(v))};};
async function backend(f){const storage=createSyntheticStorage([]),context={siteId:f.definition.siteId,actionId:f.definition.actionId,operationId:'synthetic-operation',allowPreview:true,now:()=>new Date(timestamp)};await recordLegalRelease(storage,f.release.artifact);await registerContractActionDefinition(storage,f.definition,context);return {storage,context,operationRef:await contractActionOperationRef(context)};}

test('selected contract labels are complete, bounded, detached and independently versioned',async()=>{
 const c=await config(),f=compile(c),d=f.definition;assert.equal(d.schemaVersion,2);assert.equal(d.locale,'pt-BR');assert.equal(d.renderingPolicy,'contract-form-v2');assert.equal(d.localization.contractActions.name,'Seu nome');
 c.localization.contractActions.name='Changed outside the release';assert.equal(d.localization.contractActions.name,'Seu nome');
 const before=await config(),a=compile(before);before.localization.contractActions.name='Nome completo';before.localization.revision='copy-2';const b=compile(before);assert.notEqual(a.definition.definitionId,b.definition.definitionId);assert.equal(a.definition.profile,b.definition.profile);assert.deepEqual(a.release.publicConfig.consent,b.release.publicConfig.consent);assert.doesNotMatch(JSON.stringify(compileConsentRuntimeConfig(b.release.publicConfig,{evidence:'local',mode:'preview'})),/contractActions|Nome completo/);assert.equal(createConsentNotice(a.release.artifact,{scopeId:'cookies'},{mode:'preview'}).scopeDigest,createConsentNotice(b.release.artifact,{scopeId:'cookies'},{mode:'preview'}).scopeDigest);
 for(const mutate of [v=>delete v.contractActions.invalid,v=>v.contractActions.extra='Extra',v=>v.contractActions.name='',v=>v.contractActions.name='x'.repeat(121),v=>v.contractActions.pending='<p>text</p>',v=>v.contractActions.pending='{date}',v=>v.direction='auto',v=>v.locale='pt-br',v=>v.revision='']){const value=structuredClone(d.localization);mutate(value);assert.throws(()=>normalizeContractActionLocalization(value,{allowPreview:true}));}
 let reads=0;const value=structuredClone(d.localization);Object.defineProperty(value.contractActions,'name',{get(){reads++;return 'Name';},enumerable:true});assert.throws(()=>normalizeContractActionLocalization(value,{allowPreview:true}));assert.equal(reads,0);assert.throws(()=>normalizeContractActionLocalization(d.localization));
 for(const supplied of [undefined,{title:'Title'},{...wording,extra:'Unknown'}])assert.throws(()=>createContractActionDefinition(f.release.artifact,{...settings,wording:supplied},{mode:'preview'}));
 const malformed=structuredClone(d);malformed.locale='en';assert.throws(()=>normalizeContractActionDefinition(malformed,{allowPreview:true}));
});

test('archive-bound language rejects a substituted dictionary, legacy downgrade and unhashed config',async()=>{
 const f=compile(await config()),b=await backend(f);
 for(const mutate of [v=>v.localization.contractActions.name='Different name',v=>v.localization.revision='other-copy',v=>v.localization.direction='rtl',v=>{v.locale='en';v.localization.locale='en';},v=>{v.schemaVersion=1;v.renderingPolicy='contract-form-v1';v.locale='de-DE';delete v.localization;}]){const d=structuredClone(f.definition);mutate(d);await assert.rejects(registerContractActionDefinition(b.storage,reseal(d),b.context),e=>e.code==='invalid-definition');}
 const artifact=structuredClone(f.release.artifact);delete artifact.manifest.configSha256;const {artifactId,...manifest}=artifact.manifest;artifact.manifest.artifactId=sha256(canonicalJson(manifest));await recordLegalRelease(b.storage,artifact);const d=structuredClone(f.definition);d.artifactId=artifact.manifest.artifactId;for(const [kind,ref] of Object.entries(d.documents))ref.url=`/artifacts/${d.artifactId}/${kind}.html`;await assert.rejects(registerContractActionDefinition(b.storage,reseal(d),b.context),e=>e.code==='invalid-definition');
 const replaced=structuredClone(f.release.artifact);replaced.publicConfig.localization.contractActions.name='Substituted config';assert.throws(()=>createContractActionDefinition(replaced,settings,{mode:'preview'}));
});

test('native review, receipt copy and both backend handoffs share the selected dictionary',async()=>{
 const f=compile(await config()),b=await backend(f),dom=new JSDOM('<main><div id="action"></div></main>',{url:'https://example.test'}),root=dom.window.document.getElementById('action');let calls=0;
 const action=createContractAction(f.definition,{operationRef:b.operationRef,allowPreview:true,initial:fields,submit:async body=>{calls++;return recordContractDeclaration(b.storage,body,b.context);}}),mounted=mountContractAction(root,{action});
 try{assert.equal(calls,0);assert.equal(root.querySelector('section').lang,'pt-BR');assert.equal(root.querySelector('section').dir,'ltr');assert.ok(root.textContent.includes('Seu nome'));f.definition.localization.contractActions.name='Changed after controller creation';assert.equal(action.getDefinition().localization.contractActions.name,'Seu nome');
 const receipt=await action.submit();assert.equal(calls,1);assert.ok(receipt.acknowledgement.text.includes('Seu nome: Avery Linden'));assert.ok(root.textContent.includes(action.getDefinition().localization.contractActions.pending));assert.ok(root.querySelector('pre').textContent.includes('Seu nome: Avery Linden'));
 for(const channel of ['application','acknowledgement']){const lease=await claimContractDelivery(b.storage,receipt.id,channel,b.context);assert.equal(lease.receipt.acknowledgement.text,receipt.acknowledgement.text);assert.equal(lease.definition.localization.contractActions.name,'Seu nome');}
 const store=createContractDeclarationStore(b.storage,b.context),worker=createAdminWorker({basePath:'/backoffice',authorize:()=>({store})}),html=await (await worker.fetch(new Request('https://example.test/backoffice/record?id='+receipt.id),{})).text();assert.match(html,/lang="pt-BR" dir="ltr"/);assert.match(html,/Seu nome/);
 }finally{mounted.destroy();action.destroy();dom.window.close();}
});

test('canonical field meanings and old uncertain operations survive a dictionary revision',async()=>{
 const c=await config(),f=compile(c),b=await backend(f),old={schemaVersion:1,definitionId:f.definition.definitionId,requestId:crypto.randomUUID(),clientAt:timestamp,fields};const original=await recordContractDeclaration(b.storage,old,b.context);
 c.localization.revision='copy-2';c.localization.contractActions.name='Nome completo';const next=compile(c);next.definition=createContractActionDefinition(next.release.artifact,{...settings,revision:'form-2'},{mode:'preview'});await recordLegalRelease(b.storage,next.release.artifact);await registerContractActionDefinition(b.storage,next.definition,b.context);
 await b.storage.delete('notabenda/releases/'+f.release.manifest.artifactId);assert.deepEqual(await recordContractDeclaration(b.storage,old,b.context),original);
 const action=createContractAction(f.definition,{operationRef:b.operationRef,allowPreview:true,recovery:old,submit:body=>recordContractDeclaration(b.storage,body,b.context)});try{assert.equal(action.getSnapshot().status,'uncertain');assert.deepEqual(await action.submit(),original);}finally{action.destroy();}
 const rtl=structuredClone(next.definition);rtl.localization.direction='rtl';const dom=new JSDOM('<div></div>'),controller=createContractAction(reseal(rtl),{operationRef:b.operationRef,allowPreview:true,initial:fields,submit:async()=>{throw Error('unused');}}),view=mountContractAction(dom.window.document.querySelector('div'),{action:controller});try{assert.equal(dom.window.document.querySelector('section').dir,'rtl');assert.equal(controller.getSnapshot().fields.cancellation.kind,'ordinary');}finally{view.destroy();controller.destroy();dom.window.close();}
});

test('legacy profile definitions and acknowledgement bytes remain unchanged',async()=>{
 const d=JSON.parse(await readFile(new URL('./fixtures/contract-v1-cancellation.json',import.meta.url),'utf8'));assert.deepEqual(normalizeContractActionDefinition(d,{allowPreview:true}),d);assert.equal(d.schemaVersion,1);assert.equal(d.definitionId,sha256(canonicalJson(Object.fromEntries(Object.entries(d).filter(([k])=>k!=='definitionId')))));
 const request={schemaVersion:1,definitionId:d.definitionId,requestId:'00000000-0000-4000-8000-000000000001',clientAt:timestamp,fields};const text=contractActionAcknowledgement(d,request,timestamp);assert.match(text,/Name: Avery Linden/);assert.match(text,/Frühestmöglicher Zeitpunkt/);assert.equal(sha256(text),'cabcae0519552ebeaa8dad19b610c42d15c46eaa8057217e05771bfb475fdf60');
 const c=await fixture(),f=compileLegalDocuments(c,{mode:'preview'}),legacy=createContractActionDefinition(f.artifact,{...settings,wording:undefined},{mode:'preview'});assert.equal(legacy.schemaVersion,1);assert.equal(legacy.locale,'de-DE');assert.equal(legacy.localization,undefined);
});

test('near-limit selected copy and maximum visitor fields survive capture, receipt validation and inspection',async()=>{
 const c=await config(),m=c.localization.contractActions;
 for(const key of Object.keys(m))m[key]='x'.repeat(['pending','saving','uncertain','invalid','unavailable','scope'].includes(key)?1800:120);
 let attempts=0;while(true){try{compile(c);break;}catch(e){if(++attempts>100||m.pending.length<20)throw e;m.pending=m.pending.slice(20);}}
 const f=compile(c);assert.ok(new TextEncoder().encode(JSON.stringify(f.definition.localization)).length>12000);
 f.definition=createContractActionDefinition(f.release.artifact,{...settings,wording:{title:'T'.repeat(300),entryLabel:'E'.repeat(300),confirmLabel:'C'.repeat(300),statement:'"'.repeat(2000)}},{mode:'preview'});
 const b=await backend(f),input={name:'N'.repeat(300),contract:'"'.repeat(2000),email:'a'.repeat(306)+'@example.test',cancellation:{kind:'extraordinary',reason:'"'.repeat(2000),ending:'E'.repeat(300)}},action=createContractAction(f.definition,{operationRef:b.operationRef,allowPreview:true,initial:input,submit:body=>recordContractDeclaration(b.storage,body,b.context)});
 try{const receipt=await action.submit();assert.equal(action.getSnapshot().status,'received');for(const channel of ['application','acknowledgement'])assert.equal((await claimContractDelivery(b.storage,receipt.id,channel,b.context)).receipt.acknowledgement.sha256,receipt.acknowledgement.sha256);assert.equal((await createContractDeclarationStore(b.storage,b.context).get(receipt.id)).data.receipt.id,receipt.id);}finally{action.destroy();}
});

test('v1 receipt recovery and delivery keep their formatter after a v2 form is introduced',async()=>{
 const base=await fixture(),legacyRelease=compileLegalDocuments(base,{mode:'preview'}),legacyDefinition=createContractActionDefinition(legacyRelease.artifact,settings,{mode:'preview'}),b=await backend({release:legacyRelease,definition:legacyDefinition}),request={schemaVersion:1,definitionId:legacyDefinition.definitionId,requestId:crypto.randomUUID(),clientAt:timestamp,fields},receipt=await recordContractDeclaration(b.storage,request,b.context);
 const nextConfig=await config();nextConfig.site.id=base.site.id;const release=compileLegalDocuments(nextConfig,{mode:'preview'}),definition=createContractActionDefinition(release.artifact,{...settings,revision:'form-2'},{mode:'preview'});await recordLegalRelease(b.storage,release.artifact);await registerContractActionDefinition(b.storage,definition,b.context);await b.storage.delete('notabenda/releases/'+legacyRelease.manifest.artifactId);
 assert.deepEqual(await recordContractDeclaration(b.storage,request,b.context),receipt);
 const action=createContractAction(legacyDefinition,{operationRef:b.operationRef,allowPreview:true,recovery:request,submit:body=>recordContractDeclaration(b.storage,body,b.context)});try{assert.deepEqual(await action.submit(),receipt);}finally{action.destroy();}
 for(const channel of ['application','acknowledgement']){const lease=await claimContractDelivery(b.storage,receipt.id,channel,b.context);assert.equal(lease.definition.schemaVersion,1);assert.equal(lease.receipt.acknowledgement.text,receipt.acknowledgement.text);}
});
