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
 {id:'form-permissions',revision:'1',kind:'functional',shelf:'more',title:'Form permissions',outcome:'Keep optional permissions separate from submitting a form.',introduction:'Offer a purpose and channel with independent withdrawal.',targetIds:['form-permissions'],preview:'/form-permissions',guide:'form-permissions',requirements:['REQ-PRODUCT-FORM-PERMISSIONS'],lesson:'Submitting an enquiry is not a marketing opt-in. Bind the optional choice to its own purpose, channel and record.'},
 {id:'gated-media',revision:'1',kind:'functional',shelf:'more',title:'Gated media',outcome:'Keep remote media unloaded until it is permitted.',introduction:'Use an inert placeholder for a frame or image.',targetIds:['embeds'],preview:'/embeds',guide:'embeds',requirements:['REQ-PRODUCT-EMBEDS'],lesson:'Remove remote URLs and resource hints from initial markup. A visual placeholder alone does not stop a request.'},
 {id:'evidence-workspace',revision:'1',kind:'functional',shelf:'more',title:'Evidence workspace',outcome:'Keep and inspect the wording and actions you record.',introduction:'Add retained versions, searchable records and a private backoffice.',targetIds:['evidence'],preview:'/demo/admin',guide:'cloudflare',requirements:['REQ-PRODUCT-CF-ADMIN','REQ-PRODUCT-CF-HISTORY'],lesson:'Browser preference memory and durable evidence have different jobs. You supply authorization, recording admission and retention policy.'},
 {id:'processing-opt-outs',revision:'1',kind:'functional',shelf:'more',title:'Processing opt-outs',outcome:'Keep processing restrictions separate from cookie permission.',introduction:'Connect assessed browser signals or recorded opt-outs to the work they restrict.',targetIds:['processing-opt-outs'],preview:'/processing-choices',guide:'processing-choices',requirements:['REQ-PRODUCT-PROCESSING-CHOICES','REQ-US-CA-GPC'],lesson:'Classify every service, including an explicit empty activity list. Choose signal handling and recorded restrictions separately; enforce account and downstream effects in the host. Cookie acceptance cannot clear a restriction.'},
 {id:'ie-consent-duration',revision:'1',kind:'regulatory',shelf:'regional',title:'Irish grant duration',outcome:'Review the supported six-month default cap on remembered grants.',introduction:'A specific timing rule for consent controls, after applicability review.',targetIds:['regional-consent'],preview:'/repeat-prompts',guide:'regional-prompts',requirements:['REQ-IE-CONSENT-DURATION'],lesson:'Grant expiry is separate from refusal memory, asking again and evidence retention.',policy:{path:'consent.grantExpiryPolicy',profile:'ie-dpc-six-month-default',requiredFields:['profile','version'],version:1}},
 {id:'it-repeat-prompts',revision:'1',kind:'regulatory',shelf:'regional',title:'Italian repeat requests',outcome:'Review the supported six-month guard against asking again.',introduction:'A specific solicitation rule for consent controls, after applicability review.',targetIds:['regional-consent'],preview:'/repeat-prompts',guide:'regional-prompts',requirements:['REQ-IT-REPROMPT'],lesson:'This controls repeat solicitation. It does not extend a grant or establish a lawful reason to ask again.',policy:{path:'consent.promptPolicy',profile:'it-garante-2021',requiredFields:['profile','processingRevision']}},
] as const;

/** Shared product grouping for website, reusable UI and text references. */
export function packGroups(){return [
 {id:'basics',anchor:'basics',title:'Start here',description:'Choose one or combine the basics.',compact:false},
 {id:'information',anchor:'information',title:'Privacy information',description:'Explain collection and give people a usable next step.',compact:true},
 {id:'more',anchor:'functions',title:'Add a function',description:'Separate jobs, using the same site inventory.',compact:true},
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
  if(items.length)packs.push({id:pack.id,items});
 }
 return {schemaVersion:1,kind:'notabenda-pack-input-review',productionReady:false,packs};
}
