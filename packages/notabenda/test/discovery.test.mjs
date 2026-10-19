// @requirements REQ-PRODUCT-DISCOVERY REQ-AU-PIXELS
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm,mkdir,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {captureDiscovery,normalizeDiscoveryCapture,analyzeDiscovery} from '../dist/discovery.js';
import {mountDiscovery} from '../dist/discovery-ui.js';
const base=JSON.parse(await readFile(new URL('../../../examples/static/notabenda.config.json',import.meta.url),'utf8'));
function config(){const c=structuredClone(base);c.site.url='https://example.test';c.services[0].resourceOrigins=['https://metrics.example.test'];c.private={note:'PRIVATE_CONFIG_NOTE'};return c;}
function capture(overrides={}){return {schemaVersion:1,kind:'browser-discovery-capture',capturedAt:'2026-10-18T12:00:00.000Z',pageOrigin:'https://example.test',routeLabel:'Public landing',scenario:'Initial load',coverage:{resources:'available',dom:'available',cookies:'available',localStorage:'available',sessionStorage:'available'},network:[],references:[],storage:[],omitted:{nonHttpReferences:0,oversizedNames:0},...overrides};}
const submit=dom=>dom.window.document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));

test('explicit capture reduces URLs to origins, reads names only, and separates resource entries from references',()=>{
 const dom=new JSDOM('<script src="https://metrics.example.test/sensitive/path?token=URL_SECRET"></script><iframe src="https://frame.example.test/account/secret"></iframe><link rel="preconnect" href="https://hint.example.test?token=SECRET"><video src="/private-film.mp4" poster="https://poster.example.test/private.png"></video><img src="data:image/svg+xml,SECRET_DATA">',{url:'https://example.test/private-account?token=PAGE_SECRET#private'});
 let valueReads=0;const storage={length:1,key:()=> 'declared-marker',getItem:()=>{valueReads++;throw Error('Do not read values');}};
 const result=captureDiscovery({scenario:'Rejected optional',routeLabel:'Landing'}, {document:dom.window.document,performance:{getEntriesByType:()=>[{name:'https://user:URL_PASSWORD@metrics.example.test/private?q=URL_SECRET',initiatorType:'fetch'},{name:'https://metrics.example.test/second',initiatorType:'fetch'}]},localStorage:()=>storage,sessionStorage:()=>({length:0,key:()=>null}),cookies:()=> 'consent=COOKIE_VALUE_SECRET; another=SECOND_VALUE_SECRET'});
 assert.equal(valueReads,0);assert.equal(result.pageOrigin,'https://example.test');assert.deepEqual(result.network,[{origin:'https://metrics.example.test',initiator:'fetch',count:2}]);
 assert.deepEqual(result.storage,[{type:'localStorage',name:'declared-marker'},{type:'cookie',name:'consent'},{type:'cookie',name:'another'}]);
 assert.ok(result.references.some(r=>r.kind==='frame'));assert.ok(result.references.some(r=>r.kind==='preconnect'));assert.ok(result.references.some(r=>r.kind==='media'&&r.origin==='https://example.test'));assert.ok(result.references.some(r=>r.kind==='image'&&r.origin==='https://poster.example.test'));
 assert.equal(result.omitted.nonHttpReferences,1);assert.doesNotMatch(JSON.stringify(result),/URL_SECRET|URL_PASSWORD|PAGE_SECRET|VALUE_SECRET|private-account|sensitive\/path|account\/secret|SECRET_DATA/);
});

test('blocked APIs discard partial storage reads and never turn unavailable into an empty clean result',()=>{
 const dom=new JSDOM('',{url:'https://example.test'});
 const result=captureDiscovery({scenario:'Blocked storage',routeLabel:'Landing'}, {document:dom.window.document,performance:{getEntriesByType:()=>{throw Error('PRIVATE_ERROR');}},localStorage:()=>({length:2,key:i=>{if(i===1)throw Error();return 'partial';}}),cookies:()=>{throw Error();}});
 assert.equal(result.coverage.resources,'unavailable');assert.equal(result.coverage.localStorage,'unavailable');assert.equal(result.coverage.cookies,'unavailable');assert.equal(result.coverage.sessionStorage,'unavailable');assert.deepEqual(result.storage,[]);
 assert.ok(analyzeDiscovery(config(),[result]).reviewNotes.some(n=>n.includes('never prove absence')));
});

