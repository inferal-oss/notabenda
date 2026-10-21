// @requirements REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-SETUP REQ-PRODUCT-SETUP-SESSION REQ-PRODUCT-AGENT-HANDOFF
import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,access,stat} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';import {build} from 'esbuild';
import {mountSetup} from '@notabenda/core/setup/ui';
import {parseConfigSource,formatConfigSource} from '@notabenda/core/config/document';
import {readSiteConfig} from '@notabenda/core/config/node';
import {selectPacks,formatPackBrief} from '@notabenda/core/packs';
import {readPackSessionDraft} from '../dist/pack-session.js';
import {fixture} from './helpers.mjs';
const tick=()=>new Promise(done=>setTimeout(done,10));
async function until(predicate){for(let i=0;i<300;i++){if(predicate())return;await tick();}assert.fail('Expected the local configuration action to settle.');}
function browser(options={}){
 const dom=new JSDOM('<main id="setup"></main>',{url:'https://operator.example.test/setup'}),d=dom.window.document,container=d.querySelector('main'),blobs=new Map(),revoked=[];let sequence=0;
 dom.window.fetch=()=>assert.fail('No uploads or probes');dom.window.URL.createObjectURL=blob=>{const url='blob:config-'+(++sequence);blobs.set(url,blob);return url;};dom.window.URL.revokeObjectURL=url=>{revoked.push(url);blobs.delete(url);};
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const ui=mountSetup(container,options);return {dom,d,container,ui,blobs,revoked,close(){ui.destroy();dom.window.close();}};
}
function importFile(f,name,source){const bytes=typeof source==='string'?new TextEncoder().encode(source):source,file=f.d.querySelector('input[type=file]');Object.defineProperty(file,'files',{configurable:true,value:[{name,size:bytes.byteLength,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}]});file.dispatchEvent(new f.dom.window.Event('change'));}
const submit=f=>f.d.querySelector('form').dispatchEvent(new f.dom.window.Event('submit',{cancelable:true,bubbles:true}));
const link=f=>f.d.querySelector('a[download^="notabenda.config."]');
function choose(f,format){const select=f.d.querySelector('[data-config-format]');select.value=format;select.dispatchEvent(new f.dom.window.Event('change',{bubbles:true}));}

test('browser and Node codecs share YAML semantics without Node modules or installed runtime dependencies',async()=>{
 const config=await fixture();for(const format of ['json','yaml','markdown']){const source=await formatConfigSource(config,format,format==='markdown'?'\nPRIVATE_BODY_NOTE\n':'');assert.deepEqual((await parseConfigSource(source,format)).config,config);}
 const result=await build({stdin:{contents:"export * from '@notabenda/core/config/document';",resolveDir:process.cwd()},bundle:true,platform:'browser',write:false,metafile:true});assert.ok(Object.keys(result.metafile.inputs).every(path=>!path.endsWith('/config-source.js')&&!path.includes('cli-json')));assert.ok(!result.outputFiles[0].text.includes('Dynamic require of'));
});

test('all imported formats retain public facts, omit source body/private fields from drafts and remember the source format',async()=>{
 const config=await fixture();config.private={token:'PRIVATE_CONFIG_NOTE'};
 for(const [format,name] of [['json','site.json'],['yaml','site.yaml'],['yaml','site.yml'],['markdown','site.md']]){
  const f=browser();try{
   const source=await formatConfigSource(config,format,format==='markdown'?'\nPRIVATE_BODY_NOTE\n<script>throw Error("not code")</script>\n':'');importFile(f,name,source);await until(()=>f.container.textContent.includes('Config imported locally.'));
   assert.equal(f.ui.getSessionDraft().configFormat,format);assert.doesNotMatch(JSON.stringify(f.ui.getSessionDraft()),/PRIVATE_BODY_NOTE|PRIVATE_CONFIG_NOTE/);submit(f);assert.ok(f.ui.getPlan());await until(()=>link(f)?.hasAttribute('href'));
   const draft=await f.blobs.get(link(f).getAttribute('href')).text(),parsed=await parseConfigSource(draft,format);assert.equal(parsed.config.site.id,config.site.id);assert.equal(parsed.config.private,undefined);assert.doesNotMatch(draft,/PRIVATE_BODY_NOTE|PRIVATE_CONFIG_NOTE/);assert.equal(f.d.querySelector('script,img'),null);
  }finally{f.close();}
 }
});

test('browser imports apply exact authoring checks and clear a failed selection without exposing values',async()=>{
 const config=await fixture();config.conset={value:'PRIVATE_REJECTED_VALUE'};const f=browser();try{
  importFile(f,'site.json',JSON.stringify(config));await until(()=>f.container.textContent.includes('Import failed.'));
  assert.match(f.container.textContent,/\/conset: Unknown configuration field/);assert.doesNotMatch(f.container.textContent,/PRIVATE_REJECTED_VALUE/);submit(f);assert.equal(f.ui.getPlan(),null);
  for(const [name,bytes] of [['site.yaml',new TextEncoder().encode('x: &a PRIVATE_VALUE\ny: *a\n')],['site.md',new TextEncoder().encode('# PRIVATE_BODY_NOTE')],['site.yaml',Uint8Array.from([0xc3,0x28])]]){
   importFile(f,name,bytes);await until(()=>!f.d.querySelector('button[type=submit]').disabled||f.container.textContent.includes('Import failed.'));await tick();submit(f);assert.equal(f.ui.getPlan(),null);assert.doesNotMatch(f.container.textContent,/PRIVATE_VALUE|PRIVATE_BODY_NOTE/);
  }
 }finally{f.close();}
});

