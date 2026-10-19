// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-DISCOVERY REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,symlink,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {captureBrowserCatalog} from 'notabenda/catalog/browser';
import {browserCatalogSeed} from 'notabenda/catalog/browser/seed';
import {mountBrowserCatalogReview} from 'notabenda/catalog/browser/ui';
import {mountDiscovery} from 'notabenda/discovery/ui';
const base=JSON.parse(await readFile(new URL('../../../examples/static/notabenda.config.json',import.meta.url),'utf8'));
const config=()=>({...structuredClone(base),site:{...base.site,url:'https://example.test'}});
const labels={routeLabel:'Landing',scenario:'Explicit review'};
function observed(){const dom=new JSDOM('<script src="https://js.stripe.com/v3/?PRIVATE_QUERY"></script><div class="cf-turnstile"></div>',{url:'https://example.test'});const result=captureBrowserCatalog(labels,browserCatalogSeed,{document:dom.window.document,globals:{},performance:{getEntriesByType:()=>[]},cookies:()=>''});dom.window.close();return result;}
const submit=dom=>dom.window.document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));

test('catalog CLI reads explicit captures offline, preserves pinned rules and writes exclusive private reports',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-browser-cli-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;
 try{const capture=observed();await writeFile(join(cwd,'capture.json'),JSON.stringify(capture));await writeFile(join(cwd,'legacy.json'),JSON.stringify(capture.capture));
  const run=(...args)=>spawnSync(process.execPath,[cli,'catalog','detect',...args],{cwd,encoding:'utf8'});
  const result=run('--capture','capture.json','--json','--out-dir','review');assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);assert.deepEqual(report.capture.ruleSet,capture.ruleSet);assert.deepEqual(report.findings.map(f=>f.status),['matched','partial']);assert.doesNotMatch(result.stdout,/PRIVATE_QUERY/);
  const original=await readFile(join(cwd,'review/discovery.private.json'),'utf8');assert.equal(run('--capture','capture.json','--out-dir','review').status,1);assert.equal(await readFile(join(cwd,'review/discovery.private.json'),'utf8'),original);assert.equal((await stat(join(cwd,'review'))).mode&0o777,0o700);assert.equal((await stat(join(cwd,'review/discovery.private.json'))).mode&0o777,0o600);
  const legacy=run('--capture','legacy.json','--json');assert.equal(legacy.status,0,legacy.stderr);assert.equal(JSON.parse(legacy.stdout).capture.mode,'origins-and-names');assert.equal(JSON.parse(legacy.stdout).findings.some(f=>f.productId==='cloudflare-turnstile'),false);
  const changed=structuredClone(browserCatalogSeed);changed.rules[0].explanation='Same revision with altered content';await writeFile(join(cwd,'changed.json'),JSON.stringify(changed));assert.equal(run('--capture','capture.json','--rules','changed.json','--out-dir','mismatch').status,1);await assert.rejects(stat(join(cwd,'mismatch')),e=>e.code==='ENOENT');
  await symlink(join(cwd,'capture.json'),join(cwd,'linked.json'));assert.equal(run('--capture','linked.json').status,1);await symlink(join(cwd,'review'),join(cwd,'linked-out'));assert.equal(run('--capture','capture.json','--out-dir','linked-out').status,1);
  await writeFile(join(cwd,'oversize.json'),' '.repeat(3*1024*1024+1));assert.equal(run('--capture','oversize.json').status,1);
  if(process.platform!=='win32'){const fifo=spawnSync('mkfifo',[join(cwd,'fifo.json')],{encoding:'utf8'});assert.equal(fifo.status,0,fifo.stderr);for(const args of [['--capture','fifo.json'],['--capture','capture.json','--rules','fifo.json']]){const rejected=spawnSync(process.execPath,[cli,'catalog','detect',...args],{cwd,encoding:'utf8',timeout:1500});assert.equal(rejected.error,undefined,'ordinary-file rejection must not wait for a FIFO writer');assert.equal(rejected.status,1);}}
  for(const args of [[],['--capture','capture.json','--probe'],['--capture','capture.json','--json','--json']])assert.equal(run(...args).status,1);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

test('operator review shows separate partial evidence, source pins and local filters without mutating reports',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.test'}),input=observed();input.ruleSet.catalog.products.find(p=>p.id==='cloudflare-turnstile').name='<img src=x onerror=alert(1)>';
 const before=structuredClone(input),ui=mountBrowserCatalogReview(dom.window.document.querySelector('main'),input),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.nb-discovery-catalog-card').length,2);assert.equal(doc.querySelector('img'),null);assert.match(doc.body.textContent,/dom-marker/);assert.match(doc.body.textContent,/conditions incomplete/);assert.match(doc.body.textContent,/Rule revision/);
 for(const a of doc.querySelectorAll('a')){assert.equal(new URL(a.href).protocol,'https:');assert.equal(a.rel,'noopener noreferrer');}
 const filter=doc.querySelector('select');filter.value='partial';filter.dispatchEvent(new dom.window.Event('change'));assert.equal(doc.querySelectorAll('.nb-discovery-catalog-card').length,1);
 const search=doc.querySelector('input[type=search]');assert.equal(search.parentElement.tagName,'LABEL');search.value='unseen provider';search.dispatchEvent(new dom.window.Event('input'));assert.equal(doc.querySelectorAll('.nb-discovery-catalog-card').length,0);assert.match(doc.querySelector('[role=status]').textContent,/0 of 0/);assert.deepEqual(input,before);ui.destroy();assert.equal(doc.querySelector('main').children.length,0);dom.window.close();
});

