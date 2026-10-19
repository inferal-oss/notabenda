// @requirements REQ-PRODUCT-PRIVACY-SIGNALS
import {createConsent,mountControls} from '/assets/runtime/index.js';
let consent;
try{
  const response=await fetch('/privacy-signals/site.json');if(!response.ok)throw new Error('Example unavailable.');
  const config=await response.json();let simulated=new URL(location.href).searchParams.get('simulate-gpc')==='1';let requests=0;
  // This environment adds a visible fixture signal without changing the actual browser setting.
  consent=createConsent(config,{
    storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)},
    globalPrivacyControl:()=>simulated?true:navigator.globalPrivacyControl,
    subscribe(key,refresh){
      const storage=event=>{if(event.key===key||event.key===key+':prompt'||event.key===null)refresh();};
      const visible=()=>{if(document.visibilityState==='visible')refresh();};
      window.addEventListener('storage',storage);window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',visible);
      return ()=>{window.removeEventListener('storage',storage);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',visible);};
    },
  });
  for(const service of config.consent.services)consent.registerService(service.id,{purposes:config.services.find(s=>s.id===service.id).purposeIds,async start({signal}){
    if(signal.aborted)return ()=>{};requests++;
    try{const sample=await fetch('/privacy-signals/sample.json?service='+service.id,{signal,cache:'no-store'});if(!sample.ok)throw new Error('Sample unavailable.');}
    catch(error){if(!signal.aborted)throw error;}
    return ()=>{};
  }});
  mountControls(document.querySelector('#privacy-controls'),{consent});
  const button=document.querySelector('[data-simulate-signal]');
  button.addEventListener('click',()=>{simulated=true;const url=new URL(location.href);url.searchParams.set('simulate-gpc','1');history.replaceState(null,'',url);consent.refresh();});
  consent.subscribe(state=>{
    document.querySelector('[data-signal-cookie]').textContent=state.permissions['optional-features']?'Allowed':state.purposes['optional-features']==='withdrawn'?'Off — withdrawn':'Off — waiting for permission';
    document.querySelector('[data-signal-status]').textContent=({observed:'Observed — declared restriction applied in this browser','not-observed':'Not observed — this is not consent',unavailable:'Could not be checked — declared processing stays off'})[state.privacySignals.globalPrivacyControl];
    for(const node of document.querySelectorAll('[data-signal-service]'))node.textContent=state.services[node.dataset.signalService]+(state.servicePermissions[node.dataset.signalService]?' · eligible':' · not eligible');
    document.querySelector('[data-signal-requests]').textContent=String(requests);
    button.hidden=false;button.disabled=state.privacySignals.globalPrivacyControl==='observed';
    button.textContent=simulated?'Simulation active':button.disabled?'Browser signal observed':'Simulate a GPC signal';
    document.querySelector('[data-simulation-status]').textContent=simulated?'Simulation active. The actual browser privacy setting was not changed.':'';
  });
}catch{consent?.destroy();document.querySelector('[data-signal-status]').textContent='Controls unavailable. Optional services stay off; reload to try again.';}
