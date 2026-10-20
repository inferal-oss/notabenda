// @requirements REQ-PRODUCT-SETUP-SESSION
import {captureEditorFields,restoreEditorFields} from './setup-session-fields.js';
import type {EditorFields,InventoryEditorDraft} from './setup-session-fields.js';
// @requirements REQ-PRODUCT-CONSENT-AUTHORING REQ-PRODUCT-A11Y REQ-PRODUCT-SCOPE-GUARDS
import {toPublicConfig} from './config.js';
import {createConsentDraftPlan} from './setup-consent.js';
import type {ConsentDraftPlan,ConsentDraftSettings} from './setup-consent.js';

export function mountConsentEditor(container:HTMLElement,options:{getConfig():unknown;onChange(plan:ConsentDraftPlan):void;onStatus?(message:string):void}) {
 const doc=container.ownerDocument,view=doc.defaultView;if(!view||!options||typeof options.getConfig!=='function'||typeof options.onChange!=='function'||options.onStatus!==undefined&&typeof options.onStatus!=='function')throw Error('Use a document window and draft read/change callbacks.');
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const root=node('section');root.className='nb-setup-consent-editor';container.append(root);
 const title=node('h2','Cookie control settings'),intro=node('p','Choose the declared services controlled by consent, then review their purposes and separate memory periods. This edits a local draft; it does not activate tools.');
 const summary=node('p'),feedback=node('p'),open=node('button');feedback.className='nb-setup-consent-feedback';feedback.setAttribute('role','status');open.type='button';open.className='nb-choice-button';
 const panel=node('section');panel.className='nb-setup-consent-panel';panel.hidden=true;root.append(title,intro,summary,open,feedback,panel);
 let destroyed=false,sequence=0;
 panel.addEventListener('input',event=>event.stopPropagation());panel.addEventListener('change',event=>event.stopPropagation());panel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'&&event.target instanceof view.HTMLInputElement)event.preventDefault();});
 const instance='nb-consent-editor-'+crypto.randomUUID();panel.id=instance+'-panel';open.setAttribute('aria-controls',panel.id);open.setAttribute('aria-expanded','false');
 function collapse(){panel.hidden=true;panel.replaceChildren();open.hidden=false;open.setAttribute('aria-expanded','false');}
 function report(message:string){feedback.textContent=message;try{options.onStatus?.(message);}catch{/* A notification failure does not undo an adopted draft. */}}
 function render(){try{const config=toPublicConfig(options.getConfig(),{mode:'preview'});open.textContent=config.consent?'Edit control settings':'Configure cookie choices';summary.textContent=config.consent?config.consent.services.length+' declared service'+(config.consent.services.length===1?'':'s')+' in the current consent settings.':config.services.length?config.services.length+' declared service'+(config.services.length===1?'':'s')+' available. Choose which services the controls should manage.':'Add actual purposes and services to the inventory before configuring cookie controls.';}catch{open.textContent='Configure cookie choices';summary.textContent='Finish importing a valid config before editing controls.';}}
 type Draft={baseline:unknown;fields:EditorFields;selected:string[];purposes:[string,string][]};let draftRead:(()=>Draft)|undefined;
 function edit(resume?:Draft){
  if(destroyed)return;draftRead=undefined;
  const snapshot=toPublicConfig(resume?.baseline??options.getConfig(),{mode:'preview'}),previous=snapshot.consent;
  feedback.textContent='';panel.replaceChildren();panel.hidden=false;open.hidden=true;open.setAttribute('aria-expanded','true');
  const heading=node('h3',previous?'Edit cookie controls':'Configure cookie controls');heading.tabIndex=-1;panel.append(heading,node('p','Selecting a service includes all of its purposes. Review services that share a purpose or use several purposes. This does not decide a legal basis, relax scope restrictions or select a regional policy.'));
  const error=node('p');error.className='nb-setup-editor-error';error.setAttribute('role','alert');panel.append(error);
  const cancel=node('button','Cancel control changes');cancel.type='button';cancel.className='nb-choice-button';cancel.addEventListener('click',()=>{collapse();open.focus();});
  if(!snapshot.services.length){panel.append(node('p','Add the actual services and their processing purposes in the inventory first. No sample service will be added for you.'),cancel);heading.focus();return;}
  function field(parent:HTMLElement,label:string,value:string,help?:string){const id=instance+'-'+sequence++,input=node('input');input.id=id;input.type='text';input.value=value;input.maxLength=200;input.required=true;const wrapper=node('div');wrapper.className='nb-setup-field';const caption=node('label',label);caption.htmlFor=id;wrapper.append(caption,input);if(help){const hint=node('p',help);hint.id=id+'-hint';input.setAttribute('aria-describedby',hint.id);wrapper.append(hint);}parent.append(wrapper);return input;}
  const services=node('fieldset'),serviceGrid=node('div');serviceGrid.className='nb-setup-consent-service-grid';services.append(node('legend','Services to control'),serviceGrid);panel.append(services);
  const selected=new Map<string,HTMLInputElement>(),serviceScopes=new Map<string,HTMLInputElement>(),purposeValues=new Map(resume?.purposes??previous?.purposes.map(p=>[p.id,p.scope])??[]),purposeInputs=new Map<string,HTMLInputElement>();
  const purposeGroup=node('fieldset');purposeGroup.append(node('legend','Purposes included by your selection'));panel.append(purposeGroup);
  function refreshPurposes(){for(const [id,input] of purposeInputs)purposeValues.set(id,input.value);purposeInputs.clear();const grid=node('div');grid.className='nb-setup-consent-purpose-grid';purposeGroup.replaceChildren(node('legend','Purposes included by your selection'));const ids=new Set(snapshot.services.filter(s=>selected.get(s.id)?.checked).flatMap(s=>s.purposeIds));if(!ids.size)purposeGroup.append(node('p','Select a service to see every purpose that will be controlled.'));for(const purpose of snapshot.purposes.filter(p=>ids.has(p.id))){purposeInputs.set(purpose.id,field(grid,purpose.name+' — purpose version',purposeValues.get(purpose.id)??'','Use a new public version label when the actual purpose changes. Never reuse an earlier version.'));}purposeGroup.append(grid);}
  for(const service of snapshot.services){
   const card=node('div');card.className='nb-setup-consent-service';const check=node('input');check.type='checkbox';check.id=instance+'-service-'+service.id;check.checked=resume?resume.selected.includes(service.id):!!previous?.services.some(s=>s.id===service.id);selected.set(service.id,check);
   const label=node('label',service.name);label.htmlFor=check.id;label.prepend(check);card.append(label,node('p','Purposes: '+service.purposeIds.map(id=>snapshot.purposes.find(p=>p.id===id)?.name??id).join(', ')));
   const scope=field(card,service.name+' — service version',previous?.services.find(s=>s.id===service.id)?.scope??'','This public material version must change when the service use changes; changing its label is not a scope review.');scope.disabled=!check.checked;serviceScopes.set(service.id,scope);
   check.addEventListener('change',()=>{scope.disabled=!check.checked;refreshPurposes();});serviceGrid.append(card);
  }
  refreshPurposes();
  const memory=node('fieldset');memory.append(node('legend','Separate memory periods'),node('p','Enter each value deliberately after reviewing applicable requirements. Grant expiry, remembering a refusal, not asking again and retaining evidence are different decisions. No jurisdiction is inferred.'));panel.append(memory);
  if(previous?.promptPolicy||previous?.grantExpiryPolicy){
   const preserved=node('aside');preserved.className='nb-setup-consent-preserved';preserved.append(node('h4','Existing timing policies stay in place'));
   if(previous.promptPolicy)preserved.append(node('p','Repeat requests: '+previous.promptPolicy.profile+'. Review its processing revision after any material change; saving these settings does not renew or justify an exception.'));
   if(previous.grantExpiryPolicy)preserved.append(node('p','Grant expiry: '+previous.grantExpiryPolicy.profile+'. Its cap can shorten remembered grants and remains separate from refusal and dismissal memory.'));
   memory.append(preserved);
  }
  const numbers=new Map<keyof Pick<ConsentDraftSettings,'grantLifetimeDays'|'refusalLifetimeDays'|'dismissalMinutes'>,HTMLInputElement>();
  const memoryGrid=node('div');memoryGrid.className='nb-setup-consent-memory-grid';memory.append(memoryGrid);
  for(const [key,label,min,max,help] of [['grantLifetimeDays','Remember grants (days)',1,730,'How long an existing grant can remain usable. A configured regional cap can shorten it.'],['refusalLifetimeDays','Remember refusals (days)',1,730,'How long to remember a negative choice; this does not extend a grant.'],['dismissalMinutes','Pause after dismissal (minutes)',0,43200,'Closing without choosing grants nothing. This does not replace a regional repeat-request policy.']] as const){const input=field(memoryGrid,label,previous===undefined?'':String(previous[key]),help);input.type='number';input.min=String(min);input.max=String(max);input.step='1';numbers.set(key,input);}
  const actions=node('div');actions.className='nb-setup-consent-actions';const save=node('button','Save control settings');save.type='button';save.className='nb-choice-button nb-primary';actions.append(save,cancel);panel.append(actions);
  save.addEventListener('click',()=>{
   if(destroyed)return;error.textContent='';
   for(const input of [...serviceScopes.values(),...purposeInputs.values(),...numbers.values()]){input.removeAttribute('aria-invalid');if(!input.disabled&&!input.checkValidity()){input.setAttribute('aria-invalid','true');error.textContent='Complete the highlighted version or memory period. Blank values have no implicit default.';input.focus();return;}}
   try{
    const settings:ConsentDraftSettings={services:snapshot.services.filter(s=>selected.get(s.id)?.checked).map(s=>({id:s.id,scope:serviceScopes.get(s.id)!.value.trim()})),purposes:[...purposeInputs].map(([id,input])=>({id,scope:input.value.trim()})),grantLifetimeDays:Number(numbers.get('grantLifetimeDays')!.value),refusalLifetimeDays:Number(numbers.get('refusalLifetimeDays')!.value),dismissalMinutes:Number(numbers.get('dismissalMinutes')!.value)};
    let current:unknown;try{current=options.getConfig();}catch{error.textContent='Could not read the current draft. Check the host configuration before saving.';return;}
    const plan=createConsentDraftPlan(current,{baseline:snapshot,settings});try{options.onChange(plan);}catch{error.textContent='Could not confirm the host draft update. Check the current draft before trying again.';return;}collapse();render();open.focus();report(plan.blockedPurposeIds.length?'Control settings saved in the local draft. '+plan.blockedPurposeIds.length+' purpose'+(plan.blockedPurposeIds.length===1?' remains':'s remain')+' blocked by unknown or present scope declarations.':'Control settings saved in the local draft. Review the configuration and actual integration before publishing.');
   }catch(e){error.textContent=e instanceof Error?e.message:'Could not save control settings. Review the current draft.';}
  });draftRead=()=>{for(const [id,input] of purposeInputs)purposeValues.set(id,input.value);return {baseline:snapshot,fields:captureEditorFields(panel),selected:[...selected].filter(([,input])=>input.checked).map(([id])=>id),purposes:[...purposeValues]};};if(resume)restoreEditorFields(panel,resume.fields);heading.focus();
 }
 open.addEventListener('click',()=>{try{edit();}catch{report('Finish importing a valid config before editing controls.');}});render();
 return {getSessionDraft(){return !panel.hidden&&draftRead?draftRead():undefined;},restoreSessionDraft(draft:Draft){edit(draft);},open(){if(destroyed)throw Error('Editor has ended.');edit();},refresh({discardDraft=false}={}){if(destroyed)return;if(discardDraft)collapse();render();},destroy(){if(destroyed)return;destroyed=true;root.remove();}};
}
