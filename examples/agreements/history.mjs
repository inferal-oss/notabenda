// @requirements REQ-PRODUCT-TERMS-HISTORY
import {compileLegalDocuments,createRetainedReleaseFiles} from '@notabenda/core/content';
/** A wording change with unchanged document sections; review status is a synthetic declaration. */
export function termsHistoryExample(base){
 const config=structuredClone(base);config.site.id='juniper-agreement-history';
 for(const [kind,document] of Object.entries(config.documents))document.route='/agreement-history/'+kind;
 config.terms.agreements=[{scopeId:'account-terms',revision:'account-wording-1',statement:'I agree to the account terms.',actionLabel:'Continue',reviewStatus:'draft'}];
 const before=compileLegalDocuments(config,{mode:'preview'});
 config.terms.agreements=[{scopeId:'account-terms',revision:'account-wording-2',statement:'I agree to the account terms linked above.',actionLabel:'Create account',reviewStatus:'draft'},{scopeId:'workspace-terms',revision:'workspace-wording-1',statement:'I agree to the workspace terms linked above.',actionLabel:'Create workspace',reviewStatus:'draft'}];
 const after=compileLegalDocuments(config,{mode:'preview'});
 const files=createRetainedReleaseFiles([before.artifact,after.artifact],{siteId:config.site.id,mode:'preview'});
 Object.assign(files,after.artifact.pages);
 return {before,after,files,releases:[{artifact:before.artifact,metadata:{recordedAt:'2026-10-20T14:00:00Z',changeNote:'Account agreement wording · initial action'}},{artifact:after.artifact,metadata:{recordedAt:'2026-10-20T15:00:00Z',changeNote:'Account agreement wording · explicit document reference and separate workspace action'}}]};
}
