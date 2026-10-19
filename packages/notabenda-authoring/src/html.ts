import {unified} from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type {Root,RootContent,Element,ElementContent,Nodes} from 'hast';
import type {DocumentKind,LegalSection} from 'notabenda';
import {sha256} from 'notabenda/content';
import {AuthoringError} from './frontmatter.js';

const tags=['a','p','h2','h3','h4','h5','h6','strong','em','del','ul','ol','li','blockquote','pre','code','hr','br','div','span','aside','section','details','summary','table','thead','tbody','tfoot','tr','th','td','caption','img','sup','sub'];
const globalAttributes=['id','className','title','lang','dir','role','ariaLabel','ariaLabelledBy','ariaDescribedBy','ariaHidden'];
const attributes:Record<string,string[]>={'*':globalAttributes,a:['href','rel','target'],img:['src','alt','width','height','loading','decoding'],ol:['start'],th:['scope','colSpan','rowSpan','align'],td:['colSpan','rowSpan','align'],details:['open']};
const unsupported=(detail:string):never=>{throw new AuthoringError('unsupported-content',detail);};
export const parseHtml=(html:string,fragment=true):Root=>unified().use(rehypeParse,{fragment}).parse(html) as Root;
export const printHtml=(node:Root|Element):string=>String(unified().use(rehypeStringify).stringify(node.type==='root'?node:{type:'root',children:[node]}));
export function elements(node:Root|Element):Element[]{return (node.children as RootContent[]).filter((v):v is Element=>v.type==='element');}
function walk(node:Root|Element,visit:(node:Element)=>void):void {for(const child of elements(node)){visit(child);walk(child,visit);}}
function cleanUrl(value:unknown,route:string,image=false):string {
  if(typeof value!=='string'||/[\s\u0000-\u001f\u007f\\]/u.test(value)||/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/iu.test(value)||value.startsWith('//'))return unsupported('Use safe same-origin image paths and HTTPS, mailto, relative or fragment links.');
  if(value.startsWith('#')&&!image)return value;
  if(/^mailto:[a-zA-Z0-9.!$&'*+/=^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/u.test(value)&&!image)return value;
  try {
    const url=new URL(value,`https://notabenda.invalid${route}/`);
    if(url.protocol!=='https:'||url.username||url.password||image&&url.origin!=='https://notabenda.invalid')return unsupported('Images must use local paths; external links must use HTTPS.');
    return url.origin==='https://notabenda.invalid'?url.pathname+url.search+url.hash:url.href;
  }catch{return unsupported('Invalid content URL.');}
}

/** Readable projection includes link destinations, image alternatives, lists and table boundaries. */
export function readable(node:Nodes):string {
  if(node.type==='text')return node.value;
  if(node.type!=='element'&&node.type!=='root')return '';
  const contents=node.children.map(readable).join('');
  if(node.type==='root')return contents;
  if(node.tagName==='a')return `${contents} (${String(node.properties.href??'')})`;
  if(node.tagName==='img')return String(node.properties.alt??'')?`Image: ${String(node.properties.alt)}`:'';
  if(node.tagName==='br')return '\n';
  if(node.tagName==='li')return `• ${contents.trim()}\n`;
  if(['th','td'].includes(node.tagName))return contents.trim()+' | ';
  if(['p','blockquote','pre','ul','ol','table','tr','h2','h3','h4','h5','h6','aside','details','section','div'].includes(node.tagName))return contents.trim()+'\n\n';
  return contents;
}
export interface AuthoredSection {model:LegalSection;node:Element}

/** @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-SAFE-CONTENT
 * Validate and sanitize the actual component output before hashing, projection or publication.
 */
export async function prepareHtml(html:string,kind:DocumentKind,route:string,sectionIds:Record<string,string>):Promise<AuthoredSection[]> {
  if(new TextEncoder().encode(html).length>49152)return unsupported('Rendered document exceeds the 48 KiB body limit.');
  if(/<!--\$!/u.test(html))return unsupported('Static policy components must finish rendering without a suspended fallback.');
  const root=parseHtml(html);
  // React can inject image preload hints during SSR. They are not legal content and are omitted.
  root.children=root.children.filter(node=>!(node.type==='element'&&node.tagName==='link'&&node.properties.rel instanceof Array&&node.properties.rel.includes('preload')&&node.properties.as==='image'));
  walk(root,node=>{
    if(!tags.includes(node.tagName))return unsupported(`Unsupported static content element: ${node.tagName}.`);
    const allowed=[...globalAttributes,...(attributes[node.tagName]??[])];
    for(const key of Object.keys(node.properties))if(!allowed.includes(key))return unsupported(`Unsupported static content attribute: ${key}. Use classes instead of inline styling or handlers.`);
    if(node.tagName==='a'){
      node.properties.href=cleanUrl(node.properties.href,route);
      if(node.properties.target!==undefined&&node.properties.target!=='_blank'&&node.properties.target!=='_self')return unsupported('Unsupported link target.');
      if(node.properties.target==='_blank')node.properties.rel=['noopener','noreferrer'];
    }
    if(node.tagName==='img'){
      node.properties.src=cleanUrl(node.properties.src,route,true);
      if(typeof node.properties.alt!=='string')return unsupported('Images need an explicit alternative, including empty alt for decorative images.');
      node.properties.loading='lazy';node.properties.decoding='async';
    }
  });
  const clean=await unified().use(rehypeSanitize,{tagNames:tags,attributes,clobber:[],protocols:{href:['https','mailto'],src:[]}}).run(root) as Root;
  const sections:AuthoredSection[]=[];const anchors=new Map<string,string>();const allocated=new Set<string>();const usedMappings=new Set<string>();
  let current:AuthoredSection|undefined;
  function section(heading:string,rawId:string):AuthoredSection {
    if(!/^[a-z][a-z0-9-]{0,119}$/u.test(rawId)||allocated.has(rawId))return unsupported('Section IDs must be unique lowercase slugs. Use frontmatter sectionIds or an MDX heading id.');
    allocated.add(rawId);const id=`nb-${kind}-section-${rawId}`;anchors.set(rawId,id);
    const value:AuthoredSection={model:{id:rawId,heading},node:{type:'element',tagName:'section',properties:{id},children:[{type:'element',tagName:'h2',properties:{},children:[{type:'text',value:heading}]}]}};
    sections.push(value);return value;
  }
  for(const node of clean.children){
    if(node.type==='text'&&!node.value.trim())continue;
    if(node.type==='comment')continue;
    if(node.type==='element'&&node.tagName==='h2'){
      const heading=readable({type:'root',children:node.children as RootContent[]}).trim();if(!heading)return unsupported('Section headings must have readable text.');
      const mapped=Object.hasOwn(sectionIds,heading)?sectionIds[heading]:undefined;if(mapped)usedMappings.add(heading);
      const auto=heading.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/gu,'').replace(/[^a-z0-9]+/gu,'-').replace(/^-|-$/gu,'');
      const id=typeof node.properties.id==='string'?node.properties.id:mapped??(auto&&/^[a-z]/u.test(auto)?auto.slice(0,120):`section-${sha256(heading).slice(0,12)}`);
      const {id:_,...properties}=node.properties;
      current=section(heading,id);current.node.children[0]={...node,properties};continue;
    }
    current??=section('Introduction','introduction');current.node.children.push(node as ElementContent);
  }
  if(!sections.length||Object.keys(sectionIds).some(heading=>!usedMappings.has(heading)))return unsupported('Provide content and ensure each frontmatter sectionIds heading exists.');
  for(const s of sections){
    walk(s.node,node=>{
      if(node===s.node)return;
      const raw=node.properties.id;
      if(raw!==undefined){if(typeof raw!=='string'||!/^[a-z][a-z0-9-]{0,119}$/u.test(raw)||anchors.has(raw))return unsupported('Content anchor IDs must be unique lowercase slugs.');const id=`nb-${kind}-authored-${raw}`;anchors.set(raw,id);node.properties.id=id;}
    });
  }
  for(const s of sections){
    walk(s.node,node=>{
      if(node.tagName==='a'&&typeof node.properties.href==='string'&&node.properties.href.startsWith('#')){const id=anchors.get(node.properties.href.slice(1));if(!id)return unsupported('A local content link has no matching heading or anchor.');node.properties.href='#'+id;}
      for(const key of ['ariaLabelledBy','ariaDescribedBy'])if(node.properties[key]!==undefined){const value=node.properties[key];const tokens=Array.isArray(value)?value.map(String):String(value).split(/\s+/u);const ids=tokens.map(raw=>anchors.get(raw));if(ids.some(id=>!id))return unsupported('An ARIA reference has no matching content anchor.');node.properties[key]=ids.join(' ');}
    });
    const body:Root={type:'root',children:s.node.children.slice(1) as RootContent[]};
    const text=readable(body).trim();if(!text)return unsupported('Each section needs readable content after its heading.');s.model.paragraphs=[text];
  }
  function wrapTables(node:Root|Element):void {
    for(const child of elements(node))wrapTables(child);
    node.children=node.children.map(child=>child.type==='element'&&child.tagName==='table'?{type:'element',tagName:'div',properties:{className:['nb-table-scroll'],role:'region',ariaLabel:'Document table',tabIndex:0},children:[child]}:child) as ElementContent[];
  }
  for(const section of sections)wrapTables(section.node);
  return sections;
}
