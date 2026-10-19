// @requirements REQ-PRODUCT-REACT
import {createElement,StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {createConsentRuntime} from 'notabenda/consent';
import {App} from './view.mjs';

const container=document.getElementById('react-root');
const response=await fetch(container.dataset.config);
if(!response.ok)throw new Error('The example configuration could not load.');
const page=await response.json();
if(!Array.isArray(page.legalLinks)||page.legalLinks.length!==3||page.legalLinks.some(link=>!link||typeof link.title!=='string'||!link.title.trim()||link.title.length>300||typeof link.route!=='string'||!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/u.test(link.route)))throw new Error('The example legal navigation could not load.');
// Host-owned: create once before optional work, outside React render and StrictMode effects.
const controller=createConsentRuntime(page.runtime);
const config=controller.getConfig();
let requests=0;
for(const service of config.consent.services)controller.registerService(service.id,{
  purposes:config.services.find(s=>s.id===service.id).purposeIds,
  async start({signal}) {
    if(signal.aborted)return ()=>{};
    const key=`react-demo:${service.id}`;
    requests++;
    let result;
    try {result=await fetch('/react/optional-sample.json',{signal,cache:'no-store'});}
    catch(error){if(signal.aborted)return ()=>localStorage.removeItem(key);throw error;}
    if(!result.ok)throw new Error('The optional response failed.');
    if(!signal.aborted)localStorage.setItem(key,'Optional feature');
    return ()=>localStorage.removeItem(key);
  },
});
hydrateRoot(container,createElement(StrictMode,null,createElement(App,{controller,config,legalLinks:page.legalLinks,getRequestCount:()=>requests})));
