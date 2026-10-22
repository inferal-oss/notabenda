// @requirements REQ-PRODUCT-PUBLICATION-INSPECTION REQ-PRODUCT-CF-ADMIN
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {JSDOM} from 'jsdom';
import {compileLegalDocuments,createTermsOffer} from '@notabenda/core/content';
import {checkDocumentPublication,createRecordingInspectionWorker,recordLegalRelease,registerTermsOffer,setActiveTermsOffer,getTermsRecordingSelection} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {fixture} from '../../notabenda/test/helpers.mjs';
const html='<!doctype html><html lang="en"><title>Terms</title><p>Résumé · شروط</p></html>';
const digest=body=>createHash('sha256').update(body).digest('hex');
const path='/artifacts/'+'a'.repeat(64)+'/terms.html',reference=()=>({path,sha256:digest(html)}),body=value=>new Response(value,{headers:{'Content-Type':'text/html; charset=utf-8'}}),source=fetch=>({origin:'https://site.example.test',label:'Public website',fetch});
const tick=()=>new Promise(r=>setImmediate(r));

test('bounded UTF-8 HTML comparison uses only a fixed pinned URL, without credentials or redirects',async()=>{
 let seen;const report=await checkDocumentPublication(reference(),source(async request=>{seen=request;return body(html);}));
 assert.equal(report.status,'matched');assert.equal(report.actualSha256,digest(html));assert.equal(report.bytes,Buffer.byteLength(html));assert.equal(report.url,'https://site.example.test'+path);assert.equal(seen.method,'GET');assert.equal(seen.redirect,'manual');assert.equal(seen.credentials,'omit');assert.equal(seen.headers.get('Cookie'),null);assert.equal(seen.headers.get('Authorization'),null);assert.equal(seen.headers.get('Accept'),'text/html');assert.equal(seen.referrerPolicy,'no-referrer');assert.doesNotMatch(JSON.stringify(report),/Résumé|شروط/);
 const different=await checkDocumentPublication(reference(),source(async()=>body(html+' ')));assert.equal(different.status,'different');assert.equal(different.expectedSha256,digest(html));assert.equal(different.actualSha256,digest(html+' '));
});

test('missing, non-HTML, redirects and HTTP errors stay distinct without returning their bodies or headers',async()=>{
 for(const [status,type,expected,reason] of [[404,'text/html','missing',undefined],[410,'text/html','missing',undefined],[302,'text/html','unavailable','http-status'],[401,'text/html','unavailable','http-status'],[500,'text/html','unavailable','http-status'],[200,'application/json','unavailable','not-html']]){
  let calls=0,canceled=0;const stream=new ReadableStream({cancel(){canceled++;}}),report=await checkDocumentPublication(reference(),source(async request=>{calls++;assert.equal(request.redirect,'manual');return new Response(stream,{status,headers:{'Content-Type':type,Location:'https://private.example.test/PRIVATE'}});}));assert.equal(report.status,expected);assert.equal(report.reason,reason);assert.equal(report.httpStatus,status);assert.equal(report.actualSha256,undefined);assert.equal(calls,1);assert.equal(canceled,1);assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);
 }
});

test('oversized and stalled bodies cancel, never emit a partial digest and do not trust Content-Length',async()=>{
 let canceled=0,signal;const huge=await checkDocumentPublication(reference(),{...source(async request=>{signal=request.signal;return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('x'.repeat(101)));},cancel(){canceled++;}}),{headers:{'Content-Type':'text/html','Content-Length':'1'}});}),maxBytes:100});assert.equal(huge.status,'unavailable');assert.equal(huge.reason,'too-large');assert.equal(huge.actualSha256,undefined);assert.equal(canceled,1);
 const stalled=await checkDocumentPublication(reference(),{...source(async request=>{signal=request.signal;return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('PRIVATE PARTIAL'));},cancel(){canceled++;}}),{headers:{'Content-Type':'text/html'}});}),timeoutMs:30});assert.equal(stalled.reason,'timeout');assert.equal(signal.aborted,true);assert.equal(stalled.actualSha256,undefined);assert.equal(canceled,2);assert.doesNotMatch(JSON.stringify(stalled),/PRIVATE/);
});

