// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-BUNDLE-BUDGET
import type {ConsentRuntimeInventory} from './consent-runtime-config.js';
import type {createEvidenceSession,EvidenceEnvironment} from './consent-evidence.js';
export type EvidenceSessionFactory=(config:ConsentRuntimeInventory,environment:EvidenceEnvironment,changed:()=>void)=>ReturnType<typeof createEvidenceSession>;
declare const requiredEvidence:unique symbol;
/** An opaque, in-process adapter from notabenda/consent/evidence; never serialize it. */
export interface RequiredConsentEvidence {readonly [requiredEvidence]:true}
const factories=new WeakMap<object,EvidenceSessionFactory>();
export function registerRequiredEvidence(factory:EvidenceSessionFactory):RequiredConsentEvidence {const handle=Object.freeze({}) as RequiredConsentEvidence;factories.set(handle,factory);return handle;}
export function requiredEvidenceFactory(handle:unknown):EvidenceSessionFactory|undefined {return handle&&typeof handle==='object'?factories.get(handle):undefined;}
