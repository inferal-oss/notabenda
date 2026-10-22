// @requirements REQ-ZA-MARKETING
// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-CF-ADMIN
// Technical fixtures only. All records are in-memory; no operational account, auth or data is read.
import {readFile} from 'node:fs/promises';
import {compileLegalDocuments,compileConsentRuntimeConfig,createTermsOffer,createSouthAfricaMarketingOffer} from '@notabenda/core/content';
import {createAdminWorker,createDurableObjectStore,createDocumentHistory,recordLegalRelease,registerFormPermissionOffer,setActiveFormPermissionOffer,getFormPermissionState,formPermissionStreamRef,createSetupWorker} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../packages/notabenda-cf/examples/synthetic.mjs';
import {exampleConsentConfig} from '../examples/static/choices-build.mjs';
export async function accessibilityFixtureData(){
 const config=JSON.parse(await readFile(new URL('../examples/static/notabenda.config.json',import.meta.url),'utf8'));
 // A synthetic declaration exercises production markup, not actual content/legal review.
 for(const doc of Object.values(config.documents))doc.review.status='reviewed';
 config.scopeGuards={version:1,revision:'accessibility-fixture-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 const build=compileLegalDocuments(config),storage=createSyntheticStorage([]);
 await recordLegalRelease(storage,build.artifact);
 const second=structuredClone(config);second.documents.privacy.version='accessibility-2';second.purposes[0].description+=' Contact support to ask about this processing.';
 const revision=compileLegalDocuments(second);await recordLegalRelease(storage,revision.artifact);
 const offer=createTermsOffer(build.artifact,{scopeId:'signup',statement:'I agree to the terms for this sample service.',actionLabel:'Continue with these terms'});
 const permissionOffer=createSouthAfricaMarketingOffer(build.artifact,{permissionId:'newsletter-email',purposeId:config.purposes[0].id,methodLabel:'Email',marketingRequest:{profile:'za-popia-web-request',version:1,goodsServices:'Reading tools and new product offers.',method:'email',labels:{goodsServices:'Products and services',method:'Communication method',responsibleParty:'Who is asking'}},refusal:{label:'I do not consent',recorded:'Refusal saved.',pending:'Awaiting host confirmation.',retry:'Retry refusal'},revision:'email-1',reviewStatus:'reviewed',withdrawalUrl:'/preferences',wording:{title:'Product updates',statement:'Send me occasional product updates by email.',grantLabel:'Save email permission',withdrawLabel:'Withdraw email permission',optionality:'Optional. You can continue without email updates.',withdrawalExplanation:'You can withdraw here at any time.'}});
 const context={siteId:config.site.id,permissionId:'newsletter-email',streamId:'accessibility-person',now:()=>new Date('2026-10-19T12:00:00Z')};
 await registerFormPermissionOffer(storage,permissionOffer,context);await setActiveFormPermissionOffer(storage,permissionOffer.offerId,context);
 const permissionState=await getFormPermissionState(storage,context),streamRef=await formPermissionStreamRef(context);
 const evidence=createAdminWorker({authorize:()=>({store:createDurableObjectStore(createSyntheticStorage(),{prefix:'evidence/demo-site/'}),scopeLabel:'Review workspace'})});
 const history=createAdminWorker({authorize:()=>({store:createDocumentHistory(storage),scopeLabel:'Document history'})});
 const setup=createSetupWorker({authorize:()=>true,scriptUrl:'/qa-a11y/widget.mjs',stylesheetUrl:'/assets/notabenda.css'});
 const pages=[];
 for(const [name,worker,path] of [
  ['evidence',evidence,'/admin/notabenda'],['evidence-detail',evidence,'/admin/notabenda/record?id=2026-10-18%2Fchoice-0042'],
  ['history',history,'/admin/notabenda'],['release-detail',history,'/admin/notabenda/record?id='+build.manifest.artifactId],
  ['document-diff',history,'/admin/notabenda/diff?'+new URLSearchParams({before:build.manifest.artifactId,after:revision.manifest.artifactId,kind:'privacy'})],
  ['operator-setup',setup,'/admin/notabenda/setup']
 ]){
  const response=await worker.fetch(new Request('https://example.test'+path),{});
  if(response.status!==200||!response.headers.get('content-type')?.startsWith('text/html'))throw Error('Accessibility fixture did not render HTML: '+name);
  pages.push({name,html:await response.text()});
 }
 // Keep exact pinned reader files private to the local fixture server. Do not add
 // test releases to the deployable site's artifact collection.
 const artifactFiles=Object.fromEntries([build,revision].flatMap(b=>Object.entries(b.files).filter(([path])=>/^artifacts\/[a-f0-9]{64}\/(?:privacy|cookies|terms)\.html$/u.test(path))));
 return {config,runtimeConfig:compileConsentRuntimeConfig(exampleConsentConfig(config),{evidence:'local'}),offer,permissionOffer,permissionState,streamRef,pages,artifactFiles};
}
