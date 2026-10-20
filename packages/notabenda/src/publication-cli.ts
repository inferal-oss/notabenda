// @requirements REQ-PRODUCT-PUBLICATION-CHECK
import {readCliJson} from './cli-json.js';
import {checkLegalPublication} from './publication.js';
import {selectCartridges} from './cartridges.js';
export async function runPublicationCli(args:string[]):Promise<void>{
 let artifactPath:string|undefined,origin:string|undefined,packs:string|undefined,preview=false,allowLoopback=false,json=false;const seen=new Set<string>();
 while(args.length){const flag=args.shift()!;if(seen.has(flag)||!['--artifact','--origin','--packs','--preview','--allow-loopback','--json'].includes(flag))throw Error('check-publication accepts --artifact FILE --origin URL, optional --packs ID,ID, --preview, --allow-loopback and --json once each.');seen.add(flag);
  if(flag==='--preview'){preview=true;continue;}if(flag==='--allow-loopback'){allowLoopback=true;continue;}if(flag==='--json'){json=true;continue;}
  const value=args.shift();if(!value||value.startsWith('--'))throw Error('Publication check options need explicit values.');if(flag==='--artifact')artifactPath=value;else if(flag==='--origin')origin=value;else packs=value;
 }
 if(!artifactPath||!origin)throw Error('Supply an explicit --artifact FILE and --origin URL.');
 const artifact=await readCliJson(artifactPath,128*1024,'Artifact input must be an ordinary JSON file of at most 128 KiB; larger artifacts are unsupported. No deployment was inspected.');
 const report=await checkLegalPublication(artifact,{origin,mode:preview?'preview':'production',allowLoopback,...(packs===undefined?{}:{packs:selectCartridges(packs.split(','))})});
 if(json)console.log(JSON.stringify(report,null,2));
 else console.log(`${report.checker.name} ${report.checker.version} · retained release publication\n${report.release.artifactId}\nObserved origin: ${report.origin}\nConfigured origin: ${report.configuredOrigin}\nArtifact mode: ${report.release.mode}\nValidation mode: ${report.validationMode}\n`+report.checks.map(check=>`${check.outcome}: ${check.url}`).join('\n')+`\n${report.retainedFilesMatched?'The four retained release files matched.':'The retained release files did not all match.'}\nActive controls, current routes, service behavior, evidence and legal review remain unverified. This is a bounded observation, not an installation or compliance certificate.`);
 if(!report.retainedFilesMatched)process.exitCode=1;
}
