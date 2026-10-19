import {demoSessionEnded} from '/assets/demo-session.mjs';
import { createTermsAcceptance, mountTermsAcceptance, TermsAcceptanceError } from '/assets/runtime/index.js';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;if(!generation)throw new Error('Open the example through its demo session.');
const dark = location.pathname.startsWith('/dark/');
const offer = await (await fetch(dark ? '/dark/agreement/offer.json' : '/agreement/offer.json')).json();
const theme = dark ? 'dark' : 'light';
const acceptance = createTermsAcceptance(offer,{
  operationId:`synthetic-${theme}-operation-${generation}`, allowPreview:true,
  async submit(request,{signal}) {
    const response = await fetch(`/demo/agreements/${theme}`,{method:'POST',headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1','X-Notabenda-Demo-Generation':generation},body:JSON.stringify(request),signal});
    if (!response.ok) { const result=await response.json().catch(()=>({})); if(demoSessionEnded(result))throw new TermsAcceptanceError('context-retired'); if (result.code === 'stale-offer'||response.status===410&&result.code==='context-retired') throw new TermsAcceptanceError(result.code); throw new Error('Recording failed'); }
    return response.json();
  },
});
mountTermsAcceptance(document.querySelector('#terms-control'),{acceptance});
window.addEventListener('pagehide',event=>{if(!event.persisted)acceptance.destroy();});
