// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-DEMO-WORKSPACE
import {createTermsAcceptance,TermsAcceptanceError} from '@notabenda/core/terms';
import {demoSessionEnded} from '../static/demo-session.mjs';
export function demoAgreementController(offer,generation,theme='light'){
 if(!generation)throw Error('Open the agreement through its demo session.');
 return createTermsAcceptance(offer,{operationId:`synthetic-${theme}-operation-${generation}`,allowPreview:true,async submit(command,{signal}){
  const response=await fetch('/demo/agreements/'+theme,{method:'POST',signal,headers:{'Content-Type':'application/json','X-Notabenda-Demo':'1','X-Notabenda-Demo-Generation':generation},body:JSON.stringify(command)}),value=await response.json().catch(()=>({}));
  if(!response.ok){if(demoSessionEnded(value)||value.code==='context-retired')throw new TermsAcceptanceError('context-retired');if(value.code==='stale-offer')throw new TermsAcceptanceError('stale-offer');throw Error('Recording not confirmed.');}return value;
 }});
}
