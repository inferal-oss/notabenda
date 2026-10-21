// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
import {createConsentRuntime,mountControls} from '@notabenda/core/consent';
import {createProcessingChoices,mountProcessingChoices,ProcessingChoicesError} from '@notabenda/core';
const $=id=>document.getElementById(id),connection=$('connection-state');let consent,processing,processingUI,cookieUI,connecting=false,ended=false,simulated=false,streamRef;
const initial=JSON.parse($('server-observation')?.textContent??'null');
if(initial){$('server-result').textContent=initial.covered.state+' · '+initial.covered.reason;$('operational-result').textContent=initial.operational;$('persistence-result').textContent=initial.persistence;}
function disconnect(){ended=true;processingUI?.destroy();cookieUI?.destroy();consent?.destroy();processing?.destroy();connection.textContent='This browser context changed. Reload to reconnect your choices.';$('queue').disabled=true;$('simulate-gpc').disabled=true;}
async function post(path,input={},ref=streamRef,signal){
  const response=await fetch(path,{method:'POST',credentials:'same-origin',cache:'no-store',signal,headers:{'Content-Type':'application/json','X-Notabenda-Request':'1',...(ref?{'X-Notabenda-Stream':ref}:{})},body:JSON.stringify(input)}),value=await response.json();
  if(!response.ok){if(value.code==='context-changed')disconnect();if(value.code==='context-retired')throw new ProcessingChoicesError('context-retired');throw Error('Processing unavailable.');}return value;
}
const signalObserved=()=>simulated||navigator.globalPrivacyControl===true;
async function reportSignal(){
  if(!consent||!processing||ended)return;consent.refresh();let observed=false;try{observed=signalObserved();}catch{}if(!observed)return;
  await processing.settled();if(ended)return;const state=processing.getSnapshot(),notice=processing.getNotice();
  // Recover original requests first. Automatic reporting must not confirm lost local intent
  // against new wording or claim that a button was clicked.
  if(!['ready','recorded'].includes(state.status)||state.pending||state.needsConfirmation)return;
  if(notice.activities.some(a=>!state.restrictedActivities.includes(a)))await processing.optOut();
}
async function connect(){
  if(connecting||consent||ended)return;connecting=true;$('retry-connection').hidden=true;
  try{
    const boot=await post('/api/processing/bootstrap',{},undefined);if(ended)return;streamRef=boot.head.streamRef;
    processing=createProcessingChoices(boot.notice,{streamRef,allowPreview:boot.runtime.mode==='preview',read:({signal})=>post('/api/processing/head',{},streamRef,signal),submit:(command,{signal})=>post('/api/processing/record',command,streamRef,signal)});
    consent=createConsentRuntime(boot.runtime,{storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)},globalPrivacyControl:()=>simulated?true:navigator.globalPrivacyControl,subscribe(key,refresh){const change=e=>{if(e.key===null||e.key===key||e.key===key+':prompt')refresh();};const resume=()=>{if(document.visibilityState==='visible')refresh();};window.addEventListener('storage',change);window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',resume);return ()=>{window.removeEventListener('storage',change);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',resume);};}},{globalPrivacyControl:boot.observed,processingChoices:processing});
    consent.registerService('ad-service',{purposes:['advertising'],async start({signal}){const result=await post('/api/processing/client',{},streamRef,signal);if(signal.aborted)return;if(result.state!=='delivered')throw Error('Server did not confirm delivery.');$('client-result').textContent='Sink confirmed';return ()=>{$('client-result').textContent='Off';};}});
    consent.registerService('local-tool',{purposes:['features'],start(){$('local-result').textContent='On';return ()=>{$('local-result').textContent='Off';};}});
    processingUI=mountProcessingChoices($('processing-controls'),processing);cookieUI=mountControls($('cookie-controls'),{consent});
    processing.subscribe(state=>{$('processing-state').textContent=({ready:'No restriction saved',recorded:'Restriction recorded',checking:'Checking',saving:'Confirming',error:'Unconfirmed',retired:'Closed',destroyed:'Disconnected'})[state.status]??'Unconfirmed';connection.textContent=state.status==='error'?'Recording could not be confirmed. Covered client work stays off.':state.status==='recorded'?'Your restriction is recorded. Cookie choices stay separate.':'You can opt out here. Cookie preferences are a separate choice.';});
    await reportSignal();
  }catch{processingUI?.destroy();cookieUI?.destroy();consent?.destroy();processing?.destroy();consent=undefined;processing=undefined;connection.textContent='Connection unavailable. Restricted services stay off. Try again.';$('processing-state').textContent='Unconfirmed';$('retry-connection').hidden=false;}
  finally{connecting=false;}
}
$('simulate-gpc').addEventListener('change',()=>{if(!consent||ended)return;simulated=true;$('simulate-gpc').checked=true;$('simulate-gpc').disabled=true;void reportSignal();});
$('cookie-settings').addEventListener('click',()=>consent?.openPreferences());$('retry-connection').addEventListener('click',()=>void connect());
$('queue').addEventListener('click',async()=>{if(ended)return;try{const result=await post('/api/processing/queue');$('queue-result').textContent=result.deliveryId?'Queued '+result.deliveryId+'. The operator must check and dispatch it.':'Not queued · '+result.reason;}catch{$('queue-result').textContent='Queue could not be confirmed.';}});
window.addEventListener('application-session-changed',disconnect);window.addEventListener('pagehide',e=>{if(!e.persisted){processingUI?.destroy();cookieUI?.destroy();consent?.destroy();processing?.destroy();}});void connect();
