/** @requirements REQ-PRODUCT-EVIDENCE-EXPORT REQ-PRODUCT-CF-ADMIN */
import {boundedText, MAX_PAGE_SIZE, matchesRecord, normalizeRecord, validId} from './records.js';
import type {EvidenceRecord, RecordPage, RecordQuery, RecordStore} from './types.js';

const validDate=(value:string)=>!value||/^\d{4}-\d{2}-\d{2}$/u.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const encoder=new TextEncoder();
/** Cloudflare storage orders keys by their UTF-8 bytes, not the browser's locale. */
export function compareRecordKeys(a:string,b:string):number {
 const left=encoder.encode(a),right=encoder.encode(b);
 for(let i=0;i<Math.min(left.length,right.length);i++)if(left[i]!==right[i])return left[i]!-right[i]!;
 return left.length-right.length;
}
/** Validate and copy filters before allowing a store to inspect them. */
export function normalizeRecordQuery(input:RecordQuery):RecordQuery {
 if(!input||typeof input!=='object'||Object.keys(input).some(key=>!['query','kind','keyPrefix','from','to','limit','after'].includes(key)))throw new Error('Invalid record query.');
 const {query,kind,keyPrefix,from,to,limit,after}=input;
 if(!boundedText(query,256)||!boundedText(kind,64)||!boundedText(keyPrefix,128)||typeof from!=='string'||typeof to!=='string'||!validDate(from)||!validDate(to)||from&&to&&from>to||!Number.isInteger(limit)||limit<1||limit>MAX_PAGE_SIZE||after!==undefined&&(!validId(after)||!after.startsWith(keyPrefix)))throw new Error('Invalid record query.');
 return {query,kind,keyPrefix,from,to,limit,...(after===undefined?{}:{after})};
}
/** One bounded, validated segment. The host must supply an already authorized store. */
export async function readRecordPage(store:RecordStore,input:RecordQuery):Promise<RecordPage> {
 const query=normalizeRecordQuery(input);
 // An adapter must not mutate the filters used to validate its response.
 const result=await store.list({...query});
 if(!result||!Array.isArray(result.records)||result.records.length>query.limit||result.nextAfter!==undefined&&(!validId(result.nextAfter)||!result.nextAfter.startsWith(query.keyPrefix)||query.after!==undefined&&compareRecordKeys(result.nextAfter,query.after)<=0)||result.scanned!==undefined&&(!Number.isInteger(result.scanned)||result.scanned<result.records.length||result.scanned>500))throw new Error('Invalid store response.');
 const records=result.records.map(record=>normalizeRecord(record));
 let previous=query.after;
 for(const record of records){
  if(!matchesRecord(record,query)||previous!==undefined&&compareRecordKeys(record.id,previous)<=0||result.nextAfter!==undefined&&compareRecordKeys(record.id,result.nextAfter)>0)throw new Error('Invalid store response.');
  previous=record.id;
 }
 return {records,...(result.nextAfter===undefined?{}:{nextAfter:result.nextAfter}),...(result.scanned===undefined?{}:{scanned:result.scanned})};
}

export interface EvidenceExportSegment {
 schemaVersion:1;
 kind:'notabenda-evidence-segment';
 scopeLabel:string;
 selection:RecordQuery;
 read:{startedAt:string;completedAt:string;consistency:'live-segment'};
 segment:{returned:number;examined?:number;continuationRequired:boolean;nextAfter?:string};
 records:EvidenceRecord[];
 exclusions:readonly ['application-data-outside-this-store','separately-authorized-source-archives','externally-linked-artifacts'];
}
/** A compact serialized segment is at most 4 MiB. This does not bound the size of the entire store. */
export const MAX_EXPORT_BYTES=4*1024*1024;
/**
 * Read one segment only. No implicit traversal, snapshot, source-archive lookup, logging or writes.
 * The host authorizes export separately and supplies scope; a display label cannot select a store.
 */
export async function createEvidenceExportSegment(store:RecordStore,input:RecordQuery,options:{scopeLabel?:string}={}):Promise<EvidenceExportSegment> {
 const selection=normalizeRecordQuery(input);
 const scopeLabel=options.scopeLabel??'Host-authorized records';
 if(!boundedText(scopeLabel,200))throw new Error('Invalid scope label.');
 const startedAt=new Date().toISOString();
 const page=await readRecordPage(store,selection);
 return {schemaVersion:1,kind:'notabenda-evidence-segment',scopeLabel,selection,read:{startedAt,completedAt:new Date().toISOString(),consistency:'live-segment'},segment:{returned:page.records.length,...(page.scanned===undefined?{}:{examined:page.scanned}),continuationRequired:page.nextAfter!==undefined,...(page.nextAfter===undefined?{}:{nextAfter:page.nextAfter})},records:page.records,exclusions:['application-data-outside-this-store','separately-authorized-source-archives','externally-linked-artifacts']};
}
/** Canonical filter encoding shared by search, review and download links. */
export function recordQueryParams(query:RecordQuery):URLSearchParams {
 const q=normalizeRecordQuery(query);
 return new URLSearchParams({q:q.query,kind:q.kind,key:q.keyPrefix,from:q.from,to:q.to,limit:String(q.limit),...(q.after===undefined?{}:{after:q.after})});
}
