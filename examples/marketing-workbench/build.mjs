// @requirements REQ-PRODUCT-MARKETING-AUTHORING
import {createMarketingWorkbenchFiles} from '@notabenda/core/authoring/marketing';
import {formPermissionExample} from '../form-permissions/example.mjs';
export async function marketingWorkbenchFiles(base){
 const {build,offer}=formPermissionExample(base),{permissionId,purposeId,revision,reviewStatus,wording,withdrawalUrl,deliveryWindowSeconds,marketingRequest,refusal,channel}=offer;
 const settings={schemaVersion:1,reviewedArtifactId:offer.artifactId,permission:{permissionId,purposeId,revision,reviewStatus,wording,withdrawalUrl,deliveryWindowSeconds,marketingRequest,refusal,methodLabel:channel.label}};
 const files=await createMarketingWorkbenchFiles(build.artifact,{purposeId,settings},{mode:'preview',delivery:'directory'});
 files['index.html']=files['index.html'].replace('class="nb-page"','class="nb-page nb-demo-page"').replace('<main id="main"','<a class="nb-skip-link" href="#main">Skip to content</a><header class="nb-site-header"><a href="/">notabenda</a><nav aria-label="Workbench navigation"><a href="/examples/privacy-choices/">All examples</a><a href="/guide/marketing-workbench/">Use your release ↗</a></nav></header><main id="main"').replace('<div id="marketing-workbench"></div>','<p>Start with this request’s settings, or prepare a local editor from your own final release. <a href="/guide/marketing-workbench/">Prepare your request →</a></p><div id="marketing-workbench"></div>');
 return Object.fromEntries(Object.entries(files).map(([path,body])=>['marketing-request-workbench/'+path,body]));
}
