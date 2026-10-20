// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
import {createFormPermission,mountFormPermission,FormPermissionError,createIndexedDBFormPermissionJournal} from '/assets/runtime/index.js';
import {demoSessionEnded} from '/assets/demo-session.mjs';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content,form=document.querySelector('#workspace-draft');
form.querySelector('button[type=submit]').disabled=false;
form.addEventListener('submit',event=>{event.preventDefault();document.querySelector('#workspace-result').textContent=`Rascunho preparado: ${document.querySelector('#workspace-title').value}. A permissão de e-mail não mudou.`;});
async function json(path,options){
 const response=await fetch(path,{cache:'no-store',...options,headers:{...options?.headers,'X-Notabenda-Demo-Generation':generation??''}}),value=await response.json().catch(()=>({}));
 if(!response.ok){if(demoSessionEnded(value))throw new FormPermissionError('context-retired');const error=new Error('Registro indisponível.');error.code=value.code;throw error;}return value;
}
let permission,journal;
try{journal=createIndexedDBFormPermissionJournal();}catch{journal={read:async()=>{throw Error('Recuperação indisponível');},update:async()=>{throw Error('Recuperação indisponível');}};}
try{
 const offer=JSON.parse(document.querySelector('meta[name=notabenda-permission-offer]').content),streamRef=document.querySelector('meta[name=notabenda-permission-stream]').content;
 permission=createFormPermission(offer,{streamRef,allowPreview:true,journal,read:({signal})=>json('/demo/permissions/pt/state',{signal}),submit:(command,{signal})=>json('/demo/permissions/pt/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(command)})});
 mountFormPermission(document.querySelector('#permission-field'),{permission});document.querySelector('[data-permission-fallback]').remove();
 permission.subscribe(state=>{
  document.querySelector('#permission-current').textContent=state.status==='retired'?'Sessão encerrada':state.recovery?.withdrawalPending?'Retirada aguardando confirmação':['loading','submitting'].includes(state.status)?'Aguardando confirmação':state.status==='error'?'Não confirmado':state.allowed?'Permissão registrada':state.current?'Desativado':'Ainda não consultado';
  document.querySelector('#permission-revision').textContent=String(state.current?.revision??'—');
  if(state.receipt){document.querySelector('#permission-action').textContent=state.receipt.action==='grant'?'Permissão registrada':'Retirada registrada';const link=document.querySelector('#permission-record');link.href='/demo/admin/permissions/record?id='+state.receipt.id;link.hidden=false;}
 });
 await permission.refresh().catch(()=>{});
}catch{permission?.destroy();const fallback=document.querySelector('[data-permission-fallback]');if(fallback)fallback.textContent='As opções estão indisponíveis. Recarregue para tentar novamente. Seu rascunho continua independente.';}
