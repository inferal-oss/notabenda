/** @requirements REQ-PRODUCT-EVIDENCE-EXPORT */
/** @requirements REQ-PRODUCT-CF-ADMIN */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export interface EvidenceRecord { id: string; data: JsonValue }
export interface RecordQuery {
  query: string;
  kind: string;
  from: string;
  to: string;
  keyPrefix: string;
  limit: number;
  after?: string;
}
export interface RecordPage {
  records: EvidenceRecord[];
  /** Last examined key, relative to this store's fixed scope. Not a DO identifier. */
  nextAfter?: string;
  /** Work examined in this segment, not a total or a count of all matching records. */
  scanned?: number;
}
/** A host-created store must already be restricted to the caller's authorized scope. */
export interface RecordStore {
  list(query: RecordQuery): Promise<RecordPage>;
  get(id: string): Promise<EvidenceRecord | undefined>;
  /** Optional, separately requested source inspection within this same host-authorized store scope. */
  getSource?(releaseId:string,kind:'privacy'|'cookies'|'terms'):Promise<EvidenceRecord|undefined>;
}
/** Minimal structural subset of the asynchronous Durable Object storage API. */
export interface DurableStorage {
  list<T = unknown>(options: { prefix: string; startAfter?: string; limit: number }): Promise<Map<string, T>>;
  get<T = unknown>(key: string): Promise<T | undefined>;
}
export interface AuthorizationGrant {
  store: RecordStore;
  /** Display only; this string never selects a tenant, namespace, or storage prefix. */
  scopeLabel?: string;
  /** Explicit per-request bulk-read permission. Omitted/false disables both export routes. */
  allowExport?: boolean;
}
export interface ExecutionContextLike { waitUntil(promise: Promise<unknown>): void }
/** Navigation is presentation only. Every destination must authorize its own requests. */
export interface AdminNavigationItem {label:string;href:string}
export interface AdminPresentation {
  navigation?:readonly AdminNavigationItem[];
  workspaceLabel?:string;
  workspaceNote?:string;
}
export interface AdminWorkerOptions<Env> extends AdminPresentation {
  /** Mandatory: verify the host's identity and permission on EVERY request. */
  authorize(request: Request, env: Env, context?: ExecutionContextLike): Promise<AuthorizationGrant | null> | AuthorizationGrant | null;
  basePath?: string;
  title?: string;
}
export interface AdminWorker<Env> {
  fetch(request: Request, env: Env, context?: ExecutionContextLike): Promise<Response>;
}
