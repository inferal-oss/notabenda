// @requirements REQ-PRODUCT-EMBED-LOCALIZATION REQ-PRODUCT-EMBEDS
import {createConsent,createEmbedService,mountControls} from '/assets/runtime/index.js';
let consent,media,controls;
try{
 const [runtime,presentation]=await Promise.all(['consent.json','presentation.json'].map(async path=>{const response=await fetch('/localization/embeds/'+path);if(!response.ok)throw Error();return response.json();}));consent=createConsent(runtime);controls=mountControls(document.querySelector('#privacy-controls'),{consent});
 media=createEmbedService({consent,serviceId:'sample-media',...presentation});
 media.mount(document.querySelector('#sample-frame'),{kind:'iframe',src:'/localization/embeds/frame/',title:'Página incorporada',description:'Uma página deste site que espera pela sua permissão.'});
 media.mount(document.querySelector('#sample-image'),{kind:'image',src:'/embeds/landscape.svg',title:'Ilustração',description:'Uma paisagem fornecida pelo mesmo serviço de mídia.',alt:'Montanhas azuis sob um sol claro'});
}catch{media?.destroy();controls?.destroy();consent?.destroy();const note=document.createElement('p');note.setAttribute('role','status');note.textContent='Os controles não estão disponíveis. A mídia permanece sem carregar. Recarregue para tentar novamente.';document.querySelector('#privacy-controls').append(note);}