test('capture processing is bounded and reports limits and omitted oversized names',()=>{
 const dom=new JSDOM('<main>'+Array.from({length:5001},()=>'<span></span>').join('')+'</main>',{url:'https://example.test'});
 const result=captureDiscovery({scenario:'Large page',routeLabel:'Landing'},{document:dom.window.document,performance:{getEntriesByType:()=>Array.from({length:2001},(_,n)=>({name:`https://origin-${n}.example.test/a`,initiatorType:'fetch'}))},localStorage:()=>({length:205,key:i=>i===0?'x'.repeat(257):'key-'+i}),cookies:()=> 'x'.repeat(65537)});
 assert.equal(result.coverage.resources,'limited');assert.equal(result.coverage.dom,'limited');assert.equal(result.coverage.localStorage,'limited');assert.equal(result.coverage.cookies,'limited');assert.equal(result.network.length,500);assert.equal(result.storage.length,199);assert.equal(result.omitted.oversizedNames,1);
});

test('capture normalization rejects paths, values, coercible enums, malformed dates and duplicate observations',()=>{
 const invalid=[null,[],capture({pageOrigin:'https://example.test/private'}),capture({capturedAt:'2026-02-30T00:00:00.000Z'}),capture({url:'https://example.test'}),capture({storage:[{type:'cookie',name:'x',value:'PRIVATE'}]}),capture({storage:[{type:['cookie'],name:'x'}]}),capture({network:[{origin:'https://user:secret@example.test',initiator:'fetch',count:1}]}),capture({network:[{origin:'https://example.test',initiator:['fetch'],count:1}]}),capture({coverage:{...capture().coverage,resources:['available']}}),capture({storage:[{type:'localStorage',name:'x'},{type:'localStorage',name:'x'}]}),capture({scenario:'\u009b31mcontrol'}),capture({network:[{origin:'https://example.test',initiator:'fetch',count:0}]})];
 for(const value of invalid)assert.throws(()=>normalizeDiscoveryCapture(value));
 const getter=capture();Object.defineProperty(getter,'scenario',{get(){throw Error('PRIVATE');}});assert.throws(()=>normalizeDiscoveryCapture(getter),/bounded version-1/);
 const source=capture(),normalized=normalizeDiscoveryCapture(source);normalized.coverage.dom='unavailable';assert.equal(source.coverage.dom,'available');
 assert.throws(()=>captureDiscovery({scenario:'x',routeLabel:'x'}),/browser document/);
});

test('analysis preserves ambiguous candidate mappings, exact storage matching and unmapped first-party observations without legal conclusions',()=>{
 const c=config();c.services.push({...structuredClone(c.services[0]),id:'second-service',resourceOrigins:['https://metrics.example.test']});
 const stored=c.storage[0];
 const result=analyzeDiscovery(c,[capture({network:[{origin:'https://metrics.example.test',initiator:'fetch',count:2},{origin:'https://example.test',initiator:'script',count:3}],storage:[{type:stored.type,name:stored.name},{type:stored.type,name:stored.name+'-unrelated'}]})]);
 assert.deepEqual(result.findings[0].candidateServiceIds,[c.services[0].id,'second-service']);assert.equal(result.findings[0].mapping,'origin-candidate');assert.equal(result.findings[1].mapping,'unmapped');assert.equal(result.findings[1].relation,'same-origin');assert.equal(result.findings[2].mapping,'exact-name-candidate');assert.equal(result.findings[3].mapping,'unmapped');assert.equal(result.unmappedCount,2);
 assert.ok(result.reviewNotes.some(n=>n.includes('exemption')));assert.doesNotMatch(JSON.stringify(result),/PRIVATE_CONFIG_NOTE/);assert.equal(c.documents.privacy.review.status,'draft');
 assert.throws(()=>analyzeDiscovery(c,[capture({pageOrigin:'https://other.example.test'})]),/origin/);
 assert.throws(()=>analyzeDiscovery(c,[]));assert.throws(()=>analyzeDiscovery(c,Array.from({length:21},()=>capture())));
});

