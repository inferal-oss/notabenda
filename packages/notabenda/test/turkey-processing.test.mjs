// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createSetupPlan} from '@notabenda/core/setup';
import {mountSetup} from '@notabenda/core/setup/ui';
import {describeIntegration} from '@notabenda/core/integration';
import {toPublicConfig} from '@notabenda/core';
import {fixture} from './helpers.mjs';
const answer=()=>({schemaVersion:1,markets:['TR'],answers:{'optional-storage':{choice:'no',justification:'PRIVATE-TR-ASSESSMENT'}}});
test('Türkiye review has exact current-selected source metadata, unresolved law limits and a partial requirement',async()=>{
 const reference=describeIntegration(['collection-notice','form-permissions']).cookieJurisdictionReviews,r=reference.items.find(i=>i.marketId==='TR'),catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url)));
 assert.equal(reference.advisoryOnly,true);assert.equal(reference.activatesPolicy,false);assert.equal(r.guidelineRevision,'2025-07');assert.equal(r.sourceStatus.currentConsolidatedLawVerified,false);assert.equal(r.sourceStatus.originalGazetteDecisionRetrieved,false);assert.equal(r.sourceStatus.classifiesProcessingCondition,false);
 for(const id of r.sourceIds){const source=reference.sources.find(s=>s.id===id),expected=catalog.sources.find(s=>s.id===id);assert.ok(source);assert.deepEqual(source,Object.fromEntries(Object.keys(source).map(k=>[k,expected[k]])));assert.equal(source.access,'read');}
 const requirement=catalog.requirements.find(r=>r.id==='REQ-TR-BASIS');assert.equal(requirement.implementationStatus,'partial');assert.equal(requirement.legalReviewStatus,'unreviewed');assert.equal(requirement.effectiveFrom,null);assert.ok(requirement.implementationRefs.includes('packages/notabenda/src/collection-flow-build.ts'));assert.match(catalog.sources.find(s=>s.id==='SRC-TR-COOKIE-GUIDE-2025').contentSha256,/^[a-f0-9]{64}$/);
 const copy=describeIntegration(['collection-notice']);copy.cookieJurisdictionReviews.items.find(i=>i.marketId==='TR').checks.length=0;assert.equal(describeIntegration(['collection-notice']).cookieJurisdictionReviews.items.find(i=>i.marketId==='TR').checks.length,4);
});
test('selected/imported Türkiye supplies shared advice without rewriting purpose bases, enrollment, private answers or history',async()=>{
 for(const imported of [false,true]){const config=await fixture(),a=answer();config.jurisdictions=imported?['TR']:[];if(imported)a.markets=[];const before=structuredClone(config),answers=structuredClone(a),plan=createSetupPlan(a,{config,preserveConfig:true});assert.deepEqual(plan.config,toPublicConfig(before));assert.deepEqual(config,before);assert.deepEqual(a,answers);assert.ok(plan.report.recommendations.some(r=>r.id==='cookie-review-TR'));assert.equal(plan.report.recommendations.find(r=>r.id==='optional-storage').status,'declared-no');assert.doesNotMatch(JSON.stringify(plan.config),/PRIVATE-TR/);assert.equal(plan.config.consent,before.consent);assert.equal(plan.report.productionReady,false);}
 const dom=new JSDOM('<main></main>'),root=dom.window.document.querySelector('main');dom.window.URL.createObjectURL=()=> 'blob:turkey';dom.window.URL.revokeObjectURL=()=>{};const ui=mountSetup(root);try{const label=[...root.querySelectorAll('.nb-setup-markets label')].find(l=>l.textContent==='Türkiye');assert.ok(label);label.querySelector('input').click();root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));assert.ok(ui.getPlan().report.recommendations.some(r=>r.id==='cookie-review-TR'));assert.equal(ui.getPlan().config.consent,undefined);}finally{ui.destroy();dom.window.close();}
});
