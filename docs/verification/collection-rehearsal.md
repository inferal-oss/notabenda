<!-- @requirements REQ-PRODUCT-COLLECTION-REHEARSAL -->
# Local collection-form rehearsal

The package tests exercise the real form-permission controller and controls against a deliberately small temporary recorder. They cover explicit state reads, unchecked initial choices, independent ordinary submission, read failure, failure before recording, lost-response deduplication, restrictive refusal/withdrawal and two independent streams. The recorder replays the original receipt with current state; it does not roll back a later negative choice.

Lifecycle checks cover reset, close, queued close, destruction, interrupted hashing and workbench edits/import start. Context and settings remain unchanged, including their review declarations. Invalid settings/scope facts fail before changing the host DOM. Notice-only and localized/RTL content use the same validation. Network and storage entry points are instrumented; no browser storage or transport is accessed. Links are inactive and provisional content is not exported as a final release.

```sh
node --test packages/notabenda/test/collection-rehearsal.test.mjs packages/notabenda/test/collection-workbench.test.mjs
node --test site/test/collection-rehearsal.test.mjs
```

The installed tarball test imports the public rehearsal entry and compiles its TypeScript contract. The site test checks the delivered workbench and runs bounded JSDOM/axe semantic checks on the open rehearsal. JSDOM does not establish native focus, layout, contrast, mobile, screen-reader or real-backend acceptance. Browser observations, when recorded below, apply only to their stated flow and environment.

This simulation supplies no evidence of actual form placement, host identity/contact binding, real recording, provider delivery, persistence after reload or legal review. The source release supplies facts and wording, not a verified live integration.

## Browser observations · 22 October 2026

Chromium exercised the built workbench, release confirmation, explicit saved-state check, lost-response grant, ordinary submission while pending and deliberate retry. The observer showed two attempts and one event after retry. At emulated 390×844 and 320×568 viewports, the bottom drawer had no horizontal overflow and its close control remained visible after scrolling. Refusal kept permission off while ordinary submission still worked; closing restored focus to Try form flow. These are emulator observations, not physical mobile acceptance.

Native desktop Safari opened the same workbench, started unchecked with zero reads, explicitly loaded state, granted, simulated ordinary submission and withdrew. The observer showed one grant and one withdrawal. Escape dismissed the dialog and restored focus to Try form flow. Safari version and CSS viewport were not independently established. No screen-reader, real transport/provider or full platform acceptance is claimed.

The complete package and site suites passed, alongside catalog checks, Worker dry run and offline package-content inspection. All eighteen measured visitor profiles and all 420 retained artifact files were unchanged. These results establish only the stated software/simulation boundaries.
