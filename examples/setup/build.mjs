// @requirements REQ-PRODUCT-SERVICE-CATALOG
// @requirements REQ-PRODUCT-SETUP
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
export async function setupFiles(){
  const files={'assets/setup.mjs':await readFile(new URL('./client.mjs',import.meta.url),'utf8')};
  for(const file of ['setup.js','setup-ui.js','setup-purpose.js','setup-purpose-ui.js','starter.js','catalog-plain.js','catalog-reference.js','catalog.js','catalog-selection.js','catalog-ui.js','catalog-review.js','catalog-review-ui.js'])files['assets/runtime/'+file]=await readFile(new URL('../../packages/notabenda/dist/'+file,import.meta.url),'utf8');
  const seed=await build({stdin:{contents:"export {serviceCatalogSeed} from 'notabenda/catalog/seed';",resolveDir:new URL('../../',import.meta.url).pathname},bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',minify:true,banner:{js:'/*! Service reference data: Open Cookie Database contributors (Apache-2.0) and original Notabenda references. Attribution and license: /assets/catalog/NOTICE.txt and /assets/catalog/open-cookie-database-LICENSE.txt */'}});
  files['assets/catalog-seed.mjs']=seed.outputFiles[0].text;
  files['assets/catalog/NOTICE.txt']=await readFile(new URL('../../catalog/NOTICE',import.meta.url),'utf8');
  files['assets/catalog/open-cookie-database-LICENSE.txt']=await readFile(new URL('../../catalog/sources/open-cookie-database/LICENSE',import.meta.url),'utf8');
  return files;
}
