import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConsent, toPublicConfig, validateSiteConfig } from 'notabenda';
import { fixture } from './helpers.mjs';
// @requirements REQ-PRODUCT-CONSENT-RUNTIME

const DAY = 86400000;
async function setup() {
  const config = await fixture();
  config.purposes = [config.purposes[0], { ...structuredClone(config.purposes[0]), id: 'personalization', name: 'Personalization' }];
  config.services = [{ id: 'metrics', name: 'Local metrics', provider: 'Fictional', location: 'Local test', purposeIds: config.purposes.map(p => p.id) }];
  config.storage = [{ id: 'metrics-item', name: 'synthetic-metrics', type: 'localStorage', serviceId: 'metrics', duration: '1 day', classification: 'optional' }];
  config.consent = { purposes: config.purposes.map(p => ({ id: p.id, scope: '1' })), services: [{ id: 'metrics', scope: '1' }], grantLifetimeDays: 1, refusalLifetimeDays: 180, dismissalMinutes: 10 };
  const values = new Map(); let clock = Date.parse('2026-10-18T12:00:00Z'); const callbacks = new Set(); let notify;
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key) };
  const environment = { storage, now: () => clock, schedule: callback => { callbacks.add(callback); return () => callbacks.delete(callback); }, subscribe: (_key, callback) => { notify = callback; return () => { notify = undefined; }; } };
  return { config, values, storage, environment, key: `notabenda:choices:v1:${config.site.id}`, advance(ms) { clock += ms; for (const callback of [...callbacks]) callback(); }, notify() { notify?.(); }, resume(ms) { clock += ms; notify?.(); } };
}
const deferred = () => { let resolve; let reject; const promise = new Promise((a,b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

// @requirements REQ-EU-DEVICE REQ-EU-CONSENT REQ-EU-FAIR-CHOICE
test('all declared purposes are required, registration is inert, and rejection withdraws actual started work', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment); const purposes = f.config.services[0].purposeIds;
  let starts = 0; let stops = 0; let signal;
  c.registerService('metrics', { purposes, start(context) { starts++; signal = context.signal; return () => { stops++; }; } });
  await c.settled(); assert.equal(starts, 0); assert.equal(c.getSnapshot().shouldPrompt, true);
  c.choose({ [purposes[0]]: true, [purposes[1]]: false }); await c.settled(); assert.equal(starts, 0);
  c.acceptAll(); await c.settled(); assert.equal(starts, 1); assert.equal(c.getSnapshot().services.metrics, 'active');
  c.rejectAll(); assert.equal(signal.aborted, true); assert.equal(c.isAllowed(purposes[0]), false); await c.settled(); assert.equal(stops, 1);
  assert.equal(c.getSnapshot().purposes[purposes[0]], 'withdrawn'); c.destroy();
});

// @requirements REQ-EU-CONSENT REQ-EU-DEVICE
test('persisted grants survive reload, but new services and changed material scope cannot inherit permission; refusals remain refused', async () => {
  const f = await setup(); let c = createConsent(f.config, f.environment); c.acceptAll(); c.destroy();
  c = createConsent(f.config, f.environment); assert.equal(c.isAllowed(f.config.purposes[0].id), true); c.destroy();
  const cosmetic = structuredClone(f.config); cosmetic.documents.cookies.version = 'formatting-only-2';
  c = createConsent(cosmetic, f.environment); assert.equal(c.isAllowed(f.config.purposes[0].id), true); c.destroy();
  const vendorAdded = structuredClone(f.config); vendorAdded.services.push({ ...structuredClone(vendorAdded.services[0]), id:'new-vendor' }); vendorAdded.consent.services.push({ id:'new-vendor', scope:'1' });
  c = createConsent(vendorAdded, f.environment); assert.equal(c.isAllowed(f.config.purposes[0].id), false); c.destroy();
  const updated = structuredClone(f.config); updated.consent.services[0].scope = '2';
  c = createConsent(updated, f.environment); assert.equal(c.isAllowed(updated.purposes[0].id), false); assert.equal(c.getSnapshot().shouldPrompt, true); c.rejectAll(); c.destroy();
  updated.consent.services[0].scope = '3'; c = createConsent(updated, f.environment); assert.equal(c.getSnapshot().shouldPrompt, false); assert.equal(c.getSnapshot().purposes[updated.purposes[0].id], 'withdrawn'); c.destroy();
});

// @requirements REQ-EU-DEVICE REQ-EU-FAIR-CHOICE
test('untrusted records cannot grant through wrong site, malformed status, future time, extended expiry, or invalid JSON', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment); c.acceptAll(); const original = JSON.parse(f.values.get(f.key)); c.destroy();
  const variants = [null, '{bad json', { ...original, siteId: 'another-site' }, { ...original, choices: [] }];
  for (const field of ['status','at','until']) { const value = structuredClone(original); value.choices[f.config.purposes[0].id][field] = field === 'status' ? true : field === 'at' ? Date.now() + DAY * 10000 : original.choices[f.config.purposes[0].id].until + DAY; variants.push(value); }
  for (const value of variants) {
    f.values.set(f.key, typeof value === 'string' || value === null ? value : JSON.stringify(value));
    const current = createConsent(f.config, f.environment); assert.equal(current.isAllowed(f.config.purposes[0].id), false); current.destroy();
  }
});

