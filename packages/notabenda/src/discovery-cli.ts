/** @requirements REQ-PRODUCT-DISCOVERY REQ-PRODUCT-SERVICE-DETECTION */
import {createReadStream} from 'node:fs';
import {mkdir,lstat,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {analyzeDiscovery} from './discovery.js';
async function readJson(path:string,max:number):Promise<unknown>{
 const parts:Buffer[]=[];let size=0;
 try{for await(const chunk of createReadStream(resolve(path))){size+=chunk.length;if(size>max)throw new Error();parts.push(chunk as Buffer);}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));}
 catch{throw new Error('A discovery input could not be read as bounded UTF-8 JSON.');}
}
export async function runDiscoveryCli(args:string[]):Promise<void>{
 if(args.includes('--project')){await (await import('./catalog-cli.js')).runCatalogCli(args,'project');return;}
 let config='notabenda.config.json',out:string|undefined,captureOrigin:string|undefined,json=false;const captures:string[]=[],seen=new Set<string>();
 while(args.length){const flag=args.shift()!;if(seen.has(flag)&&flag!=='--capture')throw new Error('Duplicate discovery option.');seen.add(flag);
  if(flag==='--json'){json=true;continue;}
  if(!['--config','--capture','--out-dir','--capture-origin'].includes(flag))throw new Error('Unknown discovery option. Use --config, --capture, --capture-origin, --out-dir or --json.');
  const value=args.shift();if(!value||value.startsWith('--'))throw new Error('Discovery option requires a value.');
  if(flag==='--capture-origin')captureOrigin=value;else if(flag==='--config')config=value;else if(flag==='--out-dir')out=value;else{captures.push(value);if(captures.length>20)throw new Error('Supply at most 20 explicit capture files.');}
 }
 if(!captures.length)throw new Error('Supply at least one explicit --capture FILE. Capture in your browser first; this command does not crawl or launch a browser.');
 const input=await readJson(config,512*1024),values=[];
 for(const path of captures)values.push(await readJson(path,1024*1024));
 const report=analyzeDiscovery(input,values,captureOrigin===undefined?{}:{captureOrigin});
 const summary=[`Discovery review · ${report.siteId}`,`${report.captureCount} capture(s), ${report.findings.length} observation group(s), ${report.unmappedCount} unmapped group(s).`,...report.findings.map(f=>`[${f.scenario} · ${f.routeLabel}] ${f.kind}: ${f.origin??f.storageType??''} ${f.label} ×${f.count} → ${f.candidateServiceIds.length?f.candidateServiceIds.join(', '):'Review unmapped observation'} [${f.requirementIds.join(', ')}]`),'',...report.reviewNotes].join('\n')+'\n';
 if(out){const directory=resolve(out);try{await lstat(directory);throw new Error('Discovery output directory already exists.');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  await mkdir(directory,{mode:0o700});
  await writeFile(join(directory,'discovery.private.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(directory,'review.txt'),summary,{flag:'wx',mode:0o600});
  await writeFile(join(directory,'.gitignore'),'*\n!.gitignore\n',{flag:'wx',mode:0o600});
 }
 console.log(json?JSON.stringify(report,null,2):summary.trimEnd());
}
