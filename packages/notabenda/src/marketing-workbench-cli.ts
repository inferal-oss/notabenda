// @requirements REQ-PRODUCT-MARKETING-AUTHORING
import {resolve,dirname} from 'node:path';
import {mkdir,realpath,lstat} from 'node:fs/promises';
import {readCliJson} from './cli-json.js';
import {readConfigInput} from './config-source.js';
import {normalizeMarketingRequestSettings} from './marketing-workbench.js';
import {createMarketingWorkbenchFiles,createMarketingRequestFiles} from './marketing-workbench-build.js';
import {writeBuildFiles} from './files.js';
/** Exclusive output and explicit local paths. No project scan, identity, server or remote action. */
export async function runMarketingWorkbenchCli(command:'marketing-workbench'|'marketing-request',args:string[]):Promise<void>{
 const values:Record<string,string>=Object.create(null),seen=new Set<string>();let preview=false;
 const usage=command+' --artifact FILE --out-dir NEW '+(command==='marketing-request'?'--settings FILE':'--purpose ID [--settings FILE]')+' [--preview]';
 while(args.length){const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate marketing tool option.');seen.add(flag);if(flag==='--preview'){preview=true;continue;}if(!['--artifact','--settings','--out-dir',...(command==='marketing-workbench'?['--purpose']:[])].includes(flag))throw Error('Usage: '+usage);const value=args.shift();if(!value||value.startsWith('-'))throw Error('Supply an explicit value for '+flag+'.');values[flag]=value;}
 if(!values['--artifact']||!values['--out-dir']||command==='marketing-request'&&!values['--settings']||command==='marketing-workbench'&&!values['--purpose'])throw Error('Usage: '+usage);
 const output=resolve(values['--out-dir']);await realpath(dirname(output));try{await lstat(output);throw Error('Choose a new marketing tool output directory.');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const artifact=await readCliJson(values['--artifact'],128*1024,'Could not read the bounded public artifact.'),settings=values['--settings']?normalizeMarketingRequestSettings(await readConfigInput(values['--settings'])):undefined,options={mode:preview?'preview' as const:'production' as const};
 const files=command==='marketing-workbench'?await createMarketingWorkbenchFiles(artifact,{purposeId:values['--purpose']!,...(settings?{settings}:{})},options):createMarketingRequestFiles(artifact,settings,options).files;
 await mkdir(output);await writeBuildFiles(output,files);
 console.log(command==='marketing-workbench'?'Prepared index.html. Open it locally; no server or upload is needed. It exports settings only. Keep the editor outside your public deployment.':'Built marketing-request.json, its immutable offer-ID copy and exact retained policy files. Publishing does not register or activate an offer, authorize an approach, bind a recipient, record permission or enforce actual sending/suppression.');
}
