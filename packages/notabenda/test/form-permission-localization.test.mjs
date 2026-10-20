// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-FORM-PERMISSIONS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createFormPermission,mountFormPermission,normalizeFormPermissionOffer,toPublicConfig} from 'notabenda';
import {compileLegalDocuments,compileConsentRuntimeConfig,createFormPermissionOffer,createCollectionNotice,createConsentNotice,canonicalJson,sha256} from 'notabenda/content';
import {registerFormPermissionOffer,recordLegalRelease,setActiveFormPermissionOffer,getFormPermissionState,recordFormPermission,formPermissionStreamRef,createFormPermissionStore,renderRecordDetail} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
import {normalizeFormPermissionLocalization} from '../dist/form-permission-localization-policy.js';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
const messages=JSON.parse(await readFile(new URL('../../../examples/localization/form-messages.json',import.meta.url),'utf8'));
const at='2026-10-19T12:00:00.000Z';
const settings={permissionId:'reading-email',purposeId:'suggestions',channel:{id:'email',label:'E-mail'},revision:'pt-1',reviewStatus:'draft',withdrawalUrl:'/help',wording:{title:'Uma leitura por e-mail',statement:'Quero receber sugestões de leitura por e-mail.',grantLabel:'Salvar permissão',withdrawLabel:'Retirar permissão',optionality:'Opcional. Você pode continuar sem esta escolha.',withdrawalExplanation:'Retire sua permissão aqui a qualquer momento.'}};
async function setup({reviewed=false}={}){
 const config=localizedExampleConfig(await fixture());config.localization.formPermission=structuredClone(messages);
 config.scopeGuards={version:1,revision:'test-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 if(reviewed){config.localization.reviewStatus='reviewed';for(const doc of Object.values(config.documents))doc.review.status='reviewed';}
 const options=reviewed?{}:{mode:'preview'},build=compileLegalDocuments(config,options),offer=createFormPermissionOffer(build.artifact,{...settings,reviewStatus:reviewed?'reviewed':'draft'},options),storage=createSyntheticStorage([]),context={siteId:config.site.id,permissionId:offer.permissionId,streamId:'synthetic-contact-generation',now:()=>new Date(at),allowPreview:!reviewed};
 await recordLegalRelease(storage,build.artifact);await registerFormPermissionOffer(storage,offer,context);await setActiveFormPermissionOffer(storage,offer.offerId,context);
 return {config,build,offer,storage,context,ref:await formPermissionStreamRef(context)};
}
const controller=f=>createFormPermission(f.offer,{streamRef:f.ref,allowPreview:!!f.context.allowPreview,now:()=>new Date(at),read:()=>getFormPermissionState(f.storage,f.context),submit:body=>recordFormPermission(f.storage,body,f.context)});
const rehash=n=>{const {offerId,...d}=n;return {...n,offerId:sha256(canonicalJson(d))};};

test('localized offers pin complete reviewed messages while keeping direct notices and cookie scope separate',async()=>{
 const f=await setup({reviewed:true});assert.equal(f.offer.schemaVersion,2);assert.equal(f.offer.localization.locale,'pt-BR');assert.deepEqual(f.offer.localization.formPermission,messages);
 const original=structuredClone(f.config);delete original.localization.formPermission;
 const before=compileConsentRuntimeConfig(original,{evidence:'local'}),after=compileConsentRuntimeConfig(f.config,{evidence:'local'});assert.deepEqual(after,before);
 const oldNotice=createConsentNotice(compileLegalDocuments(original).artifact,{scopeId:'test'}),newNotice=createConsentNotice(f.build.artifact,{scopeId:'test'});
 assert.deepEqual(newNotice.purposes,oldNotice.purposes);assert.equal(Object.hasOwn(newNotice.localization,'formPermission'),false);
 assert.throws(()=>createFormPermissionOffer(compileLegalDocuments(original).artifact,{...settings,reviewStatus:'reviewed'}),/localization.formPermission/u);
 assert.throws(()=>createCollectionNotice(f.build.artifact,{scopeId:'test',purposeIds:['suggestions'],reviewStatus:'reviewed',wording:{title:'Test',intro:'Test'}}),/does not yet support/u);
 const copy=normalizeFormPermissionOffer(f.offer);copy.localization.formPermission.error='changed';assert.equal(f.offer.localization.formPermission.error,messages.error);
 assert.deepEqual(toPublicConfig(f.config).localization.formPermission,messages);
});

test('message boundaries reject partial sets, wrong placeholders, markup and draft production copy',async()=>{
 const f=await setup();
 for(const change of [n=>delete n.localization.formPermission.error,n=>n.localization.formPermission.extra='bad',n=>n.localization.formPermission.policy='no placeholder',n=>n.localization.formPermission.error='<b>bad</b>',n=>n.localization.locale='pt-br',n=>n.localization.direction='auto',n=>n.localization.revision='',n=>n.schemaVersion=1,n=>n.localization.formPermission.error='x'.repeat(2001)]){
  const n=structuredClone(f.offer);change(n);assert.throws(()=>normalizeFormPermissionOffer(n,{allowPreview:true}));
 }
 assert.throws(()=>normalizeFormPermissionOffer(f.offer));
 const config=structuredClone(f.config);delete config.localization.formPermission.loading;assert.throws(()=>compileLegalDocuments(config,{mode:'preview'}));
});

test('CF rejects rehashed copy/locale/revision mismatches and prevents v1 localization downgrade',async()=>{
 const f=await setup({reviewed:true});
 for(const [index,change] of [n=>n.localization.formPermission.error='Outra mensagem.',n=>n.localization.locale='en',n=>n.localization.revision='unexpected-copy',n=>n.localization.direction='rtl',n=>{n.schemaVersion=1;delete n.localization;}].entries()){
  const n=structuredClone(f.offer);change(n);await assert.rejects(registerFormPermissionOffer(f.storage,rehash(n),f.context),e=>e.code==='invalid-offer','mismatch '+index);
 }
 const next=structuredClone(f.config);next.localization.revision='copy-3';next.localization.formPermission.error='Não foi possível confirmar. Tente novamente.';
 const build=compileLegalDocuments(next);await recordLegalRelease(f.storage,build.artifact);
 const offer=createFormPermissionOffer(build.artifact,{...settings,reviewStatus:'reviewed'});
 await assert.rejects(registerFormPermissionOffer(f.storage,offer,f.context),e=>e.code==='idempotency-conflict');
 const changed=createFormPermissionOffer(build.artifact,{...settings,reviewStatus:'reviewed',revision:'pt-2'});await registerFormPermissionOffer(f.storage,changed,f.context);
});

test('native localized permission starts unchecked, grants and withdraws with actual CF receipts',async()=>{
 const f=await setup(),c=controller(f),dom=new JSDOM('<div></div>'),root=dom.window.document.querySelector('div'),ui=mountFormPermission(root,{permission:c});
 try{
  const region=root.querySelector('section');assert.equal(region.lang,'pt-BR');assert.equal(region.dir,'ltr');assert.equal(root.querySelector('input').checked,false);assert.equal(root.querySelector('[role=status]').textContent,messages.initial);
  assert.equal(root.querySelector('summary').textContent,messages.detailsSummary);assert.ok(root.textContent.includes(messages.withdrawalHelp));assert.ok(!root.textContent.includes('Read the privacy policy'));
  await c.refresh();assert.equal(root.querySelector('[role=status]').textContent,messages.off);
  c.setChecked(true);const result=await c.grant();assert.equal(result.state.permitted,true);assert.equal(root.querySelector('[role=status]').textContent,messages.recorded);
  await c.withdraw();assert.equal(root.querySelector('[role=status]').textContent,messages.withdrawn);assert.equal(c.getSnapshot().allowed,false);
  const page=await createFormPermissionStore(f.storage,f.context).list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:10});assert.equal(page.records.length,2);
  const html=renderRecordDetail(page.records[0],{basePath:'/admin',title:'Permission records',scopeLabel:'Test site',nonce:'a'.repeat(32)});assert.match(html,/Declared interface wording/u);assert.match(html,/pt-BR/u);assert.ok(html.includes(messages.error));assert.match(html,/lang="pt-BR" dir="ltr"/u);
 }finally{ui.destroy();c.destroy();dom.window.close();}
});

