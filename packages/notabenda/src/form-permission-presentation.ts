// @requirements REQ-PRODUCT-MARKETING-AUTHORING REQ-PRODUCT-FORM-PERMISSIONS REQ-ZA-MARKETING
import {formatMessage} from './localization-policy.js';
import type {FormPermissionContent} from './form-permission.js';
import type {FormPermissionMessages} from './form-permission-localization-policy.js';
/** Shared native presentation. Inert previews create no controller, status, offer identity or active destination. */
export function createFormPermissionPresentation(doc:Document,offer:FormPermissionContent,options:{headingLevel?:2|3|4|5|6;disclosureKey:string;inert?:boolean;grantSupported?:boolean}){
 const l=offer.localization,m=l?.formPermission,t=(key:keyof FormPermissionMessages,fallback:string,values:Record<string,string>={})=>m?formatMessage(m[key],values):formatMessage(fallback,values);
 const el=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const element=doc.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
 const root=el('section');root.className='nb-form-permission';root.setAttribute('aria-label',offer.wording.title);if(l){root.lang=l.locale;root.dir=l.direction;}
  const heading=el(('h'+(options.headingLevel??2)) as 'h2'|'h3'|'h4'|'h5'|'h6',offer.wording.title),identity=el('p',offer.facts.controller.name+' · '+offer.channel.label),label=el('label'),checkbox=el('input');
  identity.className='nb-form-permission-identity';checkbox.type='checkbox';label.className='nb-form-permission-choice';label.append(checkbox,el('span',offer.wording.statement));
  const assertion=el('p',offer.wording.statement);assertion.className='nb-form-permission-saved-statement';assertion.hidden=true;
  const optionality=el('p',offer.wording.optionality),policy=el('a',t('policy','Read the privacy policy · {version}',{version:offer.document.version}));policy.href=offer.document.url;
  const withdrawal=el('p',offer.wording.withdrawalExplanation),fallback=el('a',t('withdrawalHelp','Withdrawal help'));fallback.href=offer.withdrawalUrl;
  const actions=el('div');actions.className='nb-form-permission-actions';
  const button=(title:string,primary=false)=>{const b=el('button',title);b.type='button';b.className='nb-choice-button'+(primary?' nb-primary':'');return b;};
  const refuse=offer.refusal?button(offer.refusal.label):undefined;
  const load=button(t('checkSaved','Check saved permission')),grant=button(offer.wording.grantLabel,true),withdraw=button(offer.wording.withdrawLabel),retry=button(t('retryPermission','Retry saved request'),true);
  load.className='nb-text-button nb-form-permission-refresh';retry.hidden=true;actions.append(grant);if(refuse)actions.append(refuse);actions.append(withdraw,retry);
  const message=el('p');message.setAttribute('role','status');message.setAttribute('aria-atomic','true');message.className='nb-control-status';
  const details=el('details');details.className='nb-form-permission-details';details.append(el('summary',t('detailsSummary','How we use this information')),el('p',offer.facts.purpose.description),el('p',t('information','Information: {information}',{information:offer.facts.purpose.dataCategories.join(', ')})),el('p',t('retention','Retention: {retention}',{retention:offer.facts.purpose.retention})));
  if(offer.facts.recipients.length)details.append(el('p',t('providers','Providers: {providers}',{providers:offer.facts.recipients.map(r=>r.name+' ('+r.provider+')').join(', ')})));
  root.append(heading,identity,optionality);
  if(offer.marketingRequest){
    const request=offer.marketingRequest,disclosure=el('dl');disclosure.className='nb-marketing-request';
    const base='nb-marketing-request-'+options.disclosureKey;let id=base,suffix=1;while(doc.getElementById(id))id=base+'-'+suffix++;disclosure.id=id;
    const pair=(title:string,value:HTMLElement)=>{const group=el('div');group.append(el('dt',title),value);return group;};
    const goods=el('dd',request.goodsServices),method=el('dd',offer.channel.label),party=el('dd'),email=el('a',offer.facts.controller.email);email.href='mailto:'+offer.facts.controller.email;
    party.append(el('strong',offer.facts.controller.name),el('span',offer.facts.controller.address),email);
    disclosure.append(pair(request.labels.goodsServices,goods),pair(request.labels.method,method),pair(request.labels.responsibleParty,party));root.append(disclosure);checkbox.setAttribute('aria-describedby',id);
  }
  root.append(label,assertion,details,policy,withdrawal,fallback,message,actions,load);
  if(offer.mode==='preview'||offer.reviewStatus==='draft'||l?.reviewStatus==='draft'){const note=el('p',t('draft','Preview · Draft permission'));note.className='nb-draft';root.prepend(note);}

 if(options.inert){
  for(const a of root.querySelectorAll('a')){const span=el('span',a.textContent??'');span.className='nb-marketing-preview-link';span.setAttribute('aria-disabled','true');a.replaceWith(span);}
  for(const input of root.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button'))input.disabled=true;
  message.remove();retry.remove();load.remove();if(refuse)withdraw.hidden=true;if(options.grantSupported===false){label.hidden=true;assertion.hidden=false;grant.hidden=true;}
 }
 return {root,label,checkbox,assertion,grant,refuse,withdraw,retry,load,message};
}