test('operator UI captures only on request, escapes observations, detaches reports and revokes exports on edits and destruction',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.test'}),revoked=[];let captures=0,next=0;
 dom.window.URL.createObjectURL=()=>`blob:test-${++next}`;dom.window.URL.revokeObjectURL=url=>revoked.push(url);
 const mounted=mountDiscovery(dom.window.document.querySelector('main'),{config:config(),capture:labels=>{captures++;return capture({...labels,storage:[{type:'cookie',name:'<img src=x onerror=alert(1)>'}]});}});
 assert.equal(captures,0);assert.equal(mounted.getReport(),undefined);submit(dom);assert.equal(captures,1);assert.equal(dom.window.document.querySelectorAll('a[download]').length,2);assert.equal(dom.window.document.querySelector('img'),null);assert.match(dom.window.document.body.textContent,/Candidate|Review mapping/);
 const report=mounted.getReport();report.findings[0].label='MUTATED';assert.notEqual(mounted.getReport().findings[0].label,'MUTATED');
 const input=dom.window.document.querySelector('input');input.value='Changed route';input.dispatchEvent(new dom.window.Event('input'));assert.equal(mounted.getReport(),undefined);assert.equal(dom.window.document.querySelectorAll('a[download]').length,0);assert.equal(revoked.length,2);
 submit(dom);mounted.destroy();mounted.destroy();assert.equal(revoked.length,4);assert.equal(mounted.getReport(),undefined);assert.equal(dom.window.document.querySelector('.nb-discovery'),null);
});

test('failed capture removes old exports while unavailable downloads retain a readable current review',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.test'});let fail=false;
 const mounted=mountDiscovery(dom.window.document.querySelector('main'),{config:config(),capture:()=>{if(fail)throw Error('PRIVATE_CAPTURE_ERROR');return capture();}});
 submit(dom);assert.ok(mounted.getReport());assert.match(dom.window.document.body.textContent,/Downloads are unavailable/);fail=true;submit(dom);assert.equal(mounted.getReport(),undefined);assert.doesNotMatch(dom.window.document.body.textContent,/PRIVATE_CAPTURE_ERROR/);assert.match(dom.window.document.body.textContent,/No current download/);mounted.destroy();
});

test('CLI analyzes explicit local inputs, emits requirement-linked output and never overwrites or follows output symlinks',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-discovery-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;
 try{
  await writeFile(join(cwd,'config.json'),JSON.stringify(config()));await writeFile(join(cwd,'capture.json'),JSON.stringify(capture()));
  const run=(...args)=>spawnSync(process.execPath,[cli,'discover','--config','config.json',...args],{cwd,encoding:'utf8'});
  const json=run('--capture','capture.json','--json','--out-dir','review');assert.equal(json.status,0,json.stderr);const report=JSON.parse(json.stdout);assert.equal(report.kind,'discovery-review');assert.equal(report.captureCount,1);assert.doesNotMatch(json.stdout,/PRIVATE_CONFIG_NOTE/);
  const original=await readFile(join(cwd,'review/discovery.private.json'),'utf8');assert.equal(run('--capture','capture.json','--out-dir','review').status,1);assert.equal(await readFile(join(cwd,'review/discovery.private.json'),'utf8'),original);
  await mkdir(join(cwd,'target'));await symlink(join(cwd,'target'),join(cwd,'linked'));assert.equal(run('--capture','capture.json','--out-dir','linked').status,1);
  assert.equal(run().status,1);assert.equal(run('--capture','capture.json','--preview').status,1);assert.equal(run('--capture','capture.json','--json','--json').status,1);
  await writeFile(join(cwd,'bad.json'),'{"value":"PRIVATE_INVALID"');const bad=run('--capture','bad.json');assert.equal(bad.status,1);assert.doesNotMatch(bad.stderr,/PRIVATE_INVALID/);
 }finally{await rm(cwd,{recursive:true,force:true});}
});


