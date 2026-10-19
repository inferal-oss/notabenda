// @requirements REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
// Only explicit demonstration entry points receive this frame. Compiled legal documents and pinned artifacts stay byte-for-byte intact.
import {readFile} from 'node:fs/promises';
const leaf='<svg viewBox="0 0 32 32" width="27" height="27" fill="none" aria-hidden="true"><path d="M8 25V10m0 9C8 8 17 5 25 6c1 9-4 17-17 13Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const profiles={
 'catalog-releases/index.html':['catalog-releases','service-catalog'],
 'services/index.html':['services','services'], 'dark/services/index.html':['services','services'],
 'contract-actions/withdrawal/index.html':['contracts','contract-actions'],
 'contract-actions/cancellation/index.html':['contracts','contract-actions'],
 'dark/contract-actions/withdrawal/index.html':['contracts','contract-actions'],
 'dark/contract-actions/cancellation/index.html':['contracts','contract-actions'],

 'google-basic/index.html':['google','google-basic'], 'dark/google-basic/index.html':['google','google-basic'],
 'index.html':['overview','package'], 'brand/index.html':['brand','package'],
 'form-permissions/react/index.html':['permissions','react'], 'dark/form-permissions/react/index.html':['permissions','react'],
 'form-permissions/index.html':['permissions','form-permissions'], 'dark/form-permissions/index.html':['permissions','form-permissions'],
 'agreement/index.html':['agreement','terms'], 'dark/agreement/index.html':['agreement','terms'],
 'react/index.html':['react','react'], 'dark/react/index.html':['react','react'],
 'collection/index.html':['collection','collection'],'dark/collection/index.html':['collection','collection'],
 'indirect-collection/index.html':['indirect-collection','indirect-collection'],'dark/indirect-collection/index.html':['indirect-collection','indirect-collection'],
 'embeds/index.html':['embeds','embeds'],'embeds/frame/index.html':['frame','embeds'],
 'privacy-signals/index.html':['signals','privacy-signals'], 'processing-choices/index.html':['processing','processing-choices'],
 'storage-cleanup/index.html':['storage','storage-cleanup'],'releases/index.html':['releases','releases'],
 'rights/index.html':['rights','rights'],'dark/rights/index.html':['rights','rights'],
 'scope-guards/index.html':['guards','scope-guards'],'dark/scope-guards/index.html':['guards','scope-guards'],
 'repeat-prompts/index.html':['regions','regional-prompts'],'dark/repeat-prompts/index.html':['regions','regional-prompts'],
};
export async function styleExamplePages(files){
 const result={...files,'assets/example-pages.css':await readFile(new URL('./example-pages.css',import.meta.url),'utf8'),'assets/example-theme.css':await readFile(new URL('./example-theme.css',import.meta.url),'utf8')};
 const allProfiles={...profiles};for(const path of Object.keys(files))if(/^(?:dark\/)?rights\/workflow\/[a-z-]+\/index.html$/u.test(path))allProfiles[path]=['rights-workflow','rights'];
 for(const [path,[kind,guide]] of Object.entries(allProfiles)){
  if(typeof result[path]!=='string')throw new Error('A styled example entry point is missing.');
  let html=result[path];const dark=path.startsWith('dark/');
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/example-pages.css"></head>');
  html=html.replace(/<body class="nb-page([^"]*)">/u,`<body class="nb-page nb-demo-page nb-demo-${kind}${dark?' nb-demo-midnight':''}$1">`);
  // Header stays outside framework hydration roots. The framework-owned main/controls are not rewritten.
  html=html.replace(/<header class="nb-site-header(?: [^"]*)?">[\s\S]*?<\/header>/u,`<header class="nb-site-header${kind==='services'?' nb-service-sitebar':''}"><a class="demo-brand" href="/">${leaf}<span>juniper<span class="demo-brand-separator">/</span>notes</span></a><nav aria-label="Example navigation"><a href="/examples"><span aria-hidden="true">←</span> All examples</a><a href="/guide/${guide}">Integration guide <span aria-hidden="true">↗</span></a></nav></header>`);
  html=html.replace('<main class="nb-document">','<main id="main" class="nb-document">');
  if(!/class="[^"]*\bnb-(?:skip-link|service-skip)\b/u.test(html))html=html.replace(/(<body[^>]*>)/u,'$1<a class="nb-skip-link" href="#main">Skip to content</a>');
  if(kind!=='react')html=html.replace('</footer>',`<a class="demo-footer-guide" href="/guide/${guide}">Integration guide <span aria-hidden="true">↗</span></a></footer>`);
  result[path]=html;
 }
 for(const [path,html] of Object.entries(result))if(path.endsWith('.html')&&typeof html==='string'&&/class="[^"]*(?:nb-demo-page|choices-page|discovery-page)/u.test(html)&&!html.includes('href="/assets/example-theme.css"'))result[path]=html.replace('</head>','<link rel="stylesheet" href="/assets/example-theme.css"></head>');
 return result;
}
