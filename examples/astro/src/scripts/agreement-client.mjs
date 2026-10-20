// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-ASTRO REQ-PRODUCT-DEMO-WORKSPACE
import {mountAgreementSession} from '../../../agreements/astro-session.mjs';
import {demoAgreementController} from '../../../agreements/transport.mjs';
import {demoSessionEnded} from '../../../static/demo-session.mjs';
const meta=name=>document.querySelector(`meta[name=${name}]`)?.content,generation=meta('notabenda-demo-generation'),offer=JSON.parse(meta('notabenda-terms-offer')),acceptance=demoAgreementController(offer,generation);
const session=mountAgreementSession({document,acceptance,generation,offerId:offer.offerId,onSessionEnded:()=>demoSessionEnded({code:'demo-generation-changed'})});
window.addEventListener('pagehide',event=>{if(!event.persisted){session.destroy();acceptance.destroy();}});
