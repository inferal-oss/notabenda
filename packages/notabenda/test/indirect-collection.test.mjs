// @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build as bundle} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {IndirectCollectionNotice as ReactNotice} from 'notabenda/react/documents';
import {normalizeIndirectCollectionNotice,renderIndirectCollectionNotice,formatIndirectCollectionNotice} from 'notabenda/collection/indirect';
import {compileLegalDocuments,createIndirectCollectionNotice,verifyIndirectCollectionNotice,createCollectionNotice,canonicalJson,sha256} from 'notabenda/content';
import {fixture} from './helpers.mjs';

async function scenario({reviewed=true,source='indirect'}={}){
  const config=await fixture({reviewed});
  config.site.url='https://studio.example.test/some/path';config.site.locale='en-NZ';
  config.purposes[0].collection.source=source;
  config.purposes[0].dataCategories=['Reply address','Referral topic','Direct form message'];
  config.purposes[0].collection.required=true;
  config.purposes[0].collection.consequences='DIRECT_ONLY_CONSEQUENCES';
  const build=compileLegalDocuments(config,{mode:reviewed?'production':'preview'});
  const settings={profile:'nz-ipp3a',scopeId:'referrals',phase:'collected',reviewStatus:reviewed?'reviewed':'draft',wording:{title:'About your referral',intro:'A partner studio referred your enquiry to us.'},collections:[{purposeId:'enquiries',dataCategories:['Reply address','Referral topic'],sourceDescription:'The studio handling your original enquiry.',authority:{kind:'not-relied-on'}}],recipientStatement:'Our enquiries team uses the referral. Our contracted inbox provider stores it on our behalf; we do not share it for advertising.',accessCorrection:{statement:'You can ask us for access to your personal information or to correct it.',url:'/privacy/requests'}};
  return {config,build,settings};
}
async function notice(){const s=await scenario();return {s,n:createIndirectCollectionNotice(s.build.artifact,s.settings)};}

test('indirect scope pins the privacy release, full purpose facts, reviewed context and collection phase',async()=>{
  const {s,n}=await notice(),original=structuredClone(s.build.artifact);
  assert.deepEqual(verifyIndirectCollectionNotice(n,s.build.artifact),n);
  const {noticeId,...descriptor}=n;assert.equal(noticeId,sha256(canonicalJson(descriptor)));
  assert.equal(n.document.sha256,s.build.manifest.documents.find(d=>d.kind==='privacy').sha256);
  assert.equal(n.collector.name,s.config.controller.name);assert.equal(n.collector.address,s.config.controller.address);
  assert.deepEqual(n.collections[0].purpose,s.config.purposes[0]);
  assert.deepEqual(n.collections[0].dataCategories,['Reply address','Referral topic']);
  for(const change of [x=>x.phase='advance',x=>x.scopeId='other',x=>x.recipientStatement='Different recipients.',x=>x.accessCorrection.url='mailto:privacy@example.test',x=>x.collections[0].sourceDescription='Another public source description.',x=>x.collections[0].dataCategories=['Reply address'],x=>x.collections[0].authority={kind:'specified',laws:[{title:'Synthetic Act (test only)',provision:'Section 12',relationship:'requires',url:'https://law.example.test/12'}]},x=>x.wording.intro='Different reviewed context.']){const changed=structuredClone(s.settings);change(changed);assert.notEqual(createIndirectCollectionNotice(s.build.artifact,changed).noticeId,n.noticeId);}
  assert.deepEqual(s.build.artifact,original);
});

test('direct-only purposes fail; mixed sources require an exact, nonempty indirect category subset',async()=>{
  const direct=await scenario({source:'direct'});assert.throws(()=>createIndirectCollectionNotice(direct.build.artifact,direct.settings));
  const mixed=await scenario({source:'both'}),n=createIndirectCollectionNotice(mixed.build.artifact,mixed.settings);
  const html=renderIndirectCollectionNotice(n,{idPrefix:'mixed'}),plain=formatIndirectCollectionNotice(n);
  for(const output of [html,plain]){assert.doesNotMatch(output,/Direct form message|DIRECT_ONLY_CONSEQUENCES|Providing information|Required for this/);assert.match(output,/Reply address, Referral topic/);}
  for(const change of [x=>x.collections=[],x=>x.collections.push(structuredClone(x.collections[0])),x=>x.collections[0].purposeId='unknown',x=>x.collections[0].dataCategories=[],x=>x.collections[0].dataCategories=['Not declared'],x=>x.collections[0].dataCategories=['Reply address','Reply address'],x=>x.collections[0].dataCategories=['reply address']]){const s=structuredClone(mixed.settings);change(s);assert.throws(()=>createIndirectCollectionNotice(mixed.build.artifact,s));}
  // The earlier direct notice continues to reject indirect-only purposes.
  const indirect=await scenario();assert.throws(()=>createCollectionNotice(indirect.build.artifact,{scopeId:'old',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'Old direct notice',intro:'Direct only.'}}));
});

