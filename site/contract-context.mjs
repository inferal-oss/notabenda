// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-DEMO-WORKSPACE
export function contractContext(definition,generation){
 if(generation!==undefined&&!/^[a-f0-9]{64}$/u.test(generation))throw Error('Invalid session generation.');
 return {siteId:definition.siteId,actionId:definition.actionId,operationId:'contract-example-'+(generation??'operational-preview'),allowPreview:true};
}
