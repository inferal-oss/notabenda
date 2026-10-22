// @requirements REQ-US-TX-AGENT-SIGNALS
// @requirements REQ-US-OR-GPC REQ-US-MN-GPC
// @requirements REQ-US-CA-GPC REQ-US-CO-GPC REQ-US-CT-GPC
import {toPublicConfig} from './config.js';
import {evaluatePrivacySignals} from './privacy-signal-policy.js';
import type {PrivacySignalSnapshot} from './privacy-signal-policy.js';
export * from './privacy-signal-policy.js';
/** @requirements REQ-PRODUCT-PRIVACY-SIGNALS
 * Server-readable restrictions from explicit input; absence never establishes permission or authentication.
 */
export function getPrivacySignalRestrictions(input:unknown,signal:{globalPrivacyControl:boolean}):PrivacySignalSnapshot|undefined {
  if(typeof signal.globalPrivacyControl!=='boolean')throw new Error('Provide an explicitly observed boolean GPC signal.');
  return evaluatePrivacySignals(toPublicConfig(input),signal.globalPrivacyControl?'observed':'not-observed');
}
