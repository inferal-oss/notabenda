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

Run `npm run dev`; visit `/agreement` or `/dark/agreement`, explicitly check and submit, then follow the record-inspection link. The current website host uses a browser-session demo Durable Object with seeded records and one-day idle cleanup. It requires explicit preview opt-in. Run `npm run site:dev` to exercise that host; the lightweight `npm run dev` preview is a separate local adapter. These checks do not establish production contract validity or the adopter’s operational safeguards.

Still required: WebKit/Firefox and physical mobile devices, screen-reader/live-region review, complete keyboard focus handling after disabled/completed controls, 200–400% zoom/large text, translations/RTL/forced-colors/contrast, interrupted navigation/BFCache and transport errors in the browser, host authentication/CSRF/rate limiting, and production pinned-version retention/hosting. Automated tests cover lost acknowledgments, stale offers, server failures and destroy/late-ack behavior separately.

## 19 October: document, acceptance and operator layouts

Requirements: **REQ-PRODUCT-DOCUMENTS**, **REQ-PRODUCT-TERMS-ACCEPTANCE**, **REQ-PRODUCT-CF-ADMIN**, **REQ-PRODUCT-MOBILE**, **REQ-PRODUCT-A11Y**.

The refreshed reader uses a separate contents rail in a sufficiently wide full-page container. Narrow/embedded documents keep contents above the text. The MD/MDX body is included in the reading column. This is CSS presentation; the legal renderer and pinned HTML bytes are unchanged.

The acceptance component groups a document link, visible version/effective date and new-tab description above the native unchecked statement. The exact supplied statement and action label are retained. Chrome at 390 × 844 showed a 44.9px action, matching document/client widths of 375px, an initially disabled action and no preselection. A sample submission showed the recorded-version status only after a host receipt. Light and midnight layouts were inspected. At 320 × 740, the midnight terms reader retained 16px body text and matched 305px client/scroll widths.

The operator list removes repeated subject/site facts from each row while keeping person/operation, document version, received time and a statement preview. Detail puts the full statement and action wording beside document facts; hashes, IDs, optional retained facts and complete stored JSON remain available. The narrow list uses 44px record links and keeps 305px page width. Mobile search now gives the input its own full-width row.

Automated DOM/controller coverage checks the pinned document, accessible new-tab description, exact wording, native check, pending disabled controls and matching-receipt status. Operator projection tests cover exact multiline and hostile wording, absent fields, retained references and no executable stored URL. Existing authorization, storage, idempotency and receipt tests remain in place. Physical devices, other engines, assistive technology, forced colours and large-text acceptance remain separate work.

Current desktop previews: [document reader](../assets/screenshots/legal-reader-desktop.jpg), [acceptance flow](../assets/screenshots/agreement-redesign-desktop.jpg), [agreement list](../assets/screenshots/admin-agreements-desktop.jpg) and [agreement detail](../assets/screenshots/admin-agreement-detail-desktop.jpg). The viewport override was reset after inspection.