test('optional discovery catalog captures once, exports four detached snapshots and revokes them on reset',()=>{
 const dom=new JSDOM('<main></main><div class="cf-turnstile"></div>',{url:'https://example.test'});let reads=0,next=0;const revoked=[];
 dom.window.performance.getEntriesByType=()=>{reads++;return [];};dom.window.URL.createObjectURL=()=>`blob:catalog-${++next}`;dom.window.URL.revokeObjectURL=url=>revoked.push(url);
 const ui=mountDiscovery(dom.window.document.querySelector('main'),{config:config(),browserRules:browserCatalogSeed});assert.equal(reads,0);submit(dom);assert.equal(reads,1);assert.equal(ui.getCatalogReport().capture.mode,'transient-signatures');assert.equal(ui.getCatalogReport().findings[0].status,'partial');assert.equal(dom.window.document.querySelectorAll('a[download]').length,4);
 const report=ui.getCatalogReport();report.capture.ruleSet.revision='MUTATED';assert.notEqual(ui.getCatalogReport().capture.ruleSet.revision,'MUTATED');
 dom.window.document.querySelector('input').dispatchEvent(new dom.window.Event('input'));assert.equal(ui.getCatalogReport(),undefined);assert.equal(revoked.length,4);submit(dom);ui.destroy();assert.equal(revoked.length,8);assert.equal(ui.getCatalogReport(),undefined);dom.window.close();
});

test('legacy capture hooks run once and capture failures remove all catalog reports and downloads',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.test'});let calls=0,fail=false;const capture=observed();const ui=mountDiscovery(dom.window.document.querySelector('main'),{config:config(),browserRules:browserCatalogSeed,capture:()=>{calls++;if(fail)throw Error('PRIVATE_FAILURE');return capture.capture;}});
 submit(dom);assert.equal(calls,1);assert.equal(ui.getCatalogReport().capture.mode,'origins-and-names');fail=true;submit(dom);assert.equal(calls,2);assert.equal(ui.getCatalogReport(),undefined);assert.equal(ui.getReport(),undefined);assert.doesNotMatch(dom.window.document.body.textContent,/PRIVATE_FAILURE/);ui.destroy();
 assert.throws(()=>mountDiscovery(dom.window.document.querySelector('main'),{config:config(),capture:()=>capture.capture,catalogCapture:()=>capture}),/one capture hook/);dom.window.close();
});
