// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-AGENT-INTEGRATION
import validateShape from './site-config-validator.js';
import {validateSiteConfig} from './config.js';
import type {Diagnostic,ValidationOptions,ValidationResult} from './types.js';

export interface ConfigShapeDiagnostic {instancePath:string;schemaPath:string;code:string;message:string}
export interface ConfigShapeResult {valid:boolean;diagnostics:ConfigShapeDiagnostic[];truncated:boolean}
const requirementIds:Diagnostic['requirementIds']=['REQ-PRODUCT-CONFIG','REQ-PRODUCT-AGENT-INTEGRATION'];
const invalidInput=():never=>{throw Error('Use bounded plain configuration data.');};

/** Detach before validation. Accessors, toJSON, cycles and sparse arrays never run. */
function copyInput(input:unknown):unknown {
 const seen=new Set<object>();let nodes=0,bytes=0;
 const count=(text:string)=>{bytes+=new TextEncoder().encode(text).length;if(bytes>1024*1024)invalidInput();};
 function copy(value:unknown,depth:number):unknown {
  if(++nodes>50000||depth>64)return invalidInput();
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:invalidInput();
  if(typeof value==='string'){count(value);return value;}
  if(!value||typeof value!=='object'||seen.has(value))return invalidInput();
  const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
  if(array?prototype!==Array.prototype:prototype!==null&&prototype!==Object.prototype)return invalidInput();
  seen.add(value);const result:Record<string,unknown>|unknown[]=array?[]:Object.create(null);
  for(const key of Reflect.ownKeys(value)){
   if(array&&key==='length')continue;
   if(typeof key!=='string'||array&&!/^(?:0|[1-9][0-9]*)$/u.test(key))return invalidInput();
   const descriptor=Object.getOwnPropertyDescriptor(value,key)!;
   if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))return invalidInput();
   count(key);Object.defineProperty(result,key,{value:copy(descriptor.value,depth+1),enumerable:true,writable:true,configurable:true});
  }
  if(array&&((result as unknown[]).length!==(value as unknown[]).length||Object.keys(result).length!==(value as unknown[]).length))return invalidInput();
  seen.delete(value);return result;
 }
 return copy(input,0);
}

function shapeOf(input:unknown):ConfigShapeResult {
 const valid=validateShape(input),errors=validateShape.errors??[];
 const escape=(part:string)=>part.replace(/~/gu,'~0').replace(/\//gu,'~1');
 const messages:Record<string,string>={required:'Required field is missing.',additionalProperties:'Unknown configuration field.',type:'Value has the wrong type.',const:'Value does not match this policy alternative.',enum:'Value is not an allowed choice.',anyOf:'Value does not match a complete allowed alternative.'};
 return {valid,diagnostics:errors.slice(0,100).map(error=>{
  const child=error.keyword==='required'?error.params.missingProperty:error.keyword==='additionalProperties'?error.params.additionalProperty:undefined;
  return {instancePath:error.instancePath+(typeof child==='string'?'/'+escape(child):''),schemaPath:error.schemaPath,code:error.keyword,message:messages[error.keyword]??'Value does not match the authoring shape.'};
 }),truncated:errors.length>100};
}
function inspect(input:unknown):{data?:unknown;shape:ConfigShapeResult}{
 try{const data=copyInput(input);return {data,shape:shapeOf(data)};}
 catch{return {shape:{valid:false,diagnostics:[{instancePath:'',schemaPath:'',code:'plain-data',message:'Use plain JSON-compatible data within 50,000 nodes, 64 nesting levels and 1 MiB of text and keys.'}],truncated:false}};}
}

/** Exact installed field shapes only. No defaults, coercion, inferred facts or mutation. */
export function inspectConfigAuthoringShape(input:unknown):ConfigShapeResult{return inspect(input).shape;}

/** File-authoring checks: exact shape first, then the existing semantic/review rules. */
export function validateAuthoredConfig(input:unknown,options:ValidationOptions={}):ValidationResult {
 const {data,shape}=inspect(input);
 if(shape.valid)return validateSiteConfig(data,{mode:options.mode??'production'});
 const diagnostics:Diagnostic[]=shape.diagnostics.map(d=>({path:d.instancePath||'config',code:'config-shape-'+d.code,message:d.message,requirementIds:[...requirementIds],severity:'error'}));
 if(shape.truncated)diagnostics.push({path:'config',code:'config-shape-truncated',message:'Only the first 100 authoring-shape errors are shown. Fix these fields and check again.',requirementIds:[...requirementIds],severity:'error'});
 return {valid:false,diagnostics};
}
