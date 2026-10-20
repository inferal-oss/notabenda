// @requirements REQ-PRODUCT-CONNECTION-INSPECTION
import {projectConsentInventory} from './consent-inventory.js';
// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-BUNDLE-BUDGET
import {toPublicConfig} from './config.js';
import {normalizeConsentRuntimeConfig} from './consent-runtime-config.js';
import type {ConsentRuntimeConfig} from './consent-runtime-config.js';
import type {BuildMode} from './types.js';
/** Build-time full validation first, then a small browser descriptor. Evidence mode has no default. */
export function compileConsentRuntimeConfig(input:unknown,settings:{evidence:'local'|'required';mode?:BuildMode}):ConsentRuntimeConfig {
 if(!settings||!['local','required'].includes(settings.evidence)||settings.mode!==undefined&&!['preview','production'].includes(settings.mode))throw new Error('Choose an explicit local or required evidence mode.');
 const mode=settings.mode??'production',c=toPublicConfig(input,{mode});
 return normalizeConsentRuntimeConfig({schemaVersion:1,kind:'notabenda-consent-runtime',mode,evidence:settings.evidence,inventory:projectConsentInventory(c)});
}
