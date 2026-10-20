// @requirements REQ-PRODUCT-PRIVACY-PACKS REQ-NZ-INDIRECT
// @requirements REQ-EU-INTERESTS-DISCLOSURE
// @requirements REQ-QC-PROFILING
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {setupQuestions,setupMarkets,setupFactFields} from './setup.js';
import type {SetupQuestionId} from './setup.js';

interface Target {
 title:string; outcome:string; configPaths:string[]; hostWork:string[];
 questionIds:SetupQuestionId[]; factsNeeded:string[]; guides:string[];
 prerequisites:string[]; verify:string[]; requiredConfigPaths?:string[];
 conditionalConfig?:{when:'site-locale-not-english';requiredPaths:string[];reason:string}[];
}
const targets:Record<string,Target>={
 'legal-pages':{
  title:'Privacy, cookie and terms pages',outcome:'Static documents or article fragments in the host layout.',
  configPaths:['site','controller','jurisdictions','purposes','purposes.legitimateInterests','services','storage','privacy','terms','documents'],
  hostWork:['Choose routes and build integration; supply reviewed wording. Rendering a document does not collect agreement or gate services.','The JSON CLI builds all three configured documents. Use renderer fragments when the host needs only selected documents.'],
  questionIds:['personal-data','transfers'],factsNeeded:['Public operator/contact facts','Actual processing purposes, legal bases, categories, collection, retention, recipients and transfers; public interests pursued and by whom where legitimate interests applies (purposes.legitimateInterests)','Intended audience and service type','Document routes, revisions and review state'],guides:['package','authoring'],prerequisites:[],
  verify:['Legal routes render without JavaScript.','Public output excludes private fields.','Production validation rejects unresolved facts and draft declarations.']
 },
 'authored-documents':{
  title:'Markdown or MDX documents',outcome:'Build-time authored documents with YAML frontmatter and retained revisions.',
  configPaths:['documents'],hostWork:['Use @notabenda/authoring compileAuthoredDocuments, not a Markdown CLI flag.','Treat MDX imports/components as trusted build code; keep source archives private.'],
  questionIds:['authored-content'],factsNeeded:['Trusted source files and component imports','Stable section IDs, document version/effective date and actual review decision'],guides:['authoring','releases'],prerequisites:['legal-pages'],verify:['Compile the actual sources.','Verify public HTML and private source archive separation.','Pinned prior versions survive a clean build.']
 },
 'cookie-consent':{
  requiredConfigPaths:['consent','consent.purposes','consent.services'],
  title:'Cookie and optional-service controls',outcome:'Optional loaders run only while their declared purpose/service permission is effective.',
  configPaths:['purposes','services','storage','consent','consent.purposes','consent.services','consent.information','scopeGuards'],hostWork:['Register actual start/cleanup lifecycles and remove parallel tags, hints or loaders.','Choose vanilla, React or Astro controls around the same controller.'],
  questionIds:['optional-storage','children','sensitive-data','high-risk-profiling','regulated-sector'],factsNeeded:['Actual optional loaders, storage names/types and cleanup targets','Purpose/service IDs and deliberate material scope revisions','Grant/refusal lifetimes and dismissal interval','Scope assessments; present or unknown specialized processing remains gated'],guides:['consent','storage-cleanup','scope-guards','react','astro'],prerequisites:['legal-pages'],verify:['No optional request on initial load or after rejection.','Granular grants start only the selected work.','Withdrawal stops owned work and clears declared markers.','Reload, changed scopes and failure states retain restrictions.']
 },
 'technology-functions':{
  requiredConfigPaths:['scopeGuards'],
  title:'Technology collection notices',outcome:'A static, versioned disclosure of identification, location or profiling functions and their activation method.',configPaths:['purposes','services','consent.services.scope','scopeGuards','documents.privacy'],hostWork:['Use the optional build-only notabenda/technology API; supply reviewed function/activation copy and assign technologyCollectionScope(settings) before compiling.','Place the notice before every activation opportunity, including global choices; use existing gated lifecycles and on-demand native controls when appropriate.','Retain the exact descriptor separately from its legal artifact. Ordinary consent receipts do not automatically archive this supplemental notice.'],questionIds:['technology-functions'],factsNeeded:['Actual covered technology, provider and all collection purposes','Necessity, applicable scope and specialized processing assessment','Public function declarations, activation instructions, complete host-language labels and review','Fresh service material scope and actual cleanup'],guides:['technology-collection','consent','scope-guards'],prerequisites:['cookie-consent'],verify:['The disclosure and activation instructions render without JavaScript.','Opening the controls does not activate the function.','Old generic grants cannot start the new function.','Actual service starts, withdrawal, receipt failure and processing restrictions retain the existing gates.']
 },
 'storage-exceptions':{
  requiredConfigPaths:['storageExceptions','storageExceptions.entries','scopeGuards'],
  title:'Assessed storage-exception settings',outcome:'Separate objection controls for explicitly assessed supported storage uses, with their own preference journal and lifecycles.',
  configPaths:['storageExceptions','storageExceptions.entries','scopeGuards','purposes','services.processingActivities','storage'],
  hostWork:['Assess the selected supported profile and each declared condition; do not select it from a country or locale alone.','Register exception-owned lifecycles, hydrate the journal and present the information/objection controls before starting work. Keep exception services/purposes out of consent enrollment.','Use the headless controller with host-supplied wording for non-English UI; the packaged exception controls currently require English.'],
  questionIds:['children','sensitive-data','high-risk-profiling','regulated-sector'],
  factsNeeded:['Actual service, purpose and storage ownership; technical separation from consent-managed work','Supported profile, every eligibility condition and independent processing basis assessment','Information, free objection route, preference storage and reviewed scope facts'],
  guides:['storage-exceptions','scope-guards','storage-cleanup'],prerequisites:['legal-pages'],
  verify:['Initial hydration and presentation precede any managed work.','Objection immediately stops owned work and survives reload and material revisions.','Journal failure, stale tabs and unknown/present restricted scopes keep the service off.','Cookie acceptance never clears an objection.']
 },
 'embeds':{
  title:'Gated media',outcome:'Remote media stays inert until its service is permitted.',configPaths:['services.resourceOrigins'],
  hostWork:['Use inert placeholders and consent-gated resource mounting; audit initial markup and resource hints.'],questionIds:['embeds'],factsNeeded:['Initial resource origins','Actual media elements and their owning service'],guides:['embeds'],prerequisites:['cookie-consent'],verify:['No remote src/hint before permission.','Withdrawal restores the placeholder without granting a new choice.']
 },
 'terms-agreement':{
  conditionalConfig:[{when:'site-locale-not-english',requiredPaths:['localization.terms'],reason:'The native non-English acceptance interface needs the complete selected terms dictionary.'}],
  title:'Explicit agreement to terms',outcome:'An unchecked action bound to an exact terms revision with an acknowledged receipt.',configPaths:['documents.terms','localization.terms'],
  hostWork:['Create/register the exact offer; bind a host context and transport to the agreement control.','A terms page alone is not an agreement flow. Keep cookie preferences separate.'],questionIds:['terms-agreement'],factsNeeded:['Action requiring agreement','Exact terms version and action wording','Host context identity, receipt admission and failure/retry behavior'],guides:['terms'],prerequisites:['legal-pages'],verify:['Initially unchecked.','Displayed document matches the offer revision.','Failure cannot appear acknowledged; successful receipt remains inspectable.']
 },
 'privacy-rights':{
  requiredConfigPaths:['rightsCenter'],
  title:'Privacy request entry points',outcome:'A static page leading to the host’s real request workflows.',configPaths:['privacy','rightsCenter'],hostWork:['Supply real routes/contact fallback and implement request intake and fulfillment.'],questionIds:['personal-data','privacy-request-routes'],factsNeeded:['Available rights and action scope','Actual destinations, contact and next steps'],guides:['rights'],prerequisites:['legal-pages'],verify:['The page works without JavaScript and with keyboard navigation.','Every action reaches the intended host workflow while logged out or without a suitable account.','The public fallback works when the account route cannot be used.','Navigation never claims that a request was submitted, acknowledged or fulfilled.']
 },
 'collection-notice':{
  requiredConfigPaths:['purposes'],
  conditionalConfig:[{when:'site-locale-not-english',requiredPaths:['localization.collection'],reason:'The static non-English collection interface needs the complete selected collection dictionary.'}],
  title:'Information beside a collection form',outcome:'Static purpose disclosures beside host fields, linked to an exact privacy revision.',
  configPaths:['purposes','purposes.collection','documents.privacy','localization.collection'],
  hostWork:['Create and verify a collection notice for one to eight declared direct/mixed-source purposes; supply context-specific title and introduction.','Place the notice at the actual collection surface with unique instance IDs; retain field-specific instructions and implement submission separately. Notice display records no consent or acceptance.'],
  questionIds:['personal-data','direct-collection'],factsNeeded:['Actual collection context, selected purposes and data categories','Whether providing data is optional, what a response needs and consequences of omission','Reviewed wording, recipients and retained privacy revision'],guides:['collection','localization','releases'],prerequisites:['legal-pages'],
  verify:['Notice and details remain readable without JavaScript.','Selected facts and language match the retained release.','Field instructions distinguish purpose-level optionality from individual field requirements.','No permission, acceptance, storage or submission handler is created by the notice.']
 },
 'indirect-collection-notice':{
  requiredConfigPaths:['purposes'],
  title:'Information collected from another source',outcome:'A static notice for the explicitly assessed supported nz-ipp3a particulars, bound to an exact privacy revision.',
  configPaths:['purposes','purposes.collection','controller','documents.privacy'],
  hostWork:['Assess the supported nz-ipp3a profile explicitly; no profile is selected from a market or locale.','Author createIndirectCollectionNotice inputs: phase advance/collected, exact indirect category subsets, sourceDescription and authority for every collection, recipientStatement, accessCorrection, English wording and reviewStatus; the supported renderer currently requires an English locale.','Bind the reviewed release, render static HTML or plain text, and arrange actual presentation/delivery, timing and any notification evidence separately. This implementation preview is not production-supported jurisdiction coverage.','Do not apply localization.collection to this separate renderer; the supported renderer is English-only. Leave another locale unresolved rather than changing it to bypass that limit.'],
  questionIds:['personal-data','indirect-collection'],factsNeeded:['Applicable notification rule and reviewed profile choice','Actual indirect or mixed purposes and exact indirectly collected categories','Source, recipients, authority declaration, collecting/holding agency and access/correction route','Advance/collected phase, language, privacy release and actual notification method/timing'],guides:['indirect-collection','releases'],prerequisites:['legal-pages'],
  verify:['The notice remains readable without JavaScript and creates no consent, submission or notification-success state.','The privacy link and particulars match the pinned release.','Mixed-source purposes include only the explicit indirect category subsets.','The chosen phase, language and authority/recipient/rights declarations match the actual collection.','The host verifies actual notification, timing and retained presentation/delivery evidence separately.']
 },
 'processing-opt-outs':{
  title:'Processing opt-outs and browser signals',outcome:'Separate restrictions on declared processing activities.',configPaths:['services.processingActivities','privacySignals'],hostWork:['Explicitly classify every service with processingActivities, including [] where assessed empty; missing classification remains unresolved.','Choose assessed browser-signal handling and explicit recorded opt-outs separately. Recorded restrictions do not require privacySignals, and browser signals alone do not require a ledger.','For recorded opt-outs, author the exact processing notice and host-bound context/read/submit transports with retained evidence and conservative failure recovery.','Connect the actual browser, account and downstream restrictions; cookie acceptance cannot lift them. The package supplies no reset/re-opt-in flow.'],questionIds:['processing-opt-outs','browser-opt-out-signals','recorded-processing-opt-outs','downstream-processing'],factsNeeded:['Actual sale/sharing/targeted-advertising flows','Explicit applicability assessment and public explanation','Host identity, durable restriction handling and downstream effects'],guides:['privacy-signals','processing-choices'],prerequisites:['legal-pages'],verify:['Every service has an explicit classification; missing and assessed-empty lists remain distinct.','Applicable observed signals restrict the declared processing; unavailable signals are not fabricated as observed.','Recorded paths handle initial/failed head reads, lost acknowledgments, reload/context changes and concurrent restrictions conservatively.','Cookie acceptance does not remove a separate opt-out.','Confirm actual account and downstream effects, beyond the browser indicator or retained receipt.']
 },
 'form-permissions':{
  requiredConfigPaths:['scopeGuards'],
  conditionalConfig:[{when:'site-locale-not-english',requiredPaths:['localization.formPermission'],reason:'The native non-English permission interface needs the complete selected form-permission dictionary.'}],
  title:'Separate form permissions',outcome:'Optional purpose/channel permission independent of submitting the surrounding form.',configPaths:['purposes','scopeGuards','localization.formPermission'],hostWork:['Create the exact permission offer and implement host context, transport, receipt and withdrawal.','Check formPermissionGrantSupported(offer) for the selected purpose. Missing, unknown or present restricted-scope facts keep ordinary grants off; resolve facts or use a separately supported process, never change them to absent to unlock the control.'],questionIds:['personal-data','receipts','children','sensitive-data','high-risk-profiling','regulated-sector'],factsNeeded:['Purpose, channel and optional wording','Action/context identity and durable acknowledgement policy','Supported scope assessment for the actual purpose, including any purpose override'],guides:['form-permissions'],prerequisites:['legal-pages'],verify:['Form submission never silently grants permission.','Unchecked/failure states remain off.','Independent withdrawal and reload recovery work.']
 },
 'consumer-contracts':{
  title:'Consumer purchase and contract flows',outcome:'Selected reviewed pre-purchase disclosures, payment action, confirmations or contract declaration flows.',configPaths:['terms.audience','terms.serviceType','documents.terms'],hostWork:['Review each applicable flow separately: host quotes, payment/fulfillment, confirmations, withdrawal/cancellation, guarantees and delivery jobs are distinct.'],questionIds:['consumer-payments','consumer-distance-contracts','consumer-continuing-contracts','receipts'],factsNeeded:['Actual goods/services/digital content and consumer audience','How/where a contract forms, price/renewal obligations and applicable exclusions/windows','Required customer documents, delivery destination and independent host jobs'],guides:['paid-orders','order-confirmations','contract-actions','contract-dispatch','guarantees','guarantee-labels'],prerequisites:['legal-pages'],verify:['Final price/commitment and action match the host’s exact offer.','Receipt/storage is not presented as payment, recipient delivery or contract fulfillment.','Test each selected flow and its host handoff separately.']
 },
 'evidence':{
  title:'Durable evidence and backoffice',outcome:'Host-authorized archives and inspection of retained records.',configPaths:[],hostWork:['Optional @notabenda/cloudflare storage/admin, or the host’s compatible recording integration.','Implement authorization, fixed site/object scope, recording admission, identity, activation, retention, holds/erasure and private source/export grants.'],questionIds:['receipts'],factsNeeded:['Which records must be retained and why','Host authorization/identity and storage architecture','Retention, access and operational policy'],guides:['cloudflare-starter','cloudflare','consent-evidence','releases','evidence-lifecycle'],prerequisites:['legal-pages'],verify:['Unauthorized access is denied before storage access.','Records bind exact retained releases.','Private source/export needs separately granted authority.','Restart, retry and retention behavior match the host policy.']
 },
 'localization':{
  requiredConfigPaths:['localization'],
  title:'Localized wording',outcome:'Explicit host-supplied document/control wording and formatting.',configPaths:['site.locale','localization'],hostWork:['Supply complete reviewed message dictionaries and revision bindings; test direction and layout.'],questionIds:[],factsNeeded:['Languages, complete wording and translation review','Message/disclosure revisions and any terms statement'],guides:['localization'],prerequisites:['legal-pages'],verify:['No unintended language fallback.','Keyboard, long text and writing direction remain usable.','Language selection does not activate regional policies.']
 },
 'regional-consent':{
  title:'Explicit regional consent timing',outcome:'Individually reviewed opt-in timing policies within documented coverage.',configPaths:['jurisdictions','consent.promptPolicy','consent.grantExpiryPolicy','consent.grantLifetimeDays','consent.refusalLifetimeDays'],hostWork:['Assess applicability and each supported requirement; select only the policy actually needed.'],questionIds:['optional-storage'],factsNeeded:['Actual jurisdiction/applicability decision','Separate grant expiry, refusal memory and repeat-prompt requirements','Material processing revisions and any supported change explanation'],guides:['regional-prompts','requirements'],prerequisites:['cookie-consent'],verify:['Policy selection is explicit.','Boundary/return-visit behavior follows the selected policy.','Permission expiry, repeat solicitation and evidence retention use separate clocks.']
 },
 'discovery':{
  title:'Optional service discovery',outcome:'Private candidates and coverage limits for operator review.',configPaths:[],hostWork:['Deliberately select project scanning and/or authorized browser observations.'],questionIds:[],factsNeeded:['Directory/scenario authorized for inspection','Actual use and provider facts for each accepted candidate'],guides:['discovery','service-catalog'],prerequisites:[],verify:['No project modules/scripts or vendor probes execute.','Findings do not alter inventory or permissions.','Review skipped channels and files; an empty report proves no absence.']
 }
};

