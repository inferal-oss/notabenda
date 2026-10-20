// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-SETUP REQ-PRODUCT-AGENT-INTEGRATION
import {describeIntegration,selectIntegration} from './integration-reference.js';
import {createSetupPlan} from './setup.js';
import type {SetupPlan} from './setup.js';

/** Product jobs reference the existing integration contract, rather than another validator or permission engine. */
const library=[
 {id:'privacy-pages',revision:'1',kind:'functional',shelf:'basics',title:'Privacy pages',outcome:'Explain how your site handles information.',introduction:'Publish privacy, cookie and terms pages in your own design.',targetIds:['legal-pages'],preview:'/privacy',guide:'package',requirements:['REQ-PRODUCT-DOCUMENTS'],lesson:'A notice explains your practices. Reading it does not grant permission or accept terms.'},
 {id:'cookie-choices',revision:'1',kind:'functional',shelf:'basics',title:'Cookie choices',outcome:'Let people choose which optional tools may run.',introduction:'Add a compact request, preferences and service gates.',targetIds:['cookie-consent'],preview:'/choices',guide:'consent',requirements:['REQ-EU-DEVICE','REQ-EU-FAIR-CHOICE'],lesson:'The control and your loaders work together. Connect each optional tool so it stays off until permitted and stops after withdrawal.'},
 {id:'terms-agreement',revision:'1',kind:'functional',shelf:'basics',title:'Terms agreement',outcome:'Ask for agreement to an exact terms version.',introduction:'Add an unchecked choice and wait for an acknowledged record.',targetIds:['terms-agreement'],preview:'/agreement',guide:'terms',requirements:['REQ-PRODUCT-TERMS-ACCEPTANCE'],lesson:'Publishing terms and recording agreement are separate jobs. Your application supplies the workflow, identity and recording transport.'},
 {id:'form-permissions',revision:'1',kind:'functional',shelf:'more',title:'Form permissions',outcome:'Keep optional permissions separate from submitting a form.',introduction:'Offer a purpose and channel with independent withdrawal.',targetIds:['form-permissions'],preview:'/form-permissions',guide:'form-permissions',requirements:['REQ-PRODUCT-FORM-PERMISSIONS'],lesson:'Submitting an enquiry is not a marketing opt-in. Bind the optional choice to its own purpose, channel and record.'},
 {id:'gated-media',revision:'1',kind:'functional',shelf:'more',title:'Gated media',outcome:'Keep remote media unloaded until it is permitted.',introduction:'Use an inert placeholder for a frame or image.',targetIds:['embeds'],preview:'/embeds',guide:'embeds',requirements:['REQ-PRODUCT-EMBEDS'],lesson:'Remove remote URLs and resource hints from initial markup. A visual placeholder alone does not stop a request.'},
 {id:'evidence-workspace',revision:'1',kind:'functional',shelf:'more',title:'Evidence workspace',outcome:'Keep and inspect the wording and actions you record.',introduction:'Add retained versions, searchable records and a private backoffice.',targetIds:['evidence'],preview:'/demo/admin',guide:'cloudflare',requirements:['REQ-PRODUCT-CF-ADMIN','REQ-PRODUCT-CF-HISTORY'],lesson:'Browser preference memory and durable evidence have different jobs. You supply authorization, recording admission and retention policy.'},
 {id:'ie-consent-duration',revision:'1',kind:'regulatory',shelf:'regional',title:'Irish grant duration',outcome:'Review the supported six-month default cap on remembered grants.',introduction:'A specific timing rule for consent controls, after applicability review.',targetIds:['regional-consent'],preview:'/repeat-prompts',guide:'regional-prompts',requirements:['REQ-IE-CONSENT-DURATION'],lesson:'Grant expiry is separate from refusal memory, asking again and evidence retention.',policy:{path:'consent.grantExpiryPolicy',profile:'ie-dpc-six-month-default',requiredFields:['profile','version'],version:1}},
 {id:'it-repeat-prompts',revision:'1',kind:'regulatory',shelf:'regional',title:'Italian repeat requests',outcome:'Review the supported six-month guard against asking again.',introduction:'A specific solicitation rule for consent controls, after applicability review.',targetIds:['regional-consent'],preview:'/repeat-prompts',guide:'regional-prompts',requirements:['REQ-IT-REPROMPT'],lesson:'This controls repeat solicitation. It does not extend a grant or establish a lawful reason to ask again.',policy:{path:'consent.promptPolicy',profile:'it-garante-2021',requiredFields:['profile','processingRevision']}},
] as const;
export type CartridgeId=typeof library[number]['id'];
export interface CartridgeSelection {schemaVersion:1;selected:{id:CartridgeId;revision:'1'}[]}
const invalid=():never=>{throw Error('Use known cartridge IDs and their installed revisions; cartridge selections must be bounded data-only objects.');};
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
 const normalized=normalizeCartridgeSelection(selection);if(!normalized.selected.length)throw Error('Choose at least one cartridge before preparing a scoped draft.');
 const plan=createSetupPlan(answers,options);plan.report.cartridges=normalized;return plan;
}
/** Focus the on-screen/terminal advice; complete diagnostics and wider review remain in the private report. */
export function cartridgeRecommendations(selection:unknown,recommendations:SetupPlan['report']['recommendations']){
 const reference=planCartridges(selection).reference,all=new Set<string>(reference.questions.map(q=>q.id)),relevant=new Set<string>(reference.relevantQuestionIds);
 return recommendations.filter(r=>!all.has(r.id)||relevant.has(r.id));
}
/** An agent handoff describes work. It contains no operator answers or private justifications. */
export function formatCartridgeBrief(input:unknown):string {
 const plan=planCartridges(input);if(!plan.selection.selected.length)throw Error('Choose a cartridge before preparing a setup brief.');
 const ids=plan.selection.selected.map(c=>c.id).join(',');
 return `Set up Notabenda for these cartridges: ${plan.cartridges.map(c=>c.title).join(', ')}.\n\nInspect the existing project and preserve unrelated behavior. Reuse existing supporting configuration and documents. Read the installed cartridge plan with:\n\nnpx --no-install notabenda cartridges ${plan.selection.selected.map(c=>c.id).join(' ')} --json\n\nRead the version-matched integration guides, gather the selected facts and leave unknowns unresolved. Use the installed skill when available. Prepare a private answers file, then run:\n\nnpx --no-install notabenda wizard --cartridges ${ids} --answers ./answers.json --out-dir ./notabenda-setup\n\nAdd --config FILE when an inventory already exists. Compare the draft before applying changes.\n\n${plan.cartridges.map(c=>`${c.title}: ${c.lesson}`).join('\n\n')}\n\n${plan.policyProposals.map(p=>`Proposed policy for applicability review: ${p.path} / ${p.profile}; required fields: ${p.requiredFields.join(', ')}. Selection has not enabled it.`).join('\n')}\n\nConnect the actual host integration and test the selected scenarios. Report changed files, unresolved facts, review needs and real verification results. A selected cartridge or passing config check does not establish legal compliance or a verified deployment. Packages are unpublished previews: use an explicitly installed local build; do not install an unrelated registry package.\n`;
}
