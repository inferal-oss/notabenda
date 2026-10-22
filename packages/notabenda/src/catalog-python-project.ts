// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import {readProjectToml} from './catalog-toml.js';

type Context='dependency'|'optional-dependency'|'dependency-group'|'build-dependency';
export interface PythonProjectIdentifiers {identifiers:{identifier:string;context:Context}[];limited:boolean}
const table=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const name=(v:unknown):v is string=>typeof v==='string'&&v.length<=100&&/^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/u.test(v);
const normalized=(v:string)=>v.toLowerCase().replace(/[-_.]+/gu,'-');

/** Read named candidates, not a resolved environment or a complete PEP 508 validator. */
export function pythonProjectIdentifiers(source:string):PythonProjectIdentifiers {
 const identifiers:PythonProjectIdentifiers['identifiers']=[];let limited=false,count=0;
 let root:Record<string,unknown>;
 try{root=readProjectToml(source);}catch{return {identifiers,limited:true};}
 const tick=()=>{if(++count>10000){limited=true;return false;}return true;};
 const requirement=(value:unknown,context:Context)=>{
  if(typeof value!=='string'||value.length>4096){limited=true;return;}
  const match=/^\s*([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)(?=\s*(?:$|[\[<>=!~;@]))/u.exec(value);
  if(!match||!name(match[1])){limited=true;return;}
  identifiers.push({identifier:normalized(match[1]),context});
 };
 const requirements=(value:unknown,context:Context)=>{
  if(!Array.isArray(value)){limited=true;return;}
  for(const item of value){if(!tick())break;requirement(item,context);}
 };
 if(root.project!==undefined){
  if(!table(root.project))limited=true;
  else{
   const p=root.project;
   if(p.dependencies!==undefined)requirements(p.dependencies,'dependency');
   if(p['optional-dependencies']!==undefined){
    if(!table(p['optional-dependencies']))limited=true;
    else for(const [extra,items] of Object.entries(p['optional-dependencies'])){if(!tick())break;if(!name(extra))limited=true;requirements(items,'optional-dependency');}
   }
   if(p.dynamic!==undefined&&(!Array.isArray(p.dynamic)||p.dynamic.some(v=>typeof v!=='string'||v==='dependencies'||v==='optional-dependencies')))limited=true;
  }
 }
 if(root['build-system']!==undefined){
  const b=root['build-system'];if(!table(b)||b.requires===undefined)limited=true;else requirements(b.requires,'build-dependency');
 }
 const raw=root['dependency-groups'];
 if(raw!==undefined){
  if(!table(raw))limited=true;
  else{
   // Scan each declared group once. Includes validate structure; never expand paths or duplicate a graph.
   const groups=new Map<string,unknown>(),edges=new Map<string,string[]>();
   for(const [key,value] of Object.entries(raw)){
    if(groups.size>=256){limited=true;break;}
    if(!name(key)||groups.has(normalized(key))){limited=true;continue;}groups.set(normalized(key),value);
   }
   for(const [key,value] of groups){
    if(!Array.isArray(value)){limited=true;continue;}
    const links:string[]=[];edges.set(key,links);
    for(const item of value){
     if(!tick())break;
     if(typeof item==='string')requirement(item,'dependency-group');
     else if(table(item)&&Object.keys(item).length===1&&name(item['include-group']))links.push(normalized(item['include-group']));
     else limited=true;
    }
   }
   const visited=new Set<string>(),active=new Set<string>();
   const visit=(key:string,depth:number)=>{
    if(depth>64||active.has(key)||!groups.has(key)){limited=true;return;}
    if(visited.has(key))return;active.add(key);
    for(const next of edges.get(key)??[])visit(next,depth+1);
    active.delete(key);visited.add(key);
   };
   for(const key of groups.keys())visit(key,0);
  }
 }
 // These tables can change dependency selection. Do not run their tools or follow local/network sources.
 const tool=table(root.tool)?root.tool:{};
 const hasAny=(value:unknown,keys:string[])=>table(value)&&keys.some(k=>Object.hasOwn(value,k));
 if(hasAny(tool.poetry,['dependencies','dev-dependencies','group'])||hasAny(tool.uv,['sources','workspace'])||hasAny(tool.pdm,['dev-dependencies']))limited=true;
 return {identifiers,limited};
}
