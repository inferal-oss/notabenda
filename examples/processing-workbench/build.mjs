// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH
import {createProcessingWorkbenchFiles} from '@notabenda/core/authoring/processing';
import {processingFiles} from '../processing-choices/build.mjs';
export async function processingWorkbenchFiles(base){
 const existing=await processingFiles(base),notice=JSON.parse(existing['processing-choices/notice.json']),artifact=JSON.parse(existing['artifacts/'+notice.artifactId+'.json']);
 const settings={schemaVersion:1,reviewedArtifactId:notice.artifactId,scopeId:notice.scopeId,activities:notice.activities,wording:notice.wording};
 const files=await createProcessingWorkbenchFiles(artifact,{settings},{mode:'preview',delivery:'directory'});
 files['index.html']=files['index.html'].replace('class="nb-page"','class="nb-page nb-demo-page"').replace('<main id="main"','<a class="nb-skip-link" href="#main">Skip to content</a><header class="nb-site-header"><a href="/">notabenda</a><nav aria-label="Workbench navigation"><a href="/examples/privacy-choices/">All examples</a><a href="/guide/processing-workbench/">Use your release ↗</a></nav></header><main id="main"').replace('<div id="processing-workbench"></div>','<p>This editor starts with the processing example’s notice settings. For your site, prepare it from your final public artifact. <a href="/guide/processing-workbench/">Prepare your own →</a></p><div id="processing-workbench"></div>');
 return Object.fromEntries(Object.entries(files).map(([path,body])=>['processing-notice-workbench/'+path,body]));
}
