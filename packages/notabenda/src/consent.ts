// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
import {toPublicConfig} from './config.js';
import {createConsentEngine} from './consent-engine.js';
import {createEvidenceSession} from './consent-evidence.js';
import type {ConsentOptions,ConsentEnvironment,ConsentController} from './consent-types.js';
export type * from './consent-types.js';
/** Compatibility entry: full synchronous site validation and complete public configuration. */
export function createConsent(input:unknown,environment?:ConsentEnvironment,options:ConsentOptions={}):ConsentController {
 const config=toPublicConfig(input);
 return createConsentEngine(config,environment,{...options,...(options.evidence?{evidence:(config,env,changed)=>createEvidenceSession(config,options.evidence!,env,changed)}:{evidence:undefined})});
}
