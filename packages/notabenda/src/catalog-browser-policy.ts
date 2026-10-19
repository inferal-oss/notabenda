/** @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-DISCOVERY */
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeServiceCatalog} from './catalog.js';
import type {ServiceCatalog} from './catalog.js';
import {normalizeDiscoveryCapture} from './discovery-capture.js';
import type {DiscoveryCapture,DiscoveryAccess,DiscoveryStorageType} from './discovery-capture.js';
export type BrowserWitnessChannel='resource-entry'|'dom-reference'|'cookie-name'|'localStorage-name'|'sessionStorage-name'|'own-global'|'dom-marker';
export interface BrowserPattern {match:'exact'|'prefix'|'glob';value:string}
export type BrowserSignal = {id:string;kind:'resource';hosts:string[];subdomains:boolean;path:BrowserPattern|null;resourceType:'script'|'frame'|'image'|'any';channels:('resource-entry'|'dom-reference')[]}|{id:string;kind:'storage';storageType:DiscoveryStorageType;name:BrowserPattern}|{id:string;kind:'global';name:string;valueType:'object'|'function'}|{id:string;kind:'marker';tag:'div'|'span'|'iframe';classToken:string};
export interface BrowserRule {id:string;revision:string;productId:string;sourceIds:string[];explanation:string;caveats:string[];signals:BrowserSignal[];anyOf:{allOf:string[]}[]}
export interface BrowserRuleSet {schemaVersion:1;kind:'notabenda-browser-rules';matcherVersion:1;id:string;revision:string;catalog:ServiceCatalog;rules:BrowserRule[]}
export interface BrowserWitness {ruleId:string;signalId:string;channel:BrowserWitnessChannel;count:number}
export interface BrowserCatalogCapture {schemaVersion:1;kind:'catalog-browser-capture';matcherVersion:1;mode:'transient-signatures'|'origins-and-names';capture:DiscoveryCapture;ruleSet:BrowserRuleSet;evidence:BrowserWitness[];coverage:{matching:'available'|'limited';globals:DiscoveryAccess};omitted:{oversizedUrls:number;accessorGlobals:number}}
const bad=():never=>{throw Error('Use a supported, bounded browser rule snapshot and compatible minimized witnesses. Unknown rules, channels or matcher versions cannot reinterpret a capture.');};
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,fields:string[])=>fields.length===Object.keys(value).length&&fields.every(key=>Object.hasOwn(value,key));
const text=(value:unknown,max=1000):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=max&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
const slug=(value:unknown):value is string=>text(value,120)&&/^[a-z][a-z0-9-]*$/u.test(value);
const strings=(value:unknown,max=16):value is string[]=>Array.isArray(value)&&value.length>0&&value.length<=max&&value.every(v=>text(v,1000))&&new Set(value).size===value.length;
const integer=(value:unknown,max=1_000_000)=>Number.isSafeInteger(value)&&Number(value)>=0&&Number(value)<=max;
export const browserCanonical=(value:unknown):string=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(browserCanonical).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+browserCanonical((value as Record<string,unknown>)[key])).join(',')+'}';
/** Anchored exact/prefix/single-star matching. No regular expression or executable rule data. */
export function matchesBrowserPattern(value:string,pattern:BrowserPattern):boolean {
 if(pattern.match==='exact')return value===pattern.value;
 if(pattern.match==='prefix')return value.startsWith(pattern.value);
 const at=pattern.value.indexOf('*');return value.length>=pattern.value.length-1&&value.startsWith(pattern.value.slice(0,at))&&value.endsWith(pattern.value.slice(at+1));
}
function pattern(input:unknown,path=false):input is BrowserPattern {
 if(!object(input)||!exact(input,['match','value'])||!['exact','prefix','glob'].includes(input.match as string)||typeof input.match!=='string'||!text(input.value,256))return false;
 if(path&&(!input.value.startsWith('/')||/[?#\\]/u.test(input.value)))return false;
 const stars=input.value.split('*').length-1;
 return input.match==='glob'?stars===1&&input.value!=='*':stars===0&&(!path||input.match!=='prefix'||input.value.endsWith('/'));
}
export function normalizeBrowserRuleSet(input:unknown):BrowserRuleSet {
 assertPlainCatalogData(input);
 if(!object(input)||!exact(input,['schemaVersion','kind','matcherVersion','id','revision','catalog','rules'])||input.schemaVersion!==1||input.kind!=='notabenda-browser-rules'||input.matcherVersion!==1||!slug(input.id)||!text(input.revision,120)||!Array.isArray(input.rules)||!input.rules.length||input.rules.length>100||new TextEncoder().encode(JSON.stringify(input)).length>512*1024)return bad();
 const catalog=normalizeServiceCatalog(input.catalog);if(catalog.products.length>100||catalog.providers.length>100||catalog.sources.length>100||catalog.products.some(p=>p.identifiers.length||p.storageHints.length))return bad();
 const productIds=new Set(catalog.products.map(p=>p.id)),sourceIds=new Set(catalog.sources.map(s=>s.id)),ruleIds=new Set<string>(),usedProducts=new Set<string>();let atoms=0;
 for(const rule of input.rules){
  if(!object(rule)||!exact(rule,['id','revision','productId','sourceIds','explanation','caveats','signals','anyOf'])||!slug(rule.id)||ruleIds.has(rule.id)||!text(rule.revision,120)||typeof rule.productId!=='string'||!productIds.has(rule.productId)||!strings(rule.sourceIds,16)||!rule.sourceIds.every(id=>sourceIds.has(id))||!text(rule.explanation)||!strings(rule.caveats,8)||!Array.isArray(rule.signals)||!rule.signals.length||rule.signals.length>16||!Array.isArray(rule.anyOf)||!rule.anyOf.length||rule.anyOf.length>8)return bad();
  ruleIds.add(rule.id);usedProducts.add(rule.productId);const ids=new Set<string>();
  for(const signal of rule.signals){
   if(++atoms>256||!object(signal)||!slug(signal.id)||ids.has(signal.id))return bad();ids.add(signal.id);
   if(signal.kind==='resource'){
    if(!exact(signal,['id','kind','hosts','subdomains','path','resourceType','channels'])||!strings(signal.hosts,16)||signal.hosts.some(host=>{try{return host!==new URL('https://'+host).hostname||!host.includes('.')||!/^[a-z0-9.-]+$/u.test(host);}catch{return true;}})||typeof signal.subdomains!=='boolean'||signal.path!==null&&!pattern(signal.path,true)||!['script','frame','image','any'].includes(signal.resourceType as string)||typeof signal.resourceType!=='string'||!strings(signal.channels,2)||signal.channels.some(channel=>!['resource-entry','dom-reference'].includes(channel)))return bad();
   }else if(signal.kind==='storage'){
    if(!exact(signal,['id','kind','storageType','name'])||typeof signal.storageType!=='string'||!['cookie','localStorage','sessionStorage'].includes(signal.storageType)||!pattern(signal.name))return bad();
   }else if(signal.kind==='global'){
    if(!exact(signal,['id','kind','name','valueType'])||!text(signal.name,120)||!/^[$A-Z_a-z][$\w]*$/u.test(signal.name)||typeof signal.valueType!=='string'||!['object','function'].includes(signal.valueType))return bad();
   }else if(signal.kind==='marker'){
    if(!exact(signal,['id','kind','tag','classToken'])||typeof signal.tag!=='string'||!['div','span','iframe'].includes(signal.tag)||!text(signal.classToken,120)||!/^[A-Za-z_][A-Za-z0-9_-]*$/u.test(signal.classToken))return bad();
   }else return bad();
  }
  const usedSignals=new Set<string>(),groups=new Set<string>();
  for(const group of rule.anyOf){if(!object(group)||!exact(group,['allOf'])||!strings(group.allOf,16)||!group.allOf.every(id=>ids.has(id))||groups.has(browserCanonical([...group.allOf].sort())))return bad();groups.add(browserCanonical([...group.allOf].sort()));for(const id of group.allOf)usedSignals.add(id);}
  if(usedSignals.size!==ids.size)return bad();
 }
 if(usedProducts.size!==productIds.size)return bad();
 return JSON.parse(JSON.stringify({...input,catalog})) as BrowserRuleSet;
}
export function witnessAllowed(signal:BrowserSignal,channel:BrowserWitnessChannel):boolean {
 return signal.kind==='resource'?signal.channels.includes(channel as 'resource-entry'|'dom-reference'):signal.kind==='storage'?channel===signal.storageType+'-name':signal.kind==='global'?channel==='own-global':channel==='dom-marker';
}
export function normalizeBrowserCatalogCapture(input:unknown,options:{expectedRules?:unknown}={}):BrowserCatalogCapture {
 assertPlainCatalogData(input);
 if(!object(input)||!exact(input,['schemaVersion','kind','matcherVersion','mode','capture','ruleSet','evidence','coverage','omitted'])||input.schemaVersion!==1||input.kind!=='catalog-browser-capture'||input.matcherVersion!==1||!['transient-signatures','origins-and-names'].includes(input.mode as string)||typeof input.mode!=='string'||!Array.isArray(input.evidence)||input.evidence.length>1792||!object(input.coverage)||!exact(input.coverage,['matching','globals'])||!['available','limited'].includes(input.coverage.matching as string)||typeof input.coverage.matching!=='string'||typeof input.coverage.globals!=='string'||!['available','limited','unavailable'].includes(input.coverage.globals)||!object(input.omitted)||!exact(input.omitted,['oversizedUrls','accessorGlobals'])||!Object.values(input.omitted).every(value=>integer(value)))return bad();
 const ruleSet=normalizeBrowserRuleSet(input.ruleSet),capture=normalizeDiscoveryCapture(input.capture);
 if(options.expectedRules!==undefined&&browserCanonical(ruleSet)!==browserCanonical(normalizeBrowserRuleSet(options.expectedRules)))throw Error('The expected browser rules differ from this capture snapshot. Keep the original snapshot; do not silently reinterpret its witnesses.');
 if(input.mode==='origins-and-names'&&(input.coverage.globals!=='unavailable'||input.omitted.oversizedUrls!==0||input.omitted.accessorGlobals!==0))return bad();
 const seen=new Set<string>();
 for(const value of input.evidence){
  if(!object(value)||!exact(value,['ruleId','signalId','channel','count'])||typeof value.ruleId!=='string'||typeof value.signalId!=='string'||typeof value.channel!=='string'||!integer(value.count)||Number(value.count)<1)return bad();
  const signal=ruleSet.rules.find(r=>r.id===value.ruleId)?.signals.find(s=>s.id===value.signalId),channel=value.channel as BrowserWitnessChannel;
  if(!signal||!witnessAllowed(signal,channel))return bad();
  const readable=channel==='resource-entry'?capture.coverage.resources:channel==='dom-reference'||channel==='dom-marker'?capture.coverage.dom:channel==='own-global'?input.coverage.globals:channel==='cookie-name'?capture.coverage.cookies:channel==='localStorage-name'?capture.coverage.localStorage:capture.coverage.sessionStorage;
  if(readable==='unavailable'||input.mode==='origins-and-names'&&(signal.kind==='global'||signal.kind==='marker'||signal.kind==='resource'&&signal.path!==null))return bad();
  const key=JSON.stringify([value.ruleId,value.signalId,channel]);if(seen.has(key))return bad();seen.add(key);
 }
 if(new TextEncoder().encode(JSON.stringify(input)).length>2*1024*1024)return bad();
 return JSON.parse(JSON.stringify({...input,ruleSet,capture})) as BrowserCatalogCapture;
}
export interface BrowserCatalogFinding {productId:string;productName:string;providerId:string;providerName:string;reviewRequired:true;status:'matched'|'partial';rules:{id:string;revision:string;status:'matched'|'partial';groups:{allOf:string[];observed:string[];matched:boolean}[];evidence:BrowserWitness[]}[]}
export interface BrowserCatalogReview {schemaVersion:1;kind:'catalog-browser-review';capture:BrowserCatalogCapture;findings:BrowserCatalogFinding[];notes:string[]}
/** Derive review candidates from the exact reported snapshot. This never attests that a service ran. */
export function analyzeBrowserCatalogCapture(input:unknown,options:{expectedRules?:unknown}={}):BrowserCatalogReview {
 const capture=normalizeBrowserCatalogCapture(input,options),byProduct=new Map<string,BrowserCatalogFinding>();
 for(const rule of capture.ruleSet.rules){const evidence=capture.evidence.filter(e=>e.ruleId===rule.id);if(!evidence.length)continue;const seen=new Set(evidence.map(e=>e.signalId)),groups=rule.anyOf.map(group=>({allOf:[...group.allOf],observed:group.allOf.filter(id=>seen.has(id)),matched:group.allOf.every(id=>seen.has(id))}));
  const product=capture.ruleSet.catalog.products.find(p=>p.id===rule.productId)!,provider=capture.ruleSet.catalog.providers.find(p=>p.id===product.providerId)!,status=groups.some(g=>g.matched)?'matched':'partial';
  const finding=byProduct.get(product.id)??{productId:product.id,productName:product.name,providerId:provider.id,providerName:provider.name,reviewRequired:true,status,rules:[]};finding.rules.push({id:rule.id,revision:rule.revision,status,groups,evidence});if(status==='matched')finding.status='matched';byProduct.set(product.id,finding);
 }
 return {schemaVersion:1,kind:'catalog-browser-review',capture,findings:[...byProduct.values()],notes:[
  'Witnesses and labels are unverified browser reports. A matched technical pattern is a candidate for actual-use review, not proof of execution, transmission, ownership, permission or legal classification.',
  'DOM references, buffered resource entries, current storage names, DOM markers and own-global presence remain distinct. Combined signals were observed within this bounded capture; they need not be simultaneous or causally related.',
  'Recognition adds no raw observed paths, query values, storage values or global contents. The embedded version-1 capture still contains origins, storage names and operator labels, which may include identifiers. Static rule patterns and sources are retained in the snapshot.',
  'Rules are analyzed from the captured snapshot. A revision label is not authentication; use expectedRules to compare exact metadata from a separately trusted source.',
  ...(capture.mode==='origins-and-names'?['This is retrospective version-1 analysis. URL paths, globals and DOM markers were not captured; rules requiring them cannot be satisfied.']:[]),
  'Missing, partial, limited or unavailable observations never establish absence. No probe, SDK invocation, configuration change, automatic activation, legal score or CI policy is supplied.',
 ]};
}
