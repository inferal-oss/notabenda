// @requirements REQ-PRODUCT-ASTRO
import {readFile,readdir,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {release} from './src/lib/config.mjs';
import {permissionExample} from './src/lib/permission.mjs';
import {writeBuildFiles} from '../../packages/notabenda/dist/files.js';
import {createRetainedReleaseFiles} from '@notabenda/core/content';

export async function astroFiles() {
  const generated=new URL('./.generated/public/',import.meta.url);
  await mkdir(new URL('./astro/',generated),{recursive:true});
  await mkdir(new URL('./assets/',generated),{recursive:true});
  await copyFile(new URL('../form-permissions/style.css',import.meta.url),new URL('./assets/form-permissions.css',generated));
  await copyFile(new URL('../static/example-pages.css',import.meta.url),new URL('./assets/example-pages.css',generated));
  await copyFile(new URL('../static/example-theme.css',import.meta.url),new URL('./assets/example-theme.css',generated));
  await copyFile(new URL('../../packages/notabenda/dist/styles.css',import.meta.url),new URL('./astro/site.css',generated));
  await writeFile(new URL('./astro/optional-sample.json',generated),JSON.stringify({example:'Fictional optional response only.'}));
  const previous=JSON.parse(await readFile(new URL('../releases/previous-preview-releases.json',import.meta.url),'utf8')).filter(artifact=>artifact.manifest.siteId===release.manifest.siteId);
  const permissionFiles=Object.fromEntries(Object.entries(permissionExample.build.files).filter(([path])=>path.startsWith('artifacts/')||/^form-permissions\/(?:privacy|cookies|terms)\//u.test(path)));
  const artifacts={...permissionFiles,...createRetainedReleaseFiles(previous,{siteId:release.manifest.siteId,mode:'preview'}),...Object.fromEntries(Object.entries(release.files).filter(([path])=>path.startsWith('artifacts/')))};
  await writeBuildFiles(fileURLToPath(generated),artifacts);
  const publicInputs=new Set([...Object.keys(artifacts),'astro/site.css','astro/optional-sample.json','assets/example-pages.css','assets/example-theme.css','assets/form-permissions.css']);
  async function checkInputs(folder,prefix='') {
    for(const entry of await readdir(folder,{withFileTypes:true})){
      const path=prefix+entry.name;
      if(entry.isDirectory())await checkInputs(new URL(entry.name+'/',folder),path+'/');
      else if(!entry.isFile()||!publicInputs.has(path))throw new Error('Unexpected Astro public input; inspect unmanaged generated assets before building.');
    }
  }
  await checkInputs(generated);
  const allowed=new Set(['agreement/astro/index.html','agreement/astro/review/index.html','form-permissions/astro/index.html','form-permissions/astro/review/index.html',...Object.keys(artifacts),'astro/site.css','astro/site.json','astro/optional-sample.json','assets/example-pages.css','assets/example-theme.css','assets/form-permissions.css',...['index','notes','privacy','cookies','terms','requests'].map(page=>page==='index'?'astro/index.html':`astro/${page}/index.html`)]);
  const asset=path=>/^_astro\/[a-zA-Z0-9_.-]+\.(?:js|css)$/u.test(path);
  const root=fileURLToPath(new URL('./',import.meta.url));
  await new Promise((done,reject)=>{
    const child=spawn(process.execPath,[fileURLToPath(new URL('../../node_modules/astro/bin/astro.mjs',import.meta.url)),'build','--root',root],{env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
    let output='';for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output+=chunk;});
    child.on('error',reject);child.on('close',code=>code===0?done():reject(new Error('Astro example build failed:\n'+output)));
  });
  const files={};
  async function visit(folder,prefix='') {
    for(const entry of await readdir(folder,{withFileTypes:true})) {
      const path=prefix+entry.name;
      if(entry.isDirectory())await visit(new URL(entry.name+'/',folder),path+'/');
      else if(entry.isFile()&&(allowed.has(path)||asset(path)))files[path]=await readFile(new URL(entry.name,folder),'utf8');
      else if(entry.isFile())throw new Error('Unexpected Astro output; inspect unmanaged generated assets before publishing.');
      else throw new Error('Unexpected Astro output entry.');
    }
  }
  await visit(new URL('./dist/',import.meta.url));
  return files;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(`Built real Astro example (${Object.keys(await astroFiles()).length} files).`);
