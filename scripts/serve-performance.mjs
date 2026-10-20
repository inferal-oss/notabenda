// @requirements REQ-PRODUCT-BUNDLE-BUDGET
import {createServer} from 'node:http';
import {accessibilityAssetHandler} from './serve-accessibility.mjs';
const args=process.argv.slice(2);
try{
 if(args.length&&(args.length!==2||args[0]!=='--port'||!/^\d{4,5}$/u.test(args[1])))throw Error('Use npm run perf:serve -- --port 4188.');
 const port=Number(args[1]??4188);if(port<1024||port>65535)throw Error('Use a port from 1024 to 65535.');
 const root='.local/consent-performance-fixture',handler=await accessibilityAssetHandler({publicRoot:root,fixtureRoot:root});
 createServer(async(req,res)=>{
  try{const result=await handler(new Request('http://127.0.0.1'+req.url,{method:req.method}));res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
  catch{res.writeHead(404);res.end('Not found');}
 }).on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port is in use. Choose another --port; no existing server was stopped.':'Performance server could not start.');process.exitCode=1;}).listen(port,'127.0.0.1',()=>console.log('Consent performance: http://127.0.0.1:'+port+'/'));
}catch(error){console.error(error.code==='ENOENT'?'Run npm run perf:fixture first.':error.message);process.exitCode=1;}
