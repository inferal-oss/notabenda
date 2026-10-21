// @requirements REQ-PRODUCT-PRIVACY-CHOICE-LINK REQ-US-CA-ALTERNATIVE-LINK REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {renderPrivacyChoicesLink,normalizePrivacyChoicesLink} from '@notabenda/core/privacy-choices';
import {renderLegalLinks,renderLegalPage,toPublicConfig,validateSiteConfig} from '@notabenda/core';
import {LegalLinks} from '@notabenda/core/react/documents';
import {compileLegalDocuments,createConsentNotice} from '@notabenda/core/content';
import {createRightsDraftPlan} from '@notabenda/core/setup/rights';
import {fixture} from './helpers.mjs';
const link=(overrides={})=>({schemaVersion:1,revision:'choices-1',href:'/privacy-options?from=footer&lang=en',label:'Your Privacy Choices',presentation:'california-alternative-2026',reviewStatus:'reviewed',...overrides});

test('privacy navigation needs explicit safe complete settings and reviewed production presentation',async()=>{
 for(const mutate of [v=>delete v.href,v=>v.schemaVersion=2,v=>v.presentation='california',v=>v.reviewStatus='approved',v=>v.revision='',v=>v.label='Privacy settings',v=>v.extra='private',v=>v.href='//outside.test',v=>v.href='http://example.test',v=>v.href='javascript:alert(1)',v=>v.href='mailto:privacy@example.test',v=>v.href='https://user:pass@example.test',v=>v.href='/path%0aheader',v=>v.href='/path\\evil',v=>v.label='<script>',v=>v.label='x'.repeat(161),v=>v.href='https://example.test/'+ 'x'.repeat(2048)]) {const v=link();mutate(v);assert.throws(()=>normalizePrivacyChoicesLink(v));}
 let reads=0;const v=link();Object.defineProperty(v,'label',{get(){reads++;return 'Your Privacy Choices';}});assert.throws(()=>normalizePrivacyChoicesLink(v));assert.equal(reads,0);
 const symbol=link();symbol[Symbol('private')]=1;assert.throws(()=>normalizePrivacyChoicesLink(symbol));
 const draft=link({reviewStatus:'draft'});assert.throws(()=>renderPrivacyChoicesLink(draft));assert.ok(renderPrivacyChoicesLink(draft,{allowPreview:true}));assert.throws(()=>normalizePrivacyChoicesLink(link(),{allowPreview:'yes'}));
 const cfg=await fixture({reviewed:true});cfg.privacy.choicesLink=draft;
 assert.equal(validateSiteConfig(cfg,{mode:'production'}).valid,false);assert.equal(validateSiteConfig(cfg,{mode:'preview'}).valid,true);
 assert.throws(()=>renderLegalLinks(cfg));assert.throws(()=>renderLegalPage(cfg,'privacy',{mode:'production'}));
 assert.ok(renderLegalLinks(cfg,{mode:'preview'}).includes('nb-privacy-choices-link'));assert.ok(renderLegalPage(cfg,'privacy',{mode:'preview'}).includes('nb-privacy-choices-link'));
 const pub=toPublicConfig(cfg,{mode:'preview'});pub.privacy.choicesLink.label='Changed';assert.equal(cfg.privacy.choicesLink.label,'Your Privacy Choices');
 assert.equal(normalizePrivacyChoicesLink(link({href:'HTTPS://example.test/choices'})).href,'HTTPS://example.test/choices');
});

test('both prescribed titles render as one readable anchor with an inert official-shape icon',()=>{
 for(const label of ['Your Privacy Choices','Your California Privacy Choices']){
  const dom=new JSDOM('<div lang="ar" dir="rtl">'+renderPrivacyChoicesLink(link({label}))+'</div>',{url:'https://site.example.test'}),d=dom.window.document,a=d.querySelector('a');
  assert.equal(a.textContent,label);assert.equal(a.getAttribute('href'),link().href);assert.equal(d.querySelectorAll('a').length,1);
  assert.equal(a.querySelector('span').lang,'en');assert.equal(a.querySelector('span').dir,'ltr');
  const svg=a.querySelector('svg');assert.equal(svg.getAttribute('aria-hidden'),'true');assert.equal(svg.getAttribute('focusable'),'false');assert.equal(svg.getAttribute('viewBox'),'0 0 30 14');assert.equal(svg.children.length,4);
  assert.equal(d.querySelectorAll('script,style,img,iframe,form,input,button,[id],[onclick],[onload],[style],[src],[xlink\\:href]').length,0);
  for(const el of svg.querySelectorAll('*'))for(const attr of el.attributes)assert.ok(['d','fill','fill-rule','clip-rule','data-privacy-choices-ink'].includes(attr.name),attr.name);
  dom.window.close();
 }
 const text=new JSDOM(renderPrivacyChoicesLink(link({label:'Manage privacy & advertising',presentation:'text'}))).window.document;assert.equal(text.querySelector('svg'),null);assert.equal(text.querySelector('a').textContent,'Manage privacy & advertising');
});

