import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createElement,Suspense} from 'react';
import {compileAuthoredDocuments,parseDocumentSource,readDocumentSource} from 'notabenda-authoring';
import {sha256,createTermsOffer} from 'notabenda/content';
import {recordLegalRelease,createDocumentHistory,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance,createAdminWorker} from 'notabenda-cf';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from '../../notabenda/test/helpers.mjs';
import {sourceDiff} from '../../notabenda-cf/dist/source-diff.js';
// @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-CF-HISTORY REQ-PRODUCT-SAFE-CONTENT
const source=(body='## Using the sample\n\nFictional **terms** only.',meta='')=>`---\nkind: terms\ntitle: Sample terms\nroute: /terms\nversion: "one"\neffectiveDate: 2026-10-18\nreview:\n  status: reviewed\n${meta}---\n${body}\n`;
const build=async(value,extra={})=>compileAuthoredDocuments(await fixture({reviewed:true}),{terms:{format:'md',source:value,...extra}});
const query={query:'',kind:'',from:'',to:'',keyPrefix:'',limit:50};

test('Markdown frontmatter produces deterministic rich pages, stable section models and separately private exact source bytes',async()=>{
  const input=source('## Using the sample\n\nFictional **terms** and [privacy](/privacy).','# private-source-note\nsectionIds:\n  Using the sample: use\n');
  const a=await build(input);const b=await build(input);assert.equal(a.manifest.artifactId,b.manifest.artifactId);
  assert.match(a.fragments.terms,/<strong>terms<\/strong>/);assert.match(a.fragments.terms,/href="#nb-terms-section-use"/);
  assert.equal(a.artifact.documents.terms.sections[0].id,'use');assert.match(a.artifact.documents.terms.sections[0].paragraphs[0],/privacy \(\/privacy\)/);
  assert.equal(a.archive.sourceAttachments.terms.source,input);assert.equal(a.manifest.documents.find(d=>d.kind==='terms').authoring.sourceSha256,sha256(input));
  assert.equal(Object.values(a.files).some(value=>value.includes('private-source-note')),false);
  assert.equal(Object.hasOwn(JSON.parse(a.files[`artifacts/${a.manifest.artifactId}.json`]),'sourceAttachments'),false);
});

test('MDX renders supplied components, captures their actual text and detects component-output changes with unchanged source',async()=>{
  const text=source('## Help\n\n<Notice>Useful fictional information.</Notice>');
  const first=await build(text,{format:'mdx',componentsRevision:'notice-1',components:{Notice:({children})=>createElement('aside',{className:'policy-note'},children)}});
  const next=await build(text,{format:'mdx',componentsRevision:'notice-1',components:{Notice:({children})=>createElement('aside',{className:'policy-note'},'Updated component. ',children)}});
  assert.match(first.fragments.terms,/class="policy-note"/);assert.match(first.artifact.documents.terms.sections[0].paragraphs[0],/Useful fictional information/);
  const a=first.manifest.documents.find(d=>d.kind==='terms');const b=next.manifest.documents.find(d=>d.kind==='terms');
  assert.equal(a.authoring.sourceSha256,b.authoring.sourceSha256);assert.notEqual(a.authoring.bodySha256,b.authoring.bodySha256);assert.notEqual(a.contentSha256,b.contentSha256);assert.notEqual(first.manifest.artifactId,next.manifest.artifactId);
  await assert.rejects(build(text,{format:'mdx',components:{Notice:()=>createElement('p',null,'A')}}),/componentsRevision/);
});

test('source-only edits change release identity while retaining identical rendered content and body digests',async()=>{
  const a=await build(source(undefined,'# comment one\n'));const b=await build(source(undefined,'# comment two\n'));
  const before=a.manifest.documents.find(d=>d.kind==='terms');const after=b.manifest.documents.find(d=>d.kind==='terms');
  assert.notEqual(a.manifest.artifactId,b.manifest.artifactId);assert.notEqual(before.authoring.sourceSha256,after.authoring.sourceSha256);assert.equal(before.sha256,after.sha256);assert.equal(before.authoring.bodySha256,after.authoring.bodySha256);assert.equal(before.contentSha256,after.contentSha256);
});

