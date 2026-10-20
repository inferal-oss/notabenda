// @requirements REQ-PRODUCT-TERMS-ADAPTERS
import {createTermsAcceptance} from '@notabenda/core/terms';
import {compileLegalDocuments,createTermsOffer} from '@notabenda/core/content';
import {recordLegalRelease,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
export async function termsFixture({afterRecord,operationId='operation-one',config}={}){
 const build=compileLegalDocuments(config??await fixture({reviewed:true})),offer=createTermsOffer(build.artifact,{scopeId:'signup',statement:'I agree to this exact version of the sample terms.',actionLabel:'Record agreement'}),storage=createSyntheticStorage([]),context={siteId:offer.siteId,scopeId:offer.scopeId,subjectId:'subject-one',operationId,now:()=>new Date('2026-10-20T12:00:00.000Z')};
 await recordLegalRelease(storage,build.artifact);await registerTermsOffer(storage,offer,context);await setActiveTermsOffer(storage,offer.offerId,context);
 const commands=[];let destroyed=0;
 const controller=createTermsAcceptance(offer,{operationId,submit:async command=>{commands.push(command);const receipt=await recordTermsAcceptance(storage,command,context);await afterRecord?.(receipt);return receipt;}}),destroy=controller.destroy;
 controller.destroy=()=>{destroyed++;destroy();};
 return {controller,offer,commands,storage,context,destroyed:()=>destroyed};
}
