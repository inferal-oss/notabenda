// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
/** Canonical lowercase ASCII subset of NuGet IDs; display casing and versions are separate. */
export const nugetPackagePattern='^[a-z0-9_]+([.-][a-z0-9_]+)*$';
export const nugetPrefixPattern='^[a-z0-9_]+([.-][a-z0-9_]+)*\\.$';
const name=new RegExp(nugetPackagePattern,'u'),prefix=new RegExp(nugetPrefixPattern,'u');
export const isNugetPackageName=(value:unknown):value is string=>typeof value==='string'&&value.length<=100&&name.test(value);
export const isNugetPackagePrefix=(value:unknown):value is string=>typeof value==='string'&&value.length<=99&&prefix.test(value);
