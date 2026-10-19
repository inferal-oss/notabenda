/** Synthetic fixtures for local previews/tests only. No authentication implementation. */
export const syntheticRecords = [
  { id: '2026-10-18/choice-0042', data: { kind: 'consent-choice', occurredAt: '2026-10-18T14:32:00Z', subjectId: 'subject-4z2', siteId: 'demo-site', documentVersion: 'privacy-2', purposeChoices: { necessary: true, analytics: false, personalization: false }, provenance: { source: 'settings-panel', policyArtifact: 'synthetic-release-reference' }, retention: 'Example retention declaration; replace with the actual schedule.' } },
  { id: '2026-10-18/request-0008', data: { kind: 'rights-request', occurredAt: '2026-10-18T13:15:00Z', subjectId: 'subject-7k1', siteId: 'demo-site', requestType: 'access', status: 'received', provenance: { source: 'host-application' } } },
  { id: '2026-10-17/choice-0041', data: { kind: 'consent-choice', occurredAt: '2026-10-17T18:07:00Z', subjectId: 'subject-4z2', siteId: 'demo-site', documentVersion: 'privacy-1', purposeChoices: { necessary: true, analytics: true }, provenance: { source: 'settings-panel' } } },
  { id: '2026-10-17/delivery-0017', data: { kind: 'notice-delivery', occurredAt: '2026-10-17T16:40:00Z', subjectId: 'subject-2m9', siteId: 'demo-site', documentVersion: 'terms-1', channel: 'in-product', provenance: { source: 'host-application', status: 'recorded' } } },
];

/** In-memory DO-storage-shaped fake. Its transaction queue is for testing, not persistent production storage. */
export function createSyntheticStorage(records = syntheticRecords, prefix = 'evidence/demo-site/') {
  const compare = (left, right) => {
    const a = new TextEncoder().encode(left); const b = new TextEncoder().encode(right);
    for (let n = 0; n < Math.min(a.length, b.length); n++) if (a[n] !== b[n]) return a[n] - b[n];
    return a.length - b.length;
  };
  const values = new Map(records.map(record => [prefix + record.id, structuredClone(record.data)]));
  let queue = Promise.resolve();
  const storage = {
    async get(key) { return structuredClone(values.get(key)); },
    async put(key, value) { values.set(key, structuredClone(value)); },
    async delete(key) { return values.delete(key); },
    async list({ prefix, startAfter, limit }) {
      return new Map([...values.entries()].filter(([key]) => key.startsWith(prefix) && (startAfter === undefined || compare(key, startAfter) > 0)).sort(([a], [b]) => compare(a,b)).slice(0, limit).map(([key, value]) => [key, structuredClone(value)]));
    },
    async transaction(callback) {
      const run = queue.then(async () => {
        const snapshot = new Map([...values].map(([key, value]) => [key, structuredClone(value)]));
        const transaction = {
          async get(key) { return structuredClone(snapshot.get(key)); },
          async put(key, value) { snapshot.set(key, structuredClone(value)); },
          async delete(key) { return snapshot.delete(key); },
          async list({prefix,startAfter,limit}) {return new Map([...snapshot].filter(([key])=>key.startsWith(prefix)&&(startAfter===undefined||compare(key,startAfter)>0)).sort(([a],[b])=>compare(a,b)).slice(0,limit).map(([key,value])=>[key,structuredClone(value)]));},
        };
        const result = await callback(transaction);
        values.clear(); for (const [key, value] of snapshot) values.set(key, value);
        return result;
      });
      queue = run.then(() => undefined, () => undefined);
      return run;
    },
  };
  return storage;
}
