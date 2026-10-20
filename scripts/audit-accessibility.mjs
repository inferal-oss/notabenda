// @requirements REQ-PRODUCT-A11Y
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {auditAccessibility} from './accessibility-audit.mjs';
const root=new URL('../site/dist/public/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('../site/dist/asset-manifest.json',import.meta.url),'utf8'));
const pages=manifest.filter(p=>p.endsWith('.html')&&!p.startsWith('artifacts/'));
const results=[];
for(const path of pages){
 results.push(await auditAccessibility(await readFile(new URL(path,root),'utf8'),{label:path,url:'https://example.test/'+path}));
 if(results.length%25===0)console.log(`${results.length}/${pages.length} current HTML pages checked`);
}
const failures=results.filter(r=>r.violations.length||r.structural.length||r.warnings.length);
const report={engine:'axe-core',scope:'Current static HTML, with app scripts and remote resource loads disabled. Historical artifacts are preserved and excluded.',limitations:'Semantic checks only; incomplete findings need review. Contrast, browser states, keyboard and assistive technology require separate checks.',pages:pages.length,failures:failures.length,incompletePages:results.filter(r=>r.incomplete.length).length,results};
await mkdir(new URL('../.local/',import.meta.url),{recursive:true});
await writeFile(new URL('../.local/accessibility-static-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pages:report.pages,failures:report.failures,incompletePages:report.incompletePages,report:'.local/accessibility-static-report.json',findings:failures.map(r=>({page:r.label,violations:r.violations.map(v=>v.id),structural:r.structural,warnings:r.warnings}))},null,2));
if(failures.length)process.exitCode=1;
