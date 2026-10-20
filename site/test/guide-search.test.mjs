// @requirements REQ-PRODUCT-DOCS-SEARCH REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {prepareGuideSearch,searchGuides,maxSearchIndexBytes} from '../guide-search.mjs';
import {guideSearchPage,buildGuideSearchIndex,guideSearchBody} from '../guide-search-build.mjs';
import {mountGuideSearch} from '../guide-search-client.mjs';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
import {publicResponse} from '../host.mjs';
const root=new URL('../dist/public/',import.meta.url);
const page=(title='Cookie choices',route='/guide/consent',html='<h1 id="cookies">Cookie choices</h1><p>Optional analytics stay blocked before permission.</p><h2 id="expiry">Expiry rules</h2><p>REQ-IT-REPROMPT preserves refusal memory. Configure consent.policyIds.</p>')=>guideSearchPage({title,route,html,area:'Privacy choices'});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('matching ranks exact titles, finds API/requirement identifiers and returns the matching section once per guide',()=>{
 const pages=[page(),page('Other controls','/guide/other','<h1>Other controls</h1><p>Cookie choices are separate.</p>'),page('Québec notices','/guide/quebec','<h1>Québec notices</h1><h2 id="location">Location</h2><p>Activation needs a prior notice.</p>')],index=prepareGuideSearch(JSON.parse(buildGuideSearchIndex(pages)));
 assert.equal(searchGuides(index,'cookie choices')[0].title,'Cookie choices');
 assert.equal(searchGuides(index,'REQ-IT-REPROMPT')[0].url,'/guide/consent/#expiry');
 assert.equal(searchGuides(index,'consent.policyIds')[0].url,'/guide/consent/#expiry');
 assert.equal(searchGuides(index,'quebec')[0].title,'Québec notices');
 assert.equal(searchGuides(index,'how do I configure consent policyIds')[0].title,'Cookie choices');
 assert.deepEqual(searchGuides(index,'analytics nonexistent'),[]);
 assert.deepEqual(searchGuides(index,'x'.repeat(161)),[]);assert.deepEqual(searchGuides(index,'x'),[]);
 assert.equal(searchGuides(index,'cookie choices').filter(row=>row.title==='Cookie choices').length,1);
 const ranked=prepareGuideSearch(JSON.parse(buildGuideSearchIndex([page('Terms agreement','/guide/terms','<h1>Terms agreement</h1><p>Versioned terms.</p>'),page('Terms agreement verification','/guide/verification/terms','<h1>Terms agreement verification</h1><p>Versioned terms.</p>'),page('Requirements catalog','/guide/requirements','<h1>Requirements catalog</h1><h2 id="rule">REQ-IT-REPROMPT</h2><p>Repeat-prompt rules.</p>'),page('A report','/guide/a-report','<h1>A report</h1><p>REQ-IT-REPROMPT checked.</p>')])));
 assert.equal(searchGuides(ranked,'terms agreement')[0].url,'/guide/terms/');assert.equal(searchGuides(ranked,'REQ-IT-REPROMPT')[0].url,'/guide/requirements/#rule');
 const distant=prepareGuideSearch(JSON.parse(buildGuideSearchIndex([page('Report','/guide/report','<h1>Report</h1><p>'+('it line '.repeat(100))+'REQ-IT-REPROMPT describes the refusal rule.</p>')])));
 assert.match(searchGuides(distant,'REQ-IT-REPROMPT')[0].snippet,/REQ-IT-REPROMPT/);
});
test('the build indexes full section text in bounded overlapping chunks, excluding executable/navigation content',()=>{
 const p=page('Long reference','/guide/long','<h1>Long reference</h1><nav>Private navigation marker</nav><script>script marker</script><style>style marker</style><h2 id="details">Details</h2><table><tr><td>REQ-TABLE</td><td>Read this cell</td></tr></table><p>'+('word '.repeat(1800))+'needle_at_end</p>');
 assert.ok(p.sections.every(s=>s.text.length<=4096));assert.ok(p.sections.length>2);
 const index=prepareGuideSearch(JSON.parse(buildGuideSearchIndex([p])));
 assert.equal(searchGuides(index,'needle_at_end')[0].url,'/guide/long/#details');
 assert.equal(searchGuides(index,'REQ-TABLE Read this cell')[0].url,'/guide/long/#details');
 assert.doesNotMatch(JSON.stringify(p),/Private navigation marker|script marker|style marker/);
 assert.throws(()=>prepareGuideSearch({version:1,pages:[{...p,url:'https://outside.example.test/'}]}));
 assert.throws(()=>prepareGuideSearch({version:1,pages:[{...p,sections:[{heading:'Bad',text:'Bad',url:'/guide/other/#target'}]}]}));
 assert.throws(()=>buildGuideSearchIndex(Array.from({length:513},()=>p)));
 const multibyte={title:'Large guide',area:'Reference',url:'/guide/large/',sections:Array.from({length:300},()=>({heading:'Text',url:'/guide/large/',text:'漢'.repeat(4000)}))};
 assert.throws(()=>buildGuideSearchIndex([multibyte]),/delivery bound/);
});
test('the public index covers every published source guide and every result target exists in the actual HTML',async()=>{
 const json=await readFile(new URL('assets/guide-search-index.json',root),'utf8'),raw=JSON.parse(json),index=prepareGuideSearch(raw);
 assert.ok(Buffer.byteLength(json)<=maxSearchIndexBytes);assert.ok(raw.pages.length>=155);
 const seen=new Set();
 for(const p of raw.pages){
  assert.ok(!seen.has(p.url));seen.add(p.url);const d=new JSDOM(await readFile(new URL(p.url.slice(1)+'index.html',root),'utf8'));
  try{for(const s of p.sections){const hash=s.url.split('#')[1];if(hash)assert.ok(d.window.document.getElementById(decodeURIComponent(hash)),s.url);}}finally{d.window.close();}
 }
 for(const query of ['REQ-IT-REPROMPT','mountConsentRehearsal','Markdown MDX','delete retirement'])assert.ok(searchGuides(index,query).length,query);
 assert.ok(raw.pages.every(p=>p.url.startsWith('/guide/')));
 const html=await readFile(new URL('guide/search/index.html',root),'utf8'),d=new JSDOM(html).window.document;
 assert.equal(d.querySelectorAll('[data-guide-search-browse] a').length,raw.pages.length);
 assert.ok(d.querySelector('noscript'));assert.ok(d.querySelector('script[src="/assets/guide-search.mjs"]'));
 const ordinary=new JSDOM(await readFile(new URL('guide/consent/index.html',root),'utf8')).window.document;
 assert.ok(ordinary.querySelector('a.guide-search-link[href="/guide/search/"]'));assert.equal(ordinary.querySelector('script[src="/assets/guide-search.mjs"]'),null);
});
test('search updates locally, preserves ordinary links, paginates accessibly and restores the full list when cleared',async()=>{
 const pages=Array.from({length:25},(_,i)=>page('Cookie guide '+String(i).padStart(2,'0'),'/guide/cookie-'+i)),raw={version:1,pages},dom=new JSDOM(guideSearchBody(pages),{url:'https://notabenda.example.test/guide/search/'}),d=dom.window.document;let requests=0;
 const app=mountGuideSearch(d.querySelector('[data-guide-search]'),{loadIndex:async()=>{requests++;return raw;}});
 try{
  assert.equal(d.querySelector('input').disabled,true);await tick();assert.equal(d.querySelector('input').disabled,false);
  const input=d.querySelector('input');input.value='cookie';input.dispatchEvent(new dom.window.Event('input'));
  assert.equal(d.querySelectorAll('.guide-search-results li').length,12);assert.equal(d.querySelector('[data-guide-search-browse]').hidden,true);assert.match(d.querySelector('[role=status]').textContent,/25 guides found; showing 12/);
  d.querySelector('[data-search-more]').click();assert.equal(d.querySelectorAll('.guide-search-results li').length,24);assert.equal(d.activeElement,d.querySelectorAll('.guide-search-results a')[12]);
  d.querySelector('[data-search-more]').click();assert.equal(d.querySelectorAll('.guide-search-results li').length,25);assert.equal(d.querySelector('[data-search-more]').hidden,true);
  assert.ok(d.activeElement.href.startsWith('https://notabenda.example.test/guide/'));
  input.value='nothing matches';d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));assert.equal(d.querySelectorAll('.guide-search-results li').length,0);assert.match(d.querySelector('[role=status]').textContent,/No matching guides/);
  input.value='';input.dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelector('[data-guide-search-browse]').hidden,false);assert.equal(d.querySelector('[data-search-results]').hidden,true);assert.equal(requests,1);
 }finally{app.destroy();dom.window.close();}
});
test('load failure leaves the guide list usable, explicit retry works, and destroy fences late loads',async()=>{
 const pages=[page()],raw={version:1,pages},dom=new JSDOM(guideSearchBody(pages),{url:'https://example.test'}),d=dom.window.document;let calls=0;
 const app=mountGuideSearch(d.querySelector('[data-guide-search]'),{loadIndex:async()=>{if(++calls===1)throw Error('private response details');return raw;}});
 try{await tick();assert.match(d.querySelector('[role=status]').textContent,/could not load/);assert.doesNotMatch(d.body.textContent,/private response details/);assert.equal(d.querySelector('[data-guide-search-browse]').hidden,false);d.querySelector('[data-search-retry]').click();await tick();assert.equal(d.querySelector('input').disabled,false);assert.equal(calls,2);}finally{app.destroy();dom.window.close();}
 const late=new JSDOM(guideSearchBody(pages)),r=late.window.document.querySelector('[data-guide-search]');let complete,signal;
 const destroyed=mountGuideSearch(r,{loadIndex:options=>{signal=options.signal;return new Promise(resolve=>complete=resolve);}});destroyed.destroy();assert.equal(signal.aborted,true);complete(raw);await tick();assert.equal(r.querySelector('input').disabled,true);late.window.close();
});
test('result text never becomes markup and malformed index destinations remain unavailable',async()=>{
 const pages=[{title:'<img src=x onerror=alert(1)>',url:'/guide/safe/',area:'<script>area</script>',sections:[{heading:'Unsafe-looking text',url:'/guide/safe/',text:'<svg onload=alert(1)> needle'}]}],dom=new JSDOM(guideSearchBody(pages)),d=dom.window.document;
 const app=mountGuideSearch(d.querySelector('[data-guide-search]'),{loadIndex:async()=>({version:1,pages})});
 try{await tick();const input=d.querySelector('input');input.value='needle';input.dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelectorAll('.guide-search-results img,.guide-search-results svg,.guide-search-results script').length,0);assert.match(d.querySelector('.guide-search-results').textContent,/<svg onload/);}finally{app.destroy();dom.window.close();}
 assert.throws(()=>prepareGuideSearch({version:1,pages:[{...pages[0],url:'//outside.example.test/guide/'}]}));
});
test('default loading fetches only the fixed same-origin index without transmitting queries',async()=>{
 const pages=[page()],dom=new JSDOM(guideSearchBody(pages),{url:'https://example.test/guide/search/?q=not-imported'}),d=dom.window.document;const requests=[];
 dom.window.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,text:async()=>JSON.stringify({version:1,pages})};};
 const app=mountGuideSearch(d.querySelector('[data-guide-search]'));
 try{await tick();assert.equal(d.querySelector('input').value,'');d.querySelector('input').value='my private query';d.querySelector('input').dispatchEvent(new dom.window.Event('input'));assert.equal(requests.length,1);assert.equal(requests[0].url,'/assets/guide-search-index.json');assert.equal(requests[0].options.credentials,'omit');assert.equal(requests[0].options.referrerPolicy,'no-referrer');assert.equal(new URL(dom.window.location.href).search,'?q=not-imported');}finally{app.destroy();dom.window.close();}
});
test('search and result states preserve accessible labels and landmarks',async()=>{
 const pages=[page()],audit=await createAccessibilityAudit('<!doctype html><html lang="en"><head><title>Documentation search</title></head><body><main>'+guideSearchBody(pages)+'</main></body></html>',{label:'documentation search'}),d=audit.dom.window.document;
 const app=mountGuideSearch(d.querySelector('[data-guide-search]'),{loadIndex:async()=>({version:1,pages})});
 try{await tick();assert.deepEqual((await audit.scan()).violations,[]);d.querySelector('input').value='cookie';d.querySelector('input').dispatchEvent(new audit.dom.window.Event('input'));assert.deepEqual((await audit.scan()).violations,[]);}finally{app.destroy();audit.close();}
});
test('only the explicit search route permits its same-origin runtime; ordinary guides and legal pages stay script-free',()=>{
 for(const path of ['/guide/search','/guide/search/','/guide/search/index.html']){
  const response=publicResponse(new Response('search'),path),csp=response.headers.get('Content-Security-Policy');
  assert.match(csp,/script-src 'self'/);assert.match(csp,/connect-src 'self'/);assert.doesNotMatch(csp,/unsafe-inline|unsafe-eval|https:/);
 }
 for(const path of ['/guide/consent/','/guide/search/other','/privacy','/terms','/cookies'])assert.doesNotMatch(publicResponse(new Response('ordinary page'),path).headers.get('Content-Security-Policy'),/script-src|connect-src/);
});
