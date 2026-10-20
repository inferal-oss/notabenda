// @requirements REQ-PRODUCT-PACK-CONNECTION REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {packLibrary,selectPacks,planPacks,formatPackBrief} from 'notabenda/packs';
import {mountSetup} from 'notabenda/setup/ui';
import {fixture} from './helpers.mjs';

function browser(selection,options={}){
 const dom=new JSDOM('<main></main>',{url:'https://adopter.example.test/setup'}),d=dom.window.document,blobs=new Map(),revoked=[];
 let effects=0;
 dom.window.fetch=()=>{effects++;throw Error('No network');};dom.window.Storage.prototype.setItem=()=>{effects++;throw Error('No persistence');};
 dom.window.URL.createObjectURL=blob=>{const url='blob:local-'+blobs.size;blobs.set(url,blob);return url;};dom.window.URL.revokeObjectURL=url=>revoked.push(url);
 const ui=mountSetup(d.querySelector('main'),{cartridges:selection,...options});
 const prepare=()=>d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 return {dom,d,ui,blobs,revoked,prepare,effects:()=>effects};
}

test('each installed pack has its actual connection tasks, checks and separate foundations',async()=>{
 const config=await fixture();
 for(const pack of packLibrary()){
  const selection=selectPacks([pack.id]),scope=planPacks(selection),b=browser(selection,{config});
  try{
   b.prepare();const plan=b.ui.getPlan(),before=structuredClone(plan),guide=b.d.querySelector('.nb-setup-connection');assert.ok(guide,pack.id);
   assert.deepEqual([...guide.querySelectorAll('[data-pack]')].map(el=>el.dataset.pack),[pack.id]);
   const card=guide.querySelector('[data-pack]');assert.match(card.textContent,/Connect/);
   for(const target of scope.reference.targets.filter(t=>pack.targetIds.includes(t.id))){for(const text of [...target.hostWork,...target.verify])assert.ok(card.textContent.includes(text),pack.id+' / '+text);}
   const expected=scope.reference.targets.filter(t=>t.selection==='prerequisite').map(t=>t.id);
   assert.deepEqual([...guide.querySelectorAll('[data-foundation]')].map(el=>el.dataset.foundation),expected);
   for(const target of scope.reference.targets.filter(t=>t.selection==='prerequisite')){const foundation=guide.querySelector(`[data-foundation="${target.id}"]`);for(const text of [...target.hostWork,...target.verify])assert.ok(foundation.textContent.includes(text));}
   const proposal=scope.policyProposals[0],policy=card.querySelector('.nb-setup-connection-policy');
   if(proposal){assert.ok(policy.textContent.includes(proposal.path));assert.ok(policy.textContent.includes(proposal.profile));for(const field of proposal.requiredFields)assert.ok(policy.textContent.includes(field));assert.match(policy.textContent,/Selection has not enabled/);assert.equal(plan.config.consent,config.consent);}
   else assert.equal(policy,null);
   assert.deepEqual(b.ui.getPlan(),before);assert.equal(b.effects(),0);assert.equal(guide.querySelector('input,button'),null);
  }finally{b.ui.destroy();b.dom.window.close();}
 }
});

test('combined work deduplicates foundations and preserves exact regional proposals',()=>{
 const selection=selectPacks(['terms-agreement','cookie-choices','evidence-workspace','ie-consent-duration','it-repeat-prompts']),b=browser(selection,{documentationBase:'/help/compliance'});
 try{
  b.prepare();const guide=b.d.querySelector('.nb-setup-connection');
  assert.deepEqual([...guide.querySelectorAll('[data-foundation]')].map(el=>el.dataset.foundation),['legal-pages']);
  assert.deepEqual([...guide.querySelectorAll('[data-pack]')].map(el=>el.dataset.pack),selection.selected.map(c=>c.id));
  const irish=guide.querySelector('[data-pack=ie-consent-duration] .nb-setup-connection-policy'),italian=guide.querySelector('[data-pack=it-repeat-prompts] .nb-setup-connection-policy');
  assert.match(irish.textContent,/consent\.grantExpiryPolicy/);assert.doesNotMatch(irish.textContent,/consent\.promptPolicy|processingRevision/);
  assert.match(italian.textContent,/consent\.promptPolicy/);assert.match(italian.textContent,/processingRevision/);assert.doesNotMatch(italian.textContent,/consent\.grantExpiryPolicy/);
  for(const link of guide.querySelectorAll('a'))assert.ok(link.getAttribute('href').startsWith('/help/compliance/'));
  assert.equal(b.ui.getPlan().config.consent,undefined);
  b.ui.setCartridges(selectPacks(['privacy-pages']));assert.equal(b.d.querySelector('.nb-setup-connection'),null);b.prepare();assert.equal(b.d.querySelector('[data-foundation]'),null);
 }finally{b.ui.destroy();b.dom.window.close();}
});

