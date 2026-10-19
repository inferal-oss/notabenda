import {catalogReleaseExample} from '../catalog-releases/build.mjs';
// @requirements REQ-PRODUCT-BUNDLE-BUDGET
import {serviceDirectoryFiles} from '../services/build.mjs';
import {contractActionFiles} from '../contract-actions/build.mjs';
import {googleBasicFiles} from '../google-basic/build.mjs';
import {formPermissionFiles} from '../form-permissions/build.mjs';
import {rightsFiles} from '../rights/build.mjs';
import {styleExamplePages} from './example-design.mjs';
import {discoveryFiles} from '../discovery/build.mjs';
import {scopeGuardFiles} from '../scope-guards/build.mjs';
import {repeatPromptFiles} from '../repeat-prompts/build.mjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileLegalDocuments,createRetainedReleaseFiles } from 'notabenda/content';
import { renderLegalLinks } from 'notabenda';
import { writeBuildFiles } from '../../packages/notabenda/dist/files.js';
import { choiceFiles } from './choices-build.mjs';
import { agreementFiles } from './terms-build.mjs';
import { authoringExample } from '../authoring/build.mjs';
import { reactFiles } from '../react/build.mjs';
import { astroFiles } from '../astro/build.mjs';
import { embedFiles } from '../embeds/build.mjs';
import {retainedReleaseExample} from '../releases/build.mjs';
import { processingFiles } from '../processing-choices/build.mjs';
import {collectionFiles} from '../collection/build.mjs';
import {setupFiles} from '../setup/build.mjs';
import {storageCleanupFiles} from '../storage-cleanup/build.mjs';
import { signalFiles } from '../privacy-signals/build.mjs';

