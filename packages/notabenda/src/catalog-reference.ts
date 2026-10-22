// @requirements REQ-PRODUCT-SERVICE-PROFILES
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION */
import {assertPlainCatalogData as plain} from './catalog-plain.js';
import {isComposerPackageName,isComposerVendorPrefix} from './catalog-composer-policy.js';
import {isCargoPackageName,isCargoPackagePrefix} from './catalog-cargo-policy.js';
import {isNugetPackageName,isNugetPackagePrefix} from './catalog-nuget-policy.js';
import {isGoImportPath} from './catalog-go-policy.js';
export interface CatalogSource {id:string;url:string;revision:string;checkedOn:string|null;access:'read'|'reference-only';license:string;note:string;title?:string}
export interface CatalogProvider {id:string;revision:string;name:string;aliases:string[];website?:string;sourceIds:string[];review:'unreviewed'|'technical-reference'}
export interface CatalogIdentifier {id:string;ecosystem:'npm'|'python'|'terraform'|'docker'|'go'|'composer'|'cargo'|'nuget';match:'exact'|'prefix';value:string;explanation:string;sourceIds:string[]}
export interface CatalogStorageHint {sourceRowId:string;name:string;wildcard:boolean;description:string;reportedCategory:string;retentionHint:string;domainHint:string}
export interface CatalogProfileFact {id:string;title:string;description:string;sourceIds:string[]}
export interface CatalogProfileLink {id:string;kind:'privacy'|'dpa'|'documentation'|'subprocessors';label:string;url:string;sourceIds:string[]}
export interface CatalogProfilePrompt {id:string;prompt:string;sourceIds:string[];requirementIds:string[]}
export interface CatalogProductProfile {schemaVersion:1;facts:CatalogProfileFact[];links:CatalogProfileLink[];reviewPrompts:CatalogProfilePrompt[]}
export interface CatalogProduct {id:string;revision:string;providerId:string;name:string;aliases:string[];description:string;categories:string[];delivery:('browser'|'backend'|'infrastructure')[];sourceIds:string[];review:'unreviewed'|'technical-reference';identifiers:CatalogIdentifier[];storageHints:CatalogStorageHint[];profile?:CatalogProductProfile}
export interface ServiceCatalog {schemaVersion:1;kind:'notabenda-service-catalog';id:string;revision:string;sources:CatalogSource[];providers:CatalogProvider[];products:CatalogProduct[]}
function fail():never{throw new Error('Invalid version-1 service catalog. Supply bounded, source-linked provider and product data.');}
const need=(v:unknown)=>{if(!v)fail();};
const oneOf=(v:unknown,choices:readonly string[]):v is string=>typeof v==='string'&&choices.includes(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const text=(v:unknown,max=4000):v is string=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(v);
const nonempty=(v:unknown,max=4000)=>text(v,max)&&v.trim().length>0;
const https=(v:unknown)=>{try{const u=new URL(String(v));return text(v,2048)&&u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
function shape(v:unknown,keys:string[],optional:string[]=[]):asserts v is Record<string,unknown>{need(v&&typeof v==='object'&&!Array.isArray(v)&&keys.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>keys.includes(k)||optional.includes(k)));}
function list(v:unknown,max:number):asserts v is unknown[]{need(Array.isArray(v)&&v.length<=max);}
function strings(v:unknown,max=40){list(v,max);need(v.every(x=>nonempty(x,300))&&new Set(v).size===v.length);}
function unique(v:unknown[],ids=new Set<string>()){for(const item of v){if(!item||typeof item!=='object'||Array.isArray(item))fail();const id=(item as Record<string,unknown>).id;need(slug(id)&&!ids.has(id));ids.add(id as string);}return ids;}
/** Pure normalization. No browser, project-file, storage or network access. Unknown fields are rejected. */
export function normalizeServiceCatalog(input:unknown):ServiceCatalog {
 plain(input);const json=JSON.stringify(input);need(new TextEncoder().encode(json).length<=8*1024*1024);const c:unknown=JSON.parse(json);
 shape(c,['schemaVersion','kind','id','revision','sources','providers','products']);need(c.schemaVersion===1&&c.kind==='notabenda-service-catalog'&&slug(c.id)&&nonempty(c.revision,120));
 list(c.sources,1000);list(c.providers,5000);list(c.products,10000);const sourceItems=c.sources;const sources=unique(sourceItems),providers=unique(c.providers);unique(c.products);
 const refs=(v:unknown)=>{strings(v,40);need((v as string[]).length&&(v as string[]).every(id=>sources.has(id)));};
 for(const source of c.sources){shape(source,['id','url','revision','checkedOn','access','license','note'],['title']);need(source.title===undefined||nonempty(source.title,300));need(https(source.url)&&nonempty(source.revision,120)&&nonempty(source.license,100)&&text(source.note));need(oneOf(source.access,['read','reference-only'])&&(source.access==='read'?typeof source.checkedOn==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(source.checkedOn)&&Number.isFinite(Date.parse(source.checkedOn))&&new Date(source.checkedOn).toISOString().slice(0,10)===source.checkedOn:source.checkedOn===null));}
 for(const p of c.providers){shape(p,['id','revision','name','aliases','sourceIds','review'],['website']);need(nonempty(p.revision,120)&&nonempty(p.name,300)&&oneOf(p.review,['unreviewed','technical-reference'])&&(p.website===undefined||https(p.website)));strings(p.aliases);refs(p.sourceIds);}
 const ruleIds=new Set<string>();
 for(const p of c.products){shape(p,['id','revision','providerId','name','aliases','description','categories','delivery','sourceIds','review','identifiers','storageHints'],['profile']);need(typeof p.providerId==='string'&&providers.has(p.providerId)&&nonempty(p.revision,120)&&nonempty(p.name,300)&&nonempty(p.description)&&oneOf(p.review,['unreviewed','technical-reference']));strings(p.aliases);strings(p.categories);need((p.categories as string[]).every(slug));strings(p.delivery,3);need((p.delivery as string[]).length&&(p.delivery as string[]).every(v=>['browser','backend','infrastructure'].includes(v)));refs(p.sourceIds);
  if(p.profile!==undefined){
   const profile=p.profile;shape(profile,['schemaVersion','facts','links','reviewPrompts']);need(profile.schemaVersion===1&&new TextEncoder().encode(JSON.stringify(profile)).length<=16*1024);
   list(profile.facts,8);list(profile.links,6);list(profile.reviewPrompts,8);need(profile.facts.length>0);unique(profile.facts);unique(profile.links);unique(profile.reviewPrompts);
   const profileRefs=(value:unknown,read:boolean)=>{strings(value,8);need((!read||(value as string[]).length>0)&&(value as string[]).every(id=>(p.sourceIds as string[]).includes(id)&&sourceItems.some(raw=>{const source=raw as Record<string,unknown>;if(source.id!==id)return false;const url=new URL(source.url as string);return !url.search&&!url.hash&&(!read||source.access==='read');})));};
   for(const raw of profile.facts){shape(raw,['id','title','description','sourceIds']);need(nonempty(raw.title,120)&&nonempty(raw.description,700));profileRefs(raw.sourceIds,true);}
   let privacyLinks=0;
   for(const raw of profile.links){shape(raw,['id','kind','label','url','sourceIds']);need(oneOf(raw.kind,['privacy','dpa','documentation','subprocessors'])&&nonempty(raw.label,120)&&https(raw.url));const link=new URL(raw.url as string);need(!link.search&&!link.hash);profileRefs(raw.sourceIds,false);need((raw.sourceIds as string[]).some(id=>sourceItems.some(source=>(source as Record<string,unknown>).id===id&&(source as Record<string,unknown>).url===raw.url)));if(raw.kind==='privacy')privacyLinks++;}need(privacyLinks<=1);
   for(const raw of profile.reviewPrompts){shape(raw,['id','prompt','sourceIds','requirementIds']);need(nonempty(raw.prompt,500));profileRefs(raw.sourceIds,false);strings(raw.requirementIds,8);need((raw.requirementIds as string[]).every(id=>/^REQ-[A-Z0-9-]+$/u.test(id)));}
  }
  list(p.identifiers,100);unique(p.identifiers,ruleIds);
  for(const r of p.identifiers){shape(r,['id','ecosystem','match','value','explanation','sourceIds']);need(oneOf(r.ecosystem,['npm','python','terraform','docker','go','composer','cargo','nuget'])&&oneOf(r.match,['exact','prefix'])&&nonempty(r.value,200)&&(r.ecosystem==='go'||/^[a-zA-Z0-9@_./:+-]+$/u.test(String(r.value)))&&nonempty(r.explanation,1000));if(r.ecosystem==='go')need(typeof r.value==='string'&&(r.match==='prefix'?r.value.endsWith('/')&&isGoImportPath(r.value.slice(0,-1)):isGoImportPath(r.value)));if(r.ecosystem==='composer')need(r.match==='prefix'?isComposerVendorPrefix(r.value):isComposerPackageName(r.value));if(r.ecosystem==='nuget')need(r.match==='prefix'?isNugetPackagePrefix(r.value):isNugetPackageName(r.value));if(r.ecosystem==='cargo')need(r.match==='prefix'?isCargoPackagePrefix(r.value):isCargoPackageName(r.value));refs(r.sourceIds);}
  list(p.storageHints,5000);const rows=new Set<string>();
  for(const h of p.storageHints){shape(h,['sourceRowId','name','wildcard','description','reportedCategory','retentionHint','domainHint']);need(nonempty(h.sourceRowId,120)&&!rows.has(String(h.sourceRowId))&&nonempty(h.name,256)&&typeof h.wildcard==='boolean'&&['description','reportedCategory','retentionHint','domainHint'].every(k=>text(h[k])));rows.add(String(h.sourceRowId));}
 }
 return c as unknown as ServiceCatalog;
}
