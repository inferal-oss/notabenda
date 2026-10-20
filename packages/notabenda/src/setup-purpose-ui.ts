// @requirements REQ-PRODUCT-SETUP-SESSION
import {captureEditorFields,restoreEditorFields} from './setup-session-fields.js';
import type {EditorFields,InventoryEditorDraft} from './setup-session-fields.js';
/** @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-CONFIG REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-SERVICE-CATALOG */
import {createPurposeDraftPlan} from './setup-purpose.js';
import type {PurposeDraftPlan} from './setup-purpose.js';
import {toPublicConfig} from './config.js';
import type {Purpose} from './types.js';
export interface PurposeEditorOptions {getConfig():unknown;onChange(plan:PurposeDraftPlan):void}
export interface MountedPurposeEditor {getSessionDraft():InventoryEditorDraft;restoreSessionDraft(draft:InventoryEditorDraft):void;refresh(options?:{discardDraft?:boolean}):void;destroy():void}

/** In-memory public purpose authoring. A host owns the draft and every persistence/deployment decision. */
export function mountPurposeEditor(container:HTMLElement,options:PurposeEditorOptions):MountedPurposeEditor {
 if(!container?.ownerDocument||typeof options.getConfig!=='function'||typeof options.onChange!=='function')throw Error('Supply a current draft and explicit purpose-change callback.');
 const doc=container.ownerDocument,node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const element=doc.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
 const root=node('details');root.className='nb-setup-purpose-editor';const summary=node('summary');root.append(summary);container.append(root);
 const body=node('div');body.className='nb-setup-purpose-body';body.append(node('p','Describe why you collect personal data before choosing providers. These facts appear in your public privacy notice; keep private reasoning in the questionnaire.'));
 const list=node('div');list.className='nb-setup-purpose-list';body.append(list);
 const add=node('button','Add a processing purpose');add.type='button';add.className='nb-choice-button';body.append(add);
 const status=node('p');status.setAttribute('role','status');body.append(status);
 const panel=node('section');panel.className='nb-setup-purpose-proposal';panel.hidden=true;body.append(panel);root.append(body);let destroyed=false;let proposalMode:{id?:string;remove:boolean;baseline:unknown}|undefined;
 for(const type of ['input','change'])root.addEventListener(type,event=>event.stopPropagation());
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'&&!event.isComposing&&(event.target as HTMLElement)?.tagName==='INPUT')event.preventDefault();});
 function report(message:string){status.textContent=message;status.tabIndex=-1;status.focus();}
 function render(){
  if(destroyed)return;list.replaceChildren();
  try{
   const config=toPublicConfig(options.getConfig(),{mode:'preview'});summary.textContent=`Processing purposes · ${config.purposes.length} declared`;
   if(!config.purposes.length)list.append(node('p','No purposes declared yet. Add your first purpose to make it available when reviewing a service.'));
   for(const purpose of config.purposes){const card=node('section');card.className='nb-setup-purpose-card';card.append(node('h3',purpose.name),node('p',purpose.description));const meta=node('p',purpose.id+' · '+purpose.dataCategories.join(', '));meta.className='nb-setup-purpose-meta';card.append(meta);const actions=node('div');actions.className='nb-setup-purpose-actions';for(const [label,remove] of [['Edit',false],['Remove',true]] as const){const button=node('button',label);button.type='button';button.className='nb-choice-button';button.setAttribute('aria-label',label+' purpose '+purpose.name);button.addEventListener('click',()=>{try{open(purpose,remove);}catch{report('Finish importing a valid config before reviewing a purpose.');}});actions.append(button);}card.append(actions);list.append(card);}
  }catch{summary.textContent='Processing purposes';list.append(node('p','Finish importing a valid config before editing purposes.'));}
 }
 function open(previous?:Purpose,remove=false,baseline?:unknown){
  const snapshot=toPublicConfig(baseline??options.getConfig(),{mode:'preview'});proposalMode={...(previous?{id:previous.id}:{}),remove,baseline:snapshot};panel.replaceChildren();panel.hidden=false;
  const heading=node('h3',remove?'Remove '+previous!.name:previous?'Edit '+previous.name:'Describe a processing purpose');heading.tabIndex=-1;panel.append(heading);
  const error=node('p');error.setAttribute('role','alert');
  const cancel=node('button','Cancel purpose edit');cancel.type='button';cancel.className='nb-choice-button';cancel.addEventListener('click',()=>{panel.hidden=true;panel.replaceChildren();add.focus();});
  const controls=new Map<string,HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>();let sequence=0;const prefix='nb-setup-purpose-'+crypto.randomUUID();
  const group=(title:string,copy:string)=>{const group=node('div');group.className='nb-setup-purpose-group';const titleNode=node('h4',title);group.append(titleNode,node('p',copy));panel.append(group);const grid=node('div');grid.className='nb-setup-purpose-fields';group.append(grid);return grid;};
  const field=(parent:HTMLElement,key:string,title:string,value:string,options:{multiline?:boolean;choices?:[string,string][];required?:boolean;help?:string;max?:number}={})=>{
   const wrapper=node('div');wrapper.className='nb-setup-purpose-field';const label=node('label',title),id=prefix+'-'+sequence++;label.htmlFor=id;
   const control=options.choices?node('select'):options.multiline?node('textarea'):node('input');control.id=id;
   if(control.tagName==='TEXTAREA'){(control as HTMLTextAreaElement).rows=3;}
   if(options.choices)for(const [value,label] of options.choices){const option=node('option',label);option.value=value;control.append(option);}
   else (control as HTMLInputElement|HTMLTextAreaElement).maxLength=options.max??4000;
   control.value=value;control.required=options.required??false;wrapper.append(label,control);controls.set(key,control);
   if(options.help){const help=node('p',options.help);help.id=id+'-help';control.setAttribute('aria-describedby',help.id);wrapper.append(help);}parent.append(wrapper);return control;
  };
  if(remove){panel.append(node('p','Remove this purpose from the local draft? Linked services, consent scopes or restrictions must be reviewed separately first. They are never deleted by this action.'));}
  else{
   const facts=group('Purpose and data','Use concrete public descriptions of your actual processing.');
   const id=field(facts,'id','Stable purpose ID',previous?.id??'',{required:true,max:120,help:'Lowercase letters, digits and hyphens. Keep this ID when editing.'});(id as HTMLInputElement).pattern='[a-z][a-z0-9-]*';(id as HTMLInputElement).readOnly=!!previous;
   field(facts,'name','Purpose name',previous?.name??'',{required:true,max:300});
   field(facts,'description','What you use the data for',previous?.description??'',{multiline:true,required:true});
   field(facts,'dataCategories','Data categories (one per line)',previous?.dataCategories.join('\n')??'',{multiline:true,required:true,help:'For example, describe actual categories rather than entering personal data.'});
   const assessment=group('Basis and retention','Supply reviewed text. An unresolved basis or retention period becomes a draft placeholder that blocks production output.');
   const editable=(value:string|undefined)=>value&&/^\{\{purposes\.[a-z][a-z0-9-]*\.[a-zA-Z.]+\}\}$/u.test(value)?'':value??'';
   field(assessment,'legalBasis','Legal basis',editable(previous?.legalBasis),{multiline:true});
   // @requirements REQ-EU-INTERESTS-DISCLOSURE
   field(assessment,'legitimateInterests','Legitimate interests (when applicable)',previous?.legitimateInterests??'',{multiline:true,help:'Public wording: explain the interests pursued and by whom, in the notice language. Keep the balancing assessment private. Leave blank when this field does not apply; this editor does not choose a legal basis.'});
   field(assessment,'retention','How long you keep the data',editable(previous?.retention),{multiline:true});
   const collection=group('Collection context','Record where the information comes from and whether providing it is required. These are separate from cookie consent.');
   field(collection,'source','Where the data comes from',previous?.collection.source??'',{required:true,choices:[['','Choose the actual source'],['direct','Directly from the person'],['indirect','From another source'],['both','Both direct and indirect sources']]});
   field(collection,'required','Is providing this information required?',previous===undefined?'':String(previous.collection.required),{required:true,choices:[['','Choose yes or no'],['true','Yes'],['false','No']]});
   field(collection,'collectionDescription','When and where you collect it',previous?.collection.description??'',{multiline:true,required:true});
   field(collection,'consequences','What happens if it is not provided',editable(previous?.collection.consequences),{multiline:true,help:'Leave blank if unresolved; a draft placeholder will require review.'});
  }
  const actions=node('div');actions.className='nb-setup-purpose-actions';const save=node('button',remove?'Confirm purpose removal':previous?'Save purpose changes':'Add purpose to draft');save.type='button';save.className='nb-choice-button nb-primary';actions.append(save,cancel);panel.append(error,actions);
  save.addEventListener('click',()=>{
   if(destroyed)return;error.textContent='';
   for(const control of controls.values()){control.removeAttribute('aria-invalid');if(!control.checkValidity()){control.setAttribute('aria-invalid','true');error.textContent='Complete the highlighted public fact before saving. Unknown basis, retention and consequences can remain blank for draft review.';control.focus();return;}}
   try{
    const current=toPublicConfig(options.getConfig(),{mode:'preview'});if(current.site.id!==snapshot.site.id||current.site.url!==snapshot.site.url)throw Error('The site changed. Reopen this purpose before saving.');
    const value=(key:string)=>controls.get(key)!.value.trim();
    const purpose=remove?undefined:{id:value('id'),name:value('name'),description:value('description'),dataCategories:value('dataCategories').split(/\r?\n/u).map(v=>v.trim()).filter(Boolean),legalBasis:value('legalBasis')||`{{purposes.${value('id')}.legalBasis}}`,...(value('legitimateInterests')?{legitimateInterests:value('legitimateInterests')}:{}),retention:value('retention')||`{{purposes.${value('id')}.retention}}`,collection:{source:value('source') as Purpose['collection']['source'],required:value('required')==='true',description:value('collectionDescription'),consequences:value('consequences')||`{{purposes.${value('id')}.collection.consequences}}`}};
    const result=createPurposeDraftPlan(current,remove?{action:'remove',previous:previous!}:previous?{action:'update',previous,purpose:purpose!}:{action:'add',purpose:purpose!});
    try{options.onChange(result);}catch{error.textContent='Could not confirm the host draft update. Check the current draft before trying again.';return;}
    panel.hidden=true;panel.replaceChildren();render();report(result.action==='remove'?'Removed the purpose from the local draft.':result.action==='update'?'Updated the public purpose facts. Earlier catalog selection notes may need renewed review.':'Added the purpose to the local draft. It is now available when reviewing a service.');
   }catch(errorValue){error.textContent=(errorValue instanceof Error?errorValue.message:'Check the bounded purpose fields.')+' Nothing was changed by the editor.';}
  });
  heading.focus();
 }
 add.addEventListener('click',()=>{try{open();}catch{report('Finish importing a valid config before adding a purpose.');}});render();
 return {getSessionDraft(){return {open:root.open,...(!panel.hidden&&proposalMode?{proposal:{...proposalMode,fields:captureEditorFields(panel)}}:{})};},restoreSessionDraft(draft){if(draft.proposal){const p=draft.proposal,c=toPublicConfig(p.baseline,{mode:'preview'}),prior=p.id?c.purposes.find(v=>v.id===p.id):undefined;if(p.id&&!prior||p.remove&&!prior)throw Error('The saved purpose is missing.');open(prior,p.remove,p.baseline);restoreEditorFields(panel,p.fields);}root.open=draft.open;},refresh({discardDraft=false}={}){if(destroyed)return;if(discardDraft){panel.hidden=true;panel.replaceChildren();}render();},destroy(){if(destroyed)return;destroyed=true;root.remove();}};
}