test('deadline and caller abort return bounded results even when fetch ignores cancellation; late bodies are discarded',async()=>{
 let finish,signal,canceled=0;const pending=new Promise(resolve=>finish=resolve),report=await checkDocumentPublication(reference(),{...source(async request=>{signal=request.signal;return pending;}),timeoutMs:20});assert.equal(report.reason,'timeout');assert.equal(signal.aborted,true);finish(new Response(new ReadableStream({cancel(){canceled++;}}),{headers:{'Content-Type':'text/html'}}));await tick();assert.equal(canceled,1);assert.equal(report.status,'unavailable');
 const abort=new AbortController();let calls=0;abort.abort();assert.equal((await checkDocumentPublication(reference(),{...source(async()=>{calls++;return body(html);}),signal:abort.signal})).reason,'aborted');assert.equal(calls,0);
 const active=new AbortController(),work=checkDocumentPublication(reference(),{...source(async request=>{signal=request.signal;return new Promise(()=>{});}),signal:active.signal});active.abort();assert.equal((await work).reason,'aborted');assert.equal(signal.aborted,true);
});

test('immediately available empty chunks cannot evade the work limit or starve the deadline',async()=>{
 const script=`
  import assert from 'node:assert/strict';
  import {checkDocumentPublication} from '@notabenda/cloudflare';
  for (const [timeoutMs, expected] of [[30000, 'work-limit'], [10, 'timeout']]) {
   let canceled=0,pulls=0;
   const report=await checkDocumentPublication(${JSON.stringify(reference())},{origin:'https://site.example.test',label:'Bounded stream',timeoutMs,fetch:async()=>new Response(new ReadableStream({pull(c){pulls++;c.enqueue(new Uint8Array(0));},cancel(){canceled++;}}),{headers:{'Content-Type':'text/html'}})});
   assert.equal(report.status,'unavailable');assert.equal(report.reason,expected);
   assert.equal(report.actualSha256,undefined);assert.equal(canceled,1);assert.ok(pulls<=16385);
  }
  console.log('bounded empty streams');
 `;
 // An external deadline also catches regressions that starve node:test's timer.
 const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',script],{cwd:new URL('../../../',import.meta.url),timeout:5000,maxBuffer:4096});
 assert.equal(stdout.trim(),'bounded empty streams');
});

test('invalid references and destinations fail before fetching, with explicit loopback opt-in only',async()=>{
 let calls=0;const fetch=async()=>{calls++;return body(html);};
 for(const origin of ['http://site.example.test','http://127.0.0.1:4181','https://user:PRIVATE@site.example.test','https://site.example.test/path','https://site.example.test?PRIVATE','https://site.example.test#PRIVATE','file:///tmp/test'])await assert.rejects(checkDocumentPublication(reference(),{origin,label:'Reader',fetch}));
 for(const ref of [{...reference(),path:'/terms'},{...reference(),path:path+'?private'},{...reference(),path:'/artifacts/'+'a'.repeat(64)+'/../terms.html'},{...reference(),sha256:'A'.repeat(64)},{...reference(),extra:'PRIVATE'}])await assert.rejects(checkDocumentPublication(ref,source(fetch)));
 let getters=0;const accessor=reference();Object.defineProperty(accessor,'path',{enumerable:true,get(){getters++;return path;}});await assert.rejects(checkDocumentPublication(accessor,source(fetch)));assert.equal(getters,0);assert.equal(calls,0);
 for(const limits of [{maxBytes:0},{maxBytes:1024*1024+1},{timeoutMs:0},{timeoutMs:30001}])await assert.rejects(checkDocumentPublication(reference(),{...source(fetch),...limits}));assert.equal(calls,0);
 assert.equal((await checkDocumentPublication(reference(),{origin:'http://127.0.0.1:4181',label:'Local fixture',fetch,allowHttpLoopback:true})).status,'matched');
});

test('configuration and expected references are captured before asynchronous transport; errors remain generic',async()=>{
 let finish;const expected=reference(),options=source(()=>new Promise(resolve=>finish=resolve)),work=checkDocumentPublication(expected,options);expected.sha256='0'.repeat(64);expected.path='/PRIVATE';options.origin='https://other.example.test';options.label='Changed';options.fetch=async()=>{throw Error('Must not call');};finish(body(html));const report=await work;assert.equal(report.status,'matched');assert.equal(report.source.label,'Public website');assert.equal(report.url,'https://site.example.test'+path);
 const failed=await checkDocumentPublication(reference(),source(async()=>{throw Error('PRIVATE CREDENTIAL');}));assert.equal(failed.reason,'transport');assert.doesNotMatch(JSON.stringify(failed),/PRIVATE/);
});

