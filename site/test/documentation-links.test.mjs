// @requirements REQ-PRODUCT-AGENT-INTEGRATION REQ-PRODUCT-AUTHORING
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fromMarkdown} from 'mdast-util-from-markdown';
import {JSDOM} from 'jsdom';
import {createDocumentationLinkResolver} from '../documentation-links.mjs';
const root=new URL('../dist/public/',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');

test('repository links resolve only to declared public targets; missing and private references never become the guide index',()=>{
 const rewrite=createDocumentationLinkResolver({docs:[['docs/SETUP.md','/guide/setup']],assets:['llms.txt','license.txt','license-apache.txt','license-mit.txt','skills/notabenda/agents/openai.yaml','docs/assets/mark.svg'],sources:[['examples/authoring/terms.mdx','/source/examples/authoring/terms.mdx.txt']]});
 for(const [href,expected] of [['SETUP.md#review','/guide/setup#review'],['../llms.txt','/llms.txt'],['../LICENSE','/license.txt'],['../LICENSE-APACHE','/license-apache.txt'],['../LICENSE-MIT','/license-mit.txt'],['../skills/notabenda/agents/openai.yaml','/skills/notabenda/agents/openai.yaml'],['assets/mark.svg','/docs/assets/mark.svg'],['../examples/authoring/terms.mdx','/source/examples/authoring/terms.mdx.txt'],['#same-page','#same-page'],['http://localhost:4179/backoffice/setup?mode=review#facts','/demo/admin/setup?mode=review#facts'],['https://example.test/reference','https://example.test/reference']])assert.equal(rewrite(href,'docs/AGENT-SETUP.md'),expected);
 for(const href of ['TYPO.md','../site/.dev.vars','../examples/authoring/private.mdx','assets/not-published.svg'])assert.throws(()=>rewrite(href,'docs/AGENT-SETUP.md'),error=>error.message.includes('docs/AGENT-SETUP.md')&&error.message.includes(href)&&error.message.includes('explicit public target'));
});

test('authored examples and agent/reference files link directly to exact public contents in HTML and Markdown',async()=>{
 const targets=[
  ['guide/authoring/index','/source/examples/authoring/terms.mdx.txt','examples/authoring/terms.mdx'],
  ['guide/authoring/index','/source/examples/authoring/cookies.md.txt','examples/authoring/cookies.md'],
  ['guide/features/index','/llms.txt','llms.txt'],
  ['guide/features/index','/source/scripts/regulatory.py.txt','scripts/regulatory.py'],
  ['guide/features/index','/source/catalog/browser-rules.json.txt','catalog/browser-rules.json'],
  ['guide/features/index','/source/catalog/browser-providers.json.txt','catalog/browser-providers.json'],
  ['guide/requirements/index','/skills/notabenda/agents/openai.yaml','skills/notabenda/agents/openai.yaml'],
  ['guide/requirements/index','/skills/notabenda/references/configuration-target.md','skills/notabenda/references/configuration-target.md'],
 ];
 for(const [page,href,source] of targets){
  const dom=new JSDOM(await read(page+'.html'));
  try{assert.ok([...dom.window.document.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===href),page+' must link to '+href);}finally{dom.window.close();}
  const links=[];function visit(n){if(['link','definition'].includes(n.type))links.push(n.url);for(const ch of n.children??[])visit(ch);}visit(fromMarkdown(await read(page+'.md')));assert.ok(links.includes(href),page+' Markdown must link to '+href);
  assert.equal(await read(href.slice(1)),await readFile(new URL('../../'+source,import.meta.url),'utf8'));
 }
});

test('all static guide links and fragments reach their intended published targets',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8')),paths=new Set(manifest),ids=new Map();
 async function anchors(path){
  if(!ids.has(path)){const dom=new JSDOM(await read(path));try{ids.set(path,new Set([...dom.window.document.querySelectorAll('[id],a[name]')].flatMap(e=>[e.id,e.getAttribute('name')].filter(Boolean))));}finally{dom.window.close();}}
  return ids.get(path);
 }
 for(const path of manifest.filter(p=>p.startsWith('guide/')&&p.endsWith('/index.html'))){
  const dom=new JSDOM(await read(path));
  try{for(const element of dom.window.document.querySelectorAll('a[href],img[src],link[href]')){
   const href=element.getAttribute('href')??element.getAttribute('src'),url=new URL(href,'https://notabenda.org/'+path);
   if(url.origin!=='https://notabenda.org')continue;
   // Session-backed operator routes are verified by the Worker/host integration tests.
   if(/^\/demo\/admin(?:\/|$)/u.test(url.pathname))continue;
   let target=decodeURIComponent(url.pathname.slice(1));target=paths.has(target)?target:!target?'index.html':target.endsWith('/')?target+'index.html':target+'/index.html';
   assert.ok(paths.has(target),path+' → '+href+' has no published target');
   if(url.hash&&target.endsWith('.html'))assert.ok((await anchors(target)).has(decodeURIComponent(url.hash.slice(1))),path+' → '+href+' has no matching anchor');
  }}finally{dom.window.close();}
 }
});
