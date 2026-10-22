// @requirements REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
import {normalizeConsentInformation} from './consent-information.js';
import type {ConsentInformation} from './consent-information.js';
// @requirements REQ-IE-CONSENT-DURATION
import {isGrantExpiryPolicy} from './grant-expiry-policy.js';
import type {GrantExpiryPolicy} from './grant-expiry-policy.js';
// @requirements REQ-FR-SCOPE
// @requirements REQ-PRODUCT-LOCALIZATION
import {normalizeConsentLocalization,formatMessage,localizedConsentWording} from './localization-policy.js';
import type {ConsentLocalization} from './localization-policy.js';
// @requirements REQ-PRODUCT-SCOPE-GUARDS
import {scopeGuardContext,scopeGuardBlocked} from './scope-guard-policy.js';
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
import type {ConsentRuntimeInventory} from './consent-runtime-config.js';
import {isPromptPolicy} from './prompt-policy.js';
import type {PromptPolicy} from './types.js';

/** @requirements REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME
 * Shared by the local runtime and the build-time evidence descriptor.
 */
export function consentScopes(config: ConsentRuntimeInventory): Record<string, string> {
  const policy=config.consent;
  if (!policy) throw new Error('Declare the optional consent scope first.');
  // Resolve and order managed services once. Filtering retains repeated purpose
  // associations only once and preserves the existing serialized scope contract.
  const managed=policy.services.map(s=>({scope:s.scope,service:config.services.find(item=>item.id===s.id)!}))
    .sort((a,b) => a.service.id < b.service.id ? -1 : a.service.id > b.service.id ? 1 : 0);
  return Object.fromEntries(policy.purposes.map(p => {
    const purpose = config.purposes.find(item => item.id === p.id)!;
    const services = managed.filter(s => s.service.purposeIds.includes(p.id));
    const scopeGuard=scopeGuardContext(config.scopeGuards,p.id);
    return [p.id, JSON.stringify({ scope:p.scope, purpose, services,...(policy.grantExpiryPolicy?{grantExpiryPolicy:policy.grantExpiryPolicy}:{}),...(scopeGuard?{scopeGuard}:{}),...(config.localization?{localization:{locale:config.localization.locale,disclosureRevision:config.localization.disclosureRevision}}:{}) })];
  }));
}
export interface ConsentWording {
  title:string; summary:string; preferencesTitle:string; preferencesIntro:string; essentialNote:string;
  acceptLabel:string; rejectLabel:string; saveLabel:string; preferencesLabel:string; dismissLabel:string; closeLabel:string;
}
/** @requirements REQ-IT-REPROMPT Keep significant-change information after any custom copy overrides. */
export function applyPromptPolicyWording(config:ConsentRuntimeInventory,wording:ConsentWording):ConsentWording {
  const summary=config.consent?.promptPolicy?.materialChange?.summary;
  if(!summary)return wording;
  const disclosure=config.localization?formatMessage(config.localization.consent.materialChange,{summary}):`Changes to optional processing: ${summary}`;
  const append=(text:string)=>text.endsWith(disclosure)?text:`${text} ${disclosure}`;
  return {...wording,summary:append(wording.summary),preferencesIntro:append(wording.preferencesIntro)};
}
/** Default UI copy is also archived in a consent notice; custom UIs must archive their actual copy. */
export function defaultConsentWording(config: ConsentRuntimeInventory): ConsentWording {
  if (!config.consent) throw new Error('Declare the optional consent scope first.');
  const available=config.consent.purposes.filter(p=>!scopeGuardBlocked(config.scopeGuards,p.id));
  const exceptions=config.storage.some(s=>s.classification==='exception');
  const restricted=available.length!==config.consent.purposes.length;
  if(config.localization)return localizedConsentWording(config.localization,{available:available.length>0,restricted,exceptions,...(config.consent.promptPolicy?.materialChange?{changeSummary:config.consent.promptPolicy.materialChange.summary}:{})});
  return applyPromptPolicyWording(config,{
    title:'Optional cookies',
    summary:available.length?`Allow optional cookies and storage for ${available.map(p => config.purposes.find(item => item.id === p.id)!.name.toLocaleLowerCase('en')).join(' and ')}?${restricted?' Other purposes need a separate process and stay off here.':''}${exceptions?' Other storage settings have separate on/off controls.':''}`:'Optional purposes need a separate supported process and stay off here.',
    preferencesTitle:'Privacy choices', preferencesIntro:'Choose the optional purposes you allow. Closing this panel leaves your current choices unchanged.'+(restricted?' Purposes marked unavailable need a separate supported process and stay off here.':''),
    essentialNote:'Essential functions are handled by the site. Optional purposes below stay off unless you allow them.',
    acceptLabel:exceptions?'Allow these services':restricted?'Allow available':'Accept optional', rejectLabel:exceptions?'Reject these services':'Reject optional', saveLabel:'Save choices', preferencesLabel:'Preferences', dismissLabel:'Not now', closeLabel:'Close',
  });
}
export interface ConsentNoticeDocument {
  title:string; url:string; version:string; effectiveDate:string; sha256:string; contentSha256:string; reviewStatus:'draft'|'reviewed';
}
/** @requirements REQ-PRODUCT-CONSENT-EVIDENCE
 * An immutable descriptor of declared disclosures, not a claim that this UI was displayed or consent was valid.
 */
