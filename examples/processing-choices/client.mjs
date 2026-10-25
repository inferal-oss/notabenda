import {demoSessionEnded} from '/assets/demo-session.mjs';
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
import {createConsent,createProcessingChoices,mountControls,mountProcessingChoices,ProcessingChoicesError} from '/assets/runtime/index.js';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;
let consent,processing;
async function json(path,options){const response=await fetch(path,{cache:'no-store',...options,headers:{...options?.headers,'X-Notabenda-Demo-Generation':generation??''}});if(!response.ok){const value=await response.json().catch(()=>({}));if(demoSessionEnded(value)||response.status===410&&value.code==='context-retired')throw new ProcessingChoicesError('context-retired');throw new Error('Example unavailable.');}return response.json();}
try{
  const [runtime,notice,initial]=await Promise.all([json('/processing-choices/consent.json'),json('/processing-choices/notice.json'),json('/demo/processing/head')]);
  processing=createProcessingChoices(notice,{streamRef:initial.streamRef,allowPreview:true,read:({signal})=>json('/demo/processing/head',{signal}),submit:(request,{signal})=>json('/demo/processing/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(request)})});
  consent=createConsent(runtime,undefined,{processingChoices:processing});let requests=0;
  for(const service of runtime.inventory.consent.services)consent.registerService(service.id,{purposes:runtime.inventory.services.find(s=>s.id===service.id).purposeIds,async start({signal}){
    if(signal.aborted)return ()=>{};requests++;
    try{const response=await fetch('/processing-choices/sample.json?service='+service.id,{signal,cache:'no-store'});if(!response.ok)throw new Error('Sample unavailable.');}catch(error){if(!signal.aborted)throw error;}
    return ()=>{};
  }});
  mountProcessingChoices(document.querySelector('#processing-controls'),processing);document.querySelector('[data-processing-fallback]').remove();
  mountControls(document.querySelector('#privacy-controls'),{consent});
  consent.subscribe(state=>{
    document.querySelector('[data-processing-cookie]').textContent=state.permissions['optional-features']?'Allowed':'Off — waiting for permission';
    for(const node of document.querySelectorAll('[data-processing-service]'))node.textContent=state.services[node.dataset.processingService]+(state.servicePermissions[node.dataset.processingService]?' · eligible':' · not eligible');
    document.querySelector('[data-processing-requests]').textContent=String(requests);
    document.querySelector('[data-processing-revision]').textContent=String(state.processingChoices.revision);
  });
}catch{consent?.destroy();processing?.destroy();const message=document.querySelector('[data-processing-fallback]');if(message)message.textContent='Controls unavailable. Optional services stay off. Reload to try again.';}
