// @requirements REQ-PRODUCT-FORM-PERMISSION-CONNECTION REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {inspectFormPermissionConnection} from '@notabenda/core/form-permissions/inspect';
/** Optional example chrome. Observations never refresh or change a permission. */
export function mountFormPermissionInspector(root,permission,expectedOffer,expectedStreamRef){
 const doc=root.ownerDocument,button=root.querySelector('button'),output=root.querySelector('[data-permission-inspection-output]'),status=root.querySelector('[role=status]');let url,disposed=false;
 const clear=()=>{if(url)URL.revokeObjectURL(url);url=undefined;output.replaceChildren();output.hidden=true;};
 const changed=()=>{if(!output.hidden){clear();status.textContent='The permission state changed. Inspect again for a current snapshot.';}};
 const stop=permission.subscribe(changed),node=(tag,text)=>{const el=doc.createElement(tag);el.textContent=text;return el;};
 function inspect(){if(disposed)return;clear();try{
  const report=inspectFormPermissionConnection(permission,{expectedOffer,expectedStreamRef}),list=doc.createElement('dl'),head=report.observedHead,receipt=report.historicalReceipt;
  const rows=[
   ['Permission offer',report.offer.comparison==='matched'?'Matches this page’s intended offer':'Different: '+report.offer.differingFields.join(', ')],
   ['Host stream',report.stream.comparison==='matched'?'Matches the expected local stream':report.stream.comparison==='different'?'Different local stream':'Local comparison unavailable'],
   ['Controller state',report.controller.status+' · checkbox '+(report.controller.checked?'selected':'not selected')],
   ['Local allowed state',report.controller.allowed?'Allowed by this controller’s current projection':'Off in this controller’s current projection'],
   ['Last observed backend state',head.status==='not-observed'?'Not observed; server state is unknown':head.reason.replaceAll('-',' ')+' · revision '+head.revision],
   ['Observed active offer',head.status==='not-observed'?'Not observed':head.activeOfferComparison==='mounted-offer'?'Matches the mounted offer':head.activeOfferComparison==='inactive'?'No active offer':'Different from the mounted offer'],
   ['Historical action receipt',receipt.status==='none'?'No action confirmed by this controller':receipt.action+' previously confirmed · '+(receipt.offerComparison==='mounted-offer'?'mounted offer':'earlier or different offer')],
   ...(report.recovery?[
    ['Local recovery',report.recovery.status+' · '+report.recovery.pending+' pending command'+(report.recovery.pending===1?'':'s')],
    ['Local restrictions',[report.recovery.withdrawalPending?'withdrawal awaiting confirmation':null,report.recovery.refusalPending?'refusal awaiting confirmation':null,report.recovery.blocked?'use blocked locally':null].filter(Boolean).join(' · ')||'No restriction flags reported']
   ]:[]),
   ['Publication and backend activation','Not checked'],['Downstream behavior','Not tested']
  ];
  for(const [question,answer] of rows){const row=doc.createElement('div');row.append(node('dt',question),node('dd',answer));list.append(row);}
  output.append(list,node('p','These are separate observations of the page’s controller. A historical receipt can remain after later reads or failed actions. A local match does not verify server authorization, current permission or downstream email delivery.'));
  const a=node('a','Download private inspection');url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));a.href=url;a.download='form-permission-connection.private.json';output.append(a);output.hidden=false;button.textContent='Inspect again';status.textContent='Snapshot captured at '+report.observedAt+'. This inspection changed no permission.';
 }catch{status.textContent='Could not inspect this controller. This inspection changed no permission.';}}
 button.addEventListener('click',inspect);inspect();return {destroy(){if(disposed)return;disposed=true;stop();clear();button.removeEventListener('click',inspect);}};
}
