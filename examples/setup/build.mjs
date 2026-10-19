// @requirements REQ-PRODUCT-SETUP
import {readFile} from 'node:fs/promises';
export async function setupFiles(){
  const files={'assets/setup.mjs':await readFile(new URL('./client.mjs',import.meta.url),'utf8')};
  for(const file of ['setup.js','setup-ui.js','starter.js'])files['assets/runtime/'+file]=await readFile(new URL('../../packages/notabenda/dist/'+file,import.meta.url),'utf8');
  return files;
}
