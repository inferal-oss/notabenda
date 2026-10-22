// @requirements REQ-US-CA-UI REQ-PRODUCT-AGENT-INTEGRATION
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {toPublicConfig,mountControls} from '@notabenda/core';
import {createSetupPlan,readSetupAnswers} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {describeIntegration} from '@notabenda/core/integration';
import {fixture} from './helpers.mjs';
import {consentProfiles} from './consent-profiles.mjs';
const reviews=()=>describeIntegration(['cookie-consent','processing-opt-outs']).privacyInterfaceReviews;
const answers=()=>({schemaVersion:1,markets:[],answers:{}}),regional=plan=>plan.report.recommendations.filter(r=>r.id==='privacy-interface-US-CA');

test('California interface review connects current regulation/advisory sources to partial implementation without approval',async()=>{
 const r=reviews(),catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8'));
 assert.equal(r.advisoryOnly,true);assert.equal(r.determinesApplicability,false);assert.equal(r.activatesPolicy,false);assert.equal(r.legalReviewStatus,'unreviewed');assert.equal(r.mechanism.implementsSaleSharingReOptIn,false);assert.equal(r.mechanism.approvesCustomPresentation,false);
 for(const source of r.sources){const authoritative=catalog.sources.find(s=>s.id===source.id);assert.ok(authoritative);assert.deepEqual(source,Object.fromEntries(Object.keys(source).map(k=>[k,authoritative[k]])));assert.equal(source.access,'read');}
 const item=r.items[0],req=catalog.requirements.find(v=>v.id==='REQ-US-CA-UI');assert.equal(item.marketId,'US-CA');assert.equal(item.regulationEffectiveFrom,'2026-01-01');assert.equal(req.implementationStatus,'partial');assert.equal(req.legalReviewStatus,'unreviewed');assert.deepEqual(req.sourceRefs.map(v=>v.sourceId),item.sourceIds);assert.equal(item.checks.length,4);assert.match(item.limits.join(' '),/no safe harbor/);
 r.items[0].checks.length=0;assert.equal(reviews().items[0].checks.length,4);
});
test('market interest and imported scope add guidance without rewriting inventory, practices or historical reports',async()=>{
 for(const imported of [false,true]){
  const c=await fixture({reviewed:true}),a=answers();if(imported)c.jurisdictions=['US-CA'];else a.markets=['US-CA'];a.answers['optional-storage']={choice:'no',justification:'Private assessment'};const before=structuredClone(c),original=structuredClone(a),plan=createSetupPlan(a,{config:c,preserveConfig:true});
  assert.deepEqual(plan.config,toPublicConfig(before,{mode:'preview'}));assert.deepEqual(c,before);assert.deepEqual(a,original);assert.equal(regional(plan).length,1);assert.equal(plan.report.recommendations.find(r=>r.id==='optional-storage').status,'declared-no');assert.ok(plan.report.reviewItems.some(v=>v.includes('California:')&&v.includes('double negatives')));assert.equal(plan.report.productionReady,false);
  const old={schemaVersion:1,kind:'private-setup-report',questionnaireVersion:'7',answers:a,recommendations:[{id:'historical',reason:'Earlier advice'}]},bytes=JSON.stringify(old);assert.equal(regional(createSetupPlan(readSetupAnswers(old),{config:c,preserveConfig:true})).length,1);assert.equal(JSON.stringify(old),bytes);
 }
 assert.deepEqual(regional(createSetupPlan(answers())),[]);
});
test('installed describe and wizard expose the same review while keeping justifications out of public config/stdout',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'notabenda-ca-choice-'));try{
  const cli=new URL('../dist/cli.js',import.meta.url).pathname,run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8'});
  const described=run('describe','cookie-consent','--json');assert.equal(described.status,0,described.stderr);assert.deepEqual(JSON.parse(described.stdout).privacyInterfaceReviews,reviews());
  const a=answers();a.markets=['US-CA'];a.answers['optional-storage']={choice:'unknown',justification:'PRIVATE_INTERFACE_REVIEW'};await writeFile(join(dir,'answers.json'),JSON.stringify(a));const result=run('wizard','--answers','answers.json');assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/PRIVATE_INTERFACE_REVIEW/);
  const c=JSON.parse(await readFile(join(dir,'notabenda-setup/notabenda.config.json'),'utf8')),report=JSON.parse(await readFile(join(dir,'notabenda-setup/setup.private.json'),'utf8'));assert.equal(regional({report}).length,1);assert.deepEqual(c.jurisdictions,[]);assert.equal(c.privacySignals,undefined);assert.doesNotMatch(JSON.stringify(c),/PRIVATE_INTERFACE_REVIEW/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('browser setup presents California review without selecting a runtime policy',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://operator.example.test/setup'}),root=dom.window.document.querySelector('main');dom.window.URL.createObjectURL=()=> 'blob:ca-choice-review';dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(root);
 try{const market=[...root.querySelectorAll('.nb-setup-markets label')].find(n=>n.textContent==='California');assert.ok(market);market.querySelector('input').click();root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));const plan=ui.getPlan();assert.equal(regional(plan).length,1);assert.equal(plan.config.privacySignals,undefined);assert.match(root.querySelector('[aria-label="Setup recommendations"]').textContent,/Review California privacy-choice paths/);assert.deepEqual(plan.config.jurisdictions,[]);}finally{ui.destroy();dom.window.close();}
});

