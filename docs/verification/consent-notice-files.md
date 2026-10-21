# Consent notice file verification

`REQ-PRODUCT-CONSENT-NOTICE-FILES` connects build output, explicit public retention and the existing receipt protocol.

The build helper verifies an intact public legal release before generating native or explicitly supplied interface wording. Tests compare its descriptor to the existing factory and its alias/pinned bytes to canonical JSON. Copy revisions under the same artifact get different notice-ID paths while preserving material scope. Retained files never replace the current alias.

Retention tests check complete descriptors against their releases, including validly rehashed tampering with scopes, policy fields, document references and configured localization. They reject missing releases, wrong sites, corrupt public HTML, implicit preview, malformed settings, oversized input, sparse/custom arrays, accessors and executable values. Getter and toJSON sentinels are not invoked. These checks do not sanitize arbitrary HTML or authenticate its author.

CLI scenarios use JSON, YAML, YML and Markdown-frontmatter configurations. Clean builds preserve exact older notice JSON and policy HTML, deduplicate repeated notice inputs, and support retention without a current notice alias. Unsafe or oversized retained files and scope/mode mismatches fail before output. Rebuilding an existing alias without an explicit current scope preserves the earlier files and reports the missing decision.

The Cloudflare integration test builds a YAML configuration through the actual CLI, records its artifact in a DO-storage-shaped in-memory test adapter, registers its generated notice and verifies that registration has not selected it. After explicit activation, the browser runtime stays blocked while a matching receipt is delayed, starts after acknowledgment and stops after rejection. This exercises the existing frontend/backend protocol; it is not a remote Durable Object or external-provider test.

The recorded-choice website example publishes a hash-pinned notice beside its existing bootstrap copy. Site tests compare notice IDs, exact pinned bytes, referenced policy hashes, anonymous Worker routing and current documentation metadata. Native review covers guide presentation at desktop and mobile sizes. Publishing a notice does not register it, activate it, establish identity, prove display or grant permission. Host authorization, receipt endpoints, retention policy and production review remain separate.
