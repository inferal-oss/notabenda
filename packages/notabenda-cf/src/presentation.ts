// @requirements REQ-PRODUCT-SETUP
/** @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE */
import type {AdminPresentation} from './types.js';
import {boundedText} from './records.js';
export function normalizeAdminPresentation(input:AdminPresentation):AdminPresentation {
 const result:AdminPresentation={};
 for(const [key,max] of [['workspaceLabel',80],['workspaceNote',400]] as const){const value=input[key];if(value!==undefined){if(!boundedText(value,max)||!value.trim())throw new Error('Use bounded workspace presentation text.');result[key]=value;}}
 if(input.navigation!==undefined){
  if(!Array.isArray(input.navigation)||input.navigation.length>12)throw new Error('Use at most twelve workspace links.');
  const seen=new Set<string>();
  result.navigation=input.navigation.map(item=>{if(!item||!boundedText(item.label,80)||!item.label.trim()||typeof item.href!=='string'||item.href.length>300||!/^\/(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)?$/u.test(item.href)||seen.has(item.href))throw new Error('Use unique same-origin workspace routes and bounded labels.');seen.add(item.href);return {label:item.label,href:item.href};});
 }
 return result;
}
