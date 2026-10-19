// @requirements REQ-PRODUCT-DEMO-WORKSPACE
const ended=new Set(['demo-expired','demo-generation-changed','demo-session-required']);
export function demoSessionEnded(value){
 if(!ended.has(value?.code))return false;
 if(!document.getElementById('demo-session-ended')){
  const message=document.createElement('section');message.id='demo-session-ended';message.className='nb-draft';message.setAttribute('role','alert');
  const text=document.createElement('p');text.textContent='This demo session ended or changed in another tab. Optional services stay off. Reload to use the current workspace.';
  const link=document.createElement('a');link.href=location.pathname;link.textContent='Reload this example →';message.append(text,link);document.querySelector('main').prepend(message);
 }
 return true;
}
