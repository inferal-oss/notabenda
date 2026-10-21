// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN
// Replace these functions with verified application sessions and permission checks.
// Do not trust an arbitrary header, email or browser-supplied identity.
export async function authorizeVisitor(_request, _env) {
  // Return {streamId: opaqueApplicationStreamId} after authenticating this visitor.
  // Resolve the same stream on every call. A new/different identity needs a new controller.
  return null;
}
export async function authorizeOperator(_request, _env) {
  // Return {inspect:true} for read-only admin, or additionally {manageNotices:true}.
  return null;
}
