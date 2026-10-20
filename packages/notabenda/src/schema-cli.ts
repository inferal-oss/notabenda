// @requirements REQ-PRODUCT-AGENT-INTEGRATION REQ-PRODUCT-CONFIG
import {readFile} from 'node:fs/promises';
type Shape={ [key:string]:unknown; $ref?:string; type?:string; properties?:Record<string,Shape>; required?:string[]; items?:Shape; anyOf?:Shape[]; $defs?:Record<string,Shape> };
const invalid=():never=>{throw Error('Unknown configuration path. Use notabenda schema --json for the full SiteConfig authoring shape. Array paths describe item fields; numeric indexes and arbitrary record keys are not supported.');};

/** Only installed generated metadata is read. Never import consumer code or config. */
export async function runSchemaCli(args:string[]):Promise<void>{
 let path:string|undefined,json=false;
 for(const arg of args){
  if(arg==='--json'&&!json){json=true;continue;}
  if(path!==undefined||arg.startsWith('-')||arg.length>300||!/^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*$/u.test(arg))return invalid();
  path=arg;
 }
 const schema=JSON.parse(await readFile(new URL('./site-config.schema.json',import.meta.url),'utf8')) as Shape;
 if(path===undefined){console.log(JSON.stringify(schema,null,2));return;}
 const defs=schema.$defs!,optionalAncestors=new Set<string>(),arrayItemPaths=new Set<string>(),alternativeAncestors=new Set<string>();let conditional=false;
 function dereference(shape:Shape,depth=0):Shape{
  if(depth>64)throw Error('Invalid installed configuration schema.');
  if(!shape.$ref)return shape;
  const target=defs[shape.$ref.replace(/^#\/\$defs\//u,'')];
  if(!target)throw Error('Invalid installed configuration schema.');
  return {...dereference(target,depth+1),...(typeof shape.description==='string'?{description:shape.description}:{})};
 }
 function variants(shape:Shape,prefix:string):Shape[]{
  const resolved=dereference(shape);
  if(resolved.type==='array'&&resolved.items){arrayItemPaths.add(prefix);return variants(resolved.items,prefix);}
  if(resolved.anyOf){alternativeAncestors.add(prefix);return resolved.anyOf.flatMap(item=>variants(item,prefix));}
  return [resolved];
 }
 let current:Shape[]=[schema],prefix='';
 for(const key of path.split('.')){
  const parents=current.flatMap(item=>variants(item,prefix)),next:Shape[]=[];
  const child=prefix?prefix+'.'+key:key;
  for(const parent of parents){
   if(!parent.properties||!Object.hasOwn(parent.properties,key)){conditional=true;continue;}
   if(!parent.required?.includes(key))optionalAncestors.add(child);
   next.push(parent.properties[key]!);
  }
  if(!next.length)return invalid();
  current=next;prefix=child;
 }
 // A selected field remains an array when it is the requested leaf. Traverse
 // arrays only to resolve a following item field, never fabricate a numeric key.
 const unique=[...new Map(current.map(item=>[JSON.stringify(item),item])).values()];
 const shape=unique.length===1?unique[0]!:{anyOf:unique};
 const included:Record<string,Shape>={};
 function include(value:unknown):void{
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){value.forEach(include);return;}
  const node=value as Shape;
  if(node.$ref){const name=node.$ref.replace(/^#\/\$defs\//u,'');if(!Object.hasOwn(included,name)){if(!defs[name])throw Error('Invalid installed configuration schema.');included[name]=defs[name];include(defs[name]);}}
  Object.values(node).forEach(include);
 }
 include(shape);
 console.log(JSON.stringify({$schema:schema.$schema,title:'Notabenda SiteConfig · '+path,description:schema.description,
  'x-notabenda':{...(schema['x-notabenda'] as object),path,optionalAncestors:[...optionalAncestors],arrayItemPaths:[...arrayItemPaths],conditional,alternativeAncestors:[...alternativeAncestors]},
  ...shape,...(Object.keys(included).length?{$defs:included}:{})},null,2));
}
