// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-BUNDLE-BUDGET
import {createEvidenceSession} from './consent-evidence.js';
import type {ConsentEvidenceOptions} from './consent-evidence.js';
import {normalizeConsentNotice} from './consent-notice.js';
import {registerRequiredEvidence} from './consent-evidence-factory.js';
import type {RequiredConsentEvidence} from './consent-evidence-factory.js';
export {ConsentEvidenceError} from './consent-evidence.js';
export type {ConsentEvidenceOptions,ConsentEvidenceSnapshot,ConsentChoiceRequest,ConsentReceipt,ConsentHead} from './consent-evidence.js';
/** Capture the host adapter before construction; each controller gets a fresh synchronous session. */
export function requiredConsentEvidence(options:ConsentEvidenceOptions):RequiredConsentEvidence {
 if(!options)throw new Error('Provide required consent evidence options.');
 const notice=normalizeConsentNotice(options.notice,{allowPreview:options.allowPreview===true});
 const captured={...options,notice};
 return registerRequiredEvidence((config,environment,changed)=>createEvidenceSession(config,captured,environment,changed));
}
