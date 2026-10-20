// @requirements REQ-PRODUCT-AUTHORED-PREVIEW REQ-PRODUCT-SAFE-CONTENT
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalJson,normalizePublicLegalArtifact} from '@notabenda/core/content';
import {renderRightsPage} from '@notabenda/core';
import type {DocumentKind,ValidationOptions} from '@notabenda/core';
import {parseHtml,printHtml,elements} from './html.js';
import type {Element,RootContent} from 'hast';
import {publicReleaseZip} from './preview-zip.js';
export interface AuthoredPreviewOptions extends ValidationOptions {initialDocument?:DocumentKind;stylesheet?:string;stylesheetUrl?:string}
export interface AuthoredReleasePreview {artifactId:string;zipSha256:string;publicFiles:Record<string,string>;files:Record<string,string|Uint8Array>}
const e=(s:string)=>s.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
const digest=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex');
const fail=():never=>{throw Error('Supply an intact compiler build with its exact public files. Keep private source archives separate.');};
const own=(v:unknown,k:string):unknown=>{if(!v||typeof v!=='object')return fail();const d=Object.getOwnPropertyDescriptor(v,k);return d&&Object.hasOwn(d,'value')?d.value:fail();};
const tags=new Set('article header footer nav address h1 h2 h3 h4 h5 h6 p strong em del ul ol li blockquote pre code hr br div span aside section details summary table thead tbody tfoot tr th td caption sup sub dl dt dd time a'.split(' '));
const attributes=new Set('id className title lang dir role ariaLabel ariaLabelledBy ariaDescribedBy ariaHidden scope colSpan rowSpan start open dateTime dataDocumentKind dataDocumentVersion'.split(' '));
/** Parse without executing. Rebuild a static article: no URLs, forms, foreign content or executable attributes survive. */
function readingArticle(html:string):string {
 const tree=parseHtml(html,false);let article:Element|undefined;
 const find=(node:Element|ReturnType<typeof parseHtml>):void=>{for(const child of elements(node)){if(child.tagName==='article'&&child.properties.className instanceof Array&&child.properties.className.includes('nb-document')){if(article)return fail();article=child;}find(child);}};find(tree);if(!article)return fail();
 function clean(node:RootContent):RootContent[]{
  if(node.type==='text')return [{type:'text',value:node.value}];if(node.type!=='element')return [];
  if(node.tagName==='img'){const alt=typeof node.properties.alt==='string'?node.properties.alt:'',src=typeof node.properties.src==='string'?node.properties.src:'';return [{type:'element',tagName:'p',properties:{className:['nb-preview-image']},children:[{type:'text',value:alt?'Image not loaded: '+alt+' ('+src+')':'Decorative image not loaded'+(src?' ('+src+')':'')}]}];}
  if(!tags.has(node.tagName))return [];
  const properties=Object.fromEntries(Object.entries(node.properties).filter(([key])=>attributes.has(key)));
  if(node.tagName==='a'){properties.role='link';properties.ariaDisabled='true';properties.title='Link disabled in this preview.';}
  return [{type:'element',tagName:node.tagName,properties,children:node.children.flatMap(child=>clean(child as RootContent)) as Element['children']}];
 }
 const cleaned=clean(article)[0];if(cleaned?.type!=='element')return fail();return printHtml(cleaned);
}
/** Build-time only. No MDX evaluation, filesystem writes, requests, source export or second compilation. */
export async function createAuthoredReleasePreview(build:unknown,options:AuthoredPreviewOptions={}):Promise<AuthoredReleasePreview>{
 if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options)))return fail();
 for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key)!;if(typeof key!=='string'||!['mode','initialDocument','stylesheet','stylesheetUrl'].includes(key)||!d.enumerable||!Object.hasOwn(d,'value'))return fail();}
 options={...options};
 if(options.mode!==undefined&&!['preview','production'].includes(options.mode)||options.initialDocument!==undefined&&!['privacy','cookies','terms'].includes(options.initialDocument))return fail();
 const artifact=normalizePublicLegalArtifact(own(build,'artifact'),{mode:options.mode??'production'}),rawFiles=own(build,'files');
 if(!rawFiles||typeof rawFiles!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(rawFiles)))return fail();
 const id=artifact.manifest.artifactId,expected:Record<string,string>={...artifact.pages,...Object.fromEntries(artifact.manifest.documents.map(d=>['artifacts/'+id+'/'+d.kind+'.html',artifact.pages[d.file]!])),['artifacts/'+id+'.json']:canonicalJson(artifact)+'\n','notabenda.public.json':canonicalJson(artifact.publicConfig)+'\n','notabenda.manifest.json':canonicalJson(artifact.manifest)+'\n'};
 const stylesheetUrl=options.stylesheetUrl??'/assets/notabenda.css';if(!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.css$/u.test(stylesheetUrl)||stylesheetUrl!=='/assets/notabenda.css'&&options.stylesheet===undefined||options.stylesheet!==undefined&&(typeof options.stylesheet!=='string'||Buffer.byteLength(options.stylesheet)>128*1024))return fail();
 if(artifact.publicConfig.rightsCenter){const page=artifact.publicConfig.rightsCenter;expected[page.route.slice(1)+'/index.html']=renderRightsPage(artifact.publicConfig,{mode:artifact.manifest.mode,stylesheetUrl});}
 if(Reflect.ownKeys(rawFiles).length!==Object.keys(expected).length||Object.keys(expected).some(path=>own(rawFiles,path)!==expected[path]))return fail();
 // Require the export's supplied stylesheet to be the one the original pages reference.
 for(const d of artifact.manifest.documents){const tree=parseHtml(expected[d.file]!,false),links:Element[]=[];const visit=(n:Element|typeof tree)=>{for(const c of elements(n)){if(c.tagName==='link'&&Array.isArray(c.properties.rel)&&c.properties.rel.includes('stylesheet'))links.push(c);visit(c);}};visit(tree);if(links.length!==1||links[0]!.properties.href!==stylesheetUrl)return fail();}
 const stylesheet=options.stylesheet??await readFile(new URL(import.meta.resolve('@notabenda/core/styles.css')),'utf8');if(Object.hasOwn(expected,stylesheetUrl.slice(1)))return fail();
 const publicFiles={...expected,[stylesheetUrl.slice(1)]:stylesheet},zip=publicReleaseZip(publicFiles),readerCss=await readFile(new URL('./preview.css',import.meta.url),'utf8'),frameCss='body{margin:0;background:#fff;color:#26232b;font-family:ui-sans-serif,system-ui,sans-serif}.nb-document{padding:1.5rem;max-width:49rem;display:block}.nb-document>.nb-contents{position:static;max-height:none}.nb-document a[aria-disabled=true]{color:inherit;text-decoration:none;cursor:default}.nb-preview-image{border:1px dashed #b8b4bf;padding:1rem;color:#65616d;font-size:.875rem}';
 const initial=options.initialDocument??artifact.manifest.documents.find(d=>d.authoring)?.kind??'privacy';
 const documents=[...artifact.manifest.documents].sort((a,b)=>Number(b.kind===initial)-Number(a.kind===initial));
 const cards=documents.map(d=>{
  const csp="default-src 'none'; style-src 'self'; img-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'",frame=`<!doctype html><html lang="${e(artifact.publicConfig.site.locale)}" dir="${artifact.publicConfig.localization?.direction??'ltr'}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><link rel="stylesheet" href="assets/documents.css"><link rel="stylesheet" href="assets/frame.css"><title>${e(d.title)}</title></head><body><main>${readingArticle(artifact.pages[d.file]!)}</main></body></html>`;
  return `<details class="preview-document" name="release-document"${d.kind===initial?' open':''}><summary><span><strong>${e(d.title)}</strong><span>${e(d.version)} · ${e(d.effectiveDate)}</span></span><span class="preview-format">${d.authoring?d.authoring.format==='mdx'?'MDX':'Markdown':'Configuration'} · ${d.reviewStatus==='reviewed'?'Reviewed declaration':'Draft'}</span></summary><div class="preview-reading"><iframe title="${e(d.title)} — compiled preview" sandbox="allow-same-origin" referrerpolicy="no-referrer" srcdoc="${e(frame)}"></iframe><details class="preview-references"><summary>Version and file references</summary><dl><dt>Public route</dt><dd>${e(d.route)}</dd><dt>Original HTML SHA-256</dt><dd><code>${d.sha256}</code></dd>${d.authoring?`<dt>Source SHA-256</dt><dd><code>${d.authoring.sourceSha256}</code></dd><dt>Component set</dt><dd>${e(d.authoring.componentsRevision)}</dd>`:''}</dl></details></div></details>`;
 }).join('');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; frame-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'"><title>Compiled release · ${e(artifact.publicConfig.site.name)}</title><link rel="stylesheet" href="assets/reader.css"></head><body><a class="preview-skip" href="#main">Skip to documents</a><header class="preview-header"><a href="https://notabenda.org/guide/authoring/" rel="noreferrer">Notabenda / authoring</a><span>Local build preview</span></header><main id="main"><div class="preview-intro"><p class="preview-eyebrow">The compiled release</p><h1>${e(artifact.publicConfig.site.name)}</h1><p>Read the pages produced by your build, including Markdown and MDX components. Images, custom fonts and links are disabled in the document preview. The export keeps the original files.</p></div><aside class="preview-export" aria-label="Export this release"><div><h2>Keep this build</h2><p>Download the public files you are reviewing. Original source stays in your private archive.</p></div><div><a class="preview-download" href="release.zip" download="notabenda-release-${id.slice(0,12)}.zip">Download public release <span aria-hidden="true">↓</span></a><a href="artifact.json" download="artifact.json">Public artifact JSON</a></div></aside><section aria-label="Compiled documents">${cards}</section><details class="preview-release"><summary>Release identity and export contents</summary><p>Release <code>${id}</code></p><p>Artifact mode: ${artifact.manifest.mode}</p><p>ZIP SHA-256 <code>${digest(zip)}</code></p><ul>${Object.keys(publicFiles).sort().map(path=>`<li><code>${e(path)}</code></li>`).join('')}</ul></details><p class="preview-next"><a href="https://notabenda.org/guide/publication-check/" rel="noreferrer">Check these files after deployment ↗</a>. Matching files does not verify installation or legal compliance.</p></main></body></html>`;
 return {artifactId:id,zipSha256:digest(zip),publicFiles,files:{'index.html':html,'assets/reader.css':readerCss,'assets/documents.css':stylesheet,'assets/frame.css':frameCss,'release.zip':zip,'artifact.json':expected['artifacts/'+id+'.json']!}};
}
