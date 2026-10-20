// @requirements REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
import {isSafeLink} from './safe-links.js';
export interface ConsentInformationLink {label:string;url:string}
/** Public host-supplied copy; no HTML, provider fetching or applicability inference. */
export interface ConsentInformation {
 rights?:ConsentInformationLink;
 browserControls?:{title:string;description:string;links:ConsentInformationLink[]};
}
/** Shared with the standalone backend. Normalize to a stable, bounded public shape. */
export function normalizeConsentInformation(input:unknown):ConsentInformation {
 const fail=():never=>{throw Error('Invalid consent information. Supply bounded plain text and safe links.');};
 const object=(v:unknown,keys:string[]):Record<string,unknown>=>{
  if(!v||typeof v!=='object'||Array.isArray(v))return fail();
  const descriptors=Object.getOwnPropertyDescriptors(v),out:Record<string,unknown>=Object.create(null);
  if(keys.some(k=>k in v&&!Object.hasOwn(descriptors,k)))return fail();
  for(const key of Reflect.ownKeys(descriptors)){
   if(typeof key!=='string'||!keys.includes(key))return fail();
   const d=descriptors[key]!;if(!Object.hasOwn(d,'value')||!d.enumerable)return fail();out[key]=d.value;
  }
  return out;
 };
 const text=(v:unknown,max:number):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
 const link=(v:unknown):ConsentInformationLink=>{
  const {label,url}=object(v,['label','url']);
  if(!text(label,120)||!text(url,1000)||!isSafeLink(url))return fail();
  return {label,url};
 };
 const source=object(input,['rights','browserControls']);
 if(source.rights===undefined&&source.browserControls===undefined)return fail();
 const out:ConsentInformation={};
 if(source.rights!==undefined)out.rights=link(source.rights);
 if(source.browserControls!==undefined){
  const {title,description,links}=object(source.browserControls,['title','description','links']);
  if(!text(title,120)||!text(description,2000)||!Array.isArray(links))return fail();
  const descriptors=Object.getOwnPropertyDescriptors(links as object),items:ConsentInformationLink[]=[];
  const length=descriptors.length?.value;
  if(!Number.isInteger(length)||length<0||length>4||Reflect.ownKeys(descriptors).length!==length+1)return fail();
  for(let i=0;i<length;i++){const d=descriptors[String(i)];if(!d||!Object.hasOwn(d,'value')||!d.enumerable)return fail();items.push(link(d.value));}
  out.browserControls={title,description,links:items};
 }
 if(new TextEncoder().encode(JSON.stringify(out)).length>4096)return fail();
 return out;
}
