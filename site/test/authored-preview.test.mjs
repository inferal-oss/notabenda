// @requirements REQ-PRODUCT-AUTHORED-PREVIEW REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {serveHost} from '../host.mjs';
import {authoringExample} from '../../examples/authoring/build.mjs';
import {createAuthoredReleasePreview} from '@notabenda/authoring/preview';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
const root=new URL('../dist/public/',import.meta.url);
test('the website preview renders the exact compiled example and serves its original public downloads without a session',async()=>{
 const {latest}=await authoringExample(),preview=await createAuthoredReleasePreview(latest,{mode:'preview',initialDocument:'terms'}),html=await readFile(new URL('authored/preview/index.html',root),'utf8'),d=new JSDOM(html).window.document;assert.ok(d.querySelector('.demo-corner'));assert.equal(d.querySelectorAll('iframe').length,3);assert.equal(d.querySelector('script'),null);assert.ok(d.body.textContent.includes(latest.manifest.artifactId));assert.ok(d.body.textContent.includes('sample-2'));assert.ok(d.body.textContent.includes('MDX'));
 const frame=new JSDOM([...d.querySelectorAll('iframe')].find(f=>f.title.includes('considered agreement')).getAttribute('srcdoc')).window.document;assert.ok(frame.body.textContent.includes('You can export your notes before leaving.'));assert.ok(frame.querySelector('.policy-note'));assert.equal(frame.querySelector('a[href],img,script,form'),null);
 assert.deepEqual(await readFile(new URL('authored/preview/release.zip',root)),Buffer.from(preview.files['release.zip']));assert.equal(await readFile(new URL('authored/preview/artifact.json',root),'utf8'),preview.files['artifact.json']);assert.doesNotMatch(html,/sourceAttachments|baseUrl|PRIVATE/);
 const forbidden=()=>{throw Error('No demo or operational database');},env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})},WORKSPACE:{get:forbidden,idFromName:forbidden},DEMO_WORKSPACES:{get:forbidden,idFromName:forbidden}};const response=await serveHost(new Request('https://example.test/authored/preview/'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.match(response.headers.get('Content-Security-Policy'),/frame-src 'self'/);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/script-src|unsafe-inline/);assert.doesNotMatch((await serveHost(new Request('https://example.test/privacy'),env)).headers.get('Content-Security-Policy'),/frame-src/);
});
test('preview documents, file details and their static frames retain semantic structure',async()=>{
 const html=await readFile(new URL('authored/preview/index.html',root),'utf8'),audit=await createAccessibilityAudit(html,{label:'Compiled authored preview'});
 try{const result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);assert.deepEqual(result.warnings,[]);const d=audit.dom.window.document;assert.equal(d.querySelectorAll('h1').length,1);assert.ok([...d.querySelectorAll('iframe')].every(f=>f.title&&f.getAttribute('sandbox')==='allow-same-origin'));for(const iframe of d.querySelectorAll('iframe')){const frame=await createAccessibilityAudit(iframe.getAttribute('srcdoc'),{label:iframe.title});try{const r=await frame.scan();assert.deepEqual(r.violations,[]);assert.deepEqual(r.structural,[]);assert.deepEqual(r.warnings,[]);}finally{frame.close();}}}finally{audit.close();}
});