async function selected(){const config=await fixture({reviewed:true}),release=compileLegalDocuments(config),offer=createTermsOffer(release.artifact,{scopeId:'signup',statement:'I agree to these terms.',actionLabel:'Continue'}),storage=createSyntheticStorage([]),context={siteId:offer.siteId,scopeId:offer.scopeId};await recordLegalRelease(storage,release.artifact);await registerTermsOffer(storage,offer,context);await setActiveTermsOffer(storage,offer.offerId,context);return {release,offer,storage,context,target:{id:'terms',title:'Signup terms',family:'terms',siteId:offer.siteId,scopeId:offer.scopeId,read:()=>getTermsRecordingSelection(storage,context)}};}
const request=query=>new Request('https://admin.example.test/admin/recording'+query,{headers:{Authorization:'Bearer PRIVATE',Cookie:'PRIVATE'}});
test('inspection requires an explicit check, binds its archived selection and preserves all stored state',async()=>{
 const f=await selected();let calls=0;const publication=source(async r=>{calls++;assert.equal(r.headers.get('Authorization'),null);assert.equal(r.headers.get('Cookie'),null);return body(f.release.files[new URL(r.url).pathname.slice(1)]);}),worker=createRecordingInspectionWorker({basePath:'/admin/recording',authorize:()=>({targets:[{...f.target,publication}]})}),before=[...await f.storage.list({prefix:'',limit:1000})];
 const initial=await(await worker.fetch(request('?format=json'),{})).json();assert.equal(initial.observations[0].publication.status,'not-requested');assert.equal(calls,0);
 const response=await worker.fetch(request('?format=json&publication=check'),{}),json=await response.json();assert.equal(json.observations[0].publication.status,'matched');assert.equal(json.observations[0].publication.expectedSha256,json.observations[0].selection.selected.document.sha256);assert.equal(json.boundaries.verifiesPublication,false);assert.equal(json.boundaries.verifiesPublicRouting,false);assert.equal(calls,1);assert.deepEqual([...await f.storage.list({prefix:'',limit:1000})],before);assert.doesNotMatch(JSON.stringify(json),/PRIVATE/);
 const page=await worker.fetch(request('?publication=check'),{}),d=new JSDOM(await page.text()).window.document;assert.equal(d.querySelector('.recording-publication').dataset.status,'matched');assert.equal(d.querySelector('.recording-check-action').getAttribute('href'),'/admin/recording?publication=check');assert.equal(d.querySelector('script,form,input'),null);assert.equal(d.querySelector('.recording-status').textContent,'Selected');assert.equal(page.headers.get('Cache-Control'),'private, no-store');
});

test('invalid, absent and inactive selections perform no document fetch; selectors cannot choose hosts or paths',async()=>{
 const f=await selected();let reads=0,calls=0;const publication=source(async()=>{calls++;return body(html);}),target={...f.target,publication,read:async()=>{reads++;return f.target.read();}},worker=createRecordingInspectionWorker({basePath:'/admin/recording',authorize:()=>({targets:[target]})});
 for(const query of ['?publication=check&origin=https://other.example.test','?publication=check&path=/terms','?publication=check&publication=check','?publication=other'])assert.equal((await worker.fetch(request(query),{})).status,400);assert.equal(reads,0);assert.equal(calls,0);
 await setActiveTermsOffer(f.storage,null,f.context);assert.equal((await(await worker.fetch(request('?publication=check&format=json'),{})).json()).observations[0].publication.status,'no-selection');assert.equal(calls,0);
 target.read=async()=>{throw Error('PRIVATE');};assert.equal((await(await worker.fetch(request('?publication=check&format=json'),{})).json()).observations[0].publication.status,'selection-unavailable');assert.equal(calls,0);
 const denied=createRecordingInspectionWorker({authorize:()=>null});assert.equal((await denied.fetch(request('?publication=check'),{})).status,403);assert.equal(calls,0);
});

test('missing, different and failed readers remain visible beside a valid selected offer',async()=>{
 const f=await selected(),targets=[['different',()=>body(html)],['missing',()=>new Response('PRIVATE',{status:404})],['failed',()=>{throw Error('PRIVATE');}]].map(([id,fetch])=>({...f.target,id,title:id,publication:{...source(async()=>fetch()),label:'Reader <script>PRIVATE</script>'}}));
 const worker=createRecordingInspectionWorker({basePath:'/admin/recording',authorize:()=>({targets})}),json=await(await worker.fetch(request('?publication=check&format=json'),{})).json();assert.deepEqual(json.observations.map(o=>o.publication.status),['different','missing','unavailable']);assert.ok(json.observations.every(o=>o.selection.status==='selected'));
 const d=new JSDOM(await(await worker.fetch(request('?publication=check'),{})).text()).window.document;assert.equal(d.querySelectorAll('.recording-publication').length,3);assert.equal(d.querySelector('script'),null);assert.ok(d.body.textContent.includes('Reader <script>PRIVATE</script>'));
});
