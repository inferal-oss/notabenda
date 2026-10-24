// @requirements REQ-PRODUCT-RIGHTS-CENTER
// @requirements REQ-PRODUCT-CF-ADMIN
// @requirements REQ-PRODUCT-DEMO-WORKSPACE
// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-RETAINED-RELEASES
// @requirements REQ-PRODUCT-CF-HOST REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-AUTHORING
// Local integration check of the HTTP/DO boundary; never prints the host key.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const runtimePort=process.env.NOTABENDA_CHECK_PORT??'4179';assert.ok(/^\d{4,5}$/u.test(runtimePort)&&Number(runtimePort)>=1024&&Number(runtimePort)<=65535,'Choose a loopback test port from 1024 to 65535.');
const origin='http://127.0.0.1:'+Number(runtimePort);
const auth={Authorization:'Basic '+Buffer.from('admin:admin').toString('base64')};
// Supply the same private test cookie on both sides of a restart; a new session cannot prove recovery.
const recoveryCookie=process.env.NOTABENDA_CHECK_COOKIE;
assert.ok(recoveryCookie===undefined||/^notabenda_demo=[a-f0-9]{64}\.[a-f0-9]{64}$/u.test(recoveryCookie),'Use a signed local test-session cookie.');
const nativeFetch=globalThis.fetch;const demoStart=await nativeFetch(origin+'/demo/admin',{headers:recoveryCookie?{Cookie:recoveryCookie}:{}});assert.equal(demoStart.status,200);
const setCookie=demoStart.headers.get('Set-Cookie');assert.ok(!setCookie||!/Max-Age|Expires/iu.test(setCookie),'The demo cookie must remain session scoped.');
const demoCookie=setCookie?.split(';')[0]??recoveryCookie;assert.ok(typeof demoCookie==='string'&&/^notabenda_demo=[a-f0-9]{64}\.[a-f0-9]{64}$/u.test(demoCookie),'Expected a signed local test-session cookie.');
assert.ok(recoveryCookie===undefined||demoCookie===recoveryCookie,'The recovery check must retain its original demo session.');
const demoGeneration=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(demoCookie.split('=')[1].split('.')[0]))).toString('hex');
const fetch=(input,options={})=>nativeFetch(input,{...options,headers:{...options.headers,...(new URL(input).pathname.startsWith('/demo/')?{Cookie:demoCookie,'X-Notabenda-Demo-Generation':demoGeneration}:{})}});

