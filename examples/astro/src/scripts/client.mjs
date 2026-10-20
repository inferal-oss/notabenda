// @requirements REQ-PRODUCT-ASTRO
import {createConsent} from '@notabenda/core';
import {mountAstroConsent} from '@notabenda/core/astro/client';

let controller;
try {
  const response=await fetch('/astro/site.json');
  if(!response.ok)throw new Error('Example configuration unavailable.');
  const config=await response.json();
  controller=createConsent(config);
  let requests=0;
  for(const service of config.consent.services)controller.registerService(service.id,{
    purposes:config.services.find(s=>s.id===service.id).purposeIds,
    async start({signal}) {
      if(signal.aborted)return ()=>{};
      const key=`astro-demo:${service.id}`;requests++;
      let result;
      try {result=await fetch('/astro/optional-sample.json',{signal,cache:'no-store'});}
      catch(error){if(signal.aborted)return ()=>localStorage.removeItem(key);throw error;}
      if(!result.ok)throw new Error('Fictional optional response unavailable.');
      if(!signal.aborted)localStorage.setItem(key,'Fictional Astro feature');
      return ()=>localStorage.removeItem(key);
    },
  });
  mountAstroConsent({consent:controller});
  const render=()=>{
    const state=controller.getSnapshot();
    for(const node of document.querySelectorAll('[data-astro-purpose]')) {
      const id=node.dataset.astroPurpose;const purpose=config.purposes.find(p=>p.id===id);
      const copy={unknown:'Off — waiting for your choice',granted:'Off — awaiting confirmation',denied:'Off — declined',withdrawn:'Off — withdrawn',expired:'Off — expired'};
      node.textContent=`${purpose.name}: ${state.permissions[id]?'Allowed':copy[state.purposes[id]]}`;
    }
    for(const node of document.querySelectorAll('[data-astro-services]'))node.textContent=Object.values(state.services).join(' · ');
    for(const node of document.querySelectorAll('[data-astro-requests]'))node.textContent=String(requests);
    for(const node of document.querySelectorAll('[data-astro-status]'))node.textContent='Your choices can be reviewed at any time.';
  };
  controller.subscribe(render);
  document.addEventListener('astro:page-load',()=>{controller.refresh();render();});
}catch {
  controller?.destroy();
  for(const node of document.querySelectorAll('[data-astro-status]'))node.textContent='Privacy controls could not load. Optional services stay off. Reload to try again.';
}
