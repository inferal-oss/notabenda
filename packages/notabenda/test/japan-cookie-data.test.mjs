import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-JP-RELATED-SCOPE REQ-JP-RECIPIENT-CONSENT REQ-JP-RELATED-FOREIGN
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {toPublicConfig,mountControls} from '@notabenda/core';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {createConsentRuntime} from '@notabenda/core/consent';
import {createSetupPlan,readSetupAnswers} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {describeIntegration} from '@notabenda/core/integration';
import {fixture} from './helpers.mjs';
const reference=()=>describeIntegration(['cookie-consent']).cookieJurisdictionReviews;
const review=()=>reference().items.find(i=>i.marketId==='JP');
const answers=()=>({schemaVersion:1,markets:['JP'],answers:{}});
const recommendation=plan=>plan.report.recommendations.find(r=>r.id==='cookie-review-JP');
async function inventory(){
 const c=await fixture({reviewed:true});c.jurisdictions=['JP'];c.storage=[];c.purposes=[{...c.purposes[0],name:'Recipient linkage',description:'Share sample activity with Example Recipient for its declared customer-record use.',dataCategories:['Sample activity identifier']}];
 c.services=[{id:'recipient-service',name:'Sample connection',provider:'Example Recipient',location:'Host-assessed location',purposeIds:[c.purposes[0].id],processingActivities:[]}];
 c.consent={purposes:[{id:c.purposes[0].id,scope:'one'}],services:[{id:'recipient-service',scope:'one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};return c;
}
test('Japan source metadata preserves unverified current-law and commencement status with exact catalog links',async()=>{
 const r=reference(),j=review(),catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8'));
 assert.equal(r.advisoryOnly,true);assert.equal(r.activatesPolicy,false);assert.equal(r.determinesApplicability,false);
 assert.equal(j.guidelineRevision,'2026-06');assert.equal(j.checkedOn,'2026-10-22');
 assert.deepEqual(j.sourceStatus,{bindingLawLanguage:'ja',currentConsolidatedLawVerified:false,englishIndexConsolidation:'2023-04-01',linkedTranslationRetrieved:false,amendmentPromulgatedOn:'2026-07-17',amendmentCommencementVerified:false,autoActivatesAmendments:false});
 for(const id of j.sourceIds){const s=r.sources.find(s=>s.id===id),c=catalog.sources.find(s=>s.id===id);assert.ok(s);assert.equal(s.access,'read');assert.deepEqual(s,Object.fromEntries(Object.keys(s).map(k=>[k,c[k]])));}
 for(const id of j.requirementIds){const req=catalog.requirements.find(v=>v.id===id);assert.equal(req.jurisdiction,'JP');assert.equal(req.implementationStatus,'partial');assert.equal(req.legalReviewStatus,'unreviewed');assert.equal(req.effectiveFrom,null);assert.ok(req.sourceRefs.every(v=>j.sourceIds.includes(v.sourceId)));}
 for(const id of ['SRC-JP-APPI-DATA','SRC-JP-TRANSLATION-2023'])assert.equal(catalog.sources.find(s=>s.id===id).access,'blocked');
 const copy=reference();copy.items.find(i=>i.marketId==='JP').checks.length=0;assert.equal(review().checks.length,4);
});
test('selected/imported Japan preserves config and conflicting private answers; an old report remains unchanged',async()=>{
 for(const imported of [false,true]){const c=await inventory(),a=answers();if(imported)a.markets=[];else c.jurisdictions=[];a.answers['optional-storage']={choice:'no',justification:'PRIVATE-JAPAN-REASON'};
  const saved={schemaVersion:1,kind:'private-setup-report',questionnaireVersion:'8',answers:a,recommendations:[{id:'old',reason:'Earlier research'}]},before=JSON.stringify(saved),original=structuredClone(c);
  const plan=createSetupPlan(readSetupAnswers(saved),{config:c,preserveConfig:true});assert.deepEqual(plan.config,toPublicConfig(original));assert.deepEqual(c,original);assert.equal(JSON.stringify(saved),before);assert.ok(recommendation(plan));assert.equal(plan.report.recommendations.find(r=>r.id==='optional-storage').status,'declared-no');assert.doesNotMatch(JSON.stringify(plan.config),/PRIVATE-JAPAN/);assert.equal(plan.config.storageExceptions,undefined);
 }
 const plan=createSetupPlan(answers());assert.deepEqual(plan.config.jurisdictions,[]);assert.equal(plan.config.consent,undefined);assert.ok(plan.report.reviewItems.some(x=>/Japan:.*current.*law/i.test(x)));
});
test('CLI reference and wizard expose the same Japan review without public private reasons',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'notabenda-japan-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;
 try{const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8'}),described=run('describe','cookie-consent','--json');assert.equal(described.status,0,described.stderr);const ref=JSON.parse(described.stdout);assert.deepEqual(ref.cookieJurisdictionReviews,reference());assert.ok(ref.markets.some(m=>m.id==='JP'));
  const a=answers();a.answers['optional-storage']={choice:'unknown',justification:'PRIVATE-JAPAN-CLI'};await writeFile(join(dir,'answers.json'),JSON.stringify(a));const result=run('wizard','--answers','answers.json');assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/PRIVATE-JAPAN-CLI/);
  const report=JSON.parse(await readFile(join(dir,'notabenda-setup/setup.private.json'),'utf8')),config=JSON.parse(await readFile(join(dir,'notabenda-setup/notabenda.config.json'),'utf8'));assert.deepEqual(recommendation({report}),recommendation(createSetupPlan(a)));assert.equal(config.consent,undefined);assert.doesNotMatch(JSON.stringify(config),/PRIVATE-JAPAN-CLI/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('browser setup shows Japan and matching advice without enabling a service',()=>{
 const dom=new JSDOM('<main></main>'),root=dom.window.document.querySelector('main');dom.window.URL.createObjectURL=()=> 'blob:japan';dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(root);
 try{const label=[...root.querySelectorAll('.nb-setup-markets label')].find(l=>l.textContent==='Japan');assert.ok(label);label.querySelector('input').click();root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));assert.deepEqual(recommendation(ui.getPlan()),recommendation(createSetupPlan(answers())));assert.equal(ui.getPlan().config.consent,undefined);}finally{ui.destroy();dom.window.close();}
});
for(const profile of ['compatibility','compiled'])test(profile+': declared recipient choices stay explicit, withdrawal survives reload and recipient edits need a fresh choice',async()=>{
 const c=await inventory(),values=new Map(),env={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}},create=input=>profile==='compatibility'?createConsent(input,env):createConsentRuntime(compileConsentRuntimeConfig(input,{evidence:'local'}),env),controller=create(c);
 const dom=new JSDOM('<main></main>');dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};const ui=mountControls(dom.window.document.querySelector('main'),{consent:controller});let starts=0,stops=0;
 try{controller.registerService('recipient-service',{purposes:[c.purposes[0].id],start(){starts++;return ()=>{stops++;};}});controller.openPreferences();const dialog=dom.window.document.querySelector('dialog');assert.match(dialog.textContent,/Example Recipient/);assert.match(dialog.textContent,/declared customer-record use/);dialog.querySelector('input[type=checkbox]').click();await controller.settled();assert.equal(starts,0);const save=[...dialog.querySelectorAll('button')].find(b=>b.textContent==='Save choices');save.click();await controller.settled();assert.equal(starts,1);
  const changed=structuredClone(c);changed.services[0].provider='Different Recipient';const next=create(changed);try{assert.equal(next.isAllowed(c.purposes[0].id),false);}finally{next.destroy();}
  controller.rejectAll();await controller.settled();assert.equal(stops,1);const reload=create(c);try{assert.equal(reload.isAllowed(c.purposes[0].id),false);}finally{reload.destroy();}
 }finally{ui.destroy();controller.destroy();await controller.settled();dom.window.close();}
});
