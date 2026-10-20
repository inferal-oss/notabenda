// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-ASTRO REQ-PRODUCT-DEMO-WORKSPACE
import {mountAstroTermsAcceptance} from '@notabenda/core/astro/client';
/** Example host lifecycle. Package adapters do not resolve or authorize demo sessions. */
export function mountAgreementSession({document:doc,acceptance,generation,offerId,onSessionEnded}){
 const meta=name=>doc.querySelector(`meta[name=${name}]`)?.content,contextKey='sample-light-'+generation;
 let bridge,ended=false,swapping=false,disposed=false;
 const entry=()=>doc.querySelector('[data-agreement-entry]');
 function matches(){try{return meta('notabenda-demo-generation')===generation&&JSON.parse(meta('notabenda-terms-offer')).offerId===offerId&&doc.querySelector('[data-notabenda-terms]').dataset.notabendaTermsContext===contextKey;}catch{return false;}}
 function render(){
  if(disposed||!entry())return;
  const status=doc.querySelector('[data-agreement-state]'),link=doc.querySelector('[data-agreement-record]');
  if(ended||swapping||!matches()){if(status)status.textContent='No confirmed agreement for this page.';if(link){link.hidden=true;link.removeAttribute('href');}return;}
  const state=acceptance.getSnapshot();
  if(status)status.textContent=state.status==='recorded'?'Agreement recorded.':state.status==='submitting'?'Awaiting confirmation.':state.status==='error'?'Recording not confirmed.':state.status==='retired'||state.status==='destroyed'?'This agreement context is closed.':'No confirmed agreement this visit.';
  if(link){link.hidden=state.status!=='recorded'||!state.receipt;if(!link.hidden)link.href='/demo/admin/agreements/record?id='+state.receipt.id;else link.removeAttribute('href');}
 }
 function pageLoad(){swapping=false;if(disposed||ended||!entry())return;if(!matches()){ended=true;bridge?.destroy();render();acceptance.destroy();onSessionEnded();}else render();}
 const beforeSwap=()=>{swapping=true;};
 // Validate host binding before the bridge can attach a new native view.
 doc.addEventListener('astro:before-swap',beforeSwap);doc.addEventListener('astro:page-load',pageLoad);
 const unsubscribe=acceptance.subscribe(render);
 try{pageLoad();if(!ended)bridge=mountAstroTermsAcceptance({acceptance,id:'sample-signup',contextKey,document:doc});}
 catch(error){disposed=true;doc.removeEventListener('astro:before-swap',beforeSwap);doc.removeEventListener('astro:page-load',pageLoad);unsubscribe();bridge?.destroy();throw error;}
 return {destroy(){if(disposed)return;disposed=true;doc.removeEventListener('astro:before-swap',beforeSwap);doc.removeEventListener('astro:page-load',pageLoad);unsubscribe();bridge?.destroy();}};
}
