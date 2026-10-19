import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminWorker, createDurableObjectStore, normalizeRecord, recordLegalRelease, createDocumentHistory } from '../dist/index.js';
import { canonicalJson, sha256 } from '../dist/history.js';
import { createSyntheticStorage } from '../examples/synthetic.mjs';

const request = (path = '', init) => new Request(`https://example.test/admin/notabenda${path}`, init);
const query = (overrides = {}) => ({ query: '', kind: '', keyPrefix: '', from: '', to: '', limit: 25, ...overrides });
const createStore = (storage, prefix = 'evidence/demo-site/', options = {}) => createDurableObjectStore(storage, { prefix, ...options });
const mount = (store, extra = {}) => createAdminWorker({ authorize: () => ({ store, scopeLabel: 'Synthetic workspace' }), ...extra });

/** @requirements REQ-PRODUCT-CF-ADMIN */
test('authorization is mandatory, fail-closed, and evaluated before any store access', async () => {
  assert.throws(() => createAdminWorker({}), /authorization/);
  let reads = 0;
  const store = { list: async () => { reads++; throw Error('must not run'); }, get: async () => { reads++; throw Error('must not run'); } };
  for (const authorize of [() => null, () => false, () => ({ store: null }), () => { throw Error('SECRET'); }]) {
    const worker = createAdminWorker({ authorize });
    for (const path of ['', '/record?id=private', '/diff?before=a&after=b', '/unknown']) {
      const response = await worker.fetch(request(path), {});
      assert.equal(response.status, 403); assert.equal(await response.text(), 'Access denied.');
      assert.equal(response.headers.get('cache-control'), 'no-store, private');
    }
  }
  let authCalls = 0;
  const worker = mount(store, { authorize: () => { authCalls++; return null; } });
  await worker.fetch(request(), {}); await worker.fetch(request('/record?id=a'), {});
  assert.equal(authCalls, 2); assert.equal(reads, 0);
});

