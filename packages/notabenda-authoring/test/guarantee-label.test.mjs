// @requirements REQ-EU-GUARANTEE-LABEL
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {PNG} from 'pngjs';
import {encode} from 'jpeg-js';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {buildDurabilityGuaranteeLabel,verifyDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';
import {normalizeDurabilityGuaranteeLabel,renderDurabilityGuaranteeLabel,durabilityGuaranteeInformationUrl} from '@notabenda/core/guarantees/label';
import {DurabilityGuaranteeLabel} from '@notabenda/core/react/documents';
// Structural file fixtures only. None is a prescribed complete GARAN artwork or a legal acceptance fixture.
const options={product:{id:'kettle-one',name:'Kettle One'},producer:{brand:'Example Maker',model:'K-100'},durationYears:5,qualification:{offeredByProducer:true,noAdditionalCost:true,coversEntireGood:true,informationProvidedToTrader:true},reviewStatus:'reviewed',locale:'en'};
const pixels=Buffer.from([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
const png=PNG.sync.write({width:2,height:2,data:pixels});
const jpg=encode({width:2,height:2,data:pixels},90).data;
const svg=(inner='<path fill="#00ff00" d="M0 0H100V100H0Z"/>',attrs='')=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${attrs}>${inner}</svg>`);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,body=Buffer.alloc(0)){const part=Buffer.concat([Buffer.from(type),body]),result=Buffer.alloc(12+body.length);result.writeUInt32BE(body.length);part.copy(result,4);let c=0xffffffff;for(const byte of part)c=crcTable[(c^byte)&255]^(c>>>8);result.writeUInt32BE((c^0xffffffff)>>>0,result.length-4);return result;}
function replaceChunk(bytes,type,body){let p=8,parts=[bytes.subarray(0,8)];while(p<bytes.length){const n=bytes.readUInt32BE(p)+12;parts.push(bytes.toString('ascii',p+4,p+8)===type?chunk(type,body):bytes.subarray(p,p+n));p+=n;}return Buffer.concat(parts);}
const insertPng=(type,body)=>Buffer.concat([png.subarray(0,33),chunk(type,body),png.subarray(33)]);
const insertJpeg=(marker,body)=>Buffer.concat([jpg.subarray(0,2),Buffer.from([255,marker,(body.length+2)>>8,(body.length+2)&255]),body,jpg.subarray(2)]);

test('finished image bytes are copied exactly, detected by content and retained under deterministic local hashes',()=>{
 for(const [bytes,mediaType,extension] of [[png,'image/png','png'],[jpg,'image/jpeg','jpg'],[svg(),'image/svg+xml','svg']]){const original=Uint8Array.from(bytes),result=buildDurabilityGuaranteeLabel(options,original);assert.equal(result.label.asset.mediaType,mediaType);assert.equal(result.label.asset.sha256,hash(bytes));assert.equal(result.label.asset.url,`/assets/guarantees/${hash(bytes)}.${extension}`);assert.deepEqual(Object.keys(result.files),[result.label.asset.url.slice(1)]);const output=Object.values(result.files)[0];assert.ok(output instanceof Uint8Array);assert.notEqual(output,original);assert.deepEqual(Buffer.from(output),bytes);assert.deepEqual(verifyDurabilityGuaranteeLabel(result.label,bytes),result.label);assert.deepEqual(buildDurabilityGuaranteeLabel(options,bytes),result);original.fill(0);assert.deepEqual(Buffer.from(output),bytes);assert.equal(result.label.informationUrl,durabilityGuaranteeInformationUrl);}
});

test('all four eligibility facts are explicitly true; unknowns never become no-guarantee decisions, even in preview',()=>{
 for(const key of Object.keys(options.qualification)){for(const value of [false,null,'true',1,undefined]){const input=structuredClone(options);if(value===undefined)delete input.qualification[key];else input.qualification[key]=value;assert.throws(()=>buildDurabilityGuaranteeLabel(input,png));}}
 for(const durationYears of [0,2,2.1,2.25,NaN,Infinity,100.5,'5'])assert.throws(()=>buildDurabilityGuaranteeLabel({...options,durationYears},png));
 for(const durationYears of [2.5,3,3.5,100]){const label=buildDurabilityGuaranteeLabel({...options,durationYears},png).label;assert.equal(label.durationYears,durationYears);assert.equal(label.wording.durationValue,String(durationYears).replace('.',',')+' years');}
 assert.throws(()=>buildDurabilityGuaranteeLabel({...options,reviewStatus:'draft'},png));const draft=buildDurabilityGuaranteeLabel({...options,reviewStatus:'draft',allowPreview:true},png).label;assert.throws(()=>renderDurabilityGuaranteeLabel(draft,{idPrefix:'one'}));assert.match(renderDurabilityGuaranteeLabel(draft,{idPrefix:'one',allowPreview:true}),/Draft product guarantee/);assert.throws(()=>verifyDurabilityGuaranteeLabel(draft,png));assert.equal(verifyDurabilityGuaranteeLabel(draft,png,{allowPreview:true}).reviewStatus,'draft');
});

test('product, producer, offer, review, wording, paths and original-file identity are bound; structural cloning is not verification',()=>{
 const {label}=buildDurabilityGuaranteeLabel(options,png);
 for(const change of [{product:{...options.product,id:'kettle-two'}},{product:{...options.product,name:'Updated name'}},{producer:{...options.producer,brand:'Other'}},{producer:{...options.producer,model:'K-200'}},{durationYears:5.5},{reviewStatus:'draft',allowPreview:true},{wording:{...label.wording,title:'A reviewed translation'}},{locale:'en-GB',wording:label.wording},{statementUrl:'https://producer.example/guarantee'},{assetBase:'/legal/labels'}])assert.notEqual(buildDurabilityGuaranteeLabel({...options,...change},png).label.labelId,label.labelId);
 assert.notEqual(buildDurabilityGuaranteeLabel(options,svg()).label.labelId,label.labelId);
 const changed=structuredClone(label);changed.product.name='Changed';assert.doesNotThrow(()=>normalizeDurabilityGuaranteeLabel(changed));assert.throws(()=>verifyDurabilityGuaranteeLabel(changed,png));assert.throws(()=>verifyDurabilityGuaranteeLabel(label,jpg));
 const metadata=structuredClone(label);metadata.asset.width=3;assert.throws(()=>verifyDurabilityGuaranteeLabel(metadata,png));
 assert.throws(()=>buildDurabilityGuaranteeLabel({...options,locale:'de'},png));for(const statementUrl of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','https://example.com/\n'])assert.throws(()=>buildDurabilityGuaranteeLabel({...options,statementUrl},png));for(const assetBase of ['/../a','//a','/a/','https://example.com','/a?b'])assert.throws(()=>buildDurabilityGuaranteeLabel({...options,assetBase},png));
});

test('bounded plain input rejects accessors, prototypes, coercion, private fields and shared buffers without invoking hooks',()=>{
 let calls=0;for(const key of ['product','locale','qualification']){const input={...options};Object.defineProperty(input,key,{enumerable:true,get(){calls++;return options[key];}});assert.throws(()=>buildDurabilityGuaranteeLabel(input,png));}assert.equal(calls,0);
 const built=buildDurabilityGuaranteeLabel(options,png).label;const poisoned=structuredClone(built);Object.defineProperty(poisoned,'wording',{enumerable:true,get(){calls++;return built.wording;}});assert.throws(()=>normalizeDurabilityGuaranteeLabel(poisoned));assert.equal(calls,0);const cloned=normalizeDurabilityGuaranteeLabel(built);cloned.producer.brand='Detached';assert.equal(built.producer.brand,options.producer.brand);
 const custom=Object.assign(Object.create({toJSON(){calls++;return options;}}),options);assert.throws(()=>buildDurabilityGuaranteeLabel(custom,png));assert.equal(calls,0);
 const {label}=buildDurabilityGuaranteeLabel(options,png);for(const change of [v=>v.privateNotes='secret',v=>v.asset.filename='secret',v=>v.asset.url='//outside.example/file.png',v=>v.asset.mediaType='text/html',v=>v.wording.title='a'.repeat(16001),v=>v.producer.brand='bad\nvalue',v=>v.qualification.extra=true]){const v=structuredClone(label);change(v);assert.throws(()=>normalizeDurabilityGuaranteeLabel(v));}
 assert.throws(()=>buildDurabilityGuaranteeLabel({...options,privateNotes:'secret'},png));assert.throws(()=>buildDurabilityGuaranteeLabel(options,new Uint8Array(new SharedArrayBuffer(100))));assert.throws(()=>buildDurabilityGuaranteeLabel(options,new Uint8Array(2097153)));assert.throws(()=>buildDurabilityGuaranteeLabel(options,new Uint8Array()));
});

test('PNG validates full chunks, checksums, bounded decompression, colour, static frames and omitted private metadata',()=>{
 const header=Buffer.from(png.subarray(16,29));header.writeUInt32BE(5000,0);const huge=replaceChunk(png,'IHDR',header);
 const interlace=Buffer.from(png.subarray(16,29));interlace[12]=1;
 const gray=Buffer.from(png.subarray(16,29));gray[9]=0;
 const crc=Buffer.from(png);crc[crc.length-1]^=1;
 const cases=[png.subarray(0,-1),Buffer.concat([png,Buffer.from('extra')]),huge,replaceChunk(png,'IHDR',interlace),replaceChunk(png,'IHDR',gray),crc,insertPng('acTL',Buffer.alloc(8)),insertPng('tEXt',Buffer.from('Author\0PRIVATE')),insertPng('iTXt',Buffer.from('PRIVATE')),insertPng('eXIf',Buffer.from('PRIVATE')),insertPng('iCCP',Buffer.from('unsupported ICC profile')),replaceChunk(png,'IDAT',deflateSync(Buffer.alloc(100000))),replaceChunk(png,'IDAT',Buffer.from('invalid'))];
 for(const bytes of cases)assert.throws(()=>buildDurabilityGuaranteeLabel(options,bytes));
 const srgb=insertPng('sRGB',Buffer.from([0]));assert.deepEqual(Buffer.from(Object.values(buildDurabilityGuaranteeLabel(options,srgb).files)[0]),srgb);
});

test('JPEG is fully decoded after bounded dimensions and rejects truncation, extra bytes, metadata and non-colour frames',()=>{
 for(const bytes of [jpg.subarray(0,-2),Buffer.concat([jpg,Buffer.from('extra')]),insertJpeg(225,Buffer.from('Exif\0\0PRIVATE')),insertJpeg(237,Buffer.from('Photoshop PRIVATE')),insertJpeg(254,Buffer.from('PRIVATE')),insertJpeg(225,Buffer.from('http://ns.adobe.com/xap/1.0/ PRIVATE'))])assert.throws(()=>buildDurabilityGuaranteeLabel(options,bytes));
 const frame=Buffer.from(jpg);const index=frame.indexOf(Buffer.from([255,192]));assert.ok(index>0);frame.writeUInt16BE(5000,index+7);assert.throws(()=>buildDurabilityGuaranteeLabel(options,frame));
 const gray=Buffer.from(jpg);gray[index+9]=1;assert.throws(()=>buildDurabilityGuaranteeLabel(options,gray));
});

test('outlined SVG supports bounded static geometry, class styles, local clips and embedded QR PNG without changing source bytes',()=>{
 const bytes=svg(`<defs><clipPath id="crop"><rect width="100" height="100"/></clipPath><style>.paper {fill:#ffffff;stroke:black;stroke-width:1;}.shape{fill:#00ff00;}</style></defs><g clip-path="url(#crop)"><rect class="paper" width="100" height="100"/><path class="shape" d="M0 0H100V100H0Z"/><image x="10" y="10" width="20" height="20" href="data:image/png;base64,${png.toString('base64')}"/></g>`);
 const result=buildDurabilityGuaranteeLabel(options,bytes);assert.deepEqual(Buffer.from(Object.values(result.files)[0]),bytes);assert.equal(result.label.asset.width,100);assert.doesNotThrow(()=>verifyDurabilityGuaranteeLabel(result.label,bytes));
});

test('SVG rejects entities, processing instructions, live text/fonts, external resources, scripts, unknown CSS and recursive references',()=>{
 const cases=[Buffer.from('<!DOCTYPE svg [<!ENTITY xx SYSTEM "file:///etc/passwd">]>'+svg()),Buffer.from('<?xml-stylesheet href="https://evil.example/a.css"?>'+svg()),svg('<text>XX</text>'),svg('<foreignObject/>'),svg('<script>alert(1)</script>'),svg('<animate attributeName="x"/>'),svg('<image href="https://example.com/a.png"/>'),svg('<image href="data:image/svg+xml;base64,PHN2Zy8+"/>'),svg('<use href="#self" id="self"/>'),svg('<path fill="url(https://evil.example)" d="M0 0Z"/>'),svg('<path onclick="evil()" d="M0 0Z"/>'),svg('<style><script href="https://evil.example/payload.js"/></style>'),svg('<style><foreignObject/></style>'),svg('<style><image href="https://evil.example/a.png"/></style>'),svg('<style><?xml-stylesheet href="https://evil.example/a.css"?></style>'),svg('<style>@import "https://evil.example";</style>'),svg('<style>.x{font-family:Inter;}</style>'),svg('<style>.x{fill:expression(evil);}</style>'),svg('<style>.x{fill:#fff!important;}</style>'),svg('<path id="a"/><path id="a"/>'),svg('<g clip-path="url(#missing)"/>'),svg('<defs><clipPath id="self" clip-path="url(#self)"/></defs>'),svg('<defs><style>.x{clip-path:url(#self)}</style><clipPath id="self" class="x"/></defs>'),svg('<rect class="undefined"/>'),svg('<g>'.repeat(35)+'</g>'.repeat(35)),svg('<!--PRIVATE filename--><path d="M0 0Z"/>'),svg('<metadata>PRIVATE</metadata>'),svg('<g></svg>'),svg('<path d="M0 0Z"/>','width="99" height="100"'),Buffer.from([255,0,60,115,118,103])];
 for(const bytes of cases)assert.throws(()=>buildDurabilityGuaranteeLabel(options,bytes));
});

test('static views preserve product association, readable facts, full-size image and fixed information destination; browser graphs exclude build decoders',async()=>{
 const label=buildDurabilityGuaranteeLabel({...options,product:{...options.product,name:'<script>escape</script>'},statementUrl:'https://producer.example/terms'},svg()).label;
 const dom=new JSDOM(renderDurabilityGuaranteeLabel(label,{idPrefix:'product',headingLevel:3})),doc=dom.window.document;assert.equal(doc.querySelector('script,iframe,svg,style,form,input,button,[hidden],details'),null);assert.equal(doc.querySelector('h3').textContent,label.wording.title);assert.equal(doc.querySelector('.nb-guarantee-product').textContent,label.product.name);assert.deepEqual([...doc.querySelectorAll('dd')].map(n=>n.textContent),[label.producer.brand,label.producer.model,label.wording.durationValue]);assert.equal(doc.querySelector('[data-product-id]').dataset.productId,label.product.id);assert.equal(doc.querySelector('img').getAttribute('src'),label.asset.url);assert.equal(doc.querySelector('img').getAttribute('alt'),label.wording.imageAlt);assert.deepEqual([...doc.querySelectorAll('a')].map(n=>n.getAttribute('href')),[label.informationUrl,label.statementUrl,label.asset.url]);dom.window.close();
 assert.match(renderToStaticMarkup(createElement(DurabilityGuaranteeLabel,{label,idPrefix:'react'})),/data-guarantee-label-id/);
 for(const entry of ['@notabenda/core','@notabenda/core/guarantees/label','@notabenda/core/react/documents']){const graph=await build({stdin:{contents:`export * from '${entry}';`,resolveDir:process.cwd()},bundle:true,platform:'browser',write:false,metafile:true,external:['react']});assert.ok(Object.keys(graph.metafile.inputs).every(p=>!/(?:pngjs|jpeg-js|xmldom|guarantee-label-(?:build|image)|notabenda-authoring)/u.test(p)));}
 const css=await readFile(new URL('../../notabenda/dist/guarantees.css',import.meta.url),'utf8');assert.match(css,/filter:none;clip-path:none/);assert.match(css,/forced-color-adjust:none/);
});

test('SVG aggregates embedded decoded pixels and image count before decoding the next PNG',()=>{
 const big=PNG.sync.write({width:2000,height:2000,data:Buffer.alloc(2000*2000*4,255)}),image=bytes=>`<image width="100" height="100" href="data:image/png;base64,${bytes.toString('base64')}"/>`;
 assert.throws(()=>buildDurabilityGuaranteeLabel(options,svg(image(big).repeat(3))),/aggregate embedded pixel/);
 assert.throws(()=>buildDurabilityGuaranteeLabel(options,svg(image(png).repeat(17))),/embedded image limit/);
});

test('malformed stylesheet suffixes have bounded processing and aggregate CSS budgets',()=>{
 const source=`import {buildDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';
const options=${JSON.stringify(options)};
for(const css of ['a'.repeat(99999),'.x{fill:white;}'+ ' '.repeat(99000)]){const bytes=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>'+css+'</style></svg>');try{buildDurabilityGuaranteeLabel(options,bytes);}catch{}}`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',source],{cwd:process.cwd(),encoding:'utf8',timeout:3000});assert.equal(result.error,undefined,result.error?.message);assert.equal(result.status,0,result.stderr);
 assert.throws(()=>buildDurabilityGuaranteeLabel(options,svg('<style>'+'.x{fill:white;}'+ ' '.repeat(60000)+'</style><style>'+'.y{fill:black;}'+ ' '.repeat(60000)+'</style>')),/stylesheet/);
 assert.throws(()=>buildDurabilityGuaranteeLabel(options,svg('<style>'+'.x{fill:white;}'.repeat(513)+'</style>')),/rule limit/);
});

// @requirements REQ-EU-GUARANTEE-LABEL
 test('static clip graphs accept bounded nesting and reject cycles, deep chains and unused CSS expansion',()=>{
 const accept=svg('<defs><clipPath id="a"><rect width="90" height="90"/></clipPath><clipPath id="b"><g clip-path="url(#a)"><rect width="80" height="80"/></g></clipPath></defs><path clip-path="url(#b)" d="M0 0H100V100Z"/>');
 const built=buildDurabilityGuaranteeLabel(options,accept);assert.ok(built);
 for(const body of [
 '<defs><clipPath id="a"><g clip-path="url(#a)"><rect width="90" height="90"/></g></clipPath></defs>',
 '<defs><clipPath id="a"><g clip-path="url(#b)"/></clipPath><clipPath id="b"><g clip-path="url(#a)"/></clipPath></defs>',
 '<style>.x{clip-path:url(#a)}</style><defs><clipPath id="a"><g class="x"/></clipPath></defs>',
 '<path clip-path="url(#missing)" d="M0 0H1V1Z"/>',
 '<defs>'+Array.from({length:9},(_,i)=>`<clipPath id="a${i}"><g ${i<8?`clip-path="url(#a${i+1})"`:''}><rect width="90" height="90"/></g></clipPath>`).join('')+'</defs>',
 ])assert.throws(()=>buildDurabilityGuaranteeLabel(options,svg(body)),/Unsupported producer label asset/);
 const selectors=Array.from({length:1000},(_,i)=>`.c${i}`).join(','),declarations=Array.from({length:1000},(_,i)=>`clip-path:url(#a${i});`).join(''),clips=Array.from({length:1000},(_,i)=>`<clipPath id="a${i}"><rect width="1" height="1"/></clipPath>`).join('');
 const hostile=svg(`<style>${selectors}{${declarations}}</style><defs>${clips}</defs>`);
 const result=spawnSync(process.execPath,['--input-type=module','-e',`import {buildDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';try{buildDurabilityGuaranteeLabel(${JSON.stringify(options)},Buffer.from(${JSON.stringify(hostile.toString('base64'))},'base64'));process.exit(2);}catch(e){if(!/CSS clip (?:association|expansion) limit/.test(e.message))throw e;}`],{timeout:5000,encoding:'utf8'});
 assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);
 });
