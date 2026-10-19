import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeBuildFiles } from '../dist/files.js';
import { fixture } from './helpers.mjs';
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const run = (cwd, ...args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });

// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-ARTIFACTS
test('CLI init/check/build works in a fresh directory and refuses drafts by default', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'notabenda-cli-'));
  try {
    assert.equal(run(cwd, 'init').status, 0);
    const original = await readFile(join(cwd, 'notabenda.config.json'), 'utf8');
    assert.equal(run(cwd, 'init').status, 1);
    assert.equal(await readFile(join(cwd, 'notabenda.config.json'), 'utf8'), original);
    const check = run(cwd, 'check', '--json');
    assert.equal(check.status, 1);
    assert.equal(JSON.parse(check.stdout).valid, false);
    assert.equal(run(cwd, 'check', '--preview').status, 0);
    assert.equal(run(cwd, 'build').status, 1);
    await writeFile(join(cwd, 'notabenda.config.json'), JSON.stringify(await fixture()));
    const preview = run(cwd, 'build', '--preview');
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(await readFile(join(cwd, 'legal-dist/privacy/index.html'), 'utf8'), /Draft — for review/);
    await writeFile(join(cwd, 'notabenda.config.json'), JSON.stringify(await fixture({ reviewed: true })));
    assert.equal(run(cwd, 'build').status, 0);
    const manifest = JSON.parse(await readFile(join(cwd, 'legal-dist/notabenda.manifest.json'), 'utf8'));
    assert.equal(manifest.mode, 'production');
    assert.equal(manifest.documents.length, 3);
    assert.ok(await readFile(join(cwd, `legal-dist/artifacts/${manifest.artifactId}.json`), 'utf8'));
    assert.ok(await readFile(join(cwd, 'legal-dist/assets/notabenda.css'), 'utf8'));
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

// @requirements REQ-PRODUCT-SAFE-CONTENT
test('output writer rejects traversal and symbolic-link destinations without modifying their target', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'notabenda-output-'));
  try {
    const root = join(cwd, 'output'); const outside = join(cwd, 'outside');
    await mkdir(outside); await mkdir(root);
    await writeFile(join(outside, 'index.html'), 'keep');
    await symlink(outside, join(root, 'privacy'));
    await assert.rejects(writeBuildFiles(root, { '../outside/index.html': 'replace' }));
    await assert.rejects(writeBuildFiles(root, { 'privacy/index.html': 'replace' }));
    await assert.rejects(writeBuildFiles(join(root, 'privacy'), { 'index.html': 'replace' }));
    assert.equal(await readFile(join(outside, 'index.html'), 'utf8'), 'keep');
    await symlink(join(outside, 'index.html'), join(root, 'terms.html'));
    await assert.rejects(writeBuildFiles(root, { 'terms.html': 'replace' }));
    assert.equal(await readFile(join(outside, 'index.html'), 'utf8'), 'keep');
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

// @requirements REQ-PRODUCT-PACKAGE
test('CLI reports invalid JSON/options cleanly without echoing private configuration', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'notabenda-errors-'));
  try {
    await writeFile(join(cwd, 'notabenda.config.json'), '{"private":"PRIVATE-MARKER",');
    const result = run(cwd, 'check');
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stderr, /PRIVATE-MARKER/);
    for (const args of [['unknown'], ['build', '--out-dir'], ['check', '--out-dir', 'output'], ['build', '--unexpected']]) assert.equal(run(cwd, ...args).status, 1);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
