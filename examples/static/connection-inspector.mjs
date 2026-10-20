// @requirements REQ-PRODUCT-CONNECTION-INSPECTION REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {inspectConsentConnection} from '@notabenda/core/consent/inspect';
/** Demonstration UI, loaded only after the visitor explicitly requests inspection. */
export function mountConnectionInspector(root,consent,expected){
 const doc=root.ownerDocument,button=root.querySelector('button'),output=root.querySelector('[data-connection-output]'),status=root.querySelector('[role=status]');let url;
 const clear=()=>{if(url)URL.revokeObjectURL(url);url=undefined;output.replaceChildren();output.hidden=true;};
 const changed=()=>{if(!output.hidden){clear();status.textContent='The controller changed. Inspect again for a current snapshot.';}};
 const stop=consent.subscribe(changed);
 const node=(tag,text)=>{const el=doc.createElement(tag);el.textContent=text;return el;};
 function inspect(){clear();try{const report=inspectConsentConnection(consent,{expected});const dl=doc.createElement('dl');for(const [term,value] of [['Consent inventory',report.configuration.comparison==='matched'?'Matches the intended descriptor':report.configuration.comparison==='different'?'Different: '+report.configuration.differingSections.join(', '):'Not compared'],['Lifecycle callbacks',report.lifecycle.status==='controller-destroyed'?'Controller destroyed':report.lifecycle.registered+' of '+report.lifecycle.declared+' registered'],['Published files','Not checked'],['Application behavior','Not tested']]){const row=doc.createElement('div');row.append(node('dt',term),node('dd',value));dl.append(row);}output.append(dl);const list=doc.createElement('ul');for(const service of report.lifecycle.services)list.append(node('li',service.id+' · '+service.registration+' · '+service.phase));output.append(list);output.append(node('p','Registration shows callbacks owned by this controller. Check real requests, storage, withdrawal and evidence separately.'));
  const a=node('a','Download this inspection');url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));a.href=url;a.download='consent-connection.private.json';output.append(a);output.hidden=false;status.textContent='Snapshot captured at '+report.observedAt+'. No choice or service state was changed.';button.textContent='Inspect again';
 }catch{status.textContent='Could not inspect this controller. No choice or service state was changed.';}}
 button.addEventListener('click',inspect);inspect();return {destroy(){stop();clear();button.removeEventListener('click',inspect);}};
}
