// @requirements REQ-PRODUCT-TERMS-CONNECTION
import {demoSessionEnded} from '/assets/demo-session.mjs';
import { createTermsAcceptance, mountTermsAcceptance, TermsAcceptanceError } from '/assets/runtime/index.js';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;if(!generation)throw new Error('Open the example through its demo session.');
const dark = location.pathname.startsWith('/dark/');
const offer = await (await fetch(dark ? '/dark/agreement/offer.json' : '/agreement/offer.json')).json();
const theme = dark ? 'dark' : 'light';
const operationId=`synthetic-${theme}-operation-${generation}`;
const acceptance = createTermsAcceptance(offer,{
  operationId, allowPreview:true,
  async submit(request,{signal}) {
    const response = await fetch(`/demo/agreements/${theme}`,{method:'POST',headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1','X-Notabenda-Demo-Generation':generation},body:JSON.stringify(request),signal});
    if (!response.ok) { const result=await response.json().catch(()=>({})); if(demoSessionEnded(result))throw new TermsAcceptanceError('context-retired'); if (result.code === 'stale-offer'||response.status===410&&result.code==='context-retired') throw new TermsAcceptanceError(result.code); throw new Error('Recording failed'); }
    return response.json();
  },
});
mountTermsAcceptance(document.querySelector('#terms-control'),{acceptance});
const inspection=document.querySelector('[data-terms-inspector]');let inspector,loading=false,ended=false;
if(inspection){const button=inspection.querySelector('button'),status=inspection.querySelector('[role=status]');button.addEventListener('click',async()=>{if(inspector||loading||ended)return;loading=true;button.disabled=true;try{const module=await import('/assets/terms-inspector.mjs');if(!ended)inspector=module.mountTermsInspector(inspection,acceptance,offer,operationId);}catch{status.textContent='Inspection is unavailable. This inspection submitted no agreement.';}finally{button.disabled=false;loading=false;}});}
window.addEventListener('pagehide',event=>{if(!event.persisted){ended=true;inspector?.destroy();acceptance.destroy();}});
