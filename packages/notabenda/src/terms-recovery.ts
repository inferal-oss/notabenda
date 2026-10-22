// @requirements REQ-PRODUCT-TERMS-RECOVERY REQ-PRODUCT-TERMS-ACCEPTANCE
import {createTermsAcceptance,normalizeTermsOffer,validTermsRequestId,TermsAcceptanceError} from './terms.js';
import type {TermsAcceptanceController,TermsAcceptanceOptions} from './terms.js';
import {assertPlainCatalogData} from './catalog-plain.js';

/** Host implementations must serialize each update atomically across all participating tabs. */
export interface TermsRecoveryJournal {
 read(key:string):Promise<unknown>;
 update(key:string,change:(previous:unknown)=>unknown):Promise<unknown>;
}
export interface IndexedDBTermsRecoveryJournal extends TermsRecoveryJournal {/** Host cleanup after settling/retiring the operation and destroying its controllers. */ remove(contextId:string):Promise<void>;close():void}
export interface RecoverableTermsAcceptanceOptions extends Omit<TermsAcceptanceOptions,'requestId'> {
 /** Stable opaque host context for this subject and operation; never an authentication credential. */
 contextId:string;
 journal:TermsRecoveryJournal;
}
export class TermsRecoveryError extends Error {
 constructor(readonly code:'unavailable'|'invalid-record'|'context-mismatch'){super(code);this.name='TermsRecoveryError';}
}
interface RecoveryRecord {schemaVersion:1;binding:string;requestId:string}
function record(value:unknown,binding:string):RecoveryRecord{
 try{assertPlainCatalogData(value);}catch{throw new TermsRecoveryError('invalid-record');}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new TermsRecoveryError('invalid-record');
 const row=value as Record<string,unknown>;
 if(Object.keys(row).length!==3||row.schemaVersion!==1||typeof row.binding!=='string'||!/^[a-f0-9]{64}$/u.test(row.binding)||!validTermsRequestId(row.requestId))throw new TermsRecoveryError('invalid-record');
 if(row.binding!==binding)throw new TermsRecoveryError('context-mismatch');
 return {schemaVersion:1,binding,requestId:row.requestId};
}
/** Reserves one private retry key. Opening never submits, restores a check or trusts a stored receipt. */
export async function createRecoverableTermsAcceptance(input:unknown,options:RecoverableTermsAcceptanceOptions):Promise<TermsAcceptanceController>{
 const offer=normalizeTermsOffer(input,options),{operationId,contextId,journal,submit,allowPreview}=options;
 if(typeof options.contextId!=='string'||!/^[A-Za-z0-9_-]{16,200}$/u.test(options.contextId)||!options.journal||typeof options.journal.read!=='function'||typeof options.journal.update!=='function'||Object.hasOwn(options,'requestId'))throw new TermsRecoveryError('unavailable');
 // Validate the host options before reading or writing its journal.
 const probe=createTermsAcceptance(offer,options);probe.destroy();
 let binding:string;
 try{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([offer,operationId])));binding=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}catch{throw new TermsRecoveryError('unavailable');}
 const key='notabenda:terms-recovery:v1:'+contextId;
 let saved:RecoveryRecord;
 try{saved=record(await journal.update(key,previous=>{
  if(previous!==undefined)return record(previous,binding);
  const requestId=crypto.randomUUID();if(!validTermsRequestId(requestId))throw new TermsRecoveryError('unavailable');
  return {schemaVersion:1,binding,requestId} satisfies RecoveryRecord;
 }),binding);}catch(error){if(error instanceof TermsRecoveryError)throw error;throw new TermsRecoveryError('unavailable');}
 return createTermsAcceptance(offer,{operationId,...(allowPreview===undefined?{}:{allowPreview}),requestId:saved.requestId,async submit(request,context){
  // Losing or replacing the reserved row must not silently produce a new attempt.
  try{const current=record(await journal.read(key),binding);if(current.requestId!==saved.requestId)throw new TermsRecoveryError('context-mismatch');}catch{throw new TermsAcceptanceError('recording-failed');}
  if(context.signal.aborted)throw new TermsAcceptanceError('destroyed');
  return submit(request,context);
 }});
}

/** Optional, lazy IndexedDB adapter. No browser globals are read until explicitly invoked. */
export function createIndexedDBTermsRecoveryJournal(options:{databaseName?:string;indexedDB?:IDBFactory}={}):IndexedDBTermsRecoveryJournal{
 const factory=options.indexedDB??globalThis.indexedDB,name=options.databaseName??'notabenda-terms-recovery-v1';
 if(!factory||typeof name!=='string'||!name.trim()||name.length>200)throw new TermsRecoveryError('unavailable');
 let closed=false,opening:Promise<IDBDatabase>|undefined;
 function open(){
  if(closed)return Promise.reject(new TermsRecoveryError('unavailable'));
  return opening??=new Promise<IDBDatabase>((resolve,reject)=>{
   let settled=false;const request=factory.open(name,1);
   const fail=()=>{settled=true;reject(new TermsRecoveryError('unavailable'));};
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('contexts'))request.result.createObjectStore('contexts');};
   request.onerror=request.onblocked=fail;
   request.onsuccess=()=>{const db=request.result;if(closed||settled){db.close();fail();return;}settled=true;db.onversionchange=()=>{closed=true;db.close();};resolve(db);};
  });
 }
 async function transaction(key:string,change?:((previous:unknown)=>unknown)){
  if(typeof key!=='string'||!key.length||key.length>512||change!==undefined&&typeof change!=='function')throw new TermsRecoveryError('unavailable');
  const db=await open();if(closed)throw new TermsRecoveryError('unavailable');
  return new Promise<unknown>((resolve,reject)=>{
   const tx=db.transaction('contexts',change?'readwrite':'readonly',change?{durability:'strict'}:{}),store=tx.objectStore('contexts');let result:unknown,failure:unknown;
   const request=store.get(key);
   request.onsuccess=()=>{try{result=change?change(structuredClone(request.result)):request.result;if(change){assertPlainCatalogData(result);const json=JSON.stringify(result);if(json===undefined||new TextEncoder().encode(json).length>65536)throw Error();if(json!==JSON.stringify(request.result))store.put(structuredClone(result),key);}}catch(error){failure=error;tx.abort();}};
   tx.oncomplete=()=>resolve(structuredClone(result));tx.onabort=tx.onerror=()=>reject(failure instanceof TermsRecoveryError?failure:new TermsRecoveryError('unavailable'));
  });
 }
 async function remove(contextId:string):Promise<void>{
  if(typeof contextId!=='string'||!/^[A-Za-z0-9_-]{16,200}$/u.test(contextId))throw new TermsRecoveryError('unavailable');
  const db=await open();if(closed)throw new TermsRecoveryError('unavailable');
  return new Promise((resolve,reject)=>{const tx=db.transaction('contexts','readwrite',{durability:'strict'});tx.objectStore('contexts').delete('notabenda:terms-recovery:v1:'+contextId);tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(new TermsRecoveryError('unavailable'));});
 }
 return {read:key=>transaction(key),update:(key,change)=>transaction(key,change),remove,close(){if(closed)return;closed=true;void opening?.then(db=>db.close(),()=>{});}};
}
