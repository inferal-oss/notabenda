// @requirements REQ-PRODUCT-CONSENT-NOTICE-FILES
// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION
import {selectContractActionLocalization} from './contract-action-localization.js';
import {normalizePublicLegalArtifact} from './release-files.js';
import {normalizeTermsAgreementSettings,assertConfiguredTermsCopy} from './terms-settings.js';
// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION
import {selectIndirectCollectionLocalization} from './indirect-collection-localization-policy.js';
// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
import {selectProcessingLocalization} from './processing-localization-policy.js';
import {selectCollectionLocalization} from './collection-localization-policy.js';
import {selectFormPermissionLocalization} from './form-permission-localization-policy.js';
// @requirements REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
// @requirements REQ-IE-CONSENT-DURATION
import {selectTermsLocalization} from './terms-localization-policy.js';
// @requirements REQ-PRODUCT-LOCALIZATION
import {requireEnglishSurface,consentLocalization} from './document-localization.js';
export {compileConsentRuntimeConfig} from './consent-compile.js';
export type {ConsentRuntimeConfig,ConsentRuntimeInventory} from './consent-runtime-config.js';
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-DE-CANCEL REQ-DE-WITHDRAWAL REQ-EU-WITHDRAWAL REQ-BR-CONTRACT
import {normalizeContractActionDefinition,contractActionDefaults} from './contract-action-policy.js';
import type {ContractActionDefinition,ContractActionProfile} from './contract-action-policy.js';
// @requirements REQ-EU-CONSENT REQ-CA-MEANINGFUL REQ-EU-MARKETING REQ-CA-CASL-OPTIN
import {normalizeFormPermissionOffer} from './form-permission.js';
import type {FormPermissionOffer,FormPermissionSettings} from './form-permission.js';
import {scopeGuardContext} from './scope-guard-policy.js';
// @requirements REQ-PRODUCT-RIGHTS-CENTER
import {renderRightsPage} from './rights.js';
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
/** Build-time entry point. @requirements REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-CONFIG REQ-PRODUCT-CF-HISTORY REQ-PRODUCT-AUTHORING */
import {normalizeCollectionNotice} from './collection.js';
import type {CollectionNotice,CollectionNoticeSettings} from './collection.js';
// @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
import {normalizeIndirectCollectionNotice,normalizeIndirectCollectionNoticeSettings} from './indirect-collection.js';
import type {IndirectCollectionNotice,IndirectCollectionNoticeSettings} from './indirect-collection.js';
import { createHash } from 'node:crypto';
import { documentKinds, toPublicConfig } from './config.js';
import { createLegalDocument, renderLegalPage } from './documents.js';
import type { DocumentKind, LegalDocument, PublicSiteConfig, RequirementId, ValidationOptions } from './types.js';
import { normalizeTermsOffer } from './terms.js';
import type { TermsOffer } from './terms.js';
import { consentScopes, defaultConsentWording, normalizeConsentNotice, applyPromptPolicyWording } from './consent-notice.js';
import type { ConsentNotice, ConsentWording } from './consent-notice.js';
import {normalizeProcessingNotice,processingServiceScope} from './processing.js';
import type {ProcessingNotice} from './processing.js';
import type {ProcessingActivity} from './types.js';
// @requirements REQ-PRODUCT-AUTHORED-PREVIEW
export {createRetainedReleaseFiles,normalizePublicLegalArtifact} from './release-files.js';
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-RETAINED-RELEASES
export {createConsentNoticeFiles,createRetainedConsentNoticeFiles} from './consent-release-files.js';
export type {ConsentNoticeBuild} from './consent-release-files.js';
import type {CatalogReleaseReview,CatalogReviewDescriptor} from './catalog-release-policy.js';

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}
export const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

