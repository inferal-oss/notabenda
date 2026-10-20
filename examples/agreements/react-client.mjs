// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-REACT
import {createElement as h,StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {ReactAgreementApp} from './react-view.mjs';
import {demoAgreementController} from './transport.mjs';
const generation=document.querySelector('meta[name=notabenda-demo-generation]')?.content,dark=location.pathname.startsWith('/dark/'),offer=JSON.parse(document.querySelector('meta[name=notabenda-terms-offer]').content);
const controller=demoAgreementController(offer,generation,dark?'dark':'light');
hydrateRoot(document.getElementById('react-agreement-root'),h(StrictMode,null,h(ReactAgreementApp,{controller,dark})));
window.addEventListener('pagehide',event=>{if(!event.persisted)controller.destroy();});
