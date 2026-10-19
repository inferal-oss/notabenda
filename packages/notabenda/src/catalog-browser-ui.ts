/** @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE */
import {analyzeBrowserCatalogCapture} from './catalog-browser-policy.js';
/** Local, text-only review of an exact reported rule snapshot. No capture, storage or network action. */
export function mountBrowserCatalogReview(container:HTMLElement,input:unknown):{destroy():void} {
 const report=analyzeBrowserCatalogCapture(input),doc=container.ownerDocument;
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const element=doc.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
 const root=node('section');root.className='nb-discovery-catalog';const title=node('h3','Catalog candidates');root.append(title,node('p','Technical patterns and partial hints from this capture. Confirm actual use, settings and purposes separately; a match does not prove that a service ran.'));
 const toolbar=node('div');toolbar.className='nb-discovery-catalog-filters';const label=node('label','Find a provider or product'),query=node('input');query.type='search';query.maxLength=120;query.placeholder='Name, product or rule ID';label.append(query);toolbar.append(label);
 const statusLabel=node('label','Pattern result'),filter=node('select');for(const [value,title] of [['all','All candidates'],['matched','Reported matches'],['partial','Partial hints']]){const option=node('option',title);option.value=value!;filter.append(option);}statusLabel.append(filter);toolbar.append(statusLabel);root.append(toolbar);
 const count=node('p');count.setAttribute('role','status');root.append(count);const cards=node('div');cards.className='nb-discovery-catalog-cards';root.append(cards);
 function draw(){cards.replaceChildren();const words=query.value.toLocaleLowerCase('en').trim().split(/\s+/u).filter(Boolean),matches=report.findings.filter(f=>(filter.value==='all'||f.status===filter.value)&&words.every(word=>[f.providerName,f.productName,f.productId,...f.rules.map(r=>r.id)].join(' ').toLocaleLowerCase('en').includes(word)));
  for(const finding of matches.slice(0,40)){
   const card=node('article');card.className='nb-discovery-catalog-card';const eyebrow=node('p',finding.providerName+' · '+(finding.status==='matched'?'Reported pattern match':'Partial hint'));eyebrow.className='nb-discovery-catalog-eyebrow';card.append(eyebrow,node('h4',finding.productName),node('p','Product ID: '+finding.productId));
   for(const result of finding.rules){const rule=report.capture.ruleSet.rules.find(r=>r.id===result.id)!,details=node('details'),summary=node('summary',result.id+' · '+(result.status==='matched'?'conditions reported':'conditions incomplete'));details.append(summary,node('p',rule.explanation));const groups=node('ul');for(const group of result.groups)groups.append(node('li',`${group.observed.length} of ${group.allOf.length} conditions reported: ${group.allOf.join(' + ')}${group.matched?' · group satisfied':''}`));details.append(groups);
    const witnesses=node('ul');for(const evidence of result.evidence)witnesses.append(node('li',`${evidence.signalId} · ${evidence.channel} ×${evidence.count}`));details.append(witnesses);
    for(const caveat of rule.caveats)details.append(node('p',caveat));
    const sources=node('div');sources.className='nb-discovery-catalog-sources';sources.append(node('p',`Rule revision ${rule.revision}. Snapshot ${report.capture.ruleSet.id} / ${report.capture.ruleSet.revision}. Source metadata is self-reported, not authenticated.`));
    for(const source of report.capture.ruleSet.catalog.sources.filter(s=>rule.sourceIds.includes(s.id))){const a=node('a',source.id+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a,node('p',`${source.access==='read'?'Recorded source check '+source.checkedOn:'Reference only; not retrieved'} · ${source.revision}`));}details.append(sources);card.append(details);
   }
   cards.append(card);
  }
  count.textContent=`Showing ${Math.min(40,matches.length)} of ${matches.length} matching candidates. Each needs actual-use review.`;
  if(!matches.length)cards.append(node('p','No catalog candidates in this view. Limited, unavailable or missing observations do not establish absence of tracking.'));
 }
 query.addEventListener('input',draw);filter.addEventListener('change',draw);draw();
 const limits=node('details');limits.append(node('summary','Recognition coverage and interpretation'));limits.append(node('p',`Capture mode: ${report.capture.mode}. Matcher coverage: ${report.capture.coverage.matching}. Own globals: ${report.capture.coverage.globals}. Oversized URLs skipped: ${report.capture.omitted.oversizedUrls}. Accessor globals skipped: ${report.capture.omitted.accessorGlobals}.`));for(const note of report.notes)limits.append(node('p',note));root.append(limits);container.append(root);return {destroy(){root.remove();}};
}
