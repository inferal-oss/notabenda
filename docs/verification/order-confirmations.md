# Order confirmation verification

19 October 2026. Linked to `REQ-EU-ORDER-CONFIRMATION`, `REQ-PRODUCT-ORDER-CONFIRMATION`, `REQ-PRODUCT-EVIDENCE-LIFECYCLE`, and `REQ-PRODUCT-CF-ADMIN`.

## Automated mechanics

`packages/notabenda-cf/test/order-confirmations.test.mjs` covers complete host-input binding; draft/production gates; reference-only digital-content rejection; exact text/file bytes; detached buffers; atomic file/outbox rollback; chunk corruption and file limits; unchanged admission recovery; fixed destination versions; provider deduplication after a lost response; replacement leases; stale settlement; callback mutation; pre-abort and timeout; committed-but-lost settlement; independent inspection permissions; escaped text and inert downloads; generic export exclusion; cancellation, pending-work retirement, scoped purge and orphaned-job restore cases. Formation time is a host fact and may precede local admission.

The fixture's supplied legal content is synthetic and does not establish legal sufficiency. Storage fakes exercise transactions separately from the actual SQLite runtime. The optional `scripts/check-order-confirmation-runtime.mjs` check uses owned loopback Durable Objects and simulated providers; it sends no external messages.

## Remaining acceptance

Actual recipient destination/version resolution, downstream durable deduplication, real provider responses, recipient delivery/reconciliation, durable scheduling, timely continuation after capture, and external quiescence must be rehearsed by the host. Source-backed content review must cover all applicable information, digital-content consent/acknowledgment, contract facts, timing, national rules and accessible customer copies. The server archive, a link, or an accepted provider job is insufficient evidence by itself. Corrections and changed-destination resends are unsupported in this initial profile and need a separate host workflow.

## Observed runtime and interface results

The owned SQLite check passed against two separate Durable Objects and a controlled clock. Confirmation files included a 360,000-byte attachment. After a simulated lost provider response and process restart, the exact manifest, fixed destination, attachment hash and admission receipt were recovered. A live lease prevented duplicate invocation; replacing its expired lease reused the delivery ID and exact payload. The independent simulated provider received two calls and committed once; old settlement was refused. Both owned runtime processes stopped cleanly. This checks actual local persistence and a simulated endpoint, not a deployed provider.

The full project check passed 622 package tests and 82 site tests, catalog validation and a Worker deployment dry run. A packed CF-only consumer imported the confirmation subpath and compiled strict TypeScript without frontend/runtime dependencies. All 200 retained legal artifact files matched their previous SHA-256 values. Subsequent interface changes are covered by focused checks and manual Chromium review.

Desktop and 390px Chromium review checked current status separately from retained files, readable contract/addressee/date context, escaped plain-text customer copy, exact file links and collapsed delivery references. At 390px the document client and scroll widths both measured 375px, and file links measured at least 44px high. This selected browser review does not replace full accessibility, contrast, assistive-technology, translation or physical-device acceptance.

The final 320px pass also contained the page width (305px client and scroll). After the last presentation changes, all 113 selected package/site tests and the Worker dry run passed. Astra's final read-only review found no remaining concrete blocker; broader acceptance remains listed above.
