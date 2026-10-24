# Form permission verification

Requirements: `REQ-PRODUCT-A11Y`, `REQ-PRODUCT-FORM-PERMISSIONS`, `REQ-EU-CONSENT`, `REQ-CA-MEANINGFUL`, `REQ-EU-MARKETING`, `REQ-CA-CASL-OPTIN`. Legal research links are contextual; the product mechanism does not certify regional compliance.

Automated tests exercise intact release/wording binding, independent archive reconstruction, stable purpose/channel/revision identities, preview gates, unchecked/absent-field behavior, no automatic reads or form submission, acknowledged grants, old-offer withdrawal, late first withdrawal versus historical retry, lost acknowledgments, grant/withdraw orderings, activation rollback, non-cookie scope guards, subject/contact/channel isolation, pending contact-change rejection, delivery windows, invalid requests/replies, monotonic response bounds across errors, cancellation before transport, hung transports and nonce-preserving retries, retirement/holds/purge isolation, minimized projections, and host-authorized export. Admin presentation is also checked for distinct historical/read-time state and both time sources.

The focused suite now also covers transactional IndexedDB recovery, two-connection serialization/abort, reload, volatile withdrawal, changed offers/artifacts/contacts, stale tabs, persistent high-water fences and keyboard continuity. Site integration tests cover signed session routing, separate contact-generation streams, scoped inspection/export, retirement, seed resume and a real-controller bootstrap whose initial read fails or never settles. Withdrawal remains usable in both cases; ordinary form submission makes no permission write.

An earlier baseline project check passed 367 tests (324 package tests and 43 site tests), catalog validation, site generation and the Worker deployment dry run. Recovery and UX additions also have actual local Chromium verification.

Run `npm run build`, then `node --test packages/notabenda/test/form-permission.test.mjs packages/notabenda-cf/test/lifecycle.test.mjs`.

The optional local runtime check, `node scripts/check-form-permission-runtime.mjs`, passed against an isolated SQLite Worker: concurrent duplicate grants produce one event, crossed contact streams fail, withdrawal keeps old grant retries restrictive, inspection/export are session-scoped, public policy HTML remains script-free, and session/receipts/revision/state survive a process restart. It owns its loopback runtime and stores its disposable fixture under ignored `.local/`; it does not deploy.

Actual Chromium checks: light/midnight grant and withdrawal share the same session stream; the primary draft action leaves the saved revision unchanged; a changed offer does not inherit a prior grant. A historical grant detail after withdrawal shows the historical action beside the negative current evaluation. Searching `withdrawn` returns matching evidence. At 320px and 390px the public field and 320px admin search fit without horizontal document overflow; public input text is 16px and permission buttons are 46px tall. Acknowledged permission hides the grant draft instead of displaying an unchecked box beside an active grant.

Screenshots: [light](../assets/screenshots/form-permissions-desktop.jpg), [mobile](../assets/screenshots/form-permissions-mobile.jpg), [midnight](../assets/screenshots/form-permissions-midnight.jpg), [historical grant detail](../assets/screenshots/admin-form-permission-detail.jpg), [mobile evidence search](../assets/screenshots/admin-form-permissions-mobile.jpg).

See [the visitor/operator UX review](ux-review.md) for actual IndexedDB outage/reload/retry observations and interface changes.

Remaining acceptance work: automatic/background delivery, the complete accessibility/platform matrix, and regional legal/wording review. The checks above do not establish those items.

## React field verification

`packages/notabenda/test/react-form-permission.test.mjs` verifies the provider/hooks/native field around the actual core controller and CF ledger: conservative SSR even with a recorded grant, matching hydration after an early host read, immutable cached snapshots, one StrictMode mount, cleanup without host destruction, no mount-time transport, unrelated form submission, controller replacement and exact pending-request retry after remount. `react-package.test.mjs` installs the tarball and type-checks the new exports, including nested read-only state. Site checks cover the real built light/midnight entry pages, local bundle, inert server markup and session-only host context injection.

