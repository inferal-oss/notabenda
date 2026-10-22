// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
// Maintainer-only generation and a narrowly bounded loopback review server. No package runtime imports.
import {readFile, writeFile, mkdir, realpath, lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css; charset=utf-8'};
const safe = path => typeof path === 'string' && /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/u.test(path) && !path.split('/').some(p => p === '.' || p === '..');
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);

export async function writeCandidateBrowserReview({directory, bundle, consentCss, documentCss, descriptor, artifact}) {
  const id = artifact.manifest.artifactId;
  if (!hash(id) || descriptor?.evidence !== 'local') throw Error('Invalid browser review inputs.');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Installed candidate · Notabenda</title><link rel="stylesheet" href="/review.css"><link rel="stylesheet" href="/consent.css"><script type="module" src="/app.mjs"></script></head><body><main><header><p class="eyebrow">Notabenda · package review</p><h1>Try the installed candidate.</h1><p>These controls come from the package archives built by the source-candidate run. The optional sample service makes one request to this local server and writes one disposable marker.</p><p class="identity"><span>Authored release</span><code>${id}</code><span id="storage-mode">Connecting…</span></p><p id="ready" role="status">Loading controls…</p></header><div class="layout"><section aria-labelledby="steps"><h2 id="steps">Follow the choice</h2><ol class="steps"><li><strong>Start without permission</strong><p>On a fresh origin, starts and the local server count should be zero. Opening or dismissing preferences grants nothing.</p></li><li><strong>Allow the sample measurement</strong><p>Use the native choices. One service start should create a marker and one local request.</p></li><li><strong>Reload, then reject</strong><p>A saved local grant permits a new start after reload. Reject optional stops this page’s service and removes its marker. A request already received stays in the server count.</p></li><li><strong>Check a second tab</strong><p>Open the same URL in another tab. A rejection there should block the service here too. The server count is shared across tabs; page counters restart on reload.</p></li><li><strong>Try unavailable choice storage</strong><p>The failure route supplies a throwing choice-storage adapter. A grant that cannot be saved must keep the sample service blocked, before and after reload. The sample marker still uses ordinary localStorage.</p></li></ol><p class="links"><a href="/">Browser storage</a><a href="/?storage=unavailable">Choice storage failure</a></p><p class="links"><a href="/artifacts/${id}/privacy.html">Pinned privacy</a><a href="/artifacts/${id}/cookies.html">Pinned cookies</a><a href="/artifacts/${id}/terms.html">Pinned MDX terms</a></p></section><section class="panel" aria-labelledby="observations"><h2 id="observations">This page</h2><dl class="metrics"><div><dt>Choice</dt><dd id="permission">—</dd></div><div><dt>Service phase</dt><dd id="phase">—</dd></div><div><dt>Choice persistence</dt><dd id="persistence">—</dd></div><div><dt>Service starts</dt><dd id="starts">0</dd></div><div><dt>Cleanup calls</dt><dd id="stops">0</dd></div><div><dt>Completed probe responses</dt><dd id="completed">0</dd></div><div><dt>Failed or aborted probes</dt><dd id="failed">0</dd></div><div><dt>Sample marker</dt><dd id="marker">—</dd></div><div><dt>Server requests since start</dt><dd id="server-count">Not read</dd></div></dl><div class="actions"><button id="preferences" type="button">Privacy choices</button><button id="counter" type="button">Read local counter</button></div><p class="note">The server count measures only POST /probe requests it received. It does not inspect arbitrary traffic, authenticate consent or establish legal or accessibility approval. Native browser results are recorded separately.</p></section></div><div id="controls" class="nb-root"></div></main></body></html>`;
  const files = {'index.html':Buffer.from(html), 'runtime.js':Buffer.from(bundle), 'runtime-config.json':Buffer.from(JSON.stringify(descriptor)+'\n'), 'consent.css':Buffer.from(consentCss), 'assets/notabenda.css':Buffer.from(documentCss), 'app.mjs':await readFile(new URL('./source-candidate-review-app.mjs',import.meta.url)), 'review.css':await readFile(new URL('./source-candidate-review.css',import.meta.url))};
  for (const doc of artifact.manifest.documents) {
    if (!['privacy','cookies','terms'].includes(doc.kind) || doc.file!==doc.kind+'/index.html' || typeof artifact.pages[doc.file] !== 'string') throw Error('Invalid pinned document.');
    files['artifacts/'+id+'/'+doc.kind+'.html'] = Buffer.from(artifact.pages[doc.file]);
    // The native controls link to the candidate's ordinary document routes too.
    files[doc.file] = Buffer.from(artifact.pages[doc.file]);
  }
  await mkdir(directory);
  const entries=[];
  for (const [path, bytes] of Object.entries(files)) {
    await mkdir(dirname(join(directory,path)),{recursive:true});
    await writeFile(join(directory,path),bytes,{flag:'wx'});
    entries.push({path,bytes:bytes.length,sha256:sha(bytes)});
  }
  const manifest={schemaVersion:1,kind:'notabenda-candidate-browser-review',artifactId:id,files:entries};
  await writeFile(join(directory,'review-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  return {manifestSha256:sha(await readFile(join(directory,'review-manifest.json'))),artifactId:id,fileCount:entries.length};
}

export async function candidateReviewHandler({directory,manifestSha256,origin}) {
  if (!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{3,4}$/u.test(origin) || !hash(manifestSha256)) throw Error('Use an exact loopback origin and candidate digest.');
  const root=await realpath(directory),manifestPath=join(root,'review-manifest.json');
  if (!(await lstat(manifestPath)).isFile()) throw Error('Invalid review manifest.');
  const manifestBytes=await readFile(manifestPath);
  if (manifestBytes.length>32768 || sha(manifestBytes)!==manifestSha256) throw Error('Review manifest mismatch.');
  const manifest=JSON.parse(manifestBytes),assets=new Map();
  if (manifest.schemaVersion!==1 || manifest.kind!=='notabenda-candidate-browser-review' || !hash(manifest.artifactId) || !Array.isArray(manifest.files) || manifest.files.length>16) throw Error('Invalid review manifest.');
  for (const entry of manifest.files) {
    if (!safe(entry.path)||assets.has('/'+entry.path)||!hash(entry.sha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<0||entry.bytes>2*1024*1024) throw Error('Invalid review asset.');
    const path=join(root,entry.path);
    if (!(await lstat(path)).isFile() || await realpath(path)!==path) throw Error('Review symlinks are not served.');
    const bytes=await readFile(path);
    if (bytes.length!==entry.bytes||sha(bytes)!==entry.sha256) throw Error('Review asset mismatch.');
    assets.set('/'+entry.path,{bytes,type:types[entry.path.slice(entry.path.lastIndexOf('.'))]??'application/octet-stream'});
  }
  for (const path of ['/index.html','/app.mjs','/runtime.js','/consent.css','/runtime-config.json']) if (!assets.has(path)) throw Error('Incomplete review.');
  let attempts=0;
  const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
  const response=(body,status=200,extra={})=>new Response(body,{status,headers:{...headers,...extra}});
  return async request=>{
    const url=new URL(request.url);
    if (url.origin!==origin || request.headers.get('host')&&request.headers.get('host')!==url.host || request.headers.get('origin')&&request.headers.get('origin')!==origin || request.headers.get('sec-fetch-site')==='cross-site') return response('Forbidden',403);
    if (url.pathname==='/probe') {
      if (request.method!=='POST') return response('Method not allowed',405,{allow:'POST'});
      if (url.search || request.body!==null || request.headers.get('origin')!==origin || request.headers.get('x-notabenda-review')!=='probe' || request.headers.has('content-length')&&request.headers.get('content-length')!=='0' || request.headers.has('transfer-encoding')) return response('Invalid probe',400);
      if (attempts>=10000) return response('Probe limit reached',429);
      attempts++;
      return response(JSON.stringify({attempts}),200,{'content-type':'application/json'});
    }
    if (!['GET','HEAD'].includes(request.method)) return response('Method not allowed',405,{allow:'GET, HEAD'});
    const head=request.method==='HEAD';
    if (url.pathname==='/observations'&&!url.search) return response(head?null:JSON.stringify({attempts}),200,{'content-type':'application/json'});
    if (url.search && !(url.pathname==='/'&&url.search==='?storage=unavailable')) return response('Not found',404);
    const asset=assets.get(url.pathname==='/'?'/index.html':url.pathname) ?? assets.get(url.pathname.replace(/\/$/u,'')+'/index.html');
    if (!asset) return response('Not found',404);
    return response(head?null:asset.bytes,200,{'content-type':asset.type});
  };
}

export async function serveCandidateReview({candidate,port}) {
  if (!Number.isInteger(port)||port<1024||port>65535) throw Error('Choose a port from 1024 to 65535.');
  const root=await realpath(candidate),report=JSON.parse(await readFile(join(root,'source-candidate.json'),'utf8'));
  if (report.kind!=='notabenda-source-candidate'||report.status!=='source-built-consumer-checked'||!hash(report.consumer?.browserReview?.manifestSha256)) throw Error('Use a successful candidate with browser review output.');
  const origin='http://127.0.0.1:'+port,handle=await candidateReviewHandler({directory:join(root,'evidence/browser-review'),manifestSha256:report.consumer.browserReview.manifestSha256,origin});
  const server=createServer(async(req,res)=>{
    try {
      // Do not buffer or log request bodies, headers, browser identifiers or source paths.
      const request=new Request(origin+req.url,{method:req.method,headers:req.headers});
      const result=await handle(request);req.resume();
      res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
    } catch {req.resume();res.writeHead(400,{'cache-control':'no-store'});res.end('Invalid request');}
  });
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',done);});
  return {server,origin,sourceCommit:report.source?.commit};
}
if (process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2);
    if (args.length!==4||args[0]!=='--candidate'||args[2]!=='--port'||!/^\d{4,5}$/u.test(args[3])) throw Error('Use --candidate CANDIDATE_DIRECTORY --port 62546.');
    const {origin,sourceCommit}=await serveCandidateReview({candidate:args[1],port:Number(args[3])});
    console.log('Installed candidate review: '+origin+'/\nSource: '+sourceCommit+'\nOnly local synthetic requests are counted. No native-browser pass is inferred.');
  } catch(error) {console.error(error.code==='EADDRINUSE'?'Port is in use; choose another. No existing server was stopped.':error.message);process.exitCode=1;}
}
