// @requirements REQ-PRODUCT-TERMS-CONNECTION REQ-PRODUCT-TERMS-RECOVERY
import {demoSessionEnded} from '/assets/demo-session.mjs';
import {mountTermsAcceptance,TermsAcceptanceError} from '/assets/runtime/terms.js';
import {createRecoverableTermsAcceptance,createIndexedDBTermsRecoveryJournal} from '/assets/runtime/terms-recovery.js';
let acceptance,journal,inspector,ended=false,loading=false;
window.addEventListener('pagehide',event=>{if(!event.persisted){ended=true;inspector?.destroy();acceptance?.destroy();journal?.close();}});
async function main(){
 const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;if(!generation)throw Error();
 const dark=location.pathname.startsWith('/dark/'),theme=dark?'dark':'light',response=await fetch(dark?'/dark/agreement/offer.json':'/agreement/offer.json');if(!response.ok)throw Error();const offer=await response.json();if(ended)return;
 const operationId=`synthetic-${theme}-operation-${generation}`;
 journal=createIndexedDBTermsRecoveryJournal();
 acceptance=await createRecoverableTermsAcceptance(offer,{
  operationId,contextId:'demo-terms-'+theme+'-'+generation,journal,allowPreview:true,
  async submit(request,{signal}){
   const response=await fetch(`/demo/agreements/${theme}`,{method:'POST',headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1','X-Notabenda-Demo-Generation':generation},body:JSON.stringify(request),signal});
   if(!response.ok){const result=await response.json().catch(()=>({}));if(demoSessionEnded(result))throw new TermsAcceptanceError('context-retired');if(result.code==='stale-offer'||response.status===410&&result.code==='context-retired')throw new TermsAcceptanceError(result.code);throw Error('Recording failed');}return response.json();
  },
 });
 if(ended){acceptance.destroy();journal.close();return;}
 mountTermsAcceptance(document.querySelector('#terms-control'),{acceptance});
 const inspection=document.querySelector('[data-terms-inspector]');
 if(inspection){const button=inspection.querySelector('button'),status=inspection.querySelector('[role=status]');button.addEventListener('click',async()=>{if(inspector||loading||ended)return;loading=true;button.disabled=true;try{const module=await import('/assets/terms-inspector.mjs');if(!ended)inspector=module.mountTermsInspector(inspection,acceptance,offer,operationId);}catch{status.textContent='Inspection is unavailable. This inspection submitted no agreement.';}finally{button.disabled=false;loading=false;}});}
}
void main().catch(()=>{acceptance?.destroy();journal?.close();if(ended)return;const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Agreement recovery is unavailable in this browser. Nothing was submitted. The legal pages remain available below.';document.querySelector('#terms-control').replaceChildren(status);const inspection=document.querySelector('[data-terms-inspector]');if(inspection)inspection.hidden=true;});