/** @requirements REQ-PRODUCT-PROCESSING-CHOICES Pin a separate opt-out action to its privacy release. */
export function createProcessingNotice(artifact:LegalArtifact,settings:{scopeId:string;activities:ProcessingActivity[];wording:ProcessingNotice['wording']},options:ValidationOptions={}):ProcessingNotice {
  const config=toPublicConfig(artifact.publicConfig,{mode:artifact.manifest.mode});
  if(!config.localization?.processingChoices&&!/^en(?:-|$)/iu.test(config.site.locale))throw Error('Localized processing choices need localization.processingChoices messages.');
  const localization=config.localization?.processingChoices?selectProcessingLocalization(config.localization):undefined;
  if(config.services.some(service=>!service.processingActivities))throw new Error('Explicitly classify every service before building processing choices.');
  const d=artifact.manifest.documents.find(doc=>doc.kind==='privacy');if(!d)throw new Error('The release needs a privacy document.');
  const {title,version,effectiveDate,sha256:htmlHash,contentSha256,reviewStatus}=d;
  const n=normalizeProcessingNotice({schemaVersion:localization?2:1,...(localization?{localization}:{}),noticeId:'0'.repeat(64),siteId:config.site.id,scopeId:settings.scopeId,artifactId:artifact.manifest.artifactId,mode:artifact.manifest.mode,activities:settings.activities,services:processingServiceScope(config.services),wording:settings.wording,document:{title,version,effectiveDate,sha256:htmlHash,contentSha256,reviewStatus,url:`/artifacts/${artifact.manifest.artifactId}/privacy.html`}},{allowPreview:options.mode==='preview'});
  const {noticeId:_,...descriptor}=n;return {...n,noticeId:sha256(canonicalJson(descriptor))};
}

/** @requirements REQ-PRODUCT-CONSENT-EVIDENCE: pin UI wording, material purposes and the exact privacy/cookie releases. */
export function createConsentNotice(artifact: LegalArtifact, settings:{scopeId:string; wording?:Partial<ConsentWording>; deliveryWindowSeconds?:number}, options:ValidationOptions = {}): ConsentNotice {
  const config = toPublicConfig(artifact.publicConfig,{mode:artifact.manifest.mode});
  if (!config.consent) throw new Error('Declare the optional consent scope first.');
  const scopes = consentScopes(config);
  const documents = Object.fromEntries(['privacy','cookies'].map(kind=>{
    const doc = artifact.manifest.documents.find(d=>d.kind === kind);
    if (!doc) throw new Error('The release has no privacy/cookie document.');
    const {title,version,effectiveDate,sha256,contentSha256,reviewStatus} = doc;
    return [kind,{title,version,effectiveDate,sha256,contentSha256,reviewStatus,url:`/artifacts/${artifact.manifest.artifactId}/${kind}.html`}];
  }));
  if(config.localization&&settings.wording!==undefined)throw new Error('Revise localization.consent to change versioned notice wording. Localized releases do not accept wording overrides.');
  const notice = normalizeConsentNotice({schemaVersion:config.localization?2:1,...(config.localization?{localization:consentLocalization(config.localization)}:{}),...(config.consent.information===undefined?{}:{information:config.consent.information}),noticeId:'0'.repeat(64),siteId:config.site.id,scopeId:settings.scopeId,artifactId:artifact.manifest.artifactId,mode:artifact.manifest.mode,scopes,scopeDigest:sha256(canonicalJson(scopes)),wording:applyPromptPolicyWording(config,{...defaultConsentWording(config),...settings.wording}),documents,policy:{grantLifetimeDays:config.consent.grantLifetimeDays,refusalLifetimeDays:config.consent.refusalLifetimeDays,deliveryWindowSeconds:settings.deliveryWindowSeconds ?? 300,...(config.consent.grantExpiryPolicy?{grantExpiryPolicy:config.consent.grantExpiryPolicy}:{}),...(config.consent.promptPolicy?{promptPolicy:config.consent.promptPolicy}:{})}}, {allowPreview:options.mode === 'preview'});
  const {noticeId:_,...descriptor} = notice;
  return {...notice,noticeId:sha256(canonicalJson(descriptor))};
}