test('invalid YAML, alias expansion, unknown metadata, route/date collisions and draft review fail before any component executes',async()=>{
  let calls=0;const components={Counter(){calls++;return createElement('p',null,'Counted');}};
  const base=source('## Content\n\n<Counter />');
  const cases=[base.replace('title: Sample terms','title: A\ntitle: B'),base.replace('title: Sample terms','title: !unknown A'),base.replace('title: Sample terms','title: &title A\nversionAlias: *title'),base.replace('title: Sample terms','title: A\nprivate: secret'),base.replace('effectiveDate: 2026-10-18','effectiveDate: 2026-02-30'),base.replace('route: /terms','route: /privacy'),base.replace('status: reviewed','status: draft'),base.replace('kind: terms','kind: cookies'),base.replace('status: reviewed','status: [reviewed]')];
  for(const value of cases)await assert.rejects(build(value,{format:'mdx',components,componentsRevision:'counter-1'}));assert.equal(calls,0);
  assert.throws(()=>parseDocumentSource('x'.repeat(24577),'terms'),error=>error.code==='invalid-source');
});

test('Markdown never evaluates authored JavaScript, and raw markup requires the explicit MDX format',async()=>{
  const name='__notabendaAuthoringTest';delete globalThis[name];
  const md=await build(source('## Plain\n\n{globalThis.__notabendaAuthoringTest = true}'));
  assert.equal(globalThis[name],undefined);assert.match(md.fragments.terms,/globalThis/);
  await assert.rejects(build(source('## Markup\n\n<aside>Raw markup</aside>')),error=>error.code==='unsupported-content');
  const mdx=await build(source('export const marker = (globalThis.__notabendaAuthoringTest = true)\n\n## MDX\n\nTrusted project code.'),{format:'mdx'});
  assert.equal(globalThis[name],true);delete globalThis[name];assert.match(mdx.fragments.terms,/Trusted project code/);
});

test('post-component static-content policy rejects active markup, inline style and unsafe URLs with bounded errors',async()=>{
  for(const render of [()=>createElement('script',null,'alert(1)'),()=>createElement('iframe',{src:'https://example.test'}),()=>createElement('form',null,'Form'),()=>createElement('p',{style:{color:'red'}},'Styled'),()=>createElement('a',{href:'javascript:alert(1)'},'Unsafe'),()=>createElement('img',{src:'https://example.test/tracker',alt:'Remote image'}),()=>createElement('button',null,'Needs hydration')]){
    await assert.rejects(build(source('## Content\n\n<Custom />'),{format:'mdx',componentsRevision:'test',components:{Custom:render}}),error=>error.code==='unsupported-content');
  }
});

test('unfinished Suspense boundaries fail instead of archiving temporary fallback legal text',async()=>{
  function Wait(){throw new Promise(()=>{});}
  const Deferred=()=>createElement(Suspense,{fallback:createElement('p',null,'Loading terms...')},createElement(Wait));
  await assert.rejects(build(source('## Content\n\n<Deferred />'),{format:'mdx',componentsRevision:'deferred-1',components:{Deferred}}),/suspended fallback/);
});

test('multi-anchor ARIA references are retained and rewritten for supplied and generated documents',async()=>{
  const Accessible=()=>createElement('aside',null,createElement('span',{id:'first'},'First'),createElement('span',{id:'second'},'Second'),createElement('p',{'aria-labelledby':'first second'},'Accessible note.'));
  const result=await build(source('## Content\n\n<Accessible />'),{format:'mdx',componentsRevision:'accessible-1',components:{Accessible}});
  assert.match(result.fragments.terms,/aria-labelledby="nb-terms-authored-first nb-terms-authored-second"/);
  await assert.rejects(build(source(undefined).replace('title: Sample terms','title: !!str Sample terms')),/frontmatter/);
});

