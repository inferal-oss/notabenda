// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
// Run only in the separately installed generated starter, outside the consumer directory.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {authorizeHostRequest} from './src/authorize.mjs';
import {createHost} from './src/host.mjs';
const cwd=process.cwd(),config=JSON.parse(await readFile('wrangler.json','utf8'));
const metadata=JSON.parse(await readFile('package.json','utf8')),require=createRequire(import.meta.url),toolRequire=createRequire(require.resolve('miniflare'));
assert.equal(metadata.overrides?.miniflare?.undici,'7.30.1');
const toolchainClientVersion=toolRequire('undici/package.json').version;
assert.equal(toolchainClientVersion,metadata.overrides.miniflare.undici);
assert.equal(config.assets.run_worker_first,true);assert.equal(config.exports.EvidenceWorkspace.storage,'sqlite');
const worker=await build({entryPoints:['src/worker.mjs'],bundle:true,write:false,platform:'browser',format:'esm',external:['cloudflare:workers'],metafile:true});
for(const input of Object.keys(worker.metafile.inputs)){const path=resolve(input);assert.ok(path.startsWith(join(cwd,'node_modules')+'/')||path.startsWith(join(cwd,'src')+'/'));}
assert.equal(await authorizeHostRequest(new Request('https://candidate.example.test/'),{}),null);let reads=0;const env={EVIDENCE:{getByName(){reads++;throw Error('Must not read');}},ASSETS:{fetch(){reads++;throw Error('Must not read');}}};for(const path of ['/','/backoffice','/backoffice/setup','/assets/setup.mjs'])assert.equal((await createHost(authorizeHostRequest)(new Request('https://candidate.example.test'+path),env)).status,403);assert.equal(reads,0);
await writeFile('backend-result.json',JSON.stringify({schemaVersion:1,status:'passed',toolchainClientVersion,checks:['independent-starter-dependency-resolution','miniflare-client-security-pin','worker-entry-bundles','sqlite-config','default-denial-before-storage-or-assets'],boundaries:{cloudDeployment:false,implementedHostAuthorization:false,actualDurableObjectRuntime:false}},null,2)+'\n');
