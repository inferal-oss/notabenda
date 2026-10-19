// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-ASTRO
import {compileLegalDocuments,createFormPermissionOffer} from 'notabenda/content';
export function formPermissionExample(base){
 const config=structuredClone(base);config.site.id='juniper-permissions';config.controller.name='Juniper Notes Cooperative';
 config.purposes=[{id:'product-news',name:'Product news',description:'Email updates about Juniper Notes and its reading tools.',legalBasis:'Optional affirmative permission. Messaging applicability and request particulars require review before deployment.',dataCategories:['Purpose and channel choice','Opaque contact-generation reference','Request, revision and recording timestamps'],retention:'This workspace is cleared after one day without use.',collection:{source:'direct',description:'An explicit permission choice in the account settings.',required:false,consequences:'Email updates remain off without a current permission.'}}];
 config.services=[];config.storage=[];config.scopeGuards={version:1,revision:'ordinary-news-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 for(const [kind,doc] of Object.entries(config.documents))doc.route='/form-permissions/'+kind;
 const build=compileLegalDocuments(config,{mode:'preview'});
 // Keep the earlier pinned public release reachable from existing evidence.
 const earlier=structuredClone(config);earlier.controller.name=base.controller.name;const previous=compileLegalDocuments(earlier,{mode:'preview'});
 const retained=Object.fromEntries(Object.entries(previous.files).filter(([path])=>path.startsWith('artifacts/')));
 const offer=createFormPermissionOffer(build.artifact,{permissionId:'product-news-email',purposeId:'product-news',channel:{id:'email',label:'Email'},revision:'product-news-4',reviewStatus:'draft',withdrawalUrl:`/artifacts/${build.manifest.artifactId}/privacy.html#nb-privacy-section-rights`,wording:{title:'Email updates',statement:'Allow email updates about Juniper Notes and its reading tools.',grantLabel:'Save email permission',withdrawLabel:'Withdraw email permission',optionality:'Optional. Your workspace draft works without email updates.',withdrawalExplanation:'Withdraw here at any time. This changes email updates for this purpose only.'}},{mode:'preview'});
 return {build,offer,retained};
}
