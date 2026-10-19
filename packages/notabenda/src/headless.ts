// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-CONSENT-RUNTIME
/** Cookie-choice state and service lifecycle APIs without document renderers or DOM mounts. */
export {createConsent} from './consent.js';
export type {ConsentController,ConsentOptions,ConsentEnvironment,ConsentSnapshot,ChoiceStorage,ChoiceStatus,ServiceLifecycle,ServiceStatus} from './consent.js';
export {defaultConsentWording,normalizeConsentNotice} from './consent-notice.js';
export type {ConsentNotice,ConsentWording,ConsentNoticeDocument} from './consent-notice.js';
export {ConsentEvidenceError} from './consent-evidence.js';
export type {ConsentEvidenceOptions,ConsentEvidenceSnapshot,ConsentEvidenceStatus,ConsentChoiceRequest,ConsentReceipt,ConsentHead} from './consent-evidence.js';
export {evaluateScopeGuards,ScopeGuardError} from './scope-guards.js';
export type {ScopeGuardDecision,ScopeGuardReason} from './scope-guards.js';
export {hasGlobalPrivacyControl,getPrivacySignalRestrictions} from './privacy-signals.js';
export type {GlobalPrivacyControlStatus,PrivacySignalSnapshot} from './privacy-signals.js';
export type {PromptPolicyDecision} from './prompt-policy.js';
export type * from './types.js';