export interface ConsentNotice {
  schemaVersion:1|2; localization?:ConsentLocalization; noticeId:string; siteId:string; scopeId:string; artifactId:string; mode:'preview'|'production';
  scopeDigest:string; scopes:Record<string,string>; wording:ConsentWording; information?:ConsentInformation;
  documents:{privacy:ConsentNoticeDocument; cookies:ConsentNoticeDocument};
  policy:{grantLifetimeDays:number; refusalLifetimeDays:number; deliveryWindowSeconds:number;grantExpiryPolicy?:GrantExpiryPolicy;promptPolicy?:PromptPolicy};
}
const hash = (value:unknown):value is string => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const slug = (value:unknown):value is string => typeof value === 'string' && /^[a-z][a-z0-9-]{0,119}$/u.test(value);
const object = (value:unknown):value is Record<string,unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value:unknown, max:number):value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max && new TextEncoder().encode(value).length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
function exact(value:Record<string,unknown>, keys:string[]):boolean { return Object.keys(value).length === keys.length && keys.every(key=>Object.hasOwn(value,key)); }

/** Structural validation only. The server independently verifies hashes, archive and scope. */
export function normalizeConsentNotice(input:unknown, options:{allowPreview?:boolean} = {}): ConsentNotice {
  let n:unknown;
  try { const serialized = JSON.stringify(input); if (new TextEncoder().encode(serialized).length > 32768) throw new Error(); n = JSON.parse(serialized); } catch { throw new Error('Invalid or oversized consent notice.'); }
  const invalid = () => { throw new Error('Invalid consent notice.'); };
  if (!object(n) || !exact(n,['schemaVersion','noticeId','siteId','scopeId','artifactId','mode','scopeDigest','scopes','wording','documents','policy',...(n.schemaVersion===2?['localization']:[]),...(n.information===undefined?[]:['information'])]) || (n.schemaVersion!==1&&n.schemaVersion!==2) || !hash(n.noticeId) || !hash(n.artifactId) || !hash(n.scopeDigest) || !slug(n.siteId) || !slug(n.scopeId) || typeof n.mode !== 'string' || !['preview','production'].includes(n.mode)) return invalid();
  if(n.information!==undefined)n.information=normalizeConsentInformation(n.information) as unknown as Record<string,unknown>;
  if(n.schemaVersion===2)n.localization=normalizeConsentLocalization(n.localization,{allowPreview:options.allowPreview===true});
  if (!object(n.scopes) || Object.keys(n.scopes).length < 1 || Object.keys(n.scopes).length > 40 || Object.entries(n.scopes).some(([id,value])=>!slug(id) || !text(value,30000))) return invalid();
  const wordingKeys = ['title','summary','preferencesTitle','preferencesIntro','essentialNote','acceptLabel','rejectLabel','saveLabel','preferencesLabel','dismissLabel','closeLabel'];
  if (!object(n.wording) || !exact(n.wording,wordingKeys) || Object.entries(n.wording).some(([key,value])=>!text(value, key.endsWith('Label') ? 120 : 2000))) return invalid();
  if (!object(n.policy) || !exact(n.policy,['grantLifetimeDays','refusalLifetimeDays','deliveryWindowSeconds',...(n.policy.promptPolicy===undefined?[]:['promptPolicy']),...(n.policy.grantExpiryPolicy===undefined?[]:['grantExpiryPolicy'])]) || ![n.policy.grantLifetimeDays,n.policy.refusalLifetimeDays].every(v=>Number.isInteger(v) && Number(v)>=1 && Number(v)<=730) || !Number.isInteger(n.policy.deliveryWindowSeconds) || Number(n.policy.deliveryWindowSeconds)<30 || Number(n.policy.deliveryWindowSeconds)>86400 || n.policy.promptPolicy!==undefined&&!isPromptPolicy(n.policy.promptPolicy)) return invalid();
  if(n.policy.grantExpiryPolicy!==undefined&&!isGrantExpiryPolicy(n.policy.grantExpiryPolicy))return invalid();
  if(isPromptPolicy(n.policy.promptPolicy)&&n.policy.promptPolicy.materialChange){
    const disclosure=n.schemaVersion===2?formatMessage((n.localization as unknown as ConsentLocalization).consent.materialChange,{summary:n.policy.promptPolicy.materialChange.summary}):`Changes to optional processing: ${n.policy.promptPolicy.materialChange.summary}`;
    if(!(n.wording.summary as string).endsWith(disclosure)||!(n.wording.preferencesIntro as string).endsWith(disclosure))return invalid();
  }
  if (!object(n.documents) || !exact(n.documents,['privacy','cookies'])) return invalid();
  for (const kind of ['privacy','cookies']) {
    const doc = n.documents[kind];
    if (!object(doc) || !exact(doc,['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus']) || !text(doc.title,300) || !text(doc.version,200) || !hash(doc.sha256) || !hash(doc.contentSha256) || doc.url !== `/artifacts/${n.artifactId}/${kind}.html` || typeof doc.reviewStatus !== 'string' || !['draft','reviewed'].includes(doc.reviewStatus) || typeof doc.effectiveDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(doc.effectiveDate) || !Number.isFinite(Date.parse(doc.effectiveDate)) || new Date(doc.effectiveDate).toISOString().slice(0,10) !== doc.effectiveDate) return invalid();
    if (!options.allowPreview && (n.mode !== 'production' || doc.reviewStatus !== 'reviewed')) throw new Error('Consent evidence requires reviewed production documents; preview must be explicit.');
  }
  return n as unknown as ConsentNotice;
}
