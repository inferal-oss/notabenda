# Evidence export verification

Requirements: `REQ-PRODUCT-EVIDENCE-EXPORT`, `REQ-PRODUCT-CF-ADMIN`.

The automated suite covers separate export permission and per-download reauthorization; exact filters and scoped records; response attachment/security headers; no source lookups; empty continuing segments; complete forward traversal of a synthetic filtered store; malformed queries; UTF-8 ordering; backward/inconsistent cursors; duplicate or out-of-filter adapter records; record size/scan bounds; hostile metadata escaping; record bodies excluded from preview HTML; live changes between preview and download; and a 50-record attachment within the serialized byte budget.

Commands: `npm run build --workspace @notabenda/cloudflare`, `node --test packages/notabenda-cf/test/export.test.mjs packages/notabenda-cf/test/admin.test.mjs`. Packed npm consumer checks exercise public declarations and the helper. Website host tests cover protected export routes and the real scoped history projection. The local Workers runtime script checks the SQLite-backed download and its continuation independently of browser download UI.

Browser inspection and actual command results are recorded below. No test establishes legal sufficiency, complete subject-data disclosure, a frozen snapshot, external artifact availability, authenticity, or retention/erasure completion.

## Results

`npm run check` passed: 205 package tests and 21 website host tests, 59 catalog requirements and 59 scenarios validated, website generation and Worker deployment dry-run. `node scripts/check-site-runtime.mjs` then passed against the actual persisted local SQLite-backed Worker, including protected review/download routes, attachment headers, history projection boundaries and continuation into a different retained release.

Astra independently reviewed the implementation and reran all nine export tests without actionable findings.

The actual synthetic browser preview was inspected at desktop, 390 × 844 and 320 × 700. Both mobile widths had equal document client/scroll widths, including a wrapped 64-character incoming cursor. The next-preview action preserved all filters and advanced the cursor. Keyboard navigation showed visible focus on the continuation action. The back link is a 44px target. Muted admin text was darkened after checking its contrast on the export preview’s tinted surface.

Visual inspection used the loopback-only synthetic host, rendering the package UI with fictional records. The authenticated SQLite-backed HTTP path was verified separately by the actual Worker runtime check. Browser download file readback, full screen-reader/platform coverage, snapshot export, retention/erasure and external disclosure delivery remain unverified or outside this feature.

- [Desktop export review](../assets/screenshots/evidence-export-desktop.jpg)
- [Mobile export selection and download](../assets/screenshots/evidence-export-mobile.jpg)

## 23 October record-copying review

Synthetic inputs reproduced two gaps in the prior normalizer. Record and array getters were invoked during copying. A custom array iterator also replaced an indexed value in the normalized record, changing the data used for inspection and export. These were host-adapter data-boundary issues; the reproduction used no network, storage or provider calls.

Normalization now reads the record envelope and array entries through their own property descriptors. It rejects accessor-backed or inherited record fields and missing/accessor-backed array entries, and never calls an array iterator or serialization hook. Output remains detached from the input. Positive safe-integer byte limits are required; existing traversal, depth and encoded-size budgets remain in place. The comparison route now normalizes both records before inspecting their IDs, matching the detail and source routes.

The six new regression tests and the existing admin/export suites passed together: 33 tests. They check preserved indexed values, inert iterators and serialization hooks, getter rejection without invocation, nested mutation isolation, null-prototype/frozen envelopes, inherited and sparse entries, cycles, invalid limits and a multibyte/escaped UTF-8 boundary. Worker requests exercise generic failures in search, detail, comparison, source inspection, export review and download. An authorized attachment retains the indexed array data rather than the iterator's substituted output. These checks do not establish an adapter-code sandbox, storage authenticity or legal sufficiency.

The actual local SQLite-backed Worker passed authorization, retained document/source history and export checks before and after a process restart. Reusing the same signed test session recovered the original agreement, cookie-choice and processing receipts and their current heads. This is local runtime evidence, not cloud or arbitrary-host acceptance.

The maintainer checker accepts `NOTABENDA_CHECK_PORT` for a separately started loopback Worker and optional `NOTABENDA_CHECK_COOKIE` for the same private disposable session on both sides of a restart. It fails if the server replaces that session. Starting with a fresh session cannot establish recovery of the earlier records. The pass also corrected stale presentation checks: current example terms must carry the Demo ribbon, with every other HTML byte matching the corresponding archive; pinned downloads remain byte-exact. Agreement inspection checks the statement section and exact receipt ID, and storage cleanup checks its served module rather than a former tagline.
