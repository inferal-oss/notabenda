// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-DISCOVERY
import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {normalizeBrowserRuleSet,captureBrowserCatalog,recognizeLegacyBrowserCapture,analyzeBrowserCatalogCapture,normalizeBrowserCatalogCapture} from 'notabenda/catalog/browser';
import {browserCatalogSeed} from 'notabenda/catalog/browser/seed';
const labels={routeLabel:'Public page',scenario:'Explicit capture'};
function capture({html='',resources=[],globals={},cookies='',localKeys=[],performance}={}){
 const dom=new JSDOM(html,{url:'https://site.example.test/page?PAGE_PRIVATE_ID#PRIVATE_FRAGMENT'});let reads=0;
 dom.window.fetch=()=>assert.fail('No network probe');
 const env={document:dom.window.document,globals,cookies:()=>cookies,localStorage:()=>({length:localKeys.length,key:index=>localKeys[index],getItem:()=>assert.fail('No storage values')}),performance:performance??{getEntriesByType:()=>{reads++;return resources.map(([name,initiatorType])=>({name,initiatorType}));}}};
 const result=captureBrowserCatalog(labels,browserCatalogSeed,env);dom.window.close();return {result,reads};
}
const matched=result=>analyzeBrowserCatalogCapture(result).findings.filter(f=>f.status==='matched').map(f=>f.productId);
const cases=[
 ['generic Google tag',{resources:[['https://www.googletagmanager.com/gtag/js?id=G-PRIVATE_TOKEN','script']],globals:{gtag(){throw Error('Never invoke');}}},'google-tag'],
 ['GTM script',{resources:[['https://www.googletagmanager.com/gtm.js?id=GTM-PRIVATE','script']]},'google-tag-manager'],
 ['GTM frame',{html:'<iframe src="https://www.googletagmanager.com/ns.html?id=PRIVATE"></iframe>'},'google-tag-manager'],
 ['versioned Stripe loader',{resources:[['https://js.stripe.com/endive/stripe.js?key=PRIVATE','script']]},'stripe-payments'],
 ['legacy Stripe loader',{resources:[['https://js.stripe.com/v3/','script']]},'stripe-payments'],
 ['Turnstile loader',{resources:[['https://challenges.cloudflare.com/turnstile/v0/api.js?render=PRIVATE','script']]},'cloudflare-turnstile'],
 ['Turnstile marker and API',{html:'<div class="extra cf-turnstile another" data-sitekey="PRIVATE_SITEKEY"></div>',globals:{turnstile:{render:()=>assert.fail('No widget invocation')}}},'cloudflare-turnstile'],
 ['Intercom reference and queue stub',{html:'<script src="https://widget.intercom.io/widget/PRIVATE_WORKSPACE"></script>',globals:{Intercom:()=>assert.fail('No SDK invocation')}},'intercom-support'],
 ['PostHog US loader',{resources:[['https://us-assets.i.posthog.com/static/array.js','script']]},'posthog-analytics'],
 ['PostHog EU loader',{resources:[['https://eu-assets.i.posthog.com/static/array.js','script']]},'posthog-analytics'],
 ['PostHog cookie and object',{cookies:'ph_PRIVATE_PROJECT_posthog=PRIVATE_VALUE',globals:{posthog:{capture:()=>assert.fail('No event')}}},'posthog-analytics'],
];
for(const [name,input,product] of cases)test('researched signature: '+name,()=>{const {result,reads}=capture(input);assert.ok(matched(result).includes(product));assert.equal(reads,1);assert.equal(result.capture.schemaVersion,1);assert.equal(result.ruleSet.matcherVersion,1);assert.ok(result.evidence.length);assert.ok(analyzeBrowserCatalogCapture(result).findings.every(f=>f.reviewRequired));});

