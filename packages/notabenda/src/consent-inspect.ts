// @requirements REQ-PRODUCT-CONNECTION-INSPECTION REQ-PRODUCT-PACK-CONNECTION
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeConsentRuntimeConfig} from './consent-runtime-config.js';
import {projectConsentInventory} from './consent-inventory.js';
import type {ConsentRuntimeConfig} from './consent-runtime-config.js';
import type {ConsentStateController,ServiceRegistration,ServiceStatus} from './consent-types.js';

export interface ConsentConnectionInspection {
 schemaVersion:1;kind:'private-consent-connection-inspection';observedAt:string;siteId:string;
 configuration:{comparison:'not-requested'|'matched'|'different';differingSections:string[]};
 lifecycle:{status:'controller-destroyed'|'no-managed-services'|'missing-registrations'|'removed-registrations'|'reload-required'|'transitional'|'registered';declared:number;registered:number;services:{id:string;registration:ServiceRegistration;phase:ServiceStatus}[]};
 publication:{status:'not-checked'};behavior:{status:'not-tested'};
 limits:string[];
}
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
/** Explicit read-only observation. Required-evidence snapshot freshness may read local storage. Never refreshes a controller or performs consent actions. */
export function inspectConsentConnection(controller:ConsentStateController,options:{expected?:ConsentRuntimeConfig}={}):ConsentConnectionInspection {
 const fail=():never=>{throw Error('Supply a live or destroyed Notabenda consent controller and an optional complete expected compiled descriptor. No connection was inspected.');};
 try{assertPlainCatalogData(options);}catch{return fail();}
 if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>k!=='expected')||!controller||typeof controller.getConfig!=='function'||typeof controller.getSnapshot!=='function'||typeof controller.getServiceRegistrations!=='function')return fail();
 let current:ConsentRuntimeConfig['inventory'],expected:ConsentRuntimeConfig|undefined,state:ReturnType<ConsentStateController['getSnapshot']>,registrations:ReturnType<ConsentStateController['getServiceRegistrations']>;
 try{
  if(options.expected!==undefined)expected=normalizeConsentRuntimeConfig(options.expected);
  const config=controller.getConfig(),inventory=projectConsentInventory(config);assertPlainCatalogData(inventory);
  // Projection deliberately excludes other workflows and private authoring bodies.
  current=normalizeConsentRuntimeConfig({schemaVersion:1,kind:'notabenda-consent-runtime',mode:'preview',evidence:'local',inventory}).inventory;
  state=controller.getSnapshot();registrations=controller.getServiceRegistrations();assertPlainCatalogData(state);assertPlainCatalogData(registrations);
  if(Object.keys(registrations).length!==current.consent!.services.length||current.consent!.services.some(({id})=>!['missing','registered','removed'].includes(registrations[id]!)||!['blocked','starting','active','stopping','reload-required'].includes(state.services[id]!))||typeof state.destroyed!=='boolean')return fail();
 }catch{return fail();}
 const services=current.consent!.services.map(({id})=>({id,registration:registrations[id]!,phase:state.services[id]!})),differingSections=expected?Object.keys(current).filter(k=>canonical(current[k as keyof typeof current])!==canonical(expected.inventory[k as keyof typeof current])):[];
 if(expected)for(const key of Object.keys(expected.inventory))if(!Object.hasOwn(current,key)&&!differingSections.includes(key))differingSections.push(key);
 return {schemaVersion:1,kind:'private-consent-connection-inspection',observedAt:new Date().toISOString(),siteId:current.site.id,
  configuration:{comparison:expected?(differingSections.length?'different':'matched'):'not-requested',differingSections},
  lifecycle:{status:state.destroyed?'controller-destroyed':!services.length?'no-managed-services':services.some(s=>s.registration==='missing')?'missing-registrations':services.some(s=>s.registration==='removed')?'removed-registrations':services.some(s=>s.phase==='reload-required')?'reload-required':services.some(s=>s.phase==='starting'||s.phase==='stopping')?'transitional':'registered',declared:services.length,registered:services.filter(s=>s.registration==='registered').length,services},
  publication:{status:'not-checked'},behavior:{status:'not-tested'},limits:[
   'An observation of the supplied controller in this process, not an authenticated or tamper-proof report. The local timestamp is not a server receipt.',
   'Configuration matching compares the selected consent inventory only. It does not compare other packs, runtime evidence mode, release artifacts or deployed files.',
   'Registered means the controller owns a lifecycle callback. It does not prove network isolation, storage cleanup, successful teardown, truthful callbacks or absence of other loaders.',
   'Required-evidence snapshots may read existing local choice storage to check grant freshness; those checks are not bypassed.',
   'Phase is the controller’s current lifecycle state. This inspector does not refresh, await settlement, run acceptance scenarios, record permission or make a legal-compliance determination.',
   'Run the explicit publication checker and application network/storage, withdrawal, evidence, authorization and failure checks separately. Keep this diagnostic private.'
  ]};
}