Actual Chromium verified the following on the SQLite-backed local site: a checked permission followed by workspace preparation kept revision 9 unchanged; explicit Save recorded revision 10 and moved focus to withdrawal; reload recovered that grant; mobile withdrawal recorded revision 11 with an unchecked draft; midnight recovered the withdrawn state at the same revision. At 320px there was no horizontal document overflow, the public text input remained 16px and both permission buttons were 46px tall. This is an initial Chromium check, not the broader platform matrix.

Screenshots: [React desktop](../assets/screenshots/react-form-permissions-desktop.jpg), [React mobile withdrawal](../assets/screenshots/react-form-permissions-mobile.jpg). The [React guide](../REACT.md#ordinary-form-permissions) documents ownership, SSR, fallback and explicit transport behavior.

## Astro field verification

`packages/notabenda/test/astro-form-permission.test.mjs` exercises named mounts, repeated page loads, detach/remount, absent routes, draft retention without recording, duplicate-owner isolation, changed offers, cleanup and exact pending-request retry through navigation. The Astro tarball consumer compiles the static component and verifies its readable fallback without a framework/runtime dependency in default installs. Real Astro build checks include both permission routes, shared styling, empty server mounts, script-free policy pages and exclusion of the local draft form from router handling. `site/test/astro-permission.test.mjs` exercises the actual host bootstrap across repeated page loads and session/contact/offer replacement before bridge refresh.

Actual local Chromium observed a workspace title and checked draft persist from the first page to review while saved revision 11 stayed withdrawn. The browser caught Astro router interception of the local draft form; the form is now explicitly excluded, and a recheck kept its URL unchanged with no permission write. Explicit Save recorded revision 12, which survived navigation to review; mobile withdrawal recorded revision 13. At 320px there was no horizontal document overflow, the text input was 16px and permission buttons were 46px tall. These observations use the local SQLite-backed isolated session and do not establish the wider accessibility/platform matrix.

Screenshots: [Astro desktop](../assets/screenshots/astro-form-permissions-desktop.jpg), [Astro mobile withdrawal](../assets/screenshots/astro-form-permissions-mobile.jpg).

## Explicit refusal

`form-permission.test.mjs` and `form-permission-localization.test.mjs` exercise version 3 refusal copy, initial negative choice, exact replay, old-grant ordering, failed reads, inactive/changed offers, host-context isolation, retirement, lost acknowledgement/reload, local-journal failure and cross-tab grant fencing. Version 1/2 offers and existing localization dictionaries remain accepted. These mechanism tests do not establish lawful solicitation, prescribed-information sufficiency, company-wide suppression or provider fulfillment. `VERIFY-ZA-MARKETING` remains partial.

## South African web-request presentation

`REQ-ZA-MARKETING` remains partial. The regional profile tests cover version 4 identity and bounds, channel derivation, required refusal, independent backend rejection of forged profiles/controller facts, inert text, visible and accessible request particulars, complete host-language headings, inspected/exported declarations, activation changes, old-offer negative choices and exact recovery across profile revisions. React/ Astro tests use the shared native disclosure without mount-time transport. The accessibility fixture uses the regional offer for its initial and error permission cases.

These tests establish presentation and archival mechanics, not solicitation eligibility, prescribed-form equivalence, truth of product declarations, actual sending or wider suppression.

### 22 October: regional request browser checks

The clean build passed 1,332 package tests and 205 site tests, catalog validation and the Worker dry run. The previous published version 3 offer reproduced exactly with the updated generic builder. Local Chromium observed an ordinary workspace action leave a checked permission draft unrecorded, then an explicit grant and an operator view containing the pinned goods/services, method, controller and exact labels.

The regional native fixture was scanned in its initial and intentional recording-error states at actual frame widths of 320, 390 and 1,215 pixels. All six scans reported zero violations, errors and incomplete results. Measured document widths were 305, 375 and 1,200 pixels, with the request within each viewport and referenced by its checkbox. These are desktop Chromium frame layouts. Physical devices, Firefox/Safari, assistive technology and full application/marketing acceptance remain separate work.

### 23 October: native Safari keyboard and failure checks

Safari 27.0 on macOS checked the regional permission fixture built from commit `1d0a40133386bce5377126b7bd8f6c50ed59bceb`. The local fixture uses the actual controller and field, a synthetic saved-off response and an intentionally failing submit callback. It has no recovery journal, live backend or provider connection.

Using Option-Tab and Space, the reviewer reached the initially unchecked field, expanded and collapsed its explanation, opened the pinned privacy document and returned to the same reader link. The disabled Save action was skipped, while **I do not consent** remained reachable without checking the field. A failed refusal left the field unchecked, showed no saved-choice acknowledgement and retained focus on the refusal action. **Check saved permission** was reachable next; refreshing restored the saved-off message and moved focus to the checkbox.

Checking the box enabled Save without recording a choice. Explicit Save then failed as intended: the interface displayed the unconfirmed-choice message, disabled Save and moved focus to the checkbox. Refreshing the saved state retained the checked draft but reported the option as off; unchecking remained available. A checked draft is not a recorded permission.

The same Safari session scanned the initial and grant-error fixtures with the browser audit runner: two scenarios, zero violations, zero fixture errors and zero incomplete rule results. The report identified Safari 27.0 and an outer viewport of 1,707 × 909 CSS pixels. These are selected desktop Safari observations; they do not extend the earlier Chromium frame measurements to Safari or establish every WebKit state.

Screenshots and the observed audit summary remain in ignored local release evidence. Native access stopped when the Mac locked during a subsequent zoom check, so that check has no accepted result. Firefox, physical devices, assistive technology, the remaining zoom/platform matrix, durable recovery, actual delivery and regional legal review remain open.

### 23 October: enlarged Safari permission checks

The resumed Safari 27.0 review used committed source `ce096047f560139931b539f00ab94acd9997eb9e` with the local audit-fixture changes in this update. The actual controller, regional offer, synthetic saved-off response and intentionally failing submit callback retain the earlier isolation boundaries.

Safari's Page Menu confirmed each zoom setting. The selected scans before the focus correction reported:

| Zoom | Mounted state | Frame viewport (CSS px) | Document / usable width (px) | Violations / errors / incomplete |
| --- | --- | --- | --- | --- |
| 200% | Initially unchecked | 803 × 848 | 804 / 804 | 0 / 0 / 0 |
| 200% | Failed explicit refusal, unchecked | 803 × 848 | 804 / 804 | 0 / 0 / 0 |
| 300% | Failed explicit refusal, unchecked | 569 × 848 | 569 / 569 | 0 / 0 / 0 |
| 300% | Failed grant, checked draft | 569 × 848 | 569 / 569 | 0 / 0 / 0 |

The visible layout summary reported no horizontal document overflow in these four scans. The runner uses a fixed-height iframe: its 848-pixel viewport is not the height visible in the enlarged Safari window. These measurements do not establish short-screen acceptance.

A separate direct-widget check at 300% used Option-Tab and Space to open and close the explanation, reach the pinned reader link, skip disabled Save, refuse and refresh the saved state. The failed refusal retained focus and the unchecked draft. Refresh returned the saved-off message and checkbox focus, but initially left that checkbox above the visible area. The native field now explicitly scrolls a restored focus target into view, centered vertically so its outline remains clear of the viewport edges. Rebuilding and repeating the same keyboard path showed the unchecked checkbox and full focus outline visibly centered after refresh. The interim nearest-edge scroll still clipped the outline; that attempt is retained locally and is not the final fix.

Safari offered at most 300% and disabled **Zoom In** there. No 400% result is claimed. The review tab was restored to the confirmed 100% setting and closed, preserving the existing unrelated tab. The focused permission suite passed after the correction; native screenshots and audit observations remain in ignored release evidence. This is selected desktop zoom and recovery evidence, not a complete browser, physical-device, screen-reader or regional compliance acceptance result.
