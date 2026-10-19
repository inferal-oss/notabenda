/** @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-DISCOVERY */
import {mkdir,writeFile} from 'node:fs/promises';
import {readCliJson} from './cli-json.js';
import {resolve,join} from 'node:path';
import {analyzeBrowserCatalogCapture,recognizeLegacyBrowserCapture} from './catalog-browser.js';
const readJson=(path:string,max:number)=>readCliJson(path,max,'Browser capture/rule input must be an ordinary, bounded UTF-8 JSON file.');
export async function runBrowserCatalogCli(args:string[]):Promise<void>{
 if(args.shift()!=='detect')throw Error('Use catalog detect --capture FILE [--rules FILE] [--out-dir NEW] [--json].');
 let captureFile:string|undefined,rulesFile:string|undefined,out:string|undefined,json=false;const seen=new Set<string>();
 while(args.length){const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate browser catalog option.');seen.add(flag);if(flag==='--json'){json=true;continue;}if(!['--capture','--rules','--out-dir'].includes(flag))throw Error('Use explicit --capture, optional --rules, --out-dir or --json. No browser/project launch or probe is performed.');const value=args.shift();if(!value||value.startsWith('--'))throw Error('Browser catalog option requires a value.');if(flag==='--capture')captureFile=value;else if(flag==='--rules')rulesFile=value;else out=value;}
 if(!captureFile)throw Error('Supply one explicit browser --capture FILE. This command does not launch a browser.');
 const input=await readJson(captureFile,3*1024*1024),rules=rulesFile?await readJson(rulesFile,1024*1024):undefined;
 const isCatalog=!!input&&typeof input==='object'&&!Array.isArray(input)&&(input as {kind?:unknown}).kind==='catalog-browser-capture';
 const report=isCatalog?analyzeBrowserCatalogCapture(input,rules===undefined?{}:{expectedRules:rules}):analyzeBrowserCatalogCapture(recognizeLegacyBrowserCapture(input,rules??(await import('./catalog-browser-seed.js')).browserCatalogSeed));
 const summary=[`Browser catalog review · ${report.capture.ruleSet.id} ${report.capture.ruleSet.revision}`,`Observed origin: ${report.capture.capture.pageOrigin} · ${report.capture.capture.routeLabel} · ${report.capture.capture.scenario}`,`Mode: ${report.capture.mode}. ${report.findings.length} product candidate(s). All require actual-use review.`,...report.findings.flatMap(f=>[`${f.providerName} / ${f.productName} [${f.productId}] · ${f.status==='matched'?'reported pattern match':'partial hint'}`,...f.rules.flatMap(r=>[`  ${r.id} / ${r.revision}: ${r.status}`,...r.evidence.map(e=>`    ${e.signalId} · ${e.channel} ×${e.count}`)])]),'',...report.notes].join('\n')+'\n';
 if(out){const path=resolve(out);await mkdir(path,{mode:0o700});await writeFile(join(path,'discovery.private.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(path,'review.txt'),summary,{flag:'wx',mode:0o600});await writeFile(join(path,'.gitignore'),'*\n!.gitignore\n',{flag:'wx',mode:0o600});}
 console.log(json?JSON.stringify(report,null,2):summary.trimEnd());
}
