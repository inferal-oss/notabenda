// @requirements REQ-PRODUCT-PACK-CONNECTION REQ-PRODUCT-SETUP REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountSetup} from '@notabenda/core/setup/ui';
import {selectPacks,planPacks} from '@notabenda/core/packs';
import {createSetupPlan} from '@notabenda/core/setup';
import {createSetupReviewSummary} from '../dist/setup-review-ui.js';

function browser({markets=[],answers={},packs=['processing-opt-outs']}={}){
  const dom=new JSDOM('<main></main>',{url:'https://operator.example.test/setup'}),root=dom.window.document.querySelector('main');
  dom.window.URL.createObjectURL=()=> 'blob:synthetic-review';dom.window.URL.revokeObjectURL=()=>{};
  const selection=selectPacks(packs),ui=mountSetup(root,{cartridges:selection,documentationBase:'/help/compliance',answers:{schemaVersion:1,markets,answers}});
  const prepare=()=>root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
  const close=()=>{ui.destroy();dom.window.close();};return {dom,root,ui,selection,prepare,close};
}
const findButton=(root,name)=>[...root.querySelectorAll('button')].find(b=>b.textContent===name);

test('draft findings precede previews and downloads, using the prepared report and selected question scope',()=>{
  const f=browser({answers:{'browser-opt-out-signals':{choice:'yes',justification:''},'consumer-payments':{choice:'unknown',justification:'PRIVATE note'}}});
  try{
    f.prepare();const plan=f.ui.getPlan(),summary=f.root.querySelector('.nb-setup-draft-review');assert.ok(summary);assert.equal(f.root.querySelector('[aria-label="Setup recommendations"] h2').nextElementSibling,summary);
    assert.equal(f.root.querySelectorAll('.nb-setup-draft-review').length,1);assert.equal(f.root.querySelector('.nb-setup-next-steps'),null);
    const ids=planPacks(f.selection).reference.relevantQuestionIds,unknown=ids.filter(id=>!plan.report.answers.answers[id]||plan.report.answers.answers[id].choice==='unknown').length;
    assert.equal(summary.querySelector('[data-review-kind=configuration] .nb-setup-finding-count').textContent,String(plan.report.diagnostics.filter(d=>d.severity==='error').length));
    assert.equal(summary.querySelector('[data-review-kind=practices] .nb-setup-finding-count').textContent,String(unknown));assert.ok(unknown<plan.report.recommendations.filter(r=>r.status==='investigate').length,'unselected unknown practices are not counted');
    assert.doesNotMatch(summary.textContent,/PRIVATE note/);assert.ok(f.root.querySelector('a[download]'),'findings do not block saving');
  }finally{f.close();}
});

test('configuration and all-note actions reveal their full destinations and move keyboard focus',()=>{
  const f=browser();try{
    f.prepare();const summary=f.root.querySelector('.nb-setup-draft-review'),technical=f.root.querySelector('.nb-setup-technical-review');assert.equal(technical.open,false);
    findButton(summary,'Review configuration').click();assert.equal(technical.open,true);assert.equal(f.dom.window.document.activeElement,technical.querySelector('.nb-setup-blockers h3'));
    technical.open=false;[...summary.querySelectorAll('button')].find(b=>b.textContent.startsWith('All review notes (')).click();const notes=technical.querySelector('.nb-setup-review-items');assert.equal(technical.open,true);assert.equal(notes.open,true);assert.equal(f.dom.window.document.activeElement,notes.querySelector('summary'));
  }finally{f.close();}
});

test('review selected facts preserves the plan and notes and focuses an unresolved visible practice',()=>{
  const f=browser({answers:{'personal-data':{choice:'yes',justification:'Private supporting facts'}}});try{
    f.prepare();const before=f.ui.getPlan();findButton(f.root.querySelector('.nb-setup-draft-review'),'Review selected facts').click();assert.deepEqual(f.ui.getPlan(),before);
    const active=f.dom.window.document.activeElement;assert.equal(active.type,'radio');assert.equal(active.value,'unknown');assert.equal(active.checked,true);assert.equal(active.closest('fieldset').hidden,false);assert.equal(active.closest('[data-question]').hidden,false);
    assert.ok(planPacks(f.selection).reference.relevantQuestionIds.includes(active.closest('[data-question]').dataset.question));assert.equal(f.root.querySelector('[data-question="personal-data"] textarea').value,'Private supporting facts');
  }finally{f.close();}
});