test('self declarations resolve to this site while stylesheet and selected responsive image origins stay visible',()=>{
 const c=config();c.services[0].resourceOrigins=['self'];
 const dom=new JSDOM('<link rel="stylesheet" href="https://styles.example.test/style.css"><img srcset="https://images.example.test/private.webp 1x">',{url:'https://example.test'});
 Object.defineProperty(dom.window.document.querySelector('img'),'currentSrc',{value:'https://images.example.test/private.webp?token=SECRET'});
 const observed=captureDiscovery({routeLabel:'Landing',scenario:'Responsive page'},{document:dom.window.document});
 assert.ok(observed.references.some(r=>r.kind==='stylesheet'&&r.origin==='https://styles.example.test'));
 assert.ok(observed.references.some(r=>r.kind==='image'&&r.origin==='https://images.example.test'));assert.doesNotMatch(JSON.stringify(observed),/SECRET|private.webp/);
 const report=analyzeDiscovery(c,[capture({network:[{origin:'https://example.test',initiator:'script',count:1}]})]);
 assert.equal(report.findings[0].mapping,'origin-candidate');assert.deepEqual(report.findings[0].candidateServiceIds,[c.services[0].id]);
});

test('staging and loopback origin overrides remain explicit in reports and never relabel observations as production',()=>{
 const c=config();c.services[0].resourceOrigins=['self'];const local=capture({pageOrigin:'http://127.0.0.1:4179',network:[{origin:'http://127.0.0.1:4179',initiator:'script',count:1}]});
 assert.throws(()=>analyzeDiscovery(c,[local]),/origin/);
 const report=analyzeDiscovery(c,[local],{captureOrigin:'http://127.0.0.1:4179'});assert.equal(report.configuredOrigin,'https://example.test');assert.equal(report.observedOrigin,'http://127.0.0.1:4179');assert.equal(report.captures[0].pageOrigin,'http://127.0.0.1:4179');assert.equal(report.findings[0].mapping,'origin-candidate');assert.ok(report.reviewNotes[0].includes('override'));
 for(const value of ['http://127.0.0.1:4179/path','https://user:secret@example.test',[],null])assert.throws(()=>analyzeDiscovery(c,[local],{captureOrigin:value}));
});

test('local observation filters preserve the captured report and download identity',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.test'});let calls=0,next=0;
 dom.window.URL.createObjectURL=()=>`blob:filter-${++next}`;dom.window.URL.revokeObjectURL=()=>{};
 const c=config(),named=c.storage[0];const ui=mountDiscovery(dom.window.document.querySelector('main'),{config:c,capture:()=>{calls++;return capture({network:[{origin:'https://unmapped.example.test',initiator:'fetch',count:1}],storage:[{type:named.type,name:named.name}]});}});
 submit(dom);const before=ui.getReport(),links=Array.from(dom.window.document.querySelectorAll('a[download]')).map(a=>a.href);
 const search=dom.window.document.querySelector('input[type=search]');search.value='unmapped.example';search.dispatchEvent(new dom.window.Event('input'));assert.equal(dom.window.document.querySelectorAll('.nb-discovery-finding').length,1);
 const only=dom.window.document.querySelector('.nb-discovery-unmapped input');only.checked=true;only.dispatchEvent(new dom.window.Event('change'));assert.equal(dom.window.document.querySelectorAll('.nb-discovery-finding').length,1);
 const kind=dom.window.document.querySelector('.nb-discovery-filters select');kind.value='storage';kind.dispatchEvent(new dom.window.Event('change'));assert.equal(dom.window.document.querySelectorAll('.nb-discovery-finding').length,0);
 assert.deepEqual(ui.getReport(),before);assert.deepEqual(Array.from(dom.window.document.querySelectorAll('a[download]')).map(a=>a.href),links);assert.equal(calls,1);ui.destroy();
});
