// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS REQ-PRODUCT-DEMO-WORKSPACE
import {createFormPermission,createIndexedDBFormPermissionJournal,FormPermissionError} from '@notabenda/core';
import {mountCollectionFlow} from '@notabenda/core/collection/flow';
import {demoSessionEnded} from '/assets/demo-session.mjs';
const form=document.querySelector('#message-form'),result=document.querySelector('#message-result'),generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;
form.querySelector('button[type=submit]').disabled=false;
form.addEventListener('submit',event=>{event.preventDefault();result.textContent='Message draft prepared in this page. Email permission is unchanged. No message was sent.';});
const state=document.querySelector('#flow-permission-state');let controller,view,journal;
async function json(path,options){const response=await fetch(path,{cache:'no-store',...options,headers:{...options?.headers,'X-Notabenda-Demo-Generation':generation??''}}),value=await response.json().catch(()=>({}));if(!response.ok){if(demoSessionEnded(value))throw new FormPermissionError('context-retired');const error=Error('Permission recording unavailable.');error.code=value.code;throw error;}return value;}
try{
 const flow=JSON.parse(document.querySelector('meta[name=notabenda-collection-flow]').content),offer=flow.permissions[0],streamRef=document.querySelector('meta[name=notabenda-permission-stream]').content;
 try{journal=createIndexedDBFormPermissionJournal();}catch{journal={read:async()=>{throw Error('Recovery unavailable');},update:async()=>{throw Error('Recovery unavailable');}};}
 controller=createFormPermission(offer,{streamRef,allowPreview:true,journal,read:({signal})=>json('/demo/permissions/flow/state',{signal}),submit:(command,{signal})=>json('/demo/permissions/flow/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(command)})});
 view=mountCollectionFlow(document.querySelector('#collection-flow'),{flow,idPrefix:'message-privacy',headingLevel:2,allowPreview:true,permissions:{[offer.permissionId]:controller}});
 controller.subscribe(snapshot=>{state.textContent=snapshot.allowed?'Email permission recorded':snapshot.status==='error'?'Recording not confirmed':snapshot.current?.reason==='refused'?'No email updates — refusal recorded':snapshot.current?.reason==='withdrawn'?'Email permission withdrawn':snapshot.checked?'Checkbox draft — permission unchanged':'Email updates remain off';if(snapshot.receipt){const link=document.querySelector('#flow-record');link.href='/demo/admin/permissions/record?id='+snapshot.receipt.id;link.hidden=false;}});
 await controller.refresh().catch(()=>{});
}catch{view?.destroy();controller?.destroy();state.textContent='Permission controls are unavailable. Your message draft remains separate; the notice and withdrawal link stay readable.';}
window.addEventListener('pagehide',()=>{view?.destroy();controller?.destroy();journal?.close?.();},{once:true});
