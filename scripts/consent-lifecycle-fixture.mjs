// @requirements REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-STORAGE-CLEANUP REQ-PRODUCT-A11Y
// Maintainer-only disposable callbacks and storage. Never included in a public page or npm entry.
import {mountControls} from '@notabenda/core/consent';
import {registerStorageService} from '@notabenda/core';

export async function mountConsentLifecycleFixture(host,{controller,failure}){
 if(!['start','stop','storage'].includes(failure))throw Error('Unknown lifecycle fixture.');
 const config=controller.getConfig(),service=config.services.find(s=>config.consent.services.some(e=>e.id===s.id));
 const target=config.storage.find(s=>s.serviceId===service?.id&&s.classification==='optional'&&s.type==='localStorage');
 if(!service||failure==='storage'&&!target)throw Error('Lifecycle fixture needs an enrolled service and matching storage.');
 const doc=host.ownerDocument,node=(tag,text)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const intro=node('section'),heading=node('h2','Service lifecycle check');intro.append(heading,node('p',failure==='start'?'The local start callback fails. No provider is loaded.':failure==='stop'?'The local cleanup callback fails after withdrawal. Its outcome is not confirmed.':'The local producer stops, but removing its in-memory marker fails. A stored marker can remain after withdrawal.'));
 const observation=node('output');observation.setAttribute('aria-label','Lifecycle observation');observation.setAttribute('aria-live','polite');Object.assign(observation.style,{display:'block',whiteSpace:'pre-wrap',overflowWrap:'anywhere'});intro.append(observation);
 const mount=node('div');host.append(intro,mount);
 let starts=0,cleanupAttempts=0,abortObserved=false,blockRemoval=false,storageHelper,stopped=false;
 const markers=new Map();
 const getObservation=()=>({serviceId:service.id,phase:controller.getSnapshot().services[service.id],starts,cleanupAttempts,abortObserved,...(failure==='storage'?{markerPresent:markers.has(target.name),cleanupFailed:storageHelper?.getSnapshot().report?.failed===true}:{})});
 const update=()=>{observation.textContent=JSON.stringify(getObservation(),null,2);};
 const start=({signal})=>{
  starts++;signal.addEventListener('abort',()=>{abortObserved=true;update();},{once:true});
  if(failure==='start')throw Error('PRIVATE_START_ERROR');
  if(failure==='storage'){markers.set(target.name,'PRIVATE_STORAGE_VALUE');blockRemoval=true;}
  return ()=>{cleanupAttempts++;if(failure==='stop')throw Error('PRIVATE_STOP_ERROR');};
 };
 if(failure==='storage')storageHelper=registerStorageService({consent:controller,serviceId:service.id,targets:[{storageId:target.id}],start},{localStorage:()=>({getItem:key=>markers.get(key)??null,removeItem:key=>{if(!blockRemoval)markers.delete(key);}})});
 else controller.registerService(service.id,{purposes:service.purposeIds,start});
 const ui=mountControls(mount,{consent:controller}),unsubscribe=controller.subscribe(update),unwatch=storageHelper?.subscribe(update);
 try{
  controller.acceptAll();await controller.settled();
  if(failure!=='start'){if(controller.getSnapshot().services[service.id]!=='active')throw Error('Fixture never started.');controller.rejectAll();await controller.settled();}
  if(controller.getSnapshot().services[service.id]!=='reload-required')throw Error('Fixture did not reach its lifecycle failure.');
  update();
 }catch(error){unsubscribe();unwatch?.();ui.destroy();controller.destroy();await storageHelper?.destroy();intro.remove();mount.remove();throw error;}
 return {getObservation,async destroy(){if(stopped)return;stopped=true;unsubscribe();unwatch?.();ui.destroy();controller.destroy();await storageHelper?.destroy();await controller.settled();markers.clear();intro.remove();mount.remove();}};
}
