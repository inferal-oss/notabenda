// @requirements REQ-PRODUCT-COLLECTION-NOTICE REQ-EU-NOTICE REQ-NZ-NOTICE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {normalizeCollectionNotice,renderCollectionNotice,collectionNoticeIds} from 'notabenda';
import {compileLegalDocuments,createCollectionNotice,canonicalJson,sha256} from 'notabenda/content';
import {fixture} from './helpers.mjs';
const settings={scopeId:'contact',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'About your message',intro:'We use the information you choose to send to respond to your enquiry.'}};
const build=async()=>compileLegalDocuments(await fixture({reviewed:true}));
const notice=async()=>createCollectionNotice((await build()).artifact,settings);

test('a collection notice pins reviewed privacy, selected facts, scope, locale, wording and render policy deterministically',async()=>{
  const b=await build();const n=createCollectionNotice(b.artifact,settings);const second=createCollectionNotice(b.artifact,settings);assert.deepEqual(n,second);assert.equal(n.document.url,`/artifacts/${b.manifest.artifactId}/privacy.html`);assert.equal(n.document.sha256,b.manifest.documents.find(d=>d.kind==='privacy').sha256);assert.deepEqual(n.purposes,[b.publicConfig.purposes[0]]);assert.deepEqual(n.recipients,[]);assert.equal(n.locale,'en');assert.equal(n.renderingPolicy,'collection-v1');const {noticeId,...descriptor}=n;assert.equal(noticeId,sha256(canonicalJson(descriptor)));
  for(const changed of [{...settings,scopeId:'signup'},{...settings,wording:{...settings.wording,intro:'A different form context.'}},{...settings,reviewStatus:'draft'}])assert.notEqual(createCollectionNotice(b.artifact,changed,{mode:'preview'}).noticeId,n.noticeId);
  const config=await fixture({reviewed:true});config.site.locale='en-NZ';assert.notEqual(createCollectionNotice(compileLegalDocuments(config).artifact,settings).noticeId,n.noticeId);
});

test('purpose selection rejects unknown, empty, duplicate, over-limit and indirect-only uses without modifying the release',async()=>{
  const b=await build();const before=structuredClone(b.artifact);
  for(const ids of [[],['missing'],['enquiries','enquiries'],Array.from({length:9},(_,i)=>'purpose-'+i)])assert.throws(()=>createCollectionNotice(b.artifact,{...settings,purposeIds:ids}));assert.deepEqual(b.artifact,before);
  const c=await fixture({reviewed:true});c.purposes[0].collection.source='indirect';assert.throws(()=>createCollectionNotice(compileLegalDocuments(c).artifact,settings));
});

test('notice wording and privacy document review are separate explicit production gates',async()=>{
  const b=await build();assert.throws(()=>createCollectionNotice(b.artifact,{...settings,reviewStatus:'draft'}));const draft=createCollectionNotice(b.artifact,{...settings,reviewStatus:'draft'},{mode:'preview'});assert.equal(draft.reviewStatus,'draft');assert.throws(()=>renderCollectionNotice(draft,{idPrefix:'sample'}));assert.match(renderCollectionNotice(draft,{idPrefix:'sample',allowPreview:true}),/Draft collection notice/);
  const preview=compileLegalDocuments(await fixture(),{mode:'preview'});assert.throws(()=>createCollectionNotice(preview.artifact,settings));const n=createCollectionNotice(preview.artifact,settings,{mode:'preview'});assert.equal(n.mode,'preview');assert.equal(n.document.reviewStatus,'draft');assert.match(renderCollectionNotice(n,{idPrefix:'sample',allowPreview:true}),/Draft collection notice/);
});

test('build rejects corrupted manifest identity, public config, privacy metadata, content and HTML',async()=>{
  const b=await build();
  for(const mutate of [a=>a.manifest.artifactId='a'.repeat(64),a=>a.publicConfig.controller.name='Another operator',a=>a.publicConfig.private={internal:'excluded'},a=>a.documents.privacy.sections[0].heading='Other words',a=>a.pages[a.manifest.documents.find(d=>d.kind==='privacy').file]+='tampered',a=>a.manifest.documents.find(d=>d.kind==='privacy').version='different']){const a=structuredClone(b.artifact);mutate(a);assert.throws(()=>createCollectionNotice(a,settings));}
  const a=structuredClone(b.artifact);a.manifest.documents.find(d=>d.kind==='privacy').version='different';const {artifactId,...descriptor}=a.manifest;a.manifest.artifactId=sha256(canonicalJson(descriptor));assert.throws(()=>createCollectionNotice(a,settings));
});

