/** @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG */
export {normalizeBrowserRuleSet,normalizeBrowserCatalogCapture,analyzeBrowserCatalogCapture} from './catalog-browser-policy.js';
export type {BrowserRuleSet,BrowserRule,BrowserSignal,BrowserPattern,BrowserWitness,BrowserWitnessChannel,BrowserCatalogCapture,BrowserCatalogFinding,BrowserCatalogReview} from './catalog-browser-policy.js';
export {captureBrowserCatalog,recognizeLegacyBrowserCapture} from './catalog-browser-capture.js';
export type {BrowserCatalogEnvironment} from './catalog-browser-capture.js';
