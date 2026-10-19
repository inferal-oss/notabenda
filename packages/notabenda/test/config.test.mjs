import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defineSite, validateSiteConfig, toPublicConfig, SiteConfigError } from 'notabenda';
import { createStarterConfig } from '../dist/starter.js';
import { fixture } from './helpers.mjs';

// @requirements REQ-PRODUCT-CONFIG REQ-EU-NOTICE REQ-NZ-NOTICE
test('typed inventory checks produce requirement-linked diagnostics for missing disclosure facts', async () => {
  const config = await fixture();
  assert.equal(defineSite(config), config);
  assert.equal(validateSiteConfig(config).valid, true);
  delete config.controller.address;
  config.purposes[0].retention = '';
  config.purposes[0].collection.consequences = '';
  const result = validateSiteConfig(config);
  assert.equal(result.valid, false);
  assert.ok(result.diagnostics.find(d => d.path === 'controller.address').requirementIds.includes('REQ-EU-NOTICE'));
  assert.ok(result.diagnostics.find(d => d.path.endsWith('consequences')).requirementIds.includes('REQ-NZ-NOTICE'));
  assert.throws(() => toPublicConfig(config), SiteConfigError);
});

// @requirements REQ-PRODUCT-CONFIG
test('untrusted malformed JSON structures yield diagnostics instead of incidental exceptions', async () => {
  for (const input of [null, false, 1, 'text', [], {}, { purposes: [null], documents: { privacy: [] } }]) {
    const result = validateSiteConfig(input);
    assert.equal(result.valid, false);
    assert.ok(result.diagnostics.length);
  }
  for (const [field, value] of [['purposes', [null]], ['services', [{}]], ['storage', [false]], ['documents', null]]) {
    const config = await fixture(); config[field] = value;
    assert.equal(validateSiteConfig(config).valid, false);
  }
});

// @requirements REQ-PRODUCT-CONFIG
test('public projection allowlists every depth and is detached from operator input', async () => {
  const config = await fixture();
  config.private = { secret: 'OPERATOR-ONLY' };
  for (const obj of [config, config.site, config.controller, config.privacy, config.privacy.complaints, config.purposes[0], config.purposes[0].collection, config.services[0], config.storage[0], config.documents.terms, config.documents.terms.review, config.documents.terms.sections[0]]) obj.internalSecret = 'NESTED-PRIVATE';
  const projected = toPublicConfig(config);
  assert.doesNotMatch(JSON.stringify(projected), /OPERATOR-ONLY|NESTED-PRIVATE|internalSecret|operatorNote/);
  projected.purposes[0].dataCategories.push('Changed copy');
  assert.equal(config.purposes[0].dataCategories.includes('Changed copy'), false);
});

// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-SAFE-CONTENT
test('optional storage cannot hide objects in an optional public text field', async () => {
  const config = await fixture({ reviewed: true });
  config.storage[0].classification = 'optional';
  config.storage[0].necessityReason = { private: 'NESTED-PRIVATE' };
  assert.equal(validateSiteConfig(config, { mode: 'production' }).valid, false);
  assert.throws(() => toPublicConfig(config), SiteConfigError);
});

// @requirements REQ-PRODUCT-CONFIG
test('inventory integrity rejects duplicate IDs, unknown purpose/service refs and invalid dates/locales', async () => {
  const cases = [
    c => c.purposes.push(structuredClone(c.purposes[0])),
    c => c.services[0].purposeIds.push('undeclared'),
    c => c.storage[0].serviceId = 'undeclared',
    c => c.documents.cookies.effectiveDate = '2026-02-30',
    c => c.site.locale = 'fr',
    c => c.privacy.requiredContacts = ['dpo'],
  ];
  for (const mutate of cases) { const config = await fixture(); mutate(config); assert.equal(validateSiteConfig(config).valid, false); }
});

// @requirements REQ-PRODUCT-DOCUMENTS REQ-EU-TERMS
test('production rejects drafts, unresolved starter placeholders and generated contractual terms', async () => {
  const config = await fixture();
  assert.equal(validateSiteConfig(config, { mode: 'production' }).valid, false);
  for (const doc of Object.values(config.documents)) doc.review.status = 'reviewed';
  assert.equal(validateSiteConfig(config, { mode: 'production' }).valid, true);
  config.documents.terms.source = 'generated';
  assert.ok(validateSiteConfig(config).diagnostics.some(d => d.code === 'supplied-terms-required'));
  const starter = createStarterConfig();
  assert.equal(validateSiteConfig(starter).valid, true);
  for (const doc of Object.values(starter.documents)) doc.review.status = 'reviewed';
  assert.ok(validateSiteConfig(starter, { mode: 'production' }).diagnostics.some(d => d.code === 'unresolved-placeholder'));
  assert.equal(validateSiteConfig(config, { mode: 'invalid' }).valid, false);
});