test('both sources and mixed required/optional purposes retain their meaning; only selected service associations are shown',async()=>{
  const c=await fixture({reviewed:true});c.purposes[0].collection.source='both';c.purposes[1].collection.required=true;c.services[0].purposeIds=['enquiries','display-preferences'];const b=compileLegalDocuments(c);const n=createCollectionNotice(b.artifact,{...settings,purposeIds:['enquiries']});assert.deepEqual(n.recipients[0].purposeIds,['enquiries']);assert.equal(n.purposes[0].collection.source,'both');const html=renderCollectionNotice(n,{idPrefix:'mixed'});assert.match(html,/also involves information from other sources/);assert.match(html,/Information declared for this purpose/);assert.doesNotMatch(html,/Remembering display preferences/);
  const both=createCollectionNotice(b.artifact,{...settings,purposeIds:['enquiries','display-preferences']});const dom=new JSDOM(renderCollectionNotice(both,{idPrefix:'two'}));const terms=[...dom.window.document.querySelectorAll('dt')].filter(el=>el.textContent==='Providing information').map(el=>el.nextElementSibling.textContent);assert.deepEqual(terms,['Optional for this declared purpose','Required for this declared purpose']);dom.window.close();
});

test('static SSR HTML is safe, restylable, accessible and has no acceptance or request behavior',async()=>{
  const n=await notice();n.wording.title='<img src=x onerror=alert(1)>';n.wording.intro='<script>bad()</script>';n.controller.name='Fictional <operator>';n.privacy.complaints.description='A <private-looking> synthetic phrase.';const ids=collectionNoticeIds('contact-privacy');const html=renderCollectionNotice(n,{idPrefix:'contact-privacy',headingLevel:3})+renderCollectionNotice(n,{idPrefix:'another-privacy',headingLevel:4});
  const dom=new JSDOM(`<form aria-describedby="${ids.descriptionId}"><input type="email" aria-label="Email">${html}</form>`);const d=dom.window.document;assert.equal(d.querySelector('img,script,iframe,button,input[type=checkbox],input[type=hidden],style'),null);assert.equal(d.querySelectorAll('input').length,1);assert.equal(d.getElementById(ids.titleId).tagName,'H3');assert.equal(d.getElementById(ids.descriptionId).textContent,n.wording.intro);assert.equal(d.querySelector('form').getAttribute('aria-describedby'),ids.descriptionId);assert.equal(d.querySelectorAll('details>summary').length,2);assert.ok(d.querySelector('details').textContent.includes('A <private-looking> synthetic phrase.'));assert.match(d.querySelector('.nb-collection-policy a').getAttribute('href'),/^\/artifacts\/[a-f0-9]{64}\/privacy.html$/);const all=[...d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(all).size,all.length);assert.doesNotMatch(html,/onerror="|onsubmit=|onclick=|javascript:/);dom.window.close();
  for(const idPrefix of ['', '../bad','same"id'])assert.throws(()=>renderCollectionNotice(n,{idPrefix}));assert.throws(()=>renderCollectionNotice(n,{idPrefix:'ok',headingLevel:1}));
});

test('structural validation rejects unexpected/private keys, unsafe URLs, malformed relationships and excessive data',async()=>{
  const n=await notice();
  const mutate=[n=>n.private='no',n=>n.wording.extra='no',n=>n.controller.secret='no',n=>n.document.url='/privacy',n=>n.privacy.rightsUrl='javascript:bad',n=>n.controller.email='mail@example.test?subject=bad',n=>n.purposes[0].collection.source='indirect',n=>n.purposes[0].collection.required='true',n=>n.purposes[0].collection.hidden='no',n=>n.purposes.push(n.purposes[0]),n=>n.recipients=[{id:'vendor',name:'Vendor',provider:'Fictional',location:'Example',purposeIds:['missing']}],n=>n.document.effectiveDate='2026-02-31',n=>n.renderingPolicy='future',n=>n.wording.intro='x'.repeat(2001),n=>n.privacy.rights=Array(41).fill('right')];
  for(const change of mutate){const value=structuredClone(n);change(value);assert.throws(()=>normalizeCollectionNotice(value));}assert.throws(()=>normalizeCollectionNotice({toJSON(){throw new Error('private exception');}}),error=>!error.message.includes('private exception'));const copy=normalizeCollectionNotice(n);copy.purposes[0].description='changed';assert.notEqual(copy.purposes[0].description,n.purposes[0].description);
});


test('actual enum strings are required and distinct prefixes cannot collide through generated suffixes',async()=>{
 const n=await notice();for(const change of [n=>n.mode=['preview'],n=>n.reviewStatus=['draft'],n=>n.document.reviewStatus=['draft'],n=>n.purposes[0].collection.source=['both']]){const value=structuredClone(n);change(value);assert.throws(()=>normalizeCollectionNotice(value,{allowPreview:true}));}
 const dom=new JSDOM(renderCollectionNotice(n,{idPrefix:'contact'})+renderCollectionNotice(n,{idPrefix:'contact-title'}));const ids=[...dom.window.document.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size);dom.window.close();
});
