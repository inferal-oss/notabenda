# Initial terms-agreement browser verification

18 October 2026. Manual Chromium checks of the fictional local example; not a cross-browser suite, accessibility audit or legal review.

Requirements exercised: `REQ-PRODUCT-TERMS-ACCEPTANCE`, `REQ-PRODUCT-MOBILE`, and `REQ-PRODUCT-A11Y`. The product interaction is implemented; broader mobile/accessibility requirements remain partial. Transaction, receipt, failure, scope and idempotency tests live in `packages/notabenda/test/terms.test.mjs`.

## Observed

The default visuals have since been refreshed. The same acknowledged agreement path was rechecked; current screenshots show the refreshed theme. See [website and design verification](website-browser.md) for shared layout changes and remaining accessibility checks.

- On `/agreement`, the native checkbox starts unchecked, the action is disabled, active focus remains on `BODY`, and no dialog is open. The statement, document version, effective date and draft warning are visible. The entire agreement stays inline in normal page flow.
- At 390×844, the document client width and scroll width are both 375 CSS pixels. At 320×700 in the alternate theme they are both 305; the action remains within the card. At 430×900 the alternate theme remains readable and the native label/control wrap without horizontal overflow.
- Checking explicitly enables the action. Submission shows a matching recorded-version status after the local backend acknowledges the event. On the alternate theme, Space checks the native checkbox, Tab reaches the action, and Enter submits; the recorded-version status appears.
- The version link targets `/artifacts/ARTIFACT_ID/terms.html`. Following its contents navigation keeps that artifact path and adds the section fragment, rather than navigating to the mutable terms route.
- Agreement search finds the synthetic record with both operation and document-version words. Its detail view shows exact statement/action wording, scope/operation, document digests, server time and provenance. At 390×844 the detail view has no horizontal page overflow. At 1280×1000 it presents a readable context card with supporting evidence below.
- Returning to the cookie-controls example after the agreement keeps both synthetic optional services off and its initiated-request count at zero. No cookie-grant action is part of the agreement flow. This is a visible sample check, not network/storage capture of arbitrary host scripts.

Screenshots: [unchecked mobile default](../assets/screenshots/terms-mobile.jpg), [acknowledged alternate theme](../assets/screenshots/terms-dark-mobile.jpg), [agreement evidence](../assets/screenshots/terms-evidence-desktop.jpg).

## Reproduce and limits

Run `npm run dev`; visit `/agreement` or `/dark/agreement`, explicitly check and submit, then follow the record-inspection link. The backend uses in-memory synthetic records and explicit preview opt-in. Restarting it clears evidence; this is not a deployed or durable production endpoint.

Still required: WebKit/Firefox and physical mobile devices, screen-reader/live-region review, complete keyboard focus handling after disabled/completed controls, 200–400% zoom/large text, translations/RTL/forced-colors/contrast, interrupted navigation/BFCache and transport errors in the browser, host authentication/CSRF/rate limiting, and production pinned-version retention/hosting. Automated tests cover lost acknowledgments, stale offers, server failures and destroy/late-ack behavior separately.
