// @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE
import {producerGuaranteeFiles} from './product-build.mjs';
import {readFile} from 'node:fs/promises';
import {buildLegalGuaranteeNotice} from '@notabenda/core/guarantees/content';
import {renderLegalGuaranteeNotice} from '@notabenda/core/guarantees';
export async function guaranteeFiles(){
 const built=await buildLegalGuaranteeNotice({language:'en',reviewStatus:'draft',allowPreview:true}),files={...built.files,'assets/guarantees.css':await readFile(new URL('../../packages/notabenda/dist/guarantees.css',import.meta.url),'utf8')};
 for(const prefix of ['','/dark']){
  const path=prefix.slice(1)+(prefix?'/':'')+'guarantees';
  files[path+'/notice.json']=JSON.stringify(built.notice,null,2)+'\n';
  files[path+'/index.html']=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Legal guarantee notice · Juniper Notes</title><link rel="stylesheet" href="${prefix?'/assets/dark.css':'/assets/notabenda.css'}"><link rel="stylesheet" href="/assets/guarantees.css"></head><body class="nb-page"><header class="nb-site-header"><a href="/">Juniper Notes</a><span>Guarantee notice</span></header><main id="main" class="nb-document"><p class="nb-eyebrow">Notabenda · Consumer information</p><h1>Guarantee information<br>for your shop</h1><p>The official shop-level legal guarantee notice, with its wording available as readable text. The artwork keeps its own colours in either theme.</p>${renderLegalGuaranteeNotice(built.notice,{idPrefix:'shop-guarantee',allowPreview:true})}<section><h2>A shop notice, a product label</h2><p>This notice describes legal guarantee rights for goods. A qualifying producer durability guarantee uses a separate product-specific GARAN label.</p><p><a href="/guarantees/product/">View a product-specific label ↗</a></p><p><a href="/guide/guarantees">Integration and review guide ↗</a> · <a href="${prefix?'/guarantees':'/dark/guarantees'}">${prefix?'Light':'Midnight'} theme ↗</a></p><p>Source integrity is checked. Legal and linguistic review, the source colour discrepancy and production placement remain open.</p></section></main><footer class="nb-site-footer"><p>Official artwork © European Union, unchanged. Notabenda code is Apache-2.0.</p></footer></body></html>`;
 }
 return {...files,...await producerGuaranteeFiles()};
}
