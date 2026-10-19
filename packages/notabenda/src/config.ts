import {isResourceOrigin,isSafeLink} from './safe-links.js';
export {isResourceOrigin,isSafeLink} from './safe-links.js';
// @requirements REQ-GOOGLE-MODE
import {normalizeGoogleBasic} from './google-basic-policy.js';
// @requirements REQ-PRODUCT-RIGHTS-CENTER
import {normalizeRightsCenter} from './rights-policy.js';
// @requirements REQ-PRODUCT-SCOPE-GUARDS
import {normalizeScopeGuardPolicy} from './scope-guard-policy.js';
import {evaluateScopeGuards} from './scope-guards.js';
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
import type { Diagnostic, PublicSiteConfig, RequirementId, SiteConfig, ValidationOptions, ValidationResult } from './types.js';
import { isPromptPolicy } from './prompt-policy.js';

const own = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const record = (value: unknown): Record<string, unknown> => own(value) ? value : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
export const documentKinds = ['privacy', 'cookies', 'terms'] as const;

// @requirements REQ-PRODUCT-EMBEDS Link/origin validators are shared with the bounded browser parser.
export class SiteConfigError extends Error {
  readonly diagnostics: Diagnostic[];
  constructor(diagnostics: Diagnostic[]) {
    super(diagnostics.filter(d => d.severity === 'error').map(d => `${d.path}: ${d.message}`).join('\n'));
    this.name = 'SiteConfigError';
    this.diagnostics = diagnostics;
  }
}

