// @requirements REQ-IE-CONSENT-DURATION REQ-FR-SCOPE REQ-DE-DEVICE REQ-IT-REPROMPT REQ-ES-CHOICE
import {normalizeCatalogSelectionRevisions} from './catalog-review.js';
import type {CatalogSelectionRevision} from './catalog-review.js';
// @requirements REQ-PRODUCT-SERVICE-CATALOG
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
// @requirements REQ-US-COPPA-SCOPE
// @requirements REQ-US-VA-RIGHTS
// @requirements REQ-AU-PIXELS
// @requirements REQ-CA-OBA
// @requirements REQ-CH-PROFILING
// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-RIGHTS-CENTER
/** @requirements REQ-PRODUCT-SETUP Shared, deterministic advisory setup. No network, storage, law inference or runtime activation. */
import {normalizeSetupCatalogSelections} from './catalog-selection.js';
import type {CatalogServiceSelection} from './catalog-selection.js';
import {scopeGuardFields} from './scope-guard-policy.js';
import type {ScopeGuardFacts,ScopeGuardFact} from './scope-guard-policy.js';
import {createStarterConfig} from './starter.js';
import {toPublicConfig,validateSiteConfig} from './config.js';
import type {SiteConfig,RequirementId,Diagnostic} from './types.js';
export type SetupChoice='yes'|'no'|'unknown';
export const setupQuestions=[
  {id:'personal-data',title:'Do you process personal data?',detail:'Include contact forms, accounts, IP addresses in hosting logs, support and third-party tools.',enable:'Complete the processing inventory and privacy disclosures, including collection sources, retention, rights and transfers. Place a collection notice beside relevant forms. Consider a dedicated rights entry page connected to your actual request workflows and a public contact fallback.',paths:['purposes','services','privacy','rightsCenter'],requirements:['REQ-EU-NOTICE','REQ-NZ-NOTICE','REQ-PRODUCT-COLLECTION-NOTICE','REQ-PRODUCT-RIGHTS-CENTER'],guide:'collection'},
  {id:'optional-storage',title:'Do optional tools store or read browser information?',detail:'Include analytics, advertising, personalization, pixels and local/session storage. An “essential” label needs a specific justification.',enable:'Configure explicit purpose/service scopes, reviewed preference lifetimes and the consent runtime. Register optional producers and exact cleanup targets before loading them.',paths:['storage','consent'],requirements:['REQ-EU-DEVICE','REQ-PRODUCT-CONSENT-RUNTIME','REQ-PRODUCT-STORAGE-CLEANUP'],guide:'storage-cleanup'},
  {id:'embeds',title:'Do you load third-party embeds or remote media?',detail:'Include video, maps, social content, frames and pixels. Investigate vendor requests and storage before selecting exemptions.',enable:'Review vendor practices and declare initial resource origins. Use inert media placeholders for consent-gated resources.',paths:['services.resourceOrigins'],requirements:['REQ-PRODUCT-EMBEDS','REQ-EU-DEVICE'],guide:'embeds'},
  {id:'processing-opt-outs',title:'Could data be sold, shared for cross-context advertising, or used for targeted advertising?',detail:'Assess actual data flows and legal definitions; vendor labels and a cookie category alone do not resolve this.',enable:'Classify every service’s processingActivities; consider the GPC restriction policy and separate recorded opt-outs. Connect downstream/account actions through the host.',paths:['services.processingActivities','privacySignals'],requirements:['REQ-US-CA-CHOICES','REQ-US-CA-GPC','REQ-US-CO-GPC','REQ-US-CT-GPC','REQ-PRODUCT-PROCESSING-CHOICES'],guide:'processing-choices'},
  {id:'terms-agreement',title:'Do users explicitly agree to terms during a workflow?',detail:'For example signup or an application action. A privacy notice acknowledgment is a separate question.',enable:'Supply reviewed terms and create a version-bound offer with a separate unchecked agreement control and acknowledged receipt.',paths:['documents.terms'],requirements:['REQ-PRODUCT-TERMS-ACCEPTANCE'],guide:'terms'},
  {id:'consumer-payments',title:'Do consumers buy, subscribe or enter paid contracts online?',detail:'Assess audience, product/service, renewal, payment and cancellation practices. Generic terms do not implement checkout or cancellation rights.',enable:'Review consumer terms, required checkout information, payment-action wording and withdrawal/cancellation rights. Optional contract declaration forms are available after an applicability review; paid-order review and a native payment-obligation action are available with host-owned quotes and transport. The library does not execute payment, deliver contract confirmation or determine rights windows.',paths:['terms.audience','terms.serviceType'],requirements:['REQ-EU-TERMS','REQ-EU-ORDER-ACTION','REQ-PRODUCT-CONTRACT-ACTIONS'],guide:'paid-orders'},
  {id:'consumer-distance-contracts',title:'Can consumers enter a contract here without meeting you in person?',detail:'Include online purchases, subscriptions and services supplied in exchange for personal data. Describe where and how the contract is formed; a price alone does not decide withdrawal rights.',enable:'Review applicable distance-contract rights, exclusions and windows. If an electronic withdrawal route is required, use the separate contract-action module with a reviewed regional profile and exact archived disclosures. The declaration form does not determine eligibility or perform refunds.',paths:['terms.audience','terms.serviceType','host.contractActions'],requirements:['REQ-PRODUCT-CONTRACT-ACTIONS','REQ-EU-WITHDRAWAL','REQ-DE-WITHDRAWAL','REQ-BR-CONTRACT'],guide:'contract-actions'},
  {id:'consumer-continuing-contracts',title:'Can consumers start a paid subscription or continuing service online?',detail:'Describe the ongoing paid service, who can enter the contract, and the online signup route. Do not infer an exception from a subscription or sector label.',enable:'Assess the scope and exclusions of Germany’s continuing-contract cancellation rule separately from withdrawal rights. For an applicable reviewed flow, the de-cancellation form provides a direct final action and a savable declaration. Configure prompt acknowledgement independently of contract matching and application fulfillment.',paths:['terms.audience','terms.serviceType','host.contractActions'],requirements:['REQ-PRODUCT-CONTRACT-ACTIONS','REQ-DE-CANCEL'],guide:'contract-actions'},
  {id:'children',title:'Is the service directed to children, or do you knowingly process children’s data?',detail:'Record intended/actual audience and how this is assessed. Do not infer age from tracking or collect dates of birth just to answer this questionnaire.',enable:'Obtain a specific child-data assessment and implement an appropriate supported flow. The general consent runtime does not implement parental authorization.',paths:['scopeGuards.site.children'],requirements:['REQ-US-COPPA-SCOPE'],guide:'scope-guards'},
  {id:'sensitive-data',title:'Does the processing involve sensitive personal information?',detail:'Assess actual purposes and context, including health, biometrics, precise location or other locally defined sensitive categories. Do not derive the answer from a vendor label.',enable:'Declare the scope guard and keep affected optional work off until a separate supported process is designed and reviewed. A cookie or terms choice does not provide specialized authorization.',paths:['scopeGuards.site.sensitiveData'],requirements:['REQ-US-VA-RIGHTS','REQ-AU-PIXELS','REQ-CA-OBA'],guide:'scope-guards'},
  {id:'high-risk-profiling',title:'Could the processing involve high-risk profiling?',detail:'Assess combined data, cross-site linkage, inferences and consequences with appropriate expertise. This question does not decide a jurisdiction’s legal definition.',enable:'Declare the high-risk-profiling guard. Generic optional controls cannot unlock this processing; retain the assessment and implement the specific supported workflow separately.',paths:['scopeGuards.site.highRiskProfiling'],requirements:['REQ-CH-PROFILING'],guide:'scope-guards'},
  {id:'regulated-sector',title:'Does this context need a specialized sector workflow?',detail:'For example, a sector-specific health or financial-data process. This incomplete prompt is a support-boundary question, not a legal sector classifier.',enable:'Keep the regulated-sector guard present or unknown while a specialized workflow is assessed. Static notices and ordinary terms rendering remain available.',paths:['scopeGuards.site.regulatedSector'],requirements:['REQ-PRODUCT-CONFIG'],guide:'scope-guards'},
  {id:'transfers',title:'Do providers process data in other countries?',detail:'Check hosting, support access, subprocessors, backups and recipient locations.',enable:'Document recipients, locations, transfer mechanisms and applicable safeguards; review the privacy transfer text.',paths:['services.location','privacy.transfers'],requirements:['REQ-EU-NOTICE'],guide:'regulatory'},
  {id:'receipts',title:'Do you need durable records of choices, agreements or contract declarations?',detail:'Consider the evidence needed, host identity binding, access controls, retention and erasure. Browser preferences alone are not durable receipts.',enable:'Consider notabenda-cf archives and distinct choice, agreement and contract declaration ledgers, with host-owned authorization, context and retention/erasure operations. Contract acknowledgements and application delivery use independent host-configured runners and a durable host scheduling policy.',paths:['host.evidence'],requirements:['REQ-PRODUCT-CONSENT-EVIDENCE','REQ-PRODUCT-CF-ADMIN','REQ-PRODUCT-CF-HISTORY','REQ-PRODUCT-CONTRACT-ACTIONS'],guide:'cloudflare'},
  {id:'authored-content',title:'Will you maintain reviewed policies in Markdown or MDX?',detail:'MDX components execute as trusted build-time code; choose plain Markdown when components are unnecessary.',enable:'Use the optional notabenda-authoring build package with YAML frontmatter, versioned releases and private source archives.',paths:['documents'],requirements:['REQ-PRODUCT-AUTHORING','REQ-PRODUCT-RETAINED-RELEASES'],guide:'authoring'},
] as const;
export type SetupQuestionId=typeof setupQuestions[number]['id'];
export const setupMarkets=[
  {id:'EU-EEA',label:'EU / EEA',requirements:['REQ-EU-NOTICE','REQ-EU-DEVICE','REQ-EU-CONSENT','REQ-EU-TERMS','REQ-EU-WITHDRAWAL','REQ-EU-ORDER-ACTION']},
  {id:'DE',label:'Germany',requirements:['REQ-DE-DEVICE','REQ-DE-CANCEL','REQ-DE-WITHDRAWAL']},
  {id:'FR',label:'France',requirements:['REQ-FR-SCOPE']},
  {id:'IE',label:'Ireland',requirements:['REQ-IE-DEVICE','REQ-IE-CONSENT-DURATION']},
  {id:'IT',label:'Italy',requirements:['REQ-IT-REPROMPT']},
  {id:'ES',label:'Spain',requirements:['REQ-ES-CHOICE']},
  {id:'UK',label:'United Kingdom',requirements:['REQ-UK-EXCEPTIONS']},
  {id:'CH',label:'Switzerland',requirements:['REQ-CH-PROFILING']},
  {id:'BR',label:'Brazil',requirements:['REQ-BR-COOKIE-UI','REQ-BR-CONTRACT']},
  {id:'CA-FED',label:'Canada',requirements:['REQ-CA-MEANINGFUL','REQ-CA-OBA']},
  {id:'CA-QC',label:'Québec',requirements:['REQ-QC-PROFILING']},
  {id:'AU',label:'Australia',requirements:['REQ-AU-PIXELS']},
  {id:'NZ',label:'New Zealand',requirements:['REQ-NZ-NOTICE','REQ-NZ-INDIRECT']},
  {id:'ZA',label:'South Africa',requirements:['REQ-ZA-MARKETING']},
  {id:'US-CA',label:'California',requirements:['REQ-US-CA-CHOICES','REQ-US-CA-GPC','REQ-US-CA-UI']},
  {id:'US-CO',label:'Colorado',requirements:['REQ-US-CO-GPC']},
  {id:'US-CT',label:'Connecticut',requirements:['REQ-US-CT-GPC']},
  {id:'US-VA',label:'Virginia',requirements:['REQ-US-VA-RIGHTS']},
  {id:'TR',label:'Türkiye',requirements:['REQ-TR-BASIS']},
  {id:'other',label:'Other / not sure',requirements:[]},
] as const;
export interface SetupAnswer {choice:SetupChoice;justification:string}
export const setupFactFields=[['siteName','Site name'],['siteId','Site ID (lowercase slug)'],['siteUrl','Public HTTPS site URL'],['controllerName','Public controller name'],['controllerEmail','Public privacy contact email'],['controllerAddress','Public controller postal address']] as const;
export type SetupFactId=typeof setupFactFields[number][0];
export interface SetupAnswers {schemaVersion:1;publicFacts?:Partial<Record<SetupFactId,string>>;markets:string[];answers:Partial<Record<SetupQuestionId,SetupAnswer>>;storageJustifications?:Record<string,string>}
export interface SetupRecommendation {id:string;status:'recommended'|'investigate'|'review'|'declared-no';title:string;reason:string;configPaths:readonly string[];requirementIds:readonly RequirementId[];guide:string}
export interface SetupPlan {config:SiteConfig;report:{schemaVersion:1;questionnaireVersion:'4';kind:'private-setup-report';answers:SetupAnswers;recommendations:SetupRecommendation[];reviewItems:string[];diagnostics:Diagnostic[];productionReady:false;catalogSelections?:CatalogServiceSelection[];catalogSelectionRevisions?:CatalogSelectionRevision[]}}
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,allowed:string[])=>Object.keys(value).every(k=>allowed.includes(k));
const text=(value:unknown):value is string=>typeof value==='string'&&value.length<=4000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
function invalid():never{throw new Error('Use setup schema 1, declared question/market IDs, yes/no/unknown answers and bounded plain-text justifications.');}
export function normalizeSetupAnswers(input:unknown):SetupAnswers {
  if(!object(input)||!exact(input,['schemaVersion','markets','answers','storageJustifications','publicFacts'])||input.schemaVersion!==1||!Array.isArray(input.markets)||input.markets.length>setupMarkets.length||new Set(input.markets).size!==input.markets.length||input.markets.some(m=>!setupMarkets.some(value=>value.id===m))||!object(input.answers)||!exact(input.answers,setupQuestions.map(q=>q.id)))return invalid();
  const publicFacts:NonNullable<SetupAnswers['publicFacts']>={};
  if(input.publicFacts!==undefined){if(!object(input.publicFacts)||!exact(input.publicFacts,setupFactFields.map(f=>f[0])))return invalid();for(const [id] of setupFactFields){const value=input.publicFacts[id];if(value!==undefined){if(!text(value))return invalid();publicFacts[id]=value.trim();}}}
  const answers:SetupAnswers['answers']={};
  for(const question of setupQuestions){const value=input.answers[question.id];if(value===undefined)continue;if(!object(value)||!exact(value,['choice','justification'])||!['yes','no','unknown'].includes(value.choice as string)||!text(value.justification))return invalid();answers[question.id]={choice:value.choice as SetupChoice,justification:value.justification.trim()};}
  const storageJustifications:Record<string,string>={};
  if(input.storageJustifications!==undefined){if(!object(input.storageJustifications)||Object.keys(input.storageJustifications).length>256)return invalid();for(const [id,value] of Object.entries(input.storageJustifications)){if(!/^[a-z][a-z0-9-]*$/u.test(id)||!text(value))return invalid();storageJustifications[id]=value.trim();}}
  const normalized:SetupAnswers={schemaVersion:1,markets:[...input.markets] as string[],answers,storageJustifications,publicFacts};
  if(new TextEncoder().encode(JSON.stringify(normalized)).length>128*1024)return invalid();
  return normalized;
}
export function createSetupPlan(input:unknown,options:{config?:unknown;catalogSelections?:unknown;catalogSelectionRevisions?:unknown;preserveConfig?:true}={}):SetupPlan {
  const answers=normalizeSetupAnswers(input);
  // Reuse the public allowlist. No unknown properties or operator-private material enters the draft.
  const config:SiteConfig=options.config===undefined?createStarterConfig():toPublicConfig(options.config,{mode:'preview'});
  if(options.preserveConfig&&options.config===undefined)throw Error('Preserving a review requires an explicit current config.');
  const facts=options.preserveConfig?{}:answers.publicFacts??{};
  for(const [id,key] of [['siteName','name'],['siteId','id'],['siteUrl','url']] as const)if(facts[id])config.site[key]=facts[id]!;
  for(const [id,key] of [['controllerName','name'],['controllerEmail','email'],['controllerAddress','address']] as const)if(facts[id])config.controller[key]=facts[id]!;
  if(!validateSiteConfig(config,{mode:'preview'}).valid)throw new Error('Supplied public facts do not form a valid draft site config.');
  if(!options.preserveConfig)for(const doc of Object.values(config.documents))doc.review.status='draft';
  const recommendations:SetupRecommendation[]=[],reviewItems=['Resolve draft placeholders, verify the actual inventory and obtain appropriate content/legal review before production. No jurisdiction pack is production-supported.'];
  if(config.rightsCenter){if(!options.preserveConfig)config.rightsCenter.reviewStatus='draft';reviewItems.push('Review the imported rights page, each action’s scope and destination, public contact fallback and next steps. Existing actions were preserved; setup has not implemented request intake or fulfillment.');}
  if(!answers.markets.length||answers.markets.includes('other'))reviewItems.push('Determine applicable jurisdictions from establishment, audience, targeting and practices; this market list is incomplete and is not an applicability decision.');
  for(const market of setupMarkets)if(answers.markets.includes(market.id))recommendations.push({id:'market-'+market.id,status:'review',title:market.label+' applicability review',reason:'Selected coverage interest. Check thresholds, territorial scope, exceptions and effective dates in the catalog. Country-specific rules and unlisted jurisdictions may also apply.',configPaths:['jurisdictions'],requirementIds:market.requirements,guide:'requirements'});
  // Coverage interest advises a reviewed selection; it never changes consent settings.
  if(answers.markets.includes('IE')||config.jurisdictions.includes('IE')){
    recommendations.push({id:'irish-grant-expiry',status:'review',title:'Review how long grants remain usable',reason:config.consent?.grantExpiryPolicy?'The explicit six-calendar-month grant cap is present. Verify the shorter configured lifetime, cookie disclosures and actual service shutdown. Refusal memory, prompt suppression and evidence retention use separate clocks.':'The DPC guidance describes a six-month default for reaffirming remembered consent. You can explicitly select consent.grantExpiryPolicy with profile ie-dpc-six-month-default and version 1 to cap grants at the earlier of their configured lifetime and six UTC calendar months. Longer storage needs an objective case-specific assessment; a saved note does not qualify or enable it. Setup has not selected the policy.',configPaths:['consent.grantExpiryPolicy','consent.grantLifetimeDays','consent.refusalLifetimeDays'],requirementIds:['REQ-IE-CONSENT-DURATION'],guide:'regional-prompts'});
    reviewItems.push('Review Irish remembered-consent duration and actual cookie/storage lifetimes. Any longer-period justification stays a private assessment; the supported cap has no automatic extension switch.');
  }
  // @requirements REQ-BR-COOKIE-UI REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
  if(answers.markets.includes('BR')||config.jurisdictions.includes('BR')){
    recommendations.push({id:'brazil-cookie-information',status:'review',title:'Review cookie choices, rights entry and browser guidance',reason:'ANPD recommends visible rejection on both layers and purpose-specific choices initially off. Review the optional consent.information.rights entry and browserControls guidance, including the limits of browser blocking for actual trackers. These host-supplied fields are not selected automatically, and consent is not inferred as the legal basis for every cookie.',configPaths:['consent.information.rights','consent.information.browserControls'],requirementIds:['REQ-BR-COOKIE-UI','REQ-BR-COOKIE-RIGHTS-LINK','REQ-BR-COOKIE-BROWSER-HELP'],guide:'consent'});
  }
  for(const question of setupQuestions){const answer=answers.answers[question.id]??{choice:'unknown',justification:''};const status=answer.choice==='yes'?'recommended':answer.choice==='no'?'declared-no':'investigate';
    recommendations.push({id:question.id,status,title:question.title,reason:answer.choice==='yes'?question.enable:answer.choice==='no'?'Operator declared no. Verify the inventory and revisit if practices change; this is not an exemption determination.':'Investigate this practice before deciding coverage. '+question.enable,configPaths:question.paths,requirementIds:question.requirements,guide:question.guide});
    if(answer.choice==='unknown'||!answer.justification)reviewItems.push(question.title+(answer.choice==='unknown'?' — unresolved practice.':' — record the supporting facts and justification.'));
  }
  // @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
  if(config.purposes.some(p=>p.collection.source==='indirect'||p.collection.source==='both')){
    recommendations.push({id:'indirect-collection',status:'review',title:'Review information collected from other sources',reason:'Your inventory declares indirect or mixed collection. Assess the applicable notification rules and how people will receive the notice. The optional New Zealand IPP3A component can render reviewed particulars; select it only after assessing applicability, lawful collection, timing and exceptions.',configPaths:['purposes.collection','host.indirectCollectionNotices'],requirementIds:['REQ-NZ-INDIRECT','REQ-PRODUCT-INDIRECT-NOTICE'],guide:'indirect-collection'});
    reviewItems.push('Map each indirect collection to its actual categories, source, recipients and access/correction route. A footer policy or generated notice does not establish notification. No indirect notice or delivery workflow has been enabled.');
  }
  const consumerContracts=['consumer-payments','consumer-distance-contracts','consumer-continuing-contracts'] as const;
  if(consumerContracts.some(id=>answers.answers[id]?.choice==='yes')){
    recommendations.push({id:'contract-handoffs',status:'review',title:'Plan the contract declaration handoffs',reason:'If your applicability review requires a contract form, capture its exact declaration and acknowledgement with separate durable jobs. Configure independent acknowledgement/application callbacks, stable downstream idempotency, host scheduling and recovery. A saved declaration or provider acceptance does not establish recipient delivery or contract fulfillment.',configPaths:['host.contractActions','host.contractDispatch'],requirementIds:['REQ-PRODUCT-CONTRACT-ACTIONS'],guide:'contract-dispatch'});
    reviewItems.push('Review actual contract formation, audience, applicable country/sector exclusions, rights windows and required entry points. No regional contract profile, route, delivery provider or scheduler has been enabled.');
    if(config.terms.audience==='business')reviewItems.push('Review the declared consumer practice against terms.audience: the imported/starter audience is business. Existing terms were preserved; consumer content may need a separate reviewed scope.');
  }
  if(answers.answers['consumer-continuing-contracts']?.choice==='yes'&&answers.answers['consumer-payments']?.choice==='no')reviewItems.push('Conflict: paid continuing contracts were declared, but online consumer payments were denied. Resolve the supporting facts; neither answer or the imported configuration has been rewritten.');
  for(const item of config.storage)if(item.classification==='necessary'){
    const reason=answers.storageJustifications?.[item.id];
    reviewItems.push(`Review necessary storage “${item.id}”: ${reason?'private justification recorded; verify the applicable exception and minimum scope/lifetime.':'supply a specific justification, scope and lifetime; a label alone is insufficient.'}`);
  }
  // Findings from existing facts take precedence over a contradictory questionnaire answer.
  const no=(id:SetupQuestionId)=>answers.answers[id]?.choice==='no';
  if(no('optional-storage')&&(config.consent||config.storage.some(s=>s.classification==='optional')))reviewItems.push('Conflict: optional storage was denied but the imported inventory includes optional storage or consent settings. Existing settings were preserved; resolve the discrepancy.');
  if(no('processing-opt-outs')&&config.services.some(s=>s.processingActivities?.length))reviewItems.push('Conflict: processing opt-outs were denied but services declare restricted processing activities. Existing restrictions were preserved.');
  if(no('personal-data')&&config.purposes.length)reviewItems.push('Conflict: personal-data processing was denied but the imported config declares processing purposes. Review actual data flows.');
  if(answers.answers['optional-storage']?.choice==='yes'&&!config.consent)reviewItems.push('Consent runtime not configured: inventory actual services/purposes and select material scopes and preference lifetimes explicitly. Setup has not invented those values.');
  const questions:Record<keyof ScopeGuardFacts,SetupQuestionId>={children:'children',sensitiveData:'sensitive-data',highRiskProfiling:'high-risk-profiling',regulatedSector:'regulated-sector'};
  const imported=options.config!==undefined&&config.scopeGuards!==undefined;
  const current=config.scopeGuards;
  const site:ScopeGuardFacts=current?{...current.site}:{children:'unknown',sensitiveData:'unknown',highRiskProfiling:'unknown',regulatedSector:'unknown'};
  const rank={absent:0,unknown:1,present:2};let changed=false;
  for(const field of scopeGuardFields){const answer=answers.answers[questions[field]];if(!answer)continue;const proposed:ScopeGuardFact=answer.choice==='yes'?'present':answer.choice==='no'?'absent':'unknown';
    if(imported&&rank[proposed]<rank[site[field]]){reviewItems.push(`Conflict: ${questions[field]} answer would relax the imported scope guard. The restriction was preserved; review and explicitly revise the assessment outside setup.`);continue;}
    if(proposed!==site[field]){site[field]=proposed;changed=true;}
  }
  if(!options.preserveConfig)config.scopeGuards={version:1,revision:current&&!changed?current.revision:'setup-draft-2',site,...(current?.purposes===undefined?{}:{purposes:structuredClone(current.purposes)})};
  if(options.preserveConfig)reviewItems.push('Historical questionnaire answers remain context only. Current public facts, review status and scope assessments were preserved; reconcile any disagreement separately.');
  if(changed&&!options.preserveConfig)reviewItems.push('Review scopeGuards facts and supply a new, never-reused material revision before publishing the draft. Absent is an operator declaration, not legal clearance. Purpose-specific restrictions were preserved.');
  const catalogSelections=options.catalogSelections===undefined?[]:normalizeSetupCatalogSelections(options.catalogSelections,config);
  const catalogSelectionRevisions=normalizeCatalogSelectionRevisions(options.catalogSelectionRevisions??[]);
  const plan:SetupPlan={config,report:{schemaVersion:1,questionnaireVersion:'4',kind:'private-setup-report',answers,recommendations,reviewItems,diagnostics:validateSiteConfig(config,{mode:'production'}).diagnostics,productionReady:false,...(catalogSelections.length?{catalogSelections}:{}),...(catalogSelectionRevisions.length?{catalogSelectionRevisions}:{})}};
  if(new TextEncoder().encode(JSON.stringify(plan.report)).length>512*1024)throw Error('Private setup report exceeds 512 KiB; reduce notes or review fewer services together.');
  return plan;
}

/** Resume only the declared answers from a private report; recommendations are always regenerated. */
export function readSetupAnswers(input:unknown):SetupAnswers {
  if(object(input)&&input.kind==='private-setup-report'){
    if(input.schemaVersion!==1||!['1','2','3','4'].includes(input.questionnaireVersion as string))return invalid();
    return normalizeSetupAnswers(input.answers);
  }
  return normalizeSetupAnswers(input);
}
