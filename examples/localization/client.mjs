// @requirements REQ-PRODUCT-LOCALIZATION REQ-BR-COOKIE-UI
import {createConsentRuntime,mountControls} from 'notabenda/consent';
const config=await (await fetch('/localization/runtime.json')).json();
const consent=createConsentRuntime(config);
consent.registerService('reading',{purposes:['suggestions'],start({signal}){
 document.querySelector('#reading-state').textContent='Ativadas';
 signal.addEventListener('abort',()=>{document.querySelector('#reading-state').textContent='Desativadas';},{once:true});
 return ()=>{document.querySelector('#reading-state').textContent='Desativadas';};
}});
consent.registerService('reading-counter',{purposes:['reading-count'],start({signal}){
 const key='juniper-pt:reading-count',previous=Number(window.sessionStorage.getItem(key)),count=Number.isInteger(previous)&&previous>=0&&previous<10000?previous+1:1;
 window.sessionStorage.setItem(key,String(count));document.querySelector('#count-state').textContent=String(count);
 signal.addEventListener('abort',()=>{document.querySelector('#count-state').textContent='Desativada';},{once:true});
 return ()=>{document.querySelector('#count-state').textContent='Desativada';window.sessionStorage.removeItem(key);};
}});
mountControls(document.querySelector('#privacy-controls'),{consent});
