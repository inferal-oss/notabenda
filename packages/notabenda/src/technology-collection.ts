// @requirements REQ-QC-PROFILING REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-ARTIFACTS
// Optional build/server entry. No browser activation, network access or independent preference state.
import {canonicalJson,sha256} from './content.js';
import {normalizePublicLegalArtifact} from './release-files.js';
import {consentScopes} from './consent-notice.js';
import type {ConsentNoticeDocument} from './consent-notice.js';
import {scopeGuardContext,scopeGuardBlocked} from './scope-guard-policy.js';
import {isSafeLink} from './safe-links.js';
import {toPublicConfig} from './config.js';
import type {ValidationOptions} from './types.js';
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
export interface TechnologyCollectionNotice {
 schemaVersion:1;kind:'technology-collection-notice';noticeId:string;siteId:string;artifactId:string;
 mode:'preview'|'production';locale:string;declaration:TechnologyCollectionSettings;
 service:{id:string;name:string;provider:string;location:string};
 purposes:{id:string;name:string;description:string}[];controller:{name:string;email:string};
 binding:{serviceScope:string;purposeDigests:Record<string,string>};document:ConsentNoticeDocument;
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
function settings(input:unknown):TechnologyCollectionSettings {
 const s=copy(input);shape(s,['profile','scopeId','serviceId','revision','functions','technologyDescription','activationInstructions','controlsLink','reviewStatus','direction','wording','functionLabels']);
 if(s.profile!=='qc-private-technology-v1'||!slug(s.scopeId)||!slug(s.serviceId)||!text(s.revision,200)||!Array.isArray(s.functions)||!s.functions.length||s.functions.length>3||new Set(s.functions).size!==s.functions.length||s.functions.some((f:unknown)=>!functions.includes(f as TechnologyFunction))||!text(s.technologyDescription)||!text(s.activationInstructions)||!['draft','reviewed'].includes(s.reviewStatus)||!['ltr','rtl'].includes(s.direction))return fail();
 shape(s.controlsLink,['label','href']);if(!text(s.controlsLink.label,160)||!text(s.controlsLink.href,1000)||!s.controlsLink.href.startsWith('/')||!isSafeLink(s.controlsLink.href))return fail();
 shape(s.wording,labels);if(labels.some(k=>!text(s.wording[k],k==='intro'||k==='defaultOff'?2000:300)))return fail();
 shape(s.functionLabels,functions);if(functions.some(k=>!text(s.functionLabels[k],160)))return fail();
 return s;
}
/** Assign this to the selected consent.services[].scope BEFORE compiling the legal release. */
export function technologyCollectionScope(input:TechnologyCollectionSettings):string {
 const s=settings(input);
 return 'technology-v1:'+sha256(canonicalJson({profile:s.profile,serviceId:s.serviceId,revision:s.revision,functions:[...s.functions].sort(),technologyDescription:s.technologyDescription,activationInstructions:s.activationInstructions,controlsLink:s.controlsLink}));
}
/** A public disclosure, not proof of presentation, voluntary action, lawfulness or host enforcement. */
export function createTechnologyCollectionNotice(artifact:unknown,input:TechnologyCollectionSettings,options:ValidationOptions={}):TechnologyCollectionNotice {
 const s=settings(input),a=normalizePublicLegalArtifact(artifact,options),c=toPublicConfig(a.publicConfig,{mode:a.manifest.mode}),service=c.services.find(v=>v.id===s.serviceId),scope=c.consent?.services.find(v=>v.id===s.serviceId);
 if(!service||!scope||scope.scope!==technologyCollectionScope(s)||service.purposeIds.length>8||c.storage.some(v=>v.serviceId===service.id&&v.classification!=='optional'))return fail();
 const purposes=service.purposeIds.map(id=>{
  const p=c.purposes.find(v=>v.id===id);
  if(!p||p.collection.source==='indirect'||!c.consent?.purposes.some(v=>v.id===id)||!scopeGuardContext(c.scopeGuards,id)||scopeGuardBlocked(c.scopeGuards,id))return fail();
  return {id:p.id,name:p.name,description:p.description};
 });
 const d=a.manifest.documents.find(v=>v.kind==='privacy')!,scopes=consentScopes(c);
 const notice={schemaVersion:1 as const,kind:'technology-collection-notice' as const,noticeId:'0'.repeat(64),siteId:c.site.id,artifactId:a.manifest.artifactId,mode:a.manifest.mode,locale:c.site.locale,declaration:s,service:{id:service.id,name:service.name,provider:service.provider,location:service.location},purposes,controller:{name:c.controller.name,email:c.controller.email},binding:{serviceScope:scope.scope,purposeDigests:Object.fromEntries(purposes.map(p=>[p.id,sha256(scopes[p.id]!)]))},document:{title:d.title,version:d.version,effectiveDate:d.effectiveDate,sha256:d.sha256,contentSha256:d.contentSha256,reviewStatus:d.reviewStatus,url:`/artifacts/${a.manifest.artifactId}/privacy.html`}};
 const {noticeId:_,...descriptor}=notice;
 return normalizeTechnologyCollectionNotice({...notice,noticeId:sha256(canonicalJson(descriptor))},{allowPreview:options.mode==='preview'});
}
/** Validate bounded public data and its identity; a hash is not an authenticity or presentation claim. */
export function normalizeTechnologyCollectionNotice(input:unknown,options:{allowPreview?:boolean}={}):TechnologyCollectionNotice {
 const n=copy(input);shape(n,['schemaVersion','kind','noticeId','siteId','artifactId','mode','locale','declaration','service','purposes','controller','binding','document']);
 if(n.schemaVersion!==1||n.kind!=='technology-collection-notice'||!hash(n.noticeId)||!hash(n.artifactId)||!slug(n.siteId)||!['production','preview'].includes(n.mode)||!text(n.locale,100))return fail();
 try{Intl.getCanonicalLocales(n.locale);}catch{return fail();}
 n.declaration=settings(n.declaration);shape(n.service,['id','name','provider','location']);if(n.service.id!==n.declaration.serviceId||!['name','provider','location'].every(k=>text(n.service[k],4000)))return fail();
 shape(n.controller,['name','email']);if(!text(n.controller.name,4000)||!text(n.controller.email,300)||!isSafeLink('mailto:'+n.controller.email))return fail();
 if(!Array.isArray(n.purposes)||!n.purposes.length||n.purposes.length>8)return fail();const ids=new Set<string>();
 for(const p of n.purposes){shape(p,['id','name','description']);if(!slug(p.id)||ids.has(p.id)||!text(p.name,4000)||!text(p.description,4000))return fail();ids.add(p.id);}
 shape(n.binding,['serviceScope','purposeDigests']);shape(n.binding.purposeDigests,[...ids]);if(n.binding.serviceScope!==technologyCollectionScope(n.declaration)||Object.values(n.binding.purposeDigests).some(v=>!hash(v)))return fail();
 shape(n.document,['title','version','effectiveDate','sha256','contentSha256','reviewStatus','url']);const d=n.document;
 if(!text(d.title,4000)||!text(d.version,200)||typeof d.effectiveDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate)||!hash(d.sha256)||!hash(d.contentSha256)||!['draft','reviewed'].includes(d.reviewStatus)||d.url!==`/artifacts/${n.artifactId}/privacy.html`)return fail();
 const {noticeId,...descriptor}=n;if(sha256(canonicalJson(descriptor))!==noticeId)return fail();
 if(!options.allowPreview&&(n.mode!=='production'||n.declaration.reviewStatus!=='reviewed'||d.reviewStatus!=='reviewed'))return fail();return n;
}
/** Independently match a saved declaration to its full retained legal release. */
export function verifyTechnologyCollectionNotice(input:unknown,artifact:unknown,options:ValidationOptions={}):TechnologyCollectionNotice {
 const n=normalizeTechnologyCollectionNotice(input,{allowPreview:options.mode==='preview'}),expected=createTechnologyCollectionNotice(artifact,n.declaration,options);
 if(canonicalJson(n)!==canonicalJson(expected))return fail();return expected;
}
const escape=(v:string)=>v.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Static HTML: all technology/activation information stays visible without JavaScript. */
export function renderTechnologyCollectionNotice(input:unknown,options:{idPrefix:string;headingLevel?:2|3|4|5|6;allowPreview?:boolean}):string {
 const n=normalizeTechnologyCollectionNotice(input,{allowPreview:options?.allowPreview===true});if(!options||!slug(options.idPrefix)||options.headingLevel!==undefined&&![2,3,4,5,6].includes(options.headingLevel))return fail();
 const s=n.declaration,w=s.wording,e=escape,id=options.idPrefix,h='h'+(options.headingLevel??2),sub='h'+Math.min(6,(options.headingLevel??2)+1),draft=n.mode==='preview'||s.reviewStatus==='draft'||n.document.reviewStatus==='draft';
 return `<section class="nb-technology-notice" id="${id}" lang="${e(n.locale)}" dir="${s.direction}" aria-labelledby="${id}-title" data-technology-notice-id="${n.noticeId}"><${h} id="${id}-title">${e(w.title)}</${h}>${draft?`<p class="nb-draft" role="note">${e(w.draftLabel)}</p>`:''}<p>${e(w.intro)}</p><p class="nb-technology-description">${e(s.technologyDescription)}</p><dl><div><dt>${e(w.functionsLabel)}</dt><dd>${s.functions.map(f=>e(s.functionLabels[f])).join(' · ')}</dd></div><div><dt>${e(w.providerLabel)}</dt><dd>${e(n.service.name)} · ${e(n.service.provider)} · ${e(n.service.location)}</dd></div></dl><div class="nb-technology-purposes"><${sub}>${e(w.purposesLabel)}</${sub}>${n.purposes.map(p=>`<p><strong>${e(p.name)}</strong> — ${e(p.description)}</p>`).join('')}</div><p class="nb-technology-default">${e(w.defaultOff)}</p><div class="nb-technology-activation"><${sub}>${e(w.activationLabel)}</${sub}><p>${e(s.activationInstructions)}</p><a href="${e(s.controlsLink.href)}">${e(s.controlsLink.label)}</a></div><footer><p><a href="${n.document.url}">${e(w.privacyLinkLabel)}</a> · ${e(n.document.version)}</p><p>${e(w.contactLabel)}: ${e(n.controller.name)} · <a href="mailto:${e(n.controller.email)}">${e(n.controller.email)}</a></p></footer></section>`;
}