test('recipient, rights and law decisions are explicit even without declared services',async()=>{
  const {s,n}=await notice();
  for(const change of [x=>delete x.recipientStatement,x=>x.recipientStatement='',x=>delete x.accessCorrection,x=>x.accessCorrection.statement='',x=>x.accessCorrection.url='/privacy#javascript:bad x',x=>delete x.collections[0].authority,x=>x.collections[0].authority={kind:'specified',laws:[]},x=>x.collections[0].authority={kind:'specified',laws:[{title:'Some Act',relationship:'requires'}]},x=>x.collections[0].authority={kind:'not-relied-on',laws:[]},x=>x.exempt=true]){const settings=structuredClone(s.settings);change(settings);assert.throws(()=>createIndirectCollectionNotice(s.build.artifact,settings));}
  assert.doesNotMatch(renderIndirectCollectionNotice(n,{idPrefix:'no-law'}),/Particular law|Not required by law|No recipients/);
  const s2=structuredClone(s.settings);s2.collections[0].authority={kind:'specified',laws:[{title:'Synthetic Act (test only)',provision:'Section 12',relationship:'authorises',url:'/law-test'}]};
  const other=createIndirectCollectionNotice(s.build.artifact,s2);
  for(const output of [renderIndirectCollectionNotice(other,{idPrefix:'law'}),formatIndirectCollectionNotice(other)]){assert.match(output,/Synthetic Act \(test only\)/);assert.match(output,/Section 12/);assert.match(output,/Authorises this collection/);}
  assert.match(renderIndirectCollectionNotice(other,{idPrefix:'law'}),/href="\/law-test"/);assert.match(formatIndirectCollectionNotice(other),/https:\/\/studio.example.test\/law-test/);
});

test('all core particulars stay visible in static HTML and plain text, with phase-specific wording and usable absolute links',async()=>{
  const {s,n}=await notice();
  for(const phase of ['advance','collected']){
    const current=createIndirectCollectionNotice(s.build.artifact,{...s.settings,phase}),html=renderIndirectCollectionNotice(current,{idPrefix:phase,headingLevel:3}),plain=formatIndirectCollectionNotice(current),dom=new JSDOM(html),d=dom.window.document;
    assert.equal(d.querySelector('section').getAttribute('aria-labelledby'),phase+'-title');assert.equal(d.getElementById(phase+'-title').tagName,'H3');
    assert.equal(d.querySelector('details,[hidden],script,iframe,form,button,input'),null);
    for(const core of [current.wording.title,current.recipientStatement,current.collector.address,current.accessCorrection.statement,current.collections[0].sourceDescription,current.collections[0].purpose.description]){assert.ok(d.body.textContent.includes(core),core);assert.ok(plain.includes(core),core);}
    for(const output of [d.body.textContent,plain]){assert.match(output,phase==='advance'?/We plan to collect/:/We have collected/);assert.doesNotMatch(output,phase==='advance'?/We have collected/:/We plan to collect/);}
    assert.match(plain,/https:\/\/studio.example.test\/privacy\/requests/);assert.ok(plain.includes('https://studio.example.test/artifacts/'+n.artifactId+'/privacy.html'));assert.doesNotMatch(plain,/some\/path\/privacy/);dom.window.close();
  }
});

test('tampered identity or bound release facts fail verification; normalization alone is structural',async()=>{
  const {s,n}=await notice();
  for(const mutate of [x=>x.noticeId='a'.repeat(64),x=>x.collector.name='Storage provider instead',x=>x.collections[0].purpose.retention='Tampered retention',x=>x.document.version='different']){const changed=structuredClone(n);mutate(changed);assert.doesNotThrow(()=>normalizeIndirectCollectionNotice(changed));assert.throws(()=>verifyIndirectCollectionNotice(changed,s.build.artifact));const {noticeId,...descriptor}=changed;changed.noticeId=sha256(canonicalJson(descriptor));if(changed.collector.name!==n.collector.name||changed.collections[0].purpose.retention!==n.collections[0].purpose.retention||changed.document.version!==n.document.version)assert.throws(()=>verifyIndirectCollectionNotice(changed,s.build.artifact));}
  for(const mutate of [a=>a.manifest.artifactId='a'.repeat(64),a=>a.publicConfig.controller.name='Other collector',a=>a.publicConfig.private={secret:'excluded'},a=>a.documents.privacy.sections[0].heading='Changed',a=>a.pages[a.manifest.documents.find(d=>d.kind==='privacy').file]+='tamper',a=>a.manifest.documents.push(a.manifest.documents.find(d=>d.kind==='privacy'))]){const artifact=structuredClone(s.build.artifact);mutate(artifact);assert.throws(()=>createIndirectCollectionNotice(artifact,s.settings));}
});