test('scope review topics are discoverable before technical details and preserve requirement/guide destinations',()=>{
  const f=browser({markets:['US-OR','US-MN']});try{
    f.prepare();const summary=f.root.querySelector('.nb-setup-draft-review'),topics=[...summary.querySelectorAll('[data-review-id]')],report=f.ui.getPlan().report;
    assert.deepEqual(topics.map(t=>t.dataset.reviewId),report.recommendations.filter(r=>r.status==='review').map(r=>r.id));assert.equal(topics.length,4,'two applicability and two specific signal topics, not four laws or jurisdictions');
    for(const item of topics){assert.equal(item.open,false);assert.ok(item.querySelector('summary').textContent);assert.equal(item.closest('.nb-setup-technical-review'),null);for(const a of item.querySelectorAll('a'))assert.ok(a.getAttribute('href').startsWith('/help/compliance/'));}
    const or=summary.querySelector('[data-review-id="privacy-signal-US-OR"]');or.open=true;assert.match(or.textContent,/legally unreviewed/);assert.match(or.querySelector('a').href,/#req-us-or-gpc$/);assert.equal(f.ui.getPlan().config.privacySignals,undefined);
  }finally{f.close();}
});

test('edits remove stale summary actions; regeneration and destroy never let detached buttons navigate',()=>{
  const f=browser();try{
    f.prepare();const summary=f.root.querySelector('.nb-setup-draft-review'),oldButton=findButton(summary,'Review selected facts');const note=f.root.querySelector('[data-question="personal-data"] textarea');note.value='New facts';note.dispatchEvent(new f.dom.window.Event('input',{bubbles:true}));assert.equal(f.ui.getPlan(),null);assert.equal(f.root.querySelector('.nb-setup-draft-review'),null);
    f.prepare();const current=f.root.querySelector('.nb-setup-draft-review');assert.notEqual(current,summary);const active=f.dom.window.document.activeElement;oldButton.click();assert.equal(f.dom.window.document.activeElement,active);
    const latest=findButton(current,'Review selected facts');f.ui.destroy();const after=f.root.innerHTML;latest.click();assert.equal(f.root.innerHTML,after);
  }finally{f.close();}
});

test('zero counts establish no approval or verification and do not hide other review notes',()=>{
  const plan=createSetupPlan({schemaVersion:1,markets:[],answers:{}}),dom=new JSDOM('<main></main>'),report=structuredClone(plan.report);report.diagnostics=[];report.reviewItems=['A missing justification or conflicting imported fact still needs review.'];report.answers.answers['personal-data']={choice:'no',justification:''};const before=structuredClone(report);
  try{
    const view=createSetupReviewSummary(dom.window.document,{report,recommendations:[],questionIds:['personal-data'],documentationBase:'/docs',isCurrent:()=>true,reviewConfiguration:()=>assert.fail(),reviewFacts:()=>{},reviewNotes:()=>{}});dom.window.document.querySelector('main').append(view);
    assert.deepEqual([...view.querySelectorAll('.nb-setup-finding-count')].map(n=>n.textContent),['0','0']);assert.equal(findButton(view,'Review configuration'),undefined);assert.ok(findButton(view,'All review notes (1)'));assert.match(view.textContent,/No errors in this validation pass/);assert.match(view.textContent,/Supporting facts and justifications still need review/);assert.match(view.textContent,/Installation and deployment have not been verified here/);assert.doesNotMatch(view.textContent,/production.ready|all checks passed|\b100%\b|legally approved/i);assert.deepEqual(report,before);
  }finally{dom.window.close();}
});

test('review wording is text and stale callbacks are refused even while the old view remains connected',()=>{
  const report=createSetupPlan({schemaVersion:1,markets:[],answers:{}}).report,dom=new JSDOM('<main></main>');let current=true,calls=0;
  try{
    const view=createSetupReviewSummary(dom.window.document,{report,recommendations:[{id:'synthetic',status:'review',title:'<img src=x onerror=alert(1)>',reason:'<script>unsafe()</script>',requirementIds:['REQ-PRODUCT-SETUP'],configPaths:[],guide:'setup'}],questionIds:[],documentationBase:'/docs',isCurrent:()=>current,reviewConfiguration:()=>{calls++;},reviewFacts:()=>{calls++;},reviewNotes:()=>{calls++;}});dom.window.document.querySelector('main').append(view);
    assert.equal(view.querySelector('img,script'),null);assert.equal(view.querySelector('summary').textContent,'<img src=x onerror=alert(1)>');findButton(view,'Review configuration').click();assert.equal(calls,1);current=false;for(const b of view.querySelectorAll('button'))b.click();assert.equal(calls,1);
  }finally{dom.window.close();}
});
