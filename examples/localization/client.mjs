// @requirements REQ-PRODUCT-LOCALIZATION
import {createConsentRuntime,mountControls} from 'notabenda/consent';
const config=await (await fetch('/localization/runtime.json')).json();
const consent=createConsentRuntime(config);
consent.registerService('reading',{purposes:['suggestions'],start({signal}){
 document.querySelector('#reading-state').textContent='Ativadas';
 signal.addEventListener('abort',()=>{document.querySelector('#reading-state').textContent='Desativadas';},{once:true});
 return ()=>{document.querySelector('#reading-state').textContent='Desativadas';};
}});
mountControls(document.querySelector('#privacy-controls'),{consent});
