// @requirements REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {accessibilityAssetHandler} from '../../scripts/serve-accessibility.mjs';
test('fixture serving is read-only and cannot reach files outside its explicit asset roots',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'nb-a11y-'));
 try{
  const publicRoot=join(directory,'public'),fixtureRoot=join(directory,'fixtures');await mkdir(publicRoot);await mkdir(fixtureRoot);
  await writeFile(join(publicRoot,'index.html'),'<h1>Public</h1>');await writeFile(join(fixtureRoot,'index.html'),'<h1>Audit</h1>');await writeFile(join(directory,'private.txt'),'PRIVATE-MARKER');await symlink(join(directory,'private.txt'),join(fixtureRoot,'escape.txt'));
  const serve=await accessibilityAssetHandler({publicRoot,fixtureRoot}),request=path=>new Request('http://127.0.0.1'+path);
  assert.equal(await (await serve(request('/'))).text(),'<h1>Public</h1>');const audit=await serve(request('/qa-a11y/'));assert.equal(await audit.text(),'<h1>Audit</h1>');assert.match(audit.headers.get('content-type'),/text\/html/u);
  for(const path of ['/qa-a11y/escape.txt','/qa-a11y/%2e%2e%2fprivate.txt','/qa-a11y/%','/private.txt']){const response=await serve(request(path));assert.equal(response.status,404);assert.doesNotMatch(await response.text(),/PRIVATE-MARKER/u);}
  const denied=await serve(new Request('http://127.0.0.1/qa-a11y/',{method:'POST'}));assert.equal(denied.status,405);assert.equal(await (await serve(new Request('http://127.0.0.1/qa-a11y/',{method:'HEAD'}))).text(),'');
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('late, mismatched and duplicate browser audit responses cannot credit another scenario',async()=>{
 const source=await readFile(new URL('../../scripts/accessibility-browser-app.mjs',import.meta.url),'utf8');
 const nodes=Object.fromEntries(['select','iframe','[role=status]','textarea','#run-one','#summary'].map(key=>[key,{textContent:'',disabled:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}}]));
 const messages=[],frame=nodes.iframe,picker=nodes.select,button=nodes['#run-one'];frame.contentWindow={postMessage:m=>messages.push(m)};picker.add=()=>{};
 let listener,sequence=0;
 const context=vm.createContext({URL,crypto:{randomUUID:()=>String(++sequence)},Option:class{},fetch:async()=>({json:async()=>[{label:'A',url:'pages/a.html'},{label:'B',url:'pages/b.html'}]}),document:{querySelector:key=>nodes[key]},window:{addEventListener:(type,fn)=>{listener=fn;}},location:{href:'http://127.0.0.1/qa-a11y/',origin:'http://127.0.0.1'},navigator:{userAgent:'Fixture VM'},innerWidth:390,innerHeight:844});
 await vm.runInContext('(async()=>{'+source+'})()',context);
 const send=data=>listener({source:frame.contentWindow,origin:'http://127.0.0.1',data});
 const aRun=new URL(frame.src).searchParams.get('auditRun');send({type:'accessibility-ready',runId:aRun,url:'/qa-a11y/pages/a.html'});assert.equal(button.disabled,false);
 button.listeners.click();const aRequest=messages.at(-1).requestId;assert.equal(picker.disabled,true);
 // Simulate a navigation/cancellation while the older frame's WindowProxy survives.
 picker.value='1';picker.listeners.change();const bRun=new URL(frame.src).searchParams.get('auditRun');
 send({type:'accessibility-ready',runId:aRun,url:'/qa-a11y/pages/a.html'});assert.equal(button.disabled,true);
 send({type:'accessibility-ready',runId:bRun,url:'/qa-a11y/pages/a.html'});assert.equal(button.disabled,true);
 send({type:'accessibility-result',runId:aRun,requestId:aRequest,url:'/qa-a11y/pages/a.html',violations:[],incomplete:[]});assert.equal(nodes.textarea.textContent,'');
 send({type:'accessibility-ready',runId:bRun,url:'/qa-a11y/pages/b.html'});button.listeners.click();const bRequest=messages.at(-1).requestId;
 send({type:'accessibility-result',runId:bRun,requestId:aRequest,url:'/qa-a11y/pages/b.html',violations:[],incomplete:[]});assert.equal(nodes.textarea.textContent,'');
 const bResult={type:'accessibility-result',runId:bRun,requestId:bRequest,url:'/qa-a11y/pages/b.html',violations:[],incomplete:[]};send(bResult);
 const report=JSON.parse(nodes.textarea.textContent);assert.equal(report.results.length,1);assert.equal(report.results[0].scenario.label,'B');assert.equal(picker.disabled,false);
 send({...bResult,violations:[{id:'late-change'}]});assert.equal(JSON.parse(nodes.textarea.textContent).results[0].violations.length,0);
});
