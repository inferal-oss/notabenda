// @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {LegalGuaranteeNotice} from 'notabenda/react/documents';
import {buildLegalGuaranteeNotice,verifyLegalGuaranteeNotice} from 'notabenda/guarantees/content';
import {guaranteeNoticeLanguages,normalizeLegalGuaranteeNotice,renderLegalGuaranteeNotice} from 'notabenda/guarantees';
import {sha256} from 'notabenda/content';
const options={language:'en',reviewStatus:'reviewed'};
const wording={title:'Test title',imageAlt:'Test artwork alternative; full wording alongside.',fullSizeLink:'Full size',informationLink:'More information'};

test('all 24 official colour notices retain original bytes, PDF provenance and language-specific destinations',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../assets/guarantees/manifest.json',import.meta.url),'utf8'));assert.equal(guaranteeNoticeLanguages.length,24);assert.equal(Object.keys(manifest.assets).length,24);
 for(const language of guaranteeNoticeLanguages){const result=await buildLegalGuaranteeNotice({...options,language,wording}),a=manifest.assets[language],bytes=await readFile(new URL('../assets/guarantees/'+language+'.svg',import.meta.url),'utf8');assert.equal(Object.keys(result.files).length,1);assert.equal(Object.values(result.files)[0],bytes);assert.equal(sha256(bytes),a.sha256);assert.equal(new TextEncoder().encode(bytes).length,a.bytes);assert.equal(result.notice.asset.url,'/assets/guarantees/'+a.sha256+'.svg');assert.equal(verifyLegalGuaranteeNotice(result.notice).noticeId,result.notice.noticeId);assert.equal(result.notice.textAlternative,a.textAlternative);assert.match(a.textSourceSha256,/^[a-f0-9]{64}$/);assert.equal(a.textStatus,'pdf-extracted-unreviewed');assert.ok(a.textAlternative.replace(/\s+/gu,'').includes(a.informationUrl.slice(8)));assert.doesNotMatch(bytes,/<script|<foreignObject|\son\w+=|<iframe|<a\b/iu);assert.doesNotMatch(bytes,/href="(?!data:image\/png;base64,|#)/iu);}
});

test('wording, text, language, path and review changes have distinct identities; only selected files are emitted',async()=>{
 const first=await buildLegalGuaranteeNotice(options);assert.deepEqual(await buildLegalGuaranteeNotice(options),first);
 for(const changes of [{wording},{textAlternative:'A separately reviewed full text alternative.'},{language:'de',wording},{assetBase:'/legal/guarantees'},{reviewStatus:'draft',allowPreview:true}])assert.notEqual((await buildLegalGuaranteeNotice({...options,...changes})).notice.noticeId,first.notice.noticeId);
 await assert.rejects(buildLegalGuaranteeNotice({...options,language:'de'}));for(const assetBase of ['https://remote.test','/../assets','//remote','/assets/','/assets?x'])await assert.rejects(buildLegalGuaranteeNotice({...options,assetBase}));
});

test('preview and surrounding-language review are explicit; unknown fields and executable/coerced/oversized values fail',async()=>{
 const {notice}=await buildLegalGuaranteeNotice(options);await assert.rejects(buildLegalGuaranteeNotice({...options,reviewStatus:'draft'}));const draft=(await buildLegalGuaranteeNotice({...options,reviewStatus:'draft',allowPreview:true})).notice;assert.throws(()=>renderLegalGuaranteeNotice(draft,{idPrefix:'test'}));assert.match(renderLegalGuaranteeNotice(draft,{idPrefix:'test',allowPreview:true}),/Draft guarantee/);
 for(const change of [n=>n.language='zz',n=>n.private='internal',n=>n.asset.url='https://evil.test/'+n.asset.sha256+'.svg',n=>n.asset.width=300,n=>n.asset.sha256='a'.repeat(64),n=>n.informationUrl='javascript:bad',n=>n.wording.extra='hidden',n=>n.reviewStatus=['reviewed'],n=>n.textAlternative='x'.repeat(16001)]){const n=structuredClone(notice);change(n);assert.throws(()=>normalizeLegalGuaranteeNotice(n));}
 let calls=0;const accessor=structuredClone(notice);Object.defineProperty(accessor,'wording',{enumerable:true,get(){calls++;return wording;}});assert.throws(()=>normalizeLegalGuaranteeNotice(accessor));class Dangerous extends Array{toJSON(){calls++;return [];}}const exotic=structuredClone(notice);exotic.wording=new Dangerous();assert.throws(()=>normalizeLegalGuaranteeNotice(exotic));assert.equal(calls,0);
 const tampered=structuredClone(notice);tampered.textAlternative='Changed after review.';assert.doesNotThrow(()=>normalizeLegalGuaranteeNotice(tampered));assert.throws(()=>verifyLegalGuaranteeNotice(tampered));
});

test('static rendering preserves the full image, readable source text, attribution and QR link without inline artwork or acceptance',async()=>{
 const {notice}=await buildLegalGuaranteeNotice({...options,wording:{...wording,title:'<script>unsafe</script>'}}),html=renderLegalGuaranteeNotice(notice,{idPrefix:'rights',headingLevel:3})+renderLegalGuaranteeNotice(notice,{idPrefix:'rights-title'}),dom=new JSDOM(html),d=dom.window.document;
 assert.equal(d.querySelector('script,iframe,form,button,input,svg,style'),null);assert.equal(d.querySelector('h3').textContent,'<script>unsafe</script>');assert.equal(d.querySelector('img').getAttribute('src'),notice.asset.url);assert.equal(d.querySelector('img').getAttribute('width'),String(Math.round(notice.asset.width)));assert.equal(d.querySelector('.nb-guarantee-text p').textContent,notice.textAlternative);assert.ok([...d.querySelectorAll('a')].some(a=>a.href===notice.informationUrl));assert.match(d.body.textContent,/European Union/);const ids=[...d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size);assert.equal(d.querySelector('[hidden],details'),null);dom.window.close();
 assert.match(renderToStaticMarkup(createElement(LegalGuaranteeNotice,{notice,idPrefix:'react'})),/data-guarantee-notice-id/);
 const result=await build({stdin:{contents:"export {renderLegalGuaranteeNotice} from 'notabenda/guarantees'",resolveDir:process.cwd()},bundle:true,platform:'browser',write:false,metafile:true});const inputs=Object.keys(result.metafile.inputs);assert.ok(inputs.every(p=>!/(?:\.svg$|manifest\.json|node:|\/content\.|\/config\.|catalog|react|astro)/u.test(p)));
});
