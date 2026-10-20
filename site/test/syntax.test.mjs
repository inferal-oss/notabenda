// @requirements REQ-PRODUCT-DOCS-SEARCH
// @requirements REQ-PRODUCT-SYNTAX-HIGHLIGHTING REQ-PRODUCT-A11Y REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createCodeHighlighter,contrastRatio,syntaxBackgrounds} from '../syntax.mjs';

test('build-time highlighting preserves literal source across documented languages and escapes executable-looking content',async()=>{
 const syntax=await createCodeHighlighter();
 try {
  for(const [lang,source] of Object.entries({ts:'// A comment\nconst label: string = "<script>alert(1)</script>";\n',js:'export const value = 42;\n',json:'{"key":true}\n',css:'.box { color: red; }\n',sh:'npm install notabenda\n',mdx:'---\ntitle: Example\n---\n<Notice value={true} />\n',astro:'---\nconst title = "Hi";\n---\n<h1>{title}</h1>\n',yaml:'enabled: true\n',mermaid:'flowchart LR\nA --> B\n'})){
   const html=syntax.renderBlock(source,lang),dom=new JSDOM(html),pre=dom.window.document.querySelector('pre');
   assert.equal(pre.textContent,source,lang);assert.ok(pre.querySelectorAll('.nb-token').length>1,lang);assert.equal(pre.tabIndex,0);assert.equal(pre.getAttribute('role'),'group');assert.match(pre.getAttribute('aria-label'),/code example/);
   assert.equal(dom.window.document.querySelectorAll('script,[style],[onclick],iframe').length,0);assert.equal(syntax.renderBlock(source,lang),html);dom.window.close();
  }
 }finally{syntax.dispose();}
});

test('unknown fence metadata falls back to escaped text and token palettes meet both actual code backgrounds',async()=>{
 const syntax=await createCodeHighlighter();
 try {
  const source='<img src=x onerror="bad()"> & exactly\n',html=syntax.renderBlock(source,'bad\" onclick=bad()');
  const dom=new JSDOM(html);assert.equal(dom.window.document.querySelector('code').textContent,source);assert.equal(dom.window.document.querySelector('pre').dataset.codeLanguage,'text');assert.equal(dom.window.document.querySelectorAll('img,[onclick],.nb-token').length,0);dom.window.close();
  syntax.renderBlock('// comment\nconst message: string = "Hello";\nexport function read(x = 12) { return x + 1; }','ts');
  const css=syntax.stylesheet(),colors=[...css.matchAll(/--nb-token-(light|dark):(#[a-f0-9]{6})/gu)];assert.ok(new Set(colors.map(x=>x[2])).size>4);
  for(const [,mode,color] of colors)assert.ok(contrastRatio(color,syntaxBackgrounds[mode])>=4.5,mode+' '+color);
  assert.match(css,/forced-colors:active/);assert.match(css,/focus-visible/);assert.match(css,/data-code-theme=dark/);assert.doesNotMatch(css,/url\(|@import/);
 }finally{syntax.dispose();}
});

test('every built guide code block uses keyboard-accessible static highlighting and the homepage has a dark code panel',async()=>{
 const root=new URL('../dist/public/',import.meta.url),css=await readFile(new URL('assets/syntax.css',root),'utf8');let blocks=0,highlighted=0;
 for(const entry of await readdir(new URL('guide/',root),{recursive:true})){
  if(!entry.endsWith('/index.html'))continue;
  const route=entry.slice(0,-'/index.html'.length);
  const dom=new JSDOM(await readFile(new URL('guide/'+route+'/index.html',root),'utf8')),document=dom.window.document;
  assert.ok(document.querySelector('link[href="/assets/syntax.css"]'));assert.deepEqual([...document.querySelectorAll('script')].map(script=>script.getAttribute('src')),route==='search'?['/assets/guide-search.mjs']:[]);
  for(const pre of document.querySelectorAll('.prose pre')){
   blocks++;assert.ok(pre.classList.contains('nb-code'),route);assert.equal(pre.tabIndex,0);assert.ok(pre.getAttribute('aria-label'));assert.equal(pre.querySelectorAll('[style]').length,0);
   for(const token of pre.querySelectorAll('.nb-token')){highlighted++;const name=[...token.classList].find(x=>x.startsWith('nb-token-'));assert.ok(css.includes('.'+name+'{'),name);}
  }
  dom.window.close();
 }
 assert.ok(blocks>60);assert.ok(highlighted>500);
 const dom=new JSDOM(await readFile(new URL('index.html',root),'utf8'));assert.ok(dom.window.document.querySelector('.code-panel .nb-code[data-code-theme="dark"] .nb-token'));dom.window.close();
});
