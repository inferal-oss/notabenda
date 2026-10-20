// @requirements REQ-PRODUCT-COMPLIANCE-MAP REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {complianceViews,renderComplianceDiagram,complianceDiagramMarkdown,expandComplianceDiagrams} from '../compliance-diagrams.mjs';
const root=new URL('../dist/public/',import.meta.url);

test('responsibility maps have linked components, readable purposes and distinct legal/software views',async()=>{
 for(const [id,view] of Object.entries(complianceViews)){
  const dom=new JSDOM(renderComplianceDiagram(id,'first')+renderComplianceDiagram(id,'second')),d=dom.window.document;
  try{
   const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
   for(const fig of d.querySelectorAll('figure')){assert.ok(d.getElementById(fig.getAttribute('aria-labelledby')));assert.ok(d.getElementById(fig.getAttribute('aria-describedby')));}
   assert.equal(d.querySelector('script,form,input,button,iframe'),null);
   const componentIds=view.stages.flatMap(s=>s.nodes.map(n=>n.id));assert.equal(new Set(componentIds).size,componentIds.length);
   for(const n of view.stages.flatMap(s=>s.nodes)){
    const a=d.querySelector(`[data-component="${n.id}"]`);assert.equal(a.getAttribute('href'),n.guide);assert.ok(a.textContent.includes(n.purpose));
    assert.ok(complianceDiagramMarkdown(id).includes(n.purpose));await access(new URL(n.guide.slice(1)+'/index.html',root));
   }
  }finally{dom.window.close();}
 }
 assert.equal(complianceViews.compliance.stages.some(s=>s.nodes.some(n=>n.id==='durable')),false);
 assert.ok(complianceViews.storage.stages.some(s=>s.nodes.some(n=>n.id==='durable')));
 for(const bad of ['unknown','__proto__','constructor'])assert.throws(()=>renderComplianceDiagram(bad,'valid'));
 assert.throws(()=>renderComplianceDiagram('compliance','bad"id'));
});

test('diagram expansion preserves literal code and emits equivalent text-only responsibilities',()=>{
 const literal='```html\n<!-- notabenda:diagram compliance -->\n```',inline='`<!-- notabenda:diagram compliance -->`';
 const source=literal+'\n\n'+inline+'\n\n<!-- notabenda:diagram compliance -->\n\n<!-- notabenda:diagram storage -->';
 const html=expandComplianceDiagrams(source,{graphical:true}),plain=expandComplianceDiagrams(source);
 assert.ok(html.includes(literal));assert.ok(plain.includes(literal));assert.ok(html.includes(inline));assert.ok(plain.includes(inline));
 assert.equal((html.match(/<figure /gu)??[]).length,2);assert.doesNotMatch(plain,/<figure|<svg/u);
 for(const n of complianceViews.compliance.stages.flatMap(s=>s.nodes))assert.ok(plain.includes(`[${n.title}](${n.guide})`));
 assert.throws(()=>expandComplianceDiagrams('<!-- notabenda:diagram unknown -->'));
});

test('published guide placements keep the business map primary and storage separate',async()=>{
 const pages=[['guide/compliance-map/index.html','compliance'],['guide/guarantee-producer-example/index.html','purchase'],['guide/architecture/index.html','storage'],['guide/cloudflare-starter/index.html','storage']];
 for(const [path,view] of pages){
  const html=await readFile(new URL(path,root),'utf8'),d=new JSDOM(html).window.document;
  assert.equal(d.querySelectorAll(`[data-compliance-view="${view}"]`).length,1,path);assert.doesNotMatch(html,/<!-- notabenda:diagram/u);
  const text=await readFile(new URL(path.replace('index.html','index.md'),root),'utf8');assert.doesNotMatch(text,/<!-- notabenda:diagram/u);
  for(const n of complianceViews[view].stages.flatMap(s=>s.nodes))assert.ok(text.includes(n.purpose),n.id);
 }
 const central=new JSDOM(await readFile(new URL('guide/compliance-map/index.html',root),'utf8')).window.document;
 assert.equal(central.querySelector('[data-compliance-view="storage"]'),null);assert.ok(central.querySelector('a[href="/guide/architecture"]'));
 const hub=new JSDOM(await readFile(new URL('guide/index.html',root),'utf8')).window.document;assert.ok(hub.querySelector('.component-map-link a[href="/guide/compliance-map/"]'));
});
