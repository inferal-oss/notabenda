import {catalogReleaseExample} from '../examples/catalog-releases/build.mjs';
import {websiteNoticeFacts,websiteNoticeBody} from './website-notice.mjs';
// @requirements REQ-PRODUCT-SYNTAX-HIGHLIGHTING
// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
// @requirements REQ-PRODUCT-CF-HOST
import {createCodeHighlighter} from './syntax.mjs';
import {examplesBody} from './examples-page.mjs';
import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname, extname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import { compileLegalDocuments, createConsentNotice } from 'notabenda/content';
import { writeBuildFiles } from '../packages/notabenda/dist/files.js';
import { syntheticRecords } from '../packages/notabenda-cf/examples/synthetic.mjs';
import { exampleFiles } from '../examples/static/build.mjs';
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
const markdownRenderer=new Marked({renderer:{code({text,lang}){return syntax.renderBlock(text+'\n',lang);}}});
const style = await read('site/style.css');
const files = {'site.css':style,'assets/inferal-mark.svg':await read('site/assets/inferal-mark.svg')};
files['assets/demo-admin.css']=await read('site/demo-admin.css');
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
  else files[relative]=content;
}
await visit('docs/assets',async path=>{ if(['.svg','.jpg','.png'].includes(extname(path))) media.push(path); });
const docs = new Map([['README.md','/guide'],['packages/notabenda/README.md','/guide/package'],['packages/notabenda-cf/README.md','/guide/cloudflare'],['packages/notabenda-authoring/README.md','/guide/authoring-package'],['regulatory/README.md','/guide/research'],['site/README.md','/guide/website'],['catalog/README.md','/guide/catalog-data'],['packages/notabenda/assets/guarantees/NOTICE.md','/guide/guarantee-asset-notice']]);
await visit('docs',async path=>{ if(path.endsWith('.md')) docs.set(path,'/guide/'+path.slice(5).replace(/\.md$/u,'').replace(/\/README$/u,'').toLowerCase()); });
const catalogRefs = new Set(catalog.requirements.flatMap(r=>[...r.implementationRefs,...r.testRefs]).map(x=>x.split('#')[0]));
for(const path of catalogRefs) if(/^(?:packages|scripts|examples|regulatory|site)\//u.test(path) && /\.(?:ts|mjs|json|py|css|astro)$/u.test(path)) files[`source/${path}.txt`]=await read(path);
files['source/regulatory/catalog.json.txt']=JSON.stringify(catalog,null,2)+'\n';
files['license.txt']=await read('LICENSE');

const guideLinks = `<nav aria-label="Documentation"><a href="/guide/package">Package &amp; configuration</a><a href="/guide/setup">Guided setup</a><a href="/guide/discovery">Discovery tooling</a><a href="/guide/service-catalog">Service catalog</a><a href="/guide/services">Service directory</a><a href="/guide/consent">Cookie choices</a><a href="/guide/regional-prompts">Repeat-prompt rules</a><a href="/guide/scope-guards">Scope guards</a><a href="/guide/embeds">Gated media</a><a href="/guide/storage-cleanup">Storage cleanup</a><a href="/guide/privacy-signals">Privacy signals</a><a href="/guide/google-basic">Google Basic</a><a href="/guide/processing-choices">Recorded opt-outs</a><a href="/guide/collection">Collection notices</a><a href="/guide/indirect-collection">Indirect collection</a><a href="/guide/form-permissions">Form permissions</a><a href="/guide/rights">Privacy request entry points</a><a href="/guide/terms">Terms agreement</a><a href="/guide/guarantees">EU guarantee notices</a><a href="/guide/contract-actions">Contract actions</a><a href="/guide/contract-dispatch">Delivery runners</a><a href="/guide/releases">Retained releases</a><a href="/guide/authoring">Markdown &amp; MDX</a><a href="/guide/react">React integration</a><a href="/guide/astro">Astro integration</a><a href="/guide/cloudflare">Cloudflare backend</a><a href="/guide/cloudflare-starter">Cloudflare starter</a><a href="/guide/cloudflare-doctor">Deployment checks</a><a href="/guide/evidence-export">Evidence export</a><a href="/guide/evidence-lifecycle">Evidence lifecycle</a><a href="/guide/requirements">Requirements catalog</a><a href="/guide/requirements/sources">Primary sources</a><a href="/guide/features">Feature status</a><a href="/guide/scope">Product scope</a></nav>`;

function layout(title, body, {description='Self-hosted legal pages, privacy controls and document history.',guide=false}={}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(description)}"><title>${escape(title)} · Notabenda</title><link rel="icon" href="/docs/assets/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/assets/syntax.css"><link rel="stylesheet" href="/assets/website-notice.css"></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/" aria-label="Notabenda home"><img src="/docs/assets/mark.svg" width="36" height="36" alt=""><span>notabenda</span></a><nav aria-label="Main"><a href="/guide/package">Guide</a><a href="/examples">Examples</a><a href="/guide/requirements">Requirements</a><a class="nav-action" href="/choices">Try the controls <span aria-hidden="true">↗</span></a></nav></header>${guide ? `<div class="guide-layout"><aside class="guide-nav guide-nav-desktop"><p class="eyebrow">Build with Notabenda</p>${guideLinks}<p class="hint">Developer preview.<br>Regional support is tracked item by item.</p></aside><details class="guide-nav guide-nav-mobile"><summary>Browse documentation <span aria-hidden="true">⌄</span></summary>${guideLinks}</details><main id="main" class="prose">${body}</main></div>` : `<main id="main">${body}</main>`}<footer class="site-footer"><a class="brand" href="/"><img src="/docs/assets/mark.svg" alt="" width="28" height="28"><span>notabenda</span></a><p>Open-source privacy tools.</p><nav aria-label="Footer"><a href="/website-privacy">Website privacy</a><a href="/license.txt">Apache 2.0</a><a href="/guide/scope">Scope &amp; limits</a><a href="/guide/research">Research workflow</a><a href="/demo/admin">Demo workspace</a><a href="/demo/admin/setup">Setup wizard</a></nav><p class="sponsor">Sponsored by <a href="https://inferal.com/"><img src="/assets/inferal-mark.svg" width="12" height="14" alt="">Inferal</a></p></footer></body></html>`;
}
files['website-privacy/index.html']=layout('Website privacy',websiteNoticeBody(websiteFacts),{description:'How this project website handles demo sessions, entries and browser storage.'});
files['examples/index.html']=layout('Examples',examplesBody(),{description:'Working examples of legal pages, cookie controls, form permissions and evidence search.'});

function routeFile(route) { return route.slice(1)+'/index.html'; }
function rewrite(href, source) {
  if(href.startsWith('#')) return href;
  if(/^\/backoffice(?:\/|$)/u.test(href))return href.replace(/^\/backoffice/u,'/demo/admin');
  if(/^http:\/\/(?:127\.0\.0\.1|localhost):417[89](?:\/|$)/u.test(href)) return rewrite(new URL(href).pathname+new URL(href).search+new URL(href).hash,source);
  if(/^[a-z][a-z0-9+.-]*:/iu.test(href) || href.startsWith('/')) return href;
  const [path,fragment] = href.split('#'); const resolved = posix.normalize(posix.join(posix.dirname(source),path));
  if(docs.has(resolved)) return docs.get(resolved)+(fragment ? '#'+fragment : '');
  if(resolved.startsWith('docs/assets/')) return '/'+resolved;
  if(catalogRefs.has(resolved) && files[`source/${resolved}.txt`]) return `/source/${resolved}.txt`;
  if(resolved==='regulatory/catalog.json') return '/source/regulatory/catalog.json.txt';
  if(resolved==='LICENSE') return '/license.txt';
  return '/guide';
}
for(const [path,route] of docs) {
  const markdown = await read(path);
  const title = /^# (.+)$/mu.exec(markdown)?.[1] ?? 'Guide';
  const html = markdownRenderer.parse(markdown,{async:false,walkTokens(token){
    if(token.type==='link' || token.type==='image') token.href=rewrite(token.href,path);
    if(token.type==='html') token.text=token.text.replace(/(?:src|href)="([^"]+)"/gu,(match,href)=>match.replace(href,rewrite(href,path)));
  }});
  files[routeFile(route)] = layout(title,html,{guide:true});
}
const counts = {requirements:catalog.requirements.length,sources:catalog.sources.length,features:catalog.features.length};
files['index.html'] = layout('Legal pages and privacy controls',`
<section class="hero section"><div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span> Developer preview · Apache 2.0</p><h1>Legal pages and<br><span class="hero-highlight">privacy controls</span></h1><p class="lede">Generate privacy, cookie and terms pages. Manage consent, record choices, and inspect policy changes using your own site and backend.</p><div class="actions"><a class="button primary" href="/choices">Try cookie choices <span aria-hidden="true">↗</span></a><a class="text-link" href="/guide/package">Start with the package <span aria-hidden="true">→</span></a></div><p class="hint">Works with plain HTML, React and Astro.</p></div><figure class="hero-figure product-figure"><a class="product-preview" href="/demo/admin" aria-label="Explore the evidence workspace"><div class="product-preview-bar"><span class="product-preview-dot"></span><span>Evidence workspace</span><span aria-hidden="true">↗</span></div><img src="/docs/assets/screenshots/workspace-current.png" alt="Notabenda evidence workspace with search, document versions and recorded terms agreements." width="1698" height="808"></a><figcaption>Search choices, agreements and document revisions. <a href="/demo/admin">Explore the workspace →</a></figcaption></figure></section>
<section class="principles section" aria-label="Design principles"><p>Static HTML documents</p><p>Consent and permission controls</p><p>Document and choice history</p></section>
<section class="section foundation"><div class="section-intro"><p class="eyebrow">Start with the basics</p><h2>One configuration for<br>documents and controls</h2><p>Describe your processing and supply the legal content. Use the document renderer, controls and storage adapters you need.</p></div><div class="areas"><article><span class="number">01</span><div><h3>Privacy, cookie and terms pages</h3><p>Privacy, cookie and terms documents, rendered as ordinary HTML. Your fonts, colors and layout. Readable without JavaScript.</p><a href="/privacy">Read a sample privacy page <span aria-hidden="true">→</span></a></div></article><article><span class="number">02</span><div><h3>Cookie choices and preferences</h3><p>A compact notice with accept, reject and preferences actions. Registered optional services wait for permission.</p><a href="/choices">Explore the live controls <span aria-hidden="true">→</span></a></div></article><article><span class="number">03</span><div><h3>Document revisions and agreements</h3><p>Archive exact documents, inspect policy changes, and bind explicit terms agreement to the version and words shown.</p><a href="/guide/terms">Follow an agreement through the system <span aria-hidden="true">→</span></a></div></article></div></section>
<section class="setup section"><div><p class="eyebrow">npm packages</p><h2>Install the parts<br>your site needs</h2><p>The core package has no runtime dependencies. Use its vanilla interface or build your own from the same headless controllers. Add <code>notabenda-cf</code> when you need a Cloudflare evidence workspace.</p><a class="text-link" href="/guide/package">See the integration guide <span aria-hidden="true">→</span></a></div><div class="code-panel"><div class="code-title"><span>Start locally</span><span>Unpublished preview</span></div>${syntax.renderBlock("npm install\nnpm run dev\n\n# Pack the reusable frontend\nnpm pack --workspace notabenda", "sh",{dark:true})}<p>Typed configuration. Semantic HTML. Optional CSS.</p></div></section>
<section class="section research"><div class="section-intro"><p class="eyebrow">Requirements catalog</p><h2>Sources, code and tests</h2><p>Each requirement links to its sources, implementation and verification. Check coverage and open work before adopting a feature.</p></div><ol class="trace"><li><span>01</span><strong>Primary source</strong><p>Law, regulator guidance or platform specification.</p></li><li><span>02</span><strong>Requirement</strong><p>Applicability, caveats and review status.</p></li><li><span>03</span><strong>Implementation</strong><p>The feature and source files that address it.</p></li><li><span>04</span><strong>Verification</strong><p>Test results and remaining checks.</p></li></ol><div class="research-foot"><p><strong>${counts.requirements}</strong> cataloged requirements · <strong>${counts.sources}</strong> sources · <strong>${counts.features}</strong> build areas</p><a class="text-link" href="/guide/requirements">Open the catalog <span aria-hidden="true">→</span></a></div><p class="hint">Catalog coverage is not a compliance score. Legal research is initial and unreviewed; no jurisdiction pack is production-supported.</p></section>
<section class="section closing"><p class="eyebrow">Made to fit</p><h2>Start with an example</h2><p>Try the controls, inspect the records, and use the source in your integration.</p><div class="actions"><a class="button primary" href="/examples">Explore the examples</a><a class="text-link" href="/guide/scope">Read the current scope <span aria-hidden="true">→</span></a></div></section>`);
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
// Seed evidence from the build-time site, never the intentionally smaller browser descriptor.
const choiceConfig=exampleConsentConfig(config);
for(const [kind,doc] of Object.entries(choiceConfig.documents))doc.route=`/choices/${kind}`;
const choiceBuild=compileLegalDocuments(choiceConfig,{mode:'preview'});
const consent={artifact:choiceBuild.artifact,notice:createConsentNotice(choiceBuild.artifact,{scopeId:'sample-cookie-choices'},{mode:'preview'})};
const recordedNotice=JSON.parse(files['recorded-choices/notice.json']);
const recordedConsent={notice:recordedNotice,artifact:JSON.parse(files[`artifacts/${recordedNotice.artifactId}.json`])};
const processingNotice=JSON.parse(files['processing-choices/notice.json']);
const processing={notice:processingNotice,artifact:JSON.parse(files[`artifacts/${processingNotice.artifactId}.json`])};
const permissionOffer=JSON.parse(files['form-permissions/offer.json']);
const formPermissions={offer:permissionOffer,artifact:JSON.parse(files[`artifacts/${permissionOffer.artifactId}.json`])};
const contractDefinitions=Object.fromEntries(['withdrawal','cancellation'].map(route=>[route,JSON.parse(files['contract-actions/'+route+'/definition.json'])]));
const contractActions={definitions:contractDefinitions,artifact:JSON.parse(files['artifacts/'+contractDefinitions.withdrawal.artifactId+'.json'])};
const server={releases,agreements,consent,recordedConsent,processing,formPermissions,contractActions,evidence:syntheticRecords}; server.version=createHash('sha256').update(JSON.stringify(server)).digest('hex');
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
