/** @requirements REQ-EU-GUARANTEE-LABEL */
import {createHash} from 'node:crypto';
import {canonicalJson} from 'notabenda/content';
import {normalizeDurabilityGuaranteeLabel,durabilityGuaranteeInformationUrl} from 'notabenda/guarantees/label';
import type {DurabilityGuaranteeLabel,DurabilityGuaranteeWording} from 'notabenda/guarantees/label';
import {inspectDurabilityGuaranteeImage} from './guarantee-label-image.js';
export interface DurabilityGuaranteeBuildOptions {
 product:DurabilityGuaranteeLabel['product'];producer:DurabilityGuaranteeLabel['producer'];durationYears:number;
 qualification:DurabilityGuaranteeLabel['qualification'];reviewStatus:'draft'|'reviewed';locale:string;
 /** Required outside English. The producer image itself always contains the prescribed multilingual footer. */
 wording?:DurabilityGuaranteeWording;statementUrl?:string;assetBase?:string;allowPreview?:boolean;
}
const digest=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
function ownedBytes(bytes:Uint8Array):Uint8Array {
 if(!(bytes instanceof Uint8Array)||bytes.byteLength===0||bytes.byteLength>2097152||bytes.buffer instanceof SharedArrayBuffer)throw Error('Supply a non-shared finished label file of 1–2097152 bytes.');
 return Uint8Array.from(bytes);
}
/** Build-only ingestion of a finished producer file; preserves its exact bytes under a content-addressed local URL. */
export function buildDurabilityGuaranteeLabel(input:DurabilityGuaranteeBuildOptions,assetBytes:Uint8Array):{label:DurabilityGuaranteeLabel;files:Record<string,Uint8Array>} {
 // Copy before inspecting caller-supplied options; no caller mutation/getter can replace the retained bytes.
 const bytes=ownedBytes(assetBytes),options=copyBuildOptions(input) as DurabilityGuaranteeBuildOptions;
 if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['product','producer','durationYears','qualification','reviewStatus','locale','wording','statementUrl','assetBase','allowPreview'].includes(k)))throw Error('Use supported label build options only.');
 const base=options.assetBase??'/assets/guarantees';if(!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/u.test(base))throw Error('Use an absolute local asset directory without a trailing slash.');
 if(options.allowPreview!==undefined&&typeof options.allowPreview!=='boolean')throw Error('Preview must be an explicit boolean.');
 if(!options.wording&&options.locale!=='en')throw Error('Provide reviewed translated surrounding wording for this locale.');
 const image=inspectDurabilityGuaranteeImage(bytes),sha256=digest(bytes),{extension,...metadata}=image;
 const wording=options.wording??{title:'Producer’s durability guarantee',producerLabel:'Producer',modelLabel:'Model',durationLabel:'Guarantee duration',durationValue:String(options.durationYears).replace('.',',')+' years',imageAlt:'Producer-prepared EU durability guarantee label for '+options.producer?.brand+' '+options.producer?.model+'. Open the full-size label for its complete wording.',fullSizeLink:'Open the full-size guarantee label',informationLink:'About commercial durability guarantees',statementLink:'Read the producer’s guarantee statement'};
 const label=normalizeDurabilityGuaranteeLabel({schemaVersion:1,kind:'eu-durability-guarantee-label',renderingPolicy:'guarantee-label-v1',labelId:'0'.repeat(64),reviewStatus:options.reviewStatus,locale:options.locale,product:options.product,producer:options.producer,durationYears:options.durationYears,qualification:options.qualification,asset:{...metadata,sha256,bytes:bytes.length,url:base+'/'+sha256+'.'+extension},informationUrl:durabilityGuaranteeInformationUrl,wording,...(options.statementUrl===undefined?{}:{statementUrl:options.statementUrl})},{allowPreview:options.allowPreview===true});
 const {labelId:_,...descriptor}=label;return {label:{...label,labelId:digest(canonicalJson(descriptor))},files:{[label.asset.url.slice(1)]:bytes}};
}
/** Build-time verification of descriptor identity AND supplied original asset bytes. Does not authenticate a producer or reviewer. */
export function verifyDurabilityGuaranteeLabel(input:unknown,assetBytes:Uint8Array,options:{allowPreview?:boolean}={}):DurabilityGuaranteeLabel {
 const bytes=ownedBytes(assetBytes),label=normalizeDurabilityGuaranteeLabel(input,options),{labelId,...descriptor}=label;
 if(digest(canonicalJson(descriptor))!==labelId||digest(bytes)!==label.asset.sha256||bytes.length!==label.asset.bytes)throw Error('The guarantee label does not match its identity and original file.');
 const image=inspectDurabilityGuaranteeImage(bytes);if(image.width!==label.asset.width||image.height!==label.asset.height||image.mediaType!==label.asset.mediaType)throw Error('The guarantee label asset metadata does not match its file.');
 return label;
}

/** Inspect plain bounded data without invoking getters, toJSON or coercion. Kept build-local; no private core import. */
function copyBuildOptions(input:unknown):unknown {
 let nodes=0,bytes=0;const seen=new Set<object>();
 function copy(v:unknown,depth:number):unknown {
  if(++nodes>200||depth>6||bytes>24576)throw Error('Label build options exceed the supported data budget.');
  if(typeof v==='string'){bytes+=new TextEncoder().encode(v).length;if(v.length>4000)throw Error('Label build text is too long.');return v;}
  if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)){bytes+=20;return v;}
  if(!v||typeof v!=='object'||Array.isArray(v)||seen.has(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw Error('Use plain JSON label build options.');
  seen.add(v);const ds=Object.getOwnPropertyDescriptors(v),keys=Reflect.ownKeys(ds);if(keys.length>20)throw Error('Too many label build fields.');const result:Record<string,unknown>=Object.create(null);
  for(const key of keys){if(typeof key!=='string'||!Object.hasOwn(ds[key]!,'value')||!ds[key]!.enumerable)throw Error('Use own plain label build fields.');bytes+=key.length*4;result[key]=copy(ds[key]!.value,depth+1);}
  seen.delete(v);return result;
 }
 const result=copy(input,0);if(bytes>24576)throw Error('Label build options exceed the supported data budget.');return result;
}
