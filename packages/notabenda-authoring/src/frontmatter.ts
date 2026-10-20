import {parseDocument,visit} from 'yaml';
import type {DocumentKind,DocumentConfig} from '@notabenda/core';

export const MAX_SOURCE_BYTES=24576;
export class AuthoringError extends Error {
  constructor(readonly code:'invalid-source'|'invalid-frontmatter'|'unsupported-content'|'render-failed'|'archive-too-large',message:string){super(message);this.name='AuthoringError';}
}
export interface Frontmatter extends Omit<DocumentConfig,'sections'> {kind:DocumentKind;sectionIds:Record<string,string>}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const slug=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,119}$/u.test(v);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.trim().length>0&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
const invalid=():never=>{throw new AuthoringError('invalid-frontmatter','Use document YAML frontmatter with kind, title, route, version, effectiveDate and review.status. Unknown fields, aliases, tags and duplicate keys are not accepted.');};

/** @requirements REQ-PRODUCT-AUTHORING: document metadata only; shared inventory stays in site configuration. */
export function parseDocumentSource(source:string,kind:DocumentKind):{metadata:Frontmatter;body:string} {
  if(typeof source!=='string'||new TextEncoder().encode(source).length>MAX_SOURCE_BYTES||source.includes('\0'))throw new AuthoringError('invalid-source','A document source must be nonempty UTF-8 text, at most 24 KiB.');
  const match=/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/u.exec(source);
  if(!match||new TextEncoder().encode(match[1]!).length>8192||!match[2]!.trim())return invalid();
  let data:unknown;
  try {
    const doc=parseDocument(match[1]!,{schema:'core',uniqueKeys:true,version:'1.2'});
    if(doc.errors.length||doc.warnings.length)return invalid();
    visit(doc,(_key,node)=>{if(node && typeof node==='object' && 'tag' in node && node.tag)return invalid();});
    data=doc.toJS({maxAliasCount:0});
  }catch{return invalid();}
  if(!object(data)||Object.keys(data).some(k=>!['kind','title','route','version','effectiveDate','source','review','sectionIds'].includes(k))||data.kind!==kind||!text(data.title,300)||!text(data.route,300)||!text(data.version,200)||!text(data.effectiveDate,10)||!object(data.review)||Object.keys(data.review).length!==1||!['draft','reviewed'].includes(String(data.review.status))||typeof data.review.status!=='string'||data.source!==undefined&&data.source!=='supplied'&&data.source!=='generated')return invalid();
  const ids=data.sectionIds??{};
  if(!object(ids)||Object.keys(ids).length>100||Object.entries(ids).some(([heading,id])=>!text(heading,300)||!slug(id))||new Set(Object.values(ids)).size!==Object.keys(ids).length)return invalid();
  return {metadata:{kind,title:data.title,route:data.route,version:data.version,effectiveDate:data.effectiveDate,source:data.source==='generated'?'generated':'supplied',review:{status:data.review.status as 'draft'|'reviewed'},sectionIds:ids as Record<string,string>},body:match[2]!};
}
