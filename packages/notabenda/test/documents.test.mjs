import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLegalDocument, renderLegalDocument, renderLegalPage, renderLegalLinks, validateSiteConfig } from '@notabenda/core';
import { fixture } from './helpers.mjs';

// @requirements REQ-PRODUCT-DOCUMENTS REQ-EU-NOTICE REQ-NZ-NOTICE
test('privacy output renders declared disclosure facts, contact details and usable rights links without JS', async () => {
  const config = await fixture();
  const html = renderLegalPage(config, 'privacy');
  for (const text of [config.controller.name, config.controller.address, config.purposes[0].legalBasis, config.purposes[0].retention, config.purposes[0].collection.consequences, config.services[0].provider, config.privacy.transfers, config.privacy.automatedDecisions, config.privacy.complaints.description]) assert.ok(html.includes(text.replaceAll("'", '&#39;')), text);
  assert.match(html, /mailto:privacy@juniper\.example\.test/);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<main id="main">/);
  assert.doesNotMatch(html, /<script|<iframe|<input|<form|operatorNote/);
});

// @requirements REQ-PRODUCT-DOCUMENTS
test('cookie page uses linked inventory details without asserting that it controls tracking', async () => {
  const config = await fixture();
  const html = renderLegalDocument(config, 'cookies');
  for (const text of ['display_mode', '30 days (sample)', 'Remembering display preferences', 'Storage inventory', 'Site preferences', 'necessary']) assert.ok(html.includes(text));
  assert.match(html, /publishing this page does not itself control/);
  config.storage = [];
  assert.match(renderLegalDocument(config, 'cookies'), /No browser storage is declared/);
});

// @requirements REQ-PRODUCT-SAFE-CONTENT
test('all supplied document text is escaped and scriptable URLs are rejected before rendering', async () => {
  const config = await fixture();
  config.documents.terms.title = '<img src=x onerror=alert(1)>';
  config.documents.terms.sections[0].paragraphs = ['<script>alert(1)</script>', '" & <svg/onload=alert(1)>'];
  const html = renderLegalPage(config, 'terms');
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script|<img|<svg/);
  for (const href of ['javascript:alert(1)', 'data:text/html,test', '//outside.example.test', 'https://user:pass@example.test', '/\\outside.test', '/%0aevil']) {
    config.documents.terms.sections[0].links = [{ label: 'Example', href }];
    assert.equal(validateSiteConfig(config).valid, false);
    assert.throws(() => renderLegalPage(config, 'terms'));
  }
});

// @requirements REQ-PRODUCT-SAFE-CONTENT
test('site/contact validation agrees with rendering and cannot create mailto fragments or headers', async () => {
  for (const email of ['privacy?x@example.test', 'a#b@example.test', 'a:b@example.test', 'a\\b@example.test', 'a@example.test\nBcc:other@example.test']) {
    const config = await fixture(); config.controller.email = email;
    assert.equal(validateSiteConfig(config).valid, false);
  }
  const config = await fixture(); config.site.url = ' https://example.test';
  assert.equal(validateSiteConfig(config).valid, false);
  config.site.url = 'https://example.test'; config.controller.email = 'privacy+rights@example.test';
  assert.equal(validateSiteConfig(config).valid, true);
  assert.match(renderLegalDocument(config, 'privacy'), /mailto:privacy\+rights@example.test/);
});

// @requirements REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-A11Y
test('supplied terms preserve structure, TOC targets and distinct section/heading IDs', async () => {
  const config = await fixture();
  config.documents.terms.sections[0].id = 'title';
  const doc = createLegalDocument(config, 'terms');
  assert.equal(doc.sections[0].heading, config.documents.terms.sections[0].heading);
  const html = renderLegalPage(config, 'terms');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.includes('nb-terms-title'));
  assert.ok(ids.includes('nb-terms-section-title'));
  for (const match of html.matchAll(/href="[^"#]*#([^"]+)"/g)) assert.ok(ids.includes(match[1]));
  assert.match(html, /Draft — for review/);
  assert.match(renderLegalLinks(config), /aria-label="Legal"/);
  assert.match(renderLegalDocument(config, 'cookies'), /scope="col"/);
  assert.match(renderLegalDocument(config, 'cookies'), /scope="row"/);
});

// @requirements REQ-PRODUCT-DOCUMENTS
test('supplied privacy/cookie content replaces generated sections, while generated extras remain distinct', async () => {
  const config = await fixture();
  config.documents.privacy.source = 'supplied';
  config.documents.privacy.sections = [{ id: 'custom', heading: 'Your reviewed content', paragraphs: ['Your supplied wording.'] }];
  assert.equal(createLegalDocument(config, 'privacy').sections.length, 1);
  assert.match(renderLegalDocument(config, 'cookies'), /additional-example-only/);
});

// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-DOCUMENTS
test('structured tables retain safe text and public projection excludes table metadata', async () => {
  const config = await fixture();
  config.documents.terms.sections = [{ id: 'inventory', heading: 'A supplied table', table: { caption: 'Example', columns: ['Name', 'Description'], rows: [['Item', '<img onerror=alert(1)>']], privateNote: 'TABLE-PRIVATE' } }];
  const html = renderLegalDocument(config, 'terms');
  assert.match(html, /&lt;img onerror/);
  assert.doesNotMatch(html, /<img|TABLE-PRIVATE/);
  config.documents.terms.sections[0].table.rows[0].push('extra');
  assert.equal(validateSiteConfig(config).valid, false);
});

// @requirements REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-A11Y
 test('declared storage starts collapsed with an accessible count and complete inventory',async()=>{
 const {JSDOM}=await import('jsdom'),config=await fixture();
 const document=new JSDOM(renderLegalDocument(config,'cookies')).window.document;
 const foldout=document.querySelector('#nb-cookies-section-storage > details');
 assert.ok(foldout);assert.equal(foldout.open,false);
 assert.match(foldout.querySelector('summary').textContent,/Declared storage.*1 item/);
 assert.equal(foldout.querySelectorAll('tbody tr').length,config.storage.length);
 assert.match(foldout.textContent,/display_mode/);
 foldout.open=true;assert.equal(foldout.open,true);
 assert.equal(document.querySelector('nav a[href="#nb-cookies-section-storage"]').textContent,'Declared storage');
 config.storage=[];assert.doesNotMatch(renderLegalDocument(config,'cookies'),/nb-storage-foldout/);
 });
