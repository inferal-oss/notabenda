// @requirements REQ-PRODUCT-TERMS-HISTORY
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-ADMIN
/**
 * Implement this using your existing session/access policy.
 * Return {inspect:true, configure:true|false, export:true|false, source:true|false, catalogReview:true|false, termsSettings:true|false} or null.
 * Verify identity, expiry and permissions; browser headers are not trusted grants.
 * The package supplies no login, identity provider or credentials.
 */
export async function authorizeHostRequest(_request,_env){
 return null;
}
