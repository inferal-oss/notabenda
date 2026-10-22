// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH
import {resolve,dirname} from 'node:path';
import {mkdir,realpath,lstat} from 'node:fs/promises';
import {readCliJson} from './cli-json.js';
import {readConfigInput} from './config-source.js';
import {normalizeProcessingNoticeSettings} from './processing-workbench.js';
import {createProcessingWorkbenchFiles,createProcessingNoticeFiles} from './processing-workbench-build.js';
import {writeBuildFiles} from './files.js';
/** Exclusive output and explicit local paths. No project scan, identity, server or remote action. */
export async function runProcessingWorkbenchCli(command:'processing-workbench'|'processing-notice',args:string[]):Promise<void>{
 const values:Record<string,string>=Object.create(null),seen=new Set<string>();let preview=false;
 const usage=command+' --artifact FILE --out-dir NEW '+(command==='processing-notice'?'--settings FILE':'[--settings FILE]')+' [--preview]';
 while(args.length){const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate processing tool option.');seen.add(flag);if(flag==='--preview'){preview=true;continue;}if(!['--artifact','--settings','--out-dir'].includes(flag))throw Error('Usage: '+usage);const value=args.shift();if(!value||value.startsWith('-'))throw Error('Supply an explicit value for '+flag+'.');values[flag]=value;}
 if(!values['--artifact']||!values['--out-dir']||command==='processing-notice'&&!values['--settings'])throw Error('Usage: '+usage);
 const output=resolve(values['--out-dir']);await realpath(dirname(output));try{await lstat(output);throw Error('Choose a new processing tool output directory.');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const artifact=await readCliJson(values['--artifact'],128*1024,'Could not read the bounded public artifact.'),settings=values['--settings']?normalizeProcessingNoticeSettings(await readConfigInput(values['--settings'])):undefined,options={mode:preview?'preview' as const:'production' as const};
 const files=command==='processing-workbench'?await createProcessingWorkbenchFiles(artifact,settings?{settings}:{},options):createProcessingNoticeFiles(artifact,settings,options).files;
 await mkdir(output);await writeBuildFiles(output,files);
 console.log(command==='processing-workbench'?'Prepared index.html. Open it locally; no server or upload is needed. It exports settings only. Keep the editor outside your public deployment.':'Built processing-notice.json, its immutable notice-ID copy and exact retained policy files. Publishing does not register a notice, choose a host stream, record an opt-out or enforce downstream restrictions.');
}