test('inline icon preserves the retained DOJ asset paths, colors and identity transforms',async()=>{
 const root=new URL('../assets/privacy-choices/',import.meta.url),bytes=await readFile(new URL('privacyoptions.svg',root)),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 const original=new JSDOM(bytes.toString(),{contentType:'image/svg+xml'}).window.document,rendered=new JSDOM(renderPrivacyChoicesLink(link())).window.document;
 const transforms=[...original.querySelectorAll('[transform]')].map(n=>n.getAttribute('transform'));assert.deepEqual(transforms,['translate(-1275.000000, -200.000000)','translate(1275.000000, 200.000000)','translate(-1275.000000, -200.000000)','translate(1275.000000, 200.000000)']);
 const rules={st0:{fill:'#FFFFFF','fill-rule':'evenodd','clip-rule':'evenodd'},st1:{fill:'#0066FF','fill-rule':'evenodd','clip-rule':'evenodd'},st2:{fill:'#FFFFFF'},st3:{fill:'#0066FF'}};
 assert.deepEqual([...rendered.querySelectorAll('path')].map(n=>Object.fromEntries([...n.attributes].filter(a=>a.name!=='data-privacy-choices-ink').map(a=>[a.name,a.value]))),[...original.querySelectorAll('path')].map(n=>({d:n.getAttribute('d'),...rules[n.getAttribute('class')]})));
});

test('optional navigation changes release presentation while preserving document facts and cookie material scope',async()=>{
 const config=await fixture({reviewed:true});const old=renderLegalLinks(config),first=compileLegalDocuments(config);
 assert.equal(old,'<nav class="nb-legal-links" aria-label="Legal">'+Object.values(config.documents).map(d=>`<a href="${d.route}">${d.title}</a>`).join('')+'</nav>');
 config.privacy.choicesLink=link();const second=compileLegalDocuments(config);
 assert.notEqual(first.manifest.artifactId,second.manifest.artifactId);assert.notEqual(first.manifest.configSha256,second.manifest.configSha256);assert.deepEqual(first.artifact.documents,second.artifact.documents);
 for(const kind of ['privacy','cookies','terms']){assert.equal(first.manifest.documents.find(d=>d.kind===kind).contentSha256,second.manifest.documents.find(d=>d.kind===kind).contentSha256);assert.notEqual(first.manifest.documents.find(d=>d.kind===kind).sha256,second.manifest.documents.find(d=>d.kind===kind).sha256);}
 const {exampleConsentConfig}=await import('../../../examples/static/choices-build.mjs');const cookies=exampleConsentConfig(await fixture({reviewed:true})),a=compileLegalDocuments(cookies);cookies.privacy.choicesLink=link();const b=compileLegalDocuments(cookies);
 assert.equal(createConsentNotice(a.artifact,{scopeId:'cookie-test'}).scopeDigest,createConsentNotice(b.artifact,{scopeId:'cookie-test'}).scopeDigest);
 delete config.privacy.choicesLink;assert.equal(renderLegalLinks(config),old);assert.deepEqual(compileLegalDocuments(config).files,first.files);
});

test('React forwards explicit preview and request-page authoring preserves the separate choice destination',async()=>{
 const config=await fixture({reviewed:true});config.privacy.choicesLink=link({reviewStatus:'draft'});
 assert.throws(()=>renderToStaticMarkup(createElement(LegalLinks,{config})));
 assert.equal(renderToStaticMarkup(createElement(LegalLinks,{config,mode:'preview'})),'<div>'+renderLegalLinks(config,{mode:'preview'})+'</div>');
 const settings={schemaVersion:1,revision:'requests-1',route:'/requests',title:'Privacy requests',intro:'Choose a request route.',contact:{label:'Email privacy',href:'mailto:privacy@example.test',description:'Contact our privacy team.'},actions:[{id:'access',kind:'access',title:'Get a copy',description:'Request your information.',scope:'Account information.',link:{label:'Start request',href:'/account/request'}}],nextSteps:['The destination explains identity checks.']};
 const plan=createRightsDraftPlan(config,{baseline:config,settings,linkPrivacyToPage:true});assert.equal(plan.config.privacy.rightsUrl,'/requests');assert.deepEqual(plan.config.privacy.choicesLink,config.privacy.choicesLink);
});
