// @requirements REQ-PRODUCT-STORAGE-AUTHORING REQ-PRODUCT-CONFIG REQ-PRODUCT-STORAGE-CLEANUP REQ-PRODUCT-SCOPE-GUARDS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createStorageDraftPlan,normalizeDraftStorage,normalizeStorageDraftInput} from '@notabenda/core/setup/storage';
import {toPublicConfig} from '@notabenda/core';
import {technologyCollectionScope} from '@notabenda/core/technology';
import {technologyExampleConfig,technologySettings} from '../../../examples/technology/config.mjs';
import {exceptionFixture} from './storage-exception-helpers.mjs';
import {consentProfiles} from './consent-profiles.mjs';
import {fixture} from './helpers.mjs';
import {reviewSetupStorage} from '../dist/setup-storage-cli.js';
const item=(serviceId='metrics',id='reading-marker')=>({id,name:'reading-count',type:'localStorage',serviceId,duration:'Until the browser session ends or the feature is withdrawn.',classification:'optional'});
const change=(config,changes,serviceScopes=[])=>({baseline:config,changes,serviceScopes});
async function inventory(){const c=await fixture({reviewed:true});c.services=[{id:'metrics',name:'Reading metrics',provider:'Local demonstration',purposeIds:[c.purposes[0].id],location:'This browser'},{id:'other',name:'Another tool',provider:'Local demonstration',purposeIds:[c.purposes[0].id],location:'This browser'}];c.storage=[];c.consent={purposes:[{id:c.purposes[0].id,scope:'purpose-1'}],services:[{id:'metrics',scope:'metrics-1'},{id:'other',scope:'other-1'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:15};return c;}
const versions=(...ids)=>ids.map(id=>({id,scope:id+'-2'}));

test('storage facts and affected material versions update atomically without changing unrelated public facts',async()=>{
 const c=await inventory(),before=structuredClone(c),plan=await createStorageDraftPlan(c,change(c,[{action:'add',item:item()}],versions('metrics'))),baseline=toPublicConfig(c,{mode:'preview'});
 assert.deepEqual(c,before);assert.deepEqual(plan.config.storage,[item()]);assert.deepEqual(plan.scopeChanges,[{serviceId:'metrics',previous:'metrics-1',next:'metrics-2'}]);assert.deepEqual(plan.config.consent.purposes,c.consent.purposes);assert.equal(plan.config.consent.services[1].scope,'other-1');for(const key of ['site','controller','purposes','services','privacy','terms','scopeGuards'])assert.deepEqual(plan.config[key],baseline[key]);for(const d of Object.values(plan.config.documents))assert.equal(d.review.status,'draft');
 plan.config.storage[0].name='Detached';assert.equal(before.storage.length,0);
});

test('old and new enrolled owners each need exactly one new version, including shared-purpose services',async()=>{
 const c=await inventory();c.storage=[item()];const moved={...item(),serviceId:'other'},mutations=[{action:'update',storageId:item().id,item:moved}];
 for(const scopes of [[],versions('metrics'),versions('other'),[...versions('metrics','other'),{id:'unrelated',scope:'new'}],[{id:'metrics',scope:'metrics-1'},...versions('other')]])await assert.rejects(async()=>await createStorageDraftPlan(c,change(c,mutations,scopes)));
 const p=await createStorageDraftPlan(c,change(c,mutations,versions('metrics','other')));assert.deepEqual(p.affectedServiceIds,['metrics','other']);assert.deepEqual(p.changes[0].previous,item());assert.deepEqual(p.changes[0].item,moved);assert.match(p.reviewItems.join(' '),/historical markers/);
});

test('ordinary classification changes never remove consent enrollment or supply an exemption',async()=>{
 const c=await inventory();c.storage=[item()];const necessary={...item(),classification:'necessary',necessityReason:'Explicit public assertion supplied by the operator.'},p=await createStorageDraftPlan(c,change(c,[{action:'update',storageId:item().id,item:necessary}],versions('metrics')));
 assert.deepEqual(p.config.consent.services.map(s=>s.id),['metrics','other']);assert.match(p.reviewItems.join(' '),/not proof of an exemption/);assert.throws(()=>normalizeDraftStorage({...necessary,necessityReason:''}));
 const noControls=await inventory();delete noControls.consent;const declared=await createStorageDraftPlan(noControls,change(noControls,[{action:'add',item:item()}]));assert.equal(declared.config.consent,undefined);assert.match(declared.reviewItems.join(' '),/without consent controls/);
});

test('exception classification and both old/new protected service memberships cannot escape profile review',async()=>{
 const c=await exceptionFixture(),owned=c.storage.find(i=>i.classification==='exception');
 for(const mutations of [[{action:'remove',storageId:owned.id}],[{action:'update',storageId:owned.id,item:{...owned,classification:'necessary',exceptionId:undefined,necessityReason:'Claim'}}],[{action:'add',item:item(owned.serviceId,'new-marker')}]])await assert.rejects(async()=>await createStorageDraftPlan(c,change(c,mutations)));
 const ordinary=c.storage.find(i=>i.classification==='optional');assert.ok(ordinary);await assert.rejects(async()=>await createStorageDraftPlan(c,change(c,[{action:'update',storageId:ordinary.id,item:{...ordinary,serviceId:owned.serviceId}}])));
});

test('technology-owned storage requires an actual revised declaration and matching derived scope',async()=>{
 const c=technologyExampleConfig(await fixture()),previous=c.storage.find(i=>i.id==='profile'),updated={...previous,duration:'Until withdrawal or the end of this session.'},mutations=[{action:'update',storageId:'profile',item:updated}],binding=structuredClone(technologySettings);binding.revision='reading-profile-2';
 await assert.rejects(async()=>await createStorageDraftPlan(c,change(c,mutations,[{id:'reading-profile',scope:'generic-2'}])),/technology/);
 await assert.rejects(async()=>await createStorageDraftPlan(c,change(c,mutations,[{id:'reading-profile',scope:technologyCollectionScope(binding)}])),/technology/);
 const p=await createStorageDraftPlan(c,change(c,mutations,[{id:'reading-profile',scope:technologyCollectionScope(binding),technology:binding}]));assert.deepEqual(p.technologyBindings[0].settings,binding);assert.match(p.reviewItems.join(' '),/rebuild matching technology descriptors/);
});

test('stale, malformed, duplicate, reused-current-version and no-op batches cannot mutate the caller',async()=>{
 const c=await inventory(),before=structuredClone(c),proposal=change(c,[{action:'add',item:item()}],versions('metrics'));
 const changed=structuredClone(c);changed.controller.name='Another controller';await assert.rejects(async()=>await createStorageDraftPlan(changed,proposal),/draft changed/);
 for(const value of [{...proposal,extra:true},{...proposal,changes:[]},{...proposal,changes:[...proposal.changes,...proposal.changes]},{...proposal,serviceScopes:[...versions('metrics'),...versions('metrics')]},{...proposal,serviceScopes:[{id:'metrics',scope:'{{new}}'}]}])await assert.rejects(async()=>await createStorageDraftPlan(c,value));
 let invoked=0;const bad=item();Object.defineProperty(bad,'name',{enumerable:true,get(){invoked++;throw Error('PRIVATE');}});await assert.rejects(async()=>await createStorageDraftPlan(c,change(c,[{action:'add',item:bad}],versions('metrics'))));assert.equal(invoked,0);
 const existing=structuredClone(c);existing.storage=[item()];await assert.rejects(async()=>await createStorageDraftPlan(existing,change(existing,[{action:'update',storageId:item().id,item:item()}],versions('metrics'))),/No storage facts changed/);assert.deepEqual(c,before);
 for(const bad of [{...item(),extra:true},{...item(),classification:'exception',exceptionId:'assessed'},{...item(),id:'Invalid ID'},{...item(),duration:''},{...item(),name:'x'.repeat(301)}])assert.throws(()=>normalizeDraftStorage(bad));
});

for(const [profile,factory] of consentProfiles)test(`${profile}: changed storage cannot reuse an old grant and retains refusal restrictions`,async()=>{
 const c=await inventory(),values=new Map(),env={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse('2026-10-20T12:00:00.000Z'),schedule:()=>()=>{}};
 const granted=factory(c,env);granted.acceptAll();assert.equal(granted.isAllowed(c.purposes[0].id),true);granted.destroy();
 const p=await createStorageDraftPlan(c,change(c,[{action:'add',item:item()}],versions('metrics'))),reopened=factory(p.config,env);try{assert.equal(reopened.isAllowed(c.purposes[0].id),false);reopened.rejectAll();}finally{reopened.destroy();}
 const next=(await createStorageDraftPlan(p.config,change(p.config,[{action:'remove',storageId:item().id}],[{id:'metrics',scope:'metrics-3'}]))).config,refused=factory(next,env);try{assert.equal(refused.isAllowed(c.purposes[0].id),false);assert.notEqual(refused.getSnapshot().purposes[c.purposes[0].id],'granted');}finally{refused.destroy();}
});

test('removal retains old markers for review; ambiguous names and unsupported cleanup types stay explicit',async()=>{
 const c=await inventory();c.storage=[item(),{...item('other','second'),type:'indexedDB'}];const p=await createStorageDraftPlan(c,change(c,[{action:'remove',storageId:item().id}],versions('metrics')));assert.deepEqual(p.changes[0].previous,item());assert.equal(p.changes[0].item,undefined);assert.match(p.reviewItems.join(' '),/does not remove stored data/);assert.match(p.reviewItems.join(' '),/does not handle this type/);
 const duplicate=await createStorageDraftPlan(await inventory(),change(await inventory(),[{action:'add',item:item()},{action:'add',item:item('other','second')}],versions('metrics','other')));assert.match(duplicate.reviewItems.join(' '),/Cleanup ambiguity/);
});

test('CLI batch authoring preserves originals and writes a separate private review of previous declarations',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-storage-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;try{const c=await inventory(),original=JSON.stringify(c),proposal={schemaVersion:1,changes:[{action:'add',item:item()}],serviceScopes:versions('metrics')};await writeFile(join(cwd,'config.json'),original);await writeFile(join(cwd,'storage.json'),JSON.stringify(proposal));await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));
 const run=args=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'}),result=run(['wizard','--packs','cookie-choices','--config','config.json','--answers','answers.json','--storage','storage.json','--out-dir','draft']);assert.equal(result.status,0,result.stderr);const output=JSON.parse(await readFile(join(cwd,'draft/notabenda.config.json'),'utf8')),review=JSON.parse(await readFile(join(cwd,'draft/storage-change-review.private.json'),'utf8'));assert.deepEqual(output.storage,[item()]);assert.equal(output.consent.services[0].scope,'metrics-2');assert.equal(review.steps[0].changes[0].storageId,item().id);assert.equal(review.steps[0].scopeChanges[0].previous,'metrics-1');assert.match(await readFile(join(cwd,'draft/.gitignore'),'utf8'),/storage-change-review.private.json/);assert.equal(await readFile(join(cwd,'config.json'),'utf8'),original);
 assert.notEqual(run(['check','--storage','storage.json']).status,0);await symlink(join(cwd,'storage.json'),join(cwd,'alias.json'));assert.notEqual(run(['wizard','--answers','answers.json','--storage','alias.json','--out-dir','invalid']).status,0);await assert.rejects(readFile(join(cwd,'invalid/notabenda.config.json')));
 let answers=['yes',join(cwd,'storage.json'),'yes'],i=0;const result2=await reviewSetupStorage(c,async()=>{if(++i===3)c.controller.name='Changed after review';return answers.shift();});assert.equal(result2,undefined);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

for(const [profile,factory] of consentProfiles)test(`${profile}: a storage edit preserves explicit regional solicitation policy and refusal memory`,async()=>{
 const c=await inventory();c.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'same-processing-1'};const values=new Map(),env={storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},now:()=>Date.parse('2026-10-20T12:00:00.000Z'),schedule:()=>()=>{}};
 const before=factory(c,env);before.rejectAll();assert.equal(before.getSnapshot().shouldPrompt,false);before.destroy();const p=await createStorageDraftPlan(c,change(c,[{action:'add',item:item()}],versions('metrics')));assert.deepEqual(p.config.consent.promptPolicy,c.consent.promptPolicy);const after=factory(p.config,env);try{assert.equal(after.getSnapshot().shouldPrompt,false);assert.equal(after.isAllowed(c.purposes[0].id),false);}finally{after.destroy();}
});

