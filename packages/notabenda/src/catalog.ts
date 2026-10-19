/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION */
import type {Service} from './types.js';
import {normalizeServiceCatalog} from './catalog-reference.js';
import type {ServiceCatalog,CatalogProduct,CatalogProvider,CatalogSource} from './catalog-reference.js';
export {normalizeServiceCatalog} from './catalog-reference.js';
export type {ServiceCatalog,CatalogProduct,CatalogProvider,CatalogSource,CatalogIdentifier,CatalogStorageHint} from './catalog-reference.js';
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const text=(v:unknown,max=4000):v is string=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(v);
const nonempty=(v:unknown,max=4000)=>text(v,max)&&v.trim().length>0;
const https=(v:unknown)=>{try{const u=new URL(String(v));return text(v,2048)&&u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
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