/** Versioned collection/action wording; referenced terms do not establish the visitor's original contract terms. */
export function createContractActionDefinition(artifact:LegalArtifact,settings:{actionId:string;revision:string;profile:ContractActionProfile;reviewStatus:'draft'|'reviewed';wording?:Partial<ContractActionDefinition['wording']>},options:ValidationOptions={}):ContractActionDefinition {
 let config=toPublicConfig(artifact.publicConfig,{mode:artifact.manifest.mode});
 const localization=config.localization?.contractActions?selectContractActionLocalization(config.localization):undefined;
 if(localization){artifact=normalizePublicLegalArtifact(artifact,options);config=toPublicConfig(artifact.publicConfig,{mode:artifact.manifest.mode});}
 const documents=Object.fromEntries(['terms','privacy'].map(kind=>{const d=artifact.manifest.documents.find(item=>item.kind===kind);if(!d)throw Error('Contract actions need terms and privacy references.');const {title,version,effectiveDate,sha256,contentSha256,reviewStatus}=d;return [kind,{title,version,effectiveDate,sha256,contentSha256,reviewStatus,url:`/artifacts/${artifact.manifest.artifactId}/${kind}.html`}];}));
 const definition=normalizeContractActionDefinition({schemaVersion:localization?2:1,...(localization?{localization}:{}),definitionId:'0'.repeat(64),siteId:config.site.id,actionId:settings.actionId,revision:settings.revision,profile:settings.profile,locale:localization?config.site.locale:settings.profile.startsWith('de-')?'de-DE':settings.profile==='br-withdrawal'?'pt-BR':'en',renderingPolicy:localization?'contract-form-v2':'contract-form-v1',mode:artifact.manifest.mode,reviewStatus:settings.reviewStatus,artifactId:artifact.manifest.artifactId,wording:localization?settings.wording:{...contractActionDefaults[settings.profile],...settings.wording},documents},{allowPreview:options.mode==='preview'});
 const {definitionId:_,...descriptor}=definition;return {...definition,definitionId:sha256(canonicalJson(descriptor))};
}

export interface CompiledDocument {
  kind: DocumentKind;
  route: string;
  file: string;
  title: string;
  version: string;
  effectiveDate: string;
  reviewStatus: 'draft' | 'reviewed';
  sha256: string;
  contentSha256: string;
  requirementIds: RequirementId[];
  authoring?:AuthoredDocumentDescriptor;
}
/** Public provenance only: never a source filename, import path, component code or raw authored source. */
export interface AuthoredDocumentDescriptor {
  schemaVersion:1; format:'md'|'mdx'; sourceSha256:string; sourceBytes:number; bodySha256:string;
  renderer:'notabenda-authoring@0.1.0'; policy:'static-html-v1'; componentsRevision:string;
}
export interface LegalBuild {
  publicConfig: PublicSiteConfig;
  artifact: LegalArtifact;
  manifest: {
    schemaVersion: 1;
    artifactId: string;
    siteId: string;
    locale: string;
    mode: 'preview' | 'production';
    configSha256: string;
    /** Digest of an explicitly attached, separately retained selected-reference snapshot. */
    catalogReview?:CatalogReviewDescriptor;
    documents: CompiledDocument[];
    requirementIds: RequirementId[];
  };
  files: Record<string, string>;
}

/** Portable release data for an operator's history/evidence backend. Requirement IDs are traceability links, not fulfilled-obligation certificates. */
export interface LegalArtifact {
  manifest: LegalBuild['manifest'];
  publicConfig: PublicSiteConfig;
  pages: Record<string, string>;
  documents: Record<DocumentKind, LegalDocument>;
  /** Final static rich bodies from an optional build-time authoring adapter. */
  renderedBodies?:Partial<Record<DocumentKind,string>>;
}
/** Private archive envelope. Pass this to the backend; never upload it as a public asset. */
export interface LegalSourceArchive {
  schemaVersion:1;
  artifact:LegalArtifact;
  sourceAttachments:Partial<Record<DocumentKind,{format:'md'|'mdx';source:string}>>;
  catalogReview?:CatalogReleaseReview;
}

