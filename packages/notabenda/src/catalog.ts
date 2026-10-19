import {assertPlainCatalogData as plain} from './catalog-plain.js';
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION */
import type {Service} from './types.js';
export interface CatalogSource {id:string;url:string;revision:string;checkedOn:string|null;access:'read'|'reference-only';license:string;note:string}
export interface CatalogProvider {id:string;revision:string;name:string;aliases:string[];website?:string;sourceIds:string[];review:'unreviewed'|'technical-reference'}
export interface CatalogIdentifier {id:string;ecosystem:'npm'|'python'|'terraform'|'docker';match:'exact'|'prefix';value:string;explanation:string;sourceIds:string[]}
export interface CatalogStorageHint {sourceRowId:string;name:string;wildcard:boolean;description:string;reportedCategory:string;retentionHint:string;domainHint:string}
export interface CatalogProduct {id:string;revision:string;providerId:string;name:string;aliases:string[];description:string;categories:string[];delivery:('browser'|'backend'|'infrastructure')[];sourceIds:string[];review:'unreviewed'|'technical-reference';identifiers:CatalogIdentifier[];storageHints:CatalogStorageHint[]}
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
 list(c.sources,1000);list(c.providers,5000);list(c.products,10000);const sources=unique(c.sources),providers=unique(c.providers);unique(c.products);
 const refs=(v:unknown)=>{strings(v,40);need((v as string[]).length&&(v as string[]).every(id=>sources.has(id)));};
 for(const source of c.sources){shape(source,['id','url','revision','checkedOn','access','license','note']);need(https(source.url)&&nonempty(source.revision,120)&&nonempty(source.license,100)&&text(source.note));need(oneOf(source.access,['read','reference-only'])&&(source.access==='read'?typeof source.checkedOn==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(source.checkedOn)&&Number.isFinite(Date.parse(source.checkedOn))&&new Date(source.checkedOn).toISOString().slice(0,10)===source.checkedOn:source.checkedOn===null));}
 for(const p of c.providers){shape(p,['id','revision','name','aliases','sourceIds','review'],['website']);need(nonempty(p.revision,120)&&nonempty(p.name,300)&&oneOf(p.review,['unreviewed','technical-reference'])&&(p.website===undefined||https(p.website)));strings(p.aliases);refs(p.sourceIds);}
 const ruleIds=new Set<string>();
 for(const p of c.products){shape(p,['id','revision','providerId','name','aliases','description','categories','delivery','sourceIds','review','identifiers','storageHints']);need(typeof p.providerId==='string'&&providers.has(p.providerId)&&nonempty(p.revision,120)&&nonempty(p.name,300)&&nonempty(p.description)&&oneOf(p.review,['unreviewed','technical-reference']));strings(p.aliases);strings(p.categories);need((p.categories as string[]).every(slug));strings(p.delivery,3);need((p.delivery as string[]).length&&(p.delivery as string[]).every(v=>['browser','backend','infrastructure'].includes(v)));refs(p.sourceIds);
  list(p.identifiers,100);unique(p.identifiers,ruleIds);
  for(const r of p.identifiers){shape(r,['id','ecosystem','match','value','explanation','sourceIds']);need(oneOf(r.ecosystem,['npm','python','terraform','docker'])&&oneOf(r.match,['exact','prefix'])&&nonempty(r.value,200)&&/^[a-zA-Z0-9@_./:+-]+$/u.test(String(r.value))&&nonempty(r.explanation,1000));refs(r.sourceIds);}
  list(p.storageHints,5000);const rows=new Set<string>();
  for(const h of p.storageHints){shape(h,['sourceRowId','name','wildcard','description','reportedCategory','retentionHint','domainHint']);need(nonempty(h.sourceRowId,120)&&!rows.has(String(h.sourceRowId))&&nonempty(h.name,256)&&typeof h.wildcard==='boolean'&&['description','reportedCategory','retentionHint','domainHint'].every(k=>text(h[k])));rows.add(String(h.sourceRowId));}
 }
 return c as unknown as ServiceCatalog;
}
export interface CatalogSearchResult {product:CatalogProduct;provider:CatalogProvider}
export function searchServiceCatalog(input:unknown,query:string,options:{delivery?:'browser'|'backend'|'infrastructure';limit?:number}={}):CatalogSearchResult[]{
 const c=normalizeServiceCatalog(input),limit=options.limit??20;
 if(!text(query,120)||!Number.isInteger(limit)||limit<1||limit>100||options.delivery!==undefined&&!['browser','backend','infrastructure'].includes(options.delivery))throw Error('Supply a short search, valid delivery filter and limit 1–100.');
 const terms=query.trim().toLocaleLowerCase('en').split(/\s+/u).filter(Boolean),providers=new Map(c.providers.map(p=>[p.id,p]));
 return c.products.filter(p=>!options.delivery||p.delivery.includes(options.delivery)).map(product=>({product,provider:providers.get(product.providerId)!})).filter(({product:p,provider:v})=>terms.every(t=>[p.name,v.name,...p.aliases,...v.aliases,...p.categories].join(' ').toLocaleLowerCase('en').includes(t))).sort((a,b)=>a.product.name.localeCompare(b.product.name,'en')||a.product.id.localeCompare(b.product.id,'en')).slice(0,limit);
}
/** Build an explicit proposal; no configuration mutation, storage defaults, consent grant or publication. */
export function createCatalogServiceDraft(input:unknown,productId:string,siteUse:{id:string;purposeIds:string[];location:string;provider?:string;privacyUrl?:string}):{reviewRequired:true;service:Service;catalogSelection:{catalogId:string;catalogRevision:string;product:CatalogProduct;provider:CatalogProvider;sources:CatalogSource[]}}{
 const c=normalizeServiceCatalog(input),product=c.products.find(p=>p.id===productId);if(!product)throw Error('Unknown catalog product.');
 if(!slug(siteUse.id)||!Array.isArray(siteUse.purposeIds)||!siteUse.purposeIds.length||new Set(siteUse.purposeIds).size!==siteUse.purposeIds.length||!siteUse.purposeIds.every(slug)||!nonempty(siteUse.location)||siteUse.provider!==undefined&&!nonempty(siteUse.provider,300)||siteUse.privacyUrl!==undefined&&!https(siteUse.privacyUrl))throw Error('Supply explicit local service ID, purposes, location and valid site-use overrides.');
 const provider=c.providers.find(p=>p.id===product.providerId)!,ids=new Set([...product.sourceIds,...provider.sourceIds]);
 return {reviewRequired:true,service:{id:siteUse.id,name:product.name,provider:siteUse.provider??provider.name,purposeIds:[...siteUse.purposeIds],location:siteUse.location,...(siteUse.privacyUrl===undefined?{}:{privacyUrl:siteUse.privacyUrl})},catalogSelection:{catalogId:c.id,catalogRevision:c.revision,product,provider,sources:c.sources.filter(s=>ids.has(s.id))}};
}
