// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import {isComposerPackageName} from './catalog-composer-policy.js';
type Context='dependency'|'development-dependency'|'locked-dependency'|'locked-development-dependency';
export interface ComposerIdentifiers {identifiers:{identifier:string;context:Context}[];limited:boolean}
const table=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);

/** JSON.parse validates grammar. This pass rejects duplicate decoded keys and excessive structure. */
function readData(source:string):Record<string,unknown>{
 if(Buffer.byteLength(source)>262144)throw Error();
 const root:unknown=JSON.parse(source),stack:(Set<string>|null)[]=[];let keys=0;
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(c==='{'||c==='['){stack.push(c==='{'?new Set():null);if(stack.length>32)throw Error();}
  else if(c==='}'||c===']')stack.pop();
  else if(c==='"'){
   const start=i;while(++i<source.length){if(source[i]==='\\')i++;else if(source[i]==='"')break;}
   let next=i+1;while(/\s/u.test(source[next]??'')&&next<source.length)next++;
   if(source[next]===':'){
    const key:string=JSON.parse(source.slice(start,i+1)),scope=stack.at(-1);
    if(!scope||scope.has(key)||++keys>10000)throw Error();scope.add(key);
   }
  }
 }
 if(!table(root))throw Error();return root;
}

/** Named static candidates only. Never execute Composer/PHP, follow repositories or resolve installation. */
export function composerIdentifiers(source:string,kind:'manifest'|'lock'):ComposerIdentifiers {
 const identifiers:ComposerIdentifiers['identifiers']=[];let limited=false,count=0,root:Record<string,unknown>;
 try{root=readData(source);}catch{return {identifiers,limited:true};}
 const tick=()=>{if(++count>10000){limited=true;return false;}return true;};
 if(kind==='manifest'){
  for(const [key,context] of [['require','dependency'],['require-dev','development-dependency']] as const){
   const entries=root[key];if(entries===undefined)continue;if(!table(entries)){limited=true;continue;}
   for(const [identifier,constraint] of Object.entries(entries)){
    if(!tick())break;
    if(typeof constraint!=='string'||!constraint.trim()||constraint.length>4096){limited=true;continue;}
    if(isComposerPackageName(identifier))identifiers.push({identifier,context});
    else if(!/^(?:php(?:-64bit|-ipv6|-zts|-debug)?|hhvm|(?:ext|lib)-[a-z0-9][a-z0-9_.-]*|composer(?:-plugin-api|-runtime-api)?)$/u.test(identifier))limited=true;
   }
  }
  // These declarations can replace/redirect dependency identities. Do not inspect their values.
  if(['repositories','replace','provide'].some(key=>Object.hasOwn(root,key)))limited=true;
 }else{
  for(const [key,context] of [['packages','locked-dependency'],['packages-dev','locked-development-dependency']] as const){
   const entries=root[key];if(!Array.isArray(entries)){limited=true;continue;}
   const seen=new Set<string>();
   for(const item of entries){
    if(!tick())break;
    if(!table(item)||!isComposerPackageName(item.name)||seen.has(item.name)){limited=true;continue;}
    seen.add(item.name);identifiers.push({identifier:item.name,context});
   }
  }
  // Lock observations do not assert freshness, directness or actual installed code.
 }
 return {identifiers,limited};
}
