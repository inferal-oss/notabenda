// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION REQ-PRODUCT-DEMO-WORKSPACE
import {demoSessionEnded} from '/assets/demo-session.mjs';
import {createConsent,createProcessingChoices,mountControls,mountProcessingChoices,ProcessingChoicesError} from '/assets/runtime/index.js';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;
let consent,processing,choicesUI,processingUI,stopped=false;
async function json(path,options){const response=await fetch(path,{cache:'no-store',...options,headers:{...options?.headers,'X-Notabenda-Demo-Generation':generation??''}});if(!response.ok){const value=await response.json().catch(()=>({}));if(demoSessionEnded(value)||response.status===410&&value.code==='context-retired')throw new ProcessingChoicesError('context-retired');throw Error('Não foi possível consultar as opções.');}return response.json();}
function stop(){if(stopped)return;stopped=true;processing?.destroy();consent?.destroy();processingUI?.destroy();choicesUI?.destroy();document.getElementById('count-interaction').disabled=true;}
window.addEventListener('pagehide',event=>{if(!event.persisted)stop();});
try{
 const [config,notice,initial]=await Promise.all([json('/localization/processing/site.json'),json('/localization/processing/notice.json'),json('/demo/processing/pt/head')]);
 if(!stopped){
  processing=createProcessingChoices(notice,{streamRef:initial.streamRef,allowPreview:true,read:({signal})=>json('/demo/processing/pt/head',{signal}),submit:(body,{signal})=>json('/demo/processing/pt/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(body)})});
  consent=createConsent(config,undefined,{processingChoices:processing});
  for(const service of config.consent.services)consent.registerService(service.id,{purposes:config.services.find(s=>s.id===service.id).purposeIds,start(){return ()=>{};}});
  document.querySelector('[data-processing-fallback]')?.remove();processingUI=mountProcessingChoices(document.getElementById('processing-controls'),processing);choicesUI=mountControls(document.getElementById('privacy-controls'),{consent});
  consent.subscribe(state=>{document.getElementById('suggestions-state').textContent=state.services.reading==='active'?'Disponíveis':'Bloqueadas';const on=state.services['reading-counter']==='active';document.getElementById('counter-state').textContent=on?'Disponível':'Desativado';document.getElementById('count-interaction').disabled=!on;});
  processing.subscribe(state=>{document.getElementById('processing-revision').textContent=state.status==='checking'?'Consultando…':String(state.revision);});
  let total=0;document.getElementById('count-interaction').addEventListener('click',()=>{if(!stopped&&consent.isAllowed('reading-count'))document.getElementById('counter-total').textContent=String(++total);});
 }
}catch{
 stop();const fallback=document.createElement('p');fallback.setAttribute('role','status');document.getElementById('processing-controls').replaceChildren(fallback);fallback.textContent='Não foi possível consultar as restrições. Os recursos opcionais permanecem desativados. Recarregue para tentar novamente.';
}
