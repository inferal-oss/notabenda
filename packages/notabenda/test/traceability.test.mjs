import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

test('implementation and tests cite known catalog requirements, with honest implementation/verification links', async () => {
  const root = fileURLToPath(new URL('../../..', import.meta.url));
  const catalog = JSON.parse(await readFile(join(root, 'regulatory/catalog.json'), 'utf8'));
  const ids = new Set(catalog.requirements.map(item => item.id));
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else if (/\.(?:ts|mjs|js|css|astro)$/.test(path)) {
        const source = await readFile(path, 'utf8');
        for (const match of source.matchAll(/\bREQ-[A-Z][A-Z0-9-]+/g)) assert.ok(ids.has(match[0]), `${path}: unknown ${match[0]}`);
      }
    }
  }
  for (const packageName of ['notabenda', 'notabenda-authoring', 'notabenda-cf']) for (const directory of ['src', 'test']) await inspect(join(root, 'packages', packageName, directory));
  for (const requirement of catalog.requirements) {
    if (requirement.implementationStatus === 'implemented') {
      assert.ok(requirement.implementationRefs.length, requirement.id);
      assert.ok(requirement.testRefs.length, requirement.id);
      assert.ok(requirement.verificationIds.some(id => catalog.verification.find(item => item.id === id)?.status === 'automated'), requirement.id);
    }
    for (const reference of [...requirement.implementationRefs, ...requirement.testRefs]) {
      const path = join(root, reference.split('#')[0]);
      const source = await readFile(path, 'utf8');
      if (/\.(?:ts|mjs|css)$/.test(path)) assert.ok(source.includes(requirement.id), `${reference} must cite ${requirement.id}`);
    }
  }
  assert.equal(catalog.requirements.find(item => item.id === 'REQ-EU-NOTICE').implementationStatus, 'partial');
  assert.equal(catalog.requirements.find(item => item.id === 'REQ-EU-CONSENT').implementationStatus, 'partial');
});
