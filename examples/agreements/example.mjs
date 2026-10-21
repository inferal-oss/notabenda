// @requirements REQ-PRODUCT-TERMS-AUTHORING
// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-TERMS-ACCEPTANCE
import {compileLegalDocuments,createConfiguredTermsOffer} from '@notabenda/core/content';
export function agreementExample(base,{dark=false}={}){
 const prefix=dark?'/dark':'',theme=dark?'dark':'light',config=structuredClone(base);config.site.id='juniper-agreement';
 for(const [kind,doc] of Object.entries(config.documents))doc.route=`${prefix}/agreement/${kind}`;
 config.terms.agreements=[{scopeId:`sample-${theme}`,revision:'sample-wording-1',statement:'I agree to this version of the fictional Juniper Notes sample terms.',actionLabel:'Record sample agreement',reviewStatus:'draft'}];
 const build=compileLegalDocuments(config,{mode:'preview',stylesheetUrl:dark?'/assets/dark.css':'/assets/notabenda.css'}),offer=createConfiguredTermsOffer(build.artifact,`sample-${theme}`,{mode:'preview'});
 return {config,build,offer};
}
