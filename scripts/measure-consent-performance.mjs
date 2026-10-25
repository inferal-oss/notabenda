// @requirements REQ-PRODUCT-BUNDLE-BUDGET
import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
import {createConsentRuntime} from '@notabenda/core/consent';
import {performanceInventories} from './performance-inventories.mjs';
import {measureConsent} from './consent-performance.mjs';
import {cpus} from 'node:os';
const args=process.argv.slice(2);
if(args.some(arg=>!['--json','--help'].includes(arg))||new Set(args).size!==args.length){console.error('Use npm run perf -- --json or --help.');process.exitCode=2;}
else if(args.includes('--help'))console.log('Measure built local consent constructors, granted snapshots and synchronous choice calls using synthetic inventories. Node-only CPU timings, with no timing pass/fail threshold or prescribed CI. Run npm run build first.');
else{
 const results=[];
 for(const data of await performanceInventories())for(const [profile,create,input] of [['compiled-local',createConsentRuntime,data.compiled],['compatibility',createConsent,data.config]]){
  results.push({inventory:data.id,purposes:data.purposes,services:data.services,profile,...await measureConsent({create,input,inventory:data.config})});
 }
 const report={schemaVersion:1,kind:'consent-performance-measurement',environment:{runtime:process.version,platform:process.platform,architecture:process.arch,cpu:cpus()[0]?.model},results};
 console.log(args.includes('--json')?JSON.stringify(report,null,2):results.map(r=>`${r.profile} · ${r.purposes} purposes / ${r.services} services\n`+Object.entries(r.phases).map(([id,s])=>`  ${id}: median ${s.median.toFixed(3)} ms; p95 ${s.p95.toFixed(3)} ms`).join('\n')).join('\n'));
}
