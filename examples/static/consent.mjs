// @requirements REQ-PRODUCT-BUNDLE-BUDGET
import {paintChoices} from './choices-status.mjs';
import {createConsentRuntime,mountControls} from '@notabenda/core/consent';

const config = await (await fetch(location.pathname.startsWith('/dark/') ? '/dark/choices/site.json' : '/choices/site.json')).json();
const consent = createConsentRuntime(config);
let requests = 0;
for (const id of ['sample-measurements', 'sample-suggestions']) {
  consent.registerService(id, {
    purposes: config.inventory.services.find(service => service.id === id).purposeIds,
    start({ signal }) {
      // Synthetic, first-party integration. No external trackers or identifiers.
      localStorage.setItem(id, 'enabled');
      document.querySelector('#request-count').textContent = String(++requests);
      void fetch(`/demo/${id}.svg`, { signal, cache: 'no-store' }).catch(() => {});
      return () => { localStorage.removeItem(id); };
    },
  });
}
consent.subscribe(paintChoices);
mountControls(document.querySelector('#privacy-controls'), { consent });
document.querySelector('#review-choices').addEventListener('click', () => consent.openPreferences());
window.addEventListener('pagehide', event => { if (!event.persisted) consent.destroy(); });

// @requirements REQ-PRODUCT-CONNECTION-INSPECTION
const inspection=document.querySelector('[data-connection-inspector]');
if(inspection){let inspector,loading=false,ended=false;const inspect=inspection.querySelector('button'),status=inspection.querySelector('[role=status]');inspect.addEventListener('click',async()=>{if(inspector||loading)return;loading=true;inspect.disabled=true;try{const module=await import('/assets/connection-inspector.mjs');if(ended)return;inspector=module.mountConnectionInspector(inspection,consent,config);}catch{status.textContent='Connection inspection is unavailable. Your choices are unchanged.';}finally{inspect.disabled=false;loading=false;}});window.addEventListener('pagehide',event=>{if(!event.persisted){ended=true;inspector?.destroy();}});}