/** Scope questions describe requested work, never regulatory applicability. */
const selectionQuestions=[
 {id:'documents',targetId:'legal-pages',question:'Do you want to add or update static privacy, cookie or terms documents?'},
 {id:'authored-sources',targetId:'authored-documents',question:'Do you want to maintain documents as Markdown or trusted MDX with frontmatter?'},
 {id:'optional-service-control',targetId:'cookie-consent',question:'Do you want consent-based controls for optional scripts or browser storage?'},
 {id:'assessed-storage-exceptions',targetId:'storage-exceptions',question:'Do you want separate objection settings for an explicitly assessed supported storage-exception profile?'},
 {id:'technology-notice',targetId:'technology-functions',question:'Do you want to disclose identification, location or profiling technology and explain its voluntary activation?'},
 {id:'remote-media',targetId:'embeds',question:'Do you want remote media to stay unloaded until its service is permitted?'},
 {id:'explicit-agreement',targetId:'terms-agreement',question:'Do you want an explicit acceptance action bound to an exact terms revision?'},
 {id:'rights-entry',targetId:'privacy-rights',question:'Do you want a page linking visitors to your privacy request workflows?'},
 {id:'collection-surface',targetId:'collection-notice',question:'Do you want static privacy information beside a form where people provide data?'},
 {id:'indirect-collection-surface',targetId:'indirect-collection-notice',question:'Do you want a separate supported notice about information received from another source?'},
 {id:'processing-restrictions',targetId:'processing-opt-outs',question:'Do you want separate processing opt-outs or browser privacy signals connected to host restrictions?'},
 {id:'form-permission',targetId:'form-permissions',question:'Do you want optional purpose/channel permission separate from submitting a form?'},
 {id:'purchase-contract',targetId:'consumer-contracts',question:'Do you want consumer purchase or contract disclosures and action flows?'},
 {id:'stored-evidence',targetId:'evidence',question:'Do you want durable records, retained archives or an operator backoffice?'},
 {id:'translated-copy',targetId:'localization',question:'Do you want documents or controls in additional languages?'},
 {id:'regional-timing',targetId:'regional-consent',question:'Do you want to assess and configure an explicit supported regional consent timing policy?'},
 {id:'service-investigation',targetId:'discovery',question:'Do you want optional project scanning or review of authorized browser observations?'}
];

