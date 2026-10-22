// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH
import {mountProcessingWorkbench} from './processing-workbench-ui.js';
const root=document.querySelector<HTMLElement>('#processing-workbench'),data=document.querySelector('#processing-workbench-context');
if(root&&data)try{mountProcessingWorkbench(root,{context:JSON.parse(data.textContent??'')});}catch{root.textContent='Could not open this prepared workbench. Rebuild it from an intact public artifact.';}