const checkFile=new URL('../.local/site-runtime-'+demoGeneration+'.json',import.meta.url);
const data=JSON.parse(await readFile(new URL('../site/dist/server-data.json',import.meta.url),'utf8'));
const retainedPair=data.releases.map(release=>release.artifact.artifact??release.artifact).filter(artifact=>artifact.manifest.siteId==='juniper-releases');assert.equal(retainedPair.length,2);
for(const artifact of retainedPair){const pinned=await fetch(`${origin}/artifacts/${artifact.manifest.artifactId}/terms.html`);assert.equal(pinned.status,200);assert.equal(await pinned.text(),artifact.pages['releases/terms/index.html']);assert.doesNotMatch(pinned.headers.get('Content-Security-Policy'),/script-src/);}
const latestTerms=await fetch(origin+'/releases/terms/');assert.equal(latestTerms.status,200);
const latestTermsHtml=await latestTerms.text(),demoStylesheet='<link rel="stylesheet" href="/assets/demo-marker.css">',demoRibbon='<aside class="demo-corner" aria-label="Demonstration">Demo</aside>';
assert.ok(latestTermsHtml.includes(demoStylesheet));assert.ok(latestTermsHtml.includes(demoRibbon));
// Only these two presentation additions differ; pinned downloads above remain byte-exact.
assert.equal(latestTermsHtml.replace(demoStylesheet,'').replace(demoRibbon,''),retainedPair[1].pages['releases/terms/index.html']);
const releaseDiff=await fetch(`${origin}/backoffice/history/diff?before=${retainedPair[0].manifest.artifactId}&after=${retainedPair[1].manifest.artifactId}&kind=terms`,{headers:auth});assert.equal(releaseDiff.status,200);assert.match(await releaseDiff.text(),/export your notes before leaving/);
console.log('Local Workers retained releases: exact prior/current public HTML and protected terms comparison verified.');
const offer=data.agreements.find(entry=>entry.theme==='light').offer;
let saved;
try { saved=JSON.parse(await readFile(checkFile,'utf8')); } catch(error) { if(error.code!=='ENOENT') throw error; }
if(saved && saved.body.offerId !== offer.offerId) saved=undefined;
const body=saved?.body ?? {schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),accepted:true};
for(const path of ['/backoffice/history']) {
  const denied=await fetch(origin+path); assert.equal(denied.status,401); assert.equal(denied.headers.get('Cache-Control'),'private, no-store, no-transform');
}
const invalid=await fetch(origin+'/demo/agreements/light',{method:'POST',headers:{...auth,Origin:'https://attacker.test','Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)}); assert.equal(invalid.status,400);
const response=await fetch(origin+'/demo/agreements/light',{method:'POST',headers:{...auth,Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)}); assert.equal(response.status,200); const receipt=await response.json();
if(saved) assert.deepEqual(receipt,saved.receipt);
else await writeFile(checkFile,JSON.stringify({body,receipt})+'\n',{mode:0o600});
const detail=await fetch(origin+'/demo/admin/agreements/record?id='+receipt.id,{headers:auth}); assert.equal(detail.status,200); const detailHtml=await detail.text(); assert.match(detailHtml,/<h2>Statement shown<\/h2>/); assert.ok(detailHtml.includes(receipt.id));
const history=await fetch(origin+'/backoffice/history',{headers:auth}); assert.equal(history.status,200); assert.match(await history.text(),/Compare document releases/);
const authored=data.releases.filter(release=>release.artifact.sourceAttachments&&release.artifact.artifact.manifest.siteId==='juniper-authored');
assert.equal(authored.length,2);
const authoredIds=authored.map(release=>release.artifact.artifact.manifest.artifactId);
const sourcePath='/backoffice/history/source?id='+authoredIds[1]+'&kind=terms';
assert.equal((await fetch(origin+sourcePath)).status,401);
const sourceResponse=await fetch(origin+sourcePath,{headers:auth});assert.equal(sourceResponse.status,200);assert.match(sourceResponse.headers.get('Cache-Control'),/private, no-store/);assert.match(await sourceResponse.text(),/&lt;PolicyNote/);
const sourceComparison=await fetch(origin+`/backoffice/history/source-diff?before=${authoredIds[0]}&after=${authoredIds[1]}&kind=terms`,{headers:auth});assert.equal(sourceComparison.status,200);assert.match(await sourceComparison.text(),/Authored source changed\. Rendered document body changed\./);
const authoredPage=await fetch(origin+'/authored/terms');assert.equal(authoredPage.status,200);assert.match(await authoredPage.text(),/class="policy-note"/);
console.log('Local Workers authoring: private source inspection and comparison verified against persisted SQLite archives.');
const choiceDenied=await fetch(origin+'/backoffice/choices'); assert.equal(choiceDenied.status,401);
const choices=await fetch(origin+'/backoffice/choices',{headers:auth}); assert.equal(choices.status,200);
const html=await choices.text(); const ids=[...html.matchAll(/href="\/backoffice\/choices\/record\?id=([a-f0-9]{64})"/gu)].map(m=>m[1]).sort(); assert.equal(ids.length,3);
const choiceFile=new URL('../.local/choice-runtime-check.json',import.meta.url);
let priorChoices;
try { priorChoices=JSON.parse(await readFile(choiceFile,'utf8')); } catch(error) { if(error.code!=='ENOENT') throw error; }
if(priorChoices?.noticeId===data.consent.notice.noticeId) assert.deepEqual(ids,priorChoices.ids);
else await writeFile(choiceFile,JSON.stringify({noticeId:data.consent.notice.noticeId,ids})+'\n',{mode:0o600});
const choice=await fetch(origin+'/backoffice/choices/record?id='+ids[0],{headers:auth}); assert.equal(choice.status,200); const choiceHtml=await choice.text(); assert.match(choiceHtml,/Notice wording/); assert.match(choiceHtml,/Revision superseded/); assert.match(choiceHtml,/Historical browser report/);
console.log('Local Workers cookie evidence: protected SQLite-backed fictional ledger, three stable events and readable pinned context verified.');
const recordedFile=new URL('../.local/recorded-runtime-'+demoGeneration+'.json',import.meta.url);
let recorded;
try{recorded=JSON.parse(await readFile(recordedFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const notice=data.recordedConsent.notice;
if(recorded?.body.noticeId!==notice.noticeId)recorded=undefined;
const currentResponse=await fetch(origin+'/demo/choices/head',{headers:auth});assert.equal(currentResponse.status,200);const current=await currentResponse.json();
const recordedBody=recorded?.body??{schemaVersion:1,noticeId:notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:current.revision,action:'revoke-all',choices:Object.fromEntries(Object.keys(notice.scopes).map(id=>[id,false])),clientAt:new Date().toISOString()};
const recordResponse=await fetch(origin+'/demo/choices/record',{method:'POST',headers:{...auth,Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(recordedBody)});assert.equal(recordResponse.status,200);const result=await recordResponse.json();
if(recorded)assert.deepEqual(result.receipt,recorded.receipt);else await writeFile(recordedFile,JSON.stringify({body:recordedBody,receipt:result.receipt})+'\n',{mode:0o600});
assert.ok(result.head.revision>=result.receipt.revision);assert.equal(Object.values(result.receipt.choices).some(Boolean),false);
const liveDetail=await fetch(origin+'/demo/admin/recorded/record?id='+result.receipt.id,{headers:auth});assert.equal(liveDetail.status,200);assert.match(await liveDetail.text(),/Revoke all optional purposes/);
console.log(recorded?'Local Workers recorded-choice endpoint: original receipt and current head recovered.':'Local Workers recorded-choice endpoint: fixed-stream refusal recorded; rerun after restart to verify recovery.');
const processingFile=new URL('../.local/processing-runtime-'+demoGeneration+'.json',import.meta.url);
let processingSaved;
try{processingSaved=JSON.parse(await readFile(processingFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const processingNotice=data.processing.notice;
if(processingSaved?.body.noticeId!==processingNotice.noticeId)processingSaved=undefined;
for(const path of ['/backoffice/processing'])assert.equal((await fetch(origin+path)).status,401);
const processingBody=processingSaved?.body??{schemaVersion:1,noticeId:processingNotice.noticeId,requestId:crypto.randomUUID(),activities:['sale']};
const processingPost=body=>fetch(origin+'/demo/processing/record',{method:'POST',headers:{...auth,Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)});
assert.equal((await processingPost({...processingBody,streamId:'cannot-select-context'})).status,400);
const processingResponse=await processingPost(processingBody);assert.equal(processingResponse.status,200);const processingResult=await processingResponse.json();
if(processingSaved)assert.deepEqual(processingResult.receipt,processingSaved.receipt);else await writeFile(processingFile,JSON.stringify({body:processingBody,receipt:processingResult.receipt})+'\n',{mode:0o600});
assert.equal(processingResult.receipt.provenance,'explicit-opt-out');assert.ok(processingResult.head.event.restrictions.includes('sale'));
const processingHead=await (await fetch(origin+'/demo/processing/head',{headers:auth})).json();assert.deepEqual(processingHead,processingResult.head);
const processingDetail=await fetch(origin+'/demo/admin/processing/record?id='+processingResult.receipt.id,{headers:auth});assert.equal(processingDetail.status,200);const processingHtml=await processingDetail.text();assert.match(processingHtml,/Requested in this event/);assert.match(processingHtml,/Current retained state at read time/);assert.match(processingHtml,/Notice wording/);
console.log(processingSaved?'Local Workers processing opt-out: original receipt, monotonic head and pinned context recovered from SQLite.':'Local Workers processing opt-out: host-bound restriction recorded; rerun after restart to verify SQLite recovery.');
console.log(saved ? 'Local Workers runtime: auth/routes, origin rejection, stored receipt recovery and document history verified.' : 'Local Workers runtime: auth/routes, origin rejection, stored acceptance and document history verified; rerun after restart to verify recovery.');

// @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-STORAGE-CLEANUP
const setupDenied=await fetch(origin+'/backoffice/setup');assert.equal(setupDenied.status,401);
const setupReview=await fetch(origin+'/backoffice/setup',{headers:auth});assert.equal(setupReview.status,200);assert.match(setupReview.headers.get('Cache-Control'),/private, no-store/);assert.match(await setupReview.text(),/data-notabenda-setup/);assert.doesNotMatch(setupReview.headers.get('Content-Security-Policy'),/connect-src/);
assert.equal((await fetch(origin+'/backoffice/setup',{method:'POST',headers:auth})).status,405);
const cleanupDemo=await fetch(origin+'/storage-cleanup/');assert.equal(cleanupDemo.status,200);assert.match(cleanupDemo.headers.get('Content-Security-Policy'),/script-src 'self'/);assert.match(await cleanupDemo.text(),/<script type="module" src="\/assets\/storage-cleanup\.mjs"><\/script>/);assert.equal((await fetch(origin+'/assets/storage-cleanup.mjs')).status,200);
const cleanupPolicy=await fetch(origin+'/storage-cleanup/cookies/');assert.equal(cleanupPolicy.status,200);assert.doesNotMatch(cleanupPolicy.headers.get('Content-Security-Policy'),/script-src/);
console.log('Local Workers setup and storage cleanup: host-protected local questionnaire, write refusal and script-free policy verified.');

// @requirements REQ-PRODUCT-COLLECTION-NOTICE
const collectionPage=await fetch(origin+'/collection/');assert.equal(collectionPage.status,200);assert.doesNotMatch(collectionPage.headers.get('Content-Security-Policy'),/script-src/);assert.doesNotMatch(await collectionPage.text(),/<script/);
const collectionNotice=await (await fetch(origin+'/collection/notice.json')).json();const collectionPrivacy=await fetch(origin+collectionNotice.document.url);assert.equal(collectionPrivacy.status,200);const collectionHtml=await collectionPrivacy.text();const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(collectionHtml).digest('hex'),collectionNotice.document.sha256);
console.log('Local Workers collection notice: script-free form context and exact pinned privacy HTML verified.');

// @requirements REQ-PRODUCT-EVIDENCE-EXPORT
for(const path of ['/backoffice/history/export','/backoffice/history/export.json'])assert.equal((await fetch(origin+path)).status,401);
const exportReview=await fetch(origin+'/backoffice/history/export?limit=1',{headers:auth});assert.equal(exportReview.status,200);assert.match(await exportReview.text(),/Downloads a fresh read/);
const exportDownload=await fetch(origin+'/backoffice/history/export.json?limit=1',{headers:auth});assert.equal(exportDownload.status,200);assert.match(exportDownload.headers.get('Content-Disposition'),/attachment; filename="notabenda-evidence.json"/);assert.match(exportDownload.headers.get('Cache-Control'),/private, no-store/);
const exported=await exportDownload.json();assert.equal(exported.kind,'notabenda-evidence-segment');assert.equal(exported.records.length,1);assert.equal(exported.segment.continuationRequired,true);for(const field of ['pages','publicConfig','sourceAttachments'])assert.equal(Object.hasOwn(exported.records[0].data,field),false);
const nextExport=await fetch(origin+exported.links.nextDownload,{headers:auth});assert.equal(nextExport.status,200);assert.notEqual((await nextExport.json()).records[0].id,exported.records[0].id);
console.log('Local Workers evidence export: protected SQLite-backed filtered segments, attachment headers, projection boundary and continuation verified.');

// @requirements REQ-PRODUCT-DISCOVERY
for(const path of ['/discovery/','/dark/discovery/']){const page=await fetch(origin+path);assert.equal(page.status,200);assert.match(page.headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);assert.match(await page.text(),/id="discovery-tool"/);}
const discoveryLegal=await fetch(origin+'/discovery/privacy/');assert.equal(discoveryLegal.status,200);assert.doesNotMatch(discoveryLegal.headers.get('Content-Security-Policy'),/script-src/);
const discoveryModule=await fetch(origin+'/assets/runtime/discovery-ui.js');assert.equal(discoveryModule.status,200);assert.match(await discoveryModule.text(),/mountDiscovery/);
console.log('Local Workers discovery: self-hosted browser tools, explicit runtime routes and script-free legal pages verified.');

// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
for(const prefix of ['','dark/']){
  const page=await fetch(origin+'/'+prefix+'repeat-prompts/');assert.equal(page.status,200);assert.match(page.headers.get('Content-Security-Policy'),/script-src 'self'/);assert.match(await page.text(),/nb-demo-regions/);
  const policy=await fetch(origin+'/'+prefix+'repeat-prompts/privacy/');assert.equal(policy.status,200);assert.doesNotMatch(policy.headers.get('Content-Security-Policy'),/script-src/);
}
const promptModule=await fetch(origin+'/assets/runtime/prompt-policy.js');assert.equal(promptModule.status,200);assert.match(await promptModule.text(),/evaluatePromptPolicy/);
console.log('Local Workers regional prompts: light/dark laboratory, declared policy module and script-free legal routes verified.');

// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
assert.equal((await fetch(origin+'/backoffice/lifecycle')).status,401);
const lifecycleList=await fetch(origin+'/backoffice/lifecycle',{headers:auth});assert.equal(lifecycleList.status,200);assert.match(lifecycleList.headers.get('Cache-Control'),/private, no-store/);const lifecycleHtml=await lifecycleList.text();for(const phrase of ['Cookie-choice evidence · on hold','retired, purge pending','purge recorded complete'])assert.ok(lifecycleHtml.includes(phrase));
const lifecycleDownload=await fetch(origin+'/backoffice/lifecycle/export.json',{headers:auth});assert.equal(lifecycleDownload.status,200);const lifecycleSegment=await lifecycleDownload.json();assert.equal(lifecycleSegment.records.length,5);const lifecycleStates=lifecycleSegment.records.map(record=>record.data);assert.equal(lifecycleStates.filter(state=>state.phase==='complete').length,3);assert.equal(lifecycleStates.filter(state=>state.hold.active).length,1);assert.equal(lifecycleStates.filter(state=>state.phase==='purging').length,1);const restoredLifecycle=lifecycleStates.find(state=>state.family==='consent'&&state.phase==='complete');assert.ok(restoredLifecycle.restoredAt);assert.equal(restoredLifecycle.progress.deleted,1);assert.ok(lifecycleStates.filter(state=>state.phase==='complete').every(state=>state.progress.deleted===1));assert.ok(!JSON.stringify(lifecycleSegment).includes('synthetic-lifecycle-subject'));
const pendingLifecycle=await fetch(origin+'/backoffice/lifecycle/export.json?q=lifecycle%3Apending',{headers:auth});assert.equal(pendingLifecycle.status,200);const pendingLifecycleSegment=await pendingLifecycle.json();assert.equal(pendingLifecycleSegment.records.length,1);assert.equal(pendingLifecycleSegment.records[0].data.phase,'purging');
for(const state of lifecycleStates){const detail=await fetch(origin+'/backoffice/lifecycle/record?id='+state.family+'/'+state.contextRef,{headers:auth});assert.equal(detail.status,200);const html=await detail.text();assert.match(html,/Matching events removed/);assert.match(html,/Minimal lifecycle metadata/);if(state.hold.active)assert.match(html,/does not release the hold/);if(state.family==='processing')assert.match(html,/processing contexts remain blocked/);}
assert.equal((await fetch(origin+'/backoffice/lifecycle/purge',{method:'POST',headers:auth})).status,405);
console.log('Local Workers evidence lifecycle: SQLite-backed holds, bounded purge, restore reapplication, isolated demo streams and protected read-only review/export verified.');

// @requirements REQ-PRODUCT-SCOPE-GUARDS
for(const prefix of ['','dark/']){
 const page=await fetch(origin+'/'+prefix+'scope-guards/');assert.equal(page.status,200);assert.match(page.headers.get('Content-Security-Policy'),/script-src 'self'; connect-src 'self'/);assert.match(await page.text(),/nb-demo-guards/);
 const config=await(await fetch(origin+'/'+prefix+'scope-guards/site.json')).json();assert.equal(config.scopeGuards.purposes[0].facts.sensitiveData,'present');
 for(const kind of ['privacy','cookies','terms']){const legal=await fetch(origin+'/'+prefix+'scope-guards/'+kind+'/');assert.equal(legal.status,200);assert.doesNotMatch(legal.headers.get('Content-Security-Policy'),/script-src/);}
}
for(const module of ['scope-guards.js','scope-guard-policy.js'])assert.equal((await fetch(origin+'/assets/runtime/'+module)).status,200);
console.log('Local Workers scope guards: declared light/dark laboratory, self-hosted policy modules and script-free legal pages verified.');

// @requirements REQ-PRODUCT-DEMO-WORKSPACE
const secondDemo=await nativeFetch(origin+'/demo/admin');assert.equal(secondDemo.status,200);const secondCookie=secondDemo.headers.get('Set-Cookie').split(';')[0];assert.notEqual(secondCookie,demoCookie);
const secondGeneration=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secondCookie.split('=')[1].split('.')[0]))).toString('hex');
const otherHead=await(await nativeFetch(origin+'/demo/choices/head',{headers:{Cookie:secondCookie,'X-Notabenda-Demo-Generation':secondGeneration}})).json();assert.equal(otherHead.revision,0);assert.notEqual(otherHead.streamRef,current.streamRef);
const wrongGeneration=await nativeFetch(origin+'/demo/choices/record',{method:'POST',headers:{Cookie:secondCookie,'X-Notabenda-Demo-Generation':demoGeneration,Origin:origin,'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(recordedBody)});assert.equal(wrongGeneration.status,409);
const demoRecords=await fetch(origin+'/demo/admin/agreements/export.json?limit=20');assert.equal(demoRecords.status,200);assert.equal((await demoRecords.json()).records.length,11);
console.log('Local Workers public demo: signed session cookies, separate SQLite databases, realistic seed journeys and cross-session write rejection verified.');

// @requirements REQ-PRODUCT-RIGHTS-CENTER
for(const path of ['/rights/','/dark/rights/','/rights/workflow/access/','/dark/rights/workflow/appeal/','/astro/requests/']){
 const response=await fetch(origin+path);assert.equal(response.status,200);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src|connect-src/);const html=await response.text();assert.doesNotMatch(html,/<script|<form|<input/);assert.ok(html.includes('nb-rights-action')||html.includes('Nothing has been submitted'));
}
console.log('Local Workers rights entry points: script-free light/dark and native Astro surfaces, explicit fictional handoff and no request fields verified.');
