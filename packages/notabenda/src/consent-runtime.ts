// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-EVIDENCE
import {normalizeConsentRuntimeConfig} from './consent-runtime-config.js';
import {requiredEvidenceFactory} from './consent-evidence-factory.js';
import type {RequiredConsentEvidence} from './consent-evidence-factory.js';
import {createConsentEngine} from './consent-engine.js';
import type {ConsentOptions,ConsentEnvironment,ConsentStateController} from './consent-types.js';
export type {ConsentRuntimeConfig,ConsentRuntimeInventory} from './consent-runtime-config.js';
export type {RequiredConsentEvidence} from './consent-evidence-factory.js';
export type {ConsentStateController,ConsentSnapshot,ConsentEnvironment,ChoiceStorage,ChoiceStatus,ServiceLifecycle,ServiceStatus,ServiceRegistration} from './consent-types.js';
export {mountControls} from './controls.js';
export {defaultConsentWording} from './consent-notice.js';
export {ScopeGuardError} from './scope-guards.js';
export interface ConsentRuntimeOptions extends Omit<ConsentOptions,'evidence'> {evidence?:RequiredConsentEvidence}
/** Compiled inventory with synchronous, bounded validation before any browser capability is used. */
export function createConsentRuntime(input:unknown,environment?:ConsentEnvironment,options:ConsentRuntimeOptions={}):ConsentStateController {
 const descriptor=normalizeConsentRuntimeConfig(input),factory=requiredEvidenceFactory(options.evidence);
 if(descriptor.evidence==='required'&&!factory)throw new Error('Required consent evidence needs an adapter from notabenda/consent/evidence.');
 if(descriptor.evidence==='local'&&options.evidence!==undefined)throw new Error('Local consent mode does not accept a required evidence adapter.');
 return createConsentEngine(descriptor.inventory,environment,{...options,...(factory?{evidence:factory}:{evidence:undefined})});
}

export type {ConsentLocalization,ConsentMessages} from './localization-policy.js';