/** @requirements REQ-PRODUCT-CONFIG REQ-EU-NOTICE REQ-NZ-NOTICE REQ-EU-TERMS REQ-PRODUCT-SAFE-CONTENT */
export function validateSiteConfig(input: unknown, options: ValidationOptions = {}): ValidationResult {
  const diagnostics: Diagnostic[] = [];
  const error = (path: string, message: string, code = 'invalid-field', ids: RequirementId[] = ['REQ-PRODUCT-CONFIG']) => diagnostics.push({ path, message, code, requirementIds: ids, severity: 'error' });
  const placeholder = (value: unknown, path: string) => {
    if (options.mode === 'production' && typeof value === 'string' && /\{\{[^{}]+\}\}/u.test(value)) error(path, 'Replace the unresolved template placeholder before production output.', 'unresolved-placeholder', ['REQ-PRODUCT-DOCUMENTS']);
  };
  const required = (obj: Record<string, unknown>, key: string, path: string, ids?: RequirementId[]) => {
    if (!text(obj[key])) error(`${path}.${key}`, 'Provide a nonempty text value.', 'required-field', ids);
    placeholder(obj[key], `${path}.${key}`);
  };
  const objectAt = (value: unknown, path: string) => { if (!own(value)) error(path, 'Provide an object.'); return record(value); };
  const strings = (value: unknown, path: string, nonempty = false) => {
    if (!Array.isArray(value) || (nonempty && !value.length) || list(value).some(v => !text(v))) error(path, nonempty ? 'Provide a nonempty array of text values.' : 'Provide an array of text values.');
    list(value).forEach((v, i) => placeholder(v, `${path}[${i}]`));
  };
  const choice = (value: unknown, allowed: readonly string[], path: string) => { if (typeof value !== 'string' || !allowed.includes(value)) error(path, `Use one of: ${allowed.join(', ')}.`); };
  const link = (value: unknown, path: string) => { if (!isSafeLink(value)) error(path, 'Use a safe HTTPS, mailto, or same-site path link.', 'unsafe-link', ['REQ-PRODUCT-SAFE-CONTENT']); placeholder(value, path); };
  const contact = (value: unknown, path: string) => {
    const obj = objectAt(value, path);
    required(obj, 'name', path); required(obj, 'email', path);
    if (text(obj.email) && !isSafeLink(`mailto:${obj.email}`)) error(`${path}.email`, 'Provide a plain email address without URI parameters or control characters.');
    if (obj.address !== undefined) required(obj, 'address', path);
    return obj;
  };
  const config = objectAt(input, 'config');
  if (options.mode !== undefined && options.mode !== 'preview' && options.mode !== 'production') error('options.mode', 'Use preview or production mode.');
  if (config.schemaVersion !== 1) error('schemaVersion', 'Use schemaVersion 1.', 'unsupported-schema');
  const site = objectAt(config.site, 'site');
  for (const key of ['id', 'name', 'url', 'locale', 'description']) required(site, key, 'site');
  if (text(site.id) && !/^[a-z][a-z0-9-]*$/u.test(site.id)) error('site.id', 'Use a lowercase slug starting with a letter.');
  if (text(site.url)) {
    try { const url = new URL(site.url); if (!isSafeLink(site.url) || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error(); }
    catch { error('site.url', 'Use an absolute HTTPS site URL without credentials, query, or fragment.'); }
  }
  if (text(site.locale)) {
    try { if (!Intl.getCanonicalLocales(site.locale).length || !/^en(?:-|$)/iu.test(site.locale)) throw new Error(); }
    catch { error('site.locale', 'This initial renderer supports English locales (en or en-*).', 'unsupported-locale'); }
  }
  const controller = contact(config.controller, 'controller');
  required(controller, 'address', 'controller', ['REQ-EU-NOTICE', 'REQ-NZ-NOTICE']);
  for (const key of ['representative', 'dpo']) if (controller[key] !== undefined) contact(controller[key], `controller.${key}`);
  strings(config.jurisdictions, 'jurisdictions');
  for (const key of ['purposes', 'services', 'storage']) if (!Array.isArray(config[key])) error(key, 'Provide an array, including [] when none are declared.');
  const ids = (value: unknown, path: string) => {
    const seen = new Set<string>();
    for (const [i, entry] of list(value).entries()) {
      const item = objectAt(entry, `${path}[${i}]`);
      if (!text(item.id) || !/^[a-z][a-z0-9-]*$/u.test(item.id)) error(`${path}[${i}].id`, 'Provide a stable lowercase slug.');
      else if (seen.has(item.id)) error(`${path}[${i}].id`, 'IDs must be unique within this collection.', 'duplicate-id');
      else seen.add(item.id);
    }
    return seen;
  };
  const purposeIds = ids(config.purposes, 'purposes');
  const serviceIds = ids(config.services, 'services');
  ids(config.storage, 'storage');
  for (const [i, value] of list(config.purposes).entries()) {
    const p = record(value); const path = `purposes[${i}]`;
    for (const key of ['name', 'description', 'legalBasis', 'retention']) required(p, key, path, ['REQ-EU-NOTICE']);
    strings(p.dataCategories, `${path}.dataCategories`, true);
    const collection = objectAt(p.collection, `${path}.collection`);
    choice(collection.source, ['direct', 'indirect', 'both'], `${path}.collection.source`);
    required(collection, 'description', `${path}.collection`);
    required(collection, 'consequences', `${path}.collection`, ['REQ-NZ-NOTICE']);
    if (typeof collection.required !== 'boolean') error(`${path}.collection.required`, 'Declare whether this collection is required.');
  }
  for (const [i, value] of list(config.services).entries()) {
    const service = record(value); const path = `services[${i}]`;
    for (const key of ['name', 'provider', 'location']) required(service, key, path);
    strings(service.purposeIds, `${path}.purposeIds`, true);
    for (const id of list(service.purposeIds)) if (typeof id === 'string' && !purposeIds.has(id)) error(`${path}.purposeIds`, 'Reference a declared purpose.', 'unknown-purpose');
    if(service.googleBasic!==undefined){
      try{normalizeGoogleBasic(service.googleBasic,list(service.purposeIds).filter((id):id is string=>typeof id==='string'));}catch{error(`${path}.googleBasic`,'Declare version 1, unique G-/AW- tag IDs and all four signal purpose arrays covering exactly the service purposes; empty arrays remain denied.','invalid-google-basic',['REQ-GOOGLE-MODE']);}
      if(!list(record(config.consent).services).map(record).some(entry=>entry.id===service.id))error(`${path}.googleBasic`,'Google Basic must be a declared optional consent-managed service.','google-basic-scope',['REQ-GOOGLE-MODE']);
      if(!list(service.resourceOrigins).includes('https://www.googletagmanager.com'))error(`${path}.resourceOrigins`,'Declare the initial Google tag origin https://www.googletagmanager.com.','google-basic-origin',['REQ-GOOGLE-MODE']);
      if(service.processingActivities===undefined)error(`${path}.processingActivities`,'Explicitly classify the Google service’s processing activities; use [] when none apply.','google-basic-processing',['REQ-GOOGLE-MODE','REQ-PRODUCT-PRIVACY-SIGNALS']);
    }
    if (service.privacyUrl !== undefined) link(service.privacyUrl, `${path}.privacyUrl`);
    // @requirements REQ-PRODUCT-PRIVACY-SIGNALS
    if(service.processingActivities!==undefined&&(!Array.isArray(service.processingActivities)||new Set(list(service.processingActivities)).size!==list(service.processingActivities).length||list(service.processingActivities).some(activity=>typeof activity!=='string'||!['sale','sharing','targeted-advertising'].includes(activity))))error(`${path}.processingActivities`,'Declare unique sale, sharing or targeted-advertising activities, or an empty array.','invalid-processing-activities',['REQ-PRODUCT-PRIVACY-SIGNALS']);
    if(config.privacySignals!==undefined&&service.processingActivities===undefined)error(`${path}.processingActivities`,'Explicitly classify every service when privacy signals are enabled; use [] for none.','unclassified-processing',['REQ-PRODUCT-PRIVACY-SIGNALS']);
    if(service.resourceOrigins!==undefined){
      const origins=list(service.resourceOrigins);
      if(!Array.isArray(service.resourceOrigins)||!origins.length||origins.length>16||new Set(origins).size!==origins.length||origins.some(origin=>!isResourceOrigin(origin)))error(`${path}.resourceOrigins`,'Declare 1–16 unique canonical HTTPS origins or self.','invalid-resource-origins',['REQ-PRODUCT-EMBEDS']);
    }
  }
  // @requirements REQ-PRODUCT-PRIVACY-SIGNALS
  if(config.privacySignals!==undefined){
    const signals=objectAt(config.privacySignals,'privacySignals');const gpc=objectAt(signals.globalPrivacyControl,'privacySignals.globalPrivacyControl');
    const applies=list(gpc.appliesTo);
    if(!Array.isArray(gpc.appliesTo)||!applies.length||new Set(applies).size!==applies.length||applies.some(activity=>typeof activity!=='string'||!['sale','sharing','targeted-advertising'].includes(activity)))error('privacySignals.globalPrivacyControl.appliesTo','Select unique declared processing activities for this host policy.','invalid-signal-policy',['REQ-PRODUCT-PRIVACY-SIGNALS']);
    required(gpc,'explanation','privacySignals.globalPrivacyControl',['REQ-PRODUCT-PRIVACY-SIGNALS']);
  }
  for (const [i, value] of list(config.storage).entries()) {
    const item = record(value); const path = `storage[${i}]`;
    for (const key of ['name', 'serviceId', 'duration']) required(item, key, path);
    choice(item.type, ['cookie', 'localStorage', 'sessionStorage', 'indexedDB', 'other'], `${path}.type`);
    choice(item.classification, ['necessary', 'optional'], `${path}.classification`);
    if (typeof item.serviceId === 'string' && !serviceIds.has(item.serviceId)) error(`${path}.serviceId`, 'Reference a declared service.', 'unknown-service');
    if (item.classification === 'necessary') required(item, 'necessityReason', path);
    else if (item.necessityReason !== undefined) required(item, 'necessityReason', path);
  }
  // @requirements REQ-EU-DEVICE REQ-EU-FAIR-CHOICE: optional runtime scope must match the declared inventory.
  if (config.consent !== undefined) {
    const consent = objectAt(config.consent, 'consent');
    for (const key of ['purposes', 'services']) if (!Array.isArray(consent[key])) error(`consent.${key}`, 'Provide an array of inventory IDs and material scope versions.');
    const optionalPurposes = ids(consent.purposes, 'consent.purposes');
    const optionalServices = ids(consent.services, 'consent.services');
    for (const key of ['purposes', 'services']) for (const [i, value] of list(consent[key]).entries()) {
      const entry = record(value); const path = `consent.${key}[${i}]`;
      required(entry, 'scope', path);
      if (text(entry.scope) && entry.scope.length > 200) error(`${path}.scope`, 'Scope versions must be at most 200 characters.');
      if (typeof entry.id === 'string' && !(key === 'purposes' ? purposeIds : serviceIds).has(entry.id)) error(`${path}.id`, 'Reference an item in the site inventory.');
    }
    for (const service of list(config.services).map(record)) if (optionalServices.has(String(service.id))) {
      if (!list(service.purposeIds).length || list(service.purposeIds).some(id => typeof id !== 'string' || !optionalPurposes.has(id))) error('consent.services', 'Every purpose of a consent-managed service must be explicitly consent-managed.');
    }
    for (const purpose of optionalPurposes) if (!list(config.services).map(record).some(service => optionalServices.has(String(service.id)) && list(service.purposeIds).includes(purpose))) error('consent.purposes', 'Every consent-managed purpose needs a declared consent-managed service.');
    for (const item of list(config.storage).map(record)) if (item.classification === 'optional' && !optionalServices.has(String(item.serviceId))) error('consent.services', 'Declare every optional-storage service in the runtime scope.');
    for (const key of ['grantLifetimeDays', 'refusalLifetimeDays']) if (!Number.isInteger(consent[key]) || Number(consent[key]) < 1 || Number(consent[key]) > 730) error(`consent.${key}`, 'Choose an explicit lifetime from 1 to 730 days; check applicable rules.');
    if (!Number.isInteger(consent.dismissalMinutes) || Number(consent.dismissalMinutes) < 0 || Number(consent.dismissalMinutes) > 43200) error('consent.dismissalMinutes', 'Choose a separate dismissal suppression from 0 to 43200 minutes. Dismissal grants nothing.');
    if (consent.promptPolicy !== undefined) {
      if (!isPromptPolicy(consent.promptPolicy)) error('consent.promptPolicy', 'Declare the supported profile, a bounded processing revision and, optionally, one exact prior revision with a public significant-change summary.', 'invalid-prompt-policy', ['REQ-IT-REPROMPT','REQ-PRODUCT-CONFIG']);
      placeholder(record(record(consent.promptPolicy).materialChange).summary, 'consent.promptPolicy.materialChange.summary');
    }
    if (optionalPurposes.size > 40 || optionalServices.size > 80) error('consent', 'This runtime supports at most 40 optional purposes and 80 optional services.');
  }
  const privacy = objectAt(config.privacy, 'privacy');
  strings(privacy.rights, 'privacy.rights', true);
  for (const key of ['transfers', 'automatedDecisions']) required(privacy, key, 'privacy', ['REQ-EU-NOTICE']);
  if (privacy.rightsUrl !== undefined) link(privacy.rightsUrl, 'privacy.rightsUrl');
  const complaints = objectAt(privacy.complaints, 'privacy.complaints');
  required(complaints, 'description', 'privacy.complaints', ['REQ-EU-NOTICE']);
  if (complaints.url !== undefined) link(complaints.url, 'privacy.complaints.url');
  if (privacy.requiredContacts !== undefined) {
    strings(privacy.requiredContacts, 'privacy.requiredContacts');
    for (const key of list(privacy.requiredContacts)) {
      if (key !== 'dpo' && key !== 'representative') error('privacy.requiredContacts', 'Use dpo or representative.');
      else if (!own(controller[key])) error(`controller.${key}`, 'Provide the contact declared applicable.', 'missing-applicable-contact', ['REQ-EU-NOTICE']);
    }
  }
  const terms = objectAt(config.terms, 'terms');
  choice(terms.audience, ['business', 'consumer', 'mixed'], 'terms.audience');
  choice(terms.serviceType, ['informational', 'service', 'subscription', 'commerce', 'other'], 'terms.serviceType');
  const documents = objectAt(config.documents, 'documents');
  const routes = new Set<string>();
  for (const kind of documentKinds) {
    const path = `documents.${kind}`; const doc = objectAt(documents[kind], path);
    for (const key of ['title', 'version', 'effectiveDate', 'route']) required(doc, key, path);
    if (text(doc.route)) {
      if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/u.test(doc.route)) error(`${path}.route`, 'Use a clean absolute path such as /legal/privacy.', 'unsafe-route', ['REQ-PRODUCT-SAFE-CONTENT']);
      if (routes.has(doc.route.toLowerCase())) error(`${path}.route`, 'Each document needs a different route.', 'duplicate-route');
      routes.add(doc.route.toLowerCase());
    }
    if (text(doc.effectiveDate) && (!/^\d{4}-\d{2}-\d{2}$/u.test(doc.effectiveDate) || !Number.isFinite(Date.parse(doc.effectiveDate)) || new Date(doc.effectiveDate).toISOString().slice(0, 10) !== doc.effectiveDate)) error(`${path}.effectiveDate`, 'Use a real calendar date in YYYY-MM-DD format.');
    choice(doc.source, ['generated', 'supplied'], `${path}.source`);
    const review = objectAt(doc.review, `${path}.review`);
    choice(review.status, ['draft', 'reviewed'], `${path}.review.status`);
    if (kind === 'terms' && doc.source !== 'supplied') error(`${path}.source`, 'Supply reviewed terms; contractual clause generation is not implemented.', 'supplied-terms-required', ['REQ-EU-TERMS']);
    if (options.mode === 'production' && review.status !== 'reviewed') error(`${path}.review.status`, 'Production output requires an explicit reviewed-content declaration.', 'unreviewed-content', ['REQ-PRODUCT-DOCUMENTS', ...(kind === 'terms' ? ['REQ-EU-TERMS' as const] : [])]);
    if (doc.source === 'supplied' && (!Array.isArray(doc.sections) || !doc.sections.length)) error(`${path}.sections`, 'Supplied documents require at least one section.');
    if (doc.sections !== undefined && !Array.isArray(doc.sections)) error(`${path}.sections`, 'Provide an array of structured sections.');
    ids(doc.sections, `${path}.sections`);
    for (const [i, sectionValue] of list(doc.sections).entries()) {
      const section = record(sectionValue); const sectionPath = `${path}.sections[${i}]`;
      required(section, 'heading', sectionPath);
      for (const key of ['paragraphs', 'items']) if (section[key] !== undefined) strings(section[key], `${sectionPath}.${key}`, true);
      if (section.links !== undefined) {
        if (!Array.isArray(section.links) || !section.links.length) error(`${sectionPath}.links`, 'Provide a nonempty array of links.');
        for (const [j, value] of list(section.links).entries()) { const obj = objectAt(value, `${sectionPath}.links[${j}]`); required(obj, 'label', `${sectionPath}.links[${j}]`); link(obj.href, `${sectionPath}.links[${j}].href`); }
      }
      if (section.table !== undefined) {
        const table = objectAt(section.table, `${sectionPath}.table`);
        required(table, 'caption', `${sectionPath}.table`);
        strings(table.columns, `${sectionPath}.table.columns`, true);
        if (!Array.isArray(table.rows)) error(`${sectionPath}.table.rows`, 'Provide an array of rows.');
        for (const [j, row] of list(table.rows).entries()) {
          strings(row, `${sectionPath}.table.rows[${j}]`, true);
          if (list(row).length !== list(table.columns).length) error(`${sectionPath}.table.rows[${j}]`, 'Each row must match the column count.');
        }
      }
      if (!list(section.paragraphs).length && !list(section.items).length && !list(section.links).length && !own(section.table)) error(sectionPath, 'Provide section text, items, links, or a table.');
    }
  }
  if(config.rightsCenter!==undefined)try{
    const center=normalizeRightsCenter(config.rightsCenter);
    if(routes.has(center.route.toLowerCase()))error('rightsCenter.route','The rights page must have its own route.','duplicate-route',['REQ-PRODUCT-RIGHTS-CENTER']);
    if(privacy.rightsUrl!==undefined&&privacy.rightsUrl!==center.route)error('privacy.rightsUrl','Use the declared rights center route, or omit rightsUrl to link it automatically.','rights-route-conflict',['REQ-PRODUCT-RIGHTS-CENTER']);
    if(options.mode==='production'&&center.reviewStatus!=='reviewed')error('rightsCenter.reviewStatus','Review the rights page wording and configured workflows before production output.','unreviewed-content',['REQ-PRODUCT-RIGHTS-CENTER']);
    const inspect=(value:unknown,path:string)=>{if(typeof value==='string')placeholder(value,path);else if(Array.isArray(value))value.forEach((item,i)=>inspect(item,`${path}[${i}]`));else if(own(value))for(const [key,item] of Object.entries(value))inspect(item,path+'.'+key);};inspect(center,'rightsCenter');
  }catch{error('rightsCenter','Provide a bounded rights page with explicit public contact, distinct actions and safe destinations.','invalid-rights-center',['REQ-PRODUCT-RIGHTS-CENTER']);}
  if(config.scopeGuards===undefined){diagnostics.push({path:'scopeGuards',code:'unassessed-scope',message:'Scope guards are not configured. The generic runtime does not establish support for child-data, sensitive-data, high-risk profiling or sector workflows.',severity:'warning',requirementIds:['REQ-PRODUCT-CONFIG']});}
  else try{
    const normalized=normalizeScopeGuardPolicy(config.scopeGuards,[...purposeIds]);placeholder(normalized.revision,'scopeGuards.revision');
    if(!diagnostics.some(d=>d.severity==='error')){const decision=evaluateScopeGuards(config as unknown as PublicSiteConfig);if(decision.status==='restricted')diagnostics.push({path:'scopeGuards',code:'restricted-scope',message:'Declared present or unknown facts require a separate supported process. Affected optional purposes remain blocked; static notices and terms remain available.',severity:'warning',requirementIds:['REQ-PRODUCT-CONFIG',...new Set(Object.values(decision.purposeRestrictions).flat().flatMap(reason=>reason.requirementIds))]});}
  }catch{error('scopeGuards','Use a versioned scope-guard declaration with explicit facts and declared purpose IDs. Keep assessment notes private.','invalid-scope-guards');}
  return { valid: !diagnostics.some(d => d.severity === 'error'), diagnostics };
}

