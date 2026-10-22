// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import {readProjectToml} from './catalog-toml.js';
import {isCargoPackageName} from './catalog-cargo-policy.js';
type BaseContext='dependency'|'optional-dependency'|'development-dependency'|'build-dependency';
type Context=BaseContext|`target-${BaseContext}`|'workspace-dependency';
export interface CargoIdentifiers {identifiers:{identifier:string;context:Context}[];limited:boolean}
const table=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=4096;

/** Declaration candidates only. No workspace traversal, feature/target resolution or Cargo execution. */
export function cargoIdentifiers(source:string):CargoIdentifiers {
 const identifiers:CargoIdentifiers['identifiers']=[];let root:Record<string,unknown>,limited=false,count=0;
 try{root=readProjectToml(source);}catch{return {identifiers,limited:true};}
 const tick=()=>{if(++count>10000){limited=true;return false;}return true;};
 const dependencies=(raw:unknown,base:BaseContext|'workspace-dependency',target=false)=>{
  if(raw===undefined)return;if(!table(raw)){limited=true;return;}
  for(const [alias,value] of Object.entries(raw)){
   if(!tick())break;
   if(!isCargoPackageName(alias)){limited=true;continue;}
   let identifier=alias,optional=false;
   if(typeof value==='string'){if(!text(value)){limited=true;continue;}}
   else if(table(value)){
    // Workspace keys can be aliases. Without resolving their manifest, the key is not a package identity.
    if(Object.hasOwn(value,'workspace')){limited=true;continue;}
    if(value.package!==undefined){if(!isCargoPackageName(value.package)){limited=true;continue;}identifier=value.package;}
    if(value.optional!==undefined){if(typeof value.optional!=='boolean'||base==='workspace-dependency'){limited=true;continue;}optional=value.optional;}
    if(value.version!==undefined&&!text(value.version)){limited=true;continue;}
    if(value.features!==undefined&&(!Array.isArray(value.features)||value.features.length>256||!value.features.every(text))){limited=true;continue;}
    if(value['default-features']!==undefined&&typeof value['default-features']!=='boolean'){limited=true;continue;}
    const redirected=['git','path','registry','registry-index','branch','tag','rev'].some(k=>Object.hasOwn(value,k));
    if(redirected)limited=true;
    if(value.version===undefined&&!redirected){limited=true;continue;}
    if(Object.keys(value).some(k=>!['package','version','optional','features','default-features','git','path','registry','registry-index','branch','tag','rev'].includes(k)))limited=true;
   }else{limited=true;continue;}
   // Optional applies to normal package dependencies. Dev/build contexts keep their own meaning.
   if(optional&&base!=='dependency'){limited=true;continue;}
   const context=optional?'optional-dependency':base;
   identifiers.push({identifier,context:target?`target-${context as BaseContext}`:context});
  }
 };
 const tables=(scope:Record<string,unknown>,target=false)=>{
  for(const [key,context] of [['dependencies','dependency'],['dev-dependencies','development-dependency'],['build-dependencies','build-dependency']] as const)dependencies(scope[key],context,target);
 };
 tables(root);
 for(const key of ['dev_dependencies','build_dependencies'])if(Object.hasOwn(root,key))limited=true;
 if(root.target!==undefined){
  limited=true;
  if(!table(root.target))limited=true;
  else for(const value of Object.values(root.target)){if(!tick())break;if(!table(value)){limited=true;continue;}tables(value,true);}
 }
 if(root.workspace!==undefined){
  // Declarations are useful even when no selected package consumes them. Do not invent membership.
  limited=true;if(table(root.workspace))dependencies(root.workspace.dependencies,'workspace-dependency');
 }
 if(['patch','replace','cargo-features'].some(k=>Object.hasOwn(root,k))||table(root.package)&&Object.hasOwn(root.package,'workspace'))limited=true;
 return {identifiers,limited};
}
