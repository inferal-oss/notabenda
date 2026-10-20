// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
import {supportsRightsPage} from './rights-localization-policy.js';
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
// @requirements REQ-PRODUCT-SPECIALIST-PACKS
// @requirements REQ-PRODUCT-CONSUMER-PACKS
// @requirements REQ-PRODUCT-PRIVACY-PACKS
import {toPublicConfig} from './config.js';
// @requirements REQ-PRODUCT-PACK-CONNECTION
// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-SETUP REQ-PRODUCT-AGENT-INTEGRATION
import {describeIntegration,selectIntegration} from './integration-reference.js';
import {createSetupPlan} from './setup.js';
import type {SetupPlan} from './setup.js';

/** Product jobs reference the existing integration contract, rather than another validator or permission engine. */
const library=[
 {id:'privacy-pages',revision:'1',kind:'functional',shelf:'basics',title:'Privacy pages',outcome:'Explain how your site handles information.',introduction:'Publish privacy, cookie and terms pages in your own design.',targetIds:['legal-pages'],preview:'/privacy',guide:'package',requirements:['REQ-PRODUCT-DOCUMENTS'],lesson:'A notice explains your practices. Reading it does not grant permission or accept terms.'},
 {id:'cookie-choices',revision:'1',kind:'functional',shelf:'basics',title:'Cookie choices',outcome:'Let people choose which optional tools may run.',introduction:'Add a compact request, preferences and service gates.',targetIds:['cookie-consent'],preview:'/choices',guide:'consent',requirements:['REQ-EU-DEVICE','REQ-EU-FAIR-CHOICE'],lesson:'The control and your loaders work together. Connect each optional tool so it stays off until permitted and stops after withdrawal.'},
 {id:'terms-agreement',revision:'1',kind:'functional',shelf:'basics',title:'Terms agreement',outcome:'Ask for agreement to an exact terms version.',introduction:'Add an unchecked choice and wait for an acknowledged record.',targetIds:['terms-agreement'],preview:'/agreement',guide:'terms',requirements:['REQ-PRODUCT-TERMS-ACCEPTANCE'],lesson:'Publishing terms and recording agreement are separate jobs. Your application supplies the workflow, identity and recording transport.'},
 {id:'collection-notices',revision:'1',kind:'functional',shelf:'information',title:'Form notices',outcome:'Explain the information a form collects, beside its fields.',introduction:'Build a static collection notice from selected purposes and a retained privacy version.',targetIds:['collection-notice'],preview:'/collection',guide:'collection',requirements:['REQ-PRODUCT-COLLECTION-NOTICE'],lesson:'A form notice supplies information. It creates no permission, agreement or submission handler. Choose actual purposes, context wording and placement.'},
 {id:'indirect-collection',revision:'1',kind:'functional',shelf:'information',title:'Indirect collection',outcome:'Explain information received from another source.',introduction:'Prepare the supported IPP3A notice after an explicit applicability assessment.',targetIds:['indirect-collection-notice'],preview:'/indirect-collection',guide:'indirect-collection',requirements:['REQ-PRODUCT-INDIRECT-NOTICE','REQ-NZ-INDIRECT'],lesson:'The supported nz-ipp3a profile needs its own assessment, category subsets and delivery plan. Rendering a notice does not establish notification or timing; no profile is enabled by selection.'},
 {id:'privacy-requests',revision:'1',kind:'functional',shelf:'information',title:'Privacy requests',outcome:'Help visitors reach your actual privacy request workflows.',introduction:'Publish request links, their scope, a public fallback and next steps.',targetIds:['privacy-rights'],preview:'/rights',guide:'rights',requirements:['REQ-PRODUCT-RIGHTS-CENTER'],lesson:'These are entry points. Your application handles intake, identity, deadlines, appeals and fulfillment. A link is not a submitted or completed request.'},
 {"id":"technology-notices","revision":"1","kind":"functional","shelf":"information","title":"Technology notices","outcome":"Explain a technology’s functions before people turn it on.","introduction":"Describe the supported identification, location or profiling functions and the real activation controls.","targetIds":["technology-functions"],"preview":"/technology/","guide":"technology-collection","requirements":["REQ-QC-PROFILING"],"lesson":"Assess the supported qc-private-technology-v1 scope. Keep the information before every activation opportunity, derive the service scope before compiling and retain the supplemental notice separately. Selection does not qualify the processing or activate the service."},
 {id:'form-permissions',revision:'1',kind:'functional',shelf:'more',title:'Form permissions',outcome:'Keep optional permissions separate from submitting a form.',introduction:'Offer a purpose and channel with independent withdrawal.',targetIds:['form-permissions'],preview:'/form-permissions',guide:'form-permissions',requirements:['REQ-PRODUCT-FORM-PERMISSIONS'],lesson:'Submitting an enquiry is not a marketing opt-in. Bind the optional choice to its own purpose, channel and record.'},
 {id:'gated-media',revision:'1',kind:'functional',shelf:'more',title:'Gated media',outcome:'Keep remote media unloaded until it is permitted.',introduction:'Use an inert placeholder for a frame or image.',targetIds:['embeds'],preview:'/embeds',guide:'embeds',requirements:['REQ-PRODUCT-EMBEDS'],lesson:'Remove remote URLs and resource hints from initial markup. A visual placeholder alone does not stop a request.'},
 {id:'evidence-workspace',revision:'1',kind:'functional',shelf:'more',title:'Evidence workspace',outcome:'Keep and inspect the wording and actions you record.',introduction:'Add retained versions, searchable records and a private backoffice.',targetIds:['evidence'],preview:'/demo/admin',guide:'cloudflare',requirements:['REQ-PRODUCT-CF-ADMIN','REQ-PRODUCT-CF-HISTORY'],lesson:'Browser preference memory and durable evidence have different jobs. You supply authorization, recording admission and retention policy.'},
 {id:'processing-opt-outs',revision:'1',kind:'functional',shelf:'more',title:'Processing opt-outs',outcome:'Keep processing restrictions separate from cookie permission.',introduction:'Connect assessed browser signals or recorded opt-outs to the work they restrict.',targetIds:['processing-opt-outs'],preview:'/processing-choices',guide:'processing-choices',requirements:['REQ-PRODUCT-PROCESSING-CHOICES','REQ-US-CA-GPC'],lesson:'Classify every service, including an explicit empty activity list. Choose signal handling and recorded restrictions separately; enforce account and downstream effects in the host. Cookie acceptance cannot clear a restriction.'},
 {"id":"assessed-storage-settings","revision":"1","kind":"functional","shelf":"more","title":"Assessed storage settings","outcome":"Offer separate objections for specifically assessed storage uses.","introduction":"Review the supported statistical or appearance profile and connect its own settings and journal.","targetIds":["storage-exceptions"],"preview":"/storage-exceptions/","guide":"storage-exceptions","requirements":["REQ-UK-EXCEPTIONS","REQ-PRODUCT-STORAGE-EXCEPTIONS"],"lesson":"Establish every supported condition and actual technical separation. Exception services stay outside consent enrollment. Stable objections, atomic storage and usable controls remain required; a market or an analytics label cannot qualify a use."},
 {"id":"google-basic","revision":"1","kind":"functional","shelf":"more","title":"Google Basic connection","outcome":"Hold declared Google tags until their purposes are permitted.","introduction":"Connect supported destinations to explicit signal mappings and one document-level adapter.","targetIds":["google-basic"],"preview":"/google-basic/","guide":"google-basic","requirements":["REQ-GOOGLE-MODE"],"lesson":"Use Basic gating with one Google owner per document. Remove competing snippets and map all four signals. Withdrawal after a load attempt requires a new document; stopping the adapter cannot promise post-load network silence or CMP certification."},
 {"id":"contract-withdrawal","revision":"1","kind":"functional","shelf":"consumer","title":"Contract withdrawal","outcome":"Give customers a direct route to declare withdrawal.","introduction":"Prepare a reviewed withdrawal form and its independent acknowledgment and application handoffs.","targetIds":["contract-withdrawal"],"preview":"/contract-actions/withdrawal","guide":"contract-actions","requirements":["REQ-PRODUCT-CONTRACT-ACTIONS","REQ-EU-WITHDRAWAL","REQ-DE-WITHDRAWAL","REQ-BR-CONTRACT"],"lesson":"Assess one supported withdrawal profile and its language. The host admits and records the declaration, sends acknowledgment and handles the contract separately. A receipt does not perform a refund."},
 {"id":"subscription-cancellation","revision":"1","kind":"functional","shelf":"consumer","title":"Subscription cancellation","outcome":"Let customers request an end to a continuing contract.","introduction":"Prepare the supported German cancellation flow after reviewing its scope and exclusions.","targetIds":["subscription-cancellation"],"preview":"/contract-actions/cancellation","guide":"contract-actions","requirements":["REQ-PRODUCT-CONTRACT-ACTIONS","REQ-DE-CANCEL"],"lesson":"The supported profile is de-cancellation. Keep this separate from contract withdrawal and cookie permission. Preserve the requested ending; the form does not calculate or confirm a termination date."},
 {"id":"paid-order-review","revision":"1","kind":"functional","shelf":"consumer","title":"Paid order review","outcome":"Put the full offer beside a deliberate payment action.","introduction":"Show item commitments, prices and applicable labels before the customer places the order.","targetIds":["paid-order-review"],"preview":"/orders/mixed/","guide":"paid-orders","requirements":["REQ-EU-ORDER-ACTION","REQ-PRODUCT-PAID-ORDER-ARCHIVES"],"lesson":"Use a reviewed definition and a live host-owned quote. Definitions and prices are separate builder inputs, not SiteConfig fields. The host performs payment, contract formation and fulfillment."},
 {"id":"customer-confirmations","revision":"1","kind":"functional","shelf":"consumer","title":"Customer confirmations","outcome":"Keep the exact customer copy and track its delivery handoff.","introduction":"Prepare complete, personally addressed files and a fixed delivery destination.","targetIds":["customer-confirmations"],"preview":"/demo/admin/orders","guide":"order-confirmations","requirements":["REQ-PRODUCT-ORDER-CONFIRMATION"],"lesson":"This path needs an existing received Cloudflare order admission and its retained review in the same checkout context. Inspect that foundation without automatically adding a checkout UI. Provider acceptance does not prove recipient delivery."},
 {"id":"guarantee-information","revision":"1","kind":"functional","shelf":"consumer","title":"Guarantee information","outcome":"Show shop guarantee information and eligible product labels.","introduction":"Assess the shop notice and each producer label separately, preserving the original artwork.","targetIds":["guarantee-information"],"preview":"/guarantees","guide":"guarantees","requirements":["REQ-PRODUCT-GUARANTEE-NOTICE","REQ-EU-GUARANTEE-LABEL"],"lesson":"A shop-level legal guarantee notice and a producer commercial guarantee are different displays. Establish each product qualification; missing facts cannot mean no label is required. A valid image is not artwork or legal approval."},
 {id:'ie-consent-duration',revision:'1',kind:'regulatory',shelf:'regional',title:'Irish grant duration',outcome:'Review the supported six-month default cap on remembered grants.',introduction:'A specific timing rule for consent controls, after applicability review.',targetIds:['regional-consent'],preview:'/repeat-prompts',guide:'regional-prompts',requirements:['REQ-IE-CONSENT-DURATION'],lesson:'Grant expiry is separate from refusal memory, asking again and evidence retention.',policy:{path:'consent.grantExpiryPolicy',profile:'ie-dpc-six-month-default',requiredFields:['profile','version'],version:1}},
 {id:'it-repeat-prompts',revision:'1',kind:'regulatory',shelf:'regional',title:'Italian repeat requests',outcome:'Review the supported six-month guard against asking again.',introduction:'A specific solicitation rule for consent controls, after applicability review.',targetIds:['regional-consent'],preview:'/repeat-prompts',guide:'regional-prompts',requirements:['REQ-IT-REPROMPT'],lesson:'This controls repeat solicitation. It does not extend a grant or establish a lawful reason to ask again.',policy:{path:'consent.promptPolicy',profile:'it-garante-2021',requiredFields:['profile','processingRevision']}},
] as const;

