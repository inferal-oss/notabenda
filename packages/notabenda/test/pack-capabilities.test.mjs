// @requirements REQ-PRODUCT-PACK-CAPABILITIES REQ-ZA-MARKETING
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {JSDOM} from 'jsdom';
import {packLibrary,planPacks,selectPacks,formatPackBrief,createPackSetupPlan,reviewPackInputs} from '@notabenda/core/packs';
import {renderPackConsole,renderPackCapabilities} from '@notabenda/core/packs/ui';
import {describeIntegration,selectIntegration} from '@notabenda/core/integration';
import {fixture} from './helpers.mjs';
import {createSetupPlan} from '@notabenda/core/setup';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;

test('capability records link every installed job to existing requirements without conflating review and behavior',async()=>{
 const library=packLibrary(),catalog=JSON.parse(await readFile(new URL('../../../regulatory/catalog.json',import.meta.url),'utf8')),known=new Set(catalog.requirements.map(r=>r.id));
 assert.equal(library.length,21);
 for(const pack of library){assert.ok(pack.capabilities.length);assert.equal(new Set(pack.capabilities.map(c=>c.id)).size,pack.capabilities.length);for(const item of pack.capabilities){assert.ok(['feature','tool','review'].includes(item.kind));assert.ok(item.title&&item.summary&&item.boundary);assert.match(item.guide,/^[a-z0-9-]+$/);assert.ok(item.requirementIds.length);for(const req of item.requirementIds)assert.ok(known.has(req),req);}}
 const sg=library.find(p=>p.id==='cookie-choices').capabilities.find(c=>c.title.startsWith('Singapore'));assert.equal(sg.kind,'review');assert.match(sg.boundary,/no deemed-consent runtime mode/);
 const refusal=library.find(p=>p.id==='form-permissions').capabilities.find(c=>c.title==='Explicit refusal');assert.equal(refusal.kind,'feature');assert.match(refusal.boundary,/silence records nothing/);assert.equal(library.some(p=>p.id==='refusal'||p.id==='singapore'),false);
 library[0].capabilities[0].title='changed';assert.notEqual(packLibrary()[0].capabilities[0].title,'changed');
});
test('specialized request selection preserves the builder, host work and unresolved facts without changing config',async()=>{
 const selection=selectPacks(['za-marketing-requests']),plan=planPacks(selection);assert.deepEqual(plan.reference.requestedTargetIds,['south-africa-marketing-request']);assert.deepEqual(plan.supportingWork.map(t=>t.id),['legal-pages','form-permissions']);assert.deepEqual(plan.policyProposals,[]);
 assert.ok(plan.reference.relevantQuestionIds.includes('direct-collection'));assert.ok(plan.reference.relevantQuestionIds.includes('receipts'));for(const answer of Object.values(plan.reference.targetAnswersTemplate.answers))assert.equal(answer.choice,'unknown');
 const config=await fixture();config.scopeGuards={version:1,revision:'existing-reviewed',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};const before=structuredClone(config),draft=createPackSetupPlan(selection,plan.reference.targetAnswersTemplate,{config});assert.deepEqual(config,before);assert.deepEqual(draft.config.jurisdictions,before.jurisdictions);assert.deepEqual(draft.config,createSetupPlan(plan.reference.targetAnswersTemplate,{config}).config);assert.ok(Object.values(draft.config.scopeGuards.site).every(v=>v==='unknown'));assert.deepEqual(draft.config.consent,before.consent);
 const review=reviewPackInputs(selection,config),items=review.packs[0].items;for(const id of ['request','eligibility','recording','sending'])assert.equal(items.find(i=>i.id===id).state,'host-work');assert.equal(items.find(i=>i.id==='review').state,'needs-review');
 for(const stage of ['prepare','connect']){const brief=formatPackBrief(selection,stage,{config});for(const copy of ['createSouthAfricaMarketingOffer','za-popia-web-request','schema 4','ordinary form workbench cannot author','invitation','suppression'])assert.ok(brief.includes(copy),copy);}
 const ref=describeIntegration(['south-africa-marketing-request']);assert.match(ref.targets.find(t=>t.id==='south-africa-marketing-request').hostWork.join(' '),/not SiteConfig fields/);assert.deepEqual(selectIntegration({schemaVersion:1,answers:{'za-marketing-request':'yes'}}).reference.requestedTargetIds,['south-africa-marketing-request']);
});
test('reusable library disclosures are independent of selection and use host-supplied safe guide destinations',()=>{
 const d=new JSDOM(renderPackConsole({documentationBase:'/manual'})).window.document;
 for(const pack of packLibrary()){const card=d.querySelector(`[data-cartridge="${pack.id}"]`),details=card.querySelector('[data-pack-capabilities]');assert.equal(details.open,false);assert.equal(details.closest('label'),null);assert.equal(details.querySelectorAll('li').length,pack.capabilities.length);assert.equal(details.querySelectorAll('input,button,script').length,0);assert.equal(card.querySelector('input').checked,false);for(const a of details.querySelectorAll('a'))assert.ok(a.getAttribute('href').startsWith('/manual/'));}
 assert.ok(d.querySelector('[data-cartridge="cookie-choices"] .nb-pack-capability-peek').textContent.includes('Singapore'));assert.equal(d.querySelector('[data-cartridge="cookie-choices"] .nb-pack-capability-peek').closest('details'),null);
 const pack=packLibrary()[0],unsafe=structuredClone(pack);unsafe.capabilities[0].title='<img src=x onerror=alert(1)>';const html=renderPackCapabilities(unsafe);assert.equal(new JSDOM(html).window.document.querySelector('img'),null);assert.throws(()=>renderPackCapabilities(pack,{documentationBase:'javascript:alert(1)'}));assert.throws(()=>renderPackCapabilities(pack,{documentationBase:'https://example.test/docs?x=1'}));
 for(const change of [p=>p.capabilities[0].kind='feature"><img src=x onerror=alert(1)>',p=>p.capabilities[0].guide='../../other-route']){const bad=structuredClone(pack);change(bad);assert.throws(()=>renderPackCapabilities(bad),/capability kind/);}
});
test('plain CLI, JSON and both brief stages expose the same specialized job and capability boundaries',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-packs-'));try{
  const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'}),listing=run('packs');assert.equal(listing.status,0,listing.stderr);assert.match(listing.stdout,/Review guide: Singapore consent routes/);assert.match(listing.stdout,/Feature: Explicit refusal/);
  const selected=run('packs','za-marketing-requests');assert.equal(selected.status,0,selected.stderr);assert.match(selected.stdout,/createSouthAfricaMarketingOffer/);assert.match(selected.stdout,/ordinary form workbench cannot author/);
  const json=run('packs','za-marketing-requests','--json');assert.equal(json.status,0,json.stderr);assert.deepEqual(JSON.parse(json.stdout).cartridges[0].capabilities,packLibrary().find(p=>p.id==='za-marketing-requests').capabilities);
 }finally{await rm(cwd,{recursive:true,force:true});}
});
