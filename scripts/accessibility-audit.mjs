// @requirements REQ-PRODUCT-A11Y
// Maintainer-only semantic checks. JSDOM supplies no layout, contrast or native dialog behavior.
import {JSDOM,VirtualConsole} from 'jsdom';
import axe from 'axe-core';
export const accessibilityTags=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'];
export const excludedSemanticRules=['color-contrast','label-content-name-mismatch'];
export const accessibilityOptions={runOnly:{type:'tag',values:accessibilityTags},rules:Object.fromEntries(excludedSemanticRules.map(id=>[id,{enabled:false}]))};
const summarize=items=>Array.from(items,({id,impact,help,helpUrl,nodes})=>({id,impact,help,helpUrl,nodes:Array.from(nodes,n=>({target:n.target,html:n.html,summary:n.failureSummary??null,reasons:Array.from(n.any).concat(Array.from(n.all),Array.from(n.none)).filter(c=>c.message).map(c=>c.message)}))}));

/** Explicit fixture only. Page scripts, resource loads and project modules do not run. */
export async function createAccessibilityAudit(html,{url='https://example.test/',label='fixture'}={}){
 const warnings=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>warnings.push(e.message));
 const dom=new JSDOM(html,{runScripts:'outside-only',url,virtualConsole});
 dom.window.eval(axe.source);
 return {dom,async scan(){
  const document=dom.window.document;
  const result=await dom.window.axe.run(document,accessibilityOptions);
  // Direct structural checks cover facts that axe can mark incomplete without layout APIs.
  const structural=[];
  const mains=document.querySelectorAll('main,[role="main"]');
  if(mains.length!==1)structural.push({id:'single-main',message:'Provide one main landmark.',count:mains.length});
  if(!document.querySelector('h1,[role="heading"][aria-level="1"]'))structural.push({id:'page-heading',message:'Provide a page heading.'});
  for(const link of document.querySelectorAll('a.nb-skip-link,a.skip')){
   const href=link.getAttribute('href')??'';let id;try{id=decodeURIComponent(href.slice(1));}catch{}
   const targets=[...document.querySelectorAll('[id]')].filter(node=>node.id===id);
   if(!href.startsWith('#')||!id||targets.length!==1||!mains[0]?.contains(targets[0])&&mains[0]!==targets[0])structural.push({id:'skip-target',message:'The skip link must reach a unique target in the main content.',href});
  }
  return {label,engine:{name:'axe-core',version:axe.version},environment:'jsdom-semantic-only',excludedRules:[...excludedSemanticRules],violations:summarize(result.violations),incomplete:summarize(result.incomplete),structural,warnings:[...warnings]};
 },close:()=>dom.window.close()};
}

export async function auditAccessibility(html,options){const audit=await createAccessibilityAudit(html,options);try{return await audit.scan();}finally{audit.close();}}
