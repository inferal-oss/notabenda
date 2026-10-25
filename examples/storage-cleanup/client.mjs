// @requirements REQ-PRODUCT-STORAGE-CLEANUP
import {createConsent,registerStorageService,mountControls} from '/assets/runtime/index.js';
const config=await (await fetch('/storage-cleanup/consent.json')).json();
const consent=createConsent(config);let starts=0;
const display=(id,value)=>{document.getElementById(id).textContent=value;};
function refresh(){
  for(const [id,storage,key] of [['local-marker','localStorage','juniper-cleanup-0'],['session-marker','sessionStorage','juniper-cleanup-1'],['unrelated-marker','localStorage','juniper-cleanup-unrelated']]){
    try{display(id,window[storage].getItem(key)===null?'Absent':'Present');}catch{display(id,'Unavailable');}
  }
  display('cookie-marker',document.cookie.split(';').some(c=>c.trim().startsWith('juniper-cleanup-2='))?'Present':'Absent');display('starts',String(starts));
}
const service=registerStorageService({consent,serviceId:'sample-measurements',targets:[{storageId:'demo-0'},{storageId:'demo-1'},{storageId:'demo-2',cookieScopes:[{path:'/storage-cleanup'}]}],start(){
  starts++;localStorage.setItem('juniper-cleanup-0','fictional');sessionStorage.setItem('juniper-cleanup-1','fictional');document.cookie='juniper-cleanup-2=fictional; Path=/storage-cleanup; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');refresh();return ()=>{};
}});
service.subscribe(({report})=>{refresh();display('cleanup-status',report? `Last cleanup (${report.reason}): ${report.failed?'some cleanup failed — review or reload required':'web-storage absence checked; cookie expiration requested'}`:'No cleanup needed for a current grant.');});
mountControls(document.getElementById('privacy-controls'),{consent});
document.getElementById('review').addEventListener('click',()=>consent.openPreferences());document.getElementById('create-unrelated').addEventListener('click',()=>{try{localStorage.setItem('juniper-cleanup-unrelated','fictional');}catch{}refresh();});
refresh();
