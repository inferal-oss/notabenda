// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH
import {mountCollectionWorkbench} from './collection-workbench-ui.js';
const root=document.querySelector<HTMLElement>('#collection-workbench'),data=document.querySelector('#collection-workbench-context');
if(root&&data)try{mountCollectionWorkbench(root,{context:JSON.parse(data.textContent??'')});}catch{root.textContent='Could not open this prepared workbench. Rebuild it from an intact public artifact.';}
