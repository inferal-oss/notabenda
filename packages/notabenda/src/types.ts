import type {SiteLocalization} from './document-localization.js';
import type {ConsentInformation} from './consent-information.js';
export type {ConsentInformation,ConsentInformationLink} from './consent-information.js';
import type {GrantExpiryPolicy} from './grant-expiry-policy.js';
export type {GrantExpiryPolicy} from './grant-expiry-policy.js';
// @requirements REQ-UK-EXCEPTIONS
import type {StorageExceptionPolicy} from './storage-exception-policy.js';
export type {StorageExceptionPolicy,StorageExceptionEntry} from './storage-exception-policy.js';
// @requirements REQ-GOOGLE-MODE
import type {GoogleBasicConfig} from './google-basic-policy.js';
export type {GoogleBasicConfig,GoogleConsentType,GoogleConsentState} from './google-basic-policy.js';
// @requirements REQ-PRODUCT-RIGHTS-CENTER
import type {RightsCenterConfig} from './rights-policy.js';
export type {RightsCenterConfig,RightsActionKind} from './rights-policy.js';
// @requirements REQ-PRODUCT-SCOPE-GUARDS
import type {ScopeGuardPolicy} from './scope-guard-policy.js';
export type {ScopeGuardFact,ScopeGuardFacts,ScopeGuardPolicy} from './scope-guard-policy.js';
/** @requirements REQ-PRODUCT-CONFIG REQ-EU-NOTICE REQ-NZ-NOTICE */
export type DocumentKind = 'privacy' | 'cookies' | 'terms';
export type BuildMode = 'preview' | 'production';
export type RequirementId = `REQ-${string}`;
/** @requirements REQ-PRODUCT-PRIVACY-SIGNALS Operator classification, independent of device-access consent. */
export type ProcessingActivity = 'sale' | 'sharing' | 'targeted-advertising';

export interface Contact {
  name: string;
  email: string;
  address?: string;
}

export interface Purpose {
  id: string;
  name: string;
  description: string;
  legalBasis: string;
  dataCategories: string[];
  retention: string;
  collection: {
    source: 'direct' | 'indirect' | 'both';
    description: string;
    required: boolean;
    consequences: string;
  };
}

export interface Service {
  /** Explicit Basic-mode target/signal declarations, included in material consent scope. */
  googleBasic?:GoogleBasicConfig;
  id: string;
  name: string;
  provider: string;
  purposeIds: string[];
  location: string;
  privacyUrl?: string;
  /** @requirements REQ-PRODUCT-EMBEDS Declared initial media destinations; changes invalidate affected grants. */
  resourceOrigins?: string[];
  processingActivities?: ProcessingActivity[];
}

export interface StorageItem {
  id: string;
  name: string;
  type: 'cookie' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'other';
  serviceId: string;
  duration: string;
  classification: 'necessary' | 'optional' | 'exception';
  /** Stable declaration ID; exceptions are neither consent nor strictly necessary. */
  exceptionId?:string;
  necessityReason?: string;
}

/** Structured text only. Markup in strings is escaped, never executed. */
export interface LegalSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  items?: string[];
  links?: { label: string; href: string }[];
  table?: { caption: string; columns: string[]; rows: string[][] };
}

export interface DocumentConfig {
  title: string;
  route: string;
  version: string;
  effectiveDate: string;
  source: 'generated' | 'supplied';
  review: { status: 'draft' | 'reviewed' };
  sections?: LegalSection[];
}

/** @requirements REQ-IT-REPROMPT Explicit applicability, not a jurisdiction/compliance assertion. */
export interface PromptPolicy {
  profile: 'it-garante-2021';
  processingRevision: string;
  /** Exact prior revision eligible for the declared significant-change exception. Public notice copy. */
  materialChange?: { fromRevision: string; summary: string };
}

/** Explicit opt-in runtime scope. Lifetimes remain separate from solicitation rules. */
export interface ConsentConfig {
  /** @requirements REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
   * Optional public rights entry and browser-control guidance, archived with the notice. */
  information?:ConsentInformation;
  purposes: { id: string; scope: string }[];
  services: { id: string; scope: string }[];
  grantLifetimeDays: number;
  refusalLifetimeDays: number;
  dismissalMinutes: number;
  /** Explicit grant cap; independent of refusal memory and solicitation. */
  grantExpiryPolicy?:GrantExpiryPolicy;
  promptPolicy?: PromptPolicy;
}

export interface SiteConfig {
  schemaVersion: 1;
  site: { id: string; name: string; url: string; locale: string; description: string };
  localization?:SiteLocalization;
  controller: Contact & { address: string; representative?: Contact; dpo?: Contact };
  jurisdictions: string[];
  purposes: Purpose[];
  services: Service[];
  storage: StorageItem[];
  privacy: {
    rights: string[];
    rightsUrl?: string;
    complaints: { description: string; url?: string };
    transfers: string;
    automatedDecisions: string;
    requiredContacts?: ('representative' | 'dpo')[];
  };
  terms: { audience: 'business' | 'consumer' | 'mixed'; serviceType: 'informational' | 'service' | 'subscription' | 'commerce' | 'other' };
  documents: Record<DocumentKind, DocumentConfig>;
  consent?: ConsentConfig;
  rightsCenter?:RightsCenterConfig;
  /** Public operator scope declarations. Private reasoning belongs in private reports. */
  scopeGuards?:ScopeGuardPolicy;
  storageExceptions?:StorageExceptionPolicy;
  /** Explicit host policy; no location or legal applicability inference. */
  privacySignals?: {globalPrivacyControl:{appliesTo:ProcessingActivity[];explanation:string}};
  /** Operator-only information. Excluded from all rendered/compiled output. Never a place for runtime credentials. */
  private?: Record<string, unknown>;
}

export type PublicSiteConfig = Omit<SiteConfig, 'private'>;
export interface Diagnostic {
  code: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
  requirementIds: RequirementId[];
}
export interface ValidationOptions { mode?: BuildMode }
export interface ValidationResult { valid: boolean; diagnostics: Diagnostic[] }

export interface LegalDocument {
  kind: DocumentKind;
  title: string;
  route: string;
  version: string;
  effectiveDate: string;
  reviewStatus: 'draft' | 'reviewed';
  sections: LegalSection[];
  requirementIds: RequirementId[];
}
