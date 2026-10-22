// @requirements REQ-PRODUCT-TERMS-RECOVERY
// @requirements REQ-PRODUCT-TERMS-ACCEPTANCE
// Maintainer fixture only. Use the actual example transport and native field.
import {mountTermsAcceptance} from '@notabenda/core/terms';
import {createIndexedDBTermsRecoveryJournal} from '@notabenda/core/terms/recovery';
import {demoRecoverableAgreementController} from '../examples/agreements/transport.mjs';
const data=await fetch('/fixture.json').then(r=>{if(!r.ok)throw Error('Fixture unavailable.');return r.json();});
const journal=createIndexedDBTermsRecoveryJournal({databaseName:'notabenda-terms-http-rehearsal-v1'});
const controller=await demoRecoverableAgreementController(data.offer,data.generation,journal);
const view=mountTermsAcceptance(document.querySelector('#agreement'),{acceptance:controller});
let sequence=0,closed=false;
async function observe(){
 const current=++sequence;
 try{
  const response=await fetch('/state.json',{cache:'no-store'});if(!response.ok)throw Error();const state=await response.json();
  if(closed||current!==sequence)return;
  document.querySelector('[data-attempts]').textContent=String(state.attempts);
  document.querySelector('[data-records]').textContent=String(state.records);
  document.querySelector('[data-command]').textContent=state.sameCommand===null?'Awaiting retry':state.sameCommand?'Same command':'Command changed';
  document.querySelector('[data-receipt]').textContent=state.sameReceipt===null?'Awaiting retry':state.sameReceipt?'Original receipt':'Receipt differs';
  document.querySelector('[data-observation]').textContent='Server observations updated.';
 }catch{if(!closed&&current===sequence)document.querySelector('[data-observation]').textContent='Server observations unavailable.';}
}
const unsubscribe=controller.subscribe(state=>{if(state.status!=='submitting')void observe();});
await observe();
window.addEventListener('pagehide',event=>{if(event.persisted||closed)return;closed=true;sequence++;unsubscribe();view.destroy();controller.destroy();journal.close();});
