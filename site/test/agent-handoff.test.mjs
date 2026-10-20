// @requirements REQ-PRODUCT-AGENT-HANDOFF REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {createAccessibilityAudit} from '../../scripts/accessibility-audit.mjs';
import {mountPackConsole} from '@notabenda/core/packs/ui';
import {selectPacks,formatPackBrief} from '@notabenda/core/packs';
const root=new URL('../dist/public/',import.meta.url);
test('the public pack and setup graphs deliver the shared handoff without a brief download or authoring/backend code',async()=>{
 const html=await readFile(new URL('start/index.html',root),'utf8');assert.match(html,/<button type="button" data-cartridge-brief hidden disabled>Give to my agent<\/button>/);assert.doesNotMatch(html,/data-cartridge-brief[^>]*download/);
 const source=await readFile(new URL('assets/runtime/agent-handoff.js',root),'utf8');assert.match(source,/writeText/);assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon|createObjectURL|execCommand/);
 for(const entry of ['assets/runtime/cartridges-ui.js','assets/runtime/setup-ui.js']){const graph=await build({entryPoints:[new URL(entry,root).pathname],bundle:true,write:false,platform:'browser',metafile:true});assert.ok(Object.keys(graph.metafile.inputs).some(p=>p.endsWith('/agent-handoff.js')));assert.ok(Object.keys(graph.metafile.inputs).every(p=>!p.includes('notabenda-authoring')&&!p.includes('notabenda-cf')&&!p.includes('node:')));}
 for(const name of ['assets/notabenda.css','assets/cartridges.css']){const css=await readFile(new URL(name,root),'utf8');assert.match(css,/\.nb-agent-drawer/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/forced-colors/);}
});
test('the open public handoff and manual-copy fallback have accessible names and preserve the selected plan',async()=>{
 const audit=await createAccessibilityAudit(await readFile(new URL('start/index.html',root),'utf8'),{label:'Agent instruction drawer'}),d=audit.dom.window.document;
 audit.dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};audit.dom.window.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new audit.dom.window.Event('close'));};
 const selection=selectPacks(['privacy-pages','terms-agreement']),ui=mountPackConsole(d.querySelector('[data-cartridge-console]'),{cartridges:selection});
 try{
  const button=d.querySelector('[data-cartridge-brief]');button.focus();button.click();assert.equal(d.querySelector('.nb-agent-text').value,formatPackBrief(selection));
  for(const fallback of [false,true]){if(fallback){d.querySelector('.nb-agent-copy').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(d.querySelector('.nb-agent-select').hidden,false);}const result=await audit.scan();assert.deepEqual(result.violations,[]);assert.deepEqual(result.structural,[]);assert.deepEqual(result.warnings,[]);}
  d.querySelector('.nb-agent-close').click();assert.equal(d.activeElement,button);assert.equal(d.querySelector('dialog').open,false);
 }finally{ui.destroy();audit.close();}
});