test('shared-host paths, resource kinds, schemes, ports and lookalike hosts do not become a different matched product',()=>{
 const {result}=capture({resources:[['https://www.googletagmanager.com/gtm.js?id=GTM-X','script']],globals:{gtag(){}}});assert.deepEqual(matched(result),['google-tag-manager']);
 for(const url of ['https://www.googletagmanager.com/gtag/js-fake','https://www.googletagmanager.com/gtag%2Fjs','https://www.googletagmanager.com.evil.test/gtag/js','https://evilgoogletagmanager.com/gtag/js','https://www.googletagmanager.com:8443/gtag/js','http://www.googletagmanager.com/gtag/js','https://user:PRIVATE@www.googletagmanager.com/gtag/js'])assert.equal(matched(capture({resources:[[url,'script']],globals:{gtag(){}}}).result).includes('google-tag'),false,url);
 assert.equal(matched(capture({resources:[['https://www.googletagmanager.com/gtag/js','css']],globals:{gtag(){}}}).result).includes('google-tag'),false);
});

test('a resource signature applies host/path/type to the same observation and preserves independent channels',()=>{
 const {result}=capture({html:'<script src="https://www.googletagmanager.com/wrong.js"></script><link rel="stylesheet" href="https://www.googletagmanager.com/gtag/js">',resources:[['https://other.example.test/gtag/js','script']],globals:{gtag(){}}});assert.equal(matched(result).includes('google-tag'),false);
 const both=capture({html:'<script src="https://js.stripe.com/v3/"></script>',resources:[['https://js.stripe.com/v3/','script']]}).result;const channels=both.evidence.filter(e=>e.ruleId==='stripe-loader-path').map(e=>e.channel);assert.deepEqual(channels,['resource-entry','dom-reference']);assert.equal(both.capture.network[0].count,1);assert.equal(both.capture.references[0].count,1);
});

test('own-global inspection never invokes accessors or SDK methods and partial hints remain partial',()=>{
 let invoked=0;const globals={};Object.defineProperty(globals,'turnstile',{get(){invoked++;throw Error('SECRET');}});const {result}=capture({html:'<div class="cf-turnstile"></div>',globals});assert.equal(invoked,0);assert.equal(result.coverage.globals,'limited');assert.equal(result.omitted.accessorGlobals,1);assert.deepEqual(matched(result),[]);assert.equal(analyzeBrowserCatalogCapture(result).findings[0].status,'partial');assert.equal(result.evidence[0].channel,'dom-marker');
 const inherited=Object.create({turnstile:{}});assert.deepEqual(matched(capture({html:'<div class="cf-turnstile"></div>',globals:inherited}).result),[]);
});

test('recognition witnesses add no observed URL paths, credentials, query values, class contents or global contents',()=>{
 const {result}=capture({html:'<script src="https://widget.intercom.io/widget/PRIVATE_WORKSPACE?contact=PRIVATE_CONTACT#PRIVATE_FRAGMENT"></script><div class="cf-turnstile PRIVATE_CLASS" data-sitekey="PRIVATE_SITEKEY"></div>',resources:[['https://www.googletagmanager.com/gtag/js?id=PRIVATE_TAG&user=PRIVATE_USER','script']],globals:{gtag(){},Intercom(){},turnstile:{secret:'PRIVATE_GLOBAL',toJSON:()=>assert.fail('Never serialize globals')}},cookies:'ph_PRIVATE_PROJECT_posthog=PRIVATE_VALUE'});
 assert.doesNotMatch(JSON.stringify({...result,capture:undefined}),/PRIVATE_/);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_WORKSPACE|PRIVATE_CONTACT|PRIVATE_FRAGMENT|PRIVATE_TAG|PRIVATE_USER|PRIVATE_CLASS|PRIVATE_SITEKEY|PRIVATE_GLOBAL|PRIVATE_VALUE/);assert.match(JSON.stringify(result.capture.storage),/PRIVATE_PROJECT/,'legacy storage names can still contain identifiers and remain private');
 assert.ok(result.ruleSet.rules.some(r=>r.signals.some(s=>s.kind==='resource'&&s.path?.value==='/gtag/js')),'static patterns remain in the source snapshot');
});

