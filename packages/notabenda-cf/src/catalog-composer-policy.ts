// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
/** Composer's lowercase vendor/package syntax; platform requirements are separate. */
export const composerPackagePattern='^[a-z0-9]([_.-]?[a-z0-9]+)*/[a-z0-9](([_.]|-{1,2})?[a-z0-9]+)*$';
export const composerVendorPattern='^[a-z0-9]([_.-]?[a-z0-9]+)*/$';
const packageName=new RegExp(composerPackagePattern,'u'),vendor=new RegExp(composerVendorPattern,'u');
export const isComposerPackageName=(v:unknown):v is string=>typeof v==='string'&&v.length<=200&&packageName.test(v);
export const isComposerVendorPrefix=(v:unknown):v is string=>typeof v==='string'&&v.length<=200&&vendor.test(v);
