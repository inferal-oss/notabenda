<!-- @requirements REQ-PRODUCT-RIGHTS-AUTHORING -->
# Request-page authoring verification

Requirement: `REQ-PRODUCT-RIGHTS-AUTHORING`.

The shared API accepts complete bounded plain data, requires an explicit privacy-link decision, compares the normalized public baseline and returns a detached draft. Tests cover real field preservation, external-link replacement without invented actions, route conflicts, unsafe links, incomplete/unknown fields, accessor/symbol/sparse data, stale saves and changed-content revision checks. The editor cannot set reviewed status or alter unrelated consent, service enrollment, restrictions or jurisdiction policy.

JSDOM tests cover blank kind/wording fields, explicit link confirmation, cancel, stale/failed adoption, Enter staying in the current setup stage, collapsed invalid destination expansion, native focus and prepared-output invalidation. Supporting previews disable outside links, namespace IDs and preserve the three legal document kinds. A valid non-English configuration keeps its locale and legal previews; its request-page preview is visibly unavailable.

CLI tests exercise complete ordinary bounded JSON, rejected symlinks/directories, confirmation and a baseline recheck after the last answer. An actual scoped wizard invocation preserves source files and writes the same draft page and privacy link. Invalid input produces no config output. Offline tarball tests verify the exported JavaScript, declarations, server-safe imports and strict consumer types.

These checks verify local authoring and presentation boundaries. They do not verify the operator's actual request workflows, identity handling, submission methods, response deadlines, fulfillment, appeals, historical revision uniqueness or legal applicability. Native browser layout checks complement the DOM tests; they do not certify physical devices or screen readers.