test('legacy v1 matching cannot invent paths/globals/markers and retains the exact new interpretation',()=>{
 const live=capture({resources:[['https://www.googletagmanager.com/gtag/js?id=PRIVATE','script'],['https://js.stripe.com/v3/','script']],cookies:'ph_PROJECT_posthog=SECRET',globals:{gtag(){},posthog:{}}}).result;
 const result=recognizeLegacyBrowserCapture(live.capture,browserCatalogSeed);assert.equal(result.mode,'origins-and-names');assert.deepEqual(matched(result),['stripe-payments']);assert.equal(analyzeBrowserCatalogCapture(result).findings.find(f=>f.productId==='posthog-analytics').status,'partial');assert.ok(result.evidence.every(e=>e.channel!=='own-global'&&e.channel!=='dom-marker'));assert.deepEqual(result.capture,live.capture);
});

test('snapshots reject version, channel, duplicate and same-revision metadata mismatches; historical analysis stays pinned',()=>{
 const {result}=capture({resources:[['https://js.stripe.com/v3/','script']]});assert.deepEqual(normalizeBrowserCatalogCapture(result,{expectedRules:browserCatalogSeed}),result);
 const future=structuredClone(browserCatalogSeed);future.catalog.products.find(p=>p.id==='stripe-payments').name='Later reference label';assert.throws(()=>normalizeBrowserCatalogCapture(result,{expectedRules:future}),/differ from this capture/);assert.equal(analyzeBrowserCatalogCapture(result).findings[0].productName,'Stripe payment libraries');
 for(const mutate of [c=>c.matcherVersion=2,c=>c.evidence.push(c.evidence[0]),c=>c.evidence[0].channel='own-global',c=>c.evidence[0].signalId='unknown',c=>c.ruleSet.rules[0].signals[0].path={match:'regex',value:'(a+)+$'},c=>c.ruleSet.rules[0].signals[0].path={match:'glob',value:'/a*b*c'},c=>c.ruleSet.rules[0].anyOf=[{allOf:['missing']}],c=>c.coverage.globals=['available']]){const next=structuredClone(result);mutate(next);assert.throws(()=>normalizeBrowserCatalogCapture(next));}
 let calls=0;const hostile=structuredClone(result);Object.defineProperty(hostile,'ruleSet',{enumerable:true,get(){calls++;return browserCatalogSeed;}});assert.throws(()=>normalizeBrowserCatalogCapture(hostile));assert.equal(calls,0);
});

test('channel failures roll back their witnesses, while oversized inputs and comparison limits stay explicit',()=>{
 const {result}=capture({performance:{getEntriesByType:()=>[{name:'https://js.stripe.com/v3/',initiatorType:'script'},{get name(){throw Error('unavailable');},initiatorType:'script'}]}});assert.equal(result.capture.coverage.resources,'unavailable');assert.equal(result.evidence.some(e=>e.channel==='resource-entry'),false);
 assert.equal(capture({resources:[['https://js.stripe.com/v3/?'+('x'.repeat(5000)),'script']]}).result.coverage.matching,'limited');
 const rules=structuredClone(browserCatalogSeed),base=rules.rules.find(r=>r.id==='stripe-script-host');rules.rules=Array.from({length:16},(_,r)=>({...structuredClone(base),id:'budget-'+r,signals:Array.from({length:16},(_,s)=>({...structuredClone(base.signals[0]),id:'signal-'+s})),anyOf:[{allOf:Array.from({length:16},(_,s)=>'signal-'+s)}]}));rules.catalog.products=rules.catalog.products.filter(p=>p.id===base.productId);rules.catalog.providers=rules.catalog.providers.filter(p=>rules.catalog.products.some(product=>product.providerId===p.id));
 const dom=new JSDOM('',{url:'https://site.example.test'});const bounded=captureBrowserCatalog(labels,rules,{document:dom.window.document,globals:{},performance:{getEntriesByType:()=>Array.from({length:2000},()=>({name:'https://js.stripe.com/v3/',initiatorType:'script'}))}});assert.equal(bounded.coverage.matching,'limited');assert.ok(bounded.evidence.length<=256);dom.window.close();
});
