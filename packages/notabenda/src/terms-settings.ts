// @requirements REQ-PRODUCT-TERMS-AUTHORING REQ-PRODUCT-TERMS-ACCEPTANCE
export interface TermsAgreementSetting {scopeId:string;revision:string;statement:string;actionLabel:string;reviewStatus:'draft'|'reviewed'}
const invalid=():never=>{throw Error('Supply 1–16 complete terms agreements with unique workflow scope IDs, revisions, statement, action label and review status. Production requires reviewed wording.');};
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
/** Validate the complete declaration before choosing a scope. Undefined preserves legacy releases. */
export function normalizeTermsAgreementSettings(input:unknown,options:{allowPreview?:boolean}={}):TermsAgreementSetting[]{
 if(input===undefined)return [];
 if(!Array.isArray(input)||Object.getPrototypeOf(input)!==Array.prototype||!input.length||input.length>16||Reflect.ownKeys(input).length!==input.length+1)return invalid();
 const entries=[];for(let index=0;index<input.length;index++){const entry=Object.getOwnPropertyDescriptor(input,String(index));if(!entry||!('value' in entry)||!entry.enumerable)return invalid();entries.push(entry.value);}
 const ids=new Set<string>();const result=entries.map(value=>{
  const fields=['scopeId','revision','statement','actionLabel','reviewStatus'];
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==fields.length||fields.some(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return !d||!('value' in d)||!d.enumerable;})||!text(value.scopeId,120)||!(/^[a-z][a-z0-9-]*$/u.test(value.scopeId))||ids.has(value.scopeId)||!text(value.revision,120)||!text(value.statement,2000)||!text(value.actionLabel,120)||!['draft','reviewed'].includes(value.reviewStatus))return invalid();
  if(!options.allowPreview&&(value.reviewStatus!=='reviewed'||[value.revision,value.statement,value.actionLabel].some(v=>/\{\{[^{}]+\}\}/u.test(v))))return invalid();
  ids.add(value.scopeId);return {scopeId:value.scopeId,revision:value.revision,statement:value.statement,actionLabel:value.actionLabel,reviewStatus:value.reviewStatus};
 });
 if(new TextEncoder().encode(JSON.stringify(result)).length>40*1024)return invalid();return result;
}
/** Configured scopes pin their exact copy; unconfigured host-authored scopes remain supported. */
export function assertConfiguredTermsCopy(settings:unknown,wording:{scopeId:string;statement:string;actionLabel:string},options:{allowPreview?:boolean}={}):void{
 const selected=normalizeTermsAgreementSettings(settings,options).find(entry=>entry.scopeId===wording.scopeId);
 if(selected&&(selected.statement!==wording.statement||selected.actionLabel!==wording.actionLabel))throw Error('This terms scope has configured wording. Use that exact statement and action label, or revise and review the declaration.');
}
