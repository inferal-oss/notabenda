// @requirements REQ-PRODUCT-PUBLICATION-INSPECTION
// Maintainer-only reader/transport fixture. Never scaffold or publish this module.
import {registerTermsOffer,setActiveTermsOffer,getTermsRecordingSelection} from '@notabenda/cloudflare';
export function createPublicationFixture(storage,assets,offer){
 const context={siteId:offer.siteId,scopeId:offer.scopeId},read=()=>getTermsRecordingSelection(storage,context);
 const publication={origin:'https://fixture.example.test',label:'Starter asset binding',fetch:request=>{const url=new URL(request.url);url.pathname=url.pathname.slice(0,-5);return assets.fetch(new Request(url,request));}};
 const base={family:'terms',siteId:offer.siteId,scopeId:offer.scopeId,read};
 return {
  targets:[{...base,id:'published',title:'Published fixture',publication},{...base,id:'different',title:'Changed fixture',publication:{...publication,label:'Injected different response',fetch:async()=>new Response('Different fixture HTML',{headers:{'Content-Type':'text/html'}})}},{...base,id:'missing',title:'Missing fixture',publication:{...publication,label:'Injected missing response',fetch:async()=>new Response('Not found',{status:404})}}],
  async seed(){await registerTermsOffer(storage,offer,context);await setActiveTermsOffer(storage,offer.offerId,context);return {seeded:true};},
  async state(){const rows=await storage.list({prefix:'notabenda/',limit:10000});if(rows.size===10000)throw Error('Fixture snapshot limit.');return [...rows];},
 };
}
