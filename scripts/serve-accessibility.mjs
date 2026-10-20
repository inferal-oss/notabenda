// @requirements REQ-PRODUCT-A11Y
// Read-only loopback server for generated maintainer fixtures and public site assets.
import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export async function accessibilityAssetHandler({publicRoot='site/dist/public',fixtureRoot='.local/accessibility-fixture'}={}){
 const roots={public:await realpath(publicRoot),fixture:await realpath(fixtureRoot)};
 return async request=>{
  const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,allow:'GET, HEAD'}});
  try{
   const path=new URL(request.url).pathname,isFixture=path.startsWith('/qa-a11y/'),root=isFixture?roots.fixture:roots.public;
   let file=resolve(root,'.'+decodeURIComponent(isFixture?path.slice('/qa-a11y'.length):path));
   if(file!==root&&!file.startsWith(root+'/'))throw Error();
   if((await stat(file)).isDirectory())file=resolve(file,'index.html');
   file=await realpath(file);if(file!==root&&!file.startsWith(root+'/'))throw Error();
   const bytes=await readFile(file);
   return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'content-type':types[extname(file)]??'application/octet-stream'}});
  }catch{return new Response('Not found',{status:404,headers});}
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);if(args.length&&(args.length!==2||args[0]!=='--port'||!/^\d{4,5}$/u.test(args[1])))throw Error('Use npm run a11y:serve -- --port 4188.');
  const port=Number(args[1]??4188);if(port<1024||port>65535)throw Error('Use a port from 1024 to 65535.');
  const handle=await accessibilityAssetHandler();
  createServer(async(req,res)=>{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{allow:'GET, HEAD'});res.end('Method not allowed');return;}
   try{const result=await handle(new Request('http://127.0.0.1'+req.url,{method:req.method}));res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
   catch{res.writeHead(404);res.end('Not found');}
  })
   .on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port is in use. Choose another --port; no existing server was stopped.':'Accessibility server could not start.');process.exitCode=1;})
   .listen(port,'127.0.0.1',()=>console.log('Accessibility review: http://127.0.0.1:'+port+'/qa-a11y/'));
 }catch(error){console.error(error.code==='ENOENT'?'Build the site and run npm run a11y:fixture first.':error.message);process.exitCode=1;}
}