/** Deterministic output; does not access the filesystem, network, clock, or operator-only metadata. */
export function compileLegalDocuments(input: unknown, options: ValidationOptions & { stylesheetUrl?: string } = {}): LegalBuild {
  const mode = options.mode ?? 'production';
  const config = toPublicConfig(input, { mode });
  const pages: Record<string, string> = {};
  const models = {} as Record<DocumentKind, LegalDocument>;
  const documents = documentKinds.map(kind => {
    const doc = createLegalDocument(config, kind, { mode });
    models[kind] = doc;
    const file = `${doc.route.slice(1)}/index.html`;
    const html = renderLegalPage(config, kind, { mode, stylesheetUrl: options.stylesheetUrl ?? '/assets/notabenda.css' });
    pages[file] = html;
    return { kind, route: doc.route, file, title: doc.title, version: doc.version, effectiveDate: doc.effectiveDate, reviewStatus: doc.reviewStatus, sha256: sha256(html), contentSha256: sha256(canonicalJson({ title: doc.title, sections: doc.sections })), requirementIds: doc.requirementIds };
  });
  const descriptor = {
    schemaVersion: 1 as const, siteId: config.site.id, locale: config.site.locale, mode,
    configSha256: sha256(canonicalJson(config)), documents,
    requirementIds: [...new Set<RequirementId>(['REQ-PRODUCT-CONFIG', 'REQ-PRODUCT-ARTIFACTS', ...(config.terms.agreements?['REQ-PRODUCT-TERMS-AUTHORING' as const]:[]), ...(config.rightsCenter?['REQ-PRODUCT-RIGHTS-CENTER' as const]:[]),...documents.flatMap(d => d.requirementIds)])],
  };
  const manifest = { ...descriptor, artifactId: sha256(canonicalJson(descriptor)) };
  const artifact = { manifest, publicConfig: config, pages, documents: models };
  return {
    publicConfig: config, manifest, artifact,
    files: { ...(config.rightsCenter?{[config.rightsCenter.route.slice(1)+'/index.html']:renderRightsPage(config,{mode,stylesheetUrl:options.stylesheetUrl??'/assets/notabenda.css'})}:{}),...pages, ...Object.fromEntries(documents.map(d=>[`artifacts/${manifest.artifactId}/${d.kind}.html`, pages[d.file]!])), 'notabenda.public.json': canonicalJson(config) + '\n', 'notabenda.manifest.json': canonicalJson(manifest) + '\n', [`artifacts/${manifest.artifactId}.json`]: canonicalJson(artifact) + '\n' },
  };
}

/** @requirements REQ-PRODUCT-TERMS-ACCEPTANCE: pin the exact terms document AND interface wording. */
export function createTermsOffer(artifact: LegalArtifact, wording: { scopeId:string; statement:string; actionLabel:string }, options: ValidationOptions = {}): TermsOffer {
  assertConfiguredTermsCopy(artifact.publicConfig.terms.agreements,wording,{allowPreview:options.mode==='preview'});
  if(!artifact.publicConfig.localization?.terms)requireEnglishSurface(artifact.publicConfig,'Terms acceptance without localization.terms');
  const localization=artifact.publicConfig.localization?.terms?selectTermsLocalization(artifact.publicConfig.localization):undefined;
  const d = artifact.manifest.documents.find(item=>item.kind === 'terms');
  if (!d) throw new Error('The release has no terms document.');
  const offer = normalizeTermsOffer({ schemaVersion:localization?2:1,...(localization?{localization}:{}), offerId:'0'.repeat(64), artifactId:artifact.manifest.artifactId, siteId:artifact.manifest.siteId, mode:artifact.manifest.mode, scopeId:wording.scopeId, statement:wording.statement, actionLabel:wording.actionLabel, document:{ title:d.title, url:`/artifacts/${artifact.manifest.artifactId}/terms.html`, version:d.version, effectiveDate:d.effectiveDate, sha256:d.sha256, contentSha256:d.contentSha256, reviewStatus:d.reviewStatus } }, { allowPreview:options.mode === 'preview' });
  const { offerId:_, ...descriptor } = offer;
  return { ...offer, offerId:sha256(canonicalJson(descriptor)) };
}

/** Explicitly select one configured workflow from the final retained release. No activation or identity. */
export function createConfiguredTermsOffer(artifact:LegalArtifact,scopeId:string,options:ValidationOptions={}):TermsOffer {
 artifact=normalizePublicLegalArtifact(artifact,options);
 const settings=normalizeTermsAgreementSettings(artifact.publicConfig.terms.agreements,{allowPreview:options.mode==='preview'}),selected=settings.find(entry=>entry.scopeId===scopeId);
 if(!selected)throw Error('Select an explicitly configured terms scope. No default workflow is chosen.');
 return createTermsOffer(artifact,{scopeId:selected.scopeId,statement:selected.statement,actionLabel:selected.actionLabel},options);
}
/** Additional public outputs, generated only after any release finalization/attachments. */
export function createConfiguredTermsOfferFiles(artifact:LegalArtifact,options:ValidationOptions={}):Record<string,string>{
 if(artifact.publicConfig.terms.agreements===undefined)return {};
 artifact=normalizePublicLegalArtifact(artifact,options);
 const settings=normalizeTermsAgreementSettings(artifact.publicConfig.terms.agreements,{allowPreview:options.mode==='preview'});
 return Object.fromEntries(settings.map(entry=>[`artifacts/${artifact.manifest.artifactId}/agreements/terms-${entry.scopeId}.json`,JSON.stringify(createConfiguredTermsOffer(artifact,entry.scopeId,options),null,2)+'\n']));
}

