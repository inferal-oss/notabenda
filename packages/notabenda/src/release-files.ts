import {normalizeCatalogReviewDescriptor} from './catalog-release-policy.js';
import {documentKinds,isSafeLink,toPublicConfig} from './config.js';
import {canonicalJson,sha256} from './content.js';
import type {ValidationOptions} from './types.js';

type Json = null|boolean|number|string|Json[]|{[key:string]:Json};
type ObjectValue = {[key:string]:Json};
const MAX_ARTIFACT_BYTES=128*1024;
const MAX_TOTAL_BYTES=16*1024*1024;
const invalid=():never=>{throw new Error('Invalid retained public release. Supply a supported, intact public compiler artifact for this site.');};
const object=(value:Json|undefined):ObjectValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:invalid();
const exact=(value:ObjectValue,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(value,k))&&Object.keys(value).every(k=>required.includes(k)||optional.includes(k));
const hash=(value:Json|undefined):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/u.test(value);
const text=(value:Json|undefined):value is string=>typeof value==='string'&&!!value.trim();
const texts=(value:Json|undefined):value is string[]=>Array.isArray(value)&&value.every(text);
const requirements=(value:Json|undefined)=>texts(value)&&new Set(value).size===value.length&&value.every(v=>/^REQ-[A-Z0-9-]+$/u.test(v));

// Bounded data-only copy: no accessors, toJSON, class instances, cycles or silent field dropping.
function copyJson(input:unknown):{value:Json;bytes:number}{
  let nodes=0,budget=MAX_ARTIFACT_BYTES;const active=new Set<object>();
  function copy(value:unknown,depth:number):Json {
    if(++nodes>10000||depth>20||budget<0)return invalid();
    if(value===null||typeof value==='boolean'){budget-=5;return value;}
    if(typeof value==='number'&&Number.isFinite(value)){budget-=32;return value;}
    if(typeof value==='string'){if(value.length>MAX_ARTIFACT_BYTES)return invalid();budget-=Buffer.byteLength(JSON.stringify(value));return value;}
    if(!value||typeof value!=='object'||active.has(value))return invalid();active.add(value);
    let result:Json;
    if(Array.isArray(value)){
      if(value.length>10000)return invalid();budget-=value.length+2;
      if(Reflect.ownKeys(value).some(key=>typeof key!=='string'||key!=='length'&&(!/^(?:0|[1-9][0-9]*)$/u.test(key)||Number(key)>=value.length)))return invalid();
      result=Array.from({length:value.length},(_,index)=>{const d=Object.getOwnPropertyDescriptor(value,String(index));return d&&'value' in d?copy(d.value,depth+1):invalid();});
    }else{
      if(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)return invalid();
      const target:ObjectValue=Object.create(null);const keys=Object.keys(value);if(keys.length>10000||Reflect.ownKeys(value).length!==keys.length)return invalid();
      for(const key of keys){if(key.length>MAX_ARTIFACT_BYTES)return invalid();budget-=Buffer.byteLength(JSON.stringify(key))+2;const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!('value' in d))return invalid();target[key]=copy(d.value,depth+1);}
      result=target;
    }
    active.delete(value);if(budget<0)return invalid();return result;
  }
  const value=copy(input,0),bytes=Buffer.byteLength(JSON.stringify(value));if(bytes>MAX_ARTIFACT_BYTES)return invalid();return {value,bytes};
}
function sections(value:Json|undefined):void {
  if(!Array.isArray(value)||!value.length)return invalid();const ids=new Set<string>();
  for(const raw of value){
    const s=object(raw);
    if(!exact(s,['id','heading'],['paragraphs','items','links','table'])||!text(s.id)||ids.has(s.id)||!text(s.heading))return invalid();ids.add(s.id);
    for(const key of ['paragraphs','items'])if(s[key]!==undefined&&!texts(s[key]))return invalid();
    if(s.links!==undefined){if(!Array.isArray(s.links))return invalid();for(const raw of s.links){const l=object(raw);if(!exact(l,['label','href'])||!text(l.label)||!isSafeLink(l.href))return invalid();}}
    if(s.table!==undefined){const t=object(s.table);if(!exact(t,['caption','columns','rows'])||!text(t.caption)||!texts(t.columns)||!t.columns.length||!Array.isArray(t.rows)||t.rows.some(r=>!texts(r)||r.length!==(t.columns as Json[]).length))return invalid();}
  }
}
function validate(input:Json,siteId:string,mode:'preview'|'production'):ObjectValue {
  const a=object(input);if(!exact(a,['manifest','publicConfig','pages','documents'],['renderedBodies']))return invalid();
  const m=object(a.manifest);
  if(!exact(m,['schemaVersion','artifactId','siteId','locale','mode','configSha256','documents','requirementIds'],['catalogReview'])||m.schemaVersion!==1||!hash(m.artifactId)||!hash(m.configSha256)||m.siteId!==siteId||!['preview','production'].includes(String(m.mode))||mode==='production'&&m.mode!=='production'||!requirements(m.requirementIds))return invalid();
  if(m.catalogReview!==undefined)normalizeCatalogReviewDescriptor(m.catalogReview);
  const {artifactId,...descriptor}=m;if(sha256(canonicalJson(descriptor))!==artifactId)return invalid();
  let config;try{config=toPublicConfig(a.publicConfig,{mode:m.mode as 'preview'|'production'});}catch{return invalid();}
  if(canonicalJson(config)!==canonicalJson(a.publicConfig)||sha256(canonicalJson(config))!==m.configSha256||config.site.id!==siteId||config.site.locale!==m.locale)return invalid();
  const pages=object(a.pages),models=object(a.documents),bodies=a.renderedBodies===undefined?{}:object(a.renderedBodies);
  if(!Array.isArray(m.documents)||m.documents.length!==3||Object.keys(pages).length!==3||!exact(models,[...documentKinds]))return invalid();
  const kinds=new Set<string>(),authored=new Set<string>();
  for(const raw of m.documents){
    const d=object(raw);if(!exact(d,['kind','route','file','title','version','effectiveDate','reviewStatus','sha256','contentSha256','requirementIds'],['authoring'])||typeof d.kind!=='string'||!documentKinds.includes(d.kind as typeof documentKinds[number])||kinds.has(d.kind)||!hash(d.sha256)||!hash(d.contentSha256)||!requirements(d.requirementIds))return invalid();kinds.add(d.kind);
    const model=object(models[d.kind]),configured=config.documents[d.kind as typeof documentKinds[number]];
    if(!exact(model,['kind','title','route','version','effectiveDate','reviewStatus','sections','requirementIds'])||model.kind!==d.kind||d.file!==`${configured.route.slice(1)}/index.html`||d.reviewStatus!==configured.review.status)return invalid();
    for(const key of ['title','route','version','effectiveDate'] as const)if(d[key]!==configured[key])return invalid();
    for(const key of ['title','route','version','effectiveDate','reviewStatus','requirementIds'])if(canonicalJson(model[key])!==canonicalJson(d[key]))return invalid();
    sections(model.sections);if(sha256(canonicalJson({title:model.title,sections:model.sections}))!==d.contentSha256)return invalid();
    const page=pages[String(d.file)];if(typeof page!=='string'||sha256(page)!==d.sha256)return invalid();
    if(d.authoring!==undefined){
      authored.add(d.kind);const provenance=object(d.authoring);
      if(!exact(provenance,['schemaVersion','format','sourceSha256','sourceBytes','bodySha256','renderer','policy','componentsRevision'])||provenance.schemaVersion!==1||!['md','mdx'].includes(String(provenance.format))||!hash(provenance.sourceSha256)||!hash(provenance.bodySha256)||!Number.isSafeInteger(provenance.sourceBytes)||Number(provenance.sourceBytes)<1||Number(provenance.sourceBytes)>24576||provenance.renderer!=='notabenda-authoring@0.1.0'||provenance.policy!=='static-html-v1'||!text(provenance.componentsRevision))return invalid();
      const body=bodies[d.kind];if(typeof body!=='string'||sha256(body)!==provenance.bodySha256||!page.includes(`<div class="nb-authored" data-body-sha256="${provenance.bodySha256}">${body}</div>`))return invalid();
    }
  }
  if(Object.keys(bodies).length!==authored.size||Object.keys(bodies).some(k=>!authored.has(k)))return invalid();return a;
}

