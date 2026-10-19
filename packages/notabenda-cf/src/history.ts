// @requirements REQ-PRODUCT-SERVICE-CATALOG
import {normalizeCatalogReleaseReview,normalizeCatalogReviewDescriptor} from './catalog-release-policy.js';
// @requirements REQ-PRODUCT-SCOPE-GUARDS
import {normalizeScopeGuardPolicy} from './scope-guard-policy.js';
import { boundedText, normalizeRecord } from './records.js';
import { createDurableObjectStore } from './store.js';
import type { DurableStorage, JsonValue, RecordStore } from './types.js';

export interface HistoryTransaction {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}
export interface HistoryStorage extends DurableStorage {
  transaction<T>(callback: (transaction: HistoryTransaction) => Promise<T>): Promise<T>;
}
export interface ReleaseMetadata { changeNote?: string; recordedAt?: string; actor?: string }
export interface HistoryOptions { prefix?: string }
const DEFAULT_PREFIX = 'notabenda/releases/';
const MAX_ARCHIVE_BYTES = 128 * 1024;
export const canonicalJson = (value: JsonValue): string => value && typeof value === 'object'
  ? Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]` : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key]!)}`).join(',')}}`
  : JSON.stringify(value);
export async function sha256(value: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function object(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid legal artifact.');
  return value;
}
const hash = (value: JsonValue | undefined): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);

export async function validateLegalArtifact(input: unknown): Promise<Record<string, JsonValue>> {
  const artifact = object(normalizeRecord({ id: 'artifact', data: input }, MAX_ARCHIVE_BYTES).data);
  if (Object.keys(artifact).some(key => !['manifest','publicConfig','pages','documents','renderedBodies'].includes(key))) throw new Error('Invalid legal artifact fields.');
  const manifest = object(artifact.manifest);
  if (!hash(manifest.artifactId) || typeof manifest.siteId !== 'string' || manifest.schemaVersion !== 1 || !['production','preview'].includes(String(manifest.mode))) throw new Error('Invalid artifact identity.');
  if(manifest.catalogReview!==undefined)normalizeCatalogReviewDescriptor(manifest.catalogReview);
  const descriptor = { ...manifest }; delete descriptor.artifactId;
  if (await sha256(canonicalJson(descriptor)) !== manifest.artifactId) throw new Error('Artifact identity does not match its manifest.');
  const pages = object(artifact.pages); const documents = object(artifact.documents);
  if (!Array.isArray(manifest.documents) || manifest.documents.length !== 3 || Object.keys(documents).length !== 3 || Object.keys(pages).length !== 3) throw new Error('Expected three legal documents.');
  const kinds = new Set<string>();
  const bodies=artifact.renderedBodies===undefined?{}:object(artifact.renderedBodies);
  const authored=new Set<string>();
  for (const value of manifest.documents) {
    const item = object(value);
    if (typeof item.kind !== 'string' || !['privacy','cookies','terms'].includes(item.kind) || kinds.has(item.kind) || typeof item.file !== 'string' || typeof item.version !== 'string' || !hash(item.sha256)) throw new Error('Invalid document descriptor.');
    kinds.add(item.kind);
    const page = pages[item.file]; const doc = object(documents[item.kind]);
    if (typeof page !== 'string' || await sha256(page) !== item.sha256 || doc.kind !== item.kind || doc.version !== item.version || !Array.isArray(doc.sections)) throw new Error('Artifact document does not match its descriptor.');
    for (const key of ['title','route','effectiveDate','reviewStatus','requirementIds']) if (doc[key] === undefined || item[key] === undefined || canonicalJson(doc[key]) !== canonicalJson(item[key])) throw new Error('Artifact document metadata does not match its descriptor.');
    if (!hash(item.contentSha256) || typeof doc.title !== 'string' || await sha256(canonicalJson({ title: doc.title, sections: doc.sections })) !== item.contentSha256) throw new Error('Document content hash does not match.');
    if(item.authoring!==undefined){
      const a=object(item.authoring);authored.add(item.kind);
      if(Object.keys(a).sort().join(',')!==['schemaVersion','format','sourceSha256','sourceBytes','bodySha256','renderer','policy','componentsRevision'].sort().join(',')||a.schemaVersion!==1||typeof a.format!=='string'||!['md','mdx'].includes(a.format)||!hash(a.sourceSha256)||!hash(a.bodySha256)||!Number.isSafeInteger(a.sourceBytes)||Number(a.sourceBytes)<1||Number(a.sourceBytes)>24576||a.renderer!=='notabenda-authoring@0.1.0'||a.policy!=='static-html-v1'||!boundedText(a.componentsRevision,200)||!a.componentsRevision.trim())throw new Error('Invalid authoring descriptor.');
      const body=bodies[item.kind];
      if(typeof body!=='string'||await sha256(body)!==a.bodySha256||!page.includes(`<div class="nb-authored" data-body-sha256="${a.bodySha256}">${body}</div>`))throw new Error('Authored body does not match the public document.');
    }
  }
  if(Object.keys(bodies).length!==authored.size||Object.keys(bodies).some(kind=>!authored.has(kind)))throw new Error('Unexpected authored body.');
  if (manifest.configSha256 !== undefined && (!hash(manifest.configSha256) || artifact.publicConfig === undefined || await sha256(canonicalJson(artifact.publicConfig)) !== manifest.configSha256)) throw new Error('Public configuration hash does not match.');
  if(artifact.publicConfig!==undefined){const config=object(artifact.publicConfig);if(config.scopeGuards!==undefined){if(!Array.isArray(config.purposes))throw new Error('Scope guards require declared purposes.');normalizeScopeGuardPolicy(config.scopeGuards,config.purposes.map(p=>String(object(p).id)));}}
  return artifact;
}

/** @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-CF-HISTORY
 * Public validation and private-source validation are separate contracts. Every declared source is required here.
 */
export async function validateLegalSourceArchive(input:unknown):Promise<{artifact:Record<string,JsonValue>;sourceAttachments:Record<string,JsonValue>;catalogReview?:Record<string,JsonValue>}> {
  const value=object(normalizeRecord({id:'archive',data:input},MAX_ARCHIVE_BYTES).data);
  const envelope=value.schemaVersion===1&&value.artifact!==undefined;
  if(envelope&&(!Object.hasOwn(value,'sourceAttachments')||Object.keys(value).some(k=>!['schemaVersion','artifact','sourceAttachments','catalogReview'].includes(k))))throw new Error('Invalid private archive envelope.');
  const artifact=await validateLegalArtifact(envelope?value.artifact:input);
  const sources=envelope?object(value.sourceAttachments):{};
  const descriptors=object(artifact.manifest).documents as JsonValue[];
  const authored=descriptors.map(object).filter(d=>d.authoring!==undefined);
  if(Object.keys(sources).length!==authored.length||Object.keys(sources).some(kind=>!authored.some(d=>d.kind===kind)))throw new Error('Private archive must contain exactly the declared source attachments.');
  for(const d of authored){
    const source=object(sources[String(d.kind)]);const descriptor=object(d.authoring);
    if(Object.keys(source).sort().join(',')!=='format,source'||source.format!==descriptor.format||typeof source.source!=='string'||new TextEncoder().encode(source.source).length!==descriptor.sourceBytes||await sha256(source.source)!==descriptor.sourceSha256)throw new Error('Private authored source does not match its descriptor.');
  }
  const catalogReview=envelope&&value.catalogReview!==undefined?object(value.catalogReview):undefined;
  const descriptor=object(artifact.manifest).catalogReview;
  if((descriptor===undefined)!==(catalogReview===undefined))throw Error('Private catalog review must match the declared release attachment.');
  if(catalogReview!==undefined){
    const d=normalizeCatalogReviewDescriptor(descriptor),review=normalizeCatalogReleaseReview(catalogReview,artifact.publicConfig);
    if(await sha256(canonicalJson(catalogReview))!==d.sha256||review.selections.length!==d.selectionCount)throw Error('Catalog review does not match its release descriptor.');
  }
  return {artifact,sourceAttachments:sources,...(catalogReview===undefined?{}:{catalogReview})};
}

export async function validateStoredLegalRelease(input:unknown):Promise<Record<string,JsonValue>> {
  const release=object(normalizeRecord({id:'release',data:input},MAX_ARCHIVE_BYTES).data);
  if(release.kind!=='document-release')throw new Error('Invalid release record.');
  const archive=release.sourceAttachments===undefined&&release.catalogReview===undefined?release.artifact:{schemaVersion:1,artifact:release.artifact!,sourceAttachments:release.sourceAttachments??{},...(release.catalogReview===undefined?{}:{catalogReview:release.catalogReview})};
  return (await validateLegalSourceArchive(archive)).artifact;
}

/** @requirements REQ-PRODUCT-CF-HISTORY: explicit host write, atomic immutable archive; no publication or acceptance. */
export async function recordLegalRelease(storage: HistoryStorage, input: unknown, metadata: ReleaseMetadata = {}, options: HistoryOptions = {}): Promise<{ id: string; created: boolean }> {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  createDurableObjectStore(storage, { prefix }); // Use the same scope validation for reads and writes.
  if (typeof storage.transaction !== 'function') throw new Error('Atomic storage transactions are required.');
  if (metadata.changeNote !== undefined && !boundedText(metadata.changeNote, 2000) || metadata.actor !== undefined && !boundedText(metadata.actor, 200) || metadata.recordedAt !== undefined && (!boundedText(metadata.recordedAt, 64) || !/^\d{4}-\d{2}-\d{2}T/u.test(metadata.recordedAt) || !Number.isFinite(Date.parse(metadata.recordedAt)))) throw new Error('Invalid release metadata.');
  const {artifact,sourceAttachments,catalogReview}=await validateLegalSourceArchive(input);
  const id = object(artifact.manifest).artifactId as string;
  const release: Record<string, JsonValue> = { kind: 'document-release', artifact, ...(Object.keys(sourceAttachments).length?{sourceAttachments}:{}), ...(catalogReview===undefined?{}:{catalogReview}), ...(metadata.changeNote === undefined ? {} : { changeNote: metadata.changeNote }), ...(metadata.actor === undefined ? {} : { actor: metadata.actor }), ...(metadata.recordedAt === undefined ? {} : { recordedAt: metadata.recordedAt }) };
  const serialized = canonicalJson(release);
  if (new TextEncoder().encode(serialized).length > MAX_ARCHIVE_BYTES) throw new Error('Legal release exceeds the 128 KiB archive limit.');
  return storage.transaction(async transaction => {
    const existing = await transaction.get(prefix + id);
    if (existing !== undefined) {
      const previous = normalizeRecord({ id, data: existing }, MAX_ARCHIVE_BYTES).data;
      if (canonicalJson(previous) !== serialized) throw new Error('An immutable release with this ID already exists with different content or metadata.');
      return { id, created: false };
    }
    await transaction.put(prefix + id, release);
    return { id, created: true };
  });
}

function projection(value: unknown, id: string): JsonValue {
  const release = object(normalizeRecord({ id: 'release', data: value }, MAX_ARCHIVE_BYTES).data);
  const artifact = object(release.artifact); const manifest = object(artifact.manifest);
  if (release.kind !== 'document-release' || !hash(manifest.artifactId) || manifest.artifactId !== id) throw new Error('Invalid release record.');
  return {
    kind: 'document-release', artifactId: manifest.artifactId, siteId: manifest.siteId!,
    documents: artifact.documents!, manifest,
    ...(release.catalogReview===undefined?{}:{hasCatalogReview:true}),
    ...(release.sourceAttachments===undefined?{}:{sourceKinds:Object.keys(object(release.sourceAttachments))}),
    ...(release.recordedAt === undefined ? {} : { occurredAt: release.recordedAt }),
    ...(release.actor === undefined ? {} : { actor: release.actor }),
    ...(release.changeNote === undefined ? {} : { changeNote: release.changeNote }),
  };
}

/** Read-only archive projection. Exact HTML/configuration stay in storage and are never used as executable UI. */
export function createDocumentHistory(storage: DurableStorage, options: HistoryOptions & { scanLimit?: number } = {}): RecordStore {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const projectedStorage: DurableStorage = {
    async get<T>(key: string) { const value = await storage.get(key); return (value === undefined ? undefined : projection(value, key.slice(prefix.length))) as T | undefined; },
    async list<T>(query: { prefix: string; startAfter?: string; limit: number }) {
      const result = await storage.list(query);
      return new Map([...result].map(([key, value]) => [key, projection(value, key.slice(prefix.length)) as T]));
    },
  };
  const store=createDurableObjectStore(projectedStorage, { prefix, ...(options.scanLimit === undefined ? {} : { scanLimit: options.scanLimit }) });
  return {...store,async getCatalogReview(releaseId){
    if(!/^[a-f0-9]{64}$/u.test(releaseId))throw Error('Invalid catalog review reference.');
    const raw=await storage.get(prefix+releaseId);if(raw===undefined)return undefined;
    const release=object(normalizeRecord({id:releaseId,data:raw},MAX_ARCHIVE_BYTES).data),artifact=await validateStoredLegalRelease(release),manifest=object(artifact.manifest);
    if(manifest.artifactId!==releaseId)throw Error('Invalid release identity.');
    if(release.catalogReview===undefined)return undefined;
    return normalizeRecord({id:releaseId,data:{kind:'catalog-release-review-record',artifactId:releaseId,siteId:manifest.siteId!,descriptor:manifest.catalogReview!,catalogReview:release.catalogReview}});
  },async getSource(releaseId,kind){
    if(!/^[a-f0-9]{64}$/u.test(releaseId)||!['privacy','cookies','terms'].includes(kind))throw new Error('Invalid source reference.');
    const raw=await storage.get(prefix+releaseId);if(raw===undefined)return undefined;
    const release=object(normalizeRecord({id:releaseId,data:raw},MAX_ARCHIVE_BYTES).data);
    const artifact=await validateStoredLegalRelease(release);const manifest=object(artifact.manifest);
    if(manifest.artifactId!==releaseId)throw new Error('Invalid release identity.');
    const sources=release.sourceAttachments===undefined?{}:object(release.sourceAttachments);if(sources[kind]===undefined)return undefined;
    const source=object(sources[kind]);const descriptor=object((manifest.documents as JsonValue[]).find(value=>object(value).kind===kind));
    return normalizeRecord({id:`${releaseId}/${kind}`,data:{kind:'document-source',artifactId:releaseId,siteId:manifest.siteId!,documentKind:kind,documentVersion:descriptor.version!,title:descriptor.title!,authoring:descriptor.authoring!,format:source.format!,source:source.source!}});
  }};
}

/** Structured text comparison; not a determination of materiality, acceptance, or consent validity. */
export function documentSections(record: { data: JsonValue }, kind: string): { id: string; heading: string; text: string; comparison: string }[] {
  const data = object(record.data);
  if (data.kind !== 'document-release') throw new Error('Choose document-release records.');
  const doc = object(object(data.documents)[kind]);
  if (!Array.isArray(doc.sections)) throw new Error('Invalid archived document.');
  const ids = new Set<string>();
  return doc.sections.map(value => {
    const section = object(value);
    if (typeof section.id !== 'string' || typeof section.heading !== 'string' || ids.has(section.id)) throw new Error('Invalid archived section.');
    ids.add(section.id);
    // Compare every field independently of presentation, including future section types.
    const fields = Object.fromEntries(Object.entries(section).filter(([key]) => key !== 'id'));
    const text = Object.entries(fields).map(([key, value]) => {
      if (key === 'heading' && typeof value === 'string') return value;
      if (['paragraphs', 'items'].includes(key) && Array.isArray(value) && value.every(item => typeof item === 'string')) return value.map(item => `${key === 'items' ? '• ' : ''}${item}`).join('\n\n');
      if (key === 'links' && Array.isArray(value) && value.every(item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.label === 'string' && typeof item.href === 'string' && Object.keys(item).every(name => ['label', 'href'].includes(name)))) return value.map(item => { const link = object(item); return `${link.label}: ${link.href}`; }).join('\n');
      if (key === 'table' && value && typeof value === 'object' && !Array.isArray(value) && typeof value.caption === 'string' && Array.isArray(value.columns) && value.columns.every(column => typeof column === 'string') && Array.isArray(value.rows) && value.rows.every(row => Array.isArray(row) && row.length === (value.columns as JsonValue[]).length && row.every(cell => typeof cell === 'string')) && Object.keys(value).every(name => ['caption', 'columns', 'rows'].includes(name))) {
        const columns = value.columns as string[];
        return `${value.caption}\n\n${(value.rows as string[][]).map((row, index) => `Entry ${index + 1}\n${row.map((cell, column) => `${columns[column]}: ${cell}`).join('\n')}`).join('\n\n')}`;
      }
      return `${key}: ${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`;
    }).join('\n\n');
    return { id: section.id, heading: section.heading, text, comparison: canonicalJson(fields) };
  });
}
