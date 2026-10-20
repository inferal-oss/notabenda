// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createWorkspaceOverviewWorker,matchesRecord} from '@notabenda/cloudflare';
const request=(suffix='',method='GET')=>new Request('https://host.example.test/ops'+suffix,{method});
const record=(id,subject='reader')=>({id,data:{kind:'inspection-note',subjectId:subject,label:'Matching review',occurredAt:'2026-10-18T12:00:00.000Z'}});
function area(id='choices',overrides={}){return {id,title:id,description:'Inspect recorded evidence.',href:'/ops/'+id,primary:true,store:{list:async()=>({records:[]}),get:async()=>undefined},...overrides};}
const worker=(areas,extra={})=>createWorkspaceOverviewWorker({basePath:'/ops',authorize:()=>({areas}),...extra});
test('overview authorization fails closed on every request before any record-store access',async()=>{
 assert.throws(()=>createWorkspaceOverviewWorker({}),/authorization/);
 let reads=0,calls=0;const a=area('choices',{store:{list(){reads++;throw Error('PRIVATE');},get(){reads++;}}});
 for(const grant of [null,{},false,{areas:[a],allowSetup:'yes'},{areas:[a,a]},{areas:[a,{...a,id:'other'}]},{areas:[{...a,href:'https://remote.test'}]},{areas:Array.from({length:4},(_,i)=>area('job-'+i))}]){
  const ui=createWorkspaceOverviewWorker({basePath:'/ops',authorize:()=>{calls++;return grant;}});assert.equal((await ui.fetch(request('?q=reader'),{})).status,403);
 }
 const ui=createWorkspaceOverviewWorker({basePath:'/ops',authorize:()=>{throw Error('PRIVATE');}});assert.equal(await(await ui.fetch(request(),{})).text(),'Access denied.');assert.equal(reads,0);assert.equal(calls,8);
});
test('normal overview reads no records, shows three primary jobs, folds other areas and gates setup link',async()=>{
 let reads=0;const areas=['history','choices','agreements','permissions'].map((id,i)=>area(id,{primary:i<3,store:{list(){reads++;throw Error('No prefetch');},get(){throw Error('No get');}}}));
 for(const allowSetup of [false,true]){
  const response=await worker(areas,{setupPath:'/ops/setup',authorize:()=>({areas,allowSetup})}).fetch(request(),{}),html=await response.text(),dom=new JSDOM(html),d=dom.window.document;
  try{assert.equal(d.querySelectorAll('.workspace-job').length,3);assert.equal(d.querySelector('.workspace-more').open,false);assert.equal(d.querySelector('script'),null);assert.equal(d.querySelector('.workspace-configure')!==null,allowSetup);assert.equal(d.querySelector('form[role=search]').method,'get');assert.equal(d.querySelector('#workspace-query').getAttribute('maxlength'),'256');assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.match(response.headers.get('Content-Security-Policy'),/form-action 'self'/);assert.equal(response.headers.get('Set-Cookie'),null);}finally{dom.window.close();}
 }assert.equal(reads,0);
});
test('finder reads one validated segment per granted store and preserves exact detail/continuation destinations',async()=>{
 const seen=[],records=[record('001'),record('002'),record('003')],areas=[area('choices',{store:{async list(q){seen.push(structuredClone(q));return {records,nextAfter:'003',scanned:3};},get(){throw Error('No get');},getSource(){throw Error('No source');}}}),area('history',{primary:false,store:{async list(q){seen.push(q);return {records:[],nextAfter:'later',scanned:100};},get(){throw Error('No get');}}})];
 const response=await worker(areas).fetch(request('?q=reader'),{}),dom=new JSDOM(await response.text()),d=dom.window.document;
 try{assert.equal(response.status,200);assert.equal(seen.length,2);for(const q of seen)assert.deepEqual(q,{query:'reader',kind:'',keyPrefix:'',from:'',to:'',limit:3});assert.equal(d.querySelectorAll('.record-link').length,3);assert.ok(d.querySelector('a[href="/ops/choices/record?id=001"]'));const links=[...d.querySelectorAll('.workspace-continue')].map(a=>new URL(a.href,'https://host.example.test'));assert.deepEqual(links.map(u=>[u.pathname,u.searchParams.get('q'),u.searchParams.get('after')]),[['/ops/choices','reader','003'],['/ops/history','reader','later']]);assert.match(d.body.textContent,/No matches in the examined segment/);assert.match(d.body.textContent,/not totals or a snapshot/);}finally{dom.window.close();}
});
test('unreadable or malformed store pages remain distinct from complete empty results and leak no backend error',async()=>{
 const areas=[area('failed',{store:{list(){throw Error('PRIVATE BACKEND');},get(){}}}),area('malformed',{primary:false,store:{list:async()=>({records:[record('b'),record('a')]}),get(){}}}),area('empty',{primary:false})];
 const response=await worker(areas).fetch(request('?q=reader'),{}),html=await response.text(),dom=new JSDOM(html);
 try{assert.equal(response.status,200);assert.equal(dom.window.document.querySelectorAll('.workspace-read-error').length,2);assert.equal(dom.window.document.querySelector('.workspace-search-empty').open,false);assert.match(dom.window.document.querySelector('.workspace-search-empty').textContent,/empty/);assert.doesNotMatch(html,/PRIVATE BACKEND/);}finally{dom.window.close();}
});
test('malformed routes, selectors, searches and methods cannot cause record reads',async()=>{
 let reads=0,calls=0;const areas=[area('choices',{store:{list(){reads++;},get(){}}})],ui=worker(areas,{authorize(){calls++;return {areas};}});
 for(const [path,method,status] of [['','POST',405],['/unknown','GET',404],['?q=a&q=b','GET',400],['?store=other','GET',400],['?q='+('x'.repeat(257)),'GET',400],['?q=%00','GET',400]])assert.equal((await ui.fetch(request(path,method),{})).status,status);
 assert.equal(reads,0);assert.equal(calls,6);const head=await ui.fetch(request('','HEAD'),{});assert.equal(head.status,200);assert.equal(await head.text(),'');
 for(const value of ['https://remote.test','//remote.test','/ops/../admin','/ops?q=private','/ops" onclick="bad'])assert.throws(()=>worker([],{basePath:value}));
});
test('searches and stored facts stay escaped, scoped and historical; no current-permission claim is inferred',async()=>{
 const data=record('r1','<img src=x onerror=bad>'),areas=[area('choices',{title:'<script>private</script>',store:{async list(q){assert.ok(matchesRecord(data,q));return {records:[data]};},get(){}}})];
 const response=await worker(areas).fetch(request('?q='+encodeURIComponent('<img')),{}),html=await response.text(),dom=new JSDOM(html);
 try{assert.equal(dom.window.document.querySelector('script,img'),null);assert.equal(dom.window.document.querySelector('.record-link').textContent,'r1');assert.match(dom.window.document.body.textContent,/<img src=x onerror=bad>/);assert.match(html,/does not establish current permission/);assert.equal(dom.window.document.querySelector('.workspace-job'),null);}finally{dom.window.close();}
});
