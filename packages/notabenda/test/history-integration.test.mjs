import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileLegalDocuments } from 'notabenda/content';
import { createAdminWorker, createDocumentHistory, recordLegalRelease } from 'notabenda-cf';
import { createSyntheticStorage } from '../../notabenda-cf/examples/synthetic.mjs';
import { fixture } from './helpers.mjs';

// @requirements REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-CF-HISTORY
test('real compiled releases archive immutably and show cookie-inventory differences in the backoffice', async () => {
  const config = await fixture();
  const first = compileLegalDocuments(config, { mode: 'preview' });
  config.storage[0].duration = '14 days (changed sample)';
  config.documents.cookies.version = 'draft-2';
  const second = compileLegalDocuments(config, { mode: 'preview' });
  assert.notEqual(first.manifest.documents.find(d => d.kind === 'cookies').contentSha256, second.manifest.documents.find(d => d.kind === 'cookies').contentSha256);
  const storage = createSyntheticStorage([], 'history/example/');
  const options = { prefix: 'history/example/' };
  const metadata = { recordedAt: '2026-10-18T12:00:00Z', changeNote: 'Initial synthetic release.' };
  assert.equal((await recordLegalRelease(storage, first.artifact, metadata, options)).created, true);
  assert.equal((await recordLegalRelease(storage, first.artifact, metadata, options)).created, false);
  await recordLegalRelease(storage, second.artifact, { recordedAt: '2026-10-18T13:00:00Z', changeNote: 'Change the declared storage duration.' }, options);
  const history = createDocumentHistory(storage, options);
  const worker = createAdminWorker({ authorize: () => ({ store: history }), basePath: '/history' });
  const response = await worker.fetch(new Request(`https://example.test/history/diff?before=${first.manifest.artifactId}&after=${second.manifest.artifactId}&kind=cookies`), {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /14 days \(changed sample\)/);
  assert.match(html, /30 days \(sample\)/);
  assert.match(html, /Duration: 14 days \(changed sample\)/);
  assert.match(html, /Provider \/ service: Juniper Notes/);
  assert.match(html, /Structured content hash changed/);
  assert.doesNotMatch(html, /<script|<iframe/);
  const stored = await storage.get(options.prefix + first.manifest.artifactId);
  assert.ok(stored);
  assert.ok(JSON.stringify(stored).includes(first.artifact.pages['privacy/index.html'].slice(0, 15)));
});
