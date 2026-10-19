# Storage cleanup verification

Requirement: `REQ-PRODUCT-STORAGE-CLEANUP`.

Automated tests use exact fictional storage keys and the real consent generation controller. They cover initial leftovers, unrelated-key preservation, detached value-free reports, explicit cookie expiration assignments, existing grants, immediate abort and late teardown writes, pending startup/regrant ordering, rejected/invalid startup, throwing teardown, unavailable/ineffective storage, cookie capability failure, startup retry, expiry/GPC, own-generation destruction, queued cancellation and observer reentrancy. Validation rejects a complete batch before mutation, including necessary/reserved/shared items and invalid or foreign cookie scopes. JSDOM checks default browser getters and same-path cookie expiration; this is not a universal browser cookie guarantee.

Command: `npm run build && node --test packages/notabenda/test/storage-cleanup.test.mjs`.

The local example uses only synthetic browser markers, native consent controls and explicit path `/storage-cleanup`. Real Chromium verification and screenshots are recorded here when performed. Broader browser/vendor/server storage verification remains pending.

Chromium verification, 18 October 2026, against the real local CF static asset route: the initial three declared markers were absent. Creating an unrelated marker and accepting sample memory made all four present. Withdrawal removed the local/session markers and same-path cookie while the unrelated marker remained. Reopening after reload preserved refusal and did not start the producer. The grant/withdrawal flow also worked at 390×844, with matching client/scroll widths (375 CSS px after scrollbar). The helper report remained a cookie expiration request; the visible same-path absence was a separate observation. Screenshots: [desktop](../assets/screenshots/storage-cleanup-desktop.jpg), [mobile](../assets/screenshots/storage-cleanup-mobile.jpg). A final label clarifies that the report describes the last cleanup.

Actual local Worker checks also verified the example's script permission and script-free cookie policy route. No third-party/vendor/HttpOnly or cross-browser guarantee is inferred.