/** Read-only reference. Targets describe requested work; they never activate it. */
export function describeIntegration(requested:readonly string[]=[]){
 if(!Array.isArray(requested)||requested.length>32||Array.from(requested).some(id=>typeof id!=='string'||!Object.hasOwn(targets,id)))throw Error('Unknown integration target. Run notabenda describe to list supported targets.');
 return integrationReference(requested.length?[...new Set(requested)]:Object.keys(targets));
}

function integrationReference(selected:string[]){
 const resolved=new Set<string>();
 function include(id:string){if(resolved.has(id))return;for(const prior of targets[id]!.prerequisites)include(prior);resolved.add(id);}
 for(const id of selected)include(id);
 const relevantQuestionIds=[...new Set([...resolved].flatMap(id=>targets[id]!.questionIds))];
 return structuredClone({schemaVersion:1,kind:'notabenda-integration-reference',requestedTargetIds:selected,
  boundaries:{advisoryOnly:true,writesFiles:false,readsProject:false,activatesFeatures:false,legalReview:false},
  configContract:{schemaVersion:1,typeExport:'@notabenda/core',typeName:'SiteConfig',schema:{command:'notabenda schema [PATH] --json',packageExport:'@notabenda/core/config/schema.json',website:'https://notabenda.org/site-config.schema.json',purpose:'Generated authoring shape: exact known keys, required fields and allowed type values. Field lookup follows array items. Always run check for runtime and review rules; shape supplies no defaults or facts.'},validation:'notabenda check --config FILE --json',jsonCli:true,markdownMdx:'@notabenda/authoring build API',hostWorkIsNotConfig:true,starterDefaultsAreNotFacts:true,pathNotation:'Dot paths through inventory arrays refer to each item field, not literal JSON keys.'},
  assessment:{command:'notabenda assess --selection FILE --config FILE --json',optionalAnswers:'--answers FILE',api:'@notabenda/core/integration/assessment',readOnly:true,meaning:'Checks explicit config and practice answers against selected work. Declared fields are not verified facts; host work and review remain separate.'},
  selectionQuestions,
  selectionTemplate:{schemaVersion:1,answers:Object.fromEntries(selectionQuestions.map(q=>[q.id,'unknown']))},
  publicFactFields:setupFactFields.map(([id,label])=>({id,label})),
  relevantQuestionIds,
  targets:[...resolved].map(id=>({id,selection:selected.includes(id)?'requested':'prerequisite',...targets[id]!,guides:targets[id]!.guides.map(slug=>'https://notabenda.org/guide/'+slug+'/index.md')})),
  questions:setupQuestions.map(q=>({id:q.id,title:q.title,detail:q.detail,choices:['yes','no','unknown'],configPaths:q.paths.filter(p=>!p.startsWith('host.')),hostWorkRefs:q.paths.filter(p=>p.startsWith('host.')),requirementIds:q.requirements,guide:'https://notabenda.org/guide/'+q.guide+'/index.md'})),
  markets:setupMarkets,
  answersTemplate:{schemaVersion:1,publicFacts:{},markets:[],answers:Object.fromEntries(setupQuestions.map(q=>[q.id,{choice:'unknown',justification:''}])),storageJustifications:{}},
  targetAnswersTemplate:{schemaVersion:1,publicFacts:{},markets:[],answers:Object.fromEntries(relevantQuestionIds.map(id=>[id,{choice:'unknown',justification:''}])),storageJustifications:{}},
  workflow:['Record requested outcomes and existing integration points.','Separate confirmed facts, project evidence, unknowns and legal review decisions.','Read target guides and the installed SiteConfig type; host work is not a JSON config field.','Complete explicit answers and run wizard --answers FILE, adding --config FILE for an existing inventory.','Compare the exported draft against the original; apply only reviewed changes.','Run check/build in preview, integration scenarios, and production validation when review is complete.'],
  handoffFields:['requested outcomes','selected target IDs','existing integration','confirmed facts and provenance','unknown facts and consequences','exact config changes','host/build/runtime work','review and deployment status','verification results']
 });
}

