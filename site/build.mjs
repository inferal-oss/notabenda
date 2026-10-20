// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
import {websiteFooter} from './footer.mjs';
// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-CARTRIDGES
import {cartridgePage} from './cartridge-page.mjs';
import {cartridgeLibrary} from '@notabenda/core/cartridges';
import {packDirectory,expandPackDirectory} from './pack-directory.mjs';
import {build as buildCartridgeApp} from 'esbuild';
// @requirements REQ-PRODUCT-COMPLIANCE-MAP
import {expandComplianceDiagrams} from './compliance-diagrams.mjs';
import {catalogReleaseExample} from '../examples/catalog-releases/build.mjs';
import {websiteNoticeFacts,websiteNoticeBody} from './website-notice.mjs';
// @requirements REQ-PRODUCT-SYNTAX-HIGHLIGHTING
// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
// @requirements REQ-PRODUCT-CF-HOST
import {createCodeHighlighter} from './syntax.mjs';
import {examplesBody} from './examples-page.mjs';
import {siteSections,guideNavigation,sectionForGuide,exampleSectionUrl,guideSectionUrl,guideContext,starterPath,stageOverview,guideOrientation} from './navigation.mjs';
import {guideLanding,allGuidePages,guideArea} from './guide-pages.mjs';
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {describeIntegration} from '@notabenda/core/integration';
import {markdownRoute,rewriteMarkdown,skillFiles} from './agent-docs.mjs';
import {createDocumentationLinkResolver} from './documentation-links.mjs';
import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname, extname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import { compileLegalDocuments, createConsentNotice } from '@notabenda/core/content';
import { writeBuildFiles } from '../packages/notabenda/dist/files.js';
import { syntheticRecords } from '../packages/notabenda-cf/examples/synthetic.mjs';
import { exampleFiles } from '../examples/static/build.mjs';
import {markDemoPage} from './demo-marker.mjs';
import {exampleConsentConfig} from '../examples/static/choices-build.mjs';
import {retainedReleaseExample} from '../examples/releases/build.mjs';
import { authoringExample } from '../examples/authoring/build.mjs';

