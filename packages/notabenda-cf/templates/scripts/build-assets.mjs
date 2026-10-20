// @requirements REQ-PRODUCT-CONSENT-REHEARSAL
// @requirements REQ-PRODUCT-DRAFT-PREVIEW
// @requirements REQ-PRODUCT-CF-STARTER
import {mkdir,copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir(new URL('../public/assets/',import.meta.url),{recursive:true});
await build({entryPoints:[new URL('../src/setup.mjs',import.meta.url).pathname],outfile:new URL('../public/assets/setup.mjs',import.meta.url).pathname,plugins:[{name:'local-preview-module',setup(builder){builder.onResolve({filter:/^\.\/setup-consent-rehearsal\.js$/},()=>({path:'/assets/setup-consent-rehearsal.mjs',external:true}));builder.onResolve({filter:/^\.\/setup-preview\.js$/},()=>({path:'/assets/setup-preview.mjs',external:true}));}}],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,sourcemap:false});
await copyFile(new URL(import.meta.resolve('@notabenda/core/styles.css')),new URL('../public/assets/notabenda.css',import.meta.url));

// @requirements REQ-PRODUCT-CARTRIDGES
await copyFile(new URL(import.meta.resolve('@notabenda/core/cartridges.css')),new URL('../public/assets/cartridges.css',import.meta.url));

// @requirements REQ-PRODUCT-CARTRIDGES
await build({stdin:{contents:"export {mountLegalPreview} from '@notabenda/core/setup/preview';",resolveDir:new URL('../',import.meta.url).pathname},outfile:new URL('../public/assets/setup-preview.mjs',import.meta.url).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,sourcemap:false});

await build({stdin:{contents:"export {mountConsentRehearsal} from '@notabenda/core/setup/consent-rehearsal';",resolveDir:new URL('../',import.meta.url).pathname},outfile:new URL('../public/assets/setup-consent-rehearsal.mjs',import.meta.url).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,sourcemap:false});
