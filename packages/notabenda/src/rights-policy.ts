// @requirements REQ-EU-NOTICE REQ-US-CA-CHOICES REQ-US-VA-RIGHTS
// @requirements REQ-PRODUCT-RIGHTS-CENTER REQ-PRODUCT-SAFE-CONTENT
import {isSafeLink} from './config.js';
export type RightsActionKind='access'|'correction'|'erasure'|'portability'|'restriction'|'objection'|'withdrawal'|'appeal'|'other';
export interface RightsCenterConfig {
  schemaVersion:1;revision:string;route:string;title:string;intro:string;reviewStatus:'draft'|'reviewed';
  /** Public fallback. Do not put identifiers, tokens or request contents in URLs. */
  contact:{label:string;description:string;href:string};
  actions:{id:string;kind:RightsActionKind;title:string;description:string;scope:string;link:{label:string;href:string}}[];
  nextSteps:string[];
}
const own=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,required:string[])=>required.every(key=>Object.hasOwn(value,key))&&Object.keys(value).every(key=>required.includes(key));
const text=(value:unknown,max=2000):value is string=>typeof value==='string'&&!!value.trim()&&new TextEncoder().encode(value).length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
const phone=(value:unknown):value is string=>typeof value==='string'&&/^tel:\+[1-9][0-9]{6,14}$/u.test(value);
const link=(value:unknown):value is string=>text(value,2048)&&(isSafeLink(value)||phone(value));
const invalid=():never=>{throw new Error('Use a bounded rights-center declaration, explicit public contact and unique actions with safe destinations. Keep request data and private justifications out of public configuration.');};
/** Validates navigation and public wording, never entitlement, identity or request fulfillment. */
export function normalizeRightsCenter(input:unknown):RightsCenterConfig {
  if(!own(input)||!exact(input,['schemaVersion','revision','route','title','intro','reviewStatus','contact','actions','nextSteps'])||input.schemaVersion!==1||!text(input.revision,200)||!text(input.route,200)||!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/u.test(input.route)||!text(input.title,300)||!text(input.intro)||typeof input.reviewStatus!=='string'||!['draft','reviewed'].includes(input.reviewStatus))return invalid();
  const contact=input.contact;
  if(!own(contact)||!exact(contact,['label','description','href'])||!text(contact.label,160)||!text(contact.description)||!link(contact.href))return invalid();
  // The fallback is publicly reachable contact, never another account-login route.
  if(!contact.href.startsWith('mailto:')&&!phone(contact.href))return invalid();
  if(!Array.isArray(input.actions)||input.actions.length<1||input.actions.length>16)return invalid();
  const seen=new Set<string>(),actions:RightsCenterConfig['actions']=[];
  for(const item of input.actions){
    if(!own(item)||!exact(item,['id','kind','title','description','scope','link'])||typeof item.id!=='string'||!/^[a-z][a-z0-9-]{0,79}$/u.test(item.id)||seen.has(item.id)||typeof item.kind!=='string'||!['access','correction','erasure','portability','restriction','objection','withdrawal','appeal','other'].includes(item.kind)||!text(item.title,300)||!text(item.description)||!text(item.scope)||!own(item.link)||!exact(item.link,['label','href'])||!text(item.link.label,160)||!link(item.link.href))return invalid();
    seen.add(item.id);actions.push({id:item.id,kind:item.kind as RightsActionKind,title:item.title,description:item.description,scope:item.scope,link:{label:item.link.label,href:item.link.href}});
  }
  if(!Array.isArray(input.nextSteps)||!input.nextSteps.length||input.nextSteps.length>6||input.nextSteps.some(value=>!text(value)))return invalid();
  const normalized:RightsCenterConfig={schemaVersion:1,revision:input.revision,route:input.route,title:input.title,intro:input.intro,reviewStatus:input.reviewStatus as RightsCenterConfig['reviewStatus'],contact:{label:contact.label,description:contact.description,href:contact.href},actions,nextSteps:[...input.nextSteps] as string[]};
  if(new TextEncoder().encode(JSON.stringify(normalized)).length>65536)return invalid();return normalized;
}