/** Resolve explicit scope decisions only; an unanswered question is never a grant or a negative answer. */
export function selectIntegration(input:unknown){
 const fail=():never=>{throw Error('Invalid integration selection. Use selectionTemplate from notabenda describe --json; answers must be yes, no or unknown.');};
 const data=(value:unknown,allowed:string[])=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return fail();
  const proto=Object.getPrototypeOf(value);if(proto!==null&&proto!==Object.prototype)return fail();
  const out:Record<string,unknown>=Object.create(null);
  for(const key of Reflect.ownKeys(value)){
   if(typeof key!=='string'||!allowed.includes(key))return fail();
   const descriptor=Object.getOwnPropertyDescriptor(value,key)!;
   if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))return fail();out[key]=descriptor.value;
  }
  return out;
 };
 const root=data(input,['schemaVersion','answers']);if(root.schemaVersion!==1)return fail();
 const answers=data(root.answers,selectionQuestions.map(q=>q.id));
 const decisions=selectionQuestions.map(q=>{
  const choice=Object.hasOwn(answers,q.id)?answers[q.id]:'unknown';
  if(choice!=='yes'&&choice!=='no'&&choice!=='unknown')return fail();
  return {...q,choice};
 });
 const selected=decisions.filter(q=>q.choice==='yes').map(q=>q.targetId),reference=integrationReference(selected);
 return {
  schemaVersion:1,kind:'notabenda-integration-selection',
  decisions,unresolvedQuestionIds:decisions.filter(q=>q.choice==='unknown').map(q=>q.id),
  requestedTargetIds:selected,
  prerequisiteTargetIds:reference.targets.filter(t=>t.selection==='prerequisite').map(t=>t.id),
  prerequisiteReview:reference.targets.filter(t=>t.selection==='prerequisite').map(t=>({targetId:t.id,questionId:decisions.find(q=>q.targetId===t.id)!.id,scopeChoice:decisions.find(q=>q.targetId===t.id)!.choice,action:'Check existing supporting configuration and documents before adding work. A prerequisite is not an additional requested feature.'})),
  status:decisions.some(q=>q.choice==='unknown')?'scope-incomplete':'scope-recorded',
  productionReady:false,reference
 };
}

