// @requirements REQ-PRODUCT-TERMS-RECOVERY
// @requirements REQ-PRODUCT-COLLECTION-FLOW
// @requirements REQ-QC-PROFILING
// @requirements REQ-EU-ORDER-ACTION
// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-BUNDLE-BUDGET
import {build,version as esbuildVersion} from 'esbuild';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function measureJavaScript(id,imports,budgetBytes=null,external=[]){
 const result=await build({absWorkingDir:root,stdin:{contents:imports.map(i=>`export {${i.exports.join(',')}} from '${i.entry}';`).join('\n'),resolveDir:root,sourcefile:'bundle-measure.mjs'},bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',external,write:false,metafile:true,logLevel:'silent'});
 const output=result.outputFiles[0].contents,contributions=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([path,v])=>({path,bytesInOutput:v.bytesInOutput})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),gzipBytes=gzipSync(output,{level:9}).length;
 return {profile:{id,entry:imports[0].entry,exports:imports[0].exports,imports,external,bytes:output.length,sha256:digest(output),gzipBytes,budgetBytes,withinBudget:budgetBytes===null?null:gzipBytes<=budgetBytes,inputs:contributions.map(v=>v.path)},contributions};
}
export async function measureBundles({explain=false}={}){
 const profiles=[];let coreContributions;
 for(const [id,entry,exports,budgetBytes] of [
  ['compiled-local','@notabenda/core/consent','createConsentRuntime,mountControls',15*1024],
  ['connection-inspection','@notabenda/core/consent/inspect','inspectConsentConnection',null],
  ['compiled-required','@notabenda/core/consent','createConsentRuntime,mountControls',null],
  ['react-compiled','@notabenda/core/react/consent','ConsentProvider,ConsentControls,PreferencesButton,useConsentController,useConsentSnapshot,usePurposeAllowed,useServiceAllowed',null],
  ['service-directory','@notabenda/core/services','createServiceDirectory,renderServiceDirectory,mountServiceDirectory',null],
  ['paid-order-review','@notabenda/core/orders','renderPaidOrderReview',null],
  ['paid-order-action','@notabenda/core/orders','createPaidOrderAction,mountPaidOrderAction',null],
  ['terms-recovery','@notabenda/core/terms/recovery','createRecoverableTermsAcceptance,createIndexedDBTermsRecoveryJournal',null],
  ['collection-flow','@notabenda/core/collection/flow','normalizeCollectionFlow,renderCollectionFlow,mountCollectionFlow',null],
  ['storage-exceptions','@notabenda/core/storage-exceptions','createStorageExceptions,createIndexedDBStorageExceptionJournal',null],
  ['storage-exception-controls','@notabenda/core/storage-exceptions/ui','mountStorageExceptionControls,rejectAllOptionalActivity',null],
  ['headless','@notabenda/core/headless','createConsent',null],
  ['core-controls','@notabenda/core','createConsent,mountControls',15*1024],
  ['compatibility-controls','@notabenda/core/consent/compat','createCompatibilityConsent',null],
 ]){
  const additionalImports=id==='compiled-required'?[{entry:'@notabenda/core/consent/evidence',exports:['requiredConsentEvidence']}]:id==='react-compiled'?[{entry:'@notabenda/core/consent',exports:['createConsentRuntime']}]:id==='compatibility-controls'?[{entry:'@notabenda/core',exports:['mountControls']}]:[];
  const imports=[{entry,exports:exports.split(',')},...additionalImports],external=id==='react-compiled'?['react']:[];
  const measured=await measureJavaScript(id,imports,budgetBytes,external);
  profiles.push(measured.profile);if(id==='core-controls')coreContributions=measured.contributions;
 }
 for(const [id,file,budgetBytes] of [['consent-css','consent.css',5*1024],['all-component-css','styles.css',null],['service-directory-css','services.css',null],['storage-exception-css','storage-exceptions.css',null],['technology-notice-css','technology.css',null]]){
  const bytes=await readFile(new URL('../packages/notabenda/dist/'+file,import.meta.url)),gzipBytes=gzipSync(bytes,{level:9}).length;
  profiles.push({id,entry:'@notabenda/core/'+file,bytes:bytes.length,sha256:digest(bytes),gzipBytes,budgetBytes,withinBudget:budgetBytes===null?null:gzipBytes<=budgetBytes,inputs:['packages/notabenda/dist/'+file]});
 }
 const explanationProfiles=[];
 if(explain)for(const [id,exports] of [['site-validation',['validateSiteConfig']],['public-projection',['toPublicConfig']],['projection-controls',['toPublicConfig','mountControls']]])explanationProfiles.push((await measureJavaScript(id,[{entry:'@notabenda/core',exports}])).profile);
 return {schemaVersion:1,tool:{name:'esbuild',version:esbuildVersion,target:'es2022',format:'esm',minify:true},compression:{name:'gzip',level:9,library:'zlib',version:process.versions.zlib},environment:{runtime:'node',version:process.version,platform:process.platform,architecture:process.arch},profiles,allBudgetsMet:profiles.every(p=>p.withinBudget!==false),...(explain?{explanation:{kind:'current-public-composition',sizesAreAdditive:false,publicBoundaryProfiles:explanationProfiles,coreInputContributions:coreContributions}}:{})};
}
const formatProfile=p=>`${p.id.padEnd(20)} ${(p.gzipBytes/1024).toFixed(2).padStart(6)} KiB gzip${p.budgetBytes===null?' · reported separately':` / ${(p.budgetBytes/1024).toFixed(0)} KiB target · ${p.withinBudget?'within target':'OVER TARGET'}`}`;
export function formatBundleReport(report){return report.profiles.map(formatProfile).join('\n')+(report.explanation?'\n\nCurrent public composition (gzip sizes are not additive; original budgets are unchanged):\n'+report.explanation.publicBoundaryProfiles.map(formatProfile).join('\n'):'')+'\n';}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.some(a=>!['--json','--check','--explain','--help'].includes(a))){console.error('Usage: node scripts/measure-bundles.mjs [--json] [--check] [--explain]');process.exitCode=2;}
 else if(args.includes('--help'))console.log('Measure built browser entries and CSS. --json emits deterministic evidence; --check exits 1 when a stated target is missed. --explain adds public composition profiles and minified input contributions; gzip sizes are not additive. Run npm run build first.');
 else try{const report=await measureBundles({explain:args.includes('--explain')});console.log(args.includes('--json')?JSON.stringify(report,null,2):formatBundleReport(report).trimEnd());if(args.includes('--check')&&!report.allBudgetsMet)process.exitCode=1;}
 catch{console.error('Bundle measurement failed. Build the workspace first and inspect its dependency/configuration errors.');process.exitCode=2;}
}