async function controls(factory){
 const c=await fixture({reviewed:true});c.storage=[];c.scopeGuards={version:1,revision:'supported-test-context',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 c.services=[{id:'optional',name:'Optional tools',provider:'Fictional provider',location:'This browser',purposeIds:c.purposes.map(p=>p.id)}];c.consent={purposes:c.purposes.map(p=>({id:p.id,scope:'one'})),services:[{id:'optional',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:10};
 const values=new Map(),environment={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},schedule:()=>()=>{}},dom=new JSDOM('<main></main>',{url:'https://sample.example.test/'});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const consent=factory(c,environment),ui=mountControls(dom.window.document.querySelector('main'),{consent});let starts=0;consent.registerService('optional',{purposes:c.purposes.map(p=>p.id),start:()=>{starts++;return ()=>{};}});
 return {c,dom,consent,starts:()=>starts,close(){ui.destroy();consent.destroy();dom.window.close();}};
}
for(const [profile,factory] of consentProfiles){
 test(profile+': native initial notice supplies direct paired rejection and acceptance without a persuasion step',async()=>{
  const f=await controls(factory);try{const doc=f.dom.window.document,notice=doc.querySelector('.nb-consent-notice'),buttons=notice.querySelectorAll('.nb-choice-actions button');assert.equal(notice.hidden,false);assert.equal(buttons.length,2);assert.equal(buttons[0].textContent,'Reject optional');assert.equal(buttons[1].textContent,'Accept optional');assert.equal(buttons[0].className,buttons[1].className);assert.equal(buttons[0].disabled,false);assert.equal(buttons[1].disabled,false);assert.ok([...doc.querySelectorAll('input[type=checkbox]')].every(i=>!i.checked));buttons[0].click();await f.consent.settled();assert.equal(f.starts(),0);assert.equal(doc.querySelector('dialog').open,false);assert.ok(Object.values(f.consent.getSnapshot().purposes).every(p=>p==='denied'));assert.equal(notice.hidden,true);}finally{f.close();}
 });
 test(profile+': dismissing or closing an edited draft grants nothing and dialog rejection discards it in one action',async()=>{
  const f=await controls(factory);try{const doc=f.dom.window.document,notice=doc.querySelector('.nb-consent-notice'),secondary=notice.querySelectorAll('.nb-choice-secondary button');secondary[1].click();assert.ok(Object.values(f.consent.getSnapshot().purposes).every(p=>p==='unknown'));f.consent.openPreferences();const inputs=[...doc.querySelectorAll('input[type=checkbox]')];for(const i of inputs)i.checked=true;f.consent.closePreferences();await f.consent.settled();assert.equal(f.starts(),0);assert.ok(Object.values(f.consent.getSnapshot().purposes).every(p=>p==='unknown'));f.consent.openPreferences();for(const i of inputs)i.checked=true;const buttons=doc.querySelectorAll('.nb-preferences-footer button');assert.equal(buttons[0].textContent,'Reject optional');assert.equal(buttons[0].className,buttons[1].className);buttons[0].click();await f.consent.settled();assert.equal(doc.querySelector('dialog').open,false);assert.equal(f.starts(),0);assert.ok(Object.values(f.consent.getSnapshot().purposes).every(p=>p==='denied'));}finally{f.close();}
 });
}
