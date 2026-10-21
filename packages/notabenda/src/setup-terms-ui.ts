// @requirements REQ-PRODUCT-TERMS-AUTHORING REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-SETUP-SESSION
import {toPublicConfig} from './config.js';
import {createTermsDraftPlan} from './setup-terms.js';
import type {TermsDraftPlan,TermsDraftSetting} from './setup-terms.js';
import {captureEditorFields,restoreEditorFields} from './setup-session-fields.js';
import type {InventoryEditorDraft} from './setup-session-fields.js';
/** Local configuration only. The host adopts the draft; no agreement is submitted or activated. */
export function mountTermsEditor(container:HTMLElement,options:{getConfig():unknown;onChange(plan:TermsDraftPlan):void;onStatus?(message:string):void}){
 const doc=container.ownerDocument;if(!doc.defaultView||!options||typeof options.getConfig!=='function'||typeof options.onChange!=='function')throw Error('Provide a browser window and current draft read/change callbacks.');
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const root=node('details');root.className='nb-setup-purpose-editor nb-setup-terms-editor';const summary=node('summary','Terms agreements');root.append(summary);container.append(root);
 const body=node('div');body.className='nb-setup-purpose-body';body.append(node('p','Configure the statement and button label for each signup or other workflow. This is optional when your application already builds its own offers. It does not write the terms document or activate an agreement.'));root.append(body);
 const list=node('div');list.className='nb-setup-purpose-list';const add=node('button','Add an agreement scope');add.type='button';add.className='nb-choice-button';const status=node('p');status.setAttribute('role','status');const panel=node('section');panel.className='nb-setup-purpose-proposal';panel.hidden=true;body.append(list,add,status,panel);
 let destroyed=false,proposal:InventoryEditorDraft['proposal']|undefined;
 for(const type of ['input','change'])root.addEventListener(type,event=>event.stopPropagation());
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'&&!event.isComposing&&(event.target as HTMLElement)?.tagName==='INPUT')event.preventDefault();});
 const message=(text:string)=>{status.textContent=text;try{options.onStatus?.(text);}catch{}};
 function edit(id?:string,remove=false,restored?:NonNullable<InventoryEditorDraft['proposal']>){
  if(destroyed)return;let baseline;try{baseline=toPublicConfig(restored?.baseline??options.getConfig(),{mode:'preview'});}catch{message('Load a valid site draft before editing agreements.');return;}
  const previous=id?baseline.terms.agreements?.find(entry=>entry.scopeId===id):undefined;if(id&&!previous){message('That scope is no longer in this draft. Reopen the list.');return;}
  root.open=true;proposal={...(id?{id}:{}),remove,fields:{values:[],details:[]},baseline};const activeProposal=proposal;panel.replaceChildren();panel.hidden=false;
  const heading=node('h3',remove?'Remove agreement settings':id?'Edit agreement settings':'New agreement scope');heading.tabIndex=-1;panel.append(heading);const controls=new Map<string,HTMLInputElement|HTMLTextAreaElement>();
  if(remove){panel.append(node('p','Removing these settings does not deactivate an existing backend offer. Retire the old workflow separately and keep its retained records and acknowledged retries.'));const label=node('label'),confirm=node('input');confirm.type='checkbox';confirm.dataset.sessionReview='true';label.append(confirm,doc.createTextNode('Remove settings for '+id+' from this draft.'));panel.append(label);controls.set('confirmed',confirm);}
  else{
   const fields=node('div');fields.className='nb-setup-purpose-fields';panel.append(fields);
   for(const [key,label,max,multiline] of [['scopeId','Workflow scope',120,false],['revision','Wording revision',120,false],['actionLabel','Button label',120,false],['statement','Agreement statement',2000,true]] as const){
    const field=node('div');field.className='nb-setup-purpose-field'+(multiline?' nb-setup-terms-statement':'');const input=multiline?node('textarea'):node('input');if(input.tagName==='INPUT')(input as HTMLInputElement).type='text';input.maxLength=max;input.required=true;input.id='nb-terms-edit-'+crypto.randomUUID();if(multiline)(input as HTMLTextAreaElement).rows=4;if(key==='scopeId'&&id){(input as HTMLInputElement).readOnly=true;input.value=id;}else input.value=previous?.[key]??'';
    const title=node('label',label);title.htmlFor=input.id;field.append(title,input);fields.append(field);controls.set(key,input);
   }
   panel.append(node('p','Use a stable name such as account-terms, without person or order identifiers. Enter your own statement and action label. Editing needs a new wording revision and returns it to draft review.'));
  }
  const actions=node('div');actions.className='nb-setup-purpose-actions';const save=node('button',remove?'Remove settings':'Save agreement draft'),cancel=node('button','Cancel');for(const b of [save,cancel]){b.type='button';b.className='nb-choice-button';}save.classList.add('nb-primary');actions.append(save,cancel);panel.append(actions);
  save.addEventListener('click',()=>{if(destroyed||!proposal||proposal!==activeProposal||panel.hidden)return;for(const control of controls.values()){control.removeAttribute('aria-invalid');if(!control.checkValidity()){control.setAttribute('aria-invalid','true');message('Complete the highlighted agreement field before saving.');control.focus();return;}}try{
   if(remove&&!(controls.get('confirmed') as HTMLInputElement).checked)throw Error('Confirm removal of these draft settings. The backend offer will remain unchanged.');
   const settings=Object.fromEntries([...controls].map(([key,field])=>[key,field.value])) as unknown as TermsDraftSetting;
   let current:unknown;try{current=options.getConfig();}catch{message('Could not read the current host draft. Reopen the editor before trying again.');return;}
   const plan=createTermsDraftPlan(current,{baseline:proposal.baseline,input:{schemaVersion:1,changes:[remove?{action:'remove',scopeId:id!,confirmed:true}:{action:id?'update':'add',settings}]}});try{options.onChange(plan);}catch{message('Could not confirm the host draft update. Check the current draft before trying again.');return;}proposal=undefined;panel.hidden=true;refresh();add.focus();message(remove?'Agreement settings removed from the draft. Backend selection is unchanged.':'Agreement wording saved as a draft. Review the document and wording before building or activating an offer.');
  }catch(error){message(error instanceof Error?error.message:'Could not save this agreement draft.');}});
  cancel.addEventListener('click',()=>{if(destroyed||proposal!==activeProposal)return;proposal=undefined;panel.hidden=true;add.focus();});
  if(restored){try{restoreEditorFields(panel,restored.fields);}catch{proposal=undefined;panel.hidden=true;message('The saved agreement editor could not be restored. Confirmed config is unchanged.');return;}}
  else heading.focus();
 }
 function refresh(refreshOptions:{discardDraft?:boolean}={}){
  if(destroyed)return;if(refreshOptions.discardDraft){proposal=undefined;panel.hidden=true;panel.replaceChildren();}list.replaceChildren();
  try{const config=toPublicConfig(options.getConfig(),{mode:'preview'}),entries=config.terms.agreements??[];summary.textContent='Terms agreements'+(entries.length?' · '+entries.length:'');add.disabled=false;
   if(!entries.length)list.append(node('p','No configured scopes. Host-authored offers remain supported.'));
   for(const entry of entries){const card=node('article');card.className='nb-setup-purpose-card';card.dataset.termsScope=entry.scopeId;card.append(node('h3',entry.scopeId),node('p',entry.statement),node('p','Button: '+entry.actionLabel),node('small','Revision '+entry.revision+' · '+(entry.reviewStatus==='reviewed'?'Host-declared reviewed':'Draft')));const actions=node('div');actions.className='nb-setup-purpose-actions';for(const [label,remove] of [['Edit',false],['Remove',true]] as const){const button=node('button',label);button.type='button';button.className='nb-choice-button';button.setAttribute('aria-label',label+' '+entry.scopeId);button.addEventListener('click',()=>edit(entry.scopeId,remove));actions.append(button);}card.append(actions);list.append(card);}
  }catch{add.disabled=true;list.append(node('p','Load a valid configuration to edit terms agreements.'));}
 }
 add.addEventListener('click',()=>edit());refresh();
 return {show(){if(destroyed)throw Error('Editor has ended.');root.open=true;summary.focus();},refresh,getSessionDraft():InventoryEditorDraft{return structuredClone({open:root.open,...(proposal?{proposal:{...proposal,fields:captureEditorFields(panel)}}:{})});},restoreSessionDraft(draft:InventoryEditorDraft){if(destroyed)return;if(draft.proposal)edit(draft.proposal.id,draft.proposal.remove,draft.proposal);root.open=draft.open;},destroy(){if(destroyed)return;destroyed=true;proposal=undefined;root.remove();}};
}
