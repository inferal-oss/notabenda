// @requirements REQ-PRODUCT-A11Y
// Browser entry for the local maintainer fixture, never a production asset.
const scenarios=await fetch('./scenarios.json').then(r=>r.json());
const picker=document.querySelector('select'),frame=document.querySelector('iframe'),status=document.querySelector('[role=status]'),report=document.querySelector('textarea'),button=document.querySelector('#run-one'),results=[];
for(const [index,s] of scenarios.entries())picker.add(new Option(s.label,String(index)));
let current=0,runId,expectedRoute,pending=null;
function load(index){
 current=index;runId=crypto.randomUUID();pending=null;button.disabled=true;picker.disabled=false;
 const url=new URL(scenarios[index].url,location.href);expectedRoute=url.pathname+url.search;url.searchParams.set('auditRun',runId);
 frame.src=url.href;status.textContent='Loading '+scenarios[index].label;
}
picker.addEventListener('change',()=>load(Number(picker.value)));
button.addEventListener('click',()=>{
 if(button.disabled||pending)return;
 pending=crypto.randomUUID();button.disabled=true;picker.disabled=true;status.textContent='Checking '+scenarios[current].label;
 frame.contentWindow.postMessage({type:'run-accessibility-audit',runId,requestId:pending},location.origin);
});
window.addEventListener('message',e=>{
 const data=e.data;
 if(e.source!==frame.contentWindow||e.origin!==location.origin||data?.runId!==runId||data?.url!==expectedRoute)return;
 if(data.type==='accessibility-ready'&&!pending){button.disabled=false;status.textContent='Ready: '+scenarios[current].label;}
 if(data.type!=='accessibility-result'||!pending||data.requestId!==pending)return;
 pending=null;const result={scenario:scenarios[current],...data},previous=results.findIndex(r=>r.scenario.label===result.scenario.label);
 if(previous<0)results.push(result);else results[previous]=result;
 report.textContent=JSON.stringify({environment:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},results},null,2);
 document.querySelector('#summary').textContent=results.length+' scenarios checked; '+results.reduce((n,r)=>n+(r.violations?.length??0),0)+' violations; '+results.filter(r=>r.error).length+' errors; '+results.reduce((n,r)=>n+(r.incomplete?.length??0),0)+' incomplete rule results.';
 status.textContent='Checked '+scenarios[current].label;button.disabled=false;picker.disabled=false;
});
load(0);
