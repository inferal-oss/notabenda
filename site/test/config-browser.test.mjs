// @requirements REQ-PRODUCT-CONFIG-SOURCES
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const root=new URL('../dist/public/',import.meta.url);
test('the shipped browser codec resolves its own parser and handles every draft format without Node',async()=>{
 const codec=await import(new URL('assets/runtime/config-document.js',root)),config=JSON.parse(await readFile(new URL('notabenda.public.json',root),'utf8'));
 for(const format of ['json','yaml','markdown']){const text=await codec.formatConfigSource(config,format);assert.deepEqual((await codec.parseConfigSource(text,format)).config,config);}
 const source=await readFile(new URL('assets/runtime/config-document.js',root),'utf8');assert.match(source,/import\(["']\.\/config-yaml\.js["']\)/);assert.doesNotMatch(source,/node:fs|node:module/);
 const parser=await readFile(new URL('assets/runtime/config-yaml.js',root),'utf8');assert.doesNotMatch(parser,/node:module|Dynamic require of/);
 const app=await readFile(new URL('assets/cartridges.mjs',root),'utf8');assert.match(app,/import\(["']\/assets\/runtime\/config-document\.js["']\)/);assert.doesNotMatch(app,/YAML directives are not supported/);
});
test('the installed reference and public guidance describe actual browser/CLI format choices and private-note boundaries',async()=>{
 const reference=JSON.parse(await readFile(new URL('integration-reference.json',root),'utf8'));assert.equal(reference.configContract.browserCodec,'@notabenda/core/config/document');assert.equal(reference.configContract.wizardOutputFormat,'--config-format json|yaml|markdown');assert.equal(reference.configContract.consentRuntimeBuild.option,'--consent-runtime local|required');assert.equal(reference.configContract.consentRuntimeBuild.evidenceModeHasNoDefault,true);
 const guide=await readFile(new URL('guide/configuration-sources/index.html',root),'utf8');assert.match(guide,/Configuration format/);assert.match(guide,/source body notes are not added to session storage/);assert.match(guide,/consent-runtime.json/);assert.match(guide,/notabenda-consent.css/);
 const privacy=await readFile(new URL('website-privacy/index.html',root),'utf8');assert.match(privacy,/configuration download format/);assert.match(privacy,/Imported Markdown body notes and private configuration fields are excluded/);
});