test('prepared downloads use a connect brief with actual filenames, and edits invalidate the guide and URLs',async()=>{
 const selection=selectPacks(['cookie-choices']),b=browser(selection);
 try{
  const note=b.d.querySelector('[data-question="optional-storage"] textarea');note.value='PRIVATE justification never belongs in the brief';
  b.prepare();const report=b.ui.getPlan().report;assert.equal(report.answers.answers['optional-storage'].justification,note.value);
  const revisit=[...b.d.querySelectorAll('button')].find(el=>el.textContent==='Review selected facts');revisit.click();assert.equal(b.d.querySelector('[data-question="optional-storage"]').closest('fieldset').hidden,false);assert.equal(b.d.activeElement.tagName,'LEGEND');assert.deepEqual(b.ui.getPlan().report,report);
  const link=b.d.querySelector('a[download="notabenda-setup-brief.txt"]'),brief=await b.blobs.get(link.href).text();
  assert.equal(brief,formatPackBrief(selection,'connect'));assert.match(brief,/notabenda\.config\.json and setup\.private\.json/);assert.match(brief,/check --config .* --preview --json/);assert.doesNotMatch(brief,/PRIVATE justification/);
  assert.ok(brief.includes(planPacks(selection).reference.targets.find(t=>t.id==='cookie-consent').verify[0]));
  note.dispatchEvent(new b.dom.window.Event('input',{bubbles:true}));assert.equal(b.ui.getPlan(),null);assert.equal(b.d.querySelector('.nb-setup-connection'),null);assert.ok(b.revoked.includes(link.href));
 }finally{b.ui.destroy();b.dom.window.close();}
});

test('prepare and connect briefs preserve their distinct stages and reject unknown stages',()=>{
 const selected=selectPacks(['terms-agreement']),prepare=formatPackBrief(selected),connect=formatPackBrief(selected,'connect');
 assert.match(prepare,/wizard --packs terms-agreement --answers \.\/answers\.json/);assert.doesNotMatch(prepare,/This brief accompanies/);
 assert.match(connect,/wizard --answers \.\/setup\.private\.json --config \.\/notabenda\.config\.json/);assert.doesNotMatch(connect,/--answers \.\/answers\.json/);
 assert.match(connect,/Check and reuse the foundation: Privacy, cookie and terms pages/);assert.match(connect,/Connect: Explicit agreement to terms/);
 assert.throws(()=>formatPackBrief(selected,'complete'),/prepare or connect/);
});

test('the scoped wizard saves the same connection brief, resumes pins and never overwrites prior output',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-connection-')),cli=fileURLToPath(new URL('../dist/cli.js',import.meta.url)),run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:directory,encoding:'utf8'});
 try{
  const selection=selectPacks(['terms-agreement']),answers=planPacks(selection).reference.targetAnswersTemplate;
  answers.answers['terms-agreement']={choice:'yes',justification:'PRIVATE actual workflow note'};
  await writeFile(join(directory,'answers.json'),JSON.stringify(answers));
  const first=run('wizard','--packs','terms-agreement','--answers','answers.json');assert.equal(first.status,0,first.stderr);
  const briefPath=join(directory,'notabenda-setup/notabenda-setup-brief.txt'),brief=await readFile(briefPath,'utf8');assert.equal(brief,formatPackBrief(selection,'connect'));assert.doesNotMatch(brief,/PRIVATE actual workflow note/);assert.equal((await stat(briefPath)).mode&0o777,0o600);
  const saved=JSON.parse(await readFile(join(directory,'notabenda-setup/setup.private.json'),'utf8'));assert.equal(saved.answers.answers['terms-agreement'].justification,'PRIVATE actual workflow note');
  const resume=run('wizard','--answers','notabenda-setup/setup.private.json','--config','notabenda-setup/notabenda.config.json','--out-dir','resumed');assert.equal(resume.status,0,resume.stderr);assert.equal(await readFile(join(directory,'resumed/notabenda-setup-brief.txt'),'utf8'),brief);
  const before=await readdir(join(directory,'notabenda-setup'));assert.notEqual(run('wizard','--packs','terms-agreement','--answers','answers.json').status,0);assert.deepEqual(await readdir(join(directory,'notabenda-setup')),before);assert.equal(await readFile(briefPath,'utf8'),brief);
 }finally{await rm(directory,{recursive:true,force:true});}
});
