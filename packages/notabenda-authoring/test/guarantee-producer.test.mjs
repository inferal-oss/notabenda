// @requirements REQ-EU-GUARANTEE-LABEL
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildDurabilityGuaranteeLabel,verifyDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';
const root=new URL('../../../examples/guarantees/producer/',import.meta.url);

test('the sourced complete producer fixture preserves fixed artwork and binds outlined fields to product facts',()=>{
 const result=spawnSync('python3',[fileURLToPath(new URL('verify.py',root))],{encoding:'utf8',timeout:10000});
 assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/fixed presentation tree/);
});

test('the actual complete producer graphic passes the supported importer without changing its bytes',async()=>{
 const source=await readFile(new URL('juniper-jw-01.svg',root)),config=JSON.parse(await readFile(new URL('config.json',root),'utf8')),provenance=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 const built=buildDurabilityGuaranteeLabel(config,source),checked=verifyDurabilityGuaranteeLabel(built.label,source,{allowPreview:true});
 assert.equal(checked.asset.sha256,provenance.output.sha256);assert.equal(checked.asset.bytes,provenance.output.bytes);
 assert.deepEqual(Buffer.from(built.files[checked.asset.url.slice(1)]),source);
 assert.equal(checked.producer.brand,provenance.fields[0].value);assert.equal(checked.producer.model,provenance.fields[1].value);assert.equal(String(checked.durationYears),provenance.fields[2].value);
 assert.equal(checked.reviewStatus,'draft');assert.throws(()=>verifyDurabilityGuaranteeLabel(built.label,source),/Draft preview must be explicit/);
});

test('the complete outlined label renders without system fonts and its QR decodes to the recorded official payload',async()=>{
 const [{Resvg},{default:jsQR},{PNG}]=await Promise.all([import('@resvg/resvg-js'),import('jsqr'),import('pngjs')]);
 const source=await readFile(new URL('juniper-jw-01.svg',root)),provenance=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 for(const width of [360,480,1080]){
  const rendered=new Resvg(source,{background:'#fff',fitTo:{mode:'width',value:width},font:{loadSystemFonts:false}}).render();
  const png=PNG.sync.read(rendered.asPng()),code=jsQR(new Uint8ClampedArray(png.data),png.width,png.height,{inversionAttempts:'dontInvert'});
  assert.ok(code,'QR decode at '+width+' raster pixels');assert.equal(code.data,provenance.fixedArtwork.qrPayload);
  assert.equal(code.data,'https://europa.eu/youreurope/commercial-guarantee-durability');
 }
});
