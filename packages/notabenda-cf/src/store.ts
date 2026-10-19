import {compareRecordKeys} from './export.js';
import { MAX_PAGE_SIZE, boundedText, matchesRecord, normalizeRecord, validId } from './records.js';
import type { DurableStorage, EvidenceRecord, RecordQuery, RecordStore } from './types.js';

/** @requirements REQ-PRODUCT-CF-ADMIN */
export function createDurableObjectStore(storage: DurableStorage, options: { prefix: string; scanLimit?: number }): RecordStore {
  // A delimiter avoids scope overlap such as site-a and site-ab. Never take this option from an untrusted query.
  if (!options || !/^[a-zA-Z0-9][a-zA-Z0-9_:/-]{0,126}\/$/u.test(options.prefix) || options.prefix.includes('//') || options.prefix.includes('..')) throw new Error('Use a fixed nonempty storage prefix ending in /.');
  const prefix = options.prefix;
  const scanLimit = options.scanLimit ?? 200;
  if (!Number.isInteger(scanLimit) || scanLimit < 1 || scanLimit > 500) throw new Error('scanLimit must be between 1 and 500.');
  return {
    async get(id) {
      if (!validId(id)) throw new Error('Invalid record key.');
      const data = await storage.get(prefix + id);
      return data === undefined ? undefined : normalizeRecord({ id, data });
    },
    async list(query: RecordQuery) {
      if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > MAX_PAGE_SIZE || !boundedText(query.keyPrefix, 128) || (query.after !== undefined && (!validId(query.after) || !query.after.startsWith(query.keyPrefix)))) throw new Error('Invalid record query.');
      const records: EvidenceRecord[] = [];
      let after = query.after;
      let scanned = 0;
      while (scanned < scanLimit) {
        const size = Math.min(50, scanLimit - scanned);
        const batch = await storage.list({ prefix: prefix + query.keyPrefix, ...(after === undefined ? {} : { startAfter: prefix + after }), limit: size });
        if (!(batch instanceof Map) || batch.size > size) throw new Error('Invalid storage result.');
        for (const [key, data] of batch) {
          if (!key.startsWith(prefix + query.keyPrefix) || (after !== undefined && compareRecordKeys(key, prefix + after) <= 0)) throw new Error('Invalid storage result.');
          const id = key.slice(prefix.length);
          const record = normalizeRecord({ id, data });
          after = id;
          scanned++;
          if (matchesRecord(record, query)) records.push(record);
          // Conservative continuation avoids skipping fetched but unexamined keys.
          if (records.length === query.limit) return { records, nextAfter: after, scanned };
        }
        if (batch.size < size) return { records, scanned };
      }
      return { records, ...(after === undefined ? {} : { nextAfter: after }), scanned };
    },
  };
}