/** Shared product grouping for website, reusable UI and text references. */
export function packGroups(){return [
 {id:'basics',anchor:'basics',title:'Start here',description:'Choose one or combine the basics.',compact:false},
 {id:'information',anchor:'information',title:'Privacy information',description:'Explain collection and give people a usable next step.',compact:true},
 {id:'more',anchor:'functions',title:'Add a function',description:'Separate jobs, using the same site inventory.',compact:true},
 {id:'consumer',anchor:'consumer',title:'Purchases and contracts',description:'Choose the transaction jobs your customers need.',compact:true},
 {id:'regional',anchor:'regional',title:'Regional rules',description:'Named preview rules. Assess applicability before enabling a policy; these are not full country packs.',compact:true},
];}

export type CartridgeId=typeof library[number]['id'];
export interface CartridgeSelection {schemaVersion:1;selected:{id:CartridgeId;revision:'1'}[]}
const invalid=():never=>{throw Error('Use known pack IDs and their installed revisions; pack selections must be bounded data-only objects.');};
function record(input:unknown,keys:string[]):Record<string,unknown>{
 if(!input||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input)))return invalid();
 if(Reflect.ownKeys(input).length!==keys.length)return invalid();
 const result:Record<string,unknown>=Object.create(null);
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d||!Object.hasOwn(d,'value')||!d.enumerable)return invalid();result[key]=d.value;}
 return result;
}
export function normalizeCartridgeSelection(input:unknown):CartridgeSelection {
 const v=record(input,['schemaVersion','selected']);
 if(v.schemaVersion!==1||!Array.isArray(v.selected)||Object.getPrototypeOf(v.selected)!==Array.prototype||v.selected.length>library.length||Reflect.ownKeys(v.selected).length!==v.selected.length+1)return invalid();
 const ids=new Set<string>(),selected:CartridgeSelection['selected']=[];
 for(let i=0;i<v.selected.length;i++){
  const d=Object.getOwnPropertyDescriptor(v.selected,String(i));if(!d||!Object.hasOwn(d,'value')||!d.enumerable)return invalid();
  const item=record(d.value,['id','revision']),found=library.find(c=>c.id===item.id);
  if(!found||item.revision!==found.revision||ids.has(found.id))return invalid();ids.add(found.id);selected.push({id:found.id,revision:found.revision});
 }
 return {schemaVersion:1,selected};
}
export function selectCartridges(ids:readonly string[]):CartridgeSelection {
 if(!Array.isArray(ids)||Object.getPrototypeOf(ids)!==Array.prototype||ids.length>library.length||Reflect.ownKeys(ids).length!==ids.length+1)return invalid();
 const selected:CartridgeSelection['selected']=[];
 for(let i=0;i<ids.length;i++){const d=Object.getOwnPropertyDescriptor(ids,String(i));if(!d||!Object.hasOwn(d,'value')||!d.enumerable)return invalid();const found=library.find(c=>c.id===d.value);if(!found)return invalid();selected.push({id:found.id,revision:found.revision});}
 return normalizeCartridgeSelection({schemaVersion:1,selected});
}
export function cartridgeLibrary(){return structuredClone(library);}
/** Optional metadata on private reports. Old reports remain unscoped; unknown revisions cannot silently upgrade. */
export function readCartridgeSelection(input:unknown):CartridgeSelection|undefined {
 if(!input||typeof input!=='object')return undefined;
 const d=Object.getOwnPropertyDescriptor(input,'cartridges');if(!d)return undefined;
 if(!Object.hasOwn(d,'value'))return invalid();return normalizeCartridgeSelection(d.value);
}
export function planCartridges(input:unknown){
 const selection=normalizeCartridgeSelection(input),cartridges=selection.selected.map(s=>library.find(c=>c.id===s.id)!);
 const targetIds=[...new Set(cartridges.flatMap(c=>[...c.targetIds]))],reference=targetIds.length?describeIntegration(targetIds):selectIntegration({schemaVersion:1,answers:{}}).reference;
 return structuredClone({schemaVersion:1,kind:'notabenda-cartridge-plan',selection,cartridges,reference,
  state:selection.selected.length?'facts-needed':'choose-cartridges',
  boundaries:{changesSite:false,activatesFeatures:false,verifiesDeployment:false,legalReview:false},
  supportingWork:reference.targets.filter(t=>t.selection==='prerequisite').map(t=>({id:t.id,title:t.title,action:'Check and reuse the existing foundation before adding anything.'})),
  policyProposals:cartridges.flatMap(c=>'policy' in c?[{cartridgeId:c.id,...c.policy,applied:false}]:[]),
 });
}
export function createCartridgeSetupPlan(selection:unknown,answers:unknown,options:Parameters<typeof createSetupPlan>[1]={}):SetupPlan {
 const normalized=normalizeCartridgeSelection(selection);if(!normalized.selected.length)throw Error('Choose at least one pack before preparing a scoped draft.');
 const plan=createSetupPlan(answers,options);plan.report.cartridges=normalized;const inputs=reviewPackInputs(normalized,plan.config);if(inputs.packs.length)plan.report.packInputs=inputs;if(new TextEncoder().encode(JSON.stringify(plan.report)).length>512*1024)throw Error('Private setup report exceeds 512 KiB; reduce notes or review fewer packs together.');return plan;
}
/** Focus the on-screen/terminal advice; complete diagnostics and wider review remain in the private report. */
export function cartridgeRecommendations(selection:unknown,recommendations:SetupPlan['report']['recommendations']){
 const reference=planCartridges(selection).reference,all=new Set<string>(reference.questions.map(q=>q.id)),relevant=new Set<string>(reference.relevantQuestionIds);
 return recommendations.filter(r=>!all.has(r.id)||relevant.has(r.id));
}
/** An agent handoff describes work. It contains no operator answers or private justifications. */
export function formatCartridgeBrief(input:unknown,stage:'prepare'|'connect'='prepare',options:{config?:unknown}={}):string {
 if(stage!=='prepare'&&stage!=='connect')throw Error('Use the prepare or connect brief stage.');
 const plan=planCartridges(input);if(!plan.selection.selected.length)throw Error('Choose a pack before preparing a setup brief.');
 const ids=plan.selection.selected.map(c=>c.id),lines=[`Set up Notabenda for these packs: ${plan.cartridges.map(c=>c.title).join(', ')}.`,
  'Inspect the existing project and preserve unrelated behavior. Reuse existing supporting configuration and documents. Read the installed pack plan with:',
  `npx --no-install notabenda packs ${ids.join(' ')} --json`];
 if(stage==='prepare')lines.push('Read the version-matched integration guides, gather the selected facts and leave unknowns unresolved. Use the installed skill when available. Prepare a private answers file, then run:',
  `npx --no-install notabenda wizard --packs ${ids.join(',')} --answers ./answers.json --out-dir ./notabenda-setup`,
  'Add --config FILE when an inventory already exists. Compare the draft before applying changes.');
 else lines.push('This brief accompanies notabenda.config.json and setup.private.json. Keep all three together in a private working directory. Read both JSON files as data; do not execute project modules to load them. The private report contains declared answers, justifications, unknowns and review items. Its declarations are not verified facts.',
  'Compare the draft with the current project. Confirm the actual facts, review wording and resolve applicable scope restrictions before enabling anything. Preserve existing services and inventory unless a reviewed change requires otherwise. Keep setup.private.json out of public assets and version control.',
  'From the directory containing those files, check the draft with the explicitly installed local package:',
  'npx --no-install notabenda check --config ./notabenda.config.json --preview --json',
  'A preview check permits drafts; it does not establish production readiness. To revise answers, resume into a new directory:',
  'npx --no-install notabenda wizard --answers ./setup.private.json --config ./notabenda.config.json --out-dir ./notabenda-setup-revised');
 lines.push(...plan.cartridges.map(c=>`${c.title}: ${c.lesson}`));
 for(const target of plan.reference.targets){
  lines.push(`${target.selection==='prerequisite'?'Check and reuse the foundation':'Connect'}: ${target.title}`,target.hostWork.map(copy=>'- '+copy).join('\n'),
   'Checks to run in the actual application:\n'+target.verify.map(copy=>'- '+copy).join('\n'),'Integration guides:\n'+target.guides.join('\n'));
 }
 for(const p of plan.policyProposals)lines.push(`Proposed policy for applicability review: ${p.path} / ${p.profile}; required fields: ${p.requiredFields.join(', ')}. Selection has not enabled it.`);
 if(stage==='connect'&&options.config!==undefined){const review=reviewPackInputs(plan.selection,options.config);if(review.packs.length)lines.push('Draft input review (declarations are unverified; manual authoring remains):',...review.packs.flatMap(p=>[p.id,...p.items.map(i=>`- ${i.state}: ${i.label}${i.paths.length?' — '+i.paths.join(', '):''}`)]));}
 lines.push('Connect the actual host integration and test the selected scenarios. Report changed files, unresolved facts, review needs and real verification results. A selected pack or passing config check does not establish legal compliance or a verified deployment. Packages are unpublished previews: use an explicitly installed local build; do not install an unrelated registry package.');
 return lines.join('\n\n')+'\n';
}

