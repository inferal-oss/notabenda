// @requirements REQ-PRODUCT-MARKETING-AUTHORING
import {mountMarketingWorkbench} from './marketing-workbench-ui.js';
const root=document.querySelector<HTMLElement>('#marketing-workbench'),data=document.querySelector('#marketing-workbench-context');
if(root&&data)try{mountMarketingWorkbench(root,{context:JSON.parse(data.textContent??'')});}catch{root.textContent='Could not open this prepared workbench. Rebuild it from an intact public artifact.';}