test('authorized UI exposes evidence search, safe detail, and restrictive headers', async () => {
  const worker = mount(createStore(createSyntheticStorage()));
  const response = await worker.fetch(request(), {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Find evidence/); assert.match(html, /subject-4z2/); assert.match(html, /4 records on this page/);
  assert.doesNotMatch(html, /<script|https?:\/\//);
  const nonce = html.match(/<style nonce="([a-f0-9]+)"/)[1];
  assert.match(response.headers.get('content-security-policy'), new RegExp(`style-src 'nonce-${nonce}'`));
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const detail = await worker.fetch(request('/record?id=2026-10-18%2Fchoice-0042'), {});
  assert.equal(detail.status, 200); assert.match(await detail.text(), /Purpose choices/);
  const head = await worker.fetch(request('', { method: 'HEAD' }), {});
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
});

/** @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y */
test('host-supplied workspace navigation is detached, escaped and cannot select or authorize another store',async()=>{
 const navigation=[{label:'<Review>',href:'/review'},{label:'This evidence',href:'/admin/notabenda'}];
 let reads=0;const store={list:async()=>{reads++;return {records:[]};},get:async()=>undefined};
 const worker=mount(store,{navigation,workspaceLabel:'<Studio>',workspaceNote:'Private <notes>'});navigation[0].href='/changed';
 const html=await (await worker.fetch(request(),{})).text();assert.match(html,/href="\/review"/);assert.doesNotMatch(html,/href="\/changed"|<Studio>|<Review>/);assert.match(html,/&lt;Studio&gt;/);assert.match(html,/href="\/admin\/notabenda" aria-current="page"/);assert.equal(reads,1);
 assert.equal((await worker.fetch(new Request('https://example.test/review'),{})).status,404);assert.equal(reads,1);
 for(const href of ['https://other.test','//other.test','/a?token=private','/a#x','/a/../b','javascript:alert(1)'])assert.throws(()=>mount(store,{navigation:[{label:'Unsafe',href}]}));
 assert.throws(()=>mount(store,{navigation:[{label:'First',href:'/a'},{label:'Second',href:'/a'}]}));
 const denied=createAdminWorker({navigation,authorize:()=>null});assert.equal((await denied.fetch(request(),{})).status,403);assert.equal(reads,1);
});

test('store access stays inside a host-fixed prefix for get, search, and forged cursors', async () => {
  const storage = createSyntheticStorage([{ id: 'one', data: { siteId: 'alpha' } }], 'evidence/alpha/');
  await storage.put('evidence/beta/secret', { private: 'SECRET_MARKER' });
  const worker = mount(createStore(storage, 'evidence/alpha/'));
  for (const path of ['', '?key=../beta', '?after=../../beta', '/record?id=../../beta/secret', '/record?id=evidence/beta/secret']) {
    const response = await worker.fetch(request(path), {});
    assert.doesNotMatch(await response.text(), /SECRET_MARKER/);
  }
  for (const prefix of ['', 'evidence/alpha', '../', '/root/', 'a//b/', 'a/../b/']) assert.throws(() => createStore(storage, prefix));
});

test('word, kind, subject, document-version, purpose, and UTC-date filters work', async () => {
  const store = createStore(createSyntheticStorage());
  assert.equal((await store.list(query({ query: 'subject-4z2 privacy-2 analytics' }))).records.length, 1);
  assert.equal((await store.list(query({ kind: 'rights-request' }))).records.length, 1);
  assert.equal((await store.list(query({ from: '2026-10-18', to: '2026-10-18' }))).records.length, 2);
  assert.equal((await store.list(query({ keyPrefix: '2026-10-17/' }))).records.length, 2);
});

test('bounded scanning and pagination never skip matching records', async () => {
  const records = Array.from({ length: 17 }, (_, n) => ({ id: String(n).padStart(2, '0'), data: { selected: n % 3 === 0 ? 'match' : 'other' } }));
  const store = createStore(createSyntheticStorage(records), 'evidence/demo-site/', { scanLimit: 4 });
  const seen = []; let after;
  for (let n = 0; n < 20; n++) {
    const page = await store.list(query({ query: 'match', limit: 2, ...(after === undefined ? {} : { after }) }));
    assert.ok(page.scanned <= 4); seen.push(...page.records.map(record => record.id));
    if (page.nextAfter === undefined) break; after = page.nextAfter;
  }
  assert.deepEqual(seen, ['00','03','06','09','12','15']);
});

test('pagination respects Cloudflare UTF-8 ordering for non-ASCII keys', async () => {
  const store = createStore(createSyntheticStorage([{ id: '\uE000', data: 1 }, { id: '😀', data: 2 }]));
  const first = await store.list(query({ limit: 1 }));
  assert.equal(first.records[0].id, '\uE000');
  const second = await store.list(query({ limit: 1, after: first.nextAfter }));
  assert.equal(second.records[0].id, '😀');
});

test('hostile stored text and scope labels are escaped rather than interpreted', async () => {
  const payload = '</pre><script>alert(1)</script><img src=x onerror=alert(2)>';
  const storage = createSyntheticStorage([{ id: payload, data: { kind: payload, subjectId: payload, body: payload } }]);
  const worker = mount(createStore(storage), { authorize: () => ({ store: createStore(storage), scopeLabel: payload }) });
  for (const path of ['', `/record?${new URLSearchParams({ id: payload })}`]) {
    const response = await worker.fetch(request(path), {}); const html = await response.text();
    assert.equal(response.status, 200); assert.doesNotMatch(html, /<script|<img/); assert.match(html, /&lt;script&gt;/);
  }
});

/** @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-AUTHORING */
test('private-source entry links are omitted when the host store has no authorized source hook',async()=>{
 const record={id:'a'.repeat(64),data:{kind:'document-release',sourceKinds:['terms'],documents:{terms:{version:'one'}}}};
 const store={list:async()=>({records:[record]}),get:async()=>record};
 const html=await (await mount(store).fetch(request('/record?id='+record.id),{})).text();assert.doesNotMatch(html,/href="[^"]*\/source\?/);
 assert.equal((await mount(store).fetch(request('/source?id='+record.id+'&kind=terms'),{})).status,404);
 const withSource={...store,getSource:async()=>undefined};const allowed=await (await mount(withSource).fetch(request('/record?id='+record.id),{})).text();assert.match(allowed,/href="[^"]*\/source\?/);
});

