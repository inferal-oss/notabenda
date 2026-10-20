// @requirements REQ-QC-PROFILING REQ-PRODUCT-STORAGE-AUTHORING REQ-PRODUCT-SAFE-CONTENT
// Ordinary public declaration validation, safe for browser and build-time use.
import {isSafeLink} from './safe-links.js';
export type TechnologyFunction='identification'|'location'|'profiling';
const functions:TechnologyFunction[]=['identification','location','profiling'];
const labels=['title','intro','functionsLabel','purposesLabel','providerLabel','defaultOff','activationLabel','privacyLinkLabel','draftLabel','contactLabel'] as const;
export interface TechnologyCollectionSettings {
 profile:'qc-private-technology-v1';scopeId:string;serviceId:string;revision:string;
 functions:readonly TechnologyFunction[];technologyDescription:string;activationInstructions:string;
 controlsLink:{label:string;href:string};reviewStatus:'draft'|'reviewed';direction:'ltr'|'rtl';
 wording:Record<typeof labels[number],string>;
 functionLabels:Record<TechnologyFunction,string>;
}
const fail=():never=>{throw Error('Invalid technology notice. Use explicit public declarations, a matching consent-managed service scope, and an intact reviewed release; preview must be explicit.');};
const text=(v:unknown,max=2000):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
// Bounded ordinary data only. Accessors/toJSON/class instances are never consulted.
function copy(input:unknown):any {
 let nodes=0,bytes=0;const active=new Set<object>();
 function visit(v:unknown,depth:number):any {
  if(++nodes>2000||depth>12||bytes>65536)return fail();
  if(typeof v==='string'){bytes+=new TextEncoder().encode(v).length;if(bytes>65536)return fail();return v;}
  if(typeof v==='number'&&Number.isFinite(v)||typeof v==='boolean'||v===null)return v;
  if(!v||typeof v!=='object'||active.has(v))return fail();active.add(v);
  let out:any;
  if(Array.isArray(v)){
   if(Object.getPrototypeOf(v)!==Array.prototype)return fail();
   const descriptors=Object.getOwnPropertyDescriptors(v as object),length=descriptors.length?.value;
   if(!Number.isInteger(length)||length<0||length>80||Reflect.ownKeys(descriptors).length!==length+1)return fail();
   out=[];for(let i=0;i<length;i++){const d=descriptors[String(i)];if(!d||!d.enumerable||!Object.hasOwn(d,'value'))return fail();out.push(visit(d.value,depth+1));}
  }else{
   const proto=Object.getPrototypeOf(v);if(proto!==Object.prototype&&proto!==null)return fail();out=Object.create(null);
   for(const key of Reflect.ownKeys(v)){if(typeof key!=='string'||key.length>200)return fail();const d=Object.getOwnPropertyDescriptor(v,key)!;if(!d.enumerable||!Object.hasOwn(d,'value'))return fail();bytes+=key.length;out[key]=visit(d.value,depth+1);}
  }
  active.delete(v);return out;
 }
 return visit(input,0);
}
const shape=(v:any,keys:readonly string[]):void=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))fail();};
export function normalizeTechnologyCollectionSettings(input:unknown):TechnologyCollectionSettings {
 const s=copy(input);shape(s,['profile','scopeId','serviceId','revision','functions','technologyDescription','activationInstructions','controlsLink','reviewStatus','direction','wording','functionLabels']);
 if(s.profile!=='qc-private-technology-v1'||!slug(s.scopeId)||!slug(s.serviceId)||!text(s.revision,200)||!Array.isArray(s.functions)||!s.functions.length||s.functions.length>3||new Set(s.functions).size!==s.functions.length||s.functions.some((f:unknown)=>!functions.includes(f as TechnologyFunction))||!text(s.technologyDescription)||!text(s.activationInstructions)||!['draft','reviewed'].includes(s.reviewStatus)||!['ltr','rtl'].includes(s.direction))return fail();
 shape(s.controlsLink,['label','href']);if(!text(s.controlsLink.label,160)||!text(s.controlsLink.href,1000)||!s.controlsLink.href.startsWith('/')||!isSafeLink(s.controlsLink.href))return fail();
 shape(s.wording,labels);if(labels.some(k=>!text(s.wording[k],k==='intro'||k==='defaultOff'?2000:300)))return fail();
 shape(s.functionLabels,functions);if(functions.some(k=>!text(s.functionLabels[k],160)))return fail();
 return s;
}

export function technologyCollectionScopePayload(input:TechnologyCollectionSettings):string {
 const s=normalizeTechnologyCollectionSettings(input);
 const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
 return canonical({profile:s.profile,serviceId:s.serviceId,revision:s.revision,functions:[...s.functions].sort(),technologyDescription:s.technologyDescription,activationInstructions:s.activationInstructions,controlsLink:s.controlsLink});
}
/** Browser-side scope derivation uses the platform digest, not Node build tooling. */
export async function technologyCollectionScope(input:TechnologyCollectionSettings):Promise<string> {
 const payload=technologyCollectionScopePayload(input),bytes=new TextEncoder().encode(payload);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return 'technology-v1:'+Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