/** @requirements REQ-PRODUCT-COLLECTION-NOTICE REQ-EU-NOTICE REQ-NZ-NOTICE
 * Create a display descriptor from a trusted public compiler artifact, never from form values.
 */
function directCollectionFacts(artifact:LegalArtifact,settings:CollectionNoticeSettings,options:ValidationOptions={}) {
  const bad=():never=>{throw new Error('Select declared direct-collection purposes from an intact public legal release.');};
  if(options.mode!==undefined&&!['production','preview'].includes(options.mode))return bad();
  if(!artifact||!settings||!settings.wording||!Array.isArray(settings.purposeIds)||!settings.purposeIds.length||settings.purposeIds.length>8||new Set(settings.purposeIds).size!==settings.purposeIds.length)return bad();
  const {manifest}=artifact;if(!manifest||manifest.schemaVersion!==1||!Array.isArray(manifest.documents)||!['production','preview'].includes(manifest.mode))return bad();
  const {artifactId,...descriptor}=manifest;if(sha256(canonicalJson(descriptor))!==artifactId)return bad();
  const config=toPublicConfig(artifact.publicConfig,{mode:manifest.mode});
  if(config.site.id!==manifest.siteId||config.site.locale!==manifest.locale||sha256(canonicalJson(config))!==manifest.configSha256||canonicalJson(config)!==canonicalJson(artifact.publicConfig))return bad();
  const documents=manifest.documents.filter(d=>d?.kind==='privacy');if(documents.length!==1)return bad();const d=documents[0]!,model=artifact.documents?.privacy,page=artifact.pages?.[d.file];
  const configured=config.documents.privacy;
  if(!model||model.kind!=='privacy'||typeof page!=='string'||sha256(page)!==d.sha256||sha256(canonicalJson({title:model.title,sections:model.sections}))!==d.contentSha256||d.file!==`${configured.route.slice(1)}/index.html`||d.route!==configured.route||d.title!==configured.title||d.version!==configured.version||d.effectiveDate!==configured.effectiveDate||d.reviewStatus!==configured.review.status||model.title!==d.title||model.version!==d.version||model.route!==d.route||model.effectiveDate!==d.effectiveDate||model.reviewStatus!==d.reviewStatus)return bad();
  const purposes=settings.purposeIds.map(id=>{const purpose=config.purposes.find(p=>p.id===id);if(!purpose||purpose.collection.source==='indirect')return bad();return purpose;});
  const recipients=config.services.filter(s=>s.purposeIds.some(id=>settings.purposeIds.includes(id))).map(s=>({id:s.id,name:s.name,provider:s.provider,location:s.location,purposeIds:s.purposeIds.filter(id=>settings.purposeIds.includes(id)),...(s.privacyUrl?{privacyUrl:s.privacyUrl}:{})}));
  const {title,version,effectiveDate,sha256:htmlHash,contentSha256,reviewStatus}=d;
  return {schemaVersion:1 as const,renderingPolicy:'collection-v1' as const,locale:config.site.locale,noticeId:'0'.repeat(64),siteId:config.site.id,scopeId:settings.scopeId,artifactId,mode:manifest.mode,reviewStatus:settings.reviewStatus,controller:config.controller,purposes,recipients,privacy:{rights:config.privacy.rights,transfers:config.privacy.transfers,automatedDecisions:config.privacy.automatedDecisions,complaints:config.privacy.complaints,...(config.privacy.rightsUrl?{rightsUrl:config.privacy.rightsUrl}:{})},document:{title,version,effectiveDate,sha256:htmlHash,contentSha256,reviewStatus,url:`/artifacts/${artifactId}/privacy.html`}};
}
export function createCollectionNotice(artifact:LegalArtifact,settings:CollectionNoticeSettings,options:ValidationOptions={}):CollectionNotice {
  if(!artifact.publicConfig.localization?.collection)requireEnglishSurface(artifact.publicConfig,'Collection notice without localization.collection');
  const localization=artifact.publicConfig.localization?.collection?selectCollectionLocalization(artifact.publicConfig.localization):undefined;
  if(localization&&(settings.wording.detailsLabel!==undefined||settings.wording.privacyLinkLabel!==undefined))throw Error('Set collection link/detail labels in the versioned localization.collection dictionary.');
  const n=normalizeCollectionNotice({...directCollectionFacts(artifact,settings,options),...(localization?{schemaVersion:2,renderingPolicy:'collection-v2',localization}:{}),wording:{title:settings.wording.title,intro:settings.wording.intro,detailsLabel:localization?.collection.detailsLabel??settings.wording.detailsLabel??'Collection details and your rights',privacyLinkLabel:localization?.collection.privacyLinkLabel??settings.wording.privacyLinkLabel??'Read the privacy policy'}},{allowPreview:options.mode==='preview'});
  const {noticeId:_,...noticeDescriptor}=n;return {...n,noticeId:sha256(canonicalJson(noticeDescriptor))};
}

