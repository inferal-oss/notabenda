import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileLegalDocuments, canonicalJson, sha256 } from 'notabenda/content';
import { fixture } from './helpers.mjs';

// @requirements REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-CONFIG
test('identical public input yields stable artifacts independent of property order or private metadata', async () => {
  const config = await fixture({ reviewed: true });
  const first = compileLegalDocuments(config);
  config.private = { note: 'PRIVATE-DIFFERENCE' };
  const reordered = Object.fromEntries(Object.entries(config).reverse());
  const second = compileLegalDocuments(reordered);
  assert.deepEqual(first.files, second.files);
  assert.match(first.manifest.artifactId, /^[a-f0-9]{64}$/);
  const archived = JSON.parse(first.files[`artifacts/${first.manifest.artifactId}.json`]);
  assert.deepEqual(archived.manifest, first.manifest);
  assert.deepEqual(archived.documents.terms.sections, config.documents.terms.sections);
  assert.doesNotMatch(JSON.stringify(first), /PRIVATE-DIFFERENCE|operatorNote/);
  for (const doc of first.manifest.documents) assert.equal(doc.sha256, sha256(first.files[doc.file]));
  assert.equal(first.manifest.configSha256, sha256(canonicalJson(first.publicConfig)));
});

// @requirements REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-DOCUMENTS
test('content changes create new artifacts while leaving earlier in-memory releases intact', async () => {
  const config = await fixture({ reviewed: true });
  const first = compileLegalDocuments(config);
  const oldText = first.artifact.documents.terms.sections[0].paragraphs[0];
  config.documents.terms.sections[0].paragraphs[0] = 'A second, intentionally changed synthetic section.';
  config.documents.terms.version = '2';
  const second = compileLegalDocuments(config);
  assert.notEqual(first.manifest.artifactId, second.manifest.artifactId);
  assert.equal(first.artifact.documents.terms.sections[0].paragraphs[0], oldText);
  assert.notEqual(first.manifest.documents.find(d => d.kind === 'terms').sha256, second.manifest.documents.find(d => d.kind === 'terms').sha256);
  assert.equal(first.manifest.documents.find(d => d.kind === 'cookies').sha256, second.manifest.documents.find(d => d.kind === 'cookies').sha256);
});

// @requirements REQ-PRODUCT-ARTIFACTS
test('presentation changes retain structured content for a backend to distinguish from wording changes', async () => {
  const config = await fixture({ reviewed: true });
  const first = compileLegalDocuments(config, { stylesheetUrl: '/assets/one.css' });
  const second = compileLegalDocuments(config, { stylesheetUrl: '/assets/two.css' });
  assert.notEqual(first.manifest.artifactId, second.manifest.artifactId);
  assert.deepEqual(first.artifact.documents, second.artifact.documents);
  assert.equal(first.manifest.configSha256, second.manifest.configSha256);
});

// @requirements REQ-PRODUCT-SAFE-CONTENT
test('routes cannot escape output paths or collide with another document', async () => {
  for (const route of ['/', '/../secret', '/%2e%2e/secret', '//outside.test', '/legal\\terms', '/terms?x=1', '/terms#x', '/terms.html']) {
    const config = await fixture({ reviewed: true }); config.documents.terms.route = route;
    assert.throws(() => compileLegalDocuments(config));
  }
  const config = await fixture({ reviewed: true }); config.documents.terms.route = config.documents.cookies.route;
  assert.throws(() => compileLegalDocuments(config));
});
