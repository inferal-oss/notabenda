// @requirements REQ-PRODUCT-RIGHTS-CENTER
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {evaluate} from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import * as runtime from 'react/jsx-runtime';
import type {ComponentType,JSX} from 'react';
import type {MDXComponents} from 'mdx/types.js';
import type {Root,Element} from 'hast';
import {toPublicConfig} from 'notabenda';
import type {DocumentKind,LegalDocument,PublicSiteConfig,ValidationOptions} from 'notabenda';
import {compileLegalDocuments,canonicalJson,sha256} from 'notabenda/content';
import type {LegalBuild,LegalSourceArchive,AuthoredDocumentDescriptor} from 'notabenda/content';
import {AuthoringError,parseDocumentSource} from './frontmatter.js';
import {parseHtml,printHtml,prepareHtml,elements} from './html.js';
export {AuthoringError,parseDocumentSource,MAX_SOURCE_BYTES} from './frontmatter.js';
export type {Frontmatter} from './frontmatter.js';

/** React components are build-time only. This public type does not require MDX's legacy global JSX namespace. */
export interface StaticComponents {[name:string]:ComponentType<any>|keyof JSX.IntrinsicElements|StaticComponents}
export interface DocumentSource {
  format:'md'|'mdx'; source:string;
  /** Trusted build-time component implementations, not browser-delivered functions. */
  components?:StaticComponents;
  /** Operator-supplied component-set revision; output hashes independently bind the rendered result. */
  componentsRevision?:string;
  /** Explicit file URL for resolving trusted MDX imports. Omitted from public artifacts and private source descriptors. */
  baseUrl?:URL;
}
export interface AuthoredLegalBuild extends LegalBuild {
  archive:LegalSourceArchive;
  /** Safe static article fragments for a host-owned page shell. */
  fragments:Record<DocumentKind,string>;
}
const kinds=['privacy','cookies','terms'] as const;
function findElement(root:Root|Element,predicate:(element:Element)=>boolean):Element|undefined {
  for(const node of elements(root)){if(predicate(node))return node;const found=findElement(node,predicate);if(found)return found;}return undefined;
}
function assertPlainMarkdown(){
  return (tree:unknown)=>{
    function visit(value:unknown):void {
      if(!value||typeof value!=='object')return;
      const node=value as {type?:unknown;children?:unknown};
      if(node.type==='html')throw new AuthoringError('unsupported-content','Use Markdown formatting or an MDX document for trusted custom markup/components. Raw HTML is not enabled in Markdown.');
      if(Array.isArray(node.children))for(const child of node.children)visit(child);
    }
    visit(tree);
  };
}
function revision(source:DocumentSource):string {
  const label=source.componentsRevision??(source.format==='mdx'?'inline':'none');
  if(typeof label!=='string'||!label.trim()||new TextEncoder().encode(label).length>200||/[\u0000-\u001f\u007f]/u.test(label)||source.components&&Object.keys(source.components).length>0&&!source.componentsRevision)throw new AuthoringError('invalid-source','Provide a short componentsRevision when supplying a custom component map.');
  return label;
}

/** Read a local project source explicitly. No path or filename is copied into release metadata. */
export async function readDocumentSource(file:string|URL,options:Omit<DocumentSource,'format'|'source'|'baseUrl'>={}):Promise<DocumentSource> {
  const url=file instanceof URL?file:pathToFileURL(resolve(file));
  if(url.protocol!=='file:')throw new AuthoringError('invalid-source','Read an explicit local .md or .mdx project file.');
  const format=url.pathname.endsWith('.mdx')?'mdx':url.pathname.endsWith('.md')?'md':undefined;
  if(!format)throw new AuthoringError('invalid-source','Use a .md or .mdx source file.');
  let source:string;
  try{source=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await readFile(url));}catch{throw new AuthoringError('invalid-source','The local document could not be read as UTF-8.');}
  return {...options,format,source,baseUrl:url};
}

