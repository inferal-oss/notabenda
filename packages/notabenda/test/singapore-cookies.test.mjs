// @requirements REQ-SG-CONSENT-CONDITIONS REQ-SG-CONSENT-ROUTES REQ-SG-WITHDRAWAL REQ-SG-ACCOUNTABILITY
// @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {createConsent,toPublicConfig,mountControls} from '@notabenda/core';
import {compileConsentRuntimeConfig,compileLegalDocuments} from '@notabenda/core/content';
import {createConsentRuntime} from '@notabenda/core/consent';
import {createSetupPlan,readSetupAnswers} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {describeIntegration} from '@notabenda/core/integration';
import {fixture} from './helpers.mjs';
const reviews=()=>describeIntegration(['cookie-consent']).cookieJurisdictionReviews;
const answers=()=>({schemaVersion:1,markets:[],answers:{}}),regional=plan=>plan.report.recommendations.filter(r=>r.id==='cookie-review-SG');
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
async function inventory(){
 const c=await fixture({reviewed:true}),purpose=c.purposes[0].id;c.jurisdictions=['SG'];c.purposes=[{...c.purposes[0],name:'Optional advertising',description:'Show sample offers after a choice.',legalBasis:'Consent in this synthetic test.'}];c.storage=[];
 c.services=[{id:'optional-ads',name:'Sample advertising',provider:'Fictional provider',location:'This browser',purposeIds:[purpose],processingActivities:[]}];
 c.consent={purposes:[{id:purpose,scope:'one'}],services:[{id:'optional-ads',scope:'one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
 c.scopeGuards={version:1,revision:'supported-test-context',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};return {c,purpose};
}
test('Singapore advice cites the current retrieved guideline, exact chapter and partial catalog requirements',async()=>{
 const r=reviews(),catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8'));assert.equal(r.advisoryOnly,true);assert.equal(r.determinesApplicability,false);assert.equal(r.activatesPolicy,false);assert.equal(r.legalReviewStatus,'unreviewed');
 assert.deepEqual(r.mechanism,{detectsBrowserConsent:false,declaresExemptions:false,importsBrowserPreferences:false,grantsFromMarketSelection:false});assert.equal(r.items.length,1);const item=r.items[0];assert.equal(item.marketId,'SG');assert.equal(item.guidelineRevision,'2024-05-23');assert.equal(item.checkedOn,'2026-10-22');assert.equal(item.statuteAsAt,'2026-10-22');assert.match(item.checks.map(c=>c.locator).join(' '),/7\.12/);
 for(const source of r.sources){const authoritative=catalog.sources.find(s=>s.id===source.id);assert.ok(authoritative);assert.deepEqual(source,Object.fromEntries(Object.keys(source).map(k=>[k,authoritative[k]])));assert.equal(source.access,'read');}
 for(const id of item.requirementIds){const req=catalog.requirements.find(v=>v.id===id);assert.equal(req.jurisdiction,'SG');assert.equal(req.implementationStatus,'partial');assert.equal(req.legalReviewStatus,'unreviewed');assert.deepEqual(req.sourceRefs.map(v=>v.sourceId),[['REQ-SG-COOKIE-DATA','REQ-SG-COOKIE-TARGETING','REQ-SG-BROWSER-CHOICE'].includes(id)?'SRC-SG-SELECTED-2024':'SRC-SG-PDPA-CURRENT']);assert.equal(req.effectiveFrom,null);}
 const revision=catalog.sources.find(s=>s.id==='SRC-SG-SELECTED-2024');assert.match(revision.note,/23 May 2024/);assert.match(revision.contentSha256,/^[a-f0-9]{64}$/);
 r.items[0].checks.length=0;r.sources.length=0;assert.equal(reviews().items[0].checks.length,7);assert.equal(reviews().sources.length,3);
});
test('Singapore market interest or imported jurisdiction creates advice without rewriting consent, classification or a conflicting answer',async()=>{
 for(const imported of [false,true]){
  const {c}=await inventory(),a=answers();if(!imported){c.jurisdictions=[];a.markets=['SG'];}a.answers['optional-storage']={choice:'no',justification:'Private cookie assessment, not an exemption.'};const original=structuredClone(c),input=structuredClone(a);
  const plan=createSetupPlan(a,{config:c,preserveConfig:true});assert.deepEqual(c,original);assert.deepEqual(a,input);assert.deepEqual(plan.config,toPublicConfig(original,{mode:'preview'}));assert.equal(plan.report.productionReady,false);assert.equal(regional(plan).length,1);assert.equal(regional(plan)[0].status,'review');assert.equal(plan.report.recommendations.find(r=>r.id==='optional-storage').status,'declared-no');assert.match(regional(plan)[0].reason,new RegExp(reviews().revision.replaceAll('.','\\.')));assert.ok(plan.report.reviewItems.some(text=>text.includes('Singapore:')));assert.equal(plan.config.storageExceptions,undefined);
  const build=compileLegalDocuments(plan.config);assert.doesNotMatch(JSON.stringify(build),/Private cookie assessment|research revision/);
 }
 const a=answers();a.markets=['SG'];const plan=createSetupPlan(a);assert.deepEqual(plan.config.jurisdictions,[]);assert.equal(plan.config.consent,undefined);assert.equal(plan.config.storageExceptions,undefined);assert.equal(regional(createSetupPlan(answers())).length,0);
});
test('saved setup answers survive source review without replacing historical recommendations',()=>{
 const a=answers();a.markets=['SG'];const saved={schemaVersion:1,kind:'private-setup-report',questionnaireVersion:'8',answers:a,recommendations:[{id:'old',reason:'Historical wording'}]},before=JSON.stringify(saved);
 const plan=createSetupPlan(readSetupAnswers(saved));assert.equal(regional(plan).length,1);assert.equal(JSON.stringify(saved),before);assert.deepEqual(readSetupAnswers({...saved,questionnaireVersion:'1'}).markets,['SG']);
});
test('CLI reference and wizard use the same advice while keeping reasons out of public configuration',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'notabenda-singapore-'));try{
  const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8'});const described=run('describe','cookie-consent','--json');assert.equal(described.status,0,described.stderr);const reference=JSON.parse(described.stdout);assert.deepEqual(reference.cookieJurisdictionReviews,reviews());assert.ok(reference.markets.some(m=>m.id==='SG'));assert.match(reference.targets.find(t=>t.id==='cookie-consent').hostWork.join(' '),/cookieJurisdictionReviews/);
  const a=answers();a.markets=['SG'];a.answers['optional-storage']={choice:'unknown',justification:'Private Singapore reason.'};await writeFile(join(dir,'answers.json'),JSON.stringify(a));const result=run('wizard','--answers','answers.json');assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/Private Singapore reason/);
  const config=JSON.parse(await readFile(join(dir,'notabenda-setup/notabenda.config.json'),'utf8')),report=JSON.parse(await readFile(join(dir,'notabenda-setup/setup.private.json'),'utf8'));assert.deepEqual(regional({report}),regional(createSetupPlan(a)));assert.equal(config.consent,undefined);assert.deepEqual(config.jurisdictions,[]);assert.doesNotMatch(JSON.stringify(config),/Private Singapore reason/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('browser setup presents Singapore and the same actionable review without selecting a policy',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://operator.example.test/setup'}),root=dom.window.document.querySelector('main');dom.window.URL.createObjectURL=()=> 'blob:singapore-review';dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(root);
 try{const label=[...root.querySelectorAll('.nb-setup-markets label')].find(l=>l.textContent==='Singapore');assert.ok(label);label.querySelector('input').click();root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));const plan=ui.getPlan();assert.deepEqual(regional(plan),regional(createSetupPlan({...answers(),markets:['SG']})));assert.match(root.querySelector('[aria-label="Setup recommendations"]').textContent,/Review Singapore cookie use/);assert.equal(plan.config.consent,undefined);}finally{ui.destroy();dom.window.close();}
});
for(const name of ['compatibility','compiled']){
 test(`${name}: enabled browser cookies and unrelated preferences grant nothing; explicit native choice and withdrawal control the declared service`,async()=>{
  const {c,purpose}=await inventory(),dom=new JSDOM('<main></main>',{url:'https://fictional.example.test'}),document=dom.window.document;dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};assert.equal(dom.window.navigator.cookieEnabled,true);document.cookie='unrelated_preference=allow';const values=new Map([['cookie-enabled','true'],['third-party-choice','accepted']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},environment={storage,schedule:()=>()=>{}};
  const build=input=>name==='compatibility'?createConsent(input,environment):createConsentRuntime(compileConsentRuntimeConfig(input,{evidence:'local'}),environment),controller=build(c),events=[],ui=mountControls(document.querySelector('main'),{consent:controller});
  try{controller.registerService('optional-ads',{purposes:[purpose],start(){events.push('start');return ()=>{events.push('stop');};}});await controller.settled();assert.deepEqual(events,[]);assert.equal(controller.isAllowed(purpose),false);controller.dismiss();assert.equal(controller.isAllowed(purpose),false);controller.openPreferences();const option=document.querySelector('dialog input[type=checkbox]');assert.ok(option);assert.equal(option.checked,false);option.click();await controller.settled();assert.deepEqual(events,[]);const accept=[...document.querySelector('dialog').querySelectorAll('button')].find(b=>b.textContent==='Save choices');assert.ok(accept);accept.click();await controller.settled();assert.deepEqual(events,['start']);assert.equal(controller.isServiceAllowed('optional-ads'),true);controller.openPreferences();const reject=[...document.querySelector('dialog').querySelectorAll('button')].find(b=>b.textContent==='Reject optional');assert.ok(reject);reject.click();await controller.settled();assert.deepEqual(events,['start','stop']);assert.equal(controller.isAllowed(purpose),false);const reloaded=build(c);try{assert.equal(reloaded.isAllowed(purpose),false);}finally{reloaded.destroy();}}finally{ui.destroy();controller.destroy();dom.window.close();}
 });
}
test('Singapore review cannot relax an explicit unresolved child-related scope guard',async()=>{
 const {c,purpose}=await inventory();c.scopeGuards.site.children='unknown';const plan=createSetupPlan({...answers(),markets:['SG']},{config:c,preserveConfig:true});assert.equal(plan.config.scopeGuards.site.children,'unknown');
 const controller=createConsent(plan.config,{storage:{getItem:()=>null,setItem(){throw Error('No grant should be saved');},removeItem(){}},schedule:()=>()=>{}});try{controller.acceptAll();assert.equal(controller.isAllowed(purpose),false);assert.equal(controller.isServiceAllowed('optional-ads'),false);}finally{controller.destroy();}
});
