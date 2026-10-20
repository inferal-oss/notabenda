// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fromMarkdown} from 'mdast-util-from-markdown';
import {JSDOM} from 'jsdom';
import {rewriteMarkdown,skillFiles} from '../agent-docs.mjs';
import {serveHost} from '../host.mjs';
import {describeIntegration} from 'notabenda/integration';
const root=new URL('../dist/public/',import.meta.url);
// These session-backed routes are exercised by demo/host integration tests.
const dynamic=new Set(['/demo/admin/agreements','/demo/admin/choices','/demo/admin/evidence','/demo/admin/history','/demo/admin/lifecycle','/demo/admin/processing','/demo/admin/setup']);
const read=path=>readFile(new URL(path,root),'utf8');
function nodes(node,type){return [...(node.type===type?[node]:[]),...(node.children??[]).flatMap(child=>nodes(child,type))];}

test('curated index targets existing public Markdown and distributes the exact skill',async()=>{
 const index=await read('llms.txt');assert.equal(index,await readFile(new URL('../../llms.txt',import.meta.url),'utf8'));
 const links=nodes(fromMarkdown(index),'link');assert.ok(links.length>=20);
 for(const link of links){const url=new URL(link.url);assert.equal(url.origin,'https://notabenda.org');assert.match(url.pathname,/(?:\.md|\/integration-reference\.json|\/site-config\.schema\.json)$/u);await access(new URL(url.pathname.slice(1),root));}
 for(const path of skillFiles)assert.equal(await read('skills/notabenda/'+path),await readFile(new URL('../../skills/notabenda/'+path,import.meta.url),'utf8'));
 const manifest=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8'));
 assert.deepEqual(manifest.filter(p=>p.startsWith('skills/')),skillFiles.map(p=>'skills/notabenda/'+p).sort());
 assert.equal(manifest.some(p=>/(?:\.private\.json|server-data\.json|\.dev\.vars|\.env)$/u.test(p)),false);
});

test('every source-backed guide advertises Markdown; local Markdown links stay reachable',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../dist/asset-manifest.json',import.meta.url),'utf8'));
 const guides=manifest.filter(p=>p.startsWith('guide/')&&p.endsWith('/index.md'));assert.ok(guides.length>80);
 for(const path of guides){
  const markdown=await read(path),document=new JSDOM(await read(path.replace(/\.md$/u,'.html'))).window.document;
  assert.equal(document.querySelector('link[rel="alternate"][type="text/markdown"]').getAttribute('href'),'/'+path);
  assert.equal(document.querySelector('link[rel="describedby"]').getAttribute('href'),'/llms.txt');
  for(const type of ['link','image','definition'])for(const node of nodes(fromMarkdown(markdown),type)){
   const url=new URL(node.url,'https://notabenda.org/'+path);if(url.origin!=='https://notabenda.org')continue;
   if(dynamic.has(url.pathname))continue;
   const target=decodeURIComponent(url.pathname.slice(1));await access(new URL(!target?'index.html':target.endsWith('/')?target+'index.html':manifest.includes(target)?target:target+'/index.html',root));
  }
 }
 const document=new JSDOM(await read('guide/agent-setup/index.html')).window.document;
 assert.equal(document.querySelector('.guide-nav-desktop [aria-current="page"]').getAttribute('href'),'/guide/agent-setup');
 assert.ok(document.querySelector('a[href="/skills/notabenda/SKILL.md"]'));
});

test('Markdown destination rewriting preserves code, titles, nested labels and references',()=>{
 const input='[**Guide** `]`](../guide(a).md "title")\n\n[![Alt [nested]](image.svg)](target.md)\n\n[Reference][r]\n\n[r]: <another.md> "ref"\n\n<a href="target.md">HTML</a>\n\n`[code](target.md)`\n\n```md\n[code](target.md)\n<a href="target.md">code</a>\n```\n';
 const output=rewriteMarkdown(input,url=>'/public/'+url);
 const before=fromMarkdown(input),after=fromMarkdown(output);
 for(const type of ['link','image','definition'])assert.deepEqual(nodes(after,type).map(n=>n.url),nodes(before,type).map(n=>'/public/'+n.url));
 assert.deepEqual(nodes(after,'code').map(n=>[n.lang,n.value]),nodes(before,'code').map(n=>[n.lang,n.value]));
 assert.equal(nodes(after,'inlineCode').at(-1).value,'[code](target.md)');
 assert.match(output,/<a href="\/public\/target.md">HTML/u);assert.match(output,/\[Reference\]\[r\]/u);
 assert.equal(nodes(after,'link')[0].title,'title');assert.equal(nodes(after,'definition')[0].title,'ref');
});

test('agent files are read-only public assets with explicit types and no demo session or storage',async()=>{
 const env={ASSETS:{fetch:async request=>new Response(await read(new URL(request.url).pathname.slice(1)),{headers:{'Content-Type':'application/octet-stream'}})},WORKSPACE:{get(){throw Error('No operator namespace');}},DEMO_WORKSPACES:{get(){throw Error('No demo namespace');}}};
 for(const path of ['/llms.txt','/guide/setup/index.md','/skills/notabenda/SKILL.md','/skills/notabenda/agents/openai.yaml','/skills/notabenda/references/configuration-target.md','/integration-reference.json','/site-config.schema.json']){
  const request=new Request('https://example.test'+path),response=await serveHost(request,env);assert.equal(response.status,200);
  assert.match(response.headers.get('Content-Type'),path.endsWith('.md')?/^text\/markdown/u:path.endsWith('.schema.json')?/^application\/schema\+json/u:path.endsWith('.json')?/^application\/json/u:/^text\/plain/u);
  assert.equal(response.headers.get('Set-Cookie'),null);assert.match(response.headers.get('Cache-Control'),/no-transform/u);
  assert.equal((await serveHost(new Request(request,{method:'POST'}),env)).status,405);
 }
});

test('website integration reference uses the installed engine and every target guide is available',async()=>{
 const reference=JSON.parse(await read('integration-reference.json')),{package:metadata,...body}=reference;
 assert.equal(metadata.version,JSON.parse(await readFile(new URL('../../packages/notabenda/package.json',import.meta.url),'utf8')).version);
 assert.deepEqual(body,describeIntegration());
 for(const guide of new Set([...body.targets.flatMap(t=>t.guides),...body.questions.map(q=>q.guide)]))await access(new URL(new URL(guide).pathname.slice(1),root));
 const document=new JSDOM(await read('guide/agent-setup/index.html')).window.document;assert.ok(document.querySelector('a[href="/integration-reference.json"]'));
});

// Package and current website schema bytes stay together, including its canonical ID.
test('public schema matches the package and its canonical version URL',async()=>{
 const packaged=await readFile(fileURLToPath(import.meta.resolve('notabenda/config/schema.json')),'utf8');
 assert.equal(await read('site-config.schema.json'),packaged);
 const schema=JSON.parse(packaged);assert.equal(await read(new URL(schema.$id).pathname.slice(1)),packaged);
 const reference=JSON.parse(await read('integration-reference.json'));assert.equal(reference.configContract.schema.packageExport,'notabenda/config/schema.json');
});
