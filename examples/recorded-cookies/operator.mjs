// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN
const status=document.querySelector('#operator-status'),buttons=[...document.querySelectorAll('[data-operation]')];
for(const button of buttons)button.addEventListener('click',async()=>{
  for(const b of buttons)b.disabled=true;
  status.textContent='Waiting for the backend…';
  try{
    const response=await fetch('/backoffice/'+button.dataset.operation,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Notabenda-Request':'1'},body:'{}'});
    if(!response.ok)throw Error();
    status.textContent=button.dataset.operation==='register'?'Release and notice archived. Activation is a separate step.':'The built notice is active for new choices.';
  }catch{status.textContent='The operation was not confirmed. Check operator permission and register before activating. You can retry the same fixed operation.';}
  finally{for(const b of buttons)b.disabled=false;}
});