test('rendered projection retains tables, list boundaries, link targets and image alternatives, with mobile table containment',async()=>{
  const text=source('## Details\n\n- First\n- Second\n\n| Purpose | Duration |\n| --- | --- |\n| Example | 7 days |\n\n[Privacy](/privacy)\n\n![Fictional mark](/assets/mark.svg)');
  const b=await build(text);assert.match(b.fragments.terms,/nb-table-scroll/);assert.match(b.fragments.terms,/loading="lazy"/);
  const model=b.artifact.documents.terms.sections[0].paragraphs[0];for(const part of ['• First','• Second','Purpose','Duration','7 days','Privacy (/privacy)','Fictional mark'])assert.ok(model.includes(part),part);
});

test('generated privacy addenda preserve inventory and remap authored fragment links consistently',async()=>{
  const config=await fixture({reviewed:true});const text=source('## More details\n\nAdditional information. [Read here](#details).','sectionIds:\n  More details: details\n').replace('kind: terms','kind: privacy').replace('title: Sample terms','title: Sample privacy').replace('route: /terms','route: /privacy').replace('version: "one"','source: generated\nversion: "one"');
  const b=await compileAuthoredDocuments(config,{privacy:{format:'md',source:text}});assert.match(b.fragments.privacy,/What we collect and why/);assert.match(b.fragments.privacy,/id="nb-privacy-section-additional-details"/);assert.match(b.fragments.privacy,/href="#nb-privacy-section-additional-details"/);
});

test('archive registration requires exact declared private attachments and prevents public-first or conflicting later source writes',async()=>{
  const b=await build(source(undefined,'# source-only-note\n'));const storage=createSyntheticStorage([]);
  await assert.rejects(recordLegalRelease(storage,b.artifact),/source attachments/);
  for(const archive of [{...b.archive,sourceAttachments:{}},{...b.archive,sourceAttachments:{terms:{format:'md',source:'changed'}}},{...b.archive,sourceAttachments:{...b.archive.sourceAttachments,cookies:{format:'md',source:'extra'}}}])await assert.rejects(recordLegalRelease(storage,archive));
  const result=await recordLegalRelease(storage,b.archive);assert.equal(result.created,true);assert.equal((await recordLegalRelease(storage,b.archive)).created,false);
  const history=createDocumentHistory(storage);const page=await history.list(query);assert.equal(JSON.stringify(page).includes('source-only-note'),false);assert.equal(JSON.stringify(page).includes('renderedBodies'),false);
  const saved=await history.getSource(result.id,'terms');assert.equal(saved.data.source,b.archive.sourceAttachments.terms.source);
});

test('terms evidence binds the rich rendered version after full private archive validation',async()=>{
  const b=await build(source('## A supplied term\n\n<Notice>Fictional term only.</Notice>'),{format:'mdx',componentsRevision:'notice-1',components:{Notice:({children})=>createElement('aside',{className:'policy-note'},children)}});
  const storage=createSyntheticStorage([]);await recordLegalRelease(storage,b.archive);
  const offer=createTermsOffer(b.artifact,{scopeId:'signup',statement:'I agree to the sample terms.',actionLabel:'Record sample agreement'});const context={siteId:b.publicConfig.site.id,scopeId:offer.scopeId,subjectId:'fictional-subject',operationId:'fictional-operation'};
  await registerTermsOffer(storage,offer,context);await setActiveTermsOffer(storage,offer.offerId,context);const receipt=await recordTermsAcceptance(storage,{schemaVersion:1,offerId:offer.offerId,requestId:crypto.randomUUID(),accepted:true},context);assert.equal(receipt.documentSha256,offer.document.sha256);
});