/** Pack naming aliases; stored selections and revisions retain their existing data contract. */
export {cartridgeLibrary as packLibrary,selectCartridges as selectPacks,planCartridges as planPacks,createCartridgeSetupPlan as createPackSetupPlan,readCartridgeSelection as readPackSelection,normalizeCartridgeSelection as normalizePackSelection,formatCartridgeBrief as formatPackBrief};
export type {CartridgeId as PackId,CartridgeSelection as PackSelection};

/** A private handoff lists missing declarations and manual inputs; it never marks a pack configured. */
export interface PackInputReview {
 schemaVersion:1;kind:'notabenda-pack-input-review';productionReady:false;
 packs:{id:CartridgeId;items:{id:string;state:'missing'|'declared'|'needs-review'|'host-work';label:string;paths:string[]}[]}[];
}
export function reviewPackInputs(selection:unknown,input:unknown):PackInputReview {
 const normalized=normalizeCartridgeSelection(selection),config=toPublicConfig(input,{mode:'preview'});
 const packs:PackInputReview['packs']=[];
 for(const pack of normalized.selected){
  const items:PackInputReview['packs'][number]['items']=[];
  const add=(id:string,state:PackInputReview['packs'][number]['items'][number]['state'],label:string,paths:string[]=[])=>items.push({id,state,label,paths});
  if(pack.id==='collection-notices'){
   add('purposes',config.purposes.some(p=>p.collection.source==='direct'||p.collection.source==='both')?'declared':'missing','Select the direct or mixed-source purposes actually collected by this form.',['purposes.collection']);
   if(!/^en(?:-|$)/iu.test(config.site.locale))add('language',config.localization?.collection?'declared':'missing','Supply the complete collection-notice dictionary for the site language.',['localization.collection']);
   add('descriptor','host-work','Author createCollectionNotice inputs: scopeId, purposeIds, context wording and reviewStatus; bind them to the actual privacy release.');
   add('placement','host-work','Render beside the actual fields with unique instance IDs; retain field-specific requirements and test the form separately.');
  }
  if(pack.id==='indirect-collection'){
   add('language',/^en(?:-|$)/iu.test(config.site.locale)?'declared':'needs-review','The supported indirect renderer is English-only. A direct-form dictionary cannot translate its fixed labels; keep another site locale unresolved rather than changing it to bypass this limit.',['site.locale']);
   add('purposes',config.purposes.some(p=>p.collection.source==='indirect'||p.collection.source==='both')?'declared':'missing','Select indirect or mixed-source purposes; do not assume every category was obtained indirectly.',['purposes.collection']);
   add('profile','host-work','Assess the supported nz-ipp3a profile explicitly; supply advance/collected phase, reviewStatus and reviewed English wording. The supported renderer is English-only. No direct-form dictionary localizes it.');
   add('descriptor','host-work','Author createIndirectCollectionNotice collections with exact category subsets, sourceDescription and authority; supply recipientStatement and accessCorrection.');
   add('notification','host-work','Bind the actual privacy release and arrange presentation or delivery, timing and any separate notification evidence. Rendering alone does not notify the person.');
  }
  if(pack.id==='privacy-requests'){
   add('language',supportsRightsPage(config)?'declared':'needs-review','Non-English request pages need complete localization.rights messages in the matching site locale. Keep missing translations unresolved; a collection dictionary cannot translate this page.',['site.locale','localization.rights']);
   add('page',config.rightsCenter?'declared':'missing','Supply the public request page, action kinds, scope explanations, stable destinations and nextSteps.',['rightsCenter']);
   add('contact',config.rightsCenter?.contact?'declared':'missing','Provide an available public email or phone fallback for unsuitable or unavailable account workflows.',['rightsCenter.contact']);
   add('review',config.rightsCenter?.reviewStatus==='reviewed'?'declared':'needs-review','Review the page wording and each destination against the actual request process.',['rightsCenter.reviewStatus']);
   add('workflow','host-work','Test each destination while logged out and without a suitable account; intake, identity, deadlines, appeals and fulfillment remain application work. This supporting page is outside the three pinned legal-document HTML files.');
  }
  if(pack.id==='processing-opt-outs'){
   if(!config.services.length)add('inventory','needs-review','Confirm the actual service inventory; an empty list does not establish absence of processing.',['services']);
   for(const [index,service] of config.services.entries())add('classification-'+index,service.processingActivities===undefined?'missing':'declared','Classify this service explicitly; [] is a deliberate empty classification, not a missing answer.',['services.'+index+'.processingActivities']);
   add('signals',config.privacySignals?'declared':'host-work','Assess whether browser signals apply. Supply privacySignals only for the reviewed signal path; recorded opt-outs do not require that policy.',['privacySignals']);
   add('recording','host-work','If recording explicit restrictions, author the exact processing notice and host-bound context, read/submit transports, failure recovery and retained evidence. A browser-signal-only path does not require this ledger.');
   add('enforcement','host-work','Connect effective restrictions to actual browser, account and downstream processing. Verify uncertain reads, reloads, cookie accept-all, concurrent restrictions and context changes; no reset or re-opt-in flow is supplied.');
  }
  if(['contract-withdrawal','subscription-cancellation','paid-order-review','customer-confirmations'].includes(pack.id)){
   add('audience',config.terms.audience==='business'?'needs-review':'declared','Confirm the actual consumer audience and contract scope. The inventory audience is a declaration, not an applicability assessment.',['terms.audience','terms.serviceType']);
  }
  if(pack.id==='contract-withdrawal'||pack.id==='subscription-cancellation'){
   add('profile','host-work',pack.id==='contract-withdrawal'?'Assess de-withdrawal, eu-withdrawal or br-withdrawal explicitly. Profiles fix their native language (de-DE, en or pt-BR); wording overrides do not translate every control. No profile was selected.':'Assess de-cancellation and its scope/exclusions explicitly. The native interface is German; this is not a generic subscription cancellation profile. No profile was selected.');
   add('definition','host-work','Author createContractActionDefinition with the exact reviewed disclosure release, actionId and revision. These inputs are separate from SiteConfig; preserve old definitions.');
   add('entry','host-work','Provide the actual public entry route and admitted host context, without requiring login, cookie permission or a privacy acceptance checkbox.');
   add('handoffs','host-work','Connect independent acknowledgment and application callbacks with admission, idempotency, scheduling, monitoring and uncertain-result recovery. A recorded declaration does not establish delivery, a refund or contract termination.');
   add('action','host-work',pack.id==='contract-withdrawal'?'Test details review, deliberate final action and exact-request retry after uncertainty. Verify acknowledgment still runs if contract matching or application fails.':'Keep the final action on the confirmation page. Preserve cancellation type, optional reason and requested ending; blank means earliest possible, not a computed termination date. Test exact-request retry.');
  }
  if(pack.id==='paid-order-review'){
   add('definition','host-work','Assess eu-paid-distance-order-v1 and author createPaidOrderDefinition via @notabenda/authoring/orders: actual goods/services/digital content, commitments and complete reviewed wording. No quote or definition is a SiteConfig field.');
   add('prices','host-work','Bind a live host-owned quote: item quantities, minor-unit strings, total/due-now amounts, fixed or calculated, recurring, deferred and conditional charges. Do not infer charges from terms.serviceType.');
   add('goods','host-work','Assess every good: exact qualifying producer label or explicit reviewed no-label-required explanation. Unresolved or missing guarantee facts cannot establish absence. Retain original label bytes.');
   add('admission','host-work','Implement atomic admission for the checkout intent and exact lost-response recovery before expiry rejection. Test stale quotes and concurrent retries. Received does not mean paid or fulfilled.');
   add('placement','host-work','Place all required offer facts and complete labels immediately before the final native payment action; check image readiness, keyboard use and narrow screens in the actual checkout.');
  }
  if(pack.id==='customer-confirmations'){
   add('foundation','host-work','Inspect the existing received @notabenda/cloudflare/orders admission and retained review in the same host checkout context. preparePaidOrderConfirmation cannot accept arbitrary external receipts. Integrate this foundation if missing without manufacturing historic admissions or automatically selecting a checkout UI.');
   add('copy','host-work','Author the complete personally addressed customer copy and exact attachments after actual contract conclusion; include digital-content evidence or an explicit non-applicability reason. A receipt or policy links cannot substitute for the copy.');
   add('destination','host-work','Bind the fixed destination/version and implement the real provider callback, idempotency, scheduling and reconciliation. Keep provider acceptance distinct from recipient delivery.');
   add('recovery','host-work','Test retained files/destination after restart, uncertain settlement, stale leases and retries. Apply host authorization and retention policy to the archive.');
  }
  if(pack.id==='guarantee-information'){
   add('branches','host-work','Assess the shop-level legal guarantee notice and product-specific producer labels separately. Neither branch is selected by a market, locale or this pack. No terms agreement, cookie control or backoffice is required by this display.');
   add('shop','host-work','For the shop notice, choose a supported official language and review the source edition, extracted text alternative, complete artwork and actual placement. Supply surrounding labels outside English; preserve source bytes and the documented source discrepancy for review.');
   add('product','host-work','For each eligible label, establish exact product/model, producer, duration and all four qualification facts; obtain the finished producer file. Missing or false facts stop the importer. They do not establish that no label is needed.');
   add('artwork','host-work','Review the complete original artwork, readable alternatives, language, QR destination and responsive product association; structural image checks and hashes cannot certify these. Retain older files unchanged.');
  }
  if(pack.id==='technology-notices'){
   add('enrollment',config.consent?.services.length?'declared':'missing','Declare the actual optional service and its complete consent-managed purpose set. A declaration will select one service; inventory enrollment alone does not supply it.',['services','consent.services','consent.purposes']);
   for(const [index,enrolled] of (config.consent?.services??[]).entries()){
    const service=config.services.find(item=>item.id===enrolled.id)!;
    const incompatible=service.purposeIds.length>8||service.purposeIds.some(id=>config.purposes.find(p=>p.id===id)!.collection.source==='indirect')||config.storage.some(item=>item.serviceId===service.id&&item.classification!=='optional');
    add('inventory-service-'+index,incompatible?'needs-review':'declared',incompatible?'This enrolled service conflicts with the technology builder’s inventory limits (purpose count, collection source or owned storage). Preserve the facts; select a genuinely supported service or separate the actual work.':'Inspect this enrolled service before selecting a technology declaration. Compatible inventory shape does not establish applicability, unrestricted selected-purpose assessments or an exact scope binding.',['consent.services.'+index,'services','purposes.collection','storage']);
   }
   add('guards',config.scopeGuards?'declared':'missing','Assess the selected purposes with scope guards. Unknown or present specialized contexts remain restricted; never mark them absent to unlock the builder.',['scopeGuards']);
   add('selection','host-work','Select one consent-managed service with at most eight complete purposes, direct/both collection sources and only optional owned storage. Separate functions from always-running or mixed work in the actual application.');
   add('declaration','host-work','Author the explicit qc-private-technology-v1 declaration: serviceId, scopeId, revision, functions, technologyDescription, activationInstructions, controlsLink, direction, every wording/function label and actual review. This is a separate builder input, not localization.collection or a SiteConfig field.');
   add('scope','host-work','Assign technologyCollectionScope(declaration) to the selected service before compiling the legal release. Verify the descriptor against that artifact; old generic grants must not enable the new function.');
   add('presentation','host-work','Place the readable notice before every activation opportunity, including global accept-all. Opening its real controls route must not grant permission. Verify withdrawal, cleanup, failed evidence and independent restrictions.');
   add('retention','host-work','Retain the exact supplemental notice descriptor alongside its legal artifact and any required presentation evidence. Ordinary consent receipts do not archive this notice or prove it was shown.');
  }
  if(pack.id==='assessed-storage-settings'){
   add('policy',config.storageExceptions?'declared':'missing','Supply the explicitly assessed storageExceptions policy, information route and disclosed until-cleared preference lifetime. Market selection supplies none of these facts.',['storageExceptions']);
   add('entries',config.storageExceptions?.entries.length?'declared':'missing','Declare exact exception entries and exclusive service/purpose/storage ownership, with stable IDs and increasing material revisions. Do not reclassify optional tools from their vendor or category labels.',['storageExceptions.entries','storage']);
   add('guards',config.scopeGuards?'declared':'missing','Keep explicit selected-purpose assessments; present or unknown restricted contexts stay off.',['scopeGuards']);
   add('language',/^en(?:-|$)/iu.test(config.site.locale)?'declared':'needs-review','The native exception controls currently require English. Another site language needs a custom headless presentation with reviewed information and objection controls; a consent dictionary does not translate this interface.',['site.locale']);
   for(const [index,entry] of (config.storageExceptions?.entries??[]).entries()){
    add('entry-review-'+index,entry.reviewStatus==='reviewed'?'declared':'needs-review','Review this entry’s selected profile and establish every condition from the actual operation. A reviewed flag or true assertion does not prove eligibility.',['storageExceptions.entries.'+index+'.reviewStatus','storageExceptions.entries.'+index+'.profile',...Object.keys(entry.conditions).map(key=>'storageExceptions.entries.'+index+'.conditions.'+key)]);
   }
   add('eligibility','host-work','Assess each uk-pecr-statistical or uk-pecr-appearance condition in the guide. Document actual technical isolation and the independent personal-data processing basis; an exception is not permission for advertising, profiling or mixed SDKs.');
   add('ownership','host-work','Keep managed services/purposes out of consent enrollment. Each managed service needs explicit processingActivities: [], no Google Basic declaration and exclusively owned exception storage. Splitting IDs does not establish actual separation.');
   add('journal','host-work','Provide an atomic journal with notifications, disclose its own storage/lifetime and wait for hydration plus usable information/free objection controls before any start. Detaching presentation must close gates.');
   add('recovery','host-work','Test immediate objections, failed writes, stale resume, cross-tab changes, material revisions and cleanup. Preserve stable IDs; cookie accept-all cannot clear an objection. Dispose owned work and journals deliberately.');
  }
  if(pack.id==='google-basic'){
   const services=config.services.map((service,index)=>({service,index})).filter(item=>item.service.googleBasic!==undefined);
   add('declaration',services.length?'declared':'missing','Declare the actual supported Google service, targets, initial origin, processing classification and all four signal mappings. A provider name alone supplies no declaration.',['services.googleBasic']);
   for(const {index} of services)add('service-'+index,'declared','Check this service’s G-/AW- targets and exact purpose mappings. Every array is explicit; [] keeps its signal denied. All purposes gate the entire combined service.',['services.'+index+'.googleBasic.tagIds','services.'+index+'.googleBasic.signals.analytics_storage','services.'+index+'.googleBasic.signals.ad_storage','services.'+index+'.googleBasic.signals.ad_user_data','services.'+index+'.googleBasic.signals.ad_personalization','services.'+index+'.resourceOrigins','services.'+index+'.processingActivities']);
   if(services.length>1)add('multiple-services','needs-review','Several Google services are declared. They may belong to different pages; establish one Google owner per document rather than creating competing adapters.',['services.googleBasic']);
   add('ownership','host-work','Remove preexisting Google snippets, GTM, hints, queues and competing loaders before registration. Register once outside replayed renders; review actual account connections and destinations. DOM checks cannot prove an earlier loader never ran.');
   add('limits','host-work','Use only supported G-/AW- destinations and Basic gating. GTM containers, Advanced mode, enhanced conversions and undeclared connected destinations are outside this adapter. Keep actual purpose scope and independent processing restrictions.');
   add('verification','host-work','Test no loader before effective grant or after initial refusal, denied defaults before initialization, required receipts/GPC and pending-load withdrawal. Use deliberate events; discarded events never replay.');
   add('reset','host-work','After any load attempt, withdrawal, load failure or cancellation requires full document reload/navigation before regrant. Preserve application state safely; adapter stop cannot guarantee post-load vendor network silence or CMP certification.');
  }
  if(items.length)packs.push({id:pack.id,items});
 }
 return {schemaVersion:1,kind:'notabenda-pack-input-review',productionReady:false,packs};
}
