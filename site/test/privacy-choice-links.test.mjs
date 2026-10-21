// @requirements REQ-PRODUCT-PRIVACY-CHOICE-LINK REQ-US-CA-ALTERNATIVE-LINK
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {expandPrivacyChoicePreview} from '../privacy-choice-preview.mjs';
import {describeIntegration} from '@notabenda/core/integration';
const root=new URL('../dist/public/',import.meta.url);
test('guide presentation is script-free and leads explicitly to host checks for both rights',async()=>{
 const dom=new JSDOM(await readFile(new URL('guide/privacy-choice-links/index.html',root),'utf8')),d=dom.window.document,preview=d.querySelector('[aria-label="California link presentation preview"]');
 assert.ok(preview);assert.match(preview.textContent,/do not submit a privacy request/);assert.equal(preview.querySelectorAll('script,form,button,input').length,0);assert.deepEqual([...preview.querySelectorAll('a')].map(a=>a.textContent),['Your Privacy Choices','Your California Privacy Choices']);for(const a of preview.querySelectorAll('a'))assert.equal(a.getAttribute('href'),'/guide/privacy-choice-links/#california-destination-checklist');assert.ok(d.getElementById('california-destination-checklist'));assert.match(d.body.textContent,/sensitive-personal-information/);assert.ok(d.querySelector('pre code'));assert.ok(d.querySelector('link[href="/assets/notabenda.css"]'));dom.window.close();
 const markdown=await readFile(new URL('guide/privacy-choice-links/index.md',root),'utf8');assert.doesNotMatch(markdown,/notabenda:privacy-choice-links|<svg/);assert.match(markdown,/Presentation preview/);
});
test('guide marker expansion preserves literal code and machine-readable instructions name destination work',()=>{
 const literal='```html\n<!-- notabenda:privacy-choice-links -->\n```';assert.equal(expandPrivacyChoicePreview(literal,{graphical:true}),literal);
 const reference=JSON.stringify(describeIntegration());assert.match(reference,/privacy\.choicesLink/);assert.match(reference,/privacy-choice-links/);assert.match(reference,/sensitive-information limits/);
});
test('processing example uses a generic return link and retains script-free legal navigation',async()=>{
 const config=JSON.parse(await readFile(new URL('processing-choices/site.json',root),'utf8'));assert.equal(config.privacy.choicesLink.presentation,'text');assert.equal(config.privacy.choicesLink.href,'/processing-choices/');
 for(const path of ['processing-choices/index.html','processing-choices/privacy/index.html','processing-choices/cookies/index.html','processing-choices/terms/index.html']){const dom=new JSDOM(await readFile(new URL(path,root),'utf8')),d=dom.window.document,a=d.querySelector('.nb-privacy-choices-link');assert.equal(a.textContent,'Privacy choices');assert.equal(a.querySelector('svg'),null);if(path!=='processing-choices/index.html')assert.equal(d.querySelector('script'),null);dom.window.close();}
});
