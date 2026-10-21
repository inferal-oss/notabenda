// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
import {readFile,writeFile,mkdir,copyFile,unlink} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {createProcessingNotice} from '@notabenda/core/content';
const root=new URL('./',import.meta.url),extra=process.argv.slice(2);
for(let i=0;i<extra.length;i++){if(extra[i]==='--preview')continue;if(extra[i]==='--retain-artifact'&&extra[i+1]&&!extra[i+1].startsWith('--')){i++;continue;}throw Error('Use --preview or explicit --retain-artifact files.');}
const metadataUrl=new URL('../package.json',import.meta.resolve('@notabenda/core/content')),metadata=JSON.parse(await readFile(metadataUrl,'utf8'));
if(metadata.name!=='@notabenda/core'||typeof metadata.bin?.notabenda!=='string')throw Error('Install the matching core package with its CLI.');
const result=spawnSync(process.execPath,[fileURLToPath(new URL(metadata.bin.notabenda,metadataUrl)),'build','--config','notabenda.config.yaml','--consent-runtime','local','--out-dir','public',...extra],{cwd:root,stdio:'inherit'});if(result.status!==0)throw Error('Configuration build failed.');
const runtime=JSON.parse(await readFile(new URL('public/consent-runtime.json',root),'utf8')),manifest=JSON.parse(await readFile(new URL('public/notabenda.manifest.json',root),'utf8')),artifact=JSON.parse(await readFile(new URL('public/artifacts/'+manifest.artifactId+'.json',root),'utf8'));
const notice=createProcessingNotice(artifact,{scopeId:'privacy-choices',activities:['sale','targeted-advertising'],wording:{title:'Your privacy choices',description:'Ask Juniper Notes to stop selling your information or using it for targeted advertising. Your cookie choices stay separate.',actionLabel:'Opt out of sale and targeted advertising'}},runtime.mode==='preview'?{mode:'preview'}:{});
const noticeText=JSON.stringify(notice,null,2)+'\n';await writeFile(new URL('public/processing-notice.json',root),noticeText);
await mkdir(new URL('public/artifacts/'+notice.artifactId+'/processing/',root),{recursive:true});await writeFile(new URL('public/artifacts/'+notice.artifactId+'/processing/'+notice.noticeId+'.json',root),noticeText);
await mkdir(new URL('.generated/',root),{recursive:true});const operatorHtml=await readFile(new URL('operator.html',root),'utf8');await writeFile(new URL('.generated/release.mjs',root),'export default '+JSON.stringify({runtime,notice,artifact,operatorHtml})+';\n');
await unlink(new URL('public/operator.html',root)).catch(e=>{if(e.code!=='ENOENT')throw e;});
for(const name of ['index.html','style.css'])await copyFile(new URL(name,root),new URL('public/'+name,root));
await mkdir(new URL('public/assets/',root),{recursive:true});for(const name of ['client','operator'])await build({entryPoints:[new URL(name+'.mjs',root).pathname],outfile:new URL('public/assets/'+name+'.mjs',root).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
console.log('Built processing example. Host context and operator permissions still need implementation; no default account or credential was created.');
