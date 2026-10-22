// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import type {FormPermissionSettings} from './form-permission.js';
type Settings=Omit<FormPermissionSettings,'purposeId'>;
/** Only edits build settings. It creates no offer, permission controller or recording action. */
export function collectionPermissionEditor(host:HTMLElement,options:{idPrefix:string;onEdit():void;onReview():void}):{read():Settings;populate(settings?:Settings):void;setActive(active:boolean):void}{
 const doc=host.ownerDocument,node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const root=node('fieldset');root.className='nb-workbench-permission-editor';root.append(node('legend','Separate permission'),node('p','Write the choice in the release’s language. Keep it separate from sending the form. These settings do not select a legal basis or connect a recorder.'));
 const fields=new Map<string,HTMLInputElement|HTMLTextAreaElement>();
 function field(parent:HTMLElement,key:string,label:string,{long=false,max=2000,optional=false,slug=false,placeholder=''}={}){
  const wrap=node('div');wrap.className='nb-workbench-field';const input=long?node('textarea'):node('input');input.id=options.idPrefix+'-'+key.replaceAll('.','-');input.maxLength=max;input.required=!optional;
  if(input instanceof doc.defaultView!.HTMLTextAreaElement)input.rows=3;else input.type='text';if(slug)(input as HTMLInputElement).pattern='[a-z][a-z0-9-]{0,119}';input.placeholder=placeholder;
  const title=node('label',label);title.htmlFor=input.id;wrap.append(title,input);parent.append(wrap);fields.set(key,input);return input;
 }
 field(root,'wording.title','Permission heading',{max:300});field(root,'wording.statement','What the person is choosing',{long:true});
 field(root,'wording.optionality','What happens if they say no?',{long:true});field(root,'wording.withdrawalExplanation','How they can withdraw',{long:true});
 root.append(node('p','Use a single paragraph in each permission field. Line breaks are not supported by the offer format.'));
 field(root,'withdrawalUrl','Withdrawal page or help URL',{max:2048,placeholder:'/preferences'});
 const labels=node('div');labels.className='nb-workbench-permission-grid';field(labels,'wording.grantLabel','Save action label',{max:120});field(labels,'wording.withdrawLabel','Withdraw action label',{max:120});root.append(labels);
 const details=node('details');details.append(node('summary','Channel, identifiers and recording'));const ids=node('div');ids.className='nb-workbench-permission-grid';
 field(ids,'permissionId','Permission ID',{max:120,slug:true,placeholder:'product-updates-email'});field(ids,'revision','Wording revision',{max:200,placeholder:'updates-1'});field(ids,'channel.id','Channel ID',{max:120,slug:true,placeholder:'email'});field(ids,'channel.label','Channel label',{max:120,placeholder:'Email'});details.append(ids,node('p','The permission ID names a durable stream. Keep it stable for wording revisions; changing the purpose or channel may need a different stream. Use a new revision when meaning changes. This editor cannot check your full release history.'));
 const delivery=field(details,'deliveryWindowSeconds','Pending command delivery window (seconds)',{max:4,optional:true,placeholder:'600 (default)'});(delivery as HTMLInputElement).type='number';(delivery as HTMLInputElement).min='30';(delivery as HTMLInputElement).max='3600';(delivery as HTMLInputElement).step='1';details.append(node('p','Optional: 30–3600 whole seconds. This limits command delivery, not how long permission lasts. Blank keeps the builder default of 600.'));root.append(details);
 const refusalLabel=node('label'),refusal=node('input');refusal.type='checkbox';refusalLabel.append(refusal,doc.createTextNode('Offer an explicit refusal action'));root.append(refusalLabel);
 const refusalFields=node('div');refusalFields.className='nb-workbench-refusal';field(refusalFields,'refusal.label','Refusal action label',{max:120});field(refusalFields,'refusal.recorded','Confirmed refusal message',{long:true});field(refusalFields,'refusal.pending','Pending refusal message',{long:true});field(refusalFields,'refusal.retry','Retry refusal label',{max:120});root.append(refusalFields);
 const review=node('select');review.id=options.idPrefix+'-review';const reviewLabel=node('label','Permission wording review');reviewLabel.htmlFor=review.id;
 for(const [value,text] of [['draft','Draft — still needs review'],['reviewed','Wording reviewed']] as const){const o=node('option',text);o.value=value;review.append(o);}root.append(reviewLabel,review,node('p','Review the choice, action labels, refusal messages and withdrawal route together. This is your declaration; it does not review eligibility or downstream use.'));host.append(root);
 let active=false;
 function state(){root.hidden=!active;root.disabled=!active;refusalFields.hidden=!refusal.checked;for(const [key,input] of fields)input.disabled=!active||key.startsWith('refusal.')&&!refusal.checked;}
 for(const input of fields.values())input.addEventListener('input',()=>{review.value='draft';options.onEdit();});
 refusal.addEventListener('change',()=>{state();review.value='draft';options.onEdit();});review.addEventListener('change',options.onReview);
 return {setActive(value){active=value;state();},populate(settings){for(const [key,input] of fields){const [group,part]=key.split('.');const value=part?(settings?.[group as 'wording'|'channel'|'refusal'] as unknown as Record<string,unknown>|undefined)?.[part]:settings?.[key as keyof Settings];input.value=value===undefined?'':String(value);input.removeAttribute('aria-invalid');}refusal.checked=settings?.refusal!==undefined;review.value=settings?.reviewStatus??'draft';state();},read(){
   for(const input of fields.values()){input.removeAttribute('aria-invalid');if(input.disabled)continue;if(!input.checkValidity()){input.setAttribute('aria-invalid','true');const folded=input.closest('details');if(folded)folded.open=true;input.focus();throw Error('Complete the highlighted permission field before continuing.');}}
   const value=(k:string)=>fields.get(k)!.value,wording=Object.fromEntries(['title','statement','grantLabel','withdrawLabel','optionality','withdrawalExplanation'].map(k=>[k,value('wording.'+k)])) as Settings['wording'];
   return {permissionId:value('permissionId'),channel:{id:value('channel.id'),label:value('channel.label')},revision:value('revision'),reviewStatus:review.value as Settings['reviewStatus'],wording,withdrawalUrl:value('withdrawalUrl'),...(value('deliveryWindowSeconds')?{deliveryWindowSeconds:Number(value('deliveryWindowSeconds'))}:{}),...(refusal.checked?{refusal:{label:value('refusal.label'),recorded:value('refusal.recorded'),pending:value('refusal.pending'),retry:value('refusal.retry')}}:{})};
  }};
}