/** @requirements REQ-PRODUCT-COLLECTION-NOTICE REQ-PRODUCT-LOCALIZATION
 * Compare a trusted notice with its intact release and selected interface text.
 * Content identity does not authenticate either author or prove presentation.
 */
export function verifyCollectionNotice(input:unknown,artifact:LegalArtifact,options:ValidationOptions={}):CollectionNotice {
  const n=normalizeCollectionNotice(input,{allowPreview:options.mode==='preview'});
  const wording={title:n.wording.title,intro:n.wording.intro,...(n.schemaVersion===1?{detailsLabel:n.wording.detailsLabel,privacyLinkLabel:n.wording.privacyLinkLabel}:{})};
  const expected=createCollectionNotice(artifact,{scopeId:n.scopeId,purposeIds:n.purposes.map(p=>p.id),reviewStatus:n.reviewStatus,wording},options);
  if(canonicalJson(n)!==canonicalJson(expected))throw Error('The collection notice does not match its identity and pinned release facts.');
  return expected;
}

/** @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
 * Pin reviewed indirect-collection particulars to an intact public privacy release.
 * Does not determine lawful collection, exceptions, notification timing or delivery.
 */
export function createIndirectCollectionNotice(artifact:LegalArtifact,input:IndirectCollectionNoticeSettings,options:ValidationOptions={}):IndirectCollectionNotice {
  const s=normalizeIndirectCollectionNoticeSettings(input);
  const bad=():never=>{throw Error('Select declared indirect-collection facts from an intact public privacy release.');};
  if(options.mode!==undefined&&options.mode!=='production'&&options.mode!=='preview')return bad();
  const manifest=artifact?.manifest;
  if(!manifest||manifest.schemaVersion!==1||!Array.isArray(manifest.documents)||(manifest.mode!=='production'&&manifest.mode!=='preview'))return bad();
  const {artifactId,...descriptor}=manifest;
  if(sha256(canonicalJson(descriptor))!==artifactId)return bad();
  const config=toPublicConfig(artifact.publicConfig,{mode:manifest.mode});
  if(config.site.id!==manifest.siteId||config.site.locale!==manifest.locale||sha256(canonicalJson(config))!==manifest.configSha256||canonicalJson(config)!==canonicalJson(artifact.publicConfig))return bad();
  if(!config.localization?.indirectCollection)requireEnglishSurface(config,'Indirect-collection notice without localization.indirectCollection');
  const localization=config.localization?.indirectCollection?selectIndirectCollectionLocalization(config.localization):undefined;
  const docs=manifest.documents.filter(d=>d?.kind==='privacy');if(docs.length!==1)return bad();
  const d=docs[0]!,model=artifact.documents?.privacy,page=artifact.pages?.[d.file],configured=config.documents.privacy;
  if(!model||model.kind!=='privacy'||typeof page!=='string'||sha256(page)!==d.sha256||sha256(canonicalJson({title:model.title,sections:model.sections}))!==d.contentSha256||d.file!==`${configured.route.slice(1)}/index.html`||d.route!==configured.route||d.title!==configured.title||d.version!==configured.version||d.effectiveDate!==configured.effectiveDate||d.reviewStatus!==configured.review.status||model.title!==d.title||model.version!==d.version||model.route!==d.route||model.effectiveDate!==d.effectiveDate||model.reviewStatus!==d.reviewStatus)return bad();
  const collections=s.collections.map(c=>{const purpose=config.purposes.find(p=>p.id===c.purposeId);if(!purpose||purpose.collection.source==='direct'||c.dataCategories.some(category=>!purpose.dataCategories.includes(category)))return bad();return {...c,purpose};});
  const {title,version,effectiveDate,sha256:htmlHash,contentSha256,reviewStatus}=d;
  const notice=normalizeIndirectCollectionNotice({...s,schemaVersion:localization?2:1,kind:'indirect-collection-notice',renderingPolicy:localization?'indirect-collection-v2':'indirect-collection-v1',...(localization?{localization}:{}),noticeId:'0'.repeat(64),siteId:config.site.id,siteUrl:config.site.url,locale:config.site.locale,artifactId,mode:manifest.mode,collector:{name:config.controller.name,email:config.controller.email,address:config.controller.address},collections,document:{title,version,effectiveDate,sha256:htmlHash,contentSha256,reviewStatus,url:`/artifacts/${artifactId}/privacy.html`}},{allowPreview:options.mode==='preview'});
  const {noticeId:_,...noticeDescriptor}=notice;
  return {...notice,noticeId:sha256(canonicalJson(noticeDescriptor))};
}

