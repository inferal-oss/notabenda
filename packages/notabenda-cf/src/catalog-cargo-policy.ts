// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
/** Bounded ASCII crate identifiers; not registry ownership or a complete Cargo validator. */
export const isCargoPackageName=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,64}$/u.test(value);
export const isCargoPackagePrefix=(value:unknown):value is string=>isCargoPackageName(value)&&/[-_]$/u.test(value);
