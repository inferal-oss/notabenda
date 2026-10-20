// @requirements REQ-QC-PROFILING REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-ARTIFACTS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build as bundle} from 'esbuild';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createTechnologyCollectionNotice,normalizeTechnologyCollectionNotice,verifyTechnologyCollectionNotice,renderTechnologyCollectionNotice,technologyCollectionScope} from 'notabenda/technology';
import {compileLegalDocuments,createConsentNotice,canonicalJson,sha256} from 'notabenda/content';
import {mountControls} from 'notabenda';
import {technologyExampleConfig,technologySettings} from '../../../examples/technology/config.mjs';
import {fixture} from './helpers.mjs';
import {frenchTechnologyLocalization} from './fixtures/technology-fr.mjs';
import {consentProfiles} from './consent-profiles.mjs';
const settings=()=>({...structuredClone(technologySettings),reviewStatus:'reviewed'});
async function config(){const c=technologyExampleConfig(await fixture({reviewed:true}));for(const d of Object.values(c.documents))d.review.status='reviewed';return c;}
const release=c=>compileLegalDocuments(c).artifact;
const environment=values=>({storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse('2026-10-19T12:00:00Z'),schedule:()=>()=>{}});
const rehash=n=>{const {noticeId:_,...body}=n;return {...n,noticeId:sha256(canonicalJson(body))};};