test('the direct message policy rejects accessors without invoking them',async()=>{
 const f=await setup();let reads=0;
 const input=structuredClone(f.offer.localization);Object.defineProperty(input.formPermission,'error',{enumerable:true,get(){reads++;return 'Never read';}});
 assert.throws(()=>normalizeFormPermissionLocalization(input,{allowPreview:true}));assert.equal(reads,0);
});

test('a pending v1 withdrawal retries unchanged after activating a localized v2 offer',async()=>{
 const f=await setup({reviewed:true}),legacy=structuredClone(f.config);delete legacy.localization;legacy.site.locale='en';
 const build=compileLegalDocuments(legacy),offer=createFormPermissionOffer(build.artifact,{...settings,reviewStatus:'reviewed',revision:'legacy-1'});
 await recordLegalRelease(f.storage,build.artifact);await registerFormPermissionOffer(f.storage,offer,f.context);await setActiveFormPermissionOffer(f.storage,offer.offerId,f.context);
 const {IDBFactory}=await import('fake-indexeddb'),{createIndexedDBFormPermissionJournal}=await import('notabenda');
 const journal=createIndexedDBFormPermissionJournal({indexedDB:new IDBFactory(),databaseName:'locale-transition',broadcastChannel:null});
 const sent=[];let lost=false,c;
 const options={streamRef:f.ref,journal,now:()=>new Date(at),read:()=>getFormPermissionState(f.storage,f.context),async submit(command){sent.push(structuredClone(command));const result=await recordFormPermission(f.storage,command,f.context);if(command.action==='withdraw'&&!lost){lost=true;throw Error('Lost acknowledgement');}return result;}};
 try{
  c=createFormPermission(offer,options);await c.refresh();c.setChecked(true);await c.grant();await assert.rejects(c.withdraw());
  const command=sent.at(-1),key=`notabenda:permission:v1:${offer.siteId}:${offer.permissionId}:${f.ref}`;
  const pending=await journal.read(key);assert.equal(pending.withdraw.artifactId,offer.artifactId);assert.deepEqual(pending.withdraw.command,command);c.destroy();
  await setActiveFormPermissionOffer(f.storage,f.offer.offerId,f.context);
  c=createFormPermission(f.offer,options);await c.reconcile();assert.equal(c.getSnapshot().allowed,false);
  const stillPending=await journal.read(key);assert.equal(stillPending.withdraw.artifactId,offer.artifactId);assert.deepEqual(stillPending.withdraw.command,command);
  await c.retryPending();assert.deepEqual(sent.at(-1),command);assert.equal(c.getSnapshot().allowed,false);assert.equal(c.getSnapshot().current.activeOfferId,f.offer.offerId);assert.equal(c.getSnapshot().checked,false);
 }finally{c?.destroy();journal.close();}
});