const root = new URL('../',import.meta.url).pathname;
const output = new URL('./dist/public',import.meta.url).pathname;
const read = path=>readFile(resolve(root,path),'utf8');
const escape = value=>String(value).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const websiteFacts=websiteNoticeFacts(process.env,{production:process.argv.includes('--production')});
const catalog = JSON.parse(await read('regulatory/catalog.json'));
const syntax=await createCodeHighlighter();
let pageHeadings=[],headingIds=new Set();
const markdownRenderer=new Marked({renderer:{
 code({text,lang}){return syntax.renderBlock(text+'\n',lang);},
 heading({tokens,depth,text}){
  const label=text.replace(/<[^>]*>/gu,'').replace(/[`*_]/gu,''),base=label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/gu,'')||'section';
  let id=base,count=1;while(headingIds.has(id))id=base+'-'+(++count);headingIds.add(id);
  if(depth===2)pageHeadings.push({id,label});
  return `<h${depth} id="${escape(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
 }
}});
function guideOutline(headings){return headings.length<3?'':`<details class="guide-outline"><summary>On this page <span>${headings.length} sections</span></summary><nav aria-label="On this page">${headings.map(h=>`<a href="#${escape(h.id)}">${escape(h.label)}</a>`).join('')}</nav></details>`;}
const style = await read('site/style.css')+'\n'+await read('site/footer.css')+'\n'+await read('site/compliance-diagrams.css');
const files = {'site.css':style,'assets/inferal-mark.svg':await read('site/assets/inferal-mark.svg')};
files['assets/demo-admin.css']=await read('site/demo-admin.css');
files['assets/order-admin.css']=await read('site/order-admin.css');
files['assets/demo-marker.css']=await read('site/demo-marker.css');
files['assets/website-notice.css']=await read('site/website-notice.css');
const media = [];
async function visit(directory,callback) {
  for(const entry of await readdir(resolve(root,directory),{withFileTypes:true})) {
    const path=posix.join(directory,entry.name);
    if(entry.isDirectory()) await visit(path,callback); else if(entry.isFile()) await callback(path);
  }
}
// Allowlisted source roots only. Never scan the workspace for uploadable assets.
for(const [relative,content] of Object.entries(await exampleFiles())) {
  if(relative === 'index.html') files['examples/index.html']=content;
  // The website labels demo routes; retained releases keep their exact bytes.
  else files[relative]=relative.endsWith('.html')&&!relative.startsWith('artifacts/')&&typeof content==='string'?markDemoPage(content):content;
}
await visit('docs/assets',async path=>{ if(['.svg','.jpg','.png'].includes(extname(path))) media.push(path); });
const docs = new Map([['README.md','/guide/project'],['SECURITY.md','/guide/security'],['packages/notabenda/README.md','/guide/package'],['packages/notabenda-cf/README.md','/guide/cloudflare'],['packages/notabenda-authoring/README.md','/guide/authoring-package'],['regulatory/README.md','/guide/research'],['site/README.md','/guide/website'],['catalog/README.md','/guide/catalog-data'],['packages/notabenda/assets/guarantees/NOTICE.md','/guide/guarantee-asset-notice']]);
await visit('docs',async path=>{ if(path.endsWith('.md')) docs.set(path,'/guide/'+path.slice(5).replace(/\.md$/u,'').replace(/\/README$/u,'').toLowerCase()); });
const catalogRefs = new Set(catalog.requirements.flatMap(r=>[...r.implementationRefs,...r.testRefs]).map(x=>x.split('#')[0]));
for(const path of catalogRefs) if(/^(?:packages|scripts|examples|regulatory|catalog|site)\//u.test(path) && /\.(?:ts|mjs|json|py|css|astro|md|mdx)$/u.test(path)) files[`source/${path}.txt`]=await read(path);
files['source/regulatory/catalog.json.txt']=JSON.stringify(catalog,null,2)+'\n';
files['license.txt']=await read('LICENSE');
files['llms.txt']=await read('llms.txt');
const packageMetadata=JSON.parse(await read('packages/notabenda/package.json'));
files['integration-reference.json']=JSON.stringify({package:{name:packageMetadata.name,version:packageMetadata.version},...describeIntegration()},null,2)+'\n';
const configSchema=await read('packages/notabenda/dist/site-config.schema.json');
files['site-config.schema.json']=configSchema;
files[`schemas/${packageMetadata.version}/site-config.schema.json`]=configSchema;
for(const path of skillFiles)files['skills/notabenda/'+path]=await read('skills/notabenda/'+path);

function layout(title, body, {description='Self-hosted legal pages, privacy controls and document history.',guide=false,guideRoute='/guide'}={}) {
  const section=sectionForGuide(guideRoute);
  const agentLinks='<link rel="describedby" href="/llms.txt">'+(guide&&[...docs.values()].includes(guideRoute)?`<link rel="alternate" type="text/markdown" href="${markdownRoute(guideRoute)}">`:'');
  const breadcrumb=guide&&guideRoute!=='/guide'?`<nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/guide">Guide</a><span aria-hidden="true">/</span>${guideRoute.replace(/\/$/u,'')===guideSectionUrl(section).replace(/\/$/u,'')?`<span aria-current="page">${escape(section.title)}</span>`:`<a href="${guideSectionUrl(section)}">${escape(section.title)}</a>`}</nav>`:'';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(description)}"><title>${escape(title)} · Notabenda</title>${agentLinks}<link rel="icon" href="/docs/assets/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/assets/syntax.css"><link rel="stylesheet" href="/assets/website-notice.css"></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/" aria-label="Notabenda home"><img src="/docs/assets/mark.svg" width="36" height="36" alt=""><span>notabenda</span></a><nav aria-label="Main"><a href="/start">Packs <span class="nav-pack-count">${cartridgeLibrary().length}</span></a><a href="/guide">Guide</a><a href="/examples">Examples</a><a class="nav-action" href="/start">Get started <span aria-hidden="true">→</span></a></nav></header>${guide ? `<div class="guide-layout"><aside class="guide-nav guide-nav-desktop"><p class="eyebrow">Build with Notabenda</p>${guideNavigation(guideRoute,title)}<p class="hint">Developer preview.<br>Regional support is tracked item by item.</p></aside><details class="guide-nav guide-nav-mobile"><summary>Browse documentation <span aria-hidden="true">⌄</span></summary>${guideNavigation(guideRoute,title,{mobile:true})}</details><main id="main" class="prose">${breadcrumb}${body}${guideContext(guideRoute)}</main></div>` : `<main id="main">${body}</main>`}${websiteFooter()}</body></html>`;
}
files['website-privacy/index.html']=layout('Website privacy',websiteNoticeBody(websiteFacts),{description:'How this project website handles demo sessions, entries and browser storage.'});
files['examples/index.html']=layout('Examples',examplesBody(),{description:'Working examples grouped by privacy information, privacy choices, purchases, records and integration.'});
for(const section of siteSections)files['examples/'+section.id+'/index.html']=layout(section.title,examplesBody({sectionId:section.id}),{description:section.description});

function routeFile(route) { return route.slice(1)+'/index.html'; }
const rewrite=createDocumentationLinkResolver({docs,assets:[...Object.keys(files),...media],sources:[...catalogRefs].filter(path=>files[`source/${path}.txt`]!==undefined).map(path=>[path,`/source/${path}.txt`]).concat([['regulatory/catalog.json','/source/regulatory/catalog.json.txt']])});
const guideEntries=[];
for(const [path,route] of docs) {
  const sourceMarkdown = await read(path),markdown=expandPackDirectory(expandComplianceDiagrams(sourceMarkdown,{graphical:true}),{graphical:true});
  files[markdownRoute(route).slice(1)]=rewriteMarkdown(expandPackDirectory(expandComplianceDiagrams(sourceMarkdown)),href=>{
    const rewritten=rewrite(href,path),hash=rewritten.indexOf('#'),target=hash<0?rewritten:rewritten.slice(0,hash),fragment=hash<0?'':rewritten.slice(hash);
    return [...docs.values()].includes(target)?markdownRoute(target)+fragment:rewritten;
  });
  const title = /^# (.+)$/mu.exec(markdown)?.[1] ?? (path==='README.md'?'Project overview':'Guide');
  pageHeadings=[];headingIds=new Set();
  // Explicit anchors in trusted docs retain their address; generated headings avoid them.
  markdownRenderer.walkTokens(markdownRenderer.lexer(markdown),token=>{
   if(token.type==='html')for(const match of token.text.matchAll(/\bid=["']([^"']+)["']/gu))headingIds.add(match[1]);
  });
  let html = markdownRenderer.parse(markdown,{async:false,walkTokens(token){
    if(token.type==='link' || token.type==='image') token.href=rewrite(token.href,path);
    if(token.type==='html') token.text=token.text.replace(/(?:src|href)="([^"]+)"/gu,(match,href)=>match.replace(href,rewrite(href,path)));
  }});
  // @requirements REQ-PRODUCT-A11Y A logo-led README still needs a navigable page heading.
  if(!/<h1\b/iu.test(html))html='<h1>'+escape(title)+'</h1>'+html;
  // Local navigation is native HTML and works without a client script.
  const end=html.indexOf('</h1>')+5;
  if(end>4)html=html.slice(0,end)+guideOrientation(route)+guideOutline(pageHeadings)+html.slice(end);
  files[routeFile(route)] = layout(title,html,{guide:true,guideRoute:route});
  guideEntries.push({route,title});
}
for(const section of [...siteSections,sectionForGuide('/guide/requirements')])files[routeFile(guideSectionUrl(section).replace(/\/$/u,''))]=layout(section.title,guideArea(section,guideEntries),{guide:true,guideRoute:guideSectionUrl(section),description:section.description});
files['guide/index.html']=layout('Build with Notabenda',guideLanding(),{guide:true,guideRoute:'/guide'});
files['guide/all/index.html']=layout('All guides and reports',allGuidePages(guideEntries),{guide:true,guideRoute:'/guide/all'});
files['assets/cartridges.css']=await read('packages/notabenda/dist/cartridges.css');
const cartridgeApp=await buildCartridgeApp({entryPoints:[resolve(root,'site/cartridges-app.mjs')],external:['/assets/catalog-seed.mjs'],plugins:[{name:'local-preview-module',setup(build){build.onResolve({filter:/^\.\/setup-preview\.js$/},()=>({path:'/assets/runtime/setup-preview.js',external:true}));}}],bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',minify:true});
files['assets/cartridges.mjs']=cartridgeApp.outputFiles[0].text;
files['start/index.html']=layout('Choose your packs',cartridgePage(),{description:'Choose a compliance job, prepare a local draft and connect it to your site.'}).replace('</head>','<link rel="stylesheet" href="/assets/notabenda.css"><link rel="stylesheet" href="/assets/cartridges.css"><script type="module" src="/assets/cartridges.mjs"></script></head>');
const counts = {requirements:catalog.requirements.length,sources:catalog.sources.length,features:catalog.features.length};
files['index.html'] = layout('Legal pages and privacy controls',`
<section class="hero section"><div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span> Developer preview · Apache 2.0</p><h1>Compliance,<br><span class="hero-highlight">one pack<br>at a time.</span></h1><p class="lede">Start with a job your site needs. Prepare your legal pages, cookie choices or terms agreement, then connect them to your site.</p><div class="actions"><a class="button primary" href="/start">Choose a pack <span aria-hidden="true">→</span></a><a class="text-link" href="/examples">Browse examples <span aria-hidden="true">↗</span></a></div><p class="hint">Works with plain HTML, React and Astro.</p></div><figure class="hero-figure product-figure"><a class="product-preview" href="/demo/admin" aria-label="Explore the evidence workspace"><div class="product-preview-bar"><span class="product-preview-dot"></span><span>Evidence workspace</span><span aria-hidden="true">↗</span></div><img src="/docs/assets/screenshots/workspace-current.png" alt="Notabenda evidence workspace with search, document versions and recorded terms agreements." width="1698" height="808"></a><figcaption>Search choices, agreements and document revisions. <a href="/demo/admin">Explore the workspace →</a></figcaption></figure></section>
<section class="section home-start"><div class="section-intro"><p class="eyebrow">The pack library · ${cartridgeLibrary().length} packs</p><h2>Start with one.<br>See every option.</h2><p>Publish your pages, add a visitor control or keep the records behind it. All ${cartridgeLibrary().length} packs are here, grouped by the job they do.</p></div>${packDirectory()}<p><a class="text-link" href="/start">Browse all ${cartridgeLibrary().length} packs <span aria-hidden="true">→</span></a></p></section>
<section class="section home-paths"><div class="section-intro"><p class="eyebrow">When your site needs more</p><h2>Choose the next part</h2><p>Follow the path from site configuration to visitor controls and retained records. Open only the areas your site needs.</p></div>${stageOverview()}</section>
<section class="setup section"><div><p class="eyebrow">npm packages</p><h2>Install the parts<br>your site needs</h2><p>The core package has no runtime dependencies. Use its vanilla interface or build your own from the same headless controllers. Add <code>@notabenda/cloudflare</code> when you need a Cloudflare evidence workspace.</p><a class="text-link" href="/examples/integrations/">Choose your framework & backend <span aria-hidden="true">→</span></a></div><div class="code-panel"><div class="code-title"><span>Start locally</span><span>Unpublished preview</span></div>${syntax.renderBlock("npm install\nnpm run dev\n\n# Pack the reusable frontend\nnpm pack --workspace @notabenda/core", "sh",{dark:true})}<p>Typed configuration. Semantic HTML. Optional CSS.</p></div></section>
<section class="section coverage-strip"><div><p class="eyebrow">Coverage and limits</p><h2>Check what is covered</h2><p>${counts.requirements} requirements linked to sources, code and verification. The count is not a compliance score. Legal research is initial and unreviewed; no jurisdiction pack is production-supported.</p></div><a class="text-link" href="/guide/requirements">Requirements & current status →</a></section>
`);
files['assets/syntax.css']=syntax.stylesheet();syntax.dispose();
files['schemas/service-catalog-v1.json']=await read('catalog/schema.json');
files['404.html'] = layout('Page not found','<section class="section closing"><p class="eyebrow">404</p><h1>Page not found</h1><p>This address does not match a page.</p><a class="button primary" href="/">Back to Notabenda</a></section>');
// Backend bundles stay OUTSIDE the uploaded static asset tree.
const config = JSON.parse(await read('examples/static/notabenda.config.json'));
const initial = compileLegalDocuments(config,{mode:'preview'});
const next = structuredClone(config); next.purposes[0].retention='Sample: 30 days after an enquiry is resolved.';
next.documents.terms.sections[1].paragraphs.push('This draft revision clarifies the fictional content example.');
for(const doc of Object.values(next.documents)) doc.version='draft-2';
const latest=compileLegalDocuments(next,{mode:'preview'});
const catalogExample=catalogReleaseExample(config);
const agreements=[]; const releases=[{artifact:initial.artifact,metadata:{recordedAt:'2026-10-17T10:00:00Z',changeNote:'Initial fictional example documents.'}},{artifact:latest.artifact,metadata:{recordedAt:'2026-10-18T10:00:00Z',changeNote:'Clarify sample retention and fictional terms content.'}}];
releases.push(...catalogExample.releases,...(await authoringExample()).releases,...(await retainedReleaseExample()).releases);
for(const [theme,prefix] of [['light',''],['dark','dark/']]) {
  const offer=JSON.parse(files[`${prefix}agreement/offer.json`]);
  agreements.push({theme,offer}); releases.push({artifact:JSON.parse(files[`artifacts/${offer.artifactId}.json`]),metadata:{recordedAt:'2026-10-18T10:00:00Z',changeNote:`Fictional ${theme} agreement demonstration.`}});
}
const localizedOffer=JSON.parse(files['localization/agreement/offer.json']);agreements.push({theme:'pt',offer:localizedOffer});releases.push({artifact:JSON.parse(files[`artifacts/${localizedOffer.artifactId}.json`]),metadata:{recordedAt:'2026-10-19T12:00:00Z',changeNote:'Localized terms agreement example.'}});
// Seed evidence from the build-time site, never the intentionally smaller browser descriptor.
const choiceConfig=exampleConsentConfig(config);
for(const [kind,doc] of Object.entries(choiceConfig.documents))doc.route=`/choices/${kind}`;
const choiceBuild=compileLegalDocuments(choiceConfig,{mode:'preview'});
const consent={artifact:choiceBuild.artifact,notice:createConsentNotice(choiceBuild.artifact,{scopeId:'sample-cookie-choices'},{mode:'preview'})};
const recordedNotice=JSON.parse(files['recorded-choices/notice.json']);
const recordedConsent={notice:recordedNotice,artifact:JSON.parse(files[`artifacts/${recordedNotice.artifactId}.json`])};
const processingNotice=JSON.parse(files['processing-choices/notice.json']);
const processing={notice:processingNotice,artifact:JSON.parse(files[`artifacts/${processingNotice.artifactId}.json`])};
const localizedProcessingNotice=JSON.parse(files['localization/processing/notice.json']);
const localizedProcessing={notice:localizedProcessingNotice,artifact:JSON.parse(files[`artifacts/${localizedProcessingNotice.artifactId}.json`])};
const permissionOffer=JSON.parse(files['form-permissions/offer.json']);
const formPermissions={offer:permissionOffer,artifact:JSON.parse(files[`artifacts/${permissionOffer.artifactId}.json`])};
const localizedPermissionOffer=JSON.parse(files['localization/permission/offer.json']);
const localizedFormPermissions={offer:localizedPermissionOffer,artifact:JSON.parse(files[`artifacts/${localizedPermissionOffer.artifactId}.json`])};
const paidOrders=Object.fromEntries(['mixed','deferred','conditional'].map(route=>[route,JSON.parse(files['orders/'+route+'/template.json'])]));
const contractDefinitions=Object.fromEntries(['withdrawal','cancellation'].map(route=>[route,JSON.parse(files['contract-actions/'+route+'/definition.json'])]));
const contractActions={definitions:contractDefinitions,artifact:JSON.parse(files['artifacts/'+contractDefinitions.withdrawal.artifactId+'.json'])};
const server={releases,agreements,consent,recordedConsent,processing,localizedProcessing,formPermissions,localizedFormPermissions,contractActions,paidOrders,evidence:syntheticRecords}; server.version=createHash('sha256').update(JSON.stringify(server)).digest('hex');
await writeBuildFiles(output,files);
for(const path of media) { await mkdir(dirname(resolve(output,path)),{recursive:true}); await copyFile(resolve(root,path),resolve(output,path)); }
await writeFile(new URL('./dist/server-data.json',import.meta.url),JSON.stringify(server));
const expected=new Set([...Object.keys(files),...media]);
// Fail rather than upload unexpected/stale files left in a development output directory.
async function inspect(directory,prefix='') {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const path=prefix+entry.name;
    if(entry.isDirectory()) await inspect(resolve(directory,entry.name),path+'/');
    else if(!entry.isFile() || !expected.has(path)) throw new Error(`Unexpected asset output (${path}); inspect and remove unmanaged files before deploying.`);
  }
}
await inspect(output);
await writeFile(new URL('./dist/asset-manifest.json',import.meta.url),JSON.stringify([...expected].sort(),null,2)+'\n');
console.log(`Built Notabenda website: ${docs.size} guide pages, public examples and protected synthetic workspace.`);
