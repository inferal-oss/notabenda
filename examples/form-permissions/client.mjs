// @requirements REQ-PRODUCT-FORM-PERMISSION-CONNECTION
// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
import {createFormPermission,mountFormPermission,FormPermissionError,createIndexedDBFormPermissionJournal} from '/assets/runtime/index.js';
import {demoSessionEnded} from '/assets/demo-session.mjs';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;
const form=document.getElementById('workspace-draft');
form.querySelector('button[type=submit]').disabled=false;
form.addEventListener('submit',event=>{event.preventDefault();document.getElementById('workspace-result').textContent=`Draft prepared: ${document.getElementById('workspace-title').value}. Email permission is unchanged.`;});
async function json(path,options){
 const response=await fetch(path,{cache:'no-store',...options,headers:{...options?.headers,'X-Notabenda-Demo-Generation':generation??''}});
 const value=await response.json().catch(()=>({}));
 if(!response.ok){if(demoSessionEnded(value))throw new FormPermissionError('context-retired');const error=new Error('Permission recording unavailable.');error.code=value.code;throw error;}
 return value;
}
let permission,journal,inspector,field,stopState,ended=false,loading=false;
window.addEventListener('pagehide',event=>{if(!event.persisted){ended=true;inspector?.destroy();stopState?.();field?.destroy();permission?.destroy();journal?.close?.();}});
try{journal=createIndexedDBFormPermissionJournal();}catch{journal={read:async()=>{throw Error('Local recovery unavailable');},update:async()=>{throw Error('Local recovery unavailable');}};}
try{
 const offer=JSON.parse(document.querySelector('meta[name=notabenda-permission-offer]').content);
 const streamRef=document.querySelector('meta[name=notabenda-permission-stream]').content;
 permission=createFormPermission(offer,{streamRef,allowPreview:true,...(journal?{journal}:{}),read:({signal})=>json('/demo/permissions/state',{signal}),submit:(command,{signal})=>json('/demo/permissions/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(command)})});
 field=mountFormPermission(document.getElementById('permission-field'),{permission});document.querySelector('[data-permission-fallback]').remove();
 stopState=permission.subscribe(snapshot=>{
  document.getElementById('permission-current').textContent=snapshot.status==='retired'?'Context closed':snapshot.recovery?.refusalPending?'Refusal awaiting confirmation':snapshot.recovery?.withdrawalPending?'Withdrawal awaiting confirmation':['loading','submitting'].includes(snapshot.status)?'Awaiting confirmation':snapshot.status==='error'?'Not confirmed':snapshot.current?snapshot.allowed?'Permission recorded':snapshot.current.reason.replaceAll('-',' '):snapshot.status==='error'?'Not confirmed':'Not checked';
  document.getElementById('permission-revision').textContent=String(snapshot.current?.revision??'—');
  document.getElementById('permission-active').textContent=snapshot.current?.activeOfferId===offer.offerId?offer.revision:snapshot.current?'Changed — reload':'—';
  if(snapshot.receipt){document.getElementById('permission-action').textContent=snapshot.receipt.action==='grant'?'Grant recorded':snapshot.receipt.action==='refuse'?'Refusal recorded':'Withdrawal recorded';const link=document.getElementById('permission-record');link.href='/demo/admin/permissions/record?id='+snapshot.receipt.id;link.hidden=false;}
 });
 const inspection=document.querySelector('[data-permission-inspector]');
 if(inspection){const button=inspection.querySelector('button'),status=inspection.querySelector('[role=status]');button.addEventListener('click',async()=>{if(inspector||loading||ended)return;loading=true;button.disabled=true;try{const module=await import('/assets/form-permission-inspector.mjs');if(!ended)inspector=module.mountFormPermissionInspector(inspection,permission,offer,streamRef);}catch{status.textContent='Inspection is unavailable. This inspection changed no permission.';}finally{button.disabled=false;loading=false;}});}
 // The host deliberately loads the current state; mounting the library field itself performs no request.
 await permission.refresh().catch(()=>{});
}catch{inspector?.destroy();stopState?.();field?.destroy();permission?.destroy();journal?.close?.();const inspection=document.querySelector('[data-permission-inspector]');if(inspection)inspection.hidden=true;const fallback=document.querySelector('[data-permission-fallback]');if(fallback)fallback.textContent='Permission controls are unavailable. Reload to try again. The workspace draft remains independent.';}
