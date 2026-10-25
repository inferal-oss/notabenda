// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-BUNDLE-BUDGET
/** Primary browser factory. Compile full site input at build time through core/content. */
export {createConsentRuntime as createConsent} from './consent-runtime.js';
export type * from './consent-types.js';
export type {ConsentRuntimeConfig,ConsentRuntimeInventory} from './consent-runtime-config.js';
