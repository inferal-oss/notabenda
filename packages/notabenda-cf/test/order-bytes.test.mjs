// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-CF-ADMIN
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ownedOrderBytes,orderBytesHash,writeOrderBlob,readOrderBlob} from '../dist/order-blobs.js';
const invalid=fn=>assert.throws(fn,e=>e.code==='invalid-asset');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function hostile(bytes){
 let calls=0;
 const input=new Uint8Array(bytes);
 for(const key of ['length','byteLength','byteOffset','buffer','constructor',Symbol.iterator])Object.defineProperty(input,key,{get(){calls++;throw Error('Do not inspect caller properties');}});
 return {input,calls:()=>calls};
}

test('owned order bytes and hashes use actual indexed data without getters, iterators or species',async()=>{
 const h=hostile([1,2,3]),copy=ownedOrderBytes(h.input);assert.deepEqual([...copy],[1,2,3]);assert.equal(await orderBytesHash(h.input),digest(new Uint8Array([1,2,3])));assert.equal(h.calls(),0);
 copy[0]=9;assert.equal(h.input[0],1);h.input[1]=7;assert.equal(copy[1],2);
 let species=0;class Bytes extends Uint8Array{static get [Symbol.species](){species++;throw Error('No species');}}
 const subclass=new Bytes([4,5]);subclass[Symbol.iterator]=function*(){throw Error('No iterator');};assert.deepEqual([...ownedOrderBytes(subclass)],[4,5]);assert.equal(species,0);
 const storage=new Uint8Array([90,1,2,3,91]);assert.deepEqual([...ownedOrderBytes(storage.subarray(1,4))],[1,2,3]);assert.deepEqual([...ownedOrderBytes(Buffer.from([6,7]))],[6,7]);
});

test('intrinsic byte bounds reject hidden oversize, shared, detached and non-byte input',()=>{
 for(const max of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])invalid(()=>ownedOrderBytes(new Uint8Array([1]),max));
 for(const value of [undefined,[],{},new Uint8Array(),new Uint16Array([1]),new Uint8ClampedArray([1]),new DataView(new ArrayBuffer(1)),new Proxy(new Uint8Array([1]),{})])invalid(()=>ownedOrderBytes(value));
 let calls=0;const tooLarge=new Uint8Array(2097153);Object.defineProperty(tooLarge,'byteLength',{get(){calls++;return 1;}});invalid(()=>ownedOrderBytes(tooLarge));assert.equal(calls,0);
 const shared=new Uint8Array(new SharedArrayBuffer(2));Object.defineProperty(shared,'buffer',{get(){calls++;return new ArrayBuffer(2);}});invalid(()=>ownedOrderBytes(shared));assert.equal(calls,0);
 const detached=new Uint8Array([1]);structuredClone(detached.buffer,{transfer:[detached.buffer]});invalid(()=>ownedOrderBytes(detached));
 assert.deepEqual([...ownedOrderBytes(new Uint8Array([1,2]),2)],[1,2]);invalid(()=>ownedOrderBytes(new Uint8Array([1,2]),1));
});

test('blob sealing owns bytes before awaiting and reconstructs hostile chunk views without hooks',async()=>{
 const map=new Map(),tx={get:async key=>map.get(key),put:async(key,value)=>{map.set(key,value);}},source=new Uint8Array(65539).fill(7),expected=new Uint8Array(source),pending=writeOrderBlob(tx,'blob/',source);source.fill(0);
 const manifest=await pending;assert.equal(manifest.bytes,expected.length);assert.equal(manifest.sha256,digest(expected));
 const observed=[];const loaded=await readOrderBlob({get:async key=>{const value=map.get(key);if(value instanceof Uint8Array){const h=hostile(value);observed.push(h);return h.input;}return value;}},'blob/');
 assert.deepEqual(loaded,expected);assert.ok(observed.length>0);assert.ok(observed.every(h=>h.calls()===0));assert.equal(map.get('blob/manifest').chunks.length,2);
 const h=hostile([9]);const invalidStore={get:async key=>key.endsWith('manifest')?map.get('blob/manifest'):h.input};await assert.rejects(readOrderBlob(invalidStore,'blob/'),e=>e.code==='invalid-record');assert.equal(h.calls(),0);
});
