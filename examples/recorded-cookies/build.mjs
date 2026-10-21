// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CONSENT-NOTICE-FILES
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile,unlink} from 'node:fs/promises';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url),extra=process.argv.slice(2);
for(let i=0;i<extra.length;i++){
  if(extra[i]==='--preview')continue;
  if(['--retain-artifact','--retain-consent-notice'].includes(extra[i])&&extra[i+1]&&!extra[i+1].startsWith('--')){i++;continue;}
  throw Error('Use --preview or explicit --retain-artifact/--retain-consent-notice files.');
}
// The preview package's content export and declared executable share its installed root.
// Invoke that executable directly; npx can query a registry when a fresh workspace has no bin shim.
const metadataUrl=new URL('../package.json',import.meta.resolve('@notabenda/core/content'));
const metadata=JSON.parse(await readFile(metadataUrl,'utf8'));
if(metadata.name!=='@notabenda/core'||typeof metadata.bin?.notabenda!=='string')throw Error('Install the matching core package with its CLI.');
const cli=fileURLToPath(new URL(metadata.bin.notabenda,metadataUrl));
const result=spawnSync(process.execPath,[cli,'build','--config','notabenda.config.yaml','--consent-runtime','required','--consent-scope','cookie-choices','--out-dir','public',...extra],{cwd:root,stdio:'inherit',env:{...process.env,npm_config_update_notifier:'false'}});
if(result.status!==0)throw Error('Legal configuration build failed. No application bundle was built.');
const json=async path=>JSON.parse(await readFile(new URL('public/'+path,root),'utf8'));
const runtime=await json('consent-runtime.json'),notice=await json('consent-notice.json'),artifact=await json('artifacts/'+notice.artifactId+'.json');
if(runtime.evidence!=='required'||notice.siteId!==runtime.inventory.site.id||notice.artifactId!==artifact.manifest.artifactId)throw Error('Generated build references do not agree.');
await mkdir(new URL('.generated/',root),{recursive:true});
const operatorHtml=await readFile(new URL('operator.html',root),'utf8');
await writeFile(new URL('.generated/release.mjs',root),'// Compiled public legal inputs and server-served operator template. No private configuration or secrets.\nexport default '+JSON.stringify({runtime,notice,artifact,operatorHtml})+';\n');
// Keep the protected template out of asset HTML aliases, including older example builds.
await unlink(new URL('public/operator.html',root)).catch(error=>{if(error.code!=='ENOENT')throw error;});
for(const name of ['index.html','style.css'])await copyFile(new URL(name,root),new URL('public/'+name,root));
await mkdir(new URL('public/assets/',root),{recursive:true});
for(const name of ['client','operator'])await build({entryPoints:[new URL(name+'.mjs',root).pathname],outfile:new URL('public/assets/'+name+'.mjs',root).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,sourcemap:false});
console.log('Built required-cookie application. Recording and activation still require host authorization.');