test('explicit local file reading preserves BOM/newlines and keeps filenames out of public artifacts',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'notabenda-authoring-'));try{
    const file=join(directory,'private-input-name.md');const bytes='\uFEFF'+source().replaceAll('\n','\r\n');await writeFile(file,bytes);
    const input=await readDocumentSource(file);assert.equal(input.source,bytes);const b=await build(input.source);assert.equal(Object.values(b.files).some(value=>value.includes('private-input-name')),false);
    await writeFile(file,Buffer.from([0xff,0xfe]));await assert.rejects(readDocumentSource(file),/UTF-8/);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('private source routes authorize before storage, validate references, escape MDX and compare source separately from output',async()=>{
  const first=await build(source('## Content\n\nLiteral `<script>alert(1)</script>`.', '# before\n'));
  const next=await build(source('## Content\n\nLiteral `<script>alert(1)</script>`.', '# after\n'));
  const storage=createSyntheticStorage([]);await recordLegalRelease(storage,first.archive);await recordLegalRelease(storage,next.archive);
  const history=createDocumentHistory(storage);let reads=0;let allow=false;
  const worker=createAdminWorker({authorize(){return allow?{store:{...history,async getSource(...args){reads++;return history.getSource(...args);}}}:null;}});
  const url=path=>new Request(`https://example.test/admin/notabenda/${path}`);
  const route=`source?id=${first.manifest.artifactId}&kind=terms`;
  assert.equal((await worker.fetch(url(route),{})).status,403);assert.equal(reads,0);allow=true;
  for(const path of ['source?id=../other&kind=terms',route+'&kind=terms',route+'&scope=other','source-diff?before='+first.manifest.artifactId+'&kind=terms'])assert.equal((await worker.fetch(url(path),{})).status,400);
  assert.equal(reads,0);const response=await worker.fetch(url(route),{});assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/default-src 'none'/);assert.match(response.headers.get('cache-control'),/no-store/);
  const html=await response.text();assert.match(html,/&lt;script&gt;alert/);assert.doesNotMatch(html,/<script/);assert.match(html,/# before/);
  const diff=await worker.fetch(url(`source-diff?before=${first.manifest.artifactId}&after=${next.manifest.artifactId}&kind=terms`),{});assert.equal(diff.status,200);assert.match(await diff.text(),/Authored source changed\. Rendered document body unchanged\./);
  const rendered=await worker.fetch(url(`diff?before=${first.manifest.artifactId}&after=${next.manifest.artifactId}&kind=terms`),{});assert.match(await rendered.text(),/Compare retained source/);
  const detail=await worker.fetch(url(`record?id=${first.manifest.artifactId}`),{});assert.match(await detail.text(),/terms source/);
  const head=await worker.fetch(new Request(url(route),{method:'HEAD'}),{});assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal((await worker.fetch(url(`source?id=${first.manifest.artifactId}&kind=privacy`),{})).status,404);
});

test('source comparison separates distant changes, handles insertions/deletions and bounds pathological input',()=>{
  const lines=Array.from({length:30},(_,i)=>`Line ${i+1}`);const changed=[...lines];changed[2]='New version';changed[24]='New provision';
  const result=sourceDiff(lines.join('\n'),changed.join('\n'));assert.equal(result.ranges.length,2);assert.equal(result.precise,true);assert.equal(result.ranges[0].beforeStart,1);assert.equal(result.ranges[1].afterStart,23);
  assert.ok(result.ranges[0].after.includes('New version'));assert.ok(result.ranges[1].after.includes('New provision'));
  assert.ok(sourceDiff('A\nB\nC','A\nExtra\nB\nC').ranges[0].after.includes('Extra'));
  assert.ok(sourceDiff('A\nExtra\nB','A\nB').ranges[0].before.includes('Extra'));
  assert.deepEqual(sourceDiff('A\r\nB','A\nB').ranges,[]);
  const large=sourceDiff('A\n'.repeat(1000),'B\n'.repeat(1000));assert.equal(large.precise,false);assert.equal(large.ranges.length,1);
});