export async function exampleFiles() {
const config = JSON.parse(await readFile(new URL('./notabenda.config.json', import.meta.url), 'utf8'));
const css = await readFile(new URL('../../packages/notabenda/dist/styles.css', import.meta.url), 'utf8');
const consentCss = await readFile(new URL('../../packages/notabenda/dist/consent.css', import.meta.url), 'utf8');
const darkTheme = '\n@layer example { .nb-page { color-scheme: dark; --nb-page-bg: #10121d; --nb-surface: #171b2b; --nb-soft: #202539; --nb-text: #eef0fc; --nb-muted: #adb5ce; --nb-line: #343b56; --nb-accent: #bdc4ff; --nb-action-bg: #c1c7ff; --nb-action-text: #191d35; --nb-focus: #a5acff; --nb-font: ui-sans-serif, system-ui, sans-serif; --nb-document-width: 46rem; } }\n';
const logo = await readFile(new URL('../../docs/assets/logo.svg', import.meta.url), 'utf8');
const mark = await readFile(new URL('../../docs/assets/mark.svg', import.meta.url), 'utf8');
const build = compileLegalDocuments(config, { mode: 'preview' });
const dark = structuredClone(config);
for (const doc of Object.values(dark.documents)) doc.route = '/dark' + doc.route;
const darkBuild = compileLegalDocuments(dark, { mode: 'preview', stylesheetUrl: '/assets/dark.css' });
const darkFiles = Object.fromEntries(Object.entries(darkBuild.files).filter(([file]) => file.startsWith('dark/') || file.startsWith('artifacts/')));
const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Juniper Notes · Legal pages example</title><link rel="stylesheet" href="/assets/notabenda.css"></head><body class="nb-page"><header class="nb-site-header"><a href="/">Juniper Notes</a><span>Juniper Notes examples</span></header><main id="main" class="nb-document"><p class="nb-eyebrow">Notabenda · Static example</p><h1>Notabenda examples</h1><p>Legal pages that feel like part of your site. Built from one configuration, rendered as ordinary HTML, with no scripts or external assets.</p><section><h2>Explore the documents</h2>${renderLegalLinks(config)}</section><section><h2>Customize the styles</h2><p>The same renderer supports your fonts, colors, layout, and reviewed content. Try the second theme:</p><nav class="nb-legal-links" aria-label="Dark theme"><a href="/dark/privacy">Midnight privacy</a><a href="/dark/cookies">Midnight cookies</a><a href="/dark/terms">Midnight terms</a></nav></section></main><footer class="nb-site-footer"><p>Generated with notabenda · No consent runtime is installed in this example.</p></footer></body></html>`;
const previous=JSON.parse(await readFile(new URL('../releases/previous-preview-releases.json',import.meta.url),'utf8'));
const retained={};for(const [siteId,artifacts] of Map.groupBy(previous,artifact=>artifact.manifest.siteId))Object.assign(retained,createRetainedReleaseFiles(artifacts,{siteId,mode:'preview'}));
return styleExamplePages({
  ...retained,...catalogReleaseExample(config).files,
  ...build.files, ...darkFiles, ...await serviceDirectoryFiles(config), ...(await authoringExample()).files, ...await choiceFiles(config), ...await agreementFiles(config), ...await reactFiles(config), ...await astroFiles(), ...await embedFiles(config), ...await signalFiles(config), ...await storageCleanupFiles(config), ...await setupFiles(), ...await collectionFiles(config), ...await discoveryFiles(config), ...await repeatPromptFiles(config), ...await scopeGuardFiles(config), ...await rightsFiles(config), ...await processingFiles(config), ...await formPermissionFiles(config), ...await googleBasicFiles(config),...await contractActionFiles(config), ...(await retainedReleaseExample()).files, 'index.html': index.replace('</main>', '<section><h2>Discovery tooling</h2><p><a href="/discovery">Capture and review observed origins and storage names</a></p></section></main>').replace('</main>', '<section><h2>Inline collection notices</h2><p><a href="/collection">Privacy information beside the form</a></p></section><section><h2>Declared storage cleanup</h2><p><a href="/storage-cleanup">Try exact-key cleanup on withdrawal</a></p></section><section><h2>Retained document releases</h2><p><a href="/releases">Read current and previous terms</a></p></section><section><h2>Recorded processing choices</h2><p><a href="/processing-choices">Try the separate opt-out</a> · <a href="/demo/admin/processing">Review its records</a></p></section><section><h2>Privacy signals</h2><p><a href="/privacy-signals">Try the Global Privacy Control example</a></p></section><section><h2>Gated media</h2><p><a href="/embeds">Try permission-gated frames and images</a></p></section><section><h2>Live cookie choices</h2><p><a href="/choices">Try the consent controls</a> · <a href="/dark/choices">Try the dark theme</a></p></section><section><h2>Terms agreement</h2><p><a href="/agreement">Try the agreement flow</a> · <a href="/demo/admin/agreements">Review its records</a></p></section><section><h2>Astro integration</h2><p><a href="/astro/">Try Astro navigation and choices</a> · <a href="/astro/privacy/">Static Astro privacy page</a></p></section><section><h2>React integration</h2><p><a href="/react">Try React choices</a> · <a href="/dark/react">Midnight React theme</a></p></section><section><h2>Write in Markdown or MDX</h2><p><a href="/authored/terms">Read authored terms</a> · <a href="/authored/cookies">Markdown cookie addendum</a> · <a href="/demo/admin/history">Inspect source revisions</a></p></section></main>'), 'assets/notabenda.css': css,
  'assets/logo.svg': logo, 'assets/mark.svg': mark,
  'brand/index.html': '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notabenda · Brand</title><link rel="stylesheet" href="/assets/notabenda.css"></head><body class="nb-page"><main id="main" class="nb-document"><p class="nb-eyebrow">Notabenda · Brand assets</p><img src="/assets/logo.svg" alt="notabenda" width="660"><h1>Brand assets</h1><p>An original folded-note mark and a simple wordmark. Scalable SVGs, no external fonts or assets, Apache-2.0.</p><p><a href="/">Explore the legal pages</a> · <a href="/demo/admin/evidence">Evidence workspace</a> · <a href="/demo/admin/history">Document history</a></p></main></body></html>',
  'assets/dark.css': css + darkTheme,
  'assets/consent.css':consentCss,
  'assets/consent-dark.css':consentCss + darkTheme,
});
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeBuildFiles(new URL('./dist', import.meta.url).pathname, await exampleFiles());
  console.log('Built fictional light/dark legal pages in examples/static/dist.');
}
