// @requirements REQ-PRODUCT-TERMS-CONNECTION REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {inspectTermsConnection} from '@notabenda/core/terms/inspect';
/** Example chrome, loaded on request. Inspection and agreement submission stay separate. */
export function mountTermsInspector(root,acceptance,expectedOffer,expectedOperationId){
 const doc=root.ownerDocument,button=root.querySelector('button'),output=root.querySelector('[data-terms-inspection-output]'),status=root.querySelector('[role=status]');let url,disposed=false;
 const clear=()=>{if(url)URL.revokeObjectURL(url);url=undefined;output.replaceChildren();output.hidden=true;};
 const changed=()=>{if(!output.hidden){clear();status.textContent='The agreement state changed. Inspect again for a current snapshot.';}};
 const stop=acceptance.subscribe(changed),node=(tag,text)=>{const el=doc.createElement(tag);el.textContent=text;return el;};
 function inspect(){if(disposed)return;clear();try{
  const report=inspectTermsConnection(acceptance,{expectedOffer,expectedOperationId}),list=doc.createElement('dl');
  for(const [question,answer] of [
   ['Terms offer',report.offer.comparison==='matched'?'Matches this page’s intended offer':'Different: '+report.offer.differingFields.join(', ')],
   ['Host operation',report.operation.comparison==='matched'?'Matches the expected local operation':report.operation.comparison==='different'?'Different local operation':'Local comparison unavailable'],
   ['Controller state',report.controller.status+' · checkbox '+(report.controller.checked?'selected':'not selected')],
   ['Agreement receipt',report.receipt.status==='controller-confirmed'?'Previously confirmed by this controller':'No receipt confirmed by this controller'],
   ['Publication and backend activation','Not checked'],['Application behavior','Not tested']
  ]){const row=doc.createElement('div');row.append(node('dt',question),node('dd',answer));list.append(row);}
  output.append(list,node('p','This reads the page’s controller. A local match does not verify server authorization, active terms, published files or the action that follows agreement.'));
  const a=node('a','Download private inspection');url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));a.href=url;a.download='terms-connection.private.json';output.append(a);output.hidden=false;button.textContent='Inspect again';status.textContent='Snapshot captured at '+report.observedAt+'. This inspection submitted no agreement.';
 }catch{status.textContent='Could not inspect this controller. This inspection submitted no agreement.';}}
 button.addEventListener('click',inspect);inspect();return {destroy(){if(disposed)return;disposed=true;stop();clear();button.removeEventListener('click',inspect);}};
}
