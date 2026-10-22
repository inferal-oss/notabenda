// @requirements REQ-PRODUCT-AUTHORED-PREVIEW
// @requirements REQ-PRODUCT-PACK-EDUCATION
import {packLibrary} from '@notabenda/core/packs';
const e=value=>String(value).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const packs=new Map(packLibrary().map(pack=>[pack.id,pack]));
export const packLearningCss=`
.pack-example-guide{box-sizing:border-box;max-width:70rem;margin:1.5rem auto 0;padding:1.15rem 1.4rem;border:1px solid var(--nb-line,var(--nb-border,#e3e3e9));border-radius:12px;background:var(--nb-surface,#fff);color:var(--nb-text,#292932);font:400 .875rem/1.65 ui-sans-serif,system-ui,sans-serif}
.pack-example-guide *{box-sizing:border-box}.pack-example-guide .pack-guide-heading{margin:0 0 .35rem;font-size:.75rem;font-weight:600;color:var(--nb-muted,#656575);letter-spacing:.025em}.pack-example-guide>p{margin:0;max-width:78ch}.pack-example-guide details{padding:0;border:0;border-radius:0;background:none;box-shadow:none;margin-top:.8rem;border-top:1px solid var(--nb-line,var(--nb-border,#e3e3e9))}.pack-example-guide summary{cursor:pointer;min-height:44px;padding:.7rem 0 .2rem;font-weight:550;line-height:1.5}.pack-example-guide details[open] summary{padding-bottom:.8rem}.pack-example-guide ol{margin:0;padding-left:1.3rem;max-width:78ch}.pack-example-guide li{margin:.45rem 0;padding-left:.25rem}.pack-example-guide .pack-guide-observe{margin:1rem 0 .2rem;padding-top:.85rem;border-top:1px solid var(--nb-line,var(--nb-border,#e3e3e9));max-width:78ch}.pack-example-guide .pack-guide-observe strong{font-weight:600}.pack-example-guide a{color:inherit;text-underline-offset:.2em}.pack-example-guide :is(summary,a):focus-visible{outline:3px solid var(--nb-accent,#6255b0);outline-offset:4px}.pack-example-guide .pack-guide-rule{margin-top:.9rem}.pack-example-guide .pack-guide-rule>summary span{display:block;font-size:.8125rem;font-weight:400;color:var(--nb-muted,#656575)}
.pack-document-samples{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:2rem 0}.pack-document-samples>a{display:flex;flex-direction:column;gap:.8rem;min-width:0;min-height:180px;padding:1.5rem;border:1px solid var(--nb-line,var(--nb-border,#e3e3e9));border-radius:12px;background:var(--nb-surface,#fff);text-decoration:none;color:inherit}.pack-document-samples strong{font-size:1.15rem;font-weight:550;letter-spacing:-.025em}.pack-document-samples span{font-size:.875rem;line-height:1.6;color:var(--nb-muted,#656575)}.pack-document-samples i{margin-top:auto;font-size:.8125rem;font-style:normal}.pack-document-samples>a:hover{border-color:var(--nb-accent,#6255b0)}
@media(max-width:760px){.pack-example-guide{margin:1rem 1.25rem 0;padding:1rem;border-radius:10px;font-size:.875rem}.pack-document-samples{grid-template-columns:1fr}.pack-document-samples>a{min-height:0}}
@media(forced-colors:active){.pack-example-guide,.pack-document-samples>a{border-color:CanvasText;background:Canvas;color:CanvasText}}
`;
function exercise(pack){return `<ol>${pack.example.steps.map(step=>`<li>${e(step)}</li>`).join('')}</ol><p class="pack-guide-observe"><strong>What to notice.</strong> ${e(pack.example.observe)}</p>`;}
export function renderPackLearning(ids,{variant}={}){
 const selected=ids.map(id=>{const pack=packs.get(id);if(!pack)throw Error('Unknown pack example.');const example=variant?pack.example.variants?.[variant]:pack.example;if(!example)throw Error('Unknown pack example variant.');return {...pack,example};});
 if(selected.length===1){const pack=selected[0];return `<aside class="pack-example-guide" lang="en" aria-label="About this example" data-pack-guide="${pack.id}"><p class="pack-guide-heading">About this example</p><p>${e(pack.example.useCase)}</p><details><summary>Try the flow</summary>${exercise(pack)}</details></aside>`;}
 const timing=ids.join(',')==='ie-consent-duration,it-repeat-prompts';
 return `<aside class="pack-example-guide" lang="en" aria-label="${timing?'About these timing examples':'About this combined example'}"><p class="pack-guide-heading">${timing?'Two different timing rules':'One form, two separate jobs'}</p><p>${timing?'One rule limits how long a consent grant lasts. The other controls when a notice may ask again. Try them separately below.':'Explain what the form collects before someone submits it. Keep optional updates as a separate choice, with its own record and withdrawal.'}</p>${selected.map(pack=>`<details class="pack-guide-rule" data-pack-guide="${pack.id}"><summary>${e(pack.title)}<span>${e(pack.outcome)}</span></summary><p>${e(pack.example.useCase)}</p>${exercise(pack)}</details>`).join('')}</aside>`;
}
/** Only current demonstration entry pages are decorated. Never touch pinned artifacts or nested policy files. */
export function withPackLearning(html,ids,options={}){
 if(html.includes('data-pack-guide='))return html;
 const lesson=renderPackLearning(ids,options);
 // Keep teaching content outside React-owned hydration roots.
 const root=/<div\b[^>]*\bid="react-(?:agreement|permission)-root"[^>]*>/u;
 return root.test(html)?html.replace(root,match=>lesson+match):html.replace(/<main\b/u,()=>lesson+'<main');
}
/** Demo-only operator teaching uses the existing response nonce; no CSP permissions are broadened. */
export async function withPackLearningResponse(response,ids){
 if(response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const nonce=/style-src[^;]*'nonce-([A-Za-z0-9_-]+)'/u.exec(response.headers.get('Content-Security-Policy')??'')?.[1];
 if(!nonce)return response;
 const html=withPackLearning(await response.text(),ids).replace('</head>',`<style nonce="${nonce}">${packLearningCss}</style></head>`),headers=new Headers(response.headers);headers.delete('Content-Length');
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
const routes={
 'examples/legal-pages':['privacy-pages'],choices:['cookie-choices'],agreement:['terms-agreement'],'agreement/react':['terms-agreement'],'agreement/astro':['terms-agreement'],'agreement/astro/review':['terms-agreement'],collection:['collection-notices'],'collection-flow':['collection-notices','form-permissions'],'indirect-collection':['indirect-collection'],rights:['privacy-requests'],technology:['technology-notices'],'form-permissions':['form-permissions'],'form-permissions/react':['form-permissions'],'form-permissions/astro':['form-permissions'],'form-permissions/astro/review':['form-permissions'],embeds:['gated-media'],'processing-choices':['processing-opt-outs'],'storage-exceptions':['assessed-storage-settings'],'google-basic':['google-basic'],'contract-actions/withdrawal':['contract-withdrawal'],'contract-actions/cancellation':['subscription-cancellation'],'orders/mixed':['paid-order-review'],'orders/deferred':['paid-order-review'],'orders/conditional':['paid-order-review'],guarantees:['guarantee-information'],'guarantees/product':['guarantee-information'],'repeat-prompts':['ie-consent-duration','it-repeat-prompts'],
};
export function applyPackLearning(files){
 const result={...files,'assets/pack-learning.css':packLearningCss};
 for(const [file,html] of Object.entries(files)){
  if(!file.endsWith('/index.html')||typeof html!=='string')continue;
  const route=file.replace(/^dark\//u,'').replace(/\/index\.html$/u,''),ids=routes[route];if(!ids)continue;
  const variant=route==='orders/deferred'?'deferred':route==='orders/conditional'?'conditional':undefined;
  result[file]=withPackLearning(html,ids,{variant}).replace('</head>','<link rel="stylesheet" href="/assets/pack-learning.css"></head>');
 }
 return result;
}
export function legalPagesExample(){
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy, cookie and terms pages · Juniper Notes</title><link rel="stylesheet" href="/assets/notabenda.css"><link rel="stylesheet" href="/assets/example-pages.css"><link rel="stylesheet" href="/assets/example-theme.css"></head><body class="nb-page nb-demo-page"><a class="nb-skip-link" href="#main">Skip to content</a><header class="nb-site-header"><a class="demo-brand" href="/">juniper / notes</a><nav aria-label="Example navigation"><a href="/examples">← All examples</a><a href="/guide/package">Integration guide ↗</a></nav></header><main id="main" class="nb-document"><p class="nb-eyebrow">Legal pages</p><h1>Privacy, cookies and terms: three different jobs.</h1><p>These pages are generated from one site inventory. Open each one to see the information it needs to explain.</p><div class="pack-document-samples"><a href="/privacy"><strong>Privacy policy</strong><span>Why information is collected, who receives it, retention and the person’s rights.</span><i>Read the sample policy ↗</i></a><a href="/cookies"><strong>Cookie policy</strong><span>The declared browser storage, what it does and how long it lasts.</span><i>Read the sample cookie policy ↗</i></a><a href="/terms"><strong>Terms of use</strong><span>The conditions for using the site, with a version and effective date.</span><i>Read the sample terms ↗</i></a></div><p>Use the site’s actual practices and reviewed wording. A generated page does not establish that the inventory is complete or the terms apply to your business.</p><p>Writing in Markdown or MDX? <a href="/authored/preview/">Preview and export the compiled release →</a></p><p>Need people to agree to the terms? <a href="/agreement">Try the separate terms agreement control →</a></p></main><footer class="nb-site-footer"><a href="/guide/authoring">Write pages in Markdown or MDX ↗</a><a href="/guide/releases">Keep earlier versions ↗</a></footer></body></html>`;
}
