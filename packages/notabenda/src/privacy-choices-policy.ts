// @requirements REQ-US-CA-ALTERNATIVE-LINK REQ-PRODUCT-PRIVACY-CHOICE-LINK REQ-PRODUCT-SAFE-CONTENT
import {isSafeLink} from './safe-links.js';
export interface PrivacyChoicesLink {schemaVersion:1;revision:string;href:string;label:string;presentation:'text'|'california-alternative-2026';reviewStatus:'draft'|'reviewed'}
const invalid=():never=>{throw Error('Supply a reviewed public privacy-choice destination, revision, label and supported link presentation. California presentation needs one of its two specified titles; destination coverage remains host work.');};
/** Navigation only. A configured link is not evidence that the destination or processing is compliant. */
export function normalizePrivacyChoicesLink(input:unknown,options:{allowPreview?:boolean}={}):PrivacyChoicesLink {
 if(!input||typeof input!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(input)))return invalid();
 const keys=['schemaVersion','revision','href','label','presentation','reviewStatus'],fields=Object.getOwnPropertyDescriptors(input);
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(key=>!fields[key]||!Object.hasOwn(fields[key]!,'value')))return invalid();
 const v=Object.fromEntries(keys.map(key=>[key,fields[key]!.value]));
 const text=(value:unknown,max:number):value is string=>typeof value==='string'&&!!value.trim()&&new TextEncoder().encode(value).length<=max&&!/[<>\u0000-\u001f\u007f]/u.test(value);
 if(options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean'||v.schemaVersion!==1||!text(v.revision,120)||!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u.test(v.revision)||!text(v.href,2048)||!isSafeLink(v.href)||!v.href.startsWith('/')&&!/^https:/iu.test(v.href)||!text(v.label,160)||(v.presentation!=='text'&&v.presentation!=='california-alternative-2026')||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!options.allowPreview&&v.reviewStatus!=='reviewed')return invalid();
 if(v.presentation==='california-alternative-2026'&&!['Your Privacy Choices','Your California Privacy Choices'].includes(v.label))return invalid();
 return v as unknown as PrivacyChoicesLink;
}