test('preview is explicit and unsafe links, private/unknown fields, executable values and unbounded inputs fail',async()=>{
  const preview=await scenario({reviewed:false});assert.throws(()=>createIndirectCollectionNotice(preview.build.artifact,preview.settings));const draft=createIndirectCollectionNotice(preview.build.artifact,preview.settings,{mode:'preview'});
  assert.throws(()=>renderIndirectCollectionNotice(draft,{idPrefix:'draft'}));assert.throws(()=>formatIndirectCollectionNotice(draft));assert.match(formatIndirectCollectionNotice(draft,{allowPreview:true}),/DRAFT/);
  const {n}=await notice();
  for(const mutate of [n=>n.private='secret',n=>n.collector.id='case-id',n=>n.phase=['advance'],n=>n.locale='fr',n=>n.reviewStatus=['reviewed'],n=>n.document.effectiveDate='2026-02-31',n=>n.document.url='/privacy',n=>n.accessCorrection.url='javascript:alert(1)',n=>n.collector.email='x@example.test?subject=private',n=>n.siteUrl='https://user:pass@example.test',n=>n.collections[0].purpose.collection.source='direct',n=>n.wording.intro='x'.repeat(2001),n=>n.collections[0].sourceDescription='x'.repeat(4001)]){const copy=structuredClone(n);mutate(copy);assert.throws(()=>normalizeIndirectCollectionNotice(copy,{allowPreview:true}));}
  let executions=0;const getter=structuredClone(n);Object.defineProperty(getter,'wording',{get(){executions++;return n.wording;},enumerable:true});assert.throws(()=>normalizeIndirectCollectionNotice(getter));assert.equal(executions,0);
  assert.throws(()=>normalizeIndirectCollectionNotice({...n,toJSON(){executions++;return n;}}));assert.equal(executions,0);
  class CustomArray extends Array{toJSON(){executions++;return [];}}
  const exotic=structuredClone(n);exotic.collections=new CustomArray(...exotic.collections);assert.throws(()=>normalizeIndirectCollectionNotice(exotic));assert.equal(executions,0);
  assert.throws(()=>formatIndirectCollectionNotice(draft,{allowPreview:'true'}));
  const cycle={};cycle.self=cycle;assert.throws(()=>normalizeIndirectCollectionNotice(cycle));
  const detached=normalizeIndirectCollectionNotice(n);detached.collections[0].purpose.description='Changed';assert.notEqual(detached.collections[0].purpose.description,n.collections[0].purpose.description);
});

test('HTTPS scheme casing accepted by site config remains usable without rewriting the pinned site URL',async()=>{
  const s=await scenario();s.config.site.url='HTTPS://studio.example.test/some/path';const b=compileLegalDocuments(s.config),n=createIndirectCollectionNotice(b.artifact,s.settings);assert.equal(n.siteUrl,s.config.site.url);assert.match(formatIndirectCollectionNotice(n),/https:\/\/studio.example.test\/privacy\/requests/);assert.deepEqual(verifyIndirectCollectionNotice(n,b.artifact),n);
});

test('renderer escapes all public text and React stays server-safe; optional renderer has no Node or framework dependency',async()=>{
  const {n}=await notice();n.wording.title='<script>bad()</script>';n.recipientStatement='<img src=x onerror=bad()>';n.accessCorrection.statement='A <correction> route.';
  const html=renderIndirectCollectionNotice(n,{idPrefix:'safe'})+renderIndirectCollectionNotice(n,{idPrefix:'safe-title'}),dom=new JSDOM(html);
  assert.equal(dom.window.document.querySelector('script,img,style,iframe'),null);assert.match(dom.window.document.body.textContent,/<img src=x onerror=bad\(\)>/);const ids=[...dom.window.document.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size);dom.window.close();
  for(const idPrefix of ['','../bad','bad"'])assert.throws(()=>renderIndirectCollectionNotice(n,{idPrefix}));assert.throws(()=>renderIndirectCollectionNotice(n,{idPrefix:'good',headingLevel:1}));
  assert.match(renderToStaticMarkup(createElement(ReactNotice,{notice:n,idPrefix:'react'})),/data-indirect-notice-id/);
  const result=await bundle({stdin:{contents:"export {renderIndirectCollectionNotice} from 'notabenda/collection/indirect'",resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',metafile:true});assert.ok(Object.keys(result.metafile.inputs).every(path=>!/(?:node:|react|astro|catalog|\/content\.|\/config\.)/u.test(path)));
});
