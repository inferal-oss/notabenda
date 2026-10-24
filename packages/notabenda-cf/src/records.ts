// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE REQ-PRODUCT-FORM-PERMISSIONS
import type { EvidenceRecord, JsonValue, RecordQuery } from './types.js';

export const MAX_RECORD_BYTES = 65_536;
export const MAX_PAGE_SIZE = 50;
const encoder = new TextEncoder();
export function boundedText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max && encoder.encode(value).length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
}
export function validId(value: unknown): value is string { return boundedText(value, 512) && value.length > 0; }

/** @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-EVIDENCE-EXPORT REQ-PRODUCT-SAFE-CONTENT
 * Copy own JSON values before inspection, without invoking getters or array iterators. */
export function normalizeRecord(value: unknown, maxBytes = MAX_RECORD_BYTES): EvidenceRecord {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid inspection limit.');
  if (!value || typeof value !== 'object') throw new Error('Invalid record.');
  const id = Object.getOwnPropertyDescriptor(value, 'id'), body = Object.getOwnPropertyDescriptor(value, 'data');
  if (!id || !('value' in id) || !validId(id.value) || !body || !('value' in body)) throw new Error('Invalid record.');
  let budget = maxBytes;
  let nodes = 0;
  const active = new Set<object>();
  function copy(input: unknown, depth: number): JsonValue {
    if (++nodes > 10_000 || depth > 20 || budget < 0) throw new Error('Record exceeds inspection limits.');
    if (input === null || typeof input === 'boolean') { budget -= 5; return input; }
    if (typeof input === 'number' && Number.isFinite(input)) { budget -= 32; return input; }
    if (typeof input === 'string') {
      if (input.length > maxBytes) throw new Error('Record exceeds inspection limits.');
      budget -= encoder.encode(JSON.stringify(input)).length;
      if (budget < 0) throw new Error('Record exceeds inspection limits.');
      return input;
    }
    if (!input || typeof input !== 'object' || active.has(input)) throw new Error('Record is not JSON.');
    active.add(input);
    let result: JsonValue;
    if (Array.isArray(input)) {
      if (input.length > 10_000) throw new Error('Record exceeds inspection limits.');
      budget -= input.length + 2;
      if (budget < 0) throw new Error('Record exceeds inspection limits.');
      const array: JsonValue[] = [];
      for (let index = 0; index < input.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
        if (!descriptor || !('value' in descriptor)) throw new Error('Record is not JSON.');
        array.push(copy(descriptor.value, depth + 1));
      }
      result = array;
    } else {
      if (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null) throw new Error('Record is not JSON.');
      const keys = Object.keys(input);
      if (keys.length > 10_000) throw new Error('Record exceeds inspection limits.');
      const object: { [key: string]: JsonValue } = Object.create(null) as { [key: string]: JsonValue };
      for (const key of keys) {
        if (key.length > maxBytes) throw new Error('Record exceeds inspection limits.');
        budget -= encoder.encode(JSON.stringify(key)).length + 2;
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        if (!descriptor || !('value' in descriptor)) throw new Error('Record is not JSON.');
        object[key] = copy(descriptor.value, depth + 1);
      }
      result = object;
    }
    active.delete(input);
    if (budget < 0) throw new Error('Record exceeds inspection limits.');
    return result;
  }
  const data = copy(body.value, 0);
  // The traversal budget bounds work; this exact check also counts structural JSON punctuation.
  if (encoder.encode(JSON.stringify(data)).length > maxBytes) throw new Error('Record exceeds inspection limits.');
  return { id: id.value, data };
}

export interface RecordFacts {
  kind?: string;
  occurredAt?: string;
  subject?: string;
  site?: string;
  version?: string;
  purposeChoices?: JsonValue;
  provenance?: JsonValue;
  retention?: JsonValue;
}
const object = (value: JsonValue | undefined): Record<string, JsonValue> => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const firstText = (...values: (JsonValue | undefined)[]): string | undefined => values.find((value): value is string => typeof value === 'string' && value.length > 0);