/** @requirements REQ-PRODUCT-RETAINED-RELEASES REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-AUTHORING
 * Explicit trusted build inputs, never a sanitizer or a publication/retention decision.
 * Re-emit exact historical HTML at pinned paths only; never overwrite current document routes.
 */
export function createRetainedReleaseFiles(artifacts:readonly unknown[],options:ValidationOptions&{siteId:string}):Record<string,string>{
  if(!Array.isArray(artifacts)||artifacts.length>256||!options||typeof options.siteId!=='string'||options.siteId.length>200||!/^[a-z][a-z0-9-]*$/u.test(options.siteId)||options.mode!==undefined&&!['preview','production'].includes(options.mode))return invalid();
  const files:Record<string,string>={},seen=new Map<string,string>();let total=0;
  for(const input of artifacts){
    const copied=copyJson(input);total+=copied.bytes;if(total>MAX_TOTAL_BYTES)return invalid();
    const a=validate(copied.value,options.siteId,options.mode??'production'),m=object(a.manifest),id=String(m.artifactId),json=canonicalJson(a)+'\n';
    if(seen.has(id)){if(seen.get(id)!==json)return invalid();continue;}seen.set(id,json);files[`artifacts/${id}.json`]=json;
    for(const raw of m.documents as Json[]){const d=object(raw);files[`artifacts/${id}/${String(d.kind)}.html`]=String(object(a.pages)[String(d.file)]);}
  }
  return files;
}
