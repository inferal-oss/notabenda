/** @requirements REQ-PRODUCT-DISCOVERY REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE */
import {analyzeDiscovery,captureDiscovery} from './discovery.js';
import type {DiscoveryCapture,DiscoveryReport} from './discovery.js';
import {toPublicConfig} from './config.js';
export interface DiscoveryUiOptions {config:unknown;captureOrigin?:string;routeLabel?:string;scenario?:string;capture?:(labels:{routeLabel:string;scenario:string})=>DiscoveryCapture}
export interface MountedDiscovery {getReport():DiscoveryReport|undefined;destroy():void}
let instance=0;
/** Developer/operator tool. No automatic capture, requests, browser persistence or uploads. */
export function mountDiscovery(container:HTMLElement,options:DiscoveryUiOptions):MountedDiscovery {
 const config=toPublicConfig(options.config,{mode:'preview'}),doc=container.ownerDocument,prefix=`nb-discovery-${++instance}`;
 const element=<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string,text?:string):HTMLElementTagNameMap[K]=>{const node=doc.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
 const root=element('section','nb-discovery'),title=element('h2',undefined,'Take a closer look.');title.id=prefix+'-title';root.setAttribute('aria-labelledby',title.id);
 const intro=element('p','nb-discovery-intro','Capture what this document currently exposes, then compare it with your declared inventory. Nothing is scanned until you ask.');
 const form=element('form','nb-discovery-form');
 function field(name:string,label:string,value:string,max:number){const group=element('div'),labelNode=element('label',undefined,label),input=element('input');input.id=prefix+'-'+name;input.name=name;input.maxLength=max;input.required=true;input.value=value;labelNode.htmlFor=input.id;group.append(labelNode,input);return {group,input};}
 const route=field('route','Route label',options.routeLabel??'Current page',120),scenario=field('scenario','Scenario label',options.scenario??'Initial load',80);
 const take=element('button','nb-choice-button','Capture and review');take.type='submit';
 const clear=element('button','nb-text-button','Clear this review');clear.type='button';
 const actions=element('div','nb-discovery-actions');actions.append(take,clear);form.append(route.group,scenario.group,actions);
 const scope=element('p','nb-discovery-caveat','Labels describe your test; they do not isolate requests. The resource buffer can include earlier activity and cached or aborted fetches. Use a fresh context for each scenario.');
 const status=element('p','nb-discovery-status');status.setAttribute('role','status');status.textContent='Ready for an explicit capture.';
 const result=element('div','nb-discovery-result');result.hidden=true;
 root.append(title,intro,form,scope,status,result);container.append(root);
 let report:DiscoveryReport|undefined,destroyed=false;const urls:string[]=[];
 const urlApi=doc.defaultView?.URL;
 function revoke(){for(const url of urls)try{urlApi?.revokeObjectURL(url);}catch{/* Releasing a preview must not write browser data. */}urls.length=0;}
 function reset(){revoke();report=undefined;result.replaceChildren();result.hidden=true;status.textContent='Review cleared. Page activity and stored data were not changed.';}
 function invalidate(){if(report){reset();status.textContent='Labels changed. Capture again to create a current review.';}}
 route.input.addEventListener('input',invalidate);scenario.input.addEventListener('input',invalidate);clear.addEventListener('click',reset);
 form.addEventListener('submit',event=>{event.preventDefault();if(destroyed)return;revoke();report=undefined;result.replaceChildren();result.hidden=true;
  try{
   const labels={routeLabel:route.input.value.trim(),scenario:scenario.input.value.trim()};
   const view=doc.defaultView;
   const raw=options.capture?options.capture(labels):captureDiscovery(labels,{document:doc,...(view?{performance:view.performance,localStorage:()=>view.localStorage,sessionStorage:()=>view.sessionStorage}:{}),cookies:()=>doc.cookie});
   const current=analyzeDiscovery(config,[raw],options.captureOrigin===undefined?{}:{captureOrigin:options.captureOrigin}),capture=current.captures[0]!;report=current;
   const stats=element('dl','nb-discovery-stats');
   for(const [label,value] of [['Observation groups',current.findings.length],['Unmapped groups',current.unmappedCount],['Captures',1]] as const){const group=element('div');group.append(element('dt',undefined,label),element('dd',undefined,String(value)));stats.append(group);}
   const coverage=element('details','nb-discovery-coverage');coverage.append(element('summary',undefined,'Readability and capture limits'));const coverageList=element('dl');
   for(const [key,value] of Object.entries(capture.coverage)){const group=element('div');group.append(element('dt',undefined,key),element('dd',undefined,value));coverageList.append(group);}
   coverage.append(coverageList,element('p',undefined,`Omitted non-HTTP references: ${capture.omitted.nonHttpReferences}. Omitted long or invalid names: ${capture.omitted.oversizedNames}. “Available” means this API could be read; it never means complete visibility.`));
   const downloads=element('div','nb-discovery-downloads');
   let downloadable=true;
   try{for(const [label,file,value] of [['Download capture','notabenda-capture.json',capture],['Download private review','notabenda-discovery-review.json',current]] as const){if(!urlApi?.createObjectURL)throw new Error();const blob=new (doc.defaultView?.Blob??Blob)([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});const url=urlApi.createObjectURL(blob);urls.push(url);const link=element('a','nb-discovery-download',label);link.href=url;link.download=file;downloads.append(link);}}
   catch{downloadable=false;revoke();downloads.replaceChildren(element('p',undefined,'Downloads are unavailable in this browser. The review is still shown below.'));}
   const filters=element('div','nb-discovery-filters'),searchGroup=element('div'),searchLabel=element('label',undefined,'Find observations'),search=element('input');search.type='search';search.id=prefix+'-search';search.placeholder='Origin, name, service or purpose';searchLabel.htmlFor=search.id;searchGroup.append(searchLabel,search);
   const kindGroup=element('div'),kindLabel=element('label',undefined,'Observation type'),kind=element('select');kind.id=prefix+'-kind';kindLabel.htmlFor=kind.id;
   for(const [value,label] of [['all','All types'],['network','Resource entries'],['reference','DOM references'],['storage','Storage names']]){const option=element('option',undefined,label);option.value=value!;kind.append(option);}kindGroup.append(kindLabel,kind);
   const onlyLabel=element('label','nb-discovery-unmapped'),only=element('input');only.type='checkbox';onlyLabel.append(only,doc.createTextNode('Unmapped only'));filters.append(searchGroup,kindGroup,onlyLabel);
   const list=element('div','nb-discovery-findings'),filteredCount=element('p','nb-discovery-filter-count');filteredCount.setAttribute('role','status');
   function drawFindings(){
    const words=search.value.toLocaleLowerCase('en').trim().split(/\s+/u).filter(Boolean);
    const matches=current.findings.filter(finding=>{const haystack=[finding.origin,finding.label,finding.storageType,...finding.candidateServiceIds,...finding.candidatePurposeIds].filter(Boolean).join(' ').toLocaleLowerCase('en');return (kind.value==='all'||finding.kind===kind.value)&&(!only.checked||finding.mapping==='unmapped')&&words.every(word=>haystack.includes(word));});
    list.replaceChildren();
    for(const finding of matches.slice(0,60)){const card=element('article','nb-discovery-finding'),heading=element('h3',undefined,finding.kind==='storage'?finding.label:finding.origin),badge=element('span','nb-discovery-badge',finding.mapping==='unmapped'?'Review mapping':'Candidate match');
     const top=element('div','nb-discovery-finding-top');top.append(element('span',undefined,`${finding.kind} · ${finding.storageType??finding.label}`),badge);
     card.append(top,heading,element('p',undefined,`${finding.count} observed · ${finding.relation}. ${finding.candidateServiceIds.length?'Candidate services: '+finding.candidateServiceIds.join(', '):'No declared origin/name match. Investigate the actual owner and purpose.'}`));
     if(finding.candidatePurposeIds.length)card.append(element('p',undefined,'Declared purpose candidates: '+finding.candidatePurposeIds.join(', ')));
     card.append(element('p','nb-discovery-refs',finding.requirementIds.join(' · ')));list.append(card);
    }
    filteredCount.textContent=`Showing ${Math.min(60,matches.length)} of ${matches.length} matching groups. Filters change this view; downloads keep the full capture and review.`;
    if(!matches.length)list.append(element('p',undefined,'No matching groups in this view. This does not establish absence of tracking.'));
   }
   search.addEventListener('input',drawFindings);kind.addEventListener('change',drawFindings);only.addEventListener('change',drawFindings);drawFindings();
   const notes=element('details','nb-discovery-notes');notes.append(element('summary',undefined,'What this review can and cannot tell you'));const noteList=element('ul');for(const text of current.reviewNotes)noteList.append(element('li',undefined,text));notes.append(noteList);
   result.append(element('p','nb-discovery-caveat',`Observed origin: ${current.observedOrigin}. Configured deployment: ${current.configuredOrigin}. Reported capture time: ${capture.capturedAt}.`),stats,downloads,element('p','nb-discovery-caveat','Origin and exact-name matches are candidates for investigation. They do not establish a legal purpose, necessity, exemption or permission. Names and labels may still be sensitive; review downloads before sharing.'),coverage,filters,filteredCount,list);
   if(!current.findings.length)result.append(element('p',undefined,'No observations returned. This does not establish absence of tracking. Check API readability and inspect the network separately.'));
   result.append(notes);result.hidden=false;status.textContent=`Capture ready: ${current.findings.length} observation groups, ${current.unmappedCount} unmapped.${downloadable?' Downloads stay in this browser.':''}`;
  }catch{revoke();report=undefined;result.replaceChildren();result.hidden=true;status.textContent='Capture could not be reviewed. Check the labels, browser access and configured site origin. No current download is available.';}
 });
 return {getReport(){return report?JSON.parse(JSON.stringify(report)) as DiscoveryReport:undefined;},destroy(){if(destroyed)return;destroyed=true;revoke();report=undefined;root.remove();}};
}
