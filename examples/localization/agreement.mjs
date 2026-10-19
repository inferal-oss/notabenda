// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-TERMS-ACCEPTANCE
import {demoSessionEnded} from '/assets/demo-session.mjs';
import {createTermsAcceptance,mountTermsAcceptance,TermsAcceptanceError} from '/assets/runtime/index.js';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;
if(!generation)throw new Error('Abra este exemplo por uma sessão de demonstração.');
const offer=await (await fetch('/localization/agreement/offer.json')).json();
const acceptance=createTermsAcceptance(offer,{operationId:`synthetic-pt-operation-${generation}`,allowPreview:true,async submit(body,{signal}){
 const response=await fetch('/demo/agreements/pt',{method:'POST',headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1','X-Notabenda-Demo-Generation':generation},body:JSON.stringify(body),signal});
 if(!response.ok){const result=await response.json().catch(()=>({}));if(demoSessionEnded(result))throw new TermsAcceptanceError('context-retired');if(result.code==='stale-offer')throw new TermsAcceptanceError('stale-offer');throw new Error('Não foi possível confirmar o registro.');}
 return response.json();
}});
mountTermsAcceptance(document.querySelector('#terms-control'),{acceptance});
window.addEventListener('pagehide',event=>{if(!event.persisted)acceptance.destroy();});
