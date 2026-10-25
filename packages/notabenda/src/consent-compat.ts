// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
// Explicit full-input migration entry. Keep this out of the primary browser graph.
import {toPublicConfig} from './config.js';
import {createConsentEngine} from './consent-engine.js';
import {createEvidenceSession} from './consent-evidence.js';
import type {ConsentOptions,ConsentEnvironment,ConsentStateController} from './consent-types.js';
import type {ConsentEvidenceOptions} from './consent-evidence.js';
import type {PublicSiteConfig} from './types.js';
export interface CompatibilityConsentOptions extends Omit<ConsentOptions,'evidence'> {evidence?:ConsentEvidenceOptions}
export interface CompatibilityConsentController extends ConsentStateController<PublicSiteConfig> {}
/** Full synchronous site validation and complete public configuration; separately sized. */
export function createCompatibilityConsent(input:unknown,environment?:ConsentEnvironment,options:CompatibilityConsentOptions={}):CompatibilityConsentController {
 const config=toPublicConfig(input);
 return createConsentEngine(config,environment,{...options,...(options.evidence?{evidence:(config,env,changed)=>createEvidenceSession(config,options.evidence!,env,changed)}:{evidence:undefined})});
}
/** Explicit compatibility import only; primary createConsent requires compiled input. */
export {createCompatibilityConsent as createConsent};