test('invalid routes, methods, filters and oversized records fail with sanitized messages', async () => {
  const worker = mount(createStore(createSyntheticStorage()));
  for (const path of ['?limit=51','?limit=-1','?from=2026-02-30','?q=a&q=b','?namespace=other','/record?id=a&id=b','?key=a&after=b']) assert.equal((await worker.fetch(request(path), {})).status, 400);
  assert.equal((await worker.fetch(request('/unknown'), {})).status, 404);
  assert.equal((await worker.fetch(request('', { method: 'POST' }), {})).status, 405);
  const failed = mount({ list: async () => { throw Error('PRIVATE_BACKEND_MESSAGE'); }, get: async () => { throw Error('PRIVATE_BACKEND_MESSAGE'); } });
  for (const path of ['', '/record?id=a']) { const result = await failed.fetch(request(path), {}); assert.equal(result.status, 500); assert.doesNotMatch(await result.text(), /PRIVATE/); }
  assert.throws(() => normalizeRecord({ id: 'x', data: 'x'.repeat(70_000) }), /limits/);
  assert.throws(() => normalizeRecord({ id: 'x', data: ['x'.repeat(57_000), ...Array.from({ length: 3000 }, () => ({}))] }), /limits/);
  const cycle = {}; cycle.self = cycle;
  assert.throws(() => normalizeRecord({ id: 'x', data: cycle }), /JSON/);
  assert.throws(() => normalizeRecord({ id: 'x', data: { get secret() { throw Error('EXECUTED'); } } }), /JSON/);
});

async function artifact(version = '1', text = 'Initial text', style = 'a') {
  const pages = {}; const documents = {}; const descriptions = [];
  for (const kind of ['privacy','cookies','terms']) {
    const doc = { kind, title: `${kind} policy`, route: `/${kind}`, version, effectiveDate: '2026-10-18', reviewStatus: 'reviewed', sections: [{ id: 'intro', heading: 'Introduction', paragraphs: [text] }], requirementIds: [] };
    const file = `${kind}/index.html`; const html = `<html><style>${style}</style><body>${text}</body></html>`;
    pages[file] = html; documents[kind] = doc;
    descriptions.push({ kind, route: doc.route, file, title: doc.title, version, effectiveDate: doc.effectiveDate, reviewStatus: doc.reviewStatus, sha256: await sha256(html), contentSha256: await sha256(canonicalJson({ title: doc.title, sections: doc.sections })), requirementIds: [] });
  }
  const publicConfig = { site: { id: 'demo-site' } };
  const descriptor = { schemaVersion: 1, siteId: 'demo-site', locale: 'en', mode: 'production', configSha256: await sha256(canonicalJson(publicConfig)), documents: descriptions, requirementIds: [] };
  return { manifest: { ...descriptor, artifactId: await sha256(canonicalJson(descriptor)) }, publicConfig, pages, documents };
}

/** @requirements REQ-PRODUCT-CF-HISTORY */
test('release archive is atomic, immutable and idempotent, including metadata', async () => {
  const storage = createSyntheticStorage([]); const content = await artifact();
  const metadata = { recordedAt: '2026-10-18T12:00:00Z', changeNote: 'Initial release', actor: 'operator-demo' };
  const results = await Promise.all([recordLegalRelease(storage, content, metadata), recordLegalRelease(storage, content, metadata)]);
  assert.equal(results.filter(result => result.created).length, 1);
  await assert.rejects(recordLegalRelease(storage, content, { ...metadata, changeNote: 'Modified history' }), /immutable/);
  const archived = await storage.get(`notabenda/releases/${content.manifest.artifactId}`);
  assert.deepEqual(archived.artifact.pages, content.pages);
  const forged = structuredClone(content); forged.pages['privacy/index.html'] = 'tampered';
  await assert.rejects(recordLegalRelease(storage, forged), /does not match/);
  const misleading = structuredClone(content); misleading.documents.privacy.effectiveDate = '2027-01-01';
  await assert.rejects(recordLegalRelease(storage, misleading), /metadata does not match/);
});

test('history projections retain versions and hashes while excluding HTML and public config', async () => {
  const storage = createSyntheticStorage([]); const content = await artifact();
  await recordLegalRelease(storage, content);
  const store = createDocumentHistory(storage); const record = await store.get(content.manifest.artifactId);
  assert.equal(record.data.documents.privacy.version, '1');
  assert.equal(record.data.manifest.documents[0].contentSha256, content.manifest.documents[0].contentSha256);
  assert.equal(record.data.pages, undefined); assert.equal(record.data.publicConfig, undefined);
  const html = await (await mount(store).fetch(request(`/record?id=${record.id}`), {})).text();
  assert.match(html, /Compare documents/); assert.doesNotMatch(html, /&lt;html&gt;/);
});

