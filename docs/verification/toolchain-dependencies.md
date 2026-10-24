<!-- @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-RELEASE-CANDIDATE REQ-PRODUCT-SOURCE-CANDIDATE -->
# Worker toolchain dependency review

On 23 October 2026, npm's advisory report identified two moderate Undici issues through the pinned Wrangler/Miniflare toolchain. Its three reported package findings describe that dependency chain, not three independent vulnerabilities. The selected client was `7.29.1`.

The upstream advisories identify [unbounded EventSource parser memory](https://github.com/nodejs/undici/security/advisories/GHSA-4qv8-2p9j-2685) and [response-integrity checks bypassed by mixed-case algorithm tokens](https://github.com/nodejs/undici/security/advisories/GHSA-f72v-6w45-q472). Both identify `7.30.1` as patched for the 7.x line. Selected affected paths were reviewed; this is not a complete toolchain security audit.

The workspace and generated private starter use `overrides: {miniflare: {undici: "7.30.1"}}`. This keeps the existing Wrangler version and affects only its Miniflare client. It does not override the separately resolved 8.x client used by other tooling or add a dependency to the core browser runtime or deployed Worker. npm's suggested Wrangler downgrade would also change unrelated tool behavior and is not used.

`packages/notabenda-cf/test/toolchain.test.mjs` resolves the actual client from Miniflare's dependency context. Against a disposable loopback server, correct uppercase/mixed-case SHA-256, SHA-384 and SHA-512 integrity values accept the exact response; different response digests reject. No external server is contacted. The test verifies the integrity regression, not memory-exhaustion resilience or all client behavior.

The starter test checks that generated projects retain the scoped override. The source-candidate workflow compares the generated override with the reviewed source manifest and independently installs the starter; its result records the actual selected client version. Build, Wrangler dry-run and runtime checks remain separate evidence. npm advisories are a dated database observation, not proof that no vulnerabilities exist.

The fresh npm audit after this change reported zero listed vulnerabilities on 23 October 2026. The 15 focused starter, toolchain and source-candidate tests passed, including the actual integrity regression. These results do not replace the broader security review or final exact-commit candidate check.
