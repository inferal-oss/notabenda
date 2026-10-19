import {consentLocalization} from './document-localization.js';
// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-BUNDLE-BUDGET
import {toPublicConfig} from './config.js';
import {normalizeConsentRuntimeConfig} from './consent-runtime-config.js';
import type {ConsentRuntimeConfig} from './consent-runtime-config.js';
import type {BuildMode} from './types.js';
/** Build-time full validation first, then a small browser descriptor. Evidence mode has no default. */
export function compileConsentRuntimeConfig(input:unknown,settings:{evidence:'local'|'required';mode?:BuildMode}):ConsentRuntimeConfig {
 if(!settings||!['local','required'].includes(settings.evidence)||settings.mode!==undefined&&!['preview','production'].includes(settings.mode))throw new Error('Choose an explicit local or required evidence mode.');
 const mode=settings.mode??'production',c=toPublicConfig(input,{mode});
 const documents=Object.fromEntries((['privacy','cookies'] as const).map(kind=>{const {sections:_,...metadata}=c.documents[kind];return [kind,metadata];}));
 return normalizeConsentRuntimeConfig({schemaVersion:1,kind:'notabenda-consent-runtime',mode,evidence:settings.evidence,inventory:{schemaVersion:1,site:c.site,...(c.localization===undefined?{}:{localization:consentLocalization(c.localization)}),purposes:c.purposes,services:c.services,storage:c.storage,consent:c.consent,documents,...(c.scopeGuards===undefined?{}:{scopeGuards:c.scopeGuards}),...(c.privacySignals===undefined?{}:{privacySignals:c.privacySignals})}});
}
