# Retained-release verification

18 October 2026. `REQ-PRODUCT-RETAINED-RELEASES`, `REQ-PRODUCT-ARTIFACTS` and `REQ-PRODUCT-AUTHORING`.

Automated checks preserve historical HTML bytes/hashes, keep current mutable routes separate, deduplicate identical inputs, and rebuild into an empty output directory with explicitly supplied earlier artifacts. They reject private envelopes/unknown fields, corruption, wrong sites, unsupported schemas, preview inputs without explicit mode, oversized input, cycles, accessors and malformed CLI files before publication writes. Historical rich MDX output is retained without source evaluation or source attachment publication. The actual packed content API is checked separately from repository-local imports.

The example compiles both fictional releases explicitly. Site checks verify old/current pinned routes and a script-free index, and connect the pair to the history comparison.
## Chromium and local Workers observations

- The actual local Worker served the example index, earlier pinned terms and current terms. The prior page showed draft-1 without the new sentence; the ordinary current route showed draft-2 with the export clarification. Both documents remained script-free and focus began on BODY.
- The host canonicalized the pinned `.html` address to an extensionless URL under the same immutable artifact ID. Fragment links stayed within that document, while its footer terms link reached the current route, as documented.
- At 390×844 and 320×700, client/scroll widths matched. Expanded build references remained contained at 320px. The example uses ordinary links and a native disclosure, with no automatic dialog.
- The authenticated HTTP runtime check compares the exact old and current pinned HTML against their archived inputs, verifies the current route's bytes, and opens the protected comparison in the actual SQLite-backed Worker. This is separate from the browser's public-route checks; no cloud deployment was performed.

Screenshots: [release choices on desktop](../assets/screenshots/retained-releases-desktop.jpg) and [mobile](../assets/screenshots/retained-releases-mobile.jpg).

This does not validate arbitrary HTML safety or establish a deployed release. Trusted compiler provenance, linked-asset retention, host routing, production publication/activation, notification, retention/erasure and legal materiality remain separate responsibilities.
