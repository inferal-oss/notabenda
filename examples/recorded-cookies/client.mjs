// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CONSENT-NOTICE-FILES
import {createConsentRuntime,mountControls} from '@notabenda/core/consent';
import {requiredConsentEvidence,ConsentEvidenceError} from '@notabenda/core/consent/evidence';

const status=document.querySelector('#connection'),retry=document.querySelector('#connect'),preferences=document.querySelector('#preferences');
let consent,unmount,connecting=false,ended=false;
const statuses={checking:'Checking saved choices',saving:'Saving your choice',recorded:'Choice recorded',error:'Record unavailable; optional services stay off',review:'A fresh choice is needed',stale:'The notice changed; review your preferences',expired:'Your previous permission expired',unavailable:'Choice storage is unavailable',retired:'This preference record is retired',destroyed:'Preference controls disconnected',idle:'Waiting for a choice'};
export function disconnectRecordedCookies(){
  ended=true;unmount?.destroy();consent?.destroy();consent=undefined;preferences.disabled=true;retry.hidden=true;
  status.textContent='Your session changed. Reload this page to reconnect your cookie preferences.';
}
async function post(path,input={},streamRef,signal){
  const response=await fetch(path,{method:'POST',credentials:'same-origin',cache:'no-store',signal,headers:{'Content-Type':'application/json','X-Notabenda-Request':'1',...(streamRef?{'X-Notabenda-Stream':streamRef}:{})},body:JSON.stringify(input)});
  const value=await response.json();
  if(!response.ok){
    if(['context-changed','access-denied'].includes(value.code)&&consent)disconnectRecordedCookies();
    if(['revision-conflict','stale-notice','expired-command','context-retired'].includes(value.code))throw new ConsentEvidenceError(value.code);
    throw Error('Recording unavailable.');
  }
  return value;
}
async function connect(){
  if(connecting||consent||ended)return;connecting=true;retry.hidden=true;status.textContent='Connecting to preference records…';
  try{
    const {runtime,notice,head}=await post('/api/cookies/bootstrap');
    if(ended)return;
    let initial=head;
    consent=createConsentRuntime(runtime,undefined,{evidence:requiredConsentEvidence({notice,streamRef:head.streamRef,allowPreview:runtime.mode==='preview',
      read:({signal})=>{if(initial){const value=initial;initial=undefined;return Promise.resolve(value);}return post('/api/cookies/head',{},head.streamRef,signal);},
      write:(command,{signal})=>post('/api/cookies/record',command,head.streamRef,signal),
    })});
    for(const service of runtime.inventory.consent.services){
      const declared=runtime.inventory.services.find(s=>s.id===service.id),node=document.querySelector('[data-service="'+service.id+'"]');
      consent.registerService(service.id,{purposes:declared.purposeIds,start(){
        if(node)node.textContent='On';
        return ()=>{if(node)node.textContent='Off';};
      }});
    }
    consent.subscribe(state=>{status.textContent=statuses[state.evidence.status]??'Optional services stay off until a current choice is recorded.';});
    unmount=mountControls(document.querySelector('#controls'),{consent});preferences.disabled=false;
  }catch{
    if(!ended){unmount?.destroy();consent?.destroy();consent=undefined;preferences.disabled=true;status.textContent='Preference records are unavailable. Optional services remain off. Connect the host authorization hook or try again.';retry.hidden=false;}
  }finally{connecting=false;}
}
preferences.addEventListener('click',()=>consent?.openPreferences());retry.addEventListener('click',()=>void connect());
// The host must announce its own logout/account switch before changing application identity.
window.addEventListener('application-session-changed',disconnectRecordedCookies);
window.addEventListener('pagehide',event=>{if(!event.persisted){unmount?.destroy();consent?.destroy();}});
void connect();
