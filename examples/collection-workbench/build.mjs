// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH
import {createCollectionWorkbenchFiles} from '@notabenda/core/authoring/collection';
import {collectionFlowExample} from '../collection-flow/example.mjs';
export async function collectionWorkbenchFiles(base){
 const {build,settings}=collectionFlowExample(base),files=await createCollectionWorkbenchFiles(build.artifact,{purposeIds:settings.notice.purposeIds,settings},{mode:'preview',delivery:'directory'});
 files['index.html']=files['index.html'].replace('class="nb-page"','class="nb-page nb-demo-page"').replace('<main id="main"','<a class="nb-skip-link" href="#main">Skip to content</a><header class="nb-site-header nb-workbench-sitebar"><a href="/">notabenda</a><nav aria-label="Workbench navigation"><a href="/examples/privacy-information/">All examples</a><a href="/guide/collection-workbench/">Use your release ↗</a></nav></header><main id="main"').replace('<div id="collection-workbench"></div>','<p>This example starts with the combined form’s saved settings. For your site, prepare a workbench from your final public artifact. <a href="/guide/collection-workbench/">Prepare your own →</a></p><div id="collection-workbench"></div>');
 return Object.fromEntries(Object.entries(files).map(([path,body])=>['form-notice-workbench/'+path,body]));
}
