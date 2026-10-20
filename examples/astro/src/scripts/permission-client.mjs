// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
import {createFormPermission,createIndexedDBFormPermissionJournal,FormPermissionError} from '@notabenda/core';
import {mountAstroFormPermission} from '@notabenda/core/astro/client';
import {demoSessionEnded} from '../../../static/demo-session.mjs';
const readMeta=name=>document.querySelector(`meta[name=${name}]`)?.content;
const generation=readMeta('notabenda-demo-generation'),streamRef=readMeta('notabenda-permission-stream'),offer=JSON.parse(readMeta('notabenda-permission-offer'));
async function json(path,options){const response=await fetch(path,{cache:'no-store',...options,headers:{...options?.headers,'X-Notabenda-Demo-Generation':generation??''}}),value=await response.json().catch(()=>({}));if(!response.ok){if(demoSessionEnded(value)||value.code==='context-retired')throw new FormPermissionError('context-retired');const error=new Error('Permission recording unavailable.');error.code=value.code;throw error;}return value;}
let journal;try{journal=createIndexedDBFormPermissionJournal();}catch{journal={read:async()=>{throw Error('Local recovery unavailable');},update:async()=>{throw Error('Local recovery unavailable');}};}
const permission=createFormPermission(offer,{allowPreview:true,streamRef,journal,read:({signal})=>json('/demo/permissions/state',{signal}),submit:(command,{signal})=>json('/demo/permissions/record',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1'},body:JSON.stringify(command)})});
let entry,draftTitle='Weekend reading',result='A local draft. Email permission is recorded separately.';
function render(){const s=permission.getSnapshot(),values={'data-permission-current':s.status==='destroyed'||s.status==='retired'?'Context closed':s.recovery?.withdrawalPending?'Withdrawal awaiting confirmation':['loading','submitting'].includes(s.status)?'Awaiting confirmation':s.status==='error'?'Not confirmed':s.allowed?'Permission recorded':s.current?.reason==='withdrawn'?'Withdrawn':s.current?'Off':'Not checked','data-permission-revision':s.current?.revision??'—','data-permission-action':s.receipt?s.receipt.action==='grant'?'Grant recorded':'Withdrawal recorded':'None this visit'};for(const [selector,value] of Object.entries(values)){const node=document.querySelector('['+selector+']');if(node)node.textContent=String(value);}const link=document.querySelector('[data-permission-record]');if(link){link.hidden=!s.receipt;if(s.receipt)link.href='/demo/admin/permissions/record?id='+s.receipt.id;}}
function pageLoad(){const next=document.querySelector('[data-permission-entry]');if(next===entry)return;entry=next;if(!entry)return;
 // A browser session/contact or exact offer change requires a new host bootstrap, never a reused controller.
 let same=false;try{same=readMeta('notabenda-demo-generation')===generation&&readMeta('notabenda-permission-stream')===streamRef&&JSON.parse(readMeta('notabenda-permission-offer')).offerId===offer.offerId;}catch{}
 if(!same){permission.destroy();demoSessionEnded({code:'demo-generation-changed'});render();return;}
 const input=document.getElementById('astro-workspace-title');input.value=draftTitle;document.querySelector('[data-workspace-result]').textContent=result;document.querySelector('#astro-workspace-draft button[type=submit]').disabled=false;render();void permission.refresh().catch(()=>{});
}
document.addEventListener('input',event=>{if(event.target.id==='astro-workspace-title')draftTitle=event.target.value;});
document.addEventListener('submit',event=>{if(event.target.id!=='astro-workspace-draft')return;event.preventDefault();result='Draft prepared: '+draftTitle+'. Email permission is unchanged.';document.querySelector('[data-workspace-result]').textContent=result;});
// Register the host binding check before the bridge's page-load handler.
document.addEventListener('astro:page-load',pageLoad);permission.subscribe(render);pageLoad();mountAstroFormPermission({permission,id:'product-news'});