test('format changes preserve the same prepared config, revoke prior URLs and update the actual agent filename',async()=>{
 const f=browser({cartridges:selectPacks(['privacy-pages'])});try{
  submit(f);const prepared=f.ui.getPlan(),original=link(f).href;choose(f,'yaml');await until(()=>link(f).hasAttribute('href'));assert.ok(f.revoked.includes(original));assert.equal(link(f).download,'notabenda.config.yaml');assert.deepEqual(f.ui.getPlan(),prepared);
  f.d.querySelector('.nb-setup-agent-handoff button').click();assert.match(f.d.querySelector('.nb-agent-text').value,/check --config \.\/notabenda\.config\.yaml --preview/);assert.match(f.d.querySelector('.nb-agent-text').value,/--config-format yaml/);
  // Closing the instruction drawer leaves the configuration export intact.
  const close=f.d.querySelector('.nb-agent-close');close?.click();choose(f,'markdown');await until(()=>link(f).hasAttribute('href'));assert.ok(f.blobs.has(link(f).getAttribute('href')),JSON.stringify({href:link(f).href,keys:[...f.blobs.keys()],status:f.d.querySelector('.nb-setup-export-note')?.textContent,plan:!!f.ui.getPlan(),format:f.d.querySelector('[data-config-format]').value}));const text=await f.blobs.get(link(f).getAttribute('href')).text();assert.match(text,/^---\n/);assert.equal((await parseConfigSource(text,'markdown')).config.site.id,prepared.config.site.id);assert.equal(f.ui.getSessionDraft().configFormat,'markdown');
  const snapshot=f.ui.getSessionDraft(),selection=selectPacks(['privacy-pages']),saved=readPackSessionDraft({schemaVersion:1,kind:'private-pack-session',selection,view:'setup',setup:snapshot});assert.equal(saved.setup.configFormat,'markdown');
  const restored=browser({cartridges:selection,config:snapshot.config,answers:snapshot.report,resumeDraft:snapshot});try{await until(()=>link(restored)?.hasAttribute('href'));assert.equal(link(restored).download,'notabenda.config.md');assert.deepEqual(restored.ui.getPlan().config,prepared.config);}finally{restored.close();}
 }finally{f.close();}
});

test('stale exports and imports cannot revive output after edits, reset or teardown',async()=>{
 const f=browser();submit(f);choose(f,'yaml');const input=f.d.querySelector('input[type=text]');input.value='Changed during export';input.dispatchEvent(new f.dom.window.Event('input',{bubbles:true}));await tick();assert.equal(f.ui.getPlan(),null);assert.equal(link(f),null);assert.equal(f.blobs.size,0);
 const config=await fixture();let finish;const file=f.d.querySelector('input[type=file]');Object.defineProperty(file,'files',{configurable:true,value:[{name:'site.yaml',size:200,arrayBuffer:()=>new Promise(done=>{finish=done;})}]});file.dispatchEvent(new f.dom.window.Event('change'));[...f.d.querySelectorAll('button')].find(b=>b.textContent==='Start without an imported config').click();finish(new TextEncoder().encode(await formatConfigSource(config,'yaml')).buffer);await tick();assert.equal(f.ui.getDraft().config,undefined);
 submit(f);choose(f,'yaml');choose(f,'markdown');choose(f,'json');await tick();assert.equal(link(f).download,'notabenda.config.json');assert.equal(f.blobs.size,2);choose(f,'markdown');f.close();await tick();assert.equal(f.blobs.size,0);
});

test('wizard exports each chosen format with its matching brief while reports remain JSON and files stay private',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-wizard-formats-')),cli=new URL('../dist/cli.js',import.meta.url).pathname;
 try{
  await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,markets:[],answers:{}}));
  for(const format of ['json','yaml','markdown']){
   const result=spawnSync(process.execPath,[cli,'wizard','--packs','privacy-pages','--answers','answers.json','--config-format',format,'--out-dir',format],{cwd,encoding:'utf8',timeout:10000});assert.equal(result.status,0,result.stderr);const filename='notabenda.config.'+(format==='markdown'?'md':format),config=await readSiteConfig(join(cwd,format,filename),{mode:'preview'});assert.ok(config.site.id);await access(join(cwd,format,'setup.private.json'));assert.equal((await stat(join(cwd,format,filename))).mode&0o777,0o600);const brief=await readFile(join(cwd,format,'notabenda-setup-brief.txt'),'utf8');assert.ok(brief.includes('./'+filename));assert.equal(brief,formatPackBrief(selectPacks(['privacy-pages']),'connect',{config,configFormat:format}));
  }
  for(const args of [['check','--config-format','yaml'],['wizard','--config-format','mdx']])assert.equal(spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'}).status,1);
 }finally{await rm(cwd,{recursive:true,force:true});}
});