test('the documented builder example typechecks against installed exports and rejects an invented function',async()=>{
 const root=fileURLToPath(new URL('../../../',import.meta.url)),cwd=await mkdtemp(join(root,'.local/technology-types-'));
 try{
  const guide=await readFile(new URL('../../../docs/TECHNOLOGY-COLLECTION.md',import.meta.url),'utf8'),example=/```ts\n([\s\S]+?)\n```/u.exec(guide)[1],file=join(cwd,'example.mts');
  const source="import type {SiteConfig} from 'notabenda';\ndeclare const config:SiteConfig;\n"+example+'\n';await writeFile(file,source);
  const compiler=join(root,'node_modules/typescript/bin/tsc'),run=()=>spawnSync(process.execPath,[compiler,'--noEmit','--target','es2022','--module','nodenext','--moduleResolution','nodenext','--strict','--skipLibCheck',file],{cwd,encoding:'utf8',timeout:30000});
  let result=run();assert.equal(result.status,0,result.stdout+result.stderr);
  await writeFile(file,source+"technologyCollectionScope({...declaration,functions:['invented']});\n");result=run();assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/invented/u);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('technology declaration pins the exact intact release, public provider, purposes and material scopes',async()=>{
 const c=await config();c.private={secret:'PRIVATE-NOTE'};const artifact=release(c),before=canonicalJson(artifact),notice=createTechnologyCollectionNotice(artifact,settings());
 assert.equal(notice.siteId,c.site.id);assert.equal(notice.artifactId,artifact.manifest.artifactId);assert.equal(notice.binding.serviceScope,c.consent.services[0].scope);assert.deepEqual(notice.purposes.map(p=>p.id),['reading-interests']);assert.equal(notice.service.provider,'Juniper');assert.doesNotMatch(canonicalJson(notice),/PRIVATE-NOTE/u);
 assert.equal(canonicalJson(verifyTechnologyCollectionNotice(notice,artifact)),canonicalJson(notice));assert.equal(canonicalJson(artifact),before);
 assert.equal(createTechnologyCollectionNotice(JSON.parse(canonicalJson(artifact)),settings()).noticeId,notice.noticeId,'retained canonical JSON must preserve the runtime scope binding');
 for(const mutate of [a=>a.publicConfig.services[0].provider='Changed',a=>a.pages[a.manifest.documents[0].file]+='changed',a=>a.documents.privacy.sections[0].heading='Changed',a=>a.manifest.documents[0].version='Changed']){const changed=structuredClone(artifact);mutate(changed);assert.throws(()=>createTechnologyCollectionNotice(changed,settings()));}
 const forged=structuredClone(notice);forged.service.provider='Other provider';assert.throws(()=>normalizeTechnologyCollectionNotice(forged));assert.throws(()=>verifyTechnologyCollectionNotice(rehash(forged),artifact));
});

test('only explicitly gated, assessed direct-collection services can use this profile',async()=>{
 for(const mutate of [c=>delete c.consent,c=>c.consent.services[0].scope='older-generic-scope',c=>delete c.scopeGuards,c=>c.scopeGuards.site.sensitiveData='unknown',c=>c.scopeGuards.site.highRiskProfiling='present',c=>c.purposes[0].collection.source='indirect',c=>c.storage[0].classification='necessary']){
  const c=await config();mutate(c);assert.throws(()=>createTechnologyCollectionNotice(release(c),settings()));
 }
 for(const kind of ['identification','location','profiling']){const c=await config(),s={...settings(),functions:[kind]};c.consent.services[0].scope=technologyCollectionScope(s);assert.deepEqual([...createTechnologyCollectionNotice(release(c),s).declaration.functions],[kind]);}
});

test('copied prose preserves ordinary line breaks and valid legacy English locale spelling',async()=>{
 for(const locale of ['en-us','EN']){
  const c=await config();c.site.locale=locale;c.purposes[0].description+='\nAdditional ordinary public information.';c.services[0].location='This browser\nNo remote provider.';
  const artifact=release(c),notice=createTechnologyCollectionNotice(artifact,settings()),html=renderTechnologyCollectionNotice(notice,{idPrefix:'legacy'});
  assert.equal(notice.locale,locale);assert.ok(notice.purposes[0].description.includes('\nAdditional ordinary'));assert.ok(new JSDOM(html).window.document.querySelector('section').textContent.includes('Additional ordinary public information.'));assert.equal(verifyTechnologyCollectionNotice(notice,JSON.parse(canonicalJson(artifact))).noticeId,notice.noticeId);
 }
});

test('settings reject ambiguous/private fields, sparse arrays, unsafe links and getters before invoking them',()=>{
 const bad=[null,{}, {...settings(),profile:'all-jurisdictions'}, {...settings(),notes:'PRIVATE-MARKER'}, {...settings(),functions:['profiling','profiling']},{...settings(),functions:Array(1)},{...settings(),functions:['biometrics']},{...settings(),technologyDescription:'x'.repeat(2001)},{...settings(),controlsLink:{label:'Open',href:'https://unrelated.test'}},{...settings(),controlsLink:{label:'Open',href:'//unrelated.test'}},{...settings(),controlsLink:{label:'Open',href:'/a%0ab'}},{...settings(),direction:'auto'}];
 let reads=0;bad.push({...settings(),get technologyDescription(){reads++;return 'unsafe';}},{...settings(),wording:{...settings().wording,get title(){reads++;return 'unsafe';}}});
 for(const value of bad)assert.throws(()=>technologyCollectionScope(value));assert.equal(reads,0);
});

test('French static copy is complete, escaped and readable before the controls without JavaScript',async()=>{
 const c=await config();c.site.locale='fr-CA';c.localization=structuredClone(frenchTechnologyLocalization);for(const d of Object.values(c.documents)){d.source='supplied';d.sections=[{id:'informations',heading:'Informations',paragraphs:['Contactez le responsable pour toute question.']}];}const s=settings();s.wording={title:'Vos intérêts de lecture',intro:'Choisissez les fonctions à activer.',functionsLabel:'Fonctions',purposesLabel:'Finalités',providerLabel:'Service',defaultOff:'Cette fonction est désactivée par défaut.',activationLabel:'Comment activer la fonction',privacyLinkLabel:'Politique de confidentialité',draftLabel:'Brouillon à réviser',contactLabel:'Contact'};s.functionLabels={identification:'Identification',location:'Localisation',profiling:'Profilage'};s.technologyDescription='<img src=x onerror=alert(1)> Profilage des intérêts.';s.activationInstructions='Ouvrez les choix, sélectionnez la finalité et enregistrez.';s.controlsLink.label='Choix de confidentialité';c.consent.services[0].scope=technologyCollectionScope(s);
 const n=createTechnologyCollectionNotice(release(c),s),html=renderTechnologyCollectionNotice(n,{idPrefix:'lecture'}),dom=new JSDOM(html),root=dom.window.document.querySelector('section');assert.equal(root.lang,'fr-CA');assert.equal(root.dir,'ltr');assert.equal(dom.window.document.querySelector('img'),null);assert.equal(dom.window.document.querySelector('details'),null);assert.match(root.textContent,/désactivée par défaut/u);assert.equal(dom.window.document.querySelector('.nb-technology-activation a').getAttribute('href'),'/technology/#privacy-choices');assert.doesNotMatch(root.textContent,/How to turn|Read the privacy policy|Function starts/u);
 const changed=structuredClone(n);delete changed.declaration.wording.activationLabel;assert.throws(()=>normalizeTechnologyCollectionNotice(rehash(changed)));
 const draft=await fixture();const draftConfig=technologyExampleConfig(draft),artifact=compileLegalDocuments(draftConfig,{mode:'preview'}).artifact;assert.throws(()=>createTechnologyCollectionNotice(artifact,technologySettings));const preview=createTechnologyCollectionNotice(artifact,technologySettings,{mode:'preview'});assert.throws(()=>renderTechnologyCollectionNotice(preview,{idPrefix:'draft'}));assert.match(renderTechnologyCollectionNotice(preview,{idPrefix:'draft',allowPreview:true}),/Draft notice for review/u);
});

for(const [name,create] of consentProfiles){
 test(`${name}: on-demand controls do not prompt or grant; actual voluntary choice governs the lifecycle`,async()=>{
  const c=await config(),values=new Map(),controller=create(c,environment(values)),dom=new JSDOM('<main><div id="controls"></div></main>'),doc=dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  let starts=0,stops=0;controller.registerService('reading-profile',{purposes:['reading-interests'],start({signal}){starts++;signal.addEventListener('abort',()=>stops++,{once:true});}});
  const ui=mountControls(doc.querySelector('#controls'),{consent:controller,noticeMode:'on-demand'});
  try{
   await controller.settled();assert.equal(doc.querySelector('.nb-consent-notice').hidden,true);assert.equal(controller.getSnapshot().shouldPrompt,true);assert.equal(values.size,0);assert.equal(starts,0);
   controller.openPreferences();assert.equal(starts,0);assert.equal(doc.querySelector('input').checked,false);controller.closePreferences();assert.equal(values.size,0);
   controller.choose({'reading-interests':true});await controller.settled();assert.equal(starts,1);controller.rejectAll();await controller.settled();assert.equal(stops,1);assert.equal(controller.isServiceAllowed('reading-profile'),false);
  }finally{ui.destroy();controller.destroy();dom.window.close();}
 });
 test(`${name}: an earlier generic grant cannot enable a newly declared technology scope`,async()=>{
  const c=await config(),values=new Map(),old=structuredClone(c);old.consent.services[0].scope='old-generic-1';let controller=create(old,environment(values));controller.acceptAll();controller.destroy();controller=create(c,environment(values));let starts=0;controller.registerService('reading-profile',{purposes:['reading-interests'],start(){starts++;}});await controller.settled();assert.equal(starts,0);assert.equal(controller.isServiceAllowed('reading-profile'),false);controller.destroy();
 });
 test(`${name}: withdrawal aborts a pending function start and disposes its late cleanup`,async()=>{
  const c=await config(),controller=create(c,environment(new Map()));let finish,signal,cleanups=0;
  controller.registerService('reading-profile',{purposes:['reading-interests'],start(context){signal=context.signal;return new Promise(resolve=>{finish=()=>resolve(()=>{cleanups++;});});}});
  controller.acceptAll();await Promise.resolve();await Promise.resolve();assert.equal(typeof finish,'function');assert.equal(signal.aborted,false);
  controller.rejectAll();assert.equal(signal.aborted,true);finish();await controller.settled();assert.equal(cleanups,1);assert.equal(controller.isServiceAllowed('reading-profile'),false);assert.equal(controller.getSnapshot().services['reading-profile'],'blocked');controller.destroy();
 });
 test(`${name}: GPC restrictions and required receipt failures still block the declared function`,async()=>{
  const c=await config();for(const service of c.services)service.processingActivities=service.id==='reading-profile'?['targeted-advertising']:[];c.privacySignals={globalPrivacyControl:{appliesTo:['targeted-advertising'],explanation:'An explicit host restriction for this synthetic test.'}};
  let controller=create(c,{...environment(new Map()),globalPrivacyControl:()=>true});controller.acceptAll();let starts=0;controller.registerService('reading-profile',{purposes:['reading-interests'],start(){starts++;}});await controller.settled();assert.equal(starts,0);controller.destroy();
  const notice=createConsentNotice(release(c),{scopeId:'technology'});let writes=0;controller=create(c,environment(new Map()),{evidence:{notice,streamRef:'a'.repeat(64),read:async()=>({schemaVersion:1,siteId:c.site.id,scopeId:'technology',streamRef:'a'.repeat(64),revision:0,event:null}),write:async()=>{writes++;throw Error('offline');}}});controller.registerService('reading-profile',{purposes:['reading-interests'],start(){starts++;}});await controller.settled();controller.acceptAll();await controller.settled();assert.equal(writes,1);assert.equal(starts,0);assert.equal(controller.isServiceAllowed('reading-profile'),false);controller.destroy();
 });
}

test('material declarations change scope; presentation copy changes only the descriptor identity',async()=>{
 const c=await config(),s=settings(),a=release(c),first=createTechnologyCollectionNotice(a,s),copy=structuredClone(s);copy.wording.title='Your reading preferences';assert.equal(technologyCollectionScope(copy),technologyCollectionScope(s));assert.notEqual(createTechnologyCollectionNotice(a,copy).noticeId,first.noticeId);
 for(const mutate of [s=>s.functions=['identification'],s=>s.technologyDescription+=' New processing.',s=>s.activationInstructions+=' Changed action.',s=>s.revision='two']){const changed=structuredClone(s);mutate(changed);assert.notEqual(technologyCollectionScope(changed),technologyCollectionScope(s));assert.throws(()=>createTechnologyCollectionNotice(a,changed));}
 const result=await bundle({stdin:{contents:"import {createConsentRuntime,mountControls} from 'notabenda/consent'; export {createConsentRuntime,mountControls};",resolveDir:process.cwd(),sourcefile:'technology-graph.mjs'},bundle:true,platform:'browser',format:'esm',write:false,metafile:true});assert.equal(Object.keys(result.metafile.inputs).some(p=>p.includes('technology-collection')||p.includes('release-files')),false);
});
