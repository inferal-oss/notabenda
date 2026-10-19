// @requirements REQ-PRODUCT-EMBEDS
import {createConsent,createEmbedService,mountControls} from '/assets/runtime/index.js';

let consent;
try{
  const response=await fetch('/embeds/site.json');if(!response.ok)throw new Error('Example config unavailable.');
  consent=createConsent(await response.json());
  const media=createEmbedService({consent,serviceId:'sample-media'});
  media.mount(document.querySelector('#sample-frame'),{kind:'iframe',src:'/embeds/frame/',title:'Sample embedded page',description:'A local framed page that loads after permission.'});
  media.mount(document.querySelector('#sample-image'),{kind:'image',src:'/embeds/landscape.svg',alt:'Layered blue mountains beneath a pale lavender sun',title:'Sample illustration',description:'An illustration served by the same media service.'});
  mountControls(document.querySelector('#privacy-controls'),{consent});
  consent.subscribe(state=>{document.querySelector('[data-embed-permission]').textContent=state.permissions['embedded-media']?'Allowed':state.purposes['embedded-media']==='withdrawn'?'Off — withdrawn':'Off — waiting for permission';});
  const showRequests=()=>{document.querySelector('[data-embed-requests]').textContent=String(performance.getEntriesByType('resource').filter(entry=>['/embeds/frame/','/embeds/landscape.svg'].includes(new URL(entry.name).pathname)).length);};
  const observer=new PerformanceObserver(showRequests);observer.observe({type:'resource',buffered:true});showRequests();
}catch{
  consent?.destroy();document.querySelector('[data-embed-permission]').textContent='Controls unavailable. Media stays off; reload to try again.';
}
