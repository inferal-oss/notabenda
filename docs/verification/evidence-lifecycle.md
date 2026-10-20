# Evidence lifecycle verification

Requirements: `REQ-PRODUCT-EVIDENCE-LIFECYCLE`, `REQ-EU-RETENTION-ERASURE` (partial/unreviewed), with the existing consent, processing, terms and admin requirements.

The lifecycle suite covers all three ledger families; new/duplicate commands and empty-head blocking; exact context/site/family selection under shared prefixes; preservation of another family's live head; bounded foreign-key scans and persisted continuation; hold revision conflicts and non-expiring review dates; failed-delete rollback; concurrent append/retire ordering; whole-subject terms scope; corrupt bindings and malformed markers; missing transaction capabilities; read-only scoped inspection/export; restore reapplication and newer hold preservation; and eligibility under clock regression.

Frontend integration tests use real ledger retirement and trusted typed transport errors for read/write closure, no retry or grant resurrection, immediate service stopping, terms editing/submission closure, conservative processing restrictions and a delayed in-flight acknowledgment. Package-consumer checks exercise public runtime/type exports. Website tests cover synthetic lifecycle state, read-only/auth boundaries, restored initialization and explicit terminal error responses.

The adapter's transaction callbacks must use ordered bounded reads and atomic writes/deletes. The synthetic adapter tests that contract; the local Wrangler SQLite-backed runtime is checked separately. These checks do not establish a lawful retention period, legal-hold justification, complete identity/recipient scope, external manifest completeness, external copy deletion, production deployment or full disaster recovery.

## Results

`npm run check` passed with 246 package tests and 28 website tests, catalog validation (63 requirements, 21 feature areas, 51 sources and 63 verification scenarios), generated documentation/examples, and a Worker deployment dry-run. The 14 lifecycle tests cover both destructive boundaries and the exact state-filter/export behavior. No service was deployed.

`node scripts/check-site-runtime.mjs` passed against the existing local Wrangler SQLite-backed Worker. It checks five isolated fictional lifecycle contexts: one held, one retired/pending, and three completed scans, including reapplication after an old-payload restore. The live recorded-choice, processing and terms demo paths remain separate. Protected read-only detail/export, exact pending filtering and write refusal are also checked. This is an in-place synthetic restore drill. The separate [starter recovery rehearsal](cloudflare-recovery.md) now tests a pre-erasure KV snapshot in a different fresh local object and replays a later retirement before reopening. A fresh-account deployment and full external-backup recovery exercise remain outstanding.

Astra independently reviewed the deletion boundaries, clock eligibility fixes and terminal browser handling and ran all 57 then-current lifecycle/consent-delivery/processing/terms tests without further actionable findings. The later presentation and exact state-search changes are covered by the current automated tests and browser inspection; they are not attributed to that earlier review.

The actual SQLite-backed backoffice was inspected in Chrome at desktop and 390 × 844 and 320 × 700. Search and detail pages had no horizontal overflow. Expanded digest/decision references also fit at 320px. State shortcuts have 44px touch targets and preserve exact fields in filtered export. Held and pending actions each selected the intended record. The current stage uses `aria-current=step`; complete purge is not announced as a completed future stage for a pending record. Browser viewport overrides were reset afterward. Full screen-reader, Firefox/WebKit and production operational review remain separate.

- [Lifecycle search and state shortcuts](../assets/screenshots/evidence-lifecycle-search-desktop.jpg)
- [Desktop lifecycle detail](../assets/screenshots/evidence-lifecycle-desktop.jpg)
- [Mobile lifecycle detail](../assets/screenshots/evidence-lifecycle-mobile.jpg)
- [Mobile scan counters and restore dates](../assets/screenshots/evidence-lifecycle-mobile-progress.jpg)