/** @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-SAFE-CONTENT
 * Trusted build-time MDX evaluation. The default browser core has no authoring/compiler/React dependency.
 */
export async function compileAuthoredDocuments(input:unknown,sources:Partial<Record<DocumentKind,DocumentSource>>,options:ValidationOptions&{stylesheetUrl?:string}={}):Promise<AuthoredLegalBuild> {
  if(!sources||typeof sources!=='object'||Array.isArray(sources)||Object.keys(sources).some(kind=>!kinds.includes(kind as DocumentKind))||!Object.keys(sources).length)throw new AuthoringError('invalid-source','Provide at least one source under privacy, cookies or terms.');
  const mode=options.mode??'production';const config=toPublicConfig(input);const working=structuredClone(config);
  const prepared=new Map<DocumentKind,ReturnType<typeof parseDocumentSource>>();
  for(const kind of kinds){
    const source=sources[kind];if(!source)continue;
    if(!['md','mdx'].includes(source.format)||source.baseUrl!==undefined&&(!(source.baseUrl instanceof URL)||source.baseUrl.protocol!=='file:'))throw new AuthoringError('invalid-source','Use md/mdx format and an optional explicit file base URL.');
    revision(source);
    const parsed=parseDocumentSource(source.source,kind);prepared.set(kind,parsed);
    const {sectionIds:_,kind:__,...metadata}=parsed.metadata;
    working.documents[kind]={...metadata,sections:[{id:'authoring-preview',heading:'Source content',paragraphs:['Source content is compiled after metadata validation.']}]};
  }
  // Reject bad metadata, collisions and unreviewed production content BEFORE evaluating trusted MDX.
  toPublicConfig(working,{mode});
  const sectionNodes=new Map<DocumentKind,Awaited<ReturnType<typeof prepareHtml>>>();
  for(const [kind,parsed] of prepared){
    const source=sources[kind]!;let html:string;
    try {
      const module=await evaluate(parsed.body,{...runtime,format:source.format,development:false,remarkPlugins:source.format==='md'?[remarkGfm,assertPlainMarkdown]:[remarkGfm],...(source.baseUrl?{baseUrl:source.baseUrl}:{})});
      // renderToString preserves an incomplete Suspense boundary marker; static markup silently discards it.
      // The HTML policy rejects that marker before normalization, projection or publication.
      html=renderToString(createElement(module.default,{components:(source.components??{}) as unknown as MDXComponents,config:toPublicConfig(working),site:config.site}));
    }catch(error){if(error instanceof AuthoringError)throw error;throw new AuthoringError('render-failed',`The ${kind} source could not compile/render. Check trusted MDX imports, component mappings and syntax; no source text is included in this error.`);}
    const sections=await prepareHtml(html,kind,parsed.metadata.route,parsed.metadata.sectionIds);
    sectionNodes.set(kind,sections);working.documents[kind].sections=sections.map(section=>section.model);
  }
  const base=compileLegalDocuments(working,options);const publicConfig:PublicSiteConfig=base.publicConfig;
  const pages={...base.artifact.pages};const models=structuredClone(base.artifact.documents);const bodies:Partial<Record<DocumentKind,string>>={};
  const attachments:LegalSourceArchive['sourceAttachments']={};const descriptors=structuredClone(base.manifest.documents);
  for(const [kind,sections] of sectionNodes){
    const source=sources[kind]!;const descriptor=descriptors.find(d=>d.kind===kind)!;
    const generated=working.documents[kind].source==='generated';
    const tree=parseHtml(pages[descriptor.file]!,false);const article=findElement(tree,node=>node.tagName==='article'&&node.properties.dataDocumentKind===kind);
    if(!article)throw new AuthoringError('render-failed','The legal document shell is missing its article.');
    const custom=new Map(sections.map(s=>{
      const id=(generated?'additional-':'')+s.model.id;
      const node=structuredClone(s.node);node.properties.id=`nb-${kind}-section-${id}`;
      if(generated){
        const prefix=`nb-${kind}-section-`;
        function references(n:Element):void {
          if(typeof n.properties.href==='string'&&n.properties.href.startsWith('#'+prefix))n.properties.href=n.properties.href.replace('#'+prefix,'#'+prefix+'additional-');
          for(const key of ['ariaLabelledBy','ariaDescribedBy'])if(typeof n.properties[key]==='string')n.properties[key]=n.properties[key].split(/\s+/u).map(value=>value.startsWith(prefix)?prefix+'additional-'+value.slice(prefix.length):value).join(' ');
          for(const child of elements(n))references(child);
        }
        references(node);
      }
      return [id,node];
    }));
    const bodyNodes=elements(article).filter(node=>node.tagName==='section').map(node=>{
      const id=String(node.properties.id??'').replace(`nb-${kind}-section-`,'');return custom.get(id)??node;
    });
    const body=printHtml({type:'root',children:bodyNodes});const bodySha256=sha256(body);bodies[kind]=body;
    const wrapper:Element={type:'element',tagName:'div',properties:{className:['nb-authored'],dataBodySha256:bodySha256},children:bodyNodes};
    const first=article.children.findIndex(node=>node.type==='element'&&node.tagName==='section');
    article.children=article.children.filter(node=>node.type!=='element'||node.tagName!=='section');article.children.splice(first,0,wrapper);
    const model:LegalDocument=models[kind];model.requirementIds=[...new Set([...model.requirementIds,'REQ-PRODUCT-AUTHORING' as const])];
    descriptor.requirementIds=[...model.requirementIds];
    const authoring:AuthoredDocumentDescriptor={schemaVersion:1,format:source.format,sourceSha256:sha256(source.source),sourceBytes:new TextEncoder().encode(source.source).length,bodySha256,renderer:'notabenda-authoring@0.1.0',policy:'static-html-v1',componentsRevision:revision(source)};
    descriptor.authoring=authoring;pages[descriptor.file]=printHtml(tree);descriptor.sha256=sha256(pages[descriptor.file]!);
    attachments[kind]={format:source.format,source:source.source};
  }
  const {artifactId:_,...old}=base.manifest;
  const manifestDescriptor={...old,documents:descriptors,requirementIds:[...new Set([...old.requirementIds,'REQ-PRODUCT-AUTHORING' as const])]};
  const manifest={...manifestDescriptor,artifactId:sha256(canonicalJson(manifestDescriptor))};
  const artifact={manifest,publicConfig,pages,documents:models,renderedBodies:bodies};
  const archive:LegalSourceArchive={schemaVersion:1,artifact,sourceAttachments:attachments};
  if(new TextEncoder().encode(canonicalJson(archive)).length>124*1024)throw new AuthoringError('archive-too-large','This release exceeds the combined 124 KiB build archive budget (4 KiB reserved for host metadata). Reduce the source/output size or use a reviewed larger-archive adapter.');
  const fragments=Object.fromEntries(kinds.map(kind=>{const d=descriptors.find(d=>d.kind===kind)!;const article=findElement(parseHtml(pages[d.file]!,false),n=>n.tagName==='article');return [kind,article?printHtml(article):''];})) as Record<DocumentKind,string>;
  return {publicConfig,manifest,artifact,archive,fragments,files:{...(publicConfig.rightsCenter?{[publicConfig.rightsCenter.route.slice(1)+'/index.html']:base.files[publicConfig.rightsCenter.route.slice(1)+'/index.html']!}:{}),...pages,...Object.fromEntries(descriptors.map(d=>[`artifacts/${manifest.artifactId}/${d.kind}.html`,pages[d.file]!])), 'notabenda.public.json':canonicalJson(publicConfig)+'\n','notabenda.manifest.json':canonicalJson(manifest)+'\n',[`artifacts/${manifest.artifactId}.json`]:canonicalJson(artifact)+'\n'}};
}