/** Optional field conventions, never inferred legal conclusions or authorization. */
export function recordFacts(record: EvidenceRecord): RecordFacts {
  const data = object(record.data);
  const document = object(data.document);
  const facts: RecordFacts = {};
  const texts = {
    kind: firstText(data.kind, data.type), occurredAt: firstText(data.occurredAt, data.timestamp, data.createdAt),
    subject: firstText(data.subjectId), site: firstText(data.siteId), version: firstText(data.documentVersion, document.version),
  };
  for (const [key, value] of Object.entries(texts)) if (value !== undefined) (facts as Record<string, JsonValue>)[key] = value;
  if (data.purposeChoices !== undefined || data.purposes !== undefined) facts.purposeChoices = data.purposeChoices ?? data.purposes!;
  if (data.provenance !== undefined) facts.provenance = data.provenance;
  // Cookie-choice expiry is permission expiry, not an evidence retention schedule.
  if (data.retention !== undefined || data.kind !== 'consent-choice' && data.expiresAt !== undefined) facts.retention = data.retention ?? data.expiresAt!;
  return facts;
}

/** Search aliases describe displayed lifecycle state, never identity or legal conclusions. */
function lifecycleSearchLabels(record:EvidenceRecord):string {
  const data=object(record.data);if(data.kind!=='evidence-lifecycle')return '';
  const labels:string[]=[];
  if(data.family==='consent')labels.push('cookie-choice evidence');
  if(data.family==='processing')labels.push('processing opt-out evidence');
  if(data.family==='terms')labels.push('terms agreement evidence');
  if(data.family==='permissions')labels.push('form permission evidence');
  if(data.family==='contracts')labels.push('contract declaration evidence');
  if(data.family==='orders')labels.push('paid order evidence');
  if(object(data.hold).active===true)labels.push('on hold held');
  if(data.phase==='purging')labels.push('retired purge pending');
  if(data.phase==='complete')labels.push('retired purge recorded complete');
  if(data.restoredAt!==null&&typeof data.restoredAt==='string')labels.push('restored manifest reapplied');
  return labels.join(' ');
}
export function matchesRecord(record: EvidenceRecord, query: RecordQuery): boolean {
  if (!record.id.startsWith(query.keyPrefix)) return false;
  const facts = recordFacts(record);
  if (query.kind && facts.kind?.toLocaleLowerCase('en') !== query.kind.toLocaleLowerCase('en')) return false;
  if (query.from || query.to) {
    const time = facts.occurredAt ? Date.parse(facts.occurredAt) : NaN;
    if (!Number.isFinite(time)) return false;
    const day = new Date(time).toISOString().slice(0, 10);
    if (query.from && day < query.from || query.to && day > query.to) return false;
  }
  const haystack = `${record.id}\n${JSON.stringify(record.data)}\n${lifecycleSearchLabels(record)}`.toLocaleLowerCase('en');
  return query.query.toLocaleLowerCase('en').split(/\s+/u).filter(Boolean).every(term => {
    if(term.startsWith('contract:')){
      const data=object(record.data),jobs=object(data.delivery),ack=object(jobs.acknowledgement),application=object(jobs.application);if(data.kind!=='contract-declaration')return false;
      return ({'contract:confirmation-pending':['pending','leased'].includes(ack.status as string),'contract:confirmation-uncertain':ack.status==='uncertain','contract:application-pending':['pending','leased'].includes(application.status as string),'contract:provider-accepted':ack.status==='accepted'&&application.status==='accepted'})[term]===true;
    }
    if(term.startsWith('permission:')) {
      const data=object(record.data),state=object(data.currentState);
      if(data.kind!=='form-permission')return false;
      return ({'permission:allowed':state.permitted===true,'permission:refused':state.permitted===false&&state.reason==='refused','permission:withdrawn':state.permitted===false&&state.reason==='withdrawn','permission:needs-choice':state.permitted===false&&state.reason==='offer-changed'})[term]===true;
    }
    if(!term.startsWith('lifecycle:'))return haystack.includes(term);
    const data=object(record.data);if(data.kind!=='evidence-lifecycle')return false;
    return ({'lifecycle:held':object(data.hold).active===true,'lifecycle:pending':data.phase==='purging','lifecycle:complete':data.phase==='complete','lifecycle:retained':data.phase==='retained','lifecycle:restored':typeof data.restoredAt==='string'})[term]===true;
  });
}