// @requirements REQ-EU-CONSENT REQ-EU-DEVICE
test('unavailable storage never grants and failed withdrawal cannot revive old permissions on refresh', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment); c.acceptAll(); assert.equal(c.isAllowed(f.config.purposes[0].id), true);
  f.storage.setItem = () => { throw new Error('quota'); }; f.storage.removeItem = () => { throw new Error('blocked'); };
  assert.equal(c.rejectAll().persisted, false); c.refresh(); assert.equal(c.isAllowed(f.config.purposes[0].id), false); assert.equal(c.getSnapshot().persistence, 'unavailable');
  assert.equal(c.acceptAll().persisted, false); assert.equal(c.isAllowed(f.config.purposes[0].id), false); c.destroy();
  const unavailable = createConsent(f.config, { now: f.environment.now }); unavailable.acceptAll(); assert.equal(unavailable.isAllowed(f.config.purposes[0].id), false); unavailable.destroy();
  f.storage.getItem = () => { throw new Error('denied'); }; const denied = createConsent(f.config, f.environment); assert.equal(denied.getSnapshot().persistence, 'unavailable'); denied.destroy();
});

// @requirements REQ-EU-DEVICE REQ-EU-CONSENT
test('expiry stops services on timer and resume, and clearing shared storage removes permissions', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment); let signal;
  c.registerService('metrics', { purposes: f.config.services[0].purposeIds, start(context) { signal = context.signal; return () => {}; } });
  c.acceptAll(); await c.settled(); f.advance(DAY + 1); assert.equal(signal.aborted, true); assert.equal(c.getSnapshot().purposes[f.config.purposes[0].id], 'expired'); await c.settled();
  c.acceptAll(); await c.settled(); f.resume(DAY + 1); assert.equal(signal.aborted, true); await c.settled();
  c.acceptAll(); await c.settled(); f.values.clear(); f.notify(); assert.equal(signal.aborted, true); assert.equal(c.isAllowed(f.config.purposes[0].id), false); await c.settled(); c.destroy();
});

// @requirements REQ-EU-DEVICE REQ-EU-CONSENT
test('withdrawal during a pending start permanently retires it and waits for cleanup before restarting', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment); const started = deferred(); const cleanupDone = deferred(); const first = deferred(); let starts = 0; let stops = 0; let signal;
  c.registerService('metrics', { purposes: f.config.services[0].purposeIds, start(context) { starts++; signal = context.signal; if (starts === 1) { started.resolve(); return first.promise; } return () => { stops++; }; } });
  c.acceptAll(); await started.promise; c.rejectAll(); assert.equal(signal.aborted, true); c.acceptAll();
  first.resolve(() => { stops++; return cleanupDone.promise; }); await Promise.resolve(); await Promise.resolve(); assert.equal(starts, 1);
  cleanupDone.resolve(); await c.settled(); assert.equal(starts, 2); assert.equal(stops, 1); c.destroy(); await c.settled(); assert.equal(stops, 2);
});

// @requirements REQ-EU-DEVICE REQ-EU-CONSENT
test('throwing start, invalid cleanup, and rejected cleanup require reload and never silently retry', async () => {
  for (const behavior of ['throw', 'missing', 'cleanup']) {
    const f = await setup(); const c = createConsent(f.config, f.environment); let starts = 0;
    c.registerService('metrics', { purposes: f.config.services[0].purposeIds, start() { starts++; if (behavior === 'throw') throw new Error('unsafe start'); if (behavior === 'missing') return undefined; return () => Promise.reject(new Error('unsafe cleanup')); } });
    c.acceptAll(); await c.settled(); if (behavior === 'cleanup') { c.rejectAll(); await c.settled(); }
    assert.equal(c.getSnapshot().services.metrics, 'reload-required'); c.rejectAll(); c.acceptAll(); await c.settled(); assert.equal(starts, 1); c.destroy(); await c.settled();
  }
});

// @requirements REQ-EU-DEVICE REQ-EU-CONSENT
test('destroy during async start aborts immediately and runs late cleanup without restarting', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment); const first = deferred(); const started = deferred(); let signal; let stops = 0;
  c.registerService('metrics', { purposes: f.config.services[0].purposeIds, start(context) { signal = context.signal; started.resolve(); return first.promise; } });
  c.acceptAll(); await started.promise; c.destroy(); assert.equal(signal.aborted, true); first.resolve(() => { stops++; }); await c.settled(); assert.equal(stops, 1); assert.equal(c.isAllowed(f.config.purposes[0].id), false); assert.throws(() => c.acceptAll(), /destroyed/);
});

