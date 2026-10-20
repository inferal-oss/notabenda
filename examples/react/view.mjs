// @requirements REQ-PRODUCT-REACT
import {createElement as h,useEffect,useState} from 'react';
import {ConsentProvider,ConsentControls,PreferencesButton,useConsentSnapshot,usePurposeAllowed} from '@notabenda/core/react/consent';

function Purpose({id,name}) {
  const allowed=usePurposeAllowed(id);
  const state=useConsentSnapshot();
  const copy={denied:'Off — declined',withdrawn:'Off — withdrawn',expired:'Off — expired',granted:'Off — awaiting confirmation',unknown:'Off — waiting for your choice'};
  return h('p',{'data-purpose':id},`${name}: ${allowed?'Allowed':copy[state.purposes[id]??'unknown']}`);
}
function Content({config,getRequestCount}) {
  const state=useConsentSnapshot();
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{setHydrated(true);},[]);
  return h('main',{id:'main',className:'nb-document'},
    h('p',{className:'nb-eyebrow'},'Notabenda · React example'),
    h('h1',null,'Cookie controls',h('br'),'with React'),
    h('p',null,'React hooks and controls use the same consent controller as the vanilla example.'),

    h('section',null,h('h2',null,'At your discretion'),
      ...config.consent.purposes.map(p=>h(Purpose,{key:p.id,id:p.id,name:config.purposes.find(f=>f.id===p.id).name})),
      h('p',null,'Sample services: ',h('output',{'data-services':true,'aria-label':'Sample service lifecycle states'},Object.values(state.services).join(' · '))),
      h('p',null,'Optional requests initiated this visit: ',h('output',{'data-request-count':true,'aria-label':'Optional requests initiated this visit'},hydrated?getRequestCount():0)),
      h(PreferencesButton,{className:'nb-choice-button'},'Review your choices')),
    h('section',null,h('h2',null,'Preferences and service status'),h('p',null,'The initial notice leaves this page usable. Open the drawer to choose each purpose, or reject optional features directly. You can revisit your choice at any time.'),h('p',null,h('a',{href:'/choices'},'Try the vanilla example'),' · ',h('a',{href:config.documents.privacy.route.startsWith('/dark/')?'/react':'/dark/react'},'Switch theme'))));
}
export function App({controller,config,legalLinks=Object.values(config.documents).map(({title,route})=>({title,route})),getRequestCount=()=>0}) {
  return h(ConsentProvider,{controller},h(Content,{config,getRequestCount}),h('footer',{className:'nb-site-footer'},h(ConsentControls),h('div',null,h('nav',{className:'nb-legal-links','aria-label':'Legal'},legalLinks.map(link=>h('a',{key:link.route,href:link.route},link.title)))),h('a',{className:'demo-footer-guide',href:'/guide/react'},'Integration guide ↗')));
}
