// @requirements REQ-PRODUCT-SERVICE-PROFILES REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {scanProjectServices} from '@notabenda/core/catalog/project';
import {readCatalogProductProfile} from '@notabenda/core/catalog/profile';
import {createCatalogSelectionPlan,normalizeCatalogServiceSelection} from '@notabenda/core/catalog/selection';
import {prepareCatalogSelectionReview,confirmCatalogSelectionReview} from '@notabenda/core/catalog/review';
import {attachCatalogReview} from '@notabenda/core/catalog/release';
import {compileLegalDocuments} from '@notabenda/core/content';
import {fixture} from './helpers.mjs';
const products=['clerk-identity','posthog-analytics','sentry-monitoring','vercel-platform'];
test('project candidates resolve to current source-backed guidance without selecting or exporting site facts',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-profile-coverage-'));
 try{
  await writeFile(join(directory,'package.json'),JSON.stringify({dependencies:{'@clerk/nextjs':'1','posthog-js':'1','@sentry/browser':'1','vercel':'1'},scripts:{install:'DO_NOT_EXECUTE_PROFILE_DISCOVERY'}}));
  const report=await scanProjectServices(directory,serviceCatalogSeed);assert.deepEqual(report.findings.map(f=>f.productId),products);assert.ok(report.findings.every(f=>f.reviewRequired));
  assert.doesNotMatch(JSON.stringify(report),/DO_NOT_EXECUTE|session claims|data processing addendum|profile-clerk/);
  for(const finding of report.findings){const view=readCatalogProductProfile(serviceCatalogSeed,finding.productId);assert.equal(view.productRevision,finding.productId==='sentry-monitoring'?'2026-10-22.2':'2026-10-20.1');assert.ok(view.profile.facts.length>=3);for(const fact of view.profile.facts)for(const source of fact.sourceIds){const ref=view.sources.find(s=>s.id===source);assert.equal(ref.access,'read');assert.equal(ref.checkedOn,'2026-10-20');}assert.ok(view.profile.links.some(l=>l.kind==='privacy'));assert.ok(view.profile.links.some(l=>l.kind==='dpa'));}
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('new documentation requires explicit renewal while old pins and exact legal pages remain unchanged',async()=>{
 for(const id of products){
  const previous=structuredClone(serviceCatalogSeed),product=previous.products.find(p=>p.id===id);delete product.profile;product.revision='prior-product';previous.revision='prior-catalog';
  const initial=createCatalogSelectionPlan(await fixture(),previous,{productId:id,serviceId:'operator-service',purposeIds:['enquiries'],provider:'Operator supplied entity',location:'Operator supplied location',justification:'Private earlier reason',confirmed:true});
  const pin=structuredClone(initial.selection),config=structuredClone(initial.config);assert.deepEqual(normalizeCatalogServiceSelection(pin),pin);
  const review=prepareCatalogSelectionReview(initial.config,pin,serviceCatalogSeed);assert.ok(review.changes.includes('reference'));assert.deepEqual(initial.selection,pin);assert.deepEqual(initial.config,config);assert.throws(()=>confirmCatalogSelectionReview(config,review,{confirmed:false,justification:'Not confirmed'}));
  const renewed=confirmCatalogSelectionReview(config,review,{confirmed:true,justification:'Reviewed product options for actual deployment'});assert.equal(renewed.selection.reference.products[0].profile.schemaVersion,1);assert.equal(pin.reference.products[0].profile,undefined);assert.equal(renewed.selection.service.privacyUrl,undefined);
  const base=compileLegalDocuments(config,{mode:'preview'}),oldRelease=attachCatalogReview(base,[pin]),nextRelease=attachCatalogReview(base,[renewed.selection]);assert.notEqual(oldRelease.manifest.artifactId,nextRelease.manifest.artifactId);assert.deepEqual(oldRelease.artifact.pages,nextRelease.artifact.pages);assert.doesNotMatch(Object.values(nextRelease.files).join('\n'),/Private earlier reason|Review the installed SDK|A public DPA page/);
 }
});
test('coverage additions retain unaffected profiled product revisions and stay readable through the installed CLI',()=>{
 for(const id of ['cloudflare-workers','supabase-platform','resend-email'])assert.equal(serviceCatalogSeed.products.find(p=>p.id===id).revision,'2026-10-19.3');assert.equal(serviceCatalogSeed.products.find(p=>p.id==='stripe-payments').revision,'2026-10-22.1');
 for(const id of products){const result=spawnSync(process.execPath,[new URL('../dist/cli.js',import.meta.url).pathname,'catalog','show',id,'--json'],{encoding:'utf8',timeout:10000});assert.equal(result.status,0,result.stderr);const view=JSON.parse(result.stdout);assert.equal(view.product.id,id);assert.equal(view.product.review,'unreviewed');assert.ok(view.product.profile.reviewPrompts.length>=3);}
});
