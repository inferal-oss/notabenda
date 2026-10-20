// @requirements REQ-PRODUCT-CONNECTION-INSPECTION REQ-PRODUCT-CONFIG
import type {ConsentRuntimeInventory} from './consent-runtime-config.js';
const record=(value:unknown):Record<string,unknown>=>{
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error('Select ordinary consent inventory data.');
 return value as Record<string,unknown>;
};
const own=(value:unknown,key:string):unknown=>{
 const descriptor=Object.getOwnPropertyDescriptor(record(value),key);
 if(!descriptor)return undefined;
 if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))throw Error('Select data properties without invoking accessors.');
 return descriptor.value;
};
/** Select only consent fields without reading excluded workflow bodies or accessors. Normalize afterward. */
export function projectConsentInventory(c:ConsentRuntimeInventory):ConsentRuntimeInventory {
 const documents=Object.fromEntries((['privacy','cookies'] as const).map(kind=>{
  const source=record(own(own(c,'documents'),kind)),metadata:Record<string,unknown>={};
  for(const key of Reflect.ownKeys(source)){if(key==='sections')continue;if(typeof key!=='string')throw Error('Select ordinary document metadata.');Object.defineProperty(metadata,key,{value:own(source,key),enumerable:true,writable:true,configurable:true});}
  return [kind,metadata];
 }));
 const inventory:Record<string,unknown>={documents};
 for(const key of ['schemaVersion','site','purposes','services','storage','consent','scopeGuards','privacySignals']){const value=own(c,key);if(value!==undefined)inventory[key]=value;}
 const localization=own(c,'localization');if(localization!==undefined)inventory.localization=Object.fromEntries(['schemaVersion','locale','direction','revision','disclosureRevision','reviewStatus','consent'].map(key=>[key,own(localization,key)]));
 return inventory as unknown as ConsentRuntimeInventory;
}
