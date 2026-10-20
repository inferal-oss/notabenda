// @requirements REQ-PRODUCT-SETUP-SESSION
import {captureEditorFields,restoreEditorFields} from './setup-session-fields.js';
import type {EditorFields,InventoryEditorDraft} from './setup-session-fields.js';
// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
import {supportsRightsPage} from './rights-localization-policy.js';
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {toPublicConfig} from './config.js';
import {createRightsDraftPlan} from './setup-rights.js';
import type {RightsDraftPlan,RightsDraftSettings} from './setup-rights.js';
import type {RightsActionKind,RightsCenterConfig} from './rights-policy.js';

/** Inline public-page authoring. The host synchronously adopts a detached local draft. */
export function mountRightsEditor(container:HTMLElement,options:{getConfig():unknown;onChange(plan:RightsDraftPlan):void;onStatus?(message:string):void}){
 const doc=container.ownerDocument,view=doc.defaultView;if(!view||!options||typeof options.getConfig!=='function'||typeof options.onChange!=='function'||options.onStatus!==undefined&&typeof options.onStatus!=='function')throw Error('Use a document window and draft read/change callbacks.');
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const root=node('section');root.className='nb-setup-rights-editor';container.append(root);
 const title=node('h2','Privacy request page'),intro=node('p','Add real request destinations, a public contact fallback and what happens next. These links do not submit or fulfill a request.'),summary=node('p'),feedback=node('p'),open=node('button');feedback.setAttribute('role','status');open.type='button';open.className='nb-choice-button';
 const panel=node('section');panel.className='nb-setup-rights-panel';panel.hidden=true;root.append(title,intro,summary,open,feedback,panel);
 const instance='nb-rights-editor-'+crypto.randomUUID();panel.id=instance+'-panel';open.setAttribute('aria-controls',panel.id);open.setAttribute('aria-expanded','false');let destroyed=false,sequence=0;
 panel.addEventListener('input',event=>event.stopPropagation());panel.addEventListener('change',event=>event.stopPropagation());panel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'&&event.target instanceof view.HTMLInputElement)event.preventDefault();});
 function collapse(){panel.hidden=true;panel.replaceChildren();open.hidden=false;open.setAttribute('aria-expanded','false');}
 function report(message:string){feedback.textContent=message;try{options.onStatus?.(message);}catch{/* Notification failure does not undo the host's adopted draft. */}}
 function render(){try{const c=toPublicConfig(options.getConfig(),{mode:'preview'});open.textContent=c.rightsCenter?'Edit request page':'Configure request page';summary.textContent=c.rightsCenter?c.rightsCenter.actions.length+' destination'+(c.rightsCenter.actions.length===1?'':'s')+' · '+c.rightsCenter.route+' · Revision '+c.rightsCenter.revision:'No request page is configured. Choose the actual routes and scope; no rights are selected for you.';if(!supportsRightsPage(c))summary.textContent+=' Supply complete localization.rights messages for this site locale before editing or rendering the page.';}catch{open.textContent='Configure request page';summary.textContent='Finish importing a valid config before editing the request page.';}}
 let draftRead:(()=>{baseline:unknown;fields:EditorFields;actions:(string|null)[];steps:number})|undefined;
 function edit(resume?:{baseline:unknown;fields:EditorFields;actions:(string|null)[];steps:number}){
  if(destroyed)return;draftRead=undefined;const snapshot=toPublicConfig(resume?.baseline??options.getConfig(),{mode:'preview'}),prior=snapshot.rightsCenter;
  feedback.textContent='';panel.replaceChildren();panel.hidden=false;open.hidden=true;open.setAttribute('aria-expanded','true');
  const heading=node('h3',prior?'Edit request page':'Configure request page');heading.tabIndex=-1;
  panel.append(heading,node('p','Every field below is public. Use stable destinations without request contents, account identifiers or tokens. Save a new revision for changed wording, contact or routes.'));
  const error=node('p');error.className='nb-setup-editor-error';error.setAttribute('role','alert');panel.append(error);
  const cancel=node('button','Cancel page changes');cancel.type='button';cancel.className='nb-choice-button';cancel.addEventListener('click',()=>{collapse();open.focus();});
  if(!supportsRightsPage(snapshot)){panel.append(node('p','The request page needs complete localization.rights messages for this site locale. Your imported declaration and locale are unchanged. Supply the page dictionary in your config; a collection dictionary cannot translate it.'),cancel);heading.focus();return;}
  const fields:(HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement)[]=[];
  function field(parent:HTMLElement,label:string,value:string,max=2000,multiline=false,help?:string){const id=instance+'-'+sequence++,input=multiline?node('textarea'):node('input');if(input instanceof view!.HTMLTextAreaElement)input.rows=3;else input.type='text';input.id=id;input.value=value;input.maxLength=max;input.required=true;fields.push(input);const wrapper=node('div');wrapper.className='nb-setup-field';const caption=node('label',label);caption.htmlFor=id;wrapper.append(caption,input);if(help){const hint=node('p',help);hint.id=id+'-hint';input.setAttribute('aria-describedby',hint.id);wrapper.append(hint);}parent.append(wrapper);return input;}
  function group(label:string){const section=node('fieldset');section.append(node('legend',label));panel.append(section);return section;}
  const page=group('Page and revision'),pageGrid=node('div');pageGrid.className='nb-setup-rights-grid';page.append(pageGrid);
  const route=field(pageGrid,'Request page route',prior?.route??'',200,false,'A new root-relative route, separate from your legal document routes.');route.placeholder='/privacy-requests';
  const revision=field(pageGrid,'New page revision',prior?.revision??'',200,false,'Use a new, never-reused revision for changed public content. Current revision is shown for reference.');
  const pageTitle=field(page,'Page title',prior?.title??'',300),introText=field(page,'Page introduction',prior?.intro??'',2000,true);
  const contact=group('Public contact fallback');contact.append(node('p','Use a plain email or international phone address that people can use without an account. This does not establish every applicable submission-method requirement.'));
  const contactGrid=node('div');contactGrid.className='nb-setup-rights-grid';contact.append(contactGrid);
  const contactLabel=field(contactGrid,'Contact link label',prior?.contact.label??'',160),contactHref=field(contactGrid,'Contact email or phone URI',prior?.contact.href??'',2048,false,'mailto:privacy@your-site.example or tel:+12025550123; no mailto query parameters.'),contactDescription=field(contact,'When to use this contact',prior?.contact.description??'',2000,true);
  const destinations=group('Request destinations');destinations.append(node('p','Add only the workflows you actually offer. Describe who and what each route covers. A kind classifies the link; it does not determine entitlement.'));
  const cards=node('div');cards.className='nb-setup-rights-destinations';destinations.append(cards);
  type ActionRow={baselineId:string|null;details:HTMLDetailsElement;read():RightsCenterConfig['actions'][number]};const rows:ActionRow[]=[];
  const add=node('button','Add destination');add.type='button';add.className='nb-choice-button';destinations.append(add);
  const kinds:[RightsActionKind,string][]=[['access','Access'],['correction','Correction'],['erasure','Erasure'],['portability','Portability'],['restriction','Restriction'],['objection','Objection'],['withdrawal','Consent withdrawal'],['appeal','Appeal'],['other','Other']];
  function addAction(value?:RightsCenterConfig['actions'][number]){
   if(rows.length>=16)return;const details=node('details'),caption=node('summary',value?.title??'New destination');details.className='nb-setup-rights-destination';details.open=!value;details.append(caption);cards.append(details);
   const grid=node('div');grid.className='nb-setup-rights-grid';details.append(grid);
   const id=field(grid,'Stable destination ID',value?.id??'',80,false,'Keep an existing ID when editing; changing it can break deep links.');if(value)id.readOnly=true;
   const kind=node('select');kind.id=instance+'-'+sequence++;kind.required=true;fields.push(kind);const empty=node('option','Choose the actual kind');empty.value='';kind.append(empty);for(const [key,label] of kinds){const option=node('option',label);option.value=key;kind.append(option);}kind.value=value?.kind??'';const kindField=node('div');kindField.className='nb-setup-field';const kindLabel=node('label','Request kind');kindLabel.htmlFor=kind.id;kindField.append(kindLabel,kind);grid.append(kindField);
   const name=field(details,'Destination title',value?.title??'',300),description=field(details,'Destination description',value?.description??'',2000,true),scope=field(details,'Who and what this route covers',value?.scope??'',2000,true),linkGrid=node('div');linkGrid.className='nb-setup-rights-grid';details.append(linkGrid);
   const label=field(linkGrid,'Destination link label',value?.link.label??'',160),href=field(linkGrid,'Destination URL',value?.link.href??'',2048,false,'Stable host route, HTTPS URL, plain email or international phone URI.');
   name.addEventListener('input',()=>{caption.textContent=name.value.trim()||'New destination';});
   const row:ActionRow={baselineId:value?.id??null,details,read:()=>({id:id.value.trim(),kind:kind.value as RightsActionKind,title:name.value.trim(),description:description.value.trim(),scope:scope.value.trim(),link:{label:label.value.trim(),href:href.value.trim()}})};
   const remove=node('button','Remove destination');remove.type='button';remove.className='nb-choice-button';remove.addEventListener('click',()=>{const index=rows.indexOf(row);if(index<0)return;rows.splice(index,1);details.remove();add.disabled=false;add.focus();});details.append(remove);rows.push(row);add.disabled=rows.length>=16;
  }
  if(resume){for(const id of resume.actions){const action=id===null?undefined:prior?.actions.find(a=>a.id===id);if(id!==null&&!action)throw Error('The saved destination is missing.');addAction(action);}}else{for(const action of prior?.actions??[])addAction(action);if(!rows.length)addAction();}add.addEventListener('click',()=>{addAction();rows.at(-1)?.details.querySelector<HTMLInputElement>('input')?.focus();});
  const next=group('What happens next'),stepRows:{root:HTMLElement;input:HTMLTextAreaElement}[]=[];next.append(node('p','Explain the actual next steps. This page sends no request and records no receipt.'));
  const stepList=node('div');next.append(stepList);const addStep=node('button','Add next step');addStep.type='button';addStep.className='nb-choice-button';next.append(addStep);
  function addNext(value=''){if(stepRows.length>=6)return;const wrapper=node('div');wrapper.className='nb-setup-rights-next-step';stepList.append(wrapper);const input=field(wrapper,'Next-step explanation',value,2000,true) as HTMLTextAreaElement;const row={root:wrapper,input};stepRows.push(row);const remove=node('button','Remove next step');remove.type='button';remove.className='nb-choice-button';remove.addEventListener('click',()=>{const index=stepRows.indexOf(row);if(index<0)return;stepRows.splice(index,1);wrapper.remove();addStep.disabled=false;addStep.focus();});wrapper.append(remove);addStep.disabled=stepRows.length>=6;}
  for(const step of resume?Array(resume.steps).fill(''):prior?.nextSteps??[''])addNext(step);addStep.addEventListener('click',()=>{addNext();stepRows.at(-1)?.input.focus();});
  const linkSection=group('Privacy link'),beforeAfter=node('p'),ackLabel=node('label'),ack=node('input');ack.type='checkbox';ack.dataset.sessionReview='';ack.required=true;ackLabel.className='nb-setup-rights-link-decision';ackLabel.append(ack,doc.createTextNode('Use this page for privacy links'));linkSection.append(beforeAfter,ackLabel,node('p','Saving replaces privacy.rightsUrl with this page route. Existing destinations are not copied into actions. Review redirects or aliases separately.'));
  const showLink=()=>{beforeAfter.textContent='Current: '+(snapshot.privacy.rightsUrl??'No link configured')+' → Proposed: '+(route.value.trim()||'Enter the page route');};route.addEventListener('input',showLink);showLink();
  const actions=node('div');actions.className='nb-setup-rights-actions';const save=node('button','Save page and privacy link');save.type='button';save.className='nb-choice-button nb-primary';actions.append(save,cancel);panel.append(actions);
  save.addEventListener('click',()=>{
   if(destroyed)return;error.textContent='';
   for(const input of fields.filter(input=>input.isConnected)){input.removeAttribute('aria-invalid');if(!input.checkValidity()){const details=input.closest('details');if(details)details.open=true;input.setAttribute('aria-invalid','true');error.textContent='Complete the highlighted public field. No destination or request kind is inferred.';input.focus();return;}}
   if(!ack.checked){error.textContent='Review the current and proposed privacy link, then select “Use this page for privacy links” to apply that change.';ack.focus();return;}
   try{
    const settings:RightsDraftSettings={schemaVersion:1,revision:revision.value.trim(),route:route.value.trim(),title:pageTitle.value.trim(),intro:introText.value.trim(),contact:{label:contactLabel.value.trim(),description:contactDescription.value.trim(),href:contactHref.value.trim()},actions:rows.map(row=>row.read()),nextSteps:stepRows.map(row=>row.input.value.trim())};
    let current:unknown;try{current=options.getConfig();}catch{error.textContent='Could not read the current site draft. Check the host configuration before saving.';return;}
    const plan=createRightsDraftPlan(current,{baseline:snapshot,settings,linkPrivacyToPage:true});
    try{options.onChange(plan);}catch{error.textContent='Could not confirm the host draft update. Check the current draft before trying again.';return;}
    collapse();render();open.focus();report('Request page and privacy link saved in the local draft. Prepare the draft to preview it; review the wording and verify the real workflows before publishing.');
   }catch(e){error.textContent=e instanceof Error?e.message:'Could not save the request page. Review the current draft.';}
  });draftRead=()=>({baseline:snapshot,fields:captureEditorFields(panel),actions:rows.map(r=>r.baselineId),steps:stepRows.length});if(resume){restoreEditorFields(panel,resume.fields);showLink();for(const row of rows)row.details.querySelector('summary')!.textContent=row.read().title||'New destination';}heading.focus();
 }
 open.addEventListener('click',()=>{try{edit();}catch{report('Finish importing a valid config before editing the request page.');}});render();
 return {getSessionDraft(){return !panel.hidden&&draftRead?draftRead():undefined;},restoreSessionDraft(draft:{baseline:unknown;fields:EditorFields;actions:(string|null)[];steps:number}){edit(draft);},open(){if(destroyed)throw Error('Editor has ended.');edit();},refresh({discardDraft=false}={}){if(destroyed)return;if(discardDraft)collapse();render();},destroy(){if(destroyed)return;destroyed=true;root.remove();}};
}
