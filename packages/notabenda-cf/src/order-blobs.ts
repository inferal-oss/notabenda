// @requirements REQ-PRODUCT-PAID-ORDER-ARCHIVES
// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL
import type {HistoryTransaction} from './history.js';
import {orderFail} from './order-context.js';
import {copyPaidOrderData} from './order-policy.js';
export const ORDER_CHUNK_BYTES=65536;
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
export async function orderBytesHash(input:Uint8Array):Promise<string>{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(input)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function ownedOrderBytes(input:Uint8Array,max=2097152):Uint8Array {
 if(!(input instanceof Uint8Array)||input.buffer instanceof SharedArrayBuffer||!input.byteLength||input.byteLength>max)return orderFail('invalid-asset');return Uint8Array.from(input);
}
interface Manifest {schemaVersion:1;sha256:string;bytes:number;chunks:{sha256:string;bytes:number}[]}
/** Sealing and chunks share the caller's transaction; failed publication leaves no active partial archive. */
export async function writeOrderBlob(tx:HistoryTransaction,base:string,bytes:Uint8Array):Promise<{sha256:string;bytes:number}>{
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
  const raw=await tx.get<Uint8Array>(base+'chunks/'+String(n).padStart(4,'0'));if(!(raw instanceof Uint8Array)||raw.length!==expected||await orderBytesHash(raw)!==d.sha256)return orderFail('invalid-record');bytes.set(raw,offset);offset+=raw.length;
 }
 if(offset!==m.bytes||await orderBytesHash(bytes)!==m.sha256)return orderFail('invalid-record');return bytes;
}
