// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
import {createElement as h,StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {createFormPermission,createIndexedDBFormPermissionJournal,FormPermissionError} from 'notabenda';
import {ReactPermissionApp} from './react-view.mjs';
import {demoSessionEnded} from '/assets/demo-session.mjs';
const container=document.getElementById('react-permission-root'),generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content;
async function json(path,options){const response=await fetch(path,{cache:'no-store',...options,headers:{...options?.headers,'X-Notabenda-Demo-Generation':generation??''}}),value=await response.json().catch(()=>({}));if(!response.ok){if(demoSessionEnded(value))throw new FormPermissionError('context-retired');const error=new Error('Permission recording unavailable.');error.code=value.code;throw error;}return value;}
let journal;try{journal=createIndexedDBFormPermissionJournal();}catch{journal={read:async()=>{throw Error('Local recovery unavailable');},update:async()=>{throw Error('Local recovery unavailable');}};}
const offer=JSON.parse(document.querySelector('meta[name=notabenda-permission-offer]').content),streamRef=document.querySelector('meta[name=notabenda-permission-stream]').content;
// Host-owned bootstrap. Never create a controller in a component render or replayed effect.
const controller=createFormPermission(offer,{streamRef,journal,allowPreview:true,read:({signal})=>json('/demo/permissions/state',{signal}),submit:(command,{signal})=>json('/demo/permissions/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(command)})});
hydrateRoot(container,h(StrictMode,null,h(ReactPermissionApp,{controller,offer,dark:location.pathname.startsWith('/dark/')})));
// Reading is a deliberate host integration decision, independent of React mount/replay.
void controller.refresh().catch(()=>{});
