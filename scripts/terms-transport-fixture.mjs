// @requirements REQ-PRODUCT-TERMS-ACCEPTANCE
// Disposable loopback rehearsal: real recorder, deliberately truncated first acknowledgment.
// No operational credentials, persistent database, public routes or package entry points.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {compileLegalDocuments,createTermsOffer,canonicalJson} from '@notabenda/core/content';
import {recordLegalRelease,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance,createTermsAcceptanceStore} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../packages/notabenda-cf/examples/synthetic.mjs';

const common={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
const shell=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Agreement receipt delivery · Notabenda local check</title><link rel="stylesheet" href="/assets/notabenda.css"><link rel="stylesheet" href="/fixture.css"></head><body><main><p class="eyebrow">Notabenda / local transport check</p><h1>An agreement can be stored<br>before its receipt arrives.</h1><p class="intro">The first submission records this sample agreement, then interrupts the HTTP response. The field must show an unconfirmed outcome. Explicitly retry to recover the original receipt.</p><div class="layout"><section class="panel" aria-labelledby="agreement-heading"><h2 id="agreement-heading">Try the agreement</h2><p>Use the keyboard or pointer to check the statement and submit. Reading, checking and opening this page send no agreement.</p><div id="agreement"></div></section><section class="panel" aria-labelledby="server-heading"><h2 id="server-heading">What the server received</h2><dl class="facts"><div><dt>Accepted POST attempts</dt><dd data-attempts>—</dd></div><div><dt>Stored agreement records</dt><dd data-records>—</dd></div><div><dt>Retry command</dt><dd data-command>Awaiting retry</dd></div><div><dt>Retry receipt</dt><dd data-receipt>Awaiting retry</dd></div></dl><p class="footnote" data-observation role="status">Loading server observations…</p></section></div><p class="footnote">This check uses fictional terms and in-memory storage. It creates no real contract. Reload does not recover a pending command; keep this tab open for the explicit retry. Restart the dedicated server for a fresh run.</p></main><script type="module" src="/fixture.mjs"></script></body></html>`;

export async function startTermsTransportFixture({port=0}={}){
 if(!Number.isInteger(port)||port<0||port>65535||port>0&&port<1024)throw Error('Select port 0 or a port from 1024 to 65535.');
 const config=JSON.parse(await readFile(new URL('../examples/static/notabenda.config.json',import.meta.url),'utf8'));
 // Synthetic review declarations exercise the production validation path, not legal review.
 for(const document of Object.values(config.documents))document.review.status='reviewed';
 const release=compileLegalDocuments(config),offer=createTermsOffer(release.artifact,{scopeId:'signup',statement:'I agree to the terms for this sample service.',actionLabel:'Record sample agreement'}),storage=createSyntheticStorage([]),generation=crypto.randomUUID();
 const context={siteId:config.site.id,scopeId:offer.scopeId,subjectId:'local-transport-check',operationId:'synthetic-light-operation-'+generation};
 await recordLegalRelease(storage,release.artifact);await registerTermsOffer(storage,offer,context);await setActiveTermsOffer(storage,offer.offerId,context);
 const script=await build({entryPoints:[fileURLToPath(new URL('./terms-transport-client.mjs',import.meta.url))],bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',logLevel:'silent'});
 const assets=new Map([
  ['/',{body:shell,type:'text/html; charset=utf-8'}],
  ['/fixture.mjs',{body:script.outputFiles[0].contents,type:'text/javascript; charset=utf-8'}],
  ['/fixture.css',{body:await readFile(new URL('./terms-transport-fixture.css',import.meta.url)),type:'text/css; charset=utf-8'}],
  ['/assets/notabenda.css',{body:await readFile(new URL('../packages/notabenda/dist/styles.css',import.meta.url)),type:'text/css; charset=utf-8'}],
  [offer.document.url,{body:release.files[offer.document.url.slice(1)],type:'text/html; charset=utf-8'}],
  ['/fixture.json',{body:JSON.stringify({offer,generation}),type:'application/json'}],
 ]);
 const commands=[],receipts=[];let dropped=false,origin,reservations=0;
 const store=createTermsAcceptanceStore(storage,context);
 async function state(){const page=await store.list({query:'',kind:'',from:'',to:'',keyPrefix:'',limit:10});return {attempts:commands.length,records:page.records.length,sameCommand:commands.length<2?null:commands.every(v=>v===commands[0]),sameReceipt:receipts.length<2?null:receipts.every(v=>v===receipts[0]),droppedResponses:dropped?1:0};}
 const server=createServer({requestTimeout:5000,headersTimeout:5000},async(req,res)=>{
  const send=(status,body,type='text/plain; charset=utf-8')=>{res.writeHead(status,{...common,'content-type':type});res.end(req.method==='HEAD'?undefined:body);};
  let reserved=false;
  try{
   if(req.headers.host!==new URL(origin).host){send(403,'Forbidden');return;}
   const path=new URL(req.url,origin).pathname;
   if(req.method==='GET'||req.method==='HEAD'){
    if(path==='/state.json'){send(200,JSON.stringify(await state()),'application/json');return;}
    const asset=assets.get(path);if(asset){send(200,asset.body,asset.type);return;}send(404,'Not found');return;
   }
   if(req.method!=='POST'||path!=='/demo/agreements/light'){send(405,'Method not allowed');return;}
   if(req.headers.origin!==origin||req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin'||req.headers['x-notabenda-demo']!=='1'||req.headers['x-notabenda-demo-generation']!==generation){send(403,'Forbidden');return;}
   if(req.headers['content-type']!=='application/json'){send(415,'Use application/json');return;}
   if(commands.length+reservations>=4){send(429,'Restart this disposable check for a fresh run.');return;}
   reservations++;reserved=true;
   if(Number(req.headers['content-length'])>2048){send(413,'Request too large');return;}
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2048){send(413,'Request too large');return;}chunks.push(chunk);}
   let command;try{command=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{send(400,'Invalid request');return;}
   let receipt;try{receipt=await recordTermsAcceptance(storage,command,context);}catch{send(400,'Agreement rejected');return;}
   commands.push(canonicalJson(command));receipts.push(canonicalJson(receipt));
   if(!dropped){
    dropped=true;
    // Commit first, then transmit headers and an incomplete JSON body. The body
    // failure is visible to fetch/json and cannot be mistaken for a receipt.
    res.writeHead(200,{...common,'content-type':'application/json','content-length':Buffer.byteLength(JSON.stringify(receipt)),connection:'close'});
    res.write('{"schemaVersion":',()=>res.destroy());return;
   }
   send(200,JSON.stringify(receipt),'application/json');
  }catch{if(!res.headersSent)send(500,'Local check failed');else res.destroy();}
  finally{if(reserved)reservations--;}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});
 origin='http://127.0.0.1:'+server.address().port;
 return {origin,close:()=>new Promise((resolve,reject)=>{server.closeAllConnections();server.close(error=>error?reject(error):resolve());})};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);if(args.length&&(args.length!==2||args[0]!=='--port'||!/^\d{4,5}$/u.test(args[1])))throw Error('Use npm run terms:transport -- --port 4208.');
  const fixture=await startTermsTransportFixture({port:Number(args[1]??4208)});console.log('Disposable terms transport check: '+fixture.origin+'/');
 }catch(error){console.error(error.code==='EADDRINUSE'?'Port is in use. Choose another port; no server was stopped.':'Terms transport check could not start. Build packages first and choose an unused port.');process.exitCode=1;}
}
