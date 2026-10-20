# Publication check verification

Requirements: `REQ-PRODUCT-PUBLICATION-CHECK`, `REQ-PRODUCT-RETAINED-RELEASES`.

`packages/notabenda/test/publication.test.mjs` uses disposable real HTTP fixtures to exercise four anonymous exact-path reads, canonical JSON versus byte-exact HTML, missing/changed content and SPA fallbacks, redirects, authorization/media/charset/disposition failures, malformed parameter syntax, chunked and decompressed size bounds, cancellation and deadlines. Invalid local input, unapproved loopback origins, symlinks and preview artifacts fail before network access. Reports omit response bodies and transport details. CLI tests verify stdout and failure exit status; packed-consumer tests verify the exported API and report types.

The legal-pages handoff tells adopters to invoke this observation explicitly after deployment. It neither makes network requests during setup nor marks a pack installed. Current routes, bindings, loaders, evidence and legal review are outside this check. Operators must verify those independently. Test success proves the checker behavior, not any adopter's publication or compliance.

The website host test exercises direct pinned HTML responses through the Workers Assets canonical path, including GET/HEAD, unchanged bytes, no session/storage access, preserved queries and restricted exact-file matching. The live checker identified the former 307 redirects; runtime and deployment checks verify the corrected integration.