/** @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
 * Recompute identity and compare selected facts with a trusted release. This does not authenticate either author.
 */
export function verifyIndirectCollectionNotice(input:unknown,artifact:LegalArtifact,options:ValidationOptions={}):IndirectCollectionNotice {
  const n=normalizeIndirectCollectionNotice(input,{allowPreview:options.mode==='preview'});
  const expected=createIndirectCollectionNotice(artifact,{profile:n.profile,scopeId:n.scopeId,phase:n.phase,reviewStatus:n.reviewStatus,wording:n.wording,collections:n.collections.map(({purpose:_,...selection})=>selection),recipientStatement:n.recipientStatement,accessCorrection:n.accessCorrection},options);
  if(canonicalJson(n)!==canonicalJson(expected))throw Error('The indirect notice does not match its identity and pinned release facts.');
  return expected;
}

/** @requirements REQ-PRODUCT-FORM-PERMISSIONS Pin one stable purpose/channel permission to a reviewed privacy release. */
export function createFormPermissionOffer(artifact:LegalArtifact,settings:FormPermissionSettings,options:ValidationOptions={}):FormPermissionOffer {
  if(!artifact.publicConfig.localization?.formPermission)requireEnglishSurface(artifact.publicConfig,'Form permission without localization.formPermission');
  const localization=artifact.publicConfig.localization?.formPermission?selectFormPermissionLocalization(artifact.publicConfig.localization):undefined;
  const notice=directCollectionFacts(artifact,{scopeId:settings.permissionId,purposeIds:[settings.purposeId],reviewStatus:settings.reviewStatus,wording:{title:settings.wording.title,intro:settings.wording.statement}},options);
  const guard=scopeGuardContext(artifact.publicConfig.scopeGuards,settings.purposeId)??null;
  const value=normalizeFormPermissionOffer({schemaVersion:localization?2:1,...(localization?{localization}:{}),offerId:'0'.repeat(64),siteId:notice.siteId,permissionId:settings.permissionId,purposeId:settings.purposeId,channel:settings.channel,revision:settings.revision,artifactId:notice.artifactId,mode:notice.mode,reviewStatus:settings.reviewStatus,document:notice.document,facts:{controller:notice.controller,purpose:notice.purposes[0]!,recipients:notice.recipients,privacy:notice.privacy,scopeGuard:guard},wording:settings.wording,withdrawalUrl:settings.withdrawalUrl,deliveryWindowSeconds:settings.deliveryWindowSeconds??600},{allowPreview:options.mode==='preview'});
  const {offerId:_,...descriptor}=value;return {...value,offerId:sha256(canonicalJson(descriptor))};
}
// @requirements REQ-PRODUCT-TERMS-AUTHORING
