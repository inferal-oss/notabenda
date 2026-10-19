/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION */
import {mkdir,writeFile} from 'node:fs/promises';
import {loadServiceCatalog} from './catalog-node.js';
import {resolve,join} from 'node:path';
import {searchServiceCatalog} from './catalog.js';
import {scanProjectServices} from './catalog-project.js';
export async function runCatalogCli(args:string[],mode:'project'|'search'):Promise<void>{
 let directory:string|undefined,catalogFile:string|undefined,out:string|undefined,json=false,delivery:'browser'|'backend'|'infrastructure'|undefined,limit=20,query='';const seen=new Set<string>();
 if(mode==='search'){if(args.shift()!=='search')throw Error('Use notabenda catalog search QUERY [--delivery browser|backend|infrastructure] [--limit 1–100] [--json].');if(args[0]&&!args[0].startsWith('--'))query=args.shift()!;}
 while(args.length){const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate catalog option.');seen.add(flag);if(flag==='--json'){json=true;continue;}
  if(!['--project','--catalog','--out-dir','--delivery','--limit'].includes(flag))throw Error('Unknown catalog/project option. Browser capture options cannot be mixed with project scanning.');
  const value=args.shift();if(!value||value.startsWith('--'))throw Error('Catalog/project option requires a value.');
  if(flag==='--project')directory=value;else if(flag==='--catalog')catalogFile=value;else if(flag==='--out-dir')out=value;else if(flag==='--delivery'){if(!['browser','backend','infrastructure'].includes(value))throw Error('Select browser, backend or infrastructure delivery.');delivery=value as typeof delivery;}else{if(!/^[1-9][0-9]*$/u.test(value)||Number(value)>100)throw Error('Use a limit between 1 and 100.');limit=Number(value);}
 }
 if(mode==='project'&&(!directory||delivery!==undefined||seen.has('--limit'))||mode==='search'&&(directory||out))throw Error('Project scans require --project DIRECTORY; delivery/limit apply only to catalog search.');
 const catalog=await loadServiceCatalog(catalogFile);
 const report=mode==='project'?await scanProjectServices(directory!,catalog):{schemaVersion:1,kind:'service-catalog-search',catalog:{id:catalog.id,revision:catalog.revision},results:searchServiceCatalog(catalog,query,{limit,...(delivery?{delivery}:{})})};
 const summary='findings' in report?[`Project service review · ${report.catalog.id} ${report.catalog.revision}`,`${report.coverage.filesExamined} files examined; ${report.findings.length} product candidate(s); coverage ${report.coverage.limited?'limited':'bounded'}.`,...report.findings.flatMap(f=>[`${f.providerName} / ${f.productName} [${f.productId}] · review required`,...f.evidence.map(e=>`  ${e.file} · ${e.context} · ${e.identifier}${e.match==='prefix'?'*':''} [${e.ruleId}]`)]),'',...report.notes].join('\n'):[`Service catalog · ${catalog.id} ${catalog.revision}`,...report.results.map(r=>`${r.provider.name} / ${r.product.name} [${r.product.id}] · ${r.product.delivery.join(', ')} · ${r.product.review}`)].join('\n');
 if(out){const path=resolve(out);await mkdir(path,{mode:0o700});await writeFile(join(path,'discovery.private.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(path,'review.txt'),summary+'\n',{flag:'wx',mode:0o600});await writeFile(join(path,'.gitignore'),'*\n!.gitignore\n',{flag:'wx',mode:0o600});}
 console.log(json?JSON.stringify(report,null,2):summary);
}
