// @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-EVIDENCE-EXPORT REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecord,createAdminWorker} from '../dist/index.js';

test('record identities and bodies must be own data fields; accessors are never invoked',()=>{
 for(const field of ['id','data']){
  let reads=0;const record={id:'a',data:{retained:'value'}};
  Object.defineProperty(record,field,{enumerable:true,get(){reads++;throw Error('PRIVATE ACCESSOR');}});
  assert.throws(()=>normalizeRecord(record),/Invalid record/u);assert.equal(reads,0);
  const inherited=Object.create({[field]:field==='id'?'a':{retained:'value'}});
  inherited[field==='id'?'data':'id']=field==='id'?{retained:'value'}:'a';
  assert.throws(()=>normalizeRecord(inherited),/Invalid record/u);
 }
 const record=Object.assign(Object.create(null),{id:'a',data:{nested:[{value:'retained'}]}});
 Object.freeze(record);const result=normalizeRecord(record);result.data.nested[0].value='changed';
 assert.equal(record.data.nested[0].value,'retained');assert.equal(result.id,'a');
});

test('record arrays copy indexed values without calling custom iterators or serialization hooks',()=>{
 let calls=0;
 for(const iterator of [function*(){calls++;yield 'SUBSTITUTED';},undefined]){
  const data=['retained',{nested:['unchanged']}];
  Object.defineProperty(data,Symbol.iterator,iterator?{value:iterator}:{get(){calls++;throw Error('PRIVATE ITERATOR');}});
  Object.defineProperty(data,'toJSON',{value(){calls++;return 'SUBSTITUTED';}});
  const result=normalizeRecord({id:'a',data});
  assert.equal(JSON.stringify(result.data),'["retained",{"nested":["unchanged"]}]');
  result.data[1].nested[0]='changed';assert.equal(data[1].nested[0],'unchanged');
 }
 assert.equal(calls,0);
});

test('array accessors and inherited slots are rejected without executing their getters',()=>{
 let reads=0;
 const own=[];Object.defineProperty(own,'0',{enumerable:true,get(){reads++;throw Error('PRIVATE SLOT');}});
 const inherited=new Array(1),prototype=Object.create(Array.prototype);
 Object.defineProperty(prototype,'0',{get(){reads++;throw Error('PRIVATE INHERITED SLOT');}});Object.setPrototypeOf(inherited,prototype);
 for(const data of [own,inherited,new Array(2)])assert.throws(()=>normalizeRecord({id:'a',data}),/not JSON/u);
 assert.equal(reads,0);
 const hidden=[];Object.defineProperty(hidden,'0',{value:'retained'});
 assert.deepEqual(normalizeRecord({id:'a',data:hidden}).data,['retained']);
});

test('record byte limits reject invalid limits and preserve the UTF-8 JSON boundary',()=>{
 for(const limit of [NaN,Infinity,-Infinity,0,-1,0.5,'65536'])assert.throws(()=>normalizeRecord({id:'a',data:'safe'},limit),/Invalid inspection limit/u);
 const value='é"\\',bytes=Buffer.byteLength(JSON.stringify(value));
 assert.equal(normalizeRecord({id:'a',data:value},bytes).data,value);
 assert.throws(()=>normalizeRecord({id:'a',data:value},bytes-1),/limits/u);
 const shared=['retained'],result=normalizeRecord({id:'a',data:[shared,shared]});
 result.data[0][0]='changed';assert.equal(result.data[1][0],'retained');assert.equal(shared[0],'retained');
 const cycle=[];cycle.push(cycle);assert.throws(()=>normalizeRecord({id:'a',data:cycle}),/not JSON/u);
 assert.throws(()=>normalizeRecord({id:'a',data:new Array(10001)}),/limits/u);
 assert.equal(normalizeRecord({id:'a',data:'x'.repeat(70000)},131072).data.length,70000);
});

test('malformed records fail generically in search, detail, comparison, source and export without invoking getters',async()=>{
 const hash='a'.repeat(64);let reads=0;
 for(const field of ['id','data']){
  const record=id=>{const value={id,data:{retained:'safe'}};Object.defineProperty(value,field,{enumerable:true,get(){reads++;throw Error('PRIVATE RECORD');}});return value;};
  const store={list:async()=>({records:[record('a')]}),get:async id=>record(id),getSource:async(id,kind)=>record(id+'/'+kind)};
  const worker=createAdminWorker({authorize:()=>({store,allowExport:true})});
  for(const suffix of ['','/record?id=a','/diff?before=a&after=b','/source?id='+hash+'&kind=terms','/export','/export.json']){
   const response=await worker.fetch(new Request('https://example.test/admin/notabenda'+suffix),{});
   assert.equal(response.status,500,suffix);assert.match(response.headers.get('cache-control'),/no-store/u);
   assert.doesNotMatch(await response.text(),/PRIVATE RECORD|retained|safe/u);
  }
 }
 assert.equal(reads,0);
});

test('an authorized export preserves indexed array evidence rather than substituted iterator output',async()=>{
 let calls=0;const data=['retained'];data[Symbol.iterator]=function*(){calls++;yield 'SUBSTITUTED';};
 const store={list:async()=>({records:[{id:'a',data}]}),get:async()=>undefined};
 const worker=createAdminWorker({authorize:()=>({store,allowExport:true})});
 const response=await worker.fetch(new Request('https://example.test/admin/notabenda/export.json'),{});
 assert.equal(response.status,200);assert.deepEqual((await response.json()).records,[{id:'a',data:['retained']}]);assert.equal(calls,0);
});
