// @requirements REQ-PRODUCT-ORDER-CONFIRMATION REQ-PRODUCT-CF-ADMIN
// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL
import type {HistoryTransaction} from './history.js';
import {orderFail} from './order-context.js';
import {copyPaidOrderData} from './order-policy.js';
export const ORDER_CHUNK_BYTES=65536;
const typedArray=Object.getPrototypeOf(Uint8Array.prototype) as object;
const byteLength=Object.getOwnPropertyDescriptor(typedArray,'byteLength')!.get!;
const buffer=Object.getOwnPropertyDescriptor(typedArray,'buffer')!.get!;
const ordinaryBufferLength=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength')!.get!;
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
export async function orderBytesHash(input:Uint8Array):Promise<string>{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',ownedOrderBytes(input)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function ownedOrderBytes(input:Uint8Array,max=2097152):Uint8Array<ArrayBuffer> {
 if(!(input instanceof Uint8Array)||!Number.isSafeInteger(max)||max<1)return orderFail('invalid-asset');
 try{
  const length=byteLength.call(input);
  // Intrinsic brand checks ignore shadowed properties and reject shared buffers.
  ordinaryBufferLength.call(buffer.call(input));
  if(!length||length>max)return orderFail('invalid-asset');
  // The typed-array constructor copies indexed bytes without iterators or species.
  return new Uint8Array(input);
 }catch{return orderFail('invalid-asset');}
}
interface Manifest {schemaVersion:1;sha256:string;bytes:number;chunks:{sha256:string;bytes:number}[]}
/** Sealing and chunks share the caller's transaction; failed publication leaves no active partial archive. */
export async function writeOrderBlob(tx:HistoryTransaction,base:string,bytes:Uint8Array):Promise<{sha256:string;bytes:number}>{
 bytes=ownedOrderBytes(bytes);
 const sha256=await orderBytesHash(bytes),chunks:Uint8Array[]=[],descriptors:Manifest['chunks']=[];
 for(let offset=0;offset<bytes.length;offset+=ORDER_CHUNK_BYTES){const chunk=bytes.slice(offset,offset+ORDER_CHUNK_BYTES);chunks.push(chunk);descriptors.push({sha256:await orderBytesHash(chunk),bytes:chunk.length});}
 const manifest:Manifest={schemaVersion:1,sha256,bytes:bytes.length,chunks:descriptors},prior=await tx.get(base+'manifest');
 if(prior!==undefined){const existing=await readOrderBlob(tx,base,bytes.length);if(await orderBytesHash(existing)!==sha256)return orderFail('idempotency-conflict');return {sha256,bytes:bytes.length};}
 for(let n=0;n<chunks.length;n++)await tx.put(base+'chunks/'+String(n).padStart(4,'0'),chunks[n]);await tx.put(base+'manifest',manifest);return {sha256,bytes:bytes.length};
}
/** Bounded reconstruction verifies every chunk and the complete original bytes. No fetch, parsing or execution. */
export async function readOrderBlob(tx:Pick<HistoryTransaction,'get'>,base:string,maxBytes=2097152):Promise<Uint8Array>{
 let m:Manifest;try{m=copyPaidOrderData(await tx.get(base+'manifest')) as Manifest;}catch{return orderFail('invalid-record');}if(!m||Array.isArray(m)||Object.keys(m).sort().join(',')!=='bytes,chunks,schemaVersion,sha256'||m.schemaVersion!==1||!hash(m.sha256)||!Number.isInteger(m.bytes)||m.bytes<1||m.bytes>maxBytes||!Array.isArray(m.chunks)||m.chunks.length!==Math.ceil(m.bytes/ORDER_CHUNK_BYTES))return orderFail('invalid-record');
 const bytes=new Uint8Array(m.bytes);let offset=0;
 for(let n=0;n<m.chunks.length;n++){
  const d=m.chunks[n]!,expected=Math.min(ORDER_CHUNK_BYTES,m.bytes-offset);if(!d||Object.keys(d).sort().join(',')!=='bytes,sha256'||!hash(d.sha256)||d.bytes!==expected)return orderFail('invalid-record');
  const raw=await tx.get<Uint8Array>(base+'chunks/'+String(n).padStart(4,'0'));let chunk:Uint8Array;try{chunk=ownedOrderBytes(raw!,expected);}catch{return orderFail('invalid-record');}if(chunk.length!==expected||await orderBytesHash(chunk)!==d.sha256)return orderFail('invalid-record');bytes.set(chunk,offset);offset+=chunk.length;
 }
 if(offset!==m.bytes||await orderBytesHash(bytes)!==m.sha256)return orderFail('invalid-record');return bytes;
}
