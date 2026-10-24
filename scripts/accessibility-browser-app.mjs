// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-LOCALIZATION
// Browser entry for the local maintainer fixture, never a production asset.
const scenarios=await fetch('./scenarios.json').then(r=>r.json());
const picker=document.querySelector('#scenario'),frame=document.querySelector('iframe'),status=document.querySelector('[role=status]'),report=document.querySelector('textarea'),button=document.querySelector('#run-one'),layout=document.querySelector('#layout'),results=[];
for(const [index,s] of scenarios.entries())picker.add(new Option(s.label,String(index)));
const widthPicker=document.querySelector('#frame-width'),heightPicker=document.querySelector('#frame-height');
let current=0,runId,expectedRoute,pending=null;
heightPicker.addEventListener('change',()=>{
 if(!['850','600','320'].includes(heightPicker.value))return;
 frame.style.height=heightPicker.value+'px';load(current);
});
widthPicker.addEventListener('change',()=>{
 const width=widthPicker.value;if(!['auto','320','390','1280'].includes(width))return;
 frame.style.boxSizing=width==='auto'?'border-box':'content-box';
 frame.style.width=width==='auto'?'100%':width+'px';
 load(current);
});
function load(index){
 current=index;runId=crypto.randomUUID();pending=null;button.disabled=true;picker.disabled=false;widthPicker.disabled=false;heightPicker.disabled=false;
 layout.textContent='No layout measurement for this scenario yet.';
 const url=new URL(scenarios[index].url,location.href);expectedRoute=url.pathname+url.search;url.searchParams.set('auditRun',runId);
 frame.src=url.href;status.textContent='Loading '+scenarios[index].label;
}
picker.addEventListener('change',()=>load(Number(picker.value)));
button.addEventListener('click',()=>{
 if(button.disabled||pending)return;
 pending=crypto.randomUUID();button.disabled=true;picker.disabled=true;widthPicker.disabled=true;heightPicker.disabled=true;status.textContent='Checking '+scenarios[current].label;
 frame.contentWindow.postMessage({type:'run-accessibility-audit',runId,requestId:pending},location.origin);
});
window.addEventListener('message',e=>{
 const data=e.data;
 if(e.source!==frame.contentWindow||e.origin!==location.origin||data?.runId!==runId||data?.url!==expectedRoute)return;
 if(data.type==='accessibility-ready'&&!pending){button.disabled=false;status.textContent='Ready: '+scenarios[current].label;}
 if(data.type!=='accessibility-result'||!pending||data.requestId!==pending)return;
 pending=null;const result={scenario:scenarios[current],requestedWidth:widthPicker.value,requestedHeight:heightPicker.value,...data},previous=results.findIndex(r=>r.scenario.label===result.scenario.label&&r.requestedWidth===result.requestedWidth&&r.requestedHeight===result.requestedHeight);
 if(previous<0)results.push(result);else results[previous]=result;
 report.textContent=JSON.stringify({environment:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},results},null,2);
 const {width,height}=data.viewport??{},{documentWidth,clientWidth}=data.layout??{};
 layout.textContent=!data.error&&[width,height,documentWidth,clientWidth].every(n=>Number.isSafeInteger(n)&&n>0)?
  `Last checked frame: ${width} × ${height} CSS px. Page width: ${documentWidth} px; available: ${clientWidth} px. `+(documentWidth>clientWidth?`Horizontal overflow: ${documentWidth-clientWidth} px.`:'No horizontal overflow measured.'):
  'Layout measurements were not available for this result.';
 document.querySelector('#summary').textContent=results.length+' scenarios checked; '+results.reduce((n,r)=>n+(r.violations?.length??0),0)+' violations; '+results.filter(r=>r.error).length+' errors; '+results.reduce((n,r)=>n+(r.incomplete?.length??0),0)+' incomplete rule results.';
 status.textContent='Checked '+scenarios[current].label;button.disabled=false;picker.disabled=false;widthPicker.disabled=false;heightPicker.disabled=false;
});
load(0);
