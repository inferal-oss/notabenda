// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
import type {ConsentRuntimeInventory} from './consent-runtime-config.js';
import type {RequiredConsentEvidence} from './consent-evidence-factory.js';
import type {ConsentNotice} from './consent-notice.js';
import type {ConsentEvidenceSnapshot} from './consent-evidence.js';
import type {ScopeGuardDecision} from './scope-guards.js';
import type {PrivacySignalSnapshot} from './privacy-signal-policy.js';
import type {ProcessingChoicesController,ProcessingChoicesSnapshot} from './processing-choices.js';
import type {PromptPolicyDecision} from './prompt-policy.js';
export type ChoiceStatus = 'unknown' | 'granted' | 'denied' | 'withdrawn' | 'expired';
// @requirements REQ-PRODUCT-CONNECTION-INSPECTION
export type ServiceRegistration = 'missing' | 'registered' | 'removed';
export type ServiceStatus = 'blocked' | 'starting' | 'active' | 'stopping' | 'reload-required';
export interface ConsentSnapshot {
  purposes: Record<string, ChoiceStatus>;
  /** @requirements REQ-PRODUCT-REACT Pure effective permission; saved grants may still await required evidence. */
  permissions: Record<string, boolean>;
  /** Cookie permission plus independent declared processing restrictions; runtime phase is separate. */
  servicePermissions: Record<string, boolean>;
  privacySignals?: PrivacySignalSnapshot;
  processingChoices?:ProcessingChoicesSnapshot;
  services: Record<string, ServiceStatus>;
  shouldPrompt: boolean;
  scopeGuards:ScopeGuardDecision;
  preferencesOpen: boolean;
  persistence: 'available' | 'unavailable';
  destroyed: boolean;
  evidence?: ConsentEvidenceSnapshot;
  /** @requirements REQ-IT-REPROMPT Solicitation only; independent of saved/effective permission. */
  promptDecision?: PromptPolicyDecision;
}
export interface ConsentOptions { evidence?:RequiredConsentEvidence; globalPrivacyControl?:boolean;processingChoices?:ProcessingChoicesController }
export interface ChoiceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface ConsentEnvironment {
  /** Host test/platform adapter. Missing falls back to the browser reader; only boolean true is a signal. */
  globalPrivacyControl?:()=>unknown;
  storage?: ChoiceStorage;
  now?: () => number;
  /** Call on storage changes, pageshow, and resume from background. Return an unsubscribe function. */
  subscribe?: (key: string, refresh: () => void) => () => void;
  schedule?: (callback: () => void, delayMs: number) => () => void;
}
export interface ServiceLifecycle {
  purposes: readonly string[];
  start(context: { signal: AbortSignal }): (() => void | Promise<void>) | Promise<() => void | Promise<void>>;
}
export interface ConsentStateController<Config extends ConsentRuntimeInventory = ConsentRuntimeInventory> {
  getSnapshot(): ConsentSnapshot;
  getConfig(): Config;
  /** Read-only enrollment inspection; registration alone proves no resource behavior. */
  getServiceRegistrations(): Record<string, ServiceRegistration>;
  getNotice(): ConsentNotice|undefined;
  subscribe(listener: (state: ConsentSnapshot) => void): () => void;
  choose(choices: Record<string, boolean>): { persisted: boolean };
  acceptAll(): { persisted: boolean };
  rejectAll(): { persisted: boolean };
  dismiss(): void;
  openPreferences(): void;
  closePreferences(): void;
  isAllowed(purposeId: string): boolean;
  isServiceAllowed(serviceId:string):boolean;
  registerService(serviceId: string, lifecycle: ServiceLifecycle): () => void;
  refresh(): void;
  refreshEvidence(): Promise<void>;
  retryEvidence(): Promise<void>;
  settled(): Promise<void>;
  destroy(): void;
}

/** Primary controller exposes only the compiled cookie inventory. */
export interface ConsentController extends ConsentStateController {}
