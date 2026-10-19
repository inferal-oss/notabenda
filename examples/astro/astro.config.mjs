import {defineConfig} from 'astro/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  root:fileURLToPath(new URL('.',import.meta.url)),
  outDir:fileURLToPath(new URL('./dist/',import.meta.url)),
  publicDir:fileURLToPath(new URL('./.generated/public/',import.meta.url)),
  site:'https://fictional.example.test',
  output:'static',
  devToolbar:{enabled:false},
  build:{inlineStylesheets:'never'},
  vite:{build:{assetsInlineLimit:0}},
});
