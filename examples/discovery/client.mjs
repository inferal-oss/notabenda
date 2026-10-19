// @requirements REQ-PRODUCT-DISCOVERY
import {createConsent,mountControls,registerStorageService} from '/assets/runtime/index.js';
import {mountDiscovery} from '/assets/runtime/discovery-ui.js';
import {browserCatalogSeed} from '/assets/browser-rules.mjs';
const config=await (await fetch(location.pathname.replace(/\/index\.html$/u,'/').replace(/\/?$/u,'/')+'site.json')).json();
// Explicit development observation origin; the report preserves the configured fictional deployment separately.
const consent=createConsent(config);
registerStorageService({consent,serviceId:'sample-measurements',targets:[{storageId:'sample-measurements'}],start:()=>{localStorage.setItem('juniper-discovery-memory','fictional-marker');return()=>{};}});
mountControls(document.querySelector('#privacy-controls'),{consent});
const tool=mountDiscovery(document.querySelector('#discovery-tool'),{config,browserRules:browserCatalogSeed,captureOrigin:location.origin,routeLabel:'Discovery playground',scenario:'Initial load'});
consent.subscribe(state=>{document.querySelector('#sample-service').textContent=({active:'Allowed',starting:'Starting',stopping:'Stopping','reload-required':'Reload needed',blocked:'Blocked'})[state.services['sample-measurements']];});
document.querySelector('#sample-choices').addEventListener('click',()=>consent.openPreferences());
window.addEventListener('pagehide',event=>{if(!event.persisted){tool.destroy();void consent.destroy();}});

// A plain class marker lets the recognizer explain partial evidence without loading a vendor.
const markerButton=document.querySelector('#sample-marker-toggle'),marker=document.querySelector('#sample-marker');
markerButton.addEventListener('click',()=>{const enabled=markerButton.getAttribute('aria-pressed')!=='true';markerButton.setAttribute('aria-pressed',String(enabled));marker.classList.toggle('cf-turnstile',enabled);marker.textContent=enabled?'Widget class marker present; no SDK loaded.':'No widget class marker.';});
