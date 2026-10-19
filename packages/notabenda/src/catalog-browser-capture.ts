/** @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-DISCOVERY REQ-PRODUCT-SERVICE-CATALOG */
import {observeDiscovery,normalizeDiscoveryCapture} from './discovery-capture.js';
import type {DiscoveryCapture,DiscoveryEnvironment} from './discovery-capture.js';
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeBrowserRuleSet,normalizeBrowserCatalogCapture,matchesBrowserPattern} from './catalog-browser-policy.js';
import type {BrowserRuleSet,BrowserSignal,BrowserWitness,BrowserWitnessChannel,BrowserCatalogCapture} from './catalog-browser-policy.js';
export interface BrowserCatalogEnvironment extends DiscoveryEnvironment {globals?:object}
type Entry={ruleId:string;signal:BrowserSignal};
function collector(ruleSet:BrowserRuleSet){
 const entries:Entry[]=ruleSet.rules.flatMap(rule=>rule.signals.map(signal=>({ruleId:rule.id,signal}))),evidence=new Map<string,BrowserWitness>();let comparisons=0,limited=false,oversizedUrls=0;
 const step=()=>{if(++comparisons>100000){limited=true;return false;}return true;};
 const record=(entry:Entry,channel:BrowserWitnessChannel,count=1)=>{const key=JSON.stringify([entry.ruleId,entry.signal.id,channel]),previous=evidence.get(key);evidence.set(key,{ruleId:entry.ruleId,signalId:entry.signal.id,channel,count:Math.min(1_000_000,(previous?.count??0)+count)});};
 const resourceEntries=entries.filter(entry=>entry.signal.kind==='resource'),markerEntries=entries.filter(entry=>entry.signal.kind==='marker');
 return {entries,step,record,limited:()=>limited,oversizedUrls:()=>oversizedUrls,evidence:()=>[...evidence.values()],
  discard(channel:BrowserWitnessChannel){for(const [key,value] of evidence)if(value.channel===channel)evidence.delete(key);},
  resource(value:string,type:string,channel:'resource-entry'|'dom-reference',base:string,legacy=false,count=1){
   if(value.length>4096){oversizedUrls++;limited=true;return;}
   let url:URL;try{url=new URL(value,base);if(url.protocol!=='https:'||url.port||url.username||url.password)return;}catch{return;}
   const resourceType=type==='script'?'script':type==='frame'||type==='iframe'?'frame':type==='image'||type==='img'?'image':'any';
   for(const entry of resourceEntries){if(!step())return;const signal=entry.signal;if(signal.kind!=='resource'||!signal.channels.includes(channel)||legacy&&signal.path!==null||signal.resourceType!=='any'&&signal.resourceType!==resourceType)continue;
    // All URL predicates apply to this same observation. Never join a host from
    // one resource with a path/type from a different resource.
    if(signal.hosts.some(host=>url.hostname===host||signal.subdomains&&url.hostname.endsWith('.'+host))&&(signal.path===null||matchesBrowserPattern(url.pathname,signal.path)))record(entry,channel,count);
   }
  },
  element(element:Element){
   const matching=markerEntries.filter(entry=>entry.signal.kind==='marker'&&entry.signal.tag===element.localName);if(!matching.length)return;
   const value=element.getAttribute('class')??'';if(value.length>4096){limited=true;return;}const tokens=value.split(/\s+/u);
   for(const entry of matching){if(!step())return;if(entry.signal.kind==='marker'&&tokens.includes(entry.signal.classToken))record(entry,'dom-marker');}
  },
  storage(capture:DiscoveryCapture){for(const item of capture.storage)for(const entry of entries){if(!step())return;const signal=entry.signal;if(signal.kind==='storage'&&signal.storageType===item.type&&matchesBrowserPattern(item.name,signal.name))record(entry,(item.type+'-name') as BrowserWitnessChannel);}},
 };
}
/** One bounded pass supplies both unchanged v1 aggregates and transient signature witnesses. */
export function captureBrowserCatalog(labels:{routeLabel:string;scenario:string},input:unknown,environment?:BrowserCatalogEnvironment):BrowserCatalogCapture {
 const ruleSet=normalizeBrowserRuleSet(input),doc=environment?.document??(typeof document==='undefined'?undefined:document);if(!doc)throw Error('Browser catalog capture requires an HTTP(S) document.');
 const view=doc.defaultView,env=environment??{document:doc,...(view?{performance:view.performance,localStorage:()=>view.localStorage,sessionStorage:()=>view.sessionStorage}:{}),cookies:()=>doc.cookie};
 const collection=collector(ruleSet),capture=observeDiscovery(labels,env,{resource:(url,type,channel)=>collection.resource(url,type,channel,doc.baseURI),element:element=>collection.element(element)});
 if(capture.coverage.resources==='unavailable')collection.discard('resource-entry');if(capture.coverage.dom==='unavailable'){collection.discard('dom-reference');collection.discard('dom-marker');}collection.storage(capture);
 let globals:'available'|'limited'|'unavailable'='available',accessorGlobals=0;const target=environment?.globals??view;
 if(!target)globals='unavailable';
 else for(const entry of collection.entries){if(entry.signal.kind!=='global')continue;if(!collection.step()){globals='limited';break;}
  try{const descriptor=Object.getOwnPropertyDescriptor(target,entry.signal.name);if(!descriptor)continue;if(!Object.hasOwn(descriptor,'value')){accessorGlobals++;globals='limited';continue;}const value=descriptor.value;if(value!==null&&typeof value===entry.signal.valueType)collection.record(entry,'own-global');}
  catch{globals='limited';}
 }
 return normalizeBrowserCatalogCapture({schemaVersion:1,kind:'catalog-browser-capture',matcherVersion:1,mode:'transient-signatures',capture,ruleSet,evidence:collection.evidence(),coverage:{matching:collection.limited()?'limited':'available',globals},omitted:{oversizedUrls:collection.oversizedUrls(),accessorGlobals}});
}
/** Explicit retrospective analysis cannot invent paths, markers or globals absent from v1 captures. */
export function recognizeLegacyBrowserCapture(input:unknown,rules:unknown):BrowserCatalogCapture {
 assertPlainCatalogData(input);const capture=normalizeDiscoveryCapture(input),ruleSet=normalizeBrowserRuleSet(rules),collection=collector(ruleSet);
 for(const item of capture.network)collection.resource(item.origin,item.initiator,'resource-entry',capture.pageOrigin,true,item.count);
 for(const item of capture.references)collection.resource(item.origin,item.kind,'dom-reference',capture.pageOrigin,true,item.count);
 collection.storage(capture);
 return normalizeBrowserCatalogCapture({schemaVersion:1,kind:'catalog-browser-capture',matcherVersion:1,mode:'origins-and-names',capture,ruleSet,evidence:collection.evidence(),coverage:{matching:collection.limited()?'limited':'available',globals:'unavailable'},omitted:{oversizedUrls:0,accessorGlobals:0}});
}
