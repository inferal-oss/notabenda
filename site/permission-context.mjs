// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
// Host-owned contact generation. A browser precondition never selects a person or tenant.
export function permissionContext(offer,generation){
 if(generation!==undefined&&!/^[a-f0-9]{64}$/u.test(generation))throw new Error('Invalid session generation.');
 return {siteId:offer.siteId,permissionId:offer.permissionId,streamId:'reader-profile:email-generation-1'+(generation?'-'+generation:''),allowPreview:true};
}
