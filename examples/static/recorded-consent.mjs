import {demoSessionEnded} from '/assets/demo-session.mjs';
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE
import {paintChoices} from '/assets/choices-status.mjs';
import {createConsent,mountControls} from '@notabenda/core/consent';
import {requiredConsentEvidence,ConsentEvidenceError} from '@notabenda/core/consent/evidence';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;if(!generation)throw new Error('Open the example through its demo session.');
const demoHeaders={'X-Notabenda-Demo-Generation':generation};
const [runtime,notice,initial]=await Promise.all(['/recorded-choices/consent.json','/recorded-choices/notice.json','/demo/choices/head'].map(async url=>{const response=await fetch(url,{cache:'no-store',headers:demoHeaders});if(!response.ok){demoSessionEnded(await response.json().catch(()=>({})));throw new Error('The demo session is unavailable. Reload the example.');}return response.json();}));
const config=runtime.inventory;
let bootstrap=initial;
const consent=createConsent(runtime,undefined,{evidence:requiredConsentEvidence({notice,streamRef:initial.streamRef,allowPreview:true,
  async read({signal}){if(bootstrap){const value=bootstrap;bootstrap=undefined;return value;}const response=await fetch('/demo/choices/head',{signal,cache:'no-store',headers:demoHeaders});if(!response.ok){const value=await response.json().catch(()=>({}));if(demoSessionEnded(value)||response.status===410&&value.code==='context-retired')throw new ConsentEvidenceError('context-retired');throw new Error('Head unavailable');}return response.json();},
  async write(command,{signal}){const response=await fetch('/demo/choices/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1',...demoHeaders},body:JSON.stringify(command)});const value=await response.json();if(!response.ok){if(demoSessionEnded(value))throw new ConsentEvidenceError('context-retired');if(['revision-conflict','stale-notice','expired-command','context-retired'].includes(value.code))throw new ConsentEvidenceError(value.code);throw new Error('Recording unavailable');}return value;},
})});
let requests=0;
for(const id of ['sample-measurements','sample-suggestions'])consent.registerService(id,{purposes:config.services.find(s=>s.id===id).purposeIds,start({signal}){const key=config.storage.find(item=>item.serviceId===id).name;localStorage.setItem(key,'enabled');document.querySelector('#request-count').textContent=String(++requests);void fetch(`/demo/${id}.svg`,{signal,cache:'no-store',headers:demoHeaders}).catch(()=>{});return ()=>localStorage.removeItem(key);}});
consent.subscribe(state=>{document.querySelector('#evidence-status').textContent=`Choice record: ${state.evidence.status}${state.evidence.revision!==undefined?' · revision '+state.evidence.revision:''}`;paintChoices(state);});
mountControls(document.querySelector('#privacy-controls'),{consent});document.querySelector('#review-choices').addEventListener('click',()=>consent.openPreferences());window.addEventListener('pagehide',event=>{if(!event.persisted)consent.destroy();});
