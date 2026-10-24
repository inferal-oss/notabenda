# Consent control focus and accessible names

Requirements: `REQ-PRODUCT-A11Y`, `REQ-PRODUCT-MOBILE`, `REQ-PRODUCT-CONSENT-EVIDENCE`, `REQ-PRODUCT-REACT`.

The native drawer entries expose their dialog relationship and current expansion state. Purpose checkboxes use their visible purpose name as the accessible name; purpose explanations, service/provider lists and any scope restriction are referenced descriptions. The visible content remains unchanged. React preference buttons provide dialog/expanded defaults; a host rendering a different custom interface can override its ARIA attributes.

Background choice and receipt updates can remove a notice or retry button while it has keyboard focus. The controls remember focus ownership before hiding/disabling anything, then move that focus to the visible status or reopening control. An opened drawer keeps its destination inside the modal. Updates leave focus on another page field or usable choice control alone. Destroying a still-mounted controller exposes an unavailable status rather than leaving focus on its disabled trigger. Status destinations are programmatically focusable without adding a tab stop.

Automated tests run both full and compiled consent factories. They exercise two-controller choice changes, hidden notices, destroyed controls, accessible relationships and actual asynchronous backend receipt/retry transitions on the page and inside the drawer. Delivery acknowledgments do not move focus after the user leaves the controls. The receipt tests use the transactional evidence implementation; jsdom simulates the native modal API and cannot establish actual layout, modal containment or assistive-technology behavior.

The broader [visitor/operator review](ux-review.md) and [consent browser record](consent-browser.md) retain their existing limits. Screen-reader, full WCAG, browser/platform, zoom/large-text and physical-device acceptance remain open.

Chromium verification on 19 October 2026 used the real local Worker behind a temporary loopback-only failure/delay proxy. A failed grant kept both optional services blocked with zero initiated optional requests. Clicking retry moved focus from the disappearing button to its status, both outside the drawer and inside the native modal. With the proxy reconnected and the response delayed, focus stayed on the visible “Saving your choice” status. The native accessibility tree named the checkboxes Measurement and Suggestions, with their explanatory content separately referenced. Closing the drawer restored Review your choices. The proxy is test-only and is stopped after verification; it is absent from shipped routes and packages.

[Native drawer after a failed retry](../assets/screenshots/consent-focus-retry.jpg). The complete project check passed 442 package tests and 60 site tests (502 total), catalog validation, site build and Worker dry run.
