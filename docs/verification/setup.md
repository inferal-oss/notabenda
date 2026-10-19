# Guided setup verification

Requirement: `REQ-PRODUCT-SETUP`.

Automated coverage uses the shared engine, actual CLI subprocesses, JSDOM and a host-authorized Worker request surface. It checks unknown/no/yes decisions and catalog references; explicit market review; private notes absent from compiled public artifacts; preserved imported settings, content and facts; draft review reset; contradiction reporting; bounded schemas and input; private/non-overwriting CLI output, ignore rules, symlink rejection; detached plans; stale object URL invalidation; safe text/link rendering; asynchronous local import, edit/reset races; retained storage notes and saved report resume; and authorization/method/CSP boundaries. Local browser imports do not call a persistence endpoint.

Commands: `npm run build`, then `node --test packages/notabenda/test/setup.test.mjs packages/notabenda-cf/test/setup.test.mjs`.

Actual mobile/desktop Chromium and local CF runtime checks are recorded here when performed. No full platform/accessibility or regional legal review is implied.

Chromium verification, 18 October 2026: the real local screen rendered on desktop and a 390×844 viewport. Synthetic public facts, EU/EEA and California interests, and an optional-storage answer produced the expected review, separate config/private-report download links and catalog-linked recommendations. At mobile size, client and scroll widths matched (375 CSS px after the scrollbar). A browser check exposed inline download-button wrapping; the fixed layout uses separate full-width mobile actions. Screenshots: [desktop](../assets/screenshots/setup-desktop.jpg), [mobile](../assets/screenshots/setup-mobile.jpg), [exports](../assets/screenshots/setup-review-mobile.jpg), [recommendations](../assets/screenshots/setup-recommendations-mobile.jpg).

A direct browser download/readback attempt stalled in browser automation and was not counted as a verified download. Automated tests verify exported contents, private separation, CLI writes and report resume. The actual interactive CLI was driven through a terminal with fictional site facts, one coverage interest and all ten practice/justification pairs; both resulting JSON files were inspected successfully.

The actual local Workers runtime returned 401 without host authorization, private/no-store setup HTML with authorization, no connection permission in the setup CSP and 405 for POST. No questionnaire-answer storage endpoint was added. The project-wide check passed 187 package tests and 18 host tests, catalog validation, website build and a Worker deployment dry-run. Later presentation changes passed the 44 affected setup/storage/host tests. Nothing was committed, published or remotely deployed.

## Setup composition refinement

The six section controls now have explicit accessible names and visible location markers. Jumping between stages focuses the section and brings its guide into view; preparing recommendations focuses the generated review. Imports are grouped into configuration and saved-answer panels. Review items use a native disclosure above a responsive recommendation grid. Private answers, local-only import, draft status, requirement links and stale-download invalidation are unchanged. Automated navigation coverage also checks assessment state, the visible review target and focus after generation.

Actual Chromium inspection on 18 October 2026: all six stages had equal document/client widths at both 320px and 390px viewport overrides (305px and 375px content widths after scrollbars). Step controls were 46px high; assessment inputs used 16px text. A fictional yes answer and private note survived a round trip through site facts. Preparing the review displayed two download links, a collapsed review-item disclosure and the expected recommendation; focus moved to the review heading. Desktop entry and practices, mobile practices and the generated review were visually inspected. Download file contents remain covered by automated tests; no new manual download readback is claimed.

The full project check passed 276 package tests and 37 site tests, catalog validation, site build and Worker dry run. Final focus refinements passed all 13 affected package/Worker setup tests and rebuilt the site. [Desktop entry](../assets/screenshots/admin-setup-desktop.jpg), [desktop practices](../assets/screenshots/admin-setup-practices-desktop.jpg), [mobile practices](../assets/screenshots/admin-setup-mobile.jpg), [mobile review](../assets/screenshots/admin-setup-review-mobile.jpg).

### Operator clarity and correction

The guided form now identifies invalid public URLs/email/IDs inline, focuses the offending field and supports Enter to continue without prematurely preparing a review. Assessment/justification names include their question. Imported defaults remain visible beside override fields. Review shows actual diagnostic paths, messages and requirement links with additional fixes folded. See [the UX review](ux-review.md) for current browser observations and limits.

### Contract guidance, questionnaire revision 3

Four additional engine/CLI/admin tests cover distance and continuing-contract questions, Germany coverage interest, exact catalog and guide references, advisory host paths, unchanged public configuration, private-note exclusion, revision-1/2/3 report resume with unresolved new answers, regenerated recommendations and contradictory audience/payment declarations. The focused setup/scope suite passed all 30 tests. Selecting coverage or answering yes does not select a regional profile or start a provider.

Chromium inspection on 19 October 2026 confirmed all 15 practice questions in the real isolated demo admin. A yes answer to distance contracts generated the conditional form recommendation and a separate handoff-planning card with live catalog/guide links. Focus moved to the review heading; draft/private downloads remained separate and unknown questions stayed review items. This was a browser interaction check, not a legal applicability determination or downloaded-file readback.