/** A typed authoring helper; unknown JSON should use validateSiteConfig/toPublicConfig. */
export function defineSite<T extends SiteConfig>(config: T): T {
  const result = validateSiteConfig(config);
  if (!result.valid) throw new SiteConfigError(result.diagnostics);
  return config;
}

/** @requirements REQ-PRODUCT-CONFIG: allowlist at every depth; never spread operator input. */
export function toPublicConfig(input: unknown, options: ValidationOptions = {}): PublicSiteConfig {
  const result = validateSiteConfig(input, options);
  if (!result.valid) throw new SiteConfigError(result.diagnostics);
  const config = input as SiteConfig;
  const contact = (c: SiteConfig['controller']['dpo']) => c && ({ name: c.name, email: c.email, ...(c.address === undefined ? {} : { address: c.address }) });
  return {
    schemaVersion: 1,
    site: { id: config.site.id, name: config.site.name, url: config.site.url, locale: config.site.locale, description: config.site.description },
    controller: { name: config.controller.name, email: config.controller.email, address: config.controller.address,
      ...(config.controller.dpo === undefined ? {} : { dpo: contact(config.controller.dpo)! }),
      ...(config.controller.representative === undefined ? {} : { representative: contact(config.controller.representative)! }) },
    jurisdictions: [...config.jurisdictions],
    ...(config.rightsCenter===undefined?{}:{rightsCenter:normalizeRightsCenter(config.rightsCenter)}),
    ...(config.scopeGuards===undefined?{}:{scopeGuards:normalizeScopeGuardPolicy(config.scopeGuards,config.purposes.map(p=>p.id))}),
    purposes: config.purposes.map(p => ({ id: p.id, name: p.name, description: p.description, legalBasis: p.legalBasis, dataCategories: [...p.dataCategories], retention: p.retention, collection: { source: p.collection.source, description: p.collection.description, required: p.collection.required, consequences: p.collection.consequences } })),
    services: config.services.map(s => ({ ...(s.googleBasic===undefined?{}:{googleBasic:normalizeGoogleBasic(s.googleBasic,s.purposeIds)}),id: s.id, name: s.name, provider: s.provider, purposeIds: [...s.purposeIds], location: s.location, ...(s.privacyUrl === undefined ? {} : { privacyUrl: s.privacyUrl }), ...(s.resourceOrigins===undefined?{}:{resourceOrigins:[...s.resourceOrigins]}), ...(s.processingActivities===undefined?{}:{processingActivities:[...s.processingActivities]}) })),
    storage: config.storage.map(s => ({ id: s.id, name: s.name, type: s.type, serviceId: s.serviceId, duration: s.duration, classification: s.classification, ...(s.necessityReason === undefined ? {} : { necessityReason: s.necessityReason }) })),
    privacy: { rights: [...config.privacy.rights], transfers: config.privacy.transfers, automatedDecisions: config.privacy.automatedDecisions,
      complaints: { description: config.privacy.complaints.description, ...(config.privacy.complaints.url === undefined ? {} : { url: config.privacy.complaints.url }) },
      ...(config.privacy.rightsUrl===undefined&&config.rightsCenter===undefined?{}:{rightsUrl:config.rightsCenter?.route??config.privacy.rightsUrl!}),
      ...(config.privacy.requiredContacts === undefined ? {} : { requiredContacts: [...config.privacy.requiredContacts] }) },
    terms: { audience: config.terms.audience, serviceType: config.terms.serviceType },
    ...(config.privacySignals===undefined?{}:{privacySignals:{globalPrivacyControl:{appliesTo:[...config.privacySignals.globalPrivacyControl.appliesTo],explanation:config.privacySignals.globalPrivacyControl.explanation}}}),
    ...(config.consent === undefined ? {} : { consent: {
      purposes: config.consent.purposes.map(p => ({ id: p.id, scope: p.scope })),
      services: config.consent.services.map(s => ({ id: s.id, scope: s.scope })),
      grantLifetimeDays: config.consent.grantLifetimeDays, refusalLifetimeDays: config.consent.refusalLifetimeDays, dismissalMinutes: config.consent.dismissalMinutes,
      ...(config.consent.promptPolicy === undefined ? {} : {promptPolicy: { profile:config.consent.promptPolicy.profile, processingRevision:config.consent.promptPolicy.processingRevision, ...(config.consent.promptPolicy.materialChange === undefined ? {} : {materialChange:{fromRevision:config.consent.promptPolicy.materialChange.fromRevision,summary:config.consent.promptPolicy.materialChange.summary}}) }}),
    } }),
    documents: Object.fromEntries(documentKinds.map(kind => { const d = config.documents[kind]; return [kind, { title: d.title, route: d.route, version: d.version, effectiveDate: d.effectiveDate, source: d.source, review: { status: d.review.status },
      ...(d.sections === undefined ? {} : { sections: d.sections.map(s => ({ id: s.id, heading: s.heading, ...(s.paragraphs === undefined ? {} : { paragraphs: [...s.paragraphs] }), ...(s.items === undefined ? {} : { items: [...s.items] }), ...(s.links === undefined ? {} : { links: s.links.map(l => ({ label: l.label, href: l.href })) }), ...(s.table === undefined ? {} : { table: { caption: s.table.caption, columns: [...s.table.columns], rows: s.table.rows.map(row => [...row]) } }) })) }) }]; })) as PublicSiteConfig['documents'],
  };
}