test('readable diff escapes changes and distinguishes presentation from content', async () => {
  const storage = createSyntheticStorage([]); const first = await artifact(); const second = await artifact('2', '<script>unsafe()</script>'); const third = await artifact('3', '<script>unsafe()</script>', 'b');
  for (const value of [first,second,third]) await recordLegalRelease(storage,value);
  const worker = mount(createDocumentHistory(storage));
  const diff = async (before, after) => worker.fetch(request(`/diff?${new URLSearchParams({ before: before.manifest.artifactId, after: after.manifest.artifactId, kind: 'privacy' })}`), {});
  const changed = await diff(first,second); assert.equal(changed.status,200);
  const changedText = await changed.text(); assert.match(changedText,/&lt;script&gt;unsafe/); assert.doesNotMatch(changedText,/<script>/); assert.match(changedText,/Structured content hash changed/); assert.match(changedText,/Before · 1/); assert.match(changedText,/After · 2/);
  const presentation = await (await diff(second,third)).text();
  assert.match(presentation,/Structured content hash unchanged/); assert.match(presentation,/Rendered HTML hash changed/);
  assert.equal((await worker.fetch(request(`/diff?before=${first.manifest.artifactId}&after=missing`),{})).status,404);
});

/** @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CF-HISTORY */
test('history list compares current-page releases with readable labels and timestamp defaults', async () => {
  const storage = createSyntheticStorage([]);
  const first = await artifact('9'); const second = await artifact('2'); const latest = await artifact('1');
  for (const [content, recordedAt, changeNote] of [
    [first, '2026-10-16T12:00:00Z', 'Initial terms'],
    [second, '2026-10-17T12:00:00Z', 'Retention clarified'],
    [latest, '2026-10-18T12:00:00Z', 'Purpose descriptions updated'],
  ]) await recordLegalRelease(storage, content, { recordedAt, changeNote });
  const worker = mount(createDocumentHistory(storage));
  const response = await worker.fetch(request(), {}); assert.equal(response.status, 200);
  const html = await response.text();
  const before = html.match(/<select id="compare-before"[\s\S]*?<\/select>/)[0];
  const after = html.match(/<select id="compare-after"[\s\S]*?<\/select>/)[0];
  assert.match(before, new RegExp(`<option value="${second.manifest.artifactId}" selected>`));
  assert.match(after, new RegExp(`<option value="${latest.manifest.artifactId}" selected>`));
  assert.match(before, /privacy · 2.*2026-10-17T12:00:00Z.*Retention clarified/);
  assert.match(html, /action="\/admin\/notabenda\/diff" method="get"/);
  assert.match(html, /name="kind"/); assert.match(html, /two latest distinct recorded timestamps on this page/);
  assert.match(html, /ordered by record key/); assert.match(html, /3 records on this page/);
  assert.doesNotMatch(await (await worker.fetch(request('?limit=1'), {})).text(), /id="compare-before"/);
});

test('comparison options escape record IDs, versions, and change notes', async () => {
  const payload = '\"><script>alert(1)</script>';
  const records = [{ id: payload, data: { kind: 'document-release', documents: { privacy: { version: payload } }, changeNote: payload } }, { id: 'other', data: { kind: 'document-release', documents: { privacy: { version: '1' } } } }];
  const html = await (await mount(createStore(createSyntheticStorage(records))).fetch(request(), {})).text();
  const before = html.match(/<select id="compare-before"[\s\S]*?<\/select>/)[0];
  assert.match(before, /value="&quot;&gt;&lt;script&gt;/);
  assert.match(before, /privacy · &quot;&gt;&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(before, /<option value="" disabled selected>/);
  assert.match(html, /date not recorded/);
});

test('comparison does not infer chronology from keys, versions, or tied timestamps', async () => {
  for (const occurredAt of [undefined, '2026-10-18T12:00:00Z']) {
    const records = ['a','z'].map((id, n) => ({ id, data: { kind: 'document-release', documents: { privacy: { version: String(10 - n) } }, ...(occurredAt ? { occurredAt } : {}) } }));
    const html = await (await mount(createStore(createSyntheticStorage(records))).fetch(request(), {})).text();
    for (const name of ['before','after']) {
      const select = html.match(new RegExp(`<select id="compare-${name}"[\\s\\S]*?<\\/select>`))[0];
      assert.match(select, /<option value="" disabled selected>/);
      assert.doesNotMatch(select, /<option value="[az]" selected>/);
    }
  }
});
