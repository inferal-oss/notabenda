// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-RELEASE-CANDIDATE REQ-PRODUCT-SOURCE-CANDIDATE
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

// Resolve exactly the client used by Miniflare, rather than an unrelated root copy.
const require=createRequire(import.meta.url),toolRequire=createRequire(require.resolve('miniflare'));

test('the isolated Worker toolchain uses the patched client and enforces mixed-case response integrity',async()=>{
  const root=JSON.parse(await readFile(new URL('../../../package.json',import.meta.url),'utf8'));
  assert.equal(root.overrides.miniflare.undici,'7.30.1');assert.equal(toolRequire('undici/package.json').version,root.overrides.miniflare.undici);
  const {fetch}=toolRequire('undici'),body='Synthetic release-tool response';
  const server=createServer((_request,response)=>{response.setHeader('content-type','text/plain');response.end(body);});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try{
    const url='http://127.0.0.1:'+server.address().port+'/';
    for(const [algorithm,token] of [['sha256','SHA256'],['sha384','Sha384'],['sha512','sHa512']]){
      const digest=createHash(algorithm).update(body).digest('base64');
      assert.equal(await (await fetch(url,{integrity:token+'-'+digest})).text(),body);
      const other=createHash(algorithm).update('Different bytes').digest('base64');
      await assert.rejects(fetch(url,{integrity:token+'-'+other}),TypeError);
    }
  }finally{server.closeAllConnections();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
