// @requirements REQ-PRODUCT-EVIDENCE-EXPORT REQ-PRODUCT-CF-ADMIN
import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminWorker,createDurableObjectStore,createEvidenceExportSegment,MAX_EXPORT_BYTES} from '../dist/index.js';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
const request=(path='',init)=>new Request('https://example.test/admin/notabenda'+path,init);
const query=(overrides={})=>({query:'',kind:'',keyPrefix:'',from:'',to:'',limit:25,...overrides});
const worker=(store,grant={})=>createAdminWorker({authorize:()=>({store,allowExport:true,scopeLabel:'Fictional scope',...grant})});
const storeFor=(records,options={})=>createDurableObjectStore(createSyntheticStorage(records,'evidence/alpha/'),{prefix:'evidence/alpha/',...options});

test('bulk export requires explicit fresh host permission before store access',async()=>{
 let reads=0,authorized=true;
 const store={get:async()=>{throw Error('SECRET');},list:async()=>{reads++;return {records:[]};}};
 for(const allowExport of [undefined,false,'true']){
  const app=worker(store,{allowExport});
  for(const path of ['/export','/export.json']){const result=await app.fetch(request(path),{});assert.equal(result.status,403);assert.match(result.headers.get('cache-control'),/no-store/);}
 }
 assert.equal(reads,0);
 const app=createAdminWorker({authorize:()=>authorized?{store,allowExport:true}:null});
 assert.equal((await app.fetch(request('/export'),{})).status,200);assert.equal(reads,1);
 authorized=false;
 for(const path of ['/export','/export.json'])assert.equal((await app.fetch(request(path),{})).status,403);
 assert.equal(reads,1);
 const listWithoutPermission=await worker(store,{allowExport:false}).fetch(request(),{});assert.doesNotMatch(await listWithoutPermission.text(),/Export this segment/);
 const listWithPermission=await worker(store).fetch(request(),{});assert.match(await listWithPermission.text(),/Export this segment/);
});

test('attachment exports retain exact scoped fields and filters without source lookups or external fetches',async()=>{
 const records=[{id:'a/01',data:{kind:'sample',subjectId:'opaque-one',occurredAt:'2026-10-18T01:00:00Z',privateField:'Included because host returned it',url:'https://outside.example.test/archive'}},{id:'a/02',data:{kind:'other',occurredAt:'2026-10-18T01:00:00Z'}}];
 const storage=createSyntheticStorage(records,'evidence/alpha/');await storage.put('evidence/beta/private',{secret:'OTHER_SCOPE'});
 const store=createDurableObjectStore(storage,{prefix:'evidence/alpha/'});store.getSource=async()=>{throw Error('Must not look up source.');};
 const path='/export.json?q=opaque-one&kind=sample&key=a%2F&from=2026-10-18&to=2026-10-18&limit=10';
 const response=await worker(store).fetch(request(path),{});assert.equal(response.status,200);
 for(const [name,pattern] of [['content-type',/application\/json/],['content-disposition',/^attachment; filename="notabenda-evidence.json"$/],['cache-control',/no-store, private/],['x-content-type-options',/^nosniff$/],['content-security-policy',/default-src 'none'/]])assert.match(response.headers.get(name),pattern);
 const data=await response.json();assert.equal(data.schemaVersion,1);assert.equal(data.kind,'notabenda-evidence-segment');assert.deepEqual(data.records,[records[0]]);
 assert.deepEqual(data.selection,query({query:'opaque-one',kind:'sample',keyPrefix:'a/',from:'2026-10-18',to:'2026-10-18',limit:10}));
 assert.equal(data.segment.continuationRequired,false);assert.equal(data.segment.returned,1);assert.equal(data.read.consistency,'live-segment');assert.ok(Date.parse(data.read.completedAt)>=Date.parse(data.read.startedAt));
 assert.equal(data.links.nextDownload,undefined);assert.doesNotMatch(JSON.stringify(data),/OTHER_SCOPE|Authorization|Cookie/);
 const head=await worker(store).fetch(request(path,{method:'HEAD'}),{});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.match(head.headers.get('content-disposition'),/attachment/);
});

test('continuation preserves filters and examines empty segments without skipping matching keys',async()=>{
 const store=storeFor(Array.from({length:17},(_,n)=>({id:`route/${String(n).padStart(2,'0')}`,data:{kind:'event',subjectId:n%5===4?'selected-subject':'other',occurredAt:'2026-10-18T01:00:00Z'}})),{scanLimit:3});
 const app=worker(store),seen=[];let path='/export.json?q=selected-subject&kind=event&key=route%2F&from=2026-10-18&to=2026-10-18&limit=1',pages=0,empty=false;
 while(path){
  assert.ok(++pages<20);
  const response=await app.fetch(request(path),{});assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.selection.query,'selected-subject');assert.equal(data.selection.kind,'event');assert.equal(data.selection.from,'2026-10-18');assert.equal(data.selection.keyPrefix,'route/');assert.equal(data.selection.limit,1);
  assert.ok(data.segment.examined<=3);seen.push(...data.records.map(r=>r.id));
  if(data.segment.returned===0&&data.segment.continuationRequired)empty=true;
  if(data.segment.continuationRequired){assert.equal(new URL(data.links.nextDownload,'https://example.test').searchParams.get('after'),data.segment.nextAfter);assert.match(data.links.nextReview,/^\/admin\/notabenda\/export\?/);}
  path=data.links.nextDownload?.replace('/admin/notabenda','');
 }
 assert.equal(empty,true);assert.deepEqual(seen,['route/04','route/09','route/14']);
});