test('exotic array prototypes are rejected before inherited toJSON or iteration executes',async()=>{
 let invoked=0;const proto=Object.create(Array.prototype);Object.defineProperty(proto,'toJSON',{value(){invoked++;return [];}});Object.defineProperty(proto,Symbol.iterator,{value(){invoked++;return [][Symbol.iterator]();}});
 for(const field of ['changes','serviceScopes']){const c=await inventory(),proposal=change(c,[{action:'add',item:item()}],versions('metrics'));Object.setPrototypeOf(proposal[field],proto);await assert.rejects(createStorageDraftPlan(c,proposal));}
 const c=await inventory();Object.setPrototypeOf(c.storage,proto);await assert.rejects(createStorageDraftPlan(c,change(c,[{action:'add',item:item()}],versions('metrics'))));assert.equal(invoked,0);
});

test('browser scope checks match the release compiler and detach declarations before hashing',async()=>{
 const {technologyCollectionScope:browserScope}=await import('../dist/technology-collection-policy.js');const binding=structuredClone(technologySettings);binding.revision='révision-二';binding.functions=['profiling','identification'];assert.equal(await browserScope(binding),technologyCollectionScope(binding));
 const c=technologyExampleConfig(await fixture()),updated={...c.storage.find(i=>i.id==='profile'),duration:'New duration'},proposal=change(c,[{action:'update',storageId:'profile',item:updated}],[{id:'reading-profile',scope:technologyCollectionScope(binding),technology:binding}]);
 const expectedName=updated.name;let release;const gate=new Promise(resolve=>{release=resolve;}),original=crypto.subtle.digest;crypto.subtle.digest=async function(...args){await gate;return original.apply(this,args);};
 try{const pending=createStorageDraftPlan(c,proposal);binding.revision='Changed caller input';proposal.changes[0].item.name='Changed marker';release();const result=await pending;assert.equal(result.config.storage.find(i=>i.id==='profile').name,expectedName);assert.equal(result.technologyBindings[0].settings.revision,'révision-二');}finally{crypto.subtle.digest=original;}
});

test('private cumulative reviews are bounded and configs stay resumable within the setup import limit',async()=>{
 const {serializeStorageDraftReview,storageDraftReviewStep}=await import('@notabenda/core/setup/storage'),c=await inventory(),p=await createStorageDraftPlan(c,change(c,[{action:'add',item:item()}],versions('metrics'))),step=storageDraftReviewStep(p);
 assert.equal(JSON.parse(serializeStorageDraftReview([step])).steps[0].siteId,c.site.id);assert.throws(()=>serializeStorageDraftReview(Array(129).fill(step)),/128/);assert.throws(()=>serializeStorageDraftReview([{...step,reviewItems:Array(40).fill('x'.repeat(14000))}]),/512 KiB/);
 const large=await inventory();large.storage=Array.from({length:250},(_,i)=>({...item('metrics','marker-'+i),duration:'d'.repeat(2000)}));await assert.rejects(createStorageDraftPlan(large,change(large,[{action:'add',item:item()}],versions('metrics'))),/512 KiB/);
});
