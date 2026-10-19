import { readFile } from 'node:fs/promises';
import { compileLegalDocuments, createTermsOffer } from 'notabenda/content';
import { renderLegalLinks } from 'notabenda';

export async function agreementFiles(base) {
  const files = {};
  for (const [theme,prefix] of [['light',''],['dark','/dark']]) {
    const config = structuredClone(base); config.site.id = 'juniper-agreement';
    for (const [kind,doc] of Object.entries(config.documents)) doc.route = `${prefix}/agreement/${kind}`;
    const build = compileLegalDocuments(config,{mode:'preview',stylesheetUrl:prefix ? '/assets/dark.css' : '/assets/notabenda.css'});
    const offer = createTermsOffer(build.artifact,{scopeId:`sample-${theme}`,statement:'I agree to this version of the fictional Juniper Notes sample terms.',actionLabel:'Record sample agreement'},{mode:'preview'});
    Object.assign(files,Object.fromEntries(Object.entries(build.files).filter(([file])=>file.startsWith('artifacts/') || file.startsWith(`${prefix ? 'dark/' : ''}agreement/`))));
    files[`${prefix ? 'dark/' : ''}agreement/offer.json`] = JSON.stringify(offer);
    files[`${prefix ? 'dark/' : ''}agreement/index.html`] = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Juniper Notes · A deliberate agreement</title><link rel="stylesheet" href="${prefix ? '/assets/dark.css' : '/assets/notabenda.css'}"><script type="module" src="/assets/agreement.mjs"></script></head><body class="nb-page"><header class="nb-site-header"><a href="/">Juniper Notes</a><span>Independent words. Considered details.</span></header><main id="main" class="nb-document"><p class="nb-eyebrow">Notabenda · Terms example</p><h1>Clear terms.<br>A deliberate agreement.</h1><p>Review the exact document version before making your choice. An agreement is recorded only after the backend acknowledges it.</p><p class="hint">Demo agreement</p><div id="terms-control"></div><section><h2>A record you can follow</h2><p>The record keeps the document version, the words shown with your choice, and the server's recording time. Cookie preferences remain separate.</p><p><a href="/demo/admin/agreements">Inspect sample agreement records</a> · <a href="${prefix ? '/agreement' : '/dark/agreement'}">Try the ${prefix ? 'light' : 'dark'} theme</a></p></section><noscript><p>JavaScript is unavailable. No agreement is submitted. The legal documents below remain readable.</p></noscript></main><footer class="nb-site-footer">${renderLegalLinks(config)}</footer></body></html>`;
  }
  files['assets/agreement.mjs'] = await readFile(new URL('./agreement.mjs',import.meta.url),'utf8');
  return files;
}
