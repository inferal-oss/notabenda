# React integration verification

18 October 2026. Linked to `REQ-PRODUCT-REACT`, `REQ-PRODUCT-CONSENT-RUNTIME`, `REQ-PRODUCT-CONSENT-EVIDENCE` and `REQ-PRODUCT-MOBILE`.

- Automated DOM tests use React 19.3.1 and jsdom for subscription/cleanup logic. They cover cached immutable snapshots, fully unsubscribed stores recovering current state, controller replacement/destruction, one controls mount after StrictMode setup/cleanup, and preserved host controller/preference state. Native dialog functions are simulated there; this is not a layout or native-dialog audit.
- Server rendering always produces unknown choices, false effective permissions and blocked services. Hydration tests recover saved grants without mismatched markup. A separate regression starts optional work before hydration and verifies the example's request counter still matches the server's initial zero.
- Required-receipt tests retain a saved grant while effective permission stays false during pending delivery. Acknowledgment permits the registered lifecycle; changing shared storage blocks the UI projection without effectful render-time refresh, and host refresh stops the lifecycle. Rendering never calls the effectful `isAllowed` method.
- Packed tests import the optional React subpaths and compile strict consumer declarations. The separate default-package test verifies React is absent when only the core and CF tarballs are installed.
- Site checks inspect conservative light/dark SSR output, static legal pages without scripts, self-hosted React assets and route-specific script/connect policy. The homepage and vanilla examples do not load the React example bundle.
- Real Chromium inspection at 390×844 began with both optional services blocked and zero initiated optional requests. The initial notice stayed compact and nonmodal. Opening preferences focused its heading; saving only Measurement started one fictional local request and left Suggestions blocked. Reload restored that granular choice with one request in the new page instance and no observed page error logs. Rejecting through the reopened drawer returned both services to blocked and restored focus to the invoking Review button.
- At that viewport, document client and scroll widths both measured 375 CSS pixels. The example uses the same native controls/CSS as vanilla. A broader keyboard/screen-reader, zoom, RTL and browser/platform review remains incomplete.
- Switching to the midnight theme preserved refusal, with both services blocked and zero new optional requests. At 320×700, the opened drawer remained contained with document client/scroll widths both 305 CSS pixels; Escape closed it and restored focus to the Review button. Temporary viewport overrides were reset.

Screenshots: [mobile initial notice](../assets/screenshots/react-mobile-notice.jpg), [deliberately opened drawer](../assets/screenshots/react-mobile-drawer.jpg), [narrow midnight drawer](../assets/screenshots/react-dark-mobile.jpg).

The adapter is not a tracking firewall. Actual optional execution must use registered service lifecycles; React render conditions alone do not govern eager imports, resource hints, server processing or unrelated scripts. React 18, other React framework routing/server-component integrations and other platforms remain outside this verified preview. Astro has a [separate integration and verification record](astro-browser.md).

## Ordinary form permissions

The separate provider/hooks/native-field integration now has a real light/midnight example and focused SSR/hydration, lifecycle, recovery and packed-type checks. Actual Chromium confirmed primary-form independence, acknowledged grant, reload, mobile withdrawal and shared state across themes. See [the form permission verification record](form-permissions.md#react-field-verification) for observations, screenshots and limits.

## Compiled consent entry

19 October 2026. Both compatibility and compiled factories run the same React consent tests, including conservative SSR/hydration, cached snapshots, signal/processing restrictions, guarded purposes, pending receipts, controller replacement, idle resubscription and StrictMode cleanup. Separate tests enforce matching contexts across entries, one controls owner even across entry points, recovery after unmount, deep prompt-decision immutability, SSR-safe import and an actual browser graph without full site validation or document/form renderers. Packed consumer checks preserve the complete compatibility getter and reject invented fields on the compiled getter.

Light and midnight cookie examples compile their runtime descriptor at build time. Their React view receives only that inventory plus explicit legal-link metadata. The three legal pages remain ordinary script-free output. These changes reuse the existing controls and styles; they do not expand the previous browser/platform acceptance claim.

A fresh Chromium tab verified the compiled example with saved refusals: zero optional requests and both services blocked. Allowing only Measurement started one request and left Suggestions blocked. Reload restored that granular choice with one request in the new page instance; rejecting through the reopened drawer stopped Measurement and returned focus to Review your choices. The observed warnings came from an installed browser extension. No application hydration error was observed. [Compiled-entry drawer](../assets/screenshots/react-compiled-drawer.png).
