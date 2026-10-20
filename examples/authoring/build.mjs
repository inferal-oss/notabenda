// @requirements REQ-PRODUCT-AUTHORED-PREVIEW
import {createAuthoredReleasePreview} from '@notabenda/authoring/preview';
// @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-RETAINED-RELEASES
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {createRetainedReleaseFiles} from '@notabenda/core/content';
import {compileAuthoredDocuments,readDocumentSource} from '@notabenda/authoring';

export async function authoringExample() {
  const config=JSON.parse(await readFile(new URL('../static/notabenda.config.json',import.meta.url),'utf8'));
  config.site.id='juniper-authored';
  for(const [kind,document] of Object.entries(config.documents))document.route=`/authored/${kind}`;
  const components={PolicyNote:({title,children})=>createElement('aside',{className:'policy-note'},createElement('h3',null,title),children)};
  const terms=await readDocumentSource(new URL('./terms.mdx',import.meta.url),{components,componentsRevision:'policy-note-1'});
  const cookies=await readDocumentSource(new URL('./cookies.md',import.meta.url));
  const first=await compileAuthoredDocuments(config,{terms,cookies},{mode:'preview'});
  const revised={...terms,source:terms.source.replace('"sample-1"','"sample-2"').replace('we use them only to provide the space you asked for.','we use them only to provide the space you asked for. You can export your notes before leaving.')};
  const latest=await compileAuthoredDocuments(config,{terms:revised,cookies},{mode:'preview'});
  const preview=await createAuthoredReleasePreview(latest,{mode:'preview',initialDocument:'terms'});
  const previewFiles=Object.fromEntries(Object.entries(preview.files).map(([path,value])=>['authored/preview/'+path,value]));
  const releases=[{artifact:first.archive,metadata:{recordedAt:'2026-10-18T11:00:00Z',changeNote:'Initial fictional Markdown and MDX authoring example.'}},{artifact:latest.archive,metadata:{recordedAt:'2026-10-18T12:00:00Z',changeNote:'Clarify the fictional note export provision.'}}];
  return {files:{...latest.files,...previewFiles,...createRetainedReleaseFiles([first.artifact],{siteId:config.site.id,mode:'preview'})},releases,first,latest};
}
