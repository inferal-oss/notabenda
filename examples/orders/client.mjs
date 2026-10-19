// @requirements REQ-EU-ORDER-ACTION REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-A11Y
import {createPaidOrderAction,mountPaidOrderAction} from '/assets/runtime/paid-order.js';
const container=document.getElementById('paid-order'),route=container?.dataset.orderRoute,generation=document.querySelector('meta[name="notabenda-demo-generation"]')?.content;
let mounted,action;
try{
 if(!['mixed','deferred','conditional'].includes(route)||!/^[a-f0-9]{64}$/u.test(generation??''))throw Error('Unavailable context');
 const headers={'X-Notabenda-Demo':'1','X-Notabenda-Demo-Generation':generation},key='notabenda-demo-order:'+generation+':'+route;
 // Retain the exact attempt before sending. Never replace an uncertain request with a fresh quote.
 const saved=sessionStorage.getItem(key);let review,recovery;
 if(saved){const value=JSON.parse(saved);review=value.review;recovery=value.request;}
 else{const response=await fetch('/demo/orders/'+route+'/quote',{headers});if(!response.ok)throw Error('Quote unavailable');review=await response.json();}
 async function transport(request,{signal}){
  sessionStorage.setItem(key,JSON.stringify({review,request}));
  const response=await fetch('/demo/orders/'+route+'/submit',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(request),signal});if(!response.ok)throw Error('Outcome not confirmed');return response.json();
 }
 action=createPaidOrderAction(review,{allowPreview:true,...(recovery?{recovery}:{}),submit:transport,recoverAttempt:transport});mounted=mountPaidOrderAction(container,{action,idPrefix:'order',allowPreview:true});
 const next=document.getElementById('order-new-quote');next.addEventListener('click',()=>{try{sessionStorage.removeItem(key);location.reload();}catch{next.textContent='Browser storage is unavailable. Clear this example’s session storage to start another order.';next.disabled=true;}});
 action.subscribe(state=>{next.hidden=!state.outcome;next.textContent=state.outcome?.status==='received'?'Review another sample order':'Review an updated quote';const record=document.getElementById('order-request-record');record.hidden=!state.outcome||state.outcome.status!=='received';if(!record.hidden){record.replaceChildren();const link=document.createElement('a');link.href='/demo/admin/orders/record?'+new URLSearchParams({id:state.outcome.id});link.textContent='Inspect this request in your demo workspace ↗';record.append(link);}});
 addEventListener('pagehide',event=>{if(!event.persisted){mounted.destroy();action.destroy();}});
}catch{mounted?.destroy();action?.destroy();const status=document.createElement('p');status.setAttribute('role','status');status.textContent='The order action could not start. Reload or return to the examples. The information below is a static preview.';container?.prepend(status);}
