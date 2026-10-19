// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-BUNDLE-BUDGET
import {build,version as esbuildVersion} from 'esbuild';
import {gzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function measureBundles(){
 const profiles=[];
 for(const [id,entry,exports,budgetBytes] of [
  ['headless','notabenda/headless','createConsent',null],
  ['core-controls','notabenda','createConsent,mountControls',15*1024],
 ]){
  const result=await build({stdin:{contents:`export {${exports}} from '${entry}';`,resolveDir:root,sourcefile:'bundle-measure.mjs'},bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',write:false,metafile:true,logLevel:'silent'});
  const output=result.outputFiles[0].contents,inputs=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([path])=>path).sort();
  const gzipBytes=gzipSync(output,{level:9}).length;
  profiles.push({id,entry,exports:exports.split(','),bytes:output.length,gzipBytes,budgetBytes,withinBudget:budgetBytes===null?null:gzipBytes<=budgetBytes,inputs});
 }
 for(const [id,file,budgetBytes] of [['consent-css','consent.css',5*1024],['all-component-css','styles.css',null]]){
  const bytes=await readFile(new URL('../packages/notabenda/dist/'+file,import.meta.url)),gzipBytes=gzipSync(bytes,{level:9}).length;
  profiles.push({id,entry:'notabenda/'+file,bytes:bytes.length,gzipBytes,budgetBytes,withinBudget:budgetBytes===null?null:gzipBytes<=budgetBytes,inputs:['packages/notabenda/dist/'+file]});
 }
 return {schemaVersion:1,tool:{name:'esbuild',version:esbuildVersion,target:'es2022',format:'esm',minify:true},compression:{name:'gzip',level:9},profiles,allBudgetsMet:profiles.every(p=>p.withinBudget!==false)};
}
export function formatBundleReport(report){return report.profiles.map(p=>`${p.id.padEnd(20)} ${(p.gzipBytes/1024).toFixed(2).padStart(6)} KiB gzip${p.budgetBytes===null?' · reported separately':` / ${(p.budgetBytes/1024).toFixed(0)} KiB target · ${p.withinBudget?'within target':'OVER TARGET'}`}`).join('\n')+'\n';}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.some(a=>!['--json','--check','--help'].includes(a))){console.error('Usage: node scripts/measure-bundles.mjs [--json] [--check]');process.exitCode=2;}
 else if(args.includes('--help'))console.log('Measure built browser entries and CSS. --json emits deterministic evidence; --check exits 1 when a stated target is missed. Run npm run build first.');
 else try{const report=await measureBundles();console.log(args.includes('--json')?JSON.stringify(report,null,2):formatBundleReport(report).trimEnd());if(args.includes('--check')&&!report.allBudgetsMet)process.exitCode=1;}
 catch{console.error('Bundle measurement failed. Build the workspace first and inspect its dependency/configuration errors.');process.exitCode=2;}
}
