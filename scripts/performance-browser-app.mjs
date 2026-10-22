// @requirements REQ-PRODUCT-BUNDLE-BUDGET
import {measureConsent} from './measure.mjs';
const run=document.querySelector('#run'),status=document.querySelector('#status'),body=document.querySelector('#results'),stage=document.querySelector('#stage'),raw=document.querySelector('#report');
run.addEventListener('click',async()=>{
 run.disabled=true;body.replaceChildren();raw.textContent='Measurement in progress.';status.classList.remove('error');
 const report={schemaVersion:1,kind:'consent-browser-performance',environment:{userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},surfaceWidth:stage.clientWidth},results:[]};
 try{
  const data=await fetch('inventories.json').then(r=>{if(!r.ok)throw Error('Fixture inventories unavailable.');return r.json();});
  for(const inventory of data)for(const profile of ['compiled-local','compatibility']){
   status.textContent=`Measuring ${profile}: ${inventory.purposes} purposes, ${inventory.services} services…`;
   const {create,mountControls}=await import('./'+profile+'.mjs');
   const measurements=await measureConsent({create,input:profile==='compiled-local'?inventory.compiled:inventory.config,inventory:inventory.config,mount(controller){const widget=mountControls(stage,{consent:controller});return ()=>widget.destroy();},yieldTask:()=>new Promise(resolve=>setTimeout(resolve,0))});
   const result={profile,inventory:inventory.id,purposes:inventory.purposes,services:inventory.services,...measurements};report.results.push(result);
   const row=document.createElement('tr');
   for(const value of [`${profile} / ${inventory.purposes} / ${inventory.services}`,...['constructor','returningConstructor','grantedSnapshot','rejectCall','grantCall','mountOnce'].map(id=>result.phases[id].median.toFixed(3))]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}body.append(row);
  }
  raw.textContent=JSON.stringify(report,null,2);status.textContent='Complete · 6 profiles measured. All synthetic service lifecycles stopped.';
 }catch(error){status.classList.add('error');status.textContent='Measurement failed: '+error.message;raw.textContent=JSON.stringify({...report,error:error.message},null,2);}
 finally{run.disabled=false;}
});
