// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-DISCOVERY
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {captureBrowserCatalog,analyzeBrowserCatalogCapture,normalizeBrowserCatalogCapture,recognizeLegacyBrowserCapture} from '@notabenda/core/catalog/browser';
import {browserCatalogSeed} from '@notabenda/core/catalog/browser/seed';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
import {scanProjectServices} from '@notabenda/core/catalog/project';
const labels={routeLabel:'Synthetic integration',scenario:'Explicit review'};
const examples=[
 ['segment-analytics','https://cdn.segment.com/analytics.js/v1/PRIVATE_WRITE_KEY/analytics.min.js',{analytics:[]}],
 ['sentry-monitoring','https://js.sentry-cdn.com/PRIVATE_PUBLIC_KEY.min.js',{}],
 ['datadog-monitoring','https://www.datadoghq-browser-agent.com/eu1/v7/datadog-rum.js',{}],
 ['zendesk-web-widget','https://static.zdassets.com/ekr/snippet.js?key=PRIVATE_WORKSPACE',{}],
 ['cloudflare-web-analytics','https://static.cloudflareinsights.com/beacon.min.js?token=PRIVATE_TOKEN',{}],
 ['plausible-analytics','https://plausible.io/js/pa-PRIVATE_SITE.js',{}],
 ['fathom-analytics','https://cdn.usefathom.com/script.js?PRIVATE_QUERY',{}],
 ['umami-cloud','https://cloud.umami.is/script.js',{}],
 ['microsoft-clarity','https://www.clarity.ms/tag/PRIVATE_PROJECT',{clarity:()=>assert.fail('No SDK call')}],
 ['crisp-chat','https://client.crisp.chat/l.js',{$crisp:[]}],
];
function capture(url,globals,channel='resource-entry',type='script'){
 const html=channel==='dom-reference'?`<script src="${url.replaceAll('&','&amp;').replaceAll('"','&quot;')}"></script>`:'';
 const dom=new JSDOM(html,{url:'https://example.test/review'});let reads=0;
 dom.window.fetch=()=>assert.fail('No probes');const value=captureBrowserCatalog(labels,browserCatalogSeed,{document:dom.window.document,globals,performance:{getEntriesByType:()=>{reads++;return channel==='resource-entry'?[{name:url,initiatorType:type}]:[];}},cookies:()=>'',localStorage:()=>({length:0,key:()=>assert.fail('No values'),getItem:()=>assert.fail('No values')})});
 dom.window.close();assert.equal(reads,1);return value;
}
const findings=value=>analyzeBrowserCatalogCapture(value).findings;
for(const [product,url,globals] of examples)test('source-backed browser reference: '+product,()=>{
 for(const channel of ['resource-entry','dom-reference']){const value=capture(url,globals,channel);assert.equal(findings(value).find(p=>p.productId===product)?.status,'matched');assert.doesNotMatch(JSON.stringify(value),/PRIVATE_/);assert.ok(findings(value).every(p=>p.reviewRequired));}
 for(const bad of [url.replace('https:','http:'),url.replace('https://','https://user:PRIVATE@'),url.replace(new URL(url).hostname,new URL(url).hostname+'.lookalike.test'),url.replace(new URL(url).hostname,new URL(url).hostname+':8443'),new URL('/unrelated.js',url).href])assert.notEqual(findings(capture(bad,globals)).find(p=>p.productId===product)?.status,'matched',bad);
 assert.notEqual(findings(capture(url,globals,'resource-entry','css')).find(p=>p.productId===product)?.status,'matched');
});
test('combined queue/function hints stay partial and getters, inherited globals or values never supply evidence',()=>{
 for(const id of ['segment-analytics','microsoft-clarity','crisp-chat']){
  const [,url,globals]=examples.find(e=>e[0]===id),name=Object.keys(globals)[0];let reads=0;const getter={};Object.defineProperty(getter,name,{get(){reads++;throw Error('PRIVATE');}});
  for(const candidate of [{},Object.create(globals),getter]){const value=capture(url,candidate);assert.equal(findings(value).find(p=>p.productId===id)?.status,'partial');}assert.equal(reads,0);
  assert.notEqual(findings(capture('https://other.example.test/script.js',globals)).find(p=>p.productId===id)?.status,'matched');
 }
});
test('path patterns are explicit recognition generalizations, not SDK-version or deployment-region validation',()=>{
 for(const path of ['/us1/v7/datadog-rum.js','/eu1/v7/datadog-rum.js','/ap1/v7/datadog-rum.js','/ap2/v7/datadog-rum.js','/us3/v7/datadog-rum.js','/us5/v7/datadog-rum.js','/uk1/v7/datadog-rum.js','/datadog-rum-v7.js','/custom/version/datadog-rum.js'])assert.equal(findings(capture('https://www.datadoghq-browser-agent.com'+path,{})).find(p=>p.productId==='datadog-monitoring')?.status,'matched');
 for(const [url,id] of [['https://plausible.io/js/pa%2Dprivate.js','plausible-analytics'],['https://static.zdassets.com/ekr/SNIPPET.js','zendesk-web-widget'],['https://cloud.umami.is/script.js.backup','umami-cloud'],['https://cdn.usefathom.com/other/script.js','fathom-analytics']])assert.notEqual(findings(capture(url,{})).find(p=>p.productId===id)?.status,'matched');
 const rule=browserCatalogSeed.rules.find(r=>r.id==='datadog-browser-rum');assert.match(rule.caveats.join(' '),/does not validate an SDK release/);
});
test('the earlier exact rule snapshot and its existing product pins remain independently interpretable',async()=>{
 const old=JSON.parse(await readFile(new URL('fixtures/browser-capture-2026-10-19.1.json',import.meta.url),'utf8')),before=JSON.stringify(old);assert.deepEqual(normalizeBrowserCatalogCapture(old),old);
 assert.deepEqual(findings(old).filter(f=>f.status==='matched').map(f=>f.productId),['stripe-payments']);assert.equal(findings(old).some(f=>f.productId==='microsoft-clarity'),false);assert.equal(JSON.stringify(old),before);
 for(const p of old.ruleSet.catalog.products)assert.deepEqual(browserCatalogSeed.catalog.products.find(n=>n.id===p.id),p,p.id);
 for(const p of old.ruleSet.catalog.providers)assert.deepEqual(browserCatalogSeed.catalog.providers.find(n=>n.id===p.id),p,p.id);
 assert.deepEqual(browserCatalogSeed.rules.slice(0,old.ruleSet.rules.length),old.ruleSet.rules);
 const current=capture('https://www.clarity.ms/tag/EXAMPLE',{clarity(){}});assert.equal(findings(current).find(f=>f.productId==='microsoft-clarity').status,'matched');assert.throws(()=>normalizeBrowserCatalogCapture(old,{expectedRules:browserCatalogSeed}),/differ/);
 const legacy=recognizeLegacyBrowserCapture(current.capture,browserCatalogSeed);assert.equal(findings(legacy).some(f=>f.productId==='microsoft-clarity'),false,'origin-only history cannot invent path/function observations');
});
test('official npm references feed the same private project discovery without executing the project',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'notabenda-browser-sdk-'));try{
 await writeFile(join(dir,'package.json'),JSON.stringify({dependencies:{'@microsoft/clarity':'1.0.0','@plausible-analytics/tracker':'1.0.0','crisp-sdk-web':'1.0.0'},scripts:{prepare:'DO_NOT_EXECUTE'}}));await writeFile(join(dir,'source.ts'),"import {Crisp} from 'crisp-sdk-web';\nimport Clarity from '@microsoft/clarity';\nimport {init} from '@plausible-analytics/tracker';");
 const report=await scanProjectServices(dir,serviceCatalogSeed);for(const id of ['crisp-chat','microsoft-clarity','plausible-analytics'])assert.ok(report.findings.some(f=>f.productId===id));assert.doesNotMatch(JSON.stringify(report),/DO_NOT_EXECUTE/);
 const cli=spawnSync(process.execPath,[new URL('../dist/cli.js',import.meta.url).pathname,'discover','--project',dir,'--json'],{encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);const live=JSON.parse(cli.stdout);for(const id of ['crisp-chat','microsoft-clarity','plausible-analytics'])assert.ok(live.findings.some(f=>f.productId===id));
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('archived Plausible loaders, listed Sentry CDN bundles and explicit Cloudflare suffix heuristics remain candidates only',()=>{
 for(const [url,id] of [['https://plausible.io/js/script.js','plausible-analytics'],['https://plausible.io/js/script.exclusions.js','plausible-analytics'],['https://plausible.io/js/script.hash.exclusions.outbound-links.js','plausible-analytics'],['https://static.cloudflareinsights.com/beacon.min.js/vPRIVATE_SUFFIX','cloudflare-web-analytics']])assert.equal(findings(capture(url,{})).find(f=>f.productId===id)?.status,'matched');
 const rules=browserCatalogSeed.rules.filter(r=>r.id.startsWith('sentry-browser-bundles-'));assert.equal(rules.flatMap(r=>r.signals).length,11);for(const signal of rules.flatMap(r=>r.signals)){const path=signal.path.value.replace('*','11.8.0');assert.equal(findings(capture('https://browser.sentry-cdn.com'+path,{})).find(f=>f.productId==='sentry-monitoring')?.status,'matched');assert.notEqual(findings(capture('https://browser.sentry-cdn.com'+path+'.backup',{})).find(f=>f.productId==='sentry-monitoring')?.status,'matched');}
 assert.notEqual(findings(capture('https://plausible.io/js/script.js.backup',{})).find(f=>f.productId==='plausible-analytics')?.status,'matched');
});
