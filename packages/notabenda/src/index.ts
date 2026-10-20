// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION
export type {ServiceDirectoryMessages,ServiceDirectoryLocalization} from './service-directory-localization.js';
// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
export type {ProcessingMessages,ProcessingLocalization} from './processing-localization-policy.js';
export type {RightsMessages} from './rights-localization-policy.js';
export {renderRightsCenter,renderRightsPage} from './rights.js';
export type {RightsCenterRenderOptions} from './rights.js';
export {evaluateScopeGuards,ScopeGuardError} from './scope-guards.js';
export type {ScopeGuardDecision,ScopeGuardReason} from './scope-guards.js';
// Browser/SSR-safe entry point. No Node imports, filesystem access, or side effects.
export { defineSite, validateSiteConfig, toPublicConfig, SiteConfigError } from './config.js';
export { createLegalDocument, renderLegalDocument, renderLegalPage, renderLegalLinks } from './documents.js';
export { createConsent } from './consent.js';
export { defaultConsentWording, normalizeConsentNotice } from './consent-notice.js';
export type { ConsentNotice, ConsentWording, ConsentNoticeDocument } from './consent-notice.js';
export { ConsentEvidenceError } from './consent-evidence.js';
export type { ConsentEvidenceOptions, ConsentEvidenceSnapshot, ConsentEvidenceStatus, ConsentChoiceRequest, ConsentReceipt, ConsentHead } from './consent-evidence.js';
export { createTermsAcceptance, mountTermsAcceptance, TermsAcceptanceError, normalizeTermsOffer } from './terms.js';
export type { TermsOffer, TermsAcceptanceRequest, TermsAcceptanceReceipt, TermsAcceptanceController, TermsAcceptanceOptions, TermsAcceptanceSnapshot, TermsAcceptanceStatus } from './terms.js';
export { mountControls } from './controls.js';
export type { ControlsOptions, MountedControls } from './controls.js';
export {createEmbedService,renderEmbedPlaceholder} from './embeds.js';
export type {EmbedPlaceholder,EmbedOptions,MountedEmbed,EmbedService} from './embeds.js';
export {hasGlobalPrivacyControl,getPrivacySignalRestrictions} from './privacy-signals.js';
export type {GlobalPrivacyControlStatus,PrivacySignalSnapshot} from './privacy-signals.js';
export {normalizeProcessingNotice} from './processing.js';
export type {ProcessingNotice,ProcessingRequest,ProcessingReceipt,ProcessingHead,ProcessingResult,ProcessingProvenance} from './processing.js';
export {createProcessingChoices,mountProcessingChoices,ProcessingChoicesError} from './processing-choices.js';
export {registerStorageService} from './storage-cleanup.js';
export type {CookieCleanupScope,StorageCleanupTarget,StorageAccess,StorageCleanupEnvironment,StorageCleanupResult,StorageCleanupReport,StorageServiceSnapshot,StorageServiceOptions,StorageServiceController} from './storage-cleanup.js';
export type {ProcessingChoicesSnapshot,ProcessingChoicesOptions,ProcessingChoicesEnvironment,ProcessingChoicesController} from './processing-choices.js';
export type { ConsentStateController, ConsentController, ConsentOptions, ConsentEnvironment, ConsentSnapshot, ChoiceStorage, ChoiceStatus, ServiceLifecycle, ServiceStatus, ServiceRegistration } from './consent.js';
export type {PromptPolicyDecision} from './prompt-policy.js';
export type * from './types.js';

export {normalizeCollectionNotice,renderCollectionNotice,collectionNoticeIds} from './collection.js';
export type {CollectionNotice,CollectionNoticeSettings,CollectionNoticeRenderOptions} from './collection.js';

export {normalizeFormPermissionOffer,formPermissionGrantSupported,createFormPermission,mountFormPermission,FormPermissionError} from './form-permission.js';
export type {FormPermissionOffer,FormPermissionSettings,FormPermissionCommand,FormPermissionReceipt,FormPermissionState,FormPermissionResult,FormPermissionSnapshot,FormPermissionOptions,FormPermissionController} from './form-permission.js';

// @requirements REQ-PRODUCT-FORM-PERMISSIONS
export {createIndexedDBFormPermissionJournal} from './form-permission-journal.js';
export type {FormPermissionJournal,IndexedDBFormPermissionJournal} from './form-permission-journal.js';

export type {SiteLocalization,DocumentMessages,GeneratedDocumentMessages} from './document-localization.js';
export type {ConsentLocalization,ConsentMessages} from './localization-policy.js';

export type {TermsLocalization,TermsMessages} from './terms-localization-policy.js';

export type {FormPermissionLocalization,FormPermissionMessages} from './form-permission-localization-policy.js';

// @requirements REQ-PRODUCT-LOCALIZATION
export type {CollectionLocalization,CollectionMessages} from './collection-localization-policy.js';
