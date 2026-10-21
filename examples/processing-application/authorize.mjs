// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
// The application supplies anonymous continuity and operator authorization.
export async function resolveVisitor(_request, _env) {
  // Return {streamId: opaqueHostReference, headers?: HeadersInit} using your existing
  // anonymous session. No account is required. Never accept a browser-selected identity.
  // This example issues no cookie or credential. Unavailable continuity keeps covered work off.
  return null;
}
export async function authorizeOperator(_request, _env) {
  // Return {inspect:true, manageNotices?:true, dispatch?:true} after host permission checks.
  return null;
}
