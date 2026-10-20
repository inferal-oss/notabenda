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
