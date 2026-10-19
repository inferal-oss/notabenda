# Gated media verification

18 October 2026. Linked to `REQ-PRODUCT-EMBEDS`, `REQ-EU-DEVICE`, `REQ-PRODUCT-CONSENT-RUNTIME`, `REQ-PRODUCT-CONSENT-EVIDENCE` and `REQ-PRODUCT-MOBILE`.

Final verification passed `npm run check`: 129 package tests, 14 site tests, catalog validation, the website build and a Worker dry run. A separate scan found no local host credential or Basic authorization encoding in public assets. Nothing was committed, published or remotely deployed.

## Automated boundaries

The media tests use jsdom, an intercepted iframe ResourceLoader, the actual core controller and a synthetic backend store implementing the real evidence ledger. They cover:

- Inert escaped server copy, no iframe/image/source/resource hint, and hidden disabled fallback actions.
- Public origin declarations, rejected origin patterns/capabilities and grant invalidation after origins change.
- Several resources sharing one lifecycle, all-purpose gating and a preferences action that creates no choice.
- Synchronous resource removal on abort, expiry and controller destruction; disposing one surface retains other mounts.
- Detached mounts, connection changes, late mounting after local storage changes without a notification, copied options and late resource errors from retired generations.
- Image failure as an explanatory fallback with no automatic retry.
- Actual required-receipt pending delivery and acknowledgment. A confirmed grant creates one frame request with one initial head read; another mount does not restart verification. Changed shared storage removes all resources and triggers one further verification read. This guards against activation restarting the evidence gate indefinitely.

The packed-consumer test imports the new functions from the installed tarball and compiles image/iframe declarations, including a missing-alternative type error. Site tests verify inert SSR, self-hosted module resolution and narrowly scoped frame policies: only the demonstration page may load same-origin frames, and only its script-free sample frame permits same-origin ancestors. Other public pages retain their ancestor restriction.

## Real Chromium inspection

The actual locally served Worker example started with zero iframe/image nodes and zero media resource entries reported by the page's PerformanceObserver. Rejecting optional media preserved that state. Opening preferences from a placeholder also left the resource count at zero.

Saving the Embedded media purpose loaded exactly two first-party samples, a sandboxed frame and a landscape SVG. The request counter reported two observed resource entries. The frame exposed its script-free article; the image exposed the supplied alternative. No page errors were observed.

At 390×844, document client and scroll widths both measured 375 CSS pixels. Both media elements measured 309 pixels wide within their cards. Withdrawal through the image card's Review button removed both media nodes, restored both explanatory placeholders and returned focus to that button. The counter stayed at two, distinguishing historical requests from current loaded state. Reload recovered refusal with zero media nodes and zero requests in the new page instance.

At 320×568 after refusal/reload, client and scroll widths both measured 305 CSS pixels, with zero media nodes and zero observed media requests. Browser viewport overrides were reset.

Screenshots: [allowed illustration on mobile](../assets/screenshots/embeds-mobile-allowed.jpg), [both placeholders after withdrawal](../assets/screenshots/embeds-mobile-withdrawn.jpg).

## Limits

This is an initial Chromium check and deterministic lifecycle test, not a complete network, assistive-technology or browser-platform audit. jsdom does not establish real image loading behavior. The visible counter reports completed browser resource entries, including cache hits; it is not evidence of remote vendor compliance or comprehensive HTTP activity.

Initial origin matching cannot constrain redirects, frame navigation or nested requests. Resource removal cannot recall already transmitted data, erase remote storage, or promise cancellation before browser suspension ends. CSP, vendor cleanup, legal applicability and keeping a working preferences surface are host responsibilities. Other device-access and regional requirements remain partial in the catalog.
