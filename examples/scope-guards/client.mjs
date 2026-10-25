// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-CONFIG
import {createConsent,mountControls} from '/assets/runtime/index.js';
const runtime=await(await fetch(location.pathname.replace(/\/index\.html$/u,'/').replace(/\/?$/u,'/')+'consent.json')).json(),config=runtime.inventory,values=new Map();
const environment={storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};
const show=(id,value)=>{document.getElementById(id).textContent=value;};
let consent,ui,unsubscribe,revision=1,starts=0;
function paint(state){
 const guard=state.scopeGuards;show('guard-assessment',guard.status==='restricted'?'Some purposes unavailable':'No declared restriction');show('guard-revision',guard.revision??'Unassessed');show('guard-held',String(guard.blockedPurposeIds.length));show('guard-starts',String(starts));
 for(const [id,service] of [['measurement','sample-measurements'],['suggestions','sample-suggestions'],['combined','combined-demo']]){const node=document.getElementById('guard-'+id);const active=state.services[service]==='active';node.textContent=active?'Active':guard.blockedServiceIds.includes(service)?'Held off':'Off';node.dataset.active=String(active);}
 document.getElementById('allow-available').disabled=config.consent.purposes.every(p=>guard.blockedPurposeIds.includes(p.id));
 show('guard-explanation',guard.blockedPurposeIds.length?'Present or unresolved facts keep affected purposes off. Neither a cookie choice nor an ordinary terms agreement clears this boundary.':'The operator has declared these facts absent. Normal consent and any processing restrictions still apply. This is not legal clearance.');
 const list=document.getElementById('guard-requirements');list.replaceChildren();const ids=[...new Set(Object.values(guard.purposeRestrictions).flat().flatMap(reason=>reason.requirementIds))];for(const id of ids){const item=document.createElement('li'),link=document.createElement('a');link.href='/guide/requirements#'+id.toLowerCase();link.textContent=id;item.append(link);list.append(item);}if(!ids.length){const item=document.createElement('li');item.textContent='No restriction reason is declared in this scenario.';list.append(item);}
}
function mount(){
 starts=0;consent=createConsent(runtime,environment);for(const item of config.consent.services){const service=config.services.find(s=>s.id===item.id);consent.registerService(item.id,{purposes:service.purposeIds,start(){starts++;return()=>{};}});}
 ui=mountControls(document.getElementById('privacy-controls'),{consent});unsubscribe=consent.subscribe(paint);
}
mount();
document.getElementById('allow-available').addEventListener('click',()=>{consent.acceptAll();show('guard-action-status','Available purposes allowed. Any purpose held by a scope guard stays off.');});
document.getElementById('withdraw-available').addEventListener('click',()=>{consent.rejectAll();show('guard-action-status','Optional purposes rejected. Scope restrictions remain in place.');});
document.getElementById('review-scope').addEventListener('click',()=>consent.openPreferences());
document.getElementById('guard-scenario').addEventListener('change',event=>{
 unsubscribe();ui.destroy();consent.destroy();const scenario=event.currentTarget.value,site={children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'};
 if(scenario==='children')site.children='present';if(scenario==='unknown')site.sensitiveData='unknown';config.scopeGuards={version:1,revision:'lab-review-'+(++revision),site,purposes:scenario==='purpose'?[{id:'suggestions',facts:{sensitiveData:'present'}}]:[]};
 mount();show('guard-action-status','A new declared assessment revision is active. Old grants do not enable the new scope. Refusals remain respected.');
});
addEventListener('pagehide',event=>{if(!event.persisted){unsubscribe();ui.destroy();consent.destroy();}},{once:true});