// @requirements REQ-EU-FAIR-CHOICE REQ-EU-CONSENT
test('dismissal has its own lifetime, changes no permissions, and preferences opening creates no choice', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment);
  c.openPreferences(); assert.equal(f.values.size, 0); c.closePreferences(); c.dismiss(); assert.equal(c.getSnapshot().shouldPrompt, false); assert.equal(c.isAllowed(f.config.purposes[0].id), false);
  f.advance(11 * 60000); assert.equal(c.getSnapshot().shouldPrompt, true); c.rejectAll(); f.advance(DAY); assert.equal(c.getSnapshot().shouldPrompt, false); c.destroy();
});

// @requirements REQ-EU-DEVICE REQ-EU-FAIR-CHOICE REQ-PRODUCT-CONFIG
test('configuration, choices, and lifecycle declarations cannot mint grants through unknown or omitted IDs', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment);
  assert.throws(() => c.choose({}), /every/); assert.throws(() => c.choose({ ...Object.fromEntries(f.config.purposes.map(p=>[p.id,true])), unknown:true }), /every/);
  assert.throws(() => c.registerService('unknown', { purposes: [], start: () => () => {} }), /declared/);
  assert.throws(() => c.registerService('metrics', { purposes: [f.config.purposes[0].id], start: () => () => {} }), /declared/);
  const missing = structuredClone(f.config); missing.consent.services = []; assert.equal(validateSiteConfig(missing).valid, false);
  const malformed = structuredClone(f.config); malformed.consent.purposes = [null]; assert.equal(validateSiteConfig(malformed).valid, false);
  const privateConfig = structuredClone(f.config); privateConfig.consent.services[0].secret = 'never-public'; assert.equal(JSON.stringify(toPublicConfig(privateConfig)).includes('never-public'), false); c.destroy();
  const oversized = structuredClone(f.config); oversized.purposes[0].description = 'a'.repeat(65536); assert.throws(() => createConsent(oversized, f.environment), /record limit/);
});

// @requirements REQ-EU-DEVICE REQ-PRODUCT-CONFIG
test('caller mutations and subscriber errors cannot alter active scope or prevent rejection', async () => {
  const f = await setup(); const c = createConsent(f.config, f.environment); const purpose = f.config.purposes[0].id;
  c.subscribe(() => { throw new Error('observer'); }); const copy = c.getConfig(); copy.consent.purposes.length = 0; f.config.consent.services.length = 0;
  const snap = c.getSnapshot(); snap.purposes[purpose] = 'granted'; assert.equal(c.isAllowed(purpose), false);
  c.acceptAll(); assert.equal(c.isAllowed(purpose), true); c.rejectAll(); assert.equal(c.isAllowed(purpose), false); c.destroy();
});

// @requirements REQ-EU-FAIR-CHOICE REQ-EU-DEVICE
test('dismissal cannot commit a failed grant or overwrite a newer cross-tab withdrawal', async () => {
  const f = await setup(); const write = f.storage.setItem; const c = createConsent(f.config, f.environment); let starts = 0;
  c.registerService('metrics', { purposes: f.config.services[0].purposeIds, start() { starts++; return () => {}; } });
  f.storage.setItem = () => { throw new Error(); }; c.acceptAll(); f.storage.setItem = write;
  c.dismiss(); await c.settled(); assert.equal(c.isAllowed(f.config.purposes[0].id), false); assert.equal(starts, 0);
  c.acceptAll(); await c.settled();
  const newer = createConsent(f.config, f.environment); newer.rejectAll(); const refusal = f.values.get(f.key);
  c.dismiss(); await c.settled(); assert.equal(f.values.get(f.key), refusal); assert.equal(c.isAllowed(f.config.purposes[0].id), false); c.destroy(); newer.destroy();
});

// @requirements REQ-EU-DEVICE REQ-EU-CONSENT
test('permission expiring before the queued loader starts prevents invocation', async () => {
  const f = await setup(); let clock = 100000000; const c = createConsent(f.config, { ...f.environment, now:()=>clock }); let starts = 0;
  c.registerService('metrics', { purposes: f.config.services[0].purposeIds, start() { starts++; return () => {}; } });
  c.acceptAll(); clock += DAY + 1; await c.settled(); assert.equal(starts, 0); c.destroy();
});

// @requirements REQ-EU-DEVICE REQ-EU-CONSENT
test('throwing environment disposers cannot prevent abort and service cleanup on destroy', async () => {
  const f = await setup(); let signal; let stops = 0;
  const c = createConsent(f.config, { ...f.environment, schedule:()=>()=>{throw new Error();}, subscribe:()=>()=>{throw new Error();} });
  c.registerService('metrics', { purposes:f.config.services[0].purposeIds, start(context) { signal = context.signal; return ()=>{stops++;}; } });
  c.acceptAll(); await c.settled(); c.destroy(); assert.equal(signal.aborted, true); await c.settled(); assert.equal(stops,1);
});
