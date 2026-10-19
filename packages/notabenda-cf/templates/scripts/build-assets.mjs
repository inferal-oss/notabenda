// @requirements REQ-PRODUCT-CF-STARTER
import {mkdir,copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir(new URL('../public/assets/',import.meta.url),{recursive:true});
await build({entryPoints:[new URL('../src/setup.mjs',import.meta.url).pathname],outfile:new URL('../public/assets/setup.mjs',import.meta.url).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,sourcemap:false});
await copyFile(new URL(import.meta.resolve('notabenda/styles.css')),new URL('../public/assets/notabenda.css',import.meta.url));
