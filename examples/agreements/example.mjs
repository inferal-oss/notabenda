// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-TERMS-ACCEPTANCE
import {compileLegalDocuments,createTermsOffer} from '@notabenda/core/content';
export function agreementExample(base,{dark=false}={}){
 const prefix=dark?'/dark':'',theme=dark?'dark':'light',config=structuredClone(base);config.site.id='juniper-agreement';
 for(const [kind,doc] of Object.entries(config.documents))doc.route=`${prefix}/agreement/${kind}`;
 const build=compileLegalDocuments(config,{mode:'preview',stylesheetUrl:dark?'/assets/dark.css':'/assets/notabenda.css'}),offer=createTermsOffer(build.artifact,{scopeId:`sample-${theme}`,statement:'I agree to this version of the fictional Juniper Notes sample terms.',actionLabel:'Record sample agreement'},{mode:'preview'});
 return {config,build,offer};
}
