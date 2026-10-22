// @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION REQ-PRODUCT-CONFIG-SOURCES
import {readConfigInput} from './config-source.js';
import {explainLegalDocument} from './document-explanation.js';
import type {DocumentKind} from './types.js';

export async function runDocumentExplanationCli(args:string[]):Promise<void>{
 let configPath:string|undefined,kind:DocumentKind|undefined,preview=false,json=false;const seen=new Set<string>();
 while(args.length){
  const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate explain option.');seen.add(flag);
  if(flag==='--preview'){preview=true;continue;}if(flag==='--json'){json=true;continue;}
  if(flag!=='--config'&&flag!=='--document')throw Error('explain accepts --config FILE, --document privacy|cookies|terms, --preview and --json.');
  const value=args.shift();if(!value||value.startsWith('-'))throw Error('Explain options need explicit values.');
  if(flag==='--config')configPath=value;
  else{if(!['privacy','cookies','terms'].includes(value))throw Error('Use privacy, cookies or terms for --document.');kind=value as DocumentKind;}
 }
 if(!configPath||!kind)throw Error('explain requires --config FILE and --document privacy|cookies|terms.');
 const input=await readConfigInput(configPath),mode=preview?'preview':'production';
 const report=explainLegalDocument(input,kind,{mode});
 console.log(json?JSON.stringify(report,null,2):[
  `${kind} document inputs · ${mode} · declared content status: ${report.document.reviewStatus}`,
  'Current input review. Facts, legal applicability, content approval and publication are not verified.',
  ...report.sections.flatMap(s=>['',`${s.id} · ${s.origin}`,s.reason,...s.inputPaths.map(p=>'  '+p),`Requirements: ${s.requirementIds.join(', ')}`]),
  '', 'Paths are JSON Pointers into the supplied configuration. No files changed.',
 ].join('\n'));
}
