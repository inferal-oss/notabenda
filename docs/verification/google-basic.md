# Google Basic verification

Requirements: `REQ-GOOGLE-MODE`, `REQ-PRODUCT-CONFIG`, `REQ-PRODUCT-CONSENT-RUNTIME`, `REQ-PRODUCT-PRIVACY-SIGNALS`.

The initial mechanism is covered by `packages/notabenda/test/google-basic.test.mjs`. It validates exact public mappings, material-scope changes, product collection gates, all four explicit defaults/updates, initial unknown/refusal silence, no event buffering, explicit routing, disabled automatic page views, independent receipt/GPC restrictions, synchronous abort, late/error/timeout handling, terminal regrant behavior and reentrant state changes. Getter/routing/identity overrides and non-enumerable field-count bypasses are rejected.

A JSDOM ResourceLoader intercepts the actual default DOM loader's requested Google URL and supplies a local stub. It records attempted requests, including while a load is pending. Before grant and after initial rejection the attempt list remains empty. Upon a grant it sees one exact standard tag URL, with denied defaults before the update/configuration. Withdrawal disables the GA4 target before the local denied update; repeated abort cleanup preserves that update. Observers changing GPC before insertion or completion cannot leave the adapter active.

This is adapter/interception evidence, not an actual Google-library, account, Tag Assistant or full real-browser network test. The public light/midnight example uses an explicitly local execution port and never loads a Google account. Post-load vendor traffic cannot be declared absent from these tests. Advanced mode, GTM templates, identity upload, connected-account behavior and Google CMP/TCF certification are not supplied.

`packages/notabenda/test/package.test.mjs` verifies the optional exported module and strict consumer types without bringing frameworks into default installs. The existing browser graph test and full site build cover deployment dependencies. Wider browser/platform and live vendor acceptance remain open.

## Local Chromium walkthrough

The light example started with four denied signals, one default command and zero simulated starts. Rejecting the initial prompt kept it blocked. Selecting Measurement and saving started the local port once; analytics storage became granted while all advertising signals remained denied. A page view appeared only after the explicit example action. Rejecting optional work then showed four denied signals, a disabled event action and a visible reload action. This walkthrough used the simulator, not Google's library.

The example distinguishes blocked, starting, active, stopped and closed states. Its counter says “Simulated page views”; no event-buffer claim is implied. `site/test/google-basic.test.mjs` executes the actual bootstrap with the real controller/adapter, checks the published routes and verifies that an event button losing availability moves keyboard focus to the visible reload action. Background updates do not move focus from elsewhere.

At a 320 CSS-pixel viewport the document had no horizontal overflow, action targets were at least 44 CSS pixels high, and the drawer retained reachable reject/save controls. Escape closed it and restored its opener. Both light and midnight desktop layouts were inspected. These are initial Chromium observations; they do not establish physical-device or screen-reader acceptance.

[Light desktop](../assets/screenshots/google-basic-desktop.jpg), [midnight desktop](../assets/screenshots/google-basic-midnight.jpg), [mobile choices](../assets/screenshots/google-basic-mobile.jpg).
