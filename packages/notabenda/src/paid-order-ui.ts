// @requirements REQ-EU-ORDER-ACTION REQ-EU-GUARANTEE-LABEL REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {renderPaidOrderReview} from './paid-order.js';
import type {PaidOrderActionController,PaidOrderSnapshot} from './paid-order-action.js';
/** Host owns the controller and its recovery lifecycle. Destroying this view never means an order was cancelled. */
export function mountPaidOrderAction(container:HTMLElement,options:{action:PaidOrderActionController;idPrefix:string;allowPreview?:boolean}):{destroy():void} {
 const {action}=options,review=action.getReview(),wording=review.definition.wording,doc=container.ownerDocument;
 const root=doc.createElement('div');root.className='nb-paid-order-flow';
 const information=doc.createElement('div');information.innerHTML=renderPaidOrderReview(review,{idPrefix:options.idPrefix,allowPreview:options.allowPreview===true});const expected=information.innerHTML;
 const footer=doc.createElement('div');footer.className='nb-order-action';
 const button=doc.createElement('button');button.type='button';button.className='nb-order-submit';button.textContent=wording.paymentActionLabel;button.disabled=true;
 const reconcile=doc.createElement('button');reconcile.type='button';reconcile.className='nb-order-reconcile';reconcile.textContent=wording.reconcileLabel;reconcile.hidden=true;
 const status=doc.createElement('p');status.className='nb-order-status';status.setAttribute('role','status');status.setAttribute('tabindex','-1');
 footer.append(button,reconcile,status);root.append(information,footer);container.replaceChildren(root);
 const images=[...information.querySelectorAll<HTMLImageElement>('.nb-guarantee-artwork')];let failed=false,closed=false;
 function present(){const ready=images.every(image=>image.complete&&image.naturalWidth>0);action.setPresentationReady(ready&&!failed,()=>!closed&&!failed&&unchanged()&&images.every(image=>image.complete&&image.naturalWidth>0));}
 function imageError(){failed=true;present();}
 function update(state:PaidOrderSnapshot){
  root.dataset.status=state.status;button.hidden=['received','stale','unavailable','destroyed'].includes(state.status)||state.status==='uncertain'||state.status==='reconciling';
  button.disabled=state.status!=='ready'||!state.presentationReady;reconcile.hidden=!state.canReconcile||!['uncertain','reconciling'].includes(state.status);reconcile.disabled=state.status!=='uncertain';
  status.textContent=state.status==='ready'?failed?wording.imageUnavailable:state.presentationReady?wording.ready:wording.loadingImages:state.status==='submitting'?wording.submitting:state.status==='reconciling'?wording.reconciling:state.status==='uncertain'?wording.uncertain:state.status==='received'?wording.received:state.status==='stale'?wording.stale:state.outcome?.status==='rejected'&&state.outcome.reason==='checkout-used'?wording.checkoutUsed:wording.unavailable;
 }
 function unchanged(){return information.innerHTML===expected&&button.childNodes.length===1&&button.firstChild?.nodeType===3&&button.textContent===wording.paymentActionLabel&&!button.hasAttribute('aria-label')&&!button.hasAttribute('aria-labelledby');}
 async function place(){if(!unchanged()){failed=true;action.setPresentationReady(false);status.textContent=wording.unavailable;status.focus();return;}present();try{await action.submit();}catch{}if(!closed)status.focus();}
 async function recover(){try{await action.reconcile();}catch{}if(!closed)status.focus();}
 button.addEventListener('click',place);reconcile.addEventListener('click',recover);
 for(const image of images){image.addEventListener('load',present);image.addEventListener('error',imageError);}
 const unsubscribe=action.subscribe(update);present();const timer=setInterval(()=>action.refresh(),1000);
 return {destroy(){if(closed)return;closed=true;action.setPresentationReady(false);clearInterval(timer);unsubscribe();for(const image of images){image.removeEventListener('load',present);image.removeEventListener('error',imageError);}button.removeEventListener('click',place);reconcile.removeEventListener('click',recover);if(root.parentElement===container)root.remove();}};
}
