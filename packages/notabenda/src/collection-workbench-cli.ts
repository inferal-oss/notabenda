// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH
import {resolve,relative,dirname} from 'node:path';
import {mkdir,realpath,lstat} from 'node:fs/promises';
import {readCliJson} from './cli-json.js';
import {readConfigInput} from './config-source.js';
import {createCollectionWorkbenchFiles} from './collection-workbench-build.js';
import type {CollectionFlowSettings} from './collection-flow.js';
import {writeBuildFiles} from './files.js';
/** Explicit local files only. No server, installer, remote lookup, persistence service or automatic publish. */
export async function runCollectionWorkbenchCli(args:string[]):Promise<void>{
 const values:Record<string,string>=Object.create(null),seen=new Set<string>();let preview=false;
 while(args.length){const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate form-workbench option.');seen.add(flag);if(flag==='--preview'){preview=true;continue;}if(!['--artifact','--purposes','--settings','--out-dir'].includes(flag))throw Error('form-workbench requires --artifact FILE --purposes ID,ID --out-dir NEW; optional --settings FILE and --preview.');const value=args.shift();if(!value||value.startsWith('-'))throw Error('Supply an explicit value for '+flag+'.');values[flag]=value;}
 if(!values['--artifact']||!values['--purposes']||!values['--out-dir'])throw Error('form-workbench requires --artifact FILE --purposes ID,ID --out-dir NEW.');
 const output=resolve(values['--out-dir']),parent=await realpath(dirname(output));
 // Refuse existing outputs and symlinks before reading/copying any input into them.
 try{await lstat(output);throw Error('Choose a new workbench output directory.');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const artifact=await readCliJson(values['--artifact'],128*1024,'Could not read the bounded public artifact.'),settings=values['--settings']?await readConfigInput(values['--settings']) as CollectionFlowSettings:undefined;
 const files=await createCollectionWorkbenchFiles(artifact,{purposeIds:values['--purposes'].split(','),...(settings?{settings}:{})},{mode:preview?'preview':'production'});
 await mkdir(output);await writeBuildFiles(output,files);
 const local=relative(parent,output);console.log('Prepared '+local+'/index.html. Open it locally; no server or upload is needed. It exports settings only. Keep this tool outside your public deployment.');
}
