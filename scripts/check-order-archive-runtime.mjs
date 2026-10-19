// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-PAID-ORDER-ARCHIVES REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-DEMO-WORKSPACE
// Run only against an explicitly started, isolated local Worker. No operational admin credentials.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalJson} from '../packages/notabenda-cf/dist/history.js';
const port=process.env.NOTABENDA_CHECK_PORT??'4188';assert.ok(['4178','4188'].includes(port));
const origin='http://127.0.0.1:'+port,recover=process.argv.includes('--recover');assert.ok(process.argv.slice(2).every(a=>a==='--recover'));
const folder=new URL('../.local/',import.meta.url),file=new URL('order-archive-runtime-'+port+'.json',folder),hash=value=>createHash('sha256').update(value).digest('hex');
async function newSession(){const response=await fetch(origin+'/demo/admin');assert.equal(response.status,200);const cookie=response.headers.get('set-cookie').split(';')[0],generation=hash(cookie.split('=')[1].split('.')[0]);return {cookie,generation};}
let saved=recover?JSON.parse(await readFile(file,'utf8')):undefined;assert.ok(!recover||saved.origin===origin);
const session=saved?.session??await newSession(),headers={Cookie:session.cookie,'X-Notabenda-Demo-Generation':session.generation},get=path=>fetch(origin+path,{headers}),post=body=>fetch(origin+'/demo/orders/deferred/submit',{method:'POST',headers:{...headers,Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)});
assert.equal((await get('/demo/admin')).status,200);
let review=saved?.review;if(!review){const quote=await get('/demo/orders/deferred/quote');assert.equal(quote.status,200);review=await quote.json();}
const body=saved?.body??{schemaVersion:1,requestId:crypto.randomUUID(),reviewId:review.reviewId,definitionId:review.definition.definitionId,quoteId:review.quote.quoteId,quoteRevision:review.quote.revision,contextRef:review.quote.contextRef},responses=await Promise.all([post(body),post(body)]);for(const response of responses)assert.equal(response.status,200);const receipt=await responses[0].json();assert.equal(receipt.status,'received');assert.deepEqual(await responses[1].json(),receipt);if(saved)assert.deepEqual(receipt,saved.receipt);
const used=await post({...body,requestId:crypto.randomUUID()});assert.equal((await used.json()).reason,'checkout-used');
const base='/demo/admin/orders',id=receipt.id,detail=await get(base+'/record?id='+id);assert.equal(detail.status,200);assert.match(await detail.text(),/Inspect retained review/);
const archive=await get(base+'/order-review?id='+id);assert.equal(archive.status,200);const html=await archive.text();assert.match(html,/class="demo-corner"/);assert.match(html,/Payment action shown/);assert.doesNotMatch(html,/<script|<button/);
const json=await get(base+'/order-review.json?id='+id);assert.equal(json.status,200);assert.match(json.headers.get('Content-Disposition'),/^attachment;/);assert.equal(await json.text(),canonicalJson(review));
let originals=0;for(const item of review.definition.items)if(item.guarantee?.status==='label-provided'){
 const asset=item.guarantee.label.asset,path=base+'/order-asset?id='+id+'&sha256='+asset.sha256,download=await get(path);assert.equal(download.status,200);assert.match(download.headers.get('Content-Disposition'),/^attachment;/);assert.match(download.headers.get('Cache-Control'),/no-store/);const bytes=new Uint8Array(await download.arrayBuffer());assert.equal(bytes.length,asset.bytes);assert.equal(hash(bytes),asset.sha256);
 const current=await fetch(origin+asset.url);assert.equal(current.status,200);assert.deepEqual(new Uint8Array(await current.arrayBuffer()),bytes);
 const image=await get(base+'/order-image?id='+id+'&sha256='+asset.sha256);assert.equal(image.status,200);assert.match(image.headers.get('Content-Security-Policy'),/^sandbox; default-src 'none'/);assert.equal(image.headers.get('Content-Type'),asset.mediaType);assert.equal(hash(new Uint8Array(await image.arrayBuffer())),asset.sha256);
 const head=await fetch(origin+path,{method:'HEAD',headers});assert.equal(head.status,200);assert.equal(await head.text(),'');originals++;
}
const other=await newSession(),privateView=await fetch(origin+base+'/order-review?id='+id,{headers:{Cookie:other.cookie}});assert.equal(privateView.status,404);
const download=await get(base+'/export.json');assert.equal(download.status,200);const exported=await download.json();assert.equal(exported.records.length,1);assert.equal(exported.records[0].data.id,id);assert.doesNotMatch(JSON.stringify(exported),/characteristics|producerLabel|<svg/);
if(!saved){await mkdir(folder,{recursive:true});await writeFile(file,JSON.stringify({origin,session,review,body,receipt},null,2)+'\n',{mode:0o600});}
console.log(JSON.stringify({phase:recover?'recovered-after-restart':'created',admissionId:id,originals,checks:['matching retry','one intent','exact JSON','original bytes','sandboxed image','private scope','small export','HEAD']},null,2));