test('malformed filters and non-read methods fail before listing and do not disclose errors',async()=>{
 let reads=0;const app=worker({get:async()=>undefined,list:async()=>{reads++;throw Error('SECRET');}});
 for(const path of ['/export?limit=0','/export.json?limit=51','/export.json?q=a&q=b','/export.json?site=beta','/export?from=2026-02-30','/export.json?key=x&after=y','/export.json?limit=1e1','/export?to=2026-01-01&from=2026-02-01']){
  const response=await app.fetch(request(path),{});assert.equal(response.status,400,path);assert.doesNotMatch(await response.text(),/SECRET/);
 }
 assert.equal((await app.fetch(request('/export.json',{method:'POST'}),{})).status,405);assert.equal(reads,0);
 await assert.rejects(()=>createEvidenceExportSegment({},query({from:[]})));
});

test('list, review and download reject hostile adapter pages and backward or inconsistent cursors',async()=>{
 const r=(id,data={kind:'selected',occurredAt:'2026-10-18T01:00:00Z'})=>({id,data});
 const invalid=[
  {records:[r('x/c'),r('x/b')]},{records:[r('x/b'),r('x/b')]},{records:[r('y/b')]},{records:[r('x/a')]},
  {records:[r('x/b')],nextAfter:'x/a'},{records:[],nextAfter:'x/a'},{records:[],nextAfter:'x/0'},
  {records:[r('x/c')],nextAfter:'x/b'},{records:[r('x/b',{kind:'other'})]},
  {records:[r('x/b',{kind:'selected',occurredAt:'2026-10-17T01:00:00Z'})]},
  {records:[r('x/b')],scanned:0},{records:[],scanned:501},{records:[r('x/b','X'.repeat(65536))]},
 ];
 for(const page of invalid){
  const app=worker({get:async()=>undefined,list:async()=>page});
  for(const route of ['','/export','/export.json']){const response=await app.fetch(request(route+'?kind=selected&key=x%2F&after=x%2Fa&from=2026-10-18&to=2026-10-18'),{});assert.equal(response.status,500,JSON.stringify(page).slice(0,100));assert.doesNotMatch(await response.text(),/XXXX/);}
 }
 const mutating={get:async()=>undefined,list:async q=>{q.kind='other';return {records:[r('x/b',{kind:'other'})]};}};
 await assert.rejects(()=>createEvidenceExportSegment(mutating,query({kind:'selected'})));
});

test('UTF-8 cursors make forward progress for non-ASCII keys',async()=>{
 const store=storeFor([{id:'\uE000',data:{value:1}},{id:'😀',data:{value:2}}]);
 const first=await createEvidenceExportSegment(store,query({limit:1}));
 assert.equal(first.records[0].id,'\uE000');
 const next=await createEvidenceExportSegment(store,query({limit:1,after:first.segment.nextAfter}));assert.equal(next.records[0].id,'😀');
});

test('HTML previews escape metadata, omit record bodies and clearly describe fresh download reads',async()=>{
 const app=worker(storeFor([{id:'<script>key</script>',data:{secret:'DO_NOT_INLINE_RECORD_BODY',kind:'sample'}}]),{scopeLabel:'<img src=x onerror=alert(1)>'});
 const preview=await app.fetch(request('/export?q=DO_NOT_INLINE_RECORD_BODY'),{});assert.equal(preview.status,200);const html=await preview.text();
 assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img|<script|"secret"/);assert.match(html,/without redaction/);assert.match(html,/Downloads a fresh read/);assert.match(html,/Records may differ/);assert.match(html,/outside this store/);assert.match(html,/No continuation reported/);
 assert.doesNotMatch(html,/Download 1 record/);assert.match(html,/download="notabenda-evidence.json"/);
});

test('downloads re-read the store after preview instead of representing it as a frozen snapshot',async()=>{
 const storage=createSyntheticStorage([{id:'a',data:{kind:'sample'}}],'evidence/alpha/');const app=worker(createDurableObjectStore(storage,{prefix:'evidence/alpha/'}));
 const preview=await app.fetch(request('/export'),{});assert.match(await preview.text(),/Matches in this preview/);
 await storage.put('evidence/alpha/b',{kind:'sample'});
 const data=await (await app.fetch(request('/export.json'),{})).json();assert.equal(data.segment.returned,2);
});

test('a maximum-sized bounded segment downloads within its serialized byte budget',async()=>{
 const store=storeFor(Array.from({length:50},(_,n)=>({id:String(n).padStart(2,'0'),data:{kind:'large',text:'x'.repeat(65000)}})));
 const response=await worker(store).fetch(request('/export.json?limit=50'),{});assert.equal(response.status,200);const text=await response.text();assert.ok(new TextEncoder().encode(text).length<MAX_EXPORT_BYTES);assert.equal(JSON.parse(text).records.length,50);
});
